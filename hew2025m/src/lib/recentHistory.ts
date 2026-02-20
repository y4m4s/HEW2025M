// src/lib/recentHistory.ts

export interface RecentlyViewedProduct {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
}

const HISTORY_KEY = 'recentlyViewed';
const MAX_HISTORY_LENGTH = 10;

// Navegador-safe localStorage access
const getLocalStorage = (): RecentlyViewedProduct[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const item = window.localStorage.getItem(HISTORY_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error('Error reading from localStorage', error);
    return [];
  }
};

const setLocalStorage = (products: RecentlyViewedProduct[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Error writing to localStorage', error);
  }
};

/**
 * Recupera o histórico de produtos vistos recentemente.
 * @returns {RecentlyViewedProduct[]} Uma lista de produtos.
 */
export const getHistory = (): RecentlyViewedProduct[] => {
  return getLocalStorage();
};

/**
 * Adiciona um produto ao histórico de vistos recentemente.
 * Move o produto para o topo se já existir.
 * Limita o histórico aos últimos 10 itens.
 * @param {RecentlyViewedProduct} product - O produto a ser adicionado.
 */
export const addToHistory = (product: RecentlyViewedProduct) => {
  if (!product || !product.id) return;

  const history = getLocalStorage();
  
  // Remove o produto se ele já existir para movê-lo para o topo
  const filteredHistory = history.filter(p => p.id !== product.id);
  
  // Adiciona o novo produto no início da lista
  const newHistory = [product, ...filteredHistory];
  
  // Limita a lista ao número máximo de itens
  const finalHistory = newHistory.slice(0, MAX_HISTORY_LENGTH);
  
  setLocalStorage(finalHistory);
};
