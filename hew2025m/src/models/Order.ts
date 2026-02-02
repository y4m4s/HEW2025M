import mongoose, { Schema, Model, Document } from 'mongoose';

// 注文アイテムの型定義
export interface IOrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  sellerId: string;
}

// 配送先住所の型定義
export interface IShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  postal_code: string;
  country: string;
}

// 注文ステータスの型定義
export type OrderStatus =
  | 'pending'        // 支払い待ち
  | 'paid'           // 支払い完了
  | 'payment_failed' // 支払い失敗
  | 'shipped'        // 発送済み
  | 'delivered'      // 配達完了
  | 'cancelled'      // キャンセル
  | 'refunded';      // 返金済み

// 注文の型定義
export interface IOrder {
  userId: string;
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentIntentId?: string;
  shippingAddress?: IShippingAddress;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Document型との組み合わせ
export interface IOrderDocument extends IOrder, Document {}

// 注文アイテムスキーマ
const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: String,
      required: [true, '商品IDは必須です'],
    },
    title: {
      type: String,
      required: [true, '商品名は必須です'],
    },
    price: {
      type: Number,
      required: [true, '価格は必須です'],
      min: [0, '価格は0円以上で入力してください'],
    },
    quantity: {
      type: Number,
      required: [true, '数量は必須です'],
      min: [1, '数量は1以上で入力してください'],
    },
    image: {
      type: String,
    },
    sellerId: {
      type: String,
      required: [true, '出品者IDは必須です'],
    },
  },
  { _id: false }
);

// 配送先住所スキーマ
const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    name: {
      type: String,
      required: [true, '氏名は必須です'],
    },
    line1: {
      type: String,
      required: [true, '住所1は必須です'],
    },
    line2: {
      type: String,
    },
    city: {
      type: String,
      required: [true, '市区町村は必須です'],
    },
    postal_code: {
      type: String,
      required: [true, '郵便番号は必須です'],
    },
    country: {
      type: String,
      default: 'JP',
    },
  },
  { _id: false }
);

// 注文スキーマ
const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: String,
      required: [true, 'ユーザーIDは必須です'],
    },
    items: {
      type: [OrderItemSchema],
      required: [true, '注文アイテムは必須です'],
      validate: {
        validator: function (items: IOrderItem[]) {
          return items.length > 0;
        },
        message: '注文には少なくとも1つの商品が必要です',
      },
    },
    subtotal: {
      type: Number,
      required: [true, '小計は必須です'],
      min: [0, '小計は0円以上で入力してください'],
    },
    shippingFee: {
      type: Number,
      required: [true, '送料は必須です'],
      min: [0, '送料は0円以上で入力してください'],
    },
    totalAmount: {
      type: Number,
      required: [true, '合計金額は必須です'],
      min: [0, '合計金額は0円以上で入力してください'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'payment_failed', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    paymentIntentId: {
      type: String,
      index: true,
    },
    shippingAddress: {
      type: ShippingAddressSchema,
    },
    paidAt: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// インデックス設定
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

// モデルのエクスポート（既存のモデルがあればそれを使用）
const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
