import { z } from 'zod';
import { ReturnItemCondition, ReturnStatus, RefundStatus } from './enums.js';

export const ReturnItemInputSchema = z.object({
  orderItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const CreateReturnRequestSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  items: z.array(ReturnItemInputSchema).min(1, 'Must return at least one item'),
  images: z.array(z.string().url()).optional(),
});

export type CreateReturnRequestDto = z.infer<typeof CreateReturnRequestSchema>;

export const InspectReturnItemSchema = z.object({
  returnItemId: z.string().uuid(),
  condition: z.nativeEnum(ReturnItemCondition),
});

export const InspectReturnSchema = z.object({
  items: z.array(InspectReturnItemSchema).min(1),
  approveRestock: z.boolean().default(true),
  notes: z.string().optional(),
});

export type InspectReturnDto = z.infer<typeof InspectReturnSchema>;

export const RequestRefundSchema = z.object({
  orderId: z.string().uuid(),
  returnRequestId: z.string().uuid().optional(),
  amountMinor: z.number().int().positive(),
  reason: z.string().min(5),
});

export type RequestRefundDto = z.infer<typeof RequestRefundSchema>;

export const ApproveRefundSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

export type ApproveRefundDto = z.infer<typeof ApproveRefundSchema>;
