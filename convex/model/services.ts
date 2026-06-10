import { resolveUniqueSlug } from "../lib/iaSlugs";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import {
  deleteServiceAggregates,
  recordServiceAggregates,
  replaceServiceAggregates,
} from "../lib/aggregates/publicContent";

const MAX_ITEMS_LIMIT = 100;

export async function getById(
  ctx: QueryCtx,
  { id }: { id: Id<"services"> }
): Promise<Doc<"services"> | null> {
  return  ctx.db.get(id);
}

export async function getByIdOrThrow(
  ctx: QueryCtx,
  { id }: { id: Id<"services"> }
): Promise<Doc<"services">> {
  const service = await ctx.db.get(id);
  if (!service) {throw new Error("Service not found");}
  return service;
}

export async function getBySlug(
  ctx: QueryCtx,
  { slug }: { slug: string }
): Promise<Doc<"services"> | null> {
  return  ctx.db
    .query("services")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

export async function isSlugExists(
  ctx: QueryCtx,
  { slug, excludeId }: { slug: string; excludeId?: Id<"services"> }
): Promise<boolean> {
  const existing = await ctx.db
    .query("services")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (!existing) {return false;}
  if (excludeId && existing._id === excludeId) {return false;}
  return true;
}

export async function listWithLimit(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"services">[]> {
  return  ctx.db
    .query("services")
    .order("desc")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

export async function listByStatus(
  ctx: QueryCtx,
  { status, limit = MAX_ITEMS_LIMIT }: { status: Doc<"services">["status"]; limit?: number }
): Promise<Doc<"services">[]> {
  return  ctx.db
    .query("services")
    .withIndex("by_status_publishedAt", (q) => q.eq("status", status))
    .order("desc")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

export async function listByCategory(
  ctx: QueryCtx,
  { categoryId, limit = MAX_ITEMS_LIMIT }: { categoryId: Id<"serviceCategories">; limit?: number }
): Promise<Doc<"services">[]> {
  return  ctx.db
    .query("services")
    .withIndex("by_category_status", (q) => q.eq("categoryId", categoryId))
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

export async function countWithLimit(
  ctx: QueryCtx,
  { status, limit = 1000 }: { status?: Doc<"services">["status"]; limit?: number } = {}
): Promise<{ count: number; hasMore: boolean }> {
  const query = status
    ? ctx.db.query("services").withIndex("by_status_publishedAt", (q) => q.eq("status", status))
    : ctx.db.query("services");
  
  const items = await query.take(limit + 1);
  return {
    count: Math.min(items.length, limit),
    hasMore: items.length > limit,
  };
}

export async function countByCategory(
  ctx: QueryCtx,
  { categoryId }: { categoryId: Id<"serviceCategories"> }
): Promise<number> {
  const services = await ctx.db
    .query("services")
    .withIndex("by_category_status", (q) => q.eq("categoryId", categoryId))
    .take(1000);
  return services.length;
}

export async function getNextOrder(ctx: QueryCtx): Promise<number> {
  const lastService = await ctx.db.query("services").order("desc").first();
  return lastService ? lastService.order + 1 : 0;
}

export async function create(
  ctx: MutationCtx,
  args: {
    title: string;
    slug: string;
    content: string;
    renderType?: "content" | "markdown" | "html";
    markdownRender?: string;
    htmlRender?: string;
    excerpt?: string;
    thumbnail?: string;
    thumbnailStorageId?: Id<"_storage"> | null;
    categoryId: Id<"serviceCategories">;
    price?: number;
    duration?: string;
    bookingEnabled?: boolean;
    bookingDurationMin?: number;
    bookingSlotIntervalMin?: number;
    bookingCapacityPerSlot?: number;
    bookingSlotTemplateDefault?: string[];
    bookingSlotTemplateByWeekday?: Record<string, string[]>;
    metaTitle?: string;
    metaDescription?: string;
    status?: Doc<"services">["status"];
    order?: number;
    featured?: boolean;
  }
): Promise<Id<"services">> {
  const resolvedSlug = await resolveUniqueSlug(ctx, {
    scope: "record",
    slug: args.slug,
  });

  const order = args.order ?? (await getNextOrder(ctx));
  const status = args.status ?? "Draft";

  const id = await ctx.db.insert("services", {
    categoryId: args.categoryId,
    content: args.content,
    renderType: args.renderType ?? "content",
    markdownRender: args.markdownRender,
    htmlRender: args.htmlRender,
    duration: args.duration,
    bookingEnabled: args.bookingEnabled,
    bookingDurationMin: args.bookingDurationMin,
    bookingSlotIntervalMin: args.bookingSlotIntervalMin,
    bookingCapacityPerSlot: args.bookingCapacityPerSlot,
    bookingSlotTemplateDefault: args.bookingSlotTemplateDefault,
    bookingSlotTemplateByWeekday: args.bookingSlotTemplateByWeekday,
    excerpt: args.excerpt,
    featured: args.featured,
    metaDescription: args.metaDescription,
    metaTitle: args.metaTitle,
    order,
    price: args.price,
    publishedAt: status === "Published" ? Date.now() : undefined,
    slug: resolvedSlug.slug,
    status,
    thumbnail: args.thumbnail,
    thumbnailStorageId: args.thumbnailStorageId ?? null,
    title: args.title,
    views: 0,
  });
  const service = await ctx.db.get(id);
  if (service) {
    await recordServiceAggregates(ctx, service);
  }
  return id;
}

export async function update(
  ctx: MutationCtx,
  args: {
    id: Id<"services">;
    title?: string;
    slug?: string;
    content?: string;
    renderType?: "content" | "markdown" | "html";
    markdownRender?: string;
    htmlRender?: string;
    excerpt?: string;
    thumbnail?: string;
    thumbnailStorageId?: Id<"_storage"> | null;
    categoryId?: Id<"serviceCategories">;
    price?: number;
    duration?: string;
    bookingEnabled?: boolean;
    bookingDurationMin?: number;
    bookingSlotIntervalMin?: number;
    bookingCapacityPerSlot?: number;
    bookingSlotTemplateDefault?: string[];
    bookingSlotTemplateByWeekday?: Record<string, string[]>;
    metaTitle?: string;
    metaDescription?: string;
    status?: Doc<"services">["status"];
    order?: number;
    featured?: boolean;
  }
): Promise<void> {
  const service = await getByIdOrThrow(ctx, { id: args.id });

  if (args.slug && args.slug !== service.slug) {
    const resolvedSlug = await resolveUniqueSlug(ctx, {
      scope: "record",
      slug: args.slug,
      exclude: { id: args.id, table: "services" },
    });
    if (resolvedSlug.slug !== args.slug) {
      (args as { slug?: string }).slug = resolvedSlug.slug;
    }
  }

  const { id, ...updates } = args;
  const patchData: Record<string, unknown> = { ...updates };

  if (args.status === "Published" && service.status !== "Published") {
    patchData.publishedAt = Date.now();
  }

  await ctx.db.patch(id, patchData);
  const updatedService = await ctx.db.get(id);
  if (updatedService) {
    await replaceServiceAggregates(ctx, service, updatedService);
  }
}

/**
 * SVC-011: Delete service and related comments (like posts.remove)
 */
export async function remove(
  ctx: MutationCtx,
  { cascade, id }: { cascade?: boolean; id: Id<"services"> }
): Promise<void> {
  const service = await getByIdOrThrow(ctx, { id });
  const preview = await ctx.db
    .query("comments")
    .withIndex("by_target_status", (q) =>
      q.eq("targetType", "service").eq("targetId", id as string)
    )
    .take(1);

  if (preview.length > 0 && !cascade) {
    throw new Error("Dịch vụ có bình luận liên quan. Vui lòng xác nhận xóa tất cả.");
  }

  if (cascade) {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_target_status", (q) =>
        q.eq("targetType", "service").eq("targetId", id as string)
      )
      .collect();
    await Promise.all(comments.map( async (comment) => ctx.db.delete(comment._id)));
  }

  await ctx.db.delete(id);
  await deleteServiceAggregates(ctx, service);
}

export async function getDeleteInfo(
  ctx: QueryCtx,
  { id }: { id: Id<"services"> }
): Promise<{ canDelete: boolean; dependencies: { count: number; hasMore: boolean; label: string; preview: { id: string; name: string }[] }[] }> {
  const preview = await ctx.db
    .query("comments")
    .withIndex("by_target_status", (q) =>
      q.eq("targetType", "service").eq("targetId", id as string)
    )
    .take(10);
  const count = await ctx.db
    .query("comments")
    .withIndex("by_target_status", (q) =>
      q.eq("targetType", "service").eq("targetId", id as string)
    )
    .take(1001);

  return {
    canDelete: true,
    dependencies: [
      {
        count: Math.min(count.length, 1000),
        hasMore: count.length > 1000,
        label: "Bình luận",
        preview: preview.map((comment) => ({ id: comment._id, name: comment.content })),
      },
    ],
  };
}

export async function incrementViews(
  ctx: MutationCtx,
  { id }: { id: Id<"services"> }
): Promise<void> {
  const service = await getByIdOrThrow(ctx, { id });
  await ctx.db.patch(id, { views: service.views + 1 });
}
