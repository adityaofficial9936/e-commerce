'use client';

import React, { useState } from 'react';
import { RotateCcw, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, X } from 'lucide-react';

interface ReturnItem {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  quantity: number;
  unitPriceMinor: number;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'INSPECTED' | 'REFUNDED';
  condition?: 'RESALEABLE' | 'DAMAGED';
}

const INITIAL_RETURNS: ReturnItem[] = [
  {
    id: 'ret-101',
    orderNumber: 'ORD-2026-000098',
    customerName: 'Neha Gupta',
    productName: 'AeroDry Seamless Breathable Training Tee',
    quantity: 1,
    unitPriceMinor: 119900,
    reason: 'Incorrect size ordered, tag intact and unused',
    status: 'REQUESTED',
  },
  {
    id: 'ret-102',
    orderNumber: 'ORD-2026-000092',
    customerName: 'Kunal Kapoor',
    productName: 'Air Velocity Pro Running Sneakers',
    quantity: 1,
    unitPriceMinor: 249900,
    reason: 'Sole stiffness not suitable for flat feet',
    status: 'APPROVED',
  },
];

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnItem[]>(INITIAL_RETURNS);
  const [activeInspect, setActiveInspect] = useState<ReturnItem | null>(null);
  const [condition, setCondition] = useState<'RESALEABLE' | 'DAMAGED'>('RESALEABLE');
  const [autoRestock, setAutoRestock] = useState(true);

  const handleApprovePickup = (id: string) => {
    setReturns((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r))
    );
  };

  const handleCompleteInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInspect) return;

    setReturns((prev) =>
      prev.map((r) =>
        r.id === activeInspect.id
          ? { ...r, status: 'INSPECTED', condition }
          : r
      )
    );

    setActiveInspect(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-200/80 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Returns & Quality Inspection Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review 7-day return requests, inspect physical condition, restock resaleable inventory, and initiate refunds.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-5">Return ID</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Item & Reason</th>
                <th className="py-3 px-4">Refundable Amount</th>
                <th className="py-3 px-4">Inspection Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {returns.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-slate-900">{r.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{r.orderNumber}</td>
                  <td className="py-3.5 px-4">{r.customerName}</td>
                  <td className="py-3.5 px-4 max-w-sm">
                    <p className="font-semibold text-slate-900">{r.productName} × {r.quantity}</p>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">"{r.reason}"</p>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                    ₹{((r.unitPriceMinor * r.quantity) / 100).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.status === 'REQUESTED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : r.status === 'APPROVED'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : r.status === 'INSPECTED'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      }`}
                    >
                      {r.status} {r.condition ? `(${r.condition})` : ''}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right space-x-2">
                    {r.status === 'REQUESTED' && (
                      <button
                        onClick={() => handleApprovePickup(r.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                      >
                        Authorize Pickup
                      </button>
                    )}

                    {r.status === 'APPROVED' && (
                      <button
                        onClick={() => setActiveInspect(r)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                      >
                        Inspect Goods
                      </button>
                    )}

                    {r.status === 'INSPECTED' && (
                      <span className="text-xs text-slate-400 font-semibold">
                        Queued for Refund →
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quality Inspection Modal */}
      {activeInspect && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-slate-700" />
                Inspect Return {activeInspect.id}
              </h3>
              <button
                onClick={() => setActiveInspect(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteInspection} className="space-y-4 text-xs">
              <div>
                <p className="font-semibold text-slate-900">{activeInspect.productName}</p>
                <p className="text-slate-500 mt-1">Customer Reason: {activeInspect.reason}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Item Physical Condition</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-lg border cursor-pointer font-medium flex items-center gap-2 ${
                      condition === 'RESALEABLE'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="condition"
                      checked={condition === 'RESALEABLE'}
                      onChange={() => setCondition('RESALEABLE')}
                      className="text-emerald-600 focus:ring-0"
                    />
                    <span>RESALEABLE (New)</span>
                  </label>

                  <label
                    className={`p-3 rounded-lg border cursor-pointer font-medium flex items-center gap-2 ${
                      condition === 'DAMAGED'
                        ? 'border-rose-600 bg-rose-50 text-rose-800 ring-1 ring-rose-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="condition"
                      checked={condition === 'DAMAGED'}
                      onChange={() => setCondition('DAMAGED')}
                      className="text-rose-600 focus:ring-0"
                    />
                    <span>DAMAGED / USED</span>
                  </label>
                </div>
              </div>

              {condition === 'RESALEABLE' && (
                <label className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRestock}
                    onChange={(e) => setAutoRestock(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  <span className="text-xs text-emerald-950 font-medium">
                    Automatically increment inventory item quantity and log RETURN_RESTOCK movement
                  </span>
                </label>
              )}

              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setActiveInspect(null)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm Inspection & Queue Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
