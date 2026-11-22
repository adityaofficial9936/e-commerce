import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OrderStatus,
  PaymentStatus,
  VerifyRazorpayPaymentDto,
} from '@ecommerce/contracts';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';
import { CodProvider } from './providers/cod.provider.js';
import { IPaymentProvider } from './providers/payment-provider.interface.js';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private providers: Map<string, IPaymentProvider> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly razorpayProvider: RazorpayProvider,
    private readonly codProvider: CodProvider,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.providers.set(this.razorpayProvider.name, this.razorpayProvider);
    this.providers.set(this.codProvider.name, this.codProvider);
  }

  /**
   * Initialize a payment order with provider (e.g. Razorpay order)
   */
  async createPaymentIntent(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        `Cannot initiate payment for order in '${order.status}' status`
      );
    }

    const provider = this.providers.get(order.paymentMethod) || this.razorpayProvider;

    // Create provider order using authoritative server total in paise
    const result = await provider.createPaymentOrder(
      order.id,
      order.totalMinor,
      order.currency
    );

    // Record or update payment attempt
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: provider.name,
        providerOrderId: result.providerOrderId,
        amountMinor: order.totalMinor,
        currency: order.currency,
        status: PaymentStatus.CREATED,
        rawResponse: result.rawResponse as any,
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      providerOrderId: result.providerOrderId,
      amountMinor: order.totalMinor,
      currency: order.currency,
      provider: provider.name,
      razorpayKeyId: this.configService.get<string>('RAZORPAY_KEY_ID', 'rzp_test_placeholder'),
    };
  }

  /**
   * Verify signature returned by frontend checkout popup (Step 5)
   */
  async verifyPaymentCallback(userId: string, dto: VerifyRazorpayPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Access denied');

    const isValid = await this.razorpayProvider.verifyPaymentCallback({
      orderId: dto.orderId,
      providerOrderId: dto.razorpayOrderId,
      providerPaymentId: dto.razorpayPaymentId,
      signature: dto.razorpaySignature,
    });

    if (!isValid) {
      this.logger.warn(`Invalid Razorpay signature for order ${dto.orderId}`);
      throw new BadRequestException('Invalid payment signature');
    }

    // Call idempotent markPaid
    await this.markPaid(
      order.id,
      dto.razorpayPaymentId,
      dto.razorpayOrderId,
      order.totalMinor
    );

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: OrderStatus.CONFIRMED,
    };
  }

  /**
   * Handle incoming Razorpay Webhook (Step 6 - Authoritative Source of Truth)
   */
  async handleWebhook(providerName: string, rawBody: Buffer | string, signature: string) {
    const provider = this.providers.get(providerName.toUpperCase()) || this.razorpayProvider;

    // 1. Verify webhook HMAC signature on RAW payload
    const isValid = provider.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      this.logger.error(`Webhook signature verification failed for provider ${providerName}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf-8'));
    const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;
    const eventType = payload.event;

    // 2. Webhook Deduplication by event ID
    const existingEvent = await this.prisma.paymentEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent && existingEvent.processed) {
      this.logger.log(`Ignoring duplicate webhook event ${eventId}`);
      return { received: true, duplicate: true };
    }

    // Record raw event in audit table
    await this.prisma.paymentEvent.upsert({
      where: { eventId },
      update: {},
      create: {
        provider: provider.name,
        eventId,
        eventType,
        payload,
        processed: false,
      },
    });

    // 3. Process events
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity || payload.payload?.order?.entity;
      const providerOrderId = paymentEntity?.order_id || paymentEntity?.id;
      const providerPaymentId = paymentEntity?.id;
      const amountPaid = paymentEntity?.amount;

      if (providerOrderId) {
        const payment = await this.prisma.payment.findFirst({
          where: { providerOrderId },
          include: { order: true },
        });

        if (payment) {
          // Verify amount matches database order total
          if (amountPaid && amountPaid !== payment.amountMinor) {
            this.logger.error(
              `Payment amount mismatch! Expected ${payment.amountMinor}, received ${amountPaid}`
            );
            throw new BadRequestException('Payment amount mismatch');
          }

          await this.markPaid(
            payment.orderId,
            providerPaymentId,
            providerOrderId,
            payment.amountMinor
          );
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const providerOrderId = paymentEntity?.order_id;

      if (providerOrderId) {
        await this.prisma.payment.updateMany({
          where: { providerOrderId },
          data: {
            status: PaymentStatus.FAILED,
            errorMessage: paymentEntity?.error_description || 'Payment failed',
          },
        });
      }
    }

    // Mark webhook as processed
    await this.prisma.paymentEvent.update({
      where: { eventId },
      data: { processed: true },
    });

    return { received: true };
  }

  /**
   * Idempotently mark order as paid, deduct inventory permanently, and emit order.paid
   */
  async markPaid(
    orderId: string,
    providerPaymentId: string,
    providerOrderId: string,
    amountMinor: number
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    // IDEMPOTENCY CHECK: If already confirmed or paid, ignore subsequent redundant calls
    if (order.status === OrderStatus.CONFIRMED) {
      this.logger.log(`Order ${order.orderNumber} is already confirmed. Skipping redundant markPaid call.`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Update Payment record to CAPTURED
      await tx.payment.updateMany({
        where: { orderId, providerOrderId },
        data: {
          providerPaymentId,
          status: PaymentStatus.CAPTURED,
        },
      });

      // 2. Permanently deduct physical inventory
      await this.inventoryService.deductStockOnPayment(tx, order.id);

      // 3. Move order to CONFIRMED
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CONFIRMED },
      });

      // 4. Record status history audit
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.CONFIRMED,
          notes: `Payment captured successfully via Razorpay (Payment ID: ${providerPaymentId})`,
        },
      });
    });

    this.logger.log(`Order ${order.orderNumber} successfully confirmed and paid.`);

    // 5. Emit order.paid event for invoices, search counters, and notifications
    this.eventEmitter.emit('order.paid', {
      orderId: order.id,
      userId: order.userId,
      amountMinor,
      providerPaymentId,
    });
  }
}
