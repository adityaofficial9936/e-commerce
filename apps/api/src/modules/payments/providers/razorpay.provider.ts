import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import Razorpay from 'razorpay';
import {
  IPaymentProvider,
  CreatePaymentResult,
  VerifyPaymentParams,
  RefundResult,
} from './payment-provider.interface.js';

@Injectable()
export class RazorpayProvider implements IPaymentProvider {
  readonly name = 'RAZORPAY';
  private readonly logger = new Logger(RazorpayProvider.name);
  private instance: Razorpay;
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID', 'rzp_test_placeholder');
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', 'rzp_test_secret_placeholder');
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET', 'rzp_webhook_secret_placeholder');

    this.instance = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });
  }

  async createPaymentOrder(
    orderId: string,
    amountMinor: number,
    currency = 'INR'
  ): Promise<CreatePaymentResult> {
    try {
      const response = await this.instance.orders.create({
        amount: amountMinor, // in paise
        currency,
        receipt: `rcpt_${orderId.slice(0, 14)}`,
        notes: { orderId },
      });

      return {
        providerOrderId: response.id,
        rawResponse: response as unknown as Record<string, unknown>,
      };
    } catch (err: any) {
      this.logger.error(`Failed to create Razorpay order for ${orderId}: ${err.message}`);
      throw new Error(`Razorpay order creation failed: ${err.message}`);
    }
  }

  async verifyPaymentCallback(params: VerifyPaymentParams): Promise<boolean> {
    try {
      // Signature formula: HMAC-SHA256(order_id + "|" + payment_id, key_secret)
      const text = `${params.providerOrderId}|${params.providerPaymentId}`;
      const expectedSignature = createHmac('sha256', this.keySecret)
        .update(text)
        .digest('hex');

      return expectedSignature === params.signature;
    } catch (err: any) {
      this.logger.error(`Error verifying Razorpay signature: ${err.message}`);
      return false;
    }
  }

  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    try {
      const expectedSignature = createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('hex');

      return expectedSignature === signature;
    } catch (err: any) {
      this.logger.error(`Error verifying Razorpay webhook signature: ${err.message}`);
      return false;
    }
  }

  async processRefund(
    providerPaymentId: string,
    amountMinor: number,
    reason: string
  ): Promise<RefundResult> {
    try {
      const refund = await this.instance.payments.refund(providerPaymentId, {
        amount: amountMinor,
        notes: { reason },
      });

      return {
        providerRefundId: refund.id,
        rawResponse: refund as unknown as Record<string, unknown>,
      };
    } catch (err: any) {
      this.logger.error(`Failed to process Razorpay refund: ${err.message}`);
      throw new Error(`Razorpay refund failed: ${err.message}`);
    }
  }
}
