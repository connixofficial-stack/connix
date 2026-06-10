import type { Metadata } from 'next';
import { JsonLd, generateBreadcrumbSchema } from '@/components/seo/JsonLd';
import { getContactSettings, getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { buildCanonicalUrl, buildMetadata, buildSeoContext } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [site, seo, social] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getSocialSettings(),
  ]);

  const context = buildSeoContext(site, seo);
  const title = 'Liên hệ';
  const description = `Liên hệ với ${site.site_name || context.siteName} - Chúng tôi luôn sẵn sàng hỗ trợ bạn`;

  return buildMetadata({
    canonical: buildCanonicalUrl(context.baseUrl, '/contact'),
    context,
    description,
    indexable: true,
    title,
    twitterCreator: social.social_twitter,
    twitterSite: social.social_twitter,
  });
}

export default async function ContactLayout({ children }: { children: React.ReactNode }) {
  const [site, contact] = await Promise.all([
    getSiteSettings(),
    getContactSettings(),
  ]);
  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';

  const contactPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Liên hệ ${site.site_name}`,
    url: `${baseUrl}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: site.site_name,
      url: baseUrl,
      ...(contact.contact_email && { email: contact.contact_email }),
      ...(contact.contact_phone && { telephone: contact.contact_phone }),
      ...(contact.contact_address && {
        address: {
          '@type': 'PostalAddress',
          streetAddress: contact.contact_address,
        },
      }),
    },
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Trang chủ', url: baseUrl },
    { name: 'Liên hệ', url: `${baseUrl}/contact` },
  ]);

  return (
    <>
      <JsonLd data={contactPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  );
}
