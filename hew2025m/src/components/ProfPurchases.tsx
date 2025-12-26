"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Loader2, MapPin, CreditCard, Fish, Calendar } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Order } from "@/types/order";

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

  const getPaymentMethodLabel = (method: string): string => {
    const methodMap: Record<string, string> = {
      'card': 'クレジットカード',
      'paypay': 'PayPay',
      'applepay': 'Apple Pay',
      'rakuten': '楽天ペイ',
      'au': 'AU Pay',
    };
    return methodMap[method] || method;
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
        month: 'long',
        day: 'numeric'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-12 w-12 animate-spin text-[#2FA3E3]" />
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="p-6 text-center">
        <Package size={64} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">購入履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {purchases.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300"
        >
          {/* ヘッダー部分 */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <p className="text-sm text-gray-600">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(order.orderStatus)}`}>
                  {getOrderStatusLabel(order.orderStatus)}
                </span>
                <p className="text-xs text-gray-500">注文ID: {order.id.slice(0, 12)}...</p>
              </div>
            </div>
          </div>

          {/* 商品リスト */}
          <div className="p-6">
            <div className="space-y-4 mb-4">
              {order.items.map((item, index) => (
                <Link
                  key={index}
                  href={`/product-detail/${item.productId}`}
                  className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* 商品画像 */}
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Fish size={32} className="text-gray-400" />
                    )}
                  </div>

                  {/* 商品情報 */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-600">数量: {item.quantity}</p>
                    </div>
                    <p className="text-lg font-bold text-[#2FA3E3]">
                      ¥{item.price.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* 区切り線 */}
            <div className="border-t my-4"></div>

            {/* 支払い情報と配送情報 */}
            <div className="space-y-3">
              {/* 支払い方法 */}
              <div className="flex items-center gap-2 text-sm">
                <CreditCard size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">
                  {getPaymentMethodLabel(order.paymentMethod)}
                </span>
              </div>

              {/* 追跡番号 */}
              {order.trackingNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">
                    追跡番号: {order.trackingNumber}
                  </span>
                </div>
              )}

              {/* 配送先住所 */}
              {order.shippingAddress && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="text-gray-600">
                    <p>〒{order.shippingAddress.zipCode}</p>
                    <p>
                      {order.shippingAddress.prefecture}
                      {order.shippingAddress.city}
                      {order.shippingAddress.street}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 区切り線 */}
            <div className="border-t my-4"></div>

            {/* 合計金額 */}
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">合計金額</span>
              <span className="text-2xl font-bold text-[#2FA3E3]">
                ¥{order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
