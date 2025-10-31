import mongoose, { Schema, Model } from 'mongoose';

// 商品の型定義
export interface IProduct {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  images: string[];
  sellerId: string;
  sellerName: string;
  status: 'available' | 'sold' | 'reserved';
  shippingPayer: 'seller' | 'buyer'; // 配送料の負担
  shippingDays: '1-2' | '2-3' | '4-7'; // 発送までの日数
  createdAt: Date;
  updatedAt: Date;
}

// Mongooseスキーマ定義
const ProductSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: [true, '商品名は必須です'],
      trim: true,
      maxlength: [50, '商品名は50文字以内で入力してください'],
    },
    description: {
      type: String,
      required: [true, '商品説明は必須です'],
      trim: true,
      maxlength: [300, '商品説明は300文字以内で入力してください'],
    },
    price: {
      type: Number,
      required: [true, '価格は必須です'],
      min: [0, '価格は0円以上で入力してください'],
    },
    category: {
      type: String,
      required: [true, 'カテゴリーは必須です'],
    },
    condition: {
      type: String,
      enum: ['new', 'like-new', 'good', 'fair', 'poor'],
      required: [true, '商品の状態は必須です'],
    },
    images: {
      type: [String],
      default: [],
    },
    sellerId: {
      type: String,
      required: [true, '出品者IDは必須です'],
    },
    sellerName: {
      type: String,
      required: [true, '出品者名は必須です'],
    },
    status: {
      type: String,
      enum: ['available', 'sold', 'reserved'],
      default: 'available',
    },
    shippingPayer: {
      type: String,
      enum: ['seller', 'buyer'],
      required: [true, '配送料の負担は必須です'],
    },
    shippingDays: {
      type: String,
      enum: ['1-2', '2-3', '4-7'],
      required: [true, '発送までの日数は必須です'],
    },
  },
  {
    timestamps: true,
  }
);

// インデックス設定
ProductSchema.index({ sellerId: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ createdAt: -1 });

// モデルのエクスポート（既存のモデルがあればそれを使用）
const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
