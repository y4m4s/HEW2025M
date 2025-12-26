"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Package, Loader2, MapPin, CreditCard } from "lucide-react";
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
        return 'text-green-600';
      case 'shipped':
        return 'text-blue-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2FA3E3] mx-auto" />
        <p className="text-gray-500 mt-2">読み込み中...</p>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="p-12 text-center">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">購入履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {purchases.map((order) => (
        <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
          {/* Header with order info */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500">Order ID: {order.id.slice(0, 12)}</p>
              <p className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString('ja-JP')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">¥{order.totalAmount.toLocaleString()}</p>
              <p className={`text-xs font-semibold mt-1 ${getStatusColor(order.orderStatus)}`}>
                {getOrderStatusLabel(order.orderStatus)}
              </p>
            </div>
          </div>

          {/* Items list */}
          <div className="space-y-3 mb-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex gap-3 bg-gray-50 p-3 rounded">
                {item.productImage && (
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.productName}</p>
                  <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                  <p className="text-sm font-bold text-[#2FA3E3]">
                    ¥{item.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer with payment and shipping info */}
          <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-gray-400" />
              <span className="text-gray-600">
                {getPaymentMethodLabel(order.paymentMethod)}
              </span>
            </div>
            {order.trackingNumber && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-gray-600 text-xs">#{order.trackingNumber}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}