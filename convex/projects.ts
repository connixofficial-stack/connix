import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { contentStatus } from "./lib/validators";
import { rankByFuzzyMatches } from "./lib/search";
import * as ProjectsModel from "./model/projects";
import type { Doc, Id } from "./_generated/dataModel";
import {
  isBrokenStorageBackedUrl,
  removeOwnerFilesAndCleanup,
  syncOwnerFilesAndCleanup,
} from "./lib/fileService";
import {
  isMultiCategoryEnabled,
  listProjectAdditionalCategoryIds,
  mergeProjectsByCategoryAssignments,
  syncProjectCategoryAssignments,
} from "./lib/multiCategory";

const videoType = v.union(v.literal("none"), v.literal("youtube"), v.literal("drive"), v.literal("external"));

const projectDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("projects"),
  categoryId: v.id("projectCategories"),
  clientName: v.optional(v.string()),
  completedAt: v.optional(v.number()),
  content: v.string(),
  excerpt: v.optional(v.string()),
  featured: v.optional(v.boolean()),
  htmlRender: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  imageStorageIds: v.optional(v.array(v.union(v.id("_storage"), v.null()))),
  introVideoType: v.optional(videoType),
  introVideoUrl: v.optional(v.string()),
  markdownRender: v.optional(v.string()),
  metaDescription: v.optional(v.string()),
  metaTitle: v.optional(v.string()),
  order: v.number(),
  projectUrl: v.optional(v.string()),
  publishedAt: v.optional(v.number()),
  renderType: v.optional(v.union(
    v.literal("content"),
    v.literal("markdown"),
    v.literal("html")
  )),
  slug: v.string(),
  status: contentStatus,
  thumbnail: v.optional(v.string()),
  thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  title: v.string(),
  views: v.number(),
});

const paginatedProjects = v.object({
  continueCursor: v.string(),
  isDone: v.boolean(),
  page: v.array(projectDoc),
  pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  splitCursor: v.optional(v.union(v.string(), v.null())),
});

const collectProjectStorageIds = (project: {
  imageStorageIds?: Array<Id<"_storage"> | null>;
  thumbnailStorageId?: Id<"_storage"> | null;
} | null | undefined) => {
  const ids = [
    project?.thumbnailStorageId,
    ...(project?.imageStorageIds ?? []),
  ].filter((id): id is Id<"_storage"> => Boolean(id));
  return Array.from(new Set(ids));
};

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db.query("projects").paginate(args.paginationOpts),
  returns: paginatedProjects,
});

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => ProjectsModel.listWithLimit(ctx, { limit: args.limit }),
  returns: v.array(projectDoc),
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
    let projects: Doc<"projects">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("projects")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      projects = await searchQuery.take(fetchLimit);
    } else if (args.status) {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else {
      projects = await ctx.db
        .query("projects")
        .take(500);
      projects.sort((a, b) => a.order - b.order);
    }

    if (args.search?.trim() && projects.length > 0) {
      const searchLower = args.search.toLowerCase().trim();
      projects = projects.filter((project) => project.title.toLowerCase().includes(searchLower));
    }

    return projects.slice(offset, offset + limit);
  },
  returns: v.array(projectDoc),
});

export const countAdmin = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    let projects: Doc<"projects">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("projects")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      projects = await searchQuery.take(limit + 1);
    } else if (args.status) {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      projects = await ctx.db.query("projects").take(limit + 1);
    }

    return { count: Math.min(projects.length, limit), hasMore: projects.length > limit };
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
    let projects: Doc<"projects">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("projects")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      projects = await searchQuery.take(limit + 1);
    } else if (args.status) {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      projects = await ctx.db.query("projects").take(limit + 1);
    }

    const hasMore = projects.length > limit;
    return { ids: projects.slice(0, limit).map((project) => project._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("projects")), hasMore: v.boolean() }),
});

export const count = query({
  args: { status: v.optional(contentStatus) },
  handler: async (ctx, args) => ProjectsModel.countWithLimit(ctx, { status: args.status }),
  returns: v.object({
    count: v.number(),
    hasMore: v.boolean(),
  }),
});

export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(projectDoc, v.null()),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => ProjectsModel.getBySlug(ctx, args),
  returns: v.union(projectDoc, v.null()),
});

export const getAdditionalCategoryIds = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) {
      return [];
    }
    return listProjectAdditionalCategoryIds(ctx, args.id, project.categoryId);
  },
  returns: v.array(v.id("projectCategories")),
});

export const listPublishedPaginated = query({
  args: {
    categoryId: v.optional(v.id("projectCategories")),
    paginationOpts: paginationOptsValidator,
    sortBy: v.optional(v.union(v.literal("newest"), v.literal("oldest"), v.literal("popular"))),
  },
  handler: async (ctx, args) => {
    const sortBy = args.sortBy ?? "newest";

    if (args.categoryId) {
      const result = await ctx.db
        .query("projects")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .order(sortBy === "oldest" ? "asc" : "desc")
        .paginate(args.paginationOpts);
      const page = await isMultiCategoryEnabled(ctx, "projects")
        ? await mergeProjectsByCategoryAssignments(ctx, args.categoryId, result.page, args.paginationOpts.numItems)
        : result.page;
      return { ...result, page: page.filter((project) => project.status === "Published") };
    }

    if (sortBy === "popular") {
      return ctx.db
        .query("projects")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return ctx.db
      .query("projects")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order(sortBy === "oldest" ? "asc" : "desc")
      .paginate(args.paginationOpts);
  },
  returns: paginatedProjects,
});

export const listPublishedWithOffset = query({
  args: {
    categoryId: v.optional(v.id("projectCategories")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title"),
      v.literal("title_desc")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 12, 50);
    const offset = args.offset ?? 0;
    const sortBy = args.sortBy ?? "newest";
    const fetchLimit = offset + limit + 10;
    let projects: Doc<"projects">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("projects")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower).eq("status", "Published");
          return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
        });
      projects = await searchQuery.take(fetchLimit);
    } else if (args.categoryId) {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(fetchLimit);
      if (await isMultiCategoryEnabled(ctx, "projects")) {
        projects = await mergeProjectsByCategoryAssignments(ctx, args.categoryId, projects, fetchLimit);
        projects = projects.filter((project) => project.status === "Published");
      }
    } else if (sortBy === "popular") {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .take(fetchLimit);
    } else {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order(sortBy === "oldest" ? "asc" : "desc")
        .take(fetchLimit);
    }

    if (args.search?.trim() && projects.length > 0) {
      const ranked = rankByFuzzyMatches(
        projects,
        args.search,
        (project) => [project.title ?? "", project.excerpt ?? ""],
        42,
      );
      projects = ranked.map((entry) => entry.item);
    }

    if (!args.search?.trim()) {
      switch (sortBy) {
        case "oldest":
          projects.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
          break;
        case "popular":
          projects.sort((a, b) => b.views - a.views);
          break;
        case "title":
          projects.sort((a, b) => a.title.localeCompare(b.title, "vi"));
          break;
        case "title_desc":
          projects.sort((a, b) => b.title.localeCompare(a.title, "vi"));
          break;
        default:
          projects.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
      }
    }

    return projects.slice(offset, offset + limit);
  },
  returns: v.array(projectDoc),
});

export const searchPublished = query({
  args: {
    categoryId: v.optional(v.id("projectCategories")),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title"),
      v.literal("title_desc")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const sortBy = args.sortBy ?? "newest";
    let projects: Doc<"projects">[] = [];

    if (args.categoryId) {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(limit * 2);
      if (await isMultiCategoryEnabled(ctx, "projects")) {
        projects = await mergeProjectsByCategoryAssignments(ctx, args.categoryId, projects, limit * 2);
        projects = projects.filter((project) => project.status === "Published");
      }
    } else if (sortBy === "popular") {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .take(limit * 2);
    } else {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order(sortBy === "oldest" ? "asc" : "desc")
        .take(limit * 2);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      projects = projects.filter((project) =>
        project.title.toLowerCase().includes(searchLower)
        || Boolean(project.excerpt?.toLowerCase().includes(searchLower))
      );
    }

    if (args.categoryId || !["newest", "oldest", "popular"].includes(sortBy)) {
      switch (sortBy) {
        case "oldest":
          projects.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
          break;
        case "popular":
          projects.sort((a, b) => b.views - a.views);
          break;
        case "title":
          projects.sort((a, b) => a.title.localeCompare(b.title, "vi"));
          break;
        case "title_desc":
          projects.sort((a, b) => b.title.localeCompare(a.title, "vi"));
          break;
        default:
          projects.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
      }
    }

    return projects.slice(0, limit);
  },
  returns: v.array(projectDoc),
});

export const countPublished = query({
  args: {
    categoryId: v.optional(v.id("projectCategories")),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("projects")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower).eq("status", "Published");
          return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
        });
      const projects = await searchQuery.take(1000);
      const ranked = rankByFuzzyMatches(
        projects,
        args.search,
        (project) => [project.title ?? "", project.excerpt ?? ""],
        42,
      );
      return ranked.length;
    }

    if (args.categoryId) {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(1000);
      const mergedProjects = await isMultiCategoryEnabled(ctx, "projects")
        ? await mergeProjectsByCategoryAssignments(ctx, args.categoryId, projects, 1000)
        : projects;
      return mergedProjects.filter((project) => project.status === "Published").length;
    }
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .take(1000);
    return projects.length;
  },
  returns: v.number(),
});

export const listFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 6, 20);
    return ctx.db
      .query("projects")
      .withIndex("by_status_featured", (q) => q.eq("status", "Published").eq("featured", true))
      .order("desc")
      .take(limit);
  },
  returns: v.array(projectDoc),
});

export const create = mutation({
  args: {
    additionalCategoryIds: v.optional(v.array(v.id("projectCategories"))),
    categoryId: v.id("projectCategories"),
    clientName: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    content: v.string(),
    excerpt: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    htmlRender: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    imageStorageIds: v.optional(v.array(v.union(v.id("_storage"), v.null()))),
    introVideoType: v.optional(videoType),
    introVideoUrl: v.optional(v.string()),
    markdownRender: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    order: v.optional(v.number()),
    projectUrl: v.optional(v.string()),
    renderType: v.optional(v.union(v.literal("content"), v.literal("markdown"), v.literal("html"))),
    slug: v.string(),
    status: v.optional(contentStatus),
    thumbnail: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const modelArgs = { ...args };
    delete (modelArgs as { additionalCategoryIds?: unknown }).additionalCategoryIds;
    const id = await ProjectsModel.create(ctx, modelArgs);
    if (await isMultiCategoryEnabled(ctx, "projects")) {
      await syncProjectCategoryAssignments(ctx, id, args.categoryId, args.additionalCategoryIds);
    }
    const storageIds = collectProjectStorageIds({
      imageStorageIds: args.imageStorageIds,
      thumbnailStorageId: args.thumbnailStorageId ?? null,
    });
    if (storageIds.length > 0) {
      await syncOwnerFilesAndCleanup(ctx, {
        ownerField: "media",
        ownerId: id,
        ownerTable: "projects",
        purpose: "project-media",
      }, storageIds);
    }
    return id;
  },
  returns: v.id("projects"),
});

export const update = mutation({
  args: {
    additionalCategoryIds: v.optional(v.array(v.id("projectCategories"))),
    categoryId: v.optional(v.id("projectCategories")),
    clientName: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    htmlRender: v.optional(v.string()),
    id: v.id("projects"),
    images: v.optional(v.array(v.string())),
    imageStorageIds: v.optional(v.array(v.union(v.id("_storage"), v.null()))),
    introVideoType: v.optional(videoType),
    introVideoUrl: v.optional(v.string()),
    markdownRender: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    order: v.optional(v.number()),
    projectUrl: v.optional(v.string()),
    renderType: v.optional(v.union(v.literal("content"), v.literal("markdown"), v.literal("html"))),
    slug: v.optional(v.string()),
    status: v.optional(contentStatus),
    thumbnail: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    title: v.optional(v.string()),
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
    await ProjectsModel.update(ctx, modelArgs);
    if (previous && await isMultiCategoryEnabled(ctx, "projects")) {
      await syncProjectCategoryAssignments(ctx, args.id, args.categoryId ?? previous.categoryId, args.additionalCategoryIds);
    }

    const shouldCheckStorage = Object.prototype.hasOwnProperty.call(args, "thumbnailStorageId")
      || Object.prototype.hasOwnProperty.call(args, "imageStorageIds");
    if (shouldCheckStorage && previous) {
      const nextStorageIds = collectProjectStorageIds({
        imageStorageIds: Object.prototype.hasOwnProperty.call(args, "imageStorageIds")
          ? args.imageStorageIds
          : previous.imageStorageIds,
        thumbnailStorageId: Object.prototype.hasOwnProperty.call(args, "thumbnailStorageId")
          ? args.thumbnailStorageId ?? null
          : previous.thumbnailStorageId ?? null,
      });
      await syncOwnerFilesAndCleanup(ctx, {
        ownerField: "media",
        ownerId: args.id,
        ownerTable: "projects",
        purpose: "project-media",
      }, nextStorageIds, {
        previousStorageIds: collectProjectStorageIds(previous),
      });
    }
    return null;
  },
  returns: v.null(),
});

export const bulkClearBrokenMedia = mutation({
  args: { ids: v.array(v.id("projects")) },
  handler: async (ctx, args) => {
    let checked = 0;
    let updated = 0;
    let cleared = 0;
    let skipped = 0;

    for (const id of args.ids) {
      const project = await ctx.db.get(id);
      if (!project) {
        skipped += 1;
        continue;
      }
      checked += 1;

      const imageStorageIds = project.imageStorageIds ?? [];
      const images = project.images ?? [];
      const nextImages: string[] = [];
      const nextImageStorageIds: Array<Id<"_storage"> | null> = [];
      for (let index = 0; index < images.length; index += 1) {
        const image = images[index];
        const storageId = imageStorageIds[index] ?? null;
        if (await isBrokenStorageBackedUrl(ctx, image, storageId)) {
          cleared += 1;
          continue;
        }
        nextImages.push(image);
        nextImageStorageIds.push(storageId);
      }

      const isThumbnailBroken = await isBrokenStorageBackedUrl(ctx, project.thumbnail, project.thumbnailStorageId);
      if (isThumbnailBroken || nextImages.length !== images.length) {
        await ctx.db.patch(id, {
          ...(isThumbnailBroken ? { thumbnail: "", thumbnailStorageId: null } : {}),
          ...(nextImages.length !== images.length ? { images: nextImages, imageStorageIds: nextImageStorageIds } : {}),
        });
        await syncOwnerFilesAndCleanup(ctx, {
          ownerField: "media",
          ownerId: id,
          ownerTable: "projects",
          purpose: "project-media",
        }, [
          ...(isThumbnailBroken ? [] : [project.thumbnailStorageId]),
          ...nextImageStorageIds,
        ], {
          previousStorageIds: collectProjectStorageIds(project),
        });
        updated += 1;
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
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await ProjectsModel.incrementViews(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    await ProjectsModel.remove(ctx, args);
    await removeOwnerFilesAndCleanup(ctx, {
      ownerId: args.id,
      ownerTable: "projects",
    }, {
      previousStorageIds: collectProjectStorageIds(project),
    });
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => ProjectsModel.getDeleteInfo(ctx, args),
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

export const reorder = mutation({
  args: { items: v.array(v.object({ id: v.id("projects"), order: v.number() })) },
  handler: async (ctx, args) => {
    await Promise.all(args.items.map(async (item) => ctx.db.patch(item.id, { order: item.order })));
    return null;
  },
  returns: v.null(),
});

export const duplicate = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) {
      throw new Error("Project not found");
    }

    const buildCopiedName = (base: string, attempt: number) =>
      attempt <= 1 ? `${base} (copy)` : `${base} (copy ${attempt})`;
      
    let copiedTitle = "";
    for (let attempt = 1; attempt <= 100; attempt += 1) {
      const candidate = buildCopiedName(source.title, attempt);
      const existing = await ctx.db
        .query("projects")
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

    const additionalCategoryIds = await listProjectAdditionalCategoryIds(ctx, source._id, source.categoryId);

    const newProjectId = await ProjectsModel.create(ctx, {
      categoryId: source.categoryId,
      clientName: source.clientName,
      completedAt: source.completedAt,
      content: source.content,
      excerpt: source.excerpt,
      featured: source.featured,
      htmlRender: source.htmlRender,
      images: source.images,
      imageStorageIds: source.imageStorageIds,
      introVideoType: source.introVideoType,
      introVideoUrl: source.introVideoUrl,
      markdownRender: source.markdownRender,
      metaDescription: source.metaDescription,
      metaTitle: source.metaTitle,
      order: await ProjectsModel.getNextOrder(ctx),
      projectUrl: source.projectUrl,
      renderType: source.renderType,
      slug: source.slug,
      status: source.status,
      thumbnail: source.thumbnail,
      thumbnailStorageId: source.thumbnailStorageId,
      title: copiedTitle,
    });

    if (await isMultiCategoryEnabled(ctx, "projects")) {
      await syncProjectCategoryAssignments(ctx, newProjectId, source.categoryId, additionalCategoryIds);
    }

    const storageIds = collectProjectStorageIds({
      imageStorageIds: source.imageStorageIds,
      thumbnailStorageId: source.thumbnailStorageId ?? null,
    });
    if (storageIds.length > 0) {
      await syncOwnerFilesAndCleanup(ctx, {
        ownerField: "media",
        ownerId: newProjectId,
        ownerTable: "projects",
        purpose: "project-media",
      }, storageIds);
    }

    const newProject = await ctx.db.get(newProjectId);
    if (!newProject) {
      throw new Error("Failed to duplicate project");
    }
    return newProject;
  },
});
