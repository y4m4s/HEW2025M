import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { adminDb } from '@/lib/firebase-admin';

const stripe = new Stripe(env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

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
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await updateOrderByPaymentIntent(paymentIntent.id, {
          paymentStatus: 'completed',
          orderStatus: 'confirmed',
          paidAt: new Date(),
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await updateOrderByPaymentIntent(paymentIntent.id, {
          paymentStatus: 'failed',
          failureReason: paymentIntent.last_payment_error?.message || 'Unknown error',
        });
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent;
        if (typeof paymentIntentId === 'string') {
          await updateOrderByPaymentIntent(paymentIntentId, {
            paymentStatus: 'refunded',
            orderStatus: 'cancelled',
            refundedAt: new Date(),
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}

async function updateOrderByPaymentIntent(
  paymentIntentId: string,
  updates: Record<string, unknown>
) {
  const snapshot = await adminDb
    .collection('orders')
    .where('paymentIntentId', '==', paymentIntentId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.log(`Order not found for payment intent: ${paymentIntentId}`);
    return;
  }

  const docRef = snapshot.docs[0].ref;
  await docRef.update({
    ...updates,
    updatedAt: new Date(),
  });
}

// Webhookはbodyを生で受け取る必要がある
export const config = {
  api: {
    bodyParser: false,
  },
};
