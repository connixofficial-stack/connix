'use client';

import React from 'react';
import { SpeedDialSectionShared } from '@/app/admin/home-components/speed-dial/_components/SpeedDialSectionShared';
import { normalizeSpeedDialActions } from '@/app/admin/home-components/speed-dial/_lib/colors';
import {
  DEFAULT_SPEED_DIAL_CONFIG,
  normalizeSpeedDialStyle,
} from '@/app/admin/home-components/speed-dial/_lib/constants';
import type {
  SpeedDialAction,
  SpeedDialBrandMode,
  SpeedDialPosition,
} from '@/app/admin/home-components/speed-dial/_types';

interface SpeedDialSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: SpeedDialBrandMode;
  title: string;
  isDark?: boolean;
}

const normalizePosition = (value: unknown): SpeedDialPosition => {
  if (value === 'bottom-left') {return 'bottom-left';}
  return 'bottom-right';
};

const normalizeSiteActions = (input: unknown): SpeedDialAction[] => (
  normalizeSpeedDialActions(input).map((item, idx) => ({
    id: item.key || idx + 1,
    icon: item.icon,
    label: item.label,
    url: item.url,
    bgColor: item.bgColor,
  }))
);

const normalizeBoolean = (value: unknown, fallback: boolean) => (
  typeof value === 'boolean' ? value : fallback
);

export function SpeedDialSection({ config, brandColor, secondary, mode, title, isDark }: SpeedDialSectionProps) {
  const actions = React.useMemo(() => normalizeSiteActions(config.actions), [config.actions]);

  const style = normalizeSpeedDialStyle(typeof config.style === 'string' ? config.style : undefined);
  const position = normalizePosition(config.position);
  const defaultOpen = normalizeBoolean(config.defaultOpen, DEFAULT_SPEED_DIAL_CONFIG.defaultOpen);
  const enableShadow = normalizeBoolean(config.enableShadow, DEFAULT_SPEED_DIAL_CONFIG.enableShadow);

  return (
    <SpeedDialSectionShared
      actions={actions}
      style={style}
      position={position}
      brandColor={brandColor}
      secondary={secondary}
      mode={mode}
      sectionTitle={title}
      context="site"
      defaultOpen={defaultOpen}
      enableShadow={enableShadow}
      isDark={isDark}
    />
  );
}
