import { CouponsService } from './coupons.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

describe('CouponsService', () => {
  let service: CouponsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      coupon: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      couponUsage: {
        count: jest.fn(),
      },
    };

    service = new CouponsService(mockPrisma as PrismaService);
  });

  describe('validateAndCalculateDiscount', () => {
    it('should correctly calculate a 10% percentage discount', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 'cpn-1',
        code: 'SAVE10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderMinor: 100000, // ₹1,000 min
        isActive: true,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
      });

      // Cart subtotal: ₹2,000 (200000 paise)
      const result = await service.validateAndCalculateDiscount('SAVE10', 200000);

      expect(result.valid).toBe(true);
      expect(result.discountMinor).toBe(20000); // 10% of 200,000 = 20,000 paise (₹200)
    });

    it('should correctly calculate a flat ₹500 discount', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 'cpn-2',
        code: 'FLAT500',
        discountType: 'FLAT',
        discountValue: 50000, // ₹500 in paise
        minOrderMinor: 100000,
        isActive: true,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
      });

      const result = await service.validateAndCalculateDiscount('FLAT500', 150000);

      expect(result.valid).toBe(true);
      expect(result.discountMinor).toBe(50000); // ₹500
    });

    it('should throw BadRequestException if subtotal is below minimum order value', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 'cpn-1',
        code: 'SAVE10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderMinor: 200000, // ₹2,000 min
        isActive: true,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
      });

      // Cart is only ₹1,500
      await expect(
        service.validateAndCalculateDiscount('SAVE10', 150000)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user exceeded usage limit', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 'cpn-1',
        code: 'SAVE10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderMinor: 0,
        maxUsagePerUser: 1,
        isActive: true,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
      });

      mockPrisma.couponUsage.count.mockResolvedValue(1);

      await expect(
        service.validateAndCalculateDiscount('SAVE10', 50000, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
