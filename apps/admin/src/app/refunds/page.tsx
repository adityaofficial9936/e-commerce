'use client';

import React, { useState } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, AlertCircle, ArrowUpRight } from 'lucide-react';

interface RefundItem {
  id: string;
  orderNumber: string;
  customerName: string;
  amountMinor: number;
  reason: string;
  tier: 'TIER_1_LEAD' | 'TIER_2_FINANCE';
  status: 'PENDING' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  approvedBy?: string;
  gatewayRefundId?: string;
}

const INITIAL_REFUNDS: RefundItem[] = [
  {
    id: 'rfnd-201',
    orderNumber: 'ORD-2026-000098',
    customerName: 'Neha Gupta',
    amountMinor: 119900,
    reason: 'Return inspection passed: Resaleable condition verified',
    tier: 'TIER_1_LEAD',
    status: 'PENDING',
  },
  {
    id: 'rfnd-202',
    orderNumber: 'ORD-2026-000078',
    customerName: 'Amit Shah',
    amountMinor: 899900,
    reason: 'Special executive order cancellation with high ticket value',
    tier: 'TIER_2_FINANCE',
    status: 'PENDING',
  },
  {
    id: 'rfnd-199',
    orderNumber: 'ORD-2026-000062',
    customerName: 'Sanjay Dutt',
    amountMinor: 249900,
    reason: 'Pre-shipment cancellation refund',
    tier: 'TIER_1_LEAD',
    status: 'PROCESSED',
    approvedBy: 'lead-1',
    gatewayRefundId: 'rfnd_1794824090986_eda14386',
  },
];

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundItem[]>(INITIAL_REFUNDS);

  const handleApprove = (id: string) => {
    setRefunds((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'APPROVED', approvedBy: 'Staff Lead Aditya' } : r
      )
    );
  };

  const handleExecute = (id: string) => {
    setRefunds((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'PROCESSED',
              gatewayRefundId: `rfnd_${Date.now()}_razorpay`,
            }
          : r
      )
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-200/80 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Refunds Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Support Lead approval limit: up to ₹5,000. Finance Manager authorization required above ₹5,000.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-5">Refund ID</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Authorization Tier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {refunds.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-slate-900">{r.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{r.orderNumber}</td>
                  <td className="py-3.5 px-4">{r.customerName}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                    ₹{(r.amountMinor / 100).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        r.tier === 'TIER_1_LEAD'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}
                    >
                      {r.tier === 'TIER_1_LEAD' ? 'Tier 1 (≤ ₹5,000)' : 'Tier 2 (> ₹5,000 Finance)'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : r.status === 'APPROVED'
                          ? 'bg-slate-100 text-slate-800 border border-slate-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      }`}
                    >
                      {r.status === 'PROCESSED' ? '✓ Processed' : r.status}
                    </span>
                    {r.gatewayRefundId && (
                      <code className="block text-[10px] font-mono text-slate-400 mt-1">
                        {r.gatewayRefundId}
                      </code>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right space-x-2">
                    {r.status === 'PENDING' && (
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                      >
                        Authorize
                      </button>
                    )}

                    {r.status === 'APPROVED' && (
                      <button
                        onClick={() => handleExecute(r.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                      >
                        Execute Payout
                      </button>
                    )}

                    {r.status === 'PROCESSED' && (
                      <span className="text-xs text-emerald-600 font-semibold inline-flex items-center justify-end gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Settled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
