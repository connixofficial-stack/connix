import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const AI_GROUP = "ai";
const AI_PROVIDER = "gemini";
const AI_SECRET_KEY = "gemini_api_key";

const AI_SETTING_KEYS = [
  "ai_chatbot_enabled",
  "ai_provider",
  "ai_model",
  "ai_temperature",
  "ai_system_prompt",
  "ai_widget_title",
  "ai_widget_greeting",
] as const;

const DEFAULT_AI_CONFIG = {
  enabled: false,
  model: "gemini-2.5-flash-lite",
  provider: AI_PROVIDER,
  systemPrompt:
    "Bạn là trợ lý AI của website. Trả lời bằng tiếng Việt, ngắn gọn, lịch sự, ưu tiên dựa trên dữ liệu site được cung cấp và gợi ý link phù hợp khi có.",
  temperature: 0.4,
  widgetGreeting: "Xin chào, tôi có thể hỗ trợ gì cho bạn?",
  widgetTitle: "Trợ lý AI",
} as const;

const aiConfigDoc = v.object({
  enabled: v.boolean(),
  hasApiKey: v.boolean(),
  maskedApiKey: v.optional(v.string()),
  model: v.string(),
  provider: v.literal(AI_PROVIDER),
  systemPrompt: v.string(),
  temperature: v.number(),
  widgetGreeting: v.string(),
  widgetTitle: v.string(),
});

async function assertSystemSession(ctx: QueryCtx | MutationCtx, token: string) {
  if (!token || !token.startsWith("sys_")) {
    throw new Error("Phiên system không hợp lệ.");
  }

  const session = await ctx.db
    .query("systemSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Phiên system đã hết hạn.");
  }
}

async function readSettings(ctx: QueryCtx | MutationCtx, keys: readonly string[]) {
  const rows = await Promise.all(keys.map((key) =>
    ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique()
  ));
  return Object.fromEntries(rows.filter(Boolean).map((row) => [row!.key, row!.value]));
}

async function upsertSetting(ctx: MutationCtx, key: string, value: unknown) {
  const existing = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, { group: AI_GROUP, value });
    return;
  }

  await ctx.db.insert("settings", { group: AI_GROUP, key, value });
}

async function readSecret(ctx: QueryCtx | MutationCtx) {
  return await ctx.db
    .query("integrationSecrets")
    .withIndex("by_group_key", (q) => q.eq("group", AI_GROUP).eq("key", AI_SECRET_KEY))
    .unique();
}

async function upsertSecret(ctx: MutationCtx, value: string) {
  const existing = await readSecret(ctx);
  const now = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, { updatedAt: now, value });
    return;
  }
  await ctx.db.insert("integrationSecrets", {
    group: AI_GROUP,
    key: AI_SECRET_KEY,
    updatedAt: now,
    value,
  });
}

async function deleteSecret(ctx: MutationCtx) {
  const existing = await readSecret(ctx);
  if (existing) {
    await ctx.db.delete(existing._id);
  }
}

const toStringValue = (value: unknown, fallback: string) => (
  typeof value === "string" && value.trim() ? value.trim() : fallback
);

const toBooleanValue = (value: unknown, fallback: boolean) => (
  typeof value === "boolean" ? value : fallback
);

const toNumberValue = (value: unknown, fallback: number, min: number, max: number) => {
  const raw = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(raw)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, raw));
};

const maskSecret = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return `••••${trimmed.slice(-6)}`;
};

function normalizeConfig(settings: Record<string, unknown>, hasApiKey: boolean, maskedApiKey?: string) {
  const config = {
    enabled: toBooleanValue(settings.ai_chatbot_enabled, DEFAULT_AI_CONFIG.enabled),
    hasApiKey,
    model: toStringValue(settings.ai_model, DEFAULT_AI_CONFIG.model),
    provider: AI_PROVIDER as "gemini",
    systemPrompt: toStringValue(settings.ai_system_prompt, DEFAULT_AI_CONFIG.systemPrompt),
    temperature: toNumberValue(settings.ai_temperature, DEFAULT_AI_CONFIG.temperature, 0, 1),
    widgetGreeting: toStringValue(settings.ai_widget_greeting, DEFAULT_AI_CONFIG.widgetGreeting),
    widgetTitle: toStringValue(settings.ai_widget_title, DEFAULT_AI_CONFIG.widgetTitle),
  };
  return maskedApiKey ? { ...config, maskedApiKey } : config;
}

export const getAiConfig = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await assertSystemSession(ctx, args.token);
    const [settings, secret] = await Promise.all([
      readSettings(ctx, AI_SETTING_KEYS),
      readSecret(ctx),
    ]);
    return normalizeConfig(settings, Boolean(secret?.value), secret?.value ? maskSecret(secret.value) : undefined);
  },
  returns: aiConfigDoc,
});

export const getPublicAiConfig = query({
  args: {},
  handler: async (ctx) => {
    const [settings, secret] = await Promise.all([
      readSettings(ctx, AI_SETTING_KEYS),
      readSecret(ctx),
    ]);
    const config = normalizeConfig(settings, Boolean(secret?.value));
    return {
      enabled: config.enabled && config.hasApiKey,
      model: config.model,
      provider: config.provider,
      widgetGreeting: config.widgetGreeting,
      widgetTitle: config.widgetTitle,
    };
  },
  returns: v.object({
    enabled: v.boolean(),
    model: v.string(),
    provider: v.literal(AI_PROVIDER),
    widgetGreeting: v.string(),
    widgetTitle: v.string(),
  }),
});

export const saveAiConfig = mutation({
  args: {
    apiKey: v.optional(v.string()),
    clearApiKey: v.optional(v.boolean()),
    enabled: v.boolean(),
    model: v.string(),
    provider: v.literal(AI_PROVIDER),
    systemPrompt: v.string(),
    temperature: v.number(),
    token: v.string(),
    widgetGreeting: v.string(),
    widgetTitle: v.string(),
  },
  handler: async (ctx, args) => {
    await assertSystemSession(ctx, args.token);

    const model = args.model.trim() || DEFAULT_AI_CONFIG.model;
    const systemPrompt = args.systemPrompt.trim() || DEFAULT_AI_CONFIG.systemPrompt;
    const widgetTitle = args.widgetTitle.trim() || DEFAULT_AI_CONFIG.widgetTitle;
    const widgetGreeting = args.widgetGreeting.trim() || DEFAULT_AI_CONFIG.widgetGreeting;
    const temperature = toNumberValue(args.temperature, DEFAULT_AI_CONFIG.temperature, 0, 1);

    await Promise.all([
      upsertSetting(ctx, "ai_chatbot_enabled", args.enabled),
      upsertSetting(ctx, "ai_provider", args.provider),
      upsertSetting(ctx, "ai_model", model),
      upsertSetting(ctx, "ai_temperature", temperature),
      upsertSetting(ctx, "ai_system_prompt", systemPrompt),
      upsertSetting(ctx, "ai_widget_title", widgetTitle),
      upsertSetting(ctx, "ai_widget_greeting", widgetGreeting),
    ]);

    if (args.clearApiKey) {
      await deleteSecret(ctx);
    } else if (args.apiKey?.trim()) {
      await upsertSecret(ctx, args.apiKey.trim());
    }

    const secret = await readSecret(ctx);
    const result = {
      hasApiKey: Boolean(secret?.value),
      success: true,
    };
    const maskedApiKey = secret?.value ? maskSecret(secret.value) : undefined;
    return maskedApiKey ? { ...result, maskedApiKey } : result;
  },
  returns: v.object({
    hasApiKey: v.boolean(),
    maskedApiKey: v.optional(v.string()),
    success: v.boolean(),
  }),
});
