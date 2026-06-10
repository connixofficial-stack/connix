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

export type WishlistColorMode = 'single' | 'dual';

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string | undefined,
  mode: WishlistColorMode
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

export const getAPCATextColor = (background: string, _fontSize = 16, _fontWeight = 500) => {
  const bgRgb = toRgbTuple(background, '#0f172a');
  if (!bgRgb) {
    return '#111111';
  }

  const whiteLc = Math.abs(APCAcontrast(sRGBtoY([255, 255, 255]), sRGBtoY(bgRgb)));
  const nearBlackLc = Math.abs(APCAcontrast(sRGBtoY([17, 17, 17]), sRGBtoY(bgRgb)));

  return whiteLc >= nearBlackLc ? '#ffffff' : '#111111';
};

export const ensureAPCATextColor = (
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

const getBadgeTextColor = (badgeBg: string, fontSize = 12, fontWeight = 600) => {
  const preferred = getAPCATextColor(badgeBg, fontSize, fontWeight);
  return ensureAPCATextColor(preferred, badgeBg, fontSize, fontWeight);
};

export type WishlistColors = {
  primary: string;
  secondary: string;
  pageBackground: string;
  surface: string;
  surfaceMuted: string;
  surfaceSoft: string;
  border: string;
  borderStrong: string;
  headingColor: string;
  subtitleColor: string;
  bodyText: string;
  metaText: string;
  mutedText: string;
  iconPrimary: string;
  priceText: string;
  priceOriginalText: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  secondaryButtonBg: string;
  secondaryButtonText: string;
  noteBg: string;
  noteText: string;
  notificationText: string;
  notificationIcon: string;
  badgeInStockBg: string;
  badgeInStockText: string;
  badgeOutStockBg: string;
  badgeOutStockText: string;
  ratingText: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  tableRowBorder: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  inputIcon: string;
  inputRing: string;
  emptyStateBg: string;
  emptyStateIcon: string;
  emptyStateTitle: string;
  emptyStateText: string;
  actionIcon: string;
  actionIconActive: string;
  actionButtonBg: string;
  actionButtonText: string;
  overlayBg: string;
  overlayText: string;
  skeletonBase: string;
  skeletonHighlight: string;
};

export const getWishlistColors = (
  primary: string,
  secondary: string | undefined,
  mode: WishlistColorMode = 'single'
): WishlistColors => {
  const neutralSurface = '#ffffff';
  const neutralSurfaceMuted = '#f8fafc';
  const neutralSurfaceSoft = '#f1f5f9';
  const neutralBorder = '#e2e8f0';
  const neutralBorderStrong = '#cbd5f5';
  const neutralText = '#0f172a';
  const neutralMuted = '#475569';
  const neutralSoft = '#94a3b8';
  const overlayBase = '#0f172a';

  const secondaryResolved = resolveSecondaryForMode(primary, secondary, mode);
  const secondaryTint = getSolidTint(secondaryResolved, primary, 0.42);

  return {
    primary,
    secondary: secondaryResolved,
    pageBackground: neutralSurfaceMuted,
    surface: neutralSurface,
    surfaceMuted: neutralSurfaceMuted,
    surfaceSoft: neutralSurfaceSoft,
    border: neutralBorder,
    borderStrong: neutralBorderStrong,
    headingColor: ensureAPCATextColor(primary, neutralSurface, 28, 700),
    subtitleColor: ensureAPCATextColor(secondaryResolved, neutralSurface, 14, 500),
    bodyText: ensureAPCATextColor(neutralText, neutralSurface, 16, 500),
    metaText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    mutedText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    iconPrimary: ensureAPCATextColor(primary, neutralSurface, 18, 700),
    priceText: ensureAPCATextColor(secondaryResolved, neutralSurface, 18, 700),
    priceOriginalText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    primaryButtonBg: primary,
    primaryButtonText: getAPCATextColor(primary, 14, 600),
    secondaryButtonBg: secondaryTint,
    secondaryButtonText: ensureAPCATextColor(secondaryResolved, secondaryTint, 12, 600),
    noteBg: neutralSurfaceMuted,
    noteText: ensureAPCATextColor(neutralMuted, neutralSurfaceMuted, 12, 500),
    notificationText: ensureAPCATextColor(secondaryResolved, neutralSurface, 12, 600),
    notificationIcon: ensureAPCATextColor(secondaryResolved, neutralSurface, 12, 600),
    badgeInStockBg: secondaryTint,
    badgeInStockText: getBadgeTextColor(secondaryTint, 12, 600),
    badgeOutStockBg: neutralSurfaceSoft,
    badgeOutStockText: ensureAPCATextColor(neutralMuted, neutralSurfaceSoft, 12, 600),
    ratingText: ensureAPCATextColor(secondaryResolved, neutralSurface, 12, 600),
    tableHeaderBg: neutralSurfaceMuted,
    tableHeaderText: ensureAPCATextColor(neutralMuted, neutralSurfaceMuted, 12, 600),
    tableRowBorder: neutralBorder,
    inputBackground: neutralSurface,
    inputBorder: neutralBorder,
    inputText: ensureAPCATextColor(neutralText, neutralSurface, 14, 500),
    inputPlaceholder: ensureAPCATextColor(neutralSoft, neutralSurface, 14, 500),
    inputIcon: ensureAPCATextColor(neutralSoft, neutralSurface, 14, 500),
    inputRing: primary,
    emptyStateBg: neutralSurfaceMuted,
    emptyStateIcon: ensureAPCATextColor(neutralSoft, neutralSurfaceMuted, 16, 600),
    emptyStateTitle: ensureAPCATextColor(primary, neutralSurface, 20, 700),
    emptyStateText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    actionIcon: ensureAPCATextColor(neutralSoft, neutralSurface, 14, 600),
    actionIconActive: ensureAPCATextColor(secondaryResolved, neutralSurface, 14, 600),
    actionButtonBg: secondaryResolved,
    actionButtonText: getAPCATextColor(secondaryResolved, 12, 600),
    overlayBg: overlayBase,
    overlayText: getAPCATextColor(overlayBase, 12, 700),
    skeletonBase: neutralSurfaceSoft,
    skeletonHighlight: neutralBorder,
  };
};
