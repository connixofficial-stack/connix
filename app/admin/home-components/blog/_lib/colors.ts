'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
import type { BlogStyle } from '../_types';

export type BlogBrandMode = 'single' | 'dual';
export type BlogHarmony = 'analogous' | 'complementary' | 'triadic';

interface BrandPalette {
  solid: string;
  surface: string;
  hover: string;
  active: string;
  border: string;
  disabled: string;
  textOnSolid: string;
  textInteractive: string;
}

export interface BlogColorTokens {
  primary: BrandPalette;
  secondary: BrandPalette;
  neutral: {
    background: string;
    surface: string;
    border: string;
    text: string;
    muted: string;
  };
  heading: string;
  subheading: string;
  sectionBg: string;
  sectionAccentByStyle: Record<BlogStyle, string>;
  cardBg: string;
  cardBorder: string;
  bodyText: string;
  mutedText: string;
  categoryBadgeBg: string;
  categoryBadgeText: string;
  categoryBadgeBorder: string;
  viewAllText: string;
  numberText: string;
  arrowButtonBg: string;
  arrowButtonBorder: string;
  arrowButtonIcon: string;
  imageFallbackBg: string;
  imageFallbackIcon: string;
}

export interface BlogAccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

export interface BlogAccessibilityScore {
  minLc: number;
  failing: Array<BlogAccessibilityPair & { lc: number; threshold: number }>;
}

export interface BlogHarmonyStatus {
  deltaE: number;
  similarity: number;
  isTooSimilar: boolean;
}

const DEFAULT_BRAND_COLOR = '#3b82f6';

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);

const isNonEmptyColor = (value: string) => value.trim().length > 0;

const safeParseOklch = (value: string, fallback: string) => (
  oklch(value) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR)
);

const normalizeHex = (value: string, fallback: string) => {
  const candidate = isNonEmptyColor(value) ? value.trim() : fallback;
  return formatHex(safeParseOklch(candidate, fallback));
};

const getAPCAThreshold = (fontSize = 16, fontWeight = 500) => (
  (fontSize >= 18 || fontWeight >= 600) ? 45 : 60
);

const toRgbTuple = (hexColor: string): [number, number, number] => {
  const parsed = safeParseOklch(hexColor, DEFAULT_BRAND_COLOR);
  const normalizedHex = formatHex(parsed).replace('#', '');
  const r = parseInt(normalizedHex.slice(0, 2), 16);
  const g = parseInt(normalizedHex.slice(2, 4), 16);
  const b = parseInt(normalizedHex.slice(4, 6), 16);
  return [r, g, b];
};

const getAPCALc = (text: string, background: string) => {
  const textRgb = toRgbTuple(text);
  const backgroundRgb = toRgbTuple(background);
  const lc = Math.abs(APCAcontrast(sRGBtoY(textRgb), sRGBtoY(backgroundRgb)));
  return Number.isFinite(lc) ? lc : 0;
};

export const getAPCATextColor = (background: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', background);
  const blackLc = getAPCALc('#000000', background);
  const threshold = getAPCAThreshold(fontSize, fontWeight);

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc >= blackLc ? '#ffffff' : '#0f172a';
};

const ensureAPCATextColor = (
  preferredText: string,
  background: string,
  fontSize = 16,
  fontWeight = 500,
) => {
  const threshold = getAPCAThreshold(fontSize, fontWeight);
  const preferredLc = getAPCALc(preferredText, background);
  if (preferredLc >= threshold) {
    return preferredText;
  }
  return getAPCATextColor(background, fontSize, fontWeight);
};

const srgbToLinear = (channel: number) => {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const getRelativeLuminance = (hexColor: string) => {
  const [r, g, b] = toRgbTuple(hexColor);
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

const getContrastRatio = (l1: number, l2: number) => {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const pickReadableTextOnSolid = (background: string) => {
  const backgroundLuminance = getRelativeLuminance(background);
  const whiteContrast = getContrastRatio(1, backgroundLuminance);
  const nearBlackContrast = getContrastRatio(backgroundLuminance, 0.005);

  return whiteContrast >= nearBlackContrast ? '#ffffff' : '#111111';
};

const getOKLCH = (hex: string, fallback = DEFAULT_BRAND_COLOR) => {
  const parsed = safeParseOklch(hex, fallback);
  return {
    l: parsed.l ?? 0.62,
    c: parsed.c ?? 0.12,
    h: parsed.h ?? 0,
    mode: 'oklch' as const,
  };
};

const buildPalette = (hex: string, fallback = DEFAULT_BRAND_COLOR): BrandPalette => {
  const solid = normalizeHex(hex, fallback);
  const color = getOKLCH(solid, fallback);

  return {
    solid,
    surface: formatHex(oklch({ ...color, l: clampLightness(color.l + 0.36), c: color.c * 0.78 })),
    hover: formatHex(oklch({ ...color, l: clampLightness(color.l - 0.07) })),
    active: formatHex(oklch({ ...color, l: clampLightness(color.l - 0.12) })),
    border: formatHex(oklch({ ...color, l: clampLightness(color.l + 0.22), c: color.c * 0.75 })),
    disabled: formatHex(oklch({ ...color, l: clampLightness(color.l + 0.26), c: color.c * 0.42 })),
    textOnSolid: getAPCATextColor(solid, 14, 700),
    textInteractive: formatHex(oklch({ ...color, l: clampLightness(color.l - 0.24), c: color.c * 0.88 })),
  };
};

const getHarmonyColor = (primary: string, harmony: BlogHarmony) => {
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
  mode: BlogBrandMode,
  harmony: BlogHarmony = 'analogous',
) => {
  const primaryNormalized = normalizeHex(primary, DEFAULT_BRAND_COLOR);

  if (mode === 'single') {
    return primaryNormalized;
  }

  if (isNonEmptyColor(secondary)) {
    return normalizeHex(secondary, primaryNormalized);
  }

  return getHarmonyColor(primaryNormalized, harmony);
};

export const getHarmonyStatus = (primary: string, secondary: string): BlogHarmonyStatus => {
  const primaryNormalized = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryNormalized = normalizeHex(secondary, primaryNormalized);
  const delta = differenceEuclidean('oklch')(primaryNormalized, secondaryNormalized);
  const safeDelta = Number.isFinite(delta) ? delta : 1;
  const similarity = 1 - Math.min(safeDelta, 1);
  const deltaE = Math.round(safeDelta * 100);

  return {
    deltaE,
    similarity,
    isTooSimilar: deltaE < 20,
  };
};

export const getBlogAccessibilityScore = (pairs: BlogAccessibilityPair[]): BlogAccessibilityScore => {
  const failing: BlogAccessibilityScore['failing'] = [];
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

export const getBlogColorTokens = ({
  primary,
  secondary,
  mode,
  harmony = 'analogous',
}: {
  primary: string;
  secondary: string;
  mode: BlogBrandMode;
  harmony?: BlogHarmony;
}): BlogColorTokens => {
  const primaryNormalized = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryNormalized, secondary, mode, harmony);

  const primaryPalette = buildPalette(primaryNormalized);
  const secondaryPalette = buildPalette(secondaryResolved, primaryPalette.solid);

  const neutral = {
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    muted: '#475569',
  };

  const heading = ensureAPCATextColor(primaryPalette.solid, neutral.surface, 32, 700);
  const subheading = ensureAPCATextColor(secondaryPalette.textInteractive, neutral.surface, 12, 600);
  const categoryBadgeBg = secondaryPalette.surface;
  const badgeTextCandidate = pickReadableTextOnSolid(categoryBadgeBg);
  const categoryBadgeText = ensureAPCATextColor(badgeTextCandidate, categoryBadgeBg, 12, 600);

  return {
    primary: primaryPalette,
    secondary: secondaryPalette,
    neutral,
    heading,
    subheading,
    sectionBg: neutral.surface,
    sectionAccentByStyle: {
      layout1: primaryPalette.solid,
      layout2: primaryPalette.solid,
      layout3: secondaryPalette.solid,
      layout4: secondaryPalette.solid,
      layout5: primaryPalette.solid,
      layout6: primaryPalette.solid,
      layout7: primaryPalette.solid,
    },
    cardBg: neutral.surface,
    cardBorder: neutral.border,
    bodyText: neutral.text,
    mutedText: neutral.muted,
    categoryBadgeBg,
    categoryBadgeText,
    categoryBadgeBorder: neutral.border,
    viewAllText: ensureAPCATextColor(secondaryPalette.textInteractive, neutral.surface, 14, 600),
    numberText: ensureAPCATextColor(primaryPalette.textInteractive, neutral.surface, 20, 700),
    arrowButtonBg: neutral.surface,
    arrowButtonBorder: neutral.border,
    arrowButtonIcon: ensureAPCATextColor(primaryPalette.solid, neutral.surface, 16, 600),
    imageFallbackBg: neutral.background,
    imageFallbackIcon: primaryPalette.solid,
  };
};

export const getBlogValidationResult = ({
  primary,
  secondary,
  mode,
  harmony = 'analogous',
}: {
  primary: string;
  secondary: string;
  mode: BlogBrandMode;
  harmony?: BlogHarmony;
}) => {
  const tokens = getBlogColorTokens({ primary, secondary, mode, harmony });
  const resolvedSecondary = resolveSecondaryForMode(primary, secondary, mode, harmony);
  const harmonyStatus = mode === 'single'
    ? { deltaE: 100, similarity: 0, isTooSimilar: false }
    : getHarmonyStatus(tokens.primary.solid, resolvedSecondary);

  const accessibility = getBlogAccessibilityScore([
    { background: tokens.sectionBg, text: tokens.heading, fontSize: 32, fontWeight: 700, label: 'heading' },
    { background: tokens.cardBg, text: tokens.bodyText, fontSize: 16, fontWeight: 500, label: 'body' },
    { background: tokens.categoryBadgeBg, text: tokens.categoryBadgeText, fontSize: 12, fontWeight: 600, label: 'badge' },
    { background: tokens.sectionBg, text: tokens.viewAllText, fontSize: 14, fontWeight: 600, label: 'viewAll' },
    { background: tokens.arrowButtonBg, text: tokens.arrowButtonIcon, fontSize: 16, fontWeight: 600, label: 'arrow' },
  ]);

  return {
    tokens,
    resolvedSecondary,
    harmonyStatus,
    accessibility,
  };
};
