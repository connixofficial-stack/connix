/**
 * Seed Manager - Central orchestrator for all seeding operations
 * 
 * Best Practices:
 * - Dependency-aware seeding
 * - Progress tracking
 * - Batch processing
 * - Error handling with rollback support
 * - Type-safe with validation
 */

import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { GenericMutationCtx } from 'convex/server';
import type { DataModel, TableNames } from './_generated/dataModel';
import {
  resolveDependencies,
  checkDependencies,
  SEED_PRESETS,
  getDefaultQuantity,
  type PresetType,
  BaseSeeder,
  SEEDER_REGISTRY,
  listSeedableModuleKeys,
  getTableName,
} from './seeders';
import { SEED_MODULE_METADATA } from '../lib/modules/seed-registry';
import type { SeedResult } from './seeders/base';

// ============================================================
// TYPES
// ============================================================

const seedConfigValidator = v.object({
  batchSize: v.optional(v.number()),
  dependencies: v.optional(v.boolean()),
  force: v.optional(v.boolean()),
  industryKey: v.optional(v.string()),
  locale: v.optional(v.string()),
  module: v.string(),
  quantity: v.number(),
  selectedLogo: v.optional(v.string()),
  strictVariantPresetScope: v.optional(v.boolean()),
  useSeedMauImages: v.optional(v.boolean()),
  variantPresetKey: v.optional(v.string()),
});

const seedProgressValidator = v.object({
  completed: v.number(),
  current: v.string(),
  errors: v.array(v.string()),
  results: v.array(v.any()),
  sessionId: v.string(),
  status: v.union(v.literal('running'), v.literal('completed'), v.literal('failed')),
  total: v.number(),
});

const SEEDERS: Record<string, new (ctx: GenericMutationCtx<DataModel>) => BaseSeeder> = SEEDER_REGISTRY;

// ============================================================
// DEPENDENCY LEVELS (Seed: 0 → 4, Clear: 4 → 0)
// ============================================================

export const DEPENDENCY_LEVELS: Record<number, string[]> = {
  0: ['roles', 'postCategories', 'productCategories', 'serviceCategories', 'courseCategories', 'projectCategories', 'settings', 'media', 'adminModules', 'systemPresets'],
  1: ['users', 'customers'],
  2: ['posts', 'products', 'services', 'courses', 'projects', 'menus', 'homepage', 'subscriptions'],
  3: ['comments', 'orders', 'cart', 'wishlist', 'promotions'],
  4: ['analytics', 'notifications'],
};

export function getSeedOrder(): string[] {
  return Object.keys(DEPENDENCY_LEVELS)
    .sort((a, b) => Number(a) - Number(b))
    .flatMap(level => DEPENDENCY_LEVELS[Number(level)]);
}

export function getClearOrder(): string[] {
  return Object.keys(DEPENDENCY_LEVELS)
    .sort((a, b) => Number(b) - Number(a))
    .flatMap(level => DEPENDENCY_LEVELS[Number(level)]);
}

export function getModuleLevel(moduleKey: string): number {
  for (const [level, modules] of Object.entries(DEPENDENCY_LEVELS)) {
    if (modules.includes(moduleKey)) {
      return Number(level);
    }
  }
  return -1;
}

// ============================================================
// SINGLE MODULE SEED
// ============================================================

export const seedModule = mutation({
  args: {
    batchSize: v.optional(v.number()),
    dependencies: v.optional(v.boolean()),
    force: v.optional(v.boolean()),
    industryKey: v.optional(v.string()),
    locale: v.optional(v.string()),
    module: v.string(),
    quantity: v.number(),
    strictVariantPresetScope: v.optional(v.boolean()),
    variantPresetKey: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<SeedResult> => {
    const startTime = Date.now();
    
    try {
      console.log(`[SeedManager] Starting seed for module: ${args.module}`);
      
      // Get seeder class
      const SeederClass = SEEDERS[args.module];
      if (!SeederClass) {
        throw new Error(`Seeder not found for module: ${args.module}. Available: ${Object.keys(SEEDERS).join(', ')}`);
      }
      
      // Check dependencies if enabled
      if (args.dependencies !== false) {
        const { satisfied, missing } = await checkDependencies(ctx, args.module);
        
        if (!satisfied) {
          console.log(`[SeedManager] Auto-seeding dependencies: ${missing.join(', ')}`);
          
          // Seed missing dependencies với default quantity (sử dụng internal mutation)
          for (const dep of missing) {
            const DepSeederClass = SEEDERS[dep];
            if (DepSeederClass) {
              const depSeeder = new DepSeederClass(ctx);
              await depSeeder.seed({
                force: false,
                industryKey: args.industryKey,
                locale: args.locale || 'vi',
                quantity: getDefaultQuantity(dep),
              });
            }
          }
        }
      }
      
      // Create seeder instance and seed
      const seeder = new SeederClass(ctx);
      const result = await seeder.seed({
        batchSize: args.batchSize,
        force: args.force,
        industryKey: args.industryKey,
        locale: args.locale || 'vi',
        quantity: args.quantity,
        strictVariantPresetScope: args.strictVariantPresetScope,
        variantPresetKey: args.variantPresetKey,
      });
      
      console.log(`[SeedManager] ✅ Completed seed for ${args.module}: ${result.created} records in ${result.duration}ms`);
      
      return result;
      
    } catch (error) {
      console.error(`[SeedManager] ❌ Failed to seed ${args.module}:`, error);
      
      return {
        created: 0,
        dependencies: [],
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)],
        module: args.module,
        skipped: 0,
      };
    }
  },
  returns: v.object({
    created: v.number(),
    dependencies: v.array(v.string()),
    duration: v.number(),
    errors: v.optional(v.array(v.string())),
    module: v.string(),
    skipped: v.number(),
  }),
});

// ============================================================
// BULK SEED (Multiple modules)
// ============================================================

export const seedBulk = mutation({
  args: {
    configs: v.array(seedConfigValidator),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionId = args.sessionId || `seed_${Date.now()}`;
    const modules = args.configs.map(c => c.module);
    
    try {
      // Resolve dependencies
      const orderedModules = resolveDependencies(modules);
      console.log(`[SeedManager] Seed order: ${orderedModules.join(' → ')}`);
      
      // Initialize progress tracking
      await ctx.db.insert('seedProgress', {
        completed: 0,
        current: orderedModules[0] || '',
        errors: [],
        results: [],
        sessionId,
        status: 'running' as const,
        total: orderedModules.length,
      });
      
      const results: SeedResult[] = [];
      let completed = 0;
      
      // Seed each module in order
      for (const moduleKey of orderedModules) {
        const config = args.configs.find(c => c.module === moduleKey);
        if (!config) {
          console.log(`[SeedManager] Skipping ${moduleKey} (not in config)`);
          continue;
        }
        
        // Update progress
        await updateProgress(ctx, sessionId, {
          completed,
          current: moduleKey,
          total: orderedModules.length,
        });
        
        // Seed module directly
        const SeederClass = SEEDERS[moduleKey];
        if (SeederClass) {
          const seeder = new SeederClass(ctx);
          const result = await seeder.seed({
            batchSize: config.batchSize,
            force: config.force,
            industryKey: config.industryKey,
            locale: config.locale || 'vi',
            quantity: config.quantity,
            selectedLogo: config.selectedLogo,
            strictVariantPresetScope: config.strictVariantPresetScope,
            useSeedMauImages: config.useSeedMauImages,
            variantPresetKey: config.variantPresetKey,
          });
          
          results.push(result);
          completed++;
          
          // Stop if error
          if (result.errors && result.errors.length > 0) {
            console.error(`[SeedManager] Error seeding ${moduleKey}, stopping bulk seed`);
            break;
          }
        }
      }
      
      // Mark as completed
      await updateProgress(ctx, sessionId, {
        completed,
        current: '',
        results,
        status: 'completed',
        total: orderedModules.length,
      });
      
      console.log(`[SeedManager] ✅ Bulk seed completed: ${completed}/${orderedModules.length} modules`);
      
      return results;
      
    } catch (error) {
      console.error('[SeedManager] ❌ Bulk seed failed:', error);
      
      // Mark as failed
      await updateProgress(ctx, sessionId, {
        errors: [error instanceof Error ? error.message : String(error)],
        status: 'failed',
      });
      
      throw error;
    }
  },
  returns: v.array(v.object({
    created: v.number(),
    dependencies: v.array(v.string()),
    duration: v.number(),
    errors: v.optional(v.array(v.string())),
    module: v.string(),
    skipped: v.number(),
  })),
});

// ============================================================
// PRESET SEEDS
// ============================================================

export const seedPreset = mutation({
  args: {
    force: v.optional(v.boolean()),
    preset: v.union(
      v.literal('minimal'),
      v.literal('standard'),
      v.literal('large'),
      v.literal('demo')
    ),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const presetConfig = SEED_PRESETS[args.preset as PresetType];
    console.log(`[SeedManager] Seeding preset: ${presetConfig.name}`);
    
    const configs = Object.entries(presetConfig.modules).map(([moduleKey, quantity]) => ({
      force: args.force,
      module: moduleKey,
      quantity,
    }));
    
    // Manually implement bulkseed logic here
    try {
      const modules = configs.map(c => c.module);
      const orderedModules = getSeedOrder().filter(moduleKey => modules.includes(moduleKey));
      
      const results: SeedResult[] = [];
      
      for (const moduleKey of orderedModules) {
        const config = configs.find(c => c.module === moduleKey);
        if (!config) {continue;}
        
        const SeederClass = SEEDERS[moduleKey];
        if (SeederClass) {
          const seeder = new SeederClass(ctx);
          const result = await seeder.seed({
            force: config.force,
            locale: 'vi',
            quantity: config.quantity,
          });
          results.push(result);
        }
      }
      
      return results;
    } catch (error) {
      console.error(`[SeedManager] Failed to seed preset ${args.preset}:`, error);
      throw error;
    }
  },
  returns: v.array(v.any()),
});

// ============================================================
// DEPENDENCY TREE
// ============================================================

export const getDependencyTree = query({
  args: {},
  handler: async (ctx) => {
    const result: Record<string, Array<{ key: string; count: number; isApproximate: boolean }>> = {};

    for (const [level, modules] of Object.entries(DEPENDENCY_LEVELS)) {
      result[level] = await Promise.all(
        modules.map(async (moduleKey) => {
          const tableName = getTableName(moduleKey) as keyof DataModel;
          const records = await ctx.db.query(tableName).take(1001);
          return {
            count: records.length > 1000 ? 1000 : records.length,
            isApproximate: records.length > 1000,
            key: moduleKey,
          };
        })
      );
    }

    return result;
  },
  returns: v.record(
    v.string(),
    v.array(
      v.object({
        count: v.number(),
        isApproximate: v.boolean(),
        key: v.string(),
      })
    )
  ),
});

// ============================================================
// PROGRESS TRACKING
// ============================================================

export const getSeedProgress = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query('seedProgress')
      .withIndex('by_session', q => q.eq('sessionId', args.sessionId))
      .order('desc')
      .first();
    
    return progress || null;
  },
  returns: v.union(v.null(), seedProgressValidator),
});

export const listRecentSeeds = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const seeds = await ctx.db
      .query('seedProgress')
      .order('desc')
      .take(limit);
    
    return seeds;
  },
  returns: v.array(seedProgressValidator),
});

export const listSeedableModules = query({
  args: {},
  handler: async () => {
    return listSeedableModuleKeys().map((moduleKey) => {
      const metadata = SEED_MODULE_METADATA[moduleKey];
      return {
        category: metadata?.category ?? 'content',
        defaultQuantity: metadata?.defaultQuantity ?? 10,
        description: metadata?.description ?? moduleKey,
        key: moduleKey,
        name: metadata?.name ?? moduleKey,
      };
    });
  },
  returns: v.array(
    v.object({
      category: v.string(),
      defaultQuantity: v.number(),
      description: v.string(),
      key: v.string(),
      name: v.string(),
    })
  ),
});

export const listSeedPresets = query({
  args: {},
  handler: async () => {
    return Object.entries(SEED_PRESETS).map(([key, preset]) => ({
      description: preset.description,
      key,
      name: preset.name,
    }));
  },
  returns: v.array(
    v.object({
      description: v.string(),
      key: v.string(),
      name: v.string(),
    })
  ),
});

// ============================================================
// CLEAR OPERATIONS
// ============================================================

export const clearModule = mutation({
  args: {
    module: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`[SeedManager] Clearing module: ${args.module}`);

    const SeederClass = SEEDERS[args.module];
    if (!SeederClass) {
      throw new Error(`Seeder not found for module: ${args.module}`);
    }

    const seeder = new SeederClass(ctx);
    await seeder.clearData();

    return { module: args.module, success: true };
  },
  returns: v.object({
    module: v.string(),
    success: v.boolean(),
  }),
});

export const clearAll = mutation({
  args: {
    excludeSystem: v.optional(v.boolean()),
    forceStorageCleanup: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    console.log(`[SeedManager] Clearing all data (excludeSystem: ${args.excludeSystem})`);

    const moduleKeys = listSeedableModuleKeys().filter((moduleKey) => {
      if (!args.excludeSystem) {
        return true;
      }
      return SEED_MODULE_METADATA[moduleKey]?.category !== 'system';
    });

    const orderedModules = getClearOrder().filter((moduleKey) => moduleKeys.includes(moduleKey));
    console.log(`[SeedManager] Clear order: ${orderedModules.join(' → ')}`);

    const errors: string[] = [];

    for (const moduleKey of orderedModules) {
      try {
        const SeederClass = SEEDERS[moduleKey];
        if (!SeederClass) {
          continue;
        }
        const seeder = new SeederClass(ctx);
        await seeder.clearData();
        console.log(`[SeedManager] ✅ Cleared ${moduleKey}`);
      } catch (error) {
        const message = `Failed to clear ${moduleKey}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[SeedManager] ❌ ${message}`);
        errors.push(message);
      }
    }

    let storageDeleted = 0;
    let storageCleanupSkipped = false;
    let storageCleanupHasMore = false;

    const hasImages = await ctx.db.query('images').first();
    if (hasImages && !args.forceStorageCleanup) {
      storageCleanupSkipped = true;
    } else {
      const batchSize = 100;
      let guard = 0;
      while (guard < 20) {
        const storageItems = await ctx.db.system.query('_storage').take(batchSize);
        if (storageItems.length === 0) {
          break;
        }
        await Promise.all(storageItems.map((item) => ctx.storage.delete(item._id)));
        storageDeleted += storageItems.length;
        guard += 1;
      }
      storageCleanupHasMore = guard >= 20;
    }

    return {
      success: errors.length === 0,
      errors,
      storageCleanupHasMore,
      storageCleanupSkipped,
      storageDeleted,
    };
  },
  returns: v.object({
    success: v.boolean(),
    errors: v.array(v.string()),
    storageCleanupHasMore: v.boolean(),
    storageCleanupSkipped: v.boolean(),
    storageDeleted: v.number(),
  }),
});

export const clearProductVariantData = mutation({
  args: {},
  handler: async (ctx) => {
    const productVariants = await ctx.db.query('productVariants').collect();
    const productOptionValues = await ctx.db.query('productOptionValues').collect();
    const productOptions = await ctx.db.query('productOptions').collect();

    await Promise.all(productVariants.map((item) => ctx.db.delete(item._id)));
    await Promise.all(productOptionValues.map((item) => ctx.db.delete(item._id)));
    await Promise.all(productOptions.map((item) => ctx.db.delete(item._id)));

    return {
      deleted: {
        options: productOptions.length,
        optionValues: productOptionValues.length,
        variants: productVariants.length,
      },
      success: true,
    };
  },
  returns: v.object({
    deleted: v.object({
      options: v.number(),
      optionValues: v.number(),
      variants: v.number(),
    }),
    success: v.boolean(),
  }),
});

export const factoryResetStep = mutation({
  args: {
    tableIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tables: TableNames[] = [
      'adminModules',
      'moduleFields',
      'moduleFeatures',
      'moduleSettings',
      'systemPresets',
      'convexDashboard',
      'usageStats',
      'systemSessions',
      'rateLimitBuckets',
      'users',
      'userSessions',
      'roles',
      'userStats',
      'roleStats',
      'homeComponentStats',
      'notificationStats',
      'promotionStats',
      'customers',
      'customerSessions',
      'productCategories',
      'products',
      'productOptions',
      'productOptionValues',
      'productVariants',
      'productStats',
      'postCategories',
      'posts',
      'comments',
      'images',
      'mediaStats',
      'mediaFolders',
      'menus',
      'menuItems',
      'homeComponents',
      'settings',
      'activityLogs',
      'orders',
      'wishlist',
      'carts',
      'cartItems',
      'notifications',
      'pageViews',
      'serviceCategories',
      'services',
      'courseCategories',
      'courses',
      'courseCategoryAssignments',
      'courseChapters',
      'courseLessons',
      'promotions',
      'promotionUsage',
      'seedProgress',
    ];

    const orderedTables = [...tables].reverse();

    const batchSize = 100;
    const index = args.tableIndex ?? 0;

    const totalTables = orderedTables.length;

    if (index >= totalTables) {
      return {
        completed: true,
        currentIndex: totalTables,
        deleted: 0,
        nextIndex: null,
        table: null,
        totalTables,
      };
    }

    const table = orderedTables[index];
    const records = await ctx.db.query(table).take(batchSize);
    let storageDeleted = 0;
    if (table === 'images') {
      const imageRecords = records as Array<{ storageId: string }>;
      for (const record of imageRecords) {
        try {
          await ctx.storage.delete(record.storageId);
          storageDeleted += 1;
        } catch (error) {
          console.warn(`[SeedManager] Failed to delete storage ${record.storageId}:`, error);
        }
      }
    }

    await Promise.all(records.map((record) => ctx.db.delete(record._id)));

    if (records.length === batchSize) {
      return {
        completed: false,
        currentIndex: index + 1,
        deleted: records.length,
        nextIndex: index,
        table,
        storageDeleted: table === 'images' ? storageDeleted : undefined,
        totalTables,
      };
    }

    return {
      completed: false,
      currentIndex: index + 1,
      deleted: records.length,
      nextIndex: index + 1,
      table,
      storageDeleted: table === 'images' ? storageDeleted : undefined,
      totalTables,
    };
  },
  returns: v.object({
    completed: v.boolean(),
    currentIndex: v.number(),
    deleted: v.number(),
    nextIndex: v.union(v.number(), v.null()),
    table: v.union(v.string(), v.null()),
    storageDeleted: v.optional(v.number()),
    totalTables: v.number(),
  }),
});

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

async function updateProgress(
  ctx: GenericMutationCtx<DataModel>,
  sessionId: string,
  updates: Partial<{
    completed: number;
    current: string;
    errors: string[];
    results: SeedResult[];
    status: 'running' | 'completed' | 'failed';
    total: number;
  }>
) {
  const existing = await ctx.db
    .query('seedProgress')
    .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
    .first();
  
  if (existing) {
    await ctx.db.patch(existing._id, updates);
  }
}
