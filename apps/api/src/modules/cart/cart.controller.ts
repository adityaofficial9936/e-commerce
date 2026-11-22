import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AddToCartDto, UpdateCartItemDto, ApplyCouponDto } from '@ecommerce/contracts';
import { CartService } from './cart.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get current shopping cart for user or guest' })
  async getCart(
    @CurrentUser('id') userId: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const guestId = this.getOrCreateGuestSession(req, res, userId);
    return this.cartService.getCart(userId, guestId);
  }

  @Public()
  @Post('items')
  @ApiOperation({ summary: 'Add product variant to cart' })
  async addItem(
    @CurrentUser('id') userId: string | undefined,
    @Body() dto: AddToCartDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const guestId = this.getOrCreateGuestSession(req, res, userId);
    return this.cartService.addItem(dto.variantId, dto.quantity, userId, guestId);
  }

  @Public()
  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateItem(
    @CurrentUser('id') userId: string | undefined,
    @Param('id') itemIdOrVariantId: string,
    @Body() dto: UpdateCartItemDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const guestId = this.getOrCreateGuestSession(req, res, userId);
    return this.cartService.updateItem(itemIdOrVariantId, dto.quantity, userId, guestId);
  }

  @Public()
  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove an item from cart' })
  async removeItem(
    @CurrentUser('id') userId: string | undefined,
    @Param('id') itemIdOrVariantId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const guestId = this.getOrCreateGuestSession(req, res, userId);
    return this.cartService.removeItem(itemIdOrVariantId, userId, guestId);
  }

  @Public()
  @Delete()
  @ApiOperation({ summary: 'Clear all items in shopping cart' })
  async clearCart(
    @CurrentUser('id') userId: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const guestId = this.getOrCreateGuestSession(req, res, userId);
    return this.cartService.clearCart(userId, guestId);
  }

  @Public()
  @Post('coupon')
  @ApiOperation({ summary: 'Apply discount coupon to cart' })
  async applyCoupon(
    @CurrentUser('id') userId: string | undefined,
    @Body() dto: ApplyCouponDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const guestId = this.getOrCreateGuestSession(req, res, userId);
    return this.cartService.applyCoupon(dto.code, userId, guestId);
  }

  @Public()
  @Delete('coupon')
  @ApiOperation({ summary: 'Remove applied coupon from cart' })
  async removeCoupon(
    @CurrentUser('id') userId: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const guestId = this.getOrCreateGuestSession(req, res, userId);
    return this.cartService.removeCoupon(userId, guestId);
  }

  @ApiBearerAuth()
  @Post('merge')
  @ApiOperation({ summary: 'Merge guest cart items into user cart upon login' })
  async mergeGuestCart(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const guestSessionId = req.cookies?.['cart_session'] || (req.headers['x-cart-session'] as string);
    if (!guestSessionId) {
      return this.cartService.getCart(userId);
    }

    const merged = await this.cartService.mergeGuestCart(userId, guestSessionId);
    res.clearCookie('cart_session');
    return merged;
  }

  private getOrCreateGuestSession(
    req: Request,
    res: Response,
    userId?: string
  ): string | undefined {
    if (userId) return undefined;

    let guestId =
      req.cookies?.['cart_session'] || (req.headers['x-cart-session'] as string);

    if (!guestId) {
      guestId = randomUUID();
      res.cookie('cart_session', guestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
      });
    }

    return guestId;
  }
}
