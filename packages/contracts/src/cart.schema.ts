import { z } from 'zod';

// ----------------------------------------------------
// CART SCHEMAS
// ----------------------------------------------------

export const AddToCartSchema = z.object({
  variantId: z.string().uuid('Valid variant ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1').default(1),
});

export type AddToCartDto = z.infer<typeof AddToCartSchema>;

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().nonnegative('Quantity cannot be negative'),
});

export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>;

export const ApplyCouponSchema = z.object({
  code: z.string().min(2, 'Coupon code is required').toUpperCase(),
});

export type ApplyCouponDto = z.infer<typeof ApplyCouponSchema>;

// ----------------------------------------------------
// COUPON ADMIN SCHEMAS
// ----------------------------------------------------

export const CreateCouponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').toUpperCase(),
  discountType: z.enum(['PERCENTAGE', 'FLAT']),
  discountValue: z.number().int().positive('Discount value must be a positive integer (percent or paise)'),
  minOrderMinor: z.number().int().nonnegative().default(0),
  maxUsageTotal: z.number().int().positive().optional().nullable(),
  maxUsagePerUser: z.number().int().positive().default(1),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  isActive: z.boolean().default(true),
});

export type CreateCouponDto = z.infer<typeof CreateCouponSchema>;

export const UpdateCouponSchema = CreateCouponSchema.partial();
export type UpdateCouponDto = z.infer<typeof UpdateCouponSchema>;
