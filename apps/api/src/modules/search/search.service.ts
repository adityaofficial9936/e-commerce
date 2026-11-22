import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';
import { ProductSearchQueryDto } from '@ecommerce/contracts';
import { PrismaService } from '../../core/prisma/prisma.service.js';

export interface ProductSearchDocument {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  brandId?: string | null;
  brandName?: string | null;
  primaryImageUrl?: string | null;
  priceMinor: number;
  mrpMinor?: number | null;
  inStock: boolean;
  rating: number;
  skus: string[];
  attributes: Record<string, string[]>;
  createdAt: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch;
  private productIndex: Index<ProductSearchDocument>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async onModuleInit() {
    const host = this.configService.get<string>('MEILI_HOST', 'http://localhost:7700');
    const apiKey = this.configService.get<string>('MEILI_MASTER_KEY', 'masterKey1234567890');

    this.client = new MeiliSearch({ host, apiKey });

    try {
      this.productIndex = this.client.index<ProductSearchDocument>('products');

      // Configure Meilisearch settings
      await this.productIndex.updateSettings({
        searchableAttributes: [
          'name',
          'brandName',
          'categoryName',
          'description',
          'skus',
        ],
        filterableAttributes: [
          'categoryId',
          'brandId',
          'priceMinor',
          'inStock',
          'rating',
          'attributes.size',
          'attributes.color',
        ],
        sortableAttributes: ['priceMinor', 'createdAt', 'rating', 'name'],
      });

      this.logger.log('Meilisearch products index configured successfully');
    } catch (err: any) {
      this.logger.warn(`Could not connect to Meilisearch on init: ${err.message}`);
    }
  }

  /**
   * Sync a single product into the Meilisearch index
   */
  async indexProduct(productId: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          brand: true,
          images: { orderBy: { sortOrder: 'asc' } },
          variants: {
            include: { inventory: true },
          },
        },
      });

      if (!product || product.deletedAt !== null || !product.isPublished) {
        return this.deleteProduct(productId);
      }

      if (product.variants.length === 0) {
        return;
      }

      // Compute lowest price and overall in-stock status
      let lowestPrice = Infinity;
      let lowestMrp: number | null = null;
      let hasStock = false;
      const skus: string[] = [];
      const attributesMap: Record<string, Set<string>> = {};

      product.variants.forEach((v) => {
        if (v.priceMinor < lowestPrice) {
          lowestPrice = v.priceMinor;
          lowestMrp = v.mrpMinor || null;
        }

        const qty = v.inventory?.quantity || 0;
        const reserved = v.inventory?.reserved || 0;
        if (qty - reserved > 0) {
          hasStock = true;
        }

        skus.push(v.sku);

        // Aggregate variant attributes
        if (v.attributes && typeof v.attributes === 'object') {
          Object.entries(v.attributes as Record<string, string>).forEach(
            ([key, val]) => {
              if (!attributesMap[key]) attributesMap[key] = new Set();
              attributesMap[key].add(String(val));
            }
          );
        }
      });

      const attributes: Record<string, string[]> = {};
      Object.entries(attributesMap).forEach(([k, set]) => {
        attributes[k] = Array.from(set);
      });

      const document: ProductSearchDocument = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId: product.categoryId,
        categoryName: product.category.name,
        brandId: product.brandId,
        brandName: product.brand?.name || null,
        primaryImageUrl: product.images[0]?.url || null,
        priceMinor: lowestPrice === Infinity ? 0 : lowestPrice,
        mrpMinor: lowestMrp,
        inStock: hasStock,
        rating: 0,
        skus,
        attributes,
        createdAt: product.createdAt.getTime(),
      };

      await this.productIndex.addDocuments([document]);
      this.logger.log(`Indexed product '${product.name}' in Meilisearch`);
    } catch (err: any) {
      this.logger.error(`Failed to index product ${productId}: ${err.message}`);
    }
  }

  /**
   * Remove a product from the search index
   */
  async deleteProduct(productId: string) {
    try {
      await this.productIndex.deleteDocument(productId);
      this.logger.log(`Deleted product ${productId} from Meilisearch`);
    } catch (err: any) {
      this.logger.error(`Failed to delete product ${productId} from search: ${err.message}`);
    }
  }

  /**
   * Search catalog with filters, facets, and fresh database prices
   */
  async search(query: ProductSearchQueryDto) {
    const filters: string[] = [];

    if (query.categoryId) {
      filters.push(`categoryId = "${query.categoryId}"`);
    }
    if (query.brandId) {
      filters.push(`brandId = "${query.brandId}"`);
    }
    if (query.minPrice !== undefined) {
      filters.push(`priceMinor >= ${query.minPrice}`);
    }
    if (query.maxPrice !== undefined) {
      filters.push(`priceMinor <= ${query.maxPrice}`);
    }
    if (query.inStock !== undefined) {
      filters.push(`inStock = ${query.inStock}`);
    }

    // Sort mapping
    let sortRule: string[] = ['createdAt:desc'];
    if (query.sort === 'price:asc') sortRule = ['priceMinor:asc'];
    else if (query.sort === 'price:desc') sortRule = ['priceMinor:desc'];
    else if (query.sort === 'rating:desc') sortRule = ['rating:desc'];

    const offset = (query.page - 1) * query.limit;

    try {
      const searchResult = await this.productIndex.search(query.q || '', {
        filter: filters.length > 0 ? filters.join(' AND ') : undefined,
        sort: sortRule,
        limit: query.limit,
        offset,
      });

      // Hydrate search hits with authoritative, fresh PostgreSQL stock & prices
      const productIds = searchResult.hits.map((h) => h.id);
      const freshProducts = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          variants: {
            include: { inventory: true },
          },
        },
      });

      const freshMap = new Map(freshProducts.map((p) => [p.id, p]));

      const hydratedHits = searchResult.hits.map((hit) => {
        const fresh = freshMap.get(hit.id);
        if (!fresh) return hit;

        let lowestFreshPrice = hit.priceMinor;
        let freshInStock = false;

        fresh.variants.forEach((v) => {
          if (v.priceMinor < lowestFreshPrice) lowestFreshPrice = v.priceMinor;
          const qty = v.inventory?.quantity || 0;
          const reserved = v.inventory?.reserved || 0;
          if (qty - reserved > 0) freshInStock = true;
        });

        return {
          ...hit,
          priceMinor: lowestFreshPrice,
          inStock: freshInStock,
        };
      });

      return {
        items: hydratedHits,
        meta: {
          page: query.page,
          limit: query.limit,
          total: searchResult.estimatedTotalHits || searchResult.hits.length,
          query: query.q,
        },
      };
    } catch (err: any) {
      this.logger.error(`Meilisearch query failed: ${err.message}. Falling back to PostgreSQL.`);
      // Fallback to plain PostgreSQL search if Meilisearch service is down
      return this.fallbackPostgresSearch(query);
    }
  }

  /**
   * Reindex the entire catalog from PostgreSQL into Meilisearch
   */
  async reindexAll() {
    this.logger.log('Starting full catalog reindex into Meilisearch...');

    const products = await this.prisma.product.findMany({
      where: { isPublished: true, deletedAt: null },
      select: { id: true },
    });

    for (const p of products) {
      await this.indexProduct(p.id);
    }

    this.logger.log(`Completed full catalog reindex: ${products.length} products processed`);
    return {
      message: 'Catalog reindexed successfully',
      count: products.length,
    };
  }

  private async fallbackPostgresSearch(query: ProductSearchQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const where: any = {
      isPublished: true,
      deletedAt: null,
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.brandId ? { brandId: query.brandId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          brand: true,
          images: { take: 1 },
          variants: { include: { inventory: true }, take: 1 },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const formatted = items.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      brandId: p.brandId,
      brandName: p.brand?.name || null,
      primaryImageUrl: p.images[0]?.url || null,
      priceMinor: p.variants[0]?.priceMinor || 0,
      inStock: ((p.variants[0]?.inventory?.quantity || 0) - (p.variants[0]?.inventory?.reserved || 0)) > 0,
      rating: 0,
    }));

    return {
      items: formatted,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        query: query.q,
      },
    };
  }
}
