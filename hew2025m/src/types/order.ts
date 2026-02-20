export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
  sellerPhotoURL?: string;
  category: string;
  condition: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  items: OrderItem[];
  totalAmount: number;
  shippingFee: number;
  subtotal: number;
  paymentMethod: 'card' | 'paypay' | 'apple_pay' | 'google_pay';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentIntentId?: string;
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress?: {
    zipCode: string;
    prefecture: string;
    city: string;
    street: string;
  };
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}