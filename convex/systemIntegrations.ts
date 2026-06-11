import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { TRUST_PAGE_SLOTS } from "../lib/ia/trust-pages";
import { buildModuleListPath, type RoutableModuleKey } from "../lib/ia/route-mode";
import { EXPERIENCE_NAMES, type ExperienceKey } from "../lib/experiences/constants";

const AI_GROUP = "ai";
const AI_SECRET_KEY = "gemini_api_key";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_CHATJPT_MODEL = "@cf/openai/gpt-oss-120b";

const AI_SETTING_KEYS = [
  "ai_chatbot_enabled",
  "ai_provider",
  "ai_model",
  "ai_temperature",
  "ai_system_prompt",
  "ai_widget_title",
  "ai_widget_greeting",
] as const;

const PUBLIC_SETTING_KEYS = [
  "contact_address",
  "contact_email",
  "contact_phone",
  "contact_zalo",
  "ia_auto_resolve_slug",
  "ia_page_about",
  "ia_page_faq",
  "ia_page_payment",
  "ia_page_privacy",
  "ia_page_return_policy",
  "ia_page_shipping",
  "ia_page_terms",
  "ia_route_mode",
  "seo_description",
  "seo_keywords",
  "seo_title",
  "site_language",
  "site_name",
  "site_tagline",
  "site_url",
  "social_facebook",
  "social_instagram",
  "social_tiktok",
  "social_youtube",
] as const;

const DEFAULT_AI_CONFIG = {
  enabled: false,
  model: DEFAULT_GEMINI_MODEL,
  provider: "gemini",
  systemPrompt:
    "Bạn là trợ lý AI của website. Trả lời bằng tiếng Việt, ngắn gọn, lịch sự, ưu tiên dựa trên dữ liệu site được cung cấp và gợi ý link phù hợp khi có.",
  temperature: 0.4,
  widgetGreeting: "Xin chào, tôi có thể hỗ trợ gì cho bạn?",
  widgetTitle: "Trợ lý AI",
} as const;

type AiProvider = "gemini" | "chatjpt";
type SearchScope = {
  searchCourses: boolean;
  searchPosts: boolean;
  searchProducts: boolean;
  searchProjects: boolean;
  searchResources: boolean;
  searchServices: boolean;
};
type PublicModuleKey =
  | RoutableModuleKey
  | "bookings"
  | "cart"
  | "comments"
  | "customers"
  | "orders"
  | "promotions"
  | "wishlist";
type ModuleInfo = {
  key: PublicModuleKey;
  label: string;
  route?: string;
};
type ExperienceInfo = {
  key: ExperienceKey;
  label: string;
  moduleKeys: PublicModuleKey[];
  route?: string;
};

const ROUTABLE_MODULES: ModuleInfo[] = [
  { key: "products", label: "Sản phẩm", route: buildModuleListPath("products") },
  { key: "posts", label: "Bài viết", route: buildModuleListPath("posts") },
  { key: "services", label: "Dịch vụ", route: buildModuleListPath("services") },
  { key: "courses", label: "Khóa học", route: buildModuleListPath("courses") },
  { key: "projects", label: "Dự án", route: buildModuleListPath("projects") },
  { key: "resources", label: "Tài nguyên", route: buildModuleListPath("resources") },
];

const CAPABILITY_MODULES: ModuleInfo[] = [
  { key: "cart", label: "Giỏ hàng" },
  { key: "orders", label: "Đặt hàng và theo dõi đơn" },
  { key: "wishlist", label: "Sản phẩm yêu thích" },
  { key: "comments", label: "Bình luận và đánh giá" },
  { key: "bookings", label: "Đặt lịch" },
  { key: "promotions", label: "Khuyến mãi" },
  { key: "customers", label: "Tài khoản khách hàng" },
];

const EXPERIENCE_DEPENDENCIES: ExperienceInfo[] = [
  { key: "products_list_ui", label: EXPERIENCE_NAMES.products_list_ui, moduleKeys: ["products"], route: "/products" },
  { key: "product_detail_ui", label: EXPERIENCE_NAMES.product_detail_ui, moduleKeys: ["products"] },
  { key: "posts_list_ui", label: EXPERIENCE_NAMES.posts_list_ui, moduleKeys: ["posts"], route: "/posts" },
  { key: "posts_detail_ui", label: EXPERIENCE_NAMES.posts_detail_ui, moduleKeys: ["posts"] },
  { key: "services_list_ui", label: EXPERIENCE_NAMES.services_list_ui, moduleKeys: ["services"], route: "/services" },
  { key: "services_detail_ui", label: EXPERIENCE_NAMES.services_detail_ui, moduleKeys: ["services"] },
  { key: "projects_list_ui", label: EXPERIENCE_NAMES.projects_list_ui, moduleKeys: ["projects"], route: "/projects" },
  { key: "projects_detail_ui", label: EXPERIENCE_NAMES.projects_detail_ui, moduleKeys: ["projects"] },
  { key: "courses_list_ui", label: EXPERIENCE_NAMES.courses_list_ui, moduleKeys: ["courses"], route: "/khoa-hoc" },
  { key: "courses_detail_ui", label: EXPERIENCE_NAMES.courses_detail_ui, moduleKeys: ["courses"] },
  { key: "resources_list_ui", label: EXPERIENCE_NAMES.resources_list_ui, moduleKeys: ["resources"], route: "/resources" },
  { key: "resources_detail_ui", label: EXPERIENCE_NAMES.resources_detail_ui, moduleKeys: ["resources"] },
  { key: "cart_ui", label: EXPERIENCE_NAMES.cart_ui, moduleKeys: ["cart"] },
  { key: "checkout_ui", label: EXPERIENCE_NAMES.checkout_ui, moduleKeys: ["cart", "orders"] },
  { key: "wishlist_ui", label: EXPERIENCE_NAMES.wishlist_ui, moduleKeys: ["wishlist"] },
  { key: "comments_rating_ui", label: EXPERIENCE_NAMES.comments_rating_ui, moduleKeys: ["comments"] },
  { key: "booking_ui", label: EXPERIENCE_NAMES.booking_ui, moduleKeys: ["bookings"] },
  { key: "promotions_list_ui", label: EXPERIENCE_NAMES.promotions_list_ui, moduleKeys: ["promotions"] },
  { key: "account_orders_ui", label: EXPERIENCE_NAMES.account_orders_ui, moduleKeys: ["customers", "orders"] },
  { key: "account_profile_ui", label: EXPERIENCE_NAMES.account_profile_ui, moduleKeys: ["customers"] },
  { key: "contact_ui", label: EXPERIENCE_NAMES.contact_ui, moduleKeys: [], route: "/contact" },
  { key: "search_filter_ui", label: EXPERIENCE_NAMES.search_filter_ui, moduleKeys: ["products"], route: "/search" },
];

const PUBLIC_MODULE_KEYS = [...ROUTABLE_MODULES, ...CAPABILITY_MODULES].map((item) => item.key);

const aiConfigDoc = v.object({
  enabled: v.boolean(),
  hasApiKey: v.boolean(),
  maskedApiKey: v.optional(v.string()),
  model: v.string(),
  provider: v.union(v.literal("gemini"), v.literal("chatjpt")),
  systemPrompt: v.string(),
  temperature: v.number(),
  widgetGreeting: v.string(),
  widgetTitle: v.string(),
});

const searchScopeDoc = v.object({
  searchCourses: v.boolean(),
  searchPosts: v.boolean(),
  searchProducts: v.boolean(),
  searchProjects: v.boolean(),
  searchResources: v.boolean(),
  searchServices: v.boolean(),
});

const publicAiAssistantContextDoc = v.object({
  prompt: v.string(),
  searchScope: searchScopeDoc,
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

const normalizeProvider = (value: unknown): AiProvider => (
  value === "chatjpt" ? "chatjpt" : "gemini"
);

const normalizeModel = (provider: AiProvider, value: unknown) => {
  const model = toStringValue(value, "");
  if (provider === "chatjpt") {
    return model.startsWith("@cf/") ? model : DEFAULT_CHATJPT_MODEL;
  }
  return model.startsWith("gemini-") ? model : DEFAULT_GEMINI_MODEL;
};

const joinLabels = (items: string[]) => items.length > 0 ? items.join(", ") : "Không có";

const resolveOptionalString = (settings: Record<string, unknown>, key: string) => (
  typeof settings[key] === "string" && settings[key].trim() ? settings[key].trim() : ""
);

const buildPublicAiContextPrompt = (args: {
  enabledExperiences: ExperienceInfo[];
  enabledRoutableModules: ModuleInfo[];
  enabledCapabilities: ModuleInfo[];
  settings: Record<string, unknown>;
  searchScope: SearchScope;
}) => {
  const siteName = resolveOptionalString(args.settings, "site_name") || "Website";
  const tagline = resolveOptionalString(args.settings, "site_tagline");
  const siteUrl = resolveOptionalString(args.settings, "site_url");
  const language = resolveOptionalString(args.settings, "site_language") || "vi";
  const contactParts = [
    resolveOptionalString(args.settings, "contact_phone") ? `điện thoại ${resolveOptionalString(args.settings, "contact_phone")}` : "",
    resolveOptionalString(args.settings, "contact_email") ? `email ${resolveOptionalString(args.settings, "contact_email")}` : "",
    resolveOptionalString(args.settings, "contact_zalo") ? `Zalo ${resolveOptionalString(args.settings, "contact_zalo")}` : "",
    resolveOptionalString(args.settings, "contact_address") ? `địa chỉ ${resolveOptionalString(args.settings, "contact_address")}` : "",
  ].filter(Boolean);
  const socials = [
    resolveOptionalString(args.settings, "social_facebook") ? "Facebook" : "",
    resolveOptionalString(args.settings, "social_instagram") ? "Instagram" : "",
    resolveOptionalString(args.settings, "social_youtube") ? "YouTube" : "",
    resolveOptionalString(args.settings, "social_tiktok") ? "TikTok" : "",
  ].filter(Boolean);
  const trustPages = TRUST_PAGE_SLOTS
    .filter((slot) => toBooleanValue(args.settings[slot.iaKey], true))
    .map((slot) => `${slot.label} (${slot.slug})`);
  const listRoutes = args.enabledRoutableModules
    .filter((item) => item.route)
    .map((item) => `${item.label}: ${item.route}`);
  const searchTypes = [
    args.searchScope.searchProducts ? "sản phẩm" : "",
    args.searchScope.searchPosts ? "bài viết" : "",
    args.searchScope.searchServices ? "dịch vụ" : "",
    args.searchScope.searchCourses ? "khóa học" : "",
    args.searchScope.searchProjects ? "dự án" : "",
    args.searchScope.searchResources ? "tài nguyên" : "",
  ].filter(Boolean);
  const seoSummary = [
    resolveOptionalString(args.settings, "seo_title"),
    resolveOptionalString(args.settings, "seo_description"),
    resolveOptionalString(args.settings, "seo_keywords"),
  ].filter(Boolean).join(" | ").slice(0, 360);
  const routeMode = args.settings.ia_route_mode === "namespace" ? "namespace" : "unified";
  const detailPattern = routeMode === "namespace"
    ? "/{nhom-noi-dung}/{slug}; nếu có danh mục SEO thì có thể là /{categorySlug}/{slug}"
    : "/{categorySlug}/{slug}; fallback /{nhom-noi-dung}/{slug} khi thiếu danh mục";

  return [
    "Ngữ cảnh vận hành nội bộ, dùng để hiểu website. Không giải thích nguồn cấu hình hoặc trạng thái kỹ thuật cho khách.",
    `- Website: ${siteName}${tagline ? ` - ${tagline}` : ""}${siteUrl ? ` (${siteUrl})` : ""}; ngôn ngữ ưu tiên: ${language}.`,
    seoSummary ? `- Định vị/nội dung SEO: ${seoSummary}` : "",
    contactParts.length > 0 ? `- Liên hệ công khai: ${contactParts.join("; ")}.` : "",
    socials.length > 0 ? `- Kênh xã hội đang dùng: ${socials.join(", ")}.` : "",
    `- Nhóm nội dung có thể tư vấn và dẫn link: ${joinLabels(args.enabledRoutableModules.map((item) => item.label))}.`,
    args.enabledCapabilities.length > 0 ? `- Chức năng khách có thể dùng: ${joinLabels(args.enabledCapabilities.map((item) => item.label))}.` : "",
    `- Route danh sách chính: ${joinLabels(listRoutes)}.`,
    trustPages.length > 0 ? `- Trang thông tin/chính sách có thể dẫn link: ${trustPages.join(", ")}.` : "",
    args.enabledExperiences.length > 0 ? `- Luồng giao diện public đã cấu hình: ${joinLabels(args.enabledExperiences.map((item) => item.label))}.` : "",
    `- Pattern link chi tiết: ${detailPattern}.`,
    `- Giao thức tìm dữ liệu: chỉ tìm trong ${joinLabels(searchTypes)} và truyền tối đa vài gợi ý liên quan vào prompt. Ưu tiên trả lời dựa trên gợi ý; nếu không có gợi ý khớp, hướng khách tới route danh sách/tìm kiếm phù hợp hoặc mời liên hệ.`,
    "- Không khẳng định sản phẩm/bài viết/dịch vụ/khóa học cụ thể tồn tại nếu không có trong gợi ý hoặc ngữ cảnh đang có.",
  ].filter(Boolean).join("\n");
};

function normalizeConfig(settings: Record<string, unknown>, hasApiKey: boolean, maskedApiKey?: string) {
  const provider = normalizeProvider(settings.ai_provider);
  const config = {
    enabled: toBooleanValue(settings.ai_chatbot_enabled, DEFAULT_AI_CONFIG.enabled),
    hasApiKey,
    model: normalizeModel(provider, settings.ai_model),
    provider,
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
    const isChatjpt = config.provider === "chatjpt";
    return {
      enabled: config.enabled && (isChatjpt || config.hasApiKey),
      model: config.model,
      provider: config.provider,
      widgetGreeting: config.widgetGreeting,
      widgetTitle: config.widgetTitle,
    };
  },
  returns: v.object({
    enabled: v.boolean(),
    model: v.string(),
    provider: v.union(v.literal("gemini"), v.literal("chatjpt")),
    widgetGreeting: v.string(),
    widgetTitle: v.string(),
  }),
});

export const getPublicAiAssistantContext = query({
  args: {},
  handler: async (ctx) => {
    const [settings, moduleRows] = await Promise.all([
      readSettings(ctx, PUBLIC_SETTING_KEYS),
      Promise.all(PUBLIC_MODULE_KEYS.map((key) =>
        ctx.db
          .query("adminModules")
          .withIndex("by_key", (q) => q.eq("key", key))
          .unique()
      )),
    ]);

    const enabledByKey = new Map<PublicModuleKey, boolean>();
    PUBLIC_MODULE_KEYS.forEach((key, index) => {
      enabledByKey.set(key, moduleRows[index]?.enabled === true);
    });
    const isEnabled = (key: PublicModuleKey) => enabledByKey.get(key) === true;
    const enabledRoutableModules = ROUTABLE_MODULES.filter((item) => isEnabled(item.key));
    const enabledCapabilities = CAPABILITY_MODULES.filter((item) => isEnabled(item.key));
    const enabledExperiences = EXPERIENCE_DEPENDENCIES.filter((item) =>
      item.moduleKeys.length === 0 || item.moduleKeys.every((key) => isEnabled(key))
    );
    const searchScope: SearchScope = {
      searchCourses: isEnabled("courses"),
      searchPosts: isEnabled("posts"),
      searchProducts: isEnabled("products"),
      searchProjects: isEnabled("projects"),
      searchResources: isEnabled("resources"),
      searchServices: isEnabled("services"),
    };

    return {
      prompt: buildPublicAiContextPrompt({
        enabledCapabilities,
        enabledExperiences,
        enabledRoutableModules,
        searchScope,
        settings,
      }),
      searchScope,
    };
  },
  returns: publicAiAssistantContextDoc,
});

export const saveAiConfig = mutation({
  args: {
    apiKey: v.optional(v.string()),
    clearApiKey: v.optional(v.boolean()),
    enabled: v.boolean(),
    model: v.string(),
    provider: v.union(v.literal("gemini"), v.literal("chatjpt")),
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
