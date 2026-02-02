import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';

if (!env.STRIPE_SECRET_KEY) {
  console.error("Stripe Secret Key is missing");
  // Don't crash immediately if not needed? But it is needed here.
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY || "", {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, userId, shippingAddress } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new NextResponse('商品データが無効です', { status: 400 });
    }

    const subtotalAmount = items.reduce((accumulator: number, item: { price: number; quantity: number }) => {
      return accumulator + item.price * item.quantity;
    }, 0);

    const shippingFee = subtotalAmount > 0 ? 500 : 0;
    const totalAmount = subtotalAmount + shippingFee;

    if (totalAmount <= 0) {
      return new NextResponse('金額が無効です', { status: 400 });
    }

    // PaymentIntentの作成
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'jpy',
      description: `User ${userId} - ${items.length} items purchase`,

      // 【重要修正】決済手段の自動管理を有効にする
      // これにより、ダッシュボードで有効にした PayPay, Apple Pay, Google Pay が自動で表示されます
      automatic_payment_methods: {
        enabled: true,
      },

      shipping: shippingAddress ? {
        name: shippingAddress.name,
        address: {
          line1: shippingAddress.line1,
          line2: shippingAddress.line2,
          city: shippingAddress.city,
          postal_code: shippingAddress.postal_code,
          country: 'JP',
        },
      } : undefined,

      metadata: {
        userId: userId,
        itemCount: items.length,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
    });

  } catch (error: unknown) {
    console.error('Stripe API Error:', error);
    const errorMessage = error instanceof Error ? error.message : '決済処理に失敗しました';
    return new NextResponse(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}