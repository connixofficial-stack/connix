'use client';

import { formatHex, oklch } from 'culori';
import type { MarqueeBrandMode } from '../_types';

const DEFAULT_BRAND_COLOR = '#3b82f6';
const FALLBACK_PRIMARY = '#1d4ed8';

const safeParseOklch = (input: string, fallback: string) => (
  oklch(input) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR)
);

const normalizeHex = (hex: string, fallback: string) => formatHex(safeParseOklch(hex, fallback));

const setLightness = (hex: string, lightness: number, fallback: string) => {
  const color = safeParseOklch(hex, fallback);
  return formatHex(oklch({ ...color, l: Math.min(Math.max(lightness, 0.08), 0.98) }));
};

const isValidHexColor = (value: string) => /^#[0-9A-F]{6}$/i.test((value ?? '').trim());

const getAutoSecondary = (hex: string) => {
  const base = safeParseOklch(hex, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...base, h: ((base.h ?? 0) + 26) % 360 }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: MarqueeBrandMode,
) => {
  const primaryResolved = normalizeHex(primary, FALLBACK_PRIMARY);
  if (mode === 'single') { return primaryResolved; }
  if (isValidHexColor(secondary)) { return normalizeHex(secondary, primaryResolved); }
  return normalizeHex(getAutoSecondary(primaryResolved), primaryResolved);
};

export interface MarqueeColorTokens {
  primary: string;
  secondary: string;
  // Ribbon — solid brand band
  ribbonBg: string;
  ribbonText: string;
  // Gradient — multi-color band
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  gradientText: string;
  // Minimal — clean light background
  minimalBg: string;
  minimalText: string;
  minimalBorder: string;
  // Dark — dark mode band
  darkBg: string;
  darkText: string;
  darkAccent: string;
  // Split — two-tone rows
  splitBgTop: string;
  splitBgBottom: string;
  splitTextTop: string;
  splitTextBottom: string;
  // Stripe — striped pattern
  stripeBg: string;
  stripeAlt: string;
  stripeText: string;
  // Neutral
  neutralBg: string;
  neutralText: string;
  neutralBorder: string;
}

export const getMarqueeColorTokens = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: MarqueeBrandMode;
}): MarqueeColorTokens => {
  const p = normalizeHex(primary, FALLBACK_PRIMARY);
  const s = resolveSecondaryForMode(p, secondary, mode);

  return {
    primary: p,
    secondary: s,
    // Ribbon
    ribbonBg: p,
    ribbonText: '#ffffff',
    // Gradient
    gradientFrom: p,
    gradientVia: setLightness(s, 0.55, p),
    gradientTo: s,
    gradientText: '#ffffff',
    // Minimal
    minimalBg: '#ffffff',
    minimalText: '#1e293b',
    minimalBorder: '#e2e8f0',
    // Dark
    darkBg: '#000000',
    darkText: '#f1f5f9',
    darkAccent: p,
    // Split
    splitBgTop: p,
    splitBgBottom: s,
    splitTextTop: '#ffffff',
    splitTextBottom: '#ffffff',
    // Stripe
    stripeBg: setLightness(p, 0.96, p),
    stripeAlt: setLightness(p, 0.92, p),
    stripeText: p,
    // Neutral
    neutralBg: '#f8fafc',
    neutralText: '#0f172a',
    neutralBorder: '#e2e8f0',
  };
};

export const getMarqueeSectionColors = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: MarqueeBrandMode;
}) => getMarqueeColorTokens({ primary, secondary, mode });
