import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { collectPaginated } from '@/lib/seo/sitemap';
import { buildSitemapXml, resolveBaseUrl } from '@/lib/seo/sitemap-xml';

const LANDING_TYPE_ROUTES: Record<string, string> = {
  feature: '/features',
  'use-case': '/use-cases',
  solution: '/solutions',
  compare: '/compare',
  integration: '/integrations',
  template: '/templates',
  guide: '/guides',
};

export async function GET(): Promise<Response> {
  const baseUrl = await resolveBaseUrl();
  if (!baseUrl) {
    return new Response(buildSitemapXml([]), {
      headers: { 'Content-Type': 'application/xml' },
    });
  }

  const client = getConvexClient();
  const landingPages = await collectPaginated((cursor) => client.query(api.landingPages.listAllPublished, {
    paginationOpts: { cursor, numItems: 500 },
  }));

  const entries = landingPages.map((page) => {
    const basePath = LANDING_TYPE_ROUTES[page.landingType] || '/features';
    return {
      changeFrequency: 'weekly' as const,
      lastModified: new Date(page.updatedAt),
      priority: 0.7,
      url: `${baseUrl}${basePath}/${page.slug}`,
    };
  });

  return new Response(buildSitemapXml(entries), {
    headers: { 'Content-Type': 'application/xml' },
  });
}
