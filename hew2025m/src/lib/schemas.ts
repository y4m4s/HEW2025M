import { z } from 'zod';

// This is the base schema for the product form, shared between client and server.
export const ProductFormSchema = z.object({
  title: z.string()
    .min(1, { message: '商品名を入力してください' })
    .max(30, { message: '商品名は30文字以内で入力してください' }),
  price: z.coerce.number({ message: '価格を数値で入力してください' })
    .min(1, { message: '価格は1円以上で入力してください' })
    .max(99999999, { message: '価格は99,999,999円以下で入力してください' }),
  category: z.string({ message: 'カテゴリーを選択してください' })
    .min(1, { message: 'カテゴリーを選択してください' }),
  // Use enums for stricter validation and consistency.
  condition: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(['new', 'like-new', 'good', 'fair', 'poor'], {
      message: '商品の状態を選択してください',
    })
  ),
  description: z.string()
    .min(1, { message: '商品の説明を入力してください' })
    .max(300, { message: '商品の説明は300文字以内で入力してください' }),
  shippingPayer: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(['seller', 'buyer'], {
      message: '配送料の負担を選択してください',
    })
  ),
  shippingDays: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(['1-2', '2-3', '4-7'], {
      message: '発送までの日数を選択してください',
    })
  ),
});

// This is the schema for the server-side POST request, extending the base form schema.
export const ProductPostSchema = ProductFormSchema.extend({
  images: z.array(z.string()).optional().default([]),
  sellerId: z.string(),
  sellerName: z.string(),
});

export const PostFormSchema = z.object({
  title: z.string()
    .min(1, { message: '件名を入力してください' })
    .max(30, { message: '件名は30文字以内で入力してください' }),
  content: z.string()
    .min(1, { message: '本文を入力してください' })
    .max(140, { message: '本文は140文字以内で入力してください' }),
});