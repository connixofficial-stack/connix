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

export type AccountOrdersColorMode = 'single' | 'dual';

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string | undefined,
  mode: AccountOrdersColorMode
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

export type AccountOrdersStatusBadgeTokens = {
  bg: string;
  border: string;
  text: string;
};

export const getAccountOrdersStatusBadgeTokens = (
  statusColor: string,
  fallback: string,
  isDark?: boolean
): AccountOrdersStatusBadgeTokens => {
  const bg = isDark
    ? formatHex(oklch({ ...safeParseOklch(statusColor, fallback), l: 0.15, c: 0.04 }))
    : getSolidTint(statusColor, fallback, 0.42);
  const border = isDark
    ? statusColor
    : getSolidTint(statusColor, fallback, 0.32);
  const text = ensureAPCATextColor(statusColor, bg, 12, 600);

  return { bg, border, text };
};

export type AccountOrdersColors = {
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
  statHighlightBg: string;
  statHighlightText: string;
  statHighlightSubText: string;
  statCardBg: string;
  statCardBorder: string;
  statIconBg: string;
  statIconColor: string;
  statHighlightIconBg: string;
  statHighlightIconColor: string;
  filterButtonBorder: string;
  filterButtonText: string;
  filterButtonActiveBg: string;
  filterButtonActiveBorder: string;
  filterButtonActiveText: string;
  filterDropdownBg: string;
  filterDropdownBorder: string;
  filterDropdownText: string;
  filterDropdownMutedText: string;
  orderCardBg: string;
  orderCardBorder: string;
  orderCardDivider: string;
  orderMetaText: string;
  orderValueText: string;
  orderMutedText: string;
  orderExpandedBg: string;
  orderExpandedBorder: string;
  orderItemThumbBg: string;
  orderItemThumbBorder: string;
  orderItemThumbIcon: string;
  priceText: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  secondaryButtonBg: string;
  secondaryButtonText: string;
  secondaryButtonBorder: string;
  timelineActive: string;
  timelineInactive: string;
  timelineLabelActive: string;
  timelineLabelInactive: string;
  timelineMobileBg: string;
  timelineMobileBorder: string;
  timelineMobileLabel: string;
  timelineMobileValue: string;
  trackingBadgeBg: string;
  trackingBadgeBorder: string;
  trackingBadgeText: string;
  emptyStateBg: string;
  emptyStateIconBg: string;
  emptyStateIconColor: string;
  emptyStateTitle: string;
  emptyStateText: string;
  emptyStateActionBg: string;
  emptyStateActionText: string;
  skeletonBase: string;
  skeletonHighlight: string;
  skeletonBorder: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  tableRowHoverBg: string;
  paginationButtonBorder: string;
  paginationButtonText: string;
  paginationActiveBg: string;
  paginationActiveText: string;
  paginationSummaryText: string;
  paginationSummaryStrong: string;
  loadingDotStrong: string;
  loadingDotMedium: string;
  loadingDotSoft: string;
  drawerOverlayBg: string;
  drawerSurface: string;
  drawerBorder: string;
  drawerTitle: string;
  drawerSubtitle: string;
  drawerSectionBg: string;
  drawerSectionBorder: string;
  drawerSectionTitle: string;
  drawerSectionValue: string;
  drawerCloseIcon: string;
  drawerBadgeText: string;
  drawerBadgeBg: string;
  drawerBadgeBorder: string;
  digitalCardBg: string;
  digitalCardBorder: string;
  digitalCardTitle: string;
  digitalFieldBg: string;
  digitalFieldBorder: string;
  digitalFieldText: string;
  digitalFieldIcon: string;
  digitalActionBg: string;
  digitalActionText: string;
  digitalAlertText: string;
};

export const getAccountOrdersColors = (
  primary: string,
  secondary: string | undefined,
  mode: AccountOrdersColorMode = 'single',
  isDark?: boolean
): AccountOrdersColors => {
  const neutralSurface = isDark ? '#161617' : '#ffffff';
  const neutralSurfaceMuted = isDark ? '#1c1c1e' : '#f8fafc';
  const neutralSurfaceSoft = isDark ? '#27272a' : '#f1f5f9';
  const neutralBorder = isDark ? '#27272a' : '#e2e8f0';
  const neutralBorderStrong = isDark ? '#3f3f46' : '#cbd5e1';
  const neutralText = isDark ? '#f5f5f7' : '#0f172a';
  const neutralMuted = isDark ? '#86868b' : '#475569';
  const neutralSoft = isDark ? '#6e6e73' : '#94a3b8';
  const overlayBase = isDark ? '#000000' : '#0f172a';

  const secondaryResolved = resolveSecondaryForMode(primary, secondary, mode);
  const primaryTint = getSolidTint(primary, primary, 0.42);
  const primaryTintStrong = getSolidTint(primary, primary, 0.32);
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
    subtitleColor: ensureAPCATextColor(secondaryResolved, neutralSurface, 14, 500),
    bodyText: ensureAPCATextColor(neutralText, neutralSurface, 16, 500),
    metaText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    mutedText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    statHighlightBg: primary,
    statHighlightText: getAPCATextColor(primary, 16, 700),
    statHighlightSubText: ensureAPCATextColor(getAPCATextColor(primary, 12, 600), primary, 12, 600),
    statCardBg: neutralSurface,
    statCardBorder: neutralBorder,
    statIconBg: primaryTint,
    statIconColor: ensureAPCATextColor(primary, primaryTint, 14, 600),
    statHighlightIconBg: primaryTintStrong,
    statHighlightIconColor: getAPCATextColor(primaryTintStrong, 12, 600),
    filterButtonBorder: neutralBorder,
    filterButtonText: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 600),
    filterButtonActiveBg: neutralSurface,
    filterButtonActiveBorder: primary,
    filterButtonActiveText: ensureAPCATextColor(primary, neutralSurface, 12, 600),
    filterDropdownBg: neutralSurface,
    filterDropdownBorder: neutralBorder,
    filterDropdownText: ensureAPCATextColor(neutralText, neutralSurface, 12, 500),
    filterDropdownMutedText: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 500),
    orderCardBg: neutralSurface,
    orderCardBorder: neutralBorder,
    orderCardDivider: neutralBorder,
    orderMetaText: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 500),
    orderValueText: ensureAPCATextColor(neutralText, neutralSurface, 14, 600),
    orderMutedText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    orderExpandedBg: neutralSurfaceMuted,
    orderExpandedBorder: neutralBorder,
    orderItemThumbBg: neutralSurface,
    orderItemThumbBorder: primaryTint,
    orderItemThumbIcon: ensureAPCATextColor(primary, neutralSurface, 12, 600),
    priceText: ensureAPCATextColor(secondaryResolved, neutralSurface, 16, 700),
    primaryButtonBg: primary,
    primaryButtonText: getAPCATextColor(primary, 14, 600),
    secondaryButtonBg: secondaryTint,
    secondaryButtonText: ensureAPCATextColor(secondaryResolved, secondaryTint, 12, 600),
    secondaryButtonBorder: secondaryTintStrong,
    timelineActive: secondaryResolved,
    timelineInactive: neutralBorder,
    timelineLabelActive: ensureAPCATextColor(secondaryResolved, neutralSurface, 12, 600),
    timelineLabelInactive: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    timelineMobileBg: neutralSurfaceSoft,
    timelineMobileBorder: neutralBorder,
    timelineMobileLabel: ensureAPCATextColor(neutralMuted, neutralSurfaceSoft, 12, 600),
    timelineMobileValue: ensureAPCATextColor(secondaryResolved, neutralSurfaceSoft, 14, 600),
    trackingBadgeBg: secondaryTint,
    trackingBadgeBorder: secondaryTintStrong,
    trackingBadgeText: ensureAPCATextColor(secondaryResolved, secondaryTint, 12, 600),
    emptyStateBg: neutralSurface,
    emptyStateIconBg: neutralSurfaceSoft,
    emptyStateIconColor: ensureAPCATextColor(neutralSoft, neutralSurfaceSoft, 18, 600),
    emptyStateTitle: ensureAPCATextColor(primary, neutralSurface, 18, 700),
    emptyStateText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    emptyStateActionBg: primary,
    emptyStateActionText: getAPCATextColor(primary, 14, 600),
    skeletonBase: neutralSurfaceSoft,
    skeletonHighlight: neutralBorder,
    skeletonBorder: neutralBorder,
    tableHeaderBg: neutralSurfaceMuted,
    tableHeaderText: ensureAPCATextColor(neutralMuted, neutralSurfaceMuted, 12, 600),
    tableRowHoverBg: neutralSurfaceSoft,
    paginationButtonBorder: primary,
    paginationButtonText: ensureAPCATextColor(primary, neutralSurface, 12, 600),
    paginationActiveBg: primary,
    paginationActiveText: getAPCATextColor(primary, 12, 600),
    paginationSummaryText: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 500),
    paginationSummaryStrong: ensureAPCATextColor(neutralText, neutralSurface, 12, 600),
    loadingDotStrong: primary,
    loadingDotMedium: primaryTintStrong,
    loadingDotSoft: primaryTint,
    drawerOverlayBg: overlayBase,
    drawerSurface: neutralSurface,
    drawerBorder: neutralBorder,
    drawerTitle: ensureAPCATextColor(neutralText, neutralSurface, 16, 700),
    drawerSubtitle: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 500),
    drawerSectionBg: neutralSurfaceMuted,
    drawerSectionBorder: neutralBorder,
    drawerSectionTitle: ensureAPCATextColor(neutralMuted, neutralSurfaceMuted, 12, 600),
    drawerSectionValue: ensureAPCATextColor(neutralText, neutralSurfaceMuted, 16, 700),
    drawerCloseIcon: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 600),
    drawerBadgeText: ensureAPCATextColor(secondaryResolved, secondaryTint, 12, 600),
    drawerBadgeBg: secondaryTint,
    drawerBadgeBorder: secondaryTintStrong,
    digitalCardBg: neutralSurfaceMuted,
    digitalCardBorder: secondaryTintStrong,
    digitalCardTitle: ensureAPCATextColor(neutralMuted, neutralSurfaceMuted, 12, 600),
    digitalFieldBg: neutralSurface,
    digitalFieldBorder: neutralBorder,
    digitalFieldText: ensureAPCATextColor(neutralText, neutralSurface, 14, 500),
    digitalFieldIcon: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 600),
    digitalActionBg: primary,
    digitalActionText: getAPCATextColor(primary, 12, 600),
    digitalAlertText: ensureAPCATextColor(secondaryResolved, neutralSurface, 12, 600),
  };
};
