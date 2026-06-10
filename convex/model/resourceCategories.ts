import { resolveUniqueSlug } from "../lib/iaSlugs";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

const MAX_ITEMS_LIMIT = 100;

export async function getById(
  ctx: QueryCtx,
  { id }: { id: Id<"resourceCategories"> }
): Promise<Doc<"resourceCategories"> | null> {
  return ctx.db.get(id);
}

export async function getByIdOrThrow(
  ctx: QueryCtx,
  { id }: { id: Id<"resourceCategories"> }
): Promise<Doc<"resourceCategories">> {
  const category = await ctx.db.get(id);
  if (!category) {throw new Error("Resource category not found");}
  return category;
}

export async function getBySlug(
  ctx: QueryCtx,
  { slug }: { slug: string }
): Promise<Doc<"resourceCategories"> | null> {
  return ctx.db
    .query("resourceCategories")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

export async function listWithLimit(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"resourceCategories">[]> {
  return ctx.db
    .query("resourceCategories")
    .order("asc")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

export async function listActive(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"resourceCategories">[]> {
  return ctx.db
    .query("resourceCategories")
    .withIndex("by_active", (q) => q.eq("active", true))
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

export async function listByParent(
  ctx: QueryCtx,
  { parentId }: { parentId?: Id<"resourceCategories"> }
): Promise<Doc<"resourceCategories">[]> {
  return ctx.db
    .query("resourceCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", parentId))
    .collect();
}

export async function countWithLimit(
  ctx: QueryCtx,
  { limit = 1000 }: { limit?: number } = {}
): Promise<{ count: number; hasMore: boolean }> {
  const items = await ctx.db.query("resourceCategories").take(limit + 1);
  return {
    count: Math.min(items.length, limit),
    hasMore: items.length > limit,
  };
}

export async function getNextOrder(ctx: QueryCtx): Promise<number> {
  const lastCategory = await ctx.db.query("resourceCategories").order("desc").first();
  return lastCategory ? lastCategory.order + 1 : 0;
}

export async function create(
  ctx: MutationCtx,
  args: {
    active?: boolean;
    description?: string;
    name: string;
    order?: number;
    parentId?: Id<"resourceCategories">;
    slug: string;
    thumbnail?: string;
  }
): Promise<Id<"resourceCategories">> {
  const resolvedSlug = await resolveUniqueSlug(ctx, {
    scope: "category",
    slug: args.slug,
  });

  const order = args.order ?? (await getNextOrder(ctx));

  return ctx.db.insert("resourceCategories", {
    active: args.active ?? true,
    description: args.description,
    name: args.name,
    order,
    parentId: args.parentId,
    slug: resolvedSlug.slug,
    thumbnail: args.thumbnail,
  });
}

export async function update(
  ctx: MutationCtx,
  args: {
    active?: boolean;
    description?: string;
    id: Id<"resourceCategories">;
    name?: string;
    order?: number;
    parentId?: Id<"resourceCategories">;
    slug?: string;
    thumbnail?: string;
  }
): Promise<void> {
  const category = await getByIdOrThrow(ctx, { id: args.id });

  if (args.slug && args.slug !== category.slug) {
    const resolvedSlug = await resolveUniqueSlug(ctx, {
      scope: "category",
      slug: args.slug,
      exclude: { id: args.id, table: "resourceCategories" },
    });
    if (resolvedSlug.slug !== args.slug) {
      (args as { slug?: string }).slug = resolvedSlug.slug;
    }
  }

  const { id, ...updates } = args;
  await ctx.db.patch(id, updates);
}

export async function remove(
  ctx: MutationCtx,
  { cascade, id }: { cascade?: boolean; id: Id<"resourceCategories"> }
): Promise<void> {
  const category = await ctx.db.get(id);
  if (!category) {throw new Error("Resource category not found");}

  const childPreview = await ctx.db
    .query("resourceCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(1);
  if (childPreview.length > 0 && !cascade) {
    throw new Error("Danh mục có danh mục con. Vui lòng xác nhận xóa tất cả.");
  }

  const coursePreview = await ctx.db
    .query("resources")
    .withIndex("by_category_status", (q) => q.eq("categoryId", id))
    .take(1);
  if (coursePreview.length > 0 && !cascade) {
    throw new Error("Danh mục có tài nguyên liên quan. Vui lòng xác nhận xóa tất cả.");
  }

  if (cascade) {
    const queue: Doc<"resourceCategories">[] = [category];
    const categoryIds: Id<"resourceCategories">[] = [];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {continue;}
      categoryIds.push(current._id);
      const children = await ctx.db
        .query("resourceCategories")
        .withIndex("by_parent", (q) => q.eq("parentId", current._id))
        .collect();
      queue.push(...children);
    }

    const resourcesByCategory = await Promise.all(
      categoryIds.map((categoryId) => ctx.db
        .query("resources")
        .withIndex("by_category_status", (q) => q.eq("categoryId", categoryId))
        .collect())
    );
    const resourceIds = resourcesByCategory.flat().map((resource) => resource._id);
    const resourceCustomersByResource = await Promise.all(resourceIds.map((resourceId) =>
      ctx.db.query("resourceCustomers").withIndex("by_resourceId", (q) => q.eq("resourceId", resourceId)).collect()
    ));
    const filterAssignmentsByResource = await Promise.all(resourceIds.map((resourceId) =>
      ctx.db.query("resourceFilterAssignments").withIndex("by_resource", (q) => q.eq("resourceId", resourceId)).collect()
    ));
    const categoryAssignmentsByResource = await Promise.all(resourceIds.map((resourceId) =>
      ctx.db.query("resourceCategoryAssignments").withIndex("by_resource", (q) => q.eq("resourceId", resourceId)).collect()
    ));
    await Promise.all(resourceCustomersByResource.flat().map((record) => ctx.db.delete(record._id)));
    await Promise.all(filterAssignmentsByResource.flat().map((record) => ctx.db.delete(record._id)));
    await Promise.all(categoryAssignmentsByResource.flat().map((record) => ctx.db.delete(record._id)));
    await Promise.all(resourceIds.map((resourceId) => ctx.db.delete(resourceId)));
    await Promise.all(categoryIds.map((categoryId) => ctx.db.delete(categoryId)));
    return;
  }

  await ctx.db.delete(id);
}

export async function getDeleteInfo(
  ctx: QueryCtx,
  { id }: { id: Id<"resourceCategories"> }
): Promise<{ canDelete: boolean; dependencies: { count: number; hasMore: boolean; label: string; preview: { id: string; name: string }[] }[] }> {
  const childrenPreview = await ctx.db
    .query("resourceCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(10);
  const childrenCount = await ctx.db
    .query("resourceCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(1001);
  const resourcesPreview = await ctx.db
    .query("resources")
    .withIndex("by_category_status", (q) => q.eq("categoryId", id))
    .take(10);
  const resourcesCount = await ctx.db
    .query("resources")
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
        count: Math.min(resourcesCount.length, 1000),
        hasMore: resourcesCount.length > 1000,
        label: "Tài nguyên",
        preview: resourcesPreview.map((course) => ({ id: course._id, name: course.title })),
      },
    ],
  };
}

export async function reorder(
  ctx: MutationCtx,
  { items }: { items: { id: Id<"resourceCategories">; order: number }[] }
): Promise<void> {
  for (const item of items) {
    await ctx.db.patch(item.id, { order: item.order });
  }
}
