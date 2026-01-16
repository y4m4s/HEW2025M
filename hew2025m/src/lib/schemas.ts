import { z } from 'zod';

// This is the base schema for the product form, shared between client and server.
export const ProductFormSchema = z.object({
  title: z.string()
    .min(1, { message: '商品名を入力してください' })
    .max(30, { message: '商品名は30文字以内で入力してください' }),
  price: z.coerce.number({ invalid_type_error: '価格を数値で入力してください' })
    .min(1, { message: '価格は1円以上で入力してください' })
    .max(99999999, { message: '価格は99,999,999円以下で入力してください' }),
  category: z.string().min(1, { message: 'カテゴリーを選択してください' }),
  // Use enums for stricter validation and consistency.
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor'], { errorMap: () => ({ message: '商品の状態を選択してください' }) }),
  description: z.string()
    .min(1, { message: '商品の説明を入力してください' })
    .max(300, { message: '商品の説明は300文字以内で入力してください' }),
  shippingPayer: z.enum(['seller', 'buyer'], { errorMap: () => ({ message: '配送料の負担を選択してください' }) }),
  shippingDays: z.enum(['1-2', '2-3', '4-7'], { errorMap: () => ({ message: '発送までの日数を選択してください' }) }),
});

// This is the schema for the server-side POST request, extending the base form schema.
export const ProductPostSchema = ProductFormSchema.extend({
  images: z.array(z.string()).optional().default([]),
  sellerId: z.string(),
  sellerName: z.string(),
});