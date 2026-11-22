import { z } from 'zod';

// ----------------------------------------------------
// CATEGORY SCHEMAS
// ----------------------------------------------------

export const CreateCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be kebab-case lowercase').optional(),
  description: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial();
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;

// ----------------------------------------------------
// BRAND SCHEMAS
// ----------------------------------------------------

export const CreateBrandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be kebab-case lowercase').optional(),
  logoUrl: z.string().url().optional().nullable(),
});

export type CreateBrandDto = z.infer<typeof CreateBrandSchema>;

export const UpdateBrandSchema = CreateBrandSchema.partial();
export type UpdateBrandDto = z.infer<typeof UpdateBrandSchema>;

// ----------------------------------------------------
// PRODUCT VARIANT SCHEMAS
// ----------------------------------------------------

export const CreateProductVariantSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  title: z.string().min(2, 'Variant title is required (e.g. Size 9 / Blue)'),
  priceMinor: z.number().int().positive('Price must be a positive integer in paise'),
  mrpMinor: z.number().int().positive('MRP must be a positive integer in paise').optional().nullable(),
  attributes: z.record(z.string()).default({}), // e.g. { size: "9", color: "Blue" }
  initialQuantity: z.number().int().nonnegative('Initial stock must be >= 0').default(0),
});

export type CreateProductVariantDto = z.infer<typeof CreateProductVariantSchema>;

export const UpdateProductVariantSchema = CreateProductVariantSchema.partial();
export type UpdateProductVariantDto = z.infer<typeof UpdateProductVariantSchema>;

// ----------------------------------------------------
// PRODUCT IMAGE SCHEMAS
// ----------------------------------------------------

export const ProductImageInputSchema = z.object({
  url: z.string().url('Valid image URL is required'),
  altText: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export type ProductImageInputDto = z.infer<typeof ProductImageInputSchema>;

// ----------------------------------------------------
// PRODUCT SCHEMAS
// ----------------------------------------------------

export const CreateProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug must be kebab-case lowercase').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().uuid('Valid Category ID is required'),
  brandId: z.string().uuid().optional().nullable(),
  isPublished: z.boolean().optional().default(false),
  images: z.array(ProductImageInputSchema).optional().default([]),
  variants: z.array(CreateProductVariantSchema).min(1, 'Product must have at least one variant'),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;

// ----------------------------------------------------
// SEARCH SCHEMAS
// ----------------------------------------------------

export const ProductSearchQuerySchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  inStock: z
    .enum(['true', 'false'])
    .transform((val: string) => val === 'true')
    .optional(),
  sort: z.enum(['price:asc', 'price:desc', 'newest', 'rating:desc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ProductSearchQueryDto = z.infer<typeof ProductSearchQuerySchema>;

// ----------------------------------------------------
// MEDIA SIGNING SCHEMAS
// ----------------------------------------------------

export const SignUploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
    errorMap: () => ({ message: 'Only JPEG, PNG, and WebP images are allowed' }),
  }),
  folder: z.enum(['products', 'banners', 'returns', 'avatars']).default('products'),
});

export type SignUploadDto = z.infer<typeof SignUploadSchema>;
