import { internalMutation, mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { countPageViewBuckets } from "./lib/aggregates/pageViews";
import { consumeRateLimit } from "./lib/rateLimit";

// Average document sizes (in KB) - estimates based on typical data
const AVG_DOC_SIZES: Record<string, number> = {
  activityLogs: 0.5,
  comments: 0.5,
  customers: 1,
  default: 1,
  notifications: 1,
  orders: 3,
  pageViews: 0.3,
  posts: 5,
  products: 2,
};

// Average file sizes (in KB)
const AVG_FILE_SIZE = 500; // 500KB per file

// Helper: Get today's date string
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// Helper: Get date string for N days ago
function getDateNDaysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split("T")[0];
}

function getDateFromTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString().split("T")[0];
}

// Track a database read operation
export const trackDbRead = internalMutation({
  args: {
    count: v.optional(v.number()),
    table: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const date = getTodayDate();
    const count = args.count ?? 1;
    const table = args.table ?? "default";
    const docSize = AVG_DOC_SIZES[table] ?? AVG_DOC_SIZES.default;
    const bandwidthKB = count * docSize;

    const existing = await ctx.db
      .query("usageStats")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        dbReads: existing.dbReads + count,
        estimatedDbBandwidth: existing.estimatedDbBandwidth + bandwidthKB,
      });
    } else {
      await ctx.db.insert("usageStats", {
        date,
        dbReads: count,
        dbWrites: 0,
        estimatedDbBandwidth: bandwidthKB,
        estimatedFileBandwidth: 0,
        fileReads: 0,
        fileWrites: 0,
      });
    }
    return null;
  },
  returns: v.null(),
});

// Track a database write operation
export const trackDbWrite = internalMutation({
  args: {
    count: v.optional(v.number()),
    table: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const date = getTodayDate();
    const count = args.count ?? 1;
    const table = args.table ?? "default";
    const docSize = AVG_DOC_SIZES[table] ?? AVG_DOC_SIZES.default;
    const bandwidthKB = count * docSize;

    const existing = await ctx.db
      .query("usageStats")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        dbWrites: existing.dbWrites + count,
        estimatedDbBandwidth: existing.estimatedDbBandwidth + bandwidthKB,
      });
    } else {
      await ctx.db.insert("usageStats", {
        date,
        dbReads: 0,
        dbWrites: count,
        estimatedDbBandwidth: bandwidthKB,
        estimatedFileBandwidth: 0,
        fileReads: 0,
        fileWrites: 0,
      });
    }
    return null;
  },
  returns: v.null(),
});

// Track a file read operation
export const trackFileRead = internalMutation({
  args: {
    count: v.optional(v.number()),
    sizeKB: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const date = getTodayDate();
    const count = args.count ?? 1;
    const sizeKB = args.sizeKB ?? AVG_FILE_SIZE;
    const bandwidthKB = count * sizeKB;

    const existing = await ctx.db
      .query("usageStats")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        estimatedFileBandwidth: existing.estimatedFileBandwidth + bandwidthKB,
        fileReads: existing.fileReads + count,
      });
    } else {
      await ctx.db.insert("usageStats", {
        date,
        dbReads: 0,
        dbWrites: 0,
        estimatedDbBandwidth: 0,
        estimatedFileBandwidth: bandwidthKB,
        fileReads: count,
        fileWrites: 0,
      });
    }
    return null;
  },
  returns: v.null(),
});

// Track a file write/upload operation
export const trackFileWrite = internalMutation({
  args: {
    count: v.optional(v.number()),
    sizeKB: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const date = getTodayDate();
    const count = args.count ?? 1;
    const sizeKB = args.sizeKB ?? AVG_FILE_SIZE;
    const bandwidthKB = count * sizeKB;

    const existing = await ctx.db
      .query("usageStats")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        estimatedFileBandwidth: existing.estimatedFileBandwidth + bandwidthKB,
        fileWrites: existing.fileWrites + count,
      });
    } else {
      await ctx.db.insert("usageStats", {
        date,
        dbReads: 0,
        dbWrites: 0,
        estimatedDbBandwidth: 0,
        estimatedFileBandwidth: bandwidthKB,
        fileReads: 0,
        fileWrites: count,
      });
    }
    return null;
  },
  returns: v.null(),
});

// Public mutation for tracking (can be called from client)
export const track = mutation({
  args: {
    count: v.optional(v.number()),
    sizeKB: v.optional(v.number()),
    table: v.optional(v.string()),
    type: v.union(
      v.literal("dbRead"),
      v.literal("dbWrite"),
      v.literal("fileRead"),
      v.literal("fileWrite")
    ),
  },
  handler: async (ctx, args) => {
    const rateLimit = await consumeRateLimit(ctx, `${args.type}:${args.table ?? "default"}`, "usageTrack");
    if (!rateLimit.allowed) {
      return null;
    }

    const date = getTodayDate();
    const count = args.count ?? 1;

    let bandwidthKB = 0;
    if (args.type === "dbRead" || args.type === "dbWrite") {
      const table = args.table ?? "default";
      const docSize = AVG_DOC_SIZES[table] ?? AVG_DOC_SIZES.default;
      bandwidthKB = count * docSize;
    } else {
      bandwidthKB = count * (args.sizeKB ?? AVG_FILE_SIZE);
    }

    const existing = await ctx.db
      .query("usageStats")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (existing) {
      const updates: Record<string, number> = {};
      if (args.type === "dbRead") {
        updates.dbReads = existing.dbReads + count;
        updates.estimatedDbBandwidth = existing.estimatedDbBandwidth + bandwidthKB;
      } else if (args.type === "dbWrite") {
        updates.dbWrites = existing.dbWrites + count;
        updates.estimatedDbBandwidth = existing.estimatedDbBandwidth + bandwidthKB;
      } else if (args.type === "fileRead") {
        updates.fileReads = existing.fileReads + count;
        updates.estimatedFileBandwidth = existing.estimatedFileBandwidth + bandwidthKB;
      } else if (args.type === "fileWrite") {
        updates.fileWrites = existing.fileWrites + count;
        updates.estimatedFileBandwidth = existing.estimatedFileBandwidth + bandwidthKB;
      }
      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("usageStats", {
        date,
        dbReads: args.type === "dbRead" ? count : 0,
        dbWrites: args.type === "dbWrite" ? count : 0,
        estimatedDbBandwidth: args.type.startsWith("db") ? bandwidthKB : 0,
        estimatedFileBandwidth: args.type.startsWith("file") ? bandwidthKB : 0,
        fileReads: args.type === "fileRead" ? count : 0,
        fileWrites: args.type === "fileWrite" ? count : 0,
      });
    }
    return null;
  },
  returns: v.null(),
});

// Average sizes for bandwidth estimation (in KB)
const PAGEVIEW_SIZE_KB = 0.5; // ~500 bytes per pageview record
const PAGE_VIEW_AGGREGATES_READY_KEY = "pageViewsAggregatesReady";

async function isPageViewAggregateReady(ctx: QueryCtx) {
  const setting = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", PAGE_VIEW_AGGREGATES_READY_KEY))
    .unique();
  return setting?.value === true;
}

// Get bandwidth data for chart - aggregates from pageViews + activityLogs
export const getBandwidthData = query({
  args: {
    range: v.union(
      v.literal("today"),
      v.literal("7d"),
      v.literal("1m"),
      v.literal("3m"),
      v.literal("1y")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Define range configurations
    const configs: Record<
      string,
      { days: number; points: number; format: (d: Date) => string }
    > = {
      "1m": {
        days: 30,
        format: (d) => `${d.getDate()}/${d.getMonth() + 1}`,
        points: 10,
      },
      "1y": {
        days: 365,
        format: (d) => `T${d.getMonth() + 1}`,
        points: 12,
      },
      "3m": {
        days: 90,
        format: (d) => `${d.getDate()}/${d.getMonth() + 1}`,
        points: 12,
      },
      "7d": {
        days: 7,
        format: (d) => `${d.getDate()}/${d.getMonth() + 1}`,
        points: 7,
      },
      today: {
        days: 1,
        points: 12, // Hourly for today
        format: (d) => `${d.getHours()}:00`,
      },
    };

    const config = configs[args.range];
    const startTime = now - config.days * 24 * 60 * 60 * 1000;
    const intervalMs = (config.days * 24 * 60 * 60 * 1000) / config.points;
    const buckets = Array.from({ length: config.points }, (_, index) => {
      const reverseIndex = config.points - 1 - index;
      const periodEnd = now - reverseIndex * intervalMs;
      return {
        endDate: periodEnd,
        periodEnd,
        periodStart: periodEnd - intervalMs,
        startDate: periodEnd - intervalMs,
      };
    });
    const aggregateReady = await isPageViewAggregateReady(ctx);
    const aggregatePageViewCounts = aggregateReady
      ? await countPageViewBuckets(ctx, buckets)
      : [];
    const usageRows = await ctx.db
      .query("usageStats")
      .withIndex("by_date", (q) => q.gte("date", getDateFromTimestamp(startTime)))
      .collect();

    // Group by time periods
    const result: { time: string; dbBandwidth: number; fileBandwidth: number }[] = [];

    buckets.forEach(({ periodEnd, periodStart }, index) => {
      const bucketUsageRows = usageRows.filter((row) => {
        const rowTime = new Date(row.date).getTime();
        return rowTime >= periodStart && rowTime < periodEnd;
      });
      const trackedDbBandwidthKB = bucketUsageRows.reduce((sum, row) => sum + row.estimatedDbBandwidth, 0);
      const trackedFileBandwidthKB = bucketUsageRows.reduce((sum, row) => sum + row.estimatedFileBandwidth, 0);
      const aggregateDbBandwidthKB = aggregateReady ? (aggregatePageViewCounts[index] ?? 0) * PAGEVIEW_SIZE_KB : 0;
      const dbBandwidthKB = trackedDbBandwidthKB + aggregateDbBandwidthKB;
      const fileBandwidthKB = trackedFileBandwidthKB;

      const date = new Date(periodEnd);
      result.push({
        time: config.format(date),
        dbBandwidth: Math.round(dbBandwidthKB / 1024 * 100) / 100, // MB with 2 decimals
        fileBandwidth: Math.round(fileBandwidthKB / 1024 * 100) / 100,
      });
    });

    const totalDbBandwidth = Math.round(result.reduce((sum, d) => sum + d.dbBandwidth, 0) * 100) / 100;
    const totalFileBandwidth = Math.round(result.reduce((sum, d) => sum + d.fileBandwidth, 0) * 100) / 100;
    const hasData = (aggregateReady
      ? aggregatePageViewCounts.some((count) => count > 0)
      : false) || usageRows.length > 0;

    return {
      data: result,
      hasData,
      totalDbBandwidth,
      totalFileBandwidth,
    };
  },
  returns: v.object({
    data: v.array(
      v.object({
        dbBandwidth: v.number(),
        fileBandwidth: v.number(),
        time: v.string(),
      })
    ),
    hasData: v.boolean(),
    totalDbBandwidth: v.number(),
    totalFileBandwidth: v.number(),
  }),
});

// Get today's stats summary
export const getTodayStats = query({
  args: {},
  handler: async (ctx) => {
    const date = getTodayDate();
    const stat = await ctx.db
      .query("usageStats")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (!stat) {return null;}

    return {
      date: stat.date,
      dbReads: stat.dbReads,
      dbWrites: stat.dbWrites,
      estimatedDbBandwidth: stat.estimatedDbBandwidth,
      estimatedFileBandwidth: stat.estimatedFileBandwidth,
      fileReads: stat.fileReads,
      fileWrites: stat.fileWrites,
    };
  },
  returns: v.union(
    v.object({
      date: v.string(),
      dbReads: v.number(),
      dbWrites: v.number(),
      estimatedDbBandwidth: v.number(),
      estimatedFileBandwidth: v.number(),
      fileReads: v.number(),
      fileWrites: v.number(),
    }),
    v.null()
  ),
});

// Cleanup old stats (keep last 400 days)
export const cleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffDate = getDateNDaysAgo(400);
    // Filter ở DB — tránh collect() toàn bảng rồi filter JS-side
    const oldStats = await ctx.db
      .query("usageStats")
      .withIndex("by_date", (q) => q.lt("date", cutoffDate))
      .collect();

    let deleted = 0;
    for (const stat of oldStats) {
      await ctx.db.delete(stat._id);
      deleted++;
    }
    return deleted;
  },
  returns: v.number(),
});
