import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { QUEUES } from './queues.constants.js';
import { QueueService } from './queue.service.js';
import { InvoiceProcessor } from './processors/invoice.processor.js';
import { SearchSyncProcessor } from './processors/search-sync.processor.js';
import { MaintenanceProcessor } from './processors/maintenance.processor.js';
import { EmailProcessor } from './processors/email.processor.js';
import { OrdersModule } from '../orders/orders.module.js';
import { SearchModule } from '../search/search.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('REDIS_HOST', 'localhost');
        const port = Number(config.get<number>('REDIS_PORT', 6379));
        const password = config.get<string>('REDIS_PASSWORD');
        return {
          connection: {
            host,
            port,
            ...(password ? { password } : {}),
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: QUEUES.EMAIL },
      { name: QUEUES.INVOICE },
      { name: QUEUES.SEARCH_SYNC },
      { name: QUEUES.MAINTENANCE }
    ),
    forwardRef(() => OrdersModule),
    forwardRef(() => SearchModule),
    forwardRef(() => InventoryModule),
    forwardRef(() => NotificationsModule),
  ],
  providers: [
    QueueService,
    InvoiceProcessor,
    SearchSyncProcessor,
    MaintenanceProcessor,
    EmailProcessor,
  ],
  exports: [QueueService, BullModule],
})
export class QueuesModule {}
