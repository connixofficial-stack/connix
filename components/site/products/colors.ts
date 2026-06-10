import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';

const DEFAULT_COLOR = '#10b981';

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

export type ProductsListColorMode = 'single' | 'dual';

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string | undefined,
  mode: ProductsListColorMode
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

export type ProductsListColors = {
  primary: string;
  secondary: string;
  headingColor: string;
  subtitleText: string;
  bodyText: string;
  metaText: string;
  neutralTextLight: string;
  cardBackground: string;
  cardBorder: string;
  cardBorderHover: string;
  filterBarBackground: string;
  filterBarBorder: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  inputIcon: string;
  inputRing: string;
  filterChipBg: string;
  filterChipText: string;
  filterChipBorder: string;
  filterChipActiveBg: string;
  filterChipActiveText: string;
  filterChipActiveBorder: string;
  filterButtonBg: string;
  filterButtonText: string;
  filterButtonBorder: string;
  categoryBadgeBg: string;
  categoryBadgeText: string;
  categoryBadgeBorder: string;
  priceColor: string;
  priceOriginalText: string;
  ratingStarActive: string;
  ratingStarInactive: string;
  ratingCountText: string;
  wishlistButtonBg: string;
  wishlistButtonBorder: string;
  wishlistIcon: string;
  wishlistIconActive: string;
  promotionBadgeBg: string;
  promotionBadgeText: string;
  stockLowText: string;
  stockOutText: string;
  primaryActionBg: string;
  primaryActionText: string;
  secondaryActionBorder: string;
  secondaryActionText: string;
  secondaryActionHoverBg: string;
  paginationButtonBg: string;
  paginationButtonText: string;
  paginationButtonBorder: string;
  paginationButtonHoverBg: string;
  paginationActiveBg: string;
  paginationActiveText: string;
  paginationActiveBorder: string;
  paginationEllipsisText: string;
  paginationDisabledText: string;
  loadingDotStrong: string;
  loadingDotMedium: string;
  loadingDotSoft: string;
  emptyStateIconBg: string;
  emptyStateIconColor: string;
  emptyStateTitle: string;
  emptyStateText: string;
  emptyStateButtonBg: string;
  emptyStateButtonText: string;
  overlaySurface: string;
  overlayText: string;
};

export const getProductsListColors = (
  primary: string,
  secondary: string | undefined,
  mode: ProductsListColorMode = 'single',
  isDark?: boolean
): ProductsListColors => {
  const neutralSurface = isDark ? '#161617' : '#ffffff';
  const neutralSubtle = isDark ? '#1c1c1e' : '#f1f5f9';
  const neutralBorder = isDark ? '#27272a' : '#e2e8f0';
  const neutralBorderSoft = isDark ? '#1c1c1e' : '#e5e7eb';
  const neutralText = isDark ? '#f5f5f7' : '#0f172a';
  const neutralMuted = isDark ? '#86868b' : '#475569';
  const neutralSoft = isDark ? '#6e6e73' : '#94a3b8';
  const overlayBase = isDark ? '#ffffff' : '#0f172a';

  const secondaryResolved = resolveSecondaryForMode(primary, secondary, mode);
  const primaryTint = getSolidTint(primary, primary, 0.42);
  const primaryTintStrong = getSolidTint(primary, primary, 0.32);
  const secondaryTint = getSolidTint(secondaryResolved, primary, 0.42);

  return {
    primary,
    secondary: secondaryResolved,
    headingColor: ensureAPCATextColor(primary, neutralSurface, 28, 700),
    subtitleText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    bodyText: ensureAPCATextColor(neutralText, neutralSurface, 16, 500),
    metaText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    neutralTextLight: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    cardBackground: neutralSurface,
    cardBorder: neutralBorderSoft,
    cardBorderHover: neutralBorder,
    filterBarBackground: neutralSurface,
    filterBarBorder: neutralBorder,
    inputBackground: neutralSurface,
    inputBorder: neutralBorder,
    inputText: ensureAPCATextColor(neutralText, neutralSurface, 14, 500),
    inputPlaceholder: ensureAPCATextColor(neutralSoft, neutralSurface, 14, 500),
    inputIcon: ensureAPCATextColor(neutralSoft, neutralSurface, 14, 500),
    inputRing: primary,
    filterChipBg: neutralSubtle,
    filterChipText: ensureAPCATextColor(neutralMuted, neutralSubtle, 12, 600),
    filterChipBorder: neutralBorder,
    filterChipActiveBg: primary,
    filterChipActiveText: getBadgeTextColor(primary, 12, 600),
    filterChipActiveBorder: primary,
    filterButtonBg: neutralSurface,
    filterButtonText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 600),
    filterButtonBorder: neutralBorder,
    categoryBadgeBg: secondaryTint,
    categoryBadgeText: ensureAPCATextColor(secondaryResolved, secondaryTint, 12, 600),
    categoryBadgeBorder: secondaryTint,
    priceColor: ensureAPCATextColor(secondaryResolved, neutralSurface, 16, 700),
    priceOriginalText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    ratingStarActive: secondaryResolved,
    ratingStarInactive: neutralBorder,
    ratingCountText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    wishlistButtonBg: neutralSurface,
    wishlistButtonBorder: neutralBorder,
    wishlistIcon: ensureAPCATextColor(neutralSoft, neutralSurface, 14, 600),
    wishlistIconActive: ensureAPCATextColor(secondaryResolved, neutralSurface, 14, 600),
    promotionBadgeBg: primary,
    promotionBadgeText: getBadgeTextColor(primary, 12, 700),
    stockLowText: ensureAPCATextColor(secondaryResolved, neutralSurface, 12, 600),
    stockOutText: ensureAPCATextColor(primary, neutralSurface, 12, 600),
    primaryActionBg: primary,
    primaryActionText: getAPCATextColor(primary, 14, 600),
    secondaryActionBorder: secondaryResolved,
    secondaryActionText: ensureAPCATextColor(secondaryResolved, neutralSurface, 14, 600),
    secondaryActionHoverBg: secondaryTint,
    paginationButtonBg: neutralSurface,
    paginationButtonText: ensureAPCATextColor(primary, neutralSurface, 14, 600),
    paginationButtonBorder: primary,
    paginationButtonHoverBg: primaryTint,
    paginationActiveBg: primary,
    paginationActiveText: getAPCATextColor(primary, 14, 600),
    paginationActiveBorder: primary,
    paginationEllipsisText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    paginationDisabledText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    loadingDotStrong: primary,
    loadingDotMedium: primaryTintStrong,
    loadingDotSoft: primaryTint,
    emptyStateIconBg: neutralSubtle,
    emptyStateIconColor: ensureAPCATextColor(neutralSoft, neutralSubtle, 16, 600),
    emptyStateTitle: ensureAPCATextColor(neutralText, neutralSurface, 18, 700),
    emptyStateText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    emptyStateButtonBg: primary,
    emptyStateButtonText: getAPCATextColor(primary, 14, 600),
    overlaySurface: overlayBase,
    overlayText: getAPCATextColor(overlayBase, 12, 600),
  };
};
