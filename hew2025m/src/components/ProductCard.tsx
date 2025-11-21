import Link from 'next/link';
import Image from 'next/image';
import { Fish, MapPin } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  price: number;
  location: string;
  condition: string;
  postedDate: string;
  imageUrl?: string;
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

  if (variant === 'featured') {
    return (
      <Link href={`/productDetail/${product.id}`}>
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
          <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl text-gray-400">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} width={400} height={300} className="w-full h-full object-cover" />
            ) : (
              <Fish size={60} />
            )}
          </div>
          <div className="p-5">
            <h5 className="text-lg font-bold mb-3 text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              {product.name}
            </h5>
            <p className="text-xl font-bold text-[#2FA3E3] mb-3">
              {formatPrice(product.price)}
            </p>
            <p className="flex items-center gap-1 text-gray-600 text-sm">
              <MapPin size={16} />
              {product.location}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/productDetail/${product.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        <div className="h-48 bg-gray-200 flex items-center justify-center text-4xl text-gray-400">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} width={400} height={300} className="w-full h-full object-cover" />
          ) : (
              <div className="aspect-video bg-gray-200 rounded-lg flex flex-col items-center justify-center">
                <Fish size={64} className="text-gray-400 mb-3" />
                <p className="text-gray-500 text-sm">画像がありません</p>
              </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-xl font-bold text-[#2FA3E3] mb-2">
            {formatPrice(product.price)}
          </p>
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <MapPin size={16} /> <span>{product.location}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded-full ${getConditionColor(product.condition)}`}>
              {product.condition}
            </span>
            <span className="text-xs text-gray-500">
              {product.postedDate}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}