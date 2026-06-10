'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';
import type { ProcessBrandMode } from '../_types';

const DEFAULT_BRAND_COLOR = '#3b82f6';

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);

const safeParseOklch = (value: string, fallback: string) => (
  oklch(value) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR)
);

const normalizeHex = (value: string, fallback: string) => {
  const candidate = value.trim().length > 0 ? value.trim() : fallback;
  return formatHex(safeParseOklch(candidate, fallback));
};

const isValidHexColor = (value: string) => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());

const getAPCAThreshold = (fontSize = 16, fontWeight = 500) => (
  (fontSize >= 18 || fontWeight >= 700) ? 45 : 60
);

const toRgbTuple = (value: string, fallback: string): [number, number, number] | null => {
  const parsed = safeParseOklch(value, fallback);
  const normalized = formatHex(parsed).replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return [r, g, b];
};

export const getAPCALc = (text: string, background: string) => {
  const textRgb = toRgbTuple(text, '#ffffff');
  const backgroundRgb = toRgbTuple(background, '#0f172a');

  if (!textRgb || !backgroundRgb) {
    return 0;
  }

  const lc = Math.abs(APCAcontrast(sRGBtoY(textRgb), sRGBtoY(backgroundRgb)));
  return Number.isFinite(lc) ? lc : 0;
};

export const getAPCATextColor = (background: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', background);
  const blackLc = getAPCALc('#000000', background);
  const threshold = getAPCAThreshold(fontSize, fontWeight);

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc > blackLc ? '#ffffff' : '#0f172a';
};

const getSolidTint = (hex: string, lightnessIncrease = 0.42) => {
  const color = safeParseOklch(hex, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, l: clampLightness((color.l ?? 0.6) + lightnessIncrease) }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: ProcessBrandMode,
) => {
  const normalizedPrimary = normalizeHex(primary, DEFAULT_BRAND_COLOR);

  if (mode === 'single') {
    return normalizedPrimary;
  }

  if (isValidHexColor(secondary)) {
    return normalizeHex(secondary, normalizedPrimary);
  }

  return normalizedPrimary;
};

export interface ProcessColorTokens {
  primary: string;
  secondary: string;
  heading: string;
  bodyText: string;
  mutedText: string;
  neutralBackground: string;
  neutralSurface: string;
  neutralBorder: string;
  sectionBadgeBg: string;
  sectionBadgeText: string;
  sectionBadgeBorder: string;
  progressTrack: string;
  progressFill: string;
  stepDotBg: string;
  stepDotText: string;
  stepDotShadow: string;
  connectorLine: string;
  cardBorder: string;
  cardHoverBorder: string;
  cardAccentBackground: string;
  cardStepBg: string;
  cardStepText: string;
  accordionBorder: string;
  accordionActiveBorder: string;
  accordionActiveShadow: string;
  arrowIcon: string;
  emptyIconBg: string;
  emptyIconColor: string;
}

export const getProcessColors = (
  primary: string,
  secondary: string,
  mode: ProcessBrandMode,
): ProcessColorTokens => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);

  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralBorder = '#e2e8f0';

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,
    heading: primaryResolved,
    bodyText: '#0f172a',
    mutedText: '#64748b',
    neutralBackground,
    neutralSurface,
    neutralBorder,
    sectionBadgeBg: neutralSurface,
    sectionBadgeText: secondaryResolved,
    sectionBadgeBorder: neutralBorder,
    progressTrack: neutralBorder,
    progressFill: primaryResolved,
    stepDotBg: primaryResolved,
    stepDotText: getAPCATextColor(primaryResolved, 12, 700),
    stepDotShadow: `${primaryResolved}26`,
    connectorLine: neutralBorder,
    cardBorder: neutralBorder,
    cardHoverBorder: secondaryResolved,
    cardAccentBackground: `linear-gradient(to right, ${primaryResolved}, ${secondaryResolved})`,
    cardStepBg: primaryResolved,
    cardStepText: getAPCATextColor(primaryResolved, 14, 700),
    accordionBorder: neutralBorder,
    accordionActiveBorder: primaryResolved,
    accordionActiveShadow: `${primaryResolved}18`,
    arrowIcon: '#334155',
    emptyIconBg: getSolidTint(primaryResolved, 0.42),
    emptyIconColor: primaryResolved,
  };
};
