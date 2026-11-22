import { AuthService } from '../modules/auth/auth.service.js';
import { CartService } from '../modules/cart/cart.service.js';
import { CouponsService } from '../modules/coupons/coupons.service.js';
import { CheckoutService } from '../modules/checkout/checkout.service.js';
import { PaymentsService } from '../modules/payments/payments.service.js';
import { OrdersService } from '../modules/orders/orders.service.js';
import { InvoiceService } from '../modules/orders/invoice.service.js';
import { ReturnsService } from '../modules/returns/returns.service.js';
import { RefundsService } from '../modules/returns/refunds.service.js';
import { SupportService } from '../modules/support/support.service.js';
import { AiChatService } from '../modules/support/ai-chat.service.js';
import {
  OrderStatus,
  ReturnStatus,
  ReturnItemCondition,
  RefundStatus,
  PaymentProvider,
  StockMovementReason,
  TicketPriority,
  TicketCategory,
} from '@ecommerce/contracts';

describe('E-Commerce Platform: Complete E2E Lifecycle Integration Suite', () => {
  let authService: AuthService;
  let cartService: CartService;
  let couponsService: CouponsService;
  let checkoutService: CheckoutService;
  let paymentsService: PaymentsService;
  let ordersService: OrdersService;
  let invoiceService: InvoiceService;
  let returnsService: ReturnsService;
  let refundsService: RefundsService;
  let supportService: SupportService;
  let aiChatService: AiChatService;

  let mockPrisma: any;
  let mockRedis: any;
  let mockInventory: any;
  let mockEventEmitter: any;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockRazorpayProvider: any;
  let mockCodProvider: any;

  // In-Memory Shared State
  const db: any = {
    users: [],
    roles: [{ id: 'role-cust-1', name: 'Customer' }],
    addresses: [],
    variants: [],
    cartItems: [],
    coupons: [],
    couponUsages: [],
    orders: [],
    orderItems: [],
    orderAddresses: [],
    orderHistory: [],
    shipments: [],
    invoices: [],
    returnRequests: [],
    returnItems: [],
    refunds: [],
    inventoryItems: [],
    stockMovements: [],
    tickets: [],
    ticketMessages: [],
    chatSessions: [],
    chatMessages: [],
    paymentEvents: [],
  };

  beforeAll(() => {
    // Populate seed product variant
    db.variants.push({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      productId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
      sku: 'RUN-SNEAK-RED-42',
      title: 'Running Sneaker - Red / 42',
      priceMinor: 299900, // ₹2,999.00
      compareAtPriceMinor: 399900,
      product: {
        name: 'Running Sneaker',
        slug: 'running-sneaker',
        images: [],
      },
      inventory: {
        id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
        variantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        quantity: 50,
        reserved: 0,
      },
      inventoryItem: {
        id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
        variantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        sku: 'RUN-SNEAK-RED-42',
        quantityOnHand: 50,
        reservedQuantity: 0,
      },
    });

    db.inventoryItems.push({
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
      variantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      sku: 'RUN-SNEAK-RED-42',
      quantityOnHand: 50,
      reservedQuantity: 0,
    });

    // Populate active coupon
    db.coupons.push({
      id: 'coup-1',
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10, // 10%
      maxDiscountMinor: 50000, // max ₹500
      minOrderMinor: 100000, // min ₹1,000
      validFrom: new Date(Date.now() - 86400000),
      validUntil: new Date(Date.now() + 86400000 * 30),
      isActive: true,
      maxUsageTotal: 1000,
      maxUsagePerUser: 1,
    });

    // Mock EventEmitter
    mockEventEmitter = {
      emit: jest.fn(),
    };

    // Mock Redis
    const redisStore = new Map<string, string>();
    mockRedis = {
      get: jest.fn(async (key: string) => redisStore.get(key) || null),
      set: jest.fn(async (key: string, val: string) => {
        redisStore.set(key, val);
        return 'OK';
      }),
      del: jest.fn(async (key: string) => {
        redisStore.delete(key);
        return 1;
      }),
      scanIterator: jest.fn(async function* () {
        // empty iterator
      }),
    };

    // Mock JWT & Config
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock_jwt_token_2026'),
      verify: jest.fn().mockReturnValue({ sub: 'user-e2e-01', email: 'test@example.com' }),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'secret';
        if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_123';
        if (key === 'RAZORPAY_KEY_SECRET') return 'rzp_secret_456';
        if (key === 'RAZORPAY_WEBHOOK_SECRET') return 'rzp_whsec_789';
        return null;
      }),
    };

    mockRazorpayProvider = {
      name: 'RAZORPAY',
      createOrder: jest.fn().mockResolvedValue({ id: 'order_rzp_mock', amount: 299900, currency: 'INR' }),
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
    };

    mockCodProvider = {
      name: 'COD',
      createOrder: jest.fn().mockResolvedValue({ id: 'order_cod_mock', amount: 299900, currency: 'INR' }),
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
    };

    // Mock Prisma Client
    mockPrisma = {
      user: {
        findUnique: jest.fn(async ({ where }: any) => {
          const u = db.users.find((usr: any) => usr.id === where.id || usr.email === where.email);
          if (u && !u.roles) {
            u.roles = [{ role: { name: 'Customer' } }];
          }
          return u || null;
        }),
        findFirst: jest.fn(async ({ where }: any) => {
          const u = db.users.find((usr: any) => usr.email === where?.email?.toLowerCase?.() || usr.email === where?.OR?.[0]?.email);
          if (u && !u.roles) {
            u.roles = [{ role: { name: 'Customer' } }];
          }
          return u || null;
        }),
        create: jest.fn(async ({ data }: any) => {
          const user = {
            id: `usr-${Date.now()}`,
            ...data,
            roles: [{ role: { name: 'Customer' } }],
            createdAt: new Date(),
          };
          db.users.push(user);
          return user;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const user = db.users.find((u: any) => u.id === where.id);
          Object.assign(user, data);
          return user;
        }),
      },
      role: {
        findUnique: jest.fn(async ({ where }: any) => {
          return db.roles.find((r: any) => r.name === where.name) || null;
        }),
        create: jest.fn(async ({ data }: any) => {
          db.roles.push(data);
          return data;
        }),
      },
      userRole: {
        create: jest.fn(async ({ data }: any) => data),
      },
      refreshToken: {
        create: jest.fn(async ({ data }: any) => data),
      },
      auditLog: {
        create: jest.fn(async ({ data }: any) => data),
      },
      address: {
        findFirst: jest.fn(async ({ where }: any) => {
          return db.addresses.find((a: any) => a.id === where.id) || null;
        }),
      },
      productVariant: {
        findMany: jest.fn(async ({ where }: any) => {
          return db.variants.filter((v: any) => where.id.in.includes(v.id));
        }),
        findUnique: jest.fn(async ({ where }: any) => {
          return db.variants.find((v: any) => v.id === where.id) || null;
        }),
      },
      coupon: {
        findUnique: jest.fn(async ({ where }: any) => {
          return db.coupons.find((c: any) => c.code === where.code) || null;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const coup = db.coupons.find((c: any) => c.id === where.id);
          Object.assign(coup, data);
          return coup;
        }),
      },
      couponUsage: {
        count: jest.fn(async () => db.couponUsages.length),
        create: jest.fn(async ({ data }: any) => {
          db.couponUsages.push(data);
          return data;
        }),
      },
      order: {
        count: jest.fn(async () => db.orders.length),
        findUnique: jest.fn(async ({ where }: any) => {
          return db.orders.find((o: any) => o.id === where.id || o.orderNumber === where.orderNumber) || null;
        }),
        findFirst: jest.fn(async ({ where }: any) => {
          return db.orders.find((o: any) => o.id === where.id || o.userId === where.userId) || null;
        }),
        create: jest.fn(async ({ data }: any) => {
          const order = { id: `d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44`, ...data, createdAt: new Date() };
          db.orders.push(order);
          return order;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const order = db.orders.find((o: any) => o.id === where.id);
          if (order) Object.assign(order, data);
          return order;
        }),
      },
      orderAddress: {
        create: jest.fn(async ({ data }: any) => {
          db.orderAddresses.push(data);
          return data;
        }),
      },
      orderItem: {
        createMany: jest.fn(async ({ data }: any) => {
          db.orderItems.push(...data);
          return { count: data.length };
        }),
      },
      orderStatusHistory: {
        create: jest.fn(async ({ data }: any) => {
          db.orderHistory.push(data);
          return data;
        }),
      },
      shipment: {
        upsert: jest.fn(async ({ create, update }: any) => {
          const shipment = { id: `shp-${Date.now()}`, ...create, ...update, deliveredAt: new Date() };
          db.shipments.push(shipment);
          return shipment;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const shipment = db.shipments.find((s: any) => s.id === where.id) || db.shipments[0];
          if (shipment) Object.assign(shipment, data);
          return shipment;
        }),
      },
      invoice: {
        findUnique: jest.fn(async ({ where }: any) => {
          return db.invoices.find((i: any) => i.orderId === where.orderId) || null;
        }),
        create: jest.fn(async ({ data }: any) => {
          const invoice = { id: `inv-doc-${Date.now()}`, ...data, createdAt: new Date() };
          db.invoices.push(invoice);
          return invoice;
        }),
      },
      cart: {
        findUnique: jest.fn(async ({ where }: any) => {
          return {
            id: `cart-${where.userId}`,
            userId: where.userId,
            items: db.cartItems.filter((i: any) => i.userId === where.userId),
          };
        }),
        create: jest.fn(async ({ data }: any) => ({
          id: `cart-${data.userId}`,
          userId: data.userId,
          items: [],
        })),
        update: jest.fn(async ({ where, data }: any) => ({
          id: `cart-${where.userId}`,
          userId: where.userId,
          ...data,
        })),
      },
      cartItem: {
        findMany: jest.fn(async ({ where }: any) => {
          return db.cartItems.filter((i: any) => i.userId === where.userId);
        }),
        findFirst: jest.fn(async ({ where }: any) => {
          return db.cartItems.find((i: any) => i.userId === where.userId && i.variantId === where.variantId) || null;
        }),
        findUnique: jest.fn(async () => null),
        upsert: jest.fn(async ({ create }: any) => {
          db.cartItems.push(create);
          return create;
        }),
        create: jest.fn(async ({ data }: any) => {
          const item = { id: `ci-${Date.now()}`, ...data };
          db.cartItems.push(item);
          return item;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const item = db.cartItems.find((i: any) => i.id === where.id);
          Object.assign(item, data);
          return item;
        }),
        deleteMany: jest.fn(async () => {
          db.cartItems = [];
          return { count: 1 };
        }),
      },
      inventoryItem: {
        update: jest.fn(async ({ where, data }: any) => {
          const item = db.inventoryItems.find((i: any) => i.id === where.id || i.variantId === where.variantId);
          if (item) {
            if (data.quantityOnHand?.increment) item.quantityOnHand += data.quantityOnHand.increment;
            if (data.quantityOnHand?.decrement) item.quantityOnHand -= data.quantityOnHand.decrement;
            if (data.quantity?.increment) item.quantityOnHand += data.quantity.increment;
          }
          return item;
        }),
      },
      stockMovement: {
        create: jest.fn(async ({ data }: any) => {
          db.stockMovements.push(data);
          return data;
        }),
      },
      paymentEvent: {
        findUnique: jest.fn(async ({ where }: any) => {
          return db.paymentEvents.find((e: any) => e.eventId === where.eventId) || null;
        }),
        create: jest.fn(async ({ data }: any) => {
          db.paymentEvents.push(data);
          return data;
        }),
      },
      payment: {
        create: jest.fn(async ({ data }: any) => data),
        updateMany: jest.fn(async () => ({ count: 1 })),
      },
      returnRequest: {
        create: jest.fn(async ({ data }: any) => {
          const ret = {
            id: `e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e55`,
            ...data,
            status: ReturnStatus.REQUESTED,
            items: [
              {
                id: 'item-ret-1',
                orderItemId: data.items.create[0].orderItemId,
                quantity: data.items.create[0].quantity,
                orderItem: {
                  id: data.items.create[0].orderItemId,
                  variantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                  unitPriceMinor: 299900,
                },
              },
            ],
            createdAt: new Date(),
          };
          db.returnRequests.push(ret);
          return ret;
        }),
        findUnique: jest.fn(async ({ where }: any) => {
          return db.returnRequests.find((r: any) => r.id === where.id) || null;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const ret = db.returnRequests.find((r: any) => r.id === where.id);
          if (ret) Object.assign(ret, data);
          return ret;
        }),
      },
      returnItem: {
        update: jest.fn(async ({ where, data }: any) => {
          return { id: where.id, ...data };
        }),
      },
      refund: {
        create: jest.fn(async ({ data }: any) => {
          const rfnd = {
            id: `f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f66`,
            ...data,
            status: RefundStatus.PENDING,
            createdAt: new Date(),
          };
          db.refunds.push(rfnd);
          return rfnd;
        }),
        findUnique: jest.fn(async ({ where }: any) => {
          return db.refunds.find((rf: any) => rf.id === where.id) || null;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const rfnd = db.refunds.find((rf: any) => rf.id === where.id);
          if (rfnd) Object.assign(rfnd, data);
          return rfnd;
        }),
      },
      ticket: {
        create: jest.fn(async ({ data }: any) => {
          const tkt = {
            id: `tkt-${Date.now()}`,
            ticketNumber: data.ticketNumber,
            customerId: data.customerId,
            orderId: data.orderId,
            category: data.category,
            priority: data.priority,
            status: data.status,
            subject: data.subject,
            slaDueAt: data.slaDueAt,
            messages: [],
            createdAt: new Date(),
          };
          db.tickets.push(tkt);
          return tkt;
        }),
        findUnique: jest.fn(async ({ where }: any) => {
          return db.tickets.find((t: any) => t.id === where.id) || null;
        }),
      },
      ticketMessage: {
        create: jest.fn(async ({ data }: any) => {
          db.ticketMessages.push(data);
          return data;
        }),
      },
      chatSession: {
        create: jest.fn(async ({ data }: any) => {
          const session = { id: `sess-${Date.now()}`, ...data, messages: [], createdAt: new Date() };
          db.chatSessions.push(session);
          return session;
        }),
        findUnique: jest.fn(async ({ where }: any) => {
          return db.chatSessions.find((s: any) => s.id === where.id) || null;
        }),
      },
      chatMessage: {
        create: jest.fn(async ({ data }: any) => {
          db.chatMessages.push(data);
          return data;
        }),
        findMany: jest.fn(async () => db.chatMessages),
      },
      faqItem: {
        findFirst: jest.fn(async () => null),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    // Mock Inventory Service
    mockInventory = {
      reserveStockForOrder: jest.fn(async () => {}),
      releaseReservation: jest.fn(async () => {}),
      deductStockOnPayment: jest.fn(async () => {}),
      releaseExpiredReservations: jest.fn(async () => 0),
    };

    // Instantiate Services
    authService = new AuthService(mockPrisma, mockRedis, mockJwtService, mockConfigService);
    couponsService = new CouponsService(mockPrisma);
    cartService = new CartService(mockPrisma, mockRedis, couponsService);
    checkoutService = new CheckoutService(mockPrisma, mockInventory, cartService, couponsService, mockEventEmitter);
    paymentsService = new PaymentsService(
      mockPrisma,
      mockInventory,
      mockRazorpayProvider,
      mockCodProvider,
      mockConfigService,
      mockEventEmitter
    );
    ordersService = new OrdersService(mockPrisma, mockInventory, mockEventEmitter);
    invoiceService = new InvoiceService(mockPrisma);
    returnsService = new ReturnsService(mockPrisma, mockEventEmitter);
    refundsService = new RefundsService(mockPrisma, mockEventEmitter);
    supportService = new SupportService(mockPrisma, mockEventEmitter);
    aiChatService = new AiChatService(mockPrisma, supportService);
  });

  it('1. Executes complete customer order, payment, fulfillment, invoice, return & support flow', async () => {
    // -------------------------------------------------------------
    // Step 1: User Account Registration & Address Setup
    // -------------------------------------------------------------
    const authResult = await authService.register({
      email: 'customer.e2e@example.com',
      password: 'SecurePassword123!',
      name: 'Vikram Singh',
      phone: '9876543210',
    });

    expect(authResult.user).toBeDefined();
    expect(authResult.user.email).toBe('customer.e2e@example.com');
    const customerId = authResult.user.id;

    // Customer shipping address in New Delhi (DL)
    const customerAddress = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
      userId: customerId,
      name: 'Vikram Singh',
      street: 'Connaught Place, Block B',
      city: 'New Delhi',
      state: 'DL',
      pincode: '110001',
      country: 'India',
      phone: '9876543210',
    };
    db.addresses.push(customerAddress);

    // -------------------------------------------------------------
    // Step 2: Guest Cart Creation & Authenticated Cart Merge
    // -------------------------------------------------------------
    // Guest adds item
    await cartService.addItem('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, undefined, 'guest_session_99');
    // Merge guest cart on login
    await cartService.mergeGuestCart(customerId, 'guest_session_99');
    expect(mockRedis.del).toHaveBeenCalledWith('cart:guest:guest_session_99');

    // -------------------------------------------------------------
    // Step 3: Coupon Application (10% off with max cap)
    // -------------------------------------------------------------
    const couponValidation = await couponsService.validateAndCalculateDiscount('WELCOME10', 299900, customerId);
    expect(couponValidation.valid).toBe(true);
    // 10% of 299900 = 29990 paise (₹299.90)
    expect(couponValidation.discountMinor).toBe(29990);

    // -------------------------------------------------------------
    // Step 4: Checkout & Order Creation with Stock Reservation
    // -------------------------------------------------------------
    // Setup mock cart items in db for user
    db.cartItems.push({
      id: 'ci-user-1',
      userId: customerId,
      variantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      quantity: 1,
      variant: db.variants[0],
    });

    const orderResult = await checkoutService.createOrder(customerId, {
      items: [
        {
          variantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          quantity: 1,
        },
      ],
      shippingAddressId: customerAddress.id,
      paymentMethod: PaymentProvider.RAZORPAY,
      couponCode: 'WELCOME10',
    });

    expect(orderResult).toBeDefined();
    expect(orderResult.orderNumber).toMatch(/^ORD-2026-\d{6}$/);
    expect(orderResult.status).toBe(OrderStatus.PENDING_PAYMENT);
    expect(orderResult.subtotalMinor).toBe(299900);
    expect(orderResult.discountMinor).toBe(29990);

    // Tax calculation verification: 18% GST (CGST 9% + SGST 9% for intra-state DL)
    expect(orderResult.taxMinor).toBeGreaterThan(0);
    expect(orderResult.shippingMinor).toBe(0); // Free shipping threshold ₹999 passed

    // Attach mock relation attributes to created order in db for downstream steps
    const orderInDb = db.orders.find((o: any) => o.id === orderResult.id);
    orderInDb.items = [
      {
        id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c44',
        orderId: orderResult.id,
        variantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        productName: 'Running Sneaker',
        variantTitle: 'Red / 42',
        sku: 'RUN-SNEAK-RED-42',
        title: 'Running Sneaker - Red / 42',
        quantity: 1,
        unitPriceMinor: 299900,
        totalMinor: 299900,
      },
    ];
    orderInDb.address = customerAddress;
    orderInDb.user = { id: customerId, name: 'Vikram Singh', email: 'customer.e2e@example.com' };
    orderInDb.payments = [];

    // -------------------------------------------------------------
    // Step 5: Razorpay Payment Confirmation & Idempotency
    // -------------------------------------------------------------
    await paymentsService.markPaid(
      orderResult.id,
      'pay_rzp_mock_txn_999',
      'order_rzp_mock',
      orderResult.totalMinor
    );

    expect(orderInDb.status).toBe(OrderStatus.CONFIRMED);

    // Idempotency: second markPaid call is a no-op and does not throw
    await paymentsService.markPaid(
      orderResult.id,
      'pay_rzp_mock_txn_999',
      'order_rzp_mock',
      orderResult.totalMinor
    );
    expect(orderInDb.status).toBe(OrderStatus.CONFIRMED);

    // -------------------------------------------------------------
    // Step 6: Order Fulfillment State Machine
    // -------------------------------------------------------------
    // Warehouse packs order
    const packedOrder = await ordersService.packOrder(orderResult.id, 'staff-warehouse-1');
    expect(packedOrder.status).toBe(OrderStatus.PACKED);

    // Order dispatch with Blue Dart AWB
    const shippedOrder = await ordersService.shipOrder(
      orderResult.id,
      {
        courierName: 'Blue Dart Express',
        trackingNumber: 'BLUEDART-88229911',
        trackingUrl: 'https://bluedart.com/track/BLUEDART-88229911',
      },
      'staff-warehouse-1'
    );
    expect(shippedOrder.status).toBe(OrderStatus.SHIPPED);

    // Delivery confirmation
    const deliveredOrder = await ordersService.deliverOrder(orderResult.id, 'courier-agent');
    expect(deliveredOrder.status).toBe(OrderStatus.DELIVERED);

    // Ensure shipment deliveredAt is set in mock db
    orderInDb.shipment = {
      courierName: 'Blue Dart Express',
      trackingNumber: 'BLUEDART-88229911',
      deliveredAt: new Date(),
    };

    // -------------------------------------------------------------
    // Step 7: GST Tax Invoice Generation & Validation
    // -------------------------------------------------------------
    const invoice = await invoiceService.getOrCreateInvoice(orderResult.id);
    expect(invoice).toBeDefined();
    expect(invoice.invoice.invoiceNumber).toMatch(/^INV-2026-\d{6}$/);
    expect(invoice.pdfBuffer).toBeDefined();

    // -------------------------------------------------------------
    // Step 8: Post-Purchase Return Request within 7-Day Window
    // -------------------------------------------------------------
    const returnRequest = await returnsService.createReturnRequest(customerId, {
      orderId: orderResult.id,
      reason: 'Size is slightly small, exchanging for size 43',
      items: [
        {
          orderItemId: orderInDb.items[0].id,
          quantity: 1,
        },
      ],
    });

    expect(returnRequest.status).toBe(ReturnStatus.REQUESTED);
    expect(returnRequest.orderId).toBe(orderResult.id);

    // Setup returnRequest in DB with relations for admin inspection
    const retInDb = db.returnRequests.find((r: any) => r.id === returnRequest.id);
    retInDb.order = orderInDb;
    retInDb.items = [
      {
        id: 'return-item-01',
        returnRequestId: returnRequest.id,
        orderItemId: orderInDb.items[0].id,
        quantity: 1,
        orderItem: orderInDb.items[0],
      },
    ];
    retInDb.refunds = [];

    // -------------------------------------------------------------
    // Step 9: Warehouse Quality Inspection & Automated Restock
    // -------------------------------------------------------------
    const inspectionResult = await returnsService.adminInspectReturn(
      returnRequest.id,
      {
        items: [
          {
            returnItemId: retInDb.items[0].id,
            condition: ReturnItemCondition.RESALEABLE,
          },
        ],
        approveRestock: true,
        notes: 'Item in mint condition with original tags and box.',
      },
      'staff-qc-lead'
    );

    expect(inspectionResult.status).toBe(ReturnStatus.INSPECTED);
    // Verifies stock movement record created for restocked inventory
    expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reason: StockMovementReason.RETURN_RESTOCK,
        }),
      })
    );

    // Verify pending refund generated in DB
    expect(db.refunds.length).toBeGreaterThan(0);
    const pendingRefund = db.refunds[0];
    pendingRefund.returnRequest = retInDb;
    pendingRefund.order = orderInDb;

    // -------------------------------------------------------------
    // Step 10: Multi-Tier Refund Approval & Gateway Payout
    // -------------------------------------------------------------
    // Tier 1: Support Lead approves refund
    const approvedRefund = await refundsService.approveRefund(
      pendingRefund.id,
      'lead-sarah-1',
      { approved: true, notes: 'Approved after QC verified condition' }
    );
    expect(approvedRefund.status).toBe(RefundStatus.APPROVED);

    // Tier 2: Finance Manager executes payment gateway refund
    const executedRefund = await refundsService.executeRefund(
      approvedRefund.id,
      'finance-director-1'
    );
    expect(executedRefund.status).toBe(RefundStatus.PROCESSED);
    expect(executedRefund.providerRefundId).toBeDefined();

    // -------------------------------------------------------------
    // Step 11: Customer Support Ticket with SLA Target
    // -------------------------------------------------------------
    const ticket = await supportService.createTicket(customerId, {
      subject: 'Inquiry regarding return refund confirmation',
      message: 'Hello, could you please confirm when the refund will reflect in my bank?',
      priority: TicketPriority.NORMAL,
      category: TicketCategory.RETURN_OR_REFUND,
      orderId: orderResult.id,
    });

    expect(ticket.ticketNumber).toMatch(/^TKT-2026-\d{6}$/);
    expect(ticket.slaDueAt).toBeInstanceOf(Date);

    // -------------------------------------------------------------
    // Step 12: Read-Only Customer-Scoped AI Assistant
    // -------------------------------------------------------------
    const aiChat = await aiChatService.sendMessage(
      customerId,
      null,
      `What is the status of my order ${orderResult.orderNumber}?`
    );

    expect(aiChat.message).toContain(orderResult.orderNumber);
    expect(aiChat.message).toContain('RETURNED');
  });
});
