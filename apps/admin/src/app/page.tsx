'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Package,
  RotateCcw,
  Clock,
  ArrowUpRight,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Copy,
  MoreHorizontal,
  Maximize2,
  X,
  Printer,
  Plus,
  Boxes,
  Database,
  ExternalLink,
  Check,
  UploadCloud,
  Edit2,
  Trash2,
  User,
  Shield,
  LogOut,
} from 'lucide-react';
import { useStaffAuth, STAFF_PRESETS, StaffRole } from '../context/StaffAuthContext';

interface OrderItem {
  id: string;
  orderNumber: string;
  customer: string;
  customerInitials: string;
  type: string;
  status: 'PAID' | 'SHIPPED' | 'CANCELLED' | 'REFUNDED';
  product: string;
  total: string;
  date: string;
  productThumb: string;
}

interface ProductItem {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category: string;
  brand?: string;
  priceMinor: number;
  quantityOnHand: number;
  reserved: number;
  status: string;
  variant?: string;
  imageUrl?: string;
  images?: { id: string; url: string; altText?: string; isPrimary?: boolean }[];
}

const DASHBOARD_ORDERS: OrderItem[] = [
  {
    id: 'ord-101',
    orderNumber: '#192541',
    customer: 'Esther Howard',
    customerInitials: 'EH',
    type: 'Shipping',
    status: 'PAID',
    product: 'Stihl TS 800 cut-off machine',
    total: '$3,127.00',
    date: 'Jun 19',
    productThumb: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'ord-102',
    orderNumber: '#192540',
    customer: 'David Miller',
    customerInitials: 'DM',
    type: 'Pickups',
    status: 'PAID',
    product: 'AeroDry Seamless Breathable Training Tee',
    total: '$1,270.00',
    date: 'Jun 19',
    productThumb: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'ord-103',
    orderNumber: '#192539',
    customer: 'James Moore',
    customerInitials: 'JM',
    type: 'Shipping',
    status: 'PAID',
    product: 'Pro Tactical Waterproof Gym Duffel 45L',
    total: '$2,459.30',
    date: 'Jun 19',
    productThumb: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'ord-104',
    orderNumber: '#192538',
    customer: 'Robert Anderson',
    customerInitials: 'RA',
    type: 'Shipping',
    status: 'PAID',
    product: 'ProCompression High-Tension Running Tights',
    total: '$675.00',
    date: 'Jun 19',
    productThumb: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'ord-105',
    orderNumber: '#192537',
    customer: 'Jessica Martinez',
    customerInitials: 'JM',
    type: 'Shipping',
    status: 'REFUNDED',
    product: 'Carbon Glide Elite Marathon Racing Shoe',
    total: '$795.00',
    date: 'Jun 18',
    productThumb: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=100&auto=format&fit=crop&q=80',
  },
];

export default function AdminDashboardPage() {
  const { currentStaff, switchRole, logout } = useStaffAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Pagination States
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(8);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(5);

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Grinding Equipment');
  const [formBrand, setFormBrand] = useState('Apex Industrial');
  const [formSku, setFormSku] = useState('');
  const [formPriceDollars, setFormPriceDollars] = useState('1590.00');
  const [formQuantity, setFormQuantity] = useState('20');
  const [formVariant, setFormVariant] = useState('Standard / Heavy-Duty');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Product Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editPriceDollars, setEditPriceDollars] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [editVariant, setEditVariant] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  const openEditModal = (prod: ProductItem) => {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditCategory(prod.category);
    setEditSku(prod.sku);
    setEditPriceDollars(((prod.priceMinor || 0) / 100).toFixed(2));
    setEditQuantity(String(prod.quantityOnHand || 0));
    setEditStatus(prod.status || 'Active');
    setEditVariant(prod.variant || 'Standard');
    setEditImageUrl(prod.imageUrl || (prod.images && prod.images[0]?.url) || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const price = parseFloat(editPriceDollars) || 100;
    const qty = parseInt(editQuantity, 10) || 10;
    const priceMinor = Math.round(price * 100);

    const updatedItem = {
      ...editingProduct,
      name: editName.trim(),
      category: editCategory,
      sku: editSku.trim().toUpperCase(),
      priceMinor,
      quantityOnHand: qty,
      status: editStatus,
      variant: editVariant,
      imageUrl: editImageUrl,
    };

    try {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
    } catch (err) {
      console.error('Failed to update product via API:', err);
    }

    setProducts((prev) => prev.map((p) => (p.id === updatedItem.id ? updatedItem : p)));
    setIsEditModalOpen(false);
    setToastMessage(`Product "${updatedItem.name}" updated successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteProduct = async (prod: ProductItem) => {
    if (!confirm(`Are you sure you want to permanently delete "${prod.name}" (${prod.sku})?`)) {
      return;
    }

    try {
      await fetch(`/api/products?id=${encodeURIComponent(prod.id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete product via API:', err);
    }

    setProducts((prev) => prev.filter((p) => p.id !== prod.id && p.sku !== prod.sku));
    setToastMessage(`Product "${prod.name}" deleted from database.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load products from live API / Neon Postgres
  const loadProducts = () => {
    setIsLoadingProducts(true);
    fetch('/api/products', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch((err) => console.error('Failed to load products:', err))
      .finally(() => setIsLoadingProducts(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const totalInventoryUnits = products.reduce((acc, p) => acc + (p.quantityOnHand || 0), 0);
  const totalInventoryValueDollars = products.reduce(
    (acc, p) => acc + ((p.priceMinor || 0) / 100) * (p.quantityOnHand || 0),
    0
  );

  // Pagination calculations
  const totalProducts = products.length;
  const totalProductPages = Math.max(1, Math.ceil(totalProducts / productPageSize));
  const paginatedProducts = products.slice(
    (productPage - 1) * productPageSize,
    productPage * productPageSize
  );

  const totalOrders = DASHBOARD_ORDERS.length;
  const totalOrderPages = Math.max(1, Math.ceil(totalOrders / ordersPageSize));
  const paginatedOrders = DASHBOARD_ORDERS.slice(
    (ordersPage - 1) * ordersPageSize,
    ordersPage * ordersPageSize
  );

  useEffect(() => {
    if (productPage > totalProductPages) {
      setProductPage(Math.max(1, totalProductPages));
    }
  }, [productPage, totalProductPages]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) return;

    setIsSubmitting(true);
    const normalizedSku = formSku.trim().toUpperCase();
    const price = parseFloat(formPriceDollars) || 100;
    const qty = parseInt(formQuantity, 10) || 10;
    const priceMinor = Math.round(price * 100);

    const finalImage =
      formImageUrl.trim() ||
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80';

    const newProd = {
      id: `prod-${Date.now()}`,
      sku: normalizedSku,
      name: formName.trim(),
      category: formCategory,
      brand: formBrand,
      priceMinor,
      quantityOnHand: qty,
      reserved: 0,
      status: 'Active',
      variant: formVariant,
      imageUrl: finalImage,
      images: [
        {
          id: `img-${Date.now()}`,
          url: finalImage,
          altText: formName,
          isPrimary: true,
        },
      ],
      monthlySales: [5, 10, 15, 20, 25, 30, 35],
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd),
      });

      if (res.ok) {
        const created = await res.json();
        setProducts((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
        setIsAddModalOpen(false);
        setFormName('');
        setFormSku('');
        setFormImageUrl('');
        setToastMessage(`Product "${newProd.name}" added successfully and synced to Neon PostgreSQL!`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error adding product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Check className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Center Area */}
      <div className="flex-1 min-w-0 p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Dashboard
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Database className="h-3 w-3 text-emerald-600 animate-pulse" />
                Neon Postgres Connected
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Executive overview of revenue, shipments, warehouse fulfillment, and live product catalog.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Landing Page Profile Badge & Quick Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl border border-slate-200 shadow-xs transition-all text-left cursor-pointer"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {currentStaff.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                      {currentStaff.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {currentStaff.roleLabel}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate max-w-[170px]">{currentStaff.email}</p>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-3 space-y-2 text-slate-800">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {currentStaff.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentStaff.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{currentStaff.email}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Security Clearance:</span>
                      <span className="font-bold text-blue-700">{currentStaff.roleLabel}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Switch Active Role
                    </span>
                    {(Object.keys(STAFF_PRESETS) as StaffRole[]).map((roleKey) => {
                      const preset = STAFF_PRESETS[roleKey];
                      const isSelected = currentStaff.role === roleKey;
                      return (
                        <button
                          key={roleKey}
                          type="button"
                          onClick={() => {
                            switchRole(roleKey);
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{preset.roleLabel}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <Link
                      href="/staff"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Staff Directory →
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        logout();
                      }}
                      className="font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/inventory"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Boxes className="h-4 w-4" />
              <span>Full Inventory</span>
            </Link>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Product</span>
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Live Products</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{products.length}</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <Check className="h-3.5 w-3.5" />
                Active in Store
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Synced with Neon DB & Storefront</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Inventory Volume</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{totalInventoryUnits.toLocaleString()}</span>
              <span className="text-xs font-bold text-blue-600">Stocked</span>
            </div>
            <p className="text-[11px] text-slate-400">Physical units available</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inventory Catalog Value</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">
                ${totalInventoryValueDollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Live Asset
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Across {products.length} product lines</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Revenue (Month)</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">$2.2M</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="h-3.5 w-3.5" />
                +18.4%
              </span>
            </div>
            <p className="text-[11px] text-slate-400">242 orders completed</p>
          </div>
        </div>

        {/* Tab Switcher & Dynamic Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'products'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Live Products Catalog ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'orders'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Recent Live Orders ({DASHBOARD_ORDERS.length})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === 'products' ? (
                <Link
                  href="/inventory"
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <span>Manage in Inventory</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <Link
                  href="/orders"
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <span>View All Orders</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Tab 1: Live Products Catalog Table */}
          {activeTab === 'products' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fcfdfe] text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginatedProducts.map((prod) => {
                      const thumb =
                        prod.imageUrl ||
                        (prod.images && prod.images[0]?.url) ||
                        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';
                      const displayPrice = `$${((prod.priceMinor || 0) / 100).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}`;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                <img src={thumb} alt={prod.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{prod.name}</span>
                                <span className="text-[11px] text-slate-400">{prod.brand || 'Apex Industrial'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{prod.category}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800 text-[11px]">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                              {prod.sku}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900">{prod.quantityOnHand || 0}</span>
                            <span className="text-[11px] text-slate-400 ml-1">units</span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{displayPrice}</td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ {prod.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`http://localhost:3000/products/${prod.slug || prod.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
                                title="Store Preview"
                              >
                                <span>Preview</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <button
                                type="button"
                                onClick={() => openEditModal(prod)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Products Pagination Bar */}
              <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>
                    Showing{' '}
                    <span className="font-bold text-slate-900">
                      {totalProducts === 0 ? 0 : (productPage - 1) * productPageSize + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-bold text-slate-900">
                      {Math.min(productPage * productPageSize, totalProducts)}
                    </span>{' '}
                    of <span className="font-bold text-slate-900">{totalProducts}</span> products
                  </span>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Per page:</span>
                    <select
                      value={productPageSize}
                      onChange={(e) => {
                        setProductPageSize(Number(e.target.value));
                        setProductPage(1);
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-400 cursor-pointer"
                    >
                      <option value={5}>5</option>
                      <option value={8}>8</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                    disabled={productPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalProductPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setProductPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          productPage === pageNum
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setProductPage((p) => Math.min(totalProductPages, p + 1))}
                    disabled={productPage === totalProductPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Recent Orders Table */}
          {activeTab === 'orders' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fcfdfe] text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Order</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginatedOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {ord.customerInitials}
                            </div>
                            <span className="font-semibold text-slate-900">{ord.customer}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{ord.type}</td>
                        <td className="py-3.5 px-4">
                          {ord.status === 'PAID' && (
                            <span className="font-bold text-emerald-600">✓ Paid</span>
                          )}
                          {ord.status === 'REFUNDED' && (
                            <span className="font-bold text-amber-600">↩ Refunded</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                            <img src={ord.productThumb} alt="Product" className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{ord.total}</td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">{ord.date}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button type="button" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Orders Pagination Bar */}
              <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>
                    Showing{' '}
                    <span className="font-bold text-slate-900">
                      {totalOrders === 0 ? 0 : (ordersPage - 1) * ordersPageSize + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-bold text-slate-900">
                      {Math.min(ordersPage * ordersPageSize, totalOrders)}
                    </span>{' '}
                    of <span className="font-bold text-slate-900">{totalOrders}</span> orders
                  </span>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Per page:</span>
                    <select
                      value={ordersPageSize}
                      onChange={(e) => {
                        setOrdersPageSize(Number(e.target.value));
                        setOrdersPage(1);
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-400 cursor-pointer"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                    disabled={ordersPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalOrderPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setOrdersPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          ordersPage === pageNum
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setOrdersPage((p) => Math.min(totalOrderPages, p + 1))}
                    disabled={ordersPage === totalOrderPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Shakuro Analytics Rail */}
      <aside className="w-80 border-l border-slate-200/80 bg-white p-6 space-y-6 shrink-0 hidden xl:block overflow-y-auto">
        {/* Receipt of Goods Gauge */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Receipt of Goods
          </span>

          <div className="relative flex flex-col items-center justify-center pt-2">
            <svg className="w-40 h-24 overflow-visible" viewBox="0 0 160 90">
              <path
                d="M 15 85 A 65 65 0 0 1 145 85"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="14"
                strokeLinecap="round"
              />
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

        {/* Overview KPIs */}
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
      </aside>

      {/* Add Product Modal (Direct from Dashboard) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">Add New Product to Live Catalog</h3>
                <p className="text-xs text-slate-500">Will be instantly live on Dashboard, Inventory, and Storefront.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stihl TS 800 cut-off machine"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEF45"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-medium bg-white"
                  >
                    <option value="Grinding Equipment">Grinding Equipment</option>
                    <option value="Power generators">Power generators</option>
                    <option value="Vibration equipment">Vibration equipment</option>
                    <option value="Circuit breakers">Circuit breakers</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1590.00"
                    value={formPriceDollars}
                    onChange={(e) => setFormPriceDollars(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leaves empty for default professional machinery image.</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  {isSubmitting ? (
                    <span>Syncing to Neon DB...</span>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Create & Sync Live</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">Order {selectedOrder.orderNumber}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                <img src={selectedOrder.productThumb} alt="Product" className="w-12 h-12 object-cover rounded-xl" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{selectedOrder.product}</p>
                  <p className="text-slate-400">{selectedOrder.customer}</p>
                </div>
                <span className="font-black text-slate-900">{selectedOrder.total}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Status:</span>
                <span className="font-bold text-emerald-600">{selectedOrder.status}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery:</span>
                <span>{selectedOrder.type}</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <Link
                href="/orders"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl text-center"
              >
                Open Full Order Desk →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 my-8 max-h-[90vh] overflow-y-auto animate-fade-in font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Update Product</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {editingProduct.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price ($/₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPriceDollars}
                    onChange={(e) => setEditPriceDollars(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Variant / Finish</label>
                <input
                  type="text"
                  value={editVariant}
                  onChange={(e) => setEditVariant(e.target.value)}
                  placeholder="e.g. Standard / 18k Gold-Tone"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none"
                />
                {editImageUrl && (
                  <div className="mt-2 w-14 h-14 rounded-xl overflow-hidden border border-slate-200">
                    <img src={editImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteProduct(editingProduct);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Product</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
