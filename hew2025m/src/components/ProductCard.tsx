import Link from 'next/link';
import Image from 'next/image';
import { Fish, User } from 'lucide-react';

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
}

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'featured';
}

export default function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString()}`;
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case '新品・未使用':
      case '新品':
        return 'bg-blue-100 text-blue-800';
      case '目立った傷汚れなし':
      case '良好':
        return 'bg-green-100 text-green-800';
      case 'やや傷や汚れあり':
        return 'bg-yellow-100 text-yellow-800';
      case '傷や汚れあり':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'sold':
      case 'reserved':
        return '売り切れ';
      case 'available':
      default:
        return '販売中';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'sold':
      case 'reserved':
        return 'bg-red-500 text-white';
      case 'available':
      default:
        return 'bg-green-500 text-white';
    }
  };

  if (variant === 'featured') {
    return (
      <Link href={`/productDetail/${product.id}`}>
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
          <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl text-gray-400 relative">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} width={400} height={300} className="w-full h-full object-cover" />
            ) : (
              <Fish size={60} />
            )}
            {/* ステータスバッジ */}
            <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getStatusColor(product.status)}`}>
              {getStatusLabel(product.status)}
            </div>
          </div>
          <div className="p-5">
            <h5 className="text-lg font-bold mb-3 text-gray-800 line-clamp-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              {product.name}
            </h5>
            <p className="text-xl font-bold text-[#2FA3E3] mb-3 break-words">
              {formatPrice(product.price)}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {product.sellerPhotoURL ? (
                  <Image src={product.sellerPhotoURL} alt={product.location} width={24} height={24} className="w-full h-full object-cover" />
                ) : (
                  <User size={12} className="text-gray-600" />
                )}
              </div>
              <span className="text-gray-600 text-sm truncate">{product.location}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/productDetail/${product.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        <div className="h-48 bg-gray-200 flex items-center justify-center text-4xl text-gray-400 relative">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} width={400} height={300} className="w-full h-full object-cover" />
          ) : (
              <div className="aspect-video bg-gray-200 rounded-lg flex flex-col items-center justify-center">
                <Fish size={64} className="text-gray-400 mb-3" />
                <p className="text-gray-500 text-sm">画像がありません</p>
              </div>
          )}
          {/* ステータスバッジ */}
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold shadow-lg ${getStatusColor(product.status)}`}>
            {getStatusLabel(product.status)}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-xl font-bold text-[#2FA3E3] mb-2 break-words">
            {formatPrice(product.price)}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              {product.sellerPhotoURL ? (
                <Image src={product.sellerPhotoURL} alt={product.location} width={20} height={20} className="w-full h-full object-cover" />
              ) : (
                <User size={10} className="text-gray-600" />
              )}
            </div>
            <span className="truncate">{product.location}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getConditionColor(product.condition)}`}>
              {product.condition}
            </span>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {product.postedDate}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}