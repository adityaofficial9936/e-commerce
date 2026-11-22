'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star,
  ShoppingBag,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  Sparkles,
  Share2,
  Heart,
  MessageSquare,
  ZoomIn,
  X as XIcon,
  ChevronRight,
  MapPin,
  Clock,
  Droplets,
  PackageCheck,
} from 'lucide-react';
import { useCartStore } from '../../../store/cart';
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogImage,
  MorphingDialogContainer,
} from '@/components/core/morphing-dialog';

const DEFAULT_GALLERY = [
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1611591475819-79b7b9e78a63?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=1000&auto=format&fit=crop&q=80',
];

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const [productData, setProductData] = useState<any>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedFinish, setSelectedFinish] = useState('18k Champagne Gold');
  const [selectedSize, setSelectedSize] = useState('Standard (Adjustable)');
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'SHIPPING' | 'CARE' | 'REVIEWS'>('DETAILS');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  // Pincode checker state
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);

  // Reviews state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewsList, setReviewsList] = useState([
    {
      id: 'rev-1',
      author: 'Ananya S. (Mumbai)',
      rating: 5,
      date: '18 Nov 2026',
      title: 'Looks like high-end fine jewelry!',
      comment: 'The 18k gold-tone shine is so subtle and elegant—not brassy or yellow at all. Wore it daily for two weeks and zero skin discoloration. Truly hypoallergenic!',
    },
    {
      id: 'rev-2',
      author: 'Pooja R. (Bengaluru)',
      rating: 5,
      date: '12 Nov 2026',
      title: 'Packaging & quality exceeded expectations',
      comment: 'Came in a beautiful velvet pouch. The clasp is sturdy and the finish catches the light beautifully. Definitely ordering the matching earrings next.',
    },
    {
      id: 'rev-3',
      author: 'Meera V. (Delhi NCR)',
      rating: 5,
      date: '04 Nov 2026',
      title: 'Delivered in 48 hours via Blue Dart',
      comment: 'Super fast delivery and cash on delivery was completely smooth. Premium feel at such an affordable price.',
    },
  ]);

  // Fetch live product data matching the slug or id from the shared catalog
  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const found = data.find(
            (p) =>
              p.slug === params.slug ||
              p.id === params.slug ||
              p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === params.slug
          );
          if (found) {
            setProductData(found);
            if (found.variant) {
              setSelectedSize(found.variant);
            }
          }
        }
      })
      .catch((err) => console.error('Error fetching product detail:', err));
  }, [params.slug]);

  const product = productData || {
    id: 'prod-moonlet-1',
    name: 'Lumina Liquid Gold Herringbone Snake Chain',
    category: 'Necklaces',
    brand: 'Moonlet',
    finish: '18k Gold-Tone',
    material: 'Hypoallergenic 316L Surgical Stainless Steel with 18k PVD Coating',
    priceMinor: 129900,
    mrpMinor: 249900,
    rating: 4.9,
    reviewsCount: reviewsList.length + 112,
    availableStock: 14,
    sku: `MLT-NECK-${selectedFinish.substring(0, 3).toUpperCase()}`,
    description:
      'The Lumina Snake Chain embodies fluid everyday luxury. Crafted with 316L surgical stainless steel and finished with high-durability 18k gold PVD vacuum coating, this piece lies smoothly against the collarbone without tangling. 100% skin-safe, nickel-free, and lead-free.',
  };

  const galleryImages =
    productData?.images && productData.images.length > 0
      ? productData.images.map((img: any) => (typeof img === 'string' ? img : img.url))
      : productData?.imageUrl
      ? [productData.imageUrl]
      : DEFAULT_GALLERY;

  const finishes = [
    { name: '18k Champagne Gold', color: '#C9A66B' },
    { name: 'Blush Rose Gold', color: '#D88C9A' },
    { name: 'Silver Stainless Steel', color: '#E2E8F0' },
  ];

  const sizes = ['Standard (40cm + 5cm Extender)', 'Layering Long (45cm + 5cm)'];

  const handleAddToCart = () => {
    addItem({
      variantId: `var-${product.id}-${selectedFinish.replace(/\s+/g, '')}`,
      productId: product.id,
      name: product.name,
      variantTitle: `${selectedFinish} • ${selectedSize}`,
      imageUrl: galleryImages[activeImageIdx] || galleryImages[0],
      priceMinor: product.priceMinor,
      availableStock: product.availableStock || 20,
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
    openCart();
  };

  const handleBuyNow = () => {
    addItem({
      variantId: `var-${product.id}-${selectedFinish.replace(/\s+/g, '')}`,
      productId: product.id,
      name: product.name,
      variantTitle: `${selectedFinish} • ${selectedSize}`,
      imageUrl: galleryImages[activeImageIdx] || galleryImages[0],
      priceMinor: product.priceMinor,
      availableStock: product.availableStock || 20,
    });
    router.push('/checkout');
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode.trim() || pincode.trim().length !== 6) {
      setPincodeStatus('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    const today = new Date();
    today.setDate(today.getDate() + 3);
    const dateStr = today.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    setPincodeStatus(`Available! Free delivery by ${dateStr} via Blue Dart Express. Cash on Delivery is active.`);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) return;

    setReviewsList((prev) => [
      {
        id: `rev-${Date.now()}`,
        author: `${reviewerName.trim()} (Verified Buyer)`,
        rating: reviewRating,
        date: 'Today',
        title: 'Verified Customer Review',
        comment: reviewComment.trim(),
      },
      ...prev,
    ]);

    setReviewerName('');
    setReviewComment('');
  };

  const discount = Math.round(((product.mrpMinor - product.priceMinor) / product.mrpMinor) * 100);

  return (
    <div className="bg-ivory min-h-screen text-charcoal font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="text-xs text-charcoal/60 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-charcoal transition-colors">Jewelry</Link>
          <span>/</span>
          <span className="text-champagne font-semibold truncate">{product.name}</span>
        </nav>

        {/* Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {/* Left: Gallery with MorphingDialog Zoom */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-blush/20 rounded-3xl overflow-hidden border border-champagne/30 shadow-xs group">
              <MorphingDialog transition={{ duration: 0.35, ease: 'easeInOut' }}>
                <MorphingDialogTrigger className="w-full h-full block cursor-zoom-in">
                  <MorphingDialogImage
                    src={galleryImages[activeImageIdx] || galleryImages[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-charcoal/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 bg-white/95 backdrop-blur-xs rounded-full text-charcoal shadow-md flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
                      <ZoomIn className="h-4 w-4 text-champagne" />
                      Click to View Fullscreen
                    </span>
                  </div>
                </MorphingDialogTrigger>

                <MorphingDialogContainer>
                  <MorphingDialogContent className="relative bg-ivory rounded-3xl overflow-hidden border border-champagne/40 shadow-2xl p-4">
                    <MorphingDialogImage
                      src={galleryImages[activeImageIdx] || galleryImages[0]}
                      alt={`${product.name} Fullscreen Inspection`}
                      className="h-auto w-full max-w-[92vw] lg:max-w-[75vw] max-h-[85vh] object-contain rounded-2xl mx-auto"
                    />
                  </MorphingDialogContent>
                  <MorphingDialogClose className="fixed right-6 top-6 h-fit w-fit rounded-full bg-charcoal text-ivory p-2.5 shadow-2xl hover:bg-champagne hover:text-charcoal transition-colors">
                    <XIcon className="h-5 w-5" />
                  </MorphingDialogClose>
                </MorphingDialogContainer>
              </MorphingDialog>

              {/* Tag & Wishlist */}
              {discount > 0 && (
                <span className="pointer-events-none absolute top-4 left-4 bg-charcoal text-ivory text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs z-10">
                  {discount}% OFF
                </span>
              )}

              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-xs rounded-full shadow-xs text-charcoal/70 hover:text-rose hover:scale-110 transition-all z-20 cursor-pointer"
                aria-label="Save to Wishlist"
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-rose text-rose' : ''}`} />
              </button>
            </div>

            {/* Thumbnail Selector */}
            <div className="flex gap-3">
              {galleryImages.map((img: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImageIdx === idx
                      ? 'border-champagne ring-2 ring-champagne/20 shadow-xs'
                      : 'border-champagne/20 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Details & Purchase Form */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-champagne uppercase tracking-widest mb-1.5">
                <span>{product.brand}</span>
                <span>•</span>
                <span>{product.category}</span>
                <span>•</span>
                <span>{product.finish || '18k Gold-Tone'}</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal tracking-tight">
                {product.name}
              </h1>
              <p className="text-[11px] text-charcoal/50 mt-1 font-mono">SKU: {product.sku}</p>

              {/* Rating & Stock */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-amber-500 bg-white px-3 py-1 rounded-full border border-champagne/20 shadow-2xs">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-charcoal">{product.rating}</span>
                  <span className="text-charcoal/40">({product.reviewsCount} reviews)</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <Check className="h-3 w-3" />
                  In Stock • Dispatches in 24h
                </span>
              </div>
            </div>

            {/* Price Block */}
            <div className="p-4 bg-white/80 rounded-2xl border border-champagne/20 flex flex-wrap items-baseline gap-3 shadow-2xs">
              <span className="font-serif text-3xl font-bold text-charcoal">
                ₹{(product.priceMinor / 100).toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-charcoal/40 line-through">
                ₹{(product.mrpMinor / 100).toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold text-rose bg-rose/10 px-2.5 py-0.5 rounded-full">
                Save ₹{((product.mrpMinor - product.priceMinor) / 100).toLocaleString('en-IN')} ({discount}%)
              </span>
              <p className="w-full text-[11px] text-charcoal/60 mt-0.5">
                Inclusive of all taxes. Free express shipping on this order.
              </p>
            </div>

            {/* Material Transparency Summary */}
            <div className="p-4 bg-blush/25 rounded-2xl border border-champagne/20 space-y-2 text-xs text-charcoal/80">
              <div className="flex items-center gap-2 font-semibold text-charcoal">
                <Sparkles className="h-4 w-4 text-champagne" />
                <span>Materials &amp; Skin-Safety Transparency</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {product.material || 'Crafted from hypoallergenic 316L stainless steel with long-lasting 18k gold PVD vacuum plating. 100% nickel-free & lead-free.'}
              </p>
            </div>

            {/* Finish Selector */}
            <div>
              <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-2">
                Color Finish: <strong className="text-champagne">{selectedFinish}</strong>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {finishes.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setSelectedFinish(f.name)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      selectedFinish === f.name
                        ? 'border-champagne bg-white text-charcoal ring-2 ring-champagne/20 shadow-2xs'
                        : 'border-champagne/20 bg-white/50 hover:bg-white text-charcoal/70'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: f.color }}
                    />
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                  Select Size / Length
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer text-center ${
                      selectedSize === s
                        ? 'bg-charcoal text-ivory shadow-xs'
                        : 'bg-white border border-champagne/20 text-charcoal/80 hover:bg-blush/20'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 bg-charcoal hover:bg-champagne hover:text-charcoal text-ivory font-medium text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
              >
                <ShoppingBag className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span>Add to Bag</span>
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-3.5 bg-champagne hover:bg-champagne/90 text-charcoal font-medium text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Buy Now • Express Checkout</span>
              </button>
            </div>

            {/* Pincode Delivery Check */}
            <div className="pt-2">
              <form onSubmit={handleCheckPincode} className="p-4 bg-white/80 rounded-2xl border border-champagne/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-charcoal">
                  <MapPin className="h-4 w-4 text-champagne" />
                  <span>Delivery Estimate by Pincode</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit PIN (e.g. 400001)"
                    className="flex-1 px-3 py-2 text-xs border border-champagne/30 rounded-xl bg-ivory/50 focus:outline-none focus:border-champagne"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-charcoal text-ivory text-xs font-medium uppercase tracking-wider rounded-xl hover:bg-champagne hover:text-charcoal transition-all"
                  >
                    Check
                  </button>
                </div>
                {pincodeStatus && (
                  <p className="text-[11px] text-charcoal/80 font-medium pt-1">
                    {pincodeStatus}
                  </p>
                )}
              </form>
            </div>

            {/* 4 Trust Badges */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 text-center text-xs">
              <div className="p-3 bg-white/60 rounded-xl border border-champagne/20">
                <Truck className="h-4 w-4 text-champagne mx-auto mb-1" />
                <p className="font-semibold text-charcoal text-[11px]">Free Shipping</p>
                <p className="text-[10px] text-charcoal/50">Orders &gt; ₹999</p>
              </div>
              <div className="p-3 bg-white/60 rounded-xl border border-champagne/20">
                <RotateCcw className="h-4 w-4 text-champagne mx-auto mb-1" />
                <p className="font-semibold text-charcoal text-[11px]">7-Day Returns</p>
                <p className="text-[10px] text-charcoal/50">Easy pickup</p>
              </div>
              <div className="p-3 bg-white/60 rounded-xl border border-champagne/20">
                <ShieldCheck className="h-4 w-4 text-champagne mx-auto mb-1" />
                <p className="font-semibold text-charcoal text-[11px]">Skin-Safe</p>
                <p className="text-[10px] text-charcoal/50">Hypoallergenic</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Content: Details, Shipping, Care, Reviews */}
        <div className="mt-16 border-t border-champagne/20 pt-10">
          <div className="flex border-b border-champagne/20 text-xs font-semibold text-charcoal/60 overflow-x-auto gap-2">
            <button
              onClick={() => setActiveTab('DETAILS')}
              className={`pb-3 px-4 border-b-2 transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
                activeTab === 'DETAILS'
                  ? 'border-champagne text-charcoal font-bold'
                  : 'border-transparent hover:text-charcoal'
              }`}
            >
              Product Details &amp; Materials
            </button>
            <button
              onClick={() => setActiveTab('CARE')}
              className={`pb-3 px-4 border-b-2 transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
                activeTab === 'CARE'
                  ? 'border-champagne text-charcoal font-bold'
                  : 'border-transparent hover:text-charcoal'
              }`}
            >
              Jewelry Care Guide
            </button>
            <button
              onClick={() => setActiveTab('SHIPPING')}
              className={`pb-3 px-4 border-b-2 transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
                activeTab === 'SHIPPING'
                  ? 'border-champagne text-charcoal font-bold'
                  : 'border-transparent hover:text-charcoal'
              }`}
            >
              Shipping &amp; Returns
            </button>
            <button
              onClick={() => setActiveTab('REVIEWS')}
              className={`pb-3 px-4 border-b-2 transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
                activeTab === 'REVIEWS'
                  ? 'border-champagne text-charcoal font-bold'
                  : 'border-transparent hover:text-charcoal'
              }`}
            >
              Customer Reviews ({reviewsList.length})
            </button>
          </div>

          <div className="py-8">
            {activeTab === 'DETAILS' && (
              <div className="max-w-3xl space-y-4 text-xs text-charcoal/80 leading-relaxed">
                <p>{product.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                  <div className="p-4 bg-white/70 rounded-xl border border-champagne/20">
                    <span className="font-semibold text-charcoal block mb-0.5">Plating Technology</span>
                    <span className="text-charcoal/70">18k Gold PVD Coating (Vacuum deposition, high durability)</span>
                  </div>
                  <div className="p-4 bg-white/70 rounded-xl border border-champagne/20">
                    <span className="font-semibold text-charcoal block mb-0.5">Base Metal</span>
                    <span className="text-charcoal/70">316L Surgical Grade Stainless Steel / Alloy</span>
                  </div>
                  <div className="p-4 bg-white/70 rounded-xl border border-champagne/20">
                    <span className="font-semibold text-charcoal block mb-0.5">Skin Compatibility</span>
                    <span className="text-charcoal/70">100% Nickel-Free, Lead-Free, Non-Allergenic</span>
                  </div>
                  <div className="p-4 bg-white/70 rounded-xl border border-champagne/20">
                    <span className="font-semibold text-charcoal block mb-0.5">Complimentary Packaging</span>
                    <span className="text-charcoal/70">Signature Moonlet protective velvet pouch included</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'CARE' && (
              <div className="max-w-3xl space-y-4 text-xs text-charcoal/80 leading-relaxed">
                <p className="font-semibold text-charcoal text-sm font-serif">
                  How to Keep Your Moonlet Jewelry Looking Brand New
                </p>
                <ul className="space-y-2.5 list-disc pl-4">
                  <li><strong>Keep away from perfumes &amp; sprays:</strong> Apply your lotions, hairsprays, and perfumes before putting on your jewelry.</li>
                  <li><strong>Avoid harsh chemicals:</strong> Remove pieces before swimming in chlorinated pools or using household cleaning agents.</li>
                  <li><strong>Clean gently:</strong> After wearing, gently buff with a soft lint-free microfiber cloth to remove skin oils and maintain the 18k gold sheen.</li>
                  <li><strong>Proper storage:</strong> Always store your jewelry separately in the complimentary Moonlet velvet pouch to prevent surface scratches.</li>
                </ul>
              </div>
            )}

            {activeTab === 'SHIPPING' && (
              <div className="max-w-3xl space-y-4 text-xs text-charcoal/80 leading-relaxed">
                <p>
                  <strong>Express Shipping across India:</strong> Orders placed before 2:00 PM IST are dispatched on the same business day. Delivery usually takes 2–4 business days via Blue Dart, Delhivery, or Xpressbees.
                </p>
                <p>
                  <strong>Cash on Delivery (COD):</strong> COD is available across 19,000+ Indian pincodes without any hidden surcharges.
                </p>
                <p>
                  <strong>Easy 7-Day Doorstep Returns:</strong> If you are not completely satisfied with your purchase, initiate an easy return from your account portal within 7 days of delivery for a full refund or exchange.
                </p>
              </div>
            )}

            {activeTab === 'REVIEWS' && (
              <div className="max-w-3xl space-y-8">
                {/* Existing Reviews */}
                <div className="space-y-4">
                  {reviewsList.map((r) => (
                    <div key={r.id} className="p-5 bg-white/80 rounded-2xl border border-champagne/20 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-charcoal">{r.author}</span>
                        <span className="text-charcoal/40">{r.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[...Array(r.rating)].map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <h4 className="text-xs font-semibold text-charcoal font-serif">{r.title}</h4>
                      <p className="text-xs text-charcoal/70 leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>

                {/* Review Form */}
                <form onSubmit={handleSubmitReview} className="p-6 bg-white rounded-2xl border border-champagne/30 shadow-xs space-y-4">
                  <h3 className="font-serif text-sm font-medium text-charcoal flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-champagne" />
                    Share Your Moonlet Experience
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-charcoal/80 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Riya K."
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-ivory/50 border border-champagne/30 rounded-xl text-xs text-charcoal focus:outline-none focus:border-champagne"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-charcoal/80 mb-1">Rating</label>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="w-full px-3.5 py-2 bg-ivory/50 border border-champagne/30 rounded-xl text-xs font-medium text-charcoal focus:outline-none focus:border-champagne"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5 Stars - Loved it!)</option>
                        <option value={4}>⭐⭐⭐⭐ (4 Stars - Very Good)</option>
                        <option value={3}>⭐⭐⭐ (3 Stars - Average)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-charcoal/80 mb-1">Your Review</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Tell us about the shine, finish, and feel..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full px-3.5 py-2 bg-ivory/50 border border-champagne/30 rounded-xl text-xs text-charcoal focus:outline-none focus:border-champagne"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-charcoal text-ivory font-medium text-xs uppercase tracking-wider rounded-xl hover:bg-champagne hover:text-charcoal transition-all shadow-sm"
                  >
                    Submit Review
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Mobile Add to Bag Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-champagne/30 px-4 py-3 flex items-center justify-between gap-4 z-40 shadow-lg">
        <div>
          <p className="text-[10px] text-charcoal/60 uppercase tracking-widest line-clamp-1">{product.name}</p>
          <p className="font-serif text-base font-bold text-charcoal">
            ₹{(product.priceMinor / 100).toLocaleString('en-IN')}
          </p>
        </div>
        <button
          onClick={handleAddToCart}
          className="px-6 py-2.5 bg-charcoal text-ivory text-xs font-medium uppercase tracking-wider rounded-xl hover:bg-champagne hover:text-charcoal transition-all shadow-md shrink-0 flex items-center gap-1.5"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>Add to Bag</span>
        </button>
      </div>
    </div>
  );
}
