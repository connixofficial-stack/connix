'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
import type { AboutBrandMode, AboutStyle } from '../_types';

const DEFAULT_BRAND_COLOR = '#3b82f6';
const FALLBACK_TEXT = '#0f172a';
const FALLBACK_SURFACE = '#ffffff';

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);
const clampChroma = (value: number) => Math.min(Math.max(value, 0), 0.4);

const getAPCAThreshold = (fontSize = 16, fontWeight = 500) => (
  (fontSize >= 18 || fontWeight >= 700) ? 45 : 60
);

const safeParseOklch = (value: string, fallback: string) => (
  oklch(value) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR)
);

const normalizeHex = (value: string, fallback: string) => {
  const candidate = typeof value === 'string' && value.trim() ? value.trim() : fallback;
  return formatHex(safeParseOklch(candidate, fallback));
};

const toRgbTuple = (hexColor: string, fallback: string): [number, number, number] => {
  const parsed = safeParseOklch(hexColor, fallback);
  const normalizedHex = formatHex(parsed).replace('#', '');
  const r = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const g = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const b = Number.parseInt(normalizedHex.slice(4, 6), 16);
  return [r, g, b];
};

const getAPCALc = (text: string, background: string) => {
  const textRgb = toRgbTuple(text, '#ffffff');
  const backgroundRgb = toRgbTuple(background, '#0f172a');
  const lc = Math.abs(APCAcontrast(sRGBtoY(textRgb), sRGBtoY(backgroundRgb)));
  return Number.isFinite(lc) ? lc : 0;
};

export const getAPCATextColor = (background: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', background);
  const blackLc = getAPCALc('#000000', background);
  const threshold = getAPCAThreshold(fontSize, fontWeight);

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return FALLBACK_TEXT;}
  return whiteLc >= blackLc ? '#ffffff' : FALLBACK_TEXT;
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

const getSolidTint = (hex: string, lightnessOffset: number, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  const newL = clampLightness((color.l ?? 0.6) + lightnessOffset);
  const c = clampChroma(color.c ?? 0.1);
  const h = Number.isFinite(color.h) ? color.h : 0;

  return formatHex(oklch({ l: newL, c, h, mode: 'oklch' }));
};

const getHarmonyColor = (primary: string) => {
  const color = safeParseOklch(primary, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 30) % 360 }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: AboutBrandMode,
) => {
  const primaryNormalized = normalizeHex(primary, DEFAULT_BRAND_COLOR);

  if (mode === 'single') {
    return primaryNormalized;
  }

  if (typeof secondary === 'string' && secondary.trim()) {
    return normalizeHex(secondary, primaryNormalized);
  }

  return getHarmonyColor(primaryNormalized);
};

export interface AboutColorTokens {
  primary: string;
  secondary: string;
  sectionBg: string;
  sectionAltBg: string;
  neutralSurface: string;
  neutralBorder: string;
  heading: string;
  bodyText: string;
  mutedText: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  ctaSolidBg: string;
  ctaSolidText: string;
  ctaOutlineText: string;
  ctaOutlineBorder: string;
  ctaOutlineBg: string;
  statPrimaryValue: string;
  statPrimaryLabel: string;
  statSecondaryValue: string;
  statSecondaryLabel: string;
  statCardBg: string;
  statCardBorder: string;
  timelineLine: string;
  timelineDotBg: string;
  timelineDotText: string;
  imageFallbackBg: string;
  imageFallbackIcon: string;
  imageOverlayText: string;
  emptyStatBg: string;
  emptyStatIcon: string;
}

export interface AboutAccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

export interface AboutAccessibilityScore {
  minLc: number;
  failing: Array<AboutAccessibilityPair & { lc: number; threshold: number }>;
}

export interface AboutHarmonyStatus {
  deltaE: number;
  similarity: number;
  isTooSimilar: boolean;
}

export const getAboutHarmonyStatus = (primary: string, secondary: string): AboutHarmonyStatus => {
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

export const getAboutAccessibilityScore = (
  pairs: AboutAccessibilityPair[],
): AboutAccessibilityScore => {
  const failing: AboutAccessibilityScore['failing'] = [];
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

export const getAboutColorTokens = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: AboutBrandMode;
}): AboutColorTokens => {
  const primaryNormalized = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryNormalized, secondary, mode);

  const sectionBg = FALLBACK_SURFACE;
  const sectionAltBg = '#f8fafc';
  const neutralSurface = FALLBACK_SURFACE;
  const neutralBorder = '#e2e8f0';
  const bodyText = '#0f172a';
  const mutedText = '#64748b';

  const heading = ensureAPCATextColor(primaryNormalized, sectionBg, 36, 700);

  // Badge Token Contract: validate text trên chính badge bg
  const badgeBg = neutralSurface;
  const badgeText = ensureAPCATextColor(secondaryResolved, badgeBg, 12, 700);

  const ctaSolidBg = primaryNormalized;
  const ctaSolidText = getAPCATextColor(ctaSolidBg, 14, 700);

  // CTA Outline: dùng solid tint thay vì opacity
  const ctaOutlineBg = getSolidTint(primaryNormalized, 0.42);
  const ctaOutlineBorder = getSolidTint(primaryNormalized, 0.35);

  const statPrimaryValue = ensureAPCATextColor(primaryNormalized, sectionBg, 30, 700);
  const statPrimaryLabel = ensureAPCATextColor(mutedText, sectionBg, 12, 500);
  const statSecondaryValue = ensureAPCATextColor(secondaryResolved, sectionBg, 30, 700);
  const statSecondaryLabel = ensureAPCATextColor(mutedText, sectionBg, 12, 500);

  const timelineDotBg = secondaryResolved;
  const timelineDotText = getAPCATextColor(timelineDotBg, 12, 700);

  // Timeline line: dùng solid tint thay vì opacity
  const timelineLine = getSolidTint(secondaryResolved, 0.38);

  // Empty stat: dùng solid tint thay vì opacity
  const emptyStatBg = getSolidTint(primaryNormalized, 0.42);

  return {
    primary: primaryNormalized,
    secondary: secondaryResolved,
    sectionBg,
    sectionAltBg,
    neutralSurface,
    neutralBorder,
    heading,
    bodyText,
    mutedText,
    badgeBg,
    badgeText,
    badgeBorder: neutralBorder,
    ctaSolidBg,
    ctaSolidText,
    ctaOutlineText: ensureAPCATextColor(primaryNormalized, ctaOutlineBg, 14, 700),
    ctaOutlineBorder,
    ctaOutlineBg,
    statPrimaryValue,
    statPrimaryLabel,
    statSecondaryValue,
    statSecondaryLabel,
    statCardBg: neutralSurface,
    statCardBorder: neutralBorder,
    timelineLine,
    timelineDotBg,
    timelineDotText,
    imageFallbackBg: sectionAltBg,
    imageFallbackIcon: '#94a3b8',
    imageOverlayText: '#ffffff',
    emptyStatBg,
    emptyStatIcon: '#cbd5e1',
  };
};

/**
 * Calculate accent balance (estimated)
 * 
 * NOTE: Tỷ lệ này là ước lượng dựa trên style pattern, không đo element thực tế.
 * Skill yêu cầu đo ở content state (data đầy đủ), nhưng static calculation có limitation.
 * Để đo chính xác cần tool analyzer runtime.
 */
const calculateAboutAccentBalance = ({
  mode,
  style,
}: {
  mode: AboutBrandMode;
  style: AboutStyle;
}) => {
  if (mode === 'single') {
    return {
      neutral: 66,
      primary: 34,
      secondary: 0,
    };
  }

  if (style === 'timeline' || style === 'showcase') {
    return {
      neutral: 60,
      primary: 26,
      secondary: 14,
    };
  }

  return {
    neutral: 62,
    primary: 28,
    secondary: 10,
  };
};

export const getAboutValidationResult = ({
  primary,
  secondary,
  mode,
  style,
}: {
  primary: string;
  secondary: string;
  mode: AboutBrandMode;
  style: AboutStyle;
}) => {
  const tokens = getAboutColorTokens({ primary, secondary, mode });
  const resolvedSecondary = resolveSecondaryForMode(primary, secondary, mode);

  const harmonyStatus = mode === 'single'
    ? { deltaE: 100, similarity: 0, isTooSimilar: false }
    : getAboutHarmonyStatus(tokens.primary, resolvedSecondary);

  const accessibility = getAboutAccessibilityScore([
    { background: tokens.sectionBg, text: tokens.heading, fontSize: 36, fontWeight: 700, label: 'heading' },
    { background: tokens.sectionBg, text: tokens.bodyText, fontSize: 16, fontWeight: 500, label: 'body' },
    { background: tokens.sectionBg, text: tokens.badgeText, fontSize: 12, fontWeight: 700, label: 'badge' },
    { background: tokens.ctaSolidBg, text: tokens.ctaSolidText, fontSize: 14, fontWeight: 700, label: 'ctaSolid' },
    { background: tokens.timelineDotBg, text: tokens.timelineDotText, fontSize: 12, fontWeight: 700, label: 'timelineDot' },
  ]);

  const accentBalance = calculateAboutAccentBalance({ mode, style });

  return {
    tokens,
    resolvedSecondary,
    harmonyStatus,
    accessibility,
    accentBalance,
  };
};

export const buildAboutWarningMessages = ({
  mode,
  validation,
}: {
  mode: AboutBrandMode;
  validation: ReturnType<typeof getAboutValidationResult>;
}) => {
  if (mode === 'single') {
    return [] as string[];
  }

  const warnings: string[] = [];

  if (validation.harmonyStatus.isTooSimilar) {
    warnings.push(`Màu phụ đang khá gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}). Nên tăng độ tách biệt.`);
  }

  if (validation.accessibility.failing.length > 0) {
    warnings.push(`Một số cặp màu chữ/nền chưa đủ tương phản APCA (minLc = ${validation.accessibility.minLc.toFixed(1)}).`);
  }

  if (validation.accentBalance.primary < 25) {
    warnings.push('Tỷ lệ nhấn màu chính đang thấp (< 25%), nên tăng heading/CTA/icon dùng màu chính.');
  }

  if (validation.accentBalance.secondary < 8) {
    warnings.push('Tỷ lệ nhấn màu phụ đang thấp (< 8%), nên tăng badge/dot/nhãn dùng màu phụ.');
  }

  return warnings;
};

export const getAboutSectionColors = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: AboutBrandMode;
}) => getAboutColorTokens({ primary, secondary, mode });
