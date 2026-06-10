import { resolveUniqueSlug } from "../lib/iaSlugs";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

const MAX_ITEMS_LIMIT = 100;

export async function getById(
  ctx: QueryCtx,
  { id }: { id: Id<"projectCategories"> }
): Promise<Doc<"projectCategories"> | null> {
  return ctx.db.get(id);
}

export async function getByIdOrThrow(
  ctx: QueryCtx,
  { id }: { id: Id<"projectCategories"> }
): Promise<Doc<"projectCategories">> {
  const category = await ctx.db.get(id);
  if (!category) {throw new Error("Project category not found");}
  return category;
}

export async function getBySlug(
  ctx: QueryCtx,
  { slug }: { slug: string }
): Promise<Doc<"projectCategories"> | null> {
  return ctx.db
    .query("projectCategories")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

export async function listWithLimit(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"projectCategories">[]> {
  return ctx.db
    .query("projectCategories")
    .order("asc")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

export async function listActive(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"projectCategories">[]> {
  return ctx.db
    .query("projectCategories")
    .withIndex("by_active", (q) => q.eq("active", true))
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

export async function listByParent(
  ctx: QueryCtx,
  { parentId }: { parentId?: Id<"projectCategories"> }
): Promise<Doc<"projectCategories">[]> {
  return ctx.db
    .query("projectCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", parentId))
    .take(MAX_ITEMS_LIMIT);
}

export async function countWithLimit(
  ctx: QueryCtx,
  { limit = 1000 }: { limit?: number } = {}
): Promise<{ count: number; hasMore: boolean }> {
  const items = await ctx.db.query("projectCategories").take(limit + 1);
  return {
    count: Math.min(items.length, limit),
    hasMore: items.length > limit,
  };
}

export async function getNextOrder(ctx: QueryCtx): Promise<number> {
  const lastCategory = await ctx.db.query("projectCategories").order("desc").first();
  return lastCategory ? lastCategory.order + 1 : 0;
}

export async function create(
  ctx: MutationCtx,
  args: {
    active?: boolean;
    description?: string;
    name: string;
    order?: number;
    parentId?: Id<"projectCategories">;
    slug: string;
    thumbnail?: string;
  }
): Promise<Id<"projectCategories">> {
  const resolvedSlug = await resolveUniqueSlug(ctx, {
    scope: "category",
    slug: args.slug,
  });

  const order = args.order ?? (await getNextOrder(ctx));

  return ctx.db.insert("projectCategories", {
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
    id: Id<"projectCategories">;
    name?: string;
    order?: number;
    parentId?: Id<"projectCategories">;
    slug?: string;
    thumbnail?: string;
  }
): Promise<void> {
  const category = await getByIdOrThrow(ctx, { id: args.id });

  if (args.slug && args.slug !== category.slug) {
    const resolvedSlug = await resolveUniqueSlug(ctx, {
      scope: "category",
      slug: args.slug,
      exclude: { id: args.id, table: "projectCategories" },
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
  { cascade, id }: { cascade?: boolean; id: Id<"projectCategories"> }
): Promise<void> {
  const category = await ctx.db.get(id);
  if (!category) {throw new Error("Project category not found");}

  const childPreview = await ctx.db
    .query("projectCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(1);
  if (childPreview.length > 0 && !cascade) {
    throw new Error("Danh mục có danh mục con. Vui lòng xác nhận xóa tất cả.");
  }

  const projectPreview = await ctx.db
    .query("projects")
    .withIndex("by_category_status", (q) => q.eq("categoryId", id))
    .take(1);
  if (projectPreview.length > 0 && !cascade) {
    throw new Error("Danh mục có dự án liên quan. Vui lòng xác nhận xóa tất cả.");
  }

  if (cascade) {
    const queue: Doc<"projectCategories">[] = [category];
    const categoryIds: Id<"projectCategories">[] = [];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {continue;}
      categoryIds.push(current._id);
      const children = await ctx.db
        .query("projectCategories")
        .withIndex("by_parent", (q) => q.eq("parentId", current._id))
        .take(MAX_ITEMS_LIMIT);
      queue.push(...children);
    }

    const projectsByCategory = await Promise.all(
      categoryIds.map((categoryId) => ctx.db
        .query("projects")
        .withIndex("by_category_status", (q) => q.eq("categoryId", categoryId))
        .take(1000))
    );
    const projectIds = projectsByCategory.flat().map((project) => project._id);
    const assignments = await Promise.all(
      projectIds.map((projectId) => ctx.db
        .query("projectCategoryAssignments")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .take(1000))
    );
    await Promise.all(assignments.flat().map((assignment) => ctx.db.delete(assignment._id)));
    await Promise.all(projectIds.map((projectId) => ctx.db.delete(projectId)));
    await Promise.all(categoryIds.map((categoryId) => ctx.db.delete(categoryId)));
    return;
  }

  await ctx.db.delete(id);
}

export async function getDeleteInfo(
  ctx: QueryCtx,
  { id }: { id: Id<"projectCategories"> }
): Promise<{ canDelete: boolean; dependencies: { count: number; hasMore: boolean; label: string; preview: { id: string; name: string }[] }[] }> {
  const childrenPreview = await ctx.db
    .query("projectCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(10);
  const childrenCount = await ctx.db
    .query("projectCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(1001);
  const projectsPreview = await ctx.db
    .query("projects")
    .withIndex("by_category_status", (q) => q.eq("categoryId", id))
    .take(10);
  const projectsCount = await ctx.db
    .query("projects")
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
        count: Math.min(projectsCount.length, 1000),
        hasMore: projectsCount.length > 1000,
        label: "Dự án",
        preview: projectsPreview.map((project) => ({ id: project._id, name: project.title })),
      },
    ],
  };
}

export async function reorder(
  ctx: MutationCtx,
  { items }: { items: { id: Id<"projectCategories">; order: number }[] }
): Promise<void> {
  for (const item of items) {
    await ctx.db.patch(item.id, { order: item.order });
  }
}
