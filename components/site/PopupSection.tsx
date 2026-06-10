'use client';

import React from 'react';
import { PopupSectionShared } from '@/app/admin/home-components/popup/_components/PopupSectionShared';
import { normalizePopupConfig } from '@/app/admin/home-components/popup/_lib/constants';


interface PopupSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary?: string;
  mode?: 'single' | 'dual';
  title: string;
  isDark?: boolean;
}

export function PopupSection({ config, brandColor, secondary, mode, title, isDark }: PopupSectionProps) {
  const normalizedConfig = React.useMemo(() => normalizePopupConfig(config), [config]);

  return (
    <PopupSectionShared
      config={normalizedConfig}
      brandColor={brandColor}
      secondary={secondary}
      mode={mode}
      sectionTitle={title}
      context="site"
      isDark={isDark}
    />
  );
}
