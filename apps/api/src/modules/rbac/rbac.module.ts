import { Module } from '@nestjs/common';
import { AdminRolesController } from './admin-roles.controller.js';
import { RbacService } from './rbac.service.js';

@Module({
  controllers: [AdminRolesController],
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}
