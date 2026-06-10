import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "../../_generated/api";
import type { DataModel, Doc } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";

const FUTURE_KEY = Number.MAX_SAFE_INTEGER;

const postsPublishedByTime = new TableAggregate<{
  Key: number;
  DataModel: DataModel;
  TableName: "posts";
}>(components.postsPublishedByTime, {
  sortKey: (doc) => visiblePostKey(doc),
});

const postsPublishedByCategory = new TableAggregate<{
  Namespace: string;
  Key: number;
  DataModel: DataModel;
  TableName: "posts";
}>(components.postsPublishedByCategory, {
  namespace: (doc) => doc.categoryId,
  sortKey: (doc) => visiblePostKey(doc),
});

const servicesPublishedByTime = new TableAggregate<{
  Key: number;
  DataModel: DataModel;
  TableName: "services";
}>(components.servicesPublishedByTime, {
  sortKey: (doc) => visibleServiceKey(doc),
});

const servicesPublishedByCategory = new TableAggregate<{
  Namespace: string;
  Key: number;
  DataModel: DataModel;
  TableName: "services";
}>(components.servicesPublishedByCategory, {
  namespace: (doc) => doc.categoryId,
  sortKey: (doc) => visibleServiceKey(doc),
});

function visiblePostKey(doc: Doc<"posts">) {
  return doc.status === "Published" ? doc.publishedAt ?? doc._creationTime : FUTURE_KEY;
}

function visibleServiceKey(doc: Doc<"services">) {
  return doc.status === "Published" ? doc.publishedAt ?? doc._creationTime : FUTURE_KEY;
}

function visibleNowBounds(now = Date.now()) {
  return {
    upper: { inclusive: true, key: now },
  };
}

export async function countPublishedPosts(
  ctx: QueryCtx,
  args: { categoryId?: string; now?: number } = {}
) {
  const bounds = visibleNowBounds(args.now);
  if (args.categoryId) {
    return postsPublishedByCategory.count(ctx, { bounds, namespace: args.categoryId });
  }
  return postsPublishedByTime.count(ctx, { bounds });
}

export async function countPublishedServices(
  ctx: QueryCtx,
  args: { categoryId?: string; now?: number } = {}
) {
  const bounds = visibleNowBounds(args.now);
  if (args.categoryId) {
    return servicesPublishedByCategory.count(ctx, { bounds, namespace: args.categoryId });
  }
  return servicesPublishedByTime.count(ctx, { bounds });
}

export async function recordPostAggregates(ctx: MutationCtx, doc: Doc<"posts">) {
  await Promise.all([
    postsPublishedByTime.insertIfDoesNotExist(ctx, doc),
    postsPublishedByCategory.insertIfDoesNotExist(ctx, doc),
  ]);
}

export async function replacePostAggregates(
  ctx: MutationCtx,
  oldDoc: Doc<"posts">,
  newDoc: Doc<"posts">
) {
  await Promise.all([
    postsPublishedByTime.replaceOrInsert(ctx, oldDoc, newDoc),
    postsPublishedByCategory.replaceOrInsert(ctx, oldDoc, newDoc),
  ]);
}

export async function deletePostAggregates(ctx: MutationCtx, doc: Doc<"posts">) {
  await Promise.all([
    postsPublishedByTime.deleteIfExists(ctx, doc),
    postsPublishedByCategory.deleteIfExists(ctx, doc),
  ]);
}

export async function recordServiceAggregates(ctx: MutationCtx, doc: Doc<"services">) {
  await Promise.all([
    servicesPublishedByTime.insertIfDoesNotExist(ctx, doc),
    servicesPublishedByCategory.insertIfDoesNotExist(ctx, doc),
  ]);
}

export async function replaceServiceAggregates(
  ctx: MutationCtx,
  oldDoc: Doc<"services">,
  newDoc: Doc<"services">
) {
  await Promise.all([
    servicesPublishedByTime.replaceOrInsert(ctx, oldDoc, newDoc),
    servicesPublishedByCategory.replaceOrInsert(ctx, oldDoc, newDoc),
  ]);
}

export async function deleteServiceAggregates(ctx: MutationCtx, doc: Doc<"services">) {
  await Promise.all([
    servicesPublishedByTime.deleteIfExists(ctx, doc),
    servicesPublishedByCategory.deleteIfExists(ctx, doc),
  ]);
}
