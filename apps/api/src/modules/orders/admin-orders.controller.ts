import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { OrderStatus, Permissions, ShipOrderDto } from '@ecommerce/contracts';
import { OrdersService } from './orders.service.js';
import { InvoiceService } from './invoice.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Admin Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly invoiceService: InvoiceService
  ) {}

  @Get()
  @RequirePermissions(Permissions.ORDER_READ)
  @ApiOperation({ summary: 'List all customer orders with filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  async getOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.ordersService.adminGetOrders(pageNum, limitNum, status);
  }

  @Get(':id')
  @RequirePermissions(Permissions.ORDER_READ)
  @ApiOperation({ summary: 'Get complete back-office order view' })
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Get(':id/tracking')
  @RequirePermissions(Permissions.ORDER_READ)
  @ApiOperation({ summary: 'Get order tracking and fulfillment timeline' })
  async getTracking(@Param('id') id: string) {
    return this.ordersService.getOrderTracking(id);
  }

  @Get(':id/invoice')
  @RequirePermissions(Permissions.ORDER_READ)
  @ApiOperation({ summary: 'Download or view official tax invoice PDF' })
  async downloadInvoice(@Param('id') id: string, @Res() res: Response) {
    const { pdfBuffer, filename } = await this.invoiceService.getOrCreateInvoice(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    return res.end(pdfBuffer);
  }

  @Patch(':id/status')
  @RequirePermissions(Permissions.ORDER_UPDATE)
  @ApiOperation({ summary: 'Advance order fulfillment status (PACKED, SHIPPED, DELIVERED)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Body('notes') notes?: string,
    @CurrentUser('id') staffId?: string
  ) {
    return this.ordersService.adminUpdateOrderStatus(id, status, notes, staffId);
  }

  @Post(':id/pack')
  @RequirePermissions(Permissions.ORDER_UPDATE)
  @ApiOperation({ summary: 'Mark order as securely packed by warehouse' })
  async packOrder(
    @Param('id') id: string,
    @Body('notes') notes?: string,
    @CurrentUser('id') staffId?: string
  ) {
    return this.ordersService.packOrder(id, staffId, notes);
  }

  @Post(':id/ship')
  @RequirePermissions(Permissions.ORDER_UPDATE)
  @ApiOperation({ summary: 'Ship order and record courier AWB tracking info' })
  async shipOrder(
    @Param('id') id: string,
    @Body() dto: ShipOrderDto,
    @CurrentUser('id') staffId?: string
  ) {
    return this.ordersService.shipOrder(id, dto, staffId);
  }

  @Post(':id/deliver')
  @RequirePermissions(Permissions.ORDER_UPDATE)
  @ApiOperation({ summary: 'Confirm delivery of shipped order' })
  async deliverOrder(
    @Param('id') id: string,
    @Body('notes') notes?: string,
    @CurrentUser('id') staffId?: string
  ) {
    return this.ordersService.deliverOrder(id, staffId, notes);
  }
}

