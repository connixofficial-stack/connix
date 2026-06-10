import type { ModuleDefinition } from '../define-module';
import type { ModuleSetting } from '../define-module';
import type {
  RuntimeModuleDefinition,
  RuntimeModuleFeatureDefinition,
  RuntimeModuleFieldDefinition,
  RuntimeModuleSettingDefinition,
} from './types';

const resolveDefaultSettingValue = (setting: ModuleSetting) => {
  if (setting.default !== undefined) {
    return setting.default;
  }
  if (setting.type === 'toggle') {
    return false;
  }
  if (setting.type === 'number') {
    return 0;
  }
  return '';
};

const uniqueByKey = <T>(items: T[], getKey: (item: T) => string): T[] => {
  const map = new Map<string, T>();
  items.forEach((item) => {
    map.set(getKey(item), item);
  });
  return Array.from(map.values());
};

export const normalizeRuntimeDefinition = (module: ModuleDefinition): RuntimeModuleDefinition => {
  const runtimeConfig = module.runtimeConfig ?? {};
  const features: RuntimeModuleFeatureDefinition[] = runtimeConfig.features
    ?? (module.features ?? []).map((feature) => ({
      description: feature.description,
      enabled: feature.enabled,
      featureKey: feature.key,
      linkedFieldKey: feature.linkedField,
      name: feature.label,
    }));

  const settings: RuntimeModuleSettingDefinition[] = runtimeConfig.settings
    ?? (module.settings ?? []).map((setting) => ({
      settingKey: setting.key,
      value: resolveDefaultSettingValue(setting),
    }));

  const fields: RuntimeModuleFieldDefinition[] = runtimeConfig.fields ?? [];

  return {
    moduleKey: module.key,
    features: uniqueByKey(features, (item) => item.featureKey),
    fields: uniqueByKey(fields, (item) => item.fieldKey),
    settings: uniqueByKey(settings, (item) => item.settingKey),
  };
};
