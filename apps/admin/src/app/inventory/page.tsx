'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Package,
  TrendingUp,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  ExternalLink,
  Edit2,
  Printer,
  Copy,
  MoreHorizontal,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { adminApiClient } from '../../lib/api-client';

interface ProductImage {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
}

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  priceMinor: number;
  quantityOnHand: number;
  reserved: number;
  status: 'Active' | 'Low Stock' | 'Draft' | 'Archived';
  variant: string;
  imageUrl?: string;
  images: ProductImage[];
  monthlySales?: number[];
}

const INITIAL_INVENTORY: ProductItem[] = [
  {
    id: 'prod-001',
    sku: 'DEF-456-BLU',
    name: 'Stihl TS 800 cut-off machine incl. 5x diamond cutting discs',
    category: 'Grinding Equipment',
    brand: 'Apex Industrial',
    priceMinor: 159000,
    quantityOnHand: 19,
    reserved: 5,
    status: 'Active',
    variant: '14-inch Blade / High-Torque',
    images: [
      {
        id: 'img-1',
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80',
        altText: 'Stihl TS 800 Main',
        isPrimary: true,
      },
    ],
    monthlySales: [12, 18, 15, 25, 32, 28, 42],
  },
  {
    id: 'prod-002',
    sku: 'GH-789-GRN',
    name: 'Gasoline generator EYG 7500i (Inverter)',
    category: 'Power generators',
    brand: 'Apex Power',
    priceMinor: 153700,
    quantityOnHand: 8,
    reserved: 2,
    status: 'Active',
    variant: '7.5 kW / Silent Inverter',
    images: [
      {
        id: 'img-2',
        url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&auto=format&fit=crop&q=80',
        altText: 'Generator Main',
        isPrimary: true,
      },
    ],
    monthlySales: [8, 12, 14, 18, 22, 29, 35],
  },
  {
    id: 'prod-003',
    sku: 'JK-012-BLK',
    name: 'Reversible vibratory plate VSS-WP160H',
    category: 'Vibration equipment',
    brand: 'Apex Heavy',
    priceMinor: 219900,
    quantityOnHand: 4,
    reserved: 1,
    status: 'Low Stock',
    variant: '160 kg / Honda Engine',
    images: [
      {
        id: 'img-3',
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80',
        altText: 'Vibratory plate',
        isPrimary: true,
      },
    ],
    monthlySales: [4, 6, 5, 8, 11, 9, 14],
  },
  {
    id: 'prod-004',
    sku: 'MND-345-WHT',
    name: 'Prompower P25-300-4-320-6 soft starter',
    category: 'Circuit breakers',
    brand: 'Apex Electrics',
    priceMinor: 48900,
    quantityOnHand: 34,
    reserved: 3,
    status: 'Active',
    variant: '320A / 400V',
    images: [
      {
        id: 'img-4',
        url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
        altText: 'Soft starter',
        isPrimary: true,
      },
    ],
    monthlySales: [15, 20, 25, 28, 35, 40, 52],
  },
  {
    id: 'prod-005',
    sku: 'PQR-678-YLW',
    name: 'Thermal imaging sight iRay Saim SCT 35 V2',
    category: 'Thermal imaging',
    brand: 'Apex Optics',
    priceMinor: 289900,
    quantityOnHand: 11,
    reserved: 0,
    status: 'Active',
    variant: '35mm Lens / 12μm Detector',
    images: [
      {
        id: 'img-5',
        url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&auto=format&fit=crop&q=80',
        altText: 'Thermal sight',
        isPrimary: true,
      },
    ],
    monthlySales: [3, 5, 7, 6, 12, 15, 19],
  },
  {
    id: 'prod-006',
    sku: 'STU-901-PNK',
    name: 'DEKraft Circuit Breaker 630A',
    category: 'Circuit breakers',
    brand: 'Apex Electrics',
    priceMinor: 38900,
    quantityOnHand: 0,
    reserved: 0,
    status: 'Archived',
    variant: '3-Pole / 630A',
    images: [
      {
        id: 'img-6',
        url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80',
        altText: 'Circuit breaker',
        isPrimary: true,
      },
    ],
    monthlySales: [10, 15, 12, 5, 0, 0, 0],
  },
];

export default function InventoryPage() {
  const { currentStaff } = useStaffAuth();
  const [items, setItems] = useState<ProductItem[]>(INITIAL_INVENTORY);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(INITIAL_INVENTORY[0]);
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Low Stock' | 'Draft' | 'Archived'>('All');
  const [comparePrior, setComparePrior] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch persisted products from shared catalog on mount
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
          setSelectedProduct(data[0]);
        }
      })
      .catch((err) => console.error('Failed to load products from API:', err));
  }, []);

  // Add Product Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Grinding Equipment');
  const [formBrand, setFormBrand] = useState('Apex Industrial');
  const [formDescription, setFormDescription] = useState('High precision professional equipment built for demanding heavy-duty operations.');
  const [formSku, setFormSku] = useState('');
  const [formPriceDollars, setFormPriceDollars] = useState('1590.00');
  const [formQuantity, setFormQuantity] = useState('20');
  const [formVariant, setFormVariant] = useState('Standard / Heavy-Duty');
  const [formImages, setFormImages] = useState<ProductImage[]>([]);
  const [urlInput, setUrlInput] = useState('');

  // Edit Product Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editPriceDollars, setEditPriceDollars] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Low Stock' | 'Draft' | 'Archived'>('Active');
  const [editVariant, setEditVariant] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  const openEditModal = (prod: ProductItem) => {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditCategory(prod.category);
    setEditBrand(prod.brand || 'Moonlet');
    setEditSku(prod.sku);
    setEditPriceDollars((prod.priceMinor / 100).toFixed(2));
    setEditQuantity(String(prod.quantityOnHand));
    setEditStatus(prod.status || 'Active');
    setEditVariant(prod.variant || 'Standard');
    setEditImageUrl(prod.images[0]?.url || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const price = parseFloat(editPriceDollars) || 100;
    const qty = parseInt(editQuantity, 10) || 10;
    const priceMinor = Math.round(price * 100);

    const updatedItem: ProductItem = {
      ...editingProduct,
      name: editName.trim(),
      category: editCategory,
      brand: editBrand,
      sku: editSku.trim().toUpperCase(),
      priceMinor,
      quantityOnHand: qty,
      status: editStatus,
      variant: editVariant,
      imageUrl: editImageUrl || (editingProduct.images[0]?.url || ''),
      images: editImageUrl
        ? [{ id: `img-${Date.now()}`, url: editImageUrl, altText: editName, isPrimary: true }]
        : editingProduct.images,
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

    setItems((prev) => prev.map((p) => (p.id === updatedItem.id ? updatedItem : p)));
    if (selectedProduct?.id === updatedItem.id) {
      setSelectedProduct(updatedItem);
    }
    setIsEditModalOpen(false);
    setToastMessage(`Product "${updatedItem.name}" updated successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteProduct = async (prod: ProductItem) => {
    if (!confirm(`Are you sure you want to permanently delete "${prod.name}" (${prod.sku})? This action cannot be undone.`)) {
      return;
    }

    try {
      await fetch(`/api/products?id=${encodeURIComponent(prod.id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete product via API:', err);
    }

    setItems((prev) => prev.filter((p) => p.id !== prod.id && p.sku !== prod.sku));
    if (selectedProduct?.id === prod.id) {
      setSelectedProduct(null);
    }
    setToastMessage(`Product "${prod.name}" deleted from inventory.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredItems = items.filter((item) => {
    if (activeTab !== 'All' && item.status !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchSku = item.sku.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchCat) return false;
    }
    return true;
  });

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const newImgs: ProductImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setFormError('File size must be 5MB or smaller.');
        continue;
      }

      try {
        const uploadedUrl = await adminApiClient.uploadProductImage(file);
        newImgs.push({
          id: `img-${Date.now()}-${i}`,
          url: uploadedUrl,
          altText: file.name.split('.')[0] || 'Product view',
          isPrimary: formImages.length === 0 && i === 0,
        });
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormImages((prev) => [
            ...prev,
            {
              id: `img-${Date.now()}-${i}`,
              url: reader.result as string,
              altText: file.name,
              isPrimary: prev.length === 0,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    }

    if (newImgs.length > 0) {
      setFormImages((prev) => [...prev, ...newImgs]);
    }
    setIsUploading(false);
  };

  const handleAddImageUrl = () => {
    if (!urlInput.trim()) return;
    setFormImages((prev) => [
      ...prev,
      {
        id: `img-${Date.now()}`,
        url: urlInput.trim(),
        altText: formName || 'Product Image',
        isPrimary: prev.length === 0,
      },
    ]);
    setUrlInput('');
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formSku.trim()) {
      setFormError('Product title and SKU are required.');
      return;
    }

    const normalizedSku = formSku.trim().toUpperCase();
    if (items.some((i) => i.sku === normalizedSku)) {
      setFormError(`SKU ${normalizedSku} already exists.`);
      return;
    }

    const price = parseFloat(formPriceDollars) || 100;
    const qty = parseInt(formQuantity, 10) || 10;
    const priceMinor = Math.round(price * 100);

    const finalImages: ProductImage[] =
      formImages.length > 0
        ? formImages
        : [
            {
              id: `img-${Date.now()}`,
              url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80',
              altText: formName,
              isPrimary: true,
            },
          ];

    const newProd: ProductItem = {
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
      images: finalImages,
      monthlySales: [5, 10, 15, 20, 25, 30, 35],
    };

    // Persist immediately to shared database
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd),
      });
    } catch (err) {
      console.error('Failed to save to /api/products:', err);
    }

    setItems((prev) => [newProd, ...prev.filter((p) => p.id !== newProd.id)]);
    setSelectedProduct(newProd);
    setToastMessage(`Product "${newProd.name}" published and synced to Customer Storefront!`);
    setTimeout(() => setToastMessage(null), 4000);

    // Reset
    setFormName('');
    setFormSku('');
    setFormImages([]);
    setIsAddModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex">
      {/* Center Table & Controls */}
      <div className="flex-1 min-w-0 p-6 lg:p-8 space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="p-3 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-lg">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Inventory
          </h1>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Shakuro 3-Column Top Stats (Image 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
              1,582
            </span>
            <span className="text-xs text-slate-400 font-medium">Total inventory volume</span>
          </div>

          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
              $1.9M
            </span>
            <span className="text-xs text-slate-400 font-medium">Inventory value</span>
          </div>

          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
              6.82
            </span>
            <span className="text-xs text-slate-400 font-medium">Inventory turnover</span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-semibold text-slate-400">
          {(['All', 'Active', 'Low Stock', 'Draft', 'Archived'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                  : 'hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
          <button className="pb-3 text-slate-400 hover:text-slate-600 cursor-pointer">
            Custom +
          </button>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fcfdfe] text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 w-10"></th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4 text-right">Price</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredItems.map((prod) => {
                  const isSelected = selectedProduct?.id === prod.id;
                  const thumb = prod.images[0]?.url;

                  return (
                    <tr
                      key={prod.id}
                      onClick={() => setSelectedProduct(prod)}
                      className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                        isSelected ? 'bg-slate-100/60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setSelectedProduct(prod)}
                          className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Title + Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            {thumb ? (
                              <img src={thumb} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Boxes className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <span className="font-semibold text-slate-900 truncate max-w-xs">{prod.name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">{prod.category}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{prod.sku}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{prod.quantityOnHand}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                        ${(prod.priceMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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
        </div>
      </div>

      {/* Right Column: Shakuro Product Info Inspector (Image 3) */}
      {selectedProduct && (
        <aside className="w-96 border-l border-slate-200/80 bg-white p-6 space-y-6 shrink-0 hidden lg:block overflow-y-auto">
          {/* Header & Actions */}
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                {selectedProduct.name}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Shakuro Action Buttons: Edit, Delete, Print, Duplicate */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => openEditModal(selectedProduct)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Edit2 className="h-3 w-3" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(selectedProduct)}
                className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </button>
              <button
                type="button"
                onClick={() => alert(`Printing inventory barcode tag for ${selectedProduct.sku}`)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1.5"
              >
                <Printer className="h-3 w-3 text-slate-500" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => alert(`Duplicating product ${selectedProduct.sku}`)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1.5"
              >
                <Copy className="h-3 w-3 text-slate-500" />
                <span>Duplicate</span>
              </button>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Product info
              </span>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-1 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">SKU</span>
                  <span className="font-mono font-bold text-slate-900">{selectedProduct.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Price</span>
                  <span className="font-bold text-slate-900">
                    ${(selectedProduct.priceMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Category</span>
                  <span className="text-slate-700 font-medium">{selectedProduct.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stock</span>
                  <span className="font-bold text-slate-900">{selectedProduct.quantityOnHand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reserved</span>
                  <span className="font-bold text-amber-600">{selectedProduct.reserved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total</span>
                  <span className="font-bold text-slate-900">{selectedProduct.quantityOnHand + selectedProduct.reserved}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Status</span>
                  <span className="font-bold text-emerald-600">✓ Active</span>
                </div>
              </div>

              {/* Product Thumbnail Box */}
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                <img
                  src={selectedProduct.images[0]?.url}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Sales Statistics Section with SVG Curve Chart (Image 3) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Sales statistics
              </span>
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 cursor-pointer">
                This year <ChevronDown className="h-3 w-3 text-slate-400" />
              </span>
            </div>

            {/* Metric Value */}
            <div>
              <span className="text-2xl font-black text-slate-900 block tracking-tight">45</span>
              <span className="text-[10px] text-slate-400">Total units sold</span>
            </div>

            {/* Smooth SVG Sales Curve */}
            <div className="h-28 w-full pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 280 80">
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal grid lines */}
                <line x1="0" y1="20" x2="280" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="280" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="75" x2="280" y2="75" stroke="#e2e8f0" strokeWidth="1" />

                {/* Shaded Area */}
                <path
                  d="M 10 65 Q 50 50, 90 55 T 160 35 T 230 40 T 270 15 L 270 75 L 10 75 Z"
                  fill="url(#salesGrad)"
                />

                {/* Curve Line */}
                <path
                  d="M 10 65 Q 50 50, 90 55 T 160 35 T 230 40 T 270 15"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Current Dot */}
                <circle cx="270" cy="15" r="4" fill="#0f172a" />
              </svg>
              <div className="flex justify-between text-[10px] text-slate-400 pt-1 font-medium">
                <span>6 January</span>
                <span>June</span>
                <span>2024</span>
              </div>
            </div>

            {/* Compare to Prior Toggle */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-600 font-medium">Compare to prior</span>
              <button
                type="button"
                onClick={() => setComparePrior(!comparePrior)}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                  comparePrior ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    comparePrior ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Add Product Modal (Multi-Image + Variants) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Add New Product</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              {/* Image Upload Zone */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="font-bold text-slate-800 block">Product Gallery Images</label>
                <div className="border-2 border-dashed border-slate-300 hover:border-slate-800 transition-colors rounded-xl p-4 text-center bg-white cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleImageFiles(e.target.files)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                    <Upload className="h-6 w-6 text-slate-700" />
                    <p className="font-bold text-slate-700">
                      {isUploading ? 'Uploading images...' : 'Drop image files here, or click to browse'}
                    </p>
                    <p className="text-[10px] text-slate-400">JPG, PNG, WebP up to 5MB</p>
                  </div>
                </div>

                {/* Direct URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Or paste external image URL..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-2 bg-slate-900 text-white rounded-xl font-bold"
                  >
                    Add URL
                  </button>
                </div>

                {/* Previews */}
                {formImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {formImages.map((img) => (
                      <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                        <img src={img.url} alt={img.altText} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormImages((prev) => prev.filter((i) => i.id !== img.id))}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Stihl TS 800 cut-off machine"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. DEF-456-BLU"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Grinding Equipment">Grinding Equipment</option>
                    <option value="Power generators">Power generators</option>
                    <option value="Vibration equipment">Vibration equipment</option>
                    <option value="Circuit breakers">Circuit breakers</option>
                    <option value="Thermal imaging">Thermal imaging</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPriceDollars}
                    onChange={(e) => setFormPriceDollars(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold"
                >
                  Publish Product
                </button>
              </div>
            </form>
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
                className="text-slate-400 hover:text-slate-600 p-1"
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
                  placeholder="e.g. 18k Gold-Tone / Standard"
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
                  <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
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
                  className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Product</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-colors"
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
