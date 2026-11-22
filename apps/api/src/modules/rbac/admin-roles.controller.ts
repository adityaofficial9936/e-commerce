import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from '@ecommerce/contracts';
import { RbacService } from './rbac.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';

@ApiTags('Admin RBAC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/rbac')
export class AdminRolesController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  @RequirePermissions(Permissions.ROLE_MANAGE)
  @ApiOperation({ summary: 'List all defined system roles and assigned permissions' })
  async getRoles() {
    return this.rbacService.getRoles();
  }

  @Get('permissions')
  @RequirePermissions(Permissions.ROLE_MANAGE)
  @ApiOperation({ summary: 'List all granular system permissions' })
  async getPermissions() {
    return this.rbacService.getPermissions();
  }

  @Post('users/:id/roles')
  @RequirePermissions(Permissions.STAFF_MANAGE)
  @ApiOperation({ summary: 'Assign a role to a user/staff member' })
  async assignRole(
    @Param('id') userId: string,
    @Body('roleName') roleName: string
  ) {
    return this.rbacService.assignRoleToUser(userId, roleName);
  }

  @Delete('users/:id/roles/:roleName')
  @RequirePermissions(Permissions.STAFF_MANAGE)
  @ApiOperation({ summary: 'Remove a role from a user/staff member' })
  async removeRole(
    @Param('id') userId: string,
    @Param('roleName') roleName: string
  ) {
    return this.rbacService.removeRoleFromUser(userId, roleName);
  }
}
