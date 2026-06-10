import { resolveUniqueSlug } from "../lib/iaSlugs";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// ============================================================
// HELPER FUNCTIONS - Post Categories Model Layer
// ============================================================

const MAX_ITEMS_LIMIT = 100;

/**
 * Get category by ID with null check
 */
export async function getById(
  ctx: QueryCtx,
  { id }: { id: Id<"postCategories"> }
): Promise<Doc<"postCategories"> | null> {
  return  ctx.db.get(id);
}

/**
 * Get category by ID or throw error
 */
export async function getByIdOrThrow(
  ctx: QueryCtx,
  { id }: { id: Id<"postCategories"> }
): Promise<Doc<"postCategories">> {
  const category = await ctx.db.get(id);
  if (!category) {throw new Error("Category not found");}
  return category;
}

/**
 * Get category by slug
 */
export async function getBySlug(
  ctx: QueryCtx,
  { slug }: { slug: string }
): Promise<Doc<"postCategories"> | null> {
  return  ctx.db
    .query("postCategories")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

/**
 * Check if slug exists
 */
export async function isSlugExists(
  ctx: QueryCtx,
  { slug, excludeId }: { slug: string; excludeId?: Id<"postCategories"> }
): Promise<boolean> {
  const existing = await ctx.db
    .query("postCategories")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (!existing) {return false;}
  if (excludeId && existing._id === excludeId) {return false;}
  return true;
}

/**
 * List categories with limit
 */
export async function listWithLimit(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"postCategories">[]> {
  return  ctx.db
    .query("postCategories")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

/**
 * List active categories
 */
export async function listActive(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"postCategories">[]> {
  return  ctx.db
    .query("postCategories")
    .withIndex("by_active", (q) => q.eq("active", true))
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

/**
 * List categories by parent
 */
export async function listByParent(
  ctx: QueryCtx,
  { parentId }: { parentId?: Id<"postCategories"> }
): Promise<Doc<"postCategories">[]> {
  if (parentId === undefined) {
    return  ctx.db
      .query("postCategories")
      .withIndex("by_parent", (q) => q.eq("parentId", undefined))
      .collect();
  }
  return  ctx.db
    .query("postCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", parentId))
    .collect();
}

/**
 * Count categories
 */
export async function countWithLimit(
  ctx: QueryCtx,
  { limit = 1000 }: { limit?: number } = {}
): Promise<{ count: number; hasMore: boolean }> {
  const items = await ctx.db.query("postCategories").take(limit + 1);
  return {
    count: Math.min(items.length, limit),
    hasMore: items.length > limit,
  };
}

/**
 * Check if category has children
 */
export async function hasChildren(
  ctx: QueryCtx,
  { id }: { id: Id<"postCategories"> }
): Promise<boolean> {
  const child = await ctx.db
    .query("postCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .first();
  return child !== null;
}

/**
 * Check if category has posts
 */
export async function hasPosts(
  ctx: QueryCtx,
  { id }: { id: Id<"postCategories"> }
): Promise<boolean> {
  const post = await ctx.db
    .query("posts")
    .withIndex("by_category_status", (q) => q.eq("categoryId", id))
    .first();
  return post !== null;
}

/**
 * Get next order value
 */
export async function getNextOrder(ctx: QueryCtx): Promise<number> {
  const lastCategory = await ctx.db.query("postCategories").order("desc").first();
  return lastCategory ? lastCategory.order + 1 : 0;
}

/**
 * Create category
 */
export async function create(
  ctx: MutationCtx,
  args: {
    name: string;
    slug: string;
    parentId?: Id<"postCategories">;
    description?: string;
    thumbnail?: string;
    order?: number;
    active?: boolean;
  }
): Promise<Id<"postCategories">> {
  const resolvedSlug = await resolveUniqueSlug(ctx, {
    scope: "category",
    slug: args.slug,
  });

  const order = args.order ?? (await getNextOrder(ctx));

  return  ctx.db.insert("postCategories", {
    active: args.active ?? true,
    description: args.description,
    name: args.name,
    order,
    parentId: args.parentId,
    slug: resolvedSlug.slug,
    thumbnail: args.thumbnail,
  });
}

/**
 * Update category
 */
export async function update(
  ctx: MutationCtx,
  args: {
    id: Id<"postCategories">;
    name?: string;
    slug?: string;
    parentId?: Id<"postCategories">;
    description?: string;
    thumbnail?: string;
    order?: number;
    active?: boolean;
  }
): Promise<void> {
  const category = await getByIdOrThrow(ctx, { id: args.id });

  if (args.slug && args.slug !== category.slug) {
    const resolvedSlug = await resolveUniqueSlug(ctx, {
      scope: "category",
      slug: args.slug,
      exclude: { id: args.id, table: "postCategories" },
    });
    if (resolvedSlug.slug !== args.slug) {
      (args as { slug?: string }).slug = resolvedSlug.slug;
    }
  }

  const { id, ...updates } = args;
  await ctx.db.patch(id, updates);
}

/**
 * Delete category (with validation) - FIX HIGH-005: Better error messages
 */
export async function remove(
  ctx: MutationCtx,
  { cascade, id }: { cascade?: boolean; id: Id<"postCategories"> }
): Promise<void> {
  const category = await ctx.db.get(id);
  if (!category) {throw new Error("Category not found");}

  const childPreview = await ctx.db
    .query("postCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(1);
  if (childPreview.length > 0 && !cascade) {
    throw new Error("Danh mục có danh mục con. Vui lòng xác nhận xóa tất cả.");
  }
  
  const postPreview = await ctx.db
    .query("posts")
    .withIndex("by_category_status", (q) => q.eq("categoryId", id))
    .take(1);
  if (postPreview.length > 0 && !cascade) {
    throw new Error("Danh mục có bài viết liên quan. Vui lòng xác nhận xóa tất cả.");
  }

  if (cascade) {
    const queue: Doc<"postCategories">[] = [category];
    const categoryIds: Id<"postCategories">[] = [];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {continue;}
      categoryIds.push(current._id);
      const children = await ctx.db
        .query("postCategories")
        .withIndex("by_parent", (q) => q.eq("parentId", current._id))
        .collect();
      queue.push(...children);
    }

    const postsByCategory = await Promise.all(
      categoryIds.map((categoryId) => ctx.db
          .query("posts")
          .withIndex("by_category_status", (q) => q.eq("categoryId", categoryId))
          .collect())
    );

    const postIds = postsByCategory.flat().map((post) => post._id);
    await Promise.all(postIds.map((postId) => ctx.db.delete(postId)));
    await Promise.all(categoryIds.map((categoryId) => ctx.db.delete(categoryId)));
    return;
  }

  await ctx.db.delete(id);
}

/**
 * FIX HIGH-005: Get delete info for cascade warning
 */
export async function getDeleteInfo(
  ctx: QueryCtx,
  { id }: { id: Id<"postCategories"> }
): Promise<{ canDelete: boolean; dependencies: { count: number; hasMore: boolean; label: string; preview: { id: string; name: string }[] }[] }> {
  const childrenPreview = await ctx.db
    .query("postCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(10);
  const childrenCount = await ctx.db
    .query("postCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(1001);
  
  const postsPreview = await ctx.db
    .query("posts")
    .withIndex("by_category_status", (q) => q.eq("categoryId", id))
    .take(10);
  const postsCount = await ctx.db
    .query("posts")
    .withIndex("by_category_status", (q) => q.eq("categoryId", id))
    .take(1001);
  
  return {
    canDelete: true,
    dependencies: [
      {
        count: Math.min(childrenCount.length, 1000),
        hasMore: childrenCount.length > 1000,
        label: "Danh mục con",
        preview: childrenPreview.map((child) => ({ id: child._id, name: child.name })),
      },
      {
        count: Math.min(postsCount.length, 1000),
        hasMore: postsCount.length > 1000,
        label: "Bài viết",
        preview: postsPreview.map((post) => ({ id: post._id, name: post.title })),
      },
    ],
  };
}

/**
 * Reorder categories
 */
export async function reorder(
  ctx: MutationCtx,
  { items }: { items: { id: Id<"postCategories">; order: number }[] }
): Promise<void> {
  for (const item of items) {
    await ctx.db.patch(item.id, { order: item.order });
  }
}
