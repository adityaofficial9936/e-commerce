import { create } from 'zustand';
import { CartItem } from '../types/store';


interface CartState {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string | null;
  discountMinor: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  applyCoupon: (code: string, discountMinor: number) => void;
  removeCoupon: () => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [
    {
      variantId: 'var-demo-1',
      productId: 'prod-demo-1',
      name: 'Air Velocity Pro Running Sneakers',
      variantTitle: 'Size: 9 / Navy Blue',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      priceMinor: 249900,
      quantity: 1,
      availableStock: 8,
    },
  ],
  isOpen: false,
  couponCode: null,
  discountMinor: 0,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  addItem: (item, quantity = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.variantId === item.variantId);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, existing.availableStock);
        return {
          items: state.items.map((i) =>
            i.variantId === item.variantId ? { ...i, quantity: newQty } : i
          ),
          isOpen: true,
        };
      }
      return {
        items: [...state.items, { ...item, quantity: Math.min(quantity, item.availableStock) }],
        isOpen: true,
      };
    });
  },

  removeItem: (variantId) => {
    set((state) => ({
      items: state.items.filter((i) => i.variantId !== variantId),
    }));
  },

  updateQuantity: (variantId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(variantId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) => {
        if (i.variantId === variantId) {
          return { ...i, quantity: Math.min(quantity, i.availableStock) };
        }
        return i;
      }),
    }));
  },

  applyCoupon: (code, discountMinor) => {
    set({ couponCode: code, discountMinor });
  },

  removeCoupon: () => {
    set({ couponCode: null, discountMinor: 0 });
  },

  clearCart: () => {
    set({ items: [], couponCode: null, discountMinor: 0 });
  },
}));

export function useCartSummary() {
  const items = useCartStore((s) => s.items);
  const discountMinor = useCartStore((s) => s.discountMinor);

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotalMinor = items.reduce((acc, i) => acc + i.priceMinor * i.quantity, 0);
  const taxableBase = Math.max(0, subtotalMinor - discountMinor);
  const taxMinor = Math.round(taxableBase * 0.18); // 18% GST
  const shippingMinor = taxableBase >= 99900 || taxableBase === 0 ? 0 : 9900; // Free above ₹999
  const totalMinor = taxableBase + taxMinor + shippingMinor;

  return {
    itemCount,
    subtotalMinor,
    discountMinor,
    taxMinor,
    shippingMinor,
    totalMinor,
  };
}
