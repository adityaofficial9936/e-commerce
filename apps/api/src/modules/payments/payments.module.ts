import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { WebhooksController } from './webhooks.controller.js';
import { PaymentsService } from './payments.service.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';
import { CodProvider } from './providers/cod.provider.js';
import { InventoryModule } from '../inventory/inventory.module.js';

@Module({
  imports: [InventoryModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, RazorpayProvider, CodProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
