import { OrdersService } from './orders.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { OrderStatus } from '@ecommerce/contracts';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockPrisma: any;
  let mockInventory: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockPrisma = {
      order: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      shipment: {
        upsert: jest.fn(),
        update: jest.fn(),
      },
      inventoryItem: {
        update: jest.fn(),
      },
      stockMovement: {
        create: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    mockInventory = {
      releaseReservation: jest.fn().mockResolvedValue({}),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new OrdersService(
      mockPrisma as PrismaService,
      mockInventory as InventoryService,
      mockEventEmitter as any
    );
  });

  describe('getOrderById', () => {
    it('should throw ForbiddenException if order does not belong to user', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        userId: 'other-user',
      });

      await expect(service.getOrderById('ord-1', 'my-user-id')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel PENDING_PAYMENT order and release reserved stock', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-2026-000001',
        userId: 'user-1',
        status: OrderStatus.PENDING_PAYMENT,
        items: [{ variantId: 'var-1', quantity: 2 }],
      });

      await service.cancelOrder('ord-1', 'user-1', {
        reason: 'Decided not to purchase',
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockInventory.releaseReservation).toHaveBeenCalledWith(mockPrisma, 'ord-1');
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-1' },
        data: { status: OrderStatus.CANCELLED },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.cancelled', expect.any(Object));
    });

    it('should throw BadRequestException if order has already shipped', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        userId: 'user-1',
        status: OrderStatus.SHIPPED,
        items: [],
      });

      await expect(
        service.cancelOrder('ord-1', 'user-1', { reason: 'Too late' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('packOrder', () => {
    it('should transition CONFIRMED order to PACKED', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-2026-000001',
        status: OrderStatus.CONFIRMED,
      });

      await service.packOrder('ord-1', 'staff-1', 'Packed securely');

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-1' },
        data: { status: OrderStatus.PACKED },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.packed', {
        orderId: 'ord-1',
        orderNumber: 'ORD-2026-000001',
      });
    });

    it('should throw BadRequestException if order is not CONFIRMED', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        status: OrderStatus.PENDING_PAYMENT,
      });

      await expect(service.packOrder('ord-1', 'staff-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('shipOrder', () => {
    it('should transition PACKED order to SHIPPED and create shipment record', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-2026-000001',
        status: OrderStatus.PACKED,
      });

      const dto = {
        courierName: 'Blue Dart',
        trackingNumber: 'BLUEDART123456',
        trackingUrl: 'https://track.bluedart.com/123456',
      };

      await service.shipOrder('ord-1', dto, 'staff-1');

      expect(mockPrisma.shipment.upsert).toHaveBeenCalledWith({
        where: { orderId: 'ord-1' },
        create: expect.objectContaining({
          courierName: 'Blue Dart',
          trackingNumber: 'BLUEDART123456',
        }),
        update: expect.objectContaining({
          courierName: 'Blue Dart',
          trackingNumber: 'BLUEDART123456',
        }),
      });

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-1' },
        data: { status: OrderStatus.SHIPPED },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.shipped',
        expect.objectContaining({
          orderId: 'ord-1',
          courierName: 'Blue Dart',
          trackingNumber: 'BLUEDART123456',
        })
      );
    });

    it('should throw BadRequestException if order is not CONFIRMED or PACKED', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        status: OrderStatus.PENDING_PAYMENT,
      });

      await expect(
        service.shipOrder(
          'ord-1',
          { courierName: 'Delhivery', trackingNumber: 'DEL123' },
          'staff-1'
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deliverOrder', () => {
    it('should transition SHIPPED order to DELIVERED and update deliveredAt', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-2026-000001',
        status: OrderStatus.SHIPPED,
        shipment: { id: 'ship-1', orderId: 'ord-1' },
      });

      await service.deliverOrder('ord-1', 'staff-1', 'Delivered to resident');

      expect(mockPrisma.shipment.update).toHaveBeenCalledWith({
        where: { orderId: 'ord-1' },
        data: { deliveredAt: expect.any(Date) },
      });

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-1' },
        data: { status: OrderStatus.DELIVERED },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.delivered', {
        orderId: 'ord-1',
        orderNumber: 'ORD-2026-000001',
      });
    });

    it('should throw BadRequestException if order is not SHIPPED', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        status: OrderStatus.PACKED,
      });

      await expect(service.deliverOrder('ord-1', 'staff-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getOrderTracking', () => {
    it('should return tracking details with ownership enforcement', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-2026-000001',
        userId: 'user-1',
        status: OrderStatus.SHIPPED,
        shipment: {
          courierName: 'Delhivery',
          trackingNumber: 'TRK999',
        },
        statusHistory: [
          { toStatus: OrderStatus.CONFIRMED },
          { toStatus: OrderStatus.SHIPPED },
        ],
      });

      const tracking = await service.getOrderTracking('ord-1', 'user-1');

      expect(tracking.orderNumber).toBe('ORD-2026-000001');
      expect(tracking.shipment?.courierName).toBe('Delhivery');
    });

    it('should throw ForbiddenException if user does not own order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        userId: 'other-user',
      });

      await expect(service.getOrderTracking('ord-1', 'my-user')).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
