import type { Metadata } from 'next';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { getSEOSettings, getSiteSettings, getContactSettings, getSocialSettings } from '@/lib/get-settings';
import { buildHubMetadata } from '@/lib/seo/metadata';
import InternalLinkCluster from '@/components/seo/InternalLinkCluster';
import { getHubInternalLinks } from '@/lib/seo/internal-links';
import { JsonLd, generateBreadcrumbSchema, generateItemListSchema } from '@/components/seo/JsonLd';
import LandingHeroImage from '@/components/seo/LandingHeroImage';

export const revalidate = 1800; // 30 minutes

export async function generateMetadata(): Promise<Metadata> {
  const [site, seo, contact, social] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    getSocialSettings(),
  ]);

  return buildHubMetadata({
    contact,
    description: 'Khám phá toàn bộ tính năng của hệ thống',
    pathname: '/features',
    seo,
    site,
    social,
    title: 'Tính năng',
  });
}

export default async function FeaturesPage() {
  const client = getConvexClient();
  const result = await client.query(api.landingPages.listPublishedByType, {
    landingType: 'feature',
    paginationOpts: { cursor: null, numItems: 50 },
  });
  const features = result.page;

  const site = await getSiteSettings();
  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';
  const itemListSchema = generateItemListSchema({
    items: features.map((feature) => ({
      name: feature.title,
      url: `${baseUrl}/features/${feature.slug}`,
    })),
    name: 'Tính năng nổi bật',
    url: `${baseUrl}/features`,
  });
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Trang chủ', url: baseUrl },
    { name: 'Tính năng', url: `${baseUrl}/features` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      {features.length > 0 && <JsonLd data={itemListSchema} />}
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Tính năng</h1>
        <p className="text-xl text-slate-600 mb-12">
          Khám phá toàn bộ tính năng của hệ thống
        </p>

        {features.length === 0 ? (
          <p className="text-slate-500">Chưa có tính năng nào.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <a
                key={feature._id}
                href={`${baseUrl}/features/${feature.slug}`}
                className="block border rounded-lg p-6 hover:border-primary transition-colors"
              >
                {feature.heroImage && (
                  <LandingHeroImage alt={feature.title} src={feature.heroImage} />
                )}
                <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
                <p className="text-slate-600 text-sm line-clamp-3">
                  {feature.summary}
                </p>
              </a>
            ))}
          </div>
        )}

        <InternalLinkCluster links={getHubInternalLinks('features')} />
      </div>
    </>
  );
}
