'use client';

import React, { useState } from 'react';
import {
  LifeBuoy,
  Clock,
  AlertTriangle,
  Send,
  Lock,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';

interface TicketItem {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  category: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'ESCALATED' | 'RESOLVED';
  slaMinutesRemaining: number;
}

const INITIAL_TICKETS: TicketItem[] = [
  {
    id: 'tkt-1',
    ticketNumber: 'TKT-2026-000412',
    customerName: 'Aditya Yadav',
    customerEmail: 'aditya@example.com',
    subject: 'Package showed delivered but security guard did not receive it',
    category: 'DELIVERY',
    priority: 'URGENT',
    status: 'ESCALATED',
    slaMinutesRemaining: -15, // Breached
  },
  {
    id: 'tkt-2',
    ticketNumber: 'TKT-2026-000418',
    customerName: 'Rohan Mehra',
    customerEmail: 'rohan@example.com',
    subject: 'Wrong colorway dispatched in sneaker box',
    category: 'ORDER',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    slaMinutesRemaining: 145, // 2h 25m
  },
  {
    id: 'tkt-3',
    ticketNumber: 'TKT-2026-000424',
    customerName: 'Kavita Sen',
    customerEmail: 'kavita@example.com',
    subject: 'Inquiry regarding size exchange availability for Marathon carbon shoe',
    category: 'PRODUCT_QUESTION',
    priority: 'NORMAL',
    status: 'OPEN',
    slaMinutesRemaining: 1280,
  },
];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<TicketItem[]>(INITIAL_TICKETS);
  const [activeTicket, setActiveTicket] = useState<TicketItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [escalatedCount, setEscalatedCount] = useState<number | null>(null);

  const handleSweepSla = () => {
    // Find tickets where SLA is breached
    setTickets((prev) =>
      prev.map((t) =>
        t.slaMinutesRemaining < 0
          ? { ...t, priority: 'URGENT', status: 'ESCALATED' }
          : t
      )
    );
    setEscalatedCount(1);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    if (!isInternal) {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicket.id ? { ...t, status: 'WAITING_ON_CUSTOMER' } : t
        )
      );
    }

    setReplyText('');
    setIsInternal(false);
    setActiveTicket(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-200/80 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Support Ticketing & SLA Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Strict SLA response timers: URGENT (4h) • HIGH (12h) • NORMAL (24h).
          </p>
        </div>

        <button
          onClick={handleSweepSla}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Clock className="h-3.5 w-3.5" />
          Sweep SLA Breaches
        </button>
      </div>

      {escalatedCount !== null && (
        <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center justify-between text-xs text-rose-900">
          <span className="font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            Sweep executed: {escalatedCount} overdue ticket(s) automatically escalated to URGENT priority.
          </span>
          <button onClick={() => setEscalatedCount(null)} className="text-rose-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Ticket Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-5">Ticket #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">SLA Countdown</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-slate-900">{t.ticketNumber}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">{t.customerName}</p>
                    <p className="text-[11px] text-slate-400">{t.customerEmail}</p>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-900 font-medium">
                    {t.subject}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{t.category}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        t.priority === 'URGENT'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          : t.priority === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold">
                    {t.slaMinutesRemaining < 0 ? (
                      <span className="text-rose-600 flex items-center gap-1 font-bold">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Breached ({Math.abs(t.slaMinutesRemaining)}m ago)
                      </span>
                    ) : (
                      <span className="text-slate-600 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {Math.floor(t.slaMinutesRemaining / 60)}h {t.slaMinutesRemaining % 60}m left
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        t.status === 'ESCALATED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-slate-100 text-slate-800 border border-slate-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => setActiveTicket(t)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      Open Ticket
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Reply Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <div>
                <span className="text-xs font-mono font-bold text-slate-600">{activeTicket.ticketNumber}</span>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">{activeTicket.subject}</h3>
              </div>
              <button
                onClick={() => setActiveTicket(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
              <span className="font-bold text-slate-800">{activeTicket.customerName}</span>:
              <p className="text-slate-600 mt-1">"{activeTicket.subject}"</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Staff Response / Internal Investigation Note
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official customer reply or internal staff note..."
                  className="w-full border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-slate-900 text-xs"
                />
              </div>

              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-0"
                />
                <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  Mark as Internal Staff Note (Invisible to customer)
                </span>
              </label>

              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send & Update Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
