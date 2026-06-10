import HomePageClient from './_components/HomePageClient';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';

/** Extract first Hero slide image URL for LCP preload */
function extractHeroImageUrl(
  components: { type: string; config: Record<string, unknown> }[]
): string | null {
  const hero = components.find((c) => c.type === 'Hero');
  if (!hero) return null;
  const slides = hero.config.slides as { image?: string }[] | undefined;
  return slides?.[0]?.image || null;
}

export default async function HomePage(): Promise<React.ReactElement> {
  const client = getConvexClient();
  const initialComponents = await client.query(api.homeComponents.listActive);

  const heroImageUrl = extractHeroImageUrl(
    initialComponents.map((c) => ({
      type: c.type,
      config: c.config as Record<string, unknown>,
    }))
  );

  return (
    <>
      {heroImageUrl && (
        <link
          rel="preload"
          as="image"
          href={heroImageUrl}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fetchPriority={'high' as any}
        />
      )}
      <HomePageClient initialComponents={initialComponents} />
    </>
  );
}
