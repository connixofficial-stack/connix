'use client';

import React from 'react';
import { HomeComponentRenderer } from '@/components/site/home/HomeComponentRenderer';
import type { SnapshotDemoPayload } from './snapshot-demo-types';

export function SnapshotDemoHomePage({ payload }: { payload: SnapshotDemoPayload }) {
  const components = [...payload.components]
    .filter((component) => component.active)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {components.map((component) => (
        <HomeComponentRenderer
          key={component._id}
          component={component}
          snapshotComponentKey={component._id}
        />
      ))}
    </>
  );
}
