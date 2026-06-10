import { apcaContrast } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';

export interface BrandPalette {
  solid: string;
  surface: string;
  active: string;
  border: string;
  disabled: string;
  textOnSolid: string;
  textInteractive: string;
}

export interface PlaceholderColors {
  background: string;
  icon: string;
  text: string;
}

export interface BrandColorsResult {
  primary: BrandPalette;
  secondary: BrandPalette;
  placeholder: PlaceholderColors;
  useDualBrand: boolean;
  similarity: number;
}

export type AccentTier = 'XL' | 'L' | 'M' | 'S';
export type AccentRole = 'primary' | 'secondary';

export interface AccentPoint {
  element: string;
  tier: AccentTier;
  interactive: boolean;
}

export interface AccentAreaPoint extends AccentPoint {
  area: number;
}

export interface AccentBalanceResult {
  primary: number;
  secondary: number;
  neutral: number;
  warnings: string[];
}

export interface AccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

export interface AccessibilityScore {
  minLc: number;
  failing: Array<AccessibilityPair & { lc: number; threshold: number }>;
}

export const getAPCATextColor = (bg: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = Math.abs(apcaContrast('#ffffff', bg));
  const blackLc = Math.abs(apcaContrast('#000000', bg));
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc > blackLc ? '#ffffff' : '#0f172a';
};

export const generatePalette = (hex: string): BrandPalette => {
  const color = oklch(hex);
  const surface = formatHex(oklch({ ...color, l: Math.min(color.l + 0.4, 0.98) }));
  const active = formatHex(oklch({ ...color, l: Math.max(color.l - 0.15, 0.08) }));
  const border = formatHex(oklch({ ...color, l: Math.min(color.l + 0.3, 0.92) }));
  const disabled = formatHex(oklch({ ...color, l: Math.min(color.l + 0.25, 0.9), c: color.c * 0.5 }));

  return {
    solid: hex,
    surface,
    active,
    border,
    disabled,
    textOnSolid: getAPCATextColor(hex, 16, 500),
    textInteractive: formatHex(oklch({ ...color, l: Math.max(color.l - 0.25, 0.2) })),
  };
};

export const getAnalogous = (hex: string): [string, string] => {
  const color = oklch(hex);
  return [
    formatHex(oklch({ ...color, h: (color.h + 30) % 360 })),
    formatHex(oklch({ ...color, h: (color.h - 30 + 360) % 360 }))
  ];
};

export const getTriadic = (hex: string): [string, string] => {
  const color = oklch(hex);
  return [
    formatHex(oklch({ ...color, h: (color.h + 120) % 360 })),
    formatHex(oklch({ ...color, h: (color.h - 120 + 360) % 360 }))
  ];
};

export const getComplementary = (hex: string) => {
  const color = oklch(hex);
  return formatHex(oklch({ ...color, h: (color.h + 180) % 360 }));
};

export const getPlaceholderColors = (primary: string): PlaceholderColors => ({
  background: '#f1f5f9',
  icon: primary,
  text: '#64748b',
});

export const getNavButtonColors = (
  brandColor: string,
  mode: 'single' | 'dual',
  secondaryColor?: string,
) => {
  const baseColor = mode === 'dual' && secondaryColor ? secondaryColor : brandColor;
  const iconColor = brandColor;
  const color = oklch(baseColor);
  const isLight = color.l >= 0.65;

  return {
    bg: isLight ? '#0f172a' : '#ffffff',
    icon: isLight ? '#ffffff' : iconColor,
    outerRing: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.3)',
    bgHover: isLight ? '#1e293b' : '#f8fafc',
  };
};

export const getBrandColors = (
  primary: string,
  secondary: string | undefined,
  mode: 'single' | 'dual',
  harmony: 'analogous' | 'complementary' | 'triadic' = 'analogous'
): BrandColorsResult => {
  let secondaryColor = secondary ?? primary;

  if (mode === 'single') {
    if (harmony === 'complementary') {
      secondaryColor = getComplementary(primary);
    } else if (harmony === 'triadic') {
      secondaryColor = getTriadic(primary)[0];
    } else {
      secondaryColor = getAnalogous(primary)[0];
    }
  }

  const similarity = 1 - Math.min(differenceEuclidean('oklch')(primary, secondaryColor), 1);
  const placeholder = getPlaceholderColors(primary);

  return {
    primary: generatePalette(primary),
    secondary: generatePalette(secondaryColor),
    placeholder,
    useDualBrand: mode === 'dual',
    similarity,
  };
};

export const getHarmonyStatus = (primary: string, secondary: string) => {
  const delta = differenceEuclidean('oklch')(primary, secondary);
  const deltaE = Math.round(delta * 100);
  return {
    deltaE,
    similarity: 1 - Math.min(delta, 1),
    isTooSimilar: deltaE < 20,
  };
};

export const getAccentDistribution = (
  accents: AccentPoint[],
): Map<string, AccentRole> => {
  const tierOrder: Record<AccentTier, number> = { XL: 4, L: 3, M: 2, S: 1 };
  const sorted = [...accents].sort((a, b) => {
    const tierDiff = tierOrder[b.tier] - tierOrder[a.tier];
    if (tierDiff !== 0) {return tierDiff;}
    return (b.interactive ? 1 : 0) - (a.interactive ? 1 : 0);
  });
  const result = new Map<string, AccentRole>();
  const count = accents.length;

  if (count <= 1) {
    sorted.forEach((accent) => result.set(accent.element, 'primary'));
    return result;
  }

  if (count === 2) {
    result.set(sorted[0].element, 'primary');
    result.set(sorted[1].element, 'secondary');
    return result;
  }

  if (count === 3) {
    result.set(sorted[0].element, 'primary');
    result.set(sorted[1].element, 'primary');
    result.set(sorted[2].element, 'secondary');
    return result;
  }

  const primaryCount = Math.ceil(count * 0.7);
  sorted.forEach((accent, index) => {
    result.set(accent.element, index < primaryCount ? 'primary' : 'secondary');
  });

  return result;
};

export const calculateAccentBalance = (
  accents: AccentAreaPoint[],
  assignments?: Map<string, AccentRole>,
  options?: {
    totalArea?: number;
    minPrimary?: number;
    minSecondary?: number;
  }
): AccentBalanceResult => {
  const totalArea = options?.totalArea ?? 100;
  const minPrimary = options?.minPrimary ?? 25;
  const minSecondary = options?.minSecondary ?? 5;
  const resolvedAssignments = assignments ?? getAccentDistribution(accents);
  const primaryArea = accents
    .filter((accent) => resolvedAssignments.get(accent.element) === 'primary')
    .reduce((sum, accent) => sum + accent.area, 0);
  const secondaryArea = accents
    .filter((accent) => resolvedAssignments.get(accent.element) === 'secondary')
    .reduce((sum, accent) => sum + accent.area, 0);
  const neutralArea = Math.max(totalArea - primaryArea - secondaryArea, 0);
  const warnings: string[] = [];

  if (primaryArea < minPrimary) {
    warnings.push(`Primary < ${minPrimary}% (hiện ${primaryArea}%)`);
  }
  if (secondaryArea < minSecondary) {
    warnings.push(`Secondary < ${minSecondary}% (hiện ${secondaryArea}%)`);
  }

  return {
    primary: primaryArea,
    secondary: secondaryArea,
    neutral: neutralArea,
    warnings,
  };
};

export const getAccessibilityScore = (pairs: AccessibilityPair[]): AccessibilityScore => {
  const failing: AccessibilityScore['failing'] = [];
  let minLc = Number.POSITIVE_INFINITY;

  pairs.forEach((pair) => {
    const fontSize = pair.fontSize ?? 16;
    const fontWeight = pair.fontWeight ?? 500;
    const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;
    const lc = Math.abs(apcaContrast(pair.text, pair.background));
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
