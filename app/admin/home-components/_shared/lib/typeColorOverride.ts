import { differenceEuclidean, formatHex, oklch } from 'culori';

const DEFAULT_BRAND_COLOR = '#3b82f6';

export type ColorOverrideState = {
  enabled: boolean;
  mode: 'single' | 'dual';
  primary: string;
  secondary: string;
};

export type ResolvedTypeColors = {
  mode: 'single' | 'dual';
  primary: string;
  secondary: string;
  usingCustom: boolean;
};

export const isValidHexColor = (value: string) => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());

const safeOklch = (value: string, fallback: string) => {
  return oklch(value) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR);
};

export const getAnalogousColor = (primary: string) => {
  const base = safeOklch(primary, DEFAULT_BRAND_COLOR);
  if (!base) {return DEFAULT_BRAND_COLOR;}
  return formatHex(oklch({ ...base, h: ((base.h ?? 0) + 30) % 360 }));
};

export const getComplementaryColor = (primary: string) => {
  const base = safeOklch(primary, DEFAULT_BRAND_COLOR);
  if (!base) {return DEFAULT_BRAND_COLOR;}
  return formatHex(oklch({ ...base, h: ((base.h ?? 0) + 180) % 360 }));
};

export const getSuggestedSecondary = (primary: string) => {
  if (!isValidHexColor(primary)) {return DEFAULT_BRAND_COLOR;}
  const analogous = getAnalogousColor(primary);
  if (!isValidHexColor(analogous)) {return getComplementaryColor(primary);}
  const delta = differenceEuclidean('oklch')(primary, analogous);
  if (Math.round(delta * 100) < 20) {
    return getComplementaryColor(primary);
  }
  return analogous;
};

export const resolveSecondaryByMode = (mode: 'single' | 'dual', primary: string, secondary: string) => {
  if (mode === 'single') {
    return primary;
  }
  return isValidHexColor(secondary) ? secondary : primary;
};

export const getTypeOverrideState = (params: {
  type: string;
  systemColors: { primary: string; secondary: string; mode: 'single' | 'dual' };
  overrides?: Record<string, ColorOverrideState> | null;
}): ColorOverrideState => {
  const { type, systemColors, overrides } = params;
  const override = overrides?.[type];
  if (!override?.enabled) {
    const systemSecondary = resolveSecondaryByMode(
      systemColors.mode,
      systemColors.primary,
      systemColors.secondary,
    );
    return {
      enabled: false,
      mode: systemColors.mode,
      primary: systemColors.primary,
      secondary: systemSecondary,
    };
  }

  const mode = override.mode ?? systemColors.mode;
  const primary = override.primary ?? systemColors.primary;
  const secondaryCandidate = override.secondary ?? systemColors.secondary ?? primary;
  const secondary = resolveSecondaryByMode(mode, primary, secondaryCandidate);
  return {
    enabled: true,
    mode,
    primary,
    secondary,
  };
};

export const resolveTypeOverrideColors = (params: {
  type: string;
  systemColors: { primary: string; secondary: string; mode: 'single' | 'dual' };
  overrides?: Record<string, ColorOverrideState & { systemEnabled?: boolean }> | null;
}): ResolvedTypeColors => {
  const { type, systemColors, overrides } = params;
  const override = overrides?.[type];
  const usingCustom = Boolean(override?.enabled && override?.systemEnabled !== false);
  if (!usingCustom) {
    return {
      mode: systemColors.mode,
      primary: systemColors.primary,
      secondary: resolveSecondaryByMode(systemColors.mode, systemColors.primary, systemColors.secondary),
      usingCustom: false,
    };
  }

  const mode = override?.mode ?? systemColors.mode;
  const primary = override?.primary ?? systemColors.primary;
  const secondary = resolveSecondaryByMode(mode, primary, override?.secondary ?? systemColors.secondary ?? primary);

  return {
    mode,
    primary,
    secondary,
    usingCustom: true,
  };
};
