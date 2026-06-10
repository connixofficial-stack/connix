import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

const presetDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("systemPresets"),
  description: v.string(),
  enabledModules: v.array(v.string()),
  isDefault: v.optional(v.boolean()),
  key: v.string(),
  name: v.string(),
});

export const listPresets = query({
  args: {},
  handler: async (ctx) => ctx.db.query("systemPresets").collect(),
  returns: v.array(presetDoc),
});

export const getPresetByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("systemPresets")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique(),
  returns: v.union(presetDoc, v.null()),
});

export const getDefaultPreset = query({
  args: {},
  handler: async (ctx) => {
    const presets = await ctx.db.query("systemPresets").collect();
    return presets.find((p) => p.isDefault) ?? null;
  },
  returns: v.union(presetDoc, v.null()),
});

export const createPreset = mutation({
  args: {
    description: v.string(),
    enabledModules: v.array(v.string()),
    isDefault: v.optional(v.boolean()),
    key: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("systemPresets")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) {throw new Error("Preset key already exists");}
    if (args.isDefault) {
      const allPresets = await ctx.db.query("systemPresets").collect();
      for (const preset of allPresets) {
        if (preset.isDefault) {
          await ctx.db.patch(preset._id, { isDefault: false });
        }
      }
    }
    return  ctx.db.insert("systemPresets", args);
  },
  returns: v.id("systemPresets"),
});

export const updatePreset = mutation({
  args: {
    description: v.optional(v.string()),
    enabledModules: v.optional(v.array(v.string())),
    id: v.id("systemPresets"),
    isDefault: v.optional(v.boolean()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const preset = await ctx.db.get(id);
    if (!preset) {throw new Error("Preset not found");}
    if (args.isDefault) {
      const allPresets = await ctx.db.query("systemPresets").collect();
      for (const p of allPresets) {
        if (p.isDefault && p._id !== id) {
          await ctx.db.patch(p._id, { isDefault: false });
        }
      }
    }
    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

export const removePreset = mutation({
  args: { id: v.id("systemPresets") },
  handler: async (ctx, args) => {
    const preset = await ctx.db.get(args.id);
    if (!preset) {throw new Error("Preset not found");}
    if (preset.isDefault) {throw new Error("Cannot delete default preset");}
    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

export const applyPreset = mutation({
  args: { key: v.string(), updatedBy: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const preset = await ctx.db
      .query("systemPresets")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (!preset) {throw new Error("Preset not found");}
    const allModules = await ctx.db.query("adminModules").collect();
    const modulesByKey = new Map(allModules.map((module) => [module.key, module]));
    const enabledSet = new Set<string>();
    const unknownKeys = preset.enabledModules.filter((key) => !modulesByKey.has(key));
    if (unknownKeys.length > 0) {
      throw new Error(`Preset chứa module không tồn tại: ${unknownKeys.join(', ')}`);
    }

    for (const moduleRecord of allModules) {
      if (moduleRecord.isCore || preset.enabledModules.includes(moduleRecord.key)) {
        enabledSet.add(moduleRecord.key);
      }
    }

    for (const moduleRecord of allModules) {
      if (!enabledSet.has(moduleRecord.key)) {continue;}
      if (!moduleRecord.dependencies?.length) {continue;}
      const enabledDependencies = moduleRecord.dependencies.filter((depKey) => enabledSet.has(depKey));
      const dependencyType = moduleRecord.dependencyType ?? "all";
      if (dependencyType === "all" && enabledDependencies.length !== moduleRecord.dependencies.length) {
        const missing = moduleRecord.dependencies.filter((depKey) => !enabledSet.has(depKey));
        throw new Error(`Preset thiếu dependency cho module "${moduleRecord.key}": ${missing.join(', ')}`);
      }
      if (dependencyType === "any" && enabledDependencies.length === 0) {
        throw new Error(`Preset thiếu dependency cho module "${moduleRecord.key}"`);
      }
    }

    for (const moduleRecord of allModules) {
      const shouldEnable = enabledSet.has(moduleRecord.key);
      if (moduleRecord.enabled !== shouldEnable) {
        await ctx.db.patch(moduleRecord._id, {
          enabled: shouldEnable,
          updatedBy: args.updatedBy,
        });
      }
    }
    return null;
  },
  returns: v.null(),
});

export const createPresetFromCurrent = mutation({
  args: {
    description: v.string(),
    key: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("systemPresets")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) {throw new Error("Preset key already exists");}
    const enabledModules = await ctx.db
      .query("adminModules")
      .withIndex("by_enabled_order", (q) => q.eq("enabled", true))
      .collect();
    return  ctx.db.insert("systemPresets", {
      ...args,
      enabledModules: enabledModules.map((m) => m.key),
    });
  },
  returns: v.id("systemPresets"),
});

export const duplicatePreset = mutation({
  args: { id: v.id("systemPresets"), newKey: v.string(), newName: v.string() },
  handler: async (ctx, args) => {
    const preset = await ctx.db.get(args.id);
    if (!preset) {throw new Error("Preset not found");}
    const existing = await ctx.db
      .query("systemPresets")
      .withIndex("by_key", (q) => q.eq("key", args.newKey))
      .unique();
    if (existing) {throw new Error("Preset key already exists");}
    return  ctx.db.insert("systemPresets", {
      description: preset.description,
      enabledModules: preset.enabledModules,
      isDefault: false,
      key: args.newKey,
      name: args.newName,
    });
  },
  returns: v.id("systemPresets"),
});
