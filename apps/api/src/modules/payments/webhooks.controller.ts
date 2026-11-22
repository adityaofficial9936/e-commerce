import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Webhooks')
@Public()
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('razorpay')
  @ApiOperation({
    summary: 'Authoritative webhook receiver for Razorpay payment and refund events',
  })
  async handleRazorpayWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string
  ) {
    if (!signature) {
      throw new BadRequestException('Missing X-Razorpay-Signature header');
    }

    // In Express with JSON parser, req.body is already parsed or rawBody is preserved
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    return this.paymentsService.handleWebhook('RAZORPAY', rawBody, signature);
  }
}
