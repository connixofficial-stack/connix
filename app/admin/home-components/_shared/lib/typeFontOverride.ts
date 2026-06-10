import { DEFAULT_FONT_KEY, FONT_REGISTRY_BY_KEY, resolveFontVariable } from '@/lib/fonts/registry';

export type FontOverrideState = {
  enabled: boolean;
  fontKey: string;
};

export type ResolvedFont = {
  fontKey: string;
  fontVariable: string;
  usingCustom: boolean;
};

export const isValidFontKey = (value: string) => Boolean(FONT_REGISTRY_BY_KEY[value]);

export const resolveFontKey = (value?: string | null) => (
  isValidFontKey(value ?? '') ? (value as string) : DEFAULT_FONT_KEY
);

export const getTypeFontOverrideState = (params: {
  type: string;
  overrides?: Record<string, FontOverrideState> | null;
  globalOverride?: FontOverrideState | null;
}): FontOverrideState => {
  const { type, overrides, globalOverride } = params;
  const override = overrides?.[type];
  if (!override?.enabled) {
    return {
      enabled: false,
      fontKey: resolveFontKey(globalOverride?.fontKey),
    };
  }

  return {
    enabled: true,
    fontKey: resolveFontKey(override.fontKey),
  };
};

export const resolveTypeOverrideFont = (params: {
  type: string;
  overrides?: Record<string, FontOverrideState & { systemEnabled?: boolean }> | null;
  globalOverride?: FontOverrideState | null;
}): ResolvedFont => {
  const { type, overrides, globalOverride } = params;
  const override = overrides?.[type];
  const usingCustom = Boolean(override?.enabled && override?.systemEnabled !== false);
  const fallbackFontKey = resolveFontKey(globalOverride?.enabled ? globalOverride.fontKey : DEFAULT_FONT_KEY);
  const fontKey = usingCustom ? resolveFontKey(override?.fontKey) : fallbackFontKey;

  return {
    fontKey,
    fontVariable: resolveFontVariable(fontKey),
    usingCustom,
  };
};
