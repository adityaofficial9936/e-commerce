import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateBrandDto,
  UpdateBrandDto,
  CreateProductDto,
  UpdateProductDto,
} from '@ecommerce/contracts';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { RedisService } from '../../core/redis/redis.service.js';
import { SlugUtil } from '../../common/utils/slug.js';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  // ----------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------

  async getCategoryTree() {
    const cacheKey = 'categories:tree';
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Continue to DB if Redis fails
    }

    const allCategories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    const categoryMap = new Map<string, any>();
    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    const rootCategories: any[] = [];

    allCategories.forEach((cat) => {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId).children.push(categoryMap.get(cat.id));
      } else {
        rootCategories.push(categoryMap.get(cat.id));
      }
    });

    try {
      await this.redis.set(cacheKey, JSON.stringify(rootCategories), 3600);
    } catch {
      // Redis error non-fatal
    }

    return rootCategories;
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: true,
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return category;
  }

  async createCategory(dto: CreateCategoryDto) {
    const slug = dto.slug ? SlugUtil.slugify(dto.slug) : SlugUtil.slugify(dto.name);

    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Category with slug '${slug}' already exists`);
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        parentId: dto.parentId,
        imageUrl: dto.imageUrl,
      },
    });

    await this.redis.del('categories:tree');
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    let slug = category.slug;
    if (dto.slug || dto.name) {
      slug = SlugUtil.slugify(dto.slug || dto.name!);
      if (slug !== category.slug) {
        const existing = await this.prisma.category.findUnique({ where: { slug } });
        if (existing) {
          throw new ConflictException(`Category with slug '${slug}' already exists`);
        }
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        slug,
      },
    });

    await this.redis.del('categories:tree');
    return updated;
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.delete({ where: { id } });
    await this.redis.del('categories:tree');

    return { message: 'Category removed successfully' };
  }

  // ----------------------------------------------------
  // BRANDS
  // ----------------------------------------------------

  async getBrands() {
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getBrandBySlug(slug: string) {
    const brand = await this.prisma.brand.findUnique({ where: { slug } });
    if (!brand) {
      throw new NotFoundException(`Brand with slug '${slug}' not found`);
    }
    return brand;
  }

  async createBrand(dto: CreateBrandDto) {
    const slug = dto.slug ? SlugUtil.slugify(dto.slug) : SlugUtil.slugify(dto.name);

    const existing = await this.prisma.brand.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Brand with slug '${slug}' already exists`);
    }

    return this.prisma.brand.create({
      data: {
        name: dto.name,
        slug,
        logoUrl: dto.logoUrl,
      },
    });
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found');

    return this.prisma.brand.update({
      where: { id },
      data: dto,
    });
  }

  async deleteBrand(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found');

    await this.prisma.brand.delete({ where: { id } });
    return { message: 'Brand deleted successfully' };
  }

  // ----------------------------------------------------
  // PRODUCTS & VARIANTS
  // ----------------------------------------------------

  async getProducts(page = 1, limit = 20, categoryId?: string, brandId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {
      isPublished: true,
      deletedAt: null,
      ...(categoryId ? { categoryId } : {}),
      ...(brandId ? { brandId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 2,
          },
          variants: {
            take: 1,
            select: {
              id: true,
              priceMinor: true,
              mrpMinor: true,
              currency: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const formatted = items.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      category: p.category,
      brand: p.brand,
      images: p.images,
      startingPriceMinor: p.variants[0]?.priceMinor ?? 0,
      mrpMinor: p.variants[0]?.mrpMinor ?? null,
      currency: p.variants[0]?.currency ?? 'INR',
    }));

    return {
      items: formatted,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          include: {
            inventory: true,
          },
        },
      },
    });

    if (!product || product.deletedAt !== null) {
      throw new NotFoundException(`Product '${slug}' not found`);
    }

    const variants = product.variants.map((v) => {
      const quantity = v.inventory?.quantity ?? 0;
      const reserved = v.inventory?.reserved ?? 0;
      const availableStock = Math.max(0, quantity - reserved);

      return {
        id: v.id,
        sku: v.sku,
        title: v.title,
        priceMinor: v.priceMinor,
        mrpMinor: v.mrpMinor,
        currency: v.currency,
        attributes: v.attributes,
        availableStock,
        inStock: availableStock > 0,
      };
    });

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      isPublished: product.isPublished,
      category: product.category,
      brand: product.brand,
      images: product.images,
      variants,
    };
  }

  async createProduct(dto: CreateProductDto) {
    const slug = dto.slug ? SlugUtil.slugify(dto.slug) : SlugUtil.slugify(dto.name);

    const existingSlug = await this.prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException(`Product with slug '${slug}' already exists`);
    }

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID '${dto.categoryId}' not found`);
    }

    if (dto.brandId) {
      const brand = await this.prisma.brand.findUnique({ where: { id: dto.brandId } });
      if (!brand) {
        throw new NotFoundException(`Brand with ID '${dto.brandId}' not found`);
      }
    }

    const skus = dto.variants.map((v) => v.sku);
    const existingSkus = await this.prisma.productVariant.findMany({
      where: { sku: { in: skus } },
    });
    if (existingSkus.length > 0) {
      throw new ConflictException(
        `SKU already exists: ${existingSkus.map((s) => s.sku).join(', ')}`
      );
    }

    const createdProduct = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          categoryId: dto.categoryId,
          brandId: dto.brandId,
          isPublished: dto.isPublished ?? false,
        },
      });

      if (dto.images && dto.images.length > 0) {
        await tx.productImage.createMany({
          data: dto.images.map((img) => ({
            productId: product.id,
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder ?? 0,
          })),
        });
      }

      for (const variant of dto.variants) {
        const createdVariant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: variant.sku,
            title: variant.title,
            priceMinor: variant.priceMinor,
            mrpMinor: variant.mrpMinor,
            attributes: variant.attributes || {},
          },
        });

        await tx.inventoryItem.create({
          data: {
            variantId: createdVariant.id,
            quantity: variant.initialQuantity ?? 0,
            reserved: 0,
          },
        });

        if ((variant.initialQuantity ?? 0) > 0) {
          await tx.stockMovement.create({
            data: {
              variantId: createdVariant.id,
              delta: variant.initialQuantity,
              reason: 'MANUAL_ADJUSTMENT',
              reference: 'INITIAL_STOCK_CREATION',
            },
          });
        }
      }

      return product;
    });

    // Emit asynchronous event for search indexing
    this.eventEmitter.emit('catalog.product.created', { productId: createdProduct.id });

    return this.getProductBySlug(createdProduct.slug);
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.deletedAt !== null) {
      throw new NotFoundException('Product not found');
    }

    let slug = product.slug;
    if (dto.slug || dto.name) {
      slug = SlugUtil.slugify(dto.slug || dto.name!);
      if (slug !== product.slug) {
        const existing = await this.prisma.product.findUnique({ where: { slug } });
        if (existing) {
          throw new ConflictException(`Product slug '${slug}' already in use`);
        }
      }
    }

    await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.brandId !== undefined ? { brandId: dto.brandId } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
        slug,
      },
    });

    // Emit asynchronous event for search reindexing
    this.eventEmitter.emit('catalog.product.updated', { productId: id });

    return this.getProductBySlug(slug);
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.deletedAt !== null) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Emit asynchronous event for search deletion
    this.eventEmitter.emit('catalog.product.deleted', { productId: id });

    return { message: 'Product archived successfully' };
  }
}
