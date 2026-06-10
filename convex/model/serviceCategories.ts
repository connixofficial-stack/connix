import { resolveUniqueSlug } from "../lib/iaSlugs";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

const MAX_ITEMS_LIMIT = 100;

export async function getById(
  ctx: QueryCtx,
  { id }: { id: Id<"serviceCategories"> }
): Promise<Doc<"serviceCategories"> | null> {
  return  ctx.db.get(id);
}

export async function getByIdOrThrow(
  ctx: QueryCtx,
  { id }: { id: Id<"serviceCategories"> }
): Promise<Doc<"serviceCategories">> {
  const category = await ctx.db.get(id);
  if (!category) {throw new Error("Service category not found");}
  return category;
}

export async function getBySlug(
  ctx: QueryCtx,
  { slug }: { slug: string }
): Promise<Doc<"serviceCategories"> | null> {
  return  ctx.db
    .query("serviceCategories")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

export async function isSlugExists(
  ctx: QueryCtx,
  { slug, excludeId }: { slug: string; excludeId?: Id<"serviceCategories"> }
): Promise<boolean> {
  const existing = await ctx.db
    .query("serviceCategories")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (!existing) {return false;}
  if (excludeId && existing._id === excludeId) {return false;}
  return true;
}

export async function listWithLimit(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"serviceCategories">[]> {
  return  ctx.db
    .query("serviceCategories")
    .order("asc")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

export async function listActive(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"serviceCategories">[]> {
  return  ctx.db
    .query("serviceCategories")
    .withIndex("by_active", (q) => q.eq("active", true))
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

export async function listByParent(
  ctx: QueryCtx,
  { parentId }: { parentId?: Id<"serviceCategories"> }
): Promise<Doc<"serviceCategories">[]> {
  return  ctx.db
    .query("serviceCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", parentId))
    .collect();
}

export async function countWithLimit(
  ctx: QueryCtx,
  { limit = 1000 }: { limit?: number } = {}
): Promise<{ count: number; hasMore: boolean }> {
  const items = await ctx.db.query("serviceCategories").take(limit + 1);
  return {
    count: Math.min(items.length, limit),
    hasMore: items.length > limit,
  };
}

export async function getNextOrder(ctx: QueryCtx): Promise<number> {
  const lastCategory = await ctx.db.query("serviceCategories").order("desc").first();
  return lastCategory ? lastCategory.order + 1 : 0;
}

export async function create(
  ctx: MutationCtx,
  args: {
    name: string;
    slug: string;
    parentId?: Id<"serviceCategories">;
    description?: string;
    thumbnail?: string;
    order?: number;
    active?: boolean;
  }
): Promise<Id<"serviceCategories">> {
  const resolvedSlug = await resolveUniqueSlug(ctx, {
    scope: "category",
    slug: args.slug,
  });

  const order = args.order ?? (await getNextOrder(ctx));

  return  ctx.db.insert("serviceCategories", {
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
    id: Id<"serviceCategories">;
    name?: string;
    slug?: string;
    parentId?: Id<"serviceCategories">;
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
      exclude: { id: args.id, table: "serviceCategories" },
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
  { cascade, id }: { cascade?: boolean; id: Id<"serviceCategories"> }
): Promise<void> {
  const category = await ctx.db.get(id);
  if (!category) {throw new Error("Service category not found");}

  const childPreview = await ctx.db
    .query("serviceCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(1);
  if (childPreview.length > 0 && !cascade) {
    throw new Error("Danh mục có danh mục con. Vui lòng xác nhận xóa tất cả.");
  }

  const servicePreview = await ctx.db
    .query("services")
    .withIndex("by_category_status", (q) => q.eq("categoryId", id))
    .take(1);
  if (servicePreview.length > 0 && !cascade) {
    throw new Error("Danh mục có dịch vụ liên quan. Vui lòng xác nhận xóa tất cả.");
  }

  if (cascade) {
    const queue: Doc<"serviceCategories">[] = [category];
    const categoryIds: Id<"serviceCategories">[] = [];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {continue;}
      categoryIds.push(current._id);
      const children = await ctx.db
        .query("serviceCategories")
        .withIndex("by_parent", (q) => q.eq("parentId", current._id))
        .collect();
      queue.push(...children);
    }

    const servicesByCategory = await Promise.all(
      categoryIds.map((categoryId) => ctx.db
          .query("services")
          .withIndex("by_category_status", (q) => q.eq("categoryId", categoryId))
          .collect())
    );
    const serviceIds = servicesByCategory.flat().map((service) => service._id);
    await Promise.all(serviceIds.map((serviceId) => ctx.db.delete(serviceId)));
    await Promise.all(categoryIds.map((categoryId) => ctx.db.delete(categoryId)));
    return;
  }

  await ctx.db.delete(id);
}

export async function getDeleteInfo(
  ctx: QueryCtx,
  { id }: { id: Id<"serviceCategories"> }
): Promise<{ canDelete: boolean; dependencies: { count: number; hasMore: boolean; label: string; preview: { id: string; name: string }[] }[] }> {
  const childrenPreview = await ctx.db
    .query("serviceCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(10);
  const childrenCount = await ctx.db
    .query("serviceCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(1001);
  const servicesPreview = await ctx.db
    .query("services")
    .withIndex("by_category_status", (q) => q.eq("categoryId", id))
    .take(10);
  const servicesCount = await ctx.db
    .query("services")
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
        count: Math.min(servicesCount.length, 1000),
        hasMore: servicesCount.length > 1000,
        label: "Dịch vụ",
        preview: servicesPreview.map((service) => ({ id: service._id, name: service.title })),
      },
    ],
  };
}

export async function reorder(
  ctx: MutationCtx,
  { items }: { items: { id: Id<"serviceCategories">; order: number }[] }
): Promise<void> {
  for (const item of items) {
    await ctx.db.patch(item.id, { order: item.order });
  }
}
