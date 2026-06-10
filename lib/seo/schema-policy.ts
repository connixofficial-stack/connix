/**
 * Schema Policy Engine
 * Zero-config: tự động quyết định schema nào phát dựa trên dữ liệu thật
 */

import type { ContactSettings, SEOSettings, SiteSettings, SocialSettings } from '@/lib/get-settings';
import { shouldIncludeLocalBusiness } from './resolver';

type SchemaRecord = Record<string, unknown>;

// =================== Site-Level Schemas ===================

export const buildWebSiteSchema = (params: {
  name: string;
  url: string;
  description?: string;
}): SchemaRecord => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: params.name,
  url: params.url,
  ...(params.description && { description: params.description }),
});

export const buildOrganizationSchema = (params: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  sameAs?: string[];
}): SchemaRecord => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: params.name,
  url: params.url,
  ...(params.logo && { logo: params.logo }),
  ...(params.description && { description: params.description }),
  ...(params.email && { email: params.email }),
  ...(params.phone && { telephone: params.phone }),
  ...(params.address && {
    address: { '@type': 'PostalAddress', streetAddress: params.address },
  }),
  ...(params.sameAs && params.sameAs.length > 0 && { sameAs: params.sameAs }),
});

export const buildLocalBusinessSchema = (params: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  sameAs?: string[];
}): SchemaRecord => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: params.name,
  url: params.url,
  ...(params.logo && { image: params.logo }),
  ...(params.description && { description: params.description }),
  ...(params.email && { email: params.email }),
  ...(params.phone && { telephone: params.phone }),
  ...(params.address && {
    address: { '@type': 'PostalAddress', streetAddress: params.address },
  }),
  ...(params.sameAs && params.sameAs.length > 0 && { sameAs: params.sameAs }),
});

// =================== Entity-Level Schemas ===================

export const buildBreadcrumbSchema = (
  items: { name: string; url: string }[]
): SchemaRecord => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    item: item.url,
    name: item.name,
    position: index + 1,
  })),
});

export const buildArticleSchema = (params: {
  title: string;
  url: string;
  siteName: string;
  description?: string;
  image?: string;
  publishedAt?: number;
  updatedAt?: number;
  authorName?: string;
  language?: string;
}): SchemaRecord => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: params.title,
  url: params.url,
  mainEntityOfPage: { '@type': 'WebPage', '@id': params.url },
  ...(params.description && { description: params.description }),
  ...(params.image && { image: params.image }),
  ...(params.publishedAt && { datePublished: new Date(params.publishedAt).toISOString() }),
  ...(params.updatedAt && { dateModified: new Date(params.updatedAt).toISOString() }),
  ...(params.language && { inLanguage: params.language }),
  ...(params.authorName && {
    author: { '@type': 'Person', name: params.authorName },
  }),
  publisher: { '@type': 'Organization', name: params.siteName },
});

export const buildProductSchema = (params: {
  name: string;
  url: string;
  sku: string;
  price: number;
  inStock: boolean;
  description?: string;
  image?: string;
  images?: string[];
  salePrice?: number;
  currency?: string;
  brand?: string;
  aggregateRating?: { ratingValue: number; reviewCount: number };
  createdAt?: number;
  updatedAt?: number;
}): SchemaRecord => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: params.name,
  url: params.url,
  sku: params.sku,
  mainEntityOfPage: { '@type': 'WebPage', '@id': params.url },
  ...(params.description && { description: params.description }),
  ...(params.images && params.images.length > 0
    ? { image: params.images }
    : (params.image ? { image: params.image } : {})),
  ...(params.createdAt && { dateCreated: new Date(params.createdAt).toISOString() }),
  ...(params.updatedAt && { dateModified: new Date(params.updatedAt).toISOString() }),
  ...(params.brand && { brand: { '@type': 'Brand', name: params.brand } }),
  offers: {
    '@type': 'Offer',
    availability: params.inStock
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    price: params.salePrice ?? params.price,
    priceCurrency: params.currency ?? 'VND',
    url: params.url,
  },
  ...(params.aggregateRating && {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: params.aggregateRating.ratingValue,
      reviewCount: params.aggregateRating.reviewCount,
    },
  }),
});

export const buildServiceSchema = (params: {
  name: string;
  url: string;
  providerName: string;
  description?: string;
  image?: string;
  price?: number;
  currency?: string;
  providerUrl?: string;
  aggregateRating?: { ratingValue: number; reviewCount: number };
}): SchemaRecord => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: params.name,
  url: params.url,
  mainEntityOfPage: { '@type': 'WebPage', '@id': params.url },
  ...(params.description && { description: params.description }),
  ...(params.image && { image: params.image }),
  provider: {
    '@type': 'Organization',
    name: params.providerName,
    ...(params.providerUrl && { url: params.providerUrl }),
  },
  ...(params.price && {
    offers: {
      '@type': 'Offer',
      price: params.price,
      priceCurrency: params.currency ?? 'VND',
    },
  }),
  ...(params.aggregateRating && {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: params.aggregateRating.ratingValue,
      reviewCount: params.aggregateRating.reviewCount,
    },
  }),
});

export const buildFaqSchema = (
  faqs: { question: string; answer: string }[]
): SchemaRecord => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
});

export const buildItemListSchema = (params: {
  name: string;
  url: string;
  items: { name: string; url: string }[];
  itemListOrder?: string;
}): SchemaRecord => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: params.name,
  url: params.url,
  numberOfItems: params.items.length,
  ...(params.itemListOrder && { itemListOrder: params.itemListOrder }),
  itemListElement: params.items.map((item, index) => ({
    '@type': 'ListItem',
    name: item.name,
    position: index + 1,
    url: item.url,
  })),
});

// =================== Composite: Site-Level Schema Pack ===================

export const buildSiteSchemas = (params: {
  site: SiteSettings;
  seo: SEOSettings;
  contact: ContactSettings;
  social?: SocialSettings;
}): SchemaRecord[] => {
  const schemas: SchemaRecord[] = [];
  const sameAs = [
    params.social?.social_facebook,
    params.social?.social_instagram,
    params.social?.social_youtube,
    params.social?.social_tiktok,
    params.social?.social_twitter,
    params.social?.social_linkedin,
    params.social?.social_pinterest,
    params.contact.contact_zalo,
  ].map((value) => (value || '').trim())
    .filter((value) => value && value !== '#')
    .filter((value) => value.startsWith('http'));

  schemas.push(
    buildWebSiteSchema({
      description: params.seo.seo_description || params.site.site_tagline,
      name: params.site.site_name,
      url: params.site.site_url || process.env.NEXT_PUBLIC_SITE_URL || '',
    })
  );

  schemas.push(
    buildOrganizationSchema({
      description: params.seo.seo_description || params.site.site_tagline,
      email: params.contact.contact_email,
      logo: params.site.site_logo,
      name: params.site.site_name,
      phone: params.contact.contact_phone,
      sameAs,
      url: params.site.site_url || process.env.NEXT_PUBLIC_SITE_URL || '',
    })
  );

  if (
    shouldIncludeLocalBusiness({ contact: params.contact, site: params.site })
  ) {
    schemas.push(
      buildLocalBusinessSchema({
        address: params.contact.contact_address,
        description: params.seo.seo_description || params.site.site_tagline,
        email: params.contact.contact_email,
        logo: params.site.site_logo,
        name: params.site.site_name,
        phone: params.contact.contact_phone,
        sameAs,
        url: params.site.site_url || process.env.NEXT_PUBLIC_SITE_URL || '',
      })
    );
  }

  return schemas;
};
