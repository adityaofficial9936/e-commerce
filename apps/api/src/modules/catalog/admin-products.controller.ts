import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateProductDto,
  UpdateProductDto,
  Permissions,
} from '@ecommerce/contracts';
import { CatalogService } from './catalog.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';

@ApiTags('Admin Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @RequirePermissions(Permissions.PRODUCT_CREATE)
  @ApiOperation({ summary: 'Create a new product with variants, images, and initial inventory' })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.PRODUCT_UPDATE)
  @ApiOperation({ summary: 'Update product information and publishing state' })
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto
  ) {
    return this.catalogService.updateProduct(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.PRODUCT_DELETE)
  @ApiOperation({ summary: 'Archive (soft-delete) a product' })
  async deleteProduct(@Param('id') id: string) {
    return this.catalogService.deleteProduct(id);
  }
}
