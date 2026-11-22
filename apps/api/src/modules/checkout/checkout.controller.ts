import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateOrderDto } from '@ecommerce/contracts';
import { CheckoutService } from './checkout.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Checkout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('preview')
  @ApiOperation({
    summary: 'Preview order breakdown (subtotal, shipping, GST tax, discount, total)',
  })
  async previewCheckout(
    @CurrentUser('id') userId: string,
    @Body('shippingAddressId') shippingAddressId: string,
    @Body('couponCode') couponCode?: string
  ) {
    return this.checkoutService.calculateCheckout(
      userId,
      shippingAddressId,
      couponCode
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Submit checkout to create order and reserve stock for 15 minutes',
  })
  async createOrder(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto
  ) {
    return this.checkoutService.createOrder(userId, dto);
  }
}
