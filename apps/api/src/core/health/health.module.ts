import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { QueuesModule } from '../../modules/queues/queues.module.js';

@Module({
  imports: [QueuesModule],
  controllers: [HealthController],
})
export class HealthModule {}
