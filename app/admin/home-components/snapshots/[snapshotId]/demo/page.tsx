import { notFound } from 'next/navigation';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { SnapshotDemoProvider } from '@/components/modules/homepage/SnapshotDemoProvider';
import { SnapshotDemoHomePage } from '@/components/modules/homepage/SnapshotDemoHomePage';
import { InitialBrandColorsProvider } from '@/components/providers/InitialBrandColorsProvider';

export default async function SnapshotDemoPage({
  params,
}: {
  params: Promise<{ snapshotId: string }>;
}) {
  const { snapshotId } = await params;
  const client = getConvexClient();
  const snapshot = await client.query(api.homepageSnapshots.getHomepageSnapshotDemoById, { snapshotId: snapshotId as any });

  if (!snapshot || !snapshot.bundle) {
    notFound();
  }

  const bundle = snapshot.bundle as any;
  // Merge systemStyle (per-type color/font overrides) into the bundle
  // so SnapshotDemoProvider can expose it to HomeComponentRenderer
  const systemStyle = (snapshot as any).systemStyle ?? null;
  const enrichedBundle = { ...bundle, systemStyle };
  const site = enrichedBundle.settings?.site ?? {};
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
        <SnapshotDemoHomePage
          payload={{
            bundle,
            components: snapshot.components,
            label: snapshot.label,
          }}
        />
      </SnapshotDemoProvider>
    </InitialBrandColorsProvider>
  );
}
