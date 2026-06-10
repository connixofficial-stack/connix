'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';
import type {
  VideoBrandMode,
  VideoProvider,
  VideoStyle,
} from '../_types';

const DEFAULT_BRAND_COLOR = '#3b82f6';

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);

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

const pickReadableTextOnSolid = (background: string): string => {
  const whiteLc = getAPCALc('#ffffff', background);
  const nearBlackLc = getAPCALc('#111111', background);
  return whiteLc > nearBlackLc ? '#ffffff' : '#111111';
};

export const getAPCATextColor = (background: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', background);
  const blackLc = getAPCALc('#000000', background);
  const threshold = getAPCAThreshold(fontSize, fontWeight);

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc > blackLc ? '#ffffff' : '#0f172a';
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

const getSolidTint = (hex: string, lightnessIncrease = 0.42) => {
  const color = safeParseOklch(hex, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, l: clampLightness((color.l ?? 0.6) + lightnessIncrease) }));
};

const withAlpha = (hex: string, alpha: number, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  const l = clampLightness(color.l ?? 0.6);
  const c = Math.max(0, Math.min(color.c ?? 0.1, 0.4));
  const h = Number.isFinite(color.h) ? color.h : 0;
  const a = Math.max(0, Math.min(alpha, 1));
  return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(3)} ${h.toFixed(2)} / ${a.toFixed(3)})`;
};

export const getHarmonyColor = (primary: string) => {
  const color = safeParseOklch(primary, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 30) % 360 }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: VideoBrandMode,
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

export interface VideoColorTokens {
  primary: string;
  secondary: string;
  heading: string;
  bodyText: string;
  mutedText: string;
  neutralBackground: string;
  neutralSurface: string;
  neutralBorder: string;
  videoSurface: string;
  videoPlaceholder: string;
  sectionOverlay: string;
  badgeBackground: string;
  badgeText: string;
  badgeBorder: string;
  ctaBackground: string;
  ctaText: string;
  ctaBorder: string;
  ctaHover: string;
  iconSurface: string;
  iconText: string;
  frameBackground: string;
  playButtonBackground: string;
  playButtonText: string;
  playButtonHover: string;
  cardBackground: string;
  cardBorder: string;
  secondaryCtaBackground: string;
  secondaryCtaText: string;
  secondaryCtaHover: string;
  secondaryTextOnDark: string;
}

export const getVideoColorTokens = ({
  primary,
  secondary,
  mode,
  style: _style,
}: {
  primary: string;
  secondary: string;
  mode: VideoBrandMode;
  style: VideoStyle;
}): VideoColorTokens => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);

  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralBorder = '#e2e8f0';
  const darkFrameBackground = '#0f172a';

  // Text colors on neutral surfaces
  const headingOnNeutral = ensureAPCATextColor(primaryResolved, neutralSurface, 28, 700);
  const bodyOnNeutral = ensureAPCATextColor('#334155', neutralSurface, 16, 500);
  const mutedOnNeutral = ensureAPCATextColor('#64748b', neutralSurface, 14, 500);
  
  // Badge tokens (secondary accent)
  const badgeBackground = getSolidTint(secondaryResolved, 0.42);
  const badgeTextCandidate = pickReadableTextOnSolid(badgeBackground);
  const badgeText = ensureAPCATextColor(badgeTextCandidate, badgeBackground, 12, 700);
  
  // CTA tokens (primary action)
  const ctaBackground = primaryResolved;
  const ctaTextCandidate = pickReadableTextOnSolid(ctaBackground);
  const ctaText = ensureAPCATextColor(ctaTextCandidate, ctaBackground, 14, 600);
  
  // Hover states using OKLCH (no opacity)
  const primaryColor = safeParseOklch(primaryResolved, DEFAULT_BRAND_COLOR);
  const ctaHover = formatHex(oklch({ ...primaryColor, l: clampLightness((primaryColor.l ?? 0.6) - 0.12) }));
  const playButtonHover = formatHex(oklch({ ...primaryColor, l: clampLightness((primaryColor.l ?? 0.6) - 0.1) }));

  // Play button tokens (primary)
  const playButtonBackground = primaryResolved;
  const playButtonText = ensureAPCATextColor(pickReadableTextOnSolid(primaryResolved), primaryResolved, 18, 700);

  // Secondary button/link tokens (for secondary CTA if needed)
  const secondaryColor = safeParseOklch(secondaryResolved, DEFAULT_BRAND_COLOR);
  const secondaryCtaBackground = getSolidTint(secondaryResolved, 0.42);
  const secondaryCtaText = ensureAPCATextColor(secondaryResolved, neutralSurface, 14, 600);
  const secondaryCtaHover = formatHex(oklch({ ...secondaryColor, l: clampLightness((secondaryColor.l ?? 0.6) - 0.08) }));

  // Secondary text on dark background (tint để đủ sáng trên dark)
  const secondaryTextOnDark = formatHex(oklch({ ...secondaryColor, l: clampLightness((secondaryColor.l ?? 0.6) + 0.25), c: Math.max((secondaryColor.c ?? 0.1) * 1.1, 0.08) }));

  // Card tokens for parallax/minimal
  const cardBackground = neutralSurface;
  const _cardBorder = neutralBorder;

  // Accent border/decorative (secondary)
  const accentBorder = formatHex(oklch({ ...secondaryColor, l: clampLightness((secondaryColor.l ?? 0.6) + 0.35) }));

  // Overlay for fullwidth/cinema (functional only, reduced opacity)
  const sectionOverlay = withAlpha('#0f172a', 0.5, '#0f172a');

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,
    heading: headingOnNeutral,
    bodyText: bodyOnNeutral,
    mutedText: mutedOnNeutral,
    neutralBackground,
    neutralSurface,
    neutralBorder,
    videoSurface: darkFrameBackground,
    videoPlaceholder: getSolidTint(secondaryResolved, 0.44),
    sectionOverlay,
    badgeBackground,
    badgeText,
    badgeBorder: accentBorder,
    ctaBackground,
    ctaText,
    ctaBorder: neutralBorder,
    ctaHover,
    iconSurface: neutralSurface,
    iconText: primaryResolved,
    frameBackground: darkFrameBackground,
    playButtonBackground,
    playButtonText,
    playButtonHover,
    cardBackground,
    cardBorder: accentBorder,
    secondaryCtaBackground,
    secondaryCtaText,
    secondaryCtaHover,
    secondaryTextOnDark,
  };
};

const VIDEO_URL_MATCHERS: Array<{ type: VideoProvider; regex: RegExp }> = [
  { type: 'youtube', regex: /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?/]+)/ },
  { type: 'vimeo', regex: /vimeo\.com\/(?:video\/)?(\d+)/ },
  { type: 'drive', regex: /drive\.google\.com\/(?:file\/d\/|open\?id=)([^/&?]+)/ },
];

export const getVideoInfo = (url: string): { type: VideoProvider; id?: string } => {
  if (!url) {return { type: 'direct' };}

  for (const matcher of VIDEO_URL_MATCHERS) {
    const match = url.match(matcher.regex);
    if (match) {
      return { type: matcher.type, id: match[1] };
    }
  }

  return { type: 'direct' };
};

export const getYouTubeThumbnail = (videoId: string): string => `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
