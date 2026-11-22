import { SearchService } from './search.service.js';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service.js';

describe('SearchService', () => {
  let service: SearchService;
  let mockPrisma: any;
  let mockConfig: any;
  let mockIndex: any;

  beforeEach(() => {
    mockPrisma = {
      product: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    mockConfig = {
      get: jest.fn((key: string, defaultVal: string) => defaultVal),
    };

    mockIndex = {
      updateSettings: jest.fn().mockResolvedValue({}),
      addDocuments: jest.fn().mockResolvedValue({}),
      deleteDocument: jest.fn().mockResolvedValue({}),
      search: jest.fn(),
    };

    service = new SearchService(
      mockConfig as ConfigService,
      mockPrisma as PrismaService
    );

    // Mock client and index directly
    (service as any).client = {
      index: jest.fn().mockReturnValue(mockIndex),
    };
    (service as any).productIndex = mockIndex;
  });

  describe('indexProduct', () => {
    it('should format product and call addDocuments with lowest variant price and stock status', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        name: 'Running Sneaker',
        slug: 'running-sneaker',
        description: 'Lightweight athletic shoe',
        categoryId: 'cat-1',
        category: { name: 'Footwear' },
        brandId: 'brand-1',
        brand: { name: 'Nike' },
        images: [{ url: 'https://cdn.example.com/shoe.jpg', sortOrder: 0 }],
        isPublished: true,
        deletedAt: null,
        createdAt: new Date('2026-01-01'),
        variants: [
          {
            sku: 'SHOE-09',
            priceMinor: 499900,
            mrpMinor: 599900,
            attributes: { size: '9', color: 'Black' },
            inventory: { quantity: 10, reserved: 2 },
          },
          {
            sku: 'SHOE-10',
            priceMinor: 459900,
            mrpMinor: 599900,
            attributes: { size: '10', color: 'Black' },
            inventory: { quantity: 0, reserved: 0 },
          },
        ],
      });

      await service.indexProduct('prod-1');

      expect(mockIndex.addDocuments).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'prod-1',
          name: 'Running Sneaker',
          priceMinor: 459900, // Lowest variant price
          inStock: true, // Variant 1 has available stock (10 - 2 = 8)
          skus: ['SHOE-09', 'SHOE-10'],
          attributes: {
            size: ['9', '10'],
            color: ['Black'],
          },
        }),
      ]);
    });

    it('should delete product from index if unpublished or soft-deleted', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        isPublished: false,
        deletedAt: null,
        variants: [],
      });

      await service.indexProduct('prod-1');

      expect(mockIndex.deleteDocument).toHaveBeenCalledWith('prod-1');
      expect(mockIndex.addDocuments).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should execute Meilisearch query and re-hydrate results with fresh PostgreSQL stock', async () => {
      mockIndex.search.mockResolvedValue({
        hits: [
          {
            id: 'prod-1',
            name: 'Running Sneaker',
            priceMinor: 459900,
            inStock: true,
          },
        ],
        estimatedTotalHits: 1,
      });

      // PostgreSQL returns up-to-the-second live stock
      mockPrisma.product.findMany.mockResolvedValue([
        {
          id: 'prod-1',
          variants: [
            {
              priceMinor: 459900,
              inventory: { quantity: 15, reserved: 1 },
            },
          ],
        },
      ]);

      const result = await service.search({
        q: 'sneaker',
        page: 1,
        limit: 20,
        sort: 'newest',
      });

      expect(mockIndex.search).toHaveBeenCalledWith('sneaker', expect.any(Object));
      expect(result.items.length).toBe(1);
      expect(result.items[0].inStock).toBe(true);
      expect(result.meta.total).toBe(1);
    });
  });
});
