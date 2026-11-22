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
import { CreateBrandDto, UpdateBrandDto, Permissions } from '@ecommerce/contracts';
import { CatalogService } from './catalog.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';

@ApiTags('Admin Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/brands')
export class AdminBrandsController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @RequirePermissions(Permissions.PRODUCT_CREATE)
  @ApiOperation({ summary: 'Create a new brand' })
  async createBrand(@Body() dto: CreateBrandDto) {
    return this.catalogService.createBrand(dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.PRODUCT_UPDATE)
  @ApiOperation({ summary: 'Update brand information' })
  async updateBrand(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.catalogService.updateBrand(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.PRODUCT_DELETE)
  @ApiOperation({ summary: 'Delete a brand' })
  async deleteBrand(@Param('id') id: string) {
    return this.catalogService.deleteBrand(id);
  }
}
