import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CatalogService } from './catalog.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Categories')
@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Get full hierarchical category tree (cached)' })
  async getCategoryTree() {
    return this.catalogService.getCategoryTree();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get category details and immediate subcategories' })
  async getCategoryBySlug(@Param('slug') slug: string) {
    return this.catalogService.getCategoryBySlug(slug);
  }
}
