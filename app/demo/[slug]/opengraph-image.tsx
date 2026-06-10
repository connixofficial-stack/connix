import { ImageResponse } from 'next/og';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';

export const runtime = 'edge';
export const alt = 'Demo Preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Lighten or darken a hex color for gradient use.
 * factor > 1 = lighter, factor < 1 = darker
 */
const adjustColor = (hex: string, factor: number) => {
  const clean = hex.replace('#', '');
  const r = Math.min(255, Math.max(0, Math.round(parseInt(clean.slice(0, 2), 16) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(parseInt(clean.slice(2, 4), 16) * factor)));
  const b = Math.min(255, Math.max(0, Math.round(parseInt(clean.slice(4, 6), 16) * factor)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Simple perceived-brightness check (YIQ formula).
 * Returns true if color is "light" → use dark text.
 */
const isLightColor = (hex: string) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = getConvexClient();
  const snapshot = await client.query(api.homepageSnapshots.getHomepageSnapshotBySlug, { slug });

  // Fallback: generic OG image
  if (!snapshot) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#1a1a2e', color: '#ffffff', fontSize: 48 }}>
          Demo không tồn tại
        </div>
      ),
      size,
    );
  }

  const bundle = snapshot.bundle as Record<string, unknown> | null;
  const settings = bundle?.settings as Record<string, unknown> | undefined;
  const site = (settings?.site ?? {}) as Record<string, string>;
  const contact = (settings?.contact ?? {}) as Record<string, string>;
  const seo = (settings?.seo ?? {}) as Record<string, string>;

  const brandName = site.site_name || 'Website';
  const tagline = site.site_tagline || '';
  const customOgImage = seo.seo_og_image || '';
  const logoUrl = site.site_logo || '';
  const primary = site.site_brand_primary || '#3b82f6';
  const brandMode = site.site_brand_mode;
  const secondary = brandMode === 'dual' ? (site.site_brand_secondary || primary) : primary;
  const phone = contact.contact_phone || '';
  const label = snapshot.label || '';

  if (customOgImage) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', background: '#ffffff' }}>
          <img src={customOgImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ),
      size,
    );
  }

  const isDual = primary !== secondary;
  const textColor = isLightColor(primary) ? '#1a1a2e' : '#ffffff';
  const subtextColor = isLightColor(primary) ? 'rgba(26,26,46,0.7)' : 'rgba(255,255,255,0.75)';
  const gradientStart = adjustColor(primary, 0.85);
  const gradientEnd = adjustColor(primary, 1.15);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${gradientStart} 0%, ${primary} 50%, ${gradientEnd} 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circle top-right */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 340,
            height: 340,
            borderRadius: '50%',
            background: isDual ? secondary : 'rgba(255,255,255,0.08)',
            opacity: 0.2,
            display: 'flex',
          }}
        />
        {/* Decorative circle bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            left: -60,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: isDual ? secondary : 'rgba(255,255,255,0.05)',
            opacity: 0.15,
            display: 'flex',
          }}
        />

        {/* Main content area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '56px 72px 48px',
            flex: 1,
            position: 'relative',
          }}
        >
          {/* Top row: Logo + Brand Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
            {logoUrl && (
              <img
                src={logoUrl}
                width={64}
                height={64}
                style={{
                  borderRadius: 12,
                  objectFit: 'contain',
                  background: 'rgba(255,255,255,0.15)',
                  padding: 6,
                }}
                alt=""
              />
            )}
            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: textColor,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {brandName}
            </div>
          </div>

          {/* Tagline / Slogan */}
          {tagline && (
            <div
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: subtextColor,
                lineHeight: 1.4,
                maxWidth: 800,
                marginBottom: 28,
              }}
            >
              {tagline}
            </div>
          )}

          {/* Color swatches row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: '8px 16px',
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 6, background: primary, border: '2px solid rgba(255,255,255,0.3)', display: 'flex' }} />
              <span style={{ fontSize: 16, color: subtextColor, fontWeight: 600 }}>
                {primary.toUpperCase()}
              </span>
            </div>
            {isDual && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: '8px 16px',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, background: secondary, border: '2px solid rgba(255,255,255,0.3)', display: 'flex' }} />
                <span style={{ fontSize: 16, color: subtextColor, fontWeight: 600 }}>
                  {secondary.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div style={{ display: 'flex', flex: 1 }} />

          {/* Bottom row: phone + demo label */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'flex' }}>
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1.003 1.003 0 011.01-.24c1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.07 21 3 13.93 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill={textColor} />
                  </svg>
                  <span style={{ fontSize: 20, fontWeight: 600, color: textColor }}>
                    {phone}
                  </span>
                </div>
              )}
            </div>

            {/* Demo badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 10,
                padding: '10px 20px',
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                Demo
              </span>
              {label && (
                <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                  {label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
