import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { removeOwnerFilesAndCleanup, syncOwnerFilesAndCleanup } from "./lib/fileService";
import { EMAIL_CONFIG_SETTING_KEYS, getEmailConfigurationStatus as resolveEmailConfigurationStatus } from "../lib/email-config-status";

const settingDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("settings"),
  group: v.string(),
  key: v.string(),
  value: v.any(),
});

const emailConfigurationStatusDoc = v.object({
  configured: v.boolean(),
  driver: v.union(v.literal("smtp"), v.literal("resend"), v.literal("unknown")),
  label: v.string(),
  reason: v.string(),
});

const SETTING_STORAGE_ID_SUFFIX = "__storageId";

const storageIdSettingKey = (key: string) => `${key}${SETTING_STORAGE_ID_SUFFIX}`;

async function upsertSetting(
  ctx: MutationCtx,
  setting: { group: string; key: string; value: unknown }
) {
  const existing = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", setting.key))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { group: setting.group, value: setting.value });
    return existing._id;
  }
  return await ctx.db.insert("settings", setting);
}

// CRIT-001 FIX: Thêm limit để tránh memory overflow
export const listAll = query({
  args: {},
  handler: async (ctx) => ctx.db.query("settings").take(500),
  returns: v.array(settingDoc),
});

export const listByGroup = query({
  args: { group: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("settings")
      .withIndex("by_group", (q) => q.eq("group", args.group))
      .collect(),
  returns: v.array(settingDoc),
});

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique(),
  returns: v.union(settingDoc, v.null()),
});

export const getValue = query({
  args: { defaultValue: v.optional(v.any()), key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    return setting?.value ?? args.defaultValue ?? null;
  },
  returns: v.any(),
});

// HIGH-001 FIX: Chỉ đọc đúng key được yêu cầu bằng index by_key
export const getMultiple = query({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, args) => {
    const uniqueKeys = [...new Set(args.keys)];
    const settings = await Promise.all(uniqueKeys.map((key) =>
      ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique()
    ));
    const settingsMap = new Map<string, unknown>();
    for (const setting of settings) {
      if (setting) {
        settingsMap.set(setting.key, setting.value);
      }
    }

    const result: Record<string, unknown> = {};
    args.keys.forEach(key => {
      result[key] = settingsMap.get(key) ?? null;
    });
    return result;
  },
  returns: v.record(v.string(), v.any()),
});

export const getMailConfigurationStatus = query({
  args: {},
  handler: async (ctx) => {
    const settings = await Promise.all(EMAIL_CONFIG_SETTING_KEYS.map((key) =>
      ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique()
    ));

    const values: Record<string, unknown> = {};
    for (const setting of settings) {
      if (setting) {
        values[setting.key] = setting.value;
      }
    }

    return resolveEmailConfigurationStatus(values);
  },
  returns: emailConfigurationStatusDoc,
});

export const set = mutation({
  args: {
    group: v.string(),
    key: v.string(),
    storageId: v.optional(v.union(v.id("_storage"), v.null())),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const _existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    const storageSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", storageIdSettingKey(args.key)))
      .unique();
    const previousStorageIds = [
      typeof storageSetting?.value === "string" ? storageSetting.value as Id<"_storage"> : null,
    ];

    await upsertSetting(ctx, { group: args.group, key: args.key, value: args.value });

    if (Object.prototype.hasOwnProperty.call(args, "storageId")) {
      const nextStorageId = args.storageId ?? null;
      if (nextStorageId) {
        await upsertSetting(ctx, {
          group: args.group,
          key: storageIdSettingKey(args.key),
          value: nextStorageId,
        });
      } else if (storageSetting) {
        await ctx.db.delete(storageSetting._id);
      }
      await syncOwnerFilesAndCleanup(ctx, {
        ownerField: "value",
        ownerId: args.key,
        ownerTable: "settings",
        purpose: `settings:${args.group}`,
      }, [nextStorageId], {
        previousStorageIds,
      });
    }
    return null;
  },
  returns: v.null(),
});

// TICKET #1 FIX: Batch load thay vì N+1 queries
export const setMultiple = mutation({
  args: {
    settings: v.array(v.object({
      group: v.string(),
      key: v.string(),
      storageId: v.optional(v.union(v.id("_storage"), v.null())),
      value: v.any(),
    })),
  },
  handler: async (ctx, args) => {
    // Batch load tất cả settings hiện có 1 lần
    const allSettings = await ctx.db.query("settings").take(500);
    const settingsMap = new Map(allSettings.map(s => [s.key, s]));
    
    // Batch updates với Promise.all
    await Promise.all(args.settings.map(async (setting) => {
      const existing = settingsMap.get(setting.key);
      if (existing) {
        await ctx.db.patch(existing._id, { group: setting.group, value: setting.value });
      } else {
        await ctx.db.insert("settings", {
          group: setting.group,
          key: setting.key,
          value: setting.value,
        });
      }
    }));

    for (const setting of args.settings) {
      if (!Object.prototype.hasOwnProperty.call(setting, "storageId")) {
        continue;
      }
      const _existing = settingsMap.get(setting.key);
      const storageKey = storageIdSettingKey(setting.key);
      const storageSetting = settingsMap.get(storageKey);
      const previousStorageIds = [
        typeof storageSetting?.value === "string" ? storageSetting.value as Id<"_storage"> : null,
      ];
      const nextStorageId = setting.storageId ?? null;
      if (nextStorageId) {
        if (storageSetting) {
          await ctx.db.patch(storageSetting._id, { group: setting.group, value: nextStorageId });
        } else {
          await ctx.db.insert("settings", {
            group: setting.group,
            key: storageKey,
            value: nextStorageId,
          });
        }
      } else if (storageSetting) {
        await ctx.db.delete(storageSetting._id);
      }
      await syncOwnerFilesAndCleanup(ctx, {
        ownerField: "value",
        ownerId: setting.key,
        ownerTable: "settings",
        purpose: `settings:${setting.group}`,
      }, [nextStorageId], {
        previousStorageIds,
      });
    }
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    const storageSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", storageIdSettingKey(args.key)))
      .unique();
    await removeOwnerFilesAndCleanup(ctx, {
      ownerId: args.key,
      ownerTable: "settings",
    }, {
      previousStorageIds: [
        typeof storageSetting?.value === "string" ? storageSetting.value as Id<"_storage"> : null,
      ],
    });
    if (setting) {await ctx.db.delete(setting._id);}
    if (storageSetting) {await ctx.db.delete(storageSetting._id);}
    return null;
  },
  returns: v.null(),
});

export const removeMultiple = mutation({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, args) => {
    const keySet = new Set([
      ...args.keys,
      ...args.keys.map(storageIdSettingKey),
    ]);
    const settings = await ctx.db.query('settings').take(500);
    for (const key of args.keys) {
      const _setting = settings.find(item => item.key === key);
      const storageSetting = settings.find(item => item.key === storageIdSettingKey(key));
      await removeOwnerFilesAndCleanup(ctx, {
        ownerId: key,
        ownerTable: "settings",
      }, {
        previousStorageIds: [
          typeof storageSetting?.value === "string" ? storageSetting.value as Id<"_storage"> : null,
        ],
      });
    }
    const toDelete = settings.filter(setting => keySet.has(setting.key));
    await Promise.all(toDelete.map(setting => ctx.db.delete(setting._id)));
    return null;
  },
  returns: v.null(),
});

// TICKET #2 FIX: Dùng Promise.all thay vì sequential deletes
export const removeByGroup = mutation({
  args: { group: v.string() },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_group", (q) => q.eq("group", args.group))
      .collect();
    for (const setting of settings) {
      if (setting.key.endsWith(SETTING_STORAGE_ID_SUFFIX)) {
        continue;
      }
      const storageSetting = settings.find(item => item.key === storageIdSettingKey(setting.key));
      await removeOwnerFilesAndCleanup(ctx, {
        ownerId: setting.key,
        ownerTable: "settings",
      }, {
        previousStorageIds: [
          typeof storageSetting?.value === "string" ? storageSetting.value as Id<"_storage"> : null,
        ],
      });
    }
    await Promise.all(settings.map( async setting => ctx.db.delete(setting._id)));
    return null;
  },
  returns: v.null(),
});

// MED-004 FIX: Thêm limit
export const listGroups = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").take(500);
    const groups = new Set<string>();
    for (const setting of settings) {
      groups.add(setting.group);
    }
    return [...groups].sort();
  },
  returns: v.array(v.string()),
});
