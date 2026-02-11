'use client';

import { Fish } from 'lucide-react';
import { ProductCard } from '@/components';

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  condition?: string;
  sellerName?: string;
  sellerPhotoURL?: string;
  status?: 'available' | 'sold' | 'reserved';
}

interface RelatedProductsProps {
  products: RelatedProduct[];
  loading: boolean;
  title?: string;
}

export function RelatedProducts({
  products,
  loading,
  title = '同じカテゴリの商品'
}: RelatedProductsProps) {
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 md:mt-12">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
        <Fish size={24} className="text-[#2FA3E3]" />
        {title}
      </h2>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                condition: product.condition || '状態不明',
                location: product.sellerName || '',
                postedDate: '',
                status: product.status,
                sellerPhotoURL: product.sellerPhotoURL,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
