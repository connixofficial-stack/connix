import { ImageResponse } from 'next/og';
import { getSEOSettings, getSiteSettings } from '@/lib/get-settings';

export const runtime = 'edge';

export default async function Image() {
  const [site, seo] = await Promise.all([getSiteSettings(), getSEOSettings()]);
  const title = seo.seo_title || site.site_name || 'Website';
  const description = seo.seo_description || site.site_tagline || '';
  const brandColor = site.site_brand_primary || '#3b82f6';

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'flex-start',
          background: brandColor,
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          padding: '60px 80px',
          width: '100%',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, marginBottom: 24 }}>
          {title}
        </div>
        {description && (
          <div style={{ fontSize: 32, fontWeight: 400, lineHeight: 1.3, maxWidth: '900px' }}>
            {description}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
