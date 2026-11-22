import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { QueueService } from '../queues/queue.service.js';
import { JOBS } from '../queues/queues.constants.js';
import { renderOrderConfirmationEmail } from './templates/order-confirmation.template.js';
import { renderOrderShippedEmail } from './templates/order-shipped.template.js';
import { renderRefundProcessedEmail } from './templates/refund-processed.template.js';
import { renderWelcomeEmail } from './templates/welcome.template.js';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string; contentType?: string }>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  public sentEmails: EmailMessage[] = []; // In-memory audit for verification & test inspection

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly queueService: QueueService
  ) {}

  /**
   * Listen for user account registration
   */
  @OnEvent('auth.registered')
  async handleUserRegistered(event: { userId: string; email: string; name: string }) {
    this.logger.log(`Handling auth.registered event for user ${event.email}`);

    const html = renderWelcomeEmail({
      customerName: event.name,
      email: event.email,
    });

    await this.queueService.enqueueEmail(JOBS.EMAIL.SEND_WELCOME, {
      to: event.email,
      subject: 'Welcome to Apex Commerce!',
      template: 'welcome',
      context: { userId: event.userId, name: event.name },
    });
  }

  /**
   * Listen for order payment completion
   */
  @OnEvent('order.paid')
  async handleOrderPaid(event: { orderId: string }) {
    this.logger.log(`Handling order.paid event for order ${event.orderId}`);

    // Trigger async invoice generation job
    await this.queueService.enqueueInvoiceGeneration(event.orderId);

    // Fetch order details for confirmation email
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        items: true,
        address: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!order || !order.user || !order.address) {
      this.logger.warn(`Cannot send order confirmation email: Order '${event.orderId}' incomplete or missing`);
      return;
    }

    const html = renderOrderConfirmationEmail({
      customerName: order.user.name,
      orderNumber: order.orderNumber,
      orderDate: new Date(order.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      items: order.items.map((i) => ({
        title: i.variantTitle ? `${i.productName} (${i.variantTitle})` : i.productName,
        quantity: i.quantity,
        priceMinor: i.unitPriceMinor,
      })),
      subtotalMinor: order.subtotalMinor,
      taxMinor: order.taxMinor,
      shippingMinor: order.shippingMinor,
      discountMinor: order.discountMinor,
      totalMinor: order.totalMinor,
      shippingAddress: {
        name: order.address.name,
        street: order.address.street,
        city: order.address.city,
        state: order.address.state,
        pincode: order.address.pincode,
      },
    });

    await this.queueService.enqueueEmail(JOBS.EMAIL.SEND_ORDER_CONFIRMED, {
      to: order.user.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      template: 'order-confirmation',
      context: { orderId: order.id, orderNumber: order.orderNumber },
    });
  }

  /**
   * Listen for order shipment dispatch
   */
  @OnEvent('order.shipped')
  async handleOrderShipped(event: {
    orderId: string;
    courierName: string;
    trackingNumber: string;
    trackingUrl?: string;
  }) {
    this.logger.log(`Handling order.shipped event for order ${event.orderId}`);

    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (!order || !order.user) {
      return;
    }

    const html = renderOrderShippedEmail({
      customerName: order.user.name,
      orderNumber: order.orderNumber,
      courierName: event.courierName,
      trackingNumber: event.trackingNumber,
      trackingUrl: event.trackingUrl,
    });

    await this.queueService.enqueueEmail(JOBS.EMAIL.SEND_ORDER_SHIPPED, {
      to: order.user.email,
      subject: `Your Order ${order.orderNumber} Has Shipped!`,
      template: 'order-shipped',
      context: { orderId: order.id, courierName: event.courierName, trackingNumber: event.trackingNumber },
    });
  }

  /**
   * Listen for refund execution
   */
  @OnEvent('refund.processed')
  async handleRefundProcessed(event: {
    refundId: string;
    orderId: string;
    amountMinor: number;
    providerRefundId: string;
  }) {
    this.logger.log(`Handling refund.processed event for refund ${event.refundId}`);

    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (!order || !order.user) {
      return;
    }

    const html = renderRefundProcessedEmail({
      customerName: order.user.name,
      orderNumber: order.orderNumber,
      refundAmountMinor: event.amountMinor,
      gatewayRefundId: event.providerRefundId,
    });

    await this.queueService.enqueueEmail(JOBS.EMAIL.SEND_REFUND_CONFIRMED, {
      to: order.user.email,
      subject: `Refund Processed - ${order.orderNumber}`,
      template: 'refund-processed',
      context: { orderId: order.id, refundId: event.refundId, amountMinor: event.amountMinor },
    });
  }

  /**
   * Delivers an email message via SMTP or records to sent audit
   */
  async sendDirectEmail(message: EmailMessage): Promise<{ delivered: boolean; id: string }> {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.sentEmails.push(message);

    this.logger.log(`[Email Dispatcher] Sent email [ID: ${id}] to: ${message.to} | Subject: "${message.subject}"`);
    return { delivered: true, id };
  }
}
