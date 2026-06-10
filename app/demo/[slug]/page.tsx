import { notFound } from 'next/navigation';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { SnapshotDemoProvider } from '@/components/modules/homepage/SnapshotDemoProvider';
import { SnapshotDemoHomePage } from '@/components/modules/homepage/SnapshotDemoHomePage';
import { DemoSiteShell } from '@/components/modules/homepage/DemoSiteShell';
import { InitialBrandColorsProvider } from '@/components/providers/InitialBrandColorsProvider';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const client = getConvexClient();
  const snapshot = await client.query(api.homepageSnapshots.getHomepageSnapshotBySlug, { slug });
  if (!snapshot) return { title: 'Demo không tồn tại' };

  const bundle = snapshot.bundle as Record<string, unknown> | null;
  const settings = bundle?.settings as Record<string, unknown> | undefined;
  const site = (settings?.site ?? {}) as Record<string, string>;
  const seo = (settings?.seo ?? {}) as Record<string, string>;

  const brandName = site.site_name || 'Website';
  const tagline = site.site_tagline || '';
  const title = seo.seo_title || `Demo: ${snapshot.label}`;
  const description = seo.seo_description || (tagline
    ? `${brandName} — ${tagline}`
    : `Xem trước giao diện trang chủ - ${snapshot.label}`);
  const ogImage = seo.seo_og_image || site.site_logo || '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: brandName,
      type: 'website',
      locale: 'vi_VN',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: { index: false, follow: false },
  };
}

export default async function PublicDemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = getConvexClient();
  const snapshot = await client.query(api.homepageSnapshots.getHomepageSnapshotBySlug, { slug });

  if (!snapshot) {
    notFound();
  }

  const bundle = snapshot.bundle as any;
  // Merge systemStyle (per-type color/font overrides) into bundle
  const systemStyle = (snapshot as any).systemStyle ?? null;
  const enrichedBundle = { ...bundle, systemStyle };
  const site = enrichedBundle?.settings?.site ?? {};
  const brandPrimary = site.site_brand_primary || '#3b82f6';
  const brandMode = site.site_brand_mode === 'single' ? 'single' : 'dual';
  const brandSecondary = brandMode === 'single' ? '' : (site.site_brand_secondary || '');

  return (
    <InitialBrandColorsProvider
      value={{
        mode: brandMode,
        primary: brandPrimary,
        secondary: brandSecondary,
      }}
    >
      <SnapshotDemoProvider bundle={enrichedBundle}>
        <DemoSiteShell>
          <SnapshotDemoHomePage
            payload={{
              bundle,
              components: snapshot.components,
              label: snapshot.label,
            }}
          />
        </DemoSiteShell>
      </SnapshotDemoProvider>
    </InitialBrandColorsProvider>
  );
}

