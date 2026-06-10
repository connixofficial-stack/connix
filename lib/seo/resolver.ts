/**
 * SEO Resolver
 * Zero-config: tự động derive SEO fields từ entity + site settings
 */

import type { ContactSettings, SEOSettings, SiteSettings } from '@/lib/get-settings';
import { stripHtml, truncateText } from '@/lib/seo';

export type EntitySeoData = {
  title?: string;
  name?: string;
  summary?: string;
  excerpt?: string;
  description?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  image?: string;
  thumbnail?: string;
  heroImage?: string;
  images?: string[];
  keywords?: string;
};

export type ResolvedSeo = {
  title: string;
  description: string;
  image: string;
  keywords: string[];
};

const cleanDescription = (raw: string | undefined): string => {
  if (!raw) {return '';}
  const stripped = stripHtml(raw);
  return truncateText(stripped, 160);
};

export const resolveSeoTitle = (params: {
  entity?: EntitySeoData;
  site: SiteSettings;
  fallback?: string;
}): string => {
  // Priority: metaTitle -> title/name -> fallback -> site_name
  if (params.entity?.metaTitle) {
    return params.entity.metaTitle;
  }
  if (params.entity?.title) {
    return params.entity.title;
  }
  if (params.entity?.name) {
    return params.entity.name;
  }
  if (params.fallback) {
    return params.fallback;
  }
  return params.site.site_name || 'Website';
};

export const resolveSeoDescription = (params: {
  entity?: EntitySeoData;
  site: SiteSettings;
  seo: SEOSettings;
  fallback?: string;
}): string => {
  // Priority: metaDescription -> summary/excerpt -> cleaned description/content -> fallback -> site_tagline -> seo_description
  if (params.entity?.metaDescription) {
    return params.entity.metaDescription;
  }
  if (params.entity?.summary) {
    return cleanDescription(params.entity.summary);
  }
  if (params.entity?.excerpt) {
    return cleanDescription(params.entity.excerpt);
  }
  if (params.entity?.description) {
    return cleanDescription(params.entity.description);
  }
  if (params.entity?.content) {
    return cleanDescription(params.entity.content);
  }
  if (params.fallback) {
    return params.fallback;
  }
  if (params.site.site_tagline) {
    return params.site.site_tagline;
  }
  return params.seo.seo_description || '';
};

export const resolveSeoImage = (params: {
  entity?: EntitySeoData;
  site: SiteSettings;
  seo: SEOSettings;
}): string => {
  // Priority: metaImage/image/thumbnail/heroImage/images[0] -> seo_og_image
  if (params.entity?.image) {
    return params.entity.image;
  }
  if (params.entity?.thumbnail) {
    return params.entity.thumbnail;
  }
  if (params.entity?.heroImage) {
    return params.entity.heroImage;
  }
  if (params.entity?.images?.[0]) {
    return params.entity.images[0];
  }
  if (params.seo.seo_og_image) {
    return params.seo.seo_og_image;
  }
  return '';
};

export const resolveSeoKeywords = (params: {
  entity?: { keywords?: string };
  seo: SEOSettings;
}): string[] => {
  // Priority: entity keywords -> global seo_keywords
  const entityKeywords = params.entity?.keywords
    ? params.entity.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : [];

  if (entityKeywords.length > 0) {
    return entityKeywords;
  }

  return params.seo.seo_keywords
    ? params.seo.seo_keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : [];
};

export const resolveCanonicalUrl = (params: {
  baseUrl: string;
  pathname: string;
  cleanQueryParams?: boolean;
}): string | undefined => {
  if (!params.baseUrl) {
    return undefined;
  }

  const cleanBase = params.baseUrl.replace(/\/$/, '');
  const cleanPath = params.pathname.replace(/^\//, '');

  if (!cleanPath) {
    return cleanBase;
  }

  // Clean query params if requested (default behavior for SEO)
  if (params.cleanQueryParams !== false) {
    const pathWithoutQuery = cleanPath.split('?')[0];
    return `${cleanBase}/${pathWithoutQuery}`;
  }

  return `${cleanBase}/${cleanPath}`;
};

export const shouldIncludeLocalBusiness = (params: {
  site: SiteSettings;
  contact: ContactSettings;
}): boolean => {
  // Chỉ phát LocalBusiness khi đủ dữ liệu thật tối thiểu
  const hasName = Boolean(params.site.site_name);
  const hasUrl = Boolean(params.site.site_url);
  const hasAddress = Boolean(params.contact.contact_address);
  const hasContact = Boolean(params.contact.contact_phone || params.contact.contact_email);

  return hasName && hasUrl && hasAddress && hasContact;
};
