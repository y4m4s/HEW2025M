import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { getCachedUserInfoBatch } from '@/lib/userCache';
import ProductListClient from './ProductListClient';
import type { Product as ProductType } from '@/components/products/ProductCard';

// 状態を日本語に変換
function formatCondition(cond: string): string {
  const conditionMap: Record<string, string> = {
    'new': '新品・未使用',
    'like-new': '未使用に近い',
    'good': '目立った傷汚れなし',
    'fair': 'やや傷や汚れあり',
    'poor': '傷や汚れあり'
  };
  return conditionMap[cond] || cond;
}

// 日付をフォーマット
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今日';
  } else if (diffDays === 1) {
    return '昨日';
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}

interface SearchParams {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  shippingPayer?: string;
  sortBy?: string;
}

// サーバーサイドでデータを取得
async function getProducts(searchParams: SearchParams): Promise<{
  products: ProductType[];
  total: number;
  hasMore: boolean;
}> {
  try {
    await dbConnect();

    // クエリ構築
    const query: Record<string, unknown> = {};

    if (searchParams.category) {
      query.category = searchParams.category;
    }
    if (searchParams.shippingPayer) {
      query.shippingPayer = searchParams.shippingPayer;
    }

    // 価格フィルター
    if (searchParams.minPrice || searchParams.maxPrice) {
      const priceQuery: { $gte?: number; $lte?: number } = {};
      if (searchParams.minPrice) {
        priceQuery.$gte = parseInt(searchParams.minPrice);
      }
      if (searchParams.maxPrice) {
        priceQuery.$lte = parseInt(searchParams.maxPrice);
      }
      query.price = priceQuery;
    }

    // ソート条件の構築
    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (searchParams.sortBy === 'price-low') {
      sortOptions = { price: 1 };
    } else if (searchParams.sortBy === 'price-high') {
      sortOptions = { price: -1 };
    }

    const limit = 12;

    // 総数と商品を並列で取得（Promise.all）
    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .sort(sortOptions)
        .limit(limit)
        .lean()
    ]);

    if (products.length === 0) {
      return { products: [], total: 0, hasMore: false };
    }

    // 出品者IDのユニークなリストを作成
    const sellerIds = [...new Set(products.map(p => p.sellerId))] as string[];

    // キャッシュ付きバッチ取得で出品者情報を取得
    const sellerInfoMap = await getCachedUserInfoBatch(sellerIds);

    // 商品情報をフォーマット
    const formattedProducts: ProductType[] = products.map((product) => {
      const sellerInfo = sellerInfoMap.get(product.sellerId) || {
        displayName: '出品者',
        photoURL: null,
      };

      return {
        id: product._id.toString(),
        name: product.title,
        price: product.price,
        location: sellerInfo.displayName || '出品者未設定',
        condition: formatCondition(product.condition),
        postedDate: formatDate(product.createdAt.toISOString()),
        imageUrl: product.images?.[0],
        status: product.status,
        sellerPhotoURL: sellerInfo.photoURL || undefined,
        sellerId: product.sellerId,
      };
    });

    return {
      products: formattedProducts,
      total,
      hasMore: products.length < total
    };
  } catch (error) {
    console.error('商品取得エラー:', error);
    return { products: [], total: 0, hasMore: false };
  }
}

// Server Component
export default async function ProductListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { products, total, hasMore } = await getProducts(params);

  return (
    <ProductListClient
      initialProducts={products}
      initialTotal={total}
      initialHasMore={hasMore}
    />
  );
}
