import { PaymentsService } from './payments.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';
import { CodProvider } from './providers/cod.provider.js';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus } from '@ecommerce/contracts';
import { BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockPrisma: any;
  let mockInventory: any;
  let mockRazorpay: any;
  let mockCod: any;
  let mockConfig: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockPrisma = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      paymentEvent: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    mockInventory = {
      deductStockOnPayment: jest.fn().mockResolvedValue({}),
    };

    mockRazorpay = {
      name: 'RAZORPAY',
      createPaymentOrder: jest.fn().mockResolvedValue({ providerOrderId: 'order_rzp_123' }),
      verifyPaymentCallback: jest.fn().mockResolvedValue(true),
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
    };

    mockCod = {
      name: 'COD',
      createPaymentOrder: jest.fn().mockResolvedValue({ providerOrderId: 'cod_order_123' }),
      verifyPaymentCallback: jest.fn().mockResolvedValue(true),
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
    };

    mockConfig = {
      get: jest.fn().mockReturnValue('mock-val'),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new PaymentsService(
      mockPrisma as PrismaService,
      mockInventory as InventoryService,
      mockRazorpay as RazorpayProvider,
      mockCod as CodProvider,
      mockConfig as ConfigService,
      mockEventEmitter as any
    );
  });

  describe('createPaymentIntent', () => {
    it('should create a Razorpay order in minor paise', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        userId: 'user-1',
        status: OrderStatus.PENDING_PAYMENT,
        totalMinor: 249900,
        currency: 'INR',
        paymentMethod: 'RAZORPAY',
      });

      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-1' });

      const intent = await service.createPaymentIntent('ord-1', 'user-1');

      expect(mockRazorpay.createPaymentOrder).toHaveBeenCalledWith('ord-1', 249900, 'INR');
      expect(intent.providerOrderId).toBe('order_rzp_123');
      expect(intent.amountMinor).toBe(249900);
    });
  });

  describe('markPaid - Idempotency', () => {
    it('should confirm order and permanently deduct stock on first call', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-2026-000001',
        status: OrderStatus.PENDING_PAYMENT,
        userId: 'user-1',
        payments: [],
      });

      await service.markPaid('ord-1', 'pay_rzp_abc', 'order_rzp_123', 249900);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockInventory.deductStockOnPayment).toHaveBeenCalledWith(mockPrisma, 'ord-1');
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-1' },
        data: { status: OrderStatus.CONFIRMED },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.paid', expect.any(Object));
    });

    it('should skip duplicate processing if order is already CONFIRMED', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-2026-000001',
        status: OrderStatus.CONFIRMED,
        payments: [{ status: PaymentStatus.CAPTURED }],
      });

      await service.markPaid('ord-1', 'pay_rzp_abc', 'order_rzp_123', 249900);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockInventory.deductStockOnPayment).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('should reject webhook if signature verification fails', async () => {
      mockRazorpay.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        service.handleWebhook('RAZORPAY', '{"event":"payment.captured"}', 'invalid_sig')
      ).rejects.toThrow(BadRequestException);
    });

    it('should ignore duplicate webhooks if event is already processed', async () => {
      mockPrisma.paymentEvent.findUnique.mockResolvedValue({
        eventId: 'evt_123',
        processed: true,
      });

      const result = await service.handleWebhook(
        'RAZORPAY',
        JSON.stringify({ event_id: 'evt_123', event: 'payment.captured' }),
        'valid_sig'
      );

      expect(result.duplicate).toBe(true);
      expect(mockPrisma.payment.updateMany).not.toHaveBeenCalled();
    });
  });
});
