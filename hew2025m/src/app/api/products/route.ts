import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/simpleAuth';
import { ProductPostSchema } from '@/lib/schemas';

// 商品一覧を取得
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    // ページネーション
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // フィルター
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status');
    const priceRange = searchParams.get('priceRange');
    const keyword = searchParams.get('keyword');

    // ソート
    const sortBy = searchParams.get('sortBy') || 'newest';

    let query: any = {};

    // フィルター条件の構築
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (sellerId) query.sellerId = sellerId;
    if (status) query.status = status;

    // 価格帯フィルター
    if (priceRange) {
      const [min, max] = priceRange.split('-');
      if (min) query.price = { ...query.price, $gte: parseInt(min) };
      if (max) query.price = { ...query.price, $lte: parseInt(max) };
    }

    // キーワード検索（テキストインデックスが必要）
    if (keyword) {
      query.$text = { $search: keyword };
    }

    // ソート条件の構築
    let sortOptions: any = { createdAt: -1 }; // デフォルトは新着順
    if (sortBy === 'price-low') {
      sortOptions = { price: 1 };
    } else if (sortBy === 'price-high') {
      sortOptions = { price: -1 };
    } else if (sortBy === 'popular') {
      // TODO: 人気順のロジックを実装（例：閲覧数、いいね数など）
      sortOptions = { createdAt: -1 }; // 現時点では新着順にフォールバック
    }

    // 総数を取得
    const total = await Product.countDocuments(query);

    // データベースクエリを実行
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
    // エラー発生時にリクエストのURLもログに出力するとデバッグが容易になる
    console.error(`Get products error for URL: ${request.url}`, error);
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

    // Zodでバリデーション
    const validationResult = ProductPostSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '入力データが無効です', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { sellerId, ...productData } = validationResult.data;

    // 認証されたユーザーIDとsellerIdが一致するか確認
    if (sellerId !== `user-${userId}`) {
      return NextResponse.json(
        { error: '不正なリクエストです' },
        { status: 403 }
      );
    }

    // 商品を作成
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
    // POSTリクエストではボディの内容もログに出力すると役立つ場合がある（個人情報に注意）
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: '商品の出品に失敗しました' },
      { status: 500 }
    );
  }
}
