import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';

const DEFAULT_COLOR = '#f43f5e';

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

export type PromotionsListColorMode = 'single' | 'dual';

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string | undefined,
  mode: PromotionsListColorMode
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

export type PromotionsListColors = {
  primary: string;
  secondary: string;
  sectionEyebrow: string;
  sectionHeading: string;
  sectionDescription: string;
  bannerBackground: string;
  bannerEyebrow: string;
  bannerHeading: string;
  bannerDescription: string;
  bannerBadgeBg: string;
  bannerBadgeText: string;
  bannerButtonBg: string;
  bannerButtonText: string;
  groupBadgeBg: string;
  groupBadgeText: string;
  groupBadgeBorder: string;
  cardBackground: string;
  cardBorder: string;
  promoTypeText: string;
  promoTitleText: string;
  promoMetaText: string;
  promoDiscountText: string;
  codeBadgeBg: string;
  codeBadgeText: string;
  codeBadgeBorder: string;
  copyButtonBg: string;
  copyButtonText: string;
  copyIcon: string;
  copySuccessIcon: string;
  progressTrack: string;
  progressFill: string;
  progressText: string;
  emptyStateText: string;
};

export const getPromotionsListColors = (
  primary: string,
  secondary: string | undefined,
  mode: PromotionsListColorMode = 'single'
): PromotionsListColors => {
  const neutralSurface = '#ffffff';
  const neutralSubtle = '#f1f5f9';
  const neutralBorder = '#e2e8f0';
  const neutralText = '#0f172a';
  const neutralMuted = '#475569';
  const neutralSoft = '#94a3b8';

  const secondaryResolved = resolveSecondaryForMode(primary, secondary, mode);
  const primaryTint = getSolidTint(primary, primary, 0.45);
  const secondaryTint = getSolidTint(secondaryResolved, primary, 0.42);

  return {
    primary,
    secondary: secondaryResolved,
    sectionEyebrow: ensureAPCATextColor(secondaryResolved, neutralSurface, 12, 600),
    sectionHeading: ensureAPCATextColor(primary, neutralSurface, 30, 700),
    sectionDescription: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    bannerBackground: primary,
    bannerEyebrow: getAPCATextColor(primary, 12, 600),
    bannerHeading: getAPCATextColor(primary, 24, 700),
    bannerDescription: getAPCATextColor(primary, 14, 500),
    bannerBadgeBg: primaryTint,
    bannerBadgeText: ensureAPCATextColor(primary, primaryTint, 12, 600),
    bannerButtonBg: neutralSurface,
    bannerButtonText: ensureAPCATextColor(neutralText, neutralSurface, 12, 600),
    groupBadgeBg: secondaryTint,
    groupBadgeText: ensureAPCATextColor(secondaryResolved, secondaryTint, 12, 600),
    groupBadgeBorder: secondaryTint,
    cardBackground: neutralSurface,
    cardBorder: neutralBorder,
    promoTypeText: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 600),
    promoTitleText: ensureAPCATextColor(neutralText, neutralSurface, 16, 600),
    promoMetaText: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 500),
    promoDiscountText: ensureAPCATextColor(secondaryResolved, neutralSurface, 12, 600),
    codeBadgeBg: secondaryTint,
    codeBadgeText: getBadgeTextColor(secondaryTint, 12, 600),
    codeBadgeBorder: secondaryTint,
    copyButtonBg: primaryTint,
    copyButtonText: ensureAPCATextColor(primary, primaryTint, 12, 600),
    copyIcon: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    copySuccessIcon: ensureAPCATextColor(secondaryResolved, neutralSurface, 12, 600),
    progressTrack: neutralSubtle,
    progressFill: primary,
    progressText: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 500),
    emptyStateText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
  };
};
