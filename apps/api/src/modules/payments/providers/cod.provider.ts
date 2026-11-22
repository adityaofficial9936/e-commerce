import { Injectable, BadRequestException } from '@nestjs/common';
import {
  IPaymentProvider,
  CreatePaymentResult,
  VerifyPaymentParams,
  RefundResult,
} from './payment-provider.interface.js';

@Injectable()
export class CodProvider implements IPaymentProvider {
  readonly name = 'COD';
  private readonly MAX_COD_AMOUNT_MINOR = 1000000; // Max ₹10,000 for Cash on Delivery

  async createPaymentOrder(
    orderId: string,
    amountMinor: number
  ): Promise<CreatePaymentResult> {
    if (amountMinor > this.MAX_COD_AMOUNT_MINOR) {
      const maxRupees = (this.MAX_COD_AMOUNT_MINOR / 100).toLocaleString('en-IN');
      throw new BadRequestException(
        `Cash on Delivery is limited to orders up to ₹${maxRupees}`
      );
    }

    return {
      providerOrderId: `cod_${orderId}`,
    };
  }

  async verifyPaymentCallback(params: VerifyPaymentParams): Promise<boolean> {
    return true;
  }

  verifyWebhookSignature(): boolean {
    return true;
  }

  async processRefund(
    providerPaymentId: string,
    amountMinor: number,
    reason: string
  ): Promise<RefundResult> {
    return {
      providerRefundId: `cod_refund_${Date.now()}`,
    };
  }
}
