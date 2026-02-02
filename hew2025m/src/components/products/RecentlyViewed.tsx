// src/components/RecentlyViewed.tsx
'use client';

import { useEffect, useState } from 'react';
import { decodeHtmlEntities } from '@/lib/sanitize';
import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { getHistory, RecentlyViewedProduct } from '@/lib/recentHistory';

const RecentlyViewed = () => {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);

  useEffect(() => {
    // Busca o histórico do localStorage quando o componente é montado no cliente.
    setProducts(getHistory());
  }, []);

  if (products.length === 0) {
    // Não renderiza nada se não houver produtos no histórico
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800/20 rounded-lg p-4 md:p-6 w-full max-w-7xl mx-auto mt-6">
      <h2 className="flex items-center text-xl font-bold text-gray-800 dark:text-white mb-4">
        <Clock className="w-6 h-6 mr-3 text-gray-500 dark:text-gray-400" />
        Vistos Recentemente
      </h2>
      <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {products.map((product) => (
          <Link href={`/product-detail/${product.id}`} key={product.id}>
            <div className="flex-shrink-0 w-36 md:w-40 group">
              <div className="relative w-full h-36 md:h-40 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden transition-transform duration-300 ease-in-out group-hover:scale-105">
                <Image
                  src={decodeHtmlEntities(product.imageUrl)}
                  alt={product.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition-opacity duration-300 group-hover:opacity-90"
                />
              </div>
              <div className="mt-2">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-500">
                  {product.title}
                </h3>
                <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(product.price)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;
