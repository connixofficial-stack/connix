import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  aggregateBackfillPageView,
  countPageViewBuckets,
  countPageViewDimension,
  countPageViews,
  normalizeSource,
  recordPageViewAggregates,
} from "./lib/aggregates/pageViews";
import { requireAdminPermission } from "./lib/permissions";
import { consumeRateLimit } from "./lib/rateLimit";

// Helper: Calculate period timestamps
function getPeriodTimestamps(period: string) {
  const now = Date.now();
  const periodMs = {
    "1y": 365 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
  }[period] ?? 30 * 24 * 60 * 60 * 1000;
  
  return {
    now,
    periodMs,
    prevStartDate: now - periodMs * 2,
    startDate: now - periodMs,
  };
}

// Max records to fetch for analytics (prevents bandwidth explosion)
const MAX_PAGEVIEWS_LIMIT = 10_000;
const PAGE_VIEW_AGGREGATES_READY_KEY = "pageViewsAggregatesReady";
const PAGE_VIEW_AGGREGATES_BACKFILLED_AT_KEY = "pageViewsAggregatesBackfilledAt";

function startOfDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function startOfHour(timestamp: number) {
  const date = new Date(timestamp);
  date.setMinutes(0, 0, 0);
  return date.getTime();
}

async function getRecentViews(ctx: QueryCtx) {
  return await ctx.db.query("pageViews")
    .order("desc")
    .take(MAX_PAGEVIEWS_LIMIT);
}

async function isPageViewAggregateReady(ctx: QueryCtx) {
  const setting = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", PAGE_VIEW_AGGREGATES_READY_KEY))
    .unique();
  return setting?.value === true;
}

async function upsertSetting(ctx: MutationCtx, key: string, value: unknown) {
  const existing = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { group: "analytics", value });
    return;
  }
  await ctx.db.insert("settings", { group: "analytics", key, value });
}

async function recordSessionBucket(
  ctx: MutationCtx,
  sessionId: string,
  bucketType: "day" | "hour",
  bucketStart: number
) {
  const existing = await ctx.db
    .query("pageViewSessionBuckets")
    .withIndex("by_sessionId_and_bucketType_and_bucketStart", (q) =>
      q.eq("sessionId", sessionId).eq("bucketType", bucketType).eq("bucketStart", bucketStart)
    )
    .unique();
  if (!existing) {
    await ctx.db.insert("pageViewSessionBuckets", { bucketStart, bucketType, sessionId });
  }
}

async function recordPageViewSessionBuckets(
  ctx: MutationCtx,
  sessionId: string,
  timestamp: number
) {
  await Promise.all([
    recordSessionBucket(ctx, sessionId, "day", startOfDay(timestamp)),
    recordSessionBucket(ctx, sessionId, "hour", startOfHour(timestamp)),
  ]);
}

async function countUniqueSessions(
  ctx: QueryCtx,
  bucketType: "day" | "hour",
  startDate: number,
  endDate = Date.now()
) {
  // Filter ở DB cả lower và upper bound — tránh collect() không giới hạn
  const startBound = bucketType === "day" ? startOfDay(startDate) : startOfHour(startDate);
  const rows = await ctx.db
    .query("pageViewSessionBuckets")
    .withIndex("by_bucketType_and_bucketStart", (q) =>
      q.eq("bucketType", bucketType).gte("bucketStart", startBound).lt("bucketStart", endDate)
    )
    .collect();
  const sessions = new Set<string>();
  for (const row of rows) {
    sessions.add(row.sessionId);
  }
  return sessions.size;
}

async function countUniqueSessionBuckets(
  ctx: QueryCtx,
  buckets: Array<{ endDate: number; startDate: number }>
) {
  return await Promise.all(buckets.map((bucket) =>
    countUniqueSessions(ctx, bucket.endDate - bucket.startDate <= 2 * 60 * 60 * 1000 ? "hour" : "day", bucket.startDate, bucket.endDate)
  ));
}

async function backfillPageViewAggregateBatch(
  ctx: MutationCtx,
  paginationOpts: {
    cursor: string | null;
    numItems: number;
  }
) {
  if (paginationOpts.cursor === null) {
    await upsertSetting(ctx, PAGE_VIEW_AGGREGATES_READY_KEY, false);
  }
  // Clamp batch size — tránh caller truyền numItems lớn gây đọc hàng ngàn records/lần
  const safePaginationOpts = {
    ...paginationOpts,
    numItems: Math.min(paginationOpts.numItems, 200),
  };
  const result = await ctx.db.query("pageViews").paginate(safePaginationOpts);
  for (const doc of result.page) {
    await aggregateBackfillPageView(ctx, doc);
    await recordPageViewSessionBuckets(ctx, doc.sessionId, doc._creationTime);
  }
  if (result.isDone) {
    await upsertSetting(ctx, PAGE_VIEW_AGGREGATES_READY_KEY, true);
    await upsertSetting(ctx, PAGE_VIEW_AGGREGATES_BACKFILLED_AT_KEY, Date.now());
  }
  return {
    continueCursor: result.continueCursor,
    isDone: result.isDone,
    processed: result.page.length,
  };
}

// Track a page view
export const track = mutation({
  args: {
    browser: v.optional(v.string()),
    device: v.optional(v.union(v.literal("mobile"), v.literal("desktop"), v.literal("tablet"))),
    os: v.optional(v.string()),
    path: v.string(),
    referrer: v.optional(v.string()),
    sessionId: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rateLimit = await consumeRateLimit(ctx, args.sessionId, "pageViewTrack");
    if (!rateLimit.allowed) {
      throw new Error("Page view tracking rate limit exceeded.");
    }

    const id = await ctx.db.insert("pageViews", {
      browser: args.browser,
      device: args.device,
      os: args.os,
      path: args.path,
      referrer: args.referrer,
      sessionId: args.sessionId,
      userAgent: args.userAgent?.slice(0, 180),
    });
    const doc = await ctx.db.get(id);
    if (doc) {
      await Promise.all([
        recordPageViewAggregates(ctx, doc),
        recordPageViewSessionBuckets(ctx, doc.sessionId, doc._creationTime),
      ]);
    }
    return id;
  },
  returns: v.id("pageViews"),
});

// Get traffic summary stats - OPTIMIZED: use limit instead of collect()
export const getTrafficStats = query({
  args: {
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period ?? "30d";
    const { startDate, prevStartDate } = getPeriodTimestamps(period);
    const aggregateReady = await isPageViewAggregateReady(ctx);

    const recentViews = aggregateReady ? [] : await getRecentViews(ctx);
    const currentViews = aggregateReady ? [] : recentViews.filter(pv => pv._creationTime >= startDate);
    const currentSessions = aggregateReady ? 0 : new Set(currentViews.map(pv => pv.sessionId)).size;
    const prevViews = aggregateReady
      ? []
      : recentViews.filter(pv => pv._creationTime >= prevStartDate && pv._creationTime < startDate);
    const prevSessions = aggregateReady ? 0 : new Set(prevViews.map(pv => pv.sessionId)).size;

    const [aggregateCurrent, aggregatePrevious] = aggregateReady
      ? await countPageViewBuckets(ctx, [
        { startDate, endDate: Date.now() },
        { startDate: prevStartDate, endDate: startDate },
      ])
      : [0, 0];
    const [aggregateCurrentSessions, aggregatePreviousSessions] = aggregateReady
      ? await Promise.all([
        countUniqueSessions(ctx, "day", startDate),
        countUniqueSessions(ctx, "day", prevStartDate, startDate),
      ])
      : [0, 0];
    const currentPageviews = aggregateReady ? aggregateCurrent : currentViews.length;
    const previousPageviews = aggregateReady ? aggregatePrevious : prevViews.length;
    const uniqueVisitors = aggregateReady ? aggregateCurrentSessions : currentSessions;
    const previousVisitors = aggregateReady ? aggregatePreviousSessions : prevSessions;

    const pageviewsChange = previousPageviews > 0
      ? Math.round(((currentPageviews - previousPageviews) / previousPageviews) * 100)
      : (currentPageviews > 0 ? 100 : 0);
      
    const visitorsChange = previousVisitors > 0
      ? Math.round(((uniqueVisitors - previousVisitors) / previousVisitors) * 100)
      : (uniqueVisitors > 0 ? 100 : 0);
    
    return {
      pageviewsChange,
      totalPageviews: currentPageviews,
      uniqueVisitors,
      visitorsChange,
    };
  },
  returns: v.object({
    pageviewsChange: v.number(),
    totalPageviews: v.number(),
    uniqueVisitors: v.number(),
    visitorsChange: v.number(),
  }),
});

// Get traffic chart data - OPTIMIZED: use limit instead of collect()
export const getTrafficChartData = query({
  args: {
    groupBy: v.optional(v.union(v.literal("day"), v.literal("month"), v.literal("year"))),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period ?? "30d";
    const groupBy = args.groupBy ?? "day";
    const now = Date.now();
    const aggregateReady = await isPageViewAggregateReady(ctx);
    
    // For monthly/yearly views, extend the period
    let periodMs: number;
    if (groupBy === "year") {
      periodMs = 5 * 365 * 24 * 60 * 60 * 1000;
    } else if (groupBy === "month") {
      periodMs = 2 * 365 * 24 * 60 * 60 * 1000;
    } else {
      periodMs = {
        "1y": 365 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "90d": 90 * 24 * 60 * 60 * 1000,
      }[period] ?? 30 * 24 * 60 * 60 * 1000;
    }
    
    const startDate = now - periodMs;
    
    const recentViews = aggregateReady ? [] : await getRecentViews(ctx);
    const filteredViews = recentViews.filter(pv => pv._creationTime >= startDate);
    
    const groupedData: Record<string, { pageviews: number; sessions: Set<string> }> = {};
    const buckets: Array<{ displayDate: string; endDate: number; key: string; startDate: number }> = [];
    
    for (const view of filteredViews) {
      const date = new Date(view._creationTime);
      let key: string;
      
      if (groupBy === "year") {
        key = `${date.getFullYear()}`;
      } else if (groupBy === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Daily - use weekly grouping for longer periods
        const isWeekly = period === "90d" || period === "1y";
        if (isWeekly) {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay() + 1);
          key = weekStart.toISOString().split('T')[0];
        } else {
          key = date.toISOString().split('T')[0];
        }
      }
      
      if (!groupedData[key]) {
        groupedData[key] = { pageviews: 0, sessions: new Set() };
      }
      groupedData[key].pageviews += 1;
      groupedData[key].sessions.add(view.sessionId);
    }
    
    // Generate result based on groupBy
    const result: { date: string; pageviews: number; visitors: number }[] = [];
    
    if (groupBy === "year") {
      const currentYear = new Date(now).getFullYear();
      for (let year = currentYear - 4; year <= currentYear; year++) {
        const key = `${year}`;
        const start = new Date(year, 0, 1).getTime();
        const end = new Date(year + 1, 0, 1).getTime();
        buckets.push({ displayDate: key, endDate: end, key, startDate: start });
      }
    } else if (groupBy === "month") {
      const months = 24; // 2 years
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const displayDate = `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
        const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
        buckets.push({ displayDate, endDate: end, key, startDate: start });
      }
    } else {
      // Daily view
      const isWeekly = period === "90d" || period === "1y";
      const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 13 : 52;
      
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        if (isWeekly) {
          d.setDate(d.getDate() - (i * 7));
          d.setDate(d.getDate() - d.getDay() + 1);
        } else {
          d.setDate(d.getDate() - i);
        }
        const key = d.toISOString().split('T')[0];
        const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
        
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + (isWeekly ? 7 : 1));
        buckets.push({ displayDate, endDate: end.getTime(), key, startDate: start.getTime() });
      }
    }

    const aggregateCounts = aggregateReady ? await countPageViewBuckets(ctx, buckets) : [];
    const aggregateVisitors = aggregateReady ? await countUniqueSessionBuckets(ctx, buckets) : [];
    buckets.forEach((bucket, index) => {
      const aggregatePageviews = aggregateCounts[index] ?? 0;
      const legacyPageviews = groupedData[bucket.key]?.pageviews || 0;
      result.push({
        date: bucket.displayDate,
        pageviews: aggregateReady ? aggregatePageviews : legacyPageviews,
        visitors: aggregateReady ? aggregateVisitors[index] ?? 0 : groupedData[bucket.key]?.sessions.size || 0,
      });
    });
    
    return result;
  },
  returns: v.array(v.object({
    date: v.string(),
    pageviews: v.number(),
    visitors: v.number(),
  })),
});

// Get top pages - OPTIMIZED: use limit instead of collect()
export const getTopPages = query({
  args: {
    limit: v.optional(v.number()),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period ?? "30d";
    const limit = args.limit ?? 10;
    const { startDate } = getPeriodTimestamps(period);
    const aggregateReady = await isPageViewAggregateReady(ctx);
    
    const aggregateResult = aggregateReady
      ? await countPageViewDimension(ctx, "path", { startDate }, limit)
      : { completeScan: false, rows: [] };
    const aggregateTotal = aggregateReady ? await countPageViews(ctx, { startDate }) : 0;
    if (aggregateResult.completeScan && aggregateTotal > 0) {
      return aggregateResult.rows.map(({ name, views }) => ({
        path: name,
        percentage: Math.round((views / aggregateTotal) * 100),
        views,
      }));
    }

    const recentViews = await getRecentViews(ctx);
    const filteredViews = recentViews.filter(pv => pv._creationTime >= startDate);
    
    // Count by path
    const pathCounts: Record<string, number> = {};
    for (const view of filteredViews) {
      pathCounts[view.path] = (pathCounts[view.path] || 0) + 1;
    }
    
    const total = filteredViews.length;
    
    return (Object.entries(pathCounts) as Array<[string, number]>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([path, views]) => ({
        path,
        percentage: total > 0 ? Math.round((views / total) * 100) : 0,
        views,
      }));
  },
  returns: v.array(v.object({
    path: v.string(),
    percentage: v.number(),
    views: v.number(),
  })),
});

// Get traffic by referrer/source - OPTIMIZED: use limit instead of collect()
export const getTrafficSources = query({
  args: {
    limit: v.optional(v.number()),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period ?? "30d";
    const limit = args.limit ?? 10;
    const { startDate } = getPeriodTimestamps(period);
    const aggregateReady = await isPageViewAggregateReady(ctx);
    
    const aggregateResult = aggregateReady
      ? await countPageViewDimension(ctx, "source", { startDate }, limit)
      : { completeScan: false, rows: [] };
    const aggregateTotal = aggregateReady ? await countPageViews(ctx, { startDate }) : 0;
    if (aggregateResult.completeScan && aggregateTotal > 0) {
      return aggregateResult.rows.map(({ name, views }) => ({
        percentage: Math.round((views / aggregateTotal) * 100),
        source: name,
        views,
      }));
    }

    const recentViews = await getRecentViews(ctx);
    const filteredViews = recentViews.filter(pv => pv._creationTime >= startDate);
    
    // Parse referrer to get source
    const sourceCounts: Record<string, number> = {};
    for (const view of filteredViews) {
      let source = "Trực tiếp";
      if (view.referrer) {
        source = normalizeSource(view.referrer);
      }
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    }
    
    const total = filteredViews.length;
    
    return (Object.entries(sourceCounts) as Array<[string, number]>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([source, views]) => ({
        percentage: total > 0 ? Math.round((views / total) * 100) : 0,
        source,
        views,
      }));
  },
  returns: v.array(v.object({
    percentage: v.number(),
    source: v.string(),
    views: v.number(),
  })),
});

// Get device stats - OPTIMIZED: use limit instead of collect()
export const getDeviceStats = query({
  args: {
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period ?? "30d";
    const { startDate } = getPeriodTimestamps(period);
    const aggregateReady = await isPageViewAggregateReady(ctx);
    
    const [aggregateDevices, aggregateBrowsers, aggregateOs] = aggregateReady
      ? await Promise.all([
        countPageViewDimension(ctx, "device", { startDate }, 5),
        countPageViewDimension(ctx, "browser", { startDate }, 5),
        countPageViewDimension(ctx, "os", { startDate }, 5),
      ])
      : [
        { completeScan: false, rows: [] },
        { completeScan: false, rows: [] },
        { completeScan: false, rows: [] },
      ];
    const aggregateTotal = aggregateReady ? await countPageViews(ctx, { startDate }) : 0;
    if (
      aggregateTotal > 0
      && aggregateDevices.completeScan
      && aggregateBrowsers.completeScan
      && aggregateOs.completeScan
      && (aggregateDevices.rows.length > 0 || aggregateBrowsers.rows.length > 0 || aggregateOs.rows.length > 0)
    ) {
      return {
        browsers: aggregateBrowsers.rows.map(({ name, views }) => ({
          browser: name,
          percentage: Math.round((views / aggregateTotal) * 100),
        })),
        devices: aggregateDevices.rows.map(({ name, views }) => ({
          device: name,
          percentage: Math.round((views / aggregateTotal) * 100),
        })),
        os: aggregateOs.rows.map(({ name, views }) => ({
          os: name,
          percentage: Math.round((views / aggregateTotal) * 100),
        })),
      };
    }

    const recentViews = await getRecentViews(ctx);
    const filteredViews = recentViews.filter(pv => pv._creationTime >= startDate);
    const total = filteredViews.length;
    
    // Count devices
    const deviceCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};
    
    for (const view of filteredViews) {
      const device = view.device ?? "unknown";
      const os = view.os ?? "unknown";
      const browser = view.browser ?? "unknown";
      
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      osCounts[os] = (osCounts[os] || 0) + 1;
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    }
    
    return {
      browsers: (Object.entries(browserCounts) as Array<[string, number]>)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([browser, count]) => ({
          browser,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        })),
      devices: (Object.entries(deviceCounts) as Array<[string, number]>)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([device, count]) => ({
          device,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        })),
      os: (Object.entries(osCounts) as Array<[string, number]>)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([os, count]) => ({
          os,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        })),
    };
  },
  returns: v.object({
    browsers: v.array(v.object({ browser: v.string(), percentage: v.number() })),
    devices: v.array(v.object({ device: v.string(), percentage: v.number() })),
    os: v.array(v.object({ os: v.string(), percentage: v.number() })),
  }),
});

export const backfillAggregates = internalMutation({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => backfillPageViewAggregateBatch(ctx, args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    processed: v.number(),
  }),
});

export const backfillAggregatesForAdmin = mutation({
  args: {
    paginationOpts: paginationOptsValidator,
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.token, "analytics", "edit");
    return backfillPageViewAggregateBatch(ctx, args.paginationOpts);
  },
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    processed: v.number(),
  }),
});

export const getAggregateStatus = query({
  args: {},
  handler: async (ctx) => {
    const [ready, backfilledAt] = await Promise.all([
      ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", PAGE_VIEW_AGGREGATES_READY_KEY))
        .unique(),
      ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", PAGE_VIEW_AGGREGATES_BACKFILLED_AT_KEY))
        .unique(),
    ]);
    return {
      backfilledAt: typeof backfilledAt?.value === "number" ? backfilledAt.value : null,
      ready: ready?.value === true,
    };
  },
  returns: v.object({
    backfilledAt: v.union(v.number(), v.null()),
    ready: v.boolean(),
  }),
});
