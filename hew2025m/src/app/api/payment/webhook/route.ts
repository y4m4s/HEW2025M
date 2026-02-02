import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

const stripe = new Stripe(env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Webhook署名検証に使用するシークレット
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    console.error('Webhook signature or secret missing');
    return new NextResponse('Webhook signature missing', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Stripe署名を検証
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  try {
    // イベントタイプに応じた処理
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      default:
        // 他のイベントは無視
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}

/**
 * 支払い成功時の処理
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);

  await dbConnect();

  // 注文ステータスを更新
  const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
  if (order) {
    order.status = 'paid';
    order.paidAt = new Date();
    await order.save();
    console.log(`Order ${order._id} marked as paid`);
  } else {
    // 注文が見つからない場合（PayCheckコンポーネントで先に作成される場合もある）
    console.log(`Order not found for payment intent: ${paymentIntent.id}`);
  }
}

/**
 * 支払い失敗時の処理
 */
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);
  console.log(`Failure message: ${paymentIntent.last_payment_error?.message}`);

  await dbConnect();

  // 注文ステータスを更新
  const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
  if (order) {
    order.status = 'payment_failed';
    order.failureReason = paymentIntent.last_payment_error?.message || 'Unknown error';
    await order.save();
    console.log(`Order ${order._id} marked as payment failed`);
  }
}

/**
 * 返金時の処理
 */
async function handleRefund(charge: Stripe.Charge) {
  console.log(`Refund processed for charge: ${charge.id}`);

  await dbConnect();

  // payment_intentから注文を検索
  const paymentIntentId = charge.payment_intent;
  if (typeof paymentIntentId === 'string') {
    const order = await Order.findOne({ paymentIntentId });
    if (order) {
      order.status = 'refunded';
      order.refundedAt = new Date();
      await order.save();
      console.log(`Order ${order._id} marked as refunded`);
    }
  }
}

// Webhookはbodyを生で受け取る必要があるため、bodyParserを無効化
export const config = {
  api: {
    bodyParser: false,
  },
};
