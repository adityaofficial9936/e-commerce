import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VerifyRazorpayPaymentDto } from '@ecommerce/contracts';
import { PaymentsService } from './payments.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent/:orderId')
  @ApiOperation({
    summary: 'Create payment order with payment gateway (Razorpay order in paise)',
  })
  async createIntent(
    @CurrentUser('id') userId: string,
    @Param('orderId') orderId: string
  ) {
    return this.paymentsService.createPaymentIntent(orderId, userId);
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verify client checkout signature from Razorpay modal callback',
  })
  async verifyPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyRazorpayPaymentDto
  ) {
    return this.paymentsService.verifyPaymentCallback(userId, dto);
  }
}
