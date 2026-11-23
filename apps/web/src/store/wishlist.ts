import { create } from 'zustand';

export interface WishlistItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  finish: string;
  material: string;
  brand: string;
  priceMinor: number;
  mrpMinor: number;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  variantId: string;
  inStock: boolean;
  tag?: string;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  toggleItem: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

const STORAGE_KEY = 'moonlet_wishlist_items';

function getInitialItems(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse wishlist from storage:', e);
  }
  return [];
}

function saveItems(items: WishlistItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save wishlist to storage:', e);
  }
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: typeof window !== 'undefined' ? getInitialItems() : [],

  addItem: (item) => {
    set((state) => {
      if (state.items.some((i) => i.id === item.id)) return state;
      const next = [item, ...state.items];
      saveItems(next);
      return { items: next };
    });
  },

  removeItem: (id) => {
    set((state) => {
      const next = state.items.filter((i) => i.id !== id);
      saveItems(next);
      return { items: next };
    });
  },

  toggleItem: (item) => {
    set((state) => {
      const exists = state.items.some((i) => i.id === item.id);
      const next = exists
        ? state.items.filter((i) => i.id !== item.id)
        : [item, ...state.items];
      saveItems(next);
      return { items: next };
    });
  },

  isInWishlist: (id) => {
    return get().items.some((i) => i.id === id);
  },

  clearWishlist: () => {
    saveItems([]);
    set({ items: [] });
  },
}));
