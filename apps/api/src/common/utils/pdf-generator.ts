export interface InvoiceItemData {
  productName: string;
  variantTitle?: string;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  issuedAt: Date;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: InvoiceItemData[];
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  taxMinor: number;
  cgstMinor: number;
  sgstMinor: number;
  igstMinor: number;
  totalMinor: number;
}

function escapePdfText(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function formatPaise(minor: number): string {
  const rupees = (minor / 100).toFixed(2);
  const parts = rupees.split('.');
  // Indian currency comma separation: e.g. 1,00,000.00 or standard 3-digit comma
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `INR ${parts.join('.')}`;
}

export class SimplePdfDocument {
  private commands: string[] = [];

  // A4 coordinate system: 0,0 is bottom-left; width: 595.28, height: 841.89
  private readonly pageWidth = 595.28;
  private readonly pageHeight = 841.89;

  setColor(r: number, g: number, b: number) {
    this.commands.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
  }

  setStrokeColor(r: number, g: number, b: number) {
    this.commands.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
  }

  setLineWidth(w: number) {
    this.commands.push(`${w} w`);
  }

  rect(x: number, y: number, w: number, h: number, fill = false, stroke = true) {
    const op = fill && stroke ? 'B' : fill ? 'f' : 's';
    this.commands.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${op}`);
  }

  line(x1: number, y1: number, x2: number, y2: number) {
    this.commands.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  text(str: string, x: number, y: number, size = 10, bold = false) {
    const font = bold ? '/F2' : '/F1';
    const escaped = escapePdfText(str);
    this.commands.push(`BT ${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escaped}) Tj ET`);
  }

  build(): Buffer {
    const streamContent = this.commands.join('\n');
    const streamLength = Buffer.byteLength(streamContent, 'utf-8');

    const objects: string[] = [];

    // Object 1: Catalog
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    // Object 2: Pages
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    // Object 3: Page
    objects.push(
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n'
    );

    // Object 4: Contents Stream
    objects.push(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`);

    // Object 5: Regular Font (Helvetica)
    objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n');

    // Object 6: Bold Font (Helvetica-Bold)
    objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n');

    // Calculate xref table
    let body = '%PDF-1.4\n';
    const offsets: number[] = [0];

    for (const obj of objects) {
      offsets.push(Buffer.byteLength(body, 'utf-8'));
      body += obj;
    }

    const startXref = Buffer.byteLength(body, 'utf-8');
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

    for (let i = 1; i <= objects.length; i++) {
      const offset = offsets[i].toString().padStart(10, '0');
      xref += `${offset} 00000 n \n`;
    }

    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

    return Buffer.from(body + xref + trailer, 'utf-8');
  }
}

export function generateTaxInvoicePdf(data: InvoiceData): Buffer {
  const doc = new SimplePdfDocument();

  // Top border accent
  doc.setColor(0.12, 0.44, 0.88); // Primary brand blue
  doc.rect(40, 805, 515, 6, true, false);

  // Header Title
  doc.setColor(0.1, 0.1, 0.1);
  doc.text('TAX INVOICE', 40, 780, 18, true);
  doc.setColor(0.4, 0.4, 0.4);
  doc.text('(Original for Recipient / Customer Copy)', 175, 782, 8, false);

  // Seller info (Left)
  doc.setColor(0.1, 0.1, 0.1);
  doc.text('Sold By / Consignor:', 40, 755, 9, true);
  doc.text('Ecommerce Platform India Pvt Ltd', 40, 742, 10, true);
  doc.setColor(0.3, 0.3, 0.3);
  doc.text('101 Tech Commerce Hub, BKC, Bandra East', 40, 730, 8, false);
  doc.text('Mumbai, Maharashtra - 400051, India', 40, 719, 8, false);
  doc.text('GSTIN: 27AABCU9603R1ZM  |  PAN: AABCU9603R', 40, 708, 8, false);
  doc.text('State: Maharashtra (Code: 27)  |  support@ecommerce.local', 40, 697, 8, false);

  // Invoice & Order metadata (Right Box)
  doc.setColor(0.96, 0.97, 0.98);
  doc.setStrokeColor(0.85, 0.87, 0.90);
  doc.setLineWidth(1);
  doc.rect(340, 685, 215, 80, true, true);

  doc.setColor(0.1, 0.1, 0.1);
  doc.text(`Invoice No:`, 350, 750, 8, true);
  doc.text(data.invoiceNumber, 430, 750, 8, true);

  doc.text(`Invoice Date:`, 350, 735, 8, false);
  const formattedDate = new Date(data.issuedAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.text(formattedDate, 430, 735, 8, false);

  doc.text(`Order No:`, 350, 720, 8, false);
  doc.text(data.orderNumber, 430, 720, 8, false);

  doc.text(`Payment Mode:`, 350, 705, 8, false);
  doc.text(data.paymentMethod, 430, 705, 8, true);

  // Address Section
  doc.setStrokeColor(0.88, 0.88, 0.88);
  doc.line(40, 675, 555, 675);

  // Bill To (Left)
  doc.setColor(0.1, 0.1, 0.1);
  doc.text('Billing Address:', 40, 660, 9, true);
  doc.setColor(0.2, 0.2, 0.2);
  doc.text(data.customerName, 40, 647, 9, true);
  doc.setColor(0.3, 0.3, 0.3);
  const billAddr = data.billingAddress || data.shippingAddress;
  doc.text(billAddr.street, 40, 635, 8, false);
  doc.text(`${billAddr.city}, ${billAddr.state} - ${billAddr.pincode}`, 40, 624, 8, false);
  doc.text(`Phone: ${data.customerPhone}`, 40, 613, 8, false);

  // Ship To (Right)
  doc.setColor(0.1, 0.1, 0.1);
  doc.text('Shipping / Delivery Address:', 310, 660, 9, true);
  doc.setColor(0.2, 0.2, 0.2);
  doc.text(data.customerName, 310, 647, 9, true);
  doc.setColor(0.3, 0.3, 0.3);
  doc.text(data.shippingAddress.street, 310, 635, 8, false);
  doc.text(
    `${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}`,
    310,
    624,
    8,
    false
  );
  doc.text(`Country: ${data.shippingAddress.country} | Phone: ${data.customerPhone}`, 310, 613, 8, false);

  // Line Items Table Header
  const tableTop = 585;
  doc.setColor(0.2, 0.25, 0.35); // Dark header bar
  doc.rect(40, tableTop, 515, 20, true, false);

  doc.setColor(1, 1, 1); // White text
  doc.text('S.No', 45, tableTop + 6, 8, true);
  doc.text('Description & SKU', 80, tableTop + 6, 8, true);
  doc.text('Qty', 320, tableTop + 6, 8, true);
  doc.text('Unit Price', 360, tableTop + 6, 8, true);
  doc.text('Total (Excl. Tax)', 460, tableTop + 6, 8, true);

  // Table rows
  let rowY = tableTop - 18;
  doc.setStrokeColor(0.9, 0.9, 0.9);

  data.items.forEach((item, index) => {
    // Alternate row background
    if (index % 2 === 1) {
      doc.setColor(0.98, 0.98, 0.99);
      doc.rect(40, rowY - 6, 515, 18, true, false);
    }

    doc.setColor(0.2, 0.2, 0.2);
    doc.text((index + 1).toString(), 48, rowY, 8, false);

    const desc = item.variantTitle ? `${item.productName} (${item.variantTitle})` : item.productName;
    const truncatedDesc = desc.length > 40 ? desc.slice(0, 37) + '...' : desc;
    doc.text(truncatedDesc, 80, rowY, 8, false);
    doc.setColor(0.45, 0.45, 0.45);
    doc.text(`[SKU: ${item.sku}]`, 240, rowY, 7, false);

    doc.setColor(0.2, 0.2, 0.2);
    doc.text(item.quantity.toString(), 325, rowY, 8, false);
    doc.text(formatPaise(item.unitPriceMinor), 360, rowY, 8, false);
    doc.text(formatPaise(item.totalMinor), 460, rowY, 8, true);

    doc.line(40, rowY - 7, 555, rowY - 7);
    rowY -= 19;
  });

  // Financial Breakdown Box (Right bottom)
  const sumY = Math.min(rowY - 10, 320);

  doc.setColor(0.97, 0.97, 0.98);
  doc.setStrokeColor(0.85, 0.85, 0.88);
  doc.rect(330, sumY - 105, 225, 110, true, true);

  doc.setColor(0.3, 0.3, 0.3);
  doc.text('Subtotal:', 340, sumY - 15, 8, false);
  doc.text(formatPaise(data.subtotalMinor), 460, sumY - 15, 8, false);

  if (data.discountMinor > 0) {
    doc.setColor(0.1, 0.6, 0.2); // Green for discount
    doc.text('Coupon Discount:', 340, sumY - 30, 8, false);
    doc.text(`- ${formatPaise(data.discountMinor)}`, 460, sumY - 30, 8, false);
  }

  doc.setColor(0.3, 0.3, 0.3);
  doc.text('Shipping Fee:', 340, sumY - 45, 8, false);
  doc.text(data.shippingMinor === 0 ? 'FREE' : formatPaise(data.shippingMinor), 460, sumY - 45, 8, false);

  if (data.cgstMinor > 0 && data.sgstMinor > 0) {
    doc.text('CGST (9%):', 340, sumY - 60, 8, false);
    doc.text(formatPaise(data.cgstMinor), 460, sumY - 60, 8, false);

    doc.text('SGST (9%):', 340, sumY - 75, 8, false);
    doc.text(formatPaise(data.sgstMinor), 460, sumY - 75, 8, false);
  } else {
    doc.text('IGST (18%):', 340, sumY - 60, 8, false);
    doc.text(formatPaise(data.igstMinor || data.taxMinor), 460, sumY - 60, 8, false);
  }

  // Grand total bar
  doc.setColor(0.12, 0.44, 0.88);
  doc.rect(330, sumY - 105, 225, 22, true, false);
  doc.setColor(1, 1, 1);
  doc.text('Grand Total:', 340, sumY - 96, 10, true);
  doc.text(formatPaise(data.totalMinor), 450, sumY - 96, 10, true);

  // Left terms & notes
  doc.setColor(0.2, 0.2, 0.2);
  doc.text('Declaration & Terms:', 40, sumY - 15, 8, true);
  doc.setColor(0.4, 0.4, 0.4);
  doc.text('1. All disputes are subject to Mumbai jurisdiction.', 40, sumY - 30, 7, false);
  doc.text('2. Goods once sold can be returned within 7 days per return policy.', 40, sumY - 42, 7, false);
  doc.text('3. This is a computer-generated tax invoice and requires no physical signature.', 40, sumY - 54, 7, false);

  // Footer bar
  doc.setColor(0.6, 0.6, 0.6);
  doc.line(40, 60, 555, 60);
  doc.text(
    'Ecommerce Platform India Pvt Ltd | CIN: U72200MH2026PTC123456 | GSTIN: 27AABCU9603R1ZM',
    100,
    45,
    7,
    false
  );

  return doc.build();
}
