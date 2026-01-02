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
  shippingFee: number;
  totalAmount: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  setTotals: (shipping: number, total: number) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shippingFee: 0,
      totalAmount: 0,
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
      clearCart: () => set({ items: [], shippingFee: 0, totalAmount: 0 }),
      setTotals: (shipping, total) => set({ shippingFee: shipping, totalAmount: total }),
    }),
    {
      name: 'cart-storage', // localStorageに保存する際のキー名
    }
  )
);