import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},   // 👈 Adicionado para resolver o erro

  images: {
    qualities: [75, 90],
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'thumbnail.image.rakuten.co.jp' },
      { protocol: 'https', hostname: 'image.rakuten.co.jp' },
      { protocol: 'https', hostname: 'tshop.r10s.jp' },
      { protocol: 'https', hostname: 'item.rakuten.co.jp' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
    localPatterns: [
      { pathname: '/uploads/**' },
      { pathname: '/avatars/**' },
    ],
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
