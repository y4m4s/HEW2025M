import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

// 商品一覧を取得
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    let query: any = {};
    if (category) {
      query.category = category;
    }
    if (condition) {
      query.condition = condition;
    }
    if (sellerId) {
      query.sellerId = sellerId;
    }
    if (status) {
      query.status = status;
    }

    // 総数を取得
    const total = await Product.countDocuments(query);

    // ページネーションを適用
    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
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

// 新規商品を作成
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      title,
      description,
      price,
      category,
      condition,
      images,
      sellerId,
      sellerName,
      shippingPayer,
      shippingDays,
    } = body;

    // バリデーション
    if (!title || !description || !price || !category || !condition || !sellerId || !sellerName || !shippingPayer || !shippingDays) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { error: '価格は0円以上で入力してください' },
        { status: 400 }
      );
    }

    if (!['new', 'like-new', 'good', 'fair', 'poor'].includes(condition)) {
      return NextResponse.json(
        { error: '商品の状態が正しくありません' },
        { status: 400 }
      );
    }

    if (!['seller', 'buyer'].includes(shippingPayer)) {
      return NextResponse.json(
        { error: '配送料の負担が正しくありません' },
        { status: 400 }
      );
    }

    if (!['1-2', '2-3', '4-7'].includes(shippingDays)) {
      return NextResponse.json(
        { error: '発送までの日数が正しくありません' },
        { status: 400 }
      );
    }

    // 商品を作成
    const product = await Product.create({
      title,
      description,
      price,
      category,
      condition,
      images: images || [],
      sellerId,
      sellerName,
      status: 'available',
      shippingPayer,
      shippingDays,
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
