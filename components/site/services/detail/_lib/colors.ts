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

export type ServiceDetailColorMode = 'single' | 'dual';

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string | undefined,
  mode: ServiceDetailColorMode
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

export type ServiceDetailColors = {
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
  featuredBadgeBg: string;
  featuredBadgeText: string;
  priceColor: string;
  linkColor: string;
  linkMuted: string;
  ctaPrimaryBg: string;
  ctaPrimaryText: string;
  shareButtonBg: string;
  shareButtonText: string;
  shareButtonBorder: string;
  cardBackground: string;
  cardBorder: string;
  relatedTitle: string;
  relatedMeta: string;
  relatedPrice: string;
  quickContactBg: string;
  quickContactBorder: string;
  quickContactTitle: string;
  quickContactDescription: string;
  chipBg: string;
  chipText: string;
  chipIcon: string;
  fallbackThumbBg: string;
  fallbackThumbIcon: string;
};

export const getServiceDetailColors = (
  primary: string,
  secondary: string | undefined,
  mode: ServiceDetailColorMode = 'single'
): ServiceDetailColors => {
  const neutralSurface = '#ffffff';
  const neutralSurfaceMuted = '#f8fafc';
  const neutralSurfaceSoft = '#f1f5f9';
  const neutralBorder = '#e2e8f0';
  const neutralBorderStrong = '#cbd5f5';
  const neutralText = '#0f172a';
  const neutralMuted = '#475569';
  const neutralSoft = '#94a3b8';

  const resolvedSecondary = resolveSecondaryForMode(primary, secondary, mode);
  const secondaryTint = getSolidTint(resolvedSecondary, primary, 0.42);
  const primaryTint = getSolidTint(primary, primary, 0.32);

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
    headingColor: ensureAPCATextColor(primary, neutralSurface, 32, 700),
    sectionHeadingColor: ensureAPCATextColor(primary, neutralSurface, 20, 700),
    bodyText: ensureAPCATextColor(neutralText, neutralSurface, 16, 500),
    metaText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    softText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    breadcrumbText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    breadcrumbActive: ensureAPCATextColor(neutralText, neutralSurface, 12, 600),
    categoryBadgeBg: secondaryTint,
    categoryBadgeText: ensureAPCATextColor(resolvedSecondary, secondaryTint, 12, 600),
    categoryBadgeBorder: secondaryTint,
    featuredBadgeBg: primary,
    featuredBadgeText: getBadgeTextColor(primary, 12, 700),
    priceColor: ensureAPCATextColor(resolvedSecondary, neutralSurface, 28, 700),
    linkColor: ensureAPCATextColor(primary, neutralSurface, 14, 600),
    linkMuted: ensureAPCATextColor(resolvedSecondary, neutralSurface, 14, 600),
    ctaPrimaryBg: primary,
    ctaPrimaryText: getAPCATextColor(primary, 14, 600),
    shareButtonBg: neutralSurfaceSoft,
    shareButtonText: ensureAPCATextColor(neutralMuted, neutralSurfaceSoft, 13, 500),
    shareButtonBorder: neutralBorder,
    cardBackground: neutralSurface,
    cardBorder: neutralBorder,
    relatedTitle: ensureAPCATextColor(neutralText, neutralSurface, 14, 600),
    relatedMeta: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 500),
    relatedPrice: ensureAPCATextColor(resolvedSecondary, neutralSurface, 14, 600),
    quickContactBg: neutralSurface,
    quickContactBorder: neutralBorder,
    quickContactTitle: ensureAPCATextColor(neutralText, neutralSurface, 14, 600),
    quickContactDescription: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    chipBg: neutralSurfaceSoft,
    chipText: ensureAPCATextColor(neutralMuted, neutralSurfaceSoft, 12, 500),
    chipIcon: ensureAPCATextColor(neutralSoft, neutralSurfaceSoft, 12, 500),
    fallbackThumbBg: primaryTint,
    fallbackThumbIcon: getAPCATextColor(primaryTint, 16, 600),
  };
};
