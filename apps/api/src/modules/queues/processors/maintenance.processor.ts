import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES, JOBS } from '../queues.constants.js';
import { InventoryService } from '../../inventory/inventory.service.js';

@Processor(QUEUES.MAINTENANCE)
export class MaintenanceProcessor extends WorkerHost {
  private readonly logger = new Logger(MaintenanceProcessor.name);

  constructor(private readonly inventoryService: InventoryService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing maintenance job ${job.id} (${job.name})`);

    if (job.name === JOBS.MAINTENANCE.SWEEP_RESERVATIONS) {
      const releasedCount = await this.inventoryService.releaseExpiredReservations();
      this.logger.log(`Maintenance sweep released ${releasedCount} expired inventory reservations`);
      return { releasedCount };
    }

    this.logger.warn(`Unrecognized maintenance job name '${job.name}'`);
    return null;
  }
}
