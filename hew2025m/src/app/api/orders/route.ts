import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { OrderItem } from '@/types/order';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/simpleAuth';
import { calculateShippingFee } from '@/lib/shipping';
import { ensureUserIdPrefix } from '@/lib/utils';

interface CreateOrderRequest {
  buyerId?: string;
  buyerName?: string;
  items: OrderItem[];
  totalAmount?: number;
  subtotal?: number;
  shippingFee?: number;
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
    const userIdOrError = await requireAuth(request);
    if (userIdOrError instanceof Response) {
      return userIdOrError;
    }
    const userId = userIdOrError as string;

    const body: CreateOrderRequest = await request.json();
    const {
      buyerId,
      items,
      paymentMethod,
      paymentIntentId,
      shippingAddress,
      subtotal: clientSubtotal,
      shippingFee: clientShippingFee,
      totalAmount: clientTotalAmount,
    } = body;

    const normalizedBuyerId = ensureUserIdPrefix(userId);
    if (buyerId && buyerId !== normalizedBuyerId && buyerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized buyerId' },
        { status: 403 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      );
    }

    const normalizedItems = items
      .map((item) => ({
        productId: item.productId,
        quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
      }))
      .filter((item) => !!item.productId);

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order items' },
        { status: 400 }
      );
    }

    await dbConnect();

    const productIds = normalizedItems.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const unavailableProducts: { productId: string; reason: string }[] = [];
    for (const item of normalizedItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        unavailableProducts.push({ productId: item.productId, reason: 'not_found' });
      } else if (product.status === 'sold') {
        unavailableProducts.push({ productId: item.productId, reason: 'sold' });
      } else if (product.status === 'reserved') {
        unavailableProducts.push({ productId: item.productId, reason: 'reserved' });
      }
    }

    if (unavailableProducts.length > 0) {
      return NextResponse.json(
        {
          error: 'unavailable_products',
          unavailableProducts,
          message: unavailableProducts
            .map((p) => `${p.productId}: ${p.reason}`)
            .join(', '),
        },
        { status: 409 }
      );
    }

    // 注文アイテムの作成（必要最小限のデータのみ保存）
    const orderItems: OrderItem[] = normalizedItems.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        productId: product._id.toString(),
        productName: product.title, // 履歴として必要（商品削除後も表示）
        price: product.price, // 履歴として必要（価格変更後も表示）
        quantity: item.quantity,
        sellerId: product.sellerId,
        // 以下のフィールドは後方互換性のため空文字列で保持
        productImage: '',
        sellerName: '',
        category: '',
        condition: '',
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const hasBuyerPaysItem = normalizedItems.some((item) => {
      const product = productMap.get(item.productId);
      return product?.shippingPayer === 'buyer';
    });
    if (hasBuyerPaysItem && !shippingAddress?.prefecture) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    const shippingFee = calculateShippingFee(shippingAddress?.prefecture, hasBuyerPaysItem);
    const totalAmount = subtotal + shippingFee;

    if (
      (typeof clientSubtotal === 'number' && clientSubtotal !== subtotal) ||
      (typeof clientShippingFee === 'number' && clientShippingFee !== shippingFee) ||
      (typeof clientTotalAmount === 'number' && clientTotalAmount !== totalAmount)
    ) {
      return NextResponse.json(
        { error: 'Price mismatch' },
        { status: 400 }
      );
    }

    const orderData = {
      buyerId: userId,
      // buyerNameは不要（users/{userId}から取得可能）だが後方互換性のため保持
      buyerName: '',
      items: orderItems,
      totalAmount,
      subtotal,
      shippingFee,
      paymentMethod,
      paymentIntentId: paymentIntentId || null,
      paymentStatus: 'pending',
      orderStatus: 'confirmed',
      shippingAddress: shippingAddress || null, // 配送記録として必要
      trackingNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection('orders').add(orderData);

    // 出品者への通知用に購入者の表示名を取得
    let buyerDisplayName = 'ユーザー';
    try {
      const buyerDoc = await adminDb.collection('users').doc(userId).get();
      if (buyerDoc.exists) {
        const buyerData = buyerDoc.data();
        buyerDisplayName = buyerData?.displayName || buyerDisplayName;
      }
    } catch (error) {
      console.error('Error fetching buyer profile:', error);
    }

    const updatedProducts: string[] = [];
    const productUpdateErrors: string[] = [];

    try {
      await Promise.all(
        orderItems.map(async (item) => {
          const result = await Product.findOneAndUpdate(
            { _id: item.productId, status: 'available' },
            { $set: { status: 'sold', updatedAt: new Date() } },
            { new: true }
          );

          if (!result) {
            const errorMsg = `商品「${item.productName}」は既に売り切れています`;
            productUpdateErrors.push(errorMsg);
            throw new Error(errorMsg);
          }

          updatedProducts.push(item.productId);

          if (item.sellerId) {
            const firebaseUserId = item.sellerId.startsWith('user-')
              ? item.sellerId.replace('user-', '')
              : item.sellerId;

            const notificationData = {
              iconType: 'sales',
              iconBgColor: 'bg-green-500',
              title: `${buyerDisplayName}さんが商品を購入しました`,
              description: `「${item.productName}」が購入されました。購入者の情報を確認して発送の準備を始めてください。`,
              timestamp: new Date(),
              tag: '売上',
              isUnread: true,
              link: `/product-detail/${item.productId}`,
              buyerProfileLink: `/profile/${userId}`,
              actorUserId: userId,
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
        })
      );
    } catch (error) {
      console.error('Product update failed, rolling back order:', error);

      try {
        await docRef.delete();
      } catch (rollbackError) {
        console.error('Failed to rollback order:', rollbackError);
      }

      if (updatedProducts.length > 0) {
        await Promise.all(
          updatedProducts.map(async (productId) => {
            try {
              await Product.findByIdAndUpdate(productId, { status: 'available' });
            } catch (revertError) {
              console.error(`Failed to revert product ${productId}:`, revertError);
            }
          })
        );
      }

      return NextResponse.json(
        {
          error:
            productUpdateErrors.length > 0
              ? productUpdateErrors[0]
              : '商品の更新に失敗しました',
          message:
            '決済は完了しましたが商品の更新に失敗しました。カートを更新して再度お試しください。',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        orderId: docRef.id,
        message: 'Order created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
