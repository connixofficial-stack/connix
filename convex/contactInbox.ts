import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { consumeRateLimit } from "./lib/rateLimit";

const contactStatus = v.union(
  v.literal("new"),
  v.literal("in_progress"),
  v.literal("resolved"),
  v.literal("spam")
);

const contactInquiryDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("contactInquiries"),
  createdAt: v.number(),
  email: v.optional(v.string()),
  handledAt: v.optional(v.number()),
  handledBy: v.optional(v.id("users")),
  message: v.string(),
  name: v.string(),
  phone: v.optional(v.string()),
  sourcePath: v.string(),
  status: contactStatus,
  subject: v.string(),
  updatedAt: v.number(),
});

const statsDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("contactInboxStats"),
  count: v.number(),
  key: v.string(),
});

const sanitizeText = (value: string, max: number) => value.trim().slice(0, max);
const MAX_ADMIN_SELECTION = 5000;

function getContactRateLimitKey(args: {
  email?: string;
  name: string;
  phone?: string;
  sourcePath?: string;
}) {
  const identity = args.email?.trim().toLowerCase()
    || args.phone?.trim().toLowerCase()
    || args.name.trim().toLowerCase()
    || "anonymous";
  const source = args.sourcePath?.trim().slice(0, 120) || "/contact";
  return `${identity}:${source}`;
}

async function adjustStat(ctx: MutationCtx, key: string, delta: number) {
  const existing = await ctx.db
    .query("contactInboxStats")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { count: Math.max(0, existing.count + delta) });
    return;
  }
  await ctx.db.insert("contactInboxStats", { key, count: Math.max(0, delta) });
}

async function bumpStatsOnCreate(ctx: MutationCtx) {
  await Promise.all([
    adjustStat(ctx, "total", 1),
    adjustStat(ctx, "new", 1),
  ]);
}

async function bumpStatsOnStatusChange(ctx: MutationCtx, prev: string, next: string) {
  if (prev === next) {
    return;
  }
  await Promise.all([
    adjustStat(ctx, prev, -1),
    adjustStat(ctx, next, 1),
  ]);
}

async function fetchInboxRecords(
  ctx: QueryCtx,
  options: { status?: "new" | "in_progress" | "resolved" | "spam"; search?: string; max: number }
) {
  const max = Math.max(0, Math.min(options.max, MAX_ADMIN_SELECTION + 1));
  let records: Doc<"contactInquiries">[] = [];
  if (options.status) {
    records = await ctx.db
      .query("contactInquiries")
      .withIndex("by_status_createdAt", (q) => q.eq("status", options.status!))
      .order("desc")
      .take(max);
  } else {
    records = await ctx.db
      .query("contactInquiries")
      .withIndex("by_createdAt")
      .order("desc")
      .take(max);
  }

  if (options.search?.trim()) {
    const searchLower = options.search.trim().toLowerCase();
    records = records.filter((record) =>
      record.name.toLowerCase().includes(searchLower)
      || record.subject.toLowerCase().includes(searchLower)
      || record.email?.toLowerCase().includes(searchLower)
      || record.phone?.toLowerCase().includes(searchLower)
    );
  }

  return records;
}

export const submitContactInquiry = mutation({
  args: {
    email: v.optional(v.string()),
    message: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    sourcePath: v.optional(v.string()),
    subject: v.string(),
  },
  handler: async (ctx, args) => {
    const rateLimit = await consumeRateLimit(ctx, getContactRateLimitKey(args), "contactSubmit");
    if (!rateLimit.allowed) {
      throw new Error("Bạn gửi quá nhanh. Vui lòng thử lại sau.");
    }

    const [moduleItem, featureItem, moduleSettings] = await Promise.all([
      ctx.db.query("adminModules").withIndex("by_key", (q) => q.eq("key", "contactInbox")).unique(),
      ctx.db
        .query("moduleFeatures")
        .withIndex("by_module_feature", (q) => q.eq("moduleKey", "contactInbox").eq("featureKey", "enableContactFormSubmission"))
        .unique(),
      ctx.db.query("moduleSettings").withIndex("by_module", (q) => q.eq("moduleKey", "contactInbox")).collect(),
    ]);

    if (!moduleItem?.enabled || !featureItem?.enabled) {
      throw new Error("Biểu mẫu liên hệ đang tạm tắt.");
    }

    const name = sanitizeText(args.name, 120);
    const email = args.email ? sanitizeText(args.email, 160) : undefined;
    const phone = args.phone ? sanitizeText(args.phone, 40) : undefined;
    const subject = sanitizeText(args.subject, 160);
    const message = sanitizeText(args.message, 2000);
    const sourcePath = sanitizeText(args.sourcePath ?? "/contact", 200) || "/contact";

    const requireEmail = moduleSettings.find(setting => setting.settingKey === "requireEmail")?.value === true;
    const requirePhone = moduleSettings.find(setting => setting.settingKey === "requirePhone")?.value === true;

    if (!name || !subject || !message) {
      throw new Error("Vui lòng nhập đầy đủ họ tên, chủ đề và nội dung.");
    }
    if (requireEmail && !email) {
      throw new Error("Email là bắt buộc.");
    }
    if (requirePhone && !phone) {
      throw new Error("Số điện thoại là bắt buộc.");
    }

    const now = Date.now();
    const recordId = await ctx.db.insert("contactInquiries", {
      createdAt: now,
      email,
      message,
      name,
      phone,
      sourcePath,
      status: "new",
      subject,
      updatedAt: now,
    });

    await bumpStatsOnCreate(ctx);

    return { success: true, id: recordId };
  },
  returns: v.object({ id: v.id("contactInquiries"), success: v.boolean() }),
});

export const listInbox = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(contactStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 50, 500);
    const records = await fetchInboxRecords(ctx, {
      max: fetchLimit,
      search: args.search,
      status: args.status,
    });

    return records.slice(offset, offset + limit);
  },
  returns: v.array(contactInquiryDoc),
});

export const listRecentInbox = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5, 20);
    return ctx.db
      .query("contactInquiries")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
  returns: v.array(contactInquiryDoc),
});

export const getInboxStats = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db.query("contactInboxStats").collect();
    const map = new Map(stats.map((stat) => [stat.key, stat.count]));
    return {
      in_progress: map.get("in_progress") ?? 0,
      new: map.get("new") ?? 0,
      resolved: map.get("resolved") ?? 0,
      spam: map.get("spam") ?? 0,
      total: map.get("total") ?? 0,
    };
  },
  returns: v.object({
    in_progress: v.number(),
    new: v.number(),
    resolved: v.number(),
    spam: v.number(),
    total: v.number(),
  }),
});

export const countAdmin = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(contactStatus),
  },
  handler: async (ctx, args) => {
    const records = await fetchInboxRecords(ctx, {
      max: MAX_ADMIN_SELECTION + 1,
      search: args.search,
      status: args.status,
    });
    return {
      count: Math.min(records.length, MAX_ADMIN_SELECTION),
      hasMore: records.length > MAX_ADMIN_SELECTION,
    };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(contactStatus),
  },
  handler: async (ctx, args) => {
    const records = await fetchInboxRecords(ctx, {
      max: MAX_ADMIN_SELECTION + 1,
      search: args.search,
      status: args.status,
    });
    const ids = records.slice(0, MAX_ADMIN_SELECTION).map((record) => record._id);
    return { ids, hasMore: records.length > MAX_ADMIN_SELECTION };
  },
  returns: v.object({ ids: v.array(v.id("contactInquiries")), hasMore: v.boolean() }),
});

export const getById = query({
  args: { id: v.id("contactInquiries") },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    return record ?? null;
  },
  returns: v.union(contactInquiryDoc, v.null()),
});

export const updateInquiryStatus = mutation({
  args: {
    id: v.id("contactInquiries"),
    status: contactStatus,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Không tìm thấy tin nhắn");
    }
    const now = Date.now();
    const handledAt = args.status === "new" ? undefined : (existing.handledAt ?? now);
    await ctx.db.patch(args.id, {
      handledAt,
      status: args.status,
      updatedAt: now,
    });

    await bumpStatsOnStatusChange(ctx, existing.status, args.status);

    return { success: true };
  },
  returns: v.object({ success: v.boolean() }),
});

export const updateInquiry = mutation({
  args: {
    email: v.optional(v.string()),
    id: v.id("contactInquiries"),
    message: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    status: contactStatus,
    subject: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Không tìm thấy tin nhắn");
    }

    const name = sanitizeText(args.name, 120);
    const email = args.email ? sanitizeText(args.email, 160) : undefined;
    const phone = args.phone ? sanitizeText(args.phone, 40) : undefined;
    const subject = sanitizeText(args.subject, 160);
    const message = sanitizeText(args.message, 2000);

    if (!name || !subject || !message) {
      throw new Error("Vui lòng nhập đầy đủ họ tên, chủ đề và nội dung.");
    }

    const now = Date.now();
    const handledAt = args.status === "new" ? undefined : (existing.handledAt ?? now);
    await ctx.db.patch(args.id, {
      email,
      handledAt,
      message,
      name,
      phone,
      status: args.status,
      subject,
      updatedAt: now,
    });

    await bumpStatsOnStatusChange(ctx, existing.status, args.status);

    return { success: true };
  },
  returns: v.object({ success: v.boolean() }),
});

export const remove = mutation({
  args: { id: v.id("contactInquiries") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Không tìm thấy tin nhắn");
    }

    await ctx.db.delete(args.id);
    await Promise.all([
      adjustStat(ctx, "total", -1),
      adjustStat(ctx, existing.status, -1),
    ]);

    return { success: true };
  },
  returns: v.object({ success: v.boolean() }),
});

export const bulkRemove = mutation({
  args: { ids: v.array(v.id("contactInquiries")) },
  handler: async (ctx, args) => {
    const records = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    const existingRecords = records.filter(Boolean) as Doc<"contactInquiries">[];

    if (existingRecords.length === 0) {
      return 0;
    }

    const statusCounts = existingRecords.reduce<Record<string, number>>((acc, record) => {
      acc[record.status] = (acc[record.status] ?? 0) + 1;
      return acc;
    }, {});

    await Promise.all([
      adjustStat(ctx, "total", -existingRecords.length),
      ...Object.entries(statusCounts).map(([status, count]) => adjustStat(ctx, status, -count)),
      ...existingRecords.map((record) => ctx.db.delete(record._id)),
    ]);

    return existingRecords.length;
  },
  returns: v.number(),
});

export const getInboxStatsRows = query({
  args: {},
  handler: async (ctx) => ctx.db.query("contactInboxStats").collect(),
  returns: v.array(statsDoc),
});
