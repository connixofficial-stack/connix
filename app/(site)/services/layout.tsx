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
  const [site, seo, contact, servicesModule, social] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    client.query(api.admin.modules.getModuleByKey, { key: 'services' }),
    getSocialSettings(),
  ]);
  const moduleEnabled = Boolean(servicesModule?.enabled);

  if (!moduleEnabled) {
    return buildSeoMetadata({
      contact,
      descriptionOverride: 'Trang dịch vụ hiện không khả dụng.',
      moduleEnabled: false,
      pathname: '/services',
      routeType: 'list',
      seo,
      site,
      social,
      titleOverride: 'Không tìm thấy dịch vụ',
      useTitleTemplate: true,
    });
  }

  return buildSeoMetadata({
    contact,
    descriptionOverride: seo.seo_description || `Danh sách dịch vụ từ ${site.site_name}`,
    moduleEnabled,
    pathname: '/services',
    routeType: 'list',
    seo,
    site,
    social,
    titleOverride: 'Dịch vụ',
    useTitleTemplate: true,
  });
}

export default async function ServicesListLayout({ children }: { children: React.ReactNode }) {
  const client = getConvexClient();
  const servicesModule = await client.query(api.admin.modules.getModuleByKey, { key: 'services' });

  if (!servicesModule?.enabled) {
    notFound();
  }
  const site = await getSiteSettings();
  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';
  const [services, categories] = await Promise.all([
    client.query(api.services.listPublishedWithOffset, {
      limit: 20,
      offset: 0,
      sortBy: 'newest',
    }),
    client.query(api.serviceCategories.listActive, {}),
  ]);
  const categoryMap = new Map(categories.map((category) => [category._id, category.slug]));

  const itemListSchema = generateItemListSchema({
    items: services.map((service) => ({
      name: service.title,
      url: `${baseUrl}${buildDetailPath({
        categorySlug: categoryMap.get(service.categoryId),
        mode: 'unified',
        moduleKey: 'services',
        recordSlug: service.slug,
      })}`,
    })),
    name: 'Dịch vụ mới nhất',
    url: `${baseUrl}/services`,
  });

  return (
    <>
      {services.length > 0 && <JsonLd data={itemListSchema} />}
      {children}
    </>
  );
}
