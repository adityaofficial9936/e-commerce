'use client';

import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, Calendar, Terminal } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  actorRole: string;
  target: string;
  ipAddress: string;
  timestamp: string;
  details: string;
}

const AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    action: 'ORDER_STATUS_TRANSITION',
    actor: 'Vikram Mehta',
    actorRole: 'Order Manager',
    target: 'Order #ORD-2026-000101',
    ipAddress: '192.168.1.45',
    timestamp: 'Today, 19:42:15',
    details: 'Changed status from CONFIRMED -> PACKED',
  },
  {
    id: 'log-2',
    action: 'REFUND_APPROVED',
    actor: 'Sarah Jenkins',
    actorRole: 'Support Lead',
    target: 'Refund #rfnd-102 (₹2,999.00)',
    ipAddress: '192.168.1.12',
    timestamp: 'Today, 18:30:00',
    details: 'Approved doorstep pickup return refund for order ORD-2026-000099',
  },
  {
    id: 'log-3',
    action: 'INVENTORY_ADJUSTMENT',
    actor: 'Vikram Mehta',
    actorRole: 'Order Manager',
    target: 'Variant #AVP-9-NVY',
    ipAddress: '192.168.1.45',
    timestamp: 'Today, 16:15:22',
    details: 'Restocked +20 units following supplier arrival',
  },
  {
    id: 'log-4',
    action: 'PRICE_UPDATE',
    actor: 'Aditya Yadav',
    actorRole: 'Super Admin',
    target: 'Product #prod-sneakers-01',
    ipAddress: '10.0.0.1',
    timestamp: 'Yesterday, 21:04:10',
    details: 'Updated price_minor from 329900 -> 299900 (Sale promotion)',
  },
  {
    id: 'log-5',
    action: 'STAFF_ROLE_MODIFIED',
    actor: 'Aditya Yadav',
    actorRole: 'Super Admin',
    target: 'User #sarah.j@ecommerce.local',
    ipAddress: '10.0.0.1',
    timestamp: 'Nov 14, 2026, 14:10:00',
    details: 'Assigned role Support Lead with refund limits up to INR 5,000',
  },
];

export default function AuditPage() {
  const [logs] = useState<AuditLogEntry[]>(AUDIT_LOGS);
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="h-7 w-7 text-blue-600" />
            Immutable Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tamper-proof compliance log of all administrative actions, permissions changes, and monetary adjustments.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, actor, target or diff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-6">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-4 px-4">
                    <span className="font-mono font-bold text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-900">{log.actor}</p>
                    <p className="text-[10px] text-slate-400">{log.actorRole}</p>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-800">{log.target}</td>
                  <td className="py-4 px-4 font-mono text-[11px] text-slate-500">{log.ipAddress}</td>
                  <td className="py-4 px-6 text-slate-600 max-w-xs truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
