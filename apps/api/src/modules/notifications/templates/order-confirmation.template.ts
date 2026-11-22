import { renderBaseEmailTemplate } from './base.template.js';

export function renderOrderConfirmationEmail(data: {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{ title: string; quantity: number; priceMinor: number }>;
  subtotalMinor: number;
  taxMinor: number;
  shippingMinor: number;
  discountMinor: number;
  totalMinor: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}): string {
  const formatInr = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px;">
        <strong>${item.title}</strong><br>
        <span style="color: #64748b; font-size: 12px;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 14px; font-weight: 600;">
        ${formatInr(item.priceMinor * item.quantity)}
      </td>
    </tr>`
    )
    .join('');

  const contentHtml = `
    <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #0f172a;">Thank you for your order, ${data.customerName}!</h2>
    <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">We have received order <strong>${data.orderNumber}</strong> and our warehouse is preparing your shipment.</p>

    <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px;">
      <p style="margin: 0 0 4px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
      <p style="margin: 0;"><strong>Date:</strong> ${data.orderDate}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase;">
          <th style="padding-bottom: 8px;">Item</th>
          <th style="padding-bottom: 8px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="margin-left: auto; width: 60%; font-size: 13px; line-height: 1.8;">
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748b;">Subtotal:</span>
        <span>${formatInr(data.subtotalMinor)}</span>
      </div>
      ${
        data.discountMinor > 0
          ? `<div style="display: flex; justify-content: space-between; color: #16a34a;">
              <span>Discount:</span>
              <span>-${formatInr(data.discountMinor)}</span>
            </div>`
          : ''
      }
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748b;">Estimated GST (18%):</span>
        <span>${formatInr(data.taxMinor)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748b;">Shipping:</span>
        <span>${data.shippingMinor === 0 ? 'FREE' : formatInr(data.shippingMinor)}</span>
      </div>
      <div style="border-top: 2px solid #0f172a; margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 700;">
        <span>Grand Total:</span>
        <span>${formatInr(data.totalMinor)}</span>
      </div>
    </div>

    <div class="divider"></div>

    <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a;">Shipping Address</h4>
    <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
      ${data.shippingAddress.name}<br>
      ${data.shippingAddress.street}<br>
      ${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}
    </p>

    <div style="text-align: center;">
      <a href="http://localhost:3000/account/orders" class="btn">View Order Status</a>
    </div>
  `;

  return renderBaseEmailTemplate({
    title: `Order Confirmation - ${data.orderNumber}`,
    preheader: `Thank you for your order ${data.orderNumber}. We have received your payment and are packing your items.`,
    contentHtml,
  });
}
