'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, User, Menu, X, Heart, Sparkles } from 'lucide-react';
import { useCartStore, useCartSummary } from '../../store/cart';

export function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const openCart = useCartStore((s) => s.openCart);
  const { itemCount } = useCartSummary();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const navLinks = [
    { label: 'New In', href: '/products?tag=new' },
    { label: 'Earrings', href: '/products?category=Earrings' },
    { label: 'Necklaces', href: '/products?category=Necklaces' },
    { label: 'Watches', href: '/products?category=Watches' },
    { label: 'Rings', href: '/products?category=Rings' },
    { label: 'Bracelets', href: '/products?category=Bracelets' },
    { label: 'Gift Sets', href: '/products?category=Gift Sets' },
    { label: 'Sale', href: '/products?tag=sale', highlight: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#C9A66B]/20 transition-all">
      {/* 1. Announcement Bar */}
      <div className="bg-charcoal text-ivory text-[11px] sm:text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-champagne shrink-0" />
        <span>
          Complimentary shipping on orders above ₹999 | <strong className="text-champagne font-semibold">Cash on Delivery (COD)</strong> Available across India
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              className="text-charcoal hover:text-champagne-dark focus:outline-none p-1.5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Brand Logo: Moonlet */}
          <div className="flex items-center">
            <Link href="/" className="flex items-baseline gap-1.5 group">
              <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wider text-charcoal group-hover:text-champagne-dark transition-colors">
                MOONLET
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-champagne mb-1" />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[13px] font-semibold text-charcoal/80 uppercase tracking-wider">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`relative py-1 transition-colors hover:text-champagne-dark ${
                  item.highlight
                    ? 'text-rose font-bold'
                    : 'text-charcoal hover:text-charcoal'
                }`}
              >
                {item.label}
                {item.highlight && (
                  <span className="absolute -top-2 -right-3 text-[9px] px-1 py-0.2 rounded-full bg-rose text-white font-bold leading-none">
                    %
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons: Search, Wishlist, Account, Cart */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Input on Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
              <input
                type="text"
                placeholder="Search jewelry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 lg:w-56 pl-8 pr-3 py-1.5 text-xs rounded-full bg-white/70 border border-[#C9A66B]/30 focus:border-champagne focus:bg-white focus:outline-none transition-all placeholder:text-charcoal/40 text-charcoal"
              />
              <Search className="h-3.5 w-3.5 text-charcoal/50 absolute left-2.5 pointer-events-none" />
            </form>

            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-charcoal hover:text-champagne transition-colors"
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Wishlist */}
            <Link
              href="/products?filter=wishlist"
              className="p-2 text-charcoal hover:text-champagne transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </Link>

            {/* Customer Account */}
            <Link
              href="/account/orders"
              className="p-2 text-charcoal hover:text-champagne transition-colors"
              aria-label="Account"
            >
              <User className="h-5 w-5" />
            </Link>

            {/* Cart Drawer Button */}
            <button
              type="button"
              onClick={openCart}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-charcoal text-ivory hover:bg-champagne-dark transition-all shadow-xs"
              aria-label="Open shopping cart"
            >
              <ShoppingBag className="h-4 w-4 text-champagne" />
              <span className="text-xs font-bold">{itemCount}</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Expandable Bar */}
        {isSearchOpen && (
          <form onSubmit={handleSearch} className="md:hidden pb-3 pt-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search earrings, necklaces, watches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-white border border-[#C9A66B]/40 focus:border-champagne focus:outline-none text-charcoal"
                autoFocus
              />
              <Search className="h-4 w-4 text-charcoal/50 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </form>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#C9A66B]/20 bg-[#FAF7F2] px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-3 font-serif text-lg text-charcoal">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-1 flex items-center justify-between border-b border-charcoal/5 ${
                  item.highlight ? 'text-rose font-bold' : 'hover:text-champagne-dark'
                }`}
              >
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="text-[10px] font-sans uppercase font-bold px-2 py-0.5 rounded-full bg-rose text-white">
                    Special Offer
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-charcoal/10 flex flex-col gap-2.5 text-xs text-charcoal/70">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Cash on Delivery (COD) Available Nationwide</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-champagne font-bold">₹ INR</span>
              <span>All prices inclusive of Indian GST</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
