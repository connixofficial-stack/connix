import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';

const DEFAULT_COLOR = '#3b82f6';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const safeParseOklch = (value: string, fallback: string) => (
  oklch(value) ?? oklch(fallback) ?? oklch(DEFAULT_COLOR)
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

const getAccessibilityThreshold = (fontSize: number, fontWeight: number) => {
  if (fontSize >= 24 || (fontSize >= 18 && fontWeight >= 700)) {
    return 45;
  }

  if (fontSize >= 16 && fontWeight >= 600) {
    return 52;
  }

  return 60;
};

const getAPCALc = (text: string, background: string) => {
  const textRgb = toRgbTuple(text, '#ffffff');
  const bgRgb = toRgbTuple(background, '#0f172a');

  if (!textRgb || !bgRgb) {
    return 0;
  }

  const lc = Math.abs(APCAcontrast(sRGBtoY(textRgb), sRGBtoY(bgRgb)));
  return Number.isFinite(lc) ? lc : 0;
};

const getAPCATextColor = (background: string, _fontSize = 16, _fontWeight = 500) => {
  const bgRgb = toRgbTuple(background, '#0f172a');
  if (!bgRgb) {
    return '#111111';
  }

  const whiteLc = Math.abs(APCAcontrast(sRGBtoY([255, 255, 255]), sRGBtoY(bgRgb)));
  const nearBlackLc = Math.abs(APCAcontrast(sRGBtoY([17, 17, 17]), sRGBtoY(bgRgb)));

  return whiteLc >= nearBlackLc ? '#ffffff' : '#111111';
};

const ensureAPCATextColor = (
  preferredText: string,
  background: string,
  fontSize = 16,
  fontWeight = 500
) => {
  const threshold = getAccessibilityThreshold(fontSize, fontWeight);
  const lc = getAPCALc(preferredText, background);

  if (lc >= threshold) {
    return preferredText;
  }

  return getAPCATextColor(background, fontSize, fontWeight);
};

export type MenuColorMode = 'single' | 'dual';
export type MenuLayerColorChoice = 'white' | 'primary' | 'secondary';

export type MenuLayerColorConfig = {
  topnav?: MenuLayerColorChoice;
  navbar?: MenuLayerColorChoice;
  menu?: MenuLayerColorChoice;
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string | undefined,
  mode: MenuColorMode
) => {
  if (mode === 'single') {
    return primary;
  }

  if (typeof secondary !== 'string') {
    return primary;
  }

  const trimmed = secondary.trim();
  return trimmed ? trimmed : primary;
};

export const getSolidTint = (value: string, fallback: string, lDelta = 0.42) => {
  const base = safeParseOklch(value, fallback);
  return formatHex(oklch({ ...base, l: clamp(base.l + lDelta, 0, 0.98) }));
};

export type MenuColors = {
  primary: string;
  secondary: string;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;
  topbarBg: string;
  topbarText: string;
  topbarDivider: string;
  accentLine: string;
  brandBadgeBg: string;
  brandBadgeText: string;
  navItemText: string;
  navItemHoverBg: string;
  navItemHoverText: string;
  dropdownBg: string;
  dropdownBorder: string;
  dropdownItemText: string;
  dropdownItemHoverBg: string;
  dropdownItemHoverText: string;
  dropdownSubItemText: string;
  dropdownSubItemHoverText: string;
  dropdownSectionLabel: string;
  searchInputBg: string;
  searchInputBorder: string;
  searchInputText: string;
  searchInputPlaceholder: string;
  searchButtonBg: string;
  searchButtonText: string;
  iconButtonText: string;
  iconButtonHoverText: string;
  badgeBg: string;
  badgeText: string;
  ctaBg: string;
  ctaText: string;
  ctaTextLink: string;
  navBarBg: string;
  mobileMenuBg: string;
  mobileMenuItemText: string;
  mobileMenuItemHoverBg: string;
  mobileMenuSubItemText: string;
  mobileMenuSubItemBorder: string;
  allbirdsAnnouncementBg: string;
  allbirdsAnnouncementText: string;
  allbirdsAccentDot: string;
  allbirdsNavText: string;
  allbirdsNavHoverText: string;
  patternDot: string;
  patternStripe: string;
  placeholderBg: string;
  placeholderText: string;
};

export type MenuLayerResolvedColors = {
  bg: string;
  text: string;
  border: string;
};

export type MenuLayerColorTokens = {
  topnav: MenuLayerResolvedColors;
  navbar: MenuLayerResolvedColors;
  menu: MenuLayerResolvedColors;
};

export const getMenuColors = (
  primary: string,
  secondary: string | undefined,
  mode: MenuColorMode = 'single',
  isDark = false
): MenuColors => {
  const neutralSurface = isDark ? '#0f172a' : '#ffffff';
  const neutralSurfaceAlt = isDark ? '#1e293b' : '#f8fafc';
  const neutralSurfaceMuted = isDark ? '#334155' : '#f1f5f9';
  const neutralBorder = isDark ? '#1e293b' : '#e2e8f0';
  const neutralBorderStrong = isDark ? '#475569' : '#cbd5e1';
  const neutralText = isDark ? '#f8fafc' : '#0f172a';
  const neutralMuted = isDark ? '#cbd5e1' : '#475569';
  const neutralSubtle = isDark ? '#94a3b8' : '#94a3b8';

  const resolvedSecondary = resolveSecondaryForMode(primary, secondary, mode);
  const accent = mode === 'dual' ? resolvedSecondary : primary;
  const primaryTint = getSolidTint(primary, primary, 0.42);
  const primaryTintSoft = getSolidTint(primary, primary, 0.32);

  const textPrimary = ensureAPCATextColor(neutralText, neutralSurface, 16, 600);
  const textMuted = ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500);
  const textSubtle = ensureAPCATextColor(neutralSubtle, neutralSurface, 12, 500);
  const onPrimary = getAPCATextColor(primary, 12, 600);
  const onAccent = getAPCATextColor(accent, 12, 600);
  const onSecondary = getAPCATextColor(resolvedSecondary, 12, 600);

  return {
    primary,
    secondary: resolvedSecondary,
    surface: neutralSurface,
    surfaceAlt: neutralSurfaceAlt,
    surfaceMuted: neutralSurfaceMuted,
    border: neutralBorder,
    borderStrong: neutralBorderStrong,
    textPrimary,
    textMuted,
    textSubtle,
    textInverse: onPrimary,
    topbarBg: primary,
    topbarText: onPrimary,
    topbarDivider: onPrimary,
    accentLine: accent,
    brandBadgeBg: primary,
    brandBadgeText: onPrimary,
    navItemText: textMuted,
    navItemHoverBg: accent,
    navItemHoverText: onAccent,
    dropdownBg: neutralSurface,
    dropdownBorder: neutralBorder,
    dropdownItemText: textMuted,
    dropdownItemHoverBg: neutralSurfaceAlt,
    dropdownItemHoverText: textPrimary,
    dropdownSubItemText: textSubtle,
    dropdownSubItemHoverText: textPrimary,
    dropdownSectionLabel: textSubtle,
    searchInputBg: neutralSurfaceAlt,
    searchInputBorder: neutralBorder,
    searchInputText: textPrimary,
    searchInputPlaceholder: textSubtle,
    searchButtonBg: accent,
    searchButtonText: onAccent,
    iconButtonText: textMuted,
    iconButtonHoverText: textPrimary,
    badgeBg: resolvedSecondary,
    badgeText: onSecondary,
    ctaBg: primary,
    ctaText: onPrimary,
    ctaTextLink: ensureAPCATextColor(resolvedSecondary, neutralSurface, 14, 600),
    navBarBg: neutralSurfaceAlt,
    mobileMenuBg: neutralSurfaceMuted,
    mobileMenuItemText: textMuted,
    mobileMenuItemHoverBg: neutralSurface,
    mobileMenuSubItemText: textSubtle,
    mobileMenuSubItemBorder: neutralBorder,
    allbirdsAnnouncementBg: primary,
    allbirdsAnnouncementText: onPrimary,
    allbirdsAccentDot: resolvedSecondary,
    allbirdsNavText: textSubtle,
    allbirdsNavHoverText: textPrimary,
    patternDot: primaryTint,
    patternStripe: primaryTintSoft,
    placeholderBg: neutralSurfaceMuted,
    placeholderText: textSubtle,
  };
};

export const resolveMenuLayerChoice = (
  choice: MenuLayerColorChoice | undefined,
  mode: MenuColorMode
): MenuLayerColorChoice => {
  if (choice === 'primary') {return 'primary';}
  if (choice === 'secondary' && mode === 'dual') {return 'secondary';}
  return 'white';
};

const resolveLayerColors = (
  choice: MenuLayerColorChoice | undefined,
  tokens: MenuColors,
  mode: MenuColorMode
): MenuLayerResolvedColors => {
  const resolvedChoice = resolveMenuLayerChoice(choice, mode);
  if (resolvedChoice === 'primary') {
    return { bg: tokens.primary, text: getAPCATextColor(tokens.primary, 14, 600), border: tokens.primary };
  }
  if (resolvedChoice === 'secondary') {
    return { bg: tokens.secondary, text: getAPCATextColor(tokens.secondary, 14, 600), border: tokens.secondary };
  }

  return { bg: tokens.surface, text: tokens.textPrimary, border: tokens.border };
};

export const resolveMenuLayerColors = (
  layerConfig: MenuLayerColorConfig | undefined,
  tokens: MenuColors,
  mode: MenuColorMode
): MenuLayerColorTokens => ({
  topnav: resolveLayerColors(layerConfig?.topnav ?? 'primary', tokens, mode),
  navbar: resolveLayerColors(layerConfig?.navbar ?? 'white', tokens, mode),
  menu: resolveLayerColors(layerConfig?.menu ?? 'white', tokens, mode),
});
