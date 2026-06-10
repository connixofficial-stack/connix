import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { contentStatus } from "./lib/validators";
import { rankByFuzzyMatches } from "./lib/search";
import * as CoursesModel from "./model/courses";
import type { Doc, Id } from "./_generated/dataModel";
import {
  isBrokenStorageBackedUrl,
  removeOwnerFilesAndCleanup,
  syncOwnerFilesAndCleanup,
} from "./lib/fileService";
import {
  isMultiCategoryEnabled,
  listCourseAdditionalCategoryIds,
  mergeCoursesByCategoryAssignments,
  syncCourseCategoryAssignments,
} from "./lib/multiCategory";
import { syncCourseFilterAssignments } from "./courseFilters";
import {
  customerHasCourseOrderAccess,
  ensureCourseStudentForCustomerCourse,
  getActiveLessonCount,
  getCourseStudent,
  getFirstActiveLesson,
  getProgressPercent,
  orderCanUnlockCourse,
  recalculateCourseStudentProgress,
  resolveCustomerIdByToken,
} from "./lib/courseEnrollment";

const videoType = v.union(
  v.literal("none"),
  v.literal("youtube"),
  v.literal("drive"),
  v.literal("external")
);

const courseLevel = v.union(
  v.literal("Beginner"),
  v.literal("Intermediate"),
  v.literal("Advanced")
);

const pricingType = v.union(
  v.literal("free"),
  v.literal("paid"),
  v.literal("contact")
);

const renderType = v.union(
  v.literal("content"),
  v.literal("markdown"),
  v.literal("html")
);

const courseDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("courses"),
  categoryId: v.id("courseCategories"),
  chapterCount: v.number(),
  comparePriceAmount: v.optional(v.number()),
  content: v.string(),
  durationSeconds: v.optional(v.number()),
  durationText: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  featured: v.optional(v.boolean()),
  htmlRender: v.optional(v.string()),
  instructorName: v.optional(v.string()),
  introVideoType: v.optional(videoType),
  introVideoUrl: v.optional(v.string()),
  isPriceVisible: v.optional(v.boolean()),
  lessonCount: v.number(),
  level: v.optional(courseLevel),
  markdownRender: v.optional(v.string()),
  metaDescription: v.optional(v.string()),
  metaTitle: v.optional(v.string()),
  order: v.number(),
  priceAmount: v.optional(v.number()),
  priceNote: v.optional(v.string()),
  pricingType,
  publishedAt: v.optional(v.number()),
  renderType: v.optional(renderType),
  slug: v.string(),
  status: contentStatus,
  thumbnail: v.optional(v.string()),
  thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  title: v.string(),
  views: v.number(),
});

const chapterDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("courseChapters"),
  active: v.boolean(),
  courseId: v.id("courses"),
  createdAt: v.number(),
  order: v.number(),
  summary: v.optional(v.string()),
  title: v.string(),
  updatedAt: v.number(),
});

const lessonDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("courseLessons"),
  active: v.boolean(),
  chapterId: v.id("courseChapters"),
  courseId: v.id("courses"),
  createdAt: v.number(),
  description: v.optional(v.string()),
  durationSeconds: v.optional(v.number()),
  exerciseLink: v.optional(v.string()),
  isPreview: v.boolean(),
  order: v.number(),
  title: v.string(),
  updatedAt: v.number(),
  videoType,
  videoUrl: v.optional(v.string()),
});

const courseAccessDoc = v.object({
  courseSlug: v.optional(v.string()),
  firstLessonId: v.optional(v.id("courseLessons")),
  firstLessonTitle: v.optional(v.string()),
  hasAccess: v.boolean(),
  reason: v.string(),
});

const courseLearningLinkDoc = v.object({
  courseId: v.id("courses"),
  courseSlug: v.string(),
  courseTitle: v.string(),
  firstLessonId: v.optional(v.id("courseLessons")),
  firstLessonTitle: v.optional(v.string()),
});

const courseProgressDoc = v.object({
  certificateCode: v.optional(v.string()),
  certificateIssuedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  completedLessonIds: v.array(v.id("courseLessons")),
  completedLessonsCount: v.number(),
  courseId: v.id("courses"),
  enrolledAt: v.optional(v.number()),
  hasAccess: v.boolean(),
  isEnrolled: v.boolean(),
  lastActivityAt: v.optional(v.number()),
  lastLessonId: v.optional(v.id("courseLessons")),
  lessonCount: v.number(),
  progressPercent: v.number(),
  reason: v.string(),
});

const courseProgressSummaryDoc = v.object({
  certificateCode: v.optional(v.string()),
  completedAt: v.optional(v.number()),
  completedLessonsCount: v.number(),
  courseId: v.id("courses"),
  hasAccess: v.boolean(),
  isEnrolled: v.boolean(),
  lessonCount: v.number(),
  progressPercent: v.number(),
});

const courseStudentAdminDoc = v.object({
  certificateCode: v.optional(v.string()),
  completedAt: v.optional(v.number()),
  completedLessonsCount: v.number(),
  courseId: v.id("courses"),
  courseTitle: v.string(),
  customerEmail: v.string(),
  customerId: v.id("customers"),
  customerName: v.string(),
  customerPhone: v.string(),
  enrolledAt: v.number(),
  lastActivityAt: v.optional(v.number()),
  lastLessonTitle: v.optional(v.string()),
  lessonCount: v.number(),
  progressPercent: v.number(),
  status: v.union(v.literal("active"), v.literal("revoked")),
  studentId: v.id("courseStudents"),
});

const paginatedCourses = v.object({
  continueCursor: v.string(),
  isDone: v.boolean(),
  page: v.array(courseDoc),
  pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  splitCursor: v.optional(v.union(v.string(), v.null())),
});

function sanitizeLockedLesson(lesson: Doc<"courseLessons">) {
  const safeLesson: Partial<Doc<"courseLessons">> = { ...lesson };
  delete safeLesson.exerciseLink;
  delete safeLesson.videoUrl;
  return safeLesson as Doc<"courseLessons">;
}

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db.query("courses").paginate(args.paginationOpts),
  returns: paginatedCourses,
});

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => CoursesModel.listWithLimit(ctx, { limit: args.limit }),
  returns: v.array(courseDoc),
});

export const listAdminWithOffset = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 20, 500);
    let courses: Doc<"courses">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      courses = await searchQuery.take(fetchLimit);
    } else if (args.status) {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else {
      courses = await ctx.db
        .query("courses")
        .take(500);
      courses.sort((a, b) => a.order - b.order);
    }

    if (args.search?.trim() && courses.length > 0) {
      const searchLower = args.search.toLowerCase().trim();
      courses = courses.filter((course) => course.title.toLowerCase().includes(searchLower));
    }

    return courses.slice(offset, offset + limit);
  },
  returns: v.array(courseDoc),
});

export const countAdmin = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    let courses: Doc<"courses">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      courses = await searchQuery.take(limit + 1);
    } else if (args.status) {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      courses = await ctx.db.query("courses").take(limit + 1);
    }

    return { count: Math.min(courses.length, limit), hasMore: courses.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    let courses: Doc<"courses">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      courses = await searchQuery.take(limit + 1);
    } else if (args.status) {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      courses = await ctx.db.query("courses").take(limit + 1);
    }

    const hasMore = courses.length > limit;
    return { ids: courses.slice(0, limit).map((course) => course._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("courses")), hasMore: v.boolean() }),
});

export const count = query({
  args: { status: v.optional(contentStatus) },
  handler: async (ctx, args) => CoursesModel.countWithLimit(ctx, { status: args.status }),
  returns: v.object({
    count: v.number(),
    hasMore: v.boolean(),
  }),
});

export const getById = query({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(courseDoc, v.null()),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => ctx.db
    .query("courses")
    .withIndex("by_slug", (q) => q.eq("slug", args.slug))
    .unique(),
  returns: v.union(courseDoc, v.null()),
});

export const getAdditionalCategoryIds = query({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    if (!course) {
      return [];
    }
    return listCourseAdditionalCategoryIds(ctx, args.id, course.categoryId);
  },
  returns: v.array(v.id("courseCategories")),
});

export const listByCategory = query({
  args: {
    categoryId: v.id("courseCategories"),
    paginationOpts: paginationOptsValidator,
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return ctx.db
        .query("courses")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId).eq("status", args.status!)
        )
        .paginate(args.paginationOpts);
    }
    return ctx.db
      .query("courses")
      .withIndex("by_category_status", (q) => q.eq("categoryId", args.categoryId))
      .paginate(args.paginationOpts);
  },
  returns: paginatedCourses,
});

export const listPublished = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
    .query("courses")
    .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
    .order("desc")
    .paginate(args.paginationOpts),
  returns: paginatedCourses,
});

export const listFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 6, 20);
    return ctx.db
      .query("courses")
      .withIndex("by_status_featured", (q) => q.eq("status", "Published").eq("featured", true))
      .order("desc")
      .take(limit);
  },
  returns: v.array(courseDoc),
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5, 20);
    return ctx.db
      .query("courses")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order("desc")
      .take(limit);
  },
  returns: v.array(courseDoc),
});

export const listPublishedPaginated = query({
  args: {
    categoryId: v.optional(v.id("courseCategories")),
    paginationOpts: paginationOptsValidator,
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
    )),
  },
  handler: async (ctx, args) => {
    const sortBy = args.sortBy ?? "newest";

    if (args.categoryId) {
      const result = await ctx.db
        .query("courses")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .order(sortBy === "oldest" ? "asc" : "desc")
        .paginate(args.paginationOpts);
      const page = await isMultiCategoryEnabled(ctx, "courses")
        ? await mergeCoursesByCategoryAssignments(ctx, args.categoryId, result.page, args.paginationOpts.numItems)
        : result.page;
      return { ...result, page: page.filter((course) => course.status === "Published") };
    }

    if (sortBy === "popular") {
      return ctx.db
        .query("courses")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return ctx.db
      .query("courses")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order(sortBy === "oldest" ? "asc" : "desc")
      .paginate(args.paginationOpts);
  },
  returns: paginatedCourses,
});

export const listPublishedWithOffset = query({
  args: {
    categoryId: v.optional(v.id("courseCategories")),
    level: v.optional(courseLevel),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    valueId: v.optional(v.id("courseFilterValues")),
    valueIds: v.optional(v.array(v.id("courseFilterValues"))),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title"),
      v.literal("title_desc"),
      v.literal("price_asc"),
      v.literal("price_desc")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 12, 50);
    const offset = args.offset ?? 0;
    const sortBy = args.sortBy ?? "newest";
    const fetchLimit = offset + limit + 10;
    let courses: Doc<"courses">[] = [];

    const filterCourseIdsSet = new Set<string>();
    let hasFilter = false;

    if (args.valueIds && args.valueIds.length > 0) {
      hasFilter = true;
      const allAssignments = await Promise.all(
        args.valueIds.map((valId) =>
          ctx.db
            .query("courseFilterAssignments")
            .withIndex("by_value", (q) => q.eq("valueId", valId))
            .collect()
        )
      );
      allAssignments.flat().forEach((a) => filterCourseIdsSet.add(a.courseId));
    } else if (args.valueId) {
      hasFilter = true;
      const filterAssignments = await ctx.db
        .query("courseFilterAssignments")
        .withIndex("by_value", (q) => q.eq("valueId", args.valueId!))
        .collect();
      filterAssignments.forEach((a) => filterCourseIdsSet.add(a.courseId));
    }

    if (hasFilter && !args.search?.trim() && !args.categoryId && !args.level) {
      // Optimisation: if only filtering by software, get directly from assignments
      const courseDocs = await Promise.all(
        Array.from(filterCourseIdsSet).map((courseId) => ctx.db.get(courseId as Id<"courses">))
      );
      courses = courseDocs.filter((c): c is Doc<"courses"> => c !== null && c.status === "Published");
    } else if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower).eq("status", "Published");
          return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
        });
      courses = await searchQuery.take(fetchLimit);
      if (args.level) {
        courses = courses.filter((course) => course.level === args.level);
      }
      if (hasFilter) {
        courses = courses.filter((course) => filterCourseIdsSet.has(course._id));
      }
    } else if (args.categoryId) {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(fetchLimit);
      if (await isMultiCategoryEnabled(ctx, "courses")) {
        courses = await mergeCoursesByCategoryAssignments(ctx, args.categoryId, courses, fetchLimit);
        courses = courses.filter((course) => course.status === "Published");
      }
      if (args.level) {
        courses = courses.filter((course) => course.level === args.level);
      }
      if (hasFilter) {
        courses = courses.filter((course) => filterCourseIdsSet.has(course._id));
      }
    } else if (args.level) {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_level", (q) => q.eq("status", "Published").eq("level", args.level))
        .take(fetchLimit);
      if (hasFilter) {
        courses = courses.filter((course) => filterCourseIdsSet.has(course._id));
      }
    } else if (sortBy === "popular") {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .take(fetchLimit);
      if (hasFilter) {
        courses = courses.filter((course) => filterCourseIdsSet.has(course._id));
      }
    } else {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order(sortBy === "oldest" ? "asc" : "desc")
        .take(fetchLimit);
      if (hasFilter) {
        courses = courses.filter((course) => filterCourseIdsSet.has(course._id));
      }
    }

    if (args.search?.trim() && courses.length > 0) {
      const ranked = rankByFuzzyMatches(
        courses,
        args.search,
        (course) => [course.title ?? "", course.excerpt ?? ""],
        42,
      );
      courses = ranked.map((entry) => entry.item);
    }

    if (!args.search?.trim()) {
      switch (sortBy) {
        case "oldest":
          courses.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
          break;
        case "popular":
          courses.sort((a, b) => b.views - a.views);
          break;
        case "title":
          courses.sort((a, b) => a.title.localeCompare(b.title, "vi"));
          break;
        case "title_desc":
          courses.sort((a, b) => b.title.localeCompare(a.title, "vi"));
          break;
        case "price_asc":
          courses.sort((a, b) => (a.priceAmount ?? 0) - (b.priceAmount ?? 0));
          break;
        case "price_desc":
          courses.sort((a, b) => (b.priceAmount ?? 0) - (a.priceAmount ?? 0));
          break;
        default:
          courses.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
      }
    }

    return courses.slice(offset, offset + limit);
  },
  returns: v.array(courseDoc),
});

export const searchPublished = query({
  args: {
    categoryId: v.optional(v.id("courseCategories")),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title"),
      v.literal("title_desc"),
      v.literal("price_asc"),
      v.literal("price_desc")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const sortBy = args.sortBy ?? "newest";
    let courses: Doc<"courses">[] = [];

    if (args.categoryId) {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(limit * 2);
      if (await isMultiCategoryEnabled(ctx, "courses")) {
        courses = await mergeCoursesByCategoryAssignments(ctx, args.categoryId, courses, limit * 2);
        courses = courses.filter((course) => course.status === "Published");
      }
    } else if (sortBy === "popular") {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .take(limit * 2);
    } else {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order(sortBy === "oldest" ? "asc" : "desc")
        .take(limit * 2);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      courses = courses.filter((course) =>
        course.title.toLowerCase().includes(searchLower) ||
        (course.excerpt?.toLowerCase().includes(searchLower))
      );
    }

    if (args.categoryId || !["newest", "oldest", "popular"].includes(sortBy)) {
      switch (sortBy) {
        case "oldest":
          courses.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
          break;
        case "popular":
          courses.sort((a, b) => b.views - a.views);
          break;
        case "title":
          courses.sort((a, b) => a.title.localeCompare(b.title, "vi"));
          break;
        case "title_desc":
          courses.sort((a, b) => b.title.localeCompare(a.title, "vi"));
          break;
        case "price_asc":
          courses.sort((a, b) => (a.priceAmount ?? 0) - (b.priceAmount ?? 0));
          break;
        case "price_desc":
          courses.sort((a, b) => (b.priceAmount ?? 0) - (a.priceAmount ?? 0));
          break;
        default:
          courses.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
      }
    }

    return courses.slice(0, limit);
  },
  returns: v.array(courseDoc),
});

export const countPublished = query({
  args: {
    categoryId: v.optional(v.id("courseCategories")),
    level: v.optional(courseLevel),
    search: v.optional(v.string()),
    valueId: v.optional(v.id("courseFilterValues")),
    valueIds: v.optional(v.array(v.id("courseFilterValues"))),
  },
  handler: async (ctx, args) => {
    const filterCourseIdsSet = new Set<string>();
    let hasFilter = false;

    if (args.valueIds && args.valueIds.length > 0) {
      hasFilter = true;
      const allAssignments = await Promise.all(
        args.valueIds.map((valId) =>
          ctx.db
            .query("courseFilterAssignments")
            .withIndex("by_value", (q) => q.eq("valueId", valId))
            .collect()
        )
      );
      allAssignments.flat().forEach((a) => filterCourseIdsSet.add(a.courseId));
    } else if (args.valueId) {
      hasFilter = true;
      const filterAssignments = await ctx.db
        .query("courseFilterAssignments")
        .withIndex("by_value", (q) => q.eq("valueId", args.valueId!))
        .collect();
      filterAssignments.forEach((a) => filterCourseIdsSet.add(a.courseId));
    }

    if (hasFilter && !args.search?.trim() && !args.categoryId && !args.level) {
      const courseDocs = await Promise.all(
        Array.from(filterCourseIdsSet).map((courseId) => ctx.db.get(courseId as Id<"courses">))
      );
      return courseDocs.filter((c) => c !== null && c.status === "Published").length;
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower).eq("status", "Published");
          return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
        });
      let courses = await searchQuery.take(1000);
      const ranked = rankByFuzzyMatches(
        courses,
        args.search,
        (course) => [course.title ?? "", course.excerpt ?? ""],
        42,
      );
      let items = ranked.map((entry) => entry.item);
      if (args.level) {
        items = items.filter((item) => item.level === args.level);
      }
      if (hasFilter) {
        items = items.filter((item) => filterCourseIdsSet.has(item._id));
      }
      return items.length;
    }

    if (args.categoryId) {
      const courses = await ctx.db
        .query("courses")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(1000);
      let mergedCourses = await isMultiCategoryEnabled(ctx, "courses")
        ? await mergeCoursesByCategoryAssignments(ctx, args.categoryId, courses, 1000)
        : courses;
      if (args.level) {
        mergedCourses = mergedCourses.filter((course) => course.level === args.level);
      }
      if (hasFilter) {
        mergedCourses = mergedCourses.filter((course) => filterCourseIdsSet.has(course._id));
      }
      return mergedCourses.filter((course) => course.status === "Published").length;
    }

    if (args.level) {
      let courses = await ctx.db
        .query("courses")
        .withIndex("by_status_level", (q) => q.eq("status", "Published").eq("level", args.level))
        .take(1000);
      if (hasFilter) {
        courses = courses.filter((course) => filterCourseIdsSet.has(course._id));
      }
      return courses.length;
    }

    let courses = await ctx.db
      .query("courses")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .take(1000);
    if (hasFilter) {
      courses = courses.filter((course) => filterCourseIdsSet.has(course._id));
    }
    return courses.length;
  },
  returns: v.number(),
});

export const create = mutation({
  args: {
    additionalCategoryIds: v.optional(v.array(v.id("courseCategories"))),
    categoryId: v.id("courseCategories"),
    comparePriceAmount: v.optional(v.number()),
    content: v.string(),
    durationSeconds: v.optional(v.number()),
    durationText: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    htmlRender: v.optional(v.string()),
    instructorName: v.optional(v.string()),
    introVideoType: v.optional(videoType),
    introVideoUrl: v.optional(v.string()),
    isPriceVisible: v.optional(v.boolean()),
    level: v.optional(courseLevel),
    markdownRender: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    order: v.optional(v.number()),
    priceAmount: v.optional(v.number()),
    priceNote: v.optional(v.string()),
    pricingType,
    renderType: v.optional(renderType),
    slug: v.string(),
    status: v.optional(contentStatus),
    thumbnail: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    title: v.string(),
    valueIds: v.optional(v.array(v.id("courseFilterValues"))),
  },
  handler: async (ctx, args) => {
    const modelArgs = { ...args };
    delete (modelArgs as { valueIds?: unknown }).valueIds;
    delete (modelArgs as { filterIds?: unknown }).filterIds;
    
    const id = await CoursesModel.create(ctx, modelArgs);
    if (await isMultiCategoryEnabled(ctx, "courses")) {
      await syncCourseCategoryAssignments(ctx, id, args.categoryId, args.additionalCategoryIds);
    }
    await syncCourseFilterAssignments(ctx, id, args.valueIds);

    if (args.thumbnailStorageId) {
      await syncOwnerFilesAndCleanup(ctx, {
        ownerField: "thumbnail",
        ownerId: id,
        ownerTable: "courses",
        purpose: "course-thumbnail",
      }, [args.thumbnailStorageId]);
    }
    return id;
  },
  returns: v.id("courses"),
});

export const update = mutation({
  args: {
    additionalCategoryIds: v.optional(v.array(v.id("courseCategories"))),
    categoryId: v.optional(v.id("courseCategories")),
    comparePriceAmount: v.optional(v.number()),
    content: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    durationText: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    htmlRender: v.optional(v.string()),
    id: v.id("courses"),
    instructorName: v.optional(v.string()),
    introVideoType: v.optional(videoType),
    introVideoUrl: v.optional(v.string()),
    isPriceVisible: v.optional(v.boolean()),
    level: v.optional(courseLevel),
    markdownRender: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    order: v.optional(v.number()),
    priceAmount: v.optional(v.number()),
    priceNote: v.optional(v.string()),
    pricingType: v.optional(pricingType),
    renderType: v.optional(renderType),
    slug: v.optional(v.string()),
    status: v.optional(contentStatus),
    thumbnail: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    title: v.optional(v.string()),
    valueIds: v.optional(v.array(v.id("courseFilterValues"))),
  },
  handler: async (ctx, args) => {
    const previous = await ctx.db.get(args.id);
    const nextArgs = { ...args };
    if (
      Object.prototype.hasOwnProperty.call(args, "thumbnailStorageId")
      && args.thumbnailStorageId === null
      && !Object.prototype.hasOwnProperty.call(args, "thumbnail")
    ) {
      nextArgs.thumbnail = "";
    }
    const modelArgs = { ...nextArgs };
    delete (modelArgs as { additionalCategoryIds?: unknown }).additionalCategoryIds;
    delete (modelArgs as { valueIds?: unknown }).valueIds;
    delete (modelArgs as { filterIds?: unknown }).filterIds;

    await CoursesModel.update(ctx, modelArgs);
    if (previous && await isMultiCategoryEnabled(ctx, "courses")) {
      await syncCourseCategoryAssignments(ctx, args.id, args.categoryId ?? previous.categoryId, args.additionalCategoryIds);
    }
    if (args.valueIds !== undefined) {
      await syncCourseFilterAssignments(ctx, args.id, args.valueIds);
    }

    const shouldCheckStorage = Object.prototype.hasOwnProperty.call(args, "thumbnailStorageId");
    if (shouldCheckStorage && previous) {
      const nextThumbnailStorageId = Object.prototype.hasOwnProperty.call(args, "thumbnailStorageId")
        ? args.thumbnailStorageId ?? null
        : previous.thumbnailStorageId ?? null;
      await syncOwnerFilesAndCleanup(ctx, {
        ownerField: "thumbnail",
        ownerId: args.id,
        ownerTable: "courses",
        purpose: "course-thumbnail",
      }, [nextThumbnailStorageId], {
        previousStorageIds: [previous.thumbnailStorageId],
      });
    }
    return null;
  },
  returns: v.null(),
});

export const bulkClearBrokenMedia = mutation({
  args: { ids: v.array(v.id("courses")) },
  handler: async (ctx, args) => {
    let checked = 0;
    let updated = 0;
    let cleared = 0;
    let skipped = 0;

    for (const id of args.ids) {
      const course = await ctx.db.get(id);
      if (!course) {
        skipped += 1;
        continue;
      }
      checked += 1;
      if (await isBrokenStorageBackedUrl(ctx, course.thumbnail, course.thumbnailStorageId)) {
        await ctx.db.patch(id, { thumbnail: "", thumbnailStorageId: null });
        await syncOwnerFilesAndCleanup(ctx, {
          ownerField: "thumbnail",
          ownerId: id,
          ownerTable: "courses",
          purpose: "course-thumbnail",
        }, [], {
          previousStorageIds: [course.thumbnailStorageId],
        });
        updated += 1;
        cleared += 1;
      }
    }

    return { checked, cleared, skipped, updated };
  },
  returns: v.object({
    checked: v.number(),
    cleared: v.number(),
    skipped: v.number(),
    updated: v.number(),
  }),
});

export const incrementViews = mutation({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    await CoursesModel.incrementViews(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    await CoursesModel.remove(ctx, args);
    await removeOwnerFilesAndCleanup(ctx, {
      ownerId: args.id,
      ownerTable: "courses",
    }, {
      previousStorageIds: [course?.thumbnailStorageId],
    });
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => CoursesModel.getDeleteInfo(ctx, args),
  returns: v.object({
    canDelete: v.boolean(),
    dependencies: v.array(v.object({
      count: v.number(),
      hasMore: v.boolean(),
      label: v.string(),
      preview: v.array(v.object({ id: v.string(), name: v.string() })),
    })),
  }),
});

async function recalculateCourseCounts(ctx: MutationCtx, courseId: Doc<"courses">["_id"]) {
  await CoursesModel.recalculateCurriculumCounts(ctx, courseId);
}

export const listChapters = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => ctx.db
    .query("courseChapters")
    .withIndex("by_course_order", (q) => q.eq("courseId", args.courseId))
    .take(500),
  returns: v.array(chapterDoc),
});

export const listLessonsByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => ctx.db
    .query("courseLessons")
    .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
    .take(500),
  returns: v.array(lessonDoc),
});

export const listPublicLessonsByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("courseLessons")
      .withIndex("by_course_active_order", (q) => q.eq("courseId", args.courseId).eq("active", true))
      .take(500);
    return lessons.map(sanitizeLockedLesson);
  },
  returns: v.array(lessonDoc),
});

export const listLessonsByChapter = query({
  args: { chapterId: v.id("courseChapters") },
  handler: async (ctx, args) => ctx.db
    .query("courseLessons")
    .withIndex("by_chapter_order", (q) => q.eq("chapterId", args.chapterId))
    .take(500),
  returns: v.array(lessonDoc),
});

export const getCourseAccess = query({
  args: {
    courseId: v.id("courses"),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course || course.status !== "Published") {
      return { hasAccess: false, reason: "course_not_found" };
    }

    const customerId = await resolveCustomerIdByToken(ctx, args.token);
    if (!customerId) {
      return { courseSlug: course.slug, hasAccess: false, reason: "login_required" };
    }

    const student = await getCourseStudent(ctx, customerId, course._id);
    const hasAccess = course.pricingType === "free" ||
      student?.status === "active" ||
      await customerHasCourseOrderAccess(ctx, customerId, course._id);
    if (!hasAccess) {
      return { courseSlug: course.slug, hasAccess: false, reason: "not_enrolled" };
    }

    const firstLesson = await getFirstActiveLesson(ctx, course._id);
    return {
      courseSlug: course.slug,
      firstLessonId: firstLesson?._id,
      firstLessonTitle: firstLesson?.title,
      hasAccess: true,
      reason: course.pricingType === "free" ? "free_course" : "purchased",
    };
  },
  returns: courseAccessDoc,
});

export const listMyCourseLearningLinks = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const customerId = await resolveCustomerIdByToken(ctx, args.token);
    if (!customerId) {
      return [];
    }

    const [orders, activeStudents] = await Promise.all([
      ctx.db
        .query("orders")
        .withIndex("by_customer", (q) => q.eq("customerId", customerId))
        .order("desc")
        .take(500),
      ctx.db
        .query("courseStudents")
        .withIndex("by_customerId_and_status", (q) => q.eq("customerId", customerId).eq("status", "active"))
        .take(500),
    ]);

    const accessibleCourseIds = new Set<Doc<"courses">["_id"]>();
    for (const student of activeStudents) {
      accessibleCourseIds.add(student.courseId);
    }
    for (const order of orders) {
      if (!orderCanUnlockCourse(order)) {
        continue;
      }
      for (const item of order.items) {
        if ((item.itemType ?? "product") === "course" && item.courseId) {
          accessibleCourseIds.add(item.courseId);
        }
      }
    }

    const courseIds = Array.from(accessibleCourseIds).slice(0, 100);
    const courses = await Promise.all(courseIds.map((courseId) => ctx.db.get(courseId)));
    const firstLessons = await Promise.all(courses.map((course) =>
      course && course.status === "Published"
        ? getFirstActiveLesson(ctx, course._id)
        : Promise.resolve(null)
    ));

    return courses.flatMap((course, index) => {
      if (!course || course.status !== "Published") {
        return [];
      }
      const firstLesson = firstLessons[index];
      return [{
        courseId: course._id,
        courseSlug: course.slug,
        courseTitle: course.title,
        firstLessonId: firstLesson?._id,
        firstLessonTitle: firstLesson?.title,
      }];
    });
  },
  returns: v.array(courseLearningLinkDoc),
});

export const getCourseProgress = query({
  args: {
    courseId: v.id("courses"),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    const customerId = await resolveCustomerIdByToken(ctx, args.token);
    if (!course || course.status !== "Published" || !customerId) {
      return {
        completedLessonIds: [],
        completedLessonsCount: 0,
        courseId: args.courseId,
        hasAccess: false,
        isEnrolled: false,
        lessonCount: course?.lessonCount ?? 0,
        progressPercent: 0,
        reason: !customerId ? "login_required" : "course_not_found",
      };
    }

    const [student, lessonCount] = await Promise.all([
      getCourseStudent(ctx, customerId, course._id),
      getActiveLessonCount(ctx, course._id),
    ]);
    const hasOrderAccess = student?.status === "active"
      ? true
      : await customerHasCourseOrderAccess(ctx, customerId, course._id);
    const hasAccess = course.pricingType === "free" || hasOrderAccess;
    const progressRows = student?.status === "active"
      ? await ctx.db
        .query("courseLessonProgress")
        .withIndex("by_courseId_and_customerId", (q) =>
          q.eq("courseId", course._id).eq("customerId", customerId)
        )
        .take(500)
      : [];
    const completedLessonsCount = progressRows.length || student?.completedLessonsCount || 0;

    return {
      certificateCode: student?.certificateCode,
      certificateIssuedAt: student?.certificateIssuedAt,
      completedAt: student?.completedAt,
      completedLessonIds: progressRows.map((row) => row.lessonId),
      completedLessonsCount,
      courseId: course._id,
      enrolledAt: student?.enrolledAt,
      hasAccess,
      isEnrolled: student?.status === "active",
      lastActivityAt: student?.lastActivityAt,
      lastLessonId: student?.lastLessonId,
      lessonCount,
      progressPercent: getProgressPercent(completedLessonsCount, lessonCount),
      reason: hasAccess ? (student?.status === "active" ? "enrolled" : "purchased") : "not_enrolled",
    };
  },
  returns: courseProgressDoc,
});

export const getCourseProgressSummaries = query({
  args: {
    courseIds: v.array(v.id("courses")),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const courseIds = Array.from(new Set(args.courseIds)).slice(0, 50);
    const customerId = await resolveCustomerIdByToken(ctx, args.token);
    const courses = await Promise.all(courseIds.map((courseId) => ctx.db.get(courseId)));
    const courseMap = new Map(courses.filter(Boolean).map((course) => [course!._id, course!]));

    if (!customerId) {
      return courseIds.map((courseId) => {
        const course = courseMap.get(courseId);
        const lessonCount = course?.lessonCount ?? 0;
        return {
          completedLessonsCount: 0,
          courseId,
          hasAccess: course?.pricingType === "free",
          isEnrolled: false,
          lessonCount,
          progressPercent: 0,
        };
      });
    }

    const [activeStudents, orders] = await Promise.all([
      ctx.db
        .query("courseStudents")
        .withIndex("by_customerId_and_status", (q) => q.eq("customerId", customerId).eq("status", "active"))
        .take(500),
      ctx.db
        .query("orders")
        .withIndex("by_customer", (q) => q.eq("customerId", customerId))
        .order("desc")
        .take(500),
    ]);
    const studentMap = new Map(activeStudents.map((student) => [student.courseId, student]));
    const purchasedCourseIds = new Set<Doc<"courses">["_id"]>();
    for (const order of orders) {
      if (!orderCanUnlockCourse(order)) {
        continue;
      }
      for (const item of order.items) {
        if ((item.itemType ?? "product") === "course" && item.courseId) {
          purchasedCourseIds.add(item.courseId);
        }
      }
    }

    return courseIds.map((courseId) => {
      const course = courseMap.get(courseId);
      const student = studentMap.get(courseId);
      const lessonCount = student?.lessonCountSnapshot || course?.lessonCount || 0;
      const completedLessonsCount = student?.completedLessonsCount ?? 0;
      const hasAccess = course?.pricingType === "free" || student?.status === "active" || purchasedCourseIds.has(courseId);
      return {
        certificateCode: student?.certificateCode,
        completedAt: student?.completedAt,
        completedLessonsCount,
        courseId,
        hasAccess,
        isEnrolled: student?.status === "active",
        lessonCount,
        progressPercent: getProgressPercent(completedLessonsCount, lessonCount),
      };
    });
  },
  returns: v.array(courseProgressSummaryDoc),
});

export const setLessonCompletion = mutation({
  args: {
    completed: v.boolean(),
    lessonId: v.id("courseLessons"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const customerId = await resolveCustomerIdByToken(ctx, args.token);
    if (!customerId) {
      throw new Error("Vui lòng đăng nhập để lưu tiến độ học.");
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson || !lesson.active) {
      throw new Error("Bài học không tồn tại hoặc đã bị tắt.");
    }
    const course = await ctx.db.get(lesson.courseId);
    if (!course || course.status !== "Published") {
      throw new Error("Khóa học không khả dụng.");
    }

    const existingStudent = await getCourseStudent(ctx, customerId, course._id);
    const hasAccess = course.pricingType === "free" ||
      existingStudent?.status === "active" ||
      await customerHasCourseOrderAccess(ctx, customerId, course._id);
    if (!hasAccess) {
      throw new Error("Bạn chưa có quyền học khóa này.");
    }

    const studentId = existingStudent?.status === "active"
      ? existingStudent._id
      : await ensureCourseStudentForCustomerCourse(ctx, customerId, course._id, {
        sourceType: course.pricingType === "free" ? "free" : "order",
      });

    const existingProgress = await ctx.db
      .query("courseLessonProgress")
      .withIndex("by_studentId_and_lessonId", (q) =>
        q.eq("studentId", studentId).eq("lessonId", lesson._id)
      )
      .unique();
    const now = Date.now();
    if (args.completed && !existingProgress) {
      await ctx.db.insert("courseLessonProgress", {
        completedAt: now,
        courseId: course._id,
        customerId,
        lessonId: lesson._id,
        studentId,
        updatedAt: now,
      });
    } else if (!args.completed && existingProgress) {
      await ctx.db.delete(existingProgress._id);
    }

    const updatedStudent = await recalculateCourseStudentProgress(ctx, studentId, lesson._id);
    const completedLessonsCount = updatedStudent?.completedLessonsCount ?? 0;
    const lessonCount = updatedStudent?.lessonCountSnapshot ?? await getActiveLessonCount(ctx, course._id);
    return {
      certificateCode: updatedStudent?.certificateCode,
      completedAt: updatedStudent?.completedAt,
      completedLessonsCount,
      lessonCount,
      progressPercent: getProgressPercent(completedLessonsCount, lessonCount),
    };
  },
  returns: v.object({
    certificateCode: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    completedLessonsCount: v.number(),
    lessonCount: v.number(),
    progressPercent: v.number(),
  }),
});

export const listCourseStudentsAdmin = query({
  args: {
    courseId: v.optional(v.id("courses")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("revoked"))),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = args.search?.trim() ? 2000 : (offset + limit + 1);

    let students: Doc<"courseStudents">[] = [];
    if (args.courseId && args.status) {
      students = await ctx.db
        .query("courseStudents")
        .withIndex("by_courseId_and_status", (q) => q.eq("courseId", args.courseId!).eq("status", args.status!))
        .take(fetchLimit);
    } else if (args.courseId) {
      students = await ctx.db
        .query("courseStudents")
        .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId!))
        .take(fetchLimit);
    } else if (args.status) {
      students = await ctx.db
        .query("courseStudents")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(fetchLimit);
    } else {
      students = await ctx.db.query("courseStudents").take(fetchLimit);
    }

    // Nếu có search, ta phải fetch customer của toàn bộ students để filter
    // Nếu không, ta chỉ fetch customer của những students thuộc trang hiện tại (page)
    const targetStudentsForCustomerFetch = args.search?.trim() ? students : students.slice(offset, offset + limit);

    const uniqueCustomerIds = Array.from(new Set(targetStudentsForCustomerFetch.map((s) => s.customerId)));
    const customers = await Promise.all(uniqueCustomerIds.map((id) => ctx.db.get(id)));
    const customerMap = new Map(customers.filter(Boolean).map((c) => [c!._id, c!]));

    // Lọc theo search
    let filteredStudents = students;
    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      filteredStudents = students.filter((student) => {
        const customer = customerMap.get(student.customerId);
        if (!customer) return false;
        return (
          customer.name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.phone.toLowerCase().includes(searchLower)
        );
      });
    }

    const totalCount = filteredStudents.length;
    const page = filteredStudents.slice(offset, offset + limit);

    // Lấy thông tin courses để tính toán stats
    const allUniqueCourseIds = Array.from(new Set(filteredStudents.map((s) => s.courseId)));
    const allCourses = await Promise.all(allUniqueCourseIds.map((id) => ctx.db.get(id)));
    const allCourseMap = new Map(allCourses.filter(Boolean).map((c) => [c!._id, c!]));

    // Tính toán stats trên toàn bộ học viên khớp bộ lọc (trước khi slice)
    const completedCount = filteredStudents.filter((s) => {
      const course = allCourseMap.get(s.courseId);
      const lessonCount = s.lessonCountSnapshot || course?.lessonCount || 0;
      return lessonCount > 0 && s.completedLessonsCount >= lessonCount;
    }).length;

    const averageProgress = filteredStudents.length
      ? Math.round(
          filteredStudents.reduce((sum, s) => {
            const course = allCourseMap.get(s.courseId);
            const lessonCount = s.lessonCountSnapshot || course?.lessonCount || 0;
            const progress = getProgressPercent(s.completedLessonsCount, lessonCount);
            return sum + progress;
          }, 0) / filteredStudents.length
        )
      : 0;

    const [courses, lessons] = await Promise.all([
      Promise.all(Array.from(new Set(page.map((student) => student.courseId))).map((id) => ctx.db.get(id))),
      Promise.all(Array.from(new Set(page.map((student) => student.lastLessonId).filter(Boolean))).map((id) => ctx.db.get(id!))),
    ]);
    const courseMap = new Map(courses.filter(Boolean).map((course) => [course!._id, course!]));
    const lessonMap = new Map(lessons.filter(Boolean).map((lesson) => [lesson!._id, lesson!]));

    return {
      hasMore: filteredStudents.length > offset + limit,
      totalCount,
      stats: {
        totalStudents: filteredStudents.length,
        completedCount,
        averageProgress,
      },
      items: page.map((student) => {
        const customer = customerMap.get(student.customerId);
        const course = courseMap.get(student.courseId);
        const lessonCount = student.lessonCountSnapshot || course?.lessonCount || 0;
        return {
          certificateCode: student.certificateCode,
          completedAt: student.completedAt,
          completedLessonsCount: student.completedLessonsCount,
          courseId: student.courseId,
          courseTitle: course?.title ?? "Khóa học đã xóa",
          customerEmail: customer?.email ?? "",
          customerId: student.customerId,
          customerName: customer?.name ?? "Khách hàng đã xóa",
          customerPhone: customer?.phone ?? "",
          enrolledAt: student.enrolledAt,
          lastActivityAt: student.lastActivityAt,
          lastLessonTitle: student.lastLessonId ? lessonMap.get(student.lastLessonId)?.title : undefined,
          lessonCount,
          progressPercent: getProgressPercent(student.completedLessonsCount, lessonCount),
          status: student.status,
          studentId: student._id,
        };
      }),
    };
  },
  returns: v.object({
    hasMore: v.boolean(),
    totalCount: v.number(),
    stats: v.object({
      totalStudents: v.number(),
      completedCount: v.number(),
      averageProgress: v.number(),
    }),
    items: v.array(courseStudentAdminDoc),
  }),
});

export const reorder = mutation({
  args: { items: v.array(v.object({ id: v.id("courses"), order: v.number() })) },
  handler: async (ctx, args) => {
    await Promise.all(args.items.map(async (item) => ctx.db.patch(item.id, { order: item.order })));
    return null;
  },
  returns: v.null(),
});

export const createChapter = mutation({
  args: {
    active: v.optional(v.boolean()),
    courseId: v.id("courses"),
    order: v.optional(v.number()),
    summary: v.optional(v.string()),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const order = args.order ?? (await ctx.db
      .query("courseChapters")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .take(1000)).length;
    const id = await ctx.db.insert("courseChapters", {
      active: args.active ?? true,
      courseId: args.courseId,
      createdAt: now,
      order,
      summary: args.summary,
      title: args.title,
      updatedAt: now,
    });
    await recalculateCourseCounts(ctx, args.courseId);
    return id;
  },
  returns: v.id("courseChapters"),
});

export const updateChapter = mutation({
  args: {
    active: v.optional(v.boolean()),
    id: v.id("courseChapters"),
    order: v.optional(v.number()),
    summary: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.id);
    if (!chapter) {throw new Error("Chapter not found");}
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return null;
  },
  returns: v.null(),
});

export const removeChapter = mutation({
  args: { id: v.id("courseChapters") },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.id);
    if (!chapter) {throw new Error("Chapter not found");}
    const lessons = await ctx.db
      .query("courseLessons")
      .withIndex("by_chapter_order", (q) => q.eq("chapterId", args.id))
      .take(500);
    await Promise.all(lessons.map((lesson) => ctx.db.delete(lesson._id)));
    await ctx.db.delete(args.id);
    await recalculateCourseCounts(ctx, chapter.courseId);
    return null;
  },
  returns: v.null(),
});

export const createLesson = mutation({
  args: {
    active: v.optional(v.boolean()),
    chapterId: v.id("courseChapters"),
    courseId: v.id("courses"),
    description: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    exerciseLink: v.optional(v.string()),
    isPreview: v.optional(v.boolean()),
    order: v.optional(v.number()),
    title: v.string(),
    videoType: v.optional(videoType),
    videoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter || chapter.courseId !== args.courseId) {
      throw new Error("Chapter does not belong to course");
    }
    const now = Date.now();
    const order = args.order ?? (await ctx.db
      .query("courseLessons")
      .withIndex("by_chapter_order", (q) => q.eq("chapterId", args.chapterId))
      .take(1000)).length;
    const id = await ctx.db.insert("courseLessons", {
      active: args.active ?? true,
      chapterId: args.chapterId,
      courseId: args.courseId,
      createdAt: now,
      description: args.description,
      durationSeconds: args.durationSeconds,
      exerciseLink: args.exerciseLink,
      isPreview: args.isPreview ?? false,
      order,
      title: args.title,
      updatedAt: now,
      videoType: args.videoType ?? "none",
      videoUrl: args.videoUrl,
    });
    await recalculateCourseCounts(ctx, args.courseId);
    return id;
  },
  returns: v.id("courseLessons"),
});

export const updateLesson = mutation({
  args: {
    active: v.optional(v.boolean()),
    description: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    exerciseLink: v.optional(v.string()),
    id: v.id("courseLessons"),
    isPreview: v.optional(v.boolean()),
    order: v.optional(v.number()),
    title: v.optional(v.string()),
    videoType: v.optional(videoType),
    videoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);
    if (!lesson) {throw new Error("Lesson not found");}
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return null;
  },
  returns: v.null(),
});

export const removeLesson = mutation({
  args: { id: v.id("courseLessons") },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);
    if (!lesson) {throw new Error("Lesson not found");}
    await ctx.db.delete(args.id);
    await recalculateCourseCounts(ctx, lesson.courseId);
    return null;
  },
  returns: v.null(),
});

export const reorderChapters = mutation({
  args: {
    orders: v.array(
      v.object({
        id: v.id("courseChapters"),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const item of args.orders) {
      await ctx.db.patch(item.id, {
        order: item.order,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
  returns: v.null(),
});

export const reorderLessons = mutation({
  args: {
    orders: v.array(
      v.object({
        id: v.id("courseLessons"),
        order: v.number(),
        chapterId: v.optional(v.id("courseChapters")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const courseIdsToRecalculate = new Set<string>();

    for (const item of args.orders) {
      const lesson = await ctx.db.get(item.id);
      if (!lesson) {continue;}

      const patchData: { order: number; chapterId?: typeof item.chapterId; updatedAt: number } = {
        order: item.order,
        updatedAt: Date.now(),
      };

      if (item.chapterId && item.chapterId !== lesson.chapterId) {
        patchData.chapterId = item.chapterId;
        courseIdsToRecalculate.add(lesson.courseId);
      }

      await ctx.db.patch(item.id, patchData);
    }

    for (const courseId of courseIdsToRecalculate) {
      await recalculateCourseCounts(ctx, courseId as any);
    }

    return null;
  },
  returns: v.null(),
});

export const getLessonById = query({
  args: {
    id: v.id("courseLessons"),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);
    if (!lesson) {
      return null;
    }

    const course = await ctx.db.get(lesson.courseId);
    if (!course || course.status !== "Published") {
      return sanitizeLockedLesson(lesson);
    }

    const customerId = await resolveCustomerIdByToken(ctx, args.token);
    const student = customerId ? await getCourseStudent(ctx, customerId, course._id) : null;
    const hasAccess = Boolean(customerId) && (
      course.pricingType === "free" ||
      lesson.isPreview ||
      student?.status === "active" ||
      await customerHasCourseOrderAccess(ctx, customerId!, course._id)
    );

    return hasAccess ? lesson : sanitizeLockedLesson(lesson);
  },
  returns: v.union(lessonDoc, v.null()),
});

export const getChapterById = query({
  args: { id: v.id("courseChapters") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(chapterDoc, v.null()),
});

export const getCertificateByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.code) {
      return null;
    }
    const student = await ctx.db
      .query("courseStudents")
      .withIndex("by_certificateCode", (q) => q.eq("certificateCode", args.code))
      .unique();

    if (!student || student.status !== "active" || !student.completedAt) {
      return null;
    }

    const [customer, course] = await Promise.all([
      ctx.db.get(student.customerId),
      ctx.db.get(student.courseId),
    ]);

    return {
      certificateCode: student.certificateCode || "",
      enrolledAt: student.enrolledAt,
      completedAt: student.completedAt,
      customerName: customer?.name || "Học viên",
      courseTitle: course?.title || "Khóa học",
      courseSlug: course?.slug || "",
    };
  },
  returns: v.union(
    v.object({
      certificateCode: v.string(),
      enrolledAt: v.number(),
      completedAt: v.number(),
      customerName: v.string(),
      courseTitle: v.string(),
      courseSlug: v.string(),
    }),
    v.null()
  ),
});

export const updateCourseStudentAdmin = mutation({
  args: {
    id: v.id("courseStudents"),
    status: v.union(v.literal("active"), v.literal("revoked")),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.id);
    if (!student) {
      throw new Error("Học viên không tồn tại");
    }
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return null;
  },
  returns: v.null(),
});

export const removeCourseStudentAdmin = mutation({
  args: { id: v.id("courseStudents") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.id);
    if (!student) {
      throw new Error("Học viên không tồn tại");
    }

    // Thu thập và xóa tất cả courseLessonProgress của học viên này
    const progresses = await ctx.db
      .query("courseLessonProgress")
      .withIndex("by_studentId_and_lessonId", (q) => q.eq("studentId", args.id))
      .collect();

    for (const p of progresses) {
      await ctx.db.delete(p._id);
    }

    // Xóa bản ghi học viên khóa học
    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

export const duplicate = mutation({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) {
      throw new Error("Course not found");
    }

    const buildCopiedName = (base: string, attempt: number) =>
      attempt <= 1 ? `${base} (copy)` : `${base} (copy ${attempt})`;
      
    let copiedTitle = "";
    for (let attempt = 1; attempt <= 100; attempt += 1) {
      const candidate = buildCopiedName(source.title, attempt);
      const existing = await ctx.db
        .query("courses")
        .filter((q) => q.eq(q.field("title"), candidate))
        .first();
      if (!existing) {
        copiedTitle = candidate;
        break;
      }
    }
    if (!copiedTitle) {
      copiedTitle = `${source.title} (copy ${Date.now()})`;
    }

    const additionalCategoryIds = await listCourseAdditionalCategoryIds(ctx, source._id, source.categoryId);
    const filterAssignments = await ctx.db
      .query("courseFilterAssignments")
      .withIndex("by_course", (q) => q.eq("courseId", source._id))
      .collect();
    const valueIds = filterAssignments.map((a) => a.valueId);

    const newCourseId = await CoursesModel.create(ctx, {
      categoryId: source.categoryId,
      comparePriceAmount: source.comparePriceAmount,
      content: source.content,
      durationSeconds: source.durationSeconds,
      durationText: source.durationText,
      excerpt: source.excerpt,
      featured: source.featured,
      htmlRender: source.htmlRender,
      instructorName: source.instructorName,
      introVideoType: source.introVideoType,
      introVideoUrl: source.introVideoUrl,
      isPriceVisible: source.isPriceVisible,
      level: source.level,
      markdownRender: source.markdownRender,
      metaDescription: source.metaDescription,
      metaTitle: source.metaTitle,
      order: await CoursesModel.getNextOrder(ctx),
      priceAmount: source.priceAmount,
      priceNote: source.priceNote,
      pricingType: source.pricingType,
      renderType: source.renderType,
      slug: source.slug,
      status: source.status,
      thumbnail: source.thumbnail,
      thumbnailStorageId: source.thumbnailStorageId,
      title: copiedTitle,
    });

    if (await isMultiCategoryEnabled(ctx, "courses")) {
      await syncCourseCategoryAssignments(ctx, newCourseId, source.categoryId, additionalCategoryIds);
    }
    await syncCourseFilterAssignments(ctx, newCourseId, valueIds);

    if (source.thumbnailStorageId) {
      await syncOwnerFilesAndCleanup(ctx, {
        ownerField: "thumbnail",
        ownerId: newCourseId,
        ownerTable: "courses",
        purpose: "course-thumbnail",
      }, [source.thumbnailStorageId]);
    }

    const chapters = await ctx.db
      .query("courseChapters")
      .withIndex("by_course", (q) => q.eq("courseId", source._id))
      .collect();
    
    for (const chapter of chapters) {
      const newChapterId = await ctx.db.insert("courseChapters", {
        active: chapter.active,
        courseId: newCourseId,
        createdAt: Date.now(),
        order: chapter.order,
        summary: chapter.summary,
        title: chapter.title,
        updatedAt: Date.now(),
      });

      const lessons = await ctx.db
        .query("courseLessons")
        .withIndex("by_chapter_order", (q) => q.eq("chapterId", chapter._id))
        .collect();

      for (const lesson of lessons) {
        await ctx.db.insert("courseLessons", {
          active: lesson.active,
          chapterId: newChapterId,
          courseId: newCourseId,
          createdAt: Date.now(),
          description: lesson.description,
          durationSeconds: lesson.durationSeconds,
          exerciseLink: lesson.exerciseLink,
          isPreview: lesson.isPreview,
          order: lesson.order,
          title: lesson.title,
          updatedAt: Date.now(),
          videoType: lesson.videoType,
          videoUrl: lesson.videoUrl,
        });
      }
    }

    const newCourse = await ctx.db.get(newCourseId);
    if (!newCourse) {
      throw new Error("Failed to duplicate course");
    }
    return newCourse;
  },
});


