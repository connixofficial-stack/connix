'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';
import { getHarmonyStatus } from '@/lib/home-components/color-system';
import type {
  CountdownBrandMode,
} from '../_types';

const DEFAULT_BRAND_COLOR = '#3b82f6';

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);
const clampChroma = (value: number) => Math.min(Math.max(value, 0.02), 0.35);

const safeParseOklch = (value: string, fallback: string) => (
  oklch(value) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR)
);

const normalizeHex = (value: string, fallback: string) => {
  const candidate = value.trim().length > 0 ? value.trim() : fallback;
  return formatHex(safeParseOklch(candidate, fallback));
};

const isValidHexColor = (value: string) => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());

const shiftColor = (hex: string, lightnessDelta: number, chromaScale = 1, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  return formatHex(oklch({
    ...color,
    l: clampLightness((color.l ?? 0.62) + lightnessDelta),
    c: clampChroma((color.c ?? 0.14) * chromaScale),
  }));
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

const getAPCALc = (text: string, background: string) => {
  const textRgb = toRgbTuple(text, '#ffffff');
  const backgroundRgb = toRgbTuple(background, '#0f172a');

  if (!textRgb || !backgroundRgb) {
    return 0;
  }

  const lc = Math.abs(APCAcontrast(sRGBtoY(textRgb), sRGBtoY(backgroundRgb)));
  return Number.isFinite(lc) ? lc : 0;
};

const pickReadableTextOnSolid = (bg: string) => {
  const whiteLc = getAPCALc('#ffffff', bg);
  const nearBlackLc = getAPCALc('#111111', bg);
  return whiteLc >= nearBlackLc ? '#ffffff' : '#111111';
};

const getAPCAThreshold = (fontSize = 16, fontWeight = 500) => (
  (fontSize >= 18 || fontWeight >= 700) ? 45 : 60
);

export const getAPCATextColor = (background: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', background);
  const blackLc = getAPCALc('#000000', background);
  const threshold = getAPCAThreshold(fontSize, fontWeight);

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc >= blackLc ? '#ffffff' : '#0f172a';
};

export const ensureAPCATextColor = (
  preferred: string,
  background: string,
  fontSize = 16,
  fontWeight = 500,
) => {
  const threshold = getAPCAThreshold(fontSize, fontWeight);
  const preferredLc = getAPCALc(preferred, background);
  if (preferredLc >= threshold) {
    return preferred;
  }
  return getAPCATextColor(background, fontSize, fontWeight);
};

const getAutoSecondary = (primary: string) => {
  const color = safeParseOklch(primary, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 30) % 360 }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: CountdownBrandMode,
) => {
  const normalizedPrimary = normalizeHex(primary, DEFAULT_BRAND_COLOR);

  if (mode === 'single') {
    return normalizedPrimary;
  }

  if (isValidHexColor(secondary)) {
    return normalizeHex(secondary, normalizedPrimary);
  }

  return getAutoSecondary(normalizedPrimary);
};

export interface CountdownColorTokens {
  primary: string;
  secondary: string;
  heading: string;
  bodyText: string;
  mutedText: string;
  neutralBackground: string;
  neutralSurface: string;
  neutralBorder: string;
  timerCardBg: string;
  timerCardText: string;
  timerCardBorder: string;
  timerLabel: string;
  timerSeparator: string;
  sectionOverlayLight: string;
  sectionOverlayStrong: string;
  sectionGradient: string;
  floatingGradient: string;
  splitGradient: string;
  popupGradient: string;
  ctaSolidBg: string;
  ctaSolidText: string;
  ctaGhostBg: string;
  ctaGhostText: string;
  badgeBg: string;
  badgeText: string;
  popupScrim: string;
  popupCloseBg: string;
  popupCloseText: string;
  stickyText: string;
  stickyChipBg: string;
  stickyChipText: string;
}

const buildTokens = (primaryResolved: string, secondaryResolved: string): CountdownColorTokens => {
  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralBorder = '#e2e8f0';
  const ctaSolidBg = secondaryResolved;
  const ctaSolidText = ensureAPCATextColor('#ffffff', ctaSolidBg, 14, 600);
  const ctaGhostBg = neutralSurface;
  const ctaGhostText = ensureAPCATextColor(secondaryResolved, ctaGhostBg, 14, 600);
  const timerCardBg = primaryResolved;
  const timerCardText = ensureAPCATextColor('#ffffff', timerCardBg, 28, 700);
  const badgeBg = shiftColor(secondaryResolved, 0.3, 0.75, primaryResolved);
  const badgeTextCandidate = pickReadableTextOnSolid(badgeBg);
  const badgeText = ensureAPCATextColor(badgeTextCandidate, badgeBg, 12, 700);
  const stickyChipBg = shiftColor('#ffffff', -0.15, 0.8, primaryResolved);

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,
    heading: primaryResolved,
    bodyText: '#0f172a',
    mutedText: '#64748b',
    neutralBackground,
    neutralSurface,
    neutralBorder,
    timerCardBg,
    timerCardText,
    timerCardBorder: shiftColor(secondaryResolved, 0.45, 0.7, primaryResolved),
    timerLabel: '#64748b',
    timerSeparator: '#94a3b8',
    sectionOverlayLight: neutralSurface,
    sectionOverlayStrong: 'rgba(2,6,23,0.62)',
    sectionGradient: `linear-gradient(135deg, ${primaryResolved} 0%, ${secondaryResolved} 100%)`,
    floatingGradient: `linear-gradient(135deg, ${shiftColor(primaryResolved, -0.08, 1, DEFAULT_BRAND_COLOR)} 0%, ${secondaryResolved} 100%)`,
    splitGradient: `linear-gradient(135deg, ${primaryResolved} 0%, ${shiftColor(secondaryResolved, -0.05, 1, primaryResolved)} 100%)`,
    popupGradient: `linear-gradient(135deg, ${shiftColor(primaryResolved, -0.1, 1, DEFAULT_BRAND_COLOR)} 0%, ${secondaryResolved} 100%)`,
    ctaSolidBg,
    ctaSolidText,
    ctaGhostBg,
    ctaGhostText,
    badgeBg,
    badgeText,
    popupScrim: 'rgba(2,6,23,0.62)',
    popupCloseBg: '#f1f5f9',
    popupCloseText: '#475569',
    stickyText: ensureAPCATextColor('#ffffff', primaryResolved, 14, 600),
    stickyChipBg,
    stickyChipText: '#ffffff',
  };
};

export const getCountdownColorTokens = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: CountdownBrandMode;
}) => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);
  return buildTokens(primaryResolved, secondaryResolved);
};

export const getCountdownValidationResult = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: CountdownBrandMode;
}) => {
  const tokens = getCountdownColorTokens({ primary, secondary, mode });

  const harmonyStatus = mode === 'single'
    ? { deltaE: 100, isTooSimilar: false }
    : getHarmonyStatus(tokens.primary, tokens.secondary);

  return {
    tokens,
    harmonyStatus,
  };
};

export const getCountdownSecondarySimilarity = (primary: string, secondary: string) => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = normalizeHex(secondary, primaryResolved);
  const status = getHarmonyStatus(primaryResolved, secondaryResolved);
  return {
    deltaE: status.deltaE,
    similarity: 1 - Math.min(status.deltaE / 100, 1),
  };
};
