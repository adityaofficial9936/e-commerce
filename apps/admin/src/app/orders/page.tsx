'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  FileText,
  Filter,
  Search,
  ExternalLink,
  X,
  Printer,
  Copy,
  ChevronDown,
  Check,
  RotateCcw,
  Maximize2,
  MoreHorizontal,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';

interface OrderLineItem {
  id: string;
  name: string;
  variant: string;
  quantity: number;
  priceMinor: number;
  imageUrl: string;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerInitials: string;
  deliveryType: 'Shipping' | 'Pickups';
  status: 'PAID' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  date: string;
  totalMinor: number;
  productThumb: string;
  courierName?: string;
  trackingNumber?: string;
  address: string;
  items: OrderLineItem[];
}

const INITIAL_ORDERS: AdminOrder[] = [
  {
    id: 'ord-101',
    orderNumber: '#192541',
    customerName: 'Esther Howard',
    customerEmail: 'esther.howard@gmail.com',
    customerPhone: '+1 (415) 555-2671',
    customerInitials: 'EH',
    deliveryType: 'Shipping',
    status: 'PAID',
    date: 'Jun 19',
    totalMinor: 312700,
    productThumb: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80',
    address: '4517 Washington Ave. Manchester, Kentucky 39495',
    courierName: 'Blue Dart Express',
    trackingNumber: 'BLUEDART-88229911',
    items: [
      {
        id: 'li-1',
        name: 'Stihl TS 800 cut-off machine incl. 5x diamond cutting discs',
        variant: 'Standard / 14-inch',
        quantity: 1,
        priceMinor: 159000,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80',
      },
      {
        id: 'li-2',
        name: 'Gasoline generator EYG 7500i (Inverter)',
        variant: '7.5 kW / Silent',
        quantity: 1,
        priceMinor: 153700,
        imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=100&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'ord-102',
    orderNumber: '#192540',
    customerName: 'David Miller',
    customerEmail: 'david.miller@gmail.com',
    customerPhone: '+1 (415) 555-8912',
    customerInitials: 'DM',
    deliveryType: 'Pickups',
    status: 'PAID',
    date: 'Jun 19',
    totalMinor: 127000,
    productThumb: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&auto=format&fit=crop&q=80',
    address: 'Warehouse Hub 3, Bay 14 (Self Pickup)',
    items: [
      {
        id: 'li-3',
        name: 'AeroDry Seamless Breathable Training Tee',
        variant: 'Size L / Heather Grey',
        quantity: 1,
        priceMinor: 127000,
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'ord-103',
    orderNumber: '#192539',
    customerName: 'James Moore',
    customerEmail: 'jmoore@workmail.com',
    customerPhone: '+1 (415) 555-3341',
    customerInitials: 'JM',
    deliveryType: 'Shipping',
    status: 'PAID',
    date: 'Jun 19',
    totalMinor: 245930,
    productThumb: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&auto=format&fit=crop&q=80',
    address: '8502 Preston Rd. Inglewood, Maine 98380',
    items: [
      {
        id: 'li-4',
        name: 'Pro Tactical Waterproof Gym Duffel 45L',
        variant: '45 Litres / Tactical Camo',
        quantity: 1,
        priceMinor: 245930,
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'ord-104',
    orderNumber: '#192538',
    customerName: 'Robert Anderson',
    customerEmail: 'r.anderson@yahoo.com',
    customerPhone: '+1 (415) 555-4421',
    customerInitials: 'RA',
    deliveryType: 'Shipping',
    status: 'PAID',
    date: 'Jun 19',
    totalMinor: 67500,
    productThumb: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100&auto=format&fit=crop&q=80',
    address: '3517 W. Gray St. Utica, Pennsylvania 57867',
    items: [
      {
        id: 'li-5',
        name: 'ProCompression High-Tension Running Tights',
        variant: 'Size S / Deep Cobalt',
        quantity: 1,
        priceMinor: 67500,
        imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'ord-105',
    orderNumber: '#192537',
    customerName: 'Jessica Martinez',
    customerEmail: 'jess.m@gmail.com',
    customerPhone: '+1 (415) 555-9012',
    customerInitials: 'JM',
    deliveryType: 'Shipping',
    status: 'REFUNDED',
    date: 'Jun 18',
    totalMinor: 79500,
    productThumb: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=100&auto=format&fit=crop&q=80',
    address: '2972 Westheimer Rd. Santa Ana, Illinois 85486',
    items: [
      {
        id: 'li-6',
        name: 'Carbon Glide Elite Marathon Racing Shoe',
        variant: 'Size UK 8 / White',
        quantity: 1,
        priceMinor: 79500,
        imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=100&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'ord-106',
    orderNumber: '#192536',
    customerName: 'William Jackson',
    customerEmail: 'william.j@outlook.com',
    customerPhone: '+1 (415) 555-1123',
    customerInitials: 'WJ',
    deliveryType: 'Shipping',
    status: 'PAID',
    date: 'Jun 18',
    totalMinor: 225010,
    productThumb: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80',
    address: '1901 Thornridge Cir. Shiloh, Hawaii 81063',
    items: [
      {
        id: 'li-7',
        name: 'Air Velocity Pro Running Sneakers',
        variant: 'Size 10 / Onyx Black',
        quantity: 1,
        priceMinor: 225010,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'ord-107',
    orderNumber: '#192535',
    customerName: 'Christopher Harris',
    customerEmail: 'c.harris@gmail.com',
    customerPhone: '+1 (415) 555-6678',
    customerInitials: 'CH',
    deliveryType: 'Pickups',
    status: 'PAID',
    date: 'Jun 18',
    totalMinor: 52000,
    productThumb: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=100&auto=format&fit=crop&q=80',
    address: 'Warehouse Hub 1, Bay 4 (Self Pickup)',
    items: [
      {
        id: 'li-8',
        name: 'Hyper Cushion Trail Runner Insole Pack',
        variant: 'Standard',
        quantity: 1,
        priceMinor: 52000,
        imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=100&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'ord-108',
    orderNumber: '#192534',
    customerName: 'Marcus Kenter',
    customerEmail: 'marcus.k@icloud.com',
    customerPhone: '+1 (415) 555-7722',
    customerInitials: 'MK',
    deliveryType: 'Shipping',
    status: 'CANCELLED',
    date: 'Jun 18',
    totalMinor: 84500,
    productThumb: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&auto=format&fit=crop&q=80',
    address: '6391 Elgin St. Celina, Delaware 10299',
    items: [
      {
        id: 'li-9',
        name: 'Pro Tactical Waterproof Gym Duffel 30L',
        variant: '30 Litres / Olive',
        quantity: 1,
        priceMinor: 84500,
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&auto=format&fit=crop&q=80',
      },
    ],
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>(INITIAL_ORDERS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeOrderModal, setActiveOrderModal] = useState<AdminOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [dispatchModalOrder, setDispatchModalOrder] = useState<AdminOrder | null>(null);
  const [courierName, setCourierName] = useState('Blue Dart');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Fetch live orders from shared database
  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setOrders(data);
        }
      })
      .catch((err) => console.error('Failed to load orders:', err));
  }, []);

  // Toggle Single Row Selection
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select All
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && o.deliveryType !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNumber = o.orderNumber.toLowerCase().includes(q);
      const matchCustomer = o.customerName.toLowerCase().includes(q);
      if (!matchNumber && !matchCustomer) return false;
    }
    return true;
  });

  const handleShipOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchModalOrder || !trackingNumber.trim()) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === dispatchModalOrder.id
          ? {
              ...o,
              status: 'SHIPPED',
              courierName,
              trackingNumber: trackingNumber.trim(),
            }
          : o
      )
    );
    if (activeOrderModal && activeOrderModal.id === dispatchModalOrder.id) {
      setActiveOrderModal({
        ...activeOrderModal,
        status: 'SHIPPED',
        courierName,
        trackingNumber: trackingNumber.trim(),
      });
    }
    setDispatchModalOrder(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex">
      {/* Center Main Stage (Table & Controls) */}
      <div className="flex-1 min-w-0 p-6 lg:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Orders
          </h1>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => alert('Importing order manifest from ERP...')}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>+ Import</span>
            </button>
            <button
              type="button"
              onClick={() => alert('Exporting orders CSV/Excel report...')}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>↑ Export</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Type Filter Pill */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full appearance-none pr-7 cursor-pointer focus:outline-none shadow-xs"
            >
              <option value="ALL">Type: All</option>
              <option value="Shipping">Type: Shipping</option>
              <option value="Pickups">Type: Pickups</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3 w-3 text-white pointer-events-none" />
          </div>

          {/* Status Filter Pill */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-full appearance-none pr-7 cursor-pointer hover:bg-slate-50 focus:outline-none shadow-xs"
            >
              <option value="ALL">Status: All</option>
              <option value="PAID">Status: Paid</option>
              <option value="SHIPPED">Status: Shipped</option>
              <option value="REFUNDED">Status: Refunded</option>
              <option value="CANCELLED">Status: Cancelled</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3 w-3 text-slate-500 pointer-events-none" />
          </div>

          {/* Date Filter Pill */}
          <button
            type="button"
            className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-slate-50 shadow-xs"
          >
            <span>Order date</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {/* All Filters Pill */}
          <button
            type="button"
            className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-slate-50 shadow-xs"
          >
            <Filter className="h-3 w-3 text-slate-400" />
            <span>All filters</span>
          </button>
        </div>

        {/* Clean Shakuro Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fcfdfe] text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredOrders.length}
                      onChange={toggleSelectAll}
                      className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Order ▾</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredOrders.map((order) => {
                  const isChecked = selectedIds.includes(order.id);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setActiveOrderModal(order)}
                      className={`hover:bg-[#f8fafc] transition-colors cursor-pointer ${
                        isChecked ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleSelect(order.id, e as any)}
                          className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Order Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{order.orderNumber}</span>
                        <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600 cursor-pointer" />
                      </td>

                      {/* Customer with Initial Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {order.customerInitials}
                          </div>
                          <span className="font-semibold text-slate-900">{order.customerName}</span>
                        </div>
                      </td>

                      {/* Delivery Type */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {order.deliveryType}
                      </td>

                      {/* Status Indicator */}
                      <td className="py-3.5 px-4">
                        {order.status === 'PAID' && (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                            <span>✓</span> Paid
                          </span>
                        )}
                        {order.status === 'SHIPPED' && (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-600">
                            <span>🚚</span> Shipped
                          </span>
                        )}
                        {order.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-500">
                            <span>✕</span> Cancelled
                          </span>
                        )}
                        {order.status === 'REFUNDED' && (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                            <span>↩</span> Refunded
                          </span>
                        )}
                      </td>

                      {/* Product Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img src={order.productThumb} alt="Product" className="w-full h-full object-cover" />
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                        ${(order.totalMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {order.date}
                      </td>

                      {/* Row Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveOrderModal(order);
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Floating Bulk Action Bar (when rows are selected) */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-4 text-xs font-semibold animate-scale-in">
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-white flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <span>Selected: {selectedIds.length}</span>
            <div className="h-3.5 w-px bg-slate-700" />
            <button
              onClick={() => alert(`Exporting ${selectedIds.length} selected orders...`)}
              className="hover:text-blue-400 transition-colors"
            >
              ↑ Export
            </button>
            <button
              onClick={() => alert(`Printing packing slips for ${selectedIds.length} orders...`)}
              className="hover:text-blue-400 transition-colors"
            >
              🖨 Print
            </button>
            <button
              onClick={() => alert(`Duplicated ${selectedIds.length} orders`)}
              className="hover:text-blue-400 transition-colors"
            >
              ⧉ Duplicate
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Shakuro Analytics Panel */}
      <aside className="w-80 border-l border-slate-200/80 bg-white p-6 space-y-6 shrink-0 hidden xl:block overflow-y-auto">
        {/* Receipt of Goods Section */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Receipt of Goods
          </span>

          {/* Donut Semi-Circle Gauge */}
          <div className="relative flex flex-col items-center justify-center pt-2">
            <svg className="w-40 h-24 overflow-visible" viewBox="0 0 160 90">
              {/* Background Arc */}
              <path
                d="M 15 85 A 65 65 0 0 1 145 85"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Highlighted Arc */}
              <path
                d="M 15 85 A 65 65 0 0 1 125 35"
                fill="none"
                stroke="#0f172a"
                strokeWidth="14"
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center -mt-8">
              <span className="text-xl font-black text-slate-900 block tracking-tight">$2.2m</span>
              <span className="text-[10px] text-slate-400 font-semibold">242 orders</span>
            </div>
          </div>

          {/* Breakdown numbers */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <span className="w-2 h-2 rounded-full bg-slate-900" />
                <span>$864,600</span>
              </div>
              <span className="text-[10px] text-slate-400 ml-3.5 block">96 shipments</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span>$1.34m</span>
              </div>
              <span className="text-[10px] text-slate-400 ml-3.5 block">147 pickups</span>
            </div>
          </div>
        </div>

        {/* Orders Status Segmented Bar */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Orders Status
            </span>
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 cursor-pointer">
              Active <ChevronDown className="h-3 w-3 text-slate-400" />
            </span>
          </div>

          {/* Horizontal Segmented Bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: '89%' }} />
            <div className="bg-rose-500 h-full" style={{ width: '8%' }} />
            <div className="bg-amber-500 h-full" style={{ width: '3%' }} />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Paid 89%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Cancelled 8%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Refunded 3%
            </span>
          </div>
        </div>

        {/* Overview KPIs Grid */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Overview
            </span>
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 cursor-pointer">
              This month <ChevronDown className="h-3 w-3 text-slate-400" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-base font-black text-slate-900 block">$2,246.75</span>
              <span className="text-[10px] text-slate-400">Average order</span>
            </div>
            <div>
              <span className="text-base font-black text-slate-900 block">$2.2m</span>
              <span className="text-[10px] text-slate-400">Total revenue</span>
            </div>
            <div>
              <span className="text-base font-black text-slate-900 block">16 min</span>
              <span className="text-[10px] text-slate-400">Processing time</span>
            </div>
            <div>
              <span className="text-base font-black text-slate-900 block">1.7</span>
              <span className="text-[10px] text-slate-400">Avg items / order</span>
            </div>
            <div>
              <span className="text-base font-black text-slate-900 block">0.32%</span>
              <span className="text-[10px] text-slate-400">Pending orders</span>
            </div>
            <div>
              <span className="text-base font-black text-slate-900 block">0.51%</span>
              <span className="text-[10px] text-slate-400">Reject rate</span>
            </div>
          </div>
        </div>

        {/* Top Sellers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Top Sellers
            </span>
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 cursor-pointer">
              This month <ChevronDown className="h-3 w-3 text-slate-400" />
            </span>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80"
                alt="Product"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-slate-900 truncate">
                Gasoline generator EYG 7500i (Inverter)
              </p>
              <p className="text-[10px] text-slate-400">54 units sold</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Shakuro Order Detail Popover / Modal (Matching Image 4) */}
      {activeOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">
                Order {activeOrderModal.orderNumber}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Expand"
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOrderModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => alert(`Exporting order ${activeOrderModal.orderNumber}`)}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg flex items-center gap-1.5"
              >
                <span>↑ Export</span>
              </button>
              <a
                href={`http://localhost:4000/v1/orders/${activeOrderModal.id}/invoice`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                <span>Print Invoice</span>
              </a>
              <button
                type="button"
                onClick={() => alert(`Duplicating order ${activeOrderModal.orderNumber}`)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                <span>⧉ Duplicate</span>
              </button>
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
              {/* Order Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Order items</span>
                  <span className="text-slate-400 font-semibold">{activeOrderModal.items.length}</span>
                </div>

                <div className="space-y-3 divide-y divide-slate-100">
                  {activeOrderModal.items.map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.quantity} × ${(item.priceMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900">
                        ${((item.priceMinor * item.quantity) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 font-black text-slate-900 text-sm">
                  <span>Total</span>
                  <span>${(activeOrderModal.totalMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <span className="font-bold text-slate-900 block">Contacts</span>
                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer</span>
                    <span className="font-semibold text-slate-900">{activeOrderModal.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email</span>
                    <span className="text-slate-700">{activeOrderModal.customerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone</span>
                    <span className="text-slate-700">{activeOrderModal.customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <span className="font-bold text-slate-900 block">Delivery</span>
                <p className="text-slate-600">{activeOrderModal.address}</p>

                {activeOrderModal.trackingNumber ? (
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <span>{activeOrderModal.courierName} — <code>{activeOrderModal.trackingNumber}</code></span>
                    </div>
                    <span className="font-bold text-emerald-600">Dispatched</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDispatchModalOrder(activeOrderModal)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    <span>Dispatch & Assign Courier AWB</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" />
                Dispatch Order {dispatchModalOrder.orderNumber}
              </h3>
              <button
                type="button"
                onClick={() => setDispatchModalOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleShipOrder} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Logistics Courier Partner</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Blue Dart Express">Blue Dart Express</option>
                  <option value="Delhivery Surface">Delhivery Surface</option>
                  <option value="DHL Express International">DHL Express International</option>
                  <option value="FedEx India">FedEx India</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">AWB Tracking Consignment Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BLUEDART-88229911"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalOrder(null)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm Shipment & Notify Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
