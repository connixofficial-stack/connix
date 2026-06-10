import type { Metadata } from 'next';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { getSEOSettings, getSiteSettings, getContactSettings, getSocialSettings } from '@/lib/get-settings';
import { buildHubMetadata } from '@/lib/seo/metadata';
import InternalLinkCluster from '@/components/seo/InternalLinkCluster';
import { getHubInternalLinks } from '@/lib/seo/internal-links';
import { JsonLd, generateBreadcrumbSchema, generateItemListSchema } from '@/components/seo/JsonLd';
import LandingHeroImage from '@/components/seo/LandingHeroImage';

export const revalidate = 1800;

export async function generateMetadata(): Promise<Metadata> {
  const [site, seo, contact, social] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    getSocialSettings(),
  ]);
  return buildHubMetadata({
    contact,
    description: 'Hướng dẫn chi tiết và tài liệu hữu ích',
    pathname: '/guides',
    seo,
    site,
    social,
    title: 'Hướng dẫn',
  });
}

export default async function GuidesPage() {
  const result = await getConvexClient().query(api.landingPages.listPublishedByType, { landingType: 'guide', paginationOpts: { cursor: null, numItems: 50 } });
  const site = await getSiteSettings();
  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';
  const itemListSchema = generateItemListSchema({
    items: result.page.map((item) => ({
      name: item.title,
      url: `${baseUrl}/guides/${item.slug}`,
    })),
    name: 'Hướng dẫn mới nhất',
    url: `${baseUrl}/guides`,
  });
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Trang chủ', url: baseUrl },
    { name: 'Hướng dẫn', url: `${baseUrl}/guides` },
  ]);
  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      {result.page.length > 0 && <JsonLd data={itemListSchema} />}
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Hướng dẫn</h1>
        <p className="text-xl text-slate-600 mb-12">Hướng dẫn chi tiết và tài liệu hữu ích</p>
        {result.page.length === 0 ? <p className="text-slate-500">Chưa có dữ liệu.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.page.map((item) => (
              <a key={item._id} href={`${baseUrl}/guides/${item.slug}`} className="block border rounded-lg p-6 hover:border-primary transition-colors">
                {item.heroImage && <LandingHeroImage alt={item.title} src={item.heroImage} />}
                <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                <p className="text-slate-600 text-sm line-clamp-3">{item.summary}</p>
              </a>
            ))}
          </div>
        )}
        <InternalLinkCluster links={getHubInternalLinks('guides')} />
      </div>
    </>
  );
}
