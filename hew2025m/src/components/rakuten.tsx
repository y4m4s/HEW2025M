'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

// 1. APIの形式用インターフェース (formatVersion=2)
interface RakutenItem {
  itemCode: string;
  itemName: string;
  itemUrl: string;
  itemPrice: number;
  shopName: string;
  mediumImageUrls?: { imageUrl: string }[] | string[];
  imageUrl?: string; // 代替画像URL
}

// 2. コンポーネントが受け取るpropsのインターフェース
interface RakutenProductsProps {
  keyword: string; // 例: "ロッド/竿"
}

export default function RakutenProducts({ keyword }: RakutenProductsProps) {
  // 3. このコンポーネントのローカルステート
  const [rakutenProducts, setRakutenProducts] = useState<RakutenItem[]>([]);
  const [rakutenLoading, setRakutenLoading] = useState(true);

  // 4. APIを呼び出すuseEffect
  useEffect(() => {
    // keywordが空でない場合のみ検索を実行
    if (!keyword) {
      setRakutenLoading(false);
      return;
    }

    const fetchRakutenProducts = async () => {
      setRakutenLoading(true);
      try {
        const response = await fetch(
          `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?applicationId=${process.env.NEXT_PUBLIC_RAKUTEN_APP_ID}&keyword=${encodeURIComponent(keyword)}&hits=6&formatVersion=2`
        );
        if (!response.ok) {
          throw new Error('Rakuten API fetch failed');
        }
        const data = await response.json();
        // formatVersion=2のAPIは、'Items'配列に直接商品を返します。
        setRakutenProducts(data.Items || []);
      } catch (err) {
        console.error('Rakuten API error:', err);
        setRakutenProducts([]);
      } finally {
        setRakutenLoading(false);
      }
    };

    fetchRakutenProducts();
  }, [keyword]); // 5. 依存配列: [keyword] - keywordが変更された場合に再度検索を実行

  // 6. コンポーネントのJSX（ビジュアル部分）
  return (
    <section className="mt-16 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-700 tracking-wide">
        Rakuten 関連商品ランキング 🛍️
      </h2>

      <div className="space-y-6">
        {rakutenLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : rakutenProducts.length > 0 ? (
          rakutenProducts.map((p, idx) => {
            // --- 画像の安全性チェック ---
            let imageUrl = 'https://placehold.co/80x80/e9ecef/6c757d?text=画像なし';

            if (p.mediumImageUrls && p.mediumImageUrls.length > 0) {
              const firstImage = p.mediumImageUrls[0];
              if (typeof firstImage === 'string') {
                // 文字列の場合
                imageUrl = firstImage.split('?')[0];
              } else if (firstImage && typeof firstImage === 'object' && 'imageUrl' in firstImage) {
                // オブジェクトの場合
                imageUrl = firstImage.imageUrl.replace('?_ex=128x128', '');
              }
            } else if (p.imageUrl) {
              // 代替のimageUrlフィールドがある場合
              imageUrl = p.imageUrl.split('?')[0];
            }

            return (
              <div
                key={p.itemCode}
                className="flex items-start gap-4 border-b pb-4 last:border-none"
              >
                <div className="text-2xl font-bold text-blue-600 w-8 text-center">
                  {idx + 1}.
                </div>
                <Image
                  src={imageUrl}
                  alt={p.itemName}
                  width={80}
                  height={80}
                  quality={90}
                  className="w-20 h-20 object-cover rounded border"
                />
                <div className="flex-1">
                  <a
                    href={p.itemUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 hover:underline text-sm"
                  >
                    {p.itemName}
                  </a>
                  <div className="text-sm text-gray-500 mt-1">
                    ショップ: {p.shopName}
                  </div>
                  <div className="text-lg font-bold text-gray-800 mt-1">
                    ¥{p.itemPrice.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500">
            関連する商品が見つかりませんでした。
          </p>
        )}
      </div>
    </section>
  );
}
