import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { QueuesModule } from '../queues/queues.module.js';

@Module({
  imports: [forwardRef(() => QueuesModule)],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
