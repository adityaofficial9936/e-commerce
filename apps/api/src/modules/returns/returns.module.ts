import { Module } from '@nestjs/common';
import { ReturnsController } from './returns.controller.js';
import { AdminReturnsController } from './admin-returns.controller.js';
import { AdminRefundsController } from './admin-refunds.controller.js';
import { ReturnsService } from './returns.service.js';
import { RefundsService } from './refunds.service.js';

@Module({
  controllers: [ReturnsController, AdminReturnsController, AdminRefundsController],
  providers: [ReturnsService, RefundsService],
  exports: [ReturnsService, RefundsService],
})
export class ReturnsModule {}
