import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { contentStatus } from "./lib/validators";
import { rankByFuzzyMatches } from "./lib/search";
import { countPublishedServices, recordServiceAggregates } from "./lib/aggregates/publicContent";
import { requireAdminPermission } from "./lib/permissions";
import * as ServicesModel from "./model/services";
import type { Doc } from "./_generated/dataModel";
import {
  isBrokenStorageBackedUrl,
  removeOwnerFilesAndCleanup,
  syncOwnerFilesAndCleanup,
} from "./lib/fileService";
import {
  isMultiCategoryEnabled,
  listServiceAdditionalCategoryIds,
  mergeServicesByCategoryAssignments,
  syncServiceCategoryAssignments,
} from "./lib/multiCategory";

const serviceDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("services"),
  categoryId: v.id("serviceCategories"),
  content: v.string(),
  renderType: v.optional(v.union(
    v.literal("content"),
    v.literal("markdown"),
    v.literal("html")
  )),
  markdownRender: v.optional(v.string()),
  htmlRender: v.optional(v.string()),
  duration: v.optional(v.string()),
  bookingEnabled: v.optional(v.boolean()),
  bookingDurationMin: v.optional(v.number()),
  bookingSlotIntervalMin: v.optional(v.number()),
  bookingCapacityPerSlot: v.optional(v.number()),
  bookingSlotTemplateDefault: v.optional(v.array(v.string())),
  bookingSlotTemplateByWeekday: v.optional(v.record(v.string(), v.array(v.string()))),
  excerpt: v.optional(v.string()),
  featured: v.optional(v.boolean()),
  metaDescription: v.optional(v.string()),
  metaTitle: v.optional(v.string()),
  order: v.number(),
  price: v.optional(v.number()),
  publishedAt: v.optional(v.number()),
  slug: v.string(),
  status: contentStatus,
  thumbnail: v.optional(v.string()),
  thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  title: v.string(),
  views: v.number(),
});

const SERVICES_AGGREGATES_READY_KEY = "servicesPublishedAggregatesReady";
const SERVICES_AGGREGATES_BACKFILLED_AT_KEY = "servicesPublishedAggregatesBackfilledAt";

async function isServicesAggregateReady(ctx: QueryCtx) {
  const setting = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", SERVICES_AGGREGATES_READY_KEY))
    .unique();
  return setting?.value === true;
}

async function upsertServicesAggregateSetting(ctx: MutationCtx, key: string, value: unknown) {
  const existing = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { group: "contentAggregates", value });
    return;
  }
  await ctx.db.insert("settings", { group: "contentAggregates", key, value });
}

const paginatedServices = v.object({
  continueCursor: v.string(),
  isDone: v.boolean(),
  page: v.array(serviceDoc),
  pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  splitCursor: v.optional(v.union(v.string(), v.null())),
});

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db.query("services").paginate(args.paginationOpts),
  returns: paginatedServices,
});

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => ServicesModel.listWithLimit(ctx, { limit: args.limit }),
  returns: v.array(serviceDoc),
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
    let services: Doc<"services">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("services")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      services = await searchQuery.take(fetchLimit);
    } else if (args.status) {
      services = await ctx.db
        .query("services")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else {
      services = await ctx.db
        .query("services")
        .take(500);
      services.sort((a, b) => a.order - b.order);
    }

    if (args.search?.trim() && services.length > 0) {
      const searchLower = args.search.toLowerCase().trim();
      services = services.filter((service) => service.title.toLowerCase().includes(searchLower));
    }

    return services.slice(offset, offset + limit);
  },
  returns: v.array(serviceDoc),
});

export const countAdmin = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    let services: Doc<"services">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("services")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      services = await searchQuery.take(limit + 1);
    } else if (args.status) {
      services = await ctx.db
        .query("services")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      services = await ctx.db
        .query("services")
        .take(limit + 1);
    }

    return { count: Math.min(services.length, limit), hasMore: services.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    let services: Doc<"services">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("services")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      services = await searchQuery.take(limit + 1);
    } else if (args.status) {
      services = await ctx.db
        .query("services")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      services = await ctx.db
        .query("services")
        .take(limit + 1);
    }

    const hasMore = services.length > limit;
    return { ids: services.slice(0, limit).map((service) => service._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("services")), hasMore: v.boolean() }),
});

export const count = query({
  args: { status: v.optional(contentStatus) },
  handler: async (ctx, args) => ServicesModel.countWithLimit(ctx, { status: args.status }),
  returns: v.object({
    count: v.number(),
    hasMore: v.boolean(),
  }),
});

// SVC-001: Legacy count for backward compatibility (returns number)
export const countSimple = query({
  args: { status: v.optional(contentStatus) },
  handler: async (ctx, args) => {
    const result = await ServicesModel.countWithLimit(ctx, { status: args.status });
    return result.count;
  },
  returns: v.number(),
});

export const getById = query({
  args: { id: v.id("services") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(serviceDoc, v.null()),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("services")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique(),
  returns: v.union(serviceDoc, v.null()),
});

export const getAdditionalCategoryIds = query({
  args: { id: v.id("services") },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.id);
    if (!service) {
      return [];
    }
    return listServiceAdditionalCategoryIds(ctx, args.id, service.categoryId);
  },
  returns: v.array(v.id("serviceCategories")),
});

export const listByCategory = query({
  args: {
    categoryId: v.id("serviceCategories"),
    paginationOpts: paginationOptsValidator,
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return  ctx.db
        .query("services")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId).eq("status", args.status!)
        )
        .paginate(args.paginationOpts);
    }
    return  ctx.db
      .query("services")
      .withIndex("by_category_status", (q) => q.eq("categoryId", args.categoryId))
      .paginate(args.paginationOpts);
  },
  returns: paginatedServices,
});

export const listPublished = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
      .query("services")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: paginatedServices,
});

// SVC-012: Use by_status_featured index for efficient featured query
export const listFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 6, 20);
    return  ctx.db
      .query("services")
      .withIndex("by_status_featured", (q) => q.eq("status", "Published").eq("featured", true))
      .order("desc")
      .take(limit);
  },
  returns: v.array(serviceDoc),
});

// SVC-003: List most viewed services (like posts.listMostViewed)
export const listMostViewed = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
      .query("services")
      .withIndex("by_status_views", (q) => q.eq("status", "Published"))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: paginatedServices,
});

// SVC-002: List recent services (non-paginated, for sidebar/widgets)
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5, 20);
    return  ctx.db
      .query("services")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order("desc")
      .take(limit);
  },
  returns: v.array(serviceDoc),
});

// SVC-002: List popular services (non-paginated, for sidebar/widgets)
export const listPopular = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5, 20);
    return  ctx.db
      .query("services")
      .withIndex("by_status_views", (q) => q.eq("status", "Published"))
      .order("desc")
      .take(limit);
  },
  returns: v.array(serviceDoc),
});

// Paginated published services for usePaginatedQuery hook (infinite scroll)
export const listPublishedPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("serviceCategories")),
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
        .query("services")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .order(sortBy === "oldest" ? "asc" : "desc")
        .paginate(args.paginationOpts);
      const page = await isMultiCategoryEnabled(ctx, "services")
        ? await mergeServicesByCategoryAssignments(ctx, args.categoryId, result.page, args.paginationOpts.numItems)
        : result.page;
      return { ...result, page: page.filter((service) => service.status === "Published") };
    }

    if (sortBy === "popular") {
      return ctx.db
        .query("services")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return ctx.db
      .query("services")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order(sortBy === "oldest" ? "asc" : "desc")
      .paginate(args.paginationOpts);
  },
  returns: paginatedServices,
});

// Offset-based pagination for URL-based pagination mode
export const listPublishedWithOffset = query({
  args: {
    categoryId: v.optional(v.id("serviceCategories")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
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
    const limit = Math.min(args.limit ?? 12, 50);
    const offset = args.offset ?? 0;
    const sortBy = args.sortBy ?? "newest";

    let services: Doc<"services">[] = [];
    const fetchLimit = offset + limit + 10;

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("services")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower).eq("status", "Published");
          return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
        });
      services = await searchQuery.take(fetchLimit);
    } else if (args.categoryId) {
      services = await ctx.db
        .query("services")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(fetchLimit);
      if (await isMultiCategoryEnabled(ctx, "services")) {
        services = await mergeServicesByCategoryAssignments(ctx, args.categoryId, services, fetchLimit);
        services = services.filter((service) => service.status === "Published");
      }
    } else if (sortBy === "popular") {
      services = await ctx.db
        .query("services")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .take(fetchLimit);
    } else {
      services = await ctx.db
        .query("services")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order(sortBy === "oldest" ? "asc" : "desc")
        .take(fetchLimit);
    }

    if (args.search?.trim() && services.length > 0) {
      const ranked = rankByFuzzyMatches(
        services,
        args.search,
        (s) => [s.title ?? "", s.excerpt ?? ""],
        42,
      );
      services = ranked.map((entry) => entry.item);
    }

    if (!args.search?.trim()) {
      switch (sortBy) {
        case "oldest":
          services.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
          break;
        case "popular":
          services.sort((a, b) => b.views - a.views);
          break;
        case "title":
          services.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
          break;
        case "title_desc":
          services.sort((a, b) => b.title.localeCompare(a.title, 'vi'));
          break;
        case "price_asc":
          services.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
          break;
        case "price_desc":
          services.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
          break;
        default:
          services.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
      }
    }

    return services.slice(offset, offset + limit);
  },
  returns: v.array(serviceDoc),
});

export const searchPublished = query({
  args: {
    categoryId: v.optional(v.id("serviceCategories")),
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
    
    let services: Doc<"services">[] = [];
    
    if (args.categoryId) {
      services = await ctx.db
        .query("services")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(limit * 2);
      if (await isMultiCategoryEnabled(ctx, "services")) {
        services = await mergeServicesByCategoryAssignments(ctx, args.categoryId, services, limit * 2);
        services = services.filter((service) => service.status === "Published");
      }
    } else {
      if (sortBy === "popular") {
        services = await ctx.db
          .query("services")
          .withIndex("by_status_views", (q) => q.eq("status", "Published"))
          .order("desc")
          .take(limit * 2);
      } else {
        services = await ctx.db
          .query("services")
          .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
          .order(sortBy === "oldest" ? "asc" : "desc")
          .take(limit * 2);
      }
    }
    
    if (args.search && args.search.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      services = services.filter(s => 
        s.title.toLowerCase().includes(searchLower) ||
        (s.excerpt?.toLowerCase().includes(searchLower))
      );
    }
    
    if (args.categoryId || !["newest", "oldest", "popular"].includes(sortBy)) {
      switch (sortBy) {
        case "oldest": {
          services.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
          break;
        }
        case "popular": {
          services.sort((a, b) => b.views - a.views);
          break;
        }
        case "title": {
          services.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
          break;
        }
        case "title_desc": {
          services.sort((a, b) => b.title.localeCompare(a.title, 'vi'));
          break;
        }
        case "price_asc": {
          services.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
          break;
        }
        case "price_desc": {
          services.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
          break;
        }
        default: {
          services.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
        }
      }
    }
    
    return services.slice(0, limit);
  },
  returns: v.array(serviceDoc),
});

export const countPublished = query({
  args: {
    categoryId: v.optional(v.id("serviceCategories")),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("services")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower).eq("status", "Published");
          return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
        });
      const services = await searchQuery.take(1000);
      
      const ranked = rankByFuzzyMatches(
        services,
        args.search,
        (s) => [s.title ?? "", s.excerpt ?? ""],
        42,
      );
      return ranked.length;
    }

    if (await isServicesAggregateReady(ctx)) {
      return countPublishedServices(ctx, { categoryId: args.categoryId });
    }
    if (args.categoryId) {
      const services = await ctx.db
        .query("services")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(1000);
      const mergedServices = await isMultiCategoryEnabled(ctx, "services")
        ? await mergeServicesByCategoryAssignments(ctx, args.categoryId, services, 1000)
        : services;
      return mergedServices.filter((service) => service.status === "Published").length;
    }
    const services = await ctx.db
      .query("services")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .take(1000);
    return services.length;
  },
  returns: v.number(),
});

export const create = mutation({
  args: {
    categoryId: v.id("serviceCategories"),
    additionalCategoryIds: v.optional(v.array(v.id("serviceCategories"))),
    content: v.string(),
    renderType: v.optional(v.union(
      v.literal("content"),
      v.literal("markdown"),
      v.literal("html")
    )),
    markdownRender: v.optional(v.string()),
    htmlRender: v.optional(v.string()),
    duration: v.optional(v.string()),
    bookingEnabled: v.optional(v.boolean()),
    bookingDurationMin: v.optional(v.number()),
    bookingSlotIntervalMin: v.optional(v.number()),
    bookingCapacityPerSlot: v.optional(v.number()),
    bookingSlotTemplateDefault: v.optional(v.array(v.string())),
    bookingSlotTemplateByWeekday: v.optional(v.record(v.string(), v.array(v.string()))),
    excerpt: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    order: v.optional(v.number()),
    price: v.optional(v.number()),
    slug: v.string(),
    status: v.optional(contentStatus),
    thumbnail: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ServicesModel.create(ctx, args);
    if (await isMultiCategoryEnabled(ctx, "services")) {
      await syncServiceCategoryAssignments(ctx, id, args.categoryId, args.additionalCategoryIds);
    }
    if (args.thumbnailStorageId) {
      await syncOwnerFilesAndCleanup(ctx, {
        ownerField: "thumbnail",
        ownerId: id,
        ownerTable: "services",
        purpose: "service-thumbnail",
      }, [args.thumbnailStorageId]);
    }
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "service" });
    return id;
  },
  returns: v.id("services"),
});

export const update = mutation({
  args: {
    categoryId: v.optional(v.id("serviceCategories")),
    additionalCategoryIds: v.optional(v.array(v.id("serviceCategories"))),
    content: v.optional(v.string()),
    renderType: v.optional(v.union(
      v.literal("content"),
      v.literal("markdown"),
      v.literal("html")
    )),
    markdownRender: v.optional(v.string()),
    htmlRender: v.optional(v.string()),
    duration: v.optional(v.string()),
    bookingEnabled: v.optional(v.boolean()),
    bookingDurationMin: v.optional(v.number()),
    bookingSlotIntervalMin: v.optional(v.number()),
    bookingCapacityPerSlot: v.optional(v.number()),
    bookingSlotTemplateDefault: v.optional(v.array(v.string())),
    bookingSlotTemplateByWeekday: v.optional(v.record(v.string(), v.array(v.string()))),
    excerpt: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    id: v.id("services"),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    order: v.optional(v.number()),
    price: v.optional(v.number()),
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
    await ServicesModel.update(ctx, modelArgs);
    if (previous && await isMultiCategoryEnabled(ctx, "services")) {
      await syncServiceCategoryAssignments(ctx, args.id, args.categoryId ?? previous.categoryId, args.additionalCategoryIds);
    }
    const shouldCheckStorage = Object.prototype.hasOwnProperty.call(args, "thumbnailStorageId");
    if (shouldCheckStorage && previous) {
      const nextThumbnailStorageId = Object.prototype.hasOwnProperty.call(args, "thumbnailStorageId")
        ? args.thumbnailStorageId ?? null
        : previous.thumbnailStorageId ?? null;
      await syncOwnerFilesAndCleanup(ctx, {
        ownerField: "thumbnail",
        ownerId: args.id,
        ownerTable: "services",
        purpose: "service-thumbnail",
      }, [nextThumbnailStorageId], {
        previousStorageIds: [previous.thumbnailStorageId],
      });
    }
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "service" });
    return null;
  },
  returns: v.null(),
});

export const bulkClearBrokenMedia = mutation({
  args: { ids: v.array(v.id("services")) },
  handler: async (ctx, args) => {
    let checked = 0;
    let updated = 0;
    let cleared = 0;
    let skipped = 0;

    for (const id of args.ids) {
      const service = await ctx.db.get(id);
      if (!service) {
        skipped += 1;
        continue;
      }
      checked += 1;
      if (await isBrokenStorageBackedUrl(ctx, service.thumbnail, service.thumbnailStorageId)) {
        await ctx.db.patch(id, { thumbnail: "", thumbnailStorageId: null });
        await syncOwnerFilesAndCleanup(ctx, {
          ownerField: "thumbnail",
          ownerId: id,
          ownerTable: "services",
          purpose: "service-thumbnail",
        }, [], {
          previousStorageIds: [service.thumbnailStorageId],
        });
        updated += 1;
        cleared += 1;
      }
    }

    if (updated > 0) {
      await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "service" });
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
  args: { id: v.id("services") },
  handler: async (ctx, args) => {
    await ServicesModel.incrementViews(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("services") },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.id);
    await ServicesModel.remove(ctx, args);
    await removeOwnerFilesAndCleanup(ctx, {
      ownerId: args.id,
      ownerTable: "services",
    }, {
      previousStorageIds: [service?.thumbnailStorageId],
    });
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "service" });
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("services") },
  handler: async (ctx, args) => ServicesModel.getDeleteInfo(ctx, args),
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
  args: { items: v.array(v.object({ id: v.id("services"), order: v.number() })) },
  handler: async (ctx, args) => {
    await Promise.all(args.items.map(async (item) => ctx.db.patch(item.id, { order: item.order })));
    return null;
  },
  returns: v.null(),
});

export const duplicate = mutation({
  args: { id: v.id("services") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) {
      throw new Error("Service not found");
    }

    const buildCopiedName = (base: string, attempt: number) =>
      attempt <= 1 ? `${base} (copy)` : `${base} (copy ${attempt})`;
      
    let copiedTitle = "";
    for (let attempt = 1; attempt <= 100; attempt += 1) {
      const candidate = buildCopiedName(source.title, attempt);
      const existing = await ctx.db
        .query("services")
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

    const additionalCategoryIds = await listServiceAdditionalCategoryIds(ctx, source._id, source.categoryId);

    const newServiceId = await ServicesModel.create(ctx, {
      categoryId: source.categoryId,
      content: source.content,
      renderType: source.renderType,
      markdownRender: source.markdownRender,
      htmlRender: source.htmlRender,
      duration: source.duration,
      bookingEnabled: source.bookingEnabled,
      bookingDurationMin: source.bookingDurationMin,
      bookingSlotIntervalMin: source.bookingSlotIntervalMin,
      bookingCapacityPerSlot: source.bookingCapacityPerSlot,
      bookingSlotTemplateDefault: source.bookingSlotTemplateDefault,
      bookingSlotTemplateByWeekday: source.bookingSlotTemplateByWeekday,
      excerpt: source.excerpt,
      featured: source.featured,
      metaDescription: source.metaDescription,
      metaTitle: source.metaTitle,
      order: await ServicesModel.getNextOrder(ctx),
      price: source.price,
      slug: source.slug,
      status: source.status,
      thumbnail: source.thumbnail,
      thumbnailStorageId: source.thumbnailStorageId,
      title: copiedTitle,
    });

    if (await isMultiCategoryEnabled(ctx, "services")) {
      await syncServiceCategoryAssignments(ctx, newServiceId, source.categoryId, additionalCategoryIds);
    }

    if (source.thumbnailStorageId) {
      await syncOwnerFilesAndCleanup(ctx, {
        ownerField: "thumbnail",
        ownerId: newServiceId,
        ownerTable: "services",
        purpose: "service-thumbnail",
      }, [source.thumbnailStorageId]);
    }

    const newService = await ctx.db.get(newServiceId);
    if (!newService) {
      throw new Error("Failed to duplicate service");
    }
    return newService;
  },
});

async function backfillServiceAggregateBatch(
  ctx: MutationCtx,
  paginationOpts: {
    cursor: string | null;
    numItems: number;
  }
) {
  if (paginationOpts.cursor === null) {
    await upsertServicesAggregateSetting(ctx, SERVICES_AGGREGATES_READY_KEY, false);
  }
  const result = await ctx.db.query("services").paginate(paginationOpts);
  for (const doc of result.page) {
    await recordServiceAggregates(ctx, doc);
  }
  if (result.isDone) {
    await upsertServicesAggregateSetting(ctx, SERVICES_AGGREGATES_READY_KEY, true);
    await upsertServicesAggregateSetting(ctx, SERVICES_AGGREGATES_BACKFILLED_AT_KEY, Date.now());
  }
  return {
    continueCursor: result.continueCursor,
    isDone: result.isDone,
    processed: result.page.length,
  };
}

export const backfillPublishedAggregatesForAdmin = mutation({
  args: {
    paginationOpts: paginationOptsValidator,
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.token, "services", "edit");
    return backfillServiceAggregateBatch(ctx, args.paginationOpts);
  },
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    processed: v.number(),
  }),
});
