import type { MetadataRoute } from 'next';
import { resolveSiteUrl } from '@/lib/seo/site-url';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await resolveSiteUrl();

  // Policy cứng: disallow theo route-policy contract
  const sitemapUrls = baseUrl
    ? [
        `${baseUrl}/sitemap.xml`,
      ]
    : undefined;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/system/',
          '/api/',
          '/account/',
          '/cart/',
          '/checkout/',
          '/wishlist/',
        ],
      },
    ],
    ...(sitemapUrls ? { sitemap: sitemapUrls } : {}),
  };
}
