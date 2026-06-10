export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'richtext' 
  | 'email' 
  | 'phone' 
  | 'password'
  | 'number' 
  | 'price'
  | 'image' 
  | 'gallery' 
  | 'select' 
  | 'tags' 
  | 'date'
  | 'daterange'
  | 'json'
  | 'boolean'
  | 'color';

export interface FieldConfig {
  id: string;
  name: string;
  key: string;
  type: FieldType;
  required: boolean;
  enabled: boolean;
  isSystem: boolean;
  linkedFeature?: string;
  group?: string;
}

export interface FeatureConfig {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description?: string;
  linkedField?: string;
}

export interface SettingField {
  key: string;
  label: string;
  type: 'number' | 'select' | 'toggle' | 'text' | 'json';
  options?: { value: string; label: string }[];
}

export type ModuleCategory = 'content' | 'commerce' | 'user' | 'system' | 'marketing';

export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  category: ModuleCategory;
  color: string;
  isCore?: boolean;
  fields: FieldConfig[];
  secondaryFields?: FieldConfig[];
  features?: FeatureConfig[];
  settings?: SettingField[];
  dependencies?: string[];
  conventionNote?: string;
}
