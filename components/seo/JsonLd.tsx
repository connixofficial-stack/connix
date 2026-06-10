/**
 * JSON-LD Component
 * Re-export schema builders từ schema-policy để tránh duplicate
 */

export { buildArticleSchema as generateArticleSchema } from '@/lib/seo/schema-policy';
export { buildBreadcrumbSchema as generateBreadcrumbSchema } from '@/lib/seo/schema-policy';
export { buildItemListSchema as generateItemListSchema } from '@/lib/seo/schema-policy';
export { buildLocalBusinessSchema as generateLocalBusinessSchema } from '@/lib/seo/schema-policy';
export { buildOrganizationSchema as generateOrganizationSchema } from '@/lib/seo/schema-policy';
export { buildProductSchema as generateProductSchema } from '@/lib/seo/schema-policy';
export { buildServiceSchema as generateServiceSchema } from '@/lib/seo/schema-policy';
export { buildWebSiteSchema as generateWebsiteSchema } from '@/lib/seo/schema-policy';

interface JsonLdProps {
  data: Record<string, unknown>;
}

export const JsonLd = ({ data }: JsonLdProps): React.ReactElement => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);

// Legacy: giữ generateNavigationSchema vì không có trong schema-policy
export const generateNavigationSchema = (params: {
  name: string;
  url: string;
  items: { name: string; url: string }[];
}): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'SiteNavigationElement',
  name: params.name,
  url: params.url,
  hasPart: params.items.map((item) => ({
    '@type': 'SiteNavigationElement',
    name: item.name,
    url: item.url,
  })),
});
