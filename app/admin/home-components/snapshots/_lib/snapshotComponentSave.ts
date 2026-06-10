import type { Id } from '@/convex/_generated/dataModel';
import type { HomepageSnapshotPayload, SnapshotComponentPayload } from '@/lib/homepage-snapshot/types';

type SaveSnapshotComponentInput = {
  active: boolean;
  component: Omit<SnapshotComponentPayload, 'order'> & { order: number | string };
  config: unknown;
  decodedKey: string;
  label: string;
  mediaRefs?: string[];
  order?: number | string;
  payload: HomepageSnapshotPayload;
  snapshotId: string;
  title: string;
  updateSnapshot: (args: {
    label: string;
    payload: HomepageSnapshotPayload;
    snapshotId: Id<'homeComponentSnapshots'>;
  }) => Promise<unknown>;
};

export async function saveSnapshotComponent({
  active,
  component,
  config,
  decodedKey,
  label,
  mediaRefs,
  order,
  payload,
  snapshotId,
  title,
  updateSnapshot,
}: SaveSnapshotComponentInput) {
  const numericOrder = Number(order ?? component.order);
  const nextComponent: SnapshotComponentPayload = {
    active,
    componentKey: component.componentKey,
    config,
    fallbackUsed: component.fallbackUsed,
    mediaRefs: mediaRefs !== undefined ? mediaRefs : component.mediaRefs,
    order: Number.isFinite(numericOrder) ? numericOrder : 0,
    title: title.trim() || component.type,
    type: component.type,
  };
  const nextComponents = payload.homepage.components.map((item) => (
    item.componentKey === decodedKey ? nextComponent : item
  )).sort((a, b) => a.order - b.order);

  await updateSnapshot({
    label,
    payload: {
      ...payload,
      manifest: {
        ...payload.manifest,
        componentCount: nextComponents.length,
        snapshotLabel: label,
      },
      homepage: {
        ...payload.homepage,
        componentOrder: nextComponents.map((item) => item.componentKey),
        components: nextComponents,
      },
    },
    snapshotId: snapshotId as Id<'homeComponentSnapshots'>,
  });
}
