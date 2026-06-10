import { resolveUniqueSlug } from "../lib/iaSlugs";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import {
  deletePostAggregates,
  recordPostAggregates,
  replacePostAggregates,
} from "../lib/aggregates/publicContent";

// ============================================================
// HELPER FUNCTIONS - Posts Model Layer
// ============================================================

const MAX_ITEMS_LIMIT = 100;

/**
 * Get post by ID with null check
 */
export async function getById(
  ctx: QueryCtx,
  { id }: { id: Id<"posts"> }
): Promise<Doc<"posts"> | null> {
  return  ctx.db.get(id);
}

/**
 * Get post by ID or throw error
 */
export async function getByIdOrThrow(
  ctx: QueryCtx,
  { id }: { id: Id<"posts"> }
): Promise<Doc<"posts">> {
  const post = await ctx.db.get(id);
  if (!post) {throw new Error("Post not found");}
  return post;
}

/**
 * Get post by slug
 */
export async function getBySlug(
  ctx: QueryCtx,
  { slug }: { slug: string }
): Promise<Doc<"posts"> | null> {
  return  ctx.db
    .query("posts")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

/**
 * Check if slug exists (excluding specific ID)
 */
export async function isSlugExists(
  ctx: QueryCtx,
  { slug, excludeId }: { slug: string; excludeId?: Id<"posts"> }
): Promise<boolean> {
  const existing = await ctx.db
    .query("posts")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (!existing) {return false;}
  if (excludeId && existing._id === excludeId) {return false;}
  return true;
}

/**
 * List posts with limit (for admin listing without pagination)
 * Use take() instead of collect() to limit results
 */
export async function listWithLimit(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"posts">[]> {
  return  ctx.db
    .query("posts")
    .order("desc")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

/**
 * List posts by status with limit
 */
export async function listByStatus(
  ctx: QueryCtx,
  { status, limit = MAX_ITEMS_LIMIT }: { status: Doc<"posts">["status"]; limit?: number }
): Promise<Doc<"posts">[]> {
  return  ctx.db
    .query("posts")
    .withIndex("by_status_publishedAt", (q) => q.eq("status", status))
    .order("desc")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

/**
 * List posts by category with limit
 */
export async function listByCategory(
  ctx: QueryCtx,
  { categoryId, limit = MAX_ITEMS_LIMIT }: { categoryId: Id<"postCategories">; limit?: number }
): Promise<Doc<"posts">[]> {
  return  ctx.db
    .query("posts")
    .withIndex("by_category_status", (q) => q.eq("categoryId", categoryId))
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

/**
 * Count posts efficiently using take() and checking length
 * Returns actual count up to limit, or "limit+" indicator
 */
export async function countWithLimit(
  ctx: QueryCtx,
  { status, limit = 1000 }: { status?: Doc<"posts">["status"]; limit?: number } = {}
): Promise<{ count: number; hasMore: boolean }> {
  const query = status
    ? ctx.db.query("posts").withIndex("by_status_publishedAt", (q) => q.eq("status", status))
    : ctx.db.query("posts");
  
  const items = await query.take(limit + 1);
  return {
    count: Math.min(items.length, limit),
    hasMore: items.length > limit,
  };
}

/**
 * Count posts by category
 */
export async function countByCategory(
  ctx: QueryCtx,
  { categoryId }: { categoryId: Id<"postCategories"> }
): Promise<number> {
  const posts = await ctx.db
    .query("posts")
    .withIndex("by_category_status", (q) => q.eq("categoryId", categoryId))
    .take(1000);
  return posts.length;
}

/**
 * Get next order value
 */
export async function getNextOrder(ctx: QueryCtx): Promise<number> {
  const posts = await ctx.db.query("posts").take(1000);
  const lastOrder = posts.reduce((max, post) => Math.max(max, post.order), -1);
  return lastOrder + 1;
}

/**
 * Create post
 */
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
    categoryId: Id<"postCategories">;
    authorName?: string;
    metaTitle?: string;
    metaDescription?: string;
    status?: Doc<"posts">["status"];
    order?: number;
    publishImmediately?: boolean;
    publishedAt?: number;
  }
): Promise<Id<"posts">> {
  const resolvedSlug = await resolveUniqueSlug(ctx, {
    scope: "record",
    slug: args.slug,
  });

  const order = args.order ?? (await getNextOrder(ctx));
  const status = args.status ?? "Draft";
  let resolvedPublishedAt: number | undefined = undefined;
  if (status === "Published") {
    if (args.publishImmediately === true) {
      resolvedPublishedAt = Date.now();
    } else if (typeof args.publishedAt === "number" && Number.isFinite(args.publishedAt)) {
      resolvedPublishedAt = args.publishedAt;
    } else if (args.publishImmediately !== false) {
      resolvedPublishedAt = Date.now();
    }
  }

  const id = await ctx.db.insert("posts", {
    authorName: args.authorName,
    categoryId: args.categoryId,
    content: args.content,
    renderType: args.renderType ?? "content",
    markdownRender: args.markdownRender,
    htmlRender: args.htmlRender,
    excerpt: args.excerpt,
    metaDescription: args.metaDescription,
    metaTitle: args.metaTitle,
    order,
    publishedAt: resolvedPublishedAt,
    slug: resolvedSlug.slug,
    status,
    thumbnail: args.thumbnail,
    thumbnailStorageId: args.thumbnailStorageId ?? null,
    title: args.title,
    views: 0,
  });
  const post = await ctx.db.get(id);
  if (post) {
    await recordPostAggregates(ctx, post);
  }
  return id;
}

/**
 * Update post
 */
export async function update(
  ctx: MutationCtx,
  args: {
    id: Id<"posts">;
    authorName?: string;
    title?: string;
    slug?: string;
    content?: string;
    renderType?: "content" | "markdown" | "html";
    markdownRender?: string;
    htmlRender?: string;
    excerpt?: string;
    thumbnail?: string;
    thumbnailStorageId?: Id<"_storage"> | null;
    categoryId?: Id<"postCategories">;
    metaTitle?: string;
    metaDescription?: string;
    status?: Doc<"posts">["status"];
    order?: number;
    publishImmediately?: boolean;
    publishedAt?: number;
  }
): Promise<void> {
  const post = await getByIdOrThrow(ctx, { id: args.id });

  if (args.slug && args.slug !== post.slug) {
    const resolvedSlug = await resolveUniqueSlug(ctx, {
      scope: "record",
      slug: args.slug,
      exclude: { id: args.id, table: "posts" },
    });
    if (resolvedSlug.slug !== args.slug) {
      (args as { slug?: string }).slug = resolvedSlug.slug;
    }
  }

  const { id, publishImmediately, ...updates } = args;
  const patchData: Record<string, unknown> = { ...updates };

  const hasPublishedAt = Object.prototype.hasOwnProperty.call(args, "publishedAt");
  const nextStatus = args.status ?? post.status;

  if (nextStatus !== "Published") {
    patchData.publishedAt = undefined;
  } else if (publishImmediately === true) {
    patchData.publishedAt = Date.now();
  } else if (hasPublishedAt) {
    const resolvedPublishedAt = typeof args.publishedAt === "number" && Number.isFinite(args.publishedAt)
      ? args.publishedAt
      : Date.now();
    patchData.publishedAt = resolvedPublishedAt;
  } else if (post.status !== "Published") {
    patchData.publishedAt = Date.now();
  }

  await ctx.db.patch(id, patchData);
  const updatedPost = await ctx.db.get(id);
  if (updatedPost) {
    await replacePostAggregates(ctx, post, updatedPost);
  }
}

/**
 * Delete post and related comments
 */
export async function remove(
  ctx: MutationCtx,
  { cascade, id }: { cascade?: boolean; id: Id<"posts"> }
): Promise<void> {
  const post = await getByIdOrThrow(ctx, { id });
  const preview = await ctx.db
    .query("comments")
    .withIndex("by_target_status", (q) =>
      q.eq("targetType", "post").eq("targetId", id)
    )
    .take(1);

  if (preview.length > 0 && !cascade) {
    throw new Error("Bài viết có bình luận liên quan. Vui lòng xác nhận xóa tất cả.");
  }

  if (cascade) {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_target_status", (q) =>
        q.eq("targetType", "post").eq("targetId", id)
      )
      .collect();
    await Promise.all(comments.map( async (comment) => ctx.db.delete(comment._id)));
  }

  await ctx.db.delete(id);
  await deletePostAggregates(ctx, post);
}

export async function getDeleteInfo(
  ctx: QueryCtx,
  { id }: { id: Id<"posts"> }
): Promise<{ canDelete: boolean; dependencies: { count: number; hasMore: boolean; label: string; preview: { id: string; name: string }[] }[] }> {
  const preview = await ctx.db
    .query("comments")
    .withIndex("by_target_status", (q) =>
      q.eq("targetType", "post").eq("targetId", id)
    )
    .take(10);
  const count = await ctx.db
    .query("comments")
    .withIndex("by_target_status", (q) =>
      q.eq("targetType", "post").eq("targetId", id)
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

/**
 * Increment views
 */
export async function incrementViews(
  ctx: MutationCtx,
  { id }: { id: Id<"posts"> }
): Promise<void> {
  const post = await getByIdOrThrow(ctx, { id });
  await ctx.db.patch(id, { views: post.views + 1 });
}
