import { useCallback, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

interface UseExperienceConfigResult<T> {
  config: T;
  setConfig: Dispatch<SetStateAction<T>>;
  serverConfig: T;
  isLoading: boolean;
  hasChanges: boolean;
}

/**
 * Hook để quản lý experience config state với sync từ server
 * @param serverConfig - Config từ server (đã computed với fallbacks)
 * @param defaultConfig - Default config nếu chưa có
 * @param isLoading - Loading state từ queries
 */
export function useExperienceConfig<T>(
  serverConfig: T,
  defaultConfig: T,
  isLoading: boolean
): UseExperienceConfigResult<T> {
  const [draftConfig, setDraftConfig] = useState<{ value: T; serverSnapshot: T } | null>(null);

  const isDraftValid = useMemo(() => {
    if (!draftConfig) {
      return false;
    }
    return JSON.stringify(draftConfig.serverSnapshot) === JSON.stringify(serverConfig);
  }, [draftConfig, serverConfig]);

  const resolvedConfig = useMemo(() => {
    if (isDraftValid && draftConfig) {return draftConfig.value;}
    if (!isLoading) {return serverConfig;}
    return defaultConfig;
  }, [defaultConfig, draftConfig, isDraftValid, isLoading, serverConfig]);

  const setConfig: Dispatch<SetStateAction<T>> = useCallback((next) => {
    setDraftConfig(prevDraft => {
      const baseConfig = prevDraft && JSON.stringify(prevDraft.serverSnapshot) === JSON.stringify(serverConfig)
        ? prevDraft.value
        : (!isLoading ? serverConfig : defaultConfig);
      if (typeof next === 'function') {
        return {
          value: (next as (prevState: T) => T)(baseConfig),
          serverSnapshot: serverConfig,
        };
      }
      return {
        value: next,
        serverSnapshot: serverConfig,
      };
    });
  }, [defaultConfig, isLoading, serverConfig]);

  // Detect changes
  const hasChanges = useMemo(
    () => JSON.stringify(resolvedConfig) !== JSON.stringify(serverConfig),
    [resolvedConfig, serverConfig]
  );

  return {
    config: resolvedConfig,
    hasChanges,
    isLoading,
    serverConfig,
    setConfig,
  };
}
