import { renderBaseEmailTemplate } from './base.template.js';

export function renderOrderShippedEmail(data: {
  customerName: string;
  orderNumber: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl?: string;
}): string {
  const contentHtml = `
    <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #0f172a;">Your order is on its way, ${data.customerName}! 🚚</h2>
    <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">Great news! Order <strong>${data.orderNumber}</strong> has been handed over to our courier partner and is currently in transit.</p>

    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #1e40af;">Shipment Tracking Information</h3>
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #1e3a8a;"><strong>Carrier:</strong> ${data.courierName}</p>
      <p style="margin: 0; font-size: 13px; color: #1e3a8a;"><strong>Tracking / AWB Number:</strong> <code style="background: #dbeafe; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${data.trackingNumber}</code></p>
    </div>

    <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
      Standard delivery usually takes 2 to 4 business days. You can track real-time milestones directly with the carrier by clicking below.
    </p>

    <div style="text-align: center;">
      <a href="${data.trackingUrl || `http://localhost:3000/account/orders`}" class="btn">Track Your Package</a>
    </div>
  `;

  return renderBaseEmailTemplate({
    title: `Order Shipped - ${data.orderNumber}`,
    preheader: `Your order ${data.orderNumber} has shipped via ${data.courierName} (AWB: ${data.trackingNumber}).`,
    contentHtml,
  });
}
