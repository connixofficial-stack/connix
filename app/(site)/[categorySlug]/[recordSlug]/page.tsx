import { notFound } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import ProductDetailPage from './_components/ProductDetailPage';
import PostDetailPage from './_components/PostDetailPage';
import ServiceDetailPage from './_components/ServiceDetailPage';
import CourseDetailPage from '@/app/(site)/_components/courses/CourseDetailPage';
import ResourceDetailPage from '@/app/(site)/_components/resources/ResourceDetailPage';
import ProjectDetailPage from '@/app/(site)/projects/[slug]/page';

interface Props {
  params: Promise<{ categorySlug: string; recordSlug: string }>;
}

export default async function UnifiedDetailPage({ params }: Props) {
  const { categorySlug, recordSlug } = await params;
  const client = getConvexClient();
  const resolvedDetail = await client.query(api.ia.resolveUnifiedDetail, { categorySlug, recordSlug });

  if (!resolvedDetail) {
    notFound();
  }

  if (resolvedDetail.moduleKey === 'products') {
    return <ProductDetailPage params={Promise.resolve({ slug: resolvedDetail.recordSlug })} />;
  }
  if (resolvedDetail.moduleKey === 'services') {
    return <ServiceDetailPage params={Promise.resolve({ slug: resolvedDetail.recordSlug })} />;
  }
  if (resolvedDetail.moduleKey === 'posts') {
    return <PostDetailPage params={Promise.resolve({ slug: resolvedDetail.recordSlug })} />;
  }
  if (resolvedDetail.moduleKey === 'courses') {
    return <CourseDetailPage params={Promise.resolve({ slug: resolvedDetail.recordSlug })} />;
  }
  if (resolvedDetail.moduleKey === 'resources') {
    return <ResourceDetailPage params={Promise.resolve({ slug: resolvedDetail.recordSlug })} />;
  }
  if (resolvedDetail.moduleKey === 'projects') {
    return <ProjectDetailPage params={Promise.resolve({ slug: resolvedDetail.recordSlug })} />;
  }

  notFound();
}
