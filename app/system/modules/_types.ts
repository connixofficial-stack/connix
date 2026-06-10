import type { Id } from '@/convex/_generated/dataModel';
import type { TranslationKeys } from '../i18n/translations';

export type ModuleLabels = TranslationKeys['modules'];

export interface AdminModule {
  _id: Id<"adminModules">;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: 'content' | 'commerce' | 'user' | 'system' | 'marketing';
  enabled: boolean;
  isCore: boolean;
  dependencies?: string[];
  dependencyType?: 'all' | 'any';
  order: number;
}

export interface SystemPreset {
  _id: Id<"systemPresets">;
  key: string;
  name: string;
  description: string;
  enabledModules: string[];
  isDefault?: boolean;
}
