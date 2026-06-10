/**
 * SEO Metadata Builder
 * Refactored: sử dụng resolver + route-policy để zero-config
 */

import type { Metadata } from 'next';
import type { ContactSettings, SEOSettings, SiteSettings, SocialSettings } from '@/lib/get-settings';
import {
  type EntitySeoData,
  resolveCanonicalUrl,
  resolveSeoDescription,
  resolveSeoImage,
  resolveSeoKeywords,
  resolveSeoTitle,
} from './resolver';
import { type RouteType, getRoutePolicy, shouldIndex } from './route-policy';

export type SeoContext = {
  baseUrl: string;
  description: string;
  image: string;
  keywords: string[];
  locale: string;
  siteName: string;
  title: string;
};

const resolveTwitterHandle = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.startsWith('@')) {
    return trimmed;
  }
  if (trimmed.startsWith('http')) {
    try {
      const url = new URL(trimmed);
      const segments = url.pathname.split('/').filter(Boolean);
      const handle = segments[0];
      if (!handle) {
        return undefined;
      }
      return handle.startsWith('@') ? handle : `@${handle}`;
    } catch {
      return undefined;
    }
  }
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
};

const resolveBaseUrl = (siteUrl?: string): string => {
  const baseUrl = (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com').replace(/\/$/, '');
  return baseUrl || 'https://example.com';
};

const buildMetadataBase = (baseUrl: string): URL | undefined => {
  if (!baseUrl) {
    return undefined;
  }
  return new URL(baseUrl);
};

const resolveLocale = (language: string): string => {
  if (language === 'vi') {
    return 'vi_VN';
  }
  return 'en_US';
};

const buildAlternates = (params: {
  canonical?: string;
  indexable: boolean;
}): Metadata['alternates'] | undefined => {
  if (!params.canonical) {
    return undefined;
  }

  if (!params.indexable) {
    return undefined;
  }

  return {
    canonical: params.canonical,
    languages: {
      'vi-VN': params.canonical,
    },
  };
};

// Legacy: giữ để backward compatibility
export const buildSeoContext = (site: SiteSettings, seo: SEOSettings): SeoContext => {
  const baseUrl = resolveBaseUrl(site.site_url);
  const siteName = site.site_name || 'Website';
  const title = seo.seo_title || siteName;
  const description = seo.seo_description || site.site_tagline || '';
  const keywords = seo.seo_keywords
    ? seo.seo_keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean)
    : [];

  return {
    baseUrl,
    description,
    image: seo.seo_og_image || '',
    keywords,
    locale: resolveLocale(site.site_language || 'vi'),
    siteName,
    title,
  };
};

// Legacy: giữ để backward compatibility
export const buildCanonicalUrl = (baseUrl: string, path = ''): string | undefined => {
  if (!baseUrl) {
    return undefined;
  }
  if (!path) {
    return baseUrl;
  }
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

// Legacy: giữ để backward compatibility
export const buildMetadata = (params: {
  canonical?: string;
  context: SeoContext;
  description: string;
  image?: string;
  indexable: boolean;
  keywords?: string[];
  openGraphType?: 'website' | 'article';
  openGraph?: Partial<NonNullable<Metadata['openGraph']>>;
  title: string;
  useTitleTemplate?: boolean;
  twitterSite?: string;
  twitterCreator?: string;
}): Metadata => {
  const resolvedImage = params.image || params.context.image;
  const resolvedKeywords = params.keywords ?? params.context.keywords;
  const openGraphTitle = params.useTitleTemplate || params.title === params.context.siteName
    ? params.title
    : `${params.title} | ${params.context.siteName}`;
  const twitterSite = resolveTwitterHandle(params.twitterSite);
  const twitterCreator = resolveTwitterHandle(params.twitterCreator || params.twitterSite);
  const openGraphImage = resolvedImage
    ? { url: resolvedImage, width: 1200, height: 630, alt: openGraphTitle }
    : undefined;
  const twitterImage = resolvedImage ? { url: resolvedImage, alt: openGraphTitle } : undefined;

  return {
    alternates: buildAlternates({
      canonical: params.canonical,
      indexable: params.indexable,
    }),
    description: params.description,
    keywords: resolvedKeywords.length > 0 ? resolvedKeywords : undefined,
    metadataBase: buildMetadataBase(params.context.baseUrl),
    openGraph: {
      description: params.description,
      images: openGraphImage ? [openGraphImage] : undefined,
      locale: params.context.locale,
      siteName: params.context.siteName,
      title: openGraphTitle,
      type: params.openGraphType ?? 'website',
      url: params.canonical,
      ...params.openGraph,
    },
    robots: {
      follow: params.indexable,
      index: params.indexable,
    },
    title: params.useTitleTemplate
      ? { default: params.title, template: `%s | ${params.context.siteName}` }
      : params.title,
    twitter: {
      card: 'summary_large_image',
      description: params.description,
      images: twitterImage ? [twitterImage] : undefined,
      ...(twitterSite && { site: twitterSite }),
      ...(twitterCreator && { creator: twitterCreator }),
      title: openGraphTitle,
    },
  };
};

// =================== NEW: Zero-Config Metadata Builder ===================

export const buildSeoMetadata = (params: {
  routeType: RouteType;
  pathname: string;
  site: SiteSettings;
  seo: SEOSettings;
  contact: ContactSettings;
  entity?: EntitySeoData;
  moduleEnabled?: boolean;
  entityExists?: boolean;
  titleOverride?: string;
  descriptionOverride?: string;
  openGraphType?: 'website' | 'article';
  useTitleTemplate?: boolean;
  social?: SocialSettings;
}): Metadata => {
  const baseUrl = resolveBaseUrl(params.site.site_url);
  const locale = resolveLocale(params.site.site_language || 'vi');
  const siteName = params.site.site_name || 'Website';

  // Resolve indexability theo policy
  const indexable = shouldIndex({
    entityExists: params.entityExists,
    moduleEnabled: params.moduleEnabled,
    routeType: params.routeType,
  });

  // Resolve canonical theo policy
  const policy = getRoutePolicy(params.routeType);
  const canonical =
    policy.canonicalRule === 'noindex'
      ? undefined
      : resolveCanonicalUrl({
          baseUrl,
          cleanQueryParams: policy.canonicalRule === 'clean',
          pathname: params.pathname,
        });

  // Resolve SEO fields từ entity + site settings
  const title = params.titleOverride ?? resolveSeoTitle({
    entity: params.entity,
    site: params.site,
  });

  const description = params.descriptionOverride ?? resolveSeoDescription({
    entity: params.entity,
    seo: params.seo,
    site: params.site,
  });

  const image = resolveSeoImage({
    entity: params.entity,
    seo: params.seo,
    site: params.site,
  });

  const keywords = resolveSeoKeywords({
    entity: params.entity,
    seo: params.seo,
  });

  const openGraphTitle = params.useTitleTemplate || title === siteName ? title : `${title} | ${siteName}`;
  const twitterSite = resolveTwitterHandle(params.social?.social_twitter);
  const twitterCreator = resolveTwitterHandle(params.social?.social_twitter);
  const openGraphImage = image
    ? { url: image, width: 1200, height: 630, alt: openGraphTitle }
    : undefined;
  const twitterImage = image ? { url: image, alt: openGraphTitle } : undefined;

  return {
    alternates: buildAlternates({
      canonical,
      indexable,
    }),
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    metadataBase: buildMetadataBase(baseUrl),
    openGraph: {
      description,
      images: openGraphImage ? [openGraphImage] : undefined,
      locale,
      siteName,
      title: openGraphTitle,
      type: params.openGraphType ?? 'website',
      url: canonical,
    },
    robots: {
      follow: indexable,
      index: indexable,
    },
    title: params.useTitleTemplate
      ? { default: title, template: `%s | ${siteName}` }
      : title,
    twitter: {
      card: 'summary_large_image',
      description,
      images: twitterImage ? [twitterImage] : undefined,
      ...(twitterSite && { site: twitterSite }),
      ...(twitterCreator && { creator: twitterCreator }),
      title: openGraphTitle,
    },
  };
};

export const buildHubMetadata = (params: {
  contact: ContactSettings;
  description: string;
  pathname: string;
  seo: SEOSettings;
  site: SiteSettings;
  title: string;
  routeType?: RouteType;
  social?: SocialSettings;
}): Metadata => buildSeoMetadata({
  contact: params.contact,
  descriptionOverride: params.description,
  pathname: params.pathname,
  routeType: params.routeType ?? 'list',
  seo: params.seo,
  site: params.site,
  social: params.social,
  titleOverride: params.title,
});
