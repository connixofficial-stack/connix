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
  const [posts, categories] = await Promise.all([
    collectPaginated((cursor) => client.query(api.posts.listPublished, {
      paginationOpts: { cursor, numItems: 500 },
    })),
    client.query(api.postCategories.listActive, {}),
  ]);
  const categoryMap = new Map(categories.map((category) => [category._id, category.slug]));

  const entries = posts.map((post) => ({
    changeFrequency: 'weekly' as const,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(post._creationTime),
    priority: 0.6,
    url: `${baseUrl}${buildDetailPath({
      categorySlug: categoryMap.get(post.categoryId),
      mode: 'unified',
      moduleKey: 'posts',
      recordSlug: post.slug,
    })}`,
  }));

  return new Response(buildSitemapXml(entries), {
    headers: { 'Content-Type': 'application/xml' },
  });
}
