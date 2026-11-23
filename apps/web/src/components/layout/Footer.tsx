import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, RotateCcw, MessageCircle, Heart, Sparkles, CheckCircle2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-charcoal text-ivory/80 mt-24 border-t border-champagne/30 font-sans">
      {/* 10. Trust Bar (5 Pillars per Brief) */}
      <div className="border-b border-white/10 bg-[#161514]">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          <div className="flex flex-col items-center text-center p-3">
            <div className="w-12 h-12 rounded-full bg-champagne/10 border border-champagne/30 text-champagne flex items-center justify-center mb-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-serif font-bold text-ivory">Skin-Friendly Metals</h4>
            <p className="text-xs text-ivory/60 mt-1">Hypoallergenic stainless steel & brass</p>
          </div>

          <div className="flex flex-col items-center text-center p-3">
            <div className="w-12 h-12 rounded-full bg-champagne/10 border border-champagne/30 text-champagne flex items-center justify-center mb-3">
              <RotateCcw className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-serif font-bold text-ivory">Easy 7-Day Returns</h4>
            <p className="text-xs text-ivory/60 mt-1">Hassle-free doorstep pickup & refund</p>
          </div>

          <div className="flex flex-col items-center text-center p-3">
            <div className="w-12 h-12 rounded-full bg-champagne/10 border border-champagne/30 text-champagne flex items-center justify-center mb-3">
              <Truck className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-serif font-bold text-ivory">Cash on Delivery</h4>
            <p className="text-xs text-ivory/60 mt-1">Pay at doorstep across 19,000+ pincodes</p>
          </div>

          <div className="flex flex-col items-center text-center p-3">
            <div className="w-12 h-12 rounded-full bg-champagne/10 border border-champagne/30 text-champagne flex items-center justify-center mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-serif font-bold text-ivory">100% Secure Checkout</h4>
            <p className="text-xs text-ivory/60 mt-1">Razorpay, UPI, Cards & NetBanking</p>
          </div>

          <div className="col-span-2 lg:col-span-1 flex flex-col items-center text-center p-3">
            <div className="w-12 h-12 rounded-full bg-champagne/10 border border-champagne/30 text-champagne flex items-center justify-center mb-3">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-serif font-bold text-ivory">WhatsApp Concierge</h4>
            <p className="text-xs text-ivory/60 mt-1">Instant support: Mon–Sat 10AM–7PM</p>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-10 text-sm">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <Link href="/" className="inline-flex items-baseline gap-1.5">
            <span className="font-serif text-3xl font-black tracking-widest text-ivory">
              MOONLET
            </span>
            <span className="w-2 h-2 rounded-full bg-champagne" />
          </Link>
          <p className="text-xs leading-relaxed text-ivory/70 max-w-sm">
            Affordable everyday luxury for modern Indian women. Thoughtfully designed gold-tone, gold-plated, and stainless steel jewelry with AAA-grade cubic zirconia stones that elevate every outfit effortlessly.
          </p>

          <div className="pt-2 text-xs text-ivory/60 space-y-1">
            <p><strong>Material Transparency:</strong> All items are crafted in gold-tone brass, 18k gold-plated alloys, or durable 316L stainless steel. We do not sell solid bullion gold or natural diamonds.</p>
          </div>
        </div>

        {/* Shop Navigation */}
        <div>
          <h3 className="font-serif text-base font-bold text-ivory mb-4 tracking-wide text-champagne">Shop Jewelry</h3>
          <ul className="space-y-2.5 text-xs">
            <li><Link href="/products?category=Earrings" className="hover:text-champagne transition-colors">Earrings & Studs</Link></li>
            <li><Link href="/products?category=Necklaces" className="hover:text-champagne transition-colors">Pendants & Layered Chains</Link></li>
            <li><Link href="/products?category=Watches" className="hover:text-champagne transition-colors">Minimalist Watches</Link></li>
            <li><Link href="/products?category=Rings" className="hover:text-champagne transition-colors">Stackable Rings</Link></li>
            <li><Link href="/products?category=Bracelets" className="hover:text-champagne transition-colors">Bracelets & Cuffs</Link></li>
            <li><Link href="/products?category=Gift Sets" className="hover:text-champagne transition-colors">Gift Sets in Velvet Boxes</Link></li>
            <li><Link href="/products?tag=sale" className="text-rose font-semibold hover:underline">Special Offers</Link></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h3 className="font-serif text-base font-bold text-ivory mb-4 tracking-wide text-champagne">Help & Care</h3>
          <ul className="space-y-2.5 text-xs">
            <li><Link href="/products?topic=care" className="hover:text-champagne transition-colors">Jewelry Care Guide</Link></li>
            <li><Link href="/products?topic=shipping" className="hover:text-champagne transition-colors">Shipping & Delivery Policy</Link></li>
            <li><Link href="/products?topic=returns" className="hover:text-champagne transition-colors">7-Day Return / Exchange</Link></li>
            <li><Link href="/account/orders" className="hover:text-champagne transition-colors">Track Your Order</Link></li>
            <li><Link href="/products?topic=faq" className="hover:text-champagne transition-colors">Frequently Asked Questions</Link></li>
            <li><a href="https://wa.me/917309936559?text=Hi%20Moonlet%20Support%2C%20I%20need%20help%20with%20an%20order." target="_blank" rel="noopener noreferrer" className="hover:text-champagne transition-colors flex items-center gap-1 text-emerald-400"><span>WhatsApp Support (+91 73099 36559)</span></a></li>
          </ul>
        </div>

        {/* Grievance & Compliance */}
        <div>
          <h3 className="font-serif text-base font-bold text-ivory mb-4 tracking-wide text-champagne">Company & Legal</h3>
          <ul className="space-y-2.5 text-xs">
            <li><span className="text-ivory/50">Grievance Officer:</span></li>
            <li className="text-[11px] text-ivory/70">Aditya Yadav</li>
            <li className="text-[11px] text-ivory/70">care@moonlet.in</li>
            <li className="pt-2"><span className="text-ivory/50">Country of Origin:</span> India</li>
            <li><span className="text-ivory/50">Payments:</span> 100% Encrypted & RBI Compliant</li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal & Payment Icons */}
      <div className="border-t border-white/10 bg-[#121110] py-6 text-xs text-ivory/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Moonlet Fashion Jewelry. All rights reserved. Prices in INR (₹).</p>
          <div className="flex items-center gap-3 text-ivory/60 text-xs">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">UPI</span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Razorpay</span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">RuPay</span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Visa / Mastercard</span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400">Cash on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
