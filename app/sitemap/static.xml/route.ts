import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { buildSitemapXml, resolveBaseUrl } from '@/lib/seo/sitemap-xml';

const resolveLatestTimestamp = (values: Array<number | undefined>): Date | undefined => {
  const normalized = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (normalized.length === 0) {
    return undefined;
  }
  return new Date(Math.max(...normalized));
};

export async function GET(): Promise<Response> {
  const baseUrl = await resolveBaseUrl();
  if (!baseUrl) {
    return new Response(buildSitemapXml([]), {
      headers: { 'Content-Type': 'application/xml' },
    });
  }

  const client = getConvexClient();
  const [latestPost, latestProduct, latestService, latestLanding] = await Promise.all([
    client.query(api.posts.listPublished, { paginationOpts: { cursor: null, numItems: 1 } }),
    client.query(api.products.listPublishedPaginated, { paginationOpts: { cursor: null, numItems: 1 }, sortBy: 'newest' }),
    client.query(api.services.listPublished, { paginationOpts: { cursor: null, numItems: 1 } }),
    client.query(api.landingPages.listAllPublished, { paginationOpts: { cursor: null, numItems: 1 } }),
  ]);

  const latestPostTimestamp = latestPost.page[0]?.publishedAt ?? latestPost.page[0]?._creationTime;
  const latestProductTimestamp = latestProduct.page[0]?._creationTime;
  const latestServiceTimestamp = latestService.page[0]?.publishedAt ?? latestService.page[0]?._creationTime;
  const latestLandingTimestamp = latestLanding.page[0]?.updatedAt;
  const fallbackTimestamp = resolveLatestTimestamp([
    latestPostTimestamp,
    latestProductTimestamp,
    latestServiceTimestamp,
    latestLandingTimestamp,
  ]);

  const entries = [
    {
      changeFrequency: 'daily' as const,
      lastModified: fallbackTimestamp,
      priority: 1,
      url: baseUrl,
    },
    {
      changeFrequency: 'weekly' as const,
      lastModified: latestLandingTimestamp ? new Date(latestLandingTimestamp) : fallbackTimestamp,
      priority: 0.7,
      url: `${baseUrl}/contact`,
    },
    {
      changeFrequency: 'daily' as const,
      lastModified: latestProductTimestamp ? new Date(latestProductTimestamp) : fallbackTimestamp,
      priority: 0.7,
      url: `${baseUrl}/promotions`,
    },
    {
      changeFrequency: 'monthly' as const,
      lastModified: fallbackTimestamp,
      priority: 0.6,
      url: `${baseUrl}/stores`,
    },
    {
      changeFrequency: 'weekly' as const,
      lastModified: latestLandingTimestamp ? new Date(latestLandingTimestamp) : fallbackTimestamp,
      priority: 0.8,
      url: `${baseUrl}/features`,
    },
    {
      changeFrequency: 'weekly' as const,
      lastModified: latestLandingTimestamp ? new Date(latestLandingTimestamp) : fallbackTimestamp,
      priority: 0.8,
      url: `${baseUrl}/use-cases`,
    },
    {
      changeFrequency: 'weekly' as const,
      lastModified: latestLandingTimestamp ? new Date(latestLandingTimestamp) : fallbackTimestamp,
      priority: 0.8,
      url: `${baseUrl}/solutions`,
    },
    {
      changeFrequency: 'weekly' as const,
      lastModified: latestLandingTimestamp ? new Date(latestLandingTimestamp) : fallbackTimestamp,
      priority: 0.7,
      url: `${baseUrl}/compare`,
    },
    {
      changeFrequency: 'weekly' as const,
      lastModified: latestLandingTimestamp ? new Date(latestLandingTimestamp) : fallbackTimestamp,
      priority: 0.7,
      url: `${baseUrl}/integrations`,
    },
    {
      changeFrequency: 'weekly' as const,
      lastModified: latestLandingTimestamp ? new Date(latestLandingTimestamp) : fallbackTimestamp,
      priority: 0.7,
      url: `${baseUrl}/templates`,
    },
    {
      changeFrequency: 'weekly' as const,
      lastModified: latestLandingTimestamp ? new Date(latestLandingTimestamp) : fallbackTimestamp,
      priority: 0.8,
      url: `${baseUrl}/guides`,
    },
  ];

  return new Response(buildSitemapXml(entries), {
    headers: { 'Content-Type': 'application/xml' },
  });
}
