"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Fish, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

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
              <div className="flex items-center justify-between mt-1">
                <p className="text-lg font-bold text-[#2FA3E3]">¥{product.price.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{formatDate(product.createdAt)}</p>
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
