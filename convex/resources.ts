import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { contentStatus } from "./lib/validators";
import { rankByFuzzyMatches } from "./lib/search";
import { resolveUniqueSlug } from "./lib/iaSlugs";
import {
  isBrokenStorageBackedUrl,
  removeOwnerFilesAndCleanup,
  syncOwnerFilesAndCleanup,
} from "./lib/fileService";
import {
  isMultiCategoryEnabled,
  listResourceAdditionalCategoryIds,
  mergeResourcesByCategoryAssignments,
  syncResourceCategoryAssignments,
} from "./lib/multiCategory";
import { syncResourceFilterAssignments } from "./resourceFilters";
import {
  customerHasResourceOrderAccess,
  ensureResourceCustomerForCustomerResource,
  getResourceCustomer,
  resolveCustomerIdByToken,
} from "./lib/resourceAccess";

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

const resourceDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("resources"),
  categoryId: v.id("resourceCategories"),
  comparePriceAmount: v.optional(v.number()),
  content: v.string(),
  downloadUrl: v.string(),
  excerpt: v.optional(v.string()),
  featured: v.optional(v.boolean()),
  htmlRender: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  imageStorageIds: v.optional(v.array(v.union(v.id("_storage"), v.null()))),
  isPriceVisible: v.optional(v.boolean()),
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

const publicResourceDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("resources"),
  categoryId: v.id("resourceCategories"),
  comparePriceAmount: v.optional(v.number()),
  content: v.string(),
  excerpt: v.optional(v.string()),
  featured: v.optional(v.boolean()),
  htmlRender: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  imageStorageIds: v.optional(v.array(v.union(v.id("_storage"), v.null()))),
  isPriceVisible: v.optional(v.boolean()),
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

const resourceAccessDoc = v.object({
  hasAccess: v.boolean(),
  reason: v.string(),
});

const downloadResultDoc = v.object({
  ok: v.boolean(),
  reason: v.string(),
  url: v.optional(v.string()),
});

const resourceCustomerAdminDoc = v.object({
  customerEmail: v.string(),
  customerId: v.id("customers"),
  customerName: v.string(),
  customerPhone: v.string(),
  downloadCount: v.number(),
  enrolledAt: v.number(),
  grantedAt: v.number(),
  lastDownloadAt: v.optional(v.number()),
  resourceId: v.id("resources"),
  resourceTitle: v.string(),
  sourceOrderId: v.optional(v.id("orders")),
  sourceType: v.union(v.literal("order"), v.literal("free"), v.literal("manual")),
  status: v.union(v.literal("active"), v.literal("revoked")),
  accessId: v.id("resourceCustomers"),
});

const sortByValidator = v.union(
  v.literal("newest"),
  v.literal("oldest"),
  v.literal("popular"),
  v.literal("title"),
  v.literal("title_desc"),
  v.literal("price_asc"),
  v.literal("price_desc")
);

function assertValidDownloadUrl(url: string) {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    throw new Error("Vui lòng nhập link tải");
  }
  try {
    const parsed = new URL(cleanUrl);
    const allowed = parsed.protocol === "http:" || parsed.protocol === "https:";
    if (!allowed) {
      throw new Error("invalid");
    }
  } catch {
    throw new Error("Link tải phải là URL hợp lệ (bắt đầu bằng http:// hoặc https://)");
  }
}

async function getNextOrder(ctx: MutationCtx): Promise<number> {
  const lastResource = await ctx.db.query("resources").order("desc").first();
  return lastResource ? lastResource.order + 1 : 0;
}

async function listFilterResourceIds(ctx: QueryCtx | MutationCtx, valueId?: Id<"resourceFilterValues">, valueIds?: Id<"resourceFilterValues">[]) {
  const ids = new Set<string>();
  if (valueIds && valueIds.length > 0) {
    const rows = await Promise.all(valueIds.map((id) =>
      ctx.db.query("resourceFilterAssignments").withIndex("by_value", (q) => q.eq("valueId", id)).take(1000)
    ));
    rows.flat().forEach((row) => ids.add(row.resourceId));
    return { hasFilter: true, ids };
  }
  if (valueId) {
    const rows = await ctx.db
      .query("resourceFilterAssignments")
      .withIndex("by_value", (q) => q.eq("valueId", valueId))
      .take(1000);
    rows.forEach((row: Doc<"resourceFilterAssignments">) => ids.add(row.resourceId));
    return { hasFilter: true, ids };
  }
  return { hasFilter: false, ids };
}

function sortResources(resources: Doc<"resources">[], sortBy: string) {
  switch (sortBy) {
    case "oldest":
      resources.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
      break;
    case "popular":
      resources.sort((a, b) => b.views - a.views);
      break;
    case "title":
      resources.sort((a, b) => a.title.localeCompare(b.title, "vi"));
      break;
    case "title_desc":
      resources.sort((a, b) => b.title.localeCompare(a.title, "vi"));
      break;
    case "price_asc":
      resources.sort((a, b) => (a.priceAmount ?? 0) - (b.priceAmount ?? 0));
      break;
    case "price_desc":
      resources.sort((a, b) => (b.priceAmount ?? 0) - (a.priceAmount ?? 0));
      break;
    default:
      resources.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  }
}

function toPublicResource(resource: Doc<"resources">) {
  const { downloadUrl: _downloadUrl, ...publicResource } = resource;
  void _downloadUrl;
  return publicResource;
}

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
    let resources: Doc<"resources">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      resources = await ctx.db
        .query("resources")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        })
        .take(fetchLimit);
      resources = resources.filter((resource) =>
        resource.title.toLowerCase().includes(searchLower) ||
        (resource.excerpt ?? "").toLowerCase().includes(searchLower)
      );
    } else if (args.status) {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else {
      resources = await ctx.db.query("resources").take(500);
      resources.sort((a, b) => a.order - b.order);
    }

    return resources.slice(offset, offset + limit);
  },
  returns: v.array(resourceDoc),
});

export const countAdmin = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    let resources: Doc<"resources">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      resources = await ctx.db
        .query("resources")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        })
        .take(limit + 1);
    } else if (args.status) {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      resources = await ctx.db.query("resources").take(limit + 1);
    }

    return { count: Math.min(resources.length, limit), hasMore: resources.length > limit };
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
    let resources: Doc<"resources">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      resources = await ctx.db
        .query("resources")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        })
        .take(limit + 1);
    } else if (args.status) {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      resources = await ctx.db.query("resources").take(limit + 1);
    }

    const hasMore = resources.length > limit;
    return { hasMore, ids: resources.slice(0, limit).map((resource) => resource._id) };
  },
  returns: v.object({ hasMore: v.boolean(), ids: v.array(v.id("resources")) }),
});

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => ctx.db.query("resources").order("desc").take(Math.min(args.limit ?? 200, 500)),
  returns: v.array(resourceDoc),
});

export const getById = query({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(resourceDoc, v.null()),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const resource = await ctx.db
      .query("resources")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    return resource?.status === "Published" ? toPublicResource(resource) : null;
  },
  returns: v.union(publicResourceDoc, v.null()),
});

export const getAdditionalCategoryIds = query({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.id);
    if (!resource) {
      return [];
    }
    return listResourceAdditionalCategoryIds(ctx, resource._id, resource.categoryId);
  },
  returns: v.array(v.id("resourceCategories")),
});

export const listPublishedWithOffset = query({
  args: {
    categoryId: v.optional(v.id("resourceCategories")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    valueId: v.optional(v.id("resourceFilterValues")),
    valueIds: v.optional(v.array(v.id("resourceFilterValues"))),
    sortBy: v.optional(sortByValidator),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 12, 50);
    const offset = args.offset ?? 0;
    const sortBy = args.sortBy ?? "newest";
    const fetchLimit = offset + limit + 20;
    const filter = await listFilterResourceIds(ctx, args.valueId, args.valueIds);
    let resources: Doc<"resources">[] = [];

    if (filter.hasFilter && !args.search?.trim() && !args.categoryId) {
      const docs = await Promise.all(Array.from(filter.ids).map((id) => ctx.db.get(id as Id<"resources">)));
      resources = docs.filter((item): item is Doc<"resources"> => Boolean(item && item.status === "Published"));
    } else if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("resources")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower).eq("status", "Published");
          return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
        });
      resources = await searchQuery.take(fetchLimit);
      if (filter.hasFilter) {
        resources = resources.filter((resource) => filter.ids.has(resource._id));
      }
    } else if (args.categoryId) {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_category_status", (q) => q.eq("categoryId", args.categoryId!).eq("status", "Published"))
        .take(fetchLimit);
      if (await isMultiCategoryEnabled(ctx, "resources")) {
        resources = await mergeResourcesByCategoryAssignments(ctx, args.categoryId, resources, fetchLimit);
        resources = resources.filter((resource) => resource.status === "Published");
      }
      if (filter.hasFilter) {
        resources = resources.filter((resource) => filter.ids.has(resource._id));
      }
    } else if (sortBy === "popular") {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .take(fetchLimit);
      if (filter.hasFilter) {
        resources = resources.filter((resource) => filter.ids.has(resource._id));
      }
    } else {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order(sortBy === "oldest" ? "asc" : "desc")
        .take(fetchLimit);
      if (filter.hasFilter) {
        resources = resources.filter((resource) => filter.ids.has(resource._id));
      }
    }

    if (args.search?.trim() && resources.length > 0) {
      const ranked = rankByFuzzyMatches(resources, args.search, (resource) => [resource.title, resource.excerpt ?? ""], 42);
      resources = ranked.map((entry) => entry.item);
    } else {
      sortResources(resources, sortBy);
    }

    return resources.slice(offset, offset + limit).map(toPublicResource);
  },
  returns: v.array(publicResourceDoc),
});

export const searchPublished = query({
  args: {
    categoryId: v.optional(v.id("resourceCategories")),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(sortByValidator),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const sortBy = args.sortBy ?? "newest";
    let resources: Doc<"resources">[] = [];

    if (args.search?.trim()) {
      resources = await ctx.db
        .query("resources")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", args.search!.toLowerCase().trim()).eq("status", "Published");
          return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
        })
        .take(limit * 2);
      const ranked = rankByFuzzyMatches(resources, args.search, (resource) => [resource.title, resource.excerpt ?? ""], 42);
      return ranked.map((entry) => toPublicResource(entry.item)).slice(0, limit);
    }

    if (args.categoryId) {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_category_status", (q) => q.eq("categoryId", args.categoryId!).eq("status", "Published"))
        .take(limit * 2);
      if (await isMultiCategoryEnabled(ctx, "resources")) {
        resources = await mergeResourcesByCategoryAssignments(ctx, args.categoryId, resources, limit * 2);
        resources = resources.filter((resource) => resource.status === "Published");
      }
    } else if (sortBy === "popular") {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .take(limit * 2);
    } else {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order(sortBy === "oldest" ? "asc" : "desc")
        .take(limit * 2);
    }

    sortResources(resources, sortBy);
    return resources.slice(0, limit).map(toPublicResource);
  },
  returns: v.array(publicResourceDoc),
});

export const countPublished = query({
  args: {
    categoryId: v.optional(v.id("resourceCategories")),
    search: v.optional(v.string()),
    valueId: v.optional(v.id("resourceFilterValues")),
    valueIds: v.optional(v.array(v.id("resourceFilterValues"))),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("resources").withIndex("by_status_publishedAt", (q) => q.eq("status", "Published")).take(1000);
    const filter = await listFilterResourceIds(ctx, args.valueId, args.valueIds);
    const search = args.search?.trim().toLowerCase();
    let resources = rows;
    if (args.categoryId) {
      const assigned = await mergeResourcesByCategoryAssignments(ctx, args.categoryId, [], 1000);
      const assignedIds = new Set(assigned.map((resource) => resource._id));
      resources = resources.filter((resource) => resource.categoryId === args.categoryId || assignedIds.has(resource._id));
    }
    if (filter.hasFilter) {
      resources = resources.filter((resource) => filter.ids.has(resource._id));
    }
    if (search) {
      resources = resources.filter((resource) =>
        resource.title.toLowerCase().includes(search) ||
        (resource.excerpt ?? "").toLowerCase().includes(search)
      );
    }
    return resources.length;
  },
  returns: v.number(),
});

export const create = mutation({
  args: {
    additionalCategoryIds: v.optional(v.array(v.id("resourceCategories"))),
    categoryId: v.id("resourceCategories"),
    comparePriceAmount: v.optional(v.number()),
    content: v.string(),
    downloadUrl: v.string(),
    excerpt: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    filterValueIds: v.optional(v.array(v.id("resourceFilterValues"))),
    htmlRender: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    imageStorageIds: v.optional(v.array(v.union(v.id("_storage"), v.null()))),
    isPriceVisible: v.optional(v.boolean()),
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
  },
  handler: async (ctx, args) => {
    assertValidDownloadUrl(args.downloadUrl);
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Resource category not found");
    }
    if (args.pricingType === "paid" && (args.priceAmount === undefined || args.priceAmount < 0)) {
      throw new Error("Tài nguyên trả phí cần có giá hợp lệ");
    }

    const resolvedSlug = await resolveUniqueSlug(ctx, { scope: "record", slug: args.slug });
    const status = args.status ?? "Draft";
    const now = Date.now();
    const resourceId = await ctx.db.insert("resources", {
      categoryId: args.categoryId,
      comparePriceAmount: args.comparePriceAmount,
      content: args.content,
      downloadUrl: args.downloadUrl.trim(),
      excerpt: args.excerpt,
      featured: args.featured,
      htmlRender: args.htmlRender,
      images: args.images,
      imageStorageIds: args.imageStorageIds,
      isPriceVisible: args.isPriceVisible ?? true,
      markdownRender: args.markdownRender,
      metaDescription: args.metaDescription,
      metaTitle: args.metaTitle,
      order: args.order ?? await getNextOrder(ctx),
      priceAmount: args.priceAmount,
      priceNote: args.priceNote,
      pricingType: args.pricingType,
      publishedAt: status === "Published" ? now : undefined,
      renderType: args.renderType,
      slug: resolvedSlug.slug,
      status,
      thumbnail: args.thumbnail,
      thumbnailStorageId: args.thumbnailStorageId,
      title: args.title,
      views: 0,
    });

    await Promise.all([
      syncResourceCategoryAssignments(ctx, resourceId, args.categoryId, args.additionalCategoryIds),
      syncResourceFilterAssignments(ctx, resourceId, args.filterValueIds),
      syncOwnerFilesAndCleanup(
        ctx,
        { ownerField: "media", ownerId: resourceId, ownerTable: "resources", purpose: "resource-media" },
        [args.thumbnailStorageId, ...(args.imageStorageIds ?? [])]
      ),
    ]);

    return resourceId;
  },
  returns: v.id("resources"),
});

export const update = mutation({
  args: {
    additionalCategoryIds: v.optional(v.array(v.id("resourceCategories"))),
    categoryId: v.optional(v.id("resourceCategories")),
    comparePriceAmount: v.optional(v.number()),
    content: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    filterValueIds: v.optional(v.array(v.id("resourceFilterValues"))),
    htmlRender: v.optional(v.string()),
    id: v.id("resources"),
    images: v.optional(v.array(v.string())),
    imageStorageIds: v.optional(v.array(v.union(v.id("_storage"), v.null()))),
    isPriceVisible: v.optional(v.boolean()),
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
  },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.id);
    if (!resource) {
      throw new Error("Resource not found");
    }
    if (args.downloadUrl !== undefined) {
      assertValidDownloadUrl(args.downloadUrl);
    }
    const nextPricingType = args.pricingType ?? resource.pricingType;
    const nextPrice = args.priceAmount ?? resource.priceAmount;
    if (nextPricingType === "paid" && (nextPrice === undefined || nextPrice < 0)) {
      throw new Error("Tài nguyên trả phí cần có giá hợp lệ");
    }

    let slug = args.slug;
    if (slug && slug !== resource.slug) {
      const resolvedSlug = await resolveUniqueSlug(ctx, {
        scope: "record",
        slug,
        exclude: { id: args.id, table: "resources" },
      });
      slug = resolvedSlug.slug;
    }

    const previousStorageIds = [resource.thumbnailStorageId, ...(resource.imageStorageIds ?? [])];
    const nextThumbnailStorageId = args.thumbnailStorageId !== undefined ? args.thumbnailStorageId : resource.thumbnailStorageId;
    const nextImageStorageIds = args.imageStorageIds !== undefined ? args.imageStorageIds : resource.imageStorageIds;
    if (args.thumbnail && await isBrokenStorageBackedUrl(ctx, args.thumbnail, nextThumbnailStorageId)) {
      throw new Error("Ảnh đại diện đã bị xoá khỏi storage. Vui lòng chọn lại ảnh.");
    }

    const { id, additionalCategoryIds, filterValueIds, ...rest } = args;
    const updates: Partial<Doc<"resources">> = {
      ...rest,
      ...(slug ? { slug } : {}),
      ...(args.downloadUrl !== undefined ? { downloadUrl: args.downloadUrl.trim() } : {}),
    };
    if (args.status === "Published" && resource.status !== "Published") {
      updates.publishedAt = Date.now();
    }

    await ctx.db.patch(id, updates);
    const nextResource = await ctx.db.get(id);
    if (!nextResource) {
      return null;
    }

    await Promise.all([
      args.categoryId !== undefined || additionalCategoryIds !== undefined
        ? syncResourceCategoryAssignments(ctx, id, nextResource.categoryId, additionalCategoryIds)
        : Promise.resolve(),
      filterValueIds !== undefined ? syncResourceFilterAssignments(ctx, id, filterValueIds) : Promise.resolve(),
      syncOwnerFilesAndCleanup(
        ctx,
        { ownerField: "media", ownerId: id, ownerTable: "resources", purpose: "resource-media" },
        [nextThumbnailStorageId, ...(nextImageStorageIds ?? [])],
        { previousStorageIds }
      ),
    ]);

    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("resources") },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.id);
    if (!resource) {
      return null;
    }
    const [customers, filterAssignments, categoryAssignments] = await Promise.all([
      ctx.db.query("resourceCustomers").withIndex("by_resourceId", (q) => q.eq("resourceId", args.id)).collect(),
      ctx.db.query("resourceFilterAssignments").withIndex("by_resource", (q) => q.eq("resourceId", args.id)).collect(),
      ctx.db.query("resourceCategoryAssignments").withIndex("by_resource", (q) => q.eq("resourceId", args.id)).collect(),
    ]);

    if (customers.length > 0 && !args.cascade) {
      throw new Error("Tài nguyên đã có khách hàng. Vui lòng xác nhận xóa tất cả liên kết.");
    }

    await Promise.all([
      ...customers.map((record) => ctx.db.delete(record._id)),
      ...filterAssignments.map((record) => ctx.db.delete(record._id)),
      ...categoryAssignments.map((record) => ctx.db.delete(record._id)),
    ]);
    await ctx.db.delete(args.id);
    await removeOwnerFilesAndCleanup(ctx, {
      ownerId: args.id,
      ownerTable: "resources",
    }, {
      previousStorageIds: [resource.thumbnailStorageId, ...(resource.imageStorageIds ?? [])],
    });
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    const [customers, filterAssignments, categoryAssignments] = await Promise.all([
      ctx.db.query("resourceCustomers").withIndex("by_resourceId", (q) => q.eq("resourceId", args.id)).take(11),
      ctx.db.query("resourceFilterAssignments").withIndex("by_resource", (q) => q.eq("resourceId", args.id)).take(11),
      ctx.db.query("resourceCategoryAssignments").withIndex("by_resource", (q) => q.eq("resourceId", args.id)).take(11),
    ]);
    const customerDocs = await Promise.all(customers.slice(0, 5).map((row) => ctx.db.get(row.customerId)));
    const dependencies = [];
    if (customers.length > 0) {
      dependencies.push({
        count: Math.min(customers.length, 10),
        hasMore: customers.length > 10,
        label: "Khách hàng có quyền tải",
        preview: customers.slice(0, 5).map((row, index) => ({
          id: row._id,
          name: customerDocs[index]?.name ?? customerDocs[index]?.email ?? "Khách hàng",
        })),
      });
    }
    if (filterAssignments.length > 0) {
      dependencies.push({
        count: Math.min(filterAssignments.length, 10),
        hasMore: filterAssignments.length > 10,
        label: "Gán bộ lọc",
        preview: filterAssignments.slice(0, 5).map((row) => ({ id: row._id, name: row.valueId })),
      });
    }
    if (categoryAssignments.length > 0) {
      dependencies.push({
        count: Math.min(categoryAssignments.length, 10),
        hasMore: categoryAssignments.length > 10,
        label: "Danh mục phụ",
        preview: categoryAssignments.slice(0, 5).map((row) => ({ id: row._id, name: row.categoryId })),
      });
    }

    return {
      canDelete: dependencies.length === 0,
      dependencies,
    };
  },
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
  args: { items: v.array(v.object({ id: v.id("resources"), order: v.number() })) },
  handler: async (ctx, args) => {
    await Promise.all(args.items.map(async (item) => ctx.db.patch(item.id, { order: item.order })));
    return null;
  },
  returns: v.null(),
});

export const bulkClearBrokenMedia = mutation({
  args: { ids: v.array(v.id("resources")) },
  handler: async (ctx, args) => {
    let checked = 0;
    let updated = 0;
    let cleared = 0;
    let skipped = 0;

    for (const id of args.ids) {
      const resource = await ctx.db.get(id);
      if (!resource) {
        skipped += 1;
        continue;
      }

      checked += 1;
      const previousStorageIds = [resource.thumbnailStorageId, ...(resource.imageStorageIds ?? [])];
      const patch: Partial<Doc<"resources">> = {};
      let changed = false;

      if (await isBrokenStorageBackedUrl(ctx, resource.thumbnail, resource.thumbnailStorageId)) {
        patch.thumbnail = "";
        patch.thumbnailStorageId = null;
        changed = true;
        cleared += 1;
      }

      const images = resource.images ?? [];
      const imageStorageIds = resource.imageStorageIds ?? [];
      if (images.length > 0) {
        const nextImages: string[] = [];
        const nextStorageIds: Array<Id<"_storage"> | null> = [];
        for (let index = 0; index < images.length; index += 1) {
          const image = images[index];
          const storageId = imageStorageIds[index];
          if (await isBrokenStorageBackedUrl(ctx, image, storageId)) {
            changed = true;
            cleared += 1;
            continue;
          }
          nextImages.push(image);
          nextStorageIds.push(storageId ?? null);
        }
        if (nextImages.length !== images.length) {
          patch.images = nextImages;
          patch.imageStorageIds = nextStorageIds;
        }
      }

      if (!changed) {
        continue;
      }

      await ctx.db.patch(id, patch);
      const next = await ctx.db.get(id);
      await syncOwnerFilesAndCleanup(
        ctx,
        { ownerField: "media", ownerId: id, ownerTable: "resources", purpose: "resource-media" },
        [next?.thumbnailStorageId, ...(next?.imageStorageIds ?? [])],
        { previousStorageIds }
      );
      updated += 1;
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
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.id);
    if (!resource) {
      return null;
    }
    await ctx.db.patch(args.id, { views: resource.views + 1 });
    return null;
  },
  returns: v.null(),
});

export const getResourceAccess = query({
  args: {
    resourceId: v.id("resources"),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.resourceId);
    if (!resource || resource.status !== "Published") {
      return { hasAccess: false, reason: "resource_not_found" };
    }
    const customerId = await resolveCustomerIdByToken(ctx, args.token);
    if (!customerId) {
      return { hasAccess: false, reason: "login_required" };
    }
    if (resource.pricingType === "free") {
      return { hasAccess: true, reason: "free" };
    }
    if (resource.pricingType === "contact") {
      return { hasAccess: false, reason: "contact" };
    }
    const access = await getResourceCustomer(ctx, customerId, args.resourceId);
    if (access?.status === "active") {
      return { hasAccess: true, reason: "customer_access" };
    }
    if (await customerHasResourceOrderAccess(ctx, customerId, args.resourceId)) {
      return { hasAccess: true, reason: "order_access" };
    }
    return { hasAccess: false, reason: "purchase_required" };
  },
  returns: resourceAccessDoc,
});

export const requestDownload = mutation({
  args: {
    resourceId: v.id("resources"),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.resourceId);
    if (!resource || resource.status !== "Published") {
      return { ok: false, reason: "resource_not_found" };
    }
    const customerId = await resolveCustomerIdByToken(ctx, args.token);
    if (!customerId) {
      return { ok: false, reason: "login_required" };
    }
    if (resource.pricingType === "contact") {
      return { ok: false, reason: "contact" };
    }

    let access = await getResourceCustomer(ctx, customerId, args.resourceId);
    if (resource.pricingType === "free") {
      const accessId = await ensureResourceCustomerForCustomerResource(ctx, customerId, args.resourceId, { sourceType: "free" });
      access = await ctx.db.get(accessId);
    } else if (access?.status !== "active") {
      const hasOrderAccess = await customerHasResourceOrderAccess(ctx, customerId, args.resourceId);
      if (!hasOrderAccess) {
        return { ok: false, reason: "purchase_required" };
      }
      const accessId = await ensureResourceCustomerForCustomerResource(ctx, customerId, args.resourceId, { sourceType: "order" });
      access = await ctx.db.get(accessId);
    }

    if (!access || access.status !== "active") {
      return { ok: false, reason: "access_revoked" };
    }
    await ctx.db.patch(access._id, {
      downloadCount: access.downloadCount + 1,
      lastDownloadAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { ok: true, reason: "ok", url: resource.downloadUrl };
  },
  returns: downloadResultDoc,
});

export const listResourceCustomers = query({
  args: {
    resourceId: v.optional(v.id("resources")),
    status: v.optional(v.union(v.literal("active"), v.literal("revoked"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 200, 500);
    const rows = args.resourceId && args.status
      ? await ctx.db.query("resourceCustomers").withIndex("by_resourceId_and_status", (q) => q.eq("resourceId", args.resourceId!).eq("status", args.status!)).take(limit)
      : args.resourceId
        ? await ctx.db.query("resourceCustomers").withIndex("by_resourceId", (q) => q.eq("resourceId", args.resourceId!)).take(limit)
        : args.status
          ? await ctx.db.query("resourceCustomers").withIndex("by_status", (q) => q.eq("status", args.status!)).take(limit)
          : await ctx.db.query("resourceCustomers").order("desc").take(limit);

    const [customers, resources] = await Promise.all([
      Promise.all(rows.map((row) => ctx.db.get(row.customerId))),
      Promise.all(rows.map((row) => ctx.db.get(row.resourceId))),
    ]);

    return rows.map((row, index) => {
      const customer = customers[index];
      const resource = resources[index];
      return {
        accessId: row._id,
        customerEmail: customer?.email ?? "",
        customerId: row.customerId,
        customerName: customer?.name ?? "Khách hàng",
        customerPhone: customer?.phone ?? "",
        downloadCount: row.downloadCount,
        enrolledAt: row.enrolledAt,
        grantedAt: row.grantedAt,
        lastDownloadAt: row.lastDownloadAt,
        resourceId: row.resourceId,
        resourceTitle: resource?.title ?? "Tài nguyên",
        sourceOrderId: row.sourceOrderId,
        sourceType: row.sourceType,
        status: row.status,
      };
    });
  },
  returns: v.array(resourceCustomerAdminDoc),
});

export const listResourceCustomersAdmin = query({
  args: {
    resourceId: v.optional(v.id("resources")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("revoked"))),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = args.search?.trim() ? 2000 : (offset + limit + 1);

    let customersRelation: Doc<"resourceCustomers">[] = [];
    if (args.resourceId && args.status) {
      customersRelation = await ctx.db
        .query("resourceCustomers")
        .withIndex("by_resourceId_and_status", (q) => q.eq("resourceId", args.resourceId!).eq("status", args.status!))
        .take(fetchLimit);
    } else if (args.resourceId) {
      customersRelation = await ctx.db
        .query("resourceCustomers")
        .withIndex("by_resourceId", (q) => q.eq("resourceId", args.resourceId!))
        .take(fetchLimit);
    } else if (args.status) {
      customersRelation = await ctx.db
        .query("resourceCustomers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(fetchLimit);
    } else {
      customersRelation = await ctx.db.query("resourceCustomers").order("desc").take(fetchLimit);
    }

    // Fetch customer documents to filter by search
    const targetRelationsForCustomerFetch = args.search?.trim() ? customersRelation : customersRelation.slice(offset, offset + limit);
    const uniqueCustomerIds = Array.from(new Set(targetRelationsForCustomerFetch.map((c) => c.customerId)));
    const customers = await Promise.all(uniqueCustomerIds.map((id) => ctx.db.get(id)));
    const customerMap = new Map(customers.filter(Boolean).map((c) => [c!._id, c!]));

    let filteredRelations = customersRelation;
    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      filteredRelations = customersRelation.filter((relation) => {
        const customer = customerMap.get(relation.customerId);
        if (!customer) return false;
        return (
          customer.name.toLowerCase().includes(searchLower) ||
          (customer.email ?? "").toLowerCase().includes(searchLower) ||
          (customer.phone ?? "").toLowerCase().includes(searchLower)
        );
      });
    }

    const totalCount = filteredRelations.length;
    const page = filteredRelations.slice(offset, offset + limit);

    // Calculate stats on all matching customers (before slicing)
    const totalCustomers = filteredRelations.filter((c) => c.status === "active").length;
    const totalDownloads = filteredRelations.reduce((sum, c) => sum + (c.downloadCount || 0), 0);
    const averageDownloads = filteredRelations.length ? Math.round(totalDownloads / filteredRelations.length) : 0;

    const [resources, finalCustomers] = await Promise.all([
      Promise.all(Array.from(new Set(page.map((item) => item.resourceId))).map((id) => ctx.db.get(id))),
      Promise.all(Array.from(new Set(page.map((item) => item.customerId))).map((id) => ctx.db.get(id))),
    ]);

    const resourceMap = new Map(resources.filter(Boolean).map((r) => [r!._id, r!]));
    const finalCustomerMap = new Map(finalCustomers.filter(Boolean).map((c) => [c!._id, c!]));

    return {
      hasMore: filteredRelations.length > offset + limit,
      totalCount,
      stats: {
        totalCustomers,
        totalDownloads,
        averageDownloads,
      },
      items: page.map((row) => {
        const customer = finalCustomerMap.get(row.customerId);
        const resource = resourceMap.get(row.resourceId);
        return {
          customerEmail: customer?.email ?? "",
          customerId: row.customerId,
          customerName: customer?.name ?? "Khách hàng đã xóa",
          customerPhone: customer?.phone ?? "",
          downloadCount: row.downloadCount,
          enrolledAt: row.enrolledAt,
          grantedAt: row.grantedAt,
          lastDownloadAt: row.lastDownloadAt,
          resourceId: row.resourceId,
          resourceTitle: resource?.title ?? "Tài nguyên đã xóa",
          sourceOrderId: row.sourceOrderId,
          sourceType: row.sourceType,
          status: row.status,
          accessId: row._id,
        };
      }),
    };
  },
  returns: v.object({
    hasMore: v.boolean(),
    totalCount: v.number(),
    stats: v.object({
      totalCustomers: v.number(),
      totalDownloads: v.number(),
      averageDownloads: v.number(),
    }),
    items: v.array(resourceCustomerAdminDoc),
  }),
});

export const grantAccess = mutation({
  args: {
    customerId: v.id("customers"),
    resourceId: v.id("resources"),
  },
  handler: async (ctx, args) => {
    await ensureResourceCustomerForCustomerResource(ctx, args.customerId, args.resourceId, { sourceType: "manual" });
    return null;
  },
  returns: v.null(),
});

export const revokeAccess = mutation({
  args: { accessId: v.id("resourceCustomers") },
  handler: async (ctx, args) => {
    const access = await ctx.db.get(args.accessId);
    if (!access) {
      return null;
    }
    await ctx.db.patch(args.accessId, { status: "revoked", updatedAt: Date.now() });
    return null;
  },
  returns: v.null(),
});

export const removeAccess = mutation({
  args: { accessId: v.id("resourceCustomers") },
  handler: async (ctx, args) => {
    const access = await ctx.db.get(args.accessId);
    if (!access) {
      return null;
    }
    await ctx.db.delete(args.accessId);
    return null;
  },
  returns: v.null(),
});

export const activateAccess = mutation({
  args: { accessId: v.id("resourceCustomers") },
  handler: async (ctx, args) => {
    const access = await ctx.db.get(args.accessId);
    if (!access) {
      return null;
    }
    await ctx.db.patch(args.accessId, { status: "active", updatedAt: Date.now() });
    return null;
  },
  returns: v.null(),
});

export const duplicate = mutation({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) {
      throw new Error("Resource not found");
    }

    const buildCopiedName = (base: string, attempt: number) =>
      attempt <= 1 ? `${base} (copy)` : `${base} (copy ${attempt})`;
      
    let copiedTitle = "";
    for (let attempt = 1; attempt <= 100; attempt += 1) {
      const candidate = buildCopiedName(source.title, attempt);
      const existing = await ctx.db
        .query("resources")
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

    const additionalCategoryIds = await listResourceAdditionalCategoryIds(ctx, source._id, source.categoryId);
    const filterAssignments = await ctx.db
      .query("resourceFilterAssignments")
      .withIndex("by_resource", (q) => q.eq("resourceId", source._id))
      .collect();
    const filterValueIds = filterAssignments.map((a) => a.valueId);

    const newResourceId = await ctx.db.insert("resources", {
      categoryId: source.categoryId,
      comparePriceAmount: source.comparePriceAmount,
      content: source.content,
      downloadUrl: source.downloadUrl,
      excerpt: source.excerpt,
      featured: source.featured,
      htmlRender: source.htmlRender,
      images: source.images,
      imageStorageIds: source.imageStorageIds,
      isPriceVisible: source.isPriceVisible,
      markdownRender: source.markdownRender,
      metaDescription: source.metaDescription,
      metaTitle: source.metaTitle,
      order: await getNextOrder(ctx),
      priceAmount: source.priceAmount,
      priceNote: source.priceNote,
      pricingType: source.pricingType,
      publishedAt: source.status === "Published" ? Date.now() : undefined,
      renderType: source.renderType,
      slug: source.slug,
      status: source.status,
      thumbnail: source.thumbnail,
      thumbnailStorageId: source.thumbnailStorageId,
      title: copiedTitle,
      views: 0,
    });

    await Promise.all([
      syncResourceCategoryAssignments(ctx, newResourceId, source.categoryId, additionalCategoryIds),
      syncResourceFilterAssignments(ctx, newResourceId, filterValueIds),
      syncOwnerFilesAndCleanup(
        ctx,
        { ownerField: "media", ownerId: newResourceId, ownerTable: "resources", purpose: "resource-media" },
        [source.thumbnailStorageId, ...(source.imageStorageIds ?? [])]
      ),
    ]);

    const newResource = await ctx.db.get(newResourceId);
    if (!newResource) {
      throw new Error("Failed to duplicate resource");
    }
    return newResource;
  },
});
