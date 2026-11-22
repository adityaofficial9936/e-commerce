import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import { ReservationCleanupService } from './reservation-cleanup.service.js';

@Module({
  providers: [InventoryService, ReservationCleanupService],
  exports: [InventoryService],
})
export class InventoryModule {}
