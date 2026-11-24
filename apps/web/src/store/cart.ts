import { create } from 'zustand';
import { CartItem } from '../types/store';


interface CartState {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string | null;
  discountMinor: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number, openDrawer?: boolean) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  applyCoupon: (code: string, discountMinor: number) => void;
  removeCoupon: () => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  couponCode: null,
  discountMinor: 0,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  addItem: (item, quantity = 1, openDrawer = false) => {
    set((state) => {
      const existing = state.items.find((i) => i.variantId === item.variantId);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, existing.availableStock);
        return {
          items: state.items.map((i) =>
            i.variantId === item.variantId ? { ...i, quantity: newQty } : i
          ),
          isOpen: openDrawer ? true : state.isOpen,
        };
      }
      return {
        items: [...state.items, { ...item, quantity: Math.min(quantity, item.availableStock) }],
        isOpen: openDrawer ? true : state.isOpen,
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
