import { action, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { consumeRateLimit } from "./lib/rateLimit";
import { normalizeSearchText } from "./lib/search";

const AI_GROUP = "ai";
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

const DEFAULT_CONFIG = {
  model: "gemini-2.5-flash-lite",
  systemPrompt:
    "Bạn là trợ lý AI của website. Trả lời bằng tiếng Việt, ngắn gọn, lịch sự, ưu tiên dựa trên dữ liệu site được cung cấp và gợi ý link phù hợp khi có.",
  temperature: 0.4,
};

const suggestionDoc = v.object({
  title: v.string(),
  type: v.union(
    v.literal("post"),
    v.literal("product"),
    v.literal("service"),
    v.literal("course"),
    v.literal("project"),
    v.literal("resource")
  ),
  url: v.string(),
});

type SearchItem = {
  title: string;
  type: "post" | "product" | "service" | "course" | "project" | "resource";
  url: string;
};

type SearchGroup = {
  items: SearchItem[];
};

type SearchResult = {
  posts: SearchGroup;
  products: SearchGroup;
  services: SearchGroup;
  courses: SearchGroup;
  projects: SearchGroup;
  resources: SearchGroup;
};

type RuntimeConfig = {
  apiKey: string;
  enabled: boolean;
  model: string;
  provider: "gemini";
  systemPrompt: string;
  temperature: number;
};

type SendMessageResult = {
  message: string;
  model: string;
  provider: "gemini";
  suggestions: SearchItem[];
};

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

const sanitizeMessage = (message: string) => message.trim().slice(0, 1200);

const GREETING_ONLY_QUERIES = new Set([
  "alo",
  "cam on",
  "chao",
  "chao ban",
  "hello",
  "hey",
  "hi",
  "ok",
  "test",
  "thank you",
  "thanks",
  "xin chao",
  "xin chao ban",
]);

const isGreetingOnly = (message: string) => GREETING_ONLY_QUERIES.has(normalizeSearchText(message));

const formatSuggestionsForPrompt = (suggestions: SearchItem[]) => {
  if (suggestions.length === 0) {
    return "Không tìm thấy dữ liệu site khớp trực tiếp.";
  }
  return suggestions
    .map((item, index) => `${index + 1}. [${item.type}] ${item.title} - ${item.url}`)
    .join("\n");
};

const flattenSuggestions = (result: SearchResult): SearchItem[] => {
  const orderedGroups = [
    result.products,
    result.services,
    result.courses,
    result.posts,
    result.projects,
    result.resources,
  ];
  const seen = new Set<string>();
  const items: SearchItem[] = [];

  for (const group of orderedGroups) {
    for (const item of group.items) {
      const key = `${item.type}:${item.url}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      items.push({ title: item.title, type: item.type, url: item.url });
      if (items.length >= 8) {
        return items;
      }
    }
  }

  return items;
};

async function generateGeminiAnswer(args: {
  apiKey: string;
  message: string;
  model: string;
  sourcePath?: string;
  suggestions: SearchItem[];
  systemPrompt: string;
  temperature: number;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(args.model)}:generateContent`,
      {
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: [
                    `Câu hỏi khách: ${args.message}`,
                    args.sourcePath ? `Trang hiện tại: ${args.sourcePath}` : "",
                    "",
                    "Dữ liệu site liên quan:",
                    formatSuggestionsForPrompt(args.suggestions),
                  ].filter(Boolean).join("\n"),
                },
              ],
              role: "user",
            },
          ],
          generationConfig: {
            maxOutputTokens: 700,
            temperature: args.temperature,
          },
          systemInstruction: {
            parts: [{ text: args.systemPrompt }],
          },
        }),
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": args.apiKey,
        },
        method: "POST",
        signal: controller.signal,
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof data?.error?.message === "string"
        ? data.error.message
        : "Gemini API không phản hồi hợp lệ.";
      throw new Error(message);
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim();

    if (!text) {
      throw new Error("Gemini không trả về nội dung.");
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export const getRuntimeConfig = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await Promise.all(AI_SETTING_KEYS.map((key) =>
      ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique()
    ));
    const settings = Object.fromEntries(rows.filter(Boolean).map((row) => [row!.key, row!.value]));
    const secret = await ctx.db
      .query("integrationSecrets")
      .withIndex("by_group_key", (q) => q.eq("group", AI_GROUP).eq("key", AI_SECRET_KEY))
      .unique();

    return {
      apiKey: secret?.value ?? "",
      enabled: toBooleanValue(settings.ai_chatbot_enabled, false),
      model: toStringValue(settings.ai_model, DEFAULT_CONFIG.model),
      provider: "gemini" as const,
      systemPrompt: toStringValue(settings.ai_system_prompt, DEFAULT_CONFIG.systemPrompt),
      temperature: toNumberValue(settings.ai_temperature, DEFAULT_CONFIG.temperature, 0, 1),
    };
  },
  returns: v.object({
    apiKey: v.string(),
    enabled: v.boolean(),
    model: v.string(),
    provider: v.literal("gemini"),
    systemPrompt: v.string(),
    temperature: v.number(),
  }),
});

export const consumeAiChatRateLimit = internalMutation({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    const key = args.identifier.trim().slice(0, 160) || "anonymous";
    return await consumeRateLimit(ctx, key, "aiChat");
  },
  returns: v.object({
    allowed: v.boolean(),
    remaining: v.number(),
    resetIn: v.number(),
  }),
});

export const sendMessage = action({
  args: {
    message: v.string(),
    sessionId: v.optional(v.string()),
    sourcePath: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<SendMessageResult> => {
    const message = sanitizeMessage(args.message);
    if (!message) {
      throw new Error("Vui lòng nhập nội dung cần hỏi.");
    }

    const identifier = `ai-chat:${(args.sessionId ?? args.sourcePath ?? "anonymous").slice(0, 140)}`;
    const rateLimit: { allowed: boolean; remaining: number; resetIn: number } = await ctx.runMutation(
      internal.aiChat.consumeAiChatRateLimit,
      { identifier }
    );
    if (!rateLimit.allowed) {
      throw new Error("Bạn đang hỏi hơi nhanh. Vui lòng thử lại sau ít phút.");
    }

    const config: RuntimeConfig = await ctx.runQuery(internal.aiChat.getRuntimeConfig, {});
    if (!config.enabled) {
      throw new Error("Chatbot AI đang tắt.");
    }
    if (!config.apiKey) {
      throw new Error("Chatbot AI chưa có API key.");
    }

    const suggestions = isGreetingOnly(message)
      ? []
      : flattenSuggestions(await ctx.runQuery(api.search.autocomplete, {
        limit: 3,
        query: message.slice(0, 180),
        searchCourses: true,
        searchPosts: true,
        searchProducts: true,
        searchProjects: true,
        searchResources: true,
        searchServices: true,
      }) as SearchResult);
    const answer = await generateGeminiAnswer({
      apiKey: config.apiKey,
      message,
      model: config.model,
      sourcePath: args.sourcePath,
      suggestions,
      systemPrompt: config.systemPrompt,
      temperature: config.temperature,
    });

    return {
      message: answer,
      model: config.model,
      provider: config.provider,
      suggestions,
    };
  },
  returns: v.object({
    message: v.string(),
    model: v.string(),
    provider: v.literal("gemini"),
    suggestions: v.array(suggestionDoc),
  }),
});
