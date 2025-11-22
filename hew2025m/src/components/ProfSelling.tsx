"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Fish } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

interface Product {
  _id: string;
  title: string;
  price: number;
  images: string[];
  createdAt: string;
  status: string;
}

interface ProfSellingProps {
  onCountChange?: (count: number) => void;
  userId?: string; // 表示対象のユーザーID（指定がない場合は自分）
}

export default function ProfSelling({ onCountChange, userId }: ProfSellingProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      // 表示対象のユーザーIDを決定（指定があればそれを使用、なければ自分のID）
      const targetUserId = userId || user?.uid;

      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        const sellerId = `user-${targetUserId}`;
        const response = await fetch(`/api/products?sellerId=${sellerId}&status=available`);

        if (!response.ok) {
          throw new Error("商品の取得に失敗しました");
        }

        const data = await response.json();
        setProducts(data.products || []);

        // 親コンポーネントに商品数を通知
        if (onCountChange) {
          onCountChange(data.products?.length || 0);
        }
      } catch (error) {
        console.error("出品商品の取得エラー:", error);
        setProducts([]);
        if (onCountChange) {
          onCountChange(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, userId, onCountChange]);

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
        <p className="text-gray-500">出品中の商品がありません</p>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div
          key={product._id}
          className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
          onClick={() => router.push(`/productDetail/${product._id}`)}
        >
          <div className="h-36 bg-gray-200 flex items-center justify-center overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt={product.title}
                width={400}
                height={300}
                className="w-full h-full object-cover"
              />
            ) : (
              <Fish className="text-gray-400" />
            )}
          </div>
          <div className="p-3 text-sm">
            <p className="font-medium truncate">{product.title}</p>
            <p className="text-lg font-bold text-[#2FA3E3]">¥{product.price.toLocaleString()}</p>
            <p className="text-xs text-gray-500">出品中・{getRelativeTime(product.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
