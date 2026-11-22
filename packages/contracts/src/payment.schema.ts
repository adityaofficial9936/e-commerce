import { z } from 'zod';

export const VerifyRazorpayPaymentSchema = z.object({
  orderId: z.string().uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export type VerifyRazorpayPaymentDto = z.infer<typeof VerifyRazorpayPaymentSchema>;

export const CreateRefundSchema = z.object({
  orderId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  reason: z.string().min(3),
});

export type CreateRefundDto = z.infer<typeof CreateRefundSchema>;
