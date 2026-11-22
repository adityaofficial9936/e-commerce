import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits').optional(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const SendOtpSchema = z.object({
  identifier: z.string().min(3),
});

export type SendOtpDto = z.infer<typeof SendOtpSchema>;

export const VerifyOtpSchema = z.object({
  identifier: z.string().min(3),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits').optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

export const CreateAddressSchema = z.object({
  name: z.string().min(2, 'Recipient name is required'),
  phone: z.string().regex(/^[0-9]{10}$/, '10-digit mobile number required'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Valid 6-digit Indian pincode required'),
  country: z.string().default('India'),
  isDefault: z.boolean().default(false),
});

export type CreateAddressDto = z.infer<typeof CreateAddressSchema>;

export const UpdateAddressSchema = CreateAddressSchema.partial();
export type UpdateAddressDto = z.infer<typeof UpdateAddressSchema>;
