import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import {
  generateTaxInvoicePdf,
  InvoiceData,
  InvoiceItemData,
} from '../../common/utils/pdf-generator.js';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);
  private readonly sellerState = 'Maharashtra';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieve existing or generate a new tax invoice for an order
   */
  async getOrCreateInvoice(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        address: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        invoice: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    if (!order.address) {
      throw new NotFoundException(`Order '${orderId}' does not have a delivery address snapshot`);
    }

    // Determine GST intra-state vs inter-state split
    const isIntraState =
      order.address.state.trim().toLowerCase() === this.sellerState.toLowerCase();

    let cgstMinor = 0;
    let sgstMinor = 0;
    let igstMinor = 0;

    if (isIntraState) {
      cgstMinor = Math.round(order.taxMinor / 2);
      sgstMinor = order.taxMinor - cgstMinor;
    } else {
      igstMinor = order.taxMinor;
    }

    let invoice = order.invoice;

    if (!invoice) {
      // Generate sequential invoice number based on order reference
      const invoiceNumber = `INV-${order.orderNumber.replace(/^ORD-/, '')}`;

      invoice = await this.prisma.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          subtotalMinor: order.subtotalMinor,
          taxMinor: order.taxMinor,
          cgstMinor,
          sgstMinor,
          igstMinor,
          shippingMinor: order.shippingMinor,
          discountMinor: order.discountMinor,
          totalMinor: order.totalMinor,
          issuedAt: new Date(),
        },
      });

      this.logger.log(`Generated tax invoice ${invoice.invoiceNumber} for order ${order.orderNumber}`);
    }

    const invoiceItems: InvoiceItemData[] = order.items.map((item) => ({
      productName: item.productName,
      variantTitle: item.variantTitle,
      sku: item.sku,
      quantity: item.quantity,
      unitPriceMinor: item.unitPriceMinor,
      totalMinor: item.totalMinor,
    }));

    const invoicePayload: InvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      orderNumber: order.orderNumber,
      issuedAt: invoice.issuedAt,
      paymentMethod: order.paymentMethod,
      customerName: order.address.name,
      customerPhone: order.address.phone,
      customerEmail: order.user?.email,
      shippingAddress: {
        street: order.address.street,
        city: order.address.city,
        state: order.address.state,
        pincode: order.address.pincode,
        country: order.address.country,
      },
      items: invoiceItems,
      subtotalMinor: invoice.subtotalMinor,
      discountMinor: invoice.discountMinor,
      shippingMinor: invoice.shippingMinor,
      taxMinor: invoice.taxMinor,
      cgstMinor: invoice.cgstMinor,
      sgstMinor: invoice.sgstMinor,
      igstMinor: invoice.igstMinor,
      totalMinor: invoice.totalMinor,
    };

    const pdfBuffer = generateTaxInvoicePdf(invoicePayload);

    return {
      invoice,
      pdfBuffer,
      filename: `${invoice.invoiceNumber}.pdf`,
    };
  }

  /**
   * Fetch invoice PDF with ownership enforcement
   */
  async getInvoicePdf(orderId: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    if (userId && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this invoice');
    }

    return this.getOrCreateInvoice(orderId);
  }

  /**
   * Automatically generate invoice upon order confirmation
   */
  @OnEvent('order.confirmed')
  async handleOrderConfirmed(payload: { orderId: string }) {
    try {
      await this.getOrCreateInvoice(payload.orderId);
    } catch (err) {
      this.logger.error(`Failed to automatically build invoice for confirmed order ${payload.orderId}: ${err}`);
    }
  }
}
