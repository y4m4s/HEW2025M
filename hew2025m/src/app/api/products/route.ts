import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/simpleAuth';
import { ProductPostSchema } from '@/lib/schemas';
import { sanitizeUserInput } from '@/lib/sanitize';
import { getCachedUserInfoBatch } from '@/lib/userCache';

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
    const sortBy = searchParams.get('sortBy');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50); // 最大50件に制限

    const query: Record<string, unknown> = {};
    if (category) {
      query.category = category;
    }
    if (sellerId) {
      query.sellerId = sellerId;
    }
    if (status) {
      query.status = status;
    }

    // ソート条件の構築
    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 }; // デフォルトは新着順
    if (sortBy === 'price-low') {
      sortOptions = { price: 1 };
    } else if (sortBy === 'price-high') {
      sortOptions = { price: -1 };
    } else if (sortBy === 'popular') {
      sortOptions = { createdAt: -1 };
    }
    if (shippingPayer) {
      query.shippingPayer = shippingPayer;
    }

    // 価格帯フィルター
    if (minPrice || maxPrice) {
      const priceQuery: { $gte?: number; $lte?: number } = {};
      if (minPrice) {
        priceQuery.$gte = parseInt(minPrice);
      }
      if (maxPrice) {
        priceQuery.$lte = parseInt(maxPrice);
      }
      query.price = priceQuery;
    }

    // データベースクエリを実行
    const skip = (page - 1) * limit;

    // Promise.allで並列実行（Waterfall解消）
    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
    ]);

    // 出品者IDのユニークなリストを作成
    const sellerIds = [...new Set(products.map(p => p.sellerId))] as string[];

    // キャッシュ付きバッチ取得で出品者情報を取得
    // - キャッシュヒット時: メモリから即座に返却（~1ms）
    // - キャッシュミス時: Firestoreから取得してキャッシュに保存
    const sellerInfoMap = await getCachedUserInfoBatch(sellerIds);

    // 商品情報に出品者情報を追加
    const productsWithSellerInfo = products.map((product) => {
      const productObj = product.toObject();
      const sellerInfo = sellerInfoMap.get(product.sellerId) || {
        displayName: '出品者',
        photoURL: null,
      };

      return {
        ...productObj,
        sellerName: sellerInfo.displayName,
        sellerPhotoURL: sellerInfo.photoURL,
      };
    });

    // キャッシュヘッダー付きでレスポンスを返す
    return NextResponse.json({
      success: true,
      products: productsWithSellerInfo,
      pagination: {
        total,
        page,
        limit,
        hasMore: skip + products.length < total,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
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

    // 入力サニタイゼーション（XSS/インジェクション対策）
    const sanitizedBody = sanitizeUserInput(body);

    // Zodでバリデーション
    const validationResult = ProductPostSchema.safeParse(sanitizedBody);
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