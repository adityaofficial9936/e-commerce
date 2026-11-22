import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateCouponDto, UpdateCouponDto } from '@ecommerce/contracts';
import { PrismaService } from '../../core/prisma/prisma.service.js';

export interface DiscountCalculationResult {
  valid: boolean;
  couponId: string;
  code: string;
  discountType: string;
  discountMinor: number;
  message?: string;
}

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate coupon code and calculate discount amount in paise
   */
  async validateAndCalculateDiscount(
    code: string,
    subtotalMinor: number,
    userId?: string
  ): Promise<DiscountCalculationResult> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid or inactive coupon code');
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new BadRequestException('Coupon has expired or is not yet valid');
    }

    if (subtotalMinor < coupon.minOrderMinor) {
      const minAmountRupees = (coupon.minOrderMinor / 100).toFixed(2);
      throw new BadRequestException(
        `Minimum order amount of ₹${minAmountRupees} required to use this coupon`
      );
    }

    // Check total usage limit
    if (coupon.maxUsageTotal) {
      const totalUsage = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id },
      });
      if (totalUsage >= coupon.maxUsageTotal) {
        throw new BadRequestException('Coupon usage limit reached');
      }
    }

    // Check per-user usage limit
    if (userId && coupon.maxUsagePerUser) {
      const userUsage = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });
      if (userUsage >= coupon.maxUsagePerUser) {
        throw new BadRequestException(
          'You have already reached the maximum usage limit for this coupon'
        );
      }
    }

    // Calculate discount in minor paise
    let discountMinor = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountMinor = Math.round((subtotalMinor * coupon.discountValue) / 100);
    } else {
      discountMinor = coupon.discountValue;
    }

    // Discount cannot exceed subtotal
    discountMinor = Math.min(subtotalMinor, discountMinor);

    return {
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountMinor,
    };
  }

  // ----------------------------------------------------
  // ADMIN CRUD
  // ----------------------------------------------------

  async getCoupons(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.coupon.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coupon.count(),
    ]);

    return {
      items,
      meta: { page, limit, total },
    };
  }

  async createCoupon(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Coupon code '${dto.code}' already exists`);
    }

    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderMinor: dto.minOrderMinor ?? 0,
        maxUsageTotal: dto.maxUsageTotal,
        maxUsagePerUser: dto.maxUsagePerUser ?? 1,
        validFrom: dto.validFrom,
        validUntil: dto.validUntil,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    if (dto.code && dto.code.toUpperCase() !== coupon.code) {
      const existing = await this.prisma.coupon.findUnique({
        where: { code: dto.code.toUpperCase() },
      });
      if (existing) {
        throw new ConflictException(`Coupon code '${dto.code}' already exists`);
      }
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.code ? { code: dto.code.toUpperCase() } : {}),
      },
    });
  }

  async deleteCoupon(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    await this.prisma.coupon.delete({ where: { id } });
    return { message: 'Coupon deleted successfully' };
  }
}
