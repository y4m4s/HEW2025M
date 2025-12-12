import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Order, OrderItem } from '@/types/order';

interface CreateOrderRequest {
  buyerId: string;
  buyerName: string;
  items: OrderItem[];
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  paymentMethod: 'card' | 'paypay' | 'applepay' | 'rakuten' | 'au';
  paymentIntentId?: string;
  shippingAddress?: {
    zipCode: string;
    prefecture: string;
    city: string;
    street: string;
  };
}

export async function POST(request: Request) {
  try {
    const body: CreateOrderRequest = await request.json();
    const {
      buyerId,
      buyerName,
      items,
      totalAmount,
      subtotal,
      shippingFee,
      paymentMethod,
      paymentIntentId,
      shippingAddress,
    } = body;

    if (!buyerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      );
    }

    const ordersRef = collection(db, 'orders');
    const orderData = {
      buyerId,
      buyerName,
      items,
      totalAmount,
      subtotal,
      shippingFee,
      paymentMethod,
      paymentIntentId: paymentIntentId || null,
      paymentStatus: 'completed',
      orderStatus: 'confirmed',
      shippingAddress: shippingAddress || null,
      trackingNumber: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(ordersRef, orderData);

    return NextResponse.json({
      success: true,
      orderId: docRef.id,
      message: 'Order created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}