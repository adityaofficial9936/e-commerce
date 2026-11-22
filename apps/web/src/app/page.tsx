'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Star,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Heart,
  Check,
  RotateCcw,
  Truck,
  MessageCircle,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useCartStore } from '../store/cart';
import { InView } from '@/components/core/in-view';
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogImage,
  MorphingDialogContainer,
} from '@/components/core/morphing-dialog';
import { X as XIcon } from 'lucide-react';

interface ProductItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  brand?: string;
  priceMinor: number;
  mrpMinor?: number;
  imageUrl: string;
  rating?: number;
  reviewsCount?: number;
  variantId?: string;
  inStock?: boolean;
  material?: string;
  isNew?: boolean;
  onSale?: boolean;
}

// Curated Initial Jewelry Catalog (Gold-Tone, Stainless Steel, Cubic Zirconia)
const JEWELRY_SEED_PRODUCTS: ProductItem[] = [
  {
    id: 'jewel-01',
    slug: 'celestial-triple-layered-pendant-necklace',
    name: 'Celestial Triple-Layered Coin & Pearl Pendant Necklace',
    category: 'Necklaces',
    priceMinor: 119900, // ₹1,199
    mrpMinor: 199900,   // ₹1,999
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 142,
    variantId: 'var-celestial-1',
    inStock: true,
    material: '18k Gold-Plated Stainless Steel',
    isNew: true,
    onSale: true,
  },
  {
    id: 'jewel-02',
    slug: 'aurora-crystal-chunky-huggie-hoop-earrings',
    name: 'Aurora Pave Cubic Zirconia Chunky Huggie Hoops',
    category: 'Earrings',
    priceMinor: 79900,  // ₹799
    mrpMinor: 149900,   // ₹1,499
    imageUrl: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=700&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 89,
    variantId: 'var-aurora-2',
    inStock: true,
    material: 'Hypoallergenic Gold-Tone Brass',
    isNew: true,
  },
  {
    id: 'jewel-03',
    slug: 'starlight-mesh-roman-numeral-watch-rose-gold',
    name: 'Starlight Minimalist Roman Numeral Mesh Watch (Rose Gold-Tone)',
    category: 'Watches',
    priceMinor: 249900, // ₹2,499
    mrpMinor: 399900,   // ₹3,999
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=700&auto=format&fit=crop&q=80',
    rating: 5.0,
    reviewsCount: 204,
    variantId: 'var-starlight-3',
    inStock: true,
    material: 'Water-Resistant Alloy Mesh Strap',
    onSale: true,
  },
  {
    id: 'jewel-04',
    slug: 'luna-eternity-baguette-stackable-ring',
    name: 'Luna Baguette Crystal Stackable Eternity Band',
    category: 'Rings',
    priceMinor: 59900,  // ₹599
    mrpMinor: 99900,    // ₹999
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=700&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 67,
    variantId: 'var-luna-4',
    inStock: true,
    material: 'AAA Cubic Zirconia & Gold-Tone Alloy',
  },
  {
    id: 'jewel-05',
    slug: 'solaris-snake-chain-choker-gold',
    name: 'Solaris Liquid Gold Herringbone Snake Chain Choker',
    category: 'Necklaces',
    priceMinor: 89900,  // ₹899
    mrpMinor: 159900,   // ₹1,599
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 178,
    variantId: 'var-solaris-5',
    inStock: true,
    material: '316L Stainless Steel (Tarnish-Resistant)',
    onSale: true,
  },
  {
    id: 'jewel-06',
    slug: 'florence-baroque-pearl-drop-earrings',
    name: 'Florence Asymmetric Baroque Glass Pearl Drop Earrings',
    category: 'Earrings',
    priceMinor: 69900,  // ₹699
    mrpMinor: 119900,   // ₹1,199
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 53,
    variantId: 'var-florence-6',
    inStock: true,
    material: 'Glass Pearl with Gold-Tone Hooks',
  },
  {
    id: 'jewel-07',
    slug: 'seraphina-tennis-bracelet-cubic-zirconia',
    name: 'Seraphina Shimmering Bezel Tennis Bracelet',
    category: 'Bracelets',
    priceMinor: 129900, // ₹1,299
    mrpMinor: 219900,   // ₹2,199
    imageUrl: 'https://images.unsplash.com/photo-1611591475155-42e47209e86c?w=700&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 91,
    variantId: 'var-seraphina-7',
    inStock: true,
    material: 'Gold-Plated Brass & Faceted Crystals',
    isNew: true,
  },
  {
    id: 'jewel-08',
    slug: 'moonlet-signature-velvet-duo-gift-set',
    name: 'The Moonlet Keepsake Duo: Coin Necklace + Pearl Huggies in Velvet Box',
    category: 'Gift Sets',
    priceMinor: 169900, // ₹1,699
    mrpMinor: 279900,   // ₹2,799
    imageUrl: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=700&auto=format&fit=crop&q=80',
    rating: 5.0,
    reviewsCount: 115,
    variantId: 'var-gift-8',
    inStock: true,
    material: 'Gift Boxed Set with Anti-Tarnish Pouch',
    onSale: true,
  },
];

const CATEGORIES = [
  {
    name: 'Earrings',
    slug: 'Earrings',
    count: 'Studs, Huggies & Drops',
    image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Necklaces',
    slug: 'Necklaces',
    count: 'Chains, Pendants & Chokers',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Watches',
    slug: 'Watches',
    count: 'Mesh & Leather Dials',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Rings',
    slug: 'Rings',
    count: 'Bands & Cocktail Rings',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bracelets',
    slug: 'Bracelets',
    count: 'Tennis, Cuffs & Chains',
    image: 'https://images.unsplash.com/photo-1611591475155-42e47209e86c?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Gift Sets',
    slug: 'Gift Sets',
    count: 'Curated Keepsake Boxes',
    image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=500&auto=format&fit=crop&q=80',
  },
];

export default function MoonletHomePage() {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const [products, setProducts] = useState<ProductItem[]>(JEWELRY_SEED_PRODUCTS);
  const [selectedArrivalCategory, setSelectedArrivalCategory] = useState<string>('All');
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [hotspotActive, setHotspotActive] = useState<number | null>(0);

  // Load live products from backend API (and merge with jewelry seed)
  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          // Normalize API products
          const formatted = data.map((p, idx) => ({
            id: p.id || `api-${idx}`,
            slug: p.slug || p.id,
            name: p.name,
            category: p.category || 'Jewelry',
            brand: p.brand || 'Moonlet',
            priceMinor: typeof p.priceMinor === 'number' ? p.priceMinor : 99900,
            mrpMinor: p.mrpMinor || Math.round((p.priceMinor || 99900) * 1.45),
            imageUrl:
              p.imageUrl ||
              (p.images && p.images[0]?.url) ||
              JEWELRY_SEED_PRODUCTS[idx % JEWELRY_SEED_PRODUCTS.length].imageUrl,
            rating: p.rating || 4.9,
            reviewsCount: p.reviewsCount || 48,
            variantId: p.variantId || `var-${p.id}`,
            inStock: p.inStock !== false,
            material: p.material || '18k Gold-Plated Finish',
          }));

          // Prioritize new items, combine with default curated pieces
          setProducts([...formatted, ...JEWELRY_SEED_PRODUCTS.filter(s => !formatted.some(f => f.name === s.name))]);
        }
      })
      .catch((err) => console.error('Failed to fetch catalog:', err));
  }, []);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickAdd = (product: ProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      variantId: product.variantId || `var-${product.id}`,
      productId: product.id,
      name: product.name,
      variantTitle: 'Standard Edition (Gold-Tone)',
      imageUrl: product.imageUrl,
      priceMinor: product.priceMinor,
      availableStock: 20,
    });
    openCart();
  };

  const arrivalCategories = ['All', 'Earrings', 'Necklaces', 'Watches', 'Rings', 'Bracelets'];
  const filteredArrivals =
    selectedArrivalCategory === 'All'
      ? products.slice(0, 8)
      : products.filter((p) => p.category.toLowerCase() === selectedArrivalCategory.toLowerCase()).slice(0, 8);

  const bestSellers = products.slice(0, 6);

  return (
    <div className="space-y-20 sm:space-y-28 bg-ivory text-charcoal font-sans overflow-x-hidden">
      
      {/* 3. Hero Section (Soft Luxury, Mobile-First) */}
      <section className="relative overflow-hidden bg-[#FAF7F2] pt-6 sm:pt-12 pb-16 sm:pb-24 border-b border-[#C9A66B]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <InView
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4 }}
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blush border border-[#C9A66B]/30 text-charcoal text-xs font-semibold tracking-wide">
                  <Sparkles className="h-3.5 w-3.5 text-champagne-dark" />
                  <span>The Festive Radiance Collection 2026</span>
                </div>
              </InView>

              <InView
                variants={{
                  hidden: { opacity: 0, y: 25 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-charcoal leading-[1.15]">
                  Everyday Luxury, <br />
                  <span className="italic font-light text-champagne-dark">Effortlessly Yours.</span>
                </h1>
              </InView>

              <InView
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <p className="text-base sm:text-lg text-charcoal/70 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                  Discover modern 18k gold-plated earrings, layered necklaces, and minimal watches designed for Indian girls & young women. Skin-friendly, hypoallergenic, and crafted for daily wear.
                </p>
              </InView>

              <InView
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 sm:gap-4">
                  <Link
                    href="/products?tag=new"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-charcoal hover:bg-champagne-dark text-ivory text-xs font-bold uppercase tracking-widest transition-all shadow-md text-center"
                  >
                    Shop New In
                  </Link>
                  <Link
                    href="/products?sort=best-sellers"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-transparent border border-charcoal/30 hover:border-champagne hover:text-champagne-dark text-charcoal text-xs font-bold uppercase tracking-widest transition-all text-center"
                  >
                    Shop Best Sellers
                  </Link>
                </div>
              </InView>

              {/* Quick USP Highlights */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-charcoal/60">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-champagne-dark" /> Hypoallergenic Metals
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-champagne-dark" /> Prices ₹299–₹2,499
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-champagne-dark" /> Cash on Delivery
                </span>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <InView
                variants={{
                  hidden: { opacity: 0, scale: 0.96 },
                  visible: { opacity: 1, scale: 1 },
                }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border border-[#C9A66B]/30 bg-white p-3">
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000&auto=format&fit=crop&q=80"
                      alt="Moonlet Fashion Jewelry Collection"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                      <span className="text-[11px] font-bold tracking-widest uppercase text-champagne">Trending Duo</span>
                      <h3 className="font-serif text-2xl font-normal">The Moonlet Layered Choker</h3>
                      <p className="text-xs text-ivory/80 mt-1">18k Gold-Plated Stainless Steel • ₹899</p>
                    </div>
                  </div>
                </div>
              </InView>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Shop by Category (Circular / Minimalist Luxury Tiles) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-champagne-dark">Curated Categories</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal">
            Shop by Category
          </h2>
          <div className="w-12 h-0.5 bg-champagne mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {CATEGORIES.map((cat, idx) => (
            <InView
              key={cat.name}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
            >
              <Link
                href={`/products?category=${encodeURIComponent(cat.slug)}`}
                className="group flex flex-col items-center text-center p-3 rounded-2xl bg-white hover:bg-blush/40 border border-[#C9A66B]/20 transition-all duration-300 shadow-xs hover:shadow-md"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden p-1 border border-champagne/40 group-hover:border-champagne transition-colors mb-3 bg-ivory">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-serif text-sm font-bold text-charcoal group-hover:text-champagne-dark transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-charcoal/50 mt-0.5 line-clamp-1">{cat.count}</span>
              </Link>
            </InView>
          ))}
        </div>
      </section>

      {/* 5. Best Sellers Carousel / Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 border-b border-[#C9A66B]/20 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-rose">Most Loved Pieces</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal mt-1">
              Best Sellers
            </h2>
          </div>
          <Link
            href="/products?sort=best-sellers"
            className="text-xs font-bold uppercase tracking-widest text-charcoal hover:text-champagne-dark flex items-center gap-1.5"
          >
            <span>Explore All Pieces</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {bestSellers.map((prod, index) => {
            const isWish = !!wishlist[prod.id];
            const discountPercent = prod.mrpMinor
              ? Math.round(((prod.mrpMinor - prod.priceMinor) / prod.mrpMinor) * 100)
              : null;

            return (
              <InView
                key={prod.id}
                variants={{
                  hidden: { opacity: 0, y: 25 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <div className="group bg-white rounded-2xl border border-[#C9A66B]/25 overflow-hidden shadow-subtle hover:shadow-luxury transition-all duration-300 flex flex-col h-full">
                  
                  {/* Image with Morphing Dialog Trigger */}
                  <div className="relative aspect-square overflow-hidden bg-[#FAF7F2]">
                    <MorphingDialog
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <MorphingDialogTrigger className="w-full h-full block">
                        <MorphingDialogImage
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-zoom-in"
                        />
                      </MorphingDialogTrigger>
                      <MorphingDialogContainer>
                        <MorphingDialogContent className="relative max-w-2xl bg-white p-2 rounded-2xl shadow-2xl">
                          <MorphingDialogImage
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="h-auto w-full max-h-[85vh] rounded-xl object-contain"
                          />
                          <div className="p-4 bg-ivory rounded-xl mt-2 flex items-center justify-between">
                            <div>
                              <p className="font-serif font-bold text-base text-charcoal">{prod.name}</p>
                              <p className="text-xs text-charcoal/60">{prod.material}</p>
                            </div>
                            <span className="font-bold text-base text-charcoal">
                              ₹{(prod.priceMinor / 100).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </MorphingDialogContent>
                        <MorphingDialogClose className="fixed right-6 top-6 h-9 w-9 rounded-full bg-white text-charcoal flex items-center justify-center shadow-lg hover:bg-ivory transition-colors">
                          <XIcon className="h-5 w-5" />
                        </MorphingDialogClose>
                      </MorphingDialogContainer>
                    </MorphingDialog>

                    {/* Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                      {prod.isNew && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-charcoal text-ivory">
                          New
                        </span>
                      )}
                      {discountPercent && discountPercent > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose text-white">
                          Save {discountPercent}%
                        </span>
                      )}
                    </div>

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleWishlist(prod.id, e)}
                      aria-label="Save to wishlist"
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-xs text-charcoal hover:text-rose transition-colors shadow-xs"
                    >
                      <Heart className={`h-4 w-4 ${isWish ? 'fill-rose text-rose' : ''}`} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-charcoal/50">
                        <span className="uppercase tracking-wider font-semibold text-champagne-dark">{prod.category}</span>
                        <div className="flex items-center gap-1 text-amber-500 font-medium">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{prod.rating || 4.9}</span>
                          <span className="text-charcoal/40">({prod.reviewsCount || 45})</span>
                        </div>
                      </div>

                      <Link
                        href={`/products/${prod.slug}`}
                        className="block font-serif text-base font-semibold text-charcoal hover:text-champagne-dark transition-colors line-clamp-2 leading-snug"
                      >
                        {prod.name}
                      </Link>

                      <p className="text-[11px] text-charcoal/60 line-clamp-1 italic">
                        {prod.material || 'Gold-tone finish • Skin friendly'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#C9A66B]/15 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-bold text-charcoal">
                          ₹{(prod.priceMinor / 100).toLocaleString('en-IN')}
                        </div>
                        {prod.mrpMinor && (
                          <div className="text-xs text-charcoal/40 line-through">
                            ₹{(prod.mrpMinor / 100).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(prod, e)}
                        className="px-4 py-2 rounded-full bg-charcoal hover:bg-champagne-dark text-ivory text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <ShoppingBag className="h-3.5 w-3.5 text-champagne" />
                        <span>Quick Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </InView>
            );
          })}
        </div>
      </section>

      {/* 6. Short Brand Story Strip (Per Brief) */}
      <section className="bg-blush/50 border-y border-[#C9A66B]/25 py-14 sm:py-18">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <span className="text-xs uppercase font-bold tracking-widest text-champagne-dark">The Moonlet Philosophy</span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-charcoal leading-snug">
            Jewelry you never have to take off. Crafted for everyday moments, without the traditional markup.
          </h2>
          <p className="text-xs sm:text-sm text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
            We believe girls and young women in India deserve effortless everyday radiance. Every piece is made in durable 18k gold-plated brass or stainless steel, designed to pair with college formals, weekend brunches, and festive evenings.
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-charcoal hover:text-champagne-dark border-b border-charcoal/40 pb-0.5 transition-colors"
            >
              <span>Explore Our Story & Collections</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. New Arrivals Grid with Category Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-champagne-dark">Fresh in the Studio</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal">
            New Arrivals
          </h2>
          <div className="w-12 h-0.5 bg-champagne mx-auto mt-2" />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {arrivalCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedArrivalCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                selectedArrivalCategory === cat
                  ? 'bg-charcoal text-ivory shadow-xs'
                  : 'bg-white border border-[#C9A66B]/30 text-charcoal/70 hover:border-charcoal'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredArrivals.map((prod) => (
            <div
              key={prod.id}
              className="group bg-white rounded-2xl border border-[#C9A66B]/20 overflow-hidden shadow-subtle hover:shadow-luxury transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative aspect-square overflow-hidden bg-ivory">
                <Link href={`/products/${prod.slug}`}>
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                <button
                  type="button"
                  onClick={(e) => toggleWishlist(prod.id, e)}
                  aria-label="Wishlist"
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-charcoal hover:text-rose transition-colors"
                >
                  <Heart className={`h-4 w-4 ${wishlist[prod.id] ? 'fill-rose text-rose' : ''}`} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-champagne-dark">{prod.category}</span>
                  <Link
                    href={`/products/${prod.slug}`}
                    className="block font-serif text-sm font-semibold text-charcoal hover:text-champagne-dark transition-colors line-clamp-1 mt-0.5"
                  >
                    {prod.name}
                  </Link>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#C9A66B]/15">
                  <span className="text-sm font-bold text-charcoal">
                    ₹{(prod.priceMinor / 100).toLocaleString('en-IN')}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(prod, e)}
                    className="p-2 rounded-full bg-charcoal hover:bg-champagne-dark text-ivory transition-colors"
                    title="Add to Cart"
                  >
                    <ShoppingBag className="h-3.5 w-3.5 text-champagne" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Shop the Look (Hotspot Feature per Brief) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1C1B1A] text-ivory rounded-3xl p-6 sm:p-12 border border-[#C9A66B]/30 overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Visual with Hotspots */}
            <div className="lg:col-span-7 relative rounded-2xl overflow-hidden aspect-[4/3] bg-charcoal-light">
              <img
                src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1000&auto=format&fit=crop&q=80"
                alt="Shop the look with Moonlet"
                className="w-full h-full object-cover opacity-90"
              />

              {/* Hotspot 1: Necklace */}
              <button
                type="button"
                onClick={() => setHotspotActive(0)}
                className={`absolute top-[48%] left-[45%] w-8 h-8 rounded-full border-2 border-white flex items-center justify-center transition-transform ${
                  hotspotActive === 0 ? 'scale-125 bg-champagne text-charcoal' : 'bg-charcoal/80 text-white animate-pulse'
                }`}
                aria-label="View Layered Snake Chain"
              >
                <span className="text-[10px] font-bold">1</span>
              </button>

              {/* Hotspot 2: Earrings */}
              <button
                type="button"
                onClick={() => setHotspotActive(1)}
                className={`absolute top-[28%] left-[32%] w-8 h-8 rounded-full border-2 border-white flex items-center justify-center transition-transform ${
                  hotspotActive === 1 ? 'scale-125 bg-champagne text-charcoal' : 'bg-charcoal/80 text-white animate-pulse'
                }`}
                aria-label="View Huggie Earrings"
              >
                <span className="text-[10px] font-bold">2</span>
              </button>
            </div>

            {/* Hotspot Detail Card */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[11px] uppercase tracking-widest text-champagne font-bold">Styled by Moonlet</span>
              <h2 className="font-serif text-3xl font-normal text-ivory">
                The Golden Hour Ensemble
              </h2>
              <p className="text-xs sm:text-sm text-ivory/70 leading-relaxed">
                Tap on any numbered hotspot on the model to view the jewelry components that make up this layered luxury look.
              </p>

              {/* Active Item Card */}
              <div className="p-4 rounded-2xl bg-white/10 border border-champagne/30 backdrop-blur-xs flex items-center gap-4">
                <img
                  src={
                    hotspotActive === 0
                      ? 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&auto=format&fit=crop&q=80'
                      : 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=200&auto=format&fit=crop&q=80'
                  }
                  alt="Hotspot item"
                  className="w-16 h-16 rounded-xl object-cover bg-white"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-champagne">
                    {hotspotActive === 0 ? 'Layered Chain' : 'Crystal Huggies'}
                  </span>
                  <h4 className="font-serif text-sm font-bold text-white truncate">
                    {hotspotActive === 0
                      ? 'Solaris Liquid Gold Snake Chain Choker'
                      : 'Aurora Pave Cubic Zirconia Huggie Hoops'}
                  </h4>
                  <p className="text-xs font-bold text-ivory mt-0.5">
                    {hotspotActive === 0 ? '₹899' : '₹799'}
                  </p>
                </div>
                <Link
                  href="/products"
                  className="px-3.5 py-2 rounded-xl bg-champagne text-charcoal font-bold text-xs hover:bg-champagne-light transition-colors"
                >
                  View Piece
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Offer Banner: "Buy 2, Save 15%" & Gift Sets */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-blush rounded-3xl p-8 sm:p-10 border border-[#C9A66B]/30 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose">Curated Gifting</span>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-charcoal">
                Velvet Keepsake Gift Sets
              </h3>
              <p className="text-xs text-charcoal/70 leading-relaxed">
                Hand-curated necklace and earring duos delivered in our signature soft-touch velvet box. Ready to gift for birthdays & celebrations.
              </p>
            </div>
            <Link
              href="/products?category=Gift Sets"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-charcoal hover:text-champagne-dark"
            >
              <span>Explore Gift Sets from ₹1,499</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="bg-[#FAF7F2] rounded-3xl p-8 sm:p-10 border border-[#C9A66B]/40 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-champagne-dark">Stacking Offer</span>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-charcoal">
                Buy Any 2, Get 15% Off
              </h3>
              <p className="text-xs text-charcoal/70 leading-relaxed">
                Mix and match any rings, bracelets, or chains. Discount automatically applied at checkout. No coupon required.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-charcoal hover:text-champagne-dark"
            >
              <span>Build Your Stacking Duo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 11. Customer Love & Instagram Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-champagne-dark">Verified Reviews</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal">
            Loved Across India
          </h2>
          <div className="w-12 h-0.5 bg-champagne mx-auto mt-2" />
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#C9A66B]/20 shadow-xs space-y-3">
            <div className="flex text-amber-500 gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
            </div>
            <p className="text-xs text-charcoal/80 leading-relaxed italic">
              "The quality of the herringbone necklace is insane for ₹899! I wear it to college daily and sweat in Mumbai humidity, zero green skin or discoloration."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-charcoal">Ananya S., Mumbai</span>
              <span className="text-[10px] text-emerald-600 font-semibold">✓ Verified Buyer</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#C9A66B]/20 shadow-xs space-y-3">
            <div className="flex text-amber-500 gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
            </div>
            <p className="text-xs text-charcoal/80 leading-relaxed italic">
              "Ordered the Roman numeral mesh watch as a gift for my sister. The packaging felt like luxury jewelry costing 5x more. Cash on delivery was so smooth!"
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-charcoal">Pooja R., Bengaluru</span>
              <span className="text-[10px] text-emerald-600 font-semibold">✓ Verified Buyer</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#C9A66B]/20 shadow-xs space-y-3">
            <div className="flex text-amber-500 gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
            </div>
            <p className="text-xs text-charcoal/80 leading-relaxed italic">
              "The pave cubic zirconia huggies have such brilliant sparkle. Everyone asked if they were real diamonds! Super comfortable for sensitive ears."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-charcoal">Riya V., Delhi NCR</span>
              <span className="text-[10px] text-emerald-600 font-semibold">✓ Verified Buyer</span>
            </div>
          </div>
        </div>

        {/* Instagram Visual Wall */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal">Styled by You on Instagram</span>
            <span className="text-xs font-semibold text-champagne-dark">@moonlet.in</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl overflow-hidden aspect-square border border-[#C9A66B]/20">
              <img src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=80" alt="Instagram style 1" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="rounded-2xl overflow-hidden aspect-square border border-[#C9A66B]/20">
              <img src="https://images.unsplash.com/photo-1630019852942-f89202989a59?w=500&auto=format&fit=crop&q=80" alt="Instagram style 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="rounded-2xl overflow-hidden aspect-square border border-[#C9A66B]/20">
              <img src="https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop&q=80" alt="Instagram style 3" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="rounded-2xl overflow-hidden aspect-square border border-[#C9A66B]/20">
              <img src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=80" alt="Instagram style 4" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* 12. VIP Club / Newsletter Signup */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-blush rounded-3xl p-8 sm:p-12 border border-[#C9A66B]/30 text-center space-y-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-champagne-dark">VIP Club</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal">
            Join the Moonlet Circle
          </h2>
          <p className="text-xs sm:text-sm text-charcoal/70 max-w-md mx-auto">
            Subscribe for early access to limited jewelry drops, secret flash sales, and enjoy <strong>10% off your first order</strong>.
          </p>

          {newsletterSubmitted ? (
            <div className="p-4 rounded-2xl bg-white border border-champagne text-xs font-bold text-emerald-700 flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              <span>Welcome to Moonlet! Use coupon code <strong>WELCOME10</strong> at checkout for 10% off.</span>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newsletterEmail) setNewsletterSubmitted(true);
              }}
              className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder="Enter your email address..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full px-5 py-3 rounded-full bg-white border border-[#C9A66B]/40 focus:border-champagne focus:outline-none text-xs text-charcoal"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-charcoal hover:bg-champagne-dark text-ivory text-xs font-bold uppercase tracking-widest transition-colors shrink-0 shadow-sm"
              >
                Join & Save 10%
              </button>
            </form>
          )}

          <p className="text-[10px] text-charcoal/40">We respect your privacy. No spam, only radiant jewelry moments.</p>
        </div>
      </section>
    </div>
  );
}
