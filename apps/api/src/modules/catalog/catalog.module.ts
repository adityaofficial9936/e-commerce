import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import { CategoriesController } from './categories.controller.js';
import { AdminCategoriesController } from './admin-categories.controller.js';
import { BrandsController } from './brands.controller.js';
import { AdminBrandsController } from './admin-brands.controller.js';
import { ProductsController } from './products.controller.js';
import { AdminProductsController } from './admin-products.controller.js';

@Module({
  controllers: [
    CategoriesController,
    AdminCategoriesController,
    BrandsController,
    AdminBrandsController,
    ProductsController,
    AdminProductsController,
  ],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
