'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  CreditCard,
  Users,
  Bell,
  HelpCircle,
  ShieldAlert,
  Search,
  ChevronDown,
  Check,
  PanelLeftClose,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import { useStaffAuth, STAFF_PRESETS, StaffRole } from '../../context/StaffAuthContext';

export function AdminSidebar() {
  const pathname = usePathname();
  const { currentStaff, switchRole, logout, isAllowed } = useStaffAuth();
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Hide sidebar completely on the login screen
  if (pathname === '/login') {
    return null;
  }

  const MAIN_NAV = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Orders', href: '/orders', icon: ShoppingBag, badge: 'Active' },
    { name: 'Inventory', href: '/inventory', icon: Boxes },
    { name: 'Payments & Refunds', href: '/refunds', icon: CreditCard },
    { name: 'Customers & Staff', href: '/staff', icon: Users },
  ];

  const SECONDARY_NAV = [
    { name: 'Returns QC', href: '/returns', icon: RotateCcw },
    { name: 'Notifications', href: '#notifications', icon: Bell, badge: '1', badgeColor: 'bg-rose-500' },
    { name: 'Help & support', href: '/support', icon: HelpCircle },
    { name: 'Audit logs', href: '/audit', icon: ShieldAlert },
  ];

  return (
    <aside className="w-60 bg-[#0c101d] border-r border-[#1a2236] flex flex-col shrink-0 min-h-screen text-slate-300 select-none">
      {/* Top Header: Logo & Collapse icon */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#1a2236]/80">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono font-bold text-sm">#</span>
          <span className="font-extrabold text-white text-base tracking-tight">Apex</span>
        </div>
        <button
          type="button"
          title="Collapse sidebar"
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#182032] transition-colors"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Search with shortcut */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141b2d] text-xs text-slate-200 placeholder-slate-500 pl-8 pr-12 py-2 rounded-xl border border-[#1e293b]/70 focus:outline-none focus:border-blue-500 font-medium"
          />
          <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-[#0c101d] rounded border border-slate-700/60">
            ⌘ F
          </kbd>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        <nav className="space-y-1">
          {MAIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            if (!isAllowed(item.href)) return null;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#1e293b] text-white font-bold shadow-xs border border-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#141b2d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="h-px bg-[#1a2236]/80 mx-2" />

        {/* Secondary Navigation */}
        <nav className="space-y-1">
          {SECONDARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            if (item.href.startsWith('/') && !isAllowed(item.href)) return null;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#1e293b] text-white font-bold border border-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#141b2d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white ${
                      item.badgeColor || 'bg-blue-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile & Role Switcher Footer */}
      <div className="p-3 border-t border-[#1a2236] bg-[#090d18] relative">
        <button
          type="button"
          onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#141b2d] transition-colors text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm">
              {currentStaff.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{currentStaff.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentStaff.roleLabel}</p>
            </div>
          </div>
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-500 transition-transform shrink-0 ${
              roleSwitcherOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Role Switcher Menu Popup */}
        {roleSwitcherOpen && (
          <div className="absolute left-3 right-3 bottom-full mb-2 bg-[#141b2d] border border-slate-700/80 rounded-2xl shadow-2xl z-50 p-2 space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60 mb-1">
              Switch Staff Role
            </div>
            {(Object.keys(STAFF_PRESETS) as StaffRole[]).map((roleKey) => {
              const profile = STAFF_PRESETS[roleKey];
              const isSelected = currentStaff.role === roleKey;
              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => {
                    switchRole(roleKey);
                    setRoleSwitcherOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-300 hover:bg-[#1e293b]'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-semibold text-xs leading-tight">{profile.roleLabel}</p>
                    <p className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {profile.name}
                    </p>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
            <div className="pt-1 mt-1 border-t border-slate-700/60">
              <button
                type="button"
                onClick={logout}
                className="w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
