'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ContactSectionShared } from '@/app/admin/home-components/contact/_components/ContactSectionShared';
import { getContactValidationResult } from '@/app/admin/home-components/contact/_lib/colors';
import { normalizeContactConfig } from '@/app/admin/home-components/contact/_lib/normalize';
import type { ContactBrandMode } from '@/app/admin/home-components/contact/_types';
import { getContactMapDataFromSettings } from '@/lib/contact/getContactMapData';
import { useSnapshotDemoContext } from '@/components/modules/homepage/SnapshotDemoProvider';

interface ContactSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: ContactBrandMode;
  title: string;
  snapshotComponentKey?: string;
  isDark?: boolean;
}

export function ContactSection({ config, brandColor, secondary, mode, title, snapshotComponentKey, isDark }: ContactSectionProps) {
  const snapshotDemo = useSnapshotDemoContext();
  const normalizedConfig = React.useMemo(() => normalizeContactConfig(config), [config]);
  const pathname = usePathname();
  const contactSettings = useQuery(api.settings.listByGroup, { group: 'contact' });
  const snapshotData = React.useMemo(() => {
    if (!snapshotDemo || !snapshotComponentKey) {return null;}
    const data = snapshotDemo.getComponentData(snapshotComponentKey);
    return data?.kind === 'contact' ? data : null;
  }, [snapshotDemo, snapshotComponentKey]);
  const mapData = React.useMemo(() => {
    if (snapshotData) {
      return getContactMapDataFromSettings(Object.entries(snapshotData.settings).map(([key, value]) => ({
        _creationTime: 0,
        _id: key,
        group: 'contact',
        key,
        value,
      })));
    }
    return getContactMapDataFromSettings(contactSettings ?? []);
  }, [contactSettings, snapshotData]);

  const validation = React.useMemo(() => {
    return getContactValidationResult({
      primary: brandColor,
      secondary,
      mode,
      isDark: isDark ?? false,
    });
  }, [brandColor, secondary, mode, isDark]);

  return (
    <ContactSectionShared
      config={normalizedConfig}
      style={normalizedConfig.style}
      tokens={validation.tokens}
      mode={mode}
      context="site"
      title={title}
      mapData={mapData}
      sourcePath={pathname}
      isDark={isDark ?? false}
    />
  );
}
