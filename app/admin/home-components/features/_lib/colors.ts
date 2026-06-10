import { formatHex, oklch } from 'culori';
import type { FeaturesBrandMode } from '../_types';

const DEFAULT_PRIMARY = '#3b82f6';

const safeParseOklch = (value: string) => {
  const parsed = oklch(value);
  if (parsed) {return parsed;}
  return oklch(DEFAULT_PRIMARY);
};

const isValidHexColor = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

const normalizeHexColor = (value: string, fallback = DEFAULT_PRIMARY) => {
  if (typeof value !== 'string') {return fallback;}
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
  }
  if (isValidHexColor(trimmed)) {
    return trimmed.toLowerCase();
  }
  return fallback;
};

const getAutoSecondary = (primary: string) => {
  const parsed = safeParseOklch(primary);
  if (!parsed) {return DEFAULT_PRIMARY;}

  const hue = parsed.h ?? 0;
  const shiftedHue = (hue + 30) % 360;

  return formatHex(oklch({
    ...parsed,
    h: shiftedHue,
  }));
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getSolidTint = (hex: string, lightnessOffset: number, chromaScale = 0.28) => {
  const parsed = safeParseOklch(hex);
  if (!parsed) {return '#f8fafc';}

  return formatHex(oklch({
    ...parsed,
    l: clamp(parsed.l + lightnessOffset, 0, 0.98),
    c: clamp((parsed.c ?? 0) * chromaScale, 0.01, 0.08),
  }));
};

const getSolidShade = (hex: string, lightnessOffset: number, chromaScale = 0.85) => {
  const parsed = safeParseOklch(hex);
  if (!parsed) {return '#0f172a';}

  return formatHex(oklch({
    ...parsed,
    l: clamp(parsed.l - lightnessOffset, 0.18, 0.72),
    c: clamp((parsed.c ?? 0) * chromaScale, 0.02, 0.18),
  }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: FeaturesBrandMode,
): string => {
  const normalizedPrimary = normalizeHexColor(primary, DEFAULT_PRIMARY);
  if (mode === 'single') {
    return normalizedPrimary;
  }

  const normalizedSecondary = normalizeHexColor(secondary, '');
  if (normalizedSecondary) {return normalizedSecondary;}
  return getAutoSecondary(normalizedPrimary);
};

export interface FeaturesColorTokens {
  primary: string;
  secondary: string;
  sectionBackground: string;
  cardBackground: string;
  cardBorder: string;
  cardBorderHover: string;
  heading: string;
  body: string;
  muted: string;
  badgeBackground: string;
  badgeText: string;
  iconChipBackground: string;
  iconChipText: string;
  timelineLine: string;
  timelineDot: string;
  sectionRule: string;
  actionText: string;
  neutralBorder: string;
  carouselBackground: string;
  carouselCardBackground: string;
  carouselCardBorder: string;
  carouselText: string;
  carouselMuted: string;
  carouselIconBackground: string;
  carouselIconText: string;
  carouselNavText: string;
}

export const getFeaturesColorTokens = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: FeaturesBrandMode;
}): FeaturesColorTokens => {
  const normalizedPrimary = normalizeHexColor(primary, DEFAULT_PRIMARY);
  const secondaryResolved = resolveSecondaryForMode(normalizedPrimary, secondary, mode);

  return {
    primary: normalizedPrimary,
    secondary: secondaryResolved,
    sectionBackground: '#ffffff',
    cardBackground: '#ffffff',
    cardBorder: '#e2e8f0',
    cardBorderHover: '#cbd5e1',
    heading: normalizedPrimary,
    body: '#0f172a',
    muted: '#64748b',
    badgeBackground: getSolidTint(secondaryResolved, 0.38),
    badgeText: secondaryResolved,
    iconChipBackground: getSolidTint(normalizedPrimary, 0.38),
    iconChipText: normalizedPrimary,
    timelineLine: getSolidTint(secondaryResolved, 0.28),
    timelineDot: secondaryResolved,
    sectionRule: '#e2e8f0',
    actionText: normalizedPrimary,
    neutralBorder: '#e2e8f0',
    carouselBackground: getSolidTint(secondaryResolved, 0.36, 0.22),
    carouselCardBackground: '#ffffff',
    carouselCardBorder: '#e2e8f0',
    carouselText: getSolidShade(normalizedPrimary, 0.16),
    carouselMuted: '#475569',
    carouselIconBackground: normalizedPrimary,
    carouselIconText: '#ffffff',
    carouselNavText: normalizedPrimary,
  };
};

