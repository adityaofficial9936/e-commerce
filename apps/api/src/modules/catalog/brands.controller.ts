import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CatalogService } from './catalog.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Brands')
@Public()
@Controller('brands')
export class BrandsController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of all active product brands' })
  async getBrands() {
    return this.catalogService.getBrands();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get brand details by slug' })
  async getBrandBySlug(@Param('slug') slug: string) {
    return this.catalogService.getBrandBySlug(slug);
  }
}
