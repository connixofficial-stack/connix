import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { getContactSettings, getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { JsonLd, generateArticleSchema, generateBreadcrumbSchema } from '@/components/seo/JsonLd';
import { buildSeoMetadata } from '@/lib/seo/metadata';
import { buildDetailPath } from '@/lib/ia/route-mode';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const client = getConvexClient();

  const postsModule = await client.query(api.admin.modules.getModuleByKey, { key: 'posts' });
  if (postsModule?.enabled === false) {
    const [site, seo, contact, social] = await Promise.all([
      getSiteSettings(),
      getSEOSettings(),
      getContactSettings(),
      getSocialSettings(),
    ]);
    return buildSeoMetadata({
      contact,
      descriptionOverride: 'Trang bài viết hiện không khả dụng.',
      moduleEnabled: false,
      pathname: `/posts/${slug}`,
      routeType: 'detail',
      seo,
      site,
      social,
      titleOverride: 'Không tìm thấy bài viết',
    });
  }
  
  const [post, site, seo, contact, social] = await Promise.all([
    client.query(api.posts.getBySlug, { slug }),
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    getSocialSettings(),
  ]);

  if (!post) {
    return buildSeoMetadata({
      contact,
      descriptionOverride: 'Bài viết này không tồn tại hoặc đã bị xóa.',
      entityExists: false,
      pathname: `/posts/${slug}`,
      routeType: 'detail',
      seo,
      site,
      social,
      titleOverride: 'Không tìm thấy bài viết',
    });
  }

  const category = await client.query(api.postCategories.getById, { id: post.categoryId });
  const canonicalPath = buildDetailPath({
    categorySlug: category?.slug,
    mode: 'unified',
    moduleKey: 'posts',
    recordSlug: post.slug,
  });

  return buildSeoMetadata({
    contact,
    entity: {
      content: post.content,
      excerpt: post.excerpt,
      metaDescription: post.metaDescription,
      metaTitle: post.metaTitle,
      thumbnail: post.thumbnail,
      title: post.title,
    },
    entityExists: true,
    openGraphType: 'article',
    pathname: canonicalPath,
    routeType: 'detail',
    seo,
    site,
    social,
  });
}

export default async function PostLayout({ params, children }: Props) {
  const { slug } = await params;
  const client = getConvexClient();

  const postsModule = await client.query(api.admin.modules.getModuleByKey, { key: 'posts' });
  if (postsModule?.enabled === false) {
    notFound();
  }

  const [post, site, seo] = await Promise.all([
    client.query(api.posts.getBySlug, { slug }),
    getSiteSettings(),
    getSEOSettings(),
  ]);

  if (!post || post.status !== 'Published') {
    notFound();
  }

  const category = await client.query(api.postCategories.getById, { id: post.categoryId });
  if (category?.slug) {
    permanentRedirect(buildDetailPath({
      categorySlug: category.slug,
      mode: 'unified',
      moduleKey: 'posts',
      recordSlug: post.slug,
    }));
  }

  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';
  const postPath = buildDetailPath({
    categorySlug: category?.slug,
    mode: 'unified',
    moduleKey: 'posts',
    recordSlug: post.slug,
  });
  const postUrl = `${baseUrl}${postPath}`;
  const image = post.thumbnail ?? seo.seo_og_image;

  const articleSchema = generateArticleSchema({
    description: (post.metaDescription ?? post.excerpt) ?? seo.seo_description,
    image,
    publishedAt: post.publishedAt,
    siteName: site.site_name,
    title: post.metaTitle ?? post.title,
    authorName: post.authorName,
    url: postUrl,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Trang chủ', url: baseUrl },
    {
      name: category?.name ?? 'Bài viết',
      url: category?.slug
        ? `${baseUrl}/${category.slug}`
        : `${baseUrl}/posts`,
    },
    { name: post.title, url: postUrl },
  ]);

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  );
}
