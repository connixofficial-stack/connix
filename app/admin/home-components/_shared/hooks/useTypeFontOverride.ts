'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { HOME_COMPONENT_TYPE_VALUES } from '@/lib/home-components/componentTypes';
import {
  getTypeFontOverrideState,
  resolveTypeOverrideFont,
  type FontOverrideState,
  type ResolvedFont,
} from '../lib/typeFontOverride';

const isSameFontState = (a: FontOverrideState, b: FontOverrideState) => (
  a.enabled === b.enabled && a.fontKey === b.fontKey
);

type TypeFontOverrideOptions = {
  seedCustomFromSettingsWhenTypeEmpty?: boolean;
};

export const useTypeFontOverride = (type: string) => {
  const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig);
  const overrides = systemConfig?.typeFontOverrides ?? null;
  const globalOverride = systemConfig?.globalFontOverride ?? null;

  const overrideState = useMemo(() => (
    getTypeFontOverrideState({ type, overrides, globalOverride })
  ), [type, overrides, globalOverride]);

  const resolvedFont = useMemo(() => (
    resolveTypeOverrideFont({ type, overrides, globalOverride })
  ), [type, overrides, globalOverride]);

  const isSupportedType = HOME_COMPONENT_TYPE_VALUES.includes(type);
  const systemEnabled = Boolean(overrides?.[type]?.systemEnabled);

  return {
    overrideState,
    resolvedFont,
    showCustomBlock: isSupportedType && systemEnabled,
    globalOverride,
    typeOverrides: overrides as Record<string, FontOverrideState & { systemEnabled?: boolean }> | null,
  };
};

export const useTypeFontOverrideState = (type: string, options?: TypeFontOverrideOptions) => {
  const { overrideState, showCustomBlock, globalOverride } = useTypeFontOverride(type);
  const shouldSeedFromSettings = Boolean(options?.seedCustomFromSettingsWhenTypeEmpty);
  const [customState, setCustomState] = useState<FontOverrideState>(overrideState);
  const [initialCustom, setInitialCustom] = useState<FontOverrideState>(overrideState);

  const seededState: FontOverrideState = useMemo(() => ({
    enabled: overrideState.enabled,
    fontKey: globalOverride?.fontKey ?? overrideState.fontKey,
  }), [overrideState.enabled, overrideState.fontKey, globalOverride?.fontKey]);

  useEffect(() => {
    const nextState = shouldSeedFromSettings ? seededState : overrideState;
    setCustomState((current) => (isSameFontState(current, nextState) ? current : nextState));
    setInitialCustom((current) => (isSameFontState(current, nextState) ? current : nextState));
  }, [overrideState, seededState, shouldSeedFromSettings]);

  useEffect(() => {
    if (customState.enabled) {
      return;
    }
    const nextState: FontOverrideState = {
      enabled: false,
      fontKey: globalOverride?.fontKey ?? customState.fontKey,
    };
    if (!isSameFontState(customState, nextState)) {
      setCustomState(nextState);
    }
  }, [customState, globalOverride?.fontKey]);

  const effectiveFont: ResolvedFont = showCustomBlock && customState.enabled
    ? {
      fontKey: customState.fontKey,
      fontVariable: resolveTypeOverrideFont({ type, overrides: { [type]: customState }, globalOverride }).fontVariable,
      usingCustom: true,
    }
    : resolveTypeOverrideFont({ type, overrides: null, globalOverride });

  return {
    customState,
    effectiveFont,
    initialCustom,
    setCustomState,
    setInitialCustom,
    showCustomBlock,
    globalOverride,
  };
};
