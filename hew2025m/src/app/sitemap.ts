import { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Post from '@/models/Post';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://turimachi.vercel.app';

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/product-list`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/post-list`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // 動的ページ（商品詳細）
  let productPages: MetadataRoute.Sitemap = [];
  try {
    await dbConnect();
    const products = await Product.find({ status: 'available' })
      .select('_id updatedAt')
      .sort({ updatedAt: -1 })
      .limit(1000)
      .lean();

    productPages = products.map((product) => ({
      url: `${baseUrl}/product-detail/${product._id}`,
      lastModified: product.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Sitemap: Failed to fetch products', error);
  }

  // 動的ページ（投稿詳細）
  let postPages: MetadataRoute.Sitemap = [];
  try {
    await dbConnect();
    const posts = await Post.find({})
      .select('_id updatedAt')
      .sort({ updatedAt: -1 })
      .limit(1000)
      .lean();

    postPages = posts.map((post) => ({
      url: `${baseUrl}/post-detail/${post._id}`,
      lastModified: post.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Sitemap: Failed to fetch posts', error);
  }

  return [...staticPages, ...productPages, ...postPages];
}
