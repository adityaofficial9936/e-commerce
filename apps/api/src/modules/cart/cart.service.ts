import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { RedisService } from '../../core/redis/redis.service.js';
import { CouponsService } from '../coupons/coupons.service.js';

export interface CartItemFormatted {
  id: string;
  variantId: string;
  productName: string;
  productSlug: string;
  variantTitle: string;
  sku: string;
  priceMinor: number;
  mrpMinor?: number | null;
  quantity: number;
  totalMinor: number;
  imageUrl?: string | null;
  availableStock: number;
  inStock: boolean;
}

export interface CartFormatted {
  id: string;
  isGuest: boolean;
  items: CartItemFormatted[];
  subtotalMinor: number;
  discountMinor: number;
  totalMinor: number;
  couponCode?: string | null;
  currency: string;
  itemCount: number;
}

interface GuestCartData {
  items: Array<{ variantId: string; quantity: number }>;
  couponCode?: string | null;
}

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly GUEST_CART_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly couponsService: CouponsService
  ) {}

  /**
   * Get active cart (either user database cart or guest Redis cart)
   */
  async getCart(userId?: string, guestSessionId?: string): Promise<CartFormatted> {
    if (userId) {
      return this.getUserCart(userId);
    }
    if (guestSessionId) {
      return this.getGuestCart(guestSessionId);
    }
    return this.getEmptyCart('anonymous', true);
  }

  /**
   * Add a variant to cart
   */
  async addItem(
    variantId: string,
    quantity: number,
    userId?: string,
    guestSessionId?: string
  ): Promise<CartFormatted> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    const available = Math.max(
      0,
      (variant.inventory?.quantity || 0) - (variant.inventory?.reserved || 0)
    );

    if (available <= 0) {
      throw new BadRequestException('This product variant is currently out of stock');
    }

    if (userId) {
      let cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) {
        cart = await this.prisma.cart.create({ data: { userId } });
      }

      const existingItem = await this.prisma.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId,
          },
        },
      });

      const newQty = existingItem ? existingItem.quantity + quantity : quantity;

      await this.prisma.cartItem.upsert({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId,
          },
        },
        update: { quantity: newQty },
        create: {
          cartId: cart.id,
          variantId,
          quantity: newQty,
        },
      });

      return this.getUserCart(userId);
    } else if (guestSessionId) {
      const guestCart = await this.readGuestCart(guestSessionId);
      const existing = guestCart.items.find((i) => i.variantId === variantId);

      if (existing) {
        existing.quantity += quantity;
      } else {
        guestCart.items.push({ variantId, quantity });
      }

      await this.saveGuestCart(guestSessionId, guestCart);
      return this.getGuestCart(guestSessionId);
    }

    throw new BadRequestException('Session identifier missing');
  }

  /**
   * Update quantity of an item
   */
  async updateItem(
    itemIdOrVariantId: string,
    quantity: number,
    userId?: string,
    guestSessionId?: string
  ): Promise<CartFormatted> {
    if (quantity <= 0) {
      return this.removeItem(itemIdOrVariantId, userId, guestSessionId);
    }

    if (userId) {
      const item = await this.prisma.cartItem.findFirst({
        where: {
          OR: [{ id: itemIdOrVariantId }, { variantId: itemIdOrVariantId }],
          cart: { userId },
        },
      });

      if (!item) {
        throw new NotFoundException('Cart item not found');
      }

      await this.prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity },
      });

      return this.getUserCart(userId);
    } else if (guestSessionId) {
      const guestCart = await this.readGuestCart(guestSessionId);
      const target = guestCart.items.find(
        (i) => i.variantId === itemIdOrVariantId
      );

      if (!target) {
        throw new NotFoundException('Item not found in guest cart');
      }

      target.quantity = quantity;
      await this.saveGuestCart(guestSessionId, guestCart);
      return this.getGuestCart(guestSessionId);
    }

    throw new BadRequestException('Session identifier missing');
  }

  /**
   * Remove an item from cart
   */
  async removeItem(
    itemIdOrVariantId: string,
    userId?: string,
    guestSessionId?: string
  ): Promise<CartFormatted> {
    if (userId) {
      await this.prisma.cartItem.deleteMany({
        where: {
          OR: [{ id: itemIdOrVariantId }, { variantId: itemIdOrVariantId }],
          cart: { userId },
        },
      });
      return this.getUserCart(userId);
    } else if (guestSessionId) {
      const guestCart = await this.readGuestCart(guestSessionId);
      guestCart.items = guestCart.items.filter(
        (i) => i.variantId !== itemIdOrVariantId
      );
      await this.saveGuestCart(guestSessionId, guestCart);
      return this.getGuestCart(guestSessionId);
    }

    throw new BadRequestException('Session identifier missing');
  }

  /**
   * Clear all items in cart
   */
  async clearCart(userId?: string, guestSessionId?: string) {
    if (userId) {
      const cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (cart) {
        await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
    } else if (guestSessionId) {
      await this.redis.del(`cart:guest:${guestSessionId}`);
    }
    return { message: 'Cart cleared' };
  }

  /**
   * Apply coupon code to cart
   */
  async applyCoupon(
    code: string,
    userId?: string,
    guestSessionId?: string
  ): Promise<CartFormatted> {
    const cart = await this.getCart(userId, guestSessionId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cannot apply coupon to an empty cart');
    }

    // Validate coupon against current cart subtotal
    await this.couponsService.validateAndCalculateDiscount(
      code,
      cart.subtotalMinor,
      userId
    );

    if (userId) {
      // Store in user cart metadata or Redis
      await this.redis.set(`cart:coupon:${userId}`, code.toUpperCase(), this.GUEST_CART_TTL);
      return this.getUserCart(userId);
    } else if (guestSessionId) {
      const guestCart = await this.readGuestCart(guestSessionId);
      guestCart.couponCode = code.toUpperCase();
      await this.saveGuestCart(guestSessionId, guestCart);
      return this.getGuestCart(guestSessionId);
    }

    throw new BadRequestException('Session identifier missing');
  }

  /**
   * Remove applied coupon
   */
  async removeCoupon(userId?: string, guestSessionId?: string): Promise<CartFormatted> {
    if (userId) {
      await this.redis.del(`cart:coupon:${userId}`);
      return this.getUserCart(userId);
    } else if (guestSessionId) {
      const guestCart = await this.readGuestCart(guestSessionId);
      guestCart.couponCode = null;
      await this.saveGuestCart(guestSessionId, guestCart);
      return this.getGuestCart(guestSessionId);
    }
    throw new BadRequestException('Session identifier missing');
  }

  /**
   * Merge guest items into user cart when guest logs in
   */
  async mergeGuestCart(userId: string, guestSessionId: string): Promise<CartFormatted> {
    const guestCart = await this.readGuestCart(guestSessionId);
    if (guestCart.items.length === 0) {
      return this.getUserCart(userId);
    }

    let cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    for (const guestItem of guestCart.items) {
      const existing = await this.prisma.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId: guestItem.variantId,
          },
        },
      });

      const quantity = existing ? existing.quantity + guestItem.quantity : guestItem.quantity;

      await this.prisma.cartItem.upsert({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId: guestItem.variantId,
          },
        },
        update: { quantity },
        create: {
          cartId: cart.id,
          variantId: guestItem.variantId,
          quantity,
        },
      });
    }

    // Merge coupon if guest had one
    if (guestCart.couponCode) {
      await this.redis.set(`cart:coupon:${userId}`, guestCart.couponCode, this.GUEST_CART_TTL);
    }

    // Purge guest cart from Redis
    await this.redis.del(`cart:guest:${guestSessionId}`);
    this.logger.log(`Merged guest cart ${guestSessionId} into user ${userId}`);

    return this.getUserCart(userId);
  }

  // ----------------------------------------------------
  // INTERNAL HELPERS
  // ----------------------------------------------------

  private async getUserCart(userId: string): Promise<CartFormatted> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { take: 1, orderBy: { sortOrder: 'asc' } },
                  },
                },
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return this.getEmptyCart(cart?.id || 'empty', false);
    }

    const appliedCoupon = await this.redis.get(`cart:coupon:${userId}`);

    return this.formatCartItems(
      cart.id,
      false,
      cart.items.map((i) => ({
        id: i.id,
        variantId: i.variantId,
        quantity: i.quantity,
        variant: i.variant,
      })),
      appliedCoupon,
      userId
    );
  }

  private async getGuestCart(guestSessionId: string): Promise<CartFormatted> {
    const guestCart = await this.readGuestCart(guestSessionId);
    if (guestCart.items.length === 0) {
      return this.getEmptyCart(guestSessionId, true);
    }

    const variantIds = guestCart.items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { sortOrder: 'asc' } },
          },
        },
        inventory: true,
      },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const items = guestCart.items
      .map((item) => {
        const variant = variantMap.get(item.variantId);
        if (!variant) return null;
        return {
          id: `guest_${item.variantId}`,
          variantId: item.variantId,
          quantity: item.quantity,
          variant,
        };
      })
      .filter((i): i is NonNullable<typeof i> => i !== null);

    return this.formatCartItems(
      guestSessionId,
      true,
      items,
      guestCart.couponCode
    );
  }

  private async formatCartItems(
    cartId: string,
    isGuest: boolean,
    rawItems: Array<{
      id: string;
      variantId: string;
      quantity: number;
      variant: any;
    }>,
    couponCode?: string | null,
    userId?: string
  ): Promise<CartFormatted> {
    let subtotalMinor = 0;
    let itemCount = 0;

    const items: CartItemFormatted[] = rawItems.map((item) => {
      const v = item.variant;
      const quantity = v.inventory?.quantity || 0;
      const reserved = v.inventory?.reserved || 0;
      const availableStock = Math.max(0, quantity - reserved);

      const itemTotal = v.priceMinor * item.quantity;
      subtotalMinor += itemTotal;
      itemCount += item.quantity;

      return {
        id: item.id,
        variantId: item.variantId,
        productName: v.product.name,
        productSlug: v.product.slug,
        variantTitle: v.title,
        sku: v.sku,
        priceMinor: v.priceMinor,
        mrpMinor: v.mrpMinor || null,
        quantity: item.quantity,
        totalMinor: itemTotal,
        imageUrl: v.product.images[0]?.url || null,
        availableStock,
        inStock: availableStock >= item.quantity,
      };
    });

    let discountMinor = 0;
    if (couponCode && subtotalMinor > 0) {
      try {
        const disc = await this.couponsService.validateAndCalculateDiscount(
          couponCode,
          subtotalMinor,
          userId
        );
        discountMinor = disc.discountMinor;
      } catch {
        couponCode = null; // Invalidate coupon if cart conditions no longer met
      }
    }

    const totalMinor = Math.max(0, subtotalMinor - discountMinor);

    return {
      id: cartId,
      isGuest,
      items,
      subtotalMinor,
      discountMinor,
      totalMinor,
      couponCode: couponCode || null,
      currency: 'INR',
      itemCount,
    };
  }

  private async readGuestCart(guestSessionId: string): Promise<GuestCartData> {
    const raw = await this.redis.get(`cart:guest:${guestSessionId}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return { items: [] };
      }
    }
    return { items: [] };
  }

  private async saveGuestCart(guestSessionId: string, cart: GuestCartData) {
    await this.redis.set(
      `cart:guest:${guestSessionId}`,
      JSON.stringify(cart),
      this.GUEST_CART_TTL
    );
  }

  private getEmptyCart(id: string, isGuest: boolean): CartFormatted {
    return {
      id,
      isGuest,
      items: [],
      subtotalMinor: 0,
      discountMinor: 0,
      totalMinor: 0,
      couponCode: null,
      currency: 'INR',
      itemCount: 0,
    };
  }
}
