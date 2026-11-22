import { CheckoutService } from './checkout.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { CartService } from '../cart/cart.service.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { PaymentProvider } from '@ecommerce/contracts';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let mockPrisma: any;
  let mockInventory: any;
  let mockCart: any;
  let mockCoupons: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockPrisma = {
      address: {
        findFirst: jest.fn(),
      },
      productVariant: {
        findMany: jest.fn(),
      },
      order: {
        count: jest.fn().mockResolvedValue(100),
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      orderAddress: {
        create: jest.fn(),
      },
      orderItem: {
        createMany: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      cartItem: {
        deleteMany: jest.fn(),
      },
      coupon: {
        findUnique: jest.fn(),
      },
      couponUsage: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    mockInventory = {
      reserveStockForOrder: jest.fn().mockResolvedValue({ expiresAt: new Date() }),
    };

    mockCart = {
      getCart: jest.fn(),
    };

    mockCoupons = {
      validateAndCalculateDiscount: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new CheckoutService(
      mockPrisma as PrismaService,
      mockInventory as InventoryService,
      mockCart as CartService,
      mockCoupons as CouponsService,
      mockEventEmitter as any
    );
  });

  describe('calculateCheckout', () => {
    it('should correctly calculate GST tax and apply standard shipping if under ₹999 threshold', async () => {
      mockPrisma.address.findFirst.mockResolvedValue({ id: 'addr-1', userId: 'user-1' });

      // Cart subtotal: ₹500 (50,000 paise)
      mockCart.getCart.mockResolvedValue({
        items: [{ id: 'item-1' }],
        subtotalMinor: 50000,
        discountMinor: 0,
      });

      const calc = await service.calculateCheckout('user-1', 'addr-1');

      expect(calc.subtotalMinor).toBe(50000);
      expect(calc.shippingMinor).toBe(9900); // Standard ₹99
      expect(calc.isFreeShipping).toBe(false);
      // Tax: 18% of 50000 = 9000
      expect(calc.taxMinor).toBe(9000);
      // Total: 50000 + 9900 + 9000 = 68900 (₹689)
      expect(calc.totalMinor).toBe(68900);
    });

    it('should grant free shipping if cart subtotal is >= ₹999 threshold', async () => {
      mockPrisma.address.findFirst.mockResolvedValue({ id: 'addr-1', userId: 'user-1' });

      // Cart subtotal: ₹1,500 (150,000 paise)
      mockCart.getCart.mockResolvedValue({
        items: [{ id: 'item-1' }],
        subtotalMinor: 150000,
        discountMinor: 0,
      });

      const calc = await service.calculateCheckout('user-1', 'addr-1');

      expect(calc.shippingMinor).toBe(0); // Free shipping
      expect(calc.isFreeShipping).toBe(true);
      // Tax: 18% of 150000 = 27000
      expect(calc.taxMinor).toBe(27000);
      expect(calc.totalMinor).toBe(177000); // ₹1,770
    });
  });

  describe('createOrder', () => {
    it('should create order, snapshot address and items, and reserve stock for 15 minutes', async () => {
      mockPrisma.address.findFirst.mockResolvedValue({
        id: 'addr-1',
        name: 'Aditya Yadav',
        phone: '9876543210',
        street: '123 Tech Lane',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        country: 'India',
      });

      mockPrisma.productVariant.findMany.mockResolvedValue([
        {
          id: 'var-1',
          sku: 'SKU-001',
          title: 'Size 10',
          priceMinor: 150000,
          product: { name: 'Running Shoe' },
        },
      ]);

      mockPrisma.order.create.mockResolvedValue({
        id: 'ord-uuid-1',
        orderNumber: 'ORD-2026-000101',
      });

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-uuid-1',
        orderNumber: 'ORD-2026-000101',
        status: 'PENDING_PAYMENT',
        items: [{ id: 'item-1' }],
        address: { city: 'Bengaluru' },
      });

      const order = await service.createOrder('user-1', {
        shippingAddressId: 'addr-1',
        paymentMethod: PaymentProvider.RAZORPAY,
        items: [{ variantId: 'var-1', quantity: 1 }],
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockInventory.reserveStockForOrder).toHaveBeenCalledWith(
        mockPrisma,
        'ord-uuid-1',
        [{ variantId: 'var-1', quantity: 1 }]
      );
      expect(mockPrisma.orderAddress.create).toHaveBeenCalled();
      expect(mockPrisma.orderItem.createMany).toHaveBeenCalled();
      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.created', expect.any(Object));
      expect(order?.orderNumber).toBe('ORD-2026-000101');
    });
  });
});
