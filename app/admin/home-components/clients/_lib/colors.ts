'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
import type {
  ClientsBrandMode,
  ClientsStyle,
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

const shiftColor = (hex: string, lightnessDelta: number, chromaScale = 1, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  return formatHex(oklch({
    ...color,
    l: clampLightness((color.l ?? 0.62) + lightnessDelta),
    c: clampChroma((color.c ?? 0.14) * chromaScale),
  }));
};

const withAlpha = (hex: string, alpha: number, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  const l = clampLightness(color.l ?? 0.62);
  const c = clampChroma(color.c ?? 0.14);
  const h = Number.isFinite(color.h) ? color.h : 0;
  const a = Math.min(Math.max(alpha, 0), 1);
  return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(3)} ${h.toFixed(2)} / ${a.toFixed(3)})`;
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

const pickReadableTextOnSolid = (bgHex: string): string => {
  const bgRgb = toRgbTuple(bgHex, '#ffffff');
  if (!bgRgb) {return '#ffffff';}
  
  const bgY = sRGBtoY(bgRgb);
  const whiteY = sRGBtoY([255, 255, 255]);
  const nearBlackY = sRGBtoY([17, 17, 17]);
  
  const whiteContrast = Math.abs(APCAcontrast(whiteY, bgY));
  const blackContrast = Math.abs(APCAcontrast(nearBlackY, bgY));
  
  return whiteContrast > blackContrast ? '#ffffff' : '#111111';
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

export const getAutoSecondary = (primary: string) => {
  const color = safeParseOklch(primary, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 30) % 360 }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: ClientsBrandMode,
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

export interface ClientsColorTokens {
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

  marqueeFade: string;
  waveBadgeBackground: string;
  waveBadgeText: string;

  placeholderBackground: string;
  placeholderIconBackground: string;
  placeholderIcon: string;
  placeholderText: string;

  countBadgeBackground: string;
  countBadgeText: string;
  countBadgeBorder: string;

  navButtonBackground: string;
  navButtonBorder: string;
  navButtonText: string;
}

export interface ClientsHarmonyStatus {
  deltaE: number;
  similarity: number;
  isTooSimilar: boolean;
}

export interface ClientsAccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

export interface ClientsAccessibilityScore {
  minLc: number;
  failing: Array<ClientsAccessibilityPair & { lc: number; threshold: number }>;
}

export interface ClientsAccentBalance {
  primary: number;
  secondary: number;
  neutral: number;
  warnings: string[];
}

export const getHarmonyStatus = (primary: string, secondary: string): ClientsHarmonyStatus => {
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

export const getClientsAccessibilityScore = (
  pairs: ClientsAccessibilityPair[],
): ClientsAccessibilityScore => {
  const failing: ClientsAccessibilityScore['failing'] = [];
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

export const calculateClientsAccentBalance = (
  style: ClientsStyle,
): ClientsAccentBalance => {
  const distributions: Record<ClientsStyle, { primary: number; secondary: number }> = {
    layout01: { primary: 32, secondary: 8 },
    layout02: { primary: 30, secondary: 8 },
    layout03: { primary: 30, secondary: 10 },
    layout04: { primary: 28, secondary: 12 },
    layout05: { primary: 30, secondary: 10 },
    layout06: { primary: 32, secondary: 8 },
    layout07: { primary: 30, secondary: 10 },
    layout08: { primary: 30, secondary: 10 },
  };

  const dist = distributions[style];
  const neutral = 100 - dist.primary - dist.secondary;
  const warnings: string[] = [];

  if (dist.primary < 25) {
    warnings.push(`Primary < 25% (${dist.primary}%)`);
  }
  if (dist.secondary < 5) {
    warnings.push(`Secondary < 5% (${dist.secondary}%)`);
  }

  return {
    primary: dist.primary,
    secondary: dist.secondary,
    neutral,
    warnings,
  };
};

export const getClientsColorTokens = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: ClientsBrandMode;
}): ClientsColorTokens => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);

  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralBorder = '#e2e8f0';
  const neutralText = '#0f172a';
  const mutedText = '#64748b';

  const countBadgeBackground = shiftColor(secondaryResolved, 0.44, 0.72, primaryResolved);
  const countBadgeBorder = shiftColor(secondaryResolved, 0.24, 0.78, primaryResolved);

  const navButtonBackground = shiftColor(secondaryResolved, 0.4, 0.72, primaryResolved);
  const navButtonBorder = shiftColor(secondaryResolved, 0.24, 0.78, primaryResolved);
  const navButtonText = ensureAPCATextColor(secondaryResolved, navButtonBackground, 14, 600);

  const waveBadgeBackground = shiftColor(secondaryResolved, 0.44, 0.72, primaryResolved);
  const waveBadgeCandidate = pickReadableTextOnSolid(waveBadgeBackground);
  const waveBadgeText = ensureAPCATextColor(waveBadgeCandidate, waveBadgeBackground, 10, 700);

  const countBadgeCandidate = pickReadableTextOnSolid(countBadgeBackground);
  const countBadgeText = ensureAPCATextColor(countBadgeCandidate, countBadgeBackground, 11, 700);

  const placeholderIcon = ensureAPCATextColor(primaryResolved, neutralSurface, 22, 400);

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,

    neutralBackground,
    neutralSurface,
    neutralBorder,
    neutralText,
    mutedText,

    heading: primaryResolved,
    sectionAccent: primaryResolved,

    cardBackground: neutralSurface,
    cardBorder: neutralBorder,
    cardBorderHover: secondaryResolved,

    marqueeFade: withAlpha(primaryResolved, 0.14, primaryResolved),
    waveBadgeBackground,
    waveBadgeText,

    placeholderBackground: neutralBackground,
    placeholderIconBackground: neutralSurface,
    placeholderIcon,
    placeholderText: mutedText,

    countBadgeBackground,
    countBadgeText,
    countBadgeBorder,

    navButtonBackground,
    navButtonBorder,
    navButtonText,
  };
};

export const getClientsValidationResult = ({
  primary,
  secondary,
  mode,
  style,
}: {
  primary: string;
  secondary: string;
  mode: ClientsBrandMode;
  style: ClientsStyle;
}) => {
  const tokens = getClientsColorTokens({
    primary,
    secondary,
    mode,
  });

  const harmonyStatus = mode === 'single'
    ? { deltaE: 100, similarity: 0, isTooSimilar: false }
    : getHarmonyStatus(tokens.primary, tokens.secondary);

  const accessibilityPairs: ClientsAccessibilityPair[] = [
    { background: tokens.neutralSurface, text: tokens.heading, fontSize: 28, fontWeight: 700, label: 'heading' },
    { background: tokens.navButtonBackground, text: tokens.navButtonText, fontSize: 14, fontWeight: 600, label: 'nav button' },
    { background: tokens.countBadgeBackground, text: tokens.countBadgeText, fontSize: 11, fontWeight: 700, label: 'count badge' },
  ];

  const accessibility = getClientsAccessibilityScore(accessibilityPairs);

  const accentBalance = calculateClientsAccentBalance(style);

  return {
    tokens,
    resolvedSecondary: tokens.secondary,
    harmonyStatus,
    accessibility,
    accentBalance,
  };
};
