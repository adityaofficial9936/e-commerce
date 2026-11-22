import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service.js';
import { AdminCouponsController } from './admin-coupons.controller.js';

@Module({
  controllers: [AdminCouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
