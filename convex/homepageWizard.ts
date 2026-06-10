import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import type { Id, TableNames } from './_generated/dataModel';

type TableStat = {
  category: string;
  count: number;
  isApproximate: boolean;
  table: string;
};

type HomepageWizardReality = {
  coreSettings: Record<string, unknown>;
  experienceSettings: Record<string, unknown>;
  featureMap: Record<string, Record<string, boolean>>;
  homeComponents: Array<{
    _creationTime: number;
    _id: Id<'homeComponents'>;
    active: boolean;
    config: unknown;
    order: number;
    title: string;
    type: string;
  }>;
  moduleSettings: Record<string, Record<string, unknown>>;
  modules: Array<{
    dependencies: string[];
    dependencyType: string;
    enabled: boolean;
    key: string;
    name: string;
  }>;
  sampleIds: {
    postIds: Id<'posts'>[];
    productCategoryIds: Id<'productCategories'>[];
    productIds: Id<'products'>[];
    serviceIds: Id<'services'>[];
  };
  tableStats: TableStat[];
};

const experienceKeys = [
  'posts_list_ui',
  'posts_detail_ui',
  'services_list_ui',
  'services_detail_ui',
  'courses_list_ui',
  'courses_detail_ui',
  'lesson_detail_ui',
  'products_list_ui',
  'product_detail_ui',
  'header_menu_ui',
  'contact_ui',
  'wishlist_ui',
  'cart_ui',
  'checkout_ui',
  'comments_rating_ui',
  'promotions_list_ui',
  'search_filter_ui',
  'account_orders_ui',
  'account_profile_ui',
] as const;

const moduleSettingsWhitelist = [
  { moduleKey: 'products', settingKey: 'variantEnabled' },
  { moduleKey: 'products', settingKey: 'saleMode' },
  { moduleKey: 'products', settingKey: 'productTypeMode' },
  { moduleKey: 'products', settingKey: 'defaultImageAspectRatio' },
  { moduleKey: 'services', settingKey: 'servicesPerPage' },
  { moduleKey: 'posts', settingKey: 'postsPerPage' },
  { moduleKey: 'settings', settingKey: 'site_brand_mode' },
] as const;

export const getHomepageWizardReality = query({
  args: {},
  handler: async (ctx): Promise<HomepageWizardReality> => {
    const modules = await ctx.db.query('adminModules').collect();
    const moduleFeatures = await ctx.db.query('moduleFeatures').take(300);
    const moduleSettings = await ctx.db.query('moduleSettings').take(300);
    const settings = await ctx.db.query('settings').take(500);
    const homeComponents = await ctx.db.query('homeComponents').take(200);

    const tableStats = await ctx.runQuery(api.dataManager.getTableStats, {}) as TableStat[];

    const pickSetting = (key: string) => settings.find((item) => item.key === key)?.value ?? null;
    const coreSettings = {
      contact_address: pickSetting('contact_address'),
      contact_email: pickSetting('contact_email'),
      contact_phone: pickSetting('contact_phone'),
      site_brand_mode: pickSetting('site_brand_mode'),
      site_brand_primary: pickSetting('site_brand_primary'),
      site_brand_secondary: pickSetting('site_brand_secondary'),
      site_name: pickSetting('site_name'),
      site_tagline: pickSetting('site_tagline'),
    };

    const experienceSettings: Record<string, unknown> = {};
    experienceKeys.forEach((key) => {
      experienceSettings[key] = pickSetting(key);
    });

    const moduleSettingMap = new Map(moduleSettings.map((item) => [`${item.moduleKey}:${item.settingKey}`, item.value]));
    const filteredModuleSettings: Record<string, Record<string, unknown>> = {};
    moduleSettingsWhitelist.forEach(({ moduleKey, settingKey }) => {
      const value = moduleSettingMap.get(`${moduleKey}:${settingKey}`);
      if (!filteredModuleSettings[moduleKey]) {
        filteredModuleSettings[moduleKey] = {};
      }
      filteredModuleSettings[moduleKey][settingKey] = value ?? null;
    });

    const featureMap: Record<string, Record<string, boolean>> = {};
    moduleFeatures.forEach((feature) => {
      if (!featureMap[feature.moduleKey]) {
        featureMap[feature.moduleKey] = {};
      }
      featureMap[feature.moduleKey][feature.featureKey] = feature.enabled;
    });

    const moduleSummary = modules.map((moduleItem) => ({
      dependencies: moduleItem.dependencies ?? [],
      dependencyType: moduleItem.dependencyType ?? 'all',
      enabled: moduleItem.enabled,
      key: moduleItem.key,
      name: moduleItem.name,
    }));

    const pickIds = async <T extends TableNames>(table: T, limit: number): Promise<Id<T>[]> => {
      const records = await ctx.db.query(table).take(limit);
      return records.map((item) => item._id);
    };

    const [productCategoryIds, productIds, postIds, serviceIds] = await Promise.all([
      pickIds('productCategories', 12),
      pickIds('products', 12),
      pickIds('posts', 12),
      pickIds('services', 12),
    ]);

    return {
      coreSettings,
      experienceSettings,
      featureMap,
      homeComponents,
      moduleSettings: filteredModuleSettings,
      modules: moduleSummary,
      sampleIds: {
        postIds,
        productCategoryIds,
        productIds,
        serviceIds,
      },
      tableStats,
    };
  },
  returns: v.object({
    coreSettings: v.record(v.string(), v.any()),
    experienceSettings: v.record(v.string(), v.any()),
    featureMap: v.record(v.string(), v.record(v.string(), v.boolean())),
    homeComponents: v.array(v.object({
      _creationTime: v.number(),
      _id: v.id('homeComponents'),
      active: v.boolean(),
      config: v.any(),
      order: v.number(),
      title: v.string(),
      type: v.string(),
    })),
    moduleSettings: v.record(v.string(), v.record(v.string(), v.any())),
    modules: v.array(v.object({
      dependencies: v.array(v.string()),
      dependencyType: v.string(),
      enabled: v.boolean(),
      key: v.string(),
      name: v.string(),
    })),
    sampleIds: v.object({
      postIds: v.array(v.id('posts')),
      productCategoryIds: v.array(v.id('productCategories')),
      productIds: v.array(v.id('products')),
      serviceIds: v.array(v.id('services')),
    }),
    tableStats: v.array(v.object({
      category: v.string(),
      count: v.number(),
      isApproximate: v.boolean(),
      table: v.string(),
    })),
  }),
});

export const applyHomepageWizardPlan = mutation({
  args: {
    components: v.array(v.object({
      active: v.boolean(),
      config: v.any(),
      order: v.number(),
      title: v.string(),
      type: v.string(),
    })),
    mode: v.union(v.literal('replace_all'), v.literal('append_missing')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('homeComponents').take(200);
    const existingTypes = new Set(existing.map((item) => item.type));
    const maxOrder = existing.reduce((acc, item) => Math.max(acc, item.order), 0);

    if (args.mode === 'replace_all') {
      for (const item of existing) {
        await ctx.runMutation(api.homeComponents.remove, { id: item._id });
      }
    }

    const baseOrder = args.mode === 'append_missing' ? maxOrder + 1 : 0;
    let offset = 0;
    for (const component of args.components) {
      if (args.mode === 'append_missing' && existingTypes.has(component.type)) {
        continue;
      }
      await ctx.runMutation(api.homeComponents.create, {
        active: component.active,
        config: component.config,
        order: baseOrder + offset + component.order,
        title: component.title,
        type: component.type,
      });
      offset += 1;
    }

    return { created: args.components.length };
  },
  returns: v.object({ created: v.number() }),
});
