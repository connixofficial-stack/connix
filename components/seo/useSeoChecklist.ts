'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { buildSeoChecklist, type SeoChecklistResult, type SeoUrlHealth } from '@/lib/seo/checklist';

type SeoChecklistHookResult = {
  isLoading: boolean;
  baseUrl: string;
  sitemapUrl: string;
  robotsUrl: string;
  llmsUrl: string;
  postsCount: number;
  productsCount: number;
  servicesCount: number;
  landingPagesCount: number;
  checklist: SeoChecklistResult | null;
};

export const useSeoChecklist = (): SeoChecklistHookResult => {
  const siteSettings = useQuery(api.settings.getMultiple, {
    keys: ['site_name', 'site_url', 'site_logo', 'site_tagline'],
  });
  const seoSettings = useQuery(api.settings.getMultiple, {
    keys: ['seo_title', 'seo_description', 'seo_keywords', 'seo_og_image'],
  });
  const contactSettings = useQuery(api.settings.getMultiple, {
    keys: ['contact_email', 'contact_phone', 'contact_address', 'contact_tax_id'],
  });
  const socialSettings = useQuery(api.settings.getMultiple, {
    keys: [
      'social_facebook',
      'social_instagram',
      'social_youtube',
      'social_tiktok',
      'social_twitter',
      'social_linkedin',
      'social_pinterest',
    ],
  });

  const postsCount = useQuery(api.posts.countPublished, {});
  const productsCount = useQuery(api.products.countPublished, {});
  const servicesCount = useQuery(api.services.countPublished, {});
  const landingPagesResult = useQuery(api.landingPages.listAllPublished, {
    paginationOpts: { cursor: null, numItems: 1000 },
  });

  const baseUrl = ((siteSettings?.site_url as string) || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com')
    .replace(/\/$/, '');
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  const robotsUrl = `${baseUrl}/robots.txt`;
  const llmsUrl = `${baseUrl}/llms.txt`;

  const [urlHealth, setUrlHealth] = useState<SeoUrlHealth>({
    robotsReachable: false,
    sitemapReachable: false,
    llmsReachable: false,
  });
  const [isUrlLoading, setIsUrlLoading] = useState(false);

  useEffect(() => {
    const isValidBaseUrl = baseUrl.startsWith('http://') || baseUrl.startsWith('https://');
    if (!isValidBaseUrl || baseUrl === 'https://example.com') {
      setUrlHealth({
        robotsReachable: false,
        sitemapReachable: false,
        llmsReachable: false,
      });
      return;
    }

    let isActive = true;

    const checkUrl = async (url: string): Promise<boolean> => {
      try {
        const headResponse = await fetch(url, { method: 'HEAD' });
        if (headResponse.ok) {
          return true;
        }
        if (headResponse.status === 405 || headResponse.status === 403) {
          const getResponse = await fetch(url, { method: 'GET' });
          return getResponse.ok;
        }
        return false;
      } catch {
        return false;
      }
    };

    const run = async () => {
      setIsUrlLoading(true);
      const [robotsReachable, sitemapReachable, llmsReachable] = await Promise.all([
        checkUrl(robotsUrl),
        checkUrl(sitemapUrl),
        checkUrl(llmsUrl),
      ]);

      if (!isActive) {
        return;
      }

      setUrlHealth({
        robotsReachable,
        sitemapReachable,
        llmsReachable,
      });
      setIsUrlLoading(false);
    };

    void run();

    return () => {
      isActive = false;
    };
  }, [baseUrl, llmsUrl, robotsUrl, sitemapUrl]);

  const isLoading = [
    siteSettings,
    seoSettings,
    contactSettings,
    socialSettings,
    postsCount,
    productsCount,
    servicesCount,
    landingPagesResult,
  ].some((value) => value === undefined) || isUrlLoading;

  const checklist = useMemo(() => {
    if (isLoading || !siteSettings || !seoSettings || !contactSettings || !socialSettings) {
      return null;
    }

    const socialLinks = [
      socialSettings.social_facebook,
      socialSettings.social_instagram,
      socialSettings.social_youtube,
      socialSettings.social_tiktok,
      socialSettings.social_twitter,
      socialSettings.social_linkedin,
      socialSettings.social_pinterest,
    ].flatMap((value) => (typeof value === 'string' && value.trim() ? [value] : []));

    return buildSeoChecklist({
      baseUrl,
      urlHealth,
      siteName: siteSettings.site_name as string,
      siteLogo: siteSettings.site_logo as string,
      siteTagline: siteSettings.site_tagline as string,
      seoTitle: seoSettings.seo_title as string,
      seoDescription: seoSettings.seo_description as string,
      seoKeywords: seoSettings.seo_keywords as string,
      seoOgImage: seoSettings.seo_og_image as string,
      contactEmail: contactSettings.contact_email as string,
      contactPhone: contactSettings.contact_phone as string,
      contactAddress: contactSettings.contact_address as string,
      contactTaxId: contactSettings.contact_tax_id as string,
      socialLinks,
      postsCount: postsCount ?? 0,
      productsCount: productsCount ?? 0,
      servicesCount: servicesCount ?? 0,
      landingPagesCount: landingPagesResult?.page?.length ?? 0,
    });
  }, [
    baseUrl,
    contactSettings,
    isLoading,
    landingPagesResult,
    postsCount,
    productsCount,
    servicesCount,
    seoSettings,
    siteSettings,
    socialSettings,
    urlHealth,
  ]);

  return {
    isLoading,
    baseUrl,
    sitemapUrl,
    robotsUrl,
    llmsUrl,
    postsCount: postsCount ?? 0,
    productsCount: productsCount ?? 0,
    servicesCount: servicesCount ?? 0,
    landingPagesCount: landingPagesResult?.page?.length ?? 0,
    checklist,
  };
};
