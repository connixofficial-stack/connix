'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';
import type { ProductCategoriesBrandMode } from '../_types';

export interface BrandPalette {
  solid: string;
  surface: string;
  hover: string;
  active: string;
  border: string;
  disabled: string;
  textOnSolid: string;
  textInteractive: string;
}

export interface ProductCategoriesColors {
  primary: BrandPalette;
  secondary: BrandPalette;
  neutral: {
    background: string;
    surface: string;
    border: string;
    text: string;
    muted: string;
    inverseSurface: string;
    inverseText: string;
  };
  cardShadow: string;
  cardShadowHover: string;
  cardBorder: string;
  cardBorderHover: string;
  sectionBg: string;
  sectionAccent: string;
  linkText: string;
  productCountText: string;
  iconContainerBg: string;
  overlayText: string;
  categoryNameText: string;
  cardAccentBar: string;
  pillBg: string;
  pillBorder: string;
  secondaryMuted: string;
  ctaMoreBg: string;
  ctaMoreBorder: string;
  ctaMoreText: string;
  circularBg: string;
  circularBorder: string;
  showcaseBackground: string;
  showcaseBorder: string;
  paginationDotActive: string;
  paginationDotInactive: string;
  arrowIcon: string;
  buttonText: string;
  secondaryButtonText: string;
  secondaryAccent: string;
  darkSurface: string;
  darkBorder: string;
  darkText: string;
  emptyState: {
    background: string;
    iconBg: string;
    icon: string;
    text: string;
  };
}

const DEFAULT_BRAND_COLOR = '#3b82f6';

const isNonEmptyColor = (value: string) => value.trim().length > 0;

const safeParseOklch = (input: string, fallback: string) => (
  oklch(input) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR)
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

const getAPCATextColor = (bg: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', bg);
  const blackLc = getAPCALc('#000000', bg);
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc > blackLc ? '#ffffff' : '#0f172a';
};

const getSolidTint = (hex: string, deltaL: number, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  return formatHex(oklch({ ...color, l: Math.max(0.08, Math.min((color.l ?? 0) + deltaL, 0.98)) }));
};

const generatePalette = (hex: string, fallback = DEFAULT_BRAND_COLOR): BrandPalette => {
  const solid = isNonEmptyColor(hex) ? hex : fallback;
  const color = safeParseOklch(solid, fallback);

  return {
    solid,
    surface: formatHex(oklch({ ...color, l: Math.min((color.l ?? 0) + 0.4, 0.98) })),
    hover: formatHex(oklch({ ...color, l: Math.max((color.l ?? 0) - 0.1, 0.1) })),
    active: formatHex(oklch({ ...color, l: Math.max((color.l ?? 0) - 0.15, 0.08) })),
    border: formatHex(oklch({ ...color, l: Math.min((color.l ?? 0) + 0.3, 0.92) })),
    disabled: formatHex(oklch({ ...color, l: Math.min((color.l ?? 0) + 0.25, 0.9), c: (color.c ?? 0) * 0.5 })),
    textOnSolid: getAPCATextColor(solid, 16, 500),
    textInteractive: formatHex(oklch({ ...color, l: Math.max((color.l ?? 0) - 0.25, 0.2) })),
  };
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

const resolveSecondaryForMode = (primary: string, secondary: string, mode: ProductCategoriesBrandMode) => {
  if (mode === 'single') {return primary;}
  return isNonEmptyColor(secondary) ? secondary : primary;
};

export const getProductCategoriesColors = (
  primary: string,
  secondary: string,
  mode: ProductCategoriesBrandMode
): ProductCategoriesColors => {
  const primaryPalette = generatePalette(primary);
  const secondaryResolved = resolveSecondaryForMode(primaryPalette.solid, secondary, mode);
  const secondaryPalette = generatePalette(secondaryResolved, primaryPalette.solid);
  const neutral = {
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#0f172a',
    text: '#0f172a',
    muted: '#64748b',
    inverseSurface: '#0f172a',
    inverseText: '#ffffff',
  };

  // Smart accent picker: primary → secondary → neutral
  // Checks APCA contrast against white background (Lc >= 40 for UI accents)
  const ACCENT_THRESHOLD = 40;
  const pickReadableAccent = (preferred: string, fallback: string, neutralFallback: string): string => {
    if (getAPCALc(preferred, '#ffffff') >= ACCENT_THRESHOLD) return preferred;
    if (getAPCALc(fallback, '#ffffff') >= ACCENT_THRESHOLD) return fallback;
    return neutralFallback;
  };

  const dualAccent = mode === 'dual'
    ? pickReadableAccent(secondaryPalette.solid, primaryPalette.solid, neutral.muted)
    : pickReadableAccent(primaryPalette.solid, secondaryPalette.solid, neutral.muted);

  const primaryAccent = pickReadableAccent(primaryPalette.solid, secondaryPalette.solid, neutral.muted);

  const primaryStrongBorder = getSolidTint(primaryPalette.solid, -0.12, primaryPalette.solid);
  const secondaryStrongBorder = getSolidTint(secondaryPalette.solid, -0.12, secondaryPalette.solid);
  const darkSurface = '#111111';

  return {
    primary: primaryPalette,
    secondary: secondaryPalette,
    neutral,
    cardShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
    cardShadowHover: '0 10px 24px rgba(15, 23, 42, 0.14)',
    cardBorder: mode === 'dual' ? secondaryStrongBorder : primaryStrongBorder,
    cardBorderHover: primaryPalette.solid,
    sectionBg: neutral.surface,
    sectionAccent: primaryPalette.solid,
    linkText: dualAccent,
    productCountText: dualAccent,
    iconContainerBg: neutral.surface,
    overlayText: '#ffffff',
    categoryNameText: neutral.text,
    cardAccentBar: primaryPalette.solid,
    pillBg: neutral.surface,
    pillBorder: dualAccent,
    secondaryMuted: dualAccent,
    ctaMoreBg: neutral.surface,
    ctaMoreBorder: primaryAccent,
    ctaMoreText: primaryAccent,
    circularBg: neutral.surface,
    circularBorder: primaryAccent,
    showcaseBackground: neutral.surface,
    showcaseBorder: dualAccent,
    paginationDotActive: dualAccent,
    paginationDotInactive: mode === 'dual' ? secondaryStrongBorder : primaryStrongBorder,
    arrowIcon: dualAccent,
    buttonText: primaryPalette.textOnSolid,
    secondaryButtonText: secondaryPalette.textOnSolid,
    secondaryAccent: dualAccent,
    darkSurface,
    darkBorder: '#000000',
    darkText: ensureAPCATextColor('#ffffff', darkSurface, 16, 600),
    emptyState: {
      background: neutral.surface,
      iconBg: neutral.surface,
      icon: primaryAccent,
      text: neutral.muted,
    },
  };
};
