'use client';

import React, { createContext, useContext } from 'react';
import type {
  SnapshotComponentResolvedData,
  SnapshotContactSettings,
  SnapshotDemoBundle,
  SnapshotMenuPayload,
  SnapshotModuleSettings,
  SnapshotSiteSettings,
  SnapshotSocialSettings,
} from './snapshot-demo-types';

type SnapshotSystemStyle = NonNullable<SnapshotDemoBundle['systemStyle']>;

type SnapshotDemoContextValue = {
  bundle: SnapshotDemoBundle;
  getComponentData: (componentKey: string) => SnapshotComponentResolvedData | null;
  getSiteSettings: () => SnapshotSiteSettings;
  getContactSettings: () => SnapshotContactSettings;
  getSocialSettings: () => SnapshotSocialSettings;
  getRouteMode: () => string;
  getMenu: (location: 'header' | 'footer') => SnapshotMenuPayload | null;
  getHeaderSettings: () => { header_style?: string; header_config?: Record<string, unknown> };
  getModuleSettings: () => SnapshotModuleSettings | null;
  getSystemStyle: () => SnapshotSystemStyle | null;
};

const SnapshotDemoContext = createContext<SnapshotDemoContextValue | null>(null);

export function SnapshotDemoProvider({
  bundle,
  children,
}: {
  bundle: SnapshotDemoBundle;
  children: React.ReactNode;
}) {
  const value = React.useMemo<SnapshotDemoContextValue>(() => ({
    bundle,
    getComponentData: (componentKey: string) => bundle.componentData[componentKey] ?? null,
    getSiteSettings: () => bundle.settings.site,
    getContactSettings: () => bundle.settings.contact,
    getSocialSettings: () => bundle.settings.social,
    getRouteMode: () => bundle.settings.routing.ia_route_mode || 'unified',
    getMenu: (location: 'header' | 'footer') => bundle.menus[location] ?? null,
    getHeaderSettings: () => bundle.settings.header ?? {},
    getModuleSettings: () => bundle.modules ?? null,
    getSystemStyle: () => bundle.systemStyle ?? null,
  }), [bundle]);

  return (
    <SnapshotDemoContext.Provider value={value}>
      {children}
    </SnapshotDemoContext.Provider>
  );
}

export function useSnapshotDemoContext() {
  return useContext(SnapshotDemoContext);
}
