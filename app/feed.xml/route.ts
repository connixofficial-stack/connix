import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import { getSEOSettings, getSiteSettings } from '@/lib/get-settings';
import { stripHtml, truncateText } from '@/lib/seo';
import { buildDetailPath } from '@/lib/ia/route-mode';

const escapeXml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

export async function GET(): Promise<Response> {
  const client = getConvexClient();
  const [site, seo, posts, categories] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    client.query(api.posts.listPublishedWithOffset, { limit: 50, offset: 0, sortBy: 'newest' }),
    client.query(api.postCategories.listActive, {}),
  ]);

  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  if (!baseUrl || baseUrl === 'https://example.com') {
    return new Response('', { status: 204 });
  }

  const title = seo.seo_title || site.site_name || 'Website';
  const description = seo.seo_description || site.site_tagline || '';

  const categoryMap = new Map(categories.map((category) => [category._id, category.slug]));

  const items = posts.map((post) => {
    const summary = post.metaDescription
      || post.excerpt
      || truncateText(stripHtml(post.content || ''), 160);
    const postUrl = `${baseUrl}${buildDetailPath({
      categorySlug: categoryMap.get(post.categoryId),
      mode: 'unified',
      moduleKey: 'posts',
      recordSlug: post.slug,
    })}`;
    const publishedAt = new Date(post.publishedAt ?? post._creationTime).toUTCString();

    return [
      '<item>',
      `<title>${escapeXml(post.metaTitle ?? post.title)}</title>`,
      `<link>${postUrl}</link>`,
      `<guid>${postUrl}</guid>`,
      `<pubDate>${publishedAt}</pubDate>`,
      summary ? `<description>${escapeXml(summary)}</description>` : '',
      '</item>',
    ].filter(Boolean).join('');
  }).join('');

  const rss = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '<channel>',
    `<title>${escapeXml(title)}</title>`,
    `<link>${baseUrl}</link>`,
    description ? `<description>${escapeXml(description)}</description>` : '',
    `<language>${site.site_language || 'vi'}</language>`,
    items,
    '</channel>',
    '</rss>',
  ].filter(Boolean).join('');

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
