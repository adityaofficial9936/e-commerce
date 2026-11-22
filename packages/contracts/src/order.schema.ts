import { z } from 'zod';
import { PaymentProvider } from './enums.js';

export const OrderItemInputSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const CreateOrderSchema = z.object({
  items: z.array(OrderItemInputSchema).min(1, 'Order must contain at least one item'),
  shippingAddressId: z.string().uuid(),
  billingAddressId: z.string().uuid().optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentProvider),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;

export const CancelOrderSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export type CancelOrderDto = z.infer<typeof CancelOrderSchema>;

export const ShipOrderSchema = z.object({
  courierName: z.string().min(2, 'Courier name is required (e.g. Blue Dart, Delhivery)'),
  trackingNumber: z.string().min(3, 'Tracking number or AWB is required'),
  trackingUrl: z.string().url('Must be a valid URL').optional(),
});

export type ShipOrderDto = z.infer<typeof ShipOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.string(),
  notes: z.string().optional(),
});

export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusSchema>;

