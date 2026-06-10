'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
import {
  getAccessibilityThreshold,
  getAccessibilityScore as getSharedAccessibilityScore,
  getHarmonyStatus as getSharedHarmonyStatus,
} from '@/lib/home-components/color-system';
import type { BenefitsBrandMode, BenefitsHarmony, BenefitsStyle, LegacyBenefitsStyle } from '../_types';

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

const rotateHue = (hex: string, degree: number, fallback: string) => {
  const color = safeParseOklch(hex, fallback);
  return formatHex(oklch({ ...color, h: ((color.h ?? 0) + degree + 360) % 360 }));
};

const getHarmonyColor = (primary: string, harmony: BenefitsHarmony) => {
  const normalizedPrimary = normalizeHex(primary, FALLBACK_PRIMARY);

  if (harmony === 'complementary') {
    return rotateHue(normalizedPrimary, 180, normalizedPrimary);
  }

  if (harmony === 'triadic') {
    return rotateHue(normalizedPrimary, 120, normalizedPrimary);
  }

  return rotateHue(normalizedPrimary, 30, normalizedPrimary);
};

export const normalizeBenefitsStyle = (value: unknown): BenefitsStyle => {
  if (value === '1' || value === '2' || value === '3' || value === '4' || value === '5' || value === '6') {
    return value;
  }

  const legacyToModern: Record<LegacyBenefitsStyle, BenefitsStyle> = {
    bento: '3',
    cards: '1',
    carousel: '5',
    list: '2',
    row: '4',
    timeline: '6',
  };

  if (typeof value === 'string' && value in legacyToModern) {
    return legacyToModern[value as LegacyBenefitsStyle];
  }

  return '1';
};

export const normalizeBenefitsHarmony = (value: unknown): BenefitsHarmony => {
  if (value === 'complementary' || value === 'triadic') {
    return value;
  }
  return 'analogous';
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: BenefitsBrandMode,
  harmony: BenefitsHarmony,
) => {
  const primaryResolved = normalizeHex(primary, FALLBACK_PRIMARY);

  if (mode === 'single') {
    return primaryResolved;
  }

  if (isValidHexColor(secondary)) {
    return normalizeHex(secondary, primaryResolved);
  }

  return normalizeHex(getHarmonyColor(primaryResolved, harmony), FALLBACK_SECONDARY);
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

const ensureAPCATextColor = (
  preferred: string,
  background: string,
  fontSize = 16,
  fontWeight = 500,
) => {
  const threshold = getAccessibilityThreshold({ fontSize, fontWeight });
  const preferredLc = getAPCALc(preferred, background);

  if (preferredLc >= threshold) {
    return preferred;
  }

  return getAPCATextColor(background, fontSize, fontWeight);
};

export interface BenefitsColorTokens {
  primary: string;
  secondary: string;
  heading: string;
  subheading: string;
  sectionAccentBar: string;
  neutralBackground: string;
  neutralSurface: string;
  neutralBorder: string;
  neutralText: string;
  mutedText: string;
  iconSurface: string;
  iconSurfaceStrong: string;
  iconText: string;
  iconTextStrong: string;
  cardBackground: string;
  cardBorder: string;
  cardBorderHover: string;
  badgeBackground: string;
  badgeText: string;
  timelineLine: string;
  timelineDotBackground: string;
  timelineDotBorder: string;
  timelineDotText: string;
  rowDivider: string;
  carouselArrowBorder: string;
  carouselArrowIcon: string;
  buttonBg: string;
  buttonText: string;
  buttonHoverBg: string;
  dotActive: string;
  dotInactive: string;
  plusBadgeBg: string;
  plusBadgeText: string;
  styleAccentByStyle: Record<BenefitsStyle, string>;
}

const getStyleAccentByStyle = (primaryResolved: string, secondaryResolved: string): Record<BenefitsStyle, string> => ({
  '1': primaryResolved,
  '2': secondaryResolved,
  '3': primaryResolved,
  '4': secondaryResolved,
  '5': primaryResolved,
  '6': secondaryResolved,
});

export const getBenefitsColorTokens = ({
  primary,
  secondary,
  mode,
  harmony,
}: {
  primary: string;
  secondary: string;
  mode: BenefitsBrandMode;
  harmony: BenefitsHarmony;
}): BenefitsColorTokens => {
  const primaryResolved = normalizeHex(primary, FALLBACK_PRIMARY);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode, harmony);

  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralBorder = '#e2e8f0';
  const neutralText = '#0f172a';
  const mutedText = '#64748b';

  const sectionAccentBar = mode === 'single'
    ? setLightness(primaryResolved, 0.46, primaryResolved)
    : secondaryResolved;

  const iconSurface = setLightness(primaryResolved, 0.95, primaryResolved);
  const iconSurfaceStrong = mode === 'single'
    ? setLightness(primaryResolved, 0.9, primaryResolved)
    : setLightness(secondaryResolved, 0.92, secondaryResolved);

  const iconText = ensureAPCATextColor(primaryResolved, iconSurface, 18, 600);
  const iconTextStrong = ensureAPCATextColor(mode === 'single' ? primaryResolved : secondaryResolved, iconSurfaceStrong, 18, 600);

  const buttonBg = primaryResolved;
  const buttonText = getAPCATextColor(buttonBg, 14, 600);

  const dotActive = primaryResolved;
  const dotInactive = mode === 'single'
    ? setLightness(primaryResolved, 0.82, primaryResolved)
    : setLightness(secondaryResolved, 0.85, secondaryResolved);

  return {
    badgeBackground: iconSurfaceStrong,
    badgeText: getAPCATextColor(iconSurfaceStrong, 12, 600),
    buttonBg,
    buttonHoverBg: setLightness(buttonBg, 0.42, buttonBg),
    buttonText,
    cardBackground: neutralSurface,
    cardBorder: neutralBorder,
    cardBorderHover: mode === 'single' ? primaryResolved : secondaryResolved,
    carouselArrowBorder: neutralBorder,
    carouselArrowIcon: mode === 'single' ? primaryResolved : secondaryResolved,
    dotActive,
    dotInactive,
    heading: primaryResolved,
    iconSurface,
    iconSurfaceStrong,
    iconText,
    iconTextStrong,
    mutedText,
    neutralBackground,
    neutralBorder,
    neutralSurface,
    neutralText,
    plusBadgeBg: mode === 'single' ? setLightness(primaryResolved, 0.94, primaryResolved) : setLightness(secondaryResolved, 0.93, secondaryResolved),
    plusBadgeText: mode === 'single' ? primaryResolved : secondaryResolved,
    primary: primaryResolved,
    rowDivider: neutralBorder,
    sectionAccentBar,
    secondary: secondaryResolved,
    styleAccentByStyle: getStyleAccentByStyle(primaryResolved, secondaryResolved),
    subheading: mode === 'single' ? primaryResolved : secondaryResolved,
    timelineDotBackground: neutralSurface,
    timelineDotBorder: primaryResolved,
    timelineDotText: mode === 'single' ? primaryResolved : secondaryResolved,
    timelineLine: neutralBorder,
  };
};

export interface BenefitsAccessibilityCheck {
  name: string;
  lc: number;
  passes: boolean;
}

export const getBenefitsAccessibilityScore = (pairs: Array<{ name: string; text: string; background: string }>) => {
  const shared = getSharedAccessibilityScore(pairs.map((pair) => ({
    bg: pair.background,
    key: pair.name,
    size: 16,
    text: pair.text,
    weight: 500,
  })));

  const checks: BenefitsAccessibilityCheck[] = shared.items.map((item) => ({
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

export const getBenefitsHarmonyStatus = (primary: string, secondary: string) => {
  const shared = getSharedHarmonyStatus(primary, secondary);
  const deltaFromEuclidean = differenceEuclidean('oklch')(primary, secondary);

  return {
    deltaE: Number.isFinite(shared.deltaE)
      ? Number(shared.deltaE.toFixed(2))
      : Number.isFinite(deltaFromEuclidean)
        ? Number((deltaFromEuclidean * 100).toFixed(2))
        : 0,
    isTooSimilar: shared.isTooSimilar,
  };
};

export const calculateAccentBalance = ({ mode, style }: { mode: BenefitsBrandMode; style: BenefitsStyle }) => {
  if (mode === 'single') {
    return {
      neutral: 60,
      primary: 40,
      secondary: 40,
    };
  }

  if (style === '1' || style === '6') {
    return {
      neutral: 58,
      primary: 30,
      secondary: 12,
    };
  }

  return {
    neutral: 60,
    primary: 26,
    secondary: 14,
  };
};

export const getBenefitsValidationResult = ({
  primary,
  secondary,
  mode,
  harmony,
  style,
}: {
  primary: string;
  secondary: string;
  mode: BenefitsBrandMode;
  harmony: BenefitsHarmony;
  style: BenefitsStyle;
}) => {
  const tokens = getBenefitsColorTokens({ primary, secondary, mode, harmony });
  const harmonyStatus = mode === 'single'
    ? { deltaE: 100, isTooSimilar: false }
    : getBenefitsHarmonyStatus(tokens.primary, tokens.secondary);

  const accessibility = getBenefitsAccessibilityScore([
    { name: 'Heading / Neutral Surface', text: tokens.heading, background: tokens.neutralSurface },
    { name: 'Subheading / Neutral Surface', text: tokens.subheading, background: tokens.neutralSurface },
    { name: 'Icon Text / Icon Surface', text: tokens.iconTextStrong, background: tokens.iconSurfaceStrong },
    { name: 'Button / Button BG', text: tokens.buttonText, background: tokens.buttonBg },
  ]);

  const accentBalance = calculateAccentBalance({ mode, style });

  return {
    accessibility,
    accentBalance,
    harmonyStatus,
    tokens,
  };
};

export const buildBenefitsWarningMessages = ({
  mode,
  validation,
}: {
  mode: BenefitsBrandMode;
  validation: ReturnType<typeof getBenefitsValidationResult>;
}) => {
  if (mode === 'single') {
    return [] as string[];
  }

  const warnings: string[] = [];

  if (validation.harmonyStatus.isTooSimilar) {
    warnings.push(`Màu phụ đang khá gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}). Nên tăng độ tách biệt.`);
  }

  if (validation.accentBalance.primary < 25) {
    warnings.push('Tỷ lệ nhấn màu chính đang thấp (< 25%), nên tăng heading/icon/CTA dùng màu chính.');
  }

  if (validation.accentBalance.secondary < 8) {
    warnings.push('Tỷ lệ nhấn màu phụ đang thấp (< 8%), nên tăng badge/line/dot dùng màu phụ.');
  }

  return warnings;
};

export const getBenefitsSectionColors = ({
  primary,
  secondary,
  mode,
  harmony,
}: {
  primary: string;
  secondary: string;
  mode: BenefitsBrandMode;
  harmony: BenefitsHarmony;
}) => getBenefitsColorTokens({ primary, secondary, mode, harmony });
