'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
import type { CTAConfig, CTAStyle } from '../_types';
import { normalizeCTAStyle } from './constants';

type BrandMode = 'single' | 'dual';

const DEFAULT_BRAND_COLOR = '#3b82f6';

interface Palette {
  solid: string;
  surface: string;
  hover: string;
  active: string;
  border: string;
  disabled: string;
  textOnSolid: string;
  textInteractive: string;
}

export interface CTAStyleTokens {
  sectionBg: string;
  sectionBorder?: string;
  title: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder?: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  primaryButtonBorder?: string;
  secondaryButtonBg?: string;
  secondaryButtonText: string;
  secondaryButtonBorder: string;
  cardBg?: string;
  cardBorder?: string;
  cardShadow?: string;
  accentLine?: string;
}

export interface CTAAccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

export interface CTAAccessibilityScore {
  minLc: number;
  failing: Array<CTAAccessibilityPair & { lc: number; threshold: number }>;
}

export interface CTAHarmonyStatus {
  deltaE: number;
  similarity: number;
  isTooSimilar: boolean;
}

export interface CTAAccentBalance {
  primary: number;
  secondary: number;
  neutral: number;
  warnings: string[];
}

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);
const clampChroma = (value: number) => Math.min(Math.max(value, 0.02), 0.35);

const isNonEmptyColor = (value: string) => value.trim().length > 0;

const safeParseOklch = (value: string, fallback: string) => (
  oklch(value) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR)
);

const normalizeHex = (value: string, fallback: string) => {
  const candidate = isNonEmptyColor(value) ? value.trim() : fallback;
  return formatHex(safeParseOklch(candidate, fallback));
};

const hexToRgb = (hex: string): [number, number, number] | null => {
  const cleaned = hex.trim().replace('#', '');
  if (cleaned.length !== 6 && cleaned.length !== 8) {return null;}

  const normalized = cleaned.length === 8 ? cleaned.slice(0, 6) : cleaned;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some((value) => Number.isNaN(value))) {return null;}
  return [r, g, b];
};

const getAPCALc = (textHex: string, backgroundHex: string) => {
  const textRgb = hexToRgb(textHex);
  const backgroundRgb = hexToRgb(backgroundHex);

  if (!textRgb || !backgroundRgb) {return 0;}

  const lc = Math.abs(APCAcontrast(sRGBtoY(textRgb), sRGBtoY(backgroundRgb)));
  return Number.isFinite(lc) ? lc : 0;
};

const getOKLCH = (hex: string, fallback = DEFAULT_BRAND_COLOR) => {
  const parsed = safeParseOklch(hex, fallback);
  return {
    l: parsed.l ?? 0.6,
    c: parsed.c ?? 0.12,
    h: parsed.h ?? 0,
    mode: 'oklch' as const,
  };
};

const getDarkModeAccent = (hex: string, fallback = DEFAULT_BRAND_COLOR) => {
  const color = getOKLCH(hex, fallback);

  return formatHex(oklch({
    ...color,
    l: color.l < 0.62 ? 0.68 : Math.min(color.l, 0.82),
    c: color.h == null ? Math.min(color.c, 0.02) : clampChroma(Math.max(color.c * 0.9, Math.min(color.c + 0.02, 0.14))),
  }));
};

const getDarkSurfaceAccent = (hex: string, fallback = DEFAULT_BRAND_COLOR) => {
  const color = getOKLCH(hex, fallback);

  return formatHex(oklch({
    ...color,
    l: 0.2,
    c: color.h == null ? Math.min(color.c, 0.02) : Math.min(color.c * 0.35, 0.055),
  }));
};

const getAPCAThreshold = (fontSize = 16, fontWeight = 500) => (
  (fontSize >= 18 || fontWeight >= 700) ? 45 : 60
);

export const getAPCATextColor = (bg: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', bg);
  const blackLc = getAPCALc('#000000', bg);
  const threshold = getAPCAThreshold(fontSize, fontWeight);

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc > blackLc ? '#ffffff' : '#0f172a';
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

const getTextOnGradient = (primary: string, secondary: string, fontSize = 16, fontWeight = 500) => {
  const whitePrimary = getAPCALc('#ffffff', primary);
  const whiteSecondary = getAPCALc('#ffffff', secondary);
  const blackPrimary = getAPCALc('#000000', primary);
  const blackSecondary = getAPCALc('#000000', secondary);
  const threshold = getAPCAThreshold(fontSize, fontWeight);
  const whiteMin = Math.min(whitePrimary, whiteSecondary);
  const blackMin = Math.min(blackPrimary, blackSecondary);

  if (whiteMin >= threshold || blackMin >= threshold) {
    return whiteMin >= blackMin ? '#ffffff' : '#0f172a';
  }

  return whiteMin > blackMin ? '#ffffff' : '#0f172a';
};

export const generatePalette = (hex: string, fallback = DEFAULT_BRAND_COLOR): Palette => {
  const solid = normalizeHex(hex, fallback);
  const color = getOKLCH(solid, fallback);
  return {
    solid,
    surface: formatHex(oklch({ ...color, l: clampLightness(color.l + 0.38) })),
    hover: formatHex(oklch({ ...color, l: clampLightness(color.l - 0.08) })),
    active: formatHex(oklch({ ...color, l: clampLightness(color.l - 0.14) })),
    border: formatHex(oklch({ ...color, l: clampLightness(color.l + 0.28), c: color.c * 0.9 })),
    disabled: formatHex(oklch({ ...color, l: clampLightness(color.l + 0.22), c: color.c * 0.55 })),
    textOnSolid: getAPCATextColor(solid, 16, 600),
    textInteractive: formatHex(oklch({ ...color, l: clampLightness(color.l - 0.26), c: color.c * 0.92 })),
  };
};

export const getAnalogous = (hex: string): [string, string] => {
  const primary = normalizeHex(hex, DEFAULT_BRAND_COLOR);
  const color = getOKLCH(primary, DEFAULT_BRAND_COLOR);
  return [
    formatHex(oklch({ ...color, h: (color.h + 30) % 360 })),
    formatHex(oklch({ ...color, h: (color.h - 30 + 360) % 360 })),
  ];
};

export const getComplementary = (hex: string) => {
  const primary = normalizeHex(hex, DEFAULT_BRAND_COLOR);
  const color = getOKLCH(primary, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, h: (color.h + 180) % 360 }));
};

export const getTriadic = (hex: string): [string, string] => {
  const primary = normalizeHex(hex, DEFAULT_BRAND_COLOR);
  const color = getOKLCH(primary, DEFAULT_BRAND_COLOR);
  return [
    formatHex(oklch({ ...color, h: (color.h + 120) % 360 })),
    formatHex(oklch({ ...color, h: (color.h - 120 + 360) % 360 })),
  ];
};

export const resolveSecondaryColor = (
  primary: string,
  secondary: string,
  mode: BrandMode,
) => {
  const primaryNormalized = normalizeHex(primary, DEFAULT_BRAND_COLOR);

  if (mode === 'single') {
    return primaryNormalized;
  }

  return normalizeHex(secondary, primaryNormalized);
};

export const getHarmonyStatus = (primary: string, secondary: string): CTAHarmonyStatus => {
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

export const getCTAAccessibilityScore = (pairs: CTAAccessibilityPair[]): CTAAccessibilityScore => {
  const failing: CTAAccessibilityScore['failing'] = [];
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

export const getCTAValidationResult = ({
  config,
  primary,
  secondary,
  mode,
  style,
  isDark = false,
}: {
  config: CTAConfig;
  primary: string;
  secondary: string;
  mode: BrandMode;
  style: CTAStyle;
  isDark?: boolean;
}) => {
  const primaryNormalized = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const styleNormalized = normalizeCTAStyle(style);

  const tokens = getCTAThemeTokens({
    primary: primaryNormalized,
    secondary,
    mode,
    style: styleNormalized,
    isDark,
  });

  const resolvedSecondary = resolveSecondaryColor(primaryNormalized, secondary, mode);
  const harmonyStatus = getHarmonyStatus(primaryNormalized, resolvedSecondary);
  const sectionBgForCheck = tokens.sectionBg.startsWith('linear-gradient')
    ? isDark ? '#111827' : getGradientTints(primaryNormalized, resolvedSecondary).fromTint
    : tokens.sectionBg;
  const secondaryButtonBgForCheck = !tokens.secondaryButtonBg || tokens.secondaryButtonBg === 'transparent'
    ? sectionBgForCheck
    : tokens.secondaryButtonBg;

  const hasBadge = Boolean(config.badge?.trim());
  const hasSecondaryButton = Boolean(config.secondaryButtonText?.trim());
  const descriptionFontSize = styleNormalized === 'banner' ? 18 : 16;

  const accessibilityPairs: CTAAccessibilityPair[] = [
    { background: sectionBgForCheck, text: tokens.title, fontSize: 32, fontWeight: 700, label: 'title' },
    { background: sectionBgForCheck, text: tokens.description, fontSize: descriptionFontSize, fontWeight: 500, label: 'description' },
    { background: tokens.primaryButtonBg, text: tokens.primaryButtonText, fontSize: 14, fontWeight: 700, label: 'primaryButton' },
  ];

  if (hasBadge) {
    accessibilityPairs.push({ background: tokens.badgeBg, text: tokens.badgeText, fontSize: 12, fontWeight: 600, label: 'badge' });
  }

  if (hasSecondaryButton) {
    accessibilityPairs.push({ background: secondaryButtonBgForCheck, text: tokens.secondaryButtonText, fontSize: 14, fontWeight: 700, label: 'secondaryButton' });
  }

  const accessibility = getCTAAccessibilityScore(accessibilityPairs);

  return {
    accessibility,
    harmonyStatus,
    resolvedSecondary,
    tokens,
  };
};

const ACCENT_BALANCE_BY_STYLE: Record<CTAStyle, { primary: number; secondary: number; neutral: number }> = {
  banner: { primary: 34, secondary: 8, neutral: 58 },
  centered: { primary: 30, secondary: 10, neutral: 60 },
  split: { primary: 32, secondary: 9, neutral: 59 },
  floating: { primary: 30, secondary: 10, neutral: 60 },
  gradient: { primary: 31, secondary: 11, neutral: 58 },
  minimal: { primary: 27, secondary: 8, neutral: 65 },
};

export const getCTAAccentBalance = (style: CTAStyle): CTAAccentBalance => {
  const target = ACCENT_BALANCE_BY_STYLE[style];
  const warnings: string[] = [];

  if (target.primary < 25) {warnings.push(`Primary < 25% (hiện ${target.primary}%)`);}
  if (target.secondary < 5) {warnings.push(`Secondary < 5% (hiện ${target.secondary}%)`);}

  return {
    primary: target.primary,
    secondary: target.secondary,
    neutral: target.neutral,
    warnings,
  };
};

const getSolidTint = (hex: string, lightnessIncrease = 0.42) => {
  const color = getOKLCH(hex, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, l: clampLightness(color.l + lightnessIncrease) }));
};

const getGradientTints = (from: string, to: string) => {
  const fromColor = getOKLCH(from, DEFAULT_BRAND_COLOR);
  const toColor = getOKLCH(to, from);
  return {
    fromTint: formatHex(oklch({ ...fromColor, l: clampLightness(fromColor.l + 0.12), c: fromColor.c * 0.85 })),
    toTint: formatHex(oklch({ ...toColor, l: clampLightness(toColor.l + 0.1), c: toColor.c * 0.85 })),
  };
};

const _getGradientBg = (from: string, to: string) => {
  const { fromTint, toTint } = getGradientTints(from, to);
  return `linear-gradient(135deg, ${fromTint} 0%, ${toTint} 100%)`;
};

export const getCTADarkColors = ({
  primary,
  secondary,
  mode,
  style,
}: {
  primary: string;
  secondary: string;
  mode: BrandMode;
  style: CTAStyle;
}): CTAStyleTokens => {
  const primaryNormalized = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const styleNormalized = normalizeCTAStyle(style);
  const secondaryResolved = resolveSecondaryColor(primaryNormalized, secondary, mode);
  const primaryAccent = getDarkModeAccent(primaryNormalized, DEFAULT_BRAND_COLOR);
  const secondaryAccent = mode === 'single'
    ? primaryAccent
    : getDarkModeAccent(secondaryResolved, primaryNormalized);

  const darkBackground = '#020617';
  const darkSurface = '#0f172a';
  const darkElevatedSurface = '#111827';
  const darkBorder = '#334155';
  const darkText = '#f8fafc';
  const darkMutedText = '#cbd5e1';

  const badgeAccent = mode === 'dual' ? secondaryAccent : primaryAccent;

  const base: CTAStyleTokens = {
    sectionBg: darkBackground,
    sectionBorder: darkBorder,
    title: darkText,
    description: darkMutedText,
    badgeBg: darkElevatedSurface,
    badgeText: ensureAPCATextColor(badgeAccent, darkElevatedSurface, 12, 600),
    badgeBorder: darkBorder,
    primaryButtonBg: primaryAccent,
    primaryButtonText: getAPCATextColor(primaryAccent, 14, 700),
    primaryButtonBorder: primaryAccent,
    secondaryButtonBg: darkSurface,
    secondaryButtonText: ensureAPCATextColor(secondaryAccent, darkSurface, 14, 700),
    secondaryButtonBorder: darkBorder,
    cardBg: darkSurface,
    cardBorder: darkBorder,
    cardShadow: undefined,
    accentLine: secondaryAccent,
  };

  if (styleNormalized === 'banner') {
    return {
      ...base,
      sectionBg: darkSurface,
      cardBg: darkSurface,
      cardBorder: darkBorder,
      accentLine: undefined,
    };
  }

  if (styleNormalized === 'centered') {
    return {
      ...base,
      sectionBorder: undefined,
      cardBg: undefined,
      cardBorder: undefined,
      accentLine: undefined,
    };
  }

  if (styleNormalized === 'split') {
    return {
      ...base,
      sectionBg: darkBackground,
      cardBg: darkSurface,
      cardBorder: darkBorder,
      accentLine: primaryAccent,
    };
  }

  if (styleNormalized === 'floating') {
    return {
      ...base,
      sectionBg: darkBackground,
      cardBg: darkSurface,
      cardBorder: darkBorder,
    };
  }

  if (styleNormalized === 'gradient') {
    const from = getDarkSurfaceAccent(primaryAccent, DEFAULT_BRAND_COLOR);
    const to = getDarkSurfaceAccent(secondaryAccent, primaryAccent);

    return {
      ...base,
      sectionBg: `linear-gradient(135deg, ${darkBackground} 0%, ${from} 48%, ${to} 100%)`,
      sectionBorder: darkBorder,
      title: darkText,
      description: darkMutedText,
      badgeBg: darkElevatedSurface,
      badgeText: ensureAPCATextColor(badgeAccent, darkElevatedSurface, 12, 600),
      badgeBorder: darkBorder,
      primaryButtonBg: primaryAccent,
      primaryButtonText: getAPCATextColor(primaryAccent, 14, 700),
      primaryButtonBorder: primaryAccent,
      secondaryButtonBg: darkSurface,
      secondaryButtonText: darkText,
      secondaryButtonBorder: darkBorder,
      cardBg: undefined,
      cardBorder: undefined,
      accentLine: undefined,
    };
  }

  return {
    ...base,
    sectionBg: darkBackground,
    sectionBorder: darkBorder,
    cardBg: undefined,
    cardBorder: undefined,
  };
};

export const getCTAThemeTokens = ({
  primary,
  secondary,
  mode,
  style,
  isDark = false,
}: {
  primary: string;
  secondary: string;
  mode: BrandMode;
  style: CTAStyle;
  isDark?: boolean;
}) => (
  isDark
    ? getCTADarkColors({ primary, secondary, mode, style })
    : getCTAColors({ primary, secondary, mode, style })
);

export const getCTAColors = ({
  primary,
  secondary,
  mode,
  style,
}: {
  primary: string;
  secondary: string;
  mode: BrandMode;
  style: CTAStyle;
}): CTAStyleTokens => {
  const primaryNormalized = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const styleNormalized = normalizeCTAStyle(style);
  const secondaryColor = resolveSecondaryColor(primaryNormalized, secondary, mode);
  const primaryPalette = generatePalette(primaryNormalized);
  const secondaryPalette = generatePalette(secondaryColor, primaryPalette.solid);

  const badgeBgSolid = getSolidTint(secondaryPalette.solid, 0.42);

  const base: CTAStyleTokens = {
    sectionBg: '#ffffff',
    sectionBorder: '#e2e8f0',
    title: primaryPalette.solid,
    description: '#475569',
    badgeBg: badgeBgSolid,
    badgeText: getAPCATextColor(badgeBgSolid, 12, 600),
    badgeBorder: secondaryPalette.border,
    primaryButtonBg: primaryPalette.solid,
    primaryButtonText: primaryPalette.textOnSolid,
    primaryButtonBorder: primaryPalette.active,
    secondaryButtonBg: '#ffffff',
    secondaryButtonText: ensureAPCATextColor(secondaryPalette.textInteractive, '#ffffff', 14, 700),
    secondaryButtonBorder: '#cbd5e1',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    cardShadow: undefined,
    accentLine: secondaryPalette.solid,
  };

  if (styleNormalized === 'banner') {
    return {
      ...base,
      sectionBg: primaryPalette.solid,
      sectionBorder: primaryPalette.active,
      title: ensureAPCATextColor(primaryPalette.textOnSolid, primaryPalette.solid, 32, 700),
      description: ensureAPCATextColor(
        getAPCATextColor(primaryPalette.solid, 16, 500) === '#ffffff' ? '#ffffff' : '#1e293b',
        primaryPalette.solid,
        16,
        500,
      ),
      primaryButtonBg: '#ffffff',
      primaryButtonText: ensureAPCATextColor(primaryPalette.textInteractive, '#ffffff', 14, 700),
      primaryButtonBorder: primaryPalette.active,
      secondaryButtonBg: 'transparent',
      secondaryButtonText: ensureAPCATextColor(primaryPalette.textOnSolid, primaryPalette.solid, 14, 700),
      secondaryButtonBorder: primaryPalette.textOnSolid === '#ffffff' ? '#ffffff' : '#0f172a',
      cardBg: undefined,
      cardBorder: undefined,
      cardShadow: undefined,
      accentLine: undefined,
    };
  }

  if (styleNormalized === 'centered') {
    return {
      ...base,
      sectionBg: '#ffffff',
      sectionBorder: undefined,
      secondaryButtonBorder: '#cbd5e1',
      cardBg: undefined,
      cardBorder: undefined,
      cardShadow: undefined,
      accentLine: undefined,
    };
  }

  if (styleNormalized === 'split') {
    return {
      ...base,
      sectionBg: '#f8fafc',
      sectionBorder: undefined,
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      secondaryButtonBorder: '#cbd5e1',
      cardShadow: undefined,
      accentLine: primaryPalette.solid,
    };
  }

  if (styleNormalized === 'floating') {
    return {
      ...base,
      sectionBg: '#f8fafc',
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      secondaryButtonBorder: '#cbd5e1',
      cardShadow: undefined,
    };
  }

  if (styleNormalized === 'gradient') {
    const { fromTint, toTint } = getGradientTints(primaryPalette.solid, secondaryPalette.solid);
    const gradientBg = `linear-gradient(135deg, ${fromTint} 0%, ${toTint} 100%)`;
    const textOnGradient = getTextOnGradient(primaryPalette.solid, secondaryPalette.solid, 24, 700);
    const descriptionOnFrom = getAPCATextColor(fromTint, 16, 500);
    const descriptionOnTo = getAPCATextColor(toTint, 16, 500);
    const descriptionColor = descriptionOnFrom === '#ffffff' && descriptionOnTo === '#ffffff'
      ? '#f8fafc'
      : descriptionOnFrom === '#0f172a' && descriptionOnTo === '#0f172a'
        ? '#1e293b'
        : textOnGradient;

    return {
      ...base,
      sectionBg: gradientBg,
      sectionBorder: undefined,
      title: textOnGradient,
      description: descriptionColor,
      badgeBg: '#f1f5f9',
      badgeText: getAPCATextColor('#f1f5f9', 12, 600),
      badgeBorder: '#cbd5e1',
      primaryButtonBg: '#ffffff',
      primaryButtonText: ensureAPCATextColor(secondaryPalette.textInteractive, '#ffffff', 14, 700),
      primaryButtonBorder: '#ffffff',
      secondaryButtonBg: 'transparent',
      secondaryButtonText: textOnGradient,
      secondaryButtonBorder: '#ffffff',
      cardBg: undefined,
      cardBorder: undefined,
      cardShadow: undefined,
      accentLine: undefined,
    };
  }

  return {
    ...base,
    sectionBg: '#ffffff',
    sectionBorder: '#e2e8f0',
    cardBg: undefined,
    cardBorder: undefined,
    secondaryButtonBorder: '#cbd5e1',
    cardShadow: undefined,
  };
};
