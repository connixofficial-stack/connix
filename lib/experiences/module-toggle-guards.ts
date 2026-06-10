type ToggleRecord = Record<string, unknown>;

export function enforceToggleDisabled<T extends ToggleRecord>(config: T, key: keyof T, enabled: boolean): T {
  if (enabled) {
    return config;
  }

  return {
    ...config,
    [key]: false,
  };
}

export function enforceMultipleToggles<T extends ToggleRecord>(config: T, guards: Array<{ key: keyof T; enabled: boolean }>): T {
  return guards.reduce((result, guard) => enforceToggleDisabled(result, guard.key, guard.enabled), config);
}
