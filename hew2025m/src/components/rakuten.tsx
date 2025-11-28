'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

// 楽天APIの型定義 (formatVersion=2)
interface RakutenItem {
  itemCode: string;
  itemName: string;
  itemUrl: string;
  itemPrice: number;
  shopName: string;
  mediumImageUrls?: string[]; // v2では文字列の配列になります
  reviewAverage?: number;
  reviewCount?: number;
  postageFlag?: number; // 0 = 送料無料
}

interface RakutenProductsProps {
  keyword: string;
}

export default function RakutenProducts({ keyword }: RakutenProductsProps) {
  const [products, setProducts] = useState<RakutenItem[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 🔍 デバッグ用: 実際に楽天APIに渡されるキーワードをコンソールに表示
    console.log("--------------------------------------------------");
    console.log("🛒 Rakuten Component Received Keyword:", keyword);
    console.log("--------------------------------------------------");

    if (!keyword) return;

    const fetchRakutenData = async () => {
      setLoading(true);
      const appId = process.env.NEXT_PUBLIC_RAKUTEN_APP_ID;
      
      // 楽天APIへのリクエストパラメータ
      const params = new URLSearchParams({
        applicationId: appId || '',
        keyword: keyword,
        hits: '12', // 取得するアイテム数
        formatVersion: '2',
        sort: 'standard', // 標準の並び順（関連度順）
      });

      try {
        const res = await fetch(`https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?${params.toString()}`);
        const data = await res.json();
        
        // 🔍 デバッグ用: 取得できた商品数を表示
        console.log(`📊 Rakuten Search Results: ${data.Items?.length || 0} items found for "${keyword}"`);
        
        setProducts(data.Items || []);
      } catch (error) {
        console.error("楽天データの取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRakutenData();
  }, [keyword]);

  // カルーセルをスクロールする関数
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!loading && products.length === 0) return null;

  // レビュー評価（星）を表示する関数
  const renderStars = (avg: number = 0, count: number = 0) => {
    if (!count) return <div className="h-4"></div>;
    return (
      <div className="flex items-center gap-1 mt-1">
        <div className="flex text-[#FFCC00]">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={12} 
              fill={i < Math.round(avg) ? "currentColor" : "#e0e0e0"} 
              strokeWidth={0} 
            />
          ))}
        </div>
        <span className="text-[10px] text-[#0066cc] underline">({count})</span>
      </div>
    );
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-100 bg-white rounded-xl shadow-sm p-4">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCart size={20} className="text-blue-500" />
          関連商品の相場をチェック
          <span className="text-[10px] text-gray-400 font-normal border border-gray-300 rounded px-1 ml-1">R</span>
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-[#bf0000] rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="relative group">
          
          {/* 左スクロールボタン */}
          <button 
            onClick={() => scroll('left')}
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 shadow-md rounded-full w-9 h-9 flex items-center justify-center text-gray-600 hover:text-[#bf0000] transition-opacity opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>

          {/* カルーセルコンテナ */}
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((item) => {
              // 画像URLの処理
              let imgUrl = 'https://placehold.co/150?text=No+Image';
              if (item.mediumImageUrls && item.mediumImageUrls.length > 0) {
                const rawUrl = item.mediumImageUrls[0];
                if (typeof rawUrl === 'string') {
                  imgUrl = rawUrl.split('?')[0];
                } 
              }

              return (
                <a 
                  key={item.itemCode}
                  href={item.itemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-[140px] w-[140px] md:min-w-[160px] md:w-[160px] flex flex-col group/card transition-transform hover:-translate-y-1"
                >
                  {/* 画像 */}
                  <div className="w-full aspect-square mb-2 border border-gray-100 rounded-md overflow-hidden bg-white">
                    <img 
                      src={imgUrl} 
                      alt={item.itemName} 
                      className="w-full h-full object-contain p-1"
                      loading="lazy"
                    />
                  </div>

                  {/* 商品詳細 */}
                  <div className="flex flex-col px-1">
                    {/* 商品名（2行制限） */}
                    <h4 className="text-[11px] text-gray-700 leading-tight line-clamp-2 h-[2.5em] mb-1 group-hover/card:text-[#bf0000] group-hover/card:underline">
                      {item.itemName}
                    </h4>

                    {/* 価格と送料 */}
                    <div className="mt-1">
                      <span className="text-sm font-bold text-[#bf0000] block">
                        {item.itemPrice.toLocaleString()}円
                      </span>
                      
                      {item.postageFlag === 0 && (
                        <span className="inline-block text-[9px] bg-white border border-[#bf0000] text-[#bf0000] px-1 rounded mt-1">
                          送料無料
                        </span>
                      )}
                    </div>

                    {/* 評価 */}
                    {renderStars(item.reviewAverage, item.reviewCount)}
                  </div>
                </a>
              );
            })}
          </div>

          {/* 右スクロールボタン */}
          <button 
            onClick={() => scroll('right')}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 shadow-md rounded-full w-9 h-9 flex items-center justify-center text-gray-600 hover:text-[#bf0000] transition-opacity opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}