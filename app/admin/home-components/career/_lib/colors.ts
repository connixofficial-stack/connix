'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
import { DEFAULT_CAREER_HARMONY, normalizeCareerHarmony } from './constants';
import type {
  CareerBrandMode,
  CareerHarmony,
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

const getAPCAThreshold = (fontSize = 16, fontWeight = 500) => (
  (fontSize >= 18 || fontWeight >= 700) ? 45 : 60
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

const getAPCALc = (text: string, background: string) => {
  const textRgb = toRgbTuple(text, '#ffffff');
  const backgroundRgb = toRgbTuple(background, '#0f172a');

  if (!textRgb || !backgroundRgb) {
    return 0;
  }

  const lc = Math.abs(APCAcontrast(sRGBtoY(textRgb), sRGBtoY(backgroundRgb)));
  return Number.isFinite(lc) ? lc : 0;
};

const getAPCATextColor = (background: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', background);
  const blackLc = getAPCALc('#000000', background);
  const threshold = getAPCAThreshold(fontSize, fontWeight);

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc >= blackLc ? '#ffffff' : '#0f172a';
};

const ensureAPCATextColor = (
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

const withAlpha = (hex: string, alpha: number, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  const l = clampLightness(color.l ?? 0.62);
  const c = clampChroma(color.c ?? 0.14);
  const h = Number.isFinite(color.h) ? color.h : 0;
  const a = Math.min(Math.max(alpha, 0), 1);
  return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(3)} ${h.toFixed(2)} / ${a.toFixed(3)})`;
};

const shiftColor = (hex: string, lightnessDelta: number, chromaScale = 1, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  return formatHex(oklch({
    ...color,
    l: clampLightness((color.l ?? 0.62) + lightnessDelta),
    c: clampChroma((color.c ?? 0.14) * chromaScale),
  }));
};

const getHarmonyColor = (primary: string, harmony: CareerHarmony) => {
  const color = safeParseOklch(primary, DEFAULT_BRAND_COLOR);

  if (harmony === 'complementary') {
    return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 180) % 360 }));
  }

  if (harmony === 'triadic') {
    return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 120) % 360 }));
  }

  return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 30) % 360 }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: CareerBrandMode,
  harmony: CareerHarmony,
) => {
  const normalizedPrimary = normalizeHex(primary, DEFAULT_BRAND_COLOR);

  if (mode === 'single') {
    return normalizedPrimary;
  }

  if (isValidHexColor(secondary)) {
    return normalizeHex(secondary, normalizedPrimary);
  }

  return getHarmonyColor(normalizedPrimary, harmony);
};

interface CareerPalette {
  solid: string;
  textOnSolid: string;
  surface: string;
  border: string;
  hoverSurface: string;
  interactive: string;
}

const buildPalette = (hex: string, fallback = DEFAULT_BRAND_COLOR): CareerPalette => {
  const solid = normalizeHex(hex, fallback);
  const surface = shiftColor(solid, 0.35, 0.75, fallback);
  const border = shiftColor(solid, 0.2, 0.68, fallback);
  const hoverSurface = shiftColor(solid, 0.28, 0.8, fallback);
  const interactive = shiftColor(solid, -0.18, 0.95, fallback);

  return {
    solid,
    textOnSolid: getAPCATextColor(solid, 14, 600),
    surface,
    border,
    hoverSurface,
    interactive,
  };
};

export interface CareerColorTokens {
  primary: string;
  secondary: string;

  neutralBackground: string;
  neutralSurface: string;
  neutralBorder: string;
  neutralText: string;
  mutedText: string;

  heading: string;
  sectionLabel: string;

  cardBackground: string;
  cardBorder: string;
  cardBorderHover: string;

  badgeBackground: string;
  badgeText: string;
  badgeBorder: string;

  salaryText: string;
  metaText: string;

  ctaBackground: string;
  ctaText: string;
  ctaHoverBackground: string;

  tableHeaderBackground: string;
  tableHeaderText: string;
  tableRowBorder: string;

  timelineLine: string;
  timelineDotBorder: string;
  timelineDotText: string;
  timelineDepartmentText: string;

  emptyIconBackground: string;
  emptyIconColor: string;
}

export interface CareerHarmonyStatus {
  deltaE: number;
  similarity: number;
  isTooSimilar: boolean;
}

export interface CareerAccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

export interface CareerAccessibilityScore {
  minLc: number;
  failing: Array<CareerAccessibilityPair & { lc: number; threshold: number }>;
}

const getHarmonyStatus = (primary: string, secondary: string): CareerHarmonyStatus => {
  const primaryNormalized = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryNormalized = normalizeHex(secondary, primaryNormalized);
  const delta = differenceEuclidean('oklch')(primaryNormalized, secondaryNormalized);
  const safeDelta = Number.isFinite(delta) ? delta : 1;
  const deltaE = Math.round(safeDelta * 100);

  return {
    deltaE,
    similarity: 1 - Math.min(safeDelta, 1),
    isTooSimilar: deltaE < 20,
  };
};

const getAccessibilityScore = (
  pairs: CareerAccessibilityPair[]
): CareerAccessibilityScore => {
  const failing: CareerAccessibilityScore['failing'] = [];
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

export const getCareerColorTokens = ({
  primary,
  secondary,
  mode,
  harmony = DEFAULT_CAREER_HARMONY,
}: {
  primary: string;
  secondary: string;
  mode: CareerBrandMode;
  harmony?: CareerHarmony;
}): CareerColorTokens => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const normalizedHarmony = normalizeCareerHarmony(harmony);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode, normalizedHarmony);

  const primaryPalette = buildPalette(primaryResolved, DEFAULT_BRAND_COLOR);
  const secondaryPalette = buildPalette(secondaryResolved, primaryResolved);

  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralBorder = '#e2e8f0';
  const neutralText = '#0f172a';
  const mutedText = '#64748b';

  const badgeBackground = secondaryPalette.surface;
  const badgeText = ensureAPCATextColor('#0f172a', badgeBackground, 11, 600);
  const ctaBackground = primaryPalette.solid;
  const ctaText = primaryPalette.textOnSolid;

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,

    neutralBackground,
    neutralSurface,
    neutralBorder,
    neutralText,
    mutedText,

    heading: primaryPalette.solid,
    sectionLabel: secondaryPalette.interactive,

    cardBackground: neutralSurface,
    cardBorder: neutralBorder,
    cardBorderHover: secondaryPalette.border,

    badgeBackground,
    badgeText,
    badgeBorder: secondaryPalette.border,

    salaryText: secondaryPalette.solid,
    metaText: secondaryPalette.interactive,

    ctaBackground,
    ctaText,
    ctaHoverBackground: shiftColor(ctaBackground, -0.08, 1),

    tableHeaderBackground: secondaryPalette.surface,
    tableHeaderText: ensureAPCATextColor(secondaryPalette.interactive, secondaryPalette.surface, 13, 600),
    tableRowBorder: neutralBorder,

    timelineLine: neutralBorder,
    timelineDotBorder: primaryPalette.solid,
    timelineDotText: secondaryPalette.interactive,
    timelineDepartmentText: secondaryPalette.interactive,

    emptyIconBackground: withAlpha(primaryPalette.solid, 0.16),
    emptyIconColor: primaryPalette.solid,
  };
};

export const getCareerValidationResult = ({
  primary,
  secondary,
  mode,
  harmony = DEFAULT_CAREER_HARMONY,
}: {
  primary: string;
  secondary: string;
  mode: CareerBrandMode;
  harmony?: CareerHarmony;
}) => {
  const tokens = getCareerColorTokens({
    primary,
    secondary,
    mode,
    harmony,
  });

  const harmonyStatus = mode === 'single'
    ? { deltaE: 100, similarity: 0, isTooSimilar: false }
    : getHarmonyStatus(tokens.primary, tokens.secondary);

  const accessibility = getAccessibilityScore([
    { background: tokens.neutralSurface, text: tokens.heading, fontSize: 30, fontWeight: 700, label: 'heading' },
    { background: tokens.cardBackground, text: tokens.neutralText, fontSize: 16, fontWeight: 600, label: 'title' },
    { background: tokens.cardBackground, text: tokens.mutedText, fontSize: 14, fontWeight: 400, label: 'description' },
    { background: tokens.badgeBackground, text: tokens.badgeText, fontSize: 11, fontWeight: 600, label: 'badge' },
    { background: tokens.cardBackground, text: tokens.salaryText, fontSize: 14, fontWeight: 700, label: 'salary' },
    { background: tokens.ctaBackground, text: tokens.ctaText, fontSize: 14, fontWeight: 600, label: 'cta' },
  ]);

  return {
    tokens,
    resolvedSecondary: tokens.secondary,
    harmonyStatus,
    accessibility,
  };
};

export interface AccentElement {
  name: string;
  tier: 'S' | 'M' | 'L';
  areaPercent: number;
  isInteractive: boolean;
  color: 'primary' | 'secondary' | 'neutral';
}

export interface AccentBalance {
  primaryPercent: number;
  secondaryPercent: number;
  neutralPercent: number;
  elements: AccentElement[];
  rule: 'Lone' | 'Dual' | 'Triple' | 'Standard';
  warnings: string[];
}

export const calculateAccentBalance = (
  style: string,
  mode: CareerBrandMode,
): AccentBalance => {
  const elements: AccentElement[] = [];
  
  // Phân tích theo style
  if (style === 'cards') {
    elements.push(
      { name: 'Section heading', tier: 'S', areaPercent: 8, isInteractive: false, color: 'primary' },
      { name: 'CTA buttons', tier: 'M', areaPercent: 18, isInteractive: true, color: 'primary' },
      { name: 'Department badges', tier: 'L', areaPercent: 6, isInteractive: false, color: 'secondary' },
      { name: 'Salary text', tier: 'L', areaPercent: 4, isInteractive: false, color: 'secondary' },
      { name: 'Meta text', tier: 'L', areaPercent: 4, isInteractive: false, color: 'secondary' },
      { name: 'Card borders hover', tier: 'L', areaPercent: 2, isInteractive: true, color: 'secondary' },
    );
  } else if (style === 'list') {
    elements.push(
      { name: 'Section heading', tier: 'S', areaPercent: 8, isInteractive: false, color: 'primary' },
      { name: 'CTA buttons', tier: 'M', areaPercent: 15, isInteractive: true, color: 'primary' },
      { name: 'Department badges', tier: 'L', areaPercent: 5, isInteractive: false, color: 'secondary' },
      { name: 'Salary text', tier: 'L', areaPercent: 5, isInteractive: false, color: 'secondary' },
      { name: 'Dividers', tier: 'L', areaPercent: 2, isInteractive: false, color: 'secondary' },
    );
  } else if (style === 'timeline') {
    elements.push(
      { name: 'Section heading', tier: 'S', areaPercent: 8, isInteractive: false, color: 'primary' },
      { name: 'Timeline dots', tier: 'M', areaPercent: 8, isInteractive: false, color: 'primary' },
      { name: 'Department text', tier: 'L', areaPercent: 6, isInteractive: false, color: 'secondary' },
      { name: 'Timeline dot text', tier: 'L', areaPercent: 4, isInteractive: false, color: 'secondary' },
      { name: 'CTA buttons', tier: 'M', areaPercent: 12, isInteractive: true, color: 'primary' },
    );
  } else {
    // Default estimate cho các style khác
    elements.push(
      { name: 'Section heading', tier: 'S', areaPercent: 8, isInteractive: false, color: 'primary' },
      { name: 'CTA/Interactive', tier: 'M', areaPercent: 15, isInteractive: true, color: 'primary' },
      { name: 'Badges/Labels', tier: 'L', areaPercent: 8, isInteractive: false, color: 'secondary' },
      { name: 'Accents', tier: 'L', areaPercent: 4, isInteractive: false, color: 'secondary' },
    );
  }

  // Tính tổng
  const primaryPercent = elements
    .filter((e) => e.color === 'primary')
    .reduce((sum, e) => sum + e.areaPercent, 0);
  
  const secondaryPercent = mode === 'single' 
    ? 0 
    : elements
        .filter((e) => e.color === 'secondary')
        .reduce((sum, e) => sum + e.areaPercent, 0);
  
  const neutralPercent = 100 - primaryPercent - secondaryPercent;

  // Xác định rule
  const accentCount = elements.filter((e) => e.color !== 'neutral').length;
  let rule: AccentBalance['rule'] = 'Standard';
  if (accentCount === 1) {rule = 'Lone';}
  else if (accentCount === 2) {rule = 'Dual';}
  else if (accentCount === 3) {rule = 'Triple';}

  // Warnings
  const warnings: string[] = [];
  if (primaryPercent < 25) {
    warnings.push(`Primary ${primaryPercent}% < 25% (cần tăng visual weight)`);
  }
  if (mode === 'dual' && secondaryPercent < 5) {
    warnings.push(`Secondary ${secondaryPercent}% < 5% (quá nhỏ, cần element lớn hơn)`);
  }
  if (neutralPercent < 50) {
    warnings.push(`Neutral ${neutralPercent}% < 50% (thiếu whitespace)`);
  }

  return {
    primaryPercent,
    secondaryPercent,
    neutralPercent,
    elements,
    rule,
    warnings,
  };
};
