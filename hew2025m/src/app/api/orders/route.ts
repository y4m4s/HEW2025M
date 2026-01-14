import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { OrderItem } from '@/types/order';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/simpleAuth';

interface CreateOrderRequest {
  buyerId: string;
  buyerName: string;
  items: OrderItem[];
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  paymentMethod: 'card' | 'paypay' | 'apple_pay' | 'google_pay';
  paymentIntentId?: string;
  shippingAddress?: {
    zipCode: string;
    prefecture: string;
    city: string;
    street: string;
  };
}

export async function POST(request: Request) {
  try {
    // 認証チェック
    const userIdOrError = await requireAuth(request);
    if (userIdOrError instanceof Response) {
      return userIdOrError; // 401エラーを返す
    }
    const userId = userIdOrError as string;

    const body: CreateOrderRequest = await request.json();

    const {
      buyerId,
      buyerName,
      items,
      totalAmount,
      subtotal,
      shippingFee,
      paymentMethod,
      paymentIntentId,
      shippingAddress,
    } = body;

    // 認証されたユーザーIDとbuyerIdが一致するか確認
    const actualUserId = userId.startsWith('user-') ? userId : `user-${userId}`;
    if (buyerId !== actualUserId && buyerId !== userId) {
      return NextResponse.json(
        { error: '不正なリクエストです' },
        { status: 403 }
      );
    }

    if (!buyerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      );
    }

    const orderData = {
      buyerId,
      buyerName,
      items,
      totalAmount,
      subtotal,
      shippingFee,
      paymentMethod,
      paymentIntentId: paymentIntentId || null,
      paymentStatus: 'completed',
      orderStatus: 'confirmed',
      shippingAddress: shippingAddress || null,
      trackingNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection('orders').add(orderData);

    // 購入者のFirestoreプロフィールから表示名を取得
    let buyerDisplayName = buyerName;
    try {
      const buyerDoc = await adminDb.collection('users').doc(buyerId).get();
      if (buyerDoc.exists) {
        const buyerData = buyerDoc.data();
        buyerDisplayName = buyerData?.displayName || buyerName;
      }
    } catch (error) {
      console.error('Error fetching buyer profile:', error);
      // エラー時はbuyerNameをそのまま使用
    }

    // 購入された商品のステータスを'sold'に更新し、出品者に通知を送信（並列処理で高速化）
    await dbConnect();

    // 全ての商品処理を並列実行
    await Promise.all(items.map(async (item) => {
      try {
        console.log(`Processing product: ${item.productId}, sellerId: ${item.sellerId}`);

        // MongoDBで商品ステータスを更新
        const product = await Product.findById(item.productId);
        if (product) {
          product.status = 'sold';
          await product.save();
          console.log(`Product ${item.productId} status updated to sold`);
        } else {
          console.error(`Product not found: ${item.productId}`);
        }

        // 出品者に通知を送信
        if (item.sellerId) {
          // sellerIdが'user-XXX'形式の場合は'XXX'に変換
          const firebaseUserId = item.sellerId.startsWith('user-')
            ? item.sellerId.replace('user-', '')
            : item.sellerId;

          console.log(`Sending notification to Firebase user: ${firebaseUserId}`);

          const notificationData = {
            iconType: 'sales',
            iconBgColor: 'bg-green-500',
            title: `${buyerDisplayName}さんが商品を購入しました`,
            description: `「${item.productName}」が購入されました。購入者の情報を確認して発送の準備を始めてください。`,
            timestamp: new Date(),
            tag: '販売',
            isUnread: true,
            link: `/product-detail/${item.productId}`,
            buyerProfileLink: `/profile/${buyerId}`,
            actorUserId: buyerId,
            actorDisplayName: buyerDisplayName,
          };

          await adminDb
            .collection('users')
            .doc(firebaseUserId)
            .collection('notifications')
            .add(notificationData);

          console.log(`Notification sent to user: ${firebaseUserId}`);
        } else {
          console.warn(`No sellerId for product: ${item.productId}`);
        }
      } catch (error) {
        console.error(`Error processing product ${item.productId}:`, error);
        // 個別の商品でエラーが発生しても他の商品の処理は続行
      }
    }));

    return NextResponse.json({
      success: true,
      orderId: docRef.id,
      message: 'Order created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}