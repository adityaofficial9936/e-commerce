'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowLeft, Sparkles, Star } from 'lucide-react';
import { useWishlistStore, WishlistItem } from '../../store/wishlist';
import { useCartStore } from '../../store/cart';

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const handleMoveToCart = (item: WishlistItem) => {
    addItem({
      variantId: item.variantId,
      productId: item.id,
      name: item.name,
      variantTitle: `${item.finish} Edition`,
      imageUrl: item.imageUrl,
      priceMinor: item.priceMinor,
      availableStock: 25,
    });
    removeItem(item.id);
    openCart();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-charcoal font-sans py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-semibold text-charcoal/60 hover:text-champagne transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Continue Shopping</span>
          </Link>

          {items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-xs text-charcoal/50 hover:text-rose transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Wishlist</span>
            </button>
          )}
        </div>

        {/* Page Header */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-champagne/15 border border-champagne/30 text-champagne-dark text-xs font-semibold">
            <Heart className="h-3.5 w-3.5 fill-rose text-rose" />
            <span>Curated Desires</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-charcoal tracking-wide">
            My Wishlist ({items.length})
          </h1>
          <p className="text-xs sm:text-sm text-charcoal/70">
            Save your favorite anti-tarnish jewelry pieces and move them to your bag anytime.
          </p>
        </div>

        {/* Wishlist Grid or Empty State */}
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-champagne/20 p-12 sm:p-16 text-center max-w-lg mx-auto shadow-sm space-y-5">
            <div className="w-16 h-16 rounded-full bg-blush/40 border border-champagne/30 mx-auto flex items-center justify-center text-champagne">
              <Heart className="h-8 w-8 stroke-[1.5] text-champagne fill-none" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-medium text-charcoal">
                Your wishlist is empty
              </h2>
              <p className="text-xs text-charcoal/60 mt-2 leading-relaxed">
                Explore our everyday luxury collection of 18k gold-tone earrings, necklaces, rings, and watches, and tap the heart icon to save your favorites.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-charcoal text-ivory text-xs font-bold hover:bg-champagne-dark transition-all shadow-md"
            >
              <Sparkles className="h-4 w-4 text-champagne" />
              <span>Explore Collection</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-champagne/25 shadow-xs overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                {/* Image & Heart Remove */}
                <div className="relative aspect-square overflow-hidden bg-white">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove from wishlist"
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-xs text-rose shadow-sm hover:scale-110 transition-transform"
                  >
                    <Heart className="h-4 w-4 fill-rose" />
                  </button>
                  {item.tag && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-charcoal text-ivory uppercase tracking-wider">
                      {item.tag}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-champagne-dark tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="font-serif text-sm font-medium text-charcoal line-clamp-2 leading-snug">
                      <Link href={`/products/${item.slug}`} className="hover:text-champagne transition-colors">
                        {item.name}
                      </Link>
                    </h3>
                    <p className="text-[11px] text-charcoal/60 line-clamp-1">{item.finish}</p>
                  </div>

                  <div className="pt-2 border-t border-champagne/15 space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-charcoal text-sm">
                        ₹{(item.priceMinor / 100).toLocaleString('en-IN')}
                      </span>
                      {item.mrpMinor > item.priceMinor && (
                        <span className="text-xs text-charcoal/40 line-through">
                          ₹{(item.mrpMinor / 100).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleMoveToCart(item)}
                      className="w-full py-2.5 px-3 rounded-xl bg-charcoal text-ivory hover:bg-champagne-dark text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 text-champagne" />
                      <span>Move to Bag</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
