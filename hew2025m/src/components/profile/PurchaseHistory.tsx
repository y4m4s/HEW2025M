'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/useAuth';
import { Calendar, CreditCard, Fish } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
  sellerPhotoURL?: string;
  category: string;
  condition: string;
}

interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  items: OrderItem[];
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  shippingAddress?: {
    zipCode: string;
    prefecture: string;
    city: string;
    street: string;
  };
  trackingNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface PurchaseHistoryProps {
  onCountChange?: (count: number) => void;
}

export default function PurchaseHistory({ onCountChange }: PurchaseHistoryProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        // Firestoreから購入履歴を取得 (buyerIdが現在のユーザーIDと一致するもの)
        const q = query(
          collection(db, 'orders'),
          where('buyerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];

        setOrders(ordersData);

        // 親コンポーネントに件数を通知
        if (onCountChange) {
          onCountChange(ordersData.length);
        }
      } catch (error) {
        console.error('購入履歴の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, onCountChange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-6 text-center">
        <Fish size={64} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">購入履歴はありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* ヘッダー部分: 日付と合計金額 */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={14} />
                <span>
                  {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('ja-JP') : '日付不明'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-500">
                  合計: <span className="text-gray-900 text-base">¥{order.totalAmount.toLocaleString()}</span>
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${order.orderStatus === 'confirmed' || order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                  {order.orderStatus === 'confirmed' ? '確認済み' :
                    order.orderStatus === 'shipped' ? '発送済み' :
                      order.orderStatus === 'delivered' ? '配達完了' :
                        order.orderStatus === 'cancelled' ? 'キャンセル' :
                          order.orderStatus}
                </span>
              </div>
            </div>

            {/* 商品リスト */}
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => router.push(`/product-detail/${item.productId}`)}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  >
                    <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={300}
                          height={160}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <Fish size={48} className="text-gray-400 mb-2" />
                          <p className="text-gray-500 text-sm">画像なし</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 h-10">
                        {item.productName}
                      </p>
                      <p className="text-lg font-bold text-[#2FA3E3]">
                        ¥{item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* フッター: 支払い方法 */}
              <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-600">
                <CreditCard size={16} />
                <span>支払い方法: {getPaymentMethodName(order.paymentMethod)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 支払い方法の表示名を変換するヘルパー関数
function getPaymentMethodName(method: string) {
  switch (method) {
    case 'card': return 'クレジットカード';
    case 'paypay': return 'PayPay';
    case 'apple_pay': return 'Apple Pay';
    case 'google_pay': return 'Google Pay';
    default: return method || 'その他';
  }
}
