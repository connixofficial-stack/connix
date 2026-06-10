'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';
import { getAccessibilityThreshold, getAccessibilityScore as getSharedAccessibilityScore, getHarmonyStatus as getSharedHarmonyStatus } from '@/lib/home-components/color-system';
import type { TestimonialsBrandMode, TestimonialsStyle } from '../_types';

const DEFAULT_BRAND_COLOR = '#3b82f6';
const FALLBACK_PRIMARY = '#1d4ed8';
const FALLBACK_SECONDARY = '#9333ea';

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);

const safeParseOklch = (input: string, fallback: string) => (
  oklch(input) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR)
);

const normalizeHex = (hex: string, fallback: string) => formatHex(safeParseOklch(hex, fallback));

const isValidHexColor = (value: string) => /^#[0-9A-F]{6}$/i.test((value ?? '').trim());

const setLightness = (hex: string, lightness: number, fallback: string) => {
  const color = safeParseOklch(hex, fallback);
  return formatHex(oklch({ ...color, l: clampLightness(lightness) }));
};

const getAnalogous = (hex: string): [string, string] => {
  const color = safeParseOklch(hex, DEFAULT_BRAND_COLOR);
  const first = formatHex(oklch({ ...color, h: ((color.h ?? 0) + 26) % 360 }));
  const second = formatHex(oklch({ ...color, h: ((color.h ?? 0) - 26 + 360) % 360 }));
  return [first, second];
};

const getAutoSecondary = (hex: string) => {
  const base = normalizeHex(hex, DEFAULT_BRAND_COLOR);
  return getAnalogous(base)[0];
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: TestimonialsBrandMode,
) => {
  const primaryResolved = normalizeHex(primary, FALLBACK_PRIMARY);

  if (mode === 'single') {
    return primaryResolved;
  }

  if (isValidHexColor(secondary)) {
    return normalizeHex(secondary, primaryResolved);
  }

  return normalizeHex(getAutoSecondary(primaryResolved), FALLBACK_SECONDARY);
};

export const getHarmonyStatus = (primary: string, secondary: string) => {
  const shared = getSharedHarmonyStatus(primary, secondary);

  return {
    deltaE: Number.isFinite(shared.deltaE) ? Number(shared.deltaE.toFixed(2)) : 0,
    isTooSimilar: shared.isTooSimilar,
  };
};

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

export const getAPCATextColor = (bg: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', bg);
  const blackLc = getAPCALc('#000000', bg);
  const threshold = getAccessibilityThreshold({ fontSize, fontWeight });

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc > blackLc ? '#ffffff' : '#0f172a';
};

export interface TestimonialsColorTokens {
  primary: string;
  secondary: string;
  headingPrimary: string;
  subtitleSecondary: string;
  quoteSecondary: string;
  ratingSecondary: string;
  cardSurface: string;
  cardAltSurface: string;
  cardBorder: string;
  cardBorderStrong: string;
  cardBorderHover: string;
  iconSurface: string;
  iconSurfaceStrong: string;
  avatarTextOnPrimary: string;
  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  buttonSecondaryBorder: string;
  buttonSecondaryText: string;
  buttonSecondaryHoverBg: string;
  dotActive: string;
  dotInactive: string;
  neutralBackground: string;
  neutralSurface: string;
  neutralMuted: string;
  neutralBorder: string;
}

export const getTestimonialsColorTokens = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: TestimonialsBrandMode;
}): TestimonialsColorTokens => {
  const primaryResolved = normalizeHex(primary, FALLBACK_PRIMARY);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);

  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralMuted = '#64748b';
  const neutralBorder = '#e2e8f0';

  const buttonPrimaryBg = primaryResolved;

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,
    headingPrimary: primaryResolved,
    subtitleSecondary: secondaryResolved,
    quoteSecondary: secondaryResolved,
    ratingSecondary: '#facc15',
    cardSurface: neutralSurface,
    cardAltSurface: setLightness(primaryResolved, 0.97, primaryResolved),
    cardBorder: neutralBorder,
    cardBorderStrong: setLightness(primaryResolved, 0.82, primaryResolved),
    cardBorderHover: setLightness(secondaryResolved, 0.79, primaryResolved),
    iconSurface: setLightness(primaryResolved, 0.96, primaryResolved),
    iconSurfaceStrong: setLightness(secondaryResolved, 0.93, primaryResolved),
    avatarTextOnPrimary: getAPCATextColor(primaryResolved, 16, 600),
    buttonPrimaryBg,
    buttonPrimaryText: getAPCATextColor(buttonPrimaryBg, 14, 600),
    buttonSecondaryBorder: setLightness(secondaryResolved, 0.78, secondaryResolved),
    buttonSecondaryText: secondaryResolved,
    buttonSecondaryHoverBg: setLightness(secondaryResolved, 0.96, secondaryResolved),
    dotActive: primaryResolved,
    dotInactive: setLightness(secondaryResolved, 0.86, primaryResolved),
    neutralBackground,
    neutralSurface,
    neutralMuted,
    neutralBorder,
  };
};

export const calculateAccentBalance = ({
  mode,
  style,
}: {
  mode: TestimonialsBrandMode;
  style: TestimonialsStyle;
}) => {
  if (mode === 'single') {
    return {
      neutral: 62,
      primary: 38,
      secondary: 38,
    };
  }

  if (style === 'cards' || style === 'slider' || style === 'split-carousel' || style === 'overlap-carousel' || style === 'builder-cards' || style === 'builder-carousel') {
    return {
      neutral: 60,
      primary: 28,
      secondary: 12,
    };
  }

  if (style === 'marquee' || style === 'minimal') {
    return {
      neutral: 62,
      primary: 26,
      secondary: 12,
    };
  }

  return {
    neutral: 58,
    primary: 26,
    secondary: 16,
  };
};

export interface AccessibilityCheck {
  name: string;
  lc: number;
  passes: boolean;
}

export const getAccessibilityScore = (pairs: Array<{ name: string; text: string; background: string }>) => {
  const shared = getSharedAccessibilityScore(pairs.map((pair) => ({
    bg: pair.background,
    key: pair.name,
    size: 16,
    text: pair.text,
    weight: 500,
  })));

  const checks: AccessibilityCheck[] = shared.items.map((item) => ({
    lc: item.lc,
    name: item.key,
    passes: item.pass,
  }));

  return {
    checks,
    failing: checks.filter((item) => !item.passes),
    minLc: shared.minLc,
  };
};

export const getTestimonialsValidationResult = ({
  primary,
  secondary,
  mode,
  style,
}: {
  primary: string;
  secondary: string;
  mode: TestimonialsBrandMode;
  style: TestimonialsStyle;
}) => {
  const tokens = getTestimonialsColorTokens({ primary, secondary, mode });
  const harmonyStatus = mode === 'single'
    ? { deltaE: 100, isTooSimilar: false }
    : getHarmonyStatus(tokens.primary, tokens.secondary);

  const accessibility = getAccessibilityScore([
    { name: 'Heading / Neutral Surface', text: tokens.headingPrimary, background: tokens.neutralSurface },
    { name: 'Subtitle / Neutral Surface', text: tokens.subtitleSecondary, background: tokens.neutralSurface },
    { name: 'Quote / Neutral Surface', text: tokens.quoteSecondary, background: tokens.neutralSurface },
    { name: 'Primary Button / Primary BG', text: tokens.buttonPrimaryText, background: tokens.buttonPrimaryBg },
  ]);

  const accentBalance = calculateAccentBalance({ mode, style });

  return {
    accessibility,
    accentBalance,
    harmonyStatus,
    tokens,
  };
};

export const buildTestimonialsWarningMessages = ({
  mode,
  validation,
}: {
  mode: TestimonialsBrandMode;
  validation: ReturnType<typeof getTestimonialsValidationResult>;
}) => {
  if (mode === 'single') {
    return [] as string[];
  }

  const warnings: string[] = [];

  if (validation.harmonyStatus.isTooSimilar) {
    warnings.push(`Màu phụ đang khá gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}). Nên tăng độ tách biệt.`);
  }

  if (validation.accentBalance.primary < 25) {
    warnings.push('Tỷ lệ nhấn màu chính đang thấp (< 25%), nên tăng heading/CTA/icon dùng màu chính.');
  }

  if (validation.accentBalance.secondary < 5) {
    warnings.push('Tỷ lệ nhấn màu phụ đang thấp (< 5%), nên tăng subtitle/badge/dot dùng màu phụ.');
  }

  return warnings;
};

export const getTestimonialsSectionColors = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: TestimonialsBrandMode;
}) => getTestimonialsColorTokens({ primary, secondary, mode });
