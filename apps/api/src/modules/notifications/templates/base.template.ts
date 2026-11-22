export function renderBaseEmailTemplate({
  title,
  preheader,
  contentHtml,
}: {
  title: string;
  preheader?: string;
  contentHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 36px 32px; }
    .footer { background: #f1f5f9; padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 20px; }
    .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <div class="container">
    <div class="header">
      <h1>Apex Commerce</h1>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>Questions about your order? Reply directly to this email or visit our <a href="http://localhost:3000/account" style="color: #2563eb;">Customer Help Center</a>.</p>
      <p>&copy; 2026 Apex Commerce Pvt. Ltd. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}
