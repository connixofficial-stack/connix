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

export type AccountProfileColorMode = 'single' | 'dual';

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string | undefined,
  mode: AccountProfileColorMode
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

export type AccountProfileColors = {
  primary: string;
  secondary: string;
  pageBackground: string;
  surface: string;
  surfaceMuted: string;
  surfaceSoft: string;
  border: string;
  borderStrong: string;
  headingColor: string;
  titleColor: string;
  subtitleColor: string;
  bodyText: string;
  metaText: string;
  mutedText: string;
  primarySolidBg: string;
  primarySolidText: string;
  primarySolidMutedText: string;
  avatarBg: string;
  avatarBorder: string;
  avatarIcon: string;
  statusDotBg: string;
  statusDotBorder: string;
  sectionLabel: string;
  sectionAccentBorder: string;
  separatorDot: string;
  actionCardBg: string;
  actionCardBorder: string;
  actionIconBg: string;
  actionIconColor: string;
  actionTitle: string;
  actionDescription: string;
  actionArrow: string;
};

export const getAccountProfileColors = (
  primary: string,
  secondary: string | undefined,
  mode: AccountProfileColorMode = 'single',
  isDark = false
): AccountProfileColors => {
  const neutralSurface = isDark ? '#161617' : '#ffffff';
  const neutralSurfaceMuted = isDark ? '#111111' : '#f8fafc';
  const neutralSurfaceSoft = isDark ? '#2c2c2e' : '#f1f5f9';
  const neutralBorder = isDark ? '#27272a' : '#e2e8f0';
  const neutralBorderStrong = isDark ? '#3f3f46' : '#cbd5e1';
  const neutralText = isDark ? '#f5f5f7' : '#0f172a';
  const neutralMuted = isDark ? '#86868b' : '#475569';
  const neutralSoft = isDark ? '#6e6e73' : '#94a3b8';

  const secondaryResolved = resolveSecondaryForMode(primary, secondary, mode);
  const primaryTint = getSolidTint(primary, primary, 0.42);
  const secondaryTint = getSolidTint(secondaryResolved, primary, 0.42);

  const primarySolidText = getAPCATextColor(primary, 16, 600);
  const primarySolidMutedText = ensureAPCATextColor(primarySolidText, primary, 12, 500);

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
    titleColor: ensureAPCATextColor(neutralText, neutralSurface, 18, 600),
    subtitleColor: ensureAPCATextColor(secondaryResolved, neutralSurface, 12, 600),
    bodyText: ensureAPCATextColor(neutralText, neutralSurface, 16, 500),
    metaText: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 500),
    mutedText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    primarySolidBg: primary,
    primarySolidText,
    primarySolidMutedText,
    avatarBg: isDark ? '#2c2c2e' : neutralSurface,
    avatarBorder: isDark ? '#3a3a3c' : neutralSurface,
    avatarIcon: ensureAPCATextColor(primary, isDark ? '#2c2c2e' : neutralSurface, 16, 600),
    statusDotBg: secondaryResolved,
    statusDotBorder: isDark ? '#161617' : neutralSurface,
    sectionLabel: ensureAPCATextColor(secondaryResolved, neutralSurface, 12, 600),
    sectionAccentBorder: secondaryResolved,
    separatorDot: isDark ? '#27272a' : neutralBorderStrong,
    actionCardBg: isDark ? '#1c1c1e' : neutralSurface,
    actionCardBorder: isDark ? '#27272a' : neutralBorder,
    actionIconBg: isDark
      ? '#2c2c2e'
      : (mode === 'dual' ? secondaryTint : primaryTint),
    actionIconColor: isDark
      ? (mode === 'dual' ? secondaryResolved : primary)
      : ensureAPCATextColor(
          mode === 'dual' ? secondaryResolved : primary,
          mode === 'dual' ? secondaryTint : primaryTint,
          14,
          600
        ),
    actionTitle: ensureAPCATextColor(
      mode === 'dual' ? secondaryResolved : primary,
      isDark ? '#1c1c1e' : neutralSurface,
      14,
      600
    ),
    actionDescription: ensureAPCATextColor(neutralMuted, isDark ? '#1c1c1e' : neutralSurface, 12, 500),
    actionArrow: ensureAPCATextColor(neutralSoft, isDark ? '#1c1c1e' : neutralSurface, 12, 500),
  };
};
