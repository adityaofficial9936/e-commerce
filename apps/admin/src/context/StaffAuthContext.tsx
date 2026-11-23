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
  password?: string;
  passwordHint?: string;
  role: StaffRole;
  roleLabel: string;
  privileges: string;
  allowedNav: string[];
}

export const ROLE_DEFINITIONS: Record<
  StaffRole,
  { label: string; privileges: string; allowedNav: string[] }
> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    privileges: 'All Privileges & Security Administration (Full Access)',
    allowedNav: ['/', '/orders', '/returns', '/refunds', '/support', '/inventory', '/staff', '/audit'],
  },
  CATALOG_MANAGER: {
    label: 'Catalog & Inventory Manager',
    privileges: 'Product Creation with Images, Multi-Variants, Categories & Live Stock',
    allowedNav: ['/', '/inventory'],
  },
  ORDER_MANAGER: {
    label: 'Order & Dispatch Manager',
    privileges: 'Pack, Ship with AWB, Return Inspection & Restock Actions',
    allowedNav: ['/', '/orders', '/returns', '/inventory'],
  },
  SUPPORT_LEAD: {
    label: 'Customer Support Lead',
    privileges: 'Ticket SLA Management, AI Chat Handoff & Tier-1 Refunds (≤ ₹5,000)',
    allowedNav: ['/', '/returns', '/refunds', '/support'],
  },
  FINANCE_MANAGER: {
    label: 'Finance & Accounts Manager',
    privileges: 'Payment Gateways, Tier-2 Refunds (> ₹5,000) & Audit Trail',
    allowedNav: ['/', '/orders', '/refunds', '/audit'],
  },
};

export const DEFAULT_STAFF: StaffProfile[] = [
  {
    id: 'staff-admin-01',
    name: 'Aditya Yadav',
    email: 'aditya.admin@moonlet.in',
    password: 'Admin@Moonlet2026!',
    passwordHint: 'Admin@Moonlet2026!',
    role: 'SUPER_ADMIN',
    roleLabel: 'Super Admin',
    privileges: ROLE_DEFINITIONS.SUPER_ADMIN.privileges,
    allowedNav: ROLE_DEFINITIONS.SUPER_ADMIN.allowedNav,
  },
  {
    id: 'staff-admin-02',
    name: 'Aditya Yadav',
    email: 'aditya.admin@apex.local',
    password: 'Admin@Apex2026!',
    passwordHint: 'Admin@Apex2026!',
    role: 'SUPER_ADMIN',
    roleLabel: 'Super Admin',
    privileges: ROLE_DEFINITIONS.SUPER_ADMIN.privileges,
    allowedNav: ROLE_DEFINITIONS.SUPER_ADMIN.allowedNav,
  },
  {
    id: 'staff-catalog-05',
    name: 'Arjun Nair',
    email: 'arjun.catalog@moonlet.in',
    password: 'Catalog@Moonlet2026!',
    passwordHint: 'Catalog@Moonlet2026!',
    role: 'CATALOG_MANAGER',
    roleLabel: 'Catalog & Inventory Manager',
    privileges: ROLE_DEFINITIONS.CATALOG_MANAGER.privileges,
    allowedNav: ROLE_DEFINITIONS.CATALOG_MANAGER.allowedNav,
  },
  {
    id: 'staff-orders-02',
    name: 'Vikram Mehta',
    email: 'vikram.orders@moonlet.in',
    password: 'Orders@Moonlet2026!',
    passwordHint: 'Orders@Moonlet2026!',
    role: 'ORDER_MANAGER',
    roleLabel: 'Order & Dispatch Manager',
    privileges: ROLE_DEFINITIONS.ORDER_MANAGER.privileges,
    allowedNav: ROLE_DEFINITIONS.ORDER_MANAGER.allowedNav,
  },
  {
    id: 'staff-support-03',
    name: 'Sarah Jenkins',
    email: 'sarah.support@moonlet.in',
    password: 'Support@Moonlet2026!',
    passwordHint: 'Support@Moonlet2026!',
    role: 'SUPPORT_LEAD',
    roleLabel: 'Customer Support Lead',
    privileges: ROLE_DEFINITIONS.SUPPORT_LEAD.privileges,
    allowedNav: ROLE_DEFINITIONS.SUPPORT_LEAD.allowedNav,
  },
  {
    id: 'staff-finance-04',
    name: 'Kavita Roy',
    email: 'kavita.finance@moonlet.in',
    password: 'Finance@Moonlet2026!',
    passwordHint: 'Finance@Moonlet2026!',
    role: 'FINANCE_MANAGER',
    roleLabel: 'Finance & Accounts Manager',
    privileges: ROLE_DEFINITIONS.FINANCE_MANAGER.privileges,
    allowedNav: ROLE_DEFINITIONS.FINANCE_MANAGER.allowedNav,
  },
];

export const STAFF_PRESETS: Record<StaffRole, StaffProfile> = {
  SUPER_ADMIN: DEFAULT_STAFF[0],
  CATALOG_MANAGER: DEFAULT_STAFF[2],
  ORDER_MANAGER: DEFAULT_STAFF[3],
  SUPPORT_LEAD: DEFAULT_STAFF[4],
  FINANCE_MANAGER: DEFAULT_STAFF[5],
};

interface AuthResult {
  success: boolean;
  error?: string;
  staff?: StaffProfile;
}

interface StaffAuthContextType {
  currentStaff: StaffProfile;
  staffList: StaffProfile[];
  switchRole: (role: StaffRole) => void;
  loginWithCredentials: (email: string, roleKey?: StaffRole) => void;
  authenticateStaff: (email: string, pass: string) => Promise<AuthResult>;
  registerStaffMember: (member: Omit<StaffProfile, 'allowedNav' | 'roleLabel' | 'privileges'>) => void;
  logout: () => void;
  isAllowed: (href: string) => boolean;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

const DIRECTORY_KEY = 'moonlet_staff_directory';

export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentStaff, setCurrentStaff] = useState<StaffProfile>(DEFAULT_STAFF[0]);
  const [staffList, setStaffList] = useState<StaffProfile[]>(DEFAULT_STAFF);

  useEffect(() => {
    // Load directory from localStorage
    try {
      const raw = localStorage.getItem(DIRECTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStaffList(parsed);
        }
      } else {
        localStorage.setItem(DIRECTORY_KEY, JSON.stringify(DEFAULT_STAFF));
      }
    } catch {
      // Fallback to default
    }

    // Load active staff session
    const savedStaffId = localStorage.getItem('apex_staff_id');
    const savedRole = localStorage.getItem('apex_staff_role') as StaffRole | null;

    if (savedStaffId) {
      const found = staffList.find((s) => s.id === savedStaffId);
      if (found) {
        setCurrentStaff(found);
        return;
      }
    }

    if (savedRole && STAFF_PRESETS[savedRole]) {
      setCurrentStaff(STAFF_PRESETS[savedRole]);
    }
  }, []);

  const switchRole = (role: StaffRole) => {
    const found = staffList.find((s) => s.role === role) || STAFF_PRESETS[role];
    if (found) {
      setCurrentStaff(found);
      localStorage.setItem('apex_staff_role', found.role);
      localStorage.setItem('apex_staff_id', found.id);
    }
  };

  const authenticateStaff = async (email: string, pass: string): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Search in live staff directory
    const match = staffList.find((s) => s.email.toLowerCase() === cleanEmail);
    if (!match) {
      return { success: false, error: 'Staff account not found. Please verify your email.' };
    }

    // Check password
    const validPass = match.password || match.passwordHint || 'Admin@Moonlet2026!';
    if (cleanPass !== validPass) {
      return { success: false, error: 'Incorrect access password. Please re-enter.' };
    }

    // Authenticated
    setCurrentStaff(match);
    localStorage.setItem('apex_staff_role', match.role);
    localStorage.setItem('apex_staff_id', match.id);
    return { success: true, staff: match };
  };

  const registerStaffMember = (
    member: Omit<StaffProfile, 'allowedNav' | 'roleLabel' | 'privileges'>
  ) => {
    const roleDef = ROLE_DEFINITIONS[member.role] || ROLE_DEFINITIONS.CATALOG_MANAGER;
    const newStaff: StaffProfile = {
      ...member,
      roleLabel: roleDef.label,
      privileges: roleDef.privileges,
      allowedNav: roleDef.allowedNav,
      password: member.password || 'Welcome@Moonlet2026',
      passwordHint: member.password || 'Welcome@Moonlet2026',
    };

    setStaffList((prev) => {
      const updated = [...prev.filter((s) => s.email.toLowerCase() !== member.email.toLowerCase()), newStaff];
      try {
        localStorage.setItem(DIRECTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save staff directory:', e);
      }
      return updated;
    });
  };

  const loginWithCredentials = (email: string, roleKey?: StaffRole) => {
    if (roleKey && STAFF_PRESETS[roleKey]) {
      switchRole(roleKey);
      return;
    }
    const match = staffList.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (match) {
      setCurrentStaff(match);
      localStorage.setItem('apex_staff_role', match.role);
      localStorage.setItem('apex_staff_id', match.id);
    } else {
      switchRole('SUPER_ADMIN');
    }
  };

  const logout = () => {
    localStorage.removeItem('apex_staff_role');
    localStorage.removeItem('apex_staff_id');
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
        staffList,
        switchRole,
        loginWithCredentials,
        authenticateStaff,
        registerStaffMember,
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
