import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';

@Injectable()
export class ReservationCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReservationCleanupService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly inventoryService: InventoryService) {}

  onModuleInit() {
    // Run reservation expiration sweep every 60 seconds
    this.timer = setInterval(async () => {
      try {
        const result = await this.inventoryService.releaseExpiredReservations();
        if (result.released > 0) {
          this.logger.log(`Released ${result.released} expired reservations`);
        }
      } catch (err: any) {
        this.logger.error(`Error in reservation cleanup sweep: ${err.message}`);
      }
    }, 60 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
