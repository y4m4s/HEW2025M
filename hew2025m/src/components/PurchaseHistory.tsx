/// <reference types="react" />
'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/useAuth';
import { Package, Calendar, CreditCard, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: Timestamp;
}

interface PurchaseHistoryProps {
  onCountChange?: (count: number) => void;
}

export default function PurchaseHistory({ onCountChange }: PurchaseHistoryProps) {
  const { user } = useAuth();
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
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
        <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">購入履歴はありません</p>
        <Link href="/" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
          買い物をはじめる
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Package className="text-blue-500" />
        購入履歴
      </h2>
      
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
                <span className={`text-xs px-2 py-1 rounded-full ${
                  order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.status === 'completed' ? '完了' : order.status}
                </span>
              </div>
            </div>

            {/* 商品リスト */}
            <div className="p-4">
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded bg-gray-100" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">数量: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ¥{item.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* フッター: 支払い方法など */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CreditCard size={14} />
                  <span>支払い: {getPaymentMethodName(order.paymentMethod)}</span>
                </div>
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
