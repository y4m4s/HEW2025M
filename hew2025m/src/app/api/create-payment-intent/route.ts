import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Stripeインスタンスの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
});

/**
 * 決済処理のAPIエンドポイント
 * クレジットカードとPayPayに対応
 */
export async function POST(request: Request) {
  try {
    // リクエストボディから商品情報を取得
    const body = await request.json();
    const { items } = body;

    // バリデーション: itemsが存在し、配列であることを確認
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new NextResponse('商品データが無効です', { status: 400 });
    }

    // 商品の合計金額を計算
    const subtotalAmount = items.reduce((accumulator: number, item: any) => {
      return accumulator + item.price * item.quantity;
    }, 0);

    // 送料の計算（商品がある場合のみ500円）
    const shippingFee = subtotalAmount > 0 ? 500 : 0;
    
    // 最終的な合計金額
    const totalAmount = subtotalAmount + shippingFee;

    // 金額の妥当性チェック
    if (totalAmount <= 0) {
      return new NextResponse('金額が無効です', { status: 400 });
    }

    // Stripe PaymentIntentの作成
    // クレジットカード（Visa, Mastercard, JCB, Amex）とPayPayに対応
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount, // 支払い金額（円）
      currency: 'jpy', // 通貨は日本円
      
      // 対応する決済方法
      // 'card' = クレジットカード, Apple Pay, Google Pay
      // 'paypay' = PayPay
      // 注意: Stripe DashboardでPayPayを有効にする必要があります
      payment_method_types: ['card', 'paypay'],
      
      // メタデータ（オプション：注文情報を保存）
      metadata: {
        subtotal: subtotalAmount,
        shipping: shippingFee,
        itemCount: items.length,
      },
    });

    // フロントエンドにclientSecretを返す
    // このシークレットを使って決済フォームを表示
    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
    });

  } catch (error: any) {
    // エラーログの出力
    console.error('Stripe API エラー:', error);
    
    // エラーレスポンスの返却
    return new NextResponse(
      `サーバーエラー: ${error.message}`, 
      { status: 500 }
    );
  }
}
