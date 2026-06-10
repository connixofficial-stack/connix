import { mutation, query } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { anyApi } from "convex/server";
import { v } from "convex/values";
import { dependencyType, fieldType, moduleCategory } from "../lib/validators";
import { syncModuleRuntimeConfig } from "../lib/moduleConfigSync";
import { resolveMenuMaxDepthLevel } from "../../lib/utils/menu-tree";
import { TRUST_PAGE_SLOTS } from "../../lib/ia/trust-pages";
import { validateShippingMethods, validatePaymentMethods, validateOrderStatuses } from "../../lib/orders/config-validation";

const syncProgrammaticFromSourceChange = anyApi.landingPages.syncProgrammaticFromSourceChange;

// ============ ADMIN MODULES ============

const moduleDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("adminModules"),
  category: moduleCategory,
  dependencies: v.optional(v.array(v.string())),
  dependencyType: v.optional(dependencyType),
  description: v.string(),
  enabled: v.boolean(),
  icon: v.string(),
  isCore: v.boolean(),
  key: v.string(),
  name: v.string(),
  order: v.number(),
  updatedBy: v.optional(v.id("users")),
});

type ModuleRecord = { _id: Id<"adminModules">; isCore: boolean; key: string };
type ToggleModuleCode = "OK" | "MODULE_NOT_FOUND" | "CORE_LOCKED" | "DEPENDENCY_MISSING" | "INVALID_CASCADE";
type ToggleModuleResult = {
  autoEnabledModules: string[];
  code: ToggleModuleCode;
  disabledModules: string[];
  message?: string;
  success: boolean;
};

type ToggleModuleBasicCode = "OK" | "MODULE_NOT_FOUND" | "CORE_LOCKED" | "DEPENDENCY_MISSING";
type ToggleModuleBasicResult = {
  code: ToggleModuleBasicCode;
  message?: string;
  success: boolean;
};

const createToggleResult = (result: ToggleModuleResult): ToggleModuleResult => result;
const createToggleBasicResult = (result: ToggleModuleBasicResult): ToggleModuleBasicResult => result;

function normalizeRolesModule<T extends ModuleRecord>(moduleItem: T): T {
  if (moduleItem.key !== "roles" && moduleItem.key !== "customers") {
    return moduleItem;
  }
  if (!moduleItem.isCore) {
    return moduleItem;
  }
  return { ...moduleItem, isCore: false } as T;
}

async function normalizeRolesModuleWithPatch<T extends ModuleRecord>(
  ctx: MutationCtx,
  moduleItem: T
): Promise<T> {
  if (moduleItem.key !== "roles" && moduleItem.key !== "customers") {
    return moduleItem;
  }
  if (!moduleItem.isCore) {
    return moduleItem;
  }
  await ctx.db.patch(moduleItem._id, { isCore: false });
  return { ...moduleItem, isCore: false } as T;
}

async function repairSystemCoreFlags(ctx: MutationCtx) {
  const keysToRepair = ["roles", "customers"];
  for (const key of keysToRepair) {
    const record = await ctx.db
      .query("adminModules")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (record && record.isCore) {
      await ctx.db.patch(record._id, { isCore: false });
    }
  }
}

async function upsertAdminPermissionMode(ctx: MutationCtx, value: "simple_full_admin" | "rbac") {
  const existing = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", "admin_permission_mode"))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { group: existing.group ?? "auth", value });
    return;
  }
  await ctx.db.insert("settings", { group: "auth", key: "admin_permission_mode", value });
}

async function resetHomeComponentCreateVisibility(ctx: MutationCtx) {
  const existing = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", "create_hidden_types"))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { group: "home_components", value: [] });
    return;
  }
  await ctx.db.insert("settings", { group: "home_components", key: "create_hidden_types", value: [] });
}

async function normalizeMenuItemsToMaxLevel(ctx: MutationCtx, maxLevelRaw: unknown) {
  const maxLevel = resolveMenuMaxDepthLevel(maxLevelRaw);
  const maxDepth = maxLevel - 1;
  const items = await ctx.db.query("menuItems").collect();

  const normalizedDepthById = new Map<Id<"menuItems">, number>();
  items.forEach((item) => {
    const nextDepth = Math.max(0, Math.min(maxDepth, Math.round(item.depth)));
    normalizedDepthById.set(item._id, nextDepth);
  });

  await Promise.all(items.map(async (item) => {
    const nextDepth = normalizedDepthById.get(item._id) ?? 0;
    const parentDepth = item.parentId ? normalizedDepthById.get(item.parentId) : undefined;
    const nextParentId = nextDepth === 0 || parentDepth === undefined || parentDepth >= nextDepth
      ? undefined
      : item.parentId;

    if (nextDepth === item.depth && nextParentId === item.parentId) {
      return;
    }

    await ctx.db.patch(item._id, {
      depth: nextDepth,
      parentId: nextParentId,
    });
  }));
}

const toSearchableTrust = (value?: string | null) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/đ/g, "d");

const isPolicyCategory = (name?: string, slug?: string) => {
  const target = toSearchableTrust(`${name ?? ""} ${slug ?? ""}`);
  return target.includes("chinh sach") || target.includes("policy") || target.includes("chinh-sach");
};

async function ensureTrustPagesPolicyCategory(ctx: MutationCtx) {
  const categories = await ctx.db.query("postCategories").take(200);
  const existing = categories.find((category) => isPolicyCategory(category.name, category.slug));
  if (existing) {
    return existing._id;
  }

  const allCategories = await ctx.db.query("postCategories").take(1000);
  const maxOrder = allCategories.reduce((acc, item) => Math.max(acc, item.order ?? 0), 0);

  return ctx.db.insert("postCategories", {
    active: true,
    name: "Chính sách",
    slug: "chinh-sach",
    order: maxOrder + 1,
  });
}

async function cleanupTrustPagesData(ctx: MutationCtx) {
  const trustSettingsKeys = [
    ...TRUST_PAGE_SLOTS.flatMap((slot) => [slot.iaKey, slot.mappingKey]),
    "trust_page_last_autogen_at",
  ];

  for (const key of trustSettingsKeys) {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!setting) {
      continue;
    }

    const nextValue = TRUST_PAGE_SLOTS.some((slot) => slot.iaKey === key) ? false : null;
    await ctx.db.patch(setting._id, { group: "ia", value: nextValue });
  }

  const categories = await ctx.db.query("postCategories").take(500);
  const policyCategories = categories.filter((category) => isPolicyCategory(category.name, category.slug));

  for (const category of policyCategories) {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_category_status", (q) => q.eq("categoryId", category._id))
      .collect();
    await Promise.all(posts.map((post) => ctx.db.delete(post._id)));
    await ctx.db.delete(category._id);
  }
}

export const migrateCalendarToSubscriptions = mutation({
  args: {},
  handler: async (ctx) => {
    const calendarModule = await ctx.db
      .query("adminModules")
      .withIndex("by_key", (q) => q.eq("key", "calendar"))
      .unique();
    const subscriptionsModule = await ctx.db
      .query("adminModules")
      .withIndex("by_key", (q) => q.eq("key", "subscriptions"))
      .unique();

    let changed = false;

    const migrateModuleKey = async (table: "moduleSettings" | "moduleFeatures" | "moduleFields") => {
      const records = await ctx.db
        .query(table)
        .withIndex("by_module", (q) => q.eq("moduleKey", "calendar"))
        .collect();
      if (records.length === 0) {
        return;
      }
      changed = true;
      await Promise.all(records.map((record) => ctx.db.patch(record._id, { moduleKey: "subscriptions" })));
    };

    if (calendarModule && subscriptionsModule) {
      await ctx.db.delete(calendarModule._id);
      changed = true;
    } else if (calendarModule && !subscriptionsModule) {
      await ctx.db.patch(calendarModule._id, {
        description: "Quản lý gia hạn subscription khách hàng",
        icon: "CalendarDays",
        key: "subscriptions",
        name: "Subscriptions",
      });
      changed = true;
    }

    await Promise.all([
      migrateModuleKey("moduleSettings"),
      migrateModuleKey("moduleFeatures"),
      migrateModuleKey("moduleFields"),
    ]);

    return {
      changed,
      message: changed ? "Migrated calendar module to subscriptions" : "No migration needed",
      success: true,
    };
  },
  returns: v.object({
    changed: v.boolean(),
    message: v.string(),
    success: v.boolean(),
  }),
});

export const listModules = query({
  args: {},
  handler: async (ctx) => {
    const modules = await ctx.db.query("adminModules").collect();
    const sorted = modules.sort((a, b) => a.order - b.order);
    const normalized = sorted.map((moduleItem) => normalizeRolesModule(moduleItem));
    return normalized;
  },
  returns: v.array(moduleDoc),
});

export const listEnabledModules = query({
  args: {},
  handler: async (ctx) => {
    const modules = await ctx.db
      .query("adminModules")
      .withIndex("by_enabled_order", (q) => q.eq("enabled", true))
      .collect();
    return modules.map((moduleItem) => normalizeRolesModule(moduleItem));
  },
  returns: v.array(moduleDoc),
});

export const listModulesByCategory = query({
  args: { category: moduleCategory },
  handler: async (ctx, args) => {
    const modules = await ctx.db
      .query("adminModules")
      .withIndex("by_category_enabled", (q) => q.eq("category", args.category))
      .collect();
    return modules.map((moduleItem) => normalizeRolesModule(moduleItem));
  },
  returns: v.array(moduleDoc),
});

export const getModuleByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const moduleItem = await ctx.db
      .query("adminModules")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (!moduleItem) {return null;}
    return normalizeRolesModule(moduleItem);
  },
  returns: v.union(moduleDoc, v.null()),
});

export const createModule = mutation({
  args: {
    category: moduleCategory,
    dependencies: v.optional(v.array(v.string())),
    dependencyType: v.optional(dependencyType),
    description: v.string(),
    enabled: v.optional(v.boolean()),
    icon: v.string(),
    isCore: v.optional(v.boolean()),
    key: v.string(),
    name: v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("adminModules")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) {throw new Error("Module key already exists");}
    const count = (await ctx.db.query("adminModules").collect()).length;
    const id = await ctx.db.insert("adminModules", {
      ...args,
      enabled: args.enabled ?? true,
      isCore: args.isCore ?? false,
      order: args.order ?? count,
    });
    await ctx.runMutation(syncProgrammaticFromSourceChange, { source: "module" });
    return id;
  },
  returns: v.id("adminModules"),
});

export const updateModule = mutation({
  args: {
    category: v.optional(moduleCategory),
    dependencies: v.optional(v.array(v.string())),
    dependencyType: v.optional(dependencyType),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    id: v.id("adminModules"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
    updatedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const moduleRecord = await ctx.db.get(id);
    if (!moduleRecord) {throw new Error("Module not found");}
    await ctx.db.patch(id, updates);
    await ctx.runMutation(syncProgrammaticFromSourceChange, { source: "module" });
    return null;
  },
  returns: v.null(),
});

// SYS-004: Query để lấy các modules phụ thuộc vào module này
export const getDependentModules = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const allModules = await ctx.db.query("adminModules").collect();
    const dependents = allModules.filter(m => 
      m.enabled && m.dependencies?.includes(args.key)
    );
    return dependents.map(m => ({
      enabled: m.enabled,
      key: m.key,
      name: m.name,
    }));
  },
  returns: v.array(v.object({
    enabled: v.boolean(),
    key: v.string(),
    name: v.string(),
  })),
});

export const toggleModule = mutation({
  args: { enabled: v.boolean(), key: v.string(), updatedBy: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    await repairSystemCoreFlags(ctx);
    const allModules = await ctx.db.query("adminModules").collect();
    const modulesByKey = new Map(allModules.map((module) => [module.key, module]));
    const moduleRecord = modulesByKey.get(args.key) ?? null;
    if (!moduleRecord) {
      return createToggleBasicResult({
        code: "MODULE_NOT_FOUND",
        message: "Module not found",
        success: false,
      });
    }
    const normalizedModule = await normalizeRolesModuleWithPatch(ctx, moduleRecord);
    if (args.key !== "roles" && normalizedModule.isCore && !args.enabled) {
      return createToggleBasicResult({
        code: "CORE_LOCKED",
        message: "Cannot disable core module",
        success: false,
      });
    }
    if (args.enabled && args.key === "wishlist") {
      const products = modulesByKey.get("products");
      const customers = modulesByKey.get("customers");
      if (!products?.enabled || !customers?.enabled) {
        return createToggleBasicResult({
          code: "DEPENDENCY_MISSING",
          message: "Missing dependency module",
          success: false,
        });
      }
    }
    if (args.enabled && moduleRecord.dependencies?.length) {
      const dependencies = moduleRecord.dependencies
        .map((depKey) => modulesByKey.get(depKey))
        .filter(Boolean);
      const enabledCount = dependencies.filter((dep) => dep?.enabled).length;
      const dependencyType = moduleRecord.dependencyType ?? "all";
      if (dependencyType === "all" && enabledCount !== dependencies.length) {
        return createToggleBasicResult({
          code: "DEPENDENCY_MISSING",
          message: "Missing dependency module",
          success: false,
        });
      }
      if (dependencyType === "any" && enabledCount === 0) {
        return createToggleBasicResult({
          code: "DEPENDENCY_MISSING",
          message: "Missing dependency module",
          success: false,
        });
      }
    }
    await ctx.db.patch(moduleRecord._id, { enabled: args.enabled, updatedBy: args.updatedBy });
    if (args.key === "roles") {
      await upsertAdminPermissionMode(ctx, "simple_full_admin");
    }
    if (args.enabled && args.key === "homepage") {
      await resetHomeComponentCreateVisibility(ctx);
    }
    await ctx.runMutation(syncProgrammaticFromSourceChange, { source: "module" });
    return createToggleBasicResult({ code: "OK", success: true });
  },
  returns: v.object({
    code: v.union(
      v.literal("OK"),
      v.literal("MODULE_NOT_FOUND"),
      v.literal("CORE_LOCKED"),
      v.literal("DEPENDENCY_MISSING")
    ),
    message: v.optional(v.string()),
    success: v.boolean(),
  }),
});

// SYS-004: Toggle với cascade - auto disable các modules con
export const toggleModuleWithCascade = mutation({
  args: { 
    cascadeKeys: v.optional(v.array(v.string())), 
    enabled: v.boolean(), 
    key: v.string(),
    updatedBy: v.optional(v.id("users")), // Modules con cần disable cùng
  },
  handler: async (ctx, args) => {
    await repairSystemCoreFlags(ctx);
    const allModules = await ctx.db.query("adminModules").collect();
    const modulesByKey = new Map(allModules.map((module) => [module.key, module]));
    const moduleRecord = modulesByKey.get(args.key) ?? null;
    if (!moduleRecord) {
      return createToggleResult({
        autoEnabledModules: [],
        code: "MODULE_NOT_FOUND",
        disabledModules: [],
        message: "Module not found",
        success: false,
      });
    }
    const normalizedModule = await normalizeRolesModuleWithPatch(ctx, moduleRecord);
    if (args.key !== "roles" && normalizedModule.isCore && !args.enabled) {
      return createToggleResult({
        autoEnabledModules: [],
        code: "CORE_LOCKED",
        disabledModules: [],
        message: "Cannot disable core module",
        success: false,
      });
    }

    const dependentsMap = new Map<string, string[]>();
    for (const moduleItem of allModules) {
      if (!moduleItem.dependencies?.length) {continue;}
      for (const depKey of moduleItem.dependencies) {
        const list = dependentsMap.get(depKey) ?? [];
        list.push(moduleItem.key);
        dependentsMap.set(depKey, list);
      }
    }

    const autoEnabledModules: string[] = [];

    // Khi enable, auto-enable dependencies theo thứ tự
    if (args.enabled) {
      const ordered: string[] = [];
      const visiting = new Set<string>();
      const visited = new Set<string>();
      let missingDependencyKey: string | null = null;

      const visit = (moduleKey: string) => {
        if (visited.has(moduleKey)) {return;}
        if (visiting.has(moduleKey)) {return;}
        visiting.add(moduleKey);
        const current = modulesByKey.get(moduleKey);
        if (!current) {
          missingDependencyKey = moduleKey;
          visiting.delete(moduleKey);
          return;
        }

        const deps = current.key === "wishlist"
          ? Array.from(new Set([...(current.dependencies ?? []), "products", "customers"]))
          : (current.dependencies ?? []);
        if (deps.length > 0) {
          const dependencyType = current.dependencyType ?? "all";
          if (dependencyType === "any") {
            const hasEnabled = deps.some((depKey) => modulesByKey.get(depKey)?.enabled);
            const targetKey = hasEnabled ? null : deps[0];
            if (targetKey) {
              visit(targetKey);
            }
          } else {
            for (const depKey of deps) {
              visit(depKey);
            }
          }
        }

        visiting.delete(moduleKey);
        visited.add(moduleKey);
        ordered.push(moduleKey);
      };

      visit(args.key);

      if (missingDependencyKey) {
        return createToggleResult({
          autoEnabledModules: [],
          code: "DEPENDENCY_MISSING",
          disabledModules: [],
          message: "Missing dependency module",
          success: false,
        });
      }

      for (const moduleKey of ordered) {
        const current = modulesByKey.get(moduleKey);
        if (!current) {
          return createToggleResult({
            autoEnabledModules: [],
            code: "DEPENDENCY_MISSING",
            disabledModules: [],
            message: "Missing dependency module",
            success: false,
          });
        }
        if (!current.enabled) {
          await ctx.db.patch(current._id, { enabled: true, updatedBy: args.updatedBy });
          modulesByKey.set(moduleKey, { ...current, enabled: true });
          if (moduleKey !== args.key) {
            autoEnabledModules.push(moduleKey);
          }
        }
      }

      if (args.key === "roles") {
        await upsertAdminPermissionMode(ctx, "simple_full_admin");
      }
      if (args.key === "homepage") {
        await resetHomeComponentCreateVisibility(ctx);
      }

      return createToggleResult({
        autoEnabledModules,
        code: "OK",
        disabledModules: [],
        success: true,
      });
    }

    const disabledModules: string[] = [];
    const expectedDependents: string[] = [];
    const queue = [...(dependentsMap.get(args.key) ?? [])];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const currentKey = queue.shift();
      if (!currentKey || visited.has(currentKey)) {continue;}
      visited.add(currentKey);
      const current = modulesByKey.get(currentKey);
      if (current?.enabled && (!current.isCore || current.key === "roles")) {
        expectedDependents.push(currentKey);
      }
      const next = dependentsMap.get(currentKey);
      if (next?.length) {
        queue.push(...next);
      }
    }

    const cascadeSet = new Set(args.cascadeKeys ?? []);
    const expectedSet = new Set(expectedDependents);
    const hasMismatch = expectedDependents.some((key) => !cascadeSet.has(key))
      || (args.cascadeKeys ?? []).some((key) => !expectedSet.has(key));
    if (hasMismatch) {
      return createToggleResult({
        autoEnabledModules: [],
        code: "INVALID_CASCADE",
        disabledModules: [],
        message: "Cascade keys mismatch",
        success: false,
      });
    }

    for (const currentKey of expectedDependents) {
      const current = modulesByKey.get(currentKey);
      if (current && current.enabled && (!current.isCore || current.key === "roles")) {
        await ctx.db.patch(current._id, { enabled: false, updatedBy: args.updatedBy });
        disabledModules.push(currentKey);
      }
    }

    await ctx.db.patch(moduleRecord._id, { enabled: false, updatedBy: args.updatedBy });
    if (args.key === "roles") {
      await upsertAdminPermissionMode(ctx, "simple_full_admin");
    }

    return createToggleResult({
      autoEnabledModules: [],
      code: "OK",
      disabledModules,
      success: true,
    });
  },
  returns: v.object({
    autoEnabledModules: v.array(v.string()),
    code: v.union(
      v.literal("OK"),
      v.literal("MODULE_NOT_FOUND"),
      v.literal("CORE_LOCKED"),
      v.literal("DEPENDENCY_MISSING"),
      v.literal("INVALID_CASCADE")
    ),
    disabledModules: v.array(v.string()),
    message: v.optional(v.string()),
    success: v.boolean(),
  }),
});

export const removeModule = mutation({
  args: { id: v.id("adminModules") },
  handler: async (ctx, args) => {
    const moduleRecord = await ctx.db.get(args.id);
    if (!moduleRecord) {throw new Error("Module not found");}
    if (moduleRecord.isCore) {throw new Error("Cannot delete core module");}
    const fields = await ctx.db
      .query("moduleFields")
      .withIndex("by_module", (q) => q.eq("moduleKey", moduleRecord.key))
      .collect();
    for (const field of fields) {
      await ctx.db.delete(field._id);
    }
    const features = await ctx.db
      .query("moduleFeatures")
      .withIndex("by_module", (q) => q.eq("moduleKey", moduleRecord.key))
      .collect();
    for (const feature of features) {
      await ctx.db.delete(feature._id);
    }
    const settings = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module", (q) => q.eq("moduleKey", moduleRecord.key))
      .collect();
    for (const setting of settings) {
      await ctx.db.delete(setting._id);
    }
    await ctx.db.delete(args.id);
    await ctx.runMutation(syncProgrammaticFromSourceChange, { source: "module" });
    return null;
  },
  returns: v.null(),
});

// ============ MODULE FIELDS ============

const fieldDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("moduleFields"),
  enabled: v.boolean(),
  fieldKey: v.string(),
  group: v.optional(v.string()),
  isSystem: v.boolean(),
  linkedFeature: v.optional(v.string()),
  moduleKey: v.string(),
  name: v.string(),
  order: v.number(),
  required: v.boolean(),
  type: fieldType,
});

export const listModuleFields = query({
  args: { moduleKey: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("moduleFields")
      .withIndex("by_module_order", (q) => q.eq("moduleKey", args.moduleKey))
      .collect(),
  returns: v.array(fieldDoc),
});

export const listEnabledModuleFields = query({
  args: { moduleKey: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("moduleFields")
      .withIndex("by_module_enabled", (q) => q.eq("moduleKey", args.moduleKey).eq("enabled", true))
      .collect(),
  returns: v.array(fieldDoc),
});

export const createModuleField = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    fieldKey: v.string(),
    group: v.optional(v.string()),
    isSystem: v.optional(v.boolean()),
    linkedFeature: v.optional(v.string()),
    moduleKey: v.string(),
    name: v.string(),
    order: v.optional(v.number()),
    required: v.optional(v.boolean()),
    type: fieldType,
  },
  handler: async (ctx, args) => {
    const count = (
      await ctx.db
        .query("moduleFields")
        .withIndex("by_module", (q) => q.eq("moduleKey", args.moduleKey))
        .collect()
    ).length;
    return  ctx.db.insert("moduleFields", {
      ...args,
      required: args.required ?? false,
      enabled: args.enabled ?? true,
      isSystem: args.isSystem ?? false,
      order: args.order ?? count,
    });
  },
  returns: v.id("moduleFields"),
});

export const updateModuleField = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    group: v.optional(v.string()),
    id: v.id("moduleFields"),
    isSystem: v.optional(v.boolean()),
    linkedFeature: v.optional(v.string()),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
    required: v.optional(v.boolean()),
    type: v.optional(fieldType),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const field = await ctx.db.get(id);
    if (!field) {throw new Error("Field not found");}
    const isDemotingSystem = field.isSystem && updates.isSystem === false;
    if (field.isSystem && args.enabled === false && !isDemotingSystem) {
      throw new Error("Cannot disable system field");
    }
    if (updates.isSystem !== undefined && updates.isSystem !== field.isSystem && !isDemotingSystem) {
      throw new Error("Cannot change system field");
    }
    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

export const removeModuleField = mutation({
  args: { id: v.id("moduleFields") },
  handler: async (ctx, args) => {
    const field = await ctx.db.get(args.id);
    if (!field) {throw new Error("Field not found");}
    if (field.isSystem) {throw new Error("Cannot delete system field");}
    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

// ============ MODULE FEATURES ============

const featureDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("moduleFeatures"),
  description: v.optional(v.string()),
  enabled: v.boolean(),
  featureKey: v.string(),
  linkedFieldKey: v.optional(v.string()),
  moduleKey: v.string(),
  name: v.string(),
});

export const listModuleFeatures = query({
  args: { moduleKey: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("moduleFeatures")
      .withIndex("by_module", (q) => q.eq("moduleKey", args.moduleKey))
      .collect(),
  returns: v.array(featureDoc),
});

export const getModuleFeature = query({
  args: { featureKey: v.string(), moduleKey: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("moduleFeatures")
      .withIndex("by_module_feature", (q) =>
        q.eq("moduleKey", args.moduleKey).eq("featureKey", args.featureKey)
      )
      .unique(),
  returns: v.union(featureDoc, v.null()),
});

export const createModuleFeature = mutation({
  args: {
    description: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    featureKey: v.string(),
    linkedFieldKey: v.optional(v.string()),
    moduleKey: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => ctx.db.insert("moduleFeatures", {
      ...args,
      enabled: args.enabled ?? true,
    }),
  returns: v.id("moduleFeatures"),
});

export const toggleModuleFeature = mutation({
  args: { enabled: v.boolean(), featureKey: v.string(), moduleKey: v.string() },
  handler: async (ctx, args) => {
    const feature = await ctx.db
      .query("moduleFeatures")
      .withIndex("by_module_feature", (q) =>
        q.eq("moduleKey", args.moduleKey).eq("featureKey", args.featureKey)
      )
      .unique();
    if (!feature) {
      const rawName = args.featureKey.replace(/^enable/, '');
      const derivedName = rawName.replace(/([A-Z])/g, ' $1').trim();
      await ctx.db.insert("moduleFeatures", {
        moduleKey: args.moduleKey,
        featureKey: args.featureKey,
        enabled: args.enabled,
        name: derivedName || args.featureKey,
      });

      if (args.moduleKey === "settings" && args.featureKey === "enableTrustPages") {
        if (args.enabled) {
          await ensureTrustPagesPolicyCategory(ctx);
        } else {
          const autoGenerateFeature = await ctx.db
            .query("moduleFeatures")
            .withIndex("by_module_feature", (q) =>
              q.eq("moduleKey", "settings").eq("featureKey", "enableTrustPagesAutoGenerate")
            )
            .unique();
          if (autoGenerateFeature?.enabled) {
            await ctx.db.patch(autoGenerateFeature._id, { enabled: false });
          }
          await cleanupTrustPagesData(ctx);
        }
      }

      if (args.moduleKey === 'products' && args.featureKey === 'enableCategoryHierarchy' && !args.enabled) {
        const categories = await ctx.db
          .query('productCategories')
          .filter((q) => q.neq(q.field('parentId'), undefined))
          .collect();
        await Promise.all(categories.map((category) => ctx.db.patch(category._id, { parentId: undefined })));
      }
      return null;
    }
    await ctx.db.patch(feature._id, { enabled: args.enabled });
    if (feature.linkedFieldKey) {
      const fields = await ctx.db
        .query("moduleFields")
        .withIndex("by_module", (q) => q.eq("moduleKey", args.moduleKey))
        .collect();
      const linkedField = fields.find((f) => f.fieldKey === feature.linkedFieldKey);
      if (linkedField && !linkedField.isSystem) {
        await ctx.db.patch(linkedField._id, { enabled: args.enabled });
      }
    }

    if (args.moduleKey === "settings" && args.featureKey === "enableTrustPages") {
      if (args.enabled) {
        await ensureTrustPagesPolicyCategory(ctx);
      } else {
        const autoGenerateFeature = await ctx.db
          .query("moduleFeatures")
          .withIndex("by_module_feature", (q) =>
            q.eq("moduleKey", "settings").eq("featureKey", "enableTrustPagesAutoGenerate")
          )
          .unique();
        if (autoGenerateFeature?.enabled) {
          await ctx.db.patch(autoGenerateFeature._id, { enabled: false });
        }
        await cleanupTrustPagesData(ctx);
      }
    }

    if (args.moduleKey === 'products' && args.featureKey === 'enableCategoryHierarchy' && !args.enabled) {
      const categories = await ctx.db
        .query('productCategories')
        .filter((q) => q.neq(q.field('parentId'), undefined))
        .collect();
      await Promise.all(categories.map((category) => ctx.db.patch(category._id, { parentId: undefined })));
    }
    return null;
  },
  returns: v.null(),
});

export const removeModuleFeature = mutation({
  args: { id: v.id("moduleFeatures") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

// ============ MODULE SETTINGS ============

const settingDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("moduleSettings"),
  moduleKey: v.string(),
  settingKey: v.string(),
  value: v.any(),
});

export const listModuleSettings = query({
  args: { moduleKey: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("moduleSettings")
      .withIndex("by_module", (q) => q.eq("moduleKey", args.moduleKey))
      .collect(),
  returns: v.array(settingDoc),
});

export const getModuleSetting = query({
  args: { moduleKey: v.string(), settingKey: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", args.moduleKey).eq("settingKey", args.settingKey)
      )
      .unique(),
  returns: v.union(settingDoc, v.null()),
});

export const setModuleSetting = mutation({
  args: { moduleKey: v.string(), settingKey: v.string(), value: v.any() },
  handler: async (ctx, args) => {
    if (args.moduleKey === "orders") {
      if (args.settingKey === "shippingMethods") {
        const res = validateShippingMethods(args.value);
        if (!res.success) {
          throw new Error(res.error);
        }
      } else if (args.settingKey === "paymentMethods") {
        const res = validatePaymentMethods(args.value);
        if (!res.success) {
          throw new Error(res.error);
        }
      } else if (args.settingKey === "orderStatuses") {
        const res = validateOrderStatuses(args.value);
        if (!res.success) {
          throw new Error(res.error);
        }
      } else if (args.settingKey === "addressFormat") {
        const format = String(args.value);
        if (!["text", "2-level", "3-level"].includes(format)) {
          throw new Error("Định dạng địa chỉ không hợp lệ.");
        }
      }
    }

    const existing = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", args.moduleKey).eq("settingKey", args.settingKey)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("moduleSettings", args);
    }

    if (args.moduleKey === "menus" && args.settingKey === "maxDepth") {
      await normalizeMenuItemsToMaxLevel(ctx, args.value);
    }

    if (args.moduleKey === "settings" && args.settingKey === "site_brand_mode") {
      const existingSetting = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", "site_brand_mode"))
        .unique();
      if (existingSetting) {
        await ctx.db.patch(existingSetting._id, { group: "site", value: args.value });
      } else {
        await ctx.db.insert("settings", { group: "site", key: "site_brand_mode", value: args.value });
      }
    }
    return null;
  },
  returns: v.null(),
});

export const removeModuleSetting = mutation({
  args: { moduleKey: v.string(), settingKey: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", args.moduleKey).eq("settingKey", args.settingKey)
      )
      .unique();
    if (setting) {await ctx.db.delete(setting._id);}
    return null;
  },
  returns: v.null(),
});

export const resetModuleConfig = mutation({
  args: { moduleKey: v.string() },
  handler: async (ctx, args) => {
    const fields = await ctx.db
      .query("moduleFields")
      .withIndex("by_module", (q) => q.eq("moduleKey", args.moduleKey))
      .collect();
    for (const field of fields) {
      await ctx.db.delete(field._id);
    }

    const features = await ctx.db
      .query("moduleFeatures")
      .withIndex("by_module", (q) => q.eq("moduleKey", args.moduleKey))
      .collect();
    for (const feature of features) {
      await ctx.db.delete(feature._id);
    }

    const settings = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module", (q) => q.eq("moduleKey", args.moduleKey))
      .collect();
    for (const setting of settings) {
      await ctx.db.delete(setting._id);
    }

    return null;
  },
  returns: v.null(),
});

const syncResultDoc = v.object({
  addedFeatures: v.array(v.string()),
  addedFields: v.array(v.string()),
  addedSettings: v.array(v.string()),
  updatedFeatures: v.array(v.string()),
  updatedFields: v.array(v.string()),
  updatedSettings: v.array(v.string()),
});

export const syncModuleConfigFromDefinition = mutation({
  args: { moduleKey: v.string() },
  handler: async (ctx, args) => {
    return syncModuleRuntimeConfig(ctx, args.moduleKey);
  },
  returns: syncResultDoc,
});
