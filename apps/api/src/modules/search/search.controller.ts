import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductSearchQueryDto, Permissions } from '@ecommerce/contracts';
import { SearchService } from './search.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';

@ApiTags('Search')
@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('search/products')
  @ApiOperation({
    summary: 'Search products with typo tolerance, faceted filtering, and fresh database stock',
  })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search keywords' })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'brandId', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Min price in paise' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Max price in paise' })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean })
  @ApiQuery({ name: 'sort', required: false, enum: ['price:asc', 'price:desc', 'newest', 'rating:desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(@Query() query: ProductSearchQueryDto) {
    return this.searchService.search(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permissions.PRODUCT_CREATE)
  @Post('admin/search/reindex')
  @ApiOperation({ summary: 'Rebuild entire Meilisearch products index from PostgreSQL' })
  async reindexAll() {
    return this.searchService.reindexAll();
  }
}
