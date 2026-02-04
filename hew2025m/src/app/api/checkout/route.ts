import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/simpleAuth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

interface CheckoutItem {
  productId?: string;
  id?: string;
  quantity?: number;
}

export async function POST(request: Request) {
  try {
    const userIdOrError = await requireAuth(request);
    if (userIdOrError instanceof Response) {
      return userIdOrError;
    }

    const { items } = (await request.json()) as { items: CheckoutItem[] };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 });
    }

    const normalizedItems = items
      .map((item) => ({
        productId: item.productId || item.id,
        quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
      }))
      .filter((item) => !!item.productId);

    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 });
    }

    await dbConnect();

    const productIds = normalizedItems.map((item) => item.productId as string);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const unavailable = normalizedItems.filter((item) => {
      const product = productMap.get(item.productId as string);
      return !product || product.status !== 'available';
    });

    if (unavailable.length > 0) {
      return NextResponse.json({ error: 'Unavailable products' }, { status: 409 });
    }

    const line_items = normalizedItems.map((item) => {
      const product = productMap.get(item.productId as string)!;
      return {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: product.title,
            images: product.images?.[0] ? [product.images[0]] : [],
          },
          unit_amount: product.price,
        },
        quantity: item.quantity,
      };
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/?success=true`,
      cancel_url: `${request.headers.get('origin')}/cart?canceled=true`,
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Stripe session creation failed:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}
