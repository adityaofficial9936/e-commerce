import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, CancelOrderDto, ShipOrderDto } from '@ecommerce/contracts';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * List orders for the authenticated customer
   */
  async getUserOrders(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { userId };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          address: true,
          shipment: true,
          payments: { select: { id: true, status: true, provider: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total },
    };
  }

  /**
   * Get complete order details with ownership verification
   */
  async getOrderById(orderId: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        address: true,
        shipment: true,
        invoice: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        refunds: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    // Enforce ownership if called by customer
    if (userId && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    return order;
  }

  /**
   * Cancel an order before shipment and release/restock inventory
   */
  async cancelOrder(orderId: string, userId: string, dto: CancelOrderDto) {
    const order = await this.getOrderById(orderId, userId);

    const nonCancellableStatuses = [
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.RETURNED,
    ];

    if (nonCancellableStatuses.includes(order.status as OrderStatus)) {
      throw new BadRequestException(
        `Order cannot be cancelled in '${order.status}' status. Use the return workflow once delivered.`
      );
    }

    const previousStatus = order.status;

    await this.prisma.$transaction(async (tx) => {
      // 1. Release or restock inventory
      if (previousStatus === OrderStatus.PENDING_PAYMENT) {
        // Stock was only reserved, release reservation
        await this.inventoryService.releaseReservation(tx, order.id);
      } else {
        // Order was CONFIRMED or PACKED; stock was physically deducted, so restore physical quantity
        for (const item of order.items) {
          await tx.inventoryItem.update({
            where: { variantId: item.variantId },
            data: { quantity: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              delta: item.quantity,
              reason: 'RESERVATION_RELEASE',
              reference: `ORDER_CANCELLED_RESTOCK_${order.id}`,
            },
          });
        }
      }

      // 2. Update order status to CANCELLED
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });

      // 3. Record status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: previousStatus,
          toStatus: OrderStatus.CANCELLED,
          notes: `Customer cancelled order. Reason: ${dto.reason}`,
          changedBy: userId,
        },
      });
    });

    this.logger.log(`Order ${order.orderNumber} cancelled by user ${userId}`);

    this.eventEmitter.emit('order.cancelled', {
      orderId: order.id,
      userId,
      reason: dto.reason,
    });

    return this.getOrderById(order.id, userId);
  }

  // ----------------------------------------------------
  // ADMIN ORDER MANAGEMENT
  // ----------------------------------------------------

  async adminGetOrders(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: true,
          address: true,
          shipment: true,
          payments: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total },
    };
  }

  async adminUpdateOrderStatus(
    orderId: string,
    toStatus: OrderStatus,
    notes?: string,
    staffId?: string
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    const fromStatus = order.status;

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: toStatus },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus,
          toStatus,
          notes: notes || `Status updated to ${toStatus} by staff`,
          changedBy: staffId,
        },
      });
    });

    this.logger.log(`Order ${order.orderNumber} status changed from ${fromStatus} to ${toStatus}`);

    this.eventEmitter.emit('order.status_changed', {
      orderId,
      fromStatus,
      toStatus,
    });

    return this.getOrderById(orderId);
  }

  /**
   * Warehouse pack transition: CONFIRMED -> PACKED
   */
  async packOrder(orderId: string, staffId?: string, notes?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException(
        `Cannot pack order in '${order.status}' status. Only CONFIRMED orders can be PACKED.`
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PACKED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: OrderStatus.CONFIRMED,
          toStatus: OrderStatus.PACKED,
          notes: notes || 'Warehouse items verified and securely packed',
          changedBy: staffId,
        },
      });
    });

    this.logger.log(`Order ${order.orderNumber} transitioned to PACKED by staff ${staffId}`);

    this.eventEmitter.emit('order.packed', { orderId, orderNumber: order.orderNumber });

    return this.getOrderById(orderId);
  }

  /**
   * Courier dispatch transition: PACKED (or CONFIRMED) -> SHIPPED
   */
  async shipOrder(orderId: string, dto: ShipOrderDto, staffId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    const allowableStatuses = [OrderStatus.CONFIRMED, OrderStatus.PACKED];
    if (!allowableStatuses.includes(order.status as OrderStatus)) {
      throw new BadRequestException(
        `Cannot ship order in '${order.status}' status. Order must be CONFIRMED or PACKED.`
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Create or update shipment tracking details
      await tx.shipment.upsert({
        where: { orderId },
        create: {
          orderId,
          courierName: dto.courierName,
          trackingNumber: dto.trackingNumber,
          trackingUrl: dto.trackingUrl,
          shippedAt: new Date(),
        },
        update: {
          courierName: dto.courierName,
          trackingNumber: dto.trackingNumber,
          trackingUrl: dto.trackingUrl,
          shippedAt: new Date(),
        },
      });

      // 2. Advance status to SHIPPED
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.SHIPPED },
      });

      // 3. Status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: OrderStatus.SHIPPED,
          notes: `Dispatched via ${dto.courierName} (AWB: ${dto.trackingNumber})`,
          changedBy: staffId,
        },
      });
    });

    this.logger.log(
      `Order ${order.orderNumber} dispatched via ${dto.courierName} (${dto.trackingNumber})`
    );

    this.eventEmitter.emit('order.shipped', {
      orderId,
      orderNumber: order.orderNumber,
      courierName: dto.courierName,
      trackingNumber: dto.trackingNumber,
      trackingUrl: dto.trackingUrl,
    });

    return this.getOrderById(orderId);
  }

  /**
   * Delivery confirmation: SHIPPED -> DELIVERED
   */
  async deliverOrder(orderId: string, staffId?: string, notes?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException(
        `Cannot deliver order in '${order.status}' status. Only SHIPPED orders can be marked DELIVERED.`
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Update shipment delivered timestamp
      if (order.shipment) {
        await tx.shipment.update({
          where: { orderId },
          data: { deliveredAt: new Date() },
        });
      }

      // 2. Advance status to DELIVERED
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.DELIVERED },
      });

      // 3. Record status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: OrderStatus.SHIPPED,
          toStatus: OrderStatus.DELIVERED,
          notes: notes || 'Package delivered successfully to customer',
          changedBy: staffId,
        },
      });
    });

    this.logger.log(`Order ${order.orderNumber} marked DELIVERED`);

    this.eventEmitter.emit('order.delivered', {
      orderId,
      orderNumber: order.orderNumber,
    });

    return this.getOrderById(orderId);
  }

  /**
   * Tracking endpoint for customer & staff
   */
  async getOrderTracking(orderId: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shipment: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    if (userId && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view tracking for this order');
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      shipment: order.shipment,
      timeline: order.statusHistory,
    };
  }
}
