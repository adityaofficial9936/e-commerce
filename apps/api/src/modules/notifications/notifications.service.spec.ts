import { NotificationsService } from './notifications.service.js';
import { JOBS } from '../queues/queues.constants.js';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockPrisma: any;
  let mockConfig: any;
  let mockQueueService: any;

  beforeEach(() => {
    mockPrisma = {
      order: {
        findUnique: jest.fn(),
      },
    };

    mockConfig = {
      get: jest.fn().mockReturnValue(null),
    };

    mockQueueService = {
      enqueueEmail: jest.fn().mockResolvedValue({ id: 'job-email-123' }),
      enqueueInvoiceGeneration: jest.fn().mockResolvedValue({ id: 'job-inv-123' }),
    };

    service = new NotificationsService(mockPrisma, mockConfig, mockQueueService);
  });

  it('1. Enqueues a welcome email upon user registration', async () => {
    await service.handleUserRegistered({
      userId: 'usr-1',
      email: 'alex@example.com',
      name: 'Alex Sharma',
    });

    expect(mockQueueService.enqueueEmail).toHaveBeenCalledWith(
      JOBS.EMAIL.SEND_WELCOME,
      expect.objectContaining({
        to: 'alex@example.com',
        subject: 'Welcome to Apex Commerce!',
        template: 'welcome',
      })
    );
  });

  it('2. Enqueues order confirmation email & triggers async invoice generation when order is paid', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'ord-101',
      orderNumber: 'ORD-2026-000101',
      createdAt: new Date('2026-11-16T12:00:00Z'),
      subtotalMinor: 299900,
      taxMinor: 48582,
      shippingMinor: 0,
      discountMinor: 29990,
      totalMinor: 318492,
      user: {
        name: 'Alex Sharma',
        email: 'alex@example.com',
      },
      address: {
        name: 'Alex Sharma',
        street: '123 MG Road',
        city: 'Bengaluru',
        state: 'KA',
        pincode: '560001',
      },
      items: [
        {
          productName: 'Running Sneaker',
          variantTitle: 'Red / 42',
          quantity: 1,
          unitPriceMinor: 299900,
        },
      ],
    });

    await service.handleOrderPaid({ orderId: 'ord-101' });

    expect(mockQueueService.enqueueInvoiceGeneration).toHaveBeenCalledWith('ord-101');
    expect(mockQueueService.enqueueEmail).toHaveBeenCalledWith(
      JOBS.EMAIL.SEND_ORDER_CONFIRMED,
      expect.objectContaining({
        to: 'alex@example.com',
        subject: 'Order Confirmation - ORD-2026-000101',
        template: 'order-confirmation',
      })
    );
  });

  it('3. Enqueues shipment notification email with courier tracking AWB', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'ord-101',
      orderNumber: 'ORD-2026-000101',
      user: {
        name: 'Alex Sharma',
        email: 'alex@example.com',
      },
    });

    await service.handleOrderShipped({
      orderId: 'ord-101',
      courierName: 'Blue Dart Express',
      trackingNumber: 'BLUEDART-123456',
      trackingUrl: 'https://bluedart.com/track/BLUEDART-123456',
    });

    expect(mockQueueService.enqueueEmail).toHaveBeenCalledWith(
      JOBS.EMAIL.SEND_ORDER_SHIPPED,
      expect.objectContaining({
        to: 'alex@example.com',
        subject: 'Your Order ORD-2026-000101 Has Shipped!',
        template: 'order-shipped',
      })
    );
  });

  it('4. Enqueues refund notification email upon refund execution', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'ord-101',
      orderNumber: 'ORD-2026-000101',
      user: {
        name: 'Alex Sharma',
        email: 'alex@example.com',
      },
    });

    await service.handleRefundProcessed({
      refundId: 'rfnd-999',
      orderId: 'ord-101',
      amountMinor: 299900,
      providerRefundId: 'rfnd_rzp_mock_123',
    });

    expect(mockQueueService.enqueueEmail).toHaveBeenCalledWith(
      JOBS.EMAIL.SEND_REFUND_CONFIRMED,
      expect.objectContaining({
        to: 'alex@example.com',
        subject: 'Refund Processed - ORD-2026-000101',
        template: 'refund-processed',
      })
    );
  });

  it('5. Successfully dispatches direct email and appends to sent audit', async () => {
    const result = await service.sendDirectEmail({
      to: 'customer@example.com',
      subject: 'Security alert',
      html: '<p>Your password was updated</p>',
    });

    expect(result.delivered).toBe(true);
    expect(service.sentEmails.length).toBe(1);
    expect(service.sentEmails[0].to).toBe('customer@example.com');
  });
});
