import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { AdminOrdersController } from './admin-orders.controller.js';
import { OrdersService } from './orders.service.js';
import { InvoiceService } from './invoice.service.js';
import { InventoryModule } from '../inventory/inventory.module.js';

@Module({
  imports: [InventoryModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, InvoiceService],
  exports: [OrdersService, InvoiceService],
})
export class OrdersModule {}

