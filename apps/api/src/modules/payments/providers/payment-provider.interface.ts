export interface CreatePaymentResult {
  providerOrderId: string;
  rawResponse?: Record<string, unknown>;
}

export interface VerifyPaymentParams {
  orderId: string;
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface RefundResult {
  providerRefundId: string;
  rawResponse?: Record<string, unknown>;
}

export interface IPaymentProvider {
  name: string;
  createPaymentOrder(
    orderId: string,
    amountMinor: number,
    currency: string
  ): Promise<CreatePaymentResult>;

  verifyPaymentCallback(params: VerifyPaymentParams): Promise<boolean>;

  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean;

  processRefund(
    providerPaymentId: string,
    amountMinor: number,
    reason: string
  ): Promise<RefundResult>;
}
