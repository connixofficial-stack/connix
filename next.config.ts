import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['onnxruntime-web'],
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    'lexical',
    '@lexical/react',
    '@lexical/html',
    '@lexical/link',
    '@lexical/list',
    '@lexical/rich-text',
    '@lexical/selection',
  ],
  experimental: {
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: true,
  },
  htmlLimitedBots: /bingbot|BingPreview|msnbot|Google-Site-Verification|Googlebot/i,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 24, 32, 36, 48, 64, 80, 96, 128, 160, 200, 240, 320, 480],
    remotePatterns: [
      {
        hostname: '*.convex.cloud',
        protocol: 'https',
      },
      {
        hostname: '*.convex.site',
        protocol: 'https',
      },
      {
        hostname: 'images.unsplash.com',
        protocol: 'https',
      },
      {
        hostname: 'picsum.photos',
        protocol: 'https',
      },
      {
        hostname: 'api.dicebear.com',
        protocol: 'https',
      },
      {
        hostname: 'www.youtube.com',
        protocol: 'https',
      },
      {
        hostname: 'i.ytimg.com',
        protocol: 'https',
      },
      {
        hostname: 'img.youtube.com',
        protocol: 'https',
      },
      {
        hostname: 'bizweb.dktcdn.net',
        protocol: 'https',
      },
      {
        hostname: 'sapo.dktcdn.net',
        protocol: 'https',
      },
      {
        hostname: '*.dktcdn.net',
        protocol: 'https',
      },
      {
        hostname: 'i.pravatar.cc',
        protocol: 'https',
      },
    ],
  },
};

export default nextConfig;
