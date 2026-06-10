'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';
import type { StatsBrandMode } from '../_types';

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);

const isNonEmptyColor = (value: string) => value.trim().length > 0;

const safeParseOklch = (input: string, fallback: string) => (
  oklch(input) ?? oklch(fallback) ?? oklch('#3b82f6')
);

const resolveStatsSecondary = (
  primary: string,
  secondary: string,
  mode: StatsBrandMode,
) => {
  if (mode === 'single') {
    return primary;
  }

  return isNonEmptyColor(secondary) ? secondary : primary;
};

const getTint = (hex: string, lightness: number, fallback: string) => {
  const color = safeParseOklch(hex, fallback);
  return formatHex(oklch({ ...color, l: clampLightness(color.l + lightness) }));
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

export const getAPCATextColor = (bg: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', bg);
  const blackLc = getAPCALc('#000000', bg);
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc > blackLc ? '#ffffff' : '#0f172a';
};

const getTextOnGradient = (primary: string, secondary: string, fontSize = 16, fontWeight = 500) => {
  const whitePrimary = getAPCALc('#ffffff', primary);
  const whiteSecondary = getAPCALc('#ffffff', secondary);
  const blackPrimary = getAPCALc('#000000', primary);
  const blackSecondary = getAPCALc('#000000', secondary);
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;
  const whiteMin = Math.min(whitePrimary, whiteSecondary);
  const blackMin = Math.min(blackPrimary, blackSecondary);

  if (whiteMin >= threshold || blackMin >= threshold) {
    return whiteMin >= blackMin ? '#ffffff' : '#0f172a';
  }

  return whiteMin > blackMin ? '#ffffff' : '#0f172a';
};

const ensureAPCATextColor = (
  preferred: string,
  background: string,
  fontSize = 16,
  fontWeight = 500,
) => {
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;
  const preferredLc = getAPCALc(preferred, background);

  if (preferredLc >= threshold) {
    return preferred;
  }

  return getAPCATextColor(background, fontSize, fontWeight);
};

export const getHorizontalColors = (primary: string, secondary: string, mode: StatsBrandMode) => {
  const secondaryResolved = resolveStatsSecondary(primary, secondary, mode);
  const sectionBg = getTint(primary, 0.46, '#ffffff');

  return {
    border: getTint(secondaryResolved, 0.35, primary),
    sectionBg,
    iconBg: getTint(secondaryResolved, 0.22, primary),
    iconColor: secondaryResolved,
    valueColor: ensureAPCATextColor(primary, sectionBg, 26, 700),
    labelColor: ensureAPCATextColor('#4a5568', sectionBg, 13, 500),
  };
};

export const getCardsColors = (primary: string, secondary: string, mode: StatsBrandMode) => {
  const secondaryResolved = resolveStatsSecondary(primary, secondary, mode);

  return {
    sectionBg: '#ffffff',
    border: '#e5e7eb',
    accent: secondaryResolved,
    iconColor: secondaryResolved,
    valueColor: ensureAPCATextColor(primary, '#ffffff', 26, 700),
    labelColor: ensureAPCATextColor('#1f2937', '#ffffff', 13, 500),
    dividerColor: '#e5e7eb',
  };
};

export const getIconsColors = (primary: string, secondary: string, mode: StatsBrandMode) => {
  const secondaryResolved = resolveStatsSecondary(primary, secondary, mode);
  const secondaryStrong = getTint(secondaryResolved, -0.18, primary);
  const sectionBg = '#ffffff';

  return {
    sectionBg,
    circleBg: primary,
    textOnCircle: getAPCATextColor(primary, 20, 700),
    ring: getTint(secondaryResolved, -0.12, primary),
    label: ensureAPCATextColor(secondaryStrong, sectionBg, 14, 600),
  };
};

export const getGradientColors = (primary: string, secondary: string, mode: StatsBrandMode) => {
  const secondaryResolved = resolveStatsSecondary(primary, secondary, mode);

  return {
    background: `linear-gradient(135deg, ${primary} 0%, ${secondaryResolved} 100%)`,
    border: getTint(secondaryResolved, 0.35, primary),
    text: getTextOnGradient(primary, secondaryResolved, 20, 700),
    label: getTextOnGradient(primary, secondaryResolved, 14, 500),
  };
};

export const getMinimalColors = (primary: string, secondary: string, mode: StatsBrandMode) => {
  const secondaryResolved = resolveStatsSecondary(primary, secondary, mode);
  const secondaryStrong = getTint(secondaryResolved, -0.18, primary);

  return {
    sectionBg: '#f8fafc',
    accent: secondaryStrong,
    value: ensureAPCATextColor(primary, '#ffffff', 32, 700),
    label: '#64748b',
  };
};

export const getCounterColors = (primary: string, _secondary: string, _mode: StatsBrandMode) => {
  // Counter luôn dùng màu chính (primary), không phải secondary
  // Background: màu chính đậm hơn một chút
  const bgColor = getTint(primary, -0.08, primary);
  // Text color: trắng hoặc đen tùy contrast
  const textColor = getAPCATextColor(bgColor, 32, 700);
  const labelColor = getAPCATextColor(bgColor, 14, 500);
  const accentColor = getAPCATextColor(bgColor, 20, 500);

  return {
    border: getTint(primary, -0.12, primary),
    progress: primary,
    value: textColor,
    label: labelColor,
    accent: accentColor,
    background: bgColor,
  };
};

export const getSolarHeroColors = (primary: string, secondary: string, mode: StatsBrandMode) => {
  const secondaryResolved = resolveStatsSecondary(primary, secondary, mode);
  const cardSurface = '#ffffff';
  const descriptionBg = secondaryResolved;

  return {
    sectionBg: '#ffffff',
    cardSurface,
    value: ensureAPCATextColor(primary, cardSurface, 38, 700),
    label: ensureAPCATextColor('#111827', cardSurface, 14, 500),
    icon: primary,
    descriptionBg,
    descriptionText: getAPCATextColor(descriptionBg, 14, 500),
    border: '#e5e7eb',
  };
};

export const getBuilderOverlayColors = (primary: string, secondary: string, mode: StatsBrandMode) => {
  const secondaryResolved = resolveStatsSecondary(primary, secondary, mode);
  const surface = mode === 'dual' ? primary : getTint(primary, -0.18, primary);
  const accent = mode === 'dual'
    ? ensureAPCATextColor(secondaryResolved, surface, 36, 700)
    : getAPCATextColor(surface, 36, 700);
  const text = getAPCATextColor(surface, 16, 500);

  return {
    accent,
    border: `${text}66`,
    icon: accent,
    label: text,
    surface,
  };
};
