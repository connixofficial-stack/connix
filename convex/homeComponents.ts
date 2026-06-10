import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { removeOwnerFileReferences, syncOwnerFilesAndCleanup } from "./lib/fileService";

const STORAGE_URL_PREFIX = "/api/storage/";

const homeComponentDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("homeComponents"),
  active: v.boolean(),
  config: v.any(),
  order: v.number(),
  title: v.string(),
  type: v.string(),
});

// CRIT-002 FIX: Helper function to update homeComponentStats counter
async function updateHomeComponentStats(
  ctx: MutationCtx,
  key: string,
  delta: number
) {
  const stats = await ctx.db
    .query("homeComponentStats")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (stats) {
    await ctx.db.patch(stats._id, { count: Math.max(0, stats.count + delta) });
  } else {
    await ctx.db.insert("homeComponentStats", { count: Math.max(0, delta), key });
  }
}

function collectConfigStorageIds(value: unknown, acc = new Set<string>()): string[] {
  if (!value) {
    return Array.from(acc);
  }
  if (Array.isArray(value)) {
    value.forEach(item => collectConfigStorageIds(item, acc));
    return Array.from(acc);
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    Object.entries(record).forEach(([key, item]) => {
      if ((key === "storageId" || key.endsWith("StorageId")) && typeof item === "string" && item.trim()) {
        acc.add(item);
      }
      if (key.endsWith("StorageIds") && Array.isArray(item)) {
        item.forEach(storageId => {
          if (typeof storageId === "string" && storageId.trim()) {
            acc.add(storageId);
          }
        });
      }
      collectConfigStorageIds(item, acc);
    });
  }
  return Array.from(acc);
}

function resolveConfigStorageIds(config: unknown) {
  return collectConfigStorageIds(config);
}

async function resolveConfigFileStorageIds(_ctx: MutationCtx, config: unknown) {
  return resolveConfigStorageIds(config);
}

async function syncHomeComponentFileReferences(
  ctx: MutationCtx,
  ownerId: Id<"homeComponents">,
  nextConfig: unknown,
  previousConfig?: unknown
) {
  const [nextStorageIds, previousStorageIds] = await Promise.all([
    resolveConfigFileStorageIds(ctx, nextConfig),
    resolveConfigFileStorageIds(ctx, previousConfig),
  ]);

  await syncOwnerFilesAndCleanup(ctx, {
    ownerField: "config",
    ownerId,
    ownerTable: "homeComponents",
    purpose: "home-component-config",
  }, nextStorageIds, {
    previousStorageIds,
  });
}

function toConfigRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

async function buildStorageUrlMap(ctx: MutationCtx) {
  const images = await ctx.db.query("images").take(1000);
  const storageByUrl = new Map<string, Id<"_storage">>();
  for (const image of images) {
    const url = await ctx.storage.getUrl(image.storageId);
    if (url) {
      storageByUrl.set(url, image.storageId);
    }
  }
  return storageByUrl;
}

function migrateManagedStorageUrls(value: unknown, storageByUrl: Map<string, Id<"_storage">>): { changed: boolean; value: unknown } {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const result = migrateManagedStorageUrls(item, storageByUrl);
      changed ||= result.changed;
      return result.value;
    });
    return { changed, value: changed ? next : value };
  }

  const record = toConfigRecord(value);
  if (!record) {
    return { changed: false, value };
  }

  let changed = false;
  const next: Record<string, unknown> = { ...record };

  for (const [key, item] of Object.entries(record)) {
    const nested = migrateManagedStorageUrls(item, storageByUrl);
    if (nested.changed) {
      next[key] = nested.value;
      changed = true;
    }

    if (typeof item === "string" && item.includes(STORAGE_URL_PREFIX)) {
      const storageId = storageByUrl.get(item);
      const storageKey = `${key}StorageId`;
      if (storageId && typeof next[storageKey] !== "string") {
        next[storageKey] = storageId;
        changed = true;
      }
    }
  }

  return { changed, value: changed ? next : value };
}

function migrateComponentConfig(type: string, config: unknown, storageByUrl: Map<string, Id<"_storage">>) {
  const managedMediaResult = migrateManagedStorageUrls(config, storageByUrl);
  const record = toConfigRecord(managedMediaResult.value);
  if (!record) {
    return managedMediaResult;
  }

  let changed = managedMediaResult.changed;
  const next: Record<string, unknown> = { ...record };

  if (type === "ProductList" || type === "ProductGrid") {
    if (typeof next.subTitle === "string" && next.subTitle.trim() && typeof next.badgeText !== "string") {
      next.badgeText = next.subTitle;
      changed = true;
    }
    if (typeof next.sectionTitle === "string" && next.sectionTitle.trim() && typeof next.subtitle !== "string") {
      next.subtitle = next.sectionTitle;
      changed = true;
    }
    if ("subTitle" in next) {
      delete next.subTitle;
      changed = true;
    }
    if ("sectionTitle" in next) {
      delete next.sectionTitle;
      changed = true;
    }
  }

  if (type === "Contact") {
    for (const field of ["address", "email", "phone", "workingHours"]) {
      if (field in next) {
        delete next[field];
        changed = true;
      }
    }
  }

  return { changed, value: changed ? next : config };
}

export const migrateDataContracts = mutation({
  args: {},
  handler: async (ctx) => {
    const storageByUrl = await buildStorageUrlMap(ctx);
    const components = await ctx.db.query("homeComponents").take(1000);
    let updated = 0;

    for (const component of components) {
      const result = migrateComponentConfig(component.type, component.config, storageByUrl);
      if (!result.changed) {
        continue;
      }
      await ctx.db.patch(component._id, { config: result.value });
      await syncHomeComponentFileReferences(ctx, component._id, result.value, component.config);
      updated += 1;
    }

    return { scanned: components.length, updated };
  },
  returns: v.object({ scanned: v.number(), updated: v.number() }),
});

// CRIT-002 FIX: Thêm limit
export const listAll = query({
  args: {},
  handler: async (ctx) => ctx.db.query("homeComponents").take(100),
  returns: v.array(homeComponentDoc),
});

export const listActive = query({
  args: {},
  handler: async (ctx) => ctx.db
      .query("homeComponents")
      .withIndex("by_active_order", (q) => q.eq("active", true))
      .collect(),
  returns: v.array(homeComponentDoc),
});

// CRIT-002 FIX: Thêm limit
export const listByType = query({
  args: { type: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("homeComponents")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .take(50),
  returns: v.array(homeComponentDoc),
});

export const getById = query({
  args: { id: v.id("homeComponents") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(homeComponentDoc, v.null()),
});

// CRIT-002 FIX: Dùng counter table và fix count logic
export const create = mutation({
  args: {
    active: v.optional(v.boolean()),
    config: v.any(),
    order: v.optional(v.number()),
    title: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    // Get order from last item instead of count
    const lastItem = await ctx.db.query("homeComponents").order("desc").first();
    const newOrder = args.order ?? (lastItem ? lastItem.order + 1 : 0);
    const isActive = args.active ?? true;
    
    const id = await ctx.db.insert("homeComponents", {
      ...args,
      active: isActive,
      order: newOrder,
    });
    await syncHomeComponentFileReferences(ctx, id, args.config);
    
    // Update counters
    await Promise.all([
      updateHomeComponentStats(ctx, "total", 1),
      updateHomeComponentStats(ctx, isActive ? "active" : "inactive", 1),
      updateHomeComponentStats(ctx, args.type, 1),
    ]);
    
    return id;
  },
  returns: v.id("homeComponents"),
});

// TICKET #6 FIX: Update counters khi active hoặc type thay đổi
export const update = mutation({
  args: {
    active: v.optional(v.boolean()),
    config: v.optional(v.any()),
    id: v.id("homeComponents"),
    order: v.optional(v.number()),
    title: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const component = await ctx.db.get(id);
    if (!component) {throw new Error("Component not found");}
    
    // Update counters nếu active thay đổi
    if (args.active !== undefined && args.active !== component.active) {
      await Promise.all([
        updateHomeComponentStats(ctx, args.active ? "active" : "inactive", 1),
        updateHomeComponentStats(ctx, args.active ? "inactive" : "active", -1),
      ]);
    }
    
    // Update counters nếu type thay đổi
    if (args.type !== undefined && args.type !== component.type) {
      await Promise.all([
        updateHomeComponentStats(ctx, component.type, -1),
        updateHomeComponentStats(ctx, args.type, 1),
      ]);
    }
    
    await ctx.db.patch(id, updates);
    if (Object.prototype.hasOwnProperty.call(args, "config")) {
      await syncHomeComponentFileReferences(ctx, id, args.config, component.config);
    }
    return null;
  },
  returns: v.null(),
});

export const updateConfig = mutation({
  args: { config: v.any(), id: v.id("homeComponents") },
  handler: async (ctx, args) => {
    const component = await ctx.db.get(args.id);
    if (!component) {throw new Error("Component not found");}
    await ctx.db.patch(args.id, { config: args.config });
    await syncHomeComponentFileReferences(ctx, args.id, args.config, component.config);
    return null;
  },
  returns: v.null(),
});

// CRIT-002 FIX: Update counters khi toggle
export const toggle = mutation({
  args: { id: v.id("homeComponents") },
  handler: async (ctx, args) => {
    const component = await ctx.db.get(args.id);
    if (!component) {throw new Error("Component not found");}
    
    const newActive = !component.active;
    await ctx.db.patch(args.id, { active: newActive });
    
    // Update active/inactive counters
    await Promise.all([
      updateHomeComponentStats(ctx, newActive ? "active" : "inactive", 1),
      updateHomeComponentStats(ctx, newActive ? "inactive" : "active", -1),
    ]);
    
    return null;
  },
  returns: v.null(),
});

// CRIT-002 FIX: Update counters khi remove
export const remove = mutation({
  args: { id: v.id("homeComponents") },
  handler: async (ctx, args) => {
    const component = await ctx.db.get(args.id);
    if (!component) {throw new Error("Component not found");}
    const previousStorageIds = await resolveConfigFileStorageIds(ctx, component.config);
    
    const { removedStorageIds } = await removeOwnerFileReferences(ctx, {
      ownerId: args.id,
      ownerTable: "homeComponents",
    }, {
      previousStorageIds,
    });
    
    await ctx.db.delete(args.id);
    await Promise.all(removedStorageIds.map(storageId =>
      ctx.runMutation(api.storage.cleanupStorageIfUnreferenced, { storageId })
    ));
    
    // Update counters
    await Promise.all([
      updateHomeComponentStats(ctx, "total", -1),
      updateHomeComponentStats(ctx, component.active ? "active" : "inactive", -1),
      updateHomeComponentStats(ctx, component.type, -1),
    ]);
    
    return null;
  },
  returns: v.null(),
});

export const cleanupUnreferencedConfigMedia = mutation({
  args: {
    batchSize: v.optional(v.number()),
    folder: v.string(),
  },
  handler: async (ctx, args) => {
    const maxBatch = Math.min(args.batchSize ?? 100, 200);
    const homeComponents = await ctx.db.query("homeComponents").take(1000);
    const referencedStorageIds = new Set<string>();

    for (const component of homeComponents) {
      collectConfigStorageIds(component.config).forEach(storageId => referencedStorageIds.add(storageId));
    }

    const images = await ctx.db.query("images").withIndex("by_folder", q => q.eq("folder", args.folder)).take(maxBatch);
    let deleted = 0;
    let skipped = 0;

    for (const image of images) {
      if (referencedStorageIds.has(image.storageId)) {
        skipped += 1;
        continue;
      }
      const result = await ctx.runMutation(api.storage.cleanupStorageIfUnreferenced, { storageId: image.storageId });
      if (result.deleted) {
        deleted += 1;
      } else {
        skipped += 1;
      }
    }

    return { deleted, skipped };
  },
  returns: v.object({ deleted: v.number(), skipped: v.number() }),
});

// TICKET #3 FIX: Dùng Promise.all thay vì sequential updates
export const reorder = mutation({
  args: { items: v.array(v.object({ id: v.id("homeComponents"), order: v.number() })) },
  handler: async (ctx, args) => {
    await Promise.all(args.items.map( async item => ctx.db.patch(item.id, { order: item.order })));
    return null;
  },
  returns: v.null(),
});

// CRIT-002 FIX: Update counters và fix count logic
export const duplicate = mutation({
  args: { id: v.id("homeComponents") },
  handler: async (ctx, args) => {
    const component = await ctx.db.get(args.id);
    if (!component) {throw new Error("Component not found");}
    
    // Get order from last item
    const lastItem = await ctx.db.query("homeComponents").order("desc").first();
    const newOrder = lastItem ? lastItem.order + 1 : 0;
    
    const id = await ctx.db.insert("homeComponents", {
      active: false,
      config: component.config,
      order: newOrder,
      title: `${component.title} (Copy)`,
      type: component.type,
    });
    await syncHomeComponentFileReferences(ctx, id, component.config);
    
    // Update counters (duplicate is always inactive)
    await Promise.all([
      updateHomeComponentStats(ctx, "total", 1),
      updateHomeComponentStats(ctx, "inactive", 1),
      updateHomeComponentStats(ctx, component.type, 1),
    ]);
    
    return id;
  },
  returns: v.id("homeComponents"),
});

// CRIT-002 FIX: Dùng counter table thay vì fetch ALL
export const count = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db
      .query("homeComponentStats")
      .withIndex("by_key", (q) => q.eq("key", "total"))
      .unique();
    return stats?.count ?? 0;
  },
  returns: v.number(),
});

// CRIT-002 FIX: Dùng counter table thay vì fetch ALL
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    // Fetch tất cả stats 1 lần
    const allStats = await ctx.db.query("homeComponentStats").take(100);
    const statsMap = new Map(allStats.map(s => [s.key, s.count]));
    
    const totalCount = statsMap.get("total") ?? 0;
    const activeCount = statsMap.get("active") ?? 0;
    const inactiveCount = statsMap.get("inactive") ?? 0;
    
    // Build type breakdown từ stats (exclude total, active, inactive)
    const excludeKeys = new Set(["total", "active", "inactive"]);
    const typeBreakdown = allStats
      .filter(s => !excludeKeys.has(s.key) && s.count > 0)
      .map(s => ({ count: s.count, type: s.key }));

    return {
      activeCount,
      inactiveCount,
      totalCount,
      typeBreakdown,
    };
  },
  returns: v.object({
    activeCount: v.number(),
    inactiveCount: v.number(),
    totalCount: v.number(),
    typeBreakdown: v.array(v.object({
      count: v.number(),
      type: v.string(),
    })),
  }),
});

// CRIT-002 FIX: Dùng counter table thay vì fetch ALL
export const getTypes = query({
  args: {},
  handler: async (ctx) => {
    const allStats = await ctx.db.query("homeComponentStats").take(100);
    const excludeKeys = new Set(["total", "active", "inactive"]);
    const types = allStats
      .filter(s => !excludeKeys.has(s.key) && s.count > 0)
      .map(s => s.key);
    return types.sort();
  },
  returns: v.array(v.string()),
});
