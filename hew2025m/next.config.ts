import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // isomorphic-dompurify → jsdom → html-encoding-sniffer → @exodus/bytes (ESM-only)
  // この依存チェーンをバンドルに含めないようにする（サーバー側では使用しない）
  serverExternalPackages: ['isomorphic-dompurify', 'jsdom'],

  turbopack: {},

  images: {
    qualities: [75, 90],
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.firebasestorage.app' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'thumbnail.image.rakuten.co.jp' },
      { protocol: 'https', hostname: 'image.rakuten.co.jp' },
      { protocol: 'https', hostname: 'tshop.r10s.jp' },
      { protocol: 'https', hostname: 'item.rakuten.co.jp' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'openweathermap.org' }
    ],
    localPatterns: [
      { pathname: '/category/**' },
      { pathname: '/community/**' },
      { pathname: '/back/**' },
    ],
  },

  async headers() {
    // 本番環境ではnonceを使用したCSPが理想的ですが、
    // Next.jsとTailwind CSSの互換性のため、style-srcにunsafe-inlineを残しています
    // script-srcのunsafe-inlineは開発時のHot Reloadに必要
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://js.stripe.com https://www.googletagmanager.com https://maps.googleapis.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              img-src 'self' blob: data: https:;
              font-src 'self' https://fonts.gstatic.com;
              frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.firebaseapp.com https://accounts.google.com;
              connect-src 'self' https: wss:;
              worker-src 'self' blob:;
            `.replace(/\s{2,}/g, ' ').trim(),
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Firebase signInWithPopup がクロスオリジンポップアップの
            // window.closed を参照できるようにする
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'mongoose': 'commonjs mongoose',
        'mongodb': 'commonjs mongodb',
      });
    }
    return config;
  },
};

export default nextConfig;
