import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
import type {
  PricingBrandMode,
} from '../_types';

const DEFAULT_BRAND_COLOR = '#3b82f6';
const FALLBACK_TEXT = '#0f172a';

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);
const clampChroma = (value: number) => Math.min(Math.max(value, 0.02), 0.35);

const safeParseOklch = (value: string, fallback: string) => (
  oklch(value) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR)
);

const normalizeHex = (value: string, fallback: string) => {
  const candidate = value.trim().length > 0 ? value.trim() : fallback;
  return formatHex(safeParseOklch(candidate, fallback));
};

const isValidHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value.trim());

const shiftColor = (hex: string, lightnessDelta: number, chromaScale = 1, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  return formatHex(oklch({
    ...color,
    l: clampLightness((color.l ?? 0.62) + lightnessDelta),
    c: clampChroma((color.c ?? 0.14) * chromaScale),
  }));
};

const getAPCAThreshold = (fontSize = 16, fontWeight = 500) => (
  fontSize >= 18 || fontWeight >= 600 ? 45 : 60
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

const pickReadableTextOnSolid = (solidBg: string): string => {
  const whiteLc = getAPCALc('#ffffff', solidBg);
  const darkLc = getAPCALc('#111111', solidBg);
  return whiteLc >= darkLc ? '#ffffff' : '#111111';
};

export const getAPCATextColor = (background: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', background);
  const darkLc = getAPCALc(FALLBACK_TEXT, background);
  const threshold = getAPCAThreshold(fontSize, fontWeight);

  if (whiteLc >= threshold) {return '#ffffff';}
  if (darkLc >= threshold) {return FALLBACK_TEXT;}
  return whiteLc >= darkLc ? '#ffffff' : FALLBACK_TEXT;
};

export const ensureAPCATextColor = (
  preferred: string,
  background: string,
  fontSize = 16,
  fontWeight = 500,
) => {
  const preferredNormalized = normalizeHex(preferred, FALLBACK_TEXT);
  const threshold = getAPCAThreshold(fontSize, fontWeight);
  const preferredLc = getAPCALc(preferredNormalized, background);

  if (preferredLc >= threshold) {
    return preferredNormalized;
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
  mode: PricingBrandMode,
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

interface PricingPalette {
  solid: string;
  textOnSolid: string;
  surface: string;
  border: string;
  hoverSurface: string;
  activeSurface: string;
  interactiveText: string;
}

const buildPalette = (hex: string, fallback = DEFAULT_BRAND_COLOR): PricingPalette => {
  const solid = normalizeHex(hex, fallback);
  const surface = shiftColor(solid, 0.34, 0.78, fallback);
  const border = shiftColor(solid, 0.2, 0.7, fallback);
  const hoverSurface = shiftColor(solid, 0.28, 0.82, fallback);
  const activeSurface = shiftColor(solid, 0.22, 0.88, fallback);

  const textOnSolidCandidate = pickReadableTextOnSolid(solid);
  const textOnSolid = ensureAPCATextColor(textOnSolidCandidate, solid, 14, 600);

  return {
    solid,
    textOnSolid,
    surface,
    border,
    hoverSurface,
    activeSurface,
    interactiveText: ensureAPCATextColor(shiftColor(solid, -0.18, 0.95, fallback), surface, 14, 500),
  };
};

export interface PricingColorTokens {
  primary: string;
  secondary: string;

  neutralBackground: string;
  neutralSurface: string;
  neutralBorder: string;
  neutralText: string;
  mutedText: string;

  headingText: string;
  subtitleText: string;

  cardBackground: string;
  cardBorder: string;
  cardPopularBorder: string;

  priceText: string;
  periodText: string;

  featureText: string;
  featureIcon: string;

  badgeSolidBg: string;
  badgeSolidText: string;
  badgeSoftBg: string;
  badgeSoftBorder: string;
  badgeSoftText: string;
  badgeSoftOnHeaderBg: string;
  badgeSoftOnHeaderText: string;
  badgeSoftOnPopularBg: string;
  badgeSoftOnPopularText: string;

  ctaSolidBg: string;
  ctaSolidText: string;
  ctaSolidHoverBg: string;

  ctaGhostBg: string;
  ctaGhostBorder: string;
  ctaGhostText: string;
  ctaGhostHoverBg: string;

  comparisonHeaderBg: string;
  comparisonAltRowBg: string;
  comparisonPopularColumnBg: string;

  toggleTrackOff: string;
  toggleTrackOn: string;
  toggleThumb: string;
  toggleActiveLabel: string;
  toggleInactiveLabel: string;
}

export interface PricingHarmonyStatus {
  deltaE: number;
  similarity: number;
  isTooSimilar: boolean;
}

export interface PricingAccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

export interface PricingAccessibilityScore {
  minLc: number;
  failing: Array<PricingAccessibilityPair & { lc: number; threshold: number }>;
}

export const getHarmonyStatus = (primary: string, secondary: string): PricingHarmonyStatus => {
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

export const getPricingAccessibilityScore = (
  pairs: PricingAccessibilityPair[],
): PricingAccessibilityScore => {
  const failing: PricingAccessibilityScore['failing'] = [];
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

export const getPricingColorTokens = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: PricingBrandMode;
}): PricingColorTokens => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);

  const primaryPalette = buildPalette(primaryResolved, DEFAULT_BRAND_COLOR);
  const secondaryPalette = buildPalette(secondaryResolved, primaryResolved);

  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralBorder = '#111111';
  const neutralText = FALLBACK_TEXT;
  const mutedText = '#64748b';

  const comparisonHeaderBg = '#f1f5f9';
  const comparisonPopularColumnBg = neutralSurface;

  const badgeSoftBg = neutralSurface;
  const badgeSoftBorder = neutralBorder;
  const badgeSoftText = ensureAPCATextColor(secondaryPalette.solid, badgeSoftBg, 11, 600);

  const badgeSoftOnHeaderText = ensureAPCATextColor(secondaryPalette.solid, comparisonHeaderBg, 10, 600);

  const badgeSoftOnPopularText = ensureAPCATextColor(secondaryPalette.solid, comparisonPopularColumnBg, 10, 600);

  const ctaGhostBg = neutralSurface;

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,

    neutralBackground,
    neutralSurface,
    neutralBorder,
    neutralText,
    mutedText,

    headingText: primaryPalette.solid,
    subtitleText: secondaryPalette.interactiveText,

    cardBackground: neutralSurface,
    cardBorder: neutralBorder,
    cardPopularBorder: neutralBorder,

    priceText: secondaryPalette.solid,
    periodText: mutedText,

    featureText: neutralText,
    featureIcon: ensureAPCATextColor(secondaryPalette.solid, neutralSurface, 14, 500),

    badgeSolidBg: primaryPalette.solid,
    badgeSolidText: primaryPalette.textOnSolid,
    badgeSoftBg,
    badgeSoftBorder,
    badgeSoftText,
    badgeSoftOnHeaderBg: comparisonHeaderBg,
    badgeSoftOnHeaderText,
    badgeSoftOnPopularBg: comparisonPopularColumnBg,
    badgeSoftOnPopularText,

    ctaSolidBg: primaryPalette.solid,
    ctaSolidText: primaryPalette.textOnSolid,
    ctaSolidHoverBg: primaryPalette.activeSurface,

    ctaGhostBg,
    ctaGhostBorder: neutralBorder,
    ctaGhostText: ensureAPCATextColor(secondaryPalette.solid, ctaGhostBg, 14, 600),
    ctaGhostHoverBg: secondaryPalette.surface,

    comparisonHeaderBg,
    comparisonAltRowBg: '#f8fafc',
    comparisonPopularColumnBg,

    toggleTrackOff: '#cbd5e1',
    toggleTrackOn: primaryPalette.solid,
    toggleThumb: '#ffffff',
    toggleActiveLabel: neutralText,
    toggleInactiveLabel: mutedText,
  };
};

export const getPricingValidationResult = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: PricingBrandMode;
}) => {
  const tokens = getPricingColorTokens({
    primary,
    secondary,
    mode,
  });

  const harmonyStatus = mode === 'single'
    ? { deltaE: 100, similarity: 0, isTooSimilar: false }
    : getHarmonyStatus(tokens.primary, tokens.secondary);

  const accessibility = getPricingAccessibilityScore([
    { background: tokens.neutralSurface, text: tokens.headingText, fontSize: 30, fontWeight: 700, label: 'heading' },
    { background: tokens.neutralSurface, text: tokens.subtitleText, fontSize: 14, fontWeight: 500, label: 'subtitle' },
    { background: tokens.cardBackground, text: tokens.priceText, fontSize: 24, fontWeight: 700, label: 'price' },
    { background: tokens.neutralSurface, text: tokens.featureIcon, fontSize: 14, fontWeight: 500, label: 'feature-icon' },
    { background: tokens.badgeSolidBg, text: tokens.badgeSolidText, fontSize: 11, fontWeight: 700, label: 'badge-solid' },
    { background: tokens.badgeSoftBg, text: tokens.badgeSoftText, fontSize: 11, fontWeight: 600, label: 'badge-soft' },
    { background: tokens.badgeSoftOnHeaderBg, text: tokens.badgeSoftOnHeaderText, fontSize: 10, fontWeight: 600, label: 'badge-soft-header' },
    { background: tokens.badgeSoftOnPopularBg, text: tokens.badgeSoftOnPopularText, fontSize: 10, fontWeight: 600, label: 'badge-soft-popular' },
    { background: tokens.ctaSolidBg, text: tokens.ctaSolidText, fontSize: 14, fontWeight: 600, label: 'cta-solid' },
    { background: tokens.ctaGhostBg, text: tokens.ctaGhostText, fontSize: 14, fontWeight: 600, label: 'cta-ghost' },
  ]);

  return {
    tokens,
    harmonyStatus,
    accessibility,
    resolvedSecondary: tokens.secondary,
  };
};
