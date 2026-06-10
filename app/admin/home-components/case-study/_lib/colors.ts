'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
import type { CaseStudyBrandMode, CaseStudyStyle } from '../_types';

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

const ensureAPCATextColor = (
  preferred: string,
  background: string,
  fontSize = 16,
  fontWeight = 500,
) => {
  const threshold = getAPCAThreshold(fontSize, fontWeight);
  const preferredLc = getAPCALc(preferred, background);

  if (preferredLc >= threshold) {
    return preferred;
  }

  return getAPCATextColor(background, fontSize, fontWeight);
};

const getSolidTint = (hex: string, lightnessIncrease = 0.42) => {
  const color = safeParseOklch(hex, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, l: clampLightness((color.l ?? 0.62) + lightnessIncrease) }));
};

const getPalette = (hex: string, fallback = DEFAULT_BRAND_COLOR) => {
  const solid = normalizeHex(hex, fallback);
  const color = safeParseOklch(solid, fallback);
  const l = color.l ?? 0.62;
  const c = color.c ?? 0.12;

  return {
    solid,
    surface: formatHex(oklch({ ...color, l: clampLightness(l + 0.36), c: c * 0.78 })),
    border: formatHex(oklch({ ...color, l: clampLightness(l + 0.26), c: c * 0.72 })),
    interactive: formatHex(oklch({ ...color, l: clampLightness(l - 0.24), c: c * 0.9 })),
  };
};

const getAutoSecondary = (primary: string) => {
  const color = safeParseOklch(primary, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 30) % 360 }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: CaseStudyBrandMode,
) => {
  const primaryNormalized = normalizeHex(primary, DEFAULT_BRAND_COLOR);

  if (mode === 'single') {
    return primaryNormalized;
  }

  if (isValidHexColor(secondary)) {
    return normalizeHex(secondary, primaryNormalized);
  }

  return getAutoSecondary(primaryNormalized);
};

export interface CaseStudyColorTokens {
  primary: string;
  secondary: string;
  neutralBackground: string;
  neutralSurface: string;
  neutralBorder: string;
  neutralText: string;
  mutedText: string;
  heading: string;
  badgeBackground: string;
  badgeText: string;
  cardBorder: string;
  cardBorderHover: string;
  actionText: string;
  timelineLine: string;
  timelineDotBorder: string;
  timelineDotText: string;
  carouselArrowBorder: string;
  carouselArrowIcon: string;
  imageBackground: string;
  imageIcon: string;
}

export interface CaseStudyHarmonyStatus {
  deltaE: number;
  similarity: number;
  isTooSimilar: boolean;
}

export interface CaseStudyAccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

export interface CaseStudyAccessibilityScore {
  minLc: number;
  failing: Array<CaseStudyAccessibilityPair & { lc: number; threshold: number }>;
}

export const getHarmonyStatus = (primary: string, secondary: string): CaseStudyHarmonyStatus => {
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

export const getCaseStudyAccessibilityScore = (
  pairs: CaseStudyAccessibilityPair[]
): CaseStudyAccessibilityScore => {
  const failing: CaseStudyAccessibilityScore['failing'] = [];
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

export const getCaseStudyColors = (
  primary: string,
  secondary: string,
  mode: CaseStudyBrandMode,
): CaseStudyColorTokens => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);

  const primaryPalette = getPalette(primaryResolved, DEFAULT_BRAND_COLOR);
  const secondaryPalette = getPalette(secondaryResolved, primaryPalette.solid);

  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralBorder = '#e2e8f0';
  const neutralText = '#0f172a';
  const mutedText = '#64748b';

  const badgeBackground = secondaryPalette.surface;
  const badgeText = ensureAPCATextColor('#0f172a', badgeBackground, 12, 600);

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,
    neutralBackground,
    neutralSurface,
    neutralBorder,
    neutralText,
    mutedText,
    heading: primaryResolved,
    badgeBackground,
    badgeText,
    cardBorder: neutralBorder,
    cardBorderHover: secondaryResolved,
    actionText: secondaryPalette.interactive,
    timelineLine: neutralBorder,
    timelineDotBorder: primaryResolved,
    timelineDotText: secondaryPalette.interactive,
    carouselArrowBorder: neutralBorder,
    carouselArrowIcon: secondaryPalette.interactive,
    imageBackground: neutralBackground,
    imageIcon: primaryResolved,
  };
};

export const getCaseStudyValidationResult = ({
  primary,
  secondary,
  mode,
  style,
}: {
  primary: string;
  secondary: string;
  mode: CaseStudyBrandMode;
  style?: CaseStudyStyle;
}) => {
  const colors = getCaseStudyColors(primary, secondary, mode);
  const harmonyStatus = mode === 'dual'
    ? getHarmonyStatus(colors.primary, colors.secondary)
    : { deltaE: 100, similarity: 0, isTooSimilar: false };

  const headingSize = style === 'featured' ? 30 : 24;
  const actionTint = getSolidTint(colors.secondary, 0.42);

  const accessibilityPairs: CaseStudyAccessibilityPair[] = [
    { background: colors.neutralSurface, text: colors.heading, fontSize: headingSize, fontWeight: 700, label: 'heading' },
    { background: colors.neutralSurface, text: colors.neutralText, fontSize: 16, fontWeight: 500, label: 'body' },
    { background: colors.badgeBackground, text: colors.badgeText, fontSize: 12, fontWeight: 600, label: 'badge' },
    { background: colors.neutralSurface, text: colors.actionText, fontSize: 14, fontWeight: 600, label: 'action' },
    { background: actionTint, text: getAPCATextColor(actionTint, 12, 600), fontSize: 12, fontWeight: 600, label: 'accent-tint' },
  ];

  const accessibility = getCaseStudyAccessibilityScore(accessibilityPairs);

  return {
    colors,
    harmonyStatus,
    accessibility,
  };
};
