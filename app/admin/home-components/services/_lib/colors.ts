'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
import type { ServicesBrandMode, ServicesColorTokens, ServicesHarmonyStatus, ServicesAccessibilityPair, ServicesAccessibilityScore } from '../_types';

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

const getSolidShade = (hex: string, lightnessDecrease = 0.12) => {
  const color = safeParseOklch(hex, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, l: clampLightness((color.l ?? 0.6) - lightnessDecrease) }));
};

const getAutoSecondary = (primary: string) => {
  const color = safeParseOklch(primary, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 30) % 360 }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: ServicesBrandMode,
) => {
  const normalizedPrimary = normalizeHex(primary, DEFAULT_BRAND_COLOR);

  if (mode === 'single') {
    return normalizedPrimary;
  }

  if (isValidHexColor(secondary)) {
    return normalizeHex(secondary, normalizedPrimary);
  }

  return getAutoSecondary(normalizedPrimary);
};

export const getHarmonyStatus = (primary: string, secondary: string): ServicesHarmonyStatus => {
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

export const getServicesAccessibilityScore = (
  pairs: ServicesAccessibilityPair[]
): ServicesAccessibilityScore => {
  const failing: ServicesAccessibilityScore['failing'] = [];
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

export const getServicesColors = (
  primary: string,
  secondary: string,
  mode: ServicesBrandMode
): ServicesColorTokens => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);

  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralBorder = '#e2e8f0';
  const neutralText = '#0f172a';
  const mutedText = '#64748b';

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,
    heading: getSolidShade(primaryResolved, 0.12),
    subheading: secondaryResolved,
    sectionAccent: primaryResolved,
    iconColor: primaryResolved,
    bodyText: neutralText,
    mutedText,
    neutralBackground,
    neutralSurface,
    neutralBorder,
    secondaryTint: getSolidTint(secondaryResolved, 0.42),
    primaryTint: getSolidTint(primaryResolved, 0.42),
    cardBackground: neutralSurface,
    cardBorder: neutralBorder,
    cardBorderHover: secondaryResolved,
    numberText: secondaryResolved,
    timelineLine: neutralBorder,
    timelineDotBorder: secondaryResolved,
    buttonText: secondaryResolved,
    buttonBackground: neutralSurface,
    buttonBorder: neutralBorder,
    placeholderBackground: neutralBackground,
    placeholderIconBackground: neutralSurface,
    placeholderIcon: primaryResolved,
    placeholderText: mutedText,
    plusTileBorder: neutralBorder,
    plusTileText: secondaryResolved,
  };
};

export const getServicesValidationResult = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: ServicesBrandMode;
}) => {
  const colors = getServicesColors(primary, secondary, mode);
  const harmonyStatus = getHarmonyStatus(colors.primary, colors.secondary);

  const accessibilityPairs: ServicesAccessibilityPair[] = [
    { background: colors.neutralSurface, text: colors.heading, fontSize: 28, fontWeight: 700, label: 'heading' },
    { background: colors.neutralSurface, text: colors.numberText, fontSize: 16, fontWeight: 700, label: 'number' },
    { background: colors.buttonBackground, text: colors.buttonText, fontSize: 14, fontWeight: 600, label: 'button' },
  ];

  const accessibility = getServicesAccessibilityScore(accessibilityPairs);

  return {
    colors,
    harmonyStatus,
    accessibility,
  };
};
