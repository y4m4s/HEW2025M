import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/simpleAuth';
import { ProductPostSchema } from '@/lib/schemas';

/* ============================
   型定義
============================ */
type ProductQuery = {
  category?: string;
  sellerId?: string;
  shippingPayer?: string;
  price?: {
    $gte?: number;
    $lte?: number;
  };
};

/* ============================
   商品一覧取得（GET）
============================ */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    // ページネーション
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 12);

    // フィルター
    const category = searchParams.get('category');
    const sellerId = searchParams.get('sellerId');
    const shippingPayer = searchParams.get('shippingPayer');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy');

    const query: ProductQuery = {};

    if (category) query.category = category;
    if (sellerId) query.sellerId = sellerId;
    if (shippingPayer) query.shippingPayer = shippingPayer;

    // 価格帯フィルター
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // ソート条件
    const sortOptions: Record<string, 1 | -1> =
      sortBy === 'price-low'
        ? { price: 1 }
        : sortBy === 'price-high'
        ? { price: -1 }
        : { createdAt: -1 };

    const total = await Product.countDocuments(query);

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        total,
        page,
        limit,
        hasMore: skip + products.length < total,
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: '商品の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/* ============================
   商品新規作成（POST）
============================ */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const userIdOrError = await requireAuth(request);
    if (userIdOrError instanceof Response) {
      return userIdOrError;
    }
    const userId = userIdOrError as string;

    await dbConnect();

    const body = await request.json();

    // バリデーション
    const validationResult = ProductPostSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '入力データが無効です',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { sellerId, ...productData } = validationResult.data;

    // 出品者チェック
    if (sellerId !== `user-${userId}`) {
      return NextResponse.json(
        { error: '不正なリクエストです' },
        { status: 403 }
      );
    }

    const product = await Product.create({
      ...productData,
      sellerId,
      status: 'available',
    });

    return NextResponse.json(
      {
        success: true,
        product,
        message: '商品が出品されました',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: '商品の出品に失敗しました' },
      { status: 500 }
    );
  }
}
