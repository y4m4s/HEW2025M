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

    // 注文データをFirestoreに追加（商品更新前）
    // 注意: 商品更新に失敗した場合はこの注文を削除する必要がある
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

    // 購入された商品のステータスを'sold'に更新し、出品者に通知を送信
    await dbConnect();

    // まず全ての商品が購入可能か確認（在庫チェック）
    const unavailableProducts = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        unavailableProducts.push({ productId: item.productId, reason: '商品が見つかりません' });
      } else if (product.status === 'sold') {
        unavailableProducts.push({ productId: item.productId, name: item.productName, reason: '既に売り切れています' });
      } else if (product.status === 'reserved') {
        unavailableProducts.push({ productId: item.productId, name: item.productName, reason: '予約済みです' });
      }
    }

    // 購入できない商品がある場合はエラーを返す
    if (unavailableProducts.length > 0) {
      return NextResponse.json(
        {
          error: '一部の商品が購入できません',
          unavailableProducts,
          message: unavailableProducts.map(p => `${p.name || p.productId}: ${p.reason}`).join(', ')
        },
        { status: 409 } // 409 Conflict
      );
    }

    // 全ての商品処理を実行（アトミックな更新を使用）
    const productUpdateErrors: string[] = [];
    const updatedProducts: string[] = [];

    try {
      await Promise.all(items.map(async (item) => {
        // MongoDBで商品ステータスをアトミックに更新（条件付き更新）
        // statusが'available'の場合のみ'sold'に更新
        const result = await Product.findOneAndUpdate(
          { _id: item.productId, status: 'available' },
          { $set: { status: 'sold', updatedAt: new Date() } },
          { new: true }
        );

        if (!result) {
          // 更新に失敗した場合（既に他のユーザーが購入済み）
          const errorMsg = `商品「${item.productName}」は既に売り切れています`;
          console.error(`Product ${item.productId} is no longer available`);
          productUpdateErrors.push(errorMsg);
          throw new Error(errorMsg);
        }

        updatedProducts.push(item.productId);

        // 出品者に通知を送信
        if (item.sellerId) {
          // sellerIdが'user-XXX'形式の場合は'XXX'に変換
          const firebaseUserId = item.sellerId.startsWith('user-')
            ? item.sellerId.replace('user-', '')
            : item.sellerId;

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
        } else {
          console.warn(`No sellerId for product: ${item.productId}`);
        }
      }));
    } catch (error) {
      // 商品更新に失敗した場合は注文を削除（ロールバック）
      console.error('Product update failed, rolling back order:', error);

      try {
        await docRef.delete();
      } catch (rollbackError) {
        console.error('Failed to rollback order:', rollbackError);
      }

      // 既に更新された商品を元に戻す（ベストエフォート）
      if (updatedProducts.length > 0) {
        await Promise.all(updatedProducts.map(async (productId) => {
          try {
            await Product.findByIdAndUpdate(productId, { status: 'available' });
          } catch (revertError) {
            console.error(`Failed to revert product ${productId}:`, revertError);
          }
        }));
      }

      return NextResponse.json(
        {
          error: productUpdateErrors.length > 0 ? productUpdateErrors[0] : '商品の更新に失敗しました',
          message: 'ご指定の商品は既に売り切れている可能性があります。カートを更新してください。'
        },
        { status: 409 }
      );
    }

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