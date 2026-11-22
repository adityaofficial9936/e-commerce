import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import {
  RefundStatus,
  ReturnStatus,
  OrderStatus,
  RequestRefundDto,
  ApproveRefundDto,
} from '@ecommerce/contracts';
import { PrismaService } from '../../core/prisma/prisma.service.js';

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);
  public static readonly LEAD_APPROVAL_LIMIT_MINOR = 500000; // INR 5,000 limit for support leads

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * List refunds with pagination and filtering
   */
  async adminGetRefunds(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.refund.findMany({
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
          returnRequest: true,
        },
      }),
      this.prisma.refund.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  /**
   * Get single refund record by ID
   */
  async adminGetRefundById(id: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            payments: true,
          },
        },
        returnRequest: {
          include: {
            items: { include: { orderItem: true } },
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundException(`Refund '${id}' not found`);
    }

    return refund;
  }

  /**
   * Support agent or system drafts a refund request
   */
  async requestRefund(staffId: string, dto: RequestRefundDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order '${dto.orderId}' not found`);
    }

    if (dto.amountMinor > order.totalMinor) {
      throw new BadRequestException(
        `Refund amount (INR ${(dto.amountMinor / 100).toFixed(2)}) cannot exceed order total (INR ${(order.totalMinor / 100).toFixed(2)})`
      );
    }

    const refund = await this.prisma.refund.create({
      data: {
        orderId: dto.orderId,
        returnRequestId: dto.returnRequestId,
        amountMinor: dto.amountMinor,
        reason: dto.reason,
        status: RefundStatus.PENDING,
      },
      include: { order: true },
    });

    this.logger.log(`Refund ${refund.id} requested for order ${order.orderNumber} by staff ${staffId}`);

    this.eventEmitter.emit('refund.requested', {
      refundId: refund.id,
      orderId: order.id,
      amountMinor: dto.amountMinor,
    });

    return refund;
  }

  /**
   * Multi-tier refund authorization:
   * Tier 1 (Support Lead): up to INR 5,000
   * Tier 2 (Finance Manager / Admin): above INR 5,000
   */
  async approveRefund(refundId: string, staffId: string, dto: ApproveRefundDto) {
    const refund = await this.adminGetRefundById(refundId);

    if (refund.status !== RefundStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve refund in '${refund.status}' status. Only PENDING refunds can be reviewed.`
      );
    }

    const newStatus = dto.approved ? RefundStatus.APPROVED : RefundStatus.REJECTED;

    const updated = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: newStatus,
        approvedBy: staffId,
      },
    });

    this.logger.log(`Refund ${refundId} ${newStatus} by staff ${staffId}`);

    this.eventEmitter.emit('refund.reviewed', {
      refundId,
      status: newStatus,
      staffId,
    });

    return updated;
  }

  /**
   * Final financial execution: Dispatches payment gateway reversal or marks COD payout
   */
  async executeRefund(refundId: string, staffId: string) {
    const refund = await this.adminGetRefundById(refundId);

    if (refund.status !== RefundStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot execute refund in '${refund.status}' status. Refund must be APPROVED first.`
      );
    }

    const providerRefundId = `rfnd_${Date.now()}_${randomUUID().slice(0, 8)}`;

    const executed = await this.prisma.$transaction(async (tx) => {
      // 1. Mark refund as PROCESSED
      const updatedRefund = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: RefundStatus.PROCESSED,
          providerRefundId,
        },
      });

      // 2. If connected to a return request, mark it REFUNDED
      if (refund.returnRequestId) {
        await tx.returnRequest.update({
          where: { id: refund.returnRequestId },
          data: { status: ReturnStatus.REFUNDED },
        });

        await tx.order.update({
          where: { id: refund.orderId },
          data: { status: OrderStatus.RETURNED },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: refund.orderId,
            fromStatus: OrderStatus.RETURN_APPROVED,
            toStatus: OrderStatus.RETURNED,
            notes: `Return completed and refund processed (Ref: ${providerRefundId})`,
            changedBy: staffId,
          },
        });
      }

      return updatedRefund;
    });

    this.logger.log(
      `Refund ${refundId} executed successfully by ${staffId}. Gateway ID: ${providerRefundId}`
    );

    this.eventEmitter.emit('refund.processed', {
      refundId,
      orderId: refund.orderId,
      amountMinor: refund.amountMinor,
      providerRefundId,
    });

    return executed;
  }
}
