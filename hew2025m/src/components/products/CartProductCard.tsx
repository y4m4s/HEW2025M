import Link from 'next/link';
import Image from 'next/image';
import { Fish, User } from 'lucide-react';
import { IMAGE_QUALITY, BLUR_DATA_URLS } from '@/lib/imageOptimization';
import { decodeHtmlEntities } from '@/lib/sanitize';

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  sellerName: string;
  sellerPhotoURL?: string;
  imageUrl?: string;
  category?: string;
  condition?: string;
  shippingDays?: string;
  description?: string;
  createdAt?: string;
}

interface CartProductCardProps {
  product: CartProduct;
}

export default function CartProductCard({ product }: CartProductCardProps) {
  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString()}`;
  };

  const formatCategory = (category?: string): string => {
    const categoryMap: Record<string, string> = {
      'rod': 'ロッド/竿',
      'reel': 'リール',
      'lure': 'ルアー',
      'line': 'ライン/糸',
      'hook': 'ハリ/針',
      'bait': '餌',
      'wear': 'ウェア',
      'set': 'セット用品',
      'service': 'サービス',
      'other': 'その他'
    };
    return category ? categoryMap[category] || category : '';
  };

  const formatCondition = (condition?: string): string => {
    const conditionMap: Record<string, string> = {
      'new': '新品・未使用',
      'like-new': '未使用に近い',
      'good': '目立った傷汚れなし',
      'fair': 'やや傷や汚れあり',
      'poor': '傷や汚れあり'
    };
    return condition ? conditionMap[condition] || condition : '';
  };

  const formatShippingDays = (days?: string): string => {
    const daysMap: Record<string, string> = {
      '1-2': '1〜2日で発送',
      '2-3': '2〜3日で発送',
      '4-7': '4〜7日で発送'
    };
    return days ? daysMap[days] || days : '';
  };

  const getConditionColor = (condition?: string): string => {
    switch (condition) {
      case 'new':
      case 'like-new':
        return 'bg-blue-100 text-blue-800';
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今日';
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  };

  return (
    <Link href={`/product-detail/${product.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer">
        <div className="flex">
          {/* 商品画像 */}
          <div className="w-28 h-28 sm:w-40 sm:h-40 flex-shrink-0 bg-gray-200 flex items-center justify-center">
            {product.imageUrl ? (
              <Image
                src={decodeHtmlEntities(product.imageUrl)}
                alt={product.name}
                width={160}
                height={160}
                sizes="(max-width: 640px) 112px, 160px"
                quality={IMAGE_QUALITY.STANDARD}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URLS.product}
                className="w-full h-full object-cover"
              />
            ) : (
              <Fish size={48} className="text-gray-400" />
            )}
          </div>

          {/* 商品情報 */}
          <div className="flex-1 p-4 flex flex-col min-w-0">
            {/* 商品名 */}
            <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
              {product.name}
            </h3>

            {/* カテゴリ、状態、発送日数を横並びで固定幅表示 */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {product.category && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full whitespace-nowrap flex-shrink-0">
                  {formatCategory(product.category)}
                </span>
              )}
              {product.condition && (
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${getConditionColor(product.condition)}`}>
                  {formatCondition(product.condition)}
                </span>
              )}
              {product.shippingDays && (
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full whitespace-nowrap flex-shrink-0">
                  {formatShippingDays(product.shippingDays)}
                </span>
              )}
            </div>

            {/* 説明文：2行分の高さを確保し、末尾を「……」で省略 */}
            <div className="mb-2 overflow-hidden">
              {product.description && (
                <p className="text-xs text-gray-600 line-clamp-2 break-words">
                  {product.description}
                </p>
              )}
            </div>

            {/* 下部: 出品者情報、出品日、価格 */}
            <div className="flex items-center justify-between gap-4 mt-auto">
              {/* 左側: 出品者情報と出品日 */}
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.sellerPhotoURL ? (
                      <Image
                        src={decodeHtmlEntities(product.sellerPhotoURL)}
                        alt={product.sellerName}
                        width={24}
                        height={24}
                        sizes="24px"
                        quality={IMAGE_QUALITY.HIGH}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={12} className="text-gray-600" />
                    )}
                  </div>
                  <span className="text-sm text-gray-600 truncate">{product.sellerName}</span>
                </div>
                {product.createdAt && (
                  <span className="text-xs text-gray-500 ml-8">
                    {formatDate(product.createdAt)}
                  </span>
                )}
              </div>

              {/* 右側: 価格 */}
              <div className="flex-shrink-0">
                <p className="text-xl font-bold text-[#2FA3E3]">
                  {formatPrice(product.price)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
