"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Fish, Calendar } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Order } from "@/types/order";
import { LoadingSpinner } from '@/components';

interface ProfPurchasesProps {
  onCountChange?: (count: number) => void;
  userId?: string;
}

export default function ProfPurchases({ onCountChange, userId }: ProfPurchasesProps) {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPurchases = async () => {
      const targetUserId = userId || user?.uid;
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('buyerId', '==', targetUserId),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const purchasesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Order));

        setPurchases(purchasesList);
        if (onCountChange) {
          onCountChange(purchasesList.length);
        }
      } catch (error) {
        console.error("Error fetching purchases:", error);
        setPurchases([]);
        if (onCountChange) {
          onCountChange(0);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPurchases();
  }, [user, userId, onCountChange]);

  const getOrderStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': '処理中',
      'confirmed': '確認済み',
      'shipped': '発送済み',
      'delivered': '配達済み',
      'cancelled': 'キャンセル',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (timestamp: Date | { toDate: () => Date }): string => {
    if (!timestamp) return '';

    const date = 'toDate' in timestamp ? timestamp.toDate() : new Date(timestamp);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner message="読み込み中..." size="lg" />
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="p-6 text-center">
        <Fish size={64} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">購入履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {purchases.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          {/* ヘッダー部分 - 購入日と合計金額 */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <p className="text-sm text-gray-600">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">合計金額</p>
                <p className="text-xl font-bold text-[#2FA3E3]">
                  ¥{order.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 商品リスト */}
          <div className="divide-y">
            {order.items.map((item, index) => (
              <Link
                key={index}
                href={`/product-detail/${item.productId}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex gap-4">
                  {/* 商品画像 */}
                  <div className="w-32 h-32 flex-shrink-0 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Fish size={40} className="text-gray-400" />
                    )}
                  </div>

                  {/* 商品情報 */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1">
                        {item.productName}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                        <span>カテゴリ: {item.category}</span>
                        <span>•</span>
                        <span>状態: {item.condition}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>数量: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-end mt-3">
                      <span className="text-2xl font-bold text-gray-800">
                        ¥{item.price.toLocaleString()}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(order.orderStatus)}`}>
                        {getOrderStatusLabel(order.orderStatus)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
