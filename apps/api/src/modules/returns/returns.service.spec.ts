import { ReturnsService } from './returns.service.js';
import { RefundsService } from './refunds.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import {
  OrderStatus,
  ReturnStatus,
  ReturnItemCondition,
  RefundStatus,
  StockMovementReason,
} from '@ecommerce/contracts';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('Returns & Refunds Module', () => {
  let returnsService: ReturnsService;
  let refundsService: RefundsService;
  let mockPrisma: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockPrisma = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      returnRequest: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      returnItem: {
        update: jest.fn(),
      },
      inventoryItem: {
        update: jest.fn(),
      },
      stockMovement: {
        create: jest.fn(),
      },
      refund: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    returnsService = new ReturnsService(mockPrisma as PrismaService, mockEventEmitter as any);
    refundsService = new RefundsService(mockPrisma as PrismaService, mockEventEmitter as any);
  });

  describe('ReturnsService.createReturnRequest', () => {
    it('should reject return if order is not DELIVERED', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        userId: 'user-1',
        status: OrderStatus.SHIPPED,
        items: [],
      });

      await expect(
        returnsService.createReturnRequest('user-1', {
          orderId: 'ord-1',
          reason: 'Item defective',
          items: [{ orderItemId: 'item-1', quantity: 1 }],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject return if 7-day return window has expired', async () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        userId: 'user-1',
        status: OrderStatus.DELIVERED,
        shipment: { deliveredAt: tenDaysAgo },
        updatedAt: tenDaysAgo,
        items: [{ id: 'item-1', quantity: 1 }],
      });

      await expect(
        returnsService.createReturnRequest('user-1', {
          orderId: 'ord-1',
          reason: 'Too old',
          items: [{ orderItemId: 'item-1', quantity: 1 }],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create return request within 7-day window', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-2026-000001',
        userId: 'user-1',
        status: OrderStatus.DELIVERED,
        shipment: { deliveredAt: twoDaysAgo },
        updatedAt: twoDaysAgo,
        items: [{ id: 'item-1', quantity: 2, productName: 'Test Product' }],
      });

      mockPrisma.returnRequest.create.mockResolvedValue({
        id: 'ret-1',
        orderId: 'ord-1',
        status: ReturnStatus.REQUESTED,
      });

      const result = await returnsService.createReturnRequest('user-1', {
        orderId: 'ord-1',
        reason: 'Wrong size ordered',
        items: [{ orderItemId: 'item-1', quantity: 1 }],
      });

      expect(mockPrisma.returnRequest.create).toHaveBeenCalled();
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-1' },
        data: { status: OrderStatus.RETURN_REQUESTED },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('return.requested', expect.any(Object));
      expect(result.id).toBe('ret-1');
    });
  });

  describe('ReturnsService.adminInspectReturn', () => {
    it('should restock inventory for RESALEABLE items and create pending refund', async () => {
      const returnRecord = {
        id: 'ret-1',
        orderId: 'ord-1',
        status: ReturnStatus.APPROVED,
        items: [
          {
            id: 'ret-item-1',
            quantity: 2,
            orderItem: {
              variantId: 'var-100',
              unitPriceMinor: 150000,
            },
          },
        ],
        refunds: [],
      };

      mockPrisma.returnRequest.findUnique.mockResolvedValue(returnRecord);

      await returnsService.adminInspectReturn(
        'ret-1',
        {
          items: [{ returnItemId: 'ret-item-1', condition: ReturnItemCondition.RESALEABLE }],
          approveRestock: true,
        },
        'staff-1'
      );

      // Verify physical stock increment
      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
        where: { variantId: 'var-100' },
        data: { quantity: { increment: 2 } },
      });

      // Verify stock movement audit
      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          variantId: 'var-100',
          delta: 2,
          reason: StockMovementReason.RETURN_RESTOCK,
        }),
      });

      // Verify refund draft creation
      expect(mockPrisma.refund.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'ord-1',
          returnRequestId: 'ret-1',
          amountMinor: 300000, // 2 * 1500.00
          status: RefundStatus.PENDING,
        }),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('return.inspected', expect.any(Object));
    });
  });

  describe('RefundsService', () => {
    it('should approve refund and record staff ID', async () => {
      mockPrisma.refund.findUnique.mockResolvedValue({
        id: 'rfnd-1',
        amountMinor: 300000,
        status: RefundStatus.PENDING,
      });

      mockPrisma.refund.update.mockResolvedValue({
        id: 'rfnd-1',
        status: RefundStatus.APPROVED,
        approvedBy: 'lead-1',
      });

      const approved = await refundsService.approveRefund('rfnd-1', 'lead-1', {
        approved: true,
      });

      expect(mockPrisma.refund.update).toHaveBeenCalledWith({
        where: { id: 'rfnd-1' },
        data: {
          status: RefundStatus.APPROVED,
          approvedBy: 'lead-1',
        },
      });
      expect(approved.status).toBe(RefundStatus.APPROVED);
    });

    it('should execute refund and advance order to RETURNED', async () => {
      mockPrisma.refund.findUnique.mockResolvedValue({
        id: 'rfnd-1',
        orderId: 'ord-1',
        returnRequestId: 'ret-1',
        amountMinor: 300000,
        status: RefundStatus.APPROVED,
      });

      mockPrisma.refund.update.mockResolvedValue({
        id: 'rfnd-1',
        status: RefundStatus.PROCESSED,
      });

      await refundsService.executeRefund('rfnd-1', 'finance-1');

      expect(mockPrisma.refund.update).toHaveBeenCalledWith({
        where: { id: 'rfnd-1' },
        data: expect.objectContaining({
          status: RefundStatus.PROCESSED,
          providerRefundId: expect.any(String),
        }),
      });

      expect(mockPrisma.returnRequest.update).toHaveBeenCalledWith({
        where: { id: 'ret-1' },
        data: { status: ReturnStatus.REFUNDED },
      });

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-1' },
        data: { status: OrderStatus.RETURNED },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('refund.processed', expect.any(Object));
    });
  });
});
