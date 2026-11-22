'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type StaffRole =
  | 'SUPER_ADMIN'
  | 'ORDER_MANAGER'
  | 'SUPPORT_LEAD'
  | 'FINANCE_MANAGER'
  | 'CATALOG_MANAGER';

export interface StaffProfile {
  id: string;
  name: string;
  email: string;
  passwordHint: string;
  role: StaffRole;
  roleLabel: string;
  privileges: string;
  allowedNav: string[];
}

export const STAFF_PRESETS: Record<StaffRole, StaffProfile> = {
  SUPER_ADMIN: {
    id: 'staff-admin-01',
    name: 'Aditya Yadav',
    email: 'aditya.admin@apex.local',
    passwordHint: 'Admin@Apex2026!',
    role: 'SUPER_ADMIN',
    roleLabel: 'Super Admin',
    privileges: 'All Privileges & Security Administration (Full Access)',
    allowedNav: ['/', '/orders', '/returns', '/refunds', '/support', '/inventory', '/staff', '/audit'],
  },
  CATALOG_MANAGER: {
    id: 'staff-catalog-05',
    name: 'Arjun Nair',
    email: 'arjun.catalog@apex.local',
    passwordHint: 'Catalog@Apex2026!',
    role: 'CATALOG_MANAGER',
    roleLabel: 'Catalog & Inventory Manager',
    privileges: 'Product Creation with Images, Multi-Variants, Categories & Live Stock',
    allowedNav: ['/', '/inventory'],
  },
  ORDER_MANAGER: {
    id: 'staff-orders-02',
    name: 'Vikram Mehta',
    email: 'vikram.orders@apex.local',
    passwordHint: 'Orders@Apex2026!',
    role: 'ORDER_MANAGER',
    roleLabel: 'Order & Dispatch Manager',
    privileges: 'Pack, Ship with AWB, Return Inspection & Restock Actions',
    allowedNav: ['/', '/orders', '/returns', '/inventory'],
  },
  SUPPORT_LEAD: {
    id: 'staff-support-03',
    name: 'Sarah Jenkins',
    email: 'sarah.support@apex.local',
    passwordHint: 'Support@Apex2026!',
    role: 'SUPPORT_LEAD',
    roleLabel: 'Customer Support Lead',
    privileges: 'Ticket SLA Management, AI Chat Handoff & Tier-1 Refunds (≤ ₹5,000)',
    allowedNav: ['/', '/returns', '/refunds', '/support'],
  },
  FINANCE_MANAGER: {
    id: 'staff-finance-04',
    name: 'Kavita Roy',
    email: 'kavita.finance@apex.local',
    passwordHint: 'Finance@Apex2026!',
    role: 'FINANCE_MANAGER',
    roleLabel: 'Finance & Accounts Manager',
    privileges: 'Payment Gateways, Tier-2 Refunds (> ₹5,000) & Audit Trail',
    allowedNav: ['/', '/orders', '/refunds', '/audit'],
  },
};

interface StaffAuthContextType {
  currentStaff: StaffProfile;
  switchRole: (role: StaffRole) => void;
  loginWithCredentials: (email: string, roleKey?: StaffRole) => void;
  logout: () => void;
  isAllowed: (href: string) => boolean;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentStaff, setCurrentStaff] = useState<StaffProfile>(STAFF_PRESETS.SUPER_ADMIN);

  useEffect(() => {
    const savedRole = localStorage.getItem('apex_staff_role') as StaffRole | null;
    if (savedRole && STAFF_PRESETS[savedRole]) {
      setCurrentStaff(STAFF_PRESETS[savedRole]);
    }
  }, []);

  const switchRole = (role: StaffRole) => {
    if (STAFF_PRESETS[role]) {
      setCurrentStaff(STAFF_PRESETS[role]);
      localStorage.setItem('apex_staff_role', role);
    }
  };

  const loginWithCredentials = (email: string, roleKey?: StaffRole) => {
    if (roleKey && STAFF_PRESETS[roleKey]) {
      switchRole(roleKey);
      return;
    }
    // Match by email
    const match = Object.values(STAFF_PRESETS).find(
      (p) => p.email.toLowerCase() === email.toLowerCase()
    );
    if (match) {
      switchRole(match.role);
    } else {
      switchRole('SUPER_ADMIN');
    }
  };

  const logout = () => {
    localStorage.removeItem('apex_staff_role');
    localStorage.removeItem('apex_staff_token');
    window.location.href = '/login';
  };

  const isAllowed = (href: string): boolean => {
    if (currentStaff.role === 'SUPER_ADMIN') return true;
    return currentStaff.allowedNav.includes(href);
  };

  return (
    <StaffAuthContext.Provider
      value={{
        currentStaff,
        switchRole,
        loginWithCredentials,
        logout,
        isAllowed,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
}
