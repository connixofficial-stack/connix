'use client';

import { formatHex, oklch } from 'culori';
import {
  getAccessibilityScore,
  getAccessibilityThreshold,
  getHarmonyStatus,
} from '@/lib/home-components/color-system';
import type {
  TeamBrandMode,
  TeamStyle,
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

const _withAlpha = (hex: string, alpha: number, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  const l = clampLightness(color.l ?? 0.62);
  const c = clampChroma(color.c ?? 0.14);
  const h = Number.isFinite(color.h) ? color.h : 0;
  const a = Math.min(Math.max(alpha, 0), 1);

  return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(3)} ${h.toFixed(2)} / ${a.toFixed(3)})`;
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

const getRelativeLuminance = (hex: string) => {
  const rgb = toRgbTuple(hex, DEFAULT_BRAND_COLOR);
  if (!rgb) {return 0;}

  const [r, g, b] = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getContrastRatio = (l1: number, l2: number) => {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const pickReadableTextOnSolid = (background: string) => {
  const luminance = getRelativeLuminance(background);
  const whiteContrast = getContrastRatio(1, luminance);
  const nearBlackContrast = getContrastRatio(luminance, 0.005);
  return whiteContrast >= nearBlackContrast ? '#ffffff' : '#111111';
};

const resolveBrandTextOnBackground = (
  preferred: string,
  background: string,
  fontSize = 14,
  fontWeight = 500,
  fallback = '#0f172a',
) => {
  const threshold = getAccessibilityThreshold({ fontSize, fontWeight });
  const candidates = [
    normalizeHex(preferred, fallback),
    shiftColor(preferred, -0.12, 1, fallback),
    shiftColor(preferred, -0.24, 1, fallback),
    shiftColor(preferred, -0.36, 1, fallback),
  ];

  for (const candidate of candidates) {
    const score = getAccessibilityScore([
      {
        key: 'candidate',
        text: candidate,
        bg: background,
        size: fontSize,
        weight: fontWeight,
      },
    ]);

    if ((score.items[0]?.lc ?? 0) >= threshold) {
      return candidate;
    }
  }

  return pickReadableTextOnSolid(background) === '#ffffff' ? '#ffffff' : fallback;
};

const getHarmonyColor = (primary: string) => {
  const color = safeParseOklch(primary, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 30) % 360 }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: TeamBrandMode,
) => {
  const normalizedPrimary = normalizeHex(primary, DEFAULT_BRAND_COLOR);

  if (mode === 'single') {
    return normalizedPrimary;
  }

  if (isValidHexColor(secondary)) {
    return normalizeHex(secondary, normalizedPrimary);
  }

  return getHarmonyColor(normalizedPrimary);
};

interface TeamPalette {
  solid: string;
  textOnSolid: string;
  surface: string;
  border: string;
  hoverSurface: string;
  activeSurface: string;
  interactiveText: string;
}

const buildPalette = (hex: string, fallback = DEFAULT_BRAND_COLOR): TeamPalette => {
  const solid = normalizeHex(hex, fallback);
  const surface = shiftColor(solid, 0.35, 0.75, fallback);
  const border = shiftColor(solid, 0.2, 0.68, fallback);
  const hoverSurface = shiftColor(solid, 0.29, 0.78, fallback);
  const activeSurface = shiftColor(solid, 0.22, 0.82, fallback);
  const interactiveText = shiftColor(solid, -0.18, 0.95, fallback);

  return {
    solid,
    textOnSolid: pickReadableTextOnSolid(solid) === '#ffffff' ? '#ffffff' : '#0f172a',
    surface,
    border,
    hoverSurface,
    activeSurface,
    interactiveText,
  };
};

export interface TeamColorTokens {
  primary: string;
  secondary: string;

  neutralBackground: string;
  neutralSurface: string;
  neutralBorder: string;
  neutralText: string;
  mutedText: string;

  heading: string;
  sectionSubtitle: string;
  sectionAccent: string;

  cardBackground: string;
  cardBorder: string;
  cardBorderHover: string;

  avatarFallbackBg: string;
  avatarFallbackText: string;

  roleText: string;
  bioText: string;

  socialButtonBg: string;
  socialButtonBorder: string;
  socialButtonIcon: string;
  socialOverlayScrim: string;

  carouselNavBg: string;
  carouselNavBorder: string;
  carouselNavIcon: string;

  timelineLine: string;
  timelineDotBg: string;
  timelineDotRing: string;

  spotlightGlow: string;
  spotlightRing: string;
  spotlightSectionBg: string;

  bentoBorder: string;
  bentoFeaturedBorder: string;

  styleAccentByStyle: Record<TeamStyle, string>;
}

export const getTeamColorTokens = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: TeamBrandMode;
}): TeamColorTokens => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);

  const primaryPalette = buildPalette(primaryResolved, DEFAULT_BRAND_COLOR);
  const secondaryPalette = buildPalette(secondaryResolved, primaryResolved);

  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralBorder = '#e2e8f0';
  const neutralText = '#0f172a';
  const mutedText = '#64748b';

  const socialButtonBg = secondaryPalette.surface;
  const socialButtonBorder = neutralBorder;
  const socialButtonTextCandidate = pickReadableTextOnSolid(socialButtonBg);
  const socialButtonIcon = resolveBrandTextOnBackground(socialButtonTextCandidate, socialButtonBg, 13, 600, neutralText);

  const carouselNavBg = secondaryPalette.surface;
  const carouselNavBorder = neutralBorder;
  const carouselNavTextCandidate = pickReadableTextOnSolid(carouselNavBg);
  const carouselNavIcon = resolveBrandTextOnBackground(carouselNavTextCandidate, carouselNavBg, 14, 700, neutralText);

  const timelineLine = shiftColor(secondaryPalette.solid, 0.35, 0.68, primaryResolved);
  const spotlightBorder = shiftColor(secondaryPalette.solid, 0.38, 0.72, primaryResolved);
  const spotlightSectionBg = neutralBackground;

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,

    neutralBackground,
    neutralSurface,
    neutralBorder,
    neutralText,
    mutedText,

    heading: primaryPalette.solid,
    sectionSubtitle: secondaryPalette.interactiveText,
    sectionAccent: secondaryPalette.solid,

    cardBackground: neutralSurface,
    cardBorder: neutralBorder,
    cardBorderHover: neutralBorder,

    avatarFallbackBg: primaryPalette.solid,
    avatarFallbackText: primaryPalette.textOnSolid,

    roleText: secondaryPalette.interactiveText,
    bioText: mutedText,

    socialButtonBg,
    socialButtonBorder,
    socialButtonIcon,
    socialOverlayScrim: 'rgba(2,6,23,0.85)',

    carouselNavBg,
    carouselNavBorder,
    carouselNavIcon,

    timelineLine,
    timelineDotBg: primaryPalette.solid,
    timelineDotRing: '#ffffff',

    spotlightGlow: spotlightBorder,
    spotlightRing: primaryPalette.border,
    spotlightSectionBg,

    bentoBorder: neutralBorder,
    bentoFeaturedBorder: primaryPalette.solid,

    styleAccentByStyle: {
      grid: secondaryPalette.solid,
      cards: secondaryPalette.solid,
      carousel: primaryPalette.solid,
      bento: primaryPalette.solid,
      timeline: primaryPalette.solid,
      spotlight: secondaryPalette.solid,
      construction: primaryPalette.solid,
      layout8: primaryPalette.solid,
    },
  };
};

export interface TeamValidationResult {
  tokens: TeamColorTokens;
  resolvedSecondary: string;
  harmonyStatus: {
    deltaE: number;
    isTooSimilar: boolean;
  };
  accessibility: {
    minLc: number;
    failing: Array<{
      key: string;
      lc: number;
      threshold: number;
      pass: boolean;
    }>;
  };
}

export const getTeamValidationResult = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: TeamBrandMode;
}): TeamValidationResult => {
  const tokens = getTeamColorTokens({
    primary,
    secondary,
    mode,
  });

  const harmonyStatus = mode === 'single'
    ? { deltaE: 100, isTooSimilar: false }
    : getHarmonyStatus(tokens.primary, tokens.secondary);

  const accessibilityScore = getAccessibilityScore([
    { key: 'heading', text: tokens.heading, bg: tokens.neutralSurface, size: 30, weight: 700 },
    { key: 'role', text: tokens.roleText, bg: tokens.neutralSurface, size: 14, weight: 500 },
    { key: 'bio', text: tokens.bioText, bg: tokens.neutralSurface, size: 14, weight: 400 },
    { key: 'social', text: tokens.socialButtonIcon, bg: tokens.socialButtonBg, size: 13, weight: 600 },
  ]);

  const accessibility = {
    minLc: accessibilityScore.minLc,
    failing: accessibilityScore.items
      .filter((item) => !item.pass)
      .map((item) => ({
        key: item.key,
        lc: item.lc,
        threshold: item.threshold,
        pass: item.pass,
      })),
  };

  return {
    tokens,
    resolvedSecondary: tokens.secondary,
    harmonyStatus,
    accessibility,
  };
};
