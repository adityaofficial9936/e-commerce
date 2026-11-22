import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
});

export type PaginationQueryDto = z.infer<typeof PaginationQuerySchema>;

export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

export type IdParamDto = z.infer<typeof IdParamSchema>;

export const MoneySchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).default('INR'),
});

export type MoneyDto = z.infer<typeof MoneySchema>;

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
    requestId: string;
  };
}
