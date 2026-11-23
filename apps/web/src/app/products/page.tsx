'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Star, ShoppingBag, Filter, Check, Search, X, Heart, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useCartStore } from '../../store/cart';
import { useWishlistStore } from '../../store/wishlist';

interface ProductItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  finish: string;
  material: string;
  brand: string;
  priceMinor: number;
  mrpMinor: number;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  variantId: string;
  inStock: boolean;
  tag?: string;
}

const JEWELRY_CATALOG: ProductItem[] = [
  // Earrings
  {
    id: 'ear-1',
    slug: 'celestial-star-huggie-hoops',
    name: 'Celestial Star Huggie Hoops',
    category: 'Earrings',
    finish: '18k Gold-Tone',
    material: 'Brass with 18k Gold Plating & Cubic Zirconia',
    brand: 'Moonlet',
    priceMinor: 79900,
    mrpMinor: 149900,
    imageUrl: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 142,
    variantId: 'var-ear-1',
    inStock: true,
    tag: 'Bestseller',
  },
  {
    id: 'ear-2',
    slug: 'cascade-pearl-gold-drop-earrings',
    name: 'Cascade Pearl & Gold Drop Earrings',
    category: 'Earrings',
    finish: '18k Gold-Tone',
    material: 'Shell Pearl & 18k Gold-Plated Alloy',
    brand: 'Moonlet',
    priceMinor: 99900,
    mrpMinor: 179900,
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 88,
    variantId: 'var-ear-2',
    inStock: true,
    tag: 'New',
  },
  {
    id: 'ear-3',
    slug: 'twinkling-solitaire-studs',
    name: 'Twinkling Solitaire Cubic Studs',
    category: 'Earrings',
    finish: 'Stainless Steel',
    material: '316L Stainless Steel with AAA Cubic Zirconia',
    brand: 'Moonlet',
    priceMinor: 49900,
    mrpMinor: 99900,
    imageUrl: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=800&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 215,
    variantId: 'var-ear-3',
    inStock: true,
    tag: 'Essential',
  },
  {
    id: 'ear-4',
    slug: 'aurelia-twisted-croissant-hoops',
    name: 'Aurelia Twisted Croissant Hoops',
    category: 'Earrings',
    finish: '18k Gold-Tone',
    material: 'Lightweight Alloy with 18k Gold Dip',
    brand: 'Moonlet',
    priceMinor: 89900,
    mrpMinor: 159900,
    imageUrl: 'https://images.unsplash.com/photo-1611591475819-79b7b9e78a63?w=800&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 64,
    variantId: 'var-ear-4',
    inStock: true,
  },
  {
    id: 'ear-5',
    slug: 'emerald-cut-solitaire-studs',
    name: 'Emerald-Cut Crystal Halo Studs',
    category: 'Earrings',
    finish: '18k Gold-Tone',
    material: '18k Gold-Plated Brass with Emerald Glass Stone',
    brand: 'Moonlet',
    priceMinor: 69900,
    mrpMinor: 129900,
    imageUrl: 'https://images.unsplash.com/photo-1590548784585-643d2b9f2925?w=800&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 52,
    variantId: 'var-ear-5',
    inStock: true,
  },

  // Necklaces
  {
    id: 'neck-1',
    slug: 'lumina-liquid-gold-snake-chain',
    name: 'Lumina Liquid Gold Herringbone Snake Chain',
    category: 'Necklaces',
    finish: '18k Gold-Tone',
    material: 'Hypoallergenic 316L Stainless Steel with 18k PVD Plating',
    brand: 'Moonlet',
    priceMinor: 129900,
    mrpMinor: 249900,
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
    rating: 5.0,
    reviewsCount: 178,
    variantId: 'var-neck-1',
    inStock: true,
    tag: 'Bestseller',
  },
  {
    id: 'neck-2',
    slug: 'astrid-cubic-zirconia-tennis-choker',
    name: 'Astrid Shimmering Tennis Choker',
    category: 'Necklaces',
    finish: '18k Gold-Tone',
    material: '18k Gold-Plated Brass with Prong-Set Cubic Zirconia',
    brand: 'Moonlet',
    priceMinor: 189900,
    mrpMinor: 329900,
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 119,
    variantId: 'var-neck-2',
    inStock: true,
    tag: 'Trending',
  },
  {
    id: 'neck-3',
    slug: 'petite-north-star-coin-pendant',
    name: 'Petite North Star Coin Locket Pendant',
    category: 'Necklaces',
    finish: '18k Gold-Tone',
    material: 'Stainless Steel with 18k Gold Finish & Center Crystal',
    brand: 'Moonlet',
    priceMinor: 119900,
    mrpMinor: 199900,
    imageUrl: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 93,
    variantId: 'var-neck-3',
    inStock: true,
  },
  {
    id: 'neck-4',
    slug: 'serenade-layered-paperclip-chain',
    name: 'Serenade Layered Paperclip & Pearl Duo',
    category: 'Necklaces',
    finish: '18k Gold-Tone',
    material: 'Dual 18k Gold-Plated Stainless Steel Chains',
    brand: 'Moonlet',
    priceMinor: 159900,
    mrpMinor: 279900,
    imageUrl: 'https://images.unsplash.com/photo-1611591475819-79b7b9e78a63?w=800&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 71,
    variantId: 'var-neck-4',
    inStock: true,
  },
  {
    id: 'neck-5',
    slug: 'pearl-symphony-choker-necklace',
    name: 'Pearl Symphony Dainty Choker',
    category: 'Necklaces',
    finish: '18k Gold-Tone',
    material: 'Cultured Shell Pearls & 18k Gold-Dip Hardware',
    brand: 'Moonlet',
    priceMinor: 149900,
    mrpMinor: 229900,
    imageUrl: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 84,
    variantId: 'var-neck-5',
    inStock: true,
  },

  // Watches
  {
    id: 'wat-1',
    slug: 'petite-roman-square-mesh-watch',
    name: 'Petite Roman Square Mesh Watch in Gold',
    category: 'Watches',
    finish: '18k Gold-Tone',
    material: 'Stainless Steel Mesh Strap with Japanese Quartz Movement',
    brand: 'Moonlet Timepieces',
    priceMinor: 249900,
    mrpMinor: 449900,
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 96,
    variantId: 'var-wat-1',
    inStock: true,
    tag: 'Bestseller',
  },
  {
    id: 'wat-2',
    slug: 'etoile-pearl-dial-oval-bangle-watch',
    name: 'Étoile Mother-of-Pearl Dial Bangle Watch',
    category: 'Watches',
    finish: '18k Gold-Tone',
    material: 'Jewelry Bangle Strap & Genuine Pearl Finish Dial',
    brand: 'Moonlet Timepieces',
    priceMinor: 289900,
    mrpMinor: 499900,
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 62,
    variantId: 'var-wat-2',
    inStock: true,
    tag: 'Luxury',
  },
  {
    id: 'wat-3',
    slug: 'classic-minimalist-leather-watch',
    name: 'Classic Minimalist Champagne Sunray Watch',
    category: 'Watches',
    finish: '18k Gold-Tone',
    material: 'Champagne Gold Casing with Genuine Vegan Leather Strap',
    brand: 'Moonlet Timepieces',
    priceMinor: 219900,
    mrpMinor: 389900,
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 47,
    variantId: 'var-wat-3',
    inStock: true,
  },
  {
    id: 'wat-4',
    slug: 'royal-milanese-mesh-rose-gold-watch',
    name: 'Royal Milanese Slim Watch in Rose Gold',
    category: 'Watches',
    finish: 'Rose Gold',
    material: 'Rose Gold Plated 316L Stainless Steel',
    brand: 'Moonlet Timepieces',
    priceMinor: 269900,
    mrpMinor: 459900,
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 83,
    variantId: 'var-wat-4',
    inStock: true,
  },

  // Rings
  {
    id: 'ring-1',
    slug: 'stella-pave-eternity-band-ring',
    name: 'Stella Pave Eternity Shimmer Band',
    category: 'Rings',
    finish: '18k Gold-Tone',
    material: '18k Gold-Plated Brass with Micro Cubic Zirconia',
    brand: 'Moonlet',
    priceMinor: 69900,
    mrpMinor: 129900,
    imageUrl: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 134,
    variantId: 'var-ring-1',
    inStock: true,
    tag: 'Trending',
  },
  {
    id: 'ring-2',
    slug: 'solstice-croissant-dome-ring',
    name: 'Solstice Croissant Dome Statement Ring',
    category: 'Rings',
    finish: '18k Gold-Tone',
    material: 'Stainless Steel with 18k Gold PVD Coating',
    brand: 'Moonlet',
    priceMinor: 79900,
    mrpMinor: 149900,
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 78,
    variantId: 'var-ring-2',
    inStock: true,
  },
  {
    id: 'ring-3',
    slug: 'nova-baguette-solitaire-adjustable-ring',
    name: 'Nova Baguette Solitaire Adjustable Ring',
    category: 'Rings',
    finish: '18k Gold-Tone',
    material: '18k Gold-Plated Brass with Baguette Cut Crystal',
    brand: 'Moonlet',
    priceMinor: 59900,
    mrpMinor: 109900,
    imageUrl: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 65,
    variantId: 'var-ring-3',
    inStock: true,
  },
  {
    id: 'ring-4',
    slug: 'dual-wave-stacking-ring-set',
    name: 'Dual Wave Minimalist Stacking Ring Set',
    category: 'Rings',
    finish: '18k Gold-Tone',
    material: 'Set of 2 Gold-Tone Polished Bands',
    brand: 'Moonlet',
    priceMinor: 89900,
    mrpMinor: 159900,
    imageUrl: 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=800&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 54,
    variantId: 'var-ring-4',
    inStock: true,
  },

  // Bracelets
  {
    id: 'brac-1',
    slug: 'selene-dainty-paperclip-chain-bracelet',
    name: 'Selene Dainty Paperclip Chain Bracelet',
    category: 'Bracelets',
    finish: '18k Gold-Tone',
    material: 'Hypoallergenic 316L Stainless Steel',
    brand: 'Moonlet',
    priceMinor: 89900,
    mrpMinor: 169900,
    imageUrl: 'https://images.unsplash.com/photo-1611591475819-79b7b9e78a63?w=800&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 108,
    variantId: 'var-brac-1',
    inStock: true,
    tag: 'Bestseller',
  },
  {
    id: 'brac-2',
    slug: 'venus-floating-crystal-tennis-bracelet',
    name: 'Venus Floating Crystal Tennis Bracelet',
    category: 'Bracelets',
    finish: '18k Gold-Tone',
    material: '18k Gold-Plated with Linked A5 Zirconia Stones',
    brand: 'Moonlet',
    priceMinor: 139900,
    mrpMinor: 249900,
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 89,
    variantId: 'var-brac-2',
    inStock: true,
  },
  {
    id: 'brac-3',
    slug: 'roman-numeral-bangle-bracelet',
    name: 'Aethel Roman Numeral Luxury Oval Bangle',
    category: 'Bracelets',
    finish: '18k Gold-Tone',
    material: '316L Stainless Steel with 18k PVD & Pave Crystals',
    brand: 'Moonlet',
    priceMinor: 169900,
    mrpMinor: 299900,
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
    rating: 5.0,
    reviewsCount: 77,
    variantId: 'var-brac-3',
    inStock: true,
    tag: 'Luxury',
  },
  {
    id: 'brac-4',
    slug: 'aurora-multistrand-beaded-cuff',
    name: 'Aurora Multistrand Beaded Chain Cuff',
    category: 'Bracelets',
    finish: 'Rose Gold',
    material: 'Rose Gold & Champagne Plated Alloy Beads',
    brand: 'Moonlet',
    priceMinor: 109900,
    mrpMinor: 189900,
    imageUrl: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 42,
    variantId: 'var-brac-4',
    inStock: true,
  },
];

function CatalogContent() {
  const searchParams = useSearchParams();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const [products, setProducts] = useState<ProductItem[]>(JEWELRY_CATALOG);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFinish, setSelectedFinish] = useState<string>('All');
  const [maxPriceRupees, setMaxPriceRupees] = useState<number>(3500);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');

  const { toggleItem, isInWishlist } = useWishlistStore();

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const dbSlugs = new Set(data.map((p) => p.slug));
          const remaining = JEWELRY_CATALOG.filter((p) => !dbSlugs.has(p.slug));
          setProducts([...data, ...remaining]);
        }
      })
      .catch((err) => console.error('Failed to load products from /api/products:', err));
  }, []);

  const toggleWishlist = (product: ProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      finish: product.finish,
      material: product.material,
      brand: product.brand,
      priceMinor: product.priceMinor,
      mrpMinor: product.mrpMinor,
      imageUrl: product.imageUrl,
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      variantId: product.variantId,
      inStock: product.inStock,
      tag: product.tag,
    });
  };

  const handleQuickAdd = (product: ProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      variantId: product.variantId,
      productId: product.id,
      name: product.name,
      variantTitle: `${product.finish} Edition`,
      imageUrl: product.imageUrl,
      priceMinor: product.priceMinor,
      availableStock: 20,
    });
    openCart();
  };

  const normalizeCategory = (catStr: string): string => {
    const lower = (catStr || '').toLowerCase().trim();
    if (lower.startsWith('earring')) return 'Earrings';
    if (lower.startsWith('neck')) return 'Necklaces';
    if (lower.startsWith('watch')) return 'Watches';
    if (lower.startsWith('ring')) return 'Rings';
    if (lower.startsWith('brac')) return 'Bracelets';
    return catStr;
  };

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(normalizeCategory(cat));
    } else {
      setSelectedCategory('All');
    }
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const categories = ['All', 'Earrings', 'Necklaces', 'Watches', 'Rings', 'Bracelets'];
  const finishes = ['All', '18k Gold-Tone', 'Rose Gold', 'Stainless Steel'];

  const filtered = products.filter((p) => {
    if (selectedCategory !== 'All' && normalizeCategory(p.category) !== normalizeCategory(selectedCategory)) {
      return false;
    }
    if (selectedFinish !== 'All' && p.finish.toLowerCase() !== selectedFinish.toLowerCase()) return false;
    if (p.priceMinor > maxPriceRupees * 100) return false;
    if (inStockOnly && !p.inStock) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(query);
      const matchCat = p.category.toLowerCase().includes(query);
      const matchMat = p.material ? p.material.toLowerCase().includes(query) : false;
      if (!matchName && !matchCat && !matchMat) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.priceMinor - b.priceMinor;
    if (sortBy === 'price-high') return b.priceMinor - a.priceMinor;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="bg-ivory min-h-screen text-charcoal font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Breadcrumb & Header */}
        <div className="pb-8 border-b border-champagne/20">
          <nav className="text-xs text-charcoal/60 mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
            <span>/</span>
            <span className="text-charcoal font-medium">All Jewelry</span>
            {selectedCategory !== 'All' && (
              <>
                <span>/</span>
                <span className="text-champagne font-semibold">{selectedCategory}</span>
              </>
            )}
          </nav>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-champagne uppercase tracking-widest block mb-1">
                Curated Collections
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-charcoal">
                {selectedCategory === 'All' ? 'Everyday Luxury Jewelry' : selectedCategory}
              </h1>
              <p className="text-xs text-charcoal/70 mt-1 max-w-xl">
                Hypoallergenic, water-resistant pieces in 18k gold-tone &amp; stainless steel. Designed for daily grace.
              </p>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <label htmlFor="sort-select" className="text-xs font-semibold text-charcoal/70 whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-medium border border-champagne/30 rounded-xl px-3.5 py-2.5 bg-white text-charcoal focus:outline-none focus:border-champagne cursor-pointer shadow-2xs"
              >
                <option value="featured">Featured &amp; Trending</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/80 backdrop-blur-xs p-6 rounded-2xl border border-champagne/20 space-y-6 shadow-xs sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-champagne/20">
                <h3 className="font-serif text-base font-medium text-charcoal flex items-center gap-2">
                  <Filter className="h-4 w-4 text-champagne" />
                  Filter Selection
                </h3>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedFinish('All');
                    setMaxPriceRupees(3500);
                    setSearchQuery('');
                    setInStockOnly(false);
                  }}
                  className="text-[11px] text-charcoal/60 hover:text-champagne underline transition-colors"
                >
                  Reset
                </button>
              </div>

              {/* Category Filter */}
              <div>
                <h4 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-2.5">
                  Category
                </h4>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-charcoal text-ivory font-medium shadow-xs'
                          : 'text-charcoal/70 hover:bg-blush/30 hover:text-charcoal'
                      }`}
                    >
                      <span>{cat}</span>
                      {selectedCategory === cat && <Check className="h-3 w-3 text-champagne" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Finish & Plating */}
              <div className="pt-4 border-t border-champagne/15">
                <h4 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-2.5">
                  Finish &amp; Material
                </h4>
                <div className="space-y-1">
                  {finishes.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFinish(f)}
                      className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        selectedFinish === f
                          ? 'bg-charcoal text-ivory font-medium shadow-xs'
                          : 'text-charcoal/70 hover:bg-blush/30 hover:text-charcoal'
                      }`}
                    >
                      <span>{f}</span>
                      {selectedFinish === f && <Check className="h-3 w-3 text-champagne" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="pt-4 border-t border-champagne/15">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                    Max Price
                  </h4>
                  <span className="text-xs font-bold text-champagne font-serif">
                    ₹{maxPriceRupees.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="499"
                  max="3500"
                  step="250"
                  value={maxPriceRupees}
                  onChange={(e) => setMaxPriceRupees(Number(e.target.value))}
                  className="w-full h-1.5 bg-champagne/20 rounded-lg appearance-none cursor-pointer accent-charcoal"
                />
                <div className="flex justify-between text-[10px] text-charcoal/50 mt-1">
                  <span>₹499</span>
                  <span>₹3,500</span>
                </div>
              </div>

              {/* In-Stock Toggle */}
              <div className="pt-4 border-t border-champagne/15">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded text-charcoal focus:ring-champagne accent-charcoal"
                  />
                  <span className="text-xs text-charcoal/80 font-medium">In Stock Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="lg:col-span-3">
            {filtered.length === 0 ? (
              <div className="bg-white/80 rounded-3xl border border-champagne/20 p-12 text-center space-y-4">
                <Search className="h-10 w-10 text-champagne mx-auto stroke-[1.5]" />
                <h3 className="font-serif text-lg text-charcoal">No jewelry matches your filter</h3>
                <p className="text-xs text-charcoal/60 max-w-sm mx-auto">
                  Try adjusting the price slider or resetting the category selection to view our full collection.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedFinish('All');
                    setMaxPriceRupees(3500);
                    setSearchQuery('');
                    setInStockOnly(false);
                  }}
                  className="px-5 py-2.5 bg-charcoal text-ivory rounded-xl text-xs font-medium uppercase tracking-wider hover:bg-champagne hover:text-charcoal transition-all shadow-sm"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((product) => {
                  const discount = Math.round(
                    ((product.mrpMinor - product.priceMinor) / product.mrpMinor) * 100
                  );
                  const isWishlisted = isInWishlist(product.id);

                  return (
                    <div
                      key={product.id}
                      className="group bg-white rounded-2xl border border-champagne/20 overflow-hidden shadow-2xs hover:shadow-xl hover:border-champagne/50 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Image Container */}
                        <div className="relative aspect-4/5 overflow-hidden bg-blush/20">
                          <Link href={`/products/${product.slug}`}>
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </Link>

                          {/* Tag */}
                          {product.tag && (
                            <span className="absolute top-3 left-3 bg-charcoal/90 backdrop-blur-xs text-ivory text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                              {product.tag}
                            </span>
                          )}

                          {/* Wishlist Button */}
                          <button
                            onClick={(e) => toggleWishlist(product, e)}
                            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs rounded-full shadow-xs text-charcoal/70 hover:text-rose hover:scale-110 transition-all cursor-pointer"
                            aria-label="Save to Wishlist"
                          >
                            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-rose text-rose' : ''}`} />
                          </button>
                        </div>

                        {/* Details */}
                        <div className="p-5">
                          <div className="flex items-center justify-between text-[11px] text-charcoal/60 mb-1.5">
                            <span className="text-champagne font-semibold uppercase tracking-wider">
                              {product.category}
                            </span>
                            <span>{product.finish}</span>
                          </div>

                          <Link href={`/products/${product.slug}`}>
                            <h3 className="font-serif text-sm font-medium text-charcoal group-hover:text-champagne transition-colors line-clamp-1">
                              {product.name}
                            </h3>
                          </Link>

                          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-charcoal/70">
                            <div className="flex items-center gap-0.5 text-amber-500">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-semibold text-charcoal text-[11px]">{product.rating}</span>
                            </div>
                            <span className="text-charcoal/40">•</span>
                            <span className="text-charcoal/50 text-[11px]">{product.reviewsCount} reviews</span>
                          </div>

                          <div className="mt-3 flex items-baseline gap-2">
                            <span className="font-serif text-base font-bold text-charcoal">
                              ₹{(product.priceMinor / 100).toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-charcoal/40 line-through">
                              ₹{(product.mrpMinor / 100).toLocaleString('en-IN')}
                            </span>
                            {discount > 0 && (
                              <span className="text-[11px] text-rose font-semibold">
                                {discount}% OFF
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Add CTA */}
                      <div className="p-5 pt-0">
                        <button
                          onClick={(e) => handleQuickAdd(product, e)}
                          className="w-full py-2.5 bg-charcoal text-ivory hover:bg-champagne hover:text-charcoal text-xs font-medium uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group/btn"
                        >
                          <ShoppingBag className="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110" />
                          <span>Quick Add</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center space-y-2">
          <Sparkles className="h-6 w-6 text-champagne animate-spin mx-auto" />
          <p className="text-xs font-serif text-charcoal/60">Loading Moonlet Jewelry Catalog...</p>
        </div>
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
