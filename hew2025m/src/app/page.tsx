import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { getCachedUserInfoBatch } from '@/lib/userCache';
import HomeClient from './HomeClient';
import type { Product as ProductType } from '@/components/products/ProductCard';
import { formatCondition, formatRelativeDate } from '@/lib/utils';

// ISR: 5分ごとに再生成
export const revalidate = 300;

// サーバーサイドでデータを取得
async function getFeaturedProducts(): Promise<ProductType[]> {
  try {
    await dbConnect();

    // 商品を取得（最新4件、販売中のみ）
    const products = await Product.find({ status: 'available' })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    if (products.length === 0) {
      return [];
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
        postedDate: formatRelativeDate(product.createdAt.toISOString()),
        imageUrl: product.images?.[0],
        sellerPhotoURL: sellerInfo.photoURL || undefined,
      };
    });

    return formattedProducts;
  } catch (error) {
    console.error('商品取得エラー:', error);
    return [];
  }
}

// Server Component
export default async function Home() {
  const products = await getFeaturedProducts();

  return <HomeClient initialProducts={products} />;
}
