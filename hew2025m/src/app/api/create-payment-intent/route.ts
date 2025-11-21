import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { CartItem } from '@/store/useCartStore'; // Verifique se o caminho da store está correto

// Inicializa o Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia', // Se der erro aqui, apague essa linha ou use a versão sugerida
});

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    // Segurança: Calcule o preço total no servidor
    // (Não confie apenas no preço que vem do frontend)
    const amount = items.reduce((acc: number, item: CartItem) => {
      return acc + item.price * item.quantity;
    }, 0);

    // Adicionar Frete (ex: 500 ienes)
    const shippingFee = amount > 0 ? 500 : 0;
    const totalAmount = amount + shippingFee;

    if (totalAmount <= 0) {
        return new NextResponse('値のエラー', { status: 400 });
    }

    // Cria o PaymentIntent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'jpy',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Retorna o "Segredo" (clientSecret) para o Frontend
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: any) {
    console.error(' API Stripeのエラー:', error);
    return new NextResponse('サーバエラー', { status: 500 });
  }
}