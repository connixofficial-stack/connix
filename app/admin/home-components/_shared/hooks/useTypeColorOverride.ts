'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useSystemBrandColors } from './useSystemBrandColors';
import { HOME_COMPONENT_TYPE_VALUES } from '@/lib/home-components/componentTypes';
import {
  getTypeOverrideState,
  resolveSecondaryByMode,
  resolveTypeOverrideColors,
  type ColorOverrideState,
  type ResolvedTypeColors,
} from '../lib/typeColorOverride';

const isSameColorOverrideState = (a: ColorOverrideState, b: ColorOverrideState) => {
  return a.enabled === b.enabled
    && a.mode === b.mode
    && a.primary === b.primary
    && a.secondary === b.secondary;
};

type TypeColorOverrideOptions = {
  seedCustomFromSettingsWhenTypeEmpty?: boolean;
};

export const useTypeColorOverride = (type: string) => {
  const systemColors = useSystemBrandColors();
  const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig);
  const overrides = systemConfig?.typeColorOverrides ?? null;

  const overrideState = useMemo(() => (
    getTypeOverrideState({ type, systemColors, overrides })
  ), [
    type,
    systemColors,
    overrides,
  ]);

  const resolvedColors = useMemo(() => (
    resolveTypeOverrideColors({ type, systemColors, overrides })
  ), [
    type,
    systemColors,
    overrides,
  ]);
  const isSupportedType = HOME_COMPONENT_TYPE_VALUES.includes(type);
  const systemEnabled = Boolean(overrides?.[type]?.systemEnabled);

  return {
    overrideState,
    resolvedColors,
    showCustomBlock: isSupportedType && systemEnabled,
    systemColors,
    typeOverrides: overrides as Record<string, ColorOverrideState & { systemEnabled?: boolean }> | null,
  };
};

export const useTypeColorOverrideState = (type: string, options?: TypeColorOverrideOptions) => {
  const { overrideState, showCustomBlock, systemColors } = useTypeColorOverride(type);
  const shouldSeedFromSettings = Boolean(options?.seedCustomFromSettingsWhenTypeEmpty);
  const [customState, setCustomState] = useState<ColorOverrideState>(overrideState);
  const [initialCustom, setInitialCustom] = useState<ColorOverrideState>(overrideState);
  const lastSyncedStateRef = useRef<ColorOverrideState>(overrideState);

  const seededState: ColorOverrideState = useMemo(() => {
    const systemSecondary = resolveSecondaryByMode(
      systemColors.mode,
      systemColors.primary,
      systemColors.secondary,
    );
    return {
      enabled: overrideState.enabled,
      mode: systemColors.mode,
      primary: systemColors.primary,
      secondary: systemSecondary,
    };
  }, [overrideState.enabled, systemColors.mode, systemColors.primary, systemColors.secondary]);

  useEffect(() => {
    const nextState = shouldSeedFromSettings ? seededState : overrideState;
    const lastSyncedState = lastSyncedStateRef.current;
    const sourceChanged = !isSameColorOverrideState(lastSyncedState, nextState);

    if (!sourceChanged) {
      return;
    }

    lastSyncedStateRef.current = nextState;
    setInitialCustom(nextState);
    setCustomState((current) => (isSameColorOverrideState(current, lastSyncedState) ? nextState : current));
  }, [overrideState, seededState, shouldSeedFromSettings]);

  useEffect(() => {
    if (customState.enabled) {
      return;
    }
    const systemSecondary = resolveSecondaryByMode(
      systemColors.mode,
      systemColors.primary,
      systemColors.secondary,
    );
    const nextState: ColorOverrideState = {
      enabled: false,
      mode: systemColors.mode,
      primary: systemColors.primary,
      secondary: systemSecondary,
    };
    if (!isSameColorOverrideState(customState, nextState)) {
      setCustomState(nextState);
    }
  }, [customState, systemColors.mode, systemColors.primary, systemColors.secondary]);

  const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
  const effectiveColors: ResolvedTypeColors = showCustomBlock && customState.enabled
    ? {
      mode: customState.mode,
      primary: customState.primary,
      secondary: resolvedCustomSecondary,
      usingCustom: true,
    }
    : {
      mode: systemColors.mode,
      primary: systemColors.primary,
      secondary: resolveSecondaryByMode(systemColors.mode, systemColors.primary, systemColors.secondary),
      usingCustom: false,
    };

  return {
    customState,
    effectiveColors,
    initialCustom,
    setCustomState,
    setInitialCustom,
    showCustomBlock,
    systemColors,
  };
};
