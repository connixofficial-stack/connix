'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { formatHex, oklch } from 'culori';

export const DEFAULT_BRAND_COLOR = '#3b82f6';

const safeOklch = (value: string) => oklch(value) ?? oklch(DEFAULT_BRAND_COLOR);

export const generateComplementary = (hex: string): string => {
  const parsed = safeOklch(hex);
  if (!parsed) {return DEFAULT_BRAND_COLOR;}

  return formatHex(oklch({
    ...parsed,
    h: ((parsed.h ?? 0) + 180) % 360,
  }));
};

const resolveColorSetting = (value: unknown): string | null => {
  if (typeof value !== 'string') {return null;}
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export function useSystemBrandColors() {
  const primarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_primary' });
  const secondarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_secondary' });
  const modeSetting = useQuery(api.settings.getByKey, { key: 'site_brand_mode' });

  const primary = resolveColorSetting(primarySetting?.value)
    ?? DEFAULT_BRAND_COLOR;

  const mode: 'single' | 'dual' = modeSetting?.value === 'single' ? 'single' : 'dual';
  const secondary = mode === 'single'
    ? ''
    : resolveColorSetting(secondarySetting?.value)
      ?? generateComplementary(primary);

  return { primary, secondary, mode };
}
