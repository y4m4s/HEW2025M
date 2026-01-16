import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/simpleAuth';

// 商品一覧を取得
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status');
    const shippingPayer = searchParams.get('shippingPayer');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    let query: any = {};
    if (category) {
      query.category = category;
    }
    if (sellerId) {
      query.sellerId = sellerId;
    }
    if (status) {
      query.status = status;
    }
    if (shippingPayer) {
      query.shippingPayer = shippingPayer;
    }

    // 価格帯フィルター
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = parseInt(minPrice);
      }
      if (maxPrice) {
        query.price.$lte = parseInt(maxPrice);
      }
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
    // 認証チェック
    const userIdOrError = await requireAuth(request);
    if (userIdOrError instanceof Response) {
      return userIdOrError; // 401エラーを返す
    }
    const userId = userIdOrError as string;

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

    // 認証されたユーザーIDとsellerIdが一致するか確認
    const actualUserId = userId.startsWith('user-') ? userId : `user-${userId}`;
    if (sellerId !== actualUserId && sellerId !== userId) {
      return NextResponse.json(
        { error: '不正なリクエストです' },
        { status: 403 }
      );
    }

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
