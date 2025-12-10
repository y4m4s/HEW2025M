"use client";

import { useState, useEffect } from "react";
import { Fish } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import ProductCard, { Product } from "./ProductCard";

interface Bookmark {
  id: string;
  productId: string;
  title: string;
  price: number;
  image: string;
  createdAt: string;
}

interface ProfBookmarkProps {
  onCountChange?: (count: number) => void;
}

export default function ProfBookmark({ onCountChange }: ProfBookmarkProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const bookmarksRef = collection(db, 'users', user.uid, 'bookmarks');
        const bookmarksSnap = await getDocs(bookmarksRef);

        const bookmarkList: Bookmark[] = [];
        bookmarksSnap.forEach((doc) => {
          bookmarkList.push({
            id: doc.id,
            ...doc.data() as Omit<Bookmark, 'id'>
          });
        });

        // 作成日時の降順でソート
        bookmarkList.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // 各ブックマークの商品詳細を取得
        const productDetails = await Promise.all(
          bookmarkList.map(async (bookmark) => {
            try {
              const response = await fetch(`/api/products/${bookmark.productId}`);
              if (!response.ok) return null;

              const data = await response.json();
              const product = data.product;

              // ProductCard用のフォーマットに変換
              return {
                id: product._id,
                name: product.title,
                price: product.price,
                location: product.location || '場所未設定',
                condition: product.condition || '状態不明',
                postedDate: new Date(product.createdAt).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                }),
                imageUrl: product.images?.[0] || bookmark.image,
                status: product.status || 'available',
                sellerPhotoURL: product.sellerPhotoURL,
              } as Product;
            } catch (error) {
              console.error(`商品 ${bookmark.productId} の取得エラー:`, error);
              return null;
            }
          })
        );

        // 削除された商品を除外
        const validProducts = productDetails.filter((p): p is Product => p !== null);
        setProducts(validProducts);

        // 親コンポーネントにブックマーク数を通知
        if (onCountChange) {
          onCountChange(validProducts.length);
        }
      } catch (error) {
        console.error("ブックマーク取得エラー:", error);
        setProducts([]);
        if (onCountChange) {
          onCountChange(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user, onCountChange]);

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
        <p className="text-gray-500">ブックマークした商品がありません</p>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
