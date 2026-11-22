import { renderBaseEmailTemplate } from './base.template.js';

export function renderWelcomeEmail(data: {
  customerName: string;
  email: string;
}): string {
  const contentHtml = `
    <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #0f172a;">Welcome to Apex Commerce, ${data.customerName}! 🎉</h2>
    <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">Your account has been successfully created. We're excited to have you join our community.</p>

    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #0f172a;">What's next?</h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.7;">
        <li>Enjoy <strong>FREE shipping</strong> on all orders over ₹999.</li>
        <li>Track your live package delivery with automated carrier updates.</li>
        <li>Hassle-free <strong>7-day returns</strong> on all apparel and footwear.</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="http://localhost:3000/products" class="btn">Start Exploring</a>
    </div>
  `;

  return renderBaseEmailTemplate({
    title: 'Welcome to Apex Commerce',
    preheader: 'Your account is ready. Discover top-rated sneakers and footwear today.',
    contentHtml,
  });
}
