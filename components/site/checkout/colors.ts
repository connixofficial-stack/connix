import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';

export const DEFAULT_CHECKOUT_COLOR = '#22c55e';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const safeParseOklch = (value: string, fallback: string) => (
  oklch(value) ?? oklch(fallback) ?? oklch(DEFAULT_CHECKOUT_COLOR)
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

const findBrandTextColor = (
  preferredText: string,
  background: string,
  fontSize: number,
  fontWeight: number
) => {
  const threshold = getAccessibilityThreshold(fontSize, fontWeight);
  if (getAPCALc(preferredText, background) >= threshold) {
    return preferredText;
  }

  const base = safeParseOklch(preferredText, DEFAULT_CHECKOUT_COLOR);
  let best: { color: string; delta: number } | null = null;

  for (let i = 1; i <= 24; i += 1) {
    const delta = (i / 24) * 0.6;
    const candidates = [
      clamp(base.l - delta, 0.04, 0.98),
      clamp(base.l + delta, 0.04, 0.98),
    ];

    for (const lightness of candidates) {
      const candidate = formatHex(oklch({ ...base, l: lightness }));
      const lc = getAPCALc(candidate, background);
      if (lc >= threshold) {
        if (!best || Math.abs(lightness - base.l) < best.delta) {
          best = { color: candidate, delta: Math.abs(lightness - base.l) };
        }
      }
    }

    if (best) {
      break;
    }
  }

  return best ? best.color : preferredText;
};

export type CheckoutColorMode = 'single' | 'dual';

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string | undefined,
  mode: CheckoutColorMode
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

export const ensureAPCABrandTextColor = (
  preferredText: string,
  background: string,
  fontSize = 16,
  fontWeight = 500
) => findBrandTextColor(preferredText, background, fontSize, fontWeight);

const getBadgeTextColor = (background: string, fontSize = 12, fontWeight = 600) => {
  const preferred = getAPCATextColor(background, fontSize, fontWeight);
  return ensureAPCATextColor(preferred, background, fontSize, fontWeight);
};

export type CheckoutColors = {
  primary: string;
  secondary: string;
  pageBg: string;
  surface: string;
  surfaceMuted: string;
  surfaceSoft: string;
  border: string;
  borderStrong: string;
  heading: string;
  bodyText: string;
  metaText: string;
  mutedText: string;
  helperText: string;
  priceText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  selectionBg: string;
  selectionBorder: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  secondaryButtonBg: string;
  secondaryButtonText: string;
  secondaryButtonBorder: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  inputFocusRing: string;
  radioAccent: string;
  stepActiveBg: string;
  stepActiveText: string;
  stepInactiveBg: string;
  stepInactiveText: string;
  stepLineActive: string;
  stepLineInactive: string;
  iconPrimary: string;
  iconMuted: string;
  summaryBg: string;
  summaryText: string;
  summaryValue: string;
  summaryTotalLabel: string;
  summaryTotalValue: string;
  highlightText: string;
  linkText: string;
  emptyStateIconBg: string;
  emptyStateIcon: string;
  couponActionText: string;
};

export const getCheckoutColors = (
  primary: string,
  secondary: string | undefined,
  mode: CheckoutColorMode = 'single',
  isDark?: boolean
): CheckoutColors => {
  const neutralSurface = isDark ? '#161617' : '#ffffff';
  const neutralSurfaceMuted = isDark ? '#1c1c1e' : '#f8fafc';
  const neutralSurfaceSoft = isDark ? '#27272a' : '#f1f5f9';
  const neutralBorder = isDark ? '#27272a' : '#e2e8f0';
  const neutralBorderStrong = isDark ? '#3f3f46' : '#cbd5e1';
  const neutralText = isDark ? '#f5f5f7' : '#0f172a';
  const neutralMuted = isDark ? '#86868b' : '#475569';
  const neutralSoft = isDark ? '#6e6e73' : '#94a3b8';

  const secondaryResolved = resolveSecondaryForMode(primary, secondary, mode);
  
  const primaryTint = isDark
    ? formatHex(oklch({ ...safeParseOklch(primary, primary), l: 0.15, c: 0.04 }))
    : getSolidTint(primary, primary, 0.42);
    
  const secondaryTint = isDark
    ? formatHex(oklch({ ...safeParseOklch(secondaryResolved, primary), l: 0.15, c: 0.04 }))
    : getSolidTint(secondaryResolved, primary, 0.42);
    
  const secondaryTintStrong = isDark
    ? secondaryResolved
    : getSolidTint(secondaryResolved, primary, 0.32);
    
  const primaryTintStrong = isDark
    ? primary
    : getSolidTint(primary, primary, 0.32);

  return {
    primary,
    secondary: secondaryResolved,
    pageBg: neutralSurfaceMuted,
    surface: neutralSurface,
    surfaceMuted: neutralSurfaceMuted,
    surfaceSoft: neutralSurfaceSoft,
    border: neutralBorder,
    borderStrong: neutralBorderStrong,
    heading: ensureAPCABrandTextColor(primary, neutralSurface, 28, 700),
    bodyText: ensureAPCATextColor(neutralText, neutralSurface, 16, 500),
    metaText: ensureAPCATextColor(neutralMuted, neutralSurface, 14, 500),
    mutedText: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    helperText: ensureAPCATextColor(neutralMuted, neutralSurfaceMuted, 12, 500),
    priceText: ensureAPCABrandTextColor(secondaryResolved, neutralSurface, 16, 700),
    badgeBg: secondaryTint,
    badgeBorder: secondaryTintStrong,
    badgeText: getBadgeTextColor(secondaryTint, 12, 600),
    selectionBg: primaryTint,
    selectionBorder: primaryTintStrong,
    primaryButtonBg: primary,
    primaryButtonText: getAPCATextColor(primary, 14, 600),
    secondaryButtonBg: neutralSurface,
    secondaryButtonText: ensureAPCABrandTextColor(secondaryResolved, neutralSurface, 12, 600),
    secondaryButtonBorder: secondaryTintStrong,
    inputBg: neutralSurface,
    inputBorder: neutralBorder,
    inputText: ensureAPCATextColor(neutralText, neutralSurface, 14, 500),
    inputPlaceholder: ensureAPCATextColor(neutralSoft, neutralSurface, 12, 500),
    inputFocusRing: secondaryTintStrong,
    radioAccent: primary,
    stepActiveBg: primary,
    stepActiveText: getAPCATextColor(primary, 12, 600),
    stepInactiveBg: neutralSurfaceSoft,
    stepInactiveText: ensureAPCATextColor(neutralSoft, neutralSurfaceSoft, 12, 600),
    stepLineActive: primary,
    stepLineInactive: neutralBorder,
    iconPrimary: ensureAPCABrandTextColor(primary, neutralSurface, 16, 600),
    iconMuted: ensureAPCATextColor(neutralSoft, neutralSurface, 14, 600),
    summaryBg: neutralSurface,
    summaryText: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 500),
    summaryValue: ensureAPCATextColor(neutralText, neutralSurface, 14, 600),
    summaryTotalLabel: ensureAPCATextColor(neutralMuted, neutralSurface, 12, 600),
    summaryTotalValue: ensureAPCABrandTextColor(secondaryResolved, neutralSurface, 18, 700),
    highlightText: ensureAPCABrandTextColor(secondaryResolved, neutralSurface, 14, 600),
    linkText: ensureAPCABrandTextColor(primary, neutralSurface, 14, 600),
    emptyStateIconBg: neutralSurfaceSoft,
    emptyStateIcon: ensureAPCATextColor(neutralSoft, neutralSurfaceSoft, 16, 600),
    couponActionText: ensureAPCABrandTextColor(secondaryResolved, neutralSurface, 12, 600),
  };
};
