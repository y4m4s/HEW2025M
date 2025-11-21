import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Stripeの初期化。シークレットキーは環境変数から取得します。
// It is recommended to use environment variables for the secret key.
console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY); // Check if the secret key is loaded


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    console.log("Items received:", items); // Check if items are being received

    // Stripe Checkoutセッションの作成
    // Create a Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
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