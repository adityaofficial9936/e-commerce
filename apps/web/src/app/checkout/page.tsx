'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  FileText,
  ArrowRight,
  Lock,
  Smartphone,
  Building2,
  X,
  AlertCircle,
  Sparkles,
  Gift,
} from 'lucide-react';
import { useCartStore, useCartSummary } from '../../store/cart';
import { apiClient } from '../../lib/api-client';
import { TextShimmerWave } from '@/components/core/text-shimmer-wave';

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const { subtotalMinor, discountMinor, taxMinor, shippingMinor, totalMinor } =
    useCartSummary();

  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayTab, setRazorpayTab] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [upiId, setUpiId] = useState('aditya@oksbi');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [isGiftPackaging, setIsGiftPackaging] = useState(true);

  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    orderId: string;
    totalMinor: number;
    paymentMethod: string;
  } | null>(null);

  const [address, setAddress] = useState({
    name: 'Aditya Yadav',
    phone: '+91 9876543210',
    street: '101 Marine Lines, Near Wankhede',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400020',
  });

  const handleStartCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (paymentMethod === 'RAZORPAY') {
      setShowRazorpayModal(true);
      return;
    }

    // COD Checkout
    executeOrderPlacement('Cash on Delivery (Pending)');
  };

  const executeOrderPlacement = async (paymentLabel: string) => {
    setIsSubmitting(true);
    setShowRazorpayModal(false);

    const generatedOrderNumber = `MLT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const generatedOrderId = `ord-${Date.now()}`;

    // Persist order to shared database
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: generatedOrderId,
          orderNumber: `#${Math.floor(100000 + Math.random() * 900000)}`,
          customerName: address.name,
          customerEmail: 'aditya.customer@moonlet.in',
          customerPhone: address.phone,
          customerInitials: address.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
          deliveryType: 'Shipping',
          status: paymentMethod === 'RAZORPAY' ? 'PAID' : 'CONFIRMED',
          date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          totalMinor,
          productThumb: items[0]?.imageUrl || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=100&auto=format&fit=crop&q=80',
          address: `${address.street}, ${address.city}, ${address.state} ${address.pincode}`,
          courierName: 'Blue Dart Express',
          trackingNumber: `BLUEDART-${Math.floor(10000000 + Math.random() * 90000000)}`,
          items: items.map((i) => ({
            id: `li-${Date.now()}-${Math.random()}`,
            name: i.name,
            variant: i.variantTitle,
            quantity: i.quantity,
            priceMinor: i.priceMinor,
            imageUrl: i.imageUrl,
          })),
        }),
      });
    } catch (err) {
      console.error('Failed to post order to /api/orders:', err);
    }

    try {
      // Send real checkout payload to backend API (POST /v1/checkout)
      await apiClient.post('/checkout', {
        shippingAddress: address,
        paymentMethod,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      }).catch(() => null);
    } catch {
      // Local fallback
    }

    setTimeout(() => {
      setConfirmedOrder({
        orderId: generatedOrderId,
        orderNumber: generatedOrderNumber,
        totalMinor,
        paymentMethod: paymentLabel,
      });
      clearCart();
      setIsSubmitting(false);
    }, 800);
  };

  if (confirmedOrder) {
    return (
      <div className="bg-ivory min-h-screen text-charcoal font-sans flex items-center justify-center py-16 px-4">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-champagne/30 p-8 sm:p-12 text-center shadow-xl animate-fade-in space-y-6">
          <div className="w-16 h-16 bg-blush/40 border border-champagne/40 text-champagne rounded-full flex items-center justify-center mx-auto shadow-2xs">
            <Sparkles className="h-8 w-8 stroke-[1.5]" />
          </div>

          <div>
            <span className="text-[11px] font-semibold text-champagne uppercase tracking-widest block mb-1">
              Order Confirmed
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal tracking-tight">
              Thank You for Choosing Moonlet
            </h1>
            <p className="text-xs text-charcoal/60 mt-1 max-w-sm mx-auto">
              Your jewelry pieces have been reserved and are being carefully packaged in our signature velvet pouch.
            </p>
          </div>

          <div className="p-6 bg-ivory/60 border border-champagne/20 rounded-2xl text-left space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-charcoal/60">Order Reference:</span>
              <span className="font-mono font-bold text-charcoal">{confirmedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/60">Payment Status:</span>
              <span className="font-semibold text-emerald-800">
                {confirmedOrder.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/60">Total Paid (Incl. GST):</span>
              <span className="font-serif font-bold text-sm text-charcoal">
                ₹{(confirmedOrder.totalMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-champagne/20">
              <span className="text-charcoal/60">Delivery Address:</span>
              <span className="text-charcoal/90 text-right max-w-xs font-medium">
                {address.street}, {address.city}, {address.state} - {address.pincode}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a
              href={`http://localhost:4000/v1/orders/${confirmedOrder.orderId}/invoice`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 bg-white border border-champagne/30 hover:bg-blush/20 text-charcoal font-medium text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <FileText className="h-4 w-4 text-champagne" />
              Download GST Tax Invoice
            </a>

            <Link
              href="/account/orders"
              className="px-6 py-3 bg-charcoal hover:bg-champagne hover:text-charcoal text-ivory font-medium text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Truck className="h-4 w-4" />
              Track Shipment Status
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory min-h-screen text-charcoal font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="pb-8 border-b border-champagne/20">
          <nav className="text-xs text-charcoal/60 mb-2 flex items-center gap-2">
            <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-charcoal transition-colors">Jewelry</Link>
            <span>/</span>
            <span className="text-champagne font-semibold">Checkout</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-charcoal">
            Secure Express Checkout
          </h1>
          <p className="text-xs text-charcoal/60 mt-1">
            Complimentary shipping on all orders over ₹999. RBI compliant 256-bit encrypted gateway.
          </p>
        </div>

        <form onSubmit={handleStartCheckout} className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Shipping & Payment */}
          <div className="lg:col-span-7 space-y-6">
            {/* Delivery Address Card */}
            <div className="bg-white/80 backdrop-blur-xs p-6 sm:p-8 rounded-3xl border border-champagne/20 shadow-xs space-y-5">
              <h2 className="font-serif text-lg font-medium text-charcoal flex items-center gap-2.5">
                <Truck className="h-5 w-5 text-champagne" />
                1. Delivery Shipping Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal/80 mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.name}
                    onChange={(e) => setAddress({ ...address, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-ivory/50 border border-champagne/30 rounded-xl text-xs font-medium text-charcoal focus:outline-none focus:border-champagne"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal/80 mb-1">
                    Contact Mobile Number (For Courier Updates) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-ivory/50 border border-champagne/30 rounded-xl text-xs font-medium text-charcoal focus:outline-none focus:border-champagne"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-charcoal/80 mb-1">
                    Street Address, Flat / Floor &amp; Landmark *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-ivory/50 border border-champagne/30 rounded-xl text-xs font-medium text-charcoal focus:outline-none focus:border-champagne"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal/80 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-ivory/50 border border-champagne/30 rounded-xl text-xs font-medium text-charcoal focus:outline-none focus:border-champagne"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal/80 mb-1">
                    Indian PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2.5 bg-ivory/50 border border-champagne/30 rounded-xl text-xs font-mono font-medium text-charcoal focus:outline-none focus:border-champagne"
                  />
                </div>
              </div>

              {/* Gift Packaging Checkbox */}
              <div className="pt-2 border-t border-champagne/15">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-blush/20 rounded-xl border border-champagne/20">
                  <input
                    type="checkbox"
                    checked={isGiftPackaging}
                    onChange={(e) => setIsGiftPackaging(e.target.checked)}
                    className="rounded text-charcoal focus:ring-champagne accent-charcoal"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-semibold text-charcoal flex items-center gap-1.5">
                      <Gift className="h-3.5 w-3.5 text-champagne" />
                      Complimentary Moonlet Luxury Velvet Pouch &amp; Note
                    </span>
                    <p className="text-[11px] text-charcoal/60 mt-0.5">
                      Each order comes wrapped in signature anti-tarnish tissue with an optional greeting card.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white/80 backdrop-blur-xs p-6 sm:p-8 rounded-3xl border border-champagne/20 shadow-xs space-y-4">
              <h2 className="font-serif text-lg font-medium text-charcoal flex items-center gap-2.5">
                <CreditCard className="h-5 w-5 text-champagne" />
                2. Choose Payment Method
              </h2>

              <div className="space-y-3">
                <label
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'RAZORPAY'
                      ? 'border-champagne bg-ivory/60 ring-2 ring-champagne/20 shadow-2xs'
                      : 'border-champagne/20 hover:bg-blush/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'RAZORPAY'}
                    onChange={() => setPaymentMethod('RAZORPAY')}
                    className="mt-1 text-charcoal focus:ring-champagne accent-charcoal"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-charcoal">
                        Razorpay India (UPI, Google Pay, PhonePe, Cards, NetBanking)
                      </span>
                      <span className="text-[10px] font-semibold text-charcoal bg-champagne/20 border border-champagne/30 px-2 py-0.5 rounded-full">
                        Instant Confirmation
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal/60 mt-0.5">
                      Pay securely with any UPI app, RuPay, Visa, Mastercard, or Indian NetBanking.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-champagne bg-ivory/60 ring-2 ring-champagne/20 shadow-2xs'
                      : 'border-champagne/20 hover:bg-blush/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-1 text-charcoal focus:ring-champagne accent-charcoal"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-charcoal">
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        No Extra Surcharge
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal/60 mt-0.5">
                      Pay via cash or UPI directly to your Blue Dart / Delhivery courier agent upon delivery.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-champagne/20 shadow-xs space-y-5 sticky top-24">
              <h2 className="font-serif text-lg font-medium text-charcoal pb-3 border-b border-champagne/20">
                Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
              </h2>

              {/* Line items */}
              <div className="max-h-56 overflow-y-auto divide-y divide-champagne/15 space-y-2 pr-1">
                {items.map((i) => (
                  <div key={i.variantId} className="pt-2 flex gap-3 text-xs">
                    <img
                      src={i.imageUrl}
                      alt={i.name}
                      className="w-12 h-12 object-cover rounded-xl bg-ivory border border-champagne/20 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-charcoal truncate">{i.name}</p>
                      <p className="text-charcoal/50 text-[11px]">{i.variantTitle} × {i.quantity}</p>
                    </div>
                    <span className="font-semibold text-charcoal">
                      ₹{((i.priceMinor * i.quantity) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="space-y-2 pt-4 border-t border-champagne/20 text-xs text-charcoal/70">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-charcoal">
                    ₹{(subtotalMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {discountMinor > 0 && (
                  <div className="flex justify-between text-rose font-medium">
                    <span>Coupon Discount</span>
                    <span>- ₹{(discountMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (Included)</span>
                  <span>₹{(taxMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Express Shipping</span>
                  <span>
                    {shippingMinor === 0 ? (
                      <strong className="text-champagne font-semibold">FREE (Orders &gt; ₹999)</strong>
                    ) : (
                      `₹${(shippingMinor / 100).toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-serif font-bold text-charcoal pt-3 border-t border-champagne/20">
                  <span>Total Amount</span>
                  <span>₹{(totalMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full flex items-center justify-center gap-2 py-4 bg-charcoal hover:bg-champagne hover:text-charcoal text-ivory font-medium text-xs uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-75 cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                {isSubmitting ? (
                  <TextShimmerWave duration={1.2} className="font-medium text-xs text-ivory">
                    Securing payment session...
                  </TextShimmerWave>
                ) : paymentMethod === 'RAZORPAY' ? (
                  `Pay via Razorpay • ₹${(totalMinor / 100).toLocaleString('en-IN')}`
                ) : (
                  `Confirm COD Order • ₹${(totalMinor / 100).toLocaleString('en-IN')}`
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-charcoal/50">
                <ShieldCheck className="h-4 w-4 text-champagne" />
                <span>256-Bit SSL Encrypted &amp; RBI Compliant Checkout</span>
              </div>
            </div>
          </div>
        </form>

        {/* Razorpay Gateway Simulation Modal */}
        {showRazorpayModal && (
          <div className="fixed inset-0 z-50 bg-charcoal/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-champagne/30 shadow-2xl max-w-md w-full overflow-hidden animate-fade-in font-sans">
              {/* Header */}
              <div className="bg-charcoal text-ivory p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-champagne text-charcoal flex items-center justify-center font-bold text-sm">
                    M
                  </div>
                  <div>
                    <h3 className="font-serif font-medium text-sm tracking-wide">Moonlet Secure Payment</h3>
                    <p className="text-[10px] text-ivory/60">Powered by Razorpay India</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRazorpayModal(false)}
                  className="text-ivory/60 hover:text-ivory p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Amount Strip */}
              <div className="px-6 py-3 bg-ivory border-b border-champagne/20 flex justify-between items-center text-xs">
                <span className="text-charcoal/70">Amount Payable:</span>
                <span className="font-serif font-bold text-base text-charcoal">
                  ₹{(totalMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Tabs */}
              <div className="p-6 space-y-4">
                <div className="flex bg-ivory p-1 rounded-xl border border-champagne/20">
                  <button
                    type="button"
                    onClick={() => setRazorpayTab('UPI')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      razorpayTab === 'UPI' ? 'bg-charcoal text-ivory shadow-xs' : 'text-charcoal/60'
                    }`}
                  >
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setRazorpayTab('CARD')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      razorpayTab === 'CARD' ? 'bg-charcoal text-ivory shadow-xs' : 'text-charcoal/60'
                    }`}
                  >
                    Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setRazorpayTab('NETBANKING')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      razorpayTab === 'NETBANKING' ? 'bg-charcoal text-ivory shadow-xs' : 'text-charcoal/60'
                    }`}
                  >
                    NetBanking
                  </button>
                </div>

                {razorpayTab === 'UPI' && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-medium text-charcoal/80">
                      Enter UPI ID / VPA
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. mobile@upi"
                      className="w-full px-3 py-2 text-xs border border-champagne/30 rounded-xl bg-ivory/50 focus:outline-none focus:border-champagne"
                    />
                    <div className="flex items-center justify-between text-[11px] text-charcoal/60 pt-1">
                      <span>Supported: GPay, PhonePe, Paytm, BHIM</span>
                    </div>
                  </div>
                )}

                {razorpayTab === 'CARD' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-charcoal/80 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-champagne/30 rounded-xl bg-ivory/50 focus:outline-none focus:border-champagne"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-charcoal/80 mb-1">Expiry</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono border border-champagne/30 rounded-xl bg-ivory/50 focus:outline-none focus:border-champagne"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-charcoal/80 mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono border border-champagne/30 rounded-xl bg-ivory/50 focus:outline-none focus:border-champagne"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {razorpayTab === 'NETBANKING' && (
                  <div className="space-y-2 pt-2 text-xs text-charcoal/80">
                    <p className="font-medium">Select Popular Bank:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          className="p-2.5 bg-ivory rounded-xl border border-champagne/20 hover:border-champagne text-xs font-medium text-center"
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => executeOrderPlacement('Razorpay Paid (Encrypted)')}
                  className="w-full mt-4 py-3 bg-charcoal hover:bg-champagne hover:text-charcoal text-ivory text-xs font-medium uppercase tracking-wider rounded-xl transition-all shadow-md"
                >
                  Pay ₹{(totalMinor / 100).toLocaleString('en-IN')} Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
