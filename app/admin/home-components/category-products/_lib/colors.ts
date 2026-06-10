'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
import type { CategoryProductsBrandMode, CategoryProductsHarmony } from '../_types';

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

const getAPCALc = (text: string, background: string) => {
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

export const normalizeCategoryProductsHarmony = (value?: string): CategoryProductsHarmony => {
  if (value === 'complementary' || value === 'triadic' || value === 'analogous') {
    return value;
  }
  return 'analogous';
};

export const getHarmonyColor = (primary: string, harmony: CategoryProductsHarmony) => {
  const color = safeParseOklch(primary, DEFAULT_BRAND_COLOR);

  if (harmony === 'complementary') {
    return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 180) % 360 }));
  }

  if (harmony === 'triadic') {
    return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 120) % 360 }));
  }

  return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 30) % 360 }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: CategoryProductsBrandMode,
  harmony: CategoryProductsHarmony,
) => {
  const normalizedPrimary = normalizeHex(primary, DEFAULT_BRAND_COLOR);

  if (mode === 'single') {
    return normalizedPrimary;
  }

  if (isValidHexColor(secondary)) {
    return normalizeHex(secondary, normalizedPrimary);
  }

  return getHarmonyColor(normalizedPrimary, harmony);
};

export interface CategoryProductsColorTokens {
  primary: string;
  secondary: string;
  heading: string;
  sectionAccent: string;
  bodyText: string;
  mutedText: string;
  neutralBackground: string;
  neutralSurface: string;
  neutralBorder: string;
  cardBackground: string;
  cardBorder: string;
  cardBorderHover: string;
  imageBackground: string;
  iconBackground: string;
  iconColor: string;
  buttonBackground: string;
  buttonBorder: string;
  buttonSolidBackground: string;
  buttonSolidText: string;
  buttonText: string;
  priceText: string;
  pillBackground: string;
  pillBorder: string;
  pillText: string;
  featuredBadgeBackground: string;
  featuredBadgeText: string;
  paginationActive: string;
  paginationInactive: string;
  emptyStateBackground: string;
  emptyStateIconBackground: string;
  emptyStateIcon: string;
  emptyStateText: string;
}

export interface CategoryProductsHarmonyStatus {
  deltaE: number;
  similarity: number;
  isTooSimilar: boolean;
}

export interface CategoryProductsAccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

export interface CategoryProductsAccessibilityScore {
  minLc: number;
  failing: Array<CategoryProductsAccessibilityPair & { lc: number; threshold: number }>;
}

export const getHarmonyStatus = (primary: string, secondary: string): CategoryProductsHarmonyStatus => {
  const primaryNormalized = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryNormalized = normalizeHex(secondary, primaryNormalized);
  const delta = differenceEuclidean('oklch')(primaryNormalized, secondaryNormalized);
  const safeDelta = Number.isFinite(delta) ? delta : 1;
  const deltaE = Math.round(safeDelta * 100);

  return {
    deltaE,
    similarity: 1 - Math.min(safeDelta, 1),
    isTooSimilar: deltaE < 20,
  };
};

export const getCategoryProductsAccessibilityScore = (
  pairs: CategoryProductsAccessibilityPair[]
): CategoryProductsAccessibilityScore => {
  const failing: CategoryProductsAccessibilityScore['failing'] = [];
  let minLc = Number.POSITIVE_INFINITY;

  pairs.forEach((pair) => {
    const fontSize = pair.fontSize ?? 16;
    const fontWeight = pair.fontWeight ?? 500;
    const threshold = getAPCAThreshold(fontSize, fontWeight);
    const lc = getAPCALc(pair.text, pair.background);
    minLc = Math.min(minLc, lc);

    if (lc < threshold) {
      failing.push({ ...pair, lc, threshold });
    }
  });

  return {
    minLc: Number.isFinite(minLc) ? minLc : 0,
    failing,
  };
};

export const getCategoryProductsColors = (
  primary: string,
  secondary: string,
  mode: CategoryProductsBrandMode,
  harmony: CategoryProductsHarmony = 'analogous'
): CategoryProductsColorTokens => {
  const normalizedHarmony = normalizeCategoryProductsHarmony(harmony);
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode, normalizedHarmony);

  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralBorder = '#e2e8f0';
  const neutralText = '#0f172a';
  const mutedText = '#64748b';

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,
    heading: primaryResolved,
    sectionAccent: primaryResolved,
    bodyText: neutralText,
    mutedText,
    neutralBackground,
    neutralSurface,
    neutralBorder,
    cardBackground: neutralSurface,
    cardBorder: neutralBorder,
    cardBorderHover: secondaryResolved,
    imageBackground: neutralBackground,
    iconBackground: neutralSurface,
    iconColor: primaryResolved,
    buttonBackground: neutralSurface,
    buttonBorder: neutralBorder,
    buttonSolidBackground: secondaryResolved,
    buttonSolidText: getAPCATextColor(secondaryResolved, 12, 700),
    buttonText: secondaryResolved,
    priceText: secondaryResolved,
    pillBackground: neutralSurface,
    pillBorder: neutralBorder,
    pillText: secondaryResolved,
    featuredBadgeBackground: primaryResolved,
    featuredBadgeText: getAPCATextColor(primaryResolved, 12, 700),
    paginationActive: secondaryResolved,
    paginationInactive: neutralBorder,
    emptyStateBackground: neutralBackground,
    emptyStateIconBackground: neutralSurface,
    emptyStateIcon: primaryResolved,
    emptyStateText: mutedText,
  };
};

export const getCategoryProductsValidationResult = ({
  primary,
  secondary,
  mode,
  harmony = 'analogous',
}: {
  primary: string;
  secondary: string;
  mode: CategoryProductsBrandMode;
  harmony?: CategoryProductsHarmony;
}) => {
  const colors = getCategoryProductsColors(primary, secondary, mode, harmony);
  const harmonyStatus = getHarmonyStatus(colors.primary, colors.secondary);

  const secondaryTint = getSolidTint(colors.secondary, 0.42);

  const accessibilityPairs: CategoryProductsAccessibilityPair[] = [
    { background: colors.neutralSurface, text: colors.heading, fontSize: 24, fontWeight: 700, label: 'heading' },
    ...(mode === 'dual'
      ? [{ background: colors.neutralSurface, text: colors.buttonText, fontSize: 14, fontWeight: 600, label: 'secondary-action' }]
      : []),
    { background: colors.featuredBadgeBackground, text: colors.featuredBadgeText, fontSize: 12, fontWeight: 700, label: 'featured-badge' },
    { background: colors.pillBackground, text: colors.pillText, fontSize: 12, fontWeight: 600, label: 'pill-label' },
    { background: secondaryTint, text: getAPCATextColor(secondaryTint, 12, 600), fontSize: 12, fontWeight: 600, label: 'secondary-tint' },
  ];

  const accessibility = getCategoryProductsAccessibilityScore(accessibilityPairs);

  return {
    colors,
    harmonyStatus,
    accessibility,
  };
};
