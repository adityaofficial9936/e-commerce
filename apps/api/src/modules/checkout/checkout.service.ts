import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateOrderDto, OrderStatus } from '@ecommerce/contracts';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { CartService } from '../cart/cart.service.js';
import { CouponsService } from '../coupons/coupons.service.js';

export interface CheckoutCalculation {
  subtotalMinor: number;
  shippingMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  currency: string;
  isFreeShipping: boolean;
  couponCode?: string | null;
}

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  private readonly FREE_SHIPPING_THRESHOLD = 99900; // Free shipping over ₹999
  private readonly STANDARD_SHIPPING_FEE = 9900;    // ₹99 standard shipping
  private readonly GST_RATE = 0.18;                 // 18% GST standard

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly cartService: CartService,
    private readonly couponsService: CouponsService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Preview checkout calculation (shipping fee, GST tax, discounts, final total)
   */
  async calculateCheckout(
    userId: string,
    shippingAddressId: string,
    couponCode?: string
  ): Promise<CheckoutCalculation> {
    const address = await this.prisma.address.findFirst({
      where: { id: shippingAddressId, userId, deletedAt: null },
    });

    if (!address) {
      throw new NotFoundException('Shipping address not found or does not belong to user');
    }

    const cart = await this.cartService.getCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cannot proceed to checkout with an empty cart');
    }

    const subtotalMinor = cart.subtotalMinor;

    // Calculate coupon discount
    let discountMinor = 0;
    const activeCoupon = couponCode || cart.couponCode;
    if (activeCoupon) {
      try {
        const disc = await this.couponsService.validateAndCalculateDiscount(
          activeCoupon,
          subtotalMinor,
          userId
        );
        discountMinor = disc.discountMinor;
      } catch (err: any) {
        this.logger.warn(`Coupon ${activeCoupon} invalid during checkout: ${err.message}`);
      }
    }

    // Free shipping threshold check
    const isFreeShipping = subtotalMinor >= this.FREE_SHIPPING_THRESHOLD;
    const shippingMinor = isFreeShipping ? 0 : this.STANDARD_SHIPPING_FEE;

    // 18% GST on taxable base (subtotal - discount)
    const taxableBase = Math.max(0, subtotalMinor - discountMinor);
    const taxMinor = Math.round(taxableBase * this.GST_RATE);

    const totalMinor = Math.max(0, taxableBase + shippingMinor + taxMinor);

    return {
      subtotalMinor,
      shippingMinor,
      taxMinor,
      discountMinor,
      totalMinor,
      currency: 'INR',
      isFreeShipping,
      couponCode: activeCoupon,
    };
  }

  /**
   * Create order, snapshot data, and lock stock with 15-minute reservation inside a single transaction
   */
  async createOrder(userId: string, dto: CreateOrderDto) {
    const address = await this.prisma.address.findFirst({
      where: { id: dto.shippingAddressId, userId, deletedAt: null },
    });

    if (!address) {
      throw new NotFoundException('Shipping address not found');
    }

    // Verify variants and fetch snapshot info
    const variantIds = dto.items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: true,
      },
    });

    if (variants.length !== dto.items.length) {
      throw new BadRequestException('One or more product variants in order are invalid');
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // Calculate pricing
    let subtotalMinor = 0;
    const orderItemsData = dto.items.map((item) => {
      const v = variantMap.get(item.variantId)!;
      const itemTotal = v.priceMinor * item.quantity;
      subtotalMinor += itemTotal;

      return {
        variantId: item.variantId,
        productName: v.product.name,
        variantTitle: v.title,
        sku: v.sku,
        unitPriceMinor: v.priceMinor,
        quantity: item.quantity,
        totalMinor: itemTotal,
      };
    });

    let discountMinor = 0;
    if (dto.couponCode) {
      const disc = await this.couponsService.validateAndCalculateDiscount(
        dto.couponCode,
        subtotalMinor,
        userId
      );
      discountMinor = disc.discountMinor;
    }

    const isFreeShipping = subtotalMinor >= this.FREE_SHIPPING_THRESHOLD;
    const shippingMinor = isFreeShipping ? 0 : this.STANDARD_SHIPPING_FEE;
    const taxableBase = Math.max(0, subtotalMinor - discountMinor);
    const taxMinor = Math.round(taxableBase * this.GST_RATE);
    const totalMinor = Math.max(0, taxableBase + shippingMinor + taxMinor);

    // Sequential human-readable order number: ORD-YYYY-XXXXXX
    const year = new Date().getFullYear();
    const orderCount = await this.prisma.order.count();
    const orderNumber = `ORD-${year}-${String(orderCount + 1).padStart(6, '0')}`;

    // Execute entire checkout inside one ACID PostgreSQL transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Create Order record
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: OrderStatus.PENDING_PAYMENT,
          subtotalMinor,
          shippingMinor,
          taxMinor,
          discountMinor,
          totalMinor,
          currency: 'INR',
          paymentMethod: dto.paymentMethod,
          couponCode: dto.couponCode,
        },
      });

      // 2. Lock inventory rows and reserve stock with 15-minute expiry
      await this.inventoryService.reserveStockForOrder(
        tx,
        createdOrder.id,
        dto.items
      );

      // 3. Snapshot address in order_addresses (immutable record)
      await tx.orderAddress.create({
        data: {
          orderId: createdOrder.id,
          name: address.name,
          phone: address.phone,
          street: address.street,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country,
        },
      });

      // 4. Snapshot order items (product name, sku, purchase price)
      await tx.orderItem.createMany({
        data: orderItemsData.map((item) => ({
          orderId: createdOrder.id,
          ...item,
        })),
      });

      // 5. Initial status history audit
      await tx.orderStatusHistory.create({
        data: {
          orderId: createdOrder.id,
          toStatus: OrderStatus.PENDING_PAYMENT,
          notes: 'Order created at checkout with 15-minute stock reservation',
          changedBy: userId,
        },
      });

      // 6. Record coupon usage if applied
      if (dto.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: dto.couponCode.toUpperCase() },
        });
        if (coupon) {
          await tx.couponUsage.create({
            data: {
              couponId: coupon.id,
              userId,
              orderId: createdOrder.id,
            },
          });
        }
      }

      // 7. Clear user's active shopping cart
      await tx.cartItem.deleteMany({
        where: { cart: { userId } },
      });

      return createdOrder;
    });

    this.logger.log(`Created order ${order.orderNumber} for user ${userId}`);

    // Emit domain event
    this.eventEmitter.emit('order.created', { orderId: order.id, userId });

    return this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: true,
        address: true,
        reservations: true,
      },
    });
  }
}
