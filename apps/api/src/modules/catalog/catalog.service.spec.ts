import { CatalogService } from './catalog.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { RedisService } from '../../core/redis/redis.service.js';
import { ConflictException } from '@nestjs/common';

describe('CatalogService', () => {
  let service: CatalogService;
  let mockPrisma: any;
  let mockRedis: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockPrisma = {
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      brand: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      productVariant: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      inventoryItem: {
        create: jest.fn(),
      },
      stockMovement: {
        create: jest.fn(),
      },
      productImage: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new CatalogService(
      mockPrisma as PrismaService,
      mockRedis as RedisService,
      mockEventEmitter as any
    );
  });

  describe('getCategoryTree', () => {
    it('should build recursive hierarchical tree from flat categories list', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.category.findMany.mockResolvedValue([
        { id: 'cat-1', name: 'Footwear', slug: 'footwear', parentId: null },
        { id: 'cat-2', name: 'Sneakers', slug: 'sneakers', parentId: 'cat-1' },
      ]);

      const tree = await service.getCategoryTree();

      expect(tree.length).toBe(1);
      expect(tree[0].id).toBe('cat-1');
      expect(tree[0].children.length).toBe(1);
      expect(tree[0].children[0].id).toBe('cat-2');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'categories:tree',
        expect.any(String),
        3600
      );
    });
  });

  describe('createCategory', () => {
    it('should throw ConflictException if category slug already exists', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'existing', slug: 'electronics' });

      await expect(
        service.createCategory({ name: 'Electronics', slug: 'electronics' })
      ).rejects.toThrow(ConflictException);
    });

    it('should create category and invalidate tree cache in Redis', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({
        id: 'new-cat',
        name: 'Apparel',
        slug: 'apparel',
      });

      const result = await service.createCategory({ name: 'Apparel' });

      expect(result.name).toBe('Apparel');
      expect(mockRedis.del).toHaveBeenCalledWith('categories:tree');
    });
  });

  describe('createProduct', () => {
    it('should throw ConflictException if any variant SKU already exists in database', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1', name: 'Shoes' });
      mockPrisma.productVariant.findMany.mockResolvedValue([{ sku: 'SKU-001' }]);

      await expect(
        service.createProduct({
          name: 'Pro Runner',
          description: 'High performance running sneakers',
          categoryId: 'cat-1',
          isPublished: false,
          images: [],
          variants: [
            {
              sku: 'SKU-001',
              title: 'Size 10',
              priceMinor: 499900,
              initialQuantity: 10,
              attributes: { size: '10' },
            },
          ],
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should create product, variants, and initial inventory within transaction', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1', name: 'Shoes' });
      mockPrisma.productVariant.findMany.mockResolvedValue([]);
      mockPrisma.product.create.mockResolvedValue({
        id: 'prod-1',
        name: 'Pro Runner',
        slug: 'pro-runner',
      });
      mockPrisma.productVariant.create.mockResolvedValue({
        id: 'var-1',
        productId: 'prod-1',
        sku: 'SKU-PRO-10',
      });

      // Mock getProductBySlug return
      jest.spyOn(service, 'getProductBySlug').mockResolvedValue({
        id: 'prod-1',
        name: 'Pro Runner',
        slug: 'pro-runner',
        variants: [
          {
            id: 'var-1',
            sku: 'SKU-PRO-10',
            availableStock: 25,
            inStock: true,
          },
        ],
      } as any);

      const result = await service.createProduct({
        name: 'Pro Runner',
        description: 'High performance running sneakers',
        categoryId: 'cat-1',
        isPublished: true,
        images: [],
        variants: [
          {
            sku: 'SKU-PRO-10',
            title: 'Size 10',
            priceMinor: 499900,
            initialQuantity: 25,
            attributes: { size: '10' },
          },
        ],
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('catalog.product.created', {
        productId: 'prod-1',
      });
      expect(result.slug).toBe('pro-runner');
      expect(result.variants[0].availableStock).toBe(25);
    });
  });
});
