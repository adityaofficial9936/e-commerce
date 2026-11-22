import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { CancelOrderDto } from '@ecommerce/contracts';
import { OrdersService } from './orders.service.js';
import { InvoiceService } from './invoice.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly invoiceService: InvoiceService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List customer past and active orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyOrders(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.ordersService.getUserOrders(userId, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details, items, address snapshot, and tracking history' })
  async getOrderById(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string
  ) {
    return this.ordersService.getOrderById(orderId, userId);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Track order shipment and live fulfillment status' })
  async getOrderTracking(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string
  ) {
    return this.ordersService.getOrderTracking(orderId, userId);
  }

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Download official GST tax invoice PDF' })
  async downloadInvoice(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Res() res: Response
  ) {
    const { pdfBuffer, filename } = await this.invoiceService.getInvoicePdf(orderId, userId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    return res.end(pdfBuffer);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order before dispatch and release/restock inventory' })
  async cancelOrder(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Body() dto: CancelOrderDto
  ) {
    return this.ordersService.cancelOrder(orderId, userId, dto);
  }
}

