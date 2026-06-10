import type { GenericMutationCtx } from 'convex/server';
import type { DataModel } from '../_generated/dataModel';
import { getModuleRuntimeDefinition } from '../../lib/modules/runtime-config';

export type ModuleConfigSyncResult = {
  addedFeatures: string[];
  addedFields: string[];
  addedSettings: string[];
  updatedFeatures: string[];
  updatedFields: string[];
  updatedSettings: string[];
};

export const syncModuleRuntimeConfig = async (
  ctx: GenericMutationCtx<DataModel>,
  moduleKey: string
): Promise<ModuleConfigSyncResult> => {
  const definition = getModuleRuntimeDefinition(moduleKey);
  if (!definition) {
    throw new Error(`Module definition not found: ${moduleKey}`);
  }

  const [existingFeatures, existingFields, existingSettings] = await Promise.all([
    ctx.db.query('moduleFeatures').withIndex('by_module', (q) => q.eq('moduleKey', moduleKey)).collect(),
    ctx.db.query('moduleFields').withIndex('by_module', (q) => q.eq('moduleKey', moduleKey)).collect(),
    ctx.db.query('moduleSettings').withIndex('by_module', (q) => q.eq('moduleKey', moduleKey)).collect(),
  ]);

  const featureMap = new Map(existingFeatures.map((feature) => [feature.featureKey, feature]));
  const fieldMap = new Map(existingFields.map((field) => [field.fieldKey, field]));
  const settingMap = new Map(existingSettings.map((setting) => [setting.settingKey, setting]));

  const result: ModuleConfigSyncResult = {
    addedFeatures: [],
    addedFields: [],
    addedSettings: [],
    updatedFeatures: [],
    updatedFields: [],
    updatedSettings: [],
  };

  for (const feature of definition.features ?? []) {
    const existing = featureMap.get(feature.featureKey);
    if (!existing) {
      await ctx.db.insert('moduleFeatures', {
        description: feature.description,
        enabled: feature.enabled ?? true,
        featureKey: feature.featureKey,
        linkedFieldKey: feature.linkedFieldKey,
        moduleKey,
        name: feature.name,
      });
      result.addedFeatures.push(feature.featureKey);
      continue;
    }

    const updates: Partial<typeof existing> = {};
    if (feature.name && feature.name !== existing.name) {
      updates.name = feature.name;
    }
    if (feature.description !== undefined && feature.description !== existing.description) {
      updates.description = feature.description;
    }
    if (feature.linkedFieldKey !== undefined && feature.linkedFieldKey !== existing.linkedFieldKey) {
      updates.linkedFieldKey = feature.linkedFieldKey;
    }
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(existing._id, updates);
      result.updatedFeatures.push(feature.featureKey);
    }
  }

  for (const field of definition.fields ?? []) {
    const existing = fieldMap.get(field.fieldKey);
    if (!existing) {
      await ctx.db.insert('moduleFields', {
        enabled: field.enabled ?? true,
        fieldKey: field.fieldKey,
        group: field.group,
        isSystem: field.isSystem ?? false,
        linkedFeature: field.linkedFeature,
        moduleKey,
        name: field.name,
        order: field.order,
        required: field.required ?? false,
        type: field.type,
      });
      result.addedFields.push(field.fieldKey);
      continue;
    }

    const updates: Partial<typeof existing> = {};
    if (field.name && field.name !== existing.name) {
      updates.name = field.name;
    }
    if (field.group !== undefined && field.group !== existing.group) {
      updates.group = field.group;
    }
    if (field.order !== undefined && field.order !== existing.order) {
      updates.order = field.order;
    }
    if (field.required !== undefined && field.required !== existing.required) {
      updates.required = field.required;
    }
    if (field.type && field.type !== existing.type) {
      updates.type = field.type;
    }
    if (field.linkedFeature !== undefined && field.linkedFeature !== existing.linkedFeature) {
      updates.linkedFeature = field.linkedFeature;
    }
    if (field.isSystem === true && existing.isSystem === false) {
      updates.isSystem = true;
    }
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(existing._id, updates);
      result.updatedFields.push(field.fieldKey);
    }
  }

  for (const setting of definition.settings ?? []) {
    const existing = settingMap.get(setting.settingKey);
    if (!existing) {
      await ctx.db.insert('moduleSettings', {
        moduleKey,
        settingKey: setting.settingKey,
        value: setting.value,
      });
      if (moduleKey === 'settings' && setting.settingKey === 'site_brand_mode') {
        const existingSetting = await ctx.db
          .query('settings')
          .withIndex('by_key', (q) => q.eq('key', 'site_brand_mode'))
          .unique();
        if (existingSetting) {
          await ctx.db.patch(existingSetting._id, { group: 'site', value: setting.value });
        } else {
          await ctx.db.insert('settings', { group: 'site', key: 'site_brand_mode', value: setting.value });
        }
      }
      result.addedSettings.push(setting.settingKey);
      continue;
    }

    if (moduleKey === 'settings' && setting.settingKey === 'site_brand_mode') {
      const existingSetting = await ctx.db
        .query('settings')
        .withIndex('by_key', (q) => q.eq('key', 'site_brand_mode'))
        .unique();
      if (!existingSetting) {
        await ctx.db.insert('settings', { group: 'site', key: 'site_brand_mode', value: existing.value });
        result.updatedSettings.push(setting.settingKey);
      }
    }
  }

  return result;
};
