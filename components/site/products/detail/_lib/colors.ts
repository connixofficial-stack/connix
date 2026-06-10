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

export type ProductDetailColorMode = 'single' | 'dual';
export type ProductDetailElementColorChoice = 'white' | 'black' | 'primary' | 'secondary' | 'red';

export type ProductDetailElementResolvedColors = {
  bg: string;
  text: string;
  border: string;
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string | undefined,
  mode: ProductDetailColorMode
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

export const resolveProductDetailElementColor = (
  choice: ProductDetailElementColorChoice | undefined,
  tokens: Pick<ProductDetailColors, 'primary' | 'secondary' | 'surface' | 'border' | 'headingColor'>
): ProductDetailElementResolvedColors => {
  if (choice === 'primary') {
    return { bg: tokens.primary, text: getAPCATextColor(tokens.primary, 12, 700), border: tokens.primary };
  }

  if (choice === 'secondary') {
    return { bg: tokens.secondary, text: getAPCATextColor(tokens.secondary, 12, 700), border: tokens.secondary };
  }

  if (choice === 'black') {
    return { bg: '#111111', text: '#ffffff', border: '#111111' };
  }

  if (choice === 'red') {
    return { bg: '#dc2626', text: '#ffffff', border: '#dc2626' };
  }

  return { bg: tokens.surface, text: tokens.headingColor, border: tokens.border };
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

export type ProductDetailColors = {
  primary: string;
  secondary: string;
  pageBackground: string;
  sectionBackground: string;
  surface: string;
  surfaceMuted: string;
  surfaceSoft: string;
  border: string;
  borderStrong: string;
  headingColor: string;
  sectionHeadingColor: string;
  bodyText: string;
  metaText: string;
  softText: string;
  breadcrumbText: string;
  breadcrumbActive: string;
  categoryBadgeBg: string;
  categoryBadgeText: string;
  categoryBadgeBorder: string;
  priceColor: string;
  priceOriginalText: string;
  discountBadgeBg: string;
  discountBadgeText: string;
  ratingStarActive: string;
  ratingStarInactive: string;
  ratingText: string;
  quantityBorder: string;
  quantityText: string;
  quantityIcon: string;
  quantityIconMuted: string;
  quantityHoverBg: string;
  ctaPrimaryBg: string;
  ctaPrimaryText: string;
  ctaSecondaryBorder: string;
  ctaSecondaryText: string;
  ctaSecondaryHoverBg: string;
  wishlistBg: string;
  wishlistBorder: string;
  wishlistActiveBg: string;
  wishlistIcon: string;
  wishlistIconActive: string;
  shareBg: string;
  shareBorder: string;
  shareIcon: string;
  highlightBg: string;
  highlightIcon: string;
  highlightText: string;
  variantChipBg: string;
  variantChipText: string;
  variantChipBorder: string;
  variantChipActiveBg: string;
  variantChipActiveText: string;
  variantChipActiveBorder: string;
  variantRing: string;
  thumbnailBorder: string;
  thumbnailBorderActive: string;
  divider: string;
  stockSuccessText: string;
  stockWarningText: string;
  stockDangerText: string;
  stockIndicatorSuccess: string;
  stockIndicatorWarning: string;
  stockIndicatorDanger: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  inputRing: string;
  commentSurface: string;
  commentBorder: string;
  commentText: string;
  commentMeta: string;
  commentAction: string;
  commentActionActive: string;
  replySurface: string;
  replyBorder: string;
  replyNameText: string;
  replyText: string;
  relatedCardBg: string;
  relatedCardBorder: string;
  relatedTitle: string;
  relatedTitleHover: string;
  relatedPrice: string;
  relatedPriceMuted: string;
  emptyStateBg: string;
  emptyStateIcon: string;
  emptyStateTitle: string;
  emptyStateText: string;
  skeletonBase: string;
};

export const getProductDetailColors = (
  primary: string,
  secondary: string | undefined,
  mode: ProductDetailColorMode = 'single',
  isDark?: boolean
): ProductDetailColors => {
  const neutralSurface = isDark ? '#161617' : '#ffffff';
  const neutralSurfaceMuted = isDark ? '#1c1c1e' : '#f8fafc';
  const neutralSurfaceSoft = isDark ? '#27272a' : '#f1f5f9';
  const neutralBorder = isDark ? '#27272a' : '#e2e8f0';
  const neutralBorderStrong = isDark ? '#3f3f46' : '#cbd5e1';
  const neutralText = isDark ? '#f5f5f7' : '#0f172a';
  const neutralMuted = isDark ? '#86868b' : '#475569';
  const neutralSoft = isDark ? '#6e6e73' : '#94a3b8';

  const resolvedSecondary = resolveSecondaryForMode(primary, secondary, mode);
  const secondaryTint = getSolidTint(resolvedSecondary, primary, 0.42);
  const primaryTintStrong = getSolidTint(primary, primary, 0.32);

  return {
    primary,
    secondary: resolvedSecondary,
    pageBackground: neutralSurface,
    sectionBackground: neutralSurfaceMuted,
    surface: neutralSurface,
    surfaceMuted: neutralSurfaceMuted,
    surfaceSoft: neutralSurfaceSoft,
    border: neutralBorder,
    borderStrong: neutralBorderStrong,
    headingColor: ensureAPCATextColor(primary, neutralSurface, 28, 700),
    sectionHeadingColor: ensureAPCATextColor(primary, neutralSurface, 20, 700),
    bodyText: ensureAPCATextColor(neutralText, neutralSurface, 16, 500),
    metaText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    softText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    breadcrumbText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    breadcrumbActive: ensureAPCATextColor(neutralText, neutralSurface, 12, 600),
    categoryBadgeBg: secondaryTint,
    categoryBadgeText: ensureAPCATextColor(resolvedSecondary, secondaryTint, 12, 600),
    categoryBadgeBorder: secondaryTint,
    priceColor: ensureAPCATextColor(resolvedSecondary, neutralSurface, 28, 700),
    priceOriginalText: ensureAPCATextColor(neutralSoft, neutralSurface, 14, 500),
    discountBadgeBg: primary,
    discountBadgeText: getBadgeTextColor(primary, 12, 700),
    ratingStarActive: resolvedSecondary,
    ratingStarInactive: neutralBorder,
    ratingText: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 500),
    quantityBorder: neutralBorder,
    quantityText: ensureAPCATextColor(neutralText, neutralSurface, 14, 500),
    quantityIcon: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    quantityIconMuted: ensureAPCATextColor(neutralSoft, neutralSurface, 14, 500),
    quantityHoverBg: neutralSurfaceSoft,
    ctaPrimaryBg: primary,
    ctaPrimaryText: getAPCATextColor(primary, 14, 600),
    ctaSecondaryBorder: resolvedSecondary,
    ctaSecondaryText: ensureAPCATextColor(resolvedSecondary, neutralSurface, 14, 600),
    ctaSecondaryHoverBg: secondaryTint,
    wishlistBg: neutralSurface,
    wishlistBorder: neutralBorder,
    wishlistActiveBg: secondaryTint,
    wishlistIcon: ensureAPCATextColor(neutralSoft, neutralSurface, 14, 600),
    wishlistIconActive: ensureAPCATextColor(resolvedSecondary, secondaryTint, 14, 600),
    shareBg: neutralSurface,
    shareBorder: neutralBorder,
    shareIcon: ensureAPCATextColor(neutralSoft, neutralSurface, 14, 600),
    highlightBg: neutralSurfaceSoft,
    highlightIcon: ensureAPCATextColor(resolvedSecondary, neutralSurfaceSoft, 14, 600),
    highlightText: ensureAPCATextColor(neutralMuted, neutralSurfaceSoft, 12, 500),
    variantChipBg: neutralSurfaceSoft,
    variantChipText: ensureAPCATextColor(neutralMuted, neutralSurfaceSoft, 12, 600),
    variantChipBorder: neutralBorder,
    variantChipActiveBg: primary,
    variantChipActiveText: getBadgeTextColor(primary, 12, 600),
    variantChipActiveBorder: primary,
    variantRing: resolvedSecondary,
    thumbnailBorder: neutralBorder,
    thumbnailBorderActive: primary,
    divider: neutralBorder,
    stockSuccessText: ensureAPCATextColor(resolvedSecondary, neutralSurface, 12, 600),
    stockWarningText: ensureAPCATextColor(resolvedSecondary, neutralSurface, 12, 600),
    stockDangerText: ensureAPCATextColor(primary, neutralSurface, 12, 600),
    stockIndicatorSuccess: resolvedSecondary,
    stockIndicatorWarning: resolvedSecondary,
    stockIndicatorDanger: primary,
    inputBg: neutralSurface,
    inputBorder: neutralBorder,
    inputText: ensureAPCATextColor(neutralText, neutralSurface, 14, 500),
    inputPlaceholder: ensureAPCATextColor(neutralSoft, neutralSurface, 14, 500),
    inputRing: resolvedSecondary,
    commentSurface: neutralSurface,
    commentBorder: neutralBorder,
    commentText: ensureAPCATextColor(neutralText, neutralSurface, 14, 500),
    commentMeta: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    commentAction: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 600),
    commentActionActive: ensureAPCATextColor(primary, neutralSurface, 12, 600),
    replySurface: neutralSurfaceSoft,
    replyBorder: neutralBorder,
    replyNameText: ensureAPCATextColor(primary, neutralSurface, 12, 600),
    replyText: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 500),
    relatedCardBg: neutralSurface,
    relatedCardBorder: neutralBorder,
    relatedTitle: ensureAPCATextColor(neutralText, neutralSurface, 14, 600),
    relatedTitleHover: ensureAPCATextColor(resolvedSecondary, neutralSurface, 14, 600),
    relatedPrice: ensureAPCATextColor(resolvedSecondary, neutralSurface, 14, 700),
    relatedPriceMuted: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    emptyStateBg: neutralSurfaceMuted,
    emptyStateIcon: ensureAPCATextColor(neutralSoft, neutralSurfaceMuted, 14, 600),
    emptyStateTitle: ensureAPCATextColor(neutralText, neutralSurface, 18, 700),
    emptyStateText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    skeletonBase: primaryTintStrong,
  };
};
