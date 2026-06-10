import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

const logDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("activityLogs"),
  action: v.string(),
  details: v.optional(v.any()),
  ip: v.optional(v.string()),
  targetId: v.string(),
  targetType: v.string(),
  userId: v.id("users"),
});

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db.query("activityLogs").order("desc").paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(logDoc),
  }),
});

export const getById = query({
  args: { id: v.id("activityLogs") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(logDoc, v.null()),
});

export const listByUser = query({
  args: { paginationOpts: paginationOptsValidator, userId: v.id("users") },
  handler: async (ctx, args) => ctx.db
      .query("activityLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(logDoc),
  }),
});

export const listByTargetType = query({
  args: { paginationOpts: paginationOptsValidator, targetType: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("activityLogs")
      .withIndex("by_targetType", (q) => q.eq("targetType", args.targetType))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(logDoc),
  }),
});

export const listByAction = query({
  args: { action: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
      .query("activityLogs")
      .withIndex("by_action", (q) => q.eq("action", args.action))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(logDoc),
  }),
});

export const log = mutation({
  args: {
    action: v.string(),
    details: v.optional(v.any()),
    ip: v.optional(v.string()),
    targetId: v.string(),
    targetType: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => ctx.db.insert("activityLogs", args),
  returns: v.id("activityLogs"),
});

export const logInternal = internalMutation({
  args: {
    action: v.string(),
    details: v.optional(v.any()),
    ip: v.optional(v.string()),
    targetId: v.string(),
    targetType: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => ctx.db.insert("activityLogs", args),
  returns: v.id("activityLogs"),
});

export const getRecentByUser = query({
  args: { limit: v.optional(v.number()), userId: v.id("users") },
  handler: async (ctx, args) => ctx.db
      .query("activityLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 10),
  returns: v.array(logDoc),
});

// OPTIMIZED: Use limit instead of collect() to prevent bandwidth explosion
const MAX_LOGS_LIMIT = 5000;

export const getStats = query({
  args: { since: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // OPTIMIZED: Use take() with limit instead of collect()
    const logs = await ctx.db.query("activityLogs")
      .order("desc")
      .take(MAX_LOGS_LIMIT);
    
    const filteredLogs = args.since
      ? logs.filter((l) => l._creationTime >= args.since!)
      : logs;
    
    const actionCounts: Record<string, number> = {};
    const targetCounts: Record<string, number> = {};
    for (const log of filteredLogs) {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      targetCounts[log.targetType] = (targetCounts[log.targetType] || 0) + 1;
    }
    return {
      byAction: Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count),
      byTargetType: Object.entries(targetCounts)
        .map(([targetType, count]) => ({ count, targetType }))
        .sort((a, b) => b.count - a.count),
      totalLogs: filteredLogs.length,
    };
  },
  returns: v.object({
    byAction: v.array(v.object({ action: v.string(), count: v.number() })),
    byTargetType: v.array(v.object({ count: v.number(), targetType: v.string() })),
    totalLogs: v.number(),
  }),
});

// OPTIMIZED: Batch delete with limit to prevent timeout
export const cleanup = internalMutation({
  args: { olderThan: v.number() },
  handler: async (ctx, args) => {
    // Batch delete: only delete up to 1000 records per call to avoid timeout
    const BATCH_SIZE = 1000;
    const logs = await ctx.db.query("activityLogs")
      .order("asc")
      .take(BATCH_SIZE);
    
    let deleted = 0;
    for (const log of logs) {
      if (log._creationTime < args.olderThan) {
        await ctx.db.delete(log._id);
        deleted++;
      }
    }
    return deleted;
  },
  returns: v.number(),
});
