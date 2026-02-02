import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

interface CheckoutItem {
  title: string;
  image: string;
  price: number;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const { items } = await request.json() as { items: CheckoutItem[] };

    // Stripe Checkoutセッションの作成
    // Create a Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item) => ({
        price_data: {
          currency: 'jpy',
          product_data: {
            name: item.title,
            images: [item.image],
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      // 決済成功時とキャンセル時のリダイレクト先URL
      // Redirect URLs for success and cancellation
      success_url: `${request.headers.get('origin')}/?success=true`,
      cancel_url: `${request.headers.get('origin')}/cart?canceled=true`,
    });

    return NextResponse.json({ sessionId: checkoutSession.id });

  } catch (error) {
    // エラーハンドリング
    // Error handling
    console.error('Stripe session creation failed:', error);
    return NextResponse.json({ error: 'Error creating checkout session' }, { status: 500 });
  }
}