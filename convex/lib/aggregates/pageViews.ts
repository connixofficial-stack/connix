import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "../../_generated/api";
import type { DataModel, Doc } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";

type PageViewNamespace = string;
type TimeBounds = { startDate: number; endDate?: number };

const UNKNOWN = "unknown";
const DIRECT = "Trực tiếp";
const MAX_NAMESPACES_TO_SCAN = 500;

const pageViewsByTime = new TableAggregate<{
  Key: number;
  DataModel: DataModel;
  TableName: "pageViews";
}>(components.pageViewsByTime, {
  sortKey: (doc) => doc._creationTime,
});

const pageViewsByPath = new TableAggregate<{
  Namespace: PageViewNamespace;
  Key: number;
  DataModel: DataModel;
  TableName: "pageViews";
}>(components.pageViewsByPath, {
  namespace: (doc) => normalizePath(doc.path),
  sortKey: (doc) => doc._creationTime,
});

const pageViewsBySource = new TableAggregate<{
  Namespace: PageViewNamespace;
  Key: number;
  DataModel: DataModel;
  TableName: "pageViews";
}>(components.pageViewsBySource, {
  namespace: (doc) => normalizeSource(doc.referrer),
  sortKey: (doc) => doc._creationTime,
});

const pageViewsByDevice = new TableAggregate<{
  Namespace: PageViewNamespace;
  Key: number;
  DataModel: DataModel;
  TableName: "pageViews";
}>(components.pageViewsByDevice, {
  namespace: (doc) => doc.device ?? UNKNOWN,
  sortKey: (doc) => doc._creationTime,
});

const pageViewsByBrowser = new TableAggregate<{
  Namespace: PageViewNamespace;
  Key: number;
  DataModel: DataModel;
  TableName: "pageViews";
}>(components.pageViewsByBrowser, {
  namespace: (doc) => doc.browser ?? UNKNOWN,
  sortKey: (doc) => doc._creationTime,
});

const pageViewsByOs = new TableAggregate<{
  Namespace: PageViewNamespace;
  Key: number;
  DataModel: DataModel;
  TableName: "pageViews";
}>(components.pageViewsByOs, {
  namespace: (doc) => doc.os ?? UNKNOWN,
  sortKey: (doc) => doc._creationTime,
});

function normalizePath(path: string) {
  return path.trim() || "/";
}

export function normalizeSource(referrer?: string) {
  if (!referrer) {
    return DIRECT;
  }
  try {
    const url = new URL(referrer);
    return url.hostname.replace("www.", "") || DIRECT;
  } catch {
    return referrer.trim() || DIRECT;
  }
}

function boundsFor({ endDate, startDate }: TimeBounds) {
  return {
    lower: { inclusive: true, key: startDate },
    ...(endDate === undefined
      ? {}
      : { upper: { inclusive: false, key: endDate } }),
  };
}

export async function recordPageViewAggregates(ctx: MutationCtx, doc: Doc<"pageViews">) {
  await Promise.all([
    pageViewsByTime.insertIfDoesNotExist(ctx, doc),
    pageViewsByPath.insertIfDoesNotExist(ctx, doc),
    pageViewsBySource.insertIfDoesNotExist(ctx, doc),
    pageViewsByDevice.insertIfDoesNotExist(ctx, doc),
    pageViewsByBrowser.insertIfDoesNotExist(ctx, doc),
    pageViewsByOs.insertIfDoesNotExist(ctx, doc),
  ]);
}

export async function countPageViews(ctx: QueryCtx, range: TimeBounds) {
  return pageViewsByTime.count(ctx, { bounds: boundsFor(range) });
}

export async function countPageViewBuckets(
  ctx: QueryCtx,
  buckets: Array<{ endDate: number; startDate: number }>
) {
  return pageViewsByTime.countBatch(
    ctx,
    buckets.map((bucket) => ({ bounds: boundsFor(bucket) }))
  );
}

export async function countPageViewDimension(
  ctx: QueryCtx,
  dimension: "browser" | "device" | "os" | "path" | "source",
  range: TimeBounds,
  limit: number
) {
  const aggregate = {
    browser: pageViewsByBrowser,
    device: pageViewsByDevice,
    os: pageViewsByOs,
    path: pageViewsByPath,
    source: pageViewsBySource,
  }[dimension];
  const bounds = boundsFor(range);
  const rows: Array<{ name: string; views: number }> = [];
  let completeScan = true;

  for await (const namespace of aggregate.iterNamespaces(ctx, 100)) {
    if (rows.length >= MAX_NAMESPACES_TO_SCAN) {
      completeScan = false;
      break;
    }
    rows.push({ name: namespace, views: 0 });
  }

  const counts = await aggregate.countBatch(
    ctx,
    rows.map(({ name }) => ({ bounds, namespace: name }))
  );
  const countedRows: Array<{ name: string; views: number }> = [];
  rows.forEach(({ name }, index) => {
    const views = counts[index] ?? 0;
    if (views > 0) {
      countedRows.push({ name, views });
    }
  });

  countedRows.sort((a, b) => b.views - a.views || a.name.localeCompare(b.name));
  return { completeScan, rows: countedRows.slice(0, limit) };
}

export async function aggregateBackfillPageView(ctx: MutationCtx, doc: Doc<"pageViews">) {
  await recordPageViewAggregates(ctx, doc);
}

export async function deletePageViewAggregates(ctx: MutationCtx, doc: Doc<"pageViews">) {
  await Promise.all([
    pageViewsByTime.deleteIfExists(ctx, doc),
    pageViewsByPath.deleteIfExists(ctx, doc),
    pageViewsBySource.deleteIfExists(ctx, doc),
    pageViewsByDevice.deleteIfExists(ctx, doc),
    pageViewsByBrowser.deleteIfExists(ctx, doc),
    pageViewsByOs.deleteIfExists(ctx, doc),
  ]);
}

export async function clearAllPageViewAggregates(ctx: MutationCtx) {
  await Promise.all([
    pageViewsByTime.clearAll(ctx),
    pageViewsByPath.clearAll(ctx),
    pageViewsBySource.clearAll(ctx),
    pageViewsByDevice.clearAll(ctx),
    pageViewsByBrowser.clearAll(ctx),
    pageViewsByOs.clearAll(ctx),
  ]);
}

