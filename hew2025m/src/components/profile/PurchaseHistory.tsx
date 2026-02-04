'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
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

// 表示用に拡張された注文アイテム型
interface EnrichedOrderItem extends OrderItem {
  // Firestoreから動的に取得したデータ
  fetchedSellerName?: string;
  fetchedSellerPhotoURL?: string;
  fetchedProductImage?: string;
}

interface PurchaseHistoryProps {
  onCountChange?: (count: number) => void;
}

export default function PurchaseHistory({ onCountChange }: PurchaseHistoryProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [enrichedItems, setEnrichedItems] = useState<Map<string, EnrichedOrderItem>>(new Map());
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
        const ordersData = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as Order[];

        setOrders(ordersData);

        // 親コンポーネントに件数を通知
        if (onCountChange) {
          onCountChange(ordersData.length);
        }

        // 各注文アイテムの詳細情報を取得（出品者情報と商品画像）
        const itemsMap = new Map<string, EnrichedOrderItem>();

        await Promise.all(
          ordersData.flatMap(order =>
            order.items.map(async (item) => {
              const itemKey = `${order.id}-${item.productId}`;

              // 既にデータがある場合はスキップ（旧データ）
              if (item.sellerPhotoURL || item.productImage || item.sellerName) {
                return;
              }

              try {
                // 出品者情報を取得
                let sellerName = '';
                let sellerPhotoURL = '';

                if (item.sellerId) {
                  const firebaseUserId = item.sellerId.startsWith('user-')
                    ? item.sellerId.replace('user-', '')
                    : item.sellerId;

                  const sellerDoc = await getDoc(doc(db, 'users', firebaseUserId));
                  if (sellerDoc.exists()) {
                    const sellerData = sellerDoc.data();
                    sellerName = sellerData?.displayName || '';
                    sellerPhotoURL = sellerData?.photoURL || '';
                  }
                }

                // 商品画像を取得（MongoDBから）
                let productImage = '';
                try {
                  const productResponse = await fetch(`/api/products/${item.productId}`);
                  if (productResponse.ok) {
                    const productData = await productResponse.json();
                    productImage = productData.product?.images?.[0] || '';
                  }
                } catch (error) {
                  console.error(`商品画像取得エラー (${item.productId}):`, error);
                }

                itemsMap.set(itemKey, {
                  ...item,
                  fetchedSellerName: sellerName,
                  fetchedSellerPhotoURL: sellerPhotoURL,
                  fetchedProductImage: productImage,
                });
              } catch (error) {
                console.error(`アイテム詳細取得エラー:`, error);
              }
            })
          )
        );

        setEnrichedItems(itemsMap);
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
                {order.items.map((item, index) => {
                  const itemKey = `${order.id}-${item.productId}`;
                  const enrichedItem = enrichedItems.get(itemKey);

                  // 旧データ（既に保存済み）または新データ（動的取得）を使用
                  const displayImage = item.productImage || enrichedItem?.fetchedProductImage || '';
                  const displaySellerName = item.sellerName || enrichedItem?.fetchedSellerName || '出品者';
                  const displaySellerPhoto = item.sellerPhotoURL || enrichedItem?.fetchedSellerPhotoURL || '';

                  return (
                    <div
                      key={index}
                      onClick={() => router.push(`/product-detail/${item.productId}`)}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1"
                    >
                      <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                        {displayImage ? (
                          <Image
                            src={displayImage}
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
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 h-10">
                          {item.productName}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-lg font-bold text-[#2FA3E3]">
                            ¥{item.price.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {displaySellerPhoto ? (
                              <Image
                                src={displaySellerPhoto}
                                alt={displaySellerName}
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-xs text-gray-600">
                                  {displaySellerName.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span className="text-xs text-gray-600 truncate max-w-[80px]">
                              {displaySellerName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
