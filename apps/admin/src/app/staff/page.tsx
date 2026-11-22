'use client';

import React, { useState } from 'react';
import {
  Users,
  Shield,
  Plus,
  Key,
  Mail,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  X,
  UserCheck,
  UserPlus,
  Phone,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  twoFactorEnabled: boolean;
  lastLogin: string;
}

interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  segment: 'VIP' | 'Regular' | 'New Inquirer';
  ordersCount: number;
  totalSpentMinor: number;
  status: 'ACTIVE' | 'SUSPENDED';
  joinedDate: string;
}

const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Aditya Yadav',
    email: 'aditya.admin@moonlet.in',
    role: 'Super Admin',
    status: 'ACTIVE',
    twoFactorEnabled: true,
    lastLogin: 'Just now',
  },
  {
    id: 'staff-2',
    name: 'Sarah Jenkins',
    email: 'sarah.support@moonlet.in',
    role: 'Support Lead',
    status: 'ACTIVE',
    twoFactorEnabled: true,
    lastLogin: '2 hours ago',
  },
  {
    id: 'staff-3',
    name: 'Vikram Mehta',
    email: 'vikram.orders@moonlet.in',
    role: 'Order Manager',
    status: 'ACTIVE',
    twoFactorEnabled: true,
    lastLogin: 'Yesterday',
  },
  {
    id: 'staff-4',
    name: 'Kavita Roy',
    email: 'kavita.finance@moonlet.in',
    role: 'Finance Manager',
    status: 'ACTIVE',
    twoFactorEnabled: true,
    lastLogin: '3 days ago',
  },
  {
    id: 'staff-5',
    name: 'Arjun Nair',
    email: 'arjun.catalog@moonlet.in',
    role: 'Catalog Manager',
    status: 'ACTIVE',
    twoFactorEnabled: true,
    lastLogin: '10 mins ago',
  },
];

const INITIAL_CUSTOMERS: CustomerAccount[] = [
  {
    id: 'cust-1',
    name: 'Ananya Sharma',
    email: 'ananya.s@gmail.com',
    phone: '+91 98201 12345',
    segment: 'VIP',
    ordersCount: 4,
    totalSpentMinor: 789600,
    status: 'ACTIVE',
    joinedDate: '12 Oct 2026',
  },
  {
    id: 'cust-2',
    name: 'Pooja Reddy',
    email: 'pooja.r@outlook.com',
    phone: '+91 98450 67890',
    segment: 'VIP',
    ordersCount: 3,
    totalSpentMinor: 549700,
    status: 'ACTIVE',
    joinedDate: '28 Oct 2026',
  },
  {
    id: 'cust-3',
    name: 'Meera Verma',
    email: 'meera.verma@yahoo.in',
    phone: '+91 98110 54321',
    segment: 'Regular',
    ordersCount: 2,
    totalSpentMinor: 249800,
    status: 'ACTIVE',
    joinedDate: '04 Nov 2026',
  },
  {
    id: 'cust-4',
    name: 'Riya Kapoor',
    email: 'riya.k@icloud.com',
    phone: '+91 99300 98765',
    segment: 'New Inquirer',
    ordersCount: 1,
    totalSpentMinor: 129900,
    status: 'ACTIVE',
    joinedDate: '19 Nov 2026',
  },
];

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<'STAFF' | 'CUSTOMERS'>('STAFF');
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [customers, setCustomers] = useState<CustomerAccount[]>(INITIAL_CUSTOMERS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Staff Modals
  const [isInviteStaffModalOpen, setIsInviteStaffModalOpen] = useState(false);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffFormName, setStaffFormName] = useState('');
  const [staffFormEmail, setStaffFormEmail] = useState('');
  const [staffFormRole, setStaffFormRole] = useState('Catalog Manager');
  const [staffFormStatus, setStaffFormStatus] = useState<'ACTIVE' | 'INVITED' | 'SUSPENDED'>('ACTIVE');
  const [staffForm2FA, setStaffForm2FA] = useState(true);

  // Customer Modals
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerAccount | null>(null);
  const [custFormName, setCustFormName] = useState('');
  const [custFormEmail, setCustFormEmail] = useState('');
  const [custFormPhone, setCustFormPhone] = useState('+91 ');
  const [custFormSegment, setCustFormSegment] = useState<'VIP' | 'Regular' | 'New Inquirer'>('Regular');
  const [custFormStatus, setCustFormStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [custFormPassword, setCustFormPassword] = useState('Welcome@2026');

  // Staff Handlers
  const handleOpenEditStaff = (member: StaffMember) => {
    setEditingStaff(member);
    setStaffFormName(member.name);
    setStaffFormEmail(member.email);
    setStaffFormRole(member.role);
    setStaffFormStatus(member.status);
    setStaffForm2FA(member.twoFactorEnabled);
    setIsEditStaffModalOpen(true);
  };

  const handleSaveEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setStaff((prev) =>
      prev.map((s) =>
        s.id === editingStaff.id
          ? {
              ...s,
              name: staffFormName.trim(),
              email: staffFormEmail.trim(),
              role: staffFormRole,
              status: staffFormStatus,
              twoFactorEnabled: staffForm2FA,
            }
          : s
      )
    );

    setIsEditStaffModalOpen(false);
    setToastMessage(`Staff account for "${staffFormName}" updated successfully.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteStaff = (member: StaffMember) => {
    if (member.role === 'Super Admin') {
      alert('Super Admin accounts cannot be deleted to prevent locking out the admin panel.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete staff member "${member.name}" (${member.email})?`)) {
      return;
    }

    setStaff((prev) => prev.filter((s) => s.id !== member.id));
    setToastMessage(`Staff member "${member.name}" removed from the system.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleInviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormName.trim() || !staffFormEmail.trim()) return;

    const newStaff: StaffMember = {
      id: `staff-${Date.now()}`,
      name: staffFormName.trim(),
      email: staffFormEmail.trim(),
      role: staffFormRole,
      status: staffFormStatus,
      twoFactorEnabled: staffForm2FA,
      lastLogin: 'Never',
    };

    setStaff((prev) => [...prev, newStaff]);
    setIsInviteStaffModalOpen(false);
    setStaffFormName('');
    setStaffFormEmail('');
    setToastMessage(`Invitation dispatched to "${newStaff.email}".`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Customer Handlers
  const handleOpenEditCustomer = (customer: CustomerAccount) => {
    setEditingCustomer(customer);
    setCustFormName(customer.name);
    setCustFormEmail(customer.email);
    setCustFormPhone(customer.phone);
    setCustFormSegment(customer.segment);
    setCustFormStatus(customer.status);
    setIsEditCustomerModalOpen(true);
  };

  const handleSaveEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === editingCustomer.id
          ? {
              ...c,
              name: custFormName.trim(),
              email: custFormEmail.trim(),
              phone: custFormPhone.trim(),
              segment: custFormSegment,
              status: custFormStatus,
            }
          : c
      )
    );

    setIsEditCustomerModalOpen(false);
    setToastMessage(`Customer account for "${custFormName}" updated successfully.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteCustomer = (customer: CustomerAccount) => {
    if (!confirm(`Are you sure you want to delete customer account "${customer.name}" (${customer.email})?`)) {
      return;
    }

    setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    setToastMessage(`Customer record for "${customer.name}" deleted.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custFormName.trim() || !custFormEmail.trim()) return;

    const newCustomer: CustomerAccount = {
      id: `cust-${Date.now()}`,
      name: custFormName.trim(),
      email: custFormEmail.trim(),
      phone: custFormPhone.trim() || '+91 99999 00000',
      segment: custFormSegment,
      ordersCount: 0,
      totalSpentMinor: 0,
      status: custFormStatus,
      joinedDate: 'Today',
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    setIsCreateCustomerModalOpen(false);
    setCustFormName('');
    setCustFormEmail('');
    setCustFormPhone('+91 ');
    setToastMessage(`Customer account created for "${newCustomer.name}".`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header with Navigation Tabs & CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-200/80 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-slate-900" />
            Customers &amp; Staff Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage administrative staff roles, granular RBAC permissions, and customer account profiles.
          </p>
        </div>

        {/* Action Button depending on Active Tab */}
        {activeTab === 'STAFF' ? (
          <button
            type="button"
            onClick={() => {
              setStaffFormName('');
              setStaffFormEmail('');
              setStaffFormRole('Catalog Manager');
              setStaffFormStatus('ACTIVE');
              setStaffForm2FA(true);
              setIsInviteStaffModalOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Invite Staff Member
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setCustFormName('');
              setCustFormEmail('');
              setCustFormPhone('+91 ');
              setCustFormSegment('Regular');
              setCustFormStatus('ACTIVE');
              setIsCreateCustomerModalOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <UserCheck className="h-4 w-4" />
            Create Customer Account
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 text-xs font-bold text-slate-500 gap-6">
        <button
          onClick={() => setActiveTab('STAFF')}
          className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'STAFF'
              ? 'text-slate-900 border-b-2 border-slate-900 font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <span>Staff Accounts &amp; RBAC</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {staff.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('CUSTOMERS')}
          className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'CUSTOMERS'
              ? 'text-slate-900 border-b-2 border-slate-900 font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <span>Customer Accounts</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {customers.length}
          </span>
        </button>
      </div>

      {/* TAB 1: STAFF ACCOUNTS */}
      {activeTab === 'STAFF' && (
        <div className="space-y-6">
          {/* Role Definitions Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Super Admin</p>
              <p className="text-xl font-bold text-slate-900 mt-1">1 Member</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Full unrestricted privileges</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Support Lead</p>
              <p className="text-xl font-bold text-slate-900 mt-1">1 Member</p>
              <p className="text-[11px] text-slate-500 mt-0.5">SLA escalation &amp; refunds &le; ₹5K</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Order Manager</p>
              <p className="text-xl font-bold text-slate-900 mt-1">1 Member</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Pack, dispatch &amp; return QC</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Catalog Manager</p>
              <p className="text-xl font-bold text-slate-900 mt-1">1 Member</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Product inventory &amp; pricing</p>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fcfdfe] text-slate-400 uppercase tracking-wider font-bold text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Staff Member</th>
                    <th className="py-3.5 px-4">Assigned Role</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4">2FA Enforced</th>
                    <th className="py-3.5 px-4">Last Activity</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900">{member.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{member.email}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-900 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {member.status === 'ACTIVE' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            ✓ Active
                          </span>
                        )}
                        {member.status === 'INVITED' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Invite Pending
                          </span>
                        )}
                        {member.status === 'SUSPENDED' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {member.twoFactorEnabled ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Enforced
                          </span>
                        ) : (
                          <span className="text-slate-400">Disabled</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-500 tabular-nums">{member.lastLogin}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditStaff(member)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Staff Member"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(member)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Staff Member"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER ACCOUNTS */}
      {activeTab === 'CUSTOMERS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fcfdfe] text-slate-400 uppercase tracking-wider font-bold text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Customer Profile</th>
                    <th className="py-3.5 px-4">Contact Phone</th>
                    <th className="py-3.5 px-4">Segment</th>
                    <th className="py-3.5 px-4">Total Orders</th>
                    <th className="py-3.5 px-4">Lifetime Spend</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{c.email}</p>
                      </td>
                      <td className="py-4 px-4 font-mono font-medium text-slate-600">{c.phone}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.segment === 'VIP'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {c.segment}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {c.ordersCount} orders
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 tabular-nums">
                        ₹{(c.totalSpentMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCustomer(c)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(c)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Edit Staff Member */}
      {isEditStaffModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-slate-900" />
                Edit Staff Member
              </h3>
              <button onClick={() => setIsEditStaffModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffFormName}
                  onChange={(e) => setStaffFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={staffFormEmail}
                  onChange={(e) => setStaffFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned RBAC Role *</label>
                <select
                  value={staffFormRole}
                  onChange={(e) => setStaffFormRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="Super Admin">Super Admin (All Privileges)</option>
                  <option value="Support Lead">Support Lead (Customer Desk &amp; Returns)</option>
                  <option value="Order Manager">Order Manager (Fulfillment &amp; Dispatch)</option>
                  <option value="Finance Manager">Finance Manager (Gateways &amp; Refunds)</option>
                  <option value="Catalog Manager">Catalog Manager (Inventory &amp; Pricing)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={staffFormStatus}
                    onChange={(e: any) => setStaffFormStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INVITED">INVITED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">2FA Security</label>
                  <select
                    value={staffForm2FA ? 'ENABLED' : 'DISABLED'}
                    onChange={(e) => setStaffForm2FA(e.target.value === 'ENABLED')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none"
                  >
                    <option value="ENABLED">Enforced (2FA)</option>
                    <option value="DISABLED">Optional</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditStaffModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Invite / Create Staff Member */}
      {isInviteStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-slate-900" />
                Invite New Staff Member
              </h3>
              <button onClick={() => setIsInviteStaffModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInviteStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={staffFormName}
                  onChange={(e) => setStaffFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya@moonlet.in"
                  value={staffFormEmail}
                  onChange={(e) => setStaffFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={staffFormRole}
                  onChange={(e) => setStaffFormRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="Catalog Manager">Catalog Manager</option>
                  <option value="Order Manager">Order Manager</option>
                  <option value="Support Lead">Support Lead</option>
                  <option value="Finance Manager">Finance Manager</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInviteStaffModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Customer Account */}
      {isEditCustomerModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-slate-900" />
                Edit Customer Account
              </h3>
              <button onClick={() => setIsEditCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={custFormName}
                  onChange={(e) => setCustFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={custFormEmail}
                  onChange={(e) => setCustFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={custFormPhone}
                  onChange={(e) => setCustFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Segment</label>
                  <select
                    value={custFormSegment}
                    onChange={(e: any) => setCustFormSegment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none"
                  >
                    <option value="VIP">VIP Customer</option>
                    <option value="Regular">Regular Buyer</option>
                    <option value="New Inquirer">New Inquirer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={custFormStatus}
                    onChange={(e: any) => setCustFormStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditCustomerModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Create Customer Account */}
      {isCreateCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-slate-900" />
                Create Customer Account
              </h3>
              <button onClick={() => setIsCreateCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sneha Patel"
                  value={custFormName}
                  onChange={(e) => setCustFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sneha.patel@gmail.com"
                  value={custFormEmail}
                  onChange={(e) => setCustFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number (India)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={custFormPhone}
                  onChange={(e) => setCustFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Segment</label>
                  <select
                    value={custFormSegment}
                    onChange={(e: any) => setCustFormSegment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none"
                  >
                    <option value="Regular">Regular Buyer</option>
                    <option value="VIP">VIP Customer</option>
                    <option value="New Inquirer">New Inquirer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={custFormPassword}
                    onChange={(e) => setCustFormPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateCustomerModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
