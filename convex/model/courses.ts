import { resolveUniqueSlug } from "../lib/iaSlugs";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

const MAX_ITEMS_LIMIT = 100;

export async function getById(
  ctx: QueryCtx,
  { id }: { id: Id<"courses"> }
): Promise<Doc<"courses"> | null> {
  return ctx.db.get(id);
}

export async function getByIdOrThrow(
  ctx: QueryCtx,
  { id }: { id: Id<"courses"> }
): Promise<Doc<"courses">> {
  const course = await ctx.db.get(id);
  if (!course) {throw new Error("Course not found");}
  return course;
}

export async function getBySlug(
  ctx: QueryCtx,
  { slug }: { slug: string }
): Promise<Doc<"courses"> | null> {
  return ctx.db
    .query("courses")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

export async function listWithLimit(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"courses">[]> {
  return ctx.db
    .query("courses")
    .order("desc")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

export async function countWithLimit(
  ctx: QueryCtx,
  { status, limit = 1000 }: { status?: Doc<"courses">["status"]; limit?: number } = {}
): Promise<{ count: number; hasMore: boolean }> {
  const query = status
    ? ctx.db.query("courses").withIndex("by_status_publishedAt", (q) => q.eq("status", status))
    : ctx.db.query("courses");
  const items = await query.take(limit + 1);
  return {
    count: Math.min(items.length, limit),
    hasMore: items.length > limit,
  };
}

export async function getNextOrder(ctx: QueryCtx): Promise<number> {
  const lastCourse = await ctx.db.query("courses").order("desc").first();
  return lastCourse ? lastCourse.order + 1 : 0;
}

export async function recalculateCurriculumCounts(
  ctx: MutationCtx,
  courseId: Id<"courses">
): Promise<void> {
  const chapters = await ctx.db
    .query("courseChapters")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .take(1000);
  const lessons = await ctx.db
    .query("courseLessons")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .take(5000);
  await ctx.db.patch(courseId, {
    chapterCount: chapters.length,
    lessonCount: lessons.length,
  });
}

export async function create(
  ctx: MutationCtx,
  args: {
    categoryId: Id<"courseCategories">;
    comparePriceAmount?: number;
    content: string;
    durationSeconds?: number;
    durationText?: string;
    excerpt?: string;
    featured?: boolean;
    htmlRender?: string;
    instructorName?: string;
    introVideoType?: "none" | "youtube" | "drive" | "external";
    introVideoUrl?: string;
    isPriceVisible?: boolean;
    level?: "Beginner" | "Intermediate" | "Advanced";
    markdownRender?: string;
    metaDescription?: string;
    metaTitle?: string;
    order?: number;
    priceAmount?: number;
    priceNote?: string;
    pricingType: "free" | "paid" | "contact";
    renderType?: "content" | "markdown" | "html";
    slug: string;
    status?: Doc<"courses">["status"];
    thumbnail?: string;
    thumbnailStorageId?: Id<"_storage"> | null;
    title: string;
  }
): Promise<Id<"courses">> {
  const resolvedSlug = await resolveUniqueSlug(ctx, {
    scope: "record",
    slug: args.slug,
  });
  const order = args.order ?? (await getNextOrder(ctx));
  const status = args.status ?? "Draft";

  return ctx.db.insert("courses", {
    categoryId: args.categoryId,
    chapterCount: 0,
    comparePriceAmount: args.comparePriceAmount,
    content: args.content,
    durationSeconds: args.durationSeconds,
    durationText: args.durationText,
    excerpt: args.excerpt,
    featured: args.featured,
    htmlRender: args.htmlRender,
    instructorName: args.instructorName,
    introVideoType: args.introVideoType ?? "none",
    introVideoUrl: args.introVideoUrl,
    isPriceVisible: args.isPriceVisible ?? true,
    lessonCount: 0,
    level: args.level,
    markdownRender: args.markdownRender,
    metaDescription: args.metaDescription,
    metaTitle: args.metaTitle,
    order,
    priceAmount: args.priceAmount,
    priceNote: args.priceNote,
    pricingType: args.pricingType,
    publishedAt: status === "Published" ? Date.now() : undefined,
    renderType: args.renderType ?? "content",
    slug: resolvedSlug.slug,
    status,
    thumbnail: args.thumbnail,
    thumbnailStorageId: args.thumbnailStorageId ?? null,
    title: args.title,
    views: 0,
  });
}

export async function update(
  ctx: MutationCtx,
  args: {
    categoryId?: Id<"courseCategories">;
    comparePriceAmount?: number;
    content?: string;
    durationSeconds?: number;
    durationText?: string;
    excerpt?: string;
    featured?: boolean;
    htmlRender?: string;
    id: Id<"courses">;
    instructorName?: string;
    introVideoType?: "none" | "youtube" | "drive" | "external";
    introVideoUrl?: string;
    isPriceVisible?: boolean;
    level?: "Beginner" | "Intermediate" | "Advanced";
    markdownRender?: string;
    metaDescription?: string;
    metaTitle?: string;
    order?: number;
    priceAmount?: number;
    priceNote?: string;
    pricingType?: "free" | "paid" | "contact";
    renderType?: "content" | "markdown" | "html";
    slug?: string;
    status?: Doc<"courses">["status"];
    thumbnail?: string;
    thumbnailStorageId?: Id<"_storage"> | null;
    title?: string;
  }
): Promise<void> {
  const course = await getByIdOrThrow(ctx, { id: args.id });

  if (args.slug && args.slug !== course.slug) {
    const resolvedSlug = await resolveUniqueSlug(ctx, {
      scope: "record",
      slug: args.slug,
      exclude: { id: args.id, table: "courses" },
    });
    if (resolvedSlug.slug !== args.slug) {
      (args as { slug?: string }).slug = resolvedSlug.slug;
    }
  }

  const { id, ...updates } = args;
  const patchData: Record<string, unknown> = { ...updates };

  if (args.status === "Published" && course.status !== "Published") {
    patchData.publishedAt = Date.now();
  }

  await ctx.db.patch(id, patchData);
}

export async function remove(
  ctx: MutationCtx,
  { cascade, id }: { cascade?: boolean; id: Id<"courses"> }
): Promise<void> {
  await getByIdOrThrow(ctx, { id });
  const chapterPreview = await ctx.db
    .query("courseChapters")
    .withIndex("by_course", (q) => q.eq("courseId", id))
    .take(1);
  const lessonPreview = await ctx.db
    .query("courseLessons")
    .withIndex("by_course", (q) => q.eq("courseId", id))
    .take(1);

  if ((chapterPreview.length > 0 || lessonPreview.length > 0) && !cascade) {
    throw new Error("Khóa học có chương/bài học liên quan. Vui lòng xác nhận xóa tất cả.");
  }

  if (cascade) {
    const lessons = await ctx.db
      .query("courseLessons")
      .withIndex("by_course", (q) => q.eq("courseId", id))
      .collect();
    const chapters = await ctx.db
      .query("courseChapters")
      .withIndex("by_course", (q) => q.eq("courseId", id))
      .collect();
    const assignments = await ctx.db
      .query("courseCategoryAssignments")
      .withIndex("by_course", (q) => q.eq("courseId", id))
      .collect();
    await Promise.all(lessons.map((lesson) => ctx.db.delete(lesson._id)));
    await Promise.all(chapters.map((chapter) => ctx.db.delete(chapter._id)));
    await Promise.all(assignments.map((assignment) => ctx.db.delete(assignment._id)));
  }

  await ctx.db.delete(id);
}

export async function getDeleteInfo(
  ctx: QueryCtx,
  { id }: { id: Id<"courses"> }
): Promise<{ canDelete: boolean; dependencies: { count: number; hasMore: boolean; label: string; preview: { id: string; name: string }[] }[] }> {
  const chaptersPreview = await ctx.db
    .query("courseChapters")
    .withIndex("by_course", (q) => q.eq("courseId", id))
    .take(10);
  const lessonsPreview = await ctx.db
    .query("courseLessons")
    .withIndex("by_course", (q) => q.eq("courseId", id))
    .take(10);
  const chaptersCount = await ctx.db
    .query("courseChapters")
    .withIndex("by_course", (q) => q.eq("courseId", id))
    .take(1001);
  const lessonsCount = await ctx.db
    .query("courseLessons")
    .withIndex("by_course", (q) => q.eq("courseId", id))
    .take(1001);

  return {
    canDelete: true,
    dependencies: [
      {
        count: Math.min(chaptersCount.length, 1000),
        hasMore: chaptersCount.length > 1000,
        label: "Chương học",
        preview: chaptersPreview.map((chapter) => ({ id: chapter._id, name: chapter.title })),
      },
      {
        count: Math.min(lessonsCount.length, 1000),
        hasMore: lessonsCount.length > 1000,
        label: "Bài học",
        preview: lessonsPreview.map((lesson) => ({ id: lesson._id, name: lesson.title })),
      },
    ],
  };
}

export async function incrementViews(
  ctx: MutationCtx,
  { id }: { id: Id<"courses"> }
): Promise<void> {
  const course = await getByIdOrThrow(ctx, { id });
  await ctx.db.patch(id, { views: course.views + 1 });
}
