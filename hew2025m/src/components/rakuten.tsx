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
  mediumImageUrls: { imageUrl: string }[];
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
        // 配列の各要素がすでに商品オブジェクトです。
        // 'item.Item'にマッピングする必要はありません。
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
          <p className="text-center text-gray-500">関連商品を検索中...</p>
        ) : rakutenProducts.length > 0 ? (
          rakutenProducts.map((p, idx) => {

            // --- 画像の安全性チェック ---
            const imageUrl = (p.mediumImageUrls && p.mediumImageUrls.length > 0 && p.mediumImageUrls[0])
              ? p.mediumImageUrls[0].imageUrl.replace('?_ex=128x128', '') // すべて存在する場合は楽天の画像を使用
              : 'https://placehold.co/80x80/e9ecef/6c757d?text=画像なし'; // 安全なプレースホルダーを使用

            return (
              <div
                key={p.itemCode}
                className="flex items-start gap-4 border-b pb-4 last:border-none"
              >
                <div className="text-2xl font-bold text-blue-600 w-8 text-center">
                  {idx + 1}.
                </div>
                <Image
                  src={imageUrl} // 安全な変数を使用
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