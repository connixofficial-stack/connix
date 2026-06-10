import { NextResponse } from 'next/server';
import { getContactSettings, getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { buildLlmsText } from '@/lib/seo/llms';
import { resolveSiteUrlFromValue } from '@/lib/seo/site-url';

export async function GET() {
  const [site, seo, contact, social] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    getSocialSettings(),
  ]);
  const baseUrl = resolveSiteUrlFromValue(site.site_url);
  const text = buildLlmsText({ baseUrl, contact, seo, site, social });

  return new NextResponse(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
