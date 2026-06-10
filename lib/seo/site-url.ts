import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';

const normalizeSiteUrl = (value?: string | null): string => {
  const baseUrl = ((value || process.env.NEXT_PUBLIC_SITE_URL) ?? '').replace(/\/$/, '');
  if (!baseUrl || baseUrl === 'https://example.com') {
    return '';
  }
  return baseUrl;
};

export const resolveSiteUrlFromValue = (value?: string | null): string => normalizeSiteUrl(value);

export const resolveSiteUrl = async (): Promise<string> => {
  const fallbackUrl = normalizeSiteUrl();

  try {
    const client = getConvexClient();
    const siteUrlSetting = await client.query(api.settings.getByKey, { key: 'site_url' });
    return normalizeSiteUrl(siteUrlSetting?.value as string) || fallbackUrl;
  } catch {
    return fallbackUrl;
  }
};
