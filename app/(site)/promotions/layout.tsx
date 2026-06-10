import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd, generateBreadcrumbSchema } from '@/components/seo/JsonLd';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import { getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { buildCanonicalUrl, buildMetadata, buildSeoContext } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const client = getConvexClient();
  const [site, seo, promotionsModule, social] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    client.query(api.admin.modules.getModuleByKey, { key: 'promotions' }),
    getSocialSettings(),
  ]);

  if (promotionsModule?.enabled === false) {
    const context = buildSeoContext(site, seo);
    return buildMetadata({
      context,
      description: 'Trang khuyến mãi hiện không khả dụng.',
      indexable: false,
      title: 'Không tìm thấy khuyến mãi',
      twitterCreator: social.social_twitter,
      twitterSite: social.social_twitter,
    });
  }

  const context = buildSeoContext(site, seo);
  const title = 'Khuyến mãi';
  const description = `Khuyến mãi mới nhất từ ${site.site_name || context.siteName}`;

  return buildMetadata({
    canonical: buildCanonicalUrl(context.baseUrl, '/promotions'),
    context,
    description,
    indexable: true,
    title,
    twitterCreator: social.social_twitter,
    twitterSite: social.social_twitter,
  });
}

export default async function PromotionsLayout({ children }: { children: React.ReactNode }) {
  const client = getConvexClient();
  const promotionsModule = await client.query(api.admin.modules.getModuleByKey, { key: 'promotions' });

  if (promotionsModule?.enabled === false) {
    notFound();
  }
  const site = await getSiteSettings();
  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Trang chủ', url: baseUrl },
    { name: 'Khuyến mãi', url: `${baseUrl}/promotions` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  );
}
