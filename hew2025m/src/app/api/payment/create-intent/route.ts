import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/simpleAuth';
import { calculateShippingFee } from '@/lib/shipping';

if (!env.STRIPE_SECRET_KEY) {
  console.error('Stripe Secret Key is missing');
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

type CreateIntentItem = {
  productId?: string;
  id?: string;
  quantity?: number;
};

type ShippingAddress = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postal_code?: string;
  prefecture?: string;
};

export async function POST(request: Request) {
  try {
    const userIdOrError = await requireAuth(request);
    if (userIdOrError instanceof Response) {
      return userIdOrError;
    }
    const userId = userIdOrError as string;

    const body = await request.json();
    const { items, shippingAddress } = body as {
      items: CreateIntentItem[];
      shippingAddress?: ShippingAddress;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new NextResponse('items is required', { status: 400 });
    }

    const normalizedItems = items
      .map((item) => ({
        productId: item.productId || item.id,
        quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
      }))
      .filter((item) => !!item.productId);

    if (normalizedItems.length === 0) {
      return new NextResponse('Invalid items', { status: 400 });
    }

    await dbConnect();

    const productIds = normalizedItems.map((item) => item.productId as string);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const unavailableProducts: { productId: string; reason: string }[] = [];
    for (const item of normalizedItems) {
      const product = productMap.get(item.productId as string);
      if (!product) {
        unavailableProducts.push({ productId: item.productId as string, reason: 'not_found' });
      } else if (product.status === 'sold') {
        unavailableProducts.push({ productId: item.productId as string, reason: 'sold' });
      } else if (product.status === 'reserved') {
        unavailableProducts.push({ productId: item.productId as string, reason: 'reserved' });
      }
    }

    if (unavailableProducts.length > 0) {
      return NextResponse.json(
        { error: 'unavailable_products', unavailableProducts },
        { status: 409 }
      );
    }

    const subtotalAmount = normalizedItems.reduce((acc, item) => {
      const product = productMap.get(item.productId as string);
      return acc + (product?.price || 0) * item.quantity;
    }, 0);

    const hasBuyerPaysItem = normalizedItems.some((item) => {
      const product = productMap.get(item.productId as string);
      return product?.shippingPayer === 'buyer';
    });

    if (hasBuyerPaysItem && !shippingAddress?.prefecture) {
      return new NextResponse('Shipping address is required', { status: 400 });
    }

    const shippingFee = calculateShippingFee(shippingAddress?.prefecture, hasBuyerPaysItem);
    const totalAmount = subtotalAmount + shippingFee;

    if (totalAmount <= 0) {
      return new NextResponse('Invalid amount', { status: 400 });
    }

    // Stripeの最低金額チェック（50円）
    if (totalAmount < 50) {
      return new NextResponse(
        JSON.stringify({ error: 'Amount must be at least ¥50 jpy' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'jpy',
      description: `User ${userId} - ${normalizedItems.length} items purchase`,
      automatic_payment_methods: {
        enabled: true,
      },
      shipping: shippingAddress?.line1
        ? {
            name: shippingAddress.name || 'User',
            address: {
              line1: shippingAddress.line1,
              line2: shippingAddress.line2,
              city: shippingAddress.city,
              postal_code: shippingAddress.postal_code,
              country: 'JP',
            },
          }
        : undefined,
      metadata: {
        userId,
        itemCount: normalizedItems.length,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
    });
  } catch (error: unknown) {
    console.error('Stripe API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Payment error';
    return new NextResponse(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
