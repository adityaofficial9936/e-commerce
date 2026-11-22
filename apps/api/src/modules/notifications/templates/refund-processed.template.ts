import { renderBaseEmailTemplate } from './base.template.js';

export function renderRefundProcessedEmail(data: {
  customerName: string;
  orderNumber: string;
  refundAmountMinor: number;
  gatewayRefundId: string;
}): string {
  const formatInr = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const contentHtml = `
    <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #0f172a;">Refund Processed Successfully</h2>
    <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">Hello ${data.customerName}, we have successfully processed your refund for order <strong>${data.orderNumber}</strong>.</p>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #166534;">Refund Breakdown</h3>
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #14532d;"><strong>Refunded Amount:</strong> <span style="font-size: 18px; font-weight: 700;">${formatInr(data.refundAmountMinor)}</span></p>
      <p style="margin: 0; font-size: 12px; color: #166534;"><strong>Gateway Reference:</strong> <code>${data.gatewayRefundId}</code></p>
    </div>

    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
      Depending on your banking provider (UPI, Netbanking, or Credit/Debit Card), the funds will credit back to your original payment instrument within <strong>3 to 5 business days</strong>.
    </p>

    <div style="text-align: center;">
      <a href="http://localhost:3000/account/orders" class="btn">View Order History</a>
    </div>
  `;

  return renderBaseEmailTemplate({
    title: `Refund Processed - ${data.orderNumber}`,
    preheader: `Your refund of ${formatInr(data.refundAmountMinor)} for order ${data.orderNumber} has been successfully processed.`,
    contentHtml,
  });
}
