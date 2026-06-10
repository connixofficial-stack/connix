import { NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const client = getConvexClient();
    const settings = await client.query(api.settings.getMultiple, {
      keys: ['site_favicon', 'site_brand_primary', 'site_name'],
    });

    const faviconUrl = (settings.site_favicon as string | undefined)?.trim();
    const brandColor = (settings.site_brand_primary as string) || '#3b82f6';
    const siteName = (settings.site_name as string) || 'V';

    // Nếu có favicon URL, redirect đến đó
    if (faviconUrl) {
      const resolvedUrl = faviconUrl.startsWith('http')
        ? faviconUrl
        : new URL(faviconUrl, request.url).toString();
      return NextResponse.redirect(resolvedUrl);
    }

    // Generate SVG favicon
    const initial = siteName.charAt(0).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${brandColor}"/><text x="16" y="22" font-size="18" font-weight="bold" fill="white" text-anchor="middle" font-family="system-ui,sans-serif">${initial}</text></svg>`;

    return new NextResponse(svg, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'Content-Type': 'image/svg+xml',
      },
    });
  } catch {
    // Fallback SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#3b82f6"/><text x="16" y="22" font-size="18" font-weight="bold" fill="white" text-anchor="middle">V</text></svg>`;
    return new NextResponse(svg, {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }
}
