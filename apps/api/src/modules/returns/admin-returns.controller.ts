import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InspectReturnDto, Permissions } from '@ecommerce/contracts';
import { ReturnsService } from './returns.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Admin Returns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/returns')
export class AdminReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  @RequirePermissions(Permissions.ORDER_READ)
  @ApiOperation({ summary: 'List customer return requests with status filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getReturns(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.returnsService.adminGetReturns(pageNum, limitNum, status);
  }

  @Get(':id')
  @RequirePermissions(Permissions.ORDER_READ)
  @ApiOperation({ summary: 'Get full return inspection and order context' })
  async getReturnById(@Param('id') id: string) {
    return this.returnsService.adminGetReturnById(id);
  }

  @Post(':id/approve')
  @RequirePermissions(Permissions.ORDER_UPDATE)
  @ApiOperation({ summary: 'Authorize pickup for customer return request' })
  async approveReturn(
    @Param('id') id: string,
    @CurrentUser('id') staffId: string
  ) {
    return this.returnsService.adminApproveReturn(id, staffId);
  }

  @Post(':id/inspect')
  @RequirePermissions(Permissions.ORDER_UPDATE)
  @ApiOperation({ summary: 'Record warehouse quality inspection and restock resaleable inventory' })
  async inspectReturn(
    @Param('id') id: string,
    @Body() dto: InspectReturnDto,
    @CurrentUser('id') staffId: string
  ) {
    return this.returnsService.adminInspectReturn(id, dto, staffId);
  }
}
