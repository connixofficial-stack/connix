import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getAccountsUsage = internalQuery({
  args: {
    accountIds: v.array(v.string()),
    dateKey: v.string(),
    monthKey: v.string(),
  },
  handler: async (ctx, args) => {
    const dailyUsageMap: Record<string, number> = {};
    const monthlyUsageMap: Record<string, number> = {};

    for (const accountId of args.accountIds) {
      const dailyRecord = await ctx.db
        .query("emailProviderUsageDaily")
        .withIndex("by_account_date", (q) =>
          q.eq("accountId", accountId).eq("dateKey", args.dateKey)
        )
        .first();
      dailyUsageMap[accountId] = dailyRecord?.recipientCount ?? 0;

      const monthlyRecord = await ctx.db
        .query("emailProviderUsageMonthly")
        .withIndex("by_account_month", (q) =>
          q.eq("accountId", accountId).eq("monthKey", args.monthKey)
        )
        .first();
      monthlyUsageMap[accountId] = monthlyRecord?.recipientCount ?? 0;
    }

    return { dailyUsageMap, monthlyUsageMap };
  },
});

export const incrementUsage = internalMutation({
  args: {
    accountId: v.string(),
    dateKey: v.string(),
    monthKey: v.string(),
    recipientCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Increment daily
    const dailyRecord = await ctx.db
      .query("emailProviderUsageDaily")
      .withIndex("by_account_date", (q) =>
        q.eq("accountId", args.accountId).eq("dateKey", args.dateKey)
      )
      .first();

    if (dailyRecord) {
      await ctx.db.patch(dailyRecord._id, {
        recipientCount: dailyRecord.recipientCount + args.recipientCount,
      });
    } else {
      await ctx.db.insert("emailProviderUsageDaily", {
        accountId: args.accountId,
        dateKey: args.dateKey,
        recipientCount: args.recipientCount,
      });
    }

    // Increment monthly
    const monthlyRecord = await ctx.db
      .query("emailProviderUsageMonthly")
      .withIndex("by_account_month", (q) =>
        q.eq("accountId", args.accountId).eq("monthKey", args.monthKey)
      )
      .first();

    if (monthlyRecord) {
      await ctx.db.patch(monthlyRecord._id, {
        recipientCount: monthlyRecord.recipientCount + args.recipientCount,
      });
    } else {
      await ctx.db.insert("emailProviderUsageMonthly", {
        accountId: args.accountId,
        monthKey: args.monthKey,
        recipientCount: args.recipientCount,
      });
    }
  },
});

export const logEmailDispatch = internalMutation({
  args: {
    eventType: v.string(),
    orderId: v.optional(v.id("orders")),
    recipient: v.string(),
    provider: v.string(),
    accountId: v.string(),
    status: v.string(),
    emailId: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.idempotencyKey) {
      const existing = await ctx.db
        .query("emailDispatchLogs")
        .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", args.idempotencyKey!))
        .first();
      if (existing && existing.status === "success") {
        return existing._id;
      }
    }

    return await ctx.db.insert("emailDispatchLogs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const createSystemNotification = internalMutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("error")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      title: args.title,
      content: args.content,
      type: args.type,
      status: "Sent",
      targetType: "users",
      order: Date.now(),
      readCount: 0,
      sentAt: Date.now(),
    });
  },
});

export const checkIdempotency = internalQuery({
  args: { idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailDispatchLogs")
      .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    return existing ? existing.status === "success" : false;
  },
});
