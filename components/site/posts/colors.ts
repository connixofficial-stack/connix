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

export type PostsListColorMode = 'single' | 'dual';

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string | undefined,
  mode: PostsListColorMode
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

export type PostsListColors = {
  primary: string;
  secondary: string;
  headingColor: string;
  sectionHeadingColor: string;
  bodyText: string;
  metaText: string;
  neutralTextLight: string;
  cardBackground: string;
  cardBorder: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  inputIcon: string;
  inputRing: string;
  filterBarBackground: string;
  filterTagBg: string;
  filterTagText: string;
  filterTagBorder: string;
  filterCountText: string;
  filterClearText: string;
  filterActiveBg: string;
  filterActiveText: string;
  filterActiveBorder: string;
  categoryBadgeBg: string;
  categoryBadgeText: string;
  categoryBadgeBorder: string;
  featuredBadgeBg: string;
  featuredBadgeText: string;
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
  sidebarWidgetIcon: string;
  sidebarActiveItemBg: string;
  sidebarActiveItemText: string;
  sidebarActiveItemBorder: string;
  overlaySurface: string;
  overlaySurfaceMuted: string;
  overlayTextStrong: string;
  overlayTextMuted: string;
  overlayTextSoft: string;
};

export const getPostsListColors = (
  primary: string,
  secondary: string | undefined,
  mode: PostsListColorMode = 'single',
  isDark?: boolean
): PostsListColors => {
  const neutralSurface = isDark ? '#161617' : '#ffffff';
  const neutralBorder = isDark ? '#27272a' : '#e2e8f0';
  const neutralText = isDark ? '#f5f5f7' : '#0f172a';
  const neutralMuted = isDark ? '#86868b' : '#475569';
  const neutralSoft = isDark ? '#6e6e73' : '#94a3b8';
  const overlayBase = isDark ? '#ffffff' : '#0f172a';
  const overlayMuted = isDark ? '#1c1c1e' : '#1e293b';

  const secondaryResolved = resolveSecondaryForMode(primary, secondary, mode);
  const primaryTint = getSolidTint(primary, primary, 0.42);
  const primaryTintStrong = getSolidTint(primary, primary, 0.32);
  const secondaryTint = getSolidTint(secondaryResolved, primary, 0.42);

  return {
    primary,
    secondary: secondaryResolved,
    headingColor: ensureAPCATextColor(primary, neutralSurface, 28, 700),
    sectionHeadingColor: ensureAPCATextColor(primary, neutralSurface, 18, 700),
    bodyText: ensureAPCATextColor(neutralText, neutralSurface, 16, 500),
    metaText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    neutralTextLight: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    cardBackground: neutralSurface,
    cardBorder: neutralBorder,
    inputBackground: neutralSurface,
    inputBorder: neutralBorder,
    inputText: ensureAPCATextColor(neutralText, neutralSurface, 14, 500),
    inputPlaceholder: ensureAPCATextColor(neutralSoft, neutralSurface, 14, 500),
    inputIcon: ensureAPCATextColor(neutralSoft, neutralSurface, 14, 500),
    inputRing: primary,
    filterBarBackground: neutralSurface,
    filterTagBg: secondaryTint,
    filterTagText: ensureAPCATextColor(secondaryResolved, secondaryTint, 12, 600),
    filterTagBorder: secondaryTint,
    filterCountText: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 500),
    filterClearText: ensureAPCATextColor(primary, neutralSurface, 14, 600),
    filterActiveBg: primary,
    filterActiveText: getAPCATextColor(primary, 12, 600),
    filterActiveBorder: primary,
    categoryBadgeBg: secondaryTint,
    categoryBadgeText: ensureAPCATextColor(secondaryResolved, secondaryTint, 12, 600),
    categoryBadgeBorder: secondaryTint,
    featuredBadgeBg: primary,
    featuredBadgeText: getBadgeTextColor(primary, 12, 700),
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
    sidebarWidgetIcon: ensureAPCATextColor(secondaryResolved, neutralSurface, 14, 600),
    sidebarActiveItemBg: primaryTint,
    sidebarActiveItemText: ensureAPCATextColor(primary, primaryTint, 14, 600),
    sidebarActiveItemBorder: primaryTint,
    overlaySurface: overlayBase,
    overlaySurfaceMuted: overlayMuted,
    overlayTextStrong: getAPCATextColor(overlayBase, 18, 700),
    overlayTextMuted: ensureAPCATextColor('#e2e8f0', overlayBase, 14, 500),
    overlayTextSoft: ensureAPCATextColor('#cbd5f5', overlayBase, 12, 500),
  };
};
