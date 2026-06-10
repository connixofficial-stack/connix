'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';

export interface HeroColorScheme {
  primarySolid: string;
  primaryHover: string;
  primaryTintSubtle: string;
  primaryTintLight: string;
  primaryTintMedium: string;
  secondarySolid: string;
  secondaryTintVeryLight: string;
  secondaryTintLight: string;
  secondaryTintMedium: string;
  secondaryTintStrong: string;
  secondaryTintRing: string;
  overlayGradient: string;
  brandGradient: string;
}

export interface SliderColorScheme {
  navButtonBg: string;
  navButtonBgHover: string;
  navButtonIconColor: string;
  navButtonBorderColor: string;
  navButtonOuterRing: string;
  dotActive: string;
  dotInactive: string;
  progressBarActive: string;
  progressBarInactive: string;
  hoverRingColor: string;
  placeholderBg: string;
  placeholderIconColor: string;
  similarity: number;
}

export interface FadeColorScheme {
  thumbnailBorderActive: string;
  thumbnailBorderInactive: string;
  placeholderBg: string;
  placeholderIconColor: string;
  similarity: number;
}

export interface BentoColorScheme {
  mainImageRing: string;
  gridTint1: string;
  gridTint2: string;
  gridTint3: string;
  gridTint4: string;
  placeholderIcon: string;
  similarity: number;
}

export interface FullscreenColorScheme {
  badgeBg: string;
  badgeText: string;
  badgeDotPulse: string;
  primaryCTA: string;
  primaryCTAText: string;
  dotActive: string;
  dotInactive: string;
  placeholderBg: string;
  placeholderIcon: string;
  similarity: number;
}

export interface ConquestColorScheme {
  sectionBg: string;
  sectionText: string;
  descriptionText: string;
  accentSolid: string;
  accentMuted: string;
  badgeBg: string;
  badgeText: string;
  primaryCTA: string;
  primaryCTAText: string;
  secondaryCTA: string;
  secondaryCTAText: string;
  pillarGradient: string;
  baseGradient: string;
  dotActive: string;
  dotInactive: string;
  placeholderBg: string;
  placeholderIcon: string;
  similarity: number;
}

export interface SplitColorScheme {
  contentBg: string;
  headingText: string;
  descriptionText: string;
  badgeBg: string;
  badgeText: string;
  primaryCTA: string;
  primaryCTAText: string;
  navButtonIcon: string;
  navButtonBg: string;
  navButtonOuterRing: string;
  progressDotActive: string;
  progressDotInactive: string;
  similarity: number;
}

export interface ParallaxColorScheme {
  cardBg: string;
  headingText: string;
  descriptionText: string;
  countdownText: string;
  cardBadgeBg: string;
  cardBadgeText: string;
  cardBadgeDot: string;
  primaryCTA: string;
  primaryCTAText: string;
  navButtonBg: string;
  navButtonIcon: string;
  navButtonOuterRing: string;
  placeholderBg: string;
  placeholderIcon: string;
  similarity: number;
}

const toRgbTuple = (value: string, fallback: string): [number, number, number] | null => {
  const parsed = oklch(value) ?? oklch(fallback) ?? oklch('#3b82f6');
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

export const generatePalette = (hex: string) => {
  const color = oklch(hex);
  return {
    solid: hex,
    surface: formatHex(oklch({ ...color, l: Math.min(color.l + 0.4, 0.98) })),
    hover: formatHex(oklch({ ...color, l: Math.max(color.l - 0.1, 0.1) })),
    active: formatHex(oklch({ ...color, l: Math.max(color.l - 0.15, 0.08) })),
    border: formatHex(oklch({ ...color, l: Math.min(color.l + 0.3, 0.92) })),
    disabled: formatHex(oklch({ ...color, l: Math.min(color.l + 0.25, 0.9), c: color.c * 0.5 })),
    textOnSolid: getAPCATextColor(hex, 16, 500),
    textInteractive: formatHex(oklch({ ...color, l: Math.max(color.l - 0.25, 0.2) })),
  };
};

export const getAnalogous = (hex: string): [string, string] => {
  const color = oklch(hex);
  return [
    formatHex(oklch({ ...color, h: (color.h + 30) % 360 })),
    formatHex(oklch({ ...color, h: (color.h - 30 + 360) % 360 })),
  ];
};

const resolveSecondaryColor = (
  primary: string,
  secondary: string,
  mode: 'single' | 'dual',
) => {
  if (mode === 'single') {
    return getAnalogous(primary)[0];
  }

  return secondary;
};

const getSimilarity = (primary: string, secondary: string) => (
  1 - Math.min(differenceEuclidean('oklch')(primary, secondary), 1)
);

const getNavIndicatorColors = (baseColor: string) => {
  const color = oklch(baseColor);
  const isLight = color.l >= 0.65;

  if (isLight) {
    return {
      bg: '#0f172a',
      icon: '#ffffff',
      ring: '#ffffff',
    };
  }

  return {
    bg: '#ffffff',
    icon: baseColor,
    ring: '#0f172a',
  };
};

const getAdaptiveContentSurface = (baseColor: string) => {
  const color = oklch(baseColor);
  return color.l < 0.55 ? '#0f172a' : '#f8fafc';
};

export function getSliderColors(
  primary: string,
  secondary: string,
  mode: 'single' | 'dual',
): SliderColorScheme {
  const secondaryColor = resolveSecondaryColor(primary, secondary, mode);

  const primaryPalette = generatePalette(primary);
  const secondaryPalette = generatePalette(secondaryColor);
  const similarity = getSimilarity(primary, secondaryColor);
  const navBase = mode === 'dual' ? secondaryPalette.solid : primaryPalette.solid;
  const navIndicator = getNavIndicatorColors(navBase);
  const dotActive = mode === 'dual' ? secondaryPalette.solid : primaryPalette.solid;
  const navIconColor = getAPCATextColor(navIndicator.bg, 16, 700);

  return {
    navButtonBg: navIndicator.bg,
    navButtonBgHover: navIndicator.bg,
    navButtonIconColor: navIconColor,
    navButtonBorderColor: 'transparent',
    navButtonOuterRing: navIndicator.ring,
    dotActive,
    dotInactive: 'rgba(255, 255, 255, 0.5)',
    progressBarActive: primaryPalette.solid,
    progressBarInactive: 'rgba(255, 255, 255, 0.2)',
    hoverRingColor: primaryPalette.solid,
    placeholderBg: '#f1f5f9',
    placeholderIconColor: primaryPalette.solid,
    similarity,
  };
}

export function getFadeColors(
  primary: string,
  secondary: string,
  mode: 'single' | 'dual',
): FadeColorScheme {
  const secondaryColor = resolveSecondaryColor(primary, secondary, mode);
  const primaryPalette = generatePalette(primary);

  return {
    thumbnailBorderActive: primaryPalette.solid,
    thumbnailBorderInactive: 'transparent',
    placeholderBg: '#f1f5f9',
    placeholderIconColor: primaryPalette.solid,
    similarity: getSimilarity(primary, secondaryColor),
  };
}

export function getBentoColors(
  primary: string,
  secondary: string,
  mode: 'single' | 'dual',
): BentoColorScheme {
  const secondaryColor = resolveSecondaryColor(primary, secondary, mode);
  const primaryColor = oklch(primary);
  const secondaryColorValue = oklch(secondaryColor);
  const getPrimaryTint = (lightness: number) => formatHex(oklch({ ...primaryColor, l: Math.min(primaryColor.l + lightness, 0.98) }));
  const getSecondaryTint = (lightness: number) => formatHex(oklch({ ...secondaryColorValue, l: Math.min(secondaryColorValue.l + lightness, 0.98) }));

  return {
    mainImageRing: getSecondaryTint(0.35),
    gridTint1: getPrimaryTint(0.4),
    gridTint2: getPrimaryTint(0.35),
    gridTint3: getPrimaryTint(0.3),
    gridTint4: getPrimaryTint(0.25),
    placeholderIcon: primary,
    similarity: getSimilarity(primary, secondaryColor),
  };
}

export function getFullscreenColors(
  primary: string,
  secondary: string,
  mode: 'single' | 'dual',
): FullscreenColorScheme {
  const secondaryColor = resolveSecondaryColor(primary, secondary, mode);
  const secondaryPalette = generatePalette(secondaryColor);
  const secondaryColorValue = oklch(secondaryColor);
  const getSecondaryTint = (lightness: number) => formatHex(oklch({ ...secondaryColorValue, l: Math.min(secondaryColorValue.l + lightness, 0.98) }));
  const dotActive = mode === 'dual' ? secondaryPalette.solid : primary;

  return {
    badgeBg: getSecondaryTint(0.3),
    badgeText: getAPCATextColor(getSecondaryTint(0.3), 12, 500),
    badgeDotPulse: primary,
    primaryCTA: primary,
    primaryCTAText: getAPCATextColor(primary, 16, 600),
    dotActive,
    dotInactive: 'rgba(255, 255, 255, 0.5)',
    placeholderBg: '#f1f5f9',
    placeholderIcon: primary,
    similarity: getSimilarity(primary, secondaryColor),
  };
}

export function getConquestColors(
  primary: string,
  secondary: string,
  mode: 'single' | 'dual',
): ConquestColorScheme {
  const secondaryColor = mode === 'dual' ? resolveSecondaryColor(primary, secondary, mode) : primary;
  const primaryPalette = generatePalette(primary);
  const secondaryPalette = generatePalette(secondaryColor);
  const similarity = getSimilarity(primary, secondaryColor);
  const sectionBg = primary;
  const sectionText = getAPCATextColor(sectionBg, 32, 700);
  const neutralSolid = sectionText === '#ffffff' ? '#ffffff' : '#111827';
  const neutralMuted = sectionText === '#ffffff' ? '#d4d4d8' : '#797979';
  const neutralSoft = sectionText === '#ffffff' ? '#71717a' : '#d4d4d8';
  const canUseDual = mode === 'dual' && similarity < 0.92;
  const ctaBg = canUseDual ? secondaryPalette.solid : neutralSolid;
  const badgeBg = canUseDual ? secondaryPalette.solid : neutralSolid;

  return {
    sectionBg,
    sectionText,
    descriptionText: sectionText === '#ffffff' ? 'rgba(255,255,255,0.82)' : 'rgba(15,23,42,0.78)',
    accentSolid: neutralSolid,
    accentMuted: neutralMuted,
    badgeBg,
    badgeText: getAPCATextColor(badgeBg, 12, 600),
    primaryCTA: ctaBg,
    primaryCTAText: getAPCATextColor(ctaBg, 16, 600),
    secondaryCTA: sectionBg,
    secondaryCTAText: sectionText,
    pillarGradient: `linear-gradient(180deg, ${neutralSolid} 0%, ${neutralMuted} 100%)`,
    baseGradient: `linear-gradient(180deg, ${neutralMuted} 0%, ${neutralSoft} 100%)`,
    dotActive: ctaBg,
    dotInactive: sectionText === '#ffffff' ? 'rgba(255,255,255,0.42)' : 'rgba(15,23,42,0.28)',
    placeholderBg: primaryPalette.surface,
    placeholderIcon: ctaBg,
    similarity,
  };
}

export function getSplitColors(
  primary: string,
  secondary: string,
  mode: 'single' | 'dual',
): SplitColorScheme {
  const secondaryColor = resolveSecondaryColor(primary, secondary, mode);
  const primaryPalette = generatePalette(primary);
  const secondaryPalette = generatePalette(secondaryColor);
  const secondaryColorValue = oklch(secondaryColor);
  const getSecondaryTint = (lightness: number) => formatHex(oklch({ ...secondaryColorValue, l: Math.min(secondaryColorValue.l + lightness, 0.98) }));
  const navBase = mode === 'dual' ? secondaryPalette.solid : primaryPalette.solid;
  const navIndicator = getNavIndicatorColors(navBase);
  const progressDotActive = mode === 'dual' ? secondaryPalette.solid : primaryPalette.solid;
  const contentBg = getAdaptiveContentSurface(primary);

  return {
    contentBg,
    headingText: getAPCATextColor(contentBg, 28, 700),
    descriptionText: getAPCATextColor(contentBg, 16, 500),
    badgeBg: getSecondaryTint(0.4),
    badgeText: getAPCATextColor(getSecondaryTint(0.4), 12, 600),
    primaryCTA: primary,
    primaryCTAText: getAPCATextColor(primary, 16, 600),
    navButtonIcon: navIndicator.icon,
    navButtonBg: navIndicator.bg,
    navButtonOuterRing: navIndicator.ring,
    progressDotActive,
    progressDotInactive: '#cbd5e1',
    similarity: getSimilarity(primary, secondaryColor),
  };
}

export function getParallaxColors(
  primary: string,
  secondary: string,
  mode: 'single' | 'dual',
): ParallaxColorScheme {
  const secondaryColor = resolveSecondaryColor(primary, secondary, mode);
  const primaryPalette = generatePalette(primary);
  const secondaryPalette = generatePalette(secondaryColor);
  const secondaryColorValue = oklch(secondaryColor);
  const getSecondaryTint = (lightness: number) => formatHex(oklch({ ...secondaryColorValue, l: Math.min(secondaryColorValue.l + lightness, 0.98) }));
  const navBase = mode === 'dual' ? secondaryPalette.solid : primaryPalette.solid;
  const navIndicator = getNavIndicatorColors(navBase);
  const cardBg = getAdaptiveContentSurface(primary);

  return {
    cardBg,
    headingText: getAPCATextColor(cardBg, 20, 700),
    descriptionText: getAPCATextColor(cardBg, 14, 500),
    countdownText: getAPCATextColor(cardBg, 14, 500),
    cardBadgeBg: getSecondaryTint(0.4),
    cardBadgeText: getAPCATextColor(getSecondaryTint(0.4), 12, 600),
    cardBadgeDot: primary,
    primaryCTA: primary,
    primaryCTAText: getAPCATextColor(primary, 14, 600),
    navButtonBg: navIndicator.bg,
    navButtonIcon: navIndicator.icon,
    navButtonOuterRing: navIndicator.ring,
    placeholderBg: '#f1f5f9',
    placeholderIcon: primary,
    similarity: getSimilarity(primary, secondaryColor),
  };
}

export function getHeroColors(
  primary: string,
  secondary: string,
  useDualBrand: boolean,
): HeroColorScheme {
  const secondaryBase = useDualBrand ? secondary : primary;
  const primaryPalette = generatePalette(primary);
  const primaryColor = oklch(primary);
  const secondaryColor = oklch(secondaryBase);
  const getPrimaryTint = (lightness: number) => formatHex(oklch({ ...primaryColor, l: Math.min(primaryColor.l + lightness, 0.98) }));
  const getSecondaryTint = (lightness: number) => formatHex(oklch({ ...secondaryColor, l: Math.min(secondaryColor.l + lightness, 0.98) }));
  const overlayGradient = 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)';
  const brandGradient = useDualBrand
    ? `linear-gradient(135deg, ${getPrimaryTint(0.4)} 0%, ${getSecondaryTint(0.35)} 100%)`
    : `linear-gradient(135deg, ${getPrimaryTint(0.4)} 0%, ${getPrimaryTint(0.25)} 100%)`;

  return {
    primarySolid: primary,
    primaryHover: primaryPalette.hover,
    primaryTintSubtle: getPrimaryTint(0.4),
    primaryTintLight: getPrimaryTint(0.45),
    primaryTintMedium: getPrimaryTint(0.35),
    secondarySolid: secondaryBase,
    secondaryTintVeryLight: getSecondaryTint(useDualBrand ? 0.45 : 0.42),
    secondaryTintLight: getSecondaryTint(useDualBrand ? 0.4 : 0.38),
    secondaryTintMedium: getSecondaryTint(useDualBrand ? 0.3 : 0.35),
    secondaryTintStrong: getSecondaryTint(useDualBrand ? 0.25 : 0.3),
    secondaryTintRing: getSecondaryTint(useDualBrand ? 0.15 : 0.25),
    overlayGradient,
    brandGradient,
  };
}
