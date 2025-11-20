"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Fish } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

interface Product {
  _id: string;
  title: string;
  price: number;
  images: string[];
  createdAt: string;
  status: string;
}

interface ProfHistoryProps {
  onCountChange?: (count: number) => void;
}

export default function ProfHistory({ onCountChange }: ProfHistoryProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const sellerId = `user-${user.uid}`;
        // 出品履歴は販売済み(sold)と予約済み(reserved)を含む
        const response = await fetch(`/api/products?sellerId=${sellerId}`);

        if (!response.ok) {
          throw new Error("商品の取得に失敗しました");
        }

        const data = await response.json();
        // 出品中(available)以外をフィルタリング
        const historyProducts = (data.products || []).filter(
          (p: Product) => p.status !== 'available'
        );
        setProducts(historyProducts);

        // 親コンポーネントに商品数を通知
        if (onCountChange) {
          onCountChange(historyProducts.length);
        }
      } catch (error) {
        console.error("出品履歴の取得エラー:", error);
        setProducts([]);
        if (onCountChange) {
          onCountChange(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, onCountChange]);

  // 相対時間を計算する関数
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "今日";
    if (diffDays === 1) return "1日前";
    if (diffDays < 7) return `${diffDays}日前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
    return `${Math.floor(diffDays / 30)}ヶ月前`;
  };

  // ステータスのラベルを取得
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'sold': '販売済み',
      'reserved': '予約済み',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-6 text-center">
        <Fish size={64} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">出品履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div key={product._id} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition opacity-75 cursor-pointer">
          <div className="h-36 bg-gray-200 flex items-center justify-center overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Fish className="text-gray-400" />
            )}
          </div>
          <div className="p-3 text-sm">
            <p className="font-medium truncate">{product.title}</p>
            <p className="text-lg font-bold text-gray-500">¥{product.price.toLocaleString()}</p>
            <p className="text-xs text-gray-500">
              {getStatusLabel(product.status)}・{getRelativeTime(product.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
