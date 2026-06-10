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
  const [site, seo, contact, productsModule, social] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    client.query(api.admin.modules.getModuleByKey, { key: 'products' }),
    getSocialSettings(),
  ]);
  const moduleEnabled = Boolean(productsModule?.enabled);

  if (!moduleEnabled) {
    return buildSeoMetadata({
      contact,
      descriptionOverride: 'Trang sản phẩm hiện không khả dụng.',
      moduleEnabled: false,
      pathname: '/products',
      routeType: 'list',
      seo,
      site,
      social,
      titleOverride: 'Không tìm thấy sản phẩm',
      useTitleTemplate: true,
    });
  }

  return buildSeoMetadata({
    contact,
    descriptionOverride: seo.seo_description || `Danh sách sản phẩm từ ${site.site_name}`,
    moduleEnabled,
    pathname: '/products',
    routeType: 'list',
    seo,
    site,
    social,
    titleOverride: 'Sản phẩm',
    useTitleTemplate: true,
  });
}

export default async function ProductsListLayout({ children }: { children: React.ReactNode }) {
  const client = getConvexClient();
  const productsModule = await client.query(api.admin.modules.getModuleByKey, { key: 'products' });

  if (!productsModule?.enabled) {
    notFound();
  }
  const site = await getSiteSettings();
  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';
  const [products, categories] = await Promise.all([
    client.query(api.products.listPublishedWithOffset, {
      limit: 20,
      offset: 0,
      sortBy: 'newest',
    }),
    client.query(api.productCategories.listActive, {}),
  ]);
  const categoryMap = new Map(categories.map((category) => [category._id, category.slug]));

  const itemListSchema = generateItemListSchema({
    items: products.map((product) => ({
      name: product.name,
      url: `${baseUrl}${buildDetailPath({
        categorySlug: categoryMap.get(product.categoryId),
        mode: 'unified',
        moduleKey: 'products',
        recordSlug: product.slug,
      })}`,
    })),
    name: 'Sản phẩm mới nhất',
    url: `${baseUrl}/products`,
  });

  return (
    <>
      {products.length > 0 && <JsonLd data={itemListSchema} />}
      {children}
    </>
  );
}
