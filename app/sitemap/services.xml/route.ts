import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { collectPaginated } from '@/lib/seo/sitemap';
import { buildSitemapXml, resolveBaseUrl } from '@/lib/seo/sitemap-xml';
import { buildDetailPath } from '@/lib/ia/route-mode';

export async function GET(): Promise<Response> {
  const baseUrl = await resolveBaseUrl();
  if (!baseUrl) {
    return new Response(buildSitemapXml([]), {
      headers: { 'Content-Type': 'application/xml' },
    });
  }

  const client = getConvexClient();
  const [services, categories] = await Promise.all([
    collectPaginated((cursor) => client.query(api.services.listPublished, {
      paginationOpts: { cursor, numItems: 500 },
    })),
    client.query(api.serviceCategories.listActive, {}),
  ]);
  const categoryMap = new Map(categories.map((category) => [category._id, category.slug]));

  const entries = services.map((service) => ({
    changeFrequency: 'monthly' as const,
    lastModified: service.publishedAt ? new Date(service.publishedAt) : new Date(service._creationTime),
    priority: 0.7,
    url: `${baseUrl}${buildDetailPath({
      categorySlug: categoryMap.get(service.categoryId),
      mode: 'unified',
      moduleKey: 'services',
      recordSlug: service.slug,
    })}`,
  }));

  return new Response(buildSitemapXml(entries), {
    headers: { 'Content-Type': 'application/xml' },
  });
}
