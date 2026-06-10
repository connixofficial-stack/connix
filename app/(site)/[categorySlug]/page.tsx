import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import { getContactSettings, getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { buildSeoMetadata } from '@/lib/seo/metadata';
import ProductsPage from '@/app/(site)/products/page';
import PostsPage from '@/app/(site)/posts/page';
import ServicesPage from '@/app/(site)/services/page';
import CoursesPage from '@/app/(site)/khoa-hoc/page';
import ProjectsPage from '@/app/(site)/projects/page';
import ResourcesPage from '@/app/(site)/resources/page';

interface Props {
  params: Promise<{ categorySlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const client = getConvexClient();
  const [site, seo, contact, social, resolvedCategory] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    getSocialSettings(),
    client.query(api.ia.resolveUnifiedCategory, { slug: categorySlug }),
  ]);

  if (!resolvedCategory) {
    return buildSeoMetadata({
      contact,
      descriptionOverride: 'Không tìm thấy danh mục phù hợp.',
      entityExists: false,
      pathname: `/${categorySlug}`,
      routeType: 'list',
      seo,
      site,
      social,
      titleOverride: 'Không tìm thấy danh mục',
      useTitleTemplate: true,
    });
  }

  const canonicalPath = `/${resolvedCategory.categorySlug}`;

  return buildSeoMetadata({
    contact,
    descriptionOverride: resolvedCategory.categoryDescription || seo.seo_description,
    pathname: canonicalPath,
    routeType: 'list',
    seo,
    site,
    social,
    titleOverride: resolvedCategory.categoryName,
    useTitleTemplate: true,
  });
}

export default async function UnifiedCategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const client = getConvexClient();
  const resolvedCategory = await client.query(api.ia.resolveUnifiedCategory, { slug: categorySlug });

  if (!resolvedCategory) {
    notFound();
  }

  if (resolvedCategory.moduleKey === 'products') {
    return <ProductsPage />;
  }
  if (resolvedCategory.moduleKey === 'services') {
    return <ServicesPage />;
  }
  if (resolvedCategory.moduleKey === 'posts') {
    return <PostsPage />;
  }
  if (resolvedCategory.moduleKey === 'courses') {
    return <CoursesPage />;
  }
  if (resolvedCategory.moduleKey === 'projects') {
    return <ProjectsPage />;
  }
  if (resolvedCategory.moduleKey === 'resources') {
    return <ResourcesPage />;
  }

  notFound();
}
