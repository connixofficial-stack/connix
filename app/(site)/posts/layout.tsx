import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd, generateItemListSchema } from '@/components/seo/JsonLd';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import { getContactSettings, getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { buildSeoMetadata } from '@/lib/seo/metadata';
import { buildDetailPath } from '@/lib/ia/route-mode';

export async function generateMetadata(): Promise<Metadata> {
  const client = getConvexClient();
  const [site, seo, contact, postsModule, social] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    client.query(api.admin.modules.getModuleByKey, { key: 'posts' }),
    getSocialSettings(),
  ]);
  const moduleEnabled = Boolean(postsModule?.enabled);

  if (!moduleEnabled) {
    return buildSeoMetadata({
      contact,
      descriptionOverride: 'Trang bài viết hiện không khả dụng.',
      moduleEnabled: false,
      pathname: '/posts',
      routeType: 'list',
      seo,
      site,
      social,
      titleOverride: 'Không tìm thấy bài viết',
      useTitleTemplate: true,
    });
  }

  return buildSeoMetadata({
    contact,
    descriptionOverride: seo.seo_description || `Danh sách bài viết từ ${site.site_name}`,
    moduleEnabled,
    pathname: '/posts',
    routeType: 'list',
    seo,
    site,
    social,
    titleOverride: 'Bài viết',
    useTitleTemplate: true,
  });
}

export default async function PostsListLayout({ children }: { children: React.ReactNode }) {
  const client = getConvexClient();
  const postsModule = await client.query(api.admin.modules.getModuleByKey, { key: 'posts' });

  if (!postsModule?.enabled) {
    notFound();
  }
  const site = await getSiteSettings();
  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';
  const [posts, categories] = await Promise.all([
    client.query(api.posts.listPublishedWithOffset, {
      limit: 20,
      offset: 0,
      sortBy: 'newest',
    }),
    client.query(api.postCategories.listActive, {}),
  ]);
  const categoryMap = new Map(categories.map((category) => [category._id, category.slug]));

  const itemListSchema = generateItemListSchema({
    items: posts.map((post) => ({
      name: post.title,
      url: `${baseUrl}${buildDetailPath({
        categorySlug: categoryMap.get(post.categoryId),
        mode: 'unified',
        moduleKey: 'posts',
        recordSlug: post.slug,
      })}`,
    })),
    name: 'Bài viết mới nhất',
    url: `${baseUrl}/posts`,
  });

  return (
    <>
      {posts.length > 0 && <JsonLd data={itemListSchema} />}
      {children}
    </>
  );
}
