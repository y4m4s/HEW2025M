import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
});

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    // 1. Calcula o total
    const amount = items.reduce((acc: number, item: any) => {
      return acc + item.price * item.quantity;
    }, 0);

    const shippingFee = amount > 0 ? 500 : 0;
    const totalAmount = amount + shippingFee;

    if (totalAmount <= 0) {
        return new NextResponse('Erro de valor', { status: 400 });
    }

    // 2. Cria o pagamento no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'jpy',
      // MODO AUTOMÁTICO:
      // Isso ativa Cartão, Apple Pay e Google Pay automaticamente
      // (Baseado no que você ativou no Dashboard)
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: any) {
    console.error('Stripe API Error:', error);
    return new NextResponse(`Erro: ${error.message}`, { status: 500 });
  }
}