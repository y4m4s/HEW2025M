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
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const cart = get().items;
        const findProduct = cart.find((p) => p.id === product.id);

        if (findProduct) {
          // すでにカートにある場合は何もしない（今回はシンプルにするため）
          return;
        }
        
        set({ items: [...cart, { ...product, quantity: 1 }] });
      },
      removeItem: (itemId) => set({ items: get().items.filter((item) => item.id !== itemId) }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage', // localStorageに保存する際のキー名
    }
  )
);