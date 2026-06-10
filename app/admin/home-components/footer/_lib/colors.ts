'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';
import type { FooterBrandMode, FooterStyle } from '../_types';

const DEFAULT_BRAND_COLOR = '#3b82f6';

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);
const clampChroma = (value: number) => Math.min(Math.max(value, 0.02), 0.37);

const hexToRgb = (hex: string): [number, number, number] | null => {
  const cleaned = hex.trim().replace('#', '');
  if (cleaned.length !== 3 && cleaned.length !== 6) {return null;}

  const normalized = cleaned.length === 3
    ? cleaned.split('').map((char) => `${char}${char}`).join('')
    : cleaned;

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some((value) => Number.isNaN(value))) {return null;}
  return [r, g, b];
};

const safeParseOklch = (input: string, fallback: string) => (
  oklch(input) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR)
);

const normalizeHex = (input: string, fallback = DEFAULT_BRAND_COLOR) => (
  formatHex(oklch(safeParseOklch(input, fallback)))
);

const getDarkModeAccent = (input: string, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(input, fallback);
  const lightness = color.l ?? 0.62;
  const chroma = color.c ?? 0.14;

  return formatHex(oklch({
    ...color,
    l: lightness < 0.62 ? 0.68 : Math.min(lightness, 0.82),
    c: color.h == null ? Math.min(chroma, 0.02) : clampChroma(Math.max(chroma * 0.9, Math.min(chroma + 0.02, 0.14))),
  }));
};

const oklchShift = (
  input: string,
  fallback: string,
  options: {
    l?: number;
    c?: number;
    h?: number;
  },
) => {
  const color = safeParseOklch(input, fallback);

  return formatHex(oklch({
    ...color,
    ...(options.h !== undefined ? { h: options.h } : {}),
    ...(options.l !== undefined ? { l: clampLightness((color.l ?? 0.6) + options.l) } : {}),
    ...(options.c !== undefined ? { c: clampChroma((color.c ?? 0.12) + options.c) } : {}),
  }));
};

const getAPCATextColor = (bgHex: string, fontSize = 16, fontWeight = 500) => {
  const bgRgb = hexToRgb(bgHex) ?? hexToRgb(DEFAULT_BRAND_COLOR);
  if (!bgRgb) {return '#ffffff';}

  const whiteLc = Math.abs(APCAcontrast(sRGBtoY([255, 255, 255]), sRGBtoY(bgRgb)));
  const blackLc = Math.abs(APCAcontrast(sRGBtoY([0, 0, 0]), sRGBtoY(bgRgb)));
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc >= blackLc ? '#ffffff' : '#0f172a';
};

const getAPCALevel = (textHex: string, bgHex: string) => {
  const textRgb = hexToRgb(textHex);
  const bgRgb = hexToRgb(bgHex);
  if (!textRgb || !bgRgb) {return 0;}
  return Math.abs(APCAcontrast(sRGBtoY(textRgb), sRGBtoY(bgRgb)));
};

const ensureTextContrast = (
  candidate: string,
  bgHex: string,
  fontSize: number,
  fontWeight: number,
  fallback: string,
) => {
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;
  return getAPCALevel(candidate, bgHex) >= threshold ? candidate : fallback;
};

const getTextVariants = (bgHex: string, fontSize = 12, fontWeight = 500) => {
  const primary = getAPCATextColor(bgHex, fontSize, fontWeight);
  const base = safeParseOklch(primary, primary);
  const isLight = (base.l ?? 0.8) >= 0.6;
  const mutedCandidate = oklchShift(primary, primary, { l: isLight ? -0.12 : 0.12, c: -0.02 });
  const subtleCandidate = oklchShift(primary, primary, { l: isLight ? -0.2 : 0.2, c: -0.04 });
  const muted = ensureTextContrast(mutedCandidate, bgHex, fontSize, fontWeight, primary);
  const subtle = ensureTextContrast(subtleCandidate, bgHex, fontSize, fontWeight, muted);
  return { primary, muted, subtle };
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: FooterBrandMode,
) => {
  const primaryResolved = normalizeHex(primary);
  if (mode === 'single') {return primaryResolved;}

  const secondaryTrimmed = secondary.trim();
  if (!secondaryTrimmed) {return primaryResolved;}
  return normalizeHex(secondaryTrimmed, primaryResolved);
};

export const withAlpha = (hex: string, alpha: number, fallback = DEFAULT_BRAND_COLOR) => {
  const normalized = normalizeHex(hex, fallback);
  const rgb = hexToRgb(normalized) ?? hexToRgb(DEFAULT_BRAND_COLOR);
  if (!rgb) {return `rgba(59, 130, 246, ${alpha})`;}

  const normalizedAlpha = Number.isFinite(alpha) ? Math.min(Math.max(alpha, 0), 1) : 1;
  const alphaString = Number(normalizedAlpha.toFixed(3)).toString();
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alphaString})`;
};

export interface FooterLayoutColors {
  primary: string;
  secondary: string;
  bg: string;
  surface: string;
  border: string;
  borderSoft: string;
  accent: string;
  link: string;
  heading: string;
  textOnPrimary: string;
  textOnAccent: string;
  textPrimary: string;
  textMuted: string;
  textSubtle: string;
  linkHover: string;
  socialBg: string;
  socialText: string;
  socialIconFallback: string;
  socialOriginalBg: string;
  socialOriginalIcon: string;
  brandGradient: string;
  dividerGradient: string;
  centeredBrandBg: string;
  centeredBrandBorder: string;
  centeredSocialBg: string;
  centeredSocialBorder: string;
  centeredSocialHoverBg: string;
  centeredSocialHoverBorder: string;
  centeredSocialText: string;
  stackedTopBorder: string;
  stackedSocialBg: string;
  stackedSocialHoverBg: string;
  stackedSocialText: string;
  stackedTextOnBg: string;
  classicBg: string;
  magazineBg: string;
  magazineHeading: string;
  magazineText: string;
  magazineTextMuted: string;
  magazineTextSubtle: string;
  magazineLink: string;
  magazineLinkHover: string;
}

export const getFooterLayoutColors = (
  style: FooterStyle,
  primary: string,
  secondary: string,
  mode: FooterBrandMode,
): FooterLayoutColors => {
  const primaryResolved = normalizeHex(primary);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);
  // bg = primary color directly — text contrast system auto-picks white/black
  const bg = primaryResolved;
  const classicBg = primaryResolved;
  const surface = oklchShift(primaryResolved, primaryResolved, { c: -0.02, l: -0.08 });
  const border = oklchShift(primaryResolved, primaryResolved, { c: -0.02, l: -0.12 });
  const borderSoft = oklchShift(primaryResolved, primaryResolved, { c: -0.01, l: -0.06 });

  const textPrimary = getAPCATextColor(bg, 14, 700);
  const textVariants = getTextVariants(bg, 12, 500);
  const textOnPrimary = getAPCATextColor(primaryResolved, 12, 700);
  const textOnAccent = getAPCATextColor(secondaryResolved, 12, 700);

  // Heading color priority: secondary (vibrant) > primary > textPrimary (w/b)
  // Secondary often has better contrast on primary-derived dark bg
  const headingFromSecondary = ensureTextContrast(secondaryResolved, bg, 14, 700, '');
  const headingFromPrimary = ensureTextContrast(primaryResolved, bg, 14, 700, '');
  const heading = headingFromSecondary || headingFromPrimary || textPrimary;

  // Link color priority: secondary > muted variant
  const link = ensureTextContrast(secondaryResolved, bg, 12, 600, textVariants.muted);
  // LinkHover: dual → secondary (adjusted for contrast); single → brightened primary
  const linkHover = (() => {
    if (mode !== 'dual') {
      const shifted = oklchShift(secondaryResolved, primaryResolved, { l: 0.12 });
      return ensureTextContrast(shifted, bg, 12, 600, textPrimary);
    }
    // Dual: try secondary as-is, then progressively adjust lightness to meet contrast
    const threshold = 60;
    if (getAPCALevel(secondaryResolved, bg) >= threshold) return secondaryResolved;
    // Determine direction: if bg is dark → lighten secondary, else → darken
    const bgParsed = safeParseOklch(bg, bg);
    const isDarkBg = (bgParsed.l ?? 0.5) < 0.55;
    const steps = [0.1, 0.2, 0.3, 0.4, 0.5];
    for (const delta of steps) {
      const adjusted = oklchShift(secondaryResolved, secondaryResolved, { l: isDarkBg ? delta : -delta });
      if (getAPCALevel(adjusted, bg) >= threshold) return adjusted;
    }
    return textPrimary;
  })();

  const socialBg = oklchShift(secondaryResolved, primaryResolved, { c: -0.06, l: 0.48 });
  const socialText = getAPCATextColor(socialBg, 12, 600);
  const socialIconFallback = getAPCATextColor(socialBg, 12, 600);
  const dividerGradient = oklchShift(secondaryResolved, primaryResolved, { c: -0.06, l: 0.32 });

  const centeredStrength = style === 'centered' ? 0.2 : 0.18;
  const stackedStrength = style === 'stacked' ? 0.15 : 0.12;
  const centeredBrandBg = oklchShift(primaryResolved, primaryResolved, { c: -0.05, l: centeredStrength });
  const centeredBrandBorder = oklchShift(primaryResolved, primaryResolved, { c: -0.03, l: centeredStrength - 0.08 });
  const centeredSocialBg = oklchShift(secondaryResolved, primaryResolved, { c: -0.05, l: centeredStrength - 0.04 });
  const centeredSocialBorder = oklchShift(secondaryResolved, primaryResolved, { c: -0.03, l: centeredStrength - 0.1 });
  const centeredSocialText = getAPCATextColor(centeredSocialBg, 12, 600);
  const stackedSocialBg = oklchShift(secondaryResolved, primaryResolved, { c: -0.05, l: stackedStrength });
  const stackedSocialText = getAPCATextColor(stackedSocialBg, 12, 600);
  // Wave layout uses primaryResolved as bg — text must contrast against primary, not secondary
  const stackedTextOnBg = getAPCATextColor(primaryResolved, 12, 700);

  // Magazine: light neutral bg, auto dark text
  // Links: dark by default, secondary only on hover
  const magazineBg = '#f5f5f5';
  const magazineText = getAPCATextColor(magazineBg, 14, 700);
  const magazineTextVariants = getTextVariants(magazineBg, 12, 500);
  const magazineHeadingFromPrimary = ensureTextContrast(primaryResolved, magazineBg, 14, 700, '');
  const magazineHeading = magazineHeadingFromPrimary || magazineText;
  const magazineLink = magazineTextVariants.muted; // dark text, not secondary
  const magazineLinkHover = ensureTextContrast(secondaryResolved, magazineBg, 12, 600, primaryResolved); // secondary on hover

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,
    bg,
    surface,
    border,
    borderSoft,
    accent: secondaryResolved,
    link,
    heading,
    textOnPrimary,
    textOnAccent,
    textPrimary,
    textMuted: textVariants.muted,
    textSubtle: textVariants.subtle,
    linkHover,
    socialBg,
    socialText,
    socialIconFallback,
    socialOriginalBg: socialBg,
    socialOriginalIcon: socialText,
    brandGradient: surface,
    dividerGradient,
    centeredBrandBg,
    centeredBrandBorder,
    centeredSocialBg,
    centeredSocialBorder,
    centeredSocialHoverBg: secondaryResolved,
    centeredSocialHoverBorder: secondaryResolved,
    centeredSocialText,
    stackedTopBorder: primaryResolved,
    stackedSocialBg,
    stackedSocialHoverBg: secondaryResolved,
    stackedSocialText,
    stackedTextOnBg,
    classicBg,
    magazineBg,
    magazineHeading,
    magazineText,
    magazineTextMuted: magazineTextVariants.muted,
    magazineTextSubtle: magazineTextVariants.subtle,
    magazineLink,
    magazineLinkHover,
  };
};

export const getFooterDarkLayoutColors = (
  style: FooterStyle,
  primary: string,
  secondary: string,
  mode: FooterBrandMode,
): FooterLayoutColors => {
  const primaryResolved = normalizeHex(primary);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);
  const primaryAccent = getDarkModeAccent(primaryResolved);
  const secondaryAccent = mode === 'single'
    ? primaryAccent
    : getDarkModeAccent(secondaryResolved, primaryResolved);

  const bg = '#020617';
  const surface = '#0f172a';
  const elevatedSurface = '#111827';
  const border = '#334155';
  const borderSoft = '#1e293b';
  const textPrimary = '#f8fafc';
  const textMuted = '#cbd5e1';
  const textSubtle = '#94a3b8';
  const accent = mode === 'dual' ? secondaryAccent : primaryAccent;
  const link = ensureTextContrast(accent, bg, 12, 600, textMuted);
  const linkHover = ensureTextContrast(primaryAccent, bg, 12, 700, textPrimary);
  const socialBg = elevatedSurface;
  const socialText = textPrimary;
  const magazineBg = style === 'centered' ? '#050816' : bg;
  const stackedTopBorder = style === 'stacked' ? surface : bg;
  const textOnPrimary = getAPCATextColor(primaryAccent, 12, 700);
  const textOnAccent = getAPCATextColor(accent, 12, 700);

  return {
    primary: primaryAccent,
    secondary: secondaryAccent,
    bg,
    surface,
    border,
    borderSoft,
    accent,
    link,
    heading: textPrimary,
    textOnPrimary,
    textOnAccent,
    textPrimary,
    textMuted,
    textSubtle,
    linkHover,
    socialBg,
    socialText,
    socialIconFallback: socialText,
    socialOriginalBg: socialBg,
    socialOriginalIcon: socialText,
    brandGradient: surface,
    dividerGradient: accent,
    centeredBrandBg: surface,
    centeredBrandBorder: border,
    centeredSocialBg: elevatedSurface,
    centeredSocialBorder: border,
    centeredSocialHoverBg: accent,
    centeredSocialHoverBorder: accent,
    centeredSocialText: socialText,
    stackedTopBorder,
    stackedSocialBg: elevatedSurface,
    stackedSocialHoverBg: accent,
    stackedSocialText: socialText,
    stackedTextOnBg: textPrimary,
    classicBg: surface,
    magazineBg,
    magazineHeading: textPrimary,
    magazineText: textPrimary,
    magazineTextMuted: textMuted,
    magazineTextSubtle: textSubtle,
    magazineLink: textMuted,
    magazineLinkHover: linkHover,
  };
};

export const getFooterThemeColors = (
  style: FooterStyle,
  primary: string,
  secondary: string,
  mode: FooterBrandMode,
  isDark = false,
) => (
  isDark
    ? getFooterDarkLayoutColors(style, primary, secondary, mode)
    : getFooterLayoutColors(style, primary, secondary, mode)
);
