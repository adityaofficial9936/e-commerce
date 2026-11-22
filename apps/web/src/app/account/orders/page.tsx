'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Truck,
  CheckCircle2,
  FileText,
  RotateCcw,
  XCircle,
  ExternalLink,
  ChevronRight,
  X,
  AlertTriangle,
  Upload,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface OrderItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED';
  totalMinor: number;
  shipment?: {
    courierName: string;
    trackingNumber: string;
    trackingUrl?: string;
    shippedAt: string;
    deliveredAt?: string;
  };
  items: {
    productName: string;
    variantTitle: string;
    quantity: number;
    unitPriceMinor: number;
    imageUrl: string;
  }[];
}

const DEMO_ORDERS: OrderItem[] = [
  {
    id: 'ord-101',
    orderNumber: 'MLT-2026-000101',
    createdAt: '18 Nov 2026',
    status: 'SHIPPED',
    totalMinor: 129900,
    shipment: {
      courierName: 'Blue Dart Express',
      trackingNumber: 'BLUEDART884129',
      trackingUrl: 'https://track.bluedart.com',
      shippedAt: '19 Nov 2026, 11:30 AM',
    },
    items: [
      {
        productName: 'Lumina Liquid Gold Herringbone Snake Chain',
        variantTitle: '18k Champagne Gold • 40cm + 5cm Extender',
        quantity: 1,
        unitPriceMinor: 129900,
        imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'ord-100',
    orderNumber: 'MLT-2026-000098',
    createdAt: '10 Nov 2026',
    status: 'DELIVERED',
    totalMinor: 179800,
    shipment: {
      courierName: 'Delhivery',
      trackingNumber: 'DEL559102',
      trackingUrl: 'https://www.delhivery.com',
      shippedAt: '11 Nov 2026',
      deliveredAt: '13 Nov 2026',
    },
    items: [
      {
        productName: 'Celestial Star Huggie Hoops',
        variantTitle: '18k Gold-Tone • Micro Cubic Zirconia',
        quantity: 1,
        unitPriceMinor: 79900,
        imageUrl: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=400&auto=format&fit=crop&q=80',
      },
      {
        productName: 'Cascade Pearl & Gold Drop Earrings',
        variantTitle: '18k Gold-Tone • Shell Pearl',
        quantity: 1,
        unitPriceMinor: 99900,
        imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'ord-102',
    orderNumber: 'MLT-2026-000102',
    createdAt: '21 Nov 2026',
    status: 'CONFIRMED',
    totalMinor: 249900,
    items: [
      {
        productName: 'Petite Roman Square Mesh Watch in Gold',
        variantTitle: 'Champagne Gold • Japanese Quartz',
        quantity: 1,
        unitPriceMinor: 249900,
        imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&auto=format&fit=crop&q=80',
      },
    ],
  },
];

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>(DEMO_ORDERS);
  const [returnModalOrder, setReturnModalOrder] = useState<OrderItem | null>(null);
  const [returnReason, setReturnReason] = useState('Style preference / Want a different piece');
  const [returnComments, setReturnComments] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const steps = ['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];
  const getStepIndex = (status: string) => steps.indexOf(status);

  const handleCancelOrder = (orderId: string, orderNumber: string) => {
    if (confirm(`Are you sure you want to cancel order ${orderNumber}? If already paid, an automatic refund will be triggered to your original payment method.`)) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
      );
      setToastMessage(`Order ${orderNumber} cancelled. Refund initiated to original source within 24 hours.`);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalOrder) return;

    setIsSubmittingReturn(true);
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === returnModalOrder.id ? { ...o, status: 'RETURN_REQUESTED' } : o
        )
      );

      setToastMessage(`7-Day Return requested for ${returnModalOrder.orderNumber}! Our courier partner will pick up the package directly from your address.`);
      setTimeout(() => setToastMessage(null), 5000);
      setIsSubmittingReturn(false);
      setReturnModalOrder(null);
    }, 700);
  };

  return (
    <div className="bg-ivory min-h-screen text-charcoal font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-6 p-4 bg-charcoal text-ivory rounded-2xl text-xs font-medium flex items-center justify-between shadow-lg border border-champagne/30 animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-champagne" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-ivory/60 hover:text-ivory">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-champagne/20 gap-4">
          <div>
            <nav className="text-xs text-charcoal/60 mb-2 flex items-center gap-2">
              <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
              <span>/</span>
              <span className="text-champagne font-semibold">My Account</span>
            </nav>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-charcoal">
              Order History &amp; Tracking
            </h1>
            <p className="text-xs text-charcoal/60 mt-1">
              Track live Blue Dart / Delhivery courier status, download tax invoices, and schedule 7-day doorstep returns.
            </p>
          </div>

          <Link
            href="/products"
            className="text-xs font-medium uppercase tracking-wider px-5 py-2.5 bg-charcoal text-ivory hover:bg-champagne hover:text-charcoal rounded-xl transition-all shadow-xs self-start sm:self-auto"
          >
            Explore Jewelry
          </Link>
        </div>

        {/* Orders List */}
        <div className="mt-8 space-y-8">
          {orders.map((order) => {
            const currentStepIdx = getStepIndex(order.status);

            return (
              <div
                key={order.id}
                className="bg-white/90 backdrop-blur-md rounded-3xl border border-champagne/20 overflow-hidden shadow-xs"
              >
                {/* Order Header */}
                <div className="p-6 bg-ivory/50 border-b border-champagne/20 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-6 text-xs text-charcoal/70">
                    <div>
                      <span className="block text-charcoal/50 text-[11px] uppercase tracking-wider">Reference</span>
                      <span className="font-mono font-bold text-charcoal text-sm">{order.orderNumber}</span>
                    </div>
                    <div>
                      <span className="block text-charcoal/50 text-[11px] uppercase tracking-wider">Placed On</span>
                      <span className="font-medium text-charcoal">{order.createdAt}</span>
                    </div>
                    <div>
                      <span className="block text-charcoal/50 text-[11px] uppercase tracking-wider">Total Amount</span>
                      <span className="font-serif font-bold text-charcoal text-sm">
                        ₹{(order.totalMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : order.status === 'SHIPPED'
                          ? 'bg-champagne/20 text-charcoal border border-champagne/40'
                          : order.status === 'CANCELLED'
                          ? 'bg-rose/10 text-rose border border-rose/20'
                          : order.status === 'RETURN_REQUESTED'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : 'bg-blush/40 text-charcoal border border-champagne/20'
                      }`}
                    >
                      {order.status}
                    </span>

                    <a
                      href={`http://localhost:4000/v1/orders/${order.id}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal bg-white border border-champagne/30 px-3 py-1.5 rounded-xl hover:bg-blush/20 transition-all shadow-2xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-champagne" />
                      Invoice PDF
                    </a>
                  </div>
                </div>

                {/* Stepper */}
                {!['CANCELLED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status) && (
                  <div className="px-6 py-5 bg-white border-b border-champagne/15">
                    <div className="relative flex justify-between">
                      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-ivory -z-0" />
                      <div
                        className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-champagne -z-0 transition-all duration-500"
                        style={{
                          width: `${Math.max(0, (currentStepIdx / (steps.length - 1)) * 100)}%`,
                        }}
                      />

                      {steps.map((s, idx) => {
                        const isComplete = idx <= currentStepIdx;
                        return (
                          <div key={s} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isComplete
                                  ? 'bg-charcoal text-ivory shadow-xs'
                                  : 'bg-white border-2 border-champagne/30 text-charcoal/40'
                              }`}
                            >
                              {isComplete ? '✓' : idx + 1}
                            </div>
                            <span
                              className={`text-[10px] uppercase tracking-wider mt-1.5 font-medium ${
                                isComplete ? 'text-charcoal font-semibold' : 'text-charcoal/40'
                              }`}
                            >
                              {s}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items in Order */}
                <div className="p-6 divide-y divide-champagne/15 space-y-4">
                  {order.items.map((i, idx) => (
                    <div key={idx} className="pt-4 first:pt-0 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={i.imageUrl}
                          alt={i.productName}
                          className="w-16 h-16 object-cover rounded-xl bg-ivory border border-champagne/20 shrink-0"
                        />
                        <div>
                          <h4 className="font-serif text-sm font-medium text-charcoal">
                            {i.productName}
                          </h4>
                          <p className="text-xs text-charcoal/60 mt-0.5">{i.variantTitle}</p>
                          <p className="text-xs text-charcoal/50 mt-1">Qty: {i.quantity}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-serif text-sm font-bold text-charcoal">
                          ₹{(i.unitPriceMinor / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tracking & Return Actions */}
                <div className="px-6 py-4 bg-ivory/40 border-t border-champagne/15 flex flex-wrap items-center justify-between gap-4 text-xs">
                  {order.shipment ? (
                    <div className="flex items-center gap-2 text-charcoal/70">
                      <Truck className="h-4 w-4 text-champagne shrink-0" />
                      <span>
                        Dispatched via <strong>{order.shipment.courierName}</strong> (AWB:{' '}
                        <code className="font-mono text-charcoal font-semibold">{order.shipment.trackingNumber}</code>)
                      </span>
                    </div>
                  ) : (
                    <div className="text-charcoal/60">
                      Preparing package in Moonlet anti-tarnish jewelry pouch.
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {order.status === 'DELIVERED' && (
                      <button
                        onClick={() => setReturnModalOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-champagne/40 rounded-xl text-charcoal hover:bg-blush/30 transition-all font-medium text-xs cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-champagne" />
                        7-Day Return / Exchange
                      </button>
                    )}

                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                        className="text-rose hover:text-rose-dark font-medium text-xs transition-colors cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 7-Day Return Modal */}
        {returnModalOrder && (
          <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-champagne/30 shadow-2xl max-w-md w-full p-6 space-y-4 font-sans animate-fade-in">
              <div className="flex items-center justify-between border-b border-champagne/20 pb-3">
                <h3 className="font-serif text-base font-medium text-charcoal flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-champagne" />
                  Request 7-Day Return
                </h3>
                <button onClick={() => setReturnModalOrder(null)} className="text-charcoal/60 hover:text-charcoal">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-charcoal/70">
                Order: <strong className="font-mono text-charcoal">{returnModalOrder.orderNumber}</strong>. Our courier executive will collect the piece from your delivery address.
              </p>

              <form onSubmit={handleSubmitReturn} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-charcoal/80 mb-1">
                    Select Reason
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-champagne/30 rounded-xl bg-ivory/50 focus:outline-none focus:border-champagne"
                  >
                    <option value="Style preference / Want a different piece">Style preference / Exchange for another piece</option>
                    <option value="Chain length or ring fit mismatch">Chain length or ring fit mismatch</option>
                    <option value="Received damaged or flawed item">Received damaged or flawed item</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal/80 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={returnComments}
                    onChange={(e) => setReturnComments(e.target.value)}
                    placeholder="Provide any additional details for courier pickup..."
                    className="w-full px-3 py-2 text-xs border border-champagne/30 rounded-xl bg-ivory/50 focus:outline-none focus:border-champagne"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnModalOrder(null)}
                    className="flex-1 py-2.5 border border-champagne/30 rounded-xl text-xs font-medium text-charcoal hover:bg-blush/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReturn}
                    className="flex-1 py-2.5 bg-charcoal hover:bg-champagne hover:text-charcoal text-ivory rounded-xl text-xs font-medium uppercase tracking-wider transition-all"
                  >
                    {isSubmittingReturn ? 'Submitting...' : 'Confirm Return'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
