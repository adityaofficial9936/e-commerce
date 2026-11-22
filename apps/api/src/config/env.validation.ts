import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production', 'staging']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_URL: z.string().url().default('http://localhost:3001'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_URL_UNPOOLED: z.string().optional(),

  // Redis
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  // Auth secrets
  JWT_ACCESS_SECRET: z.string().min(16).default('development-jwt-access-secret-min-16-chars'),
  JWT_REFRESH_SECRET: z.string().min(16).default('development-jwt-refresh-secret-min-16-chars'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),

  // Payment keys (optional in local dev, required in production)
  RAZORPAY_KEY_ID: z.string().optional().default('rzp_test_placeholder'),
  RAZORPAY_KEY_SECRET: z.string().optional().default('rzp_test_secret_placeholder'),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default('rzp_webhook_secret_placeholder'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = EnvSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('\n');
    throw new Error(`\n❌ Environment variable validation failed:\n${errors}\n`);
  }
  return result.data;
}
