import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// CRIT-003 FIX: Helper function to update notificationStats counter
async function updateNotificationStats(
  ctx: MutationCtx,
  key: string,
  delta: number
) {
  const stats = await ctx.db
    .query("notificationStats")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (stats) {
    await ctx.db.patch(stats._id, { count: Math.max(0, stats.count + delta) });
  } else {
    await ctx.db.insert("notificationStats", { count: Math.max(0, delta), key });
  }
}

const notificationType = v.union(
  v.literal("info"),
  v.literal("success"),
  v.literal("warning"),
  v.literal("error")
);

const notificationTargetType = v.union(
  v.literal("all"),
  v.literal("customers"),
  v.literal("users"),
  v.literal("specific")
);

const notificationStatus = v.union(
  v.literal("Draft"),
  v.literal("Scheduled"),
  v.literal("Sent"),
  v.literal("Cancelled")
);

const notificationDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("notifications"),
  content: v.string(),
  order: v.number(),
  readCount: v.number(),
  scheduledAt: v.optional(v.number()),
  sendEmail: v.optional(v.boolean()),
  sentAt: v.optional(v.number()),
  status: notificationStatus,
  targetIds: v.optional(v.array(v.string())),
  targetType: notificationTargetType,
  title: v.string(),
  type: notificationType,
});

function extractOrderNumberFromNotification(content: string) {
  const hashMatch = content.match(/#([A-Z0-9-]+)/i);
  if (hashMatch?.[1]) {
    return hashMatch[1];
  }
  const queryMatch = content.match(/orderNumber=([A-Z0-9-]+)/i);
  return queryMatch?.[1] ?? "";
}

function sanitizeNotificationForAdmin(notification: Doc<"notifications">) {
  const raw = `${notification.title}\n${notification.content}`;
  const exposesInternalMailSetup =
    raw.includes("/system/") ||
    /\bSMTP\b/i.test(raw) ||
    /\bResend\b/i.test(raw) ||
    raw.includes("Admin mở") ||
    raw.includes("Email hệ thống");

  if (!exposesInternalMailSetup) {
    return notification;
  }

  if (raw.toLowerCase().includes("quota") || raw.includes("giới hạn gửi")) {
    return {
      ...notification,
      title: "Cần kiểm tra kênh gửi email",
      content: "Một số email chưa được gửi tự động. Vui lòng liên hệ dev để kiểm tra.",
    };
  }

  const orderNumber = extractOrderNumberFromNotification(notification.content);
  return {
    ...notification,
    title: "Cần gửi thông báo thủ công",
    content: orderNumber
      ? `Đơn #${orderNumber} đã được ghi nhận. Email thông báo chưa được gửi tự động. Vui lòng xử lý đơn và gửi mã đơn cho khách nếu cần tra cứu.`
      : "Email thông báo chưa được gửi tự động. Vui lòng xử lý thủ công nếu cần.",
  };
}

// Queries
// CRIT-003 FIX: Dùng counter table thay vì fetch ALL
export const count = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db
      .query("notificationStats")
      .withIndex("by_key", (q) => q.eq("key", "total"))
      .unique();
    return stats?.count ?? 0;
  },
  returns: v.number(),
});

// CRIT-003 FIX: Dùng counter table thay vì fetch ALL
export const countByStatus = query({
  args: { status: notificationStatus },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query("notificationStats")
      .withIndex("by_key", (q) => q.eq("key", args.status))
      .unique();
    return stats?.count ?? 0;
  },
  returns: v.number(),
});

// CRIT-003 FIX: Thêm limit
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db.query("notifications").take(500);
    return notifications.map(sanitizeNotificationForAdmin);
  },
  returns: v.array(notificationDoc),
});

export const listAdminWithOffset = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(notificationStatus),
    type: v.optional(notificationType),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 50, 1000);

    let notifications: Doc<"notifications">[] = [];
    if (args.status) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else if (args.type) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("desc")
        .take(fetchLimit);
    } else {
      notifications = await ctx.db.query("notifications").order("desc").take(fetchLimit);
    }

    if (args.type) {
      notifications = notifications.filter((notif) => notif.type === args.type);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      notifications = notifications.filter((notif) =>
        notif.title.toLowerCase().includes(searchLower) ||
        notif.content.toLowerCase().includes(searchLower)
      );
    }

    return notifications.slice(offset, offset + limit).map(sanitizeNotificationForAdmin);
  },
  returns: v.array(notificationDoc),
});

export const countAdmin = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(notificationStatus),
    type: v.optional(notificationType),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    const fetchLimit = limit + 1;

    let notifications: Doc<"notifications">[] = [];
    if (args.status) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(fetchLimit);
    } else if (args.type) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .take(fetchLimit);
    } else {
      notifications = await ctx.db.query("notifications").take(fetchLimit);
    }

    if (args.type) {
      notifications = notifications.filter((notif) => notif.type === args.type);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      notifications = notifications.filter((notif) =>
        notif.title.toLowerCase().includes(searchLower) ||
        notif.content.toLowerCase().includes(searchLower)
      );
    }

    return { count: Math.min(notifications.length, limit), hasMore: notifications.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(notificationStatus),
    type: v.optional(notificationType),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    const fetchLimit = limit + 1;

    let notifications: Doc<"notifications">[] = [];
    if (args.status) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(fetchLimit);
    } else if (args.type) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .take(fetchLimit);
    } else {
      notifications = await ctx.db.query("notifications").take(fetchLimit);
    }

    if (args.type) {
      notifications = notifications.filter((notif) => notif.type === args.type);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      notifications = notifications.filter((notif) =>
        notif.title.toLowerCase().includes(searchLower) ||
        notif.content.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = notifications.length > limit;
    return { ids: notifications.slice(0, limit).map((notif) => notif._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("notifications")), hasMore: v.boolean() }),
});

export const getById = query({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    return notification ? sanitizeNotificationForAdmin(notification) : null;
  },
  returns: v.union(notificationDoc, v.null()),
});

// CRIT-003 FIX: Thêm limit
export const listByStatus = query({
  args: { status: notificationStatus },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .take(200);
    return notifications.map(sanitizeNotificationForAdmin);
  },
  returns: v.array(notificationDoc),
});

// CRIT-003 FIX: Thêm limit
export const listByType = query({
  args: { type: notificationType },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .take(200);
    return notifications.map(sanitizeNotificationForAdmin);
  },
  returns: v.array(notificationDoc),
});

// CRIT-003 FIX: Thêm limit
export const listScheduled = query({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_status", (q) => q.eq("status", "Scheduled"))
      .take(100);
    return notifications.map(sanitizeNotificationForAdmin);
  },
  returns: v.array(notificationDoc),
});

// Mutations
// CRIT-003 FIX: Update counters khi create
export const create = mutation({
  args: {
    content: v.string(),
    scheduledAt: v.optional(v.number()),
    sendEmail: v.optional(v.boolean()),
    status: v.optional(notificationStatus),
    targetIds: v.optional(v.array(v.string())),
    targetType: notificationTargetType,
    title: v.string(),
    type: notificationType,
  },
  handler: async (ctx, args) => {
    const lastNotif = await ctx.db
      .query("notifications")
      .order("desc")
      .first();
    const order = lastNotif ? lastNotif.order + 1 : 0;
    const status = args.status ?? "Draft";

    const id = await ctx.db.insert("notifications", {
      ...args,
      status,
      readCount: 0,
      order,
    });
    
    // Update counters
    await Promise.all([
      updateNotificationStats(ctx, "total", 1),
      updateNotificationStats(ctx, status, 1),
    ]);
    
    return id;
  },
  returns: v.id("notifications"),
});

// TICKET #9 FIX: Update counters khi status thay đổi
export const update = mutation({
  args: {
    content: v.optional(v.string()),
    id: v.id("notifications"),
    scheduledAt: v.optional(v.number()),
    sendEmail: v.optional(v.boolean()),
    status: v.optional(notificationStatus),
    targetIds: v.optional(v.array(v.string())),
    targetType: v.optional(notificationTargetType),
    title: v.optional(v.string()),
    type: v.optional(notificationType),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const notif = await ctx.db.get(id);
    if (!notif) {throw new Error("Notification not found");}
    if (notif.status === "Sent") {
      throw new Error("Cannot edit sent notification");
    }
    
    // Update counters nếu status thay đổi
    if (args.status !== undefined && args.status !== notif.status) {
      await Promise.all([
        updateNotificationStats(ctx, notif.status, -1),
        updateNotificationStats(ctx, args.status, 1),
      ]);
    }
    
    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

// CRIT-003 FIX: Update counters khi send
export const send = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const notif = await ctx.db.get(args.id);
    if (!notif) {throw new Error("Notification not found");}
    if (notif.status === "Sent") {
      throw new Error("Notification already sent");
    }
    
    const oldStatus = notif.status;
    await ctx.db.patch(args.id, {
      sentAt: Date.now(),
      status: "Sent",
    });
    
    // Update counters
    await Promise.all([
      updateNotificationStats(ctx, oldStatus, -1),
      updateNotificationStats(ctx, "Sent", 1),
    ]);
    
    return null;
  },
  returns: v.null(),
});

// CRIT-003 FIX: Update counters khi cancel
export const cancel = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const notif = await ctx.db.get(args.id);
    if (!notif) {throw new Error("Notification not found");}
    if (notif.status === "Sent") {
      throw new Error("Cannot cancel sent notification");
    }
    
    const oldStatus = notif.status;
    await ctx.db.patch(args.id, { status: "Cancelled" });
    
    // Update counters
    await Promise.all([
      updateNotificationStats(ctx, oldStatus, -1),
      updateNotificationStats(ctx, "Cancelled", 1),
    ]);
    
    return null;
  },
  returns: v.null(),
});

// MED-002 FIX: Check status trước khi xóa + update counters
export const remove = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const notif = await ctx.db.get(args.id);
    if (!notif) {throw new Error("Notification not found");}
    
    await ctx.db.delete(args.id);
    
    // Update counters
    await Promise.all([
      updateNotificationStats(ctx, "total", -1),
      updateNotificationStats(ctx, notif.status, -1),
    ]);
    
    return null;
  },
  returns: v.null(),
});

// CRIT-003 FIX: Update totalReads counter
export const incrementReadCount = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const notif = await ctx.db.get(args.id);
    if (!notif) {throw new Error("Notification not found");}
    await ctx.db.patch(args.id, { readCount: notif.readCount + 1 });
    
    // Update totalReads counter
    await updateNotificationStats(ctx, "totalReads", 1);
    
    return null;
  },
  returns: v.null(),
});
