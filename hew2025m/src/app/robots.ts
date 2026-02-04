import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://turimachi.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/profile/',
          '/message/',
          '/notification/',
          '/cart/',
          '/pay/',
          '/pay-check/',
          '/order-success/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
