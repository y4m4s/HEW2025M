import Link from 'next/link';
import Image from 'next/image';
import { Fish, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Product {
  id: string;
  name: string;
  price: number;
  location: string;
  condition: string;
  postedDate: string;
  imageUrl?: string;
  status?: 'available' | 'sold' | 'reserved';
  sellerPhotoURL?: string;
  sellerId?: string;
}

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'featured';
}

export default function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const [sellerName, setSellerName] = useState(product.location);
  const [sellerPhoto, setSellerPhoto] = useState(product.sellerPhotoURL);

  useEffect(() => {
    const fetchSellerInfo = async () => {
      if (!product.sellerId) return;

      // sellerIdが 'user-XXX' 形式の場合、'XXX'部分のみを抽出
      const userId = product.sellerId.startsWith('user-')
        ? product.sellerId.replace('user-', '')
        : product.sellerId;

      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setSellerName(data.displayName || data.username || '出品者');
          setSellerPhoto(data.photoURL || null);
        }
      } catch (error) {
        console.error('Failed to fetch seller info', error);
      }
    };

    fetchSellerInfo();
  }, [product.sellerId]);

  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString()}`;
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'sold':
      case 'reserved':
        return 'SOLD';
      case 'available':
      default:
        return null; // 販売中は表示しない
    }
  };

  if (variant === 'featured') {
    return (
      <Link href={`/product-detail/${product.id}`}>
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
          <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl text-gray-400 relative overflow-hidden">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} width={400} height={300} className="w-full h-full object-cover" />
            ) : (
              <Fish size={60} />
            )}
            {/* SOLDバッジ（メルカリ風デザイン） */}
            {getStatusLabel(product.status) && (
              <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden">
                <div className="absolute top-4 -left-8 w-32 bg-red-600 text-white text-center text-xs font-bold py-1 transform -rotate-45 shadow-lg">
                  SOLD
                </div>
              </div>
            )}
          </div>
          <div className="p-5">
            <div className="h-14 mb-3">
              <h5 className="text-lg font-bold text-gray-800 line-clamp-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                {product.name}
              </h5>
            </div>
            <p className="text-xl font-bold text-[#2FA3E3] mb-3 break-words">
              {formatPrice(product.price)}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {sellerPhoto ? (
                  <Image src={sellerPhoto} alt={sellerName} width={24} height={24} quality={90} className="w-full h-full object-cover" />
                ) : (
                  <User size={12} className="text-gray-600" />
                )}
              </div>
              <span className="text-gray-600 text-sm truncate">{sellerName}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/product-detail/${product.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        <div className="h-48 bg-gray-200 flex items-center justify-center text-4xl text-gray-400 relative overflow-hidden">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} width={400} height={300} className="w-full h-full object-cover" />
          ) : (
            <div className="aspect-video bg-gray-200 rounded-lg flex flex-col items-center justify-center">
              <Fish size={64} className="text-gray-400 mb-3" />
              <p className="text-gray-500 text-sm">画像がありません</p>
            </div>
          )}
          {/* SOLDバッジ（メルカリ風デザイン） */}
          {getStatusLabel(product.status) && (
            <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden">
              <div className="absolute top-4 -left-8 w-32 bg-red-600 text-white text-center text-xs font-bold py-1 transform -rotate-45 shadow-lg">
                SOLD
              </div>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="h-12 mb-2">
            <h3 className="font-semibold text-gray-800 line-clamp-2">
              {product.name}
            </h3>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xl font-bold text-[#2FA3E3] break-words">
              {formatPrice(product.price)}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {sellerPhoto ? (
                  <Image src={sellerPhoto} alt={sellerName} width={20} height={20} quality={90} className="w-full h-full object-cover" />
                ) : (
                  <User size={10} className="text-gray-600" />
                )}
              </div>
              <span className="truncate">{sellerName}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}