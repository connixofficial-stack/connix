import type { Metadata } from 'next';
import { JsonLd, generateBreadcrumbSchema } from '@/components/seo/JsonLd';
import { getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { buildCanonicalUrl, buildMetadata, buildSeoContext } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [site, seo, social] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getSocialSettings(),
  ]);

  const context = buildSeoContext(site, seo);
  const title = 'Hệ thống cửa hàng';
  const description = `Danh sách cửa hàng ${site.site_name || context.siteName} - Tìm cửa hàng gần bạn nhất`;

  return buildMetadata({
    canonical: buildCanonicalUrl(context.baseUrl, '/stores'),
    context,
    description,
    indexable: true,
    title,
    twitterCreator: social.social_twitter,
    twitterSite: social.social_twitter,
  });
}

export default async function StoresLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteSettings();
  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Trang chủ', url: baseUrl },
    { name: 'Hệ thống cửa hàng', url: `${baseUrl}/stores` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  );
}
