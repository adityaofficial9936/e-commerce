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
import {
  Permissions,
  RequestRefundDto,
  ApproveRefundDto,
} from '@ecommerce/contracts';
import { RefundsService } from './refunds.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Admin Refunds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/refunds')
export class AdminRefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Get()
  @RequirePermissions(Permissions.REFUND_REQUEST)
  @ApiOperation({ summary: 'List customer refund requests with approval status' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getRefunds(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.refundsService.adminGetRefunds(pageNum, limitNum, status);
  }

  @Get(':id')
  @RequirePermissions(Permissions.REFUND_REQUEST)
  @ApiOperation({ summary: 'Get refund detail with order and payment context' })
  async getRefundById(@Param('id') id: string) {
    return this.refundsService.adminGetRefundById(id);
  }

  @Post()
  @RequirePermissions(Permissions.REFUND_REQUEST)
  @ApiOperation({ summary: 'Initiate a draft refund request for an order' })
  async requestRefund(
    @CurrentUser('id') staffId: string,
    @Body() dto: RequestRefundDto
  ) {
    return this.refundsService.requestRefund(staffId, dto);
  }

  @Post(':id/approve')
  @RequirePermissions(Permissions.REFUND_APPROVE)
  @ApiOperation({ summary: 'Authorize or reject pending refund (Tier 1 Support Lead)' })
  async approveRefund(
    @Param('id') id: string,
    @CurrentUser('id') staffId: string,
    @Body() dto: ApproveRefundDto
  ) {
    return this.refundsService.approveRefund(id, staffId, dto);
  }

  @Post(':id/execute')
  @RequirePermissions(Permissions.REFUND_EXECUTE)
  @ApiOperation({ summary: 'Execute gateway reversal or COD payout (Tier 2 Finance Manager)' })
  async executeRefund(
    @Param('id') id: string,
    @CurrentUser('id') staffId: string
  ) {
    return this.refundsService.executeRefund(id, staffId);
  }
}
