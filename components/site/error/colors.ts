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

export type ErrorPagesColorMode = 'single' | 'dual';

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string | undefined,
  mode: ErrorPagesColorMode
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

export type ErrorPageColors = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  border: string;
  codeColor: string;
  headlineColor: string;
  messageColor: string;
  apologyColor: string;
  accentSurface: string;
  accentBorder: string;
  accentIcon: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  secondaryButtonBorder: string;
  secondaryButtonText: string;
  illustrationSurface: string;
  illustrationText: string;
};

export const getErrorPageColors = (
  primary: string,
  secondary: string | undefined,
  mode: ErrorPagesColorMode = 'single',
  isDark = false
): ErrorPageColors => {
  const neutralSurface = isDark ? '#161617' : '#ffffff';
  const neutralBorder = isDark ? '#27272a' : '#e2e8f0';
  const neutralText = isDark ? '#f5f5f7' : '#0f172a';
  const neutralMuted = isDark ? '#86868b' : '#475569';
  const neutralSoft = isDark ? '#6e6e73' : '#94a3b8';

  const secondaryResolved = resolveSecondaryForMode(primary, secondary, mode);
  const primaryTint = getSolidTint(primary, primary, 0.42);
  const secondaryTint = getSolidTint(secondaryResolved, primary, 0.42);
  
  const accentSurface = isDark ? '#2c2c2e' : getSolidTint(primary, primary, 0.5);
  const accentBorder = isDark ? '#3a3a3c' : primaryTint;
  const accentIcon = isDark ? primary : ensureAPCATextColor(primary, accentSurface, 18, 700);

  return {
    primary,
    secondary: secondaryResolved,
    background: isDark ? '#111111' : neutralSurface,
    surface: neutralSurface,
    border: neutralBorder,
    codeColor: isDark ? primary : ensureAPCATextColor(primary, neutralSurface, 36, 700),
    headlineColor: ensureAPCATextColor(neutralText, neutralSurface, 20, 700),
    messageColor: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    apologyColor: ensureAPCATextColor(neutralSoft, neutralSurface, 13, 500),
    accentSurface,
    accentBorder,
    accentIcon,
    primaryButtonBg: primary,
    primaryButtonText: getAPCATextColor(primary, 14, 600),
    secondaryButtonBorder: isDark ? '#3a3a3c' : secondaryResolved,
    secondaryButtonText: isDark ? '#f5f5f7' : ensureAPCATextColor(secondaryResolved, neutralSurface, 14, 600),
    illustrationSurface: isDark ? '#2c2c2e' : secondaryTint,
    illustrationText: isDark ? '#f5f5f7' : ensureAPCATextColor(secondaryResolved, secondaryTint, 14, 600),
  };
};
