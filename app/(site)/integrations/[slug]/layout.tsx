import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { getContactSettings, getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { buildSeoMetadata } from '@/lib/seo/metadata';
import { buildArticleSchema, buildBreadcrumbSchema, buildFaqSchema } from '@/lib/seo/schema-policy';
import { JsonLd } from '@/components/seo/JsonLd';

export const revalidate = 3600;

interface Props { params: Promise<{ slug: string }>; children: React.ReactNode }
const LANDING_TYPE = 'integration' as const;
const ROUTE_PATH = '/integrations';
const BREADCRUMB_LABEL = 'Tích hợp';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [page, site, seo, contact, social] = await Promise.all([
    getConvexClient().query(api.landingPages.getBySlug, { slug }),
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    getSocialSettings(),
  ]);
  if (!page || page.landingType !== LANDING_TYPE) {
    return buildSeoMetadata({ contact, entityExists: false, pathname: `${ROUTE_PATH}/${slug}`, routeType: 'landing', seo, site, titleOverride: 'Không tìm thấy trang', social });
  }
  return buildSeoMetadata({ contact, entity: { content: page.content, heroImage: page.heroImage, summary: page.summary, title: page.title }, entityExists: true, openGraphType: 'article', pathname: `${ROUTE_PATH}/${page.slug}`, routeType: 'landing', seo, site, social });
}

export default async function IntegrationLayout({ params, children }: Props) {
  const { slug } = await params;
  const [page, site, seo] = await Promise.all([getConvexClient().query(api.landingPages.getBySlug, { slug }), getSiteSettings(), getSEOSettings()]);
  if (!page || page.landingType !== LANDING_TYPE) notFound();
  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';
  const pageUrl = `${baseUrl}${ROUTE_PATH}/${page.slug}`;
  const schemas = [
    buildArticleSchema({ description: page.summary, image: page.heroImage ?? seo.seo_og_image, publishedAt: page.publishedAt, siteName: site.site_name, title: page.title, updatedAt: page.updatedAt, url: pageUrl }),
    buildBreadcrumbSchema([{ name: 'Trang chủ', url: baseUrl }, { name: BREADCRUMB_LABEL, url: `${baseUrl}${ROUTE_PATH}` }, { name: page.title, url: pageUrl }]),
    ...(page.faqItems && page.faqItems.length > 0 ? [buildFaqSchema(page.faqItems)] : [])
  ];
  return <>{schemas.map((s, i) => <JsonLd key={i} data={s} />)}{children}</>;
}
