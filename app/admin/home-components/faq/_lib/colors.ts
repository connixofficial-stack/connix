'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
import type { FaqBrandMode, FaqStyle } from '../_types';

interface FaqPalette {
  solid: string;
  surface: string;
  surfaceSoft: string;
  hover: string;
  active: string;
  border: string;
  textOnSolid: string;
  textInteractive: string;
}

export interface FaqStyleTokens {
  sectionBg: string;
  heading: string;
  body: string;
  questionText: string;
  panelTitleText: string;
  panelBg: string;
  panelBgMuted: string;
  panelBorder: string;
  panelBorderStrong: string;
  chevron: string;
  iconBg: string;
  iconText: string;
  number: string;
  timelineLine: string;
  timelineDotBorder: string;
  timelineDotBg: string;
  tabActiveBg: string;
  tabActiveText: string;
  tabInactiveBg: string;
  tabInactiveText: string;
  tabOverflowText: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconSolidBg: string;
  iconSolidText: string;
  ctaBg: string;
  ctaText: string;
  ctaShadow: string;
}

interface FaqAccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

interface FaqAccessibilityScore {
  minLc: number;
  failing: Array<FaqAccessibilityPair & { lc: number; threshold: number }>;
}

interface FaqHarmonyStatus {
  deltaE: number;
  similarity: number;
  isTooSimilar: boolean;
}

interface FaqAccentBalance {
  primary: number;
  secondary: number;
  neutral: number;
  warnings: string[];
}

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);
const clampChroma = (value: number) => Math.min(Math.max(value, 0.02), 0.37);

const hexToRgb = (hex: string): [number, number, number] | null => {
  const cleaned = hex.trim().replace('#', '');
  if (cleaned.length !== 6 && cleaned.length !== 8) {return null;}

  const normalized = cleaned.length === 8 ? cleaned.slice(0, 6) : cleaned;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some((value) => Number.isNaN(value))) {return null;}
  return [r, g, b];
};

const getAPCALc = (textHex: string, backgroundHex: string) => {
  const textRgb = hexToRgb(textHex);
  const backgroundRgb = hexToRgb(backgroundHex);

  if (!textRgb || !backgroundRgb) {return 0;}

  const lc = Math.abs(APCAcontrast(sRGBtoY(textRgb), sRGBtoY(backgroundRgb)));
  return Number.isFinite(lc) ? lc : 0;
};

const getAPCAThreshold = (fontSize = 16, fontWeight = 500) => (
  (fontSize >= 18 || fontWeight >= 600) ? 45 : 60
);

const DEFAULT_OKLCH = {
  l: 0.6,
  c: 0.12,
  h: 250,
};

const normalizeHue = (value: number) => ((value % 360) + 360) % 360;

const safeParseOklch = (
  value: string,
  fallback: { l: number; c: number; h: number } = DEFAULT_OKLCH,
) => {
  const parsed = oklch(value);

  if (!parsed) {
    return {
      mode: 'oklch' as const,
      l: clampLightness(fallback.l),
      c: clampChroma(fallback.c),
      h: normalizeHue(fallback.h),
    };
  }

  return {
    mode: 'oklch' as const,
    l: clampLightness(typeof parsed.l === 'number' ? parsed.l : fallback.l),
    c: clampChroma(typeof parsed.c === 'number' ? parsed.c : fallback.c),
    h: normalizeHue(typeof parsed.h === 'number' ? parsed.h : fallback.h),
  };
};

const getOKLCH = (hex: string) => safeParseOklch(hex, DEFAULT_OKLCH);

const oklchShift = (
  hex: string,
  options: {
    l?: number;
    c?: number;
    h?: number;
  },
) => {
  const color = getOKLCH(hex);
  const next = {
    ...color,
    ...(options.h !== undefined ? { h: options.h } : {}),
    ...(options.l !== undefined ? { l: clampLightness(color.l + options.l) } : {}),
    ...(options.c !== undefined ? { c: clampChroma(color.c + options.c) } : {}),
  };
  return formatHex(oklch(next));
};

const isValidHexColor = (value: string) => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());

const ensureAPCATextColor = (
  preferredText: string,
  background: string,
  fontSize = 16,
  fontWeight = 500,
) => {
  const threshold = getAPCAThreshold(fontSize, fontWeight);
  const preferredLc = getAPCALc(preferredText, background);

  if (preferredLc >= threshold) {
    return preferredText;
  }

  return getAPCATextColor(background, fontSize, fontWeight);
};


export const getAPCATextColor = (bg: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', bg);
  const blackLc = getAPCALc('#000000', bg);
  const threshold = getAPCAThreshold(fontSize, fontWeight);

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc > blackLc ? '#ffffff' : '#0f172a';
};

const generatePalette = (hex: string): FaqPalette => ({
  solid: hex,
  surface: oklchShift(hex, { l: 0.4, c: -0.03 }),
  surfaceSoft: oklchShift(hex, { l: 0.46, c: -0.04 }),
  hover: oklchShift(hex, { l: -0.08 }),
  active: oklchShift(hex, { l: -0.12 }),
  border: oklchShift(hex, { l: 0.26, c: -0.02 }),
  textOnSolid: getAPCATextColor(hex, 14, 700),
  textInteractive: ensureAPCATextColor(oklchShift(hex, { l: -0.24, c: -0.02 }), '#ffffff', 14, 600),
});

const getAnalogous = (hex: string): [string, string] => {
  const color = getOKLCH(hex);
  return [
    formatHex(oklch({ ...color, h: (color.h + 30) % 360 })),
    formatHex(oklch({ ...color, h: (color.h - 30 + 360) % 360 })),
  ];
};

const getAutoSecondary = (primary: string) => getAnalogous(primary)[0];

export const resolveFaqSecondary = (
  primary: string,
  secondary: string,
  mode: FaqBrandMode,
) => {
  if (mode === 'single') {
    return primary;
  }

  const trimmedSecondary = secondary.trim();
  if (trimmedSecondary && isValidHexColor(trimmedSecondary)) {return trimmedSecondary;}
  return getAutoSecondary(primary);
};

export const getFaqHarmonyStatus = (primary: string, secondary: string): FaqHarmonyStatus => {
  const delta = differenceEuclidean('oklch')(primary, secondary);
  const similarity = 1 - Math.min(delta, 1);
  const deltaE = Math.round(delta * 100);
  return {
    deltaE,
    similarity,
    isTooSimilar: deltaE < 20,
  };
};

export const getFaqAccessibilityScore = (pairs: FaqAccessibilityPair[]): FaqAccessibilityScore => {
  const failing: FaqAccessibilityScore['failing'] = [];
  let minLc = Number.POSITIVE_INFINITY;

  pairs.forEach((pair) => {
    const fontSize = pair.fontSize ?? 16;
    const fontWeight = pair.fontWeight ?? 500;
    const threshold = getAPCAThreshold(fontSize, fontWeight);
    const lc = getAPCALc(pair.text, pair.background);
    minLc = Math.min(minLc, lc);

    if (lc < threshold) {
      failing.push({ ...pair, lc, threshold });
    }
  });

  return {
    minLc: Number.isFinite(minLc) ? minLc : 0,
    failing,
  };
};

const FAQ_ACCENT_BALANCE_BY_STYLE: Record<FaqStyle, { primary: number; secondary: number; neutral: number }> = {
  accordion: { primary: 25, secondary: 12, neutral: 63 },
  cards: { primary: 26, secondary: 11, neutral: 63 },
  'two-column': { primary: 28, secondary: 10, neutral: 62 },
  minimal: { primary: 25, secondary: 12, neutral: 63 },
  timeline: { primary: 25, secondary: 13, neutral: 62 },
  tabbed: { primary: 26, secondary: 14, neutral: 60 },
  'wine-list': { primary: 24, secondary: 14, neutral: 62 },
};

export const calculateFaqAccentBalance = (style: FaqStyle): FaqAccentBalance => {
  const target = FAQ_ACCENT_BALANCE_BY_STYLE[style];
  const warnings: string[] = [];

  if (target.primary < 18) {warnings.push(`Primary < 18% (hiện ${target.primary}%)`);}
  if (target.secondary < 8) {warnings.push(`Secondary < 8% (hiện ${target.secondary}%)`);}

  return {
    primary: target.primary,
    secondary: target.secondary,
    neutral: target.neutral,
    warnings,
  };
};

export const getFaqColors = ({
  primary,
  secondary,
  mode,
  style,
}: {
  primary: string;
  secondary: string;
  mode: FaqBrandMode;
  style: FaqStyle;
}): FaqStyleTokens => {
  const safePrimary = isValidHexColor(primary) ? primary.trim() : '#3b82f6';
  const resolvedSecondary = resolveFaqSecondary(safePrimary, secondary, mode);
  const primaryPalette = generatePalette(safePrimary);
  const secondaryPalette = generatePalette(resolvedSecondary);

  const basePanelBg = '#ffffff';
  const basePanelMuted = '#f8fafc';
  const neutralSoft = '#f8fafc';
  const neutralBorder = '#e2e8f0';
  const badgeBg = secondaryPalette.solid;
  const badgeBorder = neutralBorder;
  const badgeText = ensureAPCATextColor(getAPCATextColor(badgeBg, 12, 700), badgeBg, 12, 700);
  const iconSolidBg = primaryPalette.solid;
  const iconSolidText = ensureAPCATextColor(getAPCATextColor(iconSolidBg, 14, 700), iconSolidBg, 14, 700);

  const base: FaqStyleTokens = {
    sectionBg: '#ffffff',
    heading: primaryPalette.solid,
    body: ensureAPCATextColor('#475569', '#ffffff', 16, 500),
    questionText: ensureAPCATextColor('#0f172a', basePanelBg, 16, 500),
    panelTitleText: ensureAPCATextColor('#0f172a', basePanelBg, 18, 600),
    panelBg: basePanelBg,
    panelBgMuted: basePanelMuted,
    panelBorder: neutralBorder,
    panelBorderStrong: secondaryPalette.solid,
    chevron: ensureAPCATextColor(resolvedSecondary, basePanelBg, 14, 700),
    iconBg: neutralSoft,
    iconText: ensureAPCATextColor(primaryPalette.solid, neutralSoft, 14, 700),
    number: ensureAPCATextColor(resolvedSecondary, '#ffffff', 14, 700),
    timelineLine: ensureAPCATextColor(oklchShift(resolvedSecondary, { l: 0.12, c: -0.01 }), '#ffffff', 14, 600),
    timelineDotBorder: secondaryPalette.solid,
    timelineDotBg: '#ffffff',
    tabActiveBg: secondaryPalette.solid,
    tabActiveText: ensureAPCATextColor(getAPCATextColor(secondaryPalette.solid, 14, 600), secondaryPalette.solid, 14, 600),
    tabInactiveBg: '#f1f5f9',
    tabInactiveText: ensureAPCATextColor('#475569', '#f1f5f9', 14, 500),
    tabOverflowText: ensureAPCATextColor('#64748b', '#ffffff', 14, 500),
    badgeBg,
    badgeText,
    badgeBorder,
    iconSolidBg,
    iconSolidText,
    ctaBg: primaryPalette.solid,
    ctaText: primaryPalette.textOnSolid,
    ctaShadow: 'none',
  };

  if (style === 'cards') {
    return {
      ...base,
      panelBg: '#ffffff',
      panelBgMuted: '#ffffff',
      questionText: ensureAPCATextColor(base.questionText, '#ffffff', 16, 500),
      panelTitleText: ensureAPCATextColor(base.panelTitleText, '#ffffff', 18, 600),
      iconBg: '#f8fafc',
      iconText: ensureAPCATextColor(primaryPalette.solid, '#f8fafc', 14, 700),
      badgeBg: secondaryPalette.surface,
      badgeBorder: '#e2e8f0',
      badgeText: ensureAPCATextColor(secondaryPalette.textInteractive, secondaryPalette.surface, 12, 700),
      panelBorderStrong: secondaryPalette.solid,
    };
  }

  if (style === 'two-column') {
    return {
      ...base,
      panelBg: '#ffffff',
      panelBgMuted: '#f8fafc',
      questionText: ensureAPCATextColor(base.questionText, '#ffffff', 16, 500),
      panelTitleText: ensureAPCATextColor(base.panelTitleText, '#ffffff', 18, 600),
      ctaBg: primaryPalette.solid,
      ctaText: primaryPalette.textOnSolid,
      ctaShadow: 'none',
      iconBg: '#ffffff',
      iconText: ensureAPCATextColor(primaryPalette.solid, '#ffffff', 12, 700),
      badgeBg: secondaryPalette.surface,
      badgeBorder: '#e2e8f0',
      badgeText: ensureAPCATextColor(secondaryPalette.textInteractive, secondaryPalette.surface, 12, 700),
      panelBorderStrong: secondaryPalette.solid,
    };
  }

  if (style === 'minimal') {
    return {
      ...base,
      panelBg: '#ffffff',
      panelBgMuted: '#ffffff',
      questionText: ensureAPCATextColor(base.questionText, '#ffffff', 16, 500),
      panelTitleText: ensureAPCATextColor(base.panelTitleText, '#ffffff', 18, 600),
      number: ensureAPCATextColor(secondaryPalette.solid, '#ffffff', 18, 700),
      badgeBg: primaryPalette.surface,
      badgeBorder: '#e2e8f0',
      badgeText: ensureAPCATextColor(primaryPalette.textInteractive, primaryPalette.surface, 12, 700),
    };
  }

  if (style === 'timeline') {
    return {
      ...base,
      panelBg: '#ffffff',
      panelBgMuted: '#f8fafc',
      questionText: ensureAPCATextColor(base.questionText, '#f8fafc', 16, 500),
      panelTitleText: ensureAPCATextColor(base.panelTitleText, '#f8fafc', 18, 600),
      timelineLine: ensureAPCATextColor(oklchShift(resolvedSecondary, { l: 0.12, c: -0.01 }), '#ffffff', 14, 600),
      timelineDotBorder: secondaryPalette.solid,
      timelineDotBg: '#ffffff',
      iconText: ensureAPCATextColor(secondaryPalette.solid, '#ffffff', 12, 700),
      badgeBg: secondaryPalette.surface,
      badgeBorder: '#e2e8f0',
      badgeText: ensureAPCATextColor(secondaryPalette.textInteractive, secondaryPalette.surface, 12, 700),
    };
  }

  if (style === 'tabbed') {
    const panelBg = '#ffffff';
    const panelMuted = '#f8fafc';

    return {
      ...base,
      panelBg,
      panelBgMuted: panelMuted,
      questionText: ensureAPCATextColor(base.questionText, panelMuted, 16, 500),
      panelTitleText: ensureAPCATextColor(base.panelTitleText, panelBg, 18, 600),
      tabActiveBg: secondaryPalette.solid,
      tabActiveText: ensureAPCATextColor(getAPCATextColor(secondaryPalette.solid, 14, 600), secondaryPalette.solid, 14, 600),
      tabInactiveBg: '#f1f5f9',
      tabInactiveText: ensureAPCATextColor('#475569', '#f1f5f9', 14, 500),
      tabOverflowText: ensureAPCATextColor('#64748b', '#ffffff', 14, 500),
      iconBg: '#ffffff',
      iconText: ensureAPCATextColor(primaryPalette.solid, '#ffffff', 12, 700),
      badgeBg: secondaryPalette.surface,
      badgeBorder: '#e2e8f0',
      badgeText: ensureAPCATextColor(secondaryPalette.textInteractive, secondaryPalette.surface, 12, 700),
      panelBorderStrong: secondaryPalette.solid,
    };
  }

  if (style === 'wine-list') {
    const wineSurface = '#fbfaf7';
    const wineBorder = '#e7e5df';
    const wineText = '#1f2933';
    const wineBody = '#4b5563';

    return {
      ...base,
      sectionBg: '#ffffff',
      heading: wineText,
      body: ensureAPCATextColor(wineBody, wineSurface, 16, 500),
      questionText: ensureAPCATextColor(wineText, wineSurface, 18, 500),
      panelTitleText: ensureAPCATextColor(wineText, wineSurface, 18, 500),
      panelBg: wineSurface,
      panelBgMuted: wineSurface,
      panelBorder: wineBorder,
      panelBorderStrong: wineBorder,
      chevron: ensureAPCATextColor(primaryPalette.solid, wineSurface, 14, 700),
      badgeBg: '#ffffff',
      badgeBorder: wineBorder,
      badgeText: wineText,
      iconBg: wineSurface,
      iconText: ensureAPCATextColor(primaryPalette.solid, wineSurface, 14, 700),
    };
  }

  return base;
};
