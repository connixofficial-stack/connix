'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
import type {
  ContactBrandMode,
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

const getDarkModeAccent = (hex: string, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  const lightness = color.l ?? 0.62;
  const chroma = color.c ?? 0.14;

  return formatHex(oklch({
    ...color,
    l: lightness < 0.62 ? 0.68 : Math.min(lightness, 0.82),
    c: color.h == null ? Math.min(chroma, 0.02) : clampChroma(Math.max(chroma * 0.9, Math.min(chroma + 0.02, 0.14))),
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

export const ensureAPCATextColor = (
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

export const getHarmonyColor = (primary: string) => {
  const color = safeParseOklch(primary, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 30) % 360 }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: ContactBrandMode,
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

interface ContactPalette {
  solid: string;
  textOnSolid: string;
  surface: string;
  border: string;
  hoverSurface: string;
  interactiveText: string;
}

const buildPalette = (hex: string, fallback = DEFAULT_BRAND_COLOR): ContactPalette => {
  const solid = normalizeHex(hex, fallback);
  const surface = shiftColor(solid, 0.35, 0.75, fallback);
  const border = shiftColor(solid, 0.2, 0.68, fallback);
  const hoverSurface = shiftColor(solid, 0.29, 0.78, fallback);
  const interactiveText = shiftColor(solid, -0.18, 0.95, fallback);

  return {
    solid,
    textOnSolid: getAPCATextColor(solid, 14, 600),
    surface,
    border,
    hoverSurface,
    interactiveText: getAPCATextColor(surface, 14, 500) === '#ffffff'
      ? '#ffffff'
      : interactiveText,
  };
};

export interface ContactColorTokens {
  primary: string;
  secondary: string;

  neutralBackground: string;
  neutralSurface: string;
  neutralBorder: string;
  neutralText: string;
  mutedText: string;

  heading: string;
  sectionTint: string;
  sectionBadgeBg: string;
  sectionBadgeBorder: string;
  sectionBadgeText: string;

  cardBackground: string;
  cardBorder: string;
  cardHoverBorder: string;

  iconTintBackground: string;
  iconTintColor: string;

  labelText: string;
  valueText: string;
  helperText: string;

  socialBackground: string;
  socialBorder: string;
  socialIcon: string;

  mapPlaceholderBg: string;
  mapPlaceholderIcon: string;

  centeredHeaderBg: string;
  centeredSurface: string;

  floatingCardBg: string;
  floatingCardBorder: string;

  formBackground: string;
  formBorder: string;
  formTitle: string;
  formDescription: string;
  formAccent: string;
  formFieldBackground: string;
  formFieldBorder: string;
  formFieldText: string;
  formFieldPlaceholder: string;
  formFieldFocus: string;
  formFieldDisabledBackground: string;
  formFieldDisabledText: string;
  formButtonBackground: string;
  formButtonText: string;
  formButtonBorder: string;
  formHelperText: string;
  formWarningText: string;
}

export interface ContactHarmonyStatus {
  deltaE: number;
  similarity: number;
  isTooSimilar: boolean;
}

export interface ContactAccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

export interface ContactAccessibilityScore {
  minLc: number;
  failing: Array<ContactAccessibilityPair & { lc: number; threshold: number }>;
}

export const getHarmonyStatus = (primary: string, secondary: string): ContactHarmonyStatus => {
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

export const getContactAccessibilityScore = (
  pairs: ContactAccessibilityPair[]
): ContactAccessibilityScore => {
  const failing: ContactAccessibilityScore['failing'] = [];
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

export const getContactColorTokens = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: ContactBrandMode;
}): ContactColorTokens => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);

  const primaryPalette = buildPalette(primaryResolved, DEFAULT_BRAND_COLOR);
  const secondaryPalette = buildPalette(secondaryResolved, primaryResolved);

  const neutralBackground = '#faf7f0';
  const neutralSurface = '#ffffff';
  const neutralBorder = '#e2e8f0';
  const neutralText = '#0f172a';
  const mutedText = '#64748b';

  const sectionBadgeBg = neutralSurface;
  const sectionBadgeText = ensureAPCATextColor(primaryPalette.interactiveText, neutralSurface, 11, 600);

  const iconBg = neutralSurface;
  const iconTintColor = ensureAPCATextColor(primaryPalette.interactiveText, neutralSurface, 14, 600);

  const socialBg = neutralSurface;
  const socialIcon = neutralText;

  const formFieldBorder = neutralBorder;
  const formFieldFocus = neutralText;
  const formButtonBackground = neutralText;
  const formButtonText = '#ffffff';

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,

    neutralBackground,
    neutralSurface,
    neutralBorder,
    neutralText,
    mutedText,

    heading: neutralText,
    sectionTint: neutralBackground,
    sectionBadgeBg,
    sectionBadgeBorder: neutralBorder,
    sectionBadgeText,

    cardBackground: neutralSurface,
    cardBorder: neutralBorder,
    cardHoverBorder: secondaryPalette.border,

    iconTintBackground: iconBg,
    iconTintColor,

    labelText: ensureAPCATextColor(primaryPalette.interactiveText, neutralSurface, 12, 600),
    valueText: neutralText,
    helperText: mutedText,

    socialBackground: socialBg,
    socialBorder: neutralBorder,
    socialIcon,

    mapPlaceholderBg: neutralBackground,
    mapPlaceholderIcon: ensureAPCATextColor(primaryPalette.interactiveText, neutralBackground, 14, 600),

    centeredHeaderBg: neutralSurface,
    centeredSurface: neutralBackground,

    floatingCardBg: neutralSurface,
    floatingCardBorder: neutralBorder,

    formBackground: neutralSurface,
    formBorder: neutralBorder,
    formTitle: neutralText,
    formDescription: mutedText,
    formAccent: ensureAPCATextColor(primaryPalette.interactiveText, neutralSurface, 14, 600),
    formFieldBackground: neutralSurface,
    formFieldBorder,
    formFieldText: neutralText,
    formFieldPlaceholder: mutedText,
    formFieldFocus,
    formFieldDisabledBackground: neutralBackground,
    formFieldDisabledText: mutedText,
    formButtonBackground,
    formButtonText,
    formButtonBorder: formButtonBackground,
    formHelperText: mutedText,
    formWarningText: '#b45309',
  };
};

export const getContactDarkColorTokens = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: ContactBrandMode;
}): ContactColorTokens => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);
  const primaryAccent = getDarkModeAccent(primaryResolved, DEFAULT_BRAND_COLOR);
  const secondaryAccent = mode === 'single'
    ? primaryAccent
    : getDarkModeAccent(secondaryResolved, primaryResolved);

  const darkBackground = '#020617';
  const darkSurface = '#0f172a';
  const darkElevatedSurface = '#111827';
  const darkBorder = '#334155';
  const darkText = '#f8fafc';
  const darkMutedText = '#cbd5e1';
  const darkSubtleText = '#94a3b8';

  const primaryText = ensureAPCATextColor(primaryAccent, darkElevatedSurface, 14, 600);
  const secondaryText = ensureAPCATextColor(secondaryAccent, darkElevatedSurface, 14, 600);
  const badgeAccentText = ensureAPCATextColor(mode === 'dual' ? secondaryAccent : primaryAccent, darkElevatedSurface, 11, 600);
  const buttonText = getAPCATextColor(primaryAccent, 14, 700);

  return {
    primary: primaryAccent,
    secondary: secondaryAccent,

    neutralBackground: darkBackground,
    neutralSurface: darkSurface,
    neutralBorder: darkBorder,
    neutralText: darkText,
    mutedText: darkMutedText,

    heading: darkText,
    sectionTint: darkBackground,
    sectionBadgeBg: darkElevatedSurface,
    sectionBadgeBorder: darkBorder,
    sectionBadgeText: badgeAccentText,

    cardBackground: darkSurface,
    cardBorder: darkBorder,
    cardHoverBorder: secondaryAccent,

    iconTintBackground: darkElevatedSurface,
    iconTintColor: primaryText,

    labelText: secondaryText,
    valueText: darkText,
    helperText: darkMutedText,

    socialBackground: darkElevatedSurface,
    socialBorder: darkBorder,
    socialIcon: darkText,

    mapPlaceholderBg: darkElevatedSurface,
    mapPlaceholderIcon: darkSubtleText,

    centeredHeaderBg: darkSurface,
    centeredSurface: darkElevatedSurface,

    floatingCardBg: darkSurface,
    floatingCardBorder: darkBorder,

    formBackground: darkSurface,
    formBorder: darkBorder,
    formTitle: darkText,
    formDescription: darkMutedText,
    formAccent: primaryText,
    formFieldBackground: darkElevatedSurface,
    formFieldBorder: darkBorder,
    formFieldText: darkText,
    formFieldPlaceholder: darkSubtleText,
    formFieldFocus: primaryText,
    formFieldDisabledBackground: darkBackground,
    formFieldDisabledText: darkSubtleText,
    formButtonBackground: primaryAccent,
    formButtonText: buttonText,
    formButtonBorder: primaryAccent,
    formHelperText: darkMutedText,
    formWarningText: '#fbbf24',
  };
};

export const getContactThemeTokens = ({
  primary,
  secondary,
  mode,
  isDark = false,
}: {
  primary: string;
  secondary: string;
  mode: ContactBrandMode;
  isDark?: boolean;
}) => (
  isDark
    ? getContactDarkColorTokens({ primary, secondary, mode })
    : getContactColorTokens({ primary, secondary, mode })
);

export const getContactValidationResult = ({
  primary,
  secondary,
  mode,
  isDark = false,
}: {
  primary: string;
  secondary: string;
  mode: ContactBrandMode;
  isDark?: boolean;
}) => {
  const tokens = getContactThemeTokens({
    primary,
    secondary,
    mode,
    isDark,
  });

  const harmonyStatus = mode === 'single'
    ? { deltaE: 100, similarity: 0, isTooSimilar: false }
    : getHarmonyStatus(tokens.primary, tokens.secondary);

  const accessibility = getContactAccessibilityScore([
    { background: tokens.neutralSurface, text: tokens.heading, fontSize: 32, fontWeight: 700, label: 'heading' },
    { background: tokens.cardBackground, text: tokens.valueText, fontSize: 14, fontWeight: 500, label: 'value' },
    { background: tokens.cardBackground, text: tokens.labelText, fontSize: 11, fontWeight: 600, label: 'label' },
    { background: tokens.iconTintBackground, text: tokens.iconTintColor, fontSize: 14, fontWeight: 600, label: 'icon-tint' },
    { background: tokens.socialBackground, text: tokens.socialIcon, fontSize: 14, fontWeight: 600, label: 'social' },
    { background: tokens.sectionBadgeBg, text: tokens.sectionBadgeText, fontSize: 11, fontWeight: 600, label: 'badge' },
  ]);

  return {
    tokens,
    harmonyStatus,
    accessibility,
    resolvedSecondary: tokens.secondary,
  };
};
