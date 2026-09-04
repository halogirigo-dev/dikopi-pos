import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  product_id: string;
  product_name: string;
  selling_price: number;
  cost_price: number;
  quantity: number;
  image_url?: string | null;
};

type CartStore = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  updateQty: (product_id: string, qty: number) => void;
  remove: (product_id: string) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) => {
        const existing = get().items.find((i) => i.product_id === item.product_id);
        if (existing) {
          set({ items: get().items.map((i) => i.product_id === item.product_id ? { ...i, quantity: i.quantity + qty } : i) });
        } else {
          set({ items: [...get().items, { ...item, quantity: qty }] });
        }
      },
      updateQty: (id, qty) => {
        if (qty <= 0) return set({ items: get().items.filter(i => i.product_id !== id) });
        set({ items: get().items.map(i => i.product_id === id ? { ...i, quantity: qty } : i) });
      },
      remove: (id) => set({ items: get().items.filter(i => i.product_id !== id) }),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.selling_price * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    {
      name: "dikopi-cart",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : undefined as any)),
      // Only persist items - no sensitive data, no auth tokens
      partialize: (state) => ({ items: state.items }),
      version: 1,
      skipHydration: false,
    }
  )
);
