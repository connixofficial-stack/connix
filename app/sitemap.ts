import type { MetadataRoute } from 'next';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { collectPaginated } from '@/lib/seo/sitemap';
import { resolveSiteUrl } from '@/lib/seo/site-url';
import { buildDetailPath } from '@/lib/ia/route-mode';
import { getIASettings } from '@/lib/ia/settings';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = getConvexClient();
  const baseUrl = await resolveSiteUrl();

  if (!baseUrl || baseUrl === 'https://example.com') {
    return [];
  }

  const resolveLatestTimestamp = (values: Array<number | undefined>): Date | undefined => {
    const normalized = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (normalized.length === 0) {
      return undefined;
    }
    return new Date(Math.max(...normalized));
  };

  const [iaSettings, posts, products, services, landingPages, postCategories, productCategories, serviceCategories] = await Promise.all([
    getIASettings(),
    collectPaginated((cursor) => client.query(api.posts.listPublished, {
      paginationOpts: { cursor, numItems: 500 },
    })),
    collectPaginated((cursor) => client.query(api.products.listPublishedPaginated, {
      paginationOpts: { cursor, numItems: 500 },
      sortBy: 'newest',
    })),
    collectPaginated((cursor) => client.query(api.services.listPublishedPaginated, {
      paginationOpts: { cursor, numItems: 500 },
      sortBy: 'newest',
    })),
    collectPaginated((cursor) => client.query(api.landingPages.listAllPublished, {
      paginationOpts: { cursor, numItems: 500 },
    })),
    client.query(api.postCategories.listActive, {}),
    client.query(api.productCategories.listActive, {}),
    client.query(api.serviceCategories.listActive, {}),
  ]);

  const latestPostTimestamp = resolveLatestTimestamp(posts.map((post) => post.publishedAt ?? post._creationTime));
  const latestProductTimestamp = resolveLatestTimestamp(products.map((product) => product._creationTime));
  const latestServiceTimestamp = resolveLatestTimestamp(services.map((service) => service.publishedAt ?? service._creationTime));
  const latestLandingTimestamp = resolveLatestTimestamp(landingPages.map((page) => page.updatedAt));
  const fallbackTimestamp = resolveLatestTimestamp([
    latestPostTimestamp?.getTime(),
    latestProductTimestamp?.getTime(),
    latestServiceTimestamp?.getTime(),
    latestLandingTimestamp?.getTime(),
  ]);

  const landingByType = landingPages.reduce<Record<string, number>>((acc, page) => {
    acc[page.landingType] = (acc[page.landingType] ?? 0) + 1;
    return acc;
  }, {});

  const hasLandingType = (type: string) => (landingByType[type] ?? 0) > 0;

  const buildHubEntry = (url: string, priority: number): MetadataRoute.Sitemap[number] => ({
    changeFrequency: 'weekly',
    lastModified: latestLandingTimestamp ?? fallbackTimestamp,
    priority,
    url,
  });

  const categoryHubs: MetadataRoute.Sitemap = [
    ...postCategories,
    ...productCategories,
    ...serviceCategories,
  ].map((category) => ({
    changeFrequency: 'weekly' as const,
    lastModified: fallbackTimestamp,
    priority: 0.8,
    url: `${baseUrl}/${category.slug}`,
  }));

  const staticWithFreshness: MetadataRoute.Sitemap = [
    {
      changeFrequency: 'daily',
      lastModified: fallbackTimestamp,
      priority: 1,
      url: baseUrl,
    },
    {
      changeFrequency: 'weekly',
      lastModified: latestLandingTimestamp ?? fallbackTimestamp,
      priority: 0.7,
      url: `${baseUrl}/contact`,
    },
    {
      changeFrequency: 'daily',
      lastModified: latestProductTimestamp ?? fallbackTimestamp,
      priority: 0.7,
      url: `${baseUrl}/promotions`,
    },
    {
      changeFrequency: 'monthly',
      lastModified: fallbackTimestamp,
      priority: 0.6,
      url: `${baseUrl}/stores`,
    },
    ...(iaSettings.pages.about ? [{ changeFrequency: 'monthly' as const, lastModified: fallbackTimestamp, priority: 0.5, url: `${baseUrl}/about` }] : []),
    ...(iaSettings.pages.terms ? [{ changeFrequency: 'monthly' as const, lastModified: fallbackTimestamp, priority: 0.4, url: `${baseUrl}/terms` }] : []),
    ...(iaSettings.pages.privacy ? [{ changeFrequency: 'monthly' as const, lastModified: fallbackTimestamp, priority: 0.4, url: `${baseUrl}/privacy` }] : []),
    ...(iaSettings.pages.returnPolicy ? [{ changeFrequency: 'monthly' as const, lastModified: fallbackTimestamp, priority: 0.4, url: `${baseUrl}/return-policy` }] : []),
    ...(iaSettings.pages.shipping ? [{ changeFrequency: 'monthly' as const, lastModified: fallbackTimestamp, priority: 0.4, url: `${baseUrl}/shipping` }] : []),
    ...(iaSettings.pages.payment ? [{ changeFrequency: 'monthly' as const, lastModified: fallbackTimestamp, priority: 0.4, url: `${baseUrl}/payment` }] : []),
    ...(iaSettings.pages.faq ? [{ changeFrequency: 'weekly' as const, lastModified: fallbackTimestamp, priority: 0.5, url: `${baseUrl}/faq` }] : []),
    ...(hasLandingType('feature') ? [buildHubEntry(`${baseUrl}/features`, 0.8)] : []),
    ...(hasLandingType('use-case') ? [buildHubEntry(`${baseUrl}/use-cases`, 0.8)] : []),
    ...(hasLandingType('solution') ? [buildHubEntry(`${baseUrl}/solutions`, 0.8)] : []),
    ...(hasLandingType('compare') ? [buildHubEntry(`${baseUrl}/compare`, 0.7)] : []),
    ...(hasLandingType('integration') ? [buildHubEntry(`${baseUrl}/integrations`, 0.7)] : []),
    ...(hasLandingType('template') ? [buildHubEntry(`${baseUrl}/templates`, 0.7)] : []),
    ...(hasLandingType('guide') ? [buildHubEntry(`${baseUrl}/guides`, 0.8)] : []),
  ];

  const postCategoryMap = new Map(postCategories.map((category) => [category._id, category.slug]));
  const productCategoryMap = new Map(productCategories.map((category) => [category._id, category.slug]));
  const serviceCategoryMap = new Map(serviceCategories.map((category) => [category._id, category.slug]));

  const postUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    changeFrequency: 'weekly' as const,
    ...(post.publishedAt && { lastModified: new Date(post.publishedAt) }),
    priority: 0.6,
    url: `${baseUrl}${buildDetailPath({
      categorySlug: postCategoryMap.get(post.categoryId),
      mode: 'unified',
      moduleKey: 'posts',
      recordSlug: post.slug,
    })}`,
  }));

  const productUrls: MetadataRoute.Sitemap = products.map((product) => {
    const productUpdatedAt = (product as { updatedAt?: number }).updatedAt;
    return {
      changeFrequency: 'weekly' as const,
      lastModified: new Date(productUpdatedAt ?? product._creationTime),
      priority: 0.7,
      url: `${baseUrl}${buildDetailPath({
        categorySlug: productCategoryMap.get(product.categoryId),
        mode: 'unified',
        moduleKey: 'products',
        recordSlug: product.slug,
      })}`,
    };
  });

  const serviceUrls: MetadataRoute.Sitemap = services.map((service) => ({
    changeFrequency: 'monthly' as const,
    ...(service.publishedAt && { lastModified: new Date(service.publishedAt) }),
    priority: 0.7,
    url: `${baseUrl}${buildDetailPath({
      categorySlug: serviceCategoryMap.get(service.categoryId),
      mode: 'unified',
      moduleKey: 'services',
      recordSlug: service.slug,
    })}`,
  }));

  const landingUrls: MetadataRoute.Sitemap = landingPages.map((page) => {
    const routeMap: Record<string, string> = {
      feature: '/features',
      'use-case': '/use-cases',
      solution: '/solutions',
      compare: '/compare',
      integration: '/integrations',
      template: '/templates',
      guide: '/guides',
    };
    const basePath = routeMap[page.landingType] || '/features';

    return {
      changeFrequency: 'weekly' as const,
      lastModified: new Date(page.updatedAt),
      priority: 0.7,
      url: `${baseUrl}${basePath}/${page.slug}`,
    };
  });

  const deduped = new Map<string, MetadataRoute.Sitemap[number]>();
  [...staticWithFreshness, ...categoryHubs, ...postUrls, ...productUrls, ...serviceUrls, ...landingUrls].forEach((entry) => {
    if (!deduped.has(entry.url)) {
      deduped.set(entry.url, entry);
    }
  });

  return Array.from(deduped.values());
}
