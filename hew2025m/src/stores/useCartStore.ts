import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  ownerUid: string | null;
  items: CartItem[];
  shippingFee: number;
  totalAmount: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  syncCartOwner: (uid: string | null) => void;
  setTotals: (shipping: number, total: number) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ownerUid: null,
      items: [],
      shippingFee: 0,
      totalAmount: 0,
      addItem: (product) => {
        const cart = get().items;
        const findProduct = cart.find((p) => p.id === product.id);

        if (findProduct) {
          // すでにカートにある場合は何もしない
          return;
        }

        set({ items: [...cart, { ...product, quantity: 1 }] });
      },
      removeItem: (itemId) => set({ items: get().items.filter((item) => item.id !== itemId) }),
      clearCart: () => set({ items: [], shippingFee: 0, totalAmount: 0 }),
      syncCartOwner: (uid) => {
        const currentOwner = get().ownerUid;
        if (currentOwner === uid) return;

        // Clear cart when auth user changes to avoid cross-account leakage.
        set({
          ownerUid: uid,
          items: [],
          shippingFee: 0,
          totalAmount: 0,
        });
      },
      setTotals: (shipping, total) => set({ shippingFee: shipping, totalAmount: total }),
    }),
    {
      name: 'cart-storage',
      version: 2,
      partialize: (state) => ({
        ownerUid: state.ownerUid,
        items: state.items,
        shippingFee: state.shippingFee,
        totalAmount: state.totalAmount,
      }),
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          const oldState = persistedState as Partial<CartState>;
          return {
            ownerUid: null,
            items: oldState.items || [],
            shippingFee: oldState.shippingFee || 0,
            totalAmount: oldState.totalAmount || 0,
          } as CartState;
        }
        if (version === 1) {
          const oldState = persistedState as Partial<CartState>;
          return {
            ownerUid: oldState.ownerUid || null,
            items: oldState.items || [],
            shippingFee: oldState.shippingFee || 0,
            totalAmount: oldState.totalAmount || 0,
          } as CartState;
        }
        return persistedState as CartState;
      },
    }
  )
);
