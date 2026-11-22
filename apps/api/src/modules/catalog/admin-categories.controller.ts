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
  CreateCategoryDto,
  UpdateCategoryDto,
  Permissions,
} from '@ecommerce/contracts';
import { CatalogService } from './catalog.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';

@ApiTags('Admin Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @RequirePermissions(Permissions.CATEGORY_MANAGE)
  @ApiOperation({ summary: 'Create a new category in catalog tree' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.CATEGORY_MANAGE)
  @ApiOperation({ summary: 'Update an existing category' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto
  ) {
    return this.catalogService.updateCategory(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.CATEGORY_MANAGE)
  @ApiOperation({ summary: 'Remove a category from catalog tree' })
  async deleteCategory(@Param('id') id: string) {
    return this.catalogService.deleteCategory(id);
  }
}
