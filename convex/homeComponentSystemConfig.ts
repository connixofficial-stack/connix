import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { HOME_COMPONENT_TYPE_VALUES } from "../lib/home-components/componentTypes";
import { DEFAULT_FONT_KEY, FONT_REGISTRY } from "../lib/fonts/registry";
import { COMPONENT_LAYOUTS } from "./lib/componentLayouts";

const GROUP_KEY = "home_components";
const HIDDEN_TYPES_KEY = "create_hidden_types";
const HIDDEN_LAYOUTS_KEY = "create_hidden_layouts";
const OVERRIDES_KEY = "type_color_overrides";
const FONT_OVERRIDES_KEY = "type_font_overrides";
const GLOBAL_FONT_OVERRIDE_KEY = "global_font_override";
const AI_IMPORT_OVERRIDES_KEY = "type_ai_import_overrides";
const HOME_PAGE_BACKGROUND_KEY = "home_page_background";
const DEFAULT_BRAND_COLOR = "#3b82f6";
const SUPPORTED_CUSTOM_TYPES = new Set(HOME_COMPONENT_TYPE_VALUES);
const FONT_KEYS = new Set(FONT_REGISTRY.map((font) => font.key));

const colorMode = v.union(v.literal("single"), v.literal("dual"));
const colorOverrideDoc = v.object({
  enabled: v.boolean(),
  systemEnabled: v.boolean(),
  mode: colorMode,
  primary: v.string(),
  secondary: v.string(),
});

const fontOverrideDoc = v.object({
  enabled: v.boolean(),
  systemEnabled: v.boolean(),
  fontKey: v.string(),
});

const globalFontOverrideDoc = v.object({
  enabled: v.boolean(),
  fontKey: v.string(),
});

const aiImportOverrideDoc = v.object({
  enabled: v.boolean(),
});

const homePageBackgroundDoc = v.object({
  enabled: v.optional(v.boolean()),
  type: v.union(
    v.literal("white"),
    v.literal("black"),
    v.literal("primary"),
    v.literal("secondary"),
    v.literal("custom")
  ),
  customColor: v.string(),
});

const isValidHexColor = (value: string) => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());
const isValidFontKey = (value: string) => FONT_KEYS.has(value);

const normalizeHiddenTypes = (value: unknown): string[] => {
  if (!Array.isArray(value)) {return [];}
  const result = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return Array.from(new Set(result));
};

const normalizeColorOverride = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const enabled = Boolean(record.enabled);
  const systemEnabled = typeof record.systemEnabled === "boolean" ? record.systemEnabled : enabled;
  const mode: "single" | "dual" = record.mode === "single" ? "single" : "dual";
  const primary = typeof record.primary === "string" && isValidHexColor(record.primary)
    ? record.primary
    : DEFAULT_BRAND_COLOR;
  let secondary = typeof record.secondary === "string" && isValidHexColor(record.secondary)
    ? record.secondary
    : primary;
  if (mode === "single") {
    secondary = primary;
  }
  return {
    enabled,
    systemEnabled,
    mode,
    primary,
    secondary,
  };
};

const normalizeFontOverride = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const enabled = Boolean(record.enabled);
  const systemEnabled = typeof record.systemEnabled === "boolean" ? record.systemEnabled : enabled;
  const fontKey = typeof record.fontKey === "string" && isValidFontKey(record.fontKey)
    ? record.fontKey
    : DEFAULT_FONT_KEY;
  return {
    enabled,
    systemEnabled,
    fontKey,
  };
};

const normalizeGlobalFontOverride = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return {
      enabled: false,
      fontKey: DEFAULT_FONT_KEY,
    };
  }
  const record = value as Record<string, unknown>;
  const enabled = Boolean(record.enabled);
  const fontKey = typeof record.fontKey === "string" && isValidFontKey(record.fontKey)
    ? record.fontKey
    : DEFAULT_FONT_KEY;
  return { enabled, fontKey };
};

const normalizeHomePageBackground = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return {
      enabled: false,
      type: "white" as const,
      customColor: "",
    };
  }
  const record = value as Record<string, unknown>;
  const enabled = typeof record.enabled === "boolean" ? record.enabled : false;
  const type = (["white", "black", "primary", "secondary", "custom"].includes(record.type as string))
    ? (record.type as "white" | "black" | "primary" | "secondary" | "custom")
    : ("white" as const);
  const customColor = typeof record.customColor === "string" ? record.customColor : "";
  return { enabled, type, customColor };
};

const normalizeOverrides = (value: unknown): Record<string, { enabled: boolean; systemEnabled: boolean; mode: "single" | "dual"; primary: string; secondary: string }> => {
  if (!value || typeof value !== "object") {return {};}
  const result: Record<string, { enabled: boolean; systemEnabled: boolean; mode: "single" | "dual"; primary: string; secondary: string }> = {};
  const record = value as Record<string, unknown>;
  Object.entries(record).forEach(([key, entry]) => {
    const normalized = normalizeColorOverride(entry);
    if (normalized) {
      result[key] = normalized;
    }
  });
  return result;
};

const normalizeFontOverrides = (value: unknown): Record<string, { enabled: boolean; systemEnabled: boolean; fontKey: string }> => {
  if (!value || typeof value !== "object") {return {};}
  const result: Record<string, { enabled: boolean; systemEnabled: boolean; fontKey: string }> = {};
  const record = value as Record<string, unknown>;
  Object.entries(record).forEach(([key, entry]) => {
    const normalized = normalizeFontOverride(entry);
    if (normalized) {
      result[key] = normalized;
    }
  });
  return result;
};

const normalizeAiImportOverrides = (value: unknown): Record<string, { enabled: boolean }> => {
  if (!value || typeof value !== "object") {return {};}
  const result: Record<string, { enabled: boolean }> = {};
  const record = value as Record<string, unknown>;
  Object.entries(record).forEach(([key, entry]) => {
    if (!SUPPORTED_CUSTOM_TYPES.has(key)) {return;}
    if (typeof entry === "boolean") {
      result[key] = { enabled: entry };
      return;
    }
    if (entry && typeof entry === "object" && typeof (entry as Record<string, unknown>).enabled === "boolean") {
      result[key] = { enabled: Boolean((entry as Record<string, unknown>).enabled) };
    }
  });
  return result;
};

const getSettingValue = async (ctx: QueryCtx | MutationCtx, key: string) => {
  const setting = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  return setting?.value ?? null;
};

const upsertSetting = async (ctx: MutationCtx, key: string, value: unknown) => {
  const setting = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (setting) {
    await ctx.db.patch(setting._id, { group: GROUP_KEY, value });
    return;
  }
  await ctx.db.insert("settings", { group: GROUP_KEY, key, value });
};

export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    const hiddenTypes = normalizeHiddenTypes(await getSettingValue(ctx, HIDDEN_TYPES_KEY));
    const hiddenLayouts = normalizeHiddenTypes(await getSettingValue(ctx, HIDDEN_LAYOUTS_KEY));
    const overrides = normalizeOverrides(await getSettingValue(ctx, OVERRIDES_KEY));
    const fontOverrides = normalizeFontOverrides(await getSettingValue(ctx, FONT_OVERRIDES_KEY));
    const globalFontOverride = normalizeGlobalFontOverride(await getSettingValue(ctx, GLOBAL_FONT_OVERRIDE_KEY));
    const aiImportOverrides = normalizeAiImportOverrides(await getSettingValue(ctx, AI_IMPORT_OVERRIDES_KEY));
    const homePageBackground = normalizeHomePageBackground(await getSettingValue(ctx, HOME_PAGE_BACKGROUND_KEY));
    return {
      hiddenTypes,
      hiddenLayouts,
      typeColorOverrides: overrides,
      typeFontOverrides: fontOverrides,
      globalFontOverride,
      typeAiImportOverrides: aiImportOverrides,
      homePageBackground,
    };
  },
  returns: v.object({
    hiddenTypes: v.array(v.string()),
    hiddenLayouts: v.array(v.string()),
    typeColorOverrides: v.record(v.string(), colorOverrideDoc),
    typeFontOverrides: v.record(v.string(), fontOverrideDoc),
    globalFontOverride: globalFontOverrideDoc,
    typeAiImportOverrides: v.record(v.string(), aiImportOverrideDoc),
    homePageBackground: homePageBackgroundDoc,
  }),
});

export const setCreateVisibility = mutation({
  args: { hiddenTypes: v.array(v.string()) },
  handler: async (ctx, args) => {
    const normalized = normalizeHiddenTypes(args.hiddenTypes);
    await upsertSetting(ctx, HIDDEN_TYPES_KEY, normalized);
    return null;
  },
  returns: v.null(),
});


export const setTypeColorOverride = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    systemEnabled: v.optional(v.boolean()),
    mode: v.optional(colorMode),
    primary: v.optional(v.string()),
    secondary: v.optional(v.string()),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    if (!SUPPORTED_CUSTOM_TYPES.has(args.type)) {
      return null;
    }

    const overrides = normalizeOverrides(await getSettingValue(ctx, OVERRIDES_KEY));
    const current = normalizeColorOverride(overrides[args.type]) ?? {
      enabled: false,
      systemEnabled: false,
      mode: "dual" as const,
      primary: DEFAULT_BRAND_COLOR,
      secondary: DEFAULT_BRAND_COLOR,
    };

    const nextMode: "single" | "dual" = args.mode ?? current.mode;
    const primaryCandidate = args.primary ?? current.primary;
    const primary = isValidHexColor(primaryCandidate) ? primaryCandidate : current.primary;
    const providedSecondary = args.secondary ?? current.secondary;
    let secondary = isValidHexColor(providedSecondary) ? providedSecondary : primary;
    if (nextMode === "single") {
      secondary = primary;
    }

    overrides[args.type] = {
      enabled: typeof args.enabled === "boolean" ? args.enabled : current.enabled,
      systemEnabled: typeof args.systemEnabled === "boolean" ? args.systemEnabled : current.systemEnabled,
      mode: nextMode,
      primary,
      secondary,
    };
    await upsertSetting(ctx, OVERRIDES_KEY, overrides);
    return null;
  },
  returns: v.null(),
});

export const bulkSetTypeColorOverride = mutation({
  args: { systemEnabled: v.boolean(), types: v.array(v.string()) },
  handler: async (ctx, args) => {
    const overrides = normalizeOverrides(await getSettingValue(ctx, OVERRIDES_KEY));
    args.types
      .filter((type) => SUPPORTED_CUSTOM_TYPES.has(type))
      .forEach((type) => {
        const current = normalizeColorOverride(overrides[type]) ?? {
          enabled: false,
          systemEnabled: false,
          mode: "dual" as const,
          primary: DEFAULT_BRAND_COLOR,
          secondary: DEFAULT_BRAND_COLOR,
        };
        overrides[type] = { ...current, systemEnabled: args.systemEnabled };
      });
    await upsertSetting(ctx, OVERRIDES_KEY, overrides);
    return null;
  },
  returns: v.null(),
});

export const setTypeFontOverride = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    systemEnabled: v.optional(v.boolean()),
    fontKey: v.optional(v.string()),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    if (!SUPPORTED_CUSTOM_TYPES.has(args.type)) {
      return null;
    }

    const overrides = normalizeFontOverrides(await getSettingValue(ctx, FONT_OVERRIDES_KEY));
    const current = normalizeFontOverride(overrides[args.type]) ?? {
      enabled: false,
      systemEnabled: false,
      fontKey: DEFAULT_FONT_KEY,
    };

    const fontKeyCandidate = args.fontKey ?? current.fontKey;
    const fontKey = isValidFontKey(fontKeyCandidate) ? fontKeyCandidate : current.fontKey;

    overrides[args.type] = {
      enabled: typeof args.enabled === "boolean" ? args.enabled : current.enabled,
      systemEnabled: typeof args.systemEnabled === "boolean" ? args.systemEnabled : current.systemEnabled,
      fontKey,
    };
    await upsertSetting(ctx, FONT_OVERRIDES_KEY, overrides);
    return null;
  },
  returns: v.null(),
});

export const bulkSetTypeFontOverride = mutation({
  args: { systemEnabled: v.boolean(), types: v.array(v.string()) },
  handler: async (ctx, args) => {
    const overrides = normalizeFontOverrides(await getSettingValue(ctx, FONT_OVERRIDES_KEY));
    args.types
      .filter((type) => SUPPORTED_CUSTOM_TYPES.has(type))
      .forEach((type) => {
        const current = normalizeFontOverride(overrides[type]) ?? {
          enabled: false,
          systemEnabled: false,
          fontKey: DEFAULT_FONT_KEY,
        };
        overrides[type] = { ...current, systemEnabled: args.systemEnabled };
      });
    await upsertSetting(ctx, FONT_OVERRIDES_KEY, overrides);
    return null;
  },
  returns: v.null(),
});

export const setGlobalFontOverride = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    fontKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const current = normalizeGlobalFontOverride(await getSettingValue(ctx, GLOBAL_FONT_OVERRIDE_KEY));
    const nextFontKeyCandidate = args.fontKey ?? current.fontKey;
    const fontKey = isValidFontKey(nextFontKeyCandidate) ? nextFontKeyCandidate : current.fontKey;

    const next = {
      enabled: typeof args.enabled === "boolean" ? args.enabled : current.enabled,
      fontKey,
    };
    await upsertSetting(ctx, GLOBAL_FONT_OVERRIDE_KEY, next);
    return null;
  },
  returns: v.null(),
});

export const setTypeAiImportOverride = mutation({
  args: {
    enabled: v.boolean(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    if (!SUPPORTED_CUSTOM_TYPES.has(args.type)) {
      return null;
    }
    const overrides = normalizeAiImportOverrides(await getSettingValue(ctx, AI_IMPORT_OVERRIDES_KEY));
    overrides[args.type] = { enabled: args.enabled };
    await upsertSetting(ctx, AI_IMPORT_OVERRIDES_KEY, overrides);
    return null;
  },
  returns: v.null(),
});

export const bulkSetTypeAiImportOverride = mutation({
  args: { enabled: v.boolean(), types: v.array(v.string()) },
  handler: async (ctx, args) => {
    const overrides = normalizeAiImportOverrides(await getSettingValue(ctx, AI_IMPORT_OVERRIDES_KEY));
    args.types
      .filter((type) => SUPPORTED_CUSTOM_TYPES.has(type))
      .forEach((type) => {
        overrides[type] = { enabled: args.enabled };
      });
    await upsertSetting(ctx, AI_IMPORT_OVERRIDES_KEY, overrides);
    return null;
  },
  returns: v.null(),
});

export const setHomePageBackground = mutation({
  args: {
    enabled: v.boolean(),
    type: v.union(
      v.literal("white"),
      v.literal("black"),
      v.literal("primary"),
      v.literal("secondary"),
      v.literal("custom")
    ),
    customColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const next = {
      enabled: args.enabled,
      type: args.type,
      customColor: args.customColor ?? "",
    };
    await upsertSetting(ctx, HOME_PAGE_BACKGROUND_KEY, next);
    return null;
  },
  returns: v.null(),
});

export const setHiddenLayouts = mutation({
  args: { hiddenLayouts: v.array(v.string()) },
  handler: async (ctx, args) => {
    const normalized = normalizeHiddenTypes(args.hiddenLayouts);
    await upsertSetting(ctx, HIDDEN_LAYOUTS_KEY, normalized);
    return null;
  },
  returns: v.null(),
});

export const hideUnusedLayoutsAndTypes = mutation({
  args: {},
  handler: async (ctx) => {
    const components = await ctx.db.query("homeComponents").collect();
    const usedTypes = new Set<string>();
    const usedLayouts = new Set<string>();

    components.forEach((c) => {
      usedTypes.add(c.type);
      const style = c.config?.style ?? c.config?.layout;
      if (typeof style === "string" && style.trim().length > 0) {
        usedLayouts.add(`${c.type}:${style.trim()}`);
      }
    });

    const hiddenTypes: string[] = [];
    const hiddenLayouts: string[] = [];

    Object.entries(COMPONENT_LAYOUTS).forEach(([type, layouts]) => {
      if (!usedTypes.has(type)) {
        hiddenTypes.push(type);
      } else {
        layouts.forEach((style) => {
          if (!usedLayouts.has(`${type}:${style}`)) {
            hiddenLayouts.push(`${type}:${style}`);
          }
        });
      }
    });

    await upsertSetting(ctx, HIDDEN_TYPES_KEY, hiddenTypes);
    await upsertSetting(ctx, HIDDEN_LAYOUTS_KEY, hiddenLayouts);

    return {
      hiddenTypesCount: hiddenTypes.length,
      hiddenLayoutsCount: hiddenLayouts.length,
    };
  },
  returns: v.object({
    hiddenTypesCount: v.number(),
    hiddenLayoutsCount: v.number(),
  }),
});

export const showAllLayoutsAndTypes = mutation({
  args: {},
  handler: async (ctx) => {
    await upsertSetting(ctx, HIDDEN_TYPES_KEY, []);
    await upsertSetting(ctx, HIDDEN_LAYOUTS_KEY, []);
    return null;
  },
  returns: v.null(),
});

