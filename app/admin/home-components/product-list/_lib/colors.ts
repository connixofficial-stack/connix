'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';
import type {
  ProductListBrandMode,
  ProductListHarmony,
  ProductListStyle,
} from '../_types';

const DEFAULT_BRAND_COLOR = '#3b82f6';

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);

const safeParseOklch = (input: string, fallback: string) => (
  oklch(input) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR)
);

const normalizeHex = (hex: string, fallback: string) => (
  formatHex(safeParseOklch(hex, fallback))
);

export const withAlpha = (hex: string, alpha: number, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  const l = clampLightness(color.l ?? 0.6);
  const c = Math.max(0, Math.min(color.c ?? 0.1, 0.4));
  const h = Number.isFinite(color.h) ? color.h : 0;
  const a = Math.max(0, Math.min(alpha, 1));
  return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(3)} ${h.toFixed(2)} / ${a.toFixed(3)})`;
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
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;

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
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;
  const preferredLc = getAPCALc(preferred, background);

  if (preferredLc >= threshold) {
    return preferred;
  }

  return getAPCATextColor(background, fontSize, fontWeight);
};

export const getAnalogous = (hex: string): [string, string] => {
  const color = safeParseOklch(hex, DEFAULT_BRAND_COLOR);
  const first = formatHex(oklch({ ...color, h: ((color.h ?? 0) + 30) % 360 }));
  const second = formatHex(oklch({ ...color, h: ((color.h ?? 0) - 30 + 360) % 360 }));
  return [first, second];
};

export const getComplementary = (hex: string) => {
  const color = safeParseOklch(hex, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 180) % 360 }));
};

export const getTriadic = (hex: string): [string, string] => {
  const color = safeParseOklch(hex, DEFAULT_BRAND_COLOR);
  const first = formatHex(oklch({ ...color, h: ((color.h ?? 0) + 120) % 360 }));
  const second = formatHex(oklch({ ...color, h: ((color.h ?? 0) - 120 + 360) % 360 }));
  return [first, second];
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: ProductListBrandMode,
  harmony: ProductListHarmony,
) => {
  const normalizedPrimary = normalizeHex(primary, DEFAULT_BRAND_COLOR);

  if (mode === 'single') {
    if (harmony === 'complementary') {
      return getComplementary(normalizedPrimary);
    }

    if (harmony === 'triadic') {
      return getTriadic(normalizedPrimary)[0];
    }

    return getAnalogous(normalizedPrimary)[0];
  }

  if (secondary.trim()) {
    return normalizeHex(secondary, normalizedPrimary);
  }

  return normalizedPrimary;
};

const shiftLightness = (hex: string, amount: number, fallback: string) => {
  const color = safeParseOklch(hex, fallback);
  return formatHex(oklch({ ...color, l: clampLightness((color.l ?? 0.6) + amount) }));
};

const getPrimaryButtonBackground = (style: ProductListStyle, primary: string, secondary: string) => (
  style === 'bento' ? secondary : primary
);

export interface ProductListColorTokens {
  primary: string;
  secondary: string;
  headingPrimary: string;
  subtitleSecondary: string;
  accentSecondary: string;
  ctaPrimary: string;
  ctaPrimaryText: string;
  ctaSecondaryBorder: string;
  ctaSecondaryHoverBg: string;
  ctaSecondaryText: string;
  pricePrimary: string;
  badgeSolidBg: string;
  badgeSolidText: string;
  badgeOutlineBorder: string;
  badgeOutlineText: string;
  cardBorderHover: string;
  cardShadowHover: string;
  featuredSurface: string;
  featuredShadow: string;
  featuredOverlayText: string;
  dotActive: string;
  dotInactive: string;
  navBg: string;
  navText: string;
  navBorder: string;
  neutralBackground: string;
  neutralSurface: string;
  neutralMuted: string;
  neutralBorder: string;
}

export const getProductListColorTokens = ({
  primary,
  secondary,
  mode,
  harmony,
  style,
}: {
  primary: string;
  secondary: string;
  mode: ProductListBrandMode;
  harmony: ProductListHarmony;
  style: ProductListStyle;
}): ProductListColorTokens => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode, harmony);
  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralMuted = '#64748b';
  const neutralBorder = '#e2e8f0';
  const featuredOverlayText = getAPCATextColor('#0f172a', 20, 700);

  const ctaPrimary = getPrimaryButtonBackground(style, primaryResolved, secondaryResolved);
  const ctaPrimaryText = getAPCATextColor(ctaPrimary, 14, 600);

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,
    headingPrimary: ensureAPCATextColor(primaryResolved, neutralSurface, 24, 700),
    subtitleSecondary: ensureAPCATextColor(secondaryResolved, neutralSurface, 18, 600),
    accentSecondary: ensureAPCATextColor(secondaryResolved, neutralSurface, 14, 500),
    ctaPrimary,
    ctaPrimaryText,
    ctaSecondaryBorder: withAlpha(primaryResolved, 0.25, primaryResolved),
    ctaSecondaryHoverBg: withAlpha(primaryResolved, 0.08, primaryResolved),
    ctaSecondaryText: ensureAPCATextColor(primaryResolved, neutralSurface, 14, 700),
    pricePrimary: primaryResolved,
    badgeSolidBg: secondaryResolved,
    badgeSolidText: getAPCATextColor(secondaryResolved, 12, 700),
    badgeOutlineBorder: withAlpha(secondaryResolved, 0.4, primaryResolved),
    badgeOutlineText: ensureAPCATextColor(secondaryResolved, neutralSurface, 12, 700),
    cardBorderHover: withAlpha(secondaryResolved, 0.35, primaryResolved),
    cardShadowHover: `0 10px 15px -3px ${withAlpha(secondaryResolved, 0.12, primaryResolved)}`,
    featuredSurface: withAlpha(secondaryResolved, 0.08, primaryResolved),
    featuredShadow: `0 8px 24px ${withAlpha(secondaryResolved, 0.2, primaryResolved)}`,
    featuredOverlayText,
    dotActive: primaryResolved,
    dotInactive: withAlpha(secondaryResolved, 0.4, primaryResolved),
    navBg: neutralSurface,
    navText: ensureAPCATextColor(shiftLightness(primaryResolved, -0.05, primaryResolved), neutralSurface, 14, 500),
    navBorder: neutralBorder,
    neutralBackground,
    neutralSurface,
    neutralMuted,
    neutralBorder,
  };
};
