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
  const [products, categories] = await Promise.all([
    collectPaginated((cursor) => client.query(api.products.listPublishedPaginated, {
      paginationOpts: { cursor, numItems: 500 },
      sortBy: 'newest',
    })),
    client.query(api.productCategories.listActive, {}),
  ]);
  const categoryMap = new Map(categories.map((category) => [category._id, category.slug]));

  const entries = products.map((product) => ({
    changeFrequency: 'weekly' as const,
    lastModified: new Date(product._creationTime),
    priority: 0.7,
    url: `${baseUrl}${buildDetailPath({
      categorySlug: categoryMap.get(product.categoryId),
      mode: 'unified',
      moduleKey: 'products',
      recordSlug: product.slug,
    })}`,
  }));

  return new Response(buildSitemapXml(entries), {
    headers: { 'Content-Type': 'application/xml' },
  });
}
