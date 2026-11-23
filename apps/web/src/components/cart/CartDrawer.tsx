'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ArrowRight, Tag, ShieldCheck, Sparkles, Heart } from 'lucide-react';
import { useCartStore, useCartSummary } from '../../store/cart';
import { useWishlistStore } from '../../store/wishlist';

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const couponCode = useCartStore((s) => s.couponCode);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const {
    itemCount,
    subtotalMinor,
    discountMinor,
    taxMinor,
    shippingMinor,
    totalMinor,
  } = useCartSummary();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'MOONLET15') {
      const discount = Math.round(subtotalMinor * 0.15);
      applyCoupon(code, discount);
      setCouponInput('');
    } else if (code === 'WELCOME10') {
      const discount = Math.round(subtotalMinor * 0.1);
      applyCoupon(code, discount);
      setCouponInput('');
    } else if (code === 'FLAT500' && subtotalMinor >= 200000) {
      applyCoupon(code, 50000);
      setCouponInput('');
    } else {
      setCouponError('Invalid coupon. Try: MOONLET15 or WELCOME10');
    }
  };

  const handleMoveToWishlist = (item: any) => {
    useWishlistStore.getState().addItem({
      id: item.productId,
      slug: item.productId,
      name: item.name,
      category: 'Jewelry',
      finish: item.variantTitle || '18k Gold-Tone',
      material: 'Anti-Tarnish Stainless Steel',
      brand: 'Moonlet',
      priceMinor: item.priceMinor,
      mrpMinor: Math.round(item.priceMinor * 1.5),
      imageUrl: item.imageUrl,
      rating: 4.9,
      reviewsCount: 48,
      variantId: item.variantId,
      inStock: true,
    });
    removeItem(item.variantId);
  };

  if (!isOpen) return null;

  const freeShippingThreshold = 99900; // ₹999 in paise
  const progressPercent = Math.min(100, Math.round((subtotalMinor / freeShippingThreshold) * 100));
  const remainingForFreeShipping = Math.max(0, (freeShippingThreshold - subtotalMinor) / 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-ivory shadow-2xl flex flex-col border-l border-champagne/20">
          {/* Header */}
          <div className="px-6 py-5 border-b border-champagne/20 flex items-center justify-between bg-white/80 backdrop-blur-md">
            <div>
              <h2 className="font-serif text-xl font-medium text-charcoal tracking-wide">
                Your Shopping Bag
              </h2>
              <p className="text-[11px] text-charcoal/60 uppercase tracking-widest mt-0.5">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} selected
              </p>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 rounded-full text-charcoal/50 hover:text-charcoal hover:bg-blush/40 transition-colors focus:outline-none"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Free Shipping Milestone Indicator */}
          <div className="px-6 py-3 bg-blush/30 border-b border-champagne/20">
            {subtotalMinor >= freeShippingThreshold ? (
              <p className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-champagne shrink-0 fill-champagne/30" />
                <span>You unlocked <strong>FREE Express Shipping</strong> across India!</span>
              </p>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-charcoal/80">
                  <span>
                    Add <strong>₹{remainingForFreeShipping.toFixed(0)}</strong> more for <strong>FREE Shipping</strong>
                  </span>
                  <span className="font-bold text-champagne">{progressPercent}%</span>
                </div>
                <div className="w-full bg-champagne/20 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-champagne h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-champagne/15">
            {items.length === 0 ? (
              <div className="text-center py-20 px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-blush/40 border border-champagne/30 mx-auto flex items-center justify-center text-champagne">
                  <Sparkles className="h-8 w-8 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-charcoal">Your bag is empty</h3>
                  <p className="text-xs text-charcoal/60 mt-1 max-w-xs mx-auto">
                    Discover our everyday luxury jewelry handcrafted with skin-friendly materials.
                  </p>
                </div>
                <Link
                  href="/products"
                  onClick={closeCart}
                  className="inline-block px-6 py-2.5 bg-charcoal text-ivory text-xs font-medium uppercase tracking-wider rounded-xl hover:bg-champagne hover:text-charcoal transition-all shadow-sm"
                >
                  Explore New Arrivals
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.variantId} className="py-4 flex gap-4">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover bg-white border border-champagne/20 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-charcoal truncate">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-charcoal/60 mt-0.5">{item.variantTitle}</p>
                    <p className="text-sm font-semibold text-charcoal mt-1.5">
                      ₹{(item.priceMinor / 100).toLocaleString('en-IN')}
                    </p>

                    {/* Stepper & Remove */}
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center border border-champagne/30 rounded-lg bg-white/70">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 text-charcoal/60 hover:text-charcoal"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold text-charcoal">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.availableStock}
                          className="p-1 text-charcoal/60 hover:text-charcoal disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleMoveToWishlist(item)}
                          className="text-charcoal/50 hover:text-rose text-[11px] font-medium flex items-center gap-1 transition-colors"
                          title="Move to Wishlist"
                        >
                          <Heart className="h-3.5 w-3.5 fill-rose/20 text-rose" />
                          <span>Wishlist</span>
                        </button>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-charcoal/40 hover:text-rose text-[11px] flex items-center gap-1 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="border-t border-champagne/20 px-6 py-5 bg-white/90 backdrop-blur-md space-y-4">
              {/* Promo code input */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-champagne" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon (e.g. MOONLET15)"
                    className="w-full text-xs uppercase pl-9 pr-3 py-2 border border-champagne/30 rounded-xl bg-ivory/50 focus:outline-none focus:border-champagne"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-charcoal text-ivory rounded-xl text-xs font-medium hover:bg-champagne hover:text-charcoal transition-all uppercase tracking-wider"
                >
                  Apply
                </button>
              </form>

              {couponError && <p className="text-[11px] text-rose font-medium">{couponError}</p>}

              {couponCode && (
                <div className="flex items-center justify-between bg-champagne/15 text-charcoal text-xs px-3 py-1.5 rounded-lg border border-champagne/30">
                  <span>Applied code: <strong>{couponCode}</strong></span>
                  <button onClick={removeCoupon} className="text-charcoal/70 underline text-[10px]">Remove</button>
                </div>
              )}

              {/* Price summary table */}
              <div className="space-y-1.5 text-xs text-charcoal/70">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-charcoal">₹{(subtotalMinor / 100).toLocaleString('en-IN')}</span>
                </div>
                {discountMinor > 0 && (
                  <div className="flex justify-between text-rose font-medium">
                    <span>Discount applied</span>
                    <span>- ₹{(discountMinor / 100).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated GST (Included)</span>
                  <span>₹{(taxMinor / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shippingMinor === 0 ? <strong className="text-champagne font-semibold">FREE</strong> : `₹${shippingMinor / 100}`}</span>
                </div>
                <div className="flex justify-between text-sm font-serif font-bold text-charcoal pt-2 border-t border-champagne/20">
                  <span>Total Payable</span>
                  <span>₹{(totalMinor / 100).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-charcoal hover:bg-champagne hover:text-charcoal text-ivory font-medium text-xs uppercase tracking-wider rounded-xl transition-all shadow-md group"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Trust badges */}
              <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-charcoal/60">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-champagne" />
                  100% Secure
                </span>
                <span>•</span>
                <span>7-Day Easy Returns</span>
                <span>•</span>
                <span>COD Available</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
