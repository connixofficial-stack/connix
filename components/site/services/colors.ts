import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const safeParseOklch = (value: string, fallback: string) => {
  const parsed = oklch(value);
  if (parsed) {return parsed;}
  const fallbackParsed = oklch(fallback);
  return fallbackParsed ?? { l: 0.7, c: 0.1, h: 0 };
};

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

const getAPCATextColor = (background: string, _fontSize = 12, _fontWeight = 600) => {
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
  fontSize = 12,
  fontWeight = 600
) => {
  const threshold = getAccessibilityThreshold(fontSize, fontWeight);
  const lc = getAPCALc(preferredText, background);

  if (lc >= threshold) {
    return preferredText;
  }

  return getAPCATextColor(background, fontSize, fontWeight);
};

export type ServicesListColorMode = 'single' | 'dual';

export const resolveSecondaryColor = (primary: string, secondary?: string) => {
  if (typeof secondary !== 'string') {return primary;}
  const trimmed = secondary.trim();
  return trimmed ? trimmed : primary;
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string | undefined,
  mode: ServicesListColorMode
) => {
  if (mode === 'single') {return primary;}
  return resolveSecondaryColor(primary, secondary);
};

export const getSolidTint = (value: string, fallback: string, lDelta = 0.42) => {
  const base = safeParseOklch(value, fallback);
  return formatHex(oklch({ ...base, l: clamp(base.l + lDelta, 0, 0.98) }));
};

export type ServicesListColors = {
  primary: string;
  secondary: string;
  headingColor: string;
  sectionHeadingColor: string;
  primaryActionBg: string;
  primaryActionText: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  priceColor: string;
  filterRing: string;
  filterIcon: string;
  filterActiveBg: string;
  filterActiveText: string;
  filterTagBg: string;
  filterTagText: string;
  paginationActiveBg: string;
  paginationActiveText: string;
  paginationButtonBorder: string;
  paginationButtonText: string;
  paginationButtonHoverBg: string;
  loadingDotStrong: string;
  loadingDotMedium: string;
  loadingDotSoft: string;
  highlightNumber: string;
  accentBorder: string;
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
};

export const getServicesListColors = (
  primary: string,
  secondary: string | undefined,
  mode: ServicesListColorMode = 'single',
  isDark?: boolean
): ServicesListColors => {
  const neutralSurface = isDark ? '#161617' : '#ffffff';
  const neutralBorder = isDark ? '#27272a' : '#e2e8f0';
  const neutralText = isDark ? '#f5f5f7' : '#0f172a';
  const neutralMuted = isDark ? '#86868b' : '#475569';
  const neutralSoft = isDark ? '#6e6e73' : '#94a3b8';

  const resolvedSecondary = resolveSecondaryForMode(primary, secondary, mode);
  const primarySoft = getSolidTint(primary, primary, 0.42);
  const primarySoftStrong = getSolidTint(primary, primary, 0.32);
  const secondarySoft = getSolidTint(resolvedSecondary, primary, 0.42);

  return {
    primary,
    secondary: resolvedSecondary,
    headingColor: ensureAPCATextColor(primary, neutralSurface, 28, 700),
    sectionHeadingColor: ensureAPCATextColor(primary, neutralSurface, 18, 700),
    primaryActionBg: primary,
    primaryActionText: '#ffffff',
    badgeBg: secondarySoft,
    badgeText: ensureAPCATextColor(getAPCATextColor(secondarySoft, 12, 600), secondarySoft, 12, 600),
    badgeBorder: secondarySoft,
    priceColor: resolvedSecondary,
    filterRing: primary,
    filterIcon: primary,
    filterActiveBg: primarySoft,
    filterActiveText: primary,
    filterTagBg: primarySoft,
    filterTagText: primary,
    paginationActiveBg: primary,
    paginationActiveText: '#ffffff',
    paginationButtonBorder: primary,
    paginationButtonText: primary,
    paginationButtonHoverBg: primarySoft,
    loadingDotStrong: primary,
    loadingDotMedium: primarySoftStrong,
    loadingDotSoft: primarySoft,
    highlightNumber: primary,
    accentBorder: primary,
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
  };
};
