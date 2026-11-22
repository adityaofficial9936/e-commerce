import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OrderStatus,
  ReturnStatus,
  ReturnItemCondition,
  RefundStatus,
  StockMovementReason,
  CreateReturnRequestDto,
  InspectReturnDto,
} from '@ecommerce/contracts';
import { PrismaService } from '../../core/prisma/prisma.service.js';

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);
  private readonly returnWindowDays = 7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Customer initiates return request for a delivered order within 7 days
   */
  async createReturnRequest(userId: string, dto: CreateReturnRequestDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: true,
        shipment: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order '${dto.orderId}' not found`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to return this order');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        `Cannot return order in '${order.status}' status. Returns are only eligible for DELIVERED orders.`
      );
    }

    // Verify 7-day return window from delivered date or order updated date
    const deliveryDate = order.shipment?.deliveredAt || order.updatedAt;
    const returnDeadline = new Date(deliveryDate.getTime() + this.returnWindowDays * 24 * 60 * 60 * 1000);

    if (new Date() > returnDeadline) {
      throw new BadRequestException(
        `The 7-day return policy window for this order expired on ${returnDeadline.toISOString().split('T')[0]}`
      );
    }

    // Validate that returned items exist in the order and requested quantities are valid
    const orderItemMap = new Map(order.items.map((i) => [i.id, i]));

    for (const item of dto.items) {
      const orderItem = orderItemMap.get(item.orderItemId);
      if (!orderItem) {
        throw new BadRequestException(`Order item '${item.orderItemId}' does not belong to order ${order.orderNumber}`);
      }
      if (item.quantity > orderItem.quantity) {
        throw new BadRequestException(
          `Requested return quantity (${item.quantity}) exceeds purchased quantity (${orderItem.quantity}) for ${orderItem.productName}`
        );
      }
    }

    const returnRequest = await this.prisma.$transaction(async (tx) => {
      const created = await tx.returnRequest.create({
        data: {
          orderId: order.id,
          reason: dto.reason,
          images: dto.images || [],
          status: ReturnStatus.REQUESTED,
          items: {
            create: dto.items.map((item) => ({
              orderItemId: item.orderItemId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: { include: { orderItem: true } },
          order: true,
        },
      });

      // Update order status to indicate active return request
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.RETURN_REQUESTED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.DELIVERED,
          toStatus: OrderStatus.RETURN_REQUESTED,
          notes: `Customer requested return. Reason: ${dto.reason}`,
          changedBy: userId,
        },
      });

      return created;
    });

    this.logger.log(`Created return request ${returnRequest.id} for order ${order.orderNumber}`);

    this.eventEmitter.emit('return.requested', {
      returnRequestId: returnRequest.id,
      orderId: order.id,
      userId,
    });

    return returnRequest;
  }

  /**
   * Customer lists their return requests
   */
  async getUserReturns(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { order: { userId } };

    const [items, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, orderNumber: true, totalMinor: true, createdAt: true } },
          items: { include: { orderItem: true } },
          refunds: true,
        },
      }),
      this.prisma.returnRequest.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  /**
   * Customer views single return request
   */
  async getUserReturnById(id: string, userId: string) {
    const returnRequest = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: true,
        items: { include: { orderItem: true } },
        refunds: true,
      },
    });

    if (!returnRequest) {
      throw new NotFoundException(`Return request '${id}' not found`);
    }

    if (returnRequest.order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this return request');
    }

    return returnRequest;
  }

  // ----------------------------------------------------
  // ADMIN RETURNS MANAGEMENT
  // ----------------------------------------------------

  async adminGetReturns(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
          items: { include: { orderItem: true } },
          refunds: true,
        },
      }),
      this.prisma.returnRequest.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  async adminGetReturnById(id: string) {
    const returnRequest = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            address: true,
          },
        },
        items: { include: { orderItem: true } },
        refunds: true,
      },
    });

    if (!returnRequest) {
      throw new NotFoundException(`Return request '${id}' not found`);
    }

    return returnRequest;
  }

  async adminApproveReturn(id: string, staffId: string) {
    const returnRequest = await this.adminGetReturnById(id);

    if (returnRequest.status !== ReturnStatus.REQUESTED) {
      throw new BadRequestException(
        `Cannot approve return in '${returnRequest.status}' status. Only REQUESTED returns can be approved.`
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.returnRequest.update({
        where: { id },
        data: { status: ReturnStatus.APPROVED },
      });

      await tx.order.update({
        where: { id: returnRequest.orderId },
        data: { status: OrderStatus.RETURN_APPROVED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: returnRequest.orderId,
          fromStatus: OrderStatus.RETURN_REQUESTED,
          toStatus: OrderStatus.RETURN_APPROVED,
          notes: 'Return pickup authorized by customer support staff',
          changedBy: staffId,
        },
      });
    });

    this.logger.log(`Return request ${id} approved by staff ${staffId}`);
    this.eventEmitter.emit('return.approved', { returnRequestId: id });

    return this.adminGetReturnById(id);
  }

  /**
   * Warehouse quality inspection:
   * Assesses condition (RESALEABLE, DAMAGED), optionally restocks inventory,
   * advances return to INSPECTED and auto-generates a pending refund.
   */
  async adminInspectReturn(id: string, dto: InspectReturnDto, staffId: string) {
    const returnRequest = await this.adminGetReturnById(id);

    const allowableStatuses = [ReturnStatus.REQUESTED, ReturnStatus.APPROVED, ReturnStatus.RECEIVED];
    if (!allowableStatuses.includes(returnRequest.status as ReturnStatus)) {
      throw new BadRequestException(
        `Cannot inspect return in '${returnRequest.status}' status.`
      );
    }

    let refundableAmountMinor = 0;

    await this.prisma.$transaction(async (tx) => {
      // 1. Update condition on return items and calculate refundable total
      for (const itemInput of dto.items) {
        const item = returnRequest.items.find((i) => i.id === itemInput.returnItemId);
        if (!item) {
          throw new BadRequestException(`Return item '${itemInput.returnItemId}' not found in this return`);
        }

        await tx.returnItem.update({
          where: { id: item.id },
          data: { condition: itemInput.condition },
        });

        // Add to refundable amount if resaleable or accepted damaged
        refundableAmountMinor += item.orderItem.unitPriceMinor * item.quantity;

        // 2. Restock physically if RESALEABLE and restock approved
        if (dto.approveRestock && itemInput.condition === ReturnItemCondition.RESALEABLE) {
          await tx.inventoryItem.update({
            where: { variantId: item.orderItem.variantId },
            data: { quantity: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.orderItem.variantId,
              delta: item.quantity,
              reason: StockMovementReason.RETURN_RESTOCK,
              reference: `RETURN_${id}_ITEM_${item.id}`,
            },
          });
        }
      }

      // 3. Advance return request status to INSPECTED
      await tx.returnRequest.update({
        where: { id },
        data: { status: ReturnStatus.INSPECTED },
      });

      // 4. Auto-generate pending refund if not already generated
      const existingRefund = returnRequest.refunds.length > 0;
      if (!existingRefund && refundableAmountMinor > 0) {
        await tx.refund.create({
          data: {
            orderId: returnRequest.orderId,
            returnRequestId: returnRequest.id,
            amountMinor: refundableAmountMinor,
            reason: dto.notes || `Refund for inspected return ${id}`,
            status: RefundStatus.PENDING,
          },
        });
      }
    });

    this.logger.log(
      `Return ${id} inspected by staff ${staffId}. Total refundable: INR ${(refundableAmountMinor / 100).toFixed(2)}`
    );

    this.eventEmitter.emit('return.inspected', {
      returnRequestId: id,
      refundableAmountMinor,
    });

    return this.adminGetReturnById(id);
  }
}
