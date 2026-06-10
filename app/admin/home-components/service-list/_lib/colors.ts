'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
import type {
  ServiceListBrandMode,
} from '../_types';

const DEFAULT_BRAND_COLOR = '#3b82f6';

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);
const clampChroma = (value: number) => Math.min(Math.max(value, 0.02), 0.35);

const safeParseOklch = (value: string, fallback: string) => (
  oklch(value) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR)
);

const normalizeHex = (value: string, fallback: string) => {
  const candidate = value.trim().length > 0 ? value.trim() : fallback;
  return formatHex(safeParseOklch(candidate, fallback));
};

const isValidHexColor = (value: string) => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());

const withAlpha = (hex: string, alpha: number, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  const l = clampLightness(color.l ?? 0.62);
  const c = clampChroma(color.c ?? 0.14);
  const h = Number.isFinite(color.h) ? color.h : 0;
  const a = Math.min(Math.max(alpha, 0), 1);
  return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(3)} ${h.toFixed(2)} / ${a.toFixed(3)})`;
};

const shiftColor = (hex: string, lightnessDelta: number, chromaScale = 1, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  return formatHex(oklch({
    ...color,
    l: clampLightness((color.l ?? 0.62) + lightnessDelta),
    c: clampChroma((color.c ?? 0.14) * chromaScale),
  }));
};

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
  return whiteLc >= blackLc ? '#ffffff' : '#0f172a';
};

const resolveBrandTextOnBackground = (
  preferred: string,
  background: string,
  fontSize = 14,
  fontWeight = 500,
  fallback = '#0f172a',
) => {
  const threshold = getAPCAThreshold(fontSize, fontWeight);
  const candidates = [
    normalizeHex(preferred, fallback),
    shiftColor(preferred, -0.12, 1, fallback),
    shiftColor(preferred, -0.24, 1, fallback),
    shiftColor(preferred, -0.36, 1, fallback),
  ];

  for (const candidate of candidates) {
    if (getAPCALc(candidate, background) >= threshold) {
      return candidate;
    }
  }

  const auto = getAPCATextColor(background, fontSize, fontWeight);
  return auto === '#ffffff' ? fallback : auto;
};

export const getHarmonyColor = (primary: string) => {
  const color = safeParseOklch(primary, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 30) % 360 }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: ServiceListBrandMode,
) => {
  const normalizedPrimary = normalizeHex(primary, DEFAULT_BRAND_COLOR);

  if (mode === 'single') {
    return normalizedPrimary;
  }

  if (isValidHexColor(secondary)) {
    return normalizeHex(secondary, normalizedPrimary);
  }

  return getHarmonyColor(normalizedPrimary);
};

interface ServiceListPalette {
  solid: string;
  textOnSolid: string;
  surface: string;
  border: string;
  hoverSurface: string;
  activeSurface: string;
  interactiveText: string;
}

const buildPalette = (hex: string, fallback = DEFAULT_BRAND_COLOR): ServiceListPalette => {
  const solid = normalizeHex(hex, fallback);
  const surface = shiftColor(solid, 0.35, 0.75, fallback);
  const border = shiftColor(solid, 0.2, 0.68, fallback);
  const hoverSurface = shiftColor(solid, 0.29, 0.78, fallback);
  const activeSurface = shiftColor(solid, 0.22, 0.82, fallback);
  const interactiveText = shiftColor(solid, -0.18, 0.95, fallback);

  return {
    solid,
    textOnSolid: getAPCATextColor(solid, 14, 600),
    surface,
    border,
    hoverSurface,
    activeSurface,
    interactiveText: getAPCATextColor(surface, 14, 500) === '#ffffff'
      ? '#ffffff'
      : interactiveText,
  };
};

export interface ServiceListColorTokens {
  primary: string;
  secondary: string;

  neutralBackground: string;
  neutralSurface: string;
  neutralBorder: string;
  neutralText: string;
  mutedText: string;

  heading: string;
  sectionAccent: string;

  cardBackground: string;
  cardBorder: string;
  cardBorderHover: string;

  imageFallbackBg: string;
  imageFallbackIcon: string;

  subtitleText: string;
  titleText: string;
  descriptionText: string;
  priceText: string;
  inlineMetaText: string;

  badgeHotBg: string;
  badgeHotText: string;
  badgeNewBg: string;
  badgeNewBorder: string;
  badgeNewText: string;

  ctaGhostText: string;
  ctaGhostBorder: string;
  ctaGhostHoverBg: string;

  ctaSolidBg: string;
  ctaSolidText: string;
  ctaSolidHoverBg: string;

  navButtonBg: string;
  navButtonBorder: string;
  navButtonText: string;

  dotActive: string;
  dotInactive: string;

  featuredOverlayScrim: string;
  featuredOverlayText: string;
  featuredOverlaySubtle: string;
}

export interface ServiceListHarmonyStatus {
  deltaE: number;
  similarity: number;
  isTooSimilar: boolean;
}

export interface ServiceListAccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

export interface ServiceListAccessibilityScore {
  minLc: number;
  failing: Array<ServiceListAccessibilityPair & { lc: number; threshold: number }>;
}

export const getHarmonyStatus = (primary: string, secondary: string): ServiceListHarmonyStatus => {
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

export const getServiceListAccessibilityScore = (
  pairs: ServiceListAccessibilityPair[]
): ServiceListAccessibilityScore => {
  const failing: ServiceListAccessibilityScore['failing'] = [];
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

export const getServiceListColorTokens = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: ServiceListBrandMode;
}): ServiceListColorTokens => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);

  const primaryPalette = buildPalette(primaryResolved, DEFAULT_BRAND_COLOR);
  const secondaryPalette = buildPalette(secondaryResolved, primaryResolved);

  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralBorder = '#e2e8f0';
  const neutralText = '#0f172a';
  const mutedText = '#64748b';

  const badgeNewBg = neutralSurface;
  const badgeNewBorder = primaryPalette.border;
  const badgeNewText = resolveBrandTextOnBackground(primaryPalette.solid, badgeNewBg, 11, 600, neutralText);

  const navButtonBg = primaryPalette.surface;
  const navButtonBorder = primaryPalette.border;
  const navButtonText = resolveBrandTextOnBackground(primaryPalette.solid, navButtonBg, 14, 600, neutralText);

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,

    neutralBackground,
    neutralSurface,
    neutralBorder,
    neutralText,
    mutedText,

    heading: primaryPalette.solid,
    sectionAccent: secondaryPalette.solid,

    cardBackground: neutralSurface,
    cardBorder: neutralBorder,
    cardBorderHover: primaryPalette.border,

    imageFallbackBg: neutralBackground,
    imageFallbackIcon: primaryPalette.solid,

    subtitleText: secondaryPalette.interactiveText,
    titleText: neutralText,
    descriptionText: mutedText,
    priceText: primaryPalette.solid,
    inlineMetaText: primaryPalette.interactiveText,

    badgeHotBg: secondaryPalette.solid,
    badgeHotText: secondaryPalette.textOnSolid,
    badgeNewBg,
    badgeNewBorder,
    badgeNewText,

    ctaGhostText: primaryPalette.interactiveText,
    ctaGhostBorder: primaryPalette.border,
    ctaGhostHoverBg: primaryPalette.surface,

    ctaSolidBg: primaryPalette.solid,
    ctaSolidText: primaryPalette.textOnSolid,
    ctaSolidHoverBg: primaryPalette.hoverSurface,

    navButtonBg,
    navButtonBorder,
    navButtonText,

    dotActive: primaryPalette.solid,
    dotInactive: withAlpha(primaryPalette.solid, 0.3, primaryResolved),

    featuredOverlayScrim: 'linear-gradient(to top, rgba(2,6,23,0.84), rgba(2,6,23,0.32), rgba(2,6,23,0.06))',
    featuredOverlayText: '#ffffff',
    featuredOverlaySubtle: withAlpha(secondaryPalette.solid, 0.74, primaryResolved),
  };
};

export const getServiceListValidationResult = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: ServiceListBrandMode;
}) => {
  const tokens = getServiceListColorTokens({
    primary,
    secondary,
    mode,
  });

  const harmonyStatus = mode === 'single'
    ? { deltaE: 100, similarity: 0, isTooSimilar: false }
    : getHarmonyStatus(tokens.primary, tokens.secondary);

  const accessibility = getServiceListAccessibilityScore([
    { background: tokens.neutralSurface, text: tokens.heading, fontSize: 28, fontWeight: 700, label: 'heading' },
    { background: tokens.cardBackground, text: tokens.titleText, fontSize: 16, fontWeight: 600, label: 'title' },
    { background: tokens.cardBackground, text: tokens.descriptionText, fontSize: 14, fontWeight: 400, label: 'description' },
    { background: tokens.cardBackground, text: tokens.priceText, fontSize: 14, fontWeight: 700, label: 'price' },
    { background: tokens.badgeHotBg, text: tokens.badgeHotText, fontSize: 11, fontWeight: 700, label: 'badge-hot' },
    { background: tokens.badgeNewBg, text: tokens.badgeNewText, fontSize: 11, fontWeight: 600, label: 'badge-new' },
    { background: tokens.ctaSolidBg, text: tokens.ctaSolidText, fontSize: 14, fontWeight: 600, label: 'cta-solid' },
  ]);

  return {
    tokens,
    harmonyStatus,
    accessibility,
    resolvedSecondary: tokens.secondary,
  };
};
