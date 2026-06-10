import type { FieldType } from '../../../types/module-config';

export type RuntimeModuleFeatureDefinition = {
  description?: string;
  enabled?: boolean;
  featureKey: string;
  linkedFieldKey?: string;
  name: string;
};

export type RuntimeModuleFieldDefinition = {
  enabled?: boolean;
  fieldKey: string;
  group?: string;
  isSystem?: boolean;
  linkedFeature?: string;
  name: string;
  order: number;
  required?: boolean;
  type: FieldType;
};

export type RuntimeModuleSettingDefinition = {
  settingKey: string;
  value: string | number | boolean;
};

export type ModuleRuntimeConfig = {
  features?: RuntimeModuleFeatureDefinition[];
  fields?: RuntimeModuleFieldDefinition[];
  settings?: RuntimeModuleSettingDefinition[];
};

export type RuntimeModuleDefinition = ModuleRuntimeConfig & {
  moduleKey: string;
};
