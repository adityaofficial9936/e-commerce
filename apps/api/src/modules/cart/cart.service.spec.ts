import { CartService } from './cart.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { RedisService } from '../../core/redis/redis.service.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { BadRequestException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;
  let mockPrisma: any;
  let mockRedis: any;
  let mockCoupons: any;

  beforeEach(() => {
    mockPrisma = {
      cart: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      cartItem: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      productVariant: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockCoupons = {
      validateAndCalculateDiscount: jest.fn(),
    };

    service = new CartService(
      mockPrisma as PrismaService,
      mockRedis as RedisService,
      mockCoupons as CouponsService
    );
  });

  describe('addItem', () => {
    it('should throw BadRequestException if variant is out of stock', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        inventory: { quantity: 5, reserved: 5 }, // 0 available
      });

      await expect(service.addItem('var-1', 1, 'user-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should add item to guest cart in Redis when no userId is present', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        inventory: { quantity: 10, reserved: 0 },
      });

      mockRedis.get.mockResolvedValue(null);

      // Mock getGuestCart return
      jest.spyOn<any, any>(service, 'getGuestCart').mockResolvedValue({
        id: 'guest-123',
        isGuest: true,
        items: [{ variantId: 'var-1', quantity: 2 }],
        subtotalMinor: 200000,
        itemCount: 2,
      });

      const result = await service.addItem('var-1', 2, undefined, 'guest-123');

      expect(mockRedis.set).toHaveBeenCalledWith(
        'cart:guest:guest-123',
        JSON.stringify({ items: [{ variantId: 'var-1', quantity: 2 }] }),
        expect.any(Number)
      );
      expect(result.itemCount).toBe(2);
    });
  });

  describe('mergeGuestCart', () => {
    it('should merge items from Redis guest cart into user cart and clear guest cart', async () => {
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ items: [{ variantId: 'var-1', quantity: 3 }] })
      );

      mockPrisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', userId: 'user-1' });
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);

      jest.spyOn<any, any>(service, 'getUserCart').mockResolvedValue({
        id: 'cart-1',
        isGuest: false,
        items: [{ variantId: 'var-1', quantity: 3 }],
        itemCount: 3,
      });

      const result = await service.mergeGuestCart('user-1', 'guest-123');

      expect(mockPrisma.cartItem.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cartId_variantId: { cartId: 'cart-1', variantId: 'var-1' } },
          create: expect.objectContaining({ variantId: 'var-1', quantity: 3 }),
        })
      );
      expect(mockRedis.del).toHaveBeenCalledWith('cart:guest:guest-123');
      expect(result.itemCount).toBe(3);
    });
  });
});
