import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // サーバーサイドでmongooseを外部パッケージとして扱う
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
