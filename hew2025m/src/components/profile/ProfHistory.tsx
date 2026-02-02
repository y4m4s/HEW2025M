"use client";

import { useState, useEffect } from "react";
import { decodeHtmlEntities } from '@/lib/sanitize';
import Image from "next/image";
import { Fish, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { Button, LoadingSpinner } from '@/components';


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
  userId?: string; // 表示対象のユーザーID（指定がない場合は自分）
}

export default function ProfHistory({ onCountChange, userId }: ProfHistoryProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

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
  }, [user, userId, onCountChange]);

  // 日付をフォーマットする関数（YYYY/MM/DD形式）
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <LoadingSpinner message="読み込み中..." size="sm" />
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

  // ページネーション計算
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = products.slice(startIndex, endIndex);

  // ページ番号配列を生成
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {paginatedProducts.map((product) => (
          <div
            key={product._id}
            className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition opacity-75 cursor-pointer"
            onClick={() => router.push(`/product-detail/${product._id}`)}
          >
            <div className="h-36 bg-gray-200 flex items-center justify-center overflow-hidden relative">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={decodeHtmlEntities(product.images[0])}
                  alt={product.title}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Fish className="text-gray-400" />
              )}
              {/* SOLDバッジ（メルカリ風デザイン） */}
              <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden">
                <div className="absolute top-4 -left-8 w-32 bg-red-600 text-white text-center text-xs font-bold py-1 transform -rotate-45 shadow-lg">
                  SOLD
                </div>
              </div>
            </div>
            <div className="p-3 text-sm">
              <p className="font-medium truncate">{product.title}</p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-lg font-bold text-gray-500">¥{product.price.toLocaleString()}</p>
                <span className="text-xs text-gray-500">{formatDate(product.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            variant="ghost"
            size="sm"
            className={currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}
            icon={<ChevronLeft size={16} />}
          >
            前へ
          </Button>

          <div className="flex gap-2">
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 flex items-center">...</span>
              ) : (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  variant={currentPage === page ? "primary" : "ghost"}
                  size="sm"
                  className={currentPage === page ? "w-8 h-8 p-0" : "w-8 h-8 p-0 bg-gray-100 hover:bg-gray-200"}
                >
                  {page}
                </Button>
              )
            ))}
          </div>

          <Button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            variant="ghost"
            size="sm"
            className={currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}
            icon={<ChevronRight size={16} />}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  );
}
