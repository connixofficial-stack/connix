import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';

const DEFAULT_COLOR = '#f97316';

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

export type CartColorMode = 'single' | 'dual';

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string | undefined,
  mode: CartColorMode
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

export type CartColors = {
  primary: string;
  secondary: string;
  pageBackground: string;
  surface: string;
  surfaceMuted: string;
  surfaceSoft: string;
  border: string;
  borderStrong: string;
  headingColor: string;
  bodyText: string;
  metaText: string;
  mutedText: string;
  priceText: string;
  linkText: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  inputFocusRing: string;
  searchIcon: string;
  quantityButtonBg: string;
  quantityButtonBorder: string;
  quantityButtonIcon: string;
  quantityButtonHoverBg: string;
  itemDivider: string;
  thumbBg: string;
  thumbBorder: string;
  thumbIcon: string;
  iconMuted: string;
  actionIcon: string;
  actionHoverBg: string;
  actionHoverIcon: string;
  expiryActiveText: string;
  expiryExpiredText: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  summaryBg: string;
  summaryLabel: string;
  summaryValue: string;
  summaryTotalLabel: string;
  summaryTotalValue: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  secondaryButtonBg: string;
  secondaryButtonBorder: string;
  secondaryButtonText: string;
  emptyStateBg: string;
  emptyStateIconBg: string;
  emptyStateIcon: string;
  emptyStateTitle: string;
  emptyStateText: string;
  emptyStateActionBg: string;
  emptyStateActionText: string;
  skeletonBase: string;
  skeletonHighlight: string;
  skeletonBorder: string;
  drawerOverlayBg: string;
  drawerSurface: string;
  drawerBorder: string;
  drawerTitle: string;
  drawerSubtitle: string;
  drawerCloseIcon: string;
};

export const getCartColors = (
  primary: string,
  secondary: string | undefined,
  mode: CartColorMode = 'single',
  isDark = false
): CartColors => {
  const neutralSurface = isDark ? '#111111' : '#ffffff';
  const neutralSurfaceMuted = isDark ? '#161617' : '#f8fafc';
  const neutralSurfaceSoft = isDark ? '#2c2c2e' : '#f1f5f9';
  const neutralBorder = isDark ? '#27272a' : '#e2e8f0';
  const neutralBorderStrong = isDark ? '#3f3f46' : '#cbd5e1';
  const neutralText = isDark ? '#f5f5f7' : '#0f172a';
  const neutralMuted = isDark ? '#86868b' : '#475569';
  const neutralSoft = isDark ? '#6e6e73' : '#94a3b8';
  const overlayBase = '#0f172a';

  const secondaryResolved = resolveSecondaryForMode(primary, secondary, mode);
  const secondaryTint = getSolidTint(secondaryResolved, primary, 0.42);
  const secondaryTintStrong = getSolidTint(secondaryResolved, primary, 0.32);

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
    bodyText: ensureAPCATextColor(neutralText, neutralSurface, 16, 500),
    metaText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    mutedText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    priceText: ensureAPCATextColor(secondaryResolved, neutralSurface, 16, 700),
    linkText: ensureAPCATextColor(secondaryResolved, neutralSurface, 14, 600),
    inputBg: neutralSurface,
    inputBorder: neutralBorder,
    inputText: ensureAPCATextColor(neutralText, neutralSurface, 14, 500),
    inputPlaceholder: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    inputFocusRing: getSolidTint(primary, primary, 0.32),
    searchIcon: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    quantityButtonBg: neutralSurface,
    quantityButtonBorder: neutralBorder,
    quantityButtonIcon: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 600),
    quantityButtonHoverBg: neutralSurfaceSoft,
    itemDivider: neutralBorder,
    thumbBg: neutralSurfaceSoft,
    thumbBorder: neutralBorder,
    thumbIcon: ensureAPCATextColor(neutralSoft, neutralSurfaceSoft, 12, 600),
    iconMuted: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 600),
    actionIcon: ensureAPCATextColor(secondaryResolved, neutralSurface, 14, 600),
    actionHoverBg: secondaryTint,
    actionHoverIcon: ensureAPCATextColor(secondaryResolved, secondaryTint, 12, 600),
    expiryActiveText: ensureAPCATextColor(secondaryResolved, neutralSurface, 12, 600),
    expiryExpiredText: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 600),
    tableHeaderBg: neutralSurfaceMuted,
    tableHeaderText: ensureAPCATextColor(neutralMuted, neutralSurfaceMuted, 12, 600),
    summaryBg: neutralSurfaceMuted,
    summaryLabel: ensureAPCATextColor(neutralMuted, neutralSurfaceMuted, 12, 500),
    summaryValue: ensureAPCATextColor(neutralText, neutralSurfaceMuted, 14, 600),
    summaryTotalLabel: ensureAPCATextColor(neutralText, neutralSurfaceMuted, 14, 700),
    summaryTotalValue: ensureAPCATextColor(secondaryResolved, neutralSurfaceMuted, 18, 700),
    primaryButtonBg: primary,
    primaryButtonText: getAPCATextColor(primary, 14, 600),
    secondaryButtonBg: neutralSurface,
    secondaryButtonBorder: secondaryTintStrong,
    secondaryButtonText: ensureAPCATextColor(secondaryResolved, neutralSurface, 12, 600),
    emptyStateBg: neutralSurface,
    emptyStateIconBg: neutralSurfaceSoft,
    emptyStateIcon: ensureAPCATextColor(neutralSoft, neutralSurfaceSoft, 18, 600),
    emptyStateTitle: ensureAPCATextColor(primary, neutralSurface, 22, 700),
    emptyStateText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    emptyStateActionBg: primary,
    emptyStateActionText: getAPCATextColor(primary, 14, 600),
    skeletonBase: neutralSurfaceSoft,
    skeletonHighlight: neutralBorder,
    skeletonBorder: neutralBorder,
    drawerOverlayBg: overlayBase,
    drawerSurface: neutralSurface,
    drawerBorder: neutralBorder,
    drawerTitle: ensureAPCATextColor(neutralText, neutralSurface, 16, 700),
    drawerSubtitle: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 500),
    drawerCloseIcon: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 600),
  };
};
