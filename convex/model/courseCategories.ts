import { resolveUniqueSlug } from "../lib/iaSlugs";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

const MAX_ITEMS_LIMIT = 100;

export async function getById(
  ctx: QueryCtx,
  { id }: { id: Id<"courseCategories"> }
): Promise<Doc<"courseCategories"> | null> {
  return ctx.db.get(id);
}

export async function getByIdOrThrow(
  ctx: QueryCtx,
  { id }: { id: Id<"courseCategories"> }
): Promise<Doc<"courseCategories">> {
  const category = await ctx.db.get(id);
  if (!category) {throw new Error("Course category not found");}
  return category;
}

export async function getBySlug(
  ctx: QueryCtx,
  { slug }: { slug: string }
): Promise<Doc<"courseCategories"> | null> {
  return ctx.db
    .query("courseCategories")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

export async function listWithLimit(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"courseCategories">[]> {
  return ctx.db
    .query("courseCategories")
    .order("asc")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

export async function listActive(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"courseCategories">[]> {
  return ctx.db
    .query("courseCategories")
    .withIndex("by_active", (q) => q.eq("active", true))
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

export async function listByParent(
  ctx: QueryCtx,
  { parentId }: { parentId?: Id<"courseCategories"> }
): Promise<Doc<"courseCategories">[]> {
  return ctx.db
    .query("courseCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", parentId))
    .collect();
}

export async function countWithLimit(
  ctx: QueryCtx,
  { limit = 1000 }: { limit?: number } = {}
): Promise<{ count: number; hasMore: boolean }> {
  const items = await ctx.db.query("courseCategories").take(limit + 1);
  return {
    count: Math.min(items.length, limit),
    hasMore: items.length > limit,
  };
}

export async function getNextOrder(ctx: QueryCtx): Promise<number> {
  const lastCategory = await ctx.db.query("courseCategories").order("desc").first();
  return lastCategory ? lastCategory.order + 1 : 0;
}

export async function create(
  ctx: MutationCtx,
  args: {
    active?: boolean;
    description?: string;
    name: string;
    order?: number;
    parentId?: Id<"courseCategories">;
    slug: string;
    thumbnail?: string;
  }
): Promise<Id<"courseCategories">> {
  const resolvedSlug = await resolveUniqueSlug(ctx, {
    scope: "category",
    slug: args.slug,
  });

  const order = args.order ?? (await getNextOrder(ctx));

  return ctx.db.insert("courseCategories", {
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
    id: Id<"courseCategories">;
    name?: string;
    order?: number;
    parentId?: Id<"courseCategories">;
    slug?: string;
    thumbnail?: string;
  }
): Promise<void> {
  const category = await getByIdOrThrow(ctx, { id: args.id });

  if (args.slug && args.slug !== category.slug) {
    const resolvedSlug = await resolveUniqueSlug(ctx, {
      scope: "category",
      slug: args.slug,
      exclude: { id: args.id, table: "courseCategories" },
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
  { cascade, id }: { cascade?: boolean; id: Id<"courseCategories"> }
): Promise<void> {
  const category = await ctx.db.get(id);
  if (!category) {throw new Error("Course category not found");}

  const childPreview = await ctx.db
    .query("courseCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(1);
  if (childPreview.length > 0 && !cascade) {
    throw new Error("Danh mục có danh mục con. Vui lòng xác nhận xóa tất cả.");
  }

  const coursePreview = await ctx.db
    .query("courses")
    .withIndex("by_category_status", (q) => q.eq("categoryId", id))
    .take(1);
  if (coursePreview.length > 0 && !cascade) {
    throw new Error("Danh mục có khóa học liên quan. Vui lòng xác nhận xóa tất cả.");
  }

  if (cascade) {
    const queue: Doc<"courseCategories">[] = [category];
    const categoryIds: Id<"courseCategories">[] = [];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {continue;}
      categoryIds.push(current._id);
      const children = await ctx.db
        .query("courseCategories")
        .withIndex("by_parent", (q) => q.eq("parentId", current._id))
        .collect();
      queue.push(...children);
    }

    const coursesByCategory = await Promise.all(
      categoryIds.map((categoryId) => ctx.db
        .query("courses")
        .withIndex("by_category_status", (q) => q.eq("categoryId", categoryId))
        .collect())
    );
    const courseIds = coursesByCategory.flat().map((course) => course._id);
    const lessonsByCourse = await Promise.all(courseIds.map((courseId) =>
      ctx.db.query("courseLessons").withIndex("by_course", (q) => q.eq("courseId", courseId)).collect()
    ));
    const chaptersByCourse = await Promise.all(courseIds.map((courseId) =>
      ctx.db.query("courseChapters").withIndex("by_course", (q) => q.eq("courseId", courseId)).collect()
    ));
    await Promise.all(lessonsByCourse.flat().map((lesson) => ctx.db.delete(lesson._id)));
    await Promise.all(chaptersByCourse.flat().map((chapter) => ctx.db.delete(chapter._id)));
    await Promise.all(courseIds.map((courseId) => ctx.db.delete(courseId)));
    await Promise.all(categoryIds.map((categoryId) => ctx.db.delete(categoryId)));
    return;
  }

  await ctx.db.delete(id);
}

export async function getDeleteInfo(
  ctx: QueryCtx,
  { id }: { id: Id<"courseCategories"> }
): Promise<{ canDelete: boolean; dependencies: { count: number; hasMore: boolean; label: string; preview: { id: string; name: string }[] }[] }> {
  const childrenPreview = await ctx.db
    .query("courseCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(10);
  const childrenCount = await ctx.db
    .query("courseCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(1001);
  const coursesPreview = await ctx.db
    .query("courses")
    .withIndex("by_category_status", (q) => q.eq("categoryId", id))
    .take(10);
  const coursesCount = await ctx.db
    .query("courses")
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
        count: Math.min(coursesCount.length, 1000),
        hasMore: coursesCount.length > 1000,
        label: "Khóa học",
        preview: coursesPreview.map((course) => ({ id: course._id, name: course.title })),
      },
    ],
  };
}

export async function reorder(
  ctx: MutationCtx,
  { items }: { items: { id: Id<"courseCategories">; order: number }[] }
): Promise<void> {
  for (const item of items) {
    await ctx.db.patch(item.id, { order: item.order });
  }
}
