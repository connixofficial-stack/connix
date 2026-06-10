import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getExtensionFromMime } from "../lib/image/uploadNaming";
import { extractStorageUrlKey, listFileUsagesByStorageId, removeFileReferencesForStorage } from "./lib/fileService";

// ============ VALIDATORS ============
const mediaUsage = v.object({
  field: v.string(),
  label: v.optional(v.string()),
  recordId: v.string(),
  table: v.string(),
});

const mediaDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("images"),
  alt: v.optional(v.string()),
  extension: v.optional(v.string()),
  filename: v.string(),
  folder: v.optional(v.string()),
  height: v.optional(v.number()),
  isOrphan: v.optional(v.boolean()),
  mimeType: v.string(),
  size: v.number(),
  storageId: v.id("_storage"),
  uploadedBy: v.optional(v.id("users")),
  usageCheckedAt: v.optional(v.number()),
  usageCount: v.optional(v.number()),
  urlStorageKey: v.optional(v.string()),
  usages: v.optional(v.array(mediaUsage)),
  width: v.optional(v.number()),
});

const mediaWithUrl = v.object({
  _creationTime: v.number(),
  _id: v.id("images"),
  alt: v.optional(v.string()),
  extension: v.optional(v.string()),
  filename: v.string(),
  folder: v.optional(v.string()),
  height: v.optional(v.number()),
  isOrphan: v.optional(v.boolean()),
  mimeType: v.string(),
  size: v.number(),
  storageId: v.id("_storage"),
  uploadedBy: v.optional(v.id("users")),
  url: v.union(v.string(), v.null()),
  usageCheckedAt: v.optional(v.number()),
  usageCount: v.optional(v.number()),
  urlStorageKey: v.optional(v.string()),
  usages: v.optional(v.array(mediaUsage)),
  width: v.optional(v.number()),
});

type MediaUsage = {
  field: string;
  label?: string;
  recordId: string;
  table: string;
};

const MAX_USAGE_SCAN_PER_TABLE = 3;
const MEDIA_STAT_KEYS = ["total", "image", "video", "document", "other"] as const;
type MediaStatsKey = typeof MEDIA_STAT_KEYS[number];

// ============ HELPER FUNCTIONS ============

// Get media type key from mimeType
function getMediaTypeKey(mimeType: string): "image" | "video" | "document" | "other" {
  if (mimeType.startsWith("image/")) {return "image";}
  if (mimeType.startsWith("video/")) {return "video";}
  if (mimeType === "application/pdf" || mimeType.includes("document") || mimeType.includes("spreadsheet")) {
    return "document";
  }
  return "other";
}

function getExtensionFromFilename(filename: string): string | undefined {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1];
}

function resolveExtension(filename: string, mimeType: string): string {
  const byName = getExtensionFromFilename(filename);
  if (byName) {
    return byName;
  }
  const ext = getExtensionFromMime(mimeType);
  if (ext !== "bin") {
    return ext;
  }
  const fallback = mimeType.split("/")[1];
  if (!fallback) {
    return "bin";
  }
  return fallback.replace("+xml", "").replace("jpeg", "jpg");
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) {return "";}
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function containsStorageId(value: unknown, storageId: string): boolean {
  if (value === null || value === undefined) {return false;}
  if (typeof value === "string") {return value === storageId;}
  if (typeof value === "number" || typeof value === "boolean") {return false;}
  if (Array.isArray(value)) {return value.some(item => containsStorageId(item, storageId));}
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(item => containsStorageId(item, storageId));
  }
  return false;
}

function containsUrl(value: unknown, url: string | null): boolean {
  if (!url || value === null || value === undefined) {return false;}
  if (typeof value === "string") {return value === url || value.includes(url);}
  if (typeof value === "number" || typeof value === "boolean") {return false;}
  if (Array.isArray(value)) {return value.some(item => containsUrl(item, url));}
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(item => containsUrl(item, url));
  }
  return false;
}

function addUsage(
  usages: MediaUsage[],
  table: string,
  record: { _id: unknown; name?: string; title?: string; key?: string; slug?: string; filename?: string },
  field: string
) {
  usages.push({
    field,
    label: record.name ?? record.title ?? record.key ?? record.slug ?? record.filename,
    recordId: normalizeValue(record._id),
    table,
  });
}

function trimUsageRecords<T>(records: T[], scanState: { complete: boolean }): T[] {
  if (records.length > MAX_USAGE_SCAN_PER_TABLE) {
    scanState.complete = false;
    return records.slice(0, MAX_USAGE_SCAN_PER_TABLE);
  }
  return records;
}


function addUsageToMap(
  usageMap: Map<string, MediaUsage[]>,
  mediaId: string,
  table: string,
  record: { _id: unknown; name?: string; title?: string; key?: string; slug?: string; filename?: string },
  field: string
) {
  const usages = usageMap.get(mediaId) ?? [];
  addUsage(usages, table, record, field);
  usageMap.set(mediaId, usages);
}

function collectUsageMatches(
  usageMap: Map<string, MediaUsage[]>,
  candidates: { id: string; storageId: string; url: string | null }[],
  table: string,
  record: { _id: unknown; name?: string; title?: string; key?: string; slug?: string; filename?: string },
  field: string,
  value: unknown
) {
  candidates.forEach(candidate => {
    if (containsUrl(value, candidate.url) || containsStorageId(value, candidate.storageId)) {
      addUsageToMap(usageMap, candidate.id, table, record, field);
    }
  });
}

async function resolveMediaUsageMap(
  ctx: QueryCtx | MutationCtx,
  mediaItems: { _id: unknown; storageId: unknown }[],
  urlsById: Map<string, string | null>,
  options?: { fullScan?: boolean }
): Promise<{ scanComplete: boolean; usageMap: Map<string, MediaUsage[]> }> {
  const usageMap = new Map<string, MediaUsage[]>();
  const scanState = { complete: true };
  const fullScan = options?.fullScan ?? false;
  const candidates = mediaItems.map(media => {
    const id = normalizeValue(media._id);
    usageMap.set(id, []);
    return { id, storageId: normalizeValue(media.storageId), rawStorageId: media.storageId, url: urlsById.get(id) ?? null };
  });

  if (candidates.length === 0) {return { scanComplete: true, usageMap };}

  // 1. Scan fileReferences (Source of Truth for Modern Usages)
  for (const candidate of candidates) {
    if (candidate.rawStorageId) {
      const references = fullScan 
        ? await ctx.db.query("fileReferences").withIndex("by_storageId", q => q.eq("storageId", candidate.rawStorageId as any)).collect()
        : await ctx.db.query("fileReferences").withIndex("by_storageId", q => q.eq("storageId", candidate.rawStorageId as any)).take(MAX_USAGE_SCAN_PER_TABLE + 1);
        
      const trimmedRefs = trimUsageRecords(references, scanState);
      const usages = usageMap.get(candidate.id) ?? [];
      for (const ref of trimmedRefs) {
        let record = null;
        let isConvexId = false;
        try {
          const normalizedId = ctx.db.normalizeId(ref.ownerTable as any, ref.ownerId);
          if (normalizedId) {
            isConvexId = true;
            record = await ctx.db.get(normalizedId);
          }
        } catch {
          // Ignore invalid table names
        }

        if (isConvexId && !record) {
          // Orphaned reference, skip
          continue;
        }

        if (record) {
          addUsageToMap(usageMap, candidate.id, ref.ownerTable, record, ref.ownerField);
        } else {
          usages.push({
            field: ref.ownerField,
            label: ref.purpose ?? ref.ownerId,
            recordId: ref.ownerId,
            table: ref.ownerTable,
          });
        }
      }
      usageMap.set(candidate.id, usages);
    }
  }

  const users = fullScan ? await ctx.db.query("users").collect() : trimUsageRecords(await ctx.db.query("users").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  users.forEach(record => collectUsageMatches(usageMap, candidates, "users", record, "avatar", record.avatar));

  const customers = fullScan ? await ctx.db.query("customers").collect() : trimUsageRecords(await ctx.db.query("customers").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  customers.forEach(record => collectUsageMatches(usageMap, candidates, "customers", record, "avatar", record.avatar));

  const productCategories = fullScan ? await ctx.db.query("productCategories").collect() : trimUsageRecords(await ctx.db.query("productCategories").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  productCategories.forEach(record => collectUsageMatches(usageMap, candidates, "productCategories", record, "image", record.image));

  const products = fullScan ? await ctx.db.query("products").collect() : trimUsageRecords(await ctx.db.query("products").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  products.forEach(record => {
    collectUsageMatches(usageMap, candidates, "products", record, "imageStorageId", record.imageStorageId);
    collectUsageMatches(usageMap, candidates, "products", record, "imageStorageIds", record.imageStorageIds);
    collectUsageMatches(usageMap, candidates, "products", record, "image", record.image);
    collectUsageMatches(usageMap, candidates, "products", record, "images", record.images);
    collectUsageMatches(usageMap, candidates, "products", record, "description", record.description);
    collectUsageMatches(usageMap, candidates, "products", record, "markdownRender", record.markdownRender);
    collectUsageMatches(usageMap, candidates, "products", record, "htmlRender", record.htmlRender);
  });

  const productOptionValues = fullScan ? await ctx.db.query("productOptionValues").collect() : trimUsageRecords(await ctx.db.query("productOptionValues").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  productOptionValues.forEach(record => collectUsageMatches(usageMap, candidates, "productOptionValues", record, "image", record.image));

  const productVariants = fullScan ? await ctx.db.query("productVariants").collect() : trimUsageRecords(await ctx.db.query("productVariants").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  productVariants.forEach(record => {
    collectUsageMatches(usageMap, candidates, "productVariants", record, "image", record.image);
    collectUsageMatches(usageMap, candidates, "productVariants", record, "images", record.images);
  });

  const productSupplementalContents = fullScan ? await ctx.db.query("productSupplementalContents").collect() : trimUsageRecords(await ctx.db.query("productSupplementalContents").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  productSupplementalContents.forEach(record => {
    collectUsageMatches(usageMap, candidates, "productSupplementalContents", record, "preContent", record.preContent);
    collectUsageMatches(usageMap, candidates, "productSupplementalContents", record, "postContent", record.postContent);
  });

  const postCategories = fullScan ? await ctx.db.query("postCategories").collect() : trimUsageRecords(await ctx.db.query("postCategories").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  postCategories.forEach(record => collectUsageMatches(usageMap, candidates, "postCategories", record, "thumbnail", record.thumbnail));

  const posts = fullScan ? await ctx.db.query("posts").collect() : trimUsageRecords(await ctx.db.query("posts").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  posts.forEach(record => {
    collectUsageMatches(usageMap, candidates, "posts", record, "thumbnailStorageId", record.thumbnailStorageId);
    collectUsageMatches(usageMap, candidates, "posts", record, "thumbnail", record.thumbnail);
    collectUsageMatches(usageMap, candidates, "posts", record, "content", record.content);
    collectUsageMatches(usageMap, candidates, "posts", record, "markdownRender", record.markdownRender);
    collectUsageMatches(usageMap, candidates, "posts", record, "htmlRender", record.htmlRender);
  });

  const orders = fullScan ? await ctx.db.query("orders").collect() : trimUsageRecords(await ctx.db.query("orders").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  orders.forEach(record => collectUsageMatches(usageMap, candidates, "orders", record, "items.productImage", record.items));

  const cartItems = fullScan ? await ctx.db.query("cartItems").collect() : trimUsageRecords(await ctx.db.query("cartItems").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  cartItems.forEach(record => collectUsageMatches(usageMap, candidates, "cartItems", record, "productImage", record.productImage));

  const serviceCategories = fullScan ? await ctx.db.query("serviceCategories").collect() : trimUsageRecords(await ctx.db.query("serviceCategories").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  serviceCategories.forEach(record => collectUsageMatches(usageMap, candidates, "serviceCategories", record, "thumbnail", record.thumbnail));

  const services = fullScan ? await ctx.db.query("services").collect() : trimUsageRecords(await ctx.db.query("services").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  services.forEach(record => {
    collectUsageMatches(usageMap, candidates, "services", record, "thumbnailStorageId", record.thumbnailStorageId);
    collectUsageMatches(usageMap, candidates, "services", record, "thumbnail", record.thumbnail);
    collectUsageMatches(usageMap, candidates, "services", record, "content", record.content);
    collectUsageMatches(usageMap, candidates, "services", record, "markdownRender", record.markdownRender);
    collectUsageMatches(usageMap, candidates, "services", record, "htmlRender", record.htmlRender);
  });

  const courseCategories = fullScan ? await ctx.db.query("courseCategories").collect() : trimUsageRecords(await ctx.db.query("courseCategories").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  courseCategories.forEach(record => collectUsageMatches(usageMap, candidates, "courseCategories", record, "thumbnail", record.thumbnail));

  const courses = fullScan ? await ctx.db.query("courses").collect() : trimUsageRecords(await ctx.db.query("courses").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  courses.forEach(record => {
    collectUsageMatches(usageMap, candidates, "courses", record, "thumbnailStorageId", record.thumbnailStorageId);
    collectUsageMatches(usageMap, candidates, "courses", record, "thumbnail", record.thumbnail);
    collectUsageMatches(usageMap, candidates, "courses", record, "content", record.content);
    collectUsageMatches(usageMap, candidates, "courses", record, "markdownRender", record.markdownRender);
    collectUsageMatches(usageMap, candidates, "courses", record, "htmlRender", record.htmlRender);
  });

  const projectCategories = fullScan ? await ctx.db.query("projectCategories").collect() : trimUsageRecords(await ctx.db.query("projectCategories").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  projectCategories.forEach(record => collectUsageMatches(usageMap, candidates, "projectCategories", record, "thumbnail", record.thumbnail));

  const projects = fullScan ? await ctx.db.query("projects").collect() : trimUsageRecords(await ctx.db.query("projects").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  projects.forEach(record => {
    collectUsageMatches(usageMap, candidates, "projects", record, "thumbnailStorageId", record.thumbnailStorageId);
    collectUsageMatches(usageMap, candidates, "projects", record, "imageStorageIds", record.imageStorageIds);
    collectUsageMatches(usageMap, candidates, "projects", record, "thumbnail", record.thumbnail);
    collectUsageMatches(usageMap, candidates, "projects", record, "images", record.images);
    collectUsageMatches(usageMap, candidates, "projects", record, "content", record.content);
    collectUsageMatches(usageMap, candidates, "projects", record, "markdownRender", record.markdownRender);
    collectUsageMatches(usageMap, candidates, "projects", record, "htmlRender", record.htmlRender);
  });

  const promotions = fullScan ? await ctx.db.query("promotions").collect() : trimUsageRecords(await ctx.db.query("promotions").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  promotions.forEach(record => {
    collectUsageMatches(usageMap, candidates, "promotions", record, "thumbnail", record.thumbnail);
    collectUsageMatches(usageMap, candidates, "promotions", record, "discountConfig", record.discountConfig);
  });

  const landingPages = fullScan ? await ctx.db.query("landingPages").collect() : trimUsageRecords(await ctx.db.query("landingPages").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  landingPages.forEach(record => {
    collectUsageMatches(usageMap, candidates, "landingPages", record, "heroImage", record.heroImage);
    collectUsageMatches(usageMap, candidates, "landingPages", record, "content", record.content);
  });

  const settings = fullScan ? await ctx.db.query("settings").collect() : trimUsageRecords(await ctx.db.query("settings").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  settings.forEach(record => collectUsageMatches(usageMap, candidates, "settings", record, "value", record.value));

  const homeComponents = fullScan ? await ctx.db.query("homeComponents").collect() : trimUsageRecords(await ctx.db.query("homeComponents").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  homeComponents.forEach(record => collectUsageMatches(usageMap, candidates, "homeComponents", record, "config", record.config));

  const homeComponentSnapshotPayloads = fullScan ? await ctx.db.query("homeComponentSnapshotPayloads").collect() : trimUsageRecords(await ctx.db.query("homeComponentSnapshotPayloads").take(MAX_USAGE_SCAN_PER_TABLE + 1), scanState);
  homeComponentSnapshotPayloads.forEach(record => collectUsageMatches(usageMap, candidates, "homeComponentSnapshotPayloads", record, "payload", record.payload));

  return { scanComplete: scanState.complete, usageMap };
}

// Update mediaStats counter (increment or decrement)
async function updateMediaStats(
  ctx: MutationCtx,
  typeKey: MediaStatsKey,
  countDelta: number,
  sizeDelta: number
) {
  const existing = await ctx.db
    .query("mediaStats")
    .withIndex("by_key", (q) => q.eq("key", typeKey))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, {
      count: Math.max(0, existing.count + countDelta),
      totalSize: Math.max(0, existing.totalSize + sizeDelta),
    });
  } else if (countDelta > 0) {
    await ctx.db.insert("mediaStats", {
      count: countDelta,
      key: typeKey,
      totalSize: sizeDelta,
    });
  }
}

// Update mediaFolders counter
async function updateMediaFolder(
  ctx: MutationCtx,
  folderName: string | undefined,
  countDelta: number
) {
  if (!folderName) {return;}

  const existing = await ctx.db
    .query("mediaFolders")
    .withIndex("by_name", (q) => q.eq("name", folderName))
    .first();

  if (existing) {
    const newCount = existing.count + countDelta;
    if (newCount <= 0) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.patch(existing._id, { count: newCount });
    }
  } else if (countDelta > 0) {
    await ctx.db.insert("mediaFolders", { count: countDelta, name: folderName });
  }
}

// ============ QUERIES ============

// List with pagination
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db.query("images").order("desc").paginate(args.paginationOpts),
  returns: v.any(),
});

export const listForBackfill = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db.query("images").order("desc").paginate(args.paginationOpts),
  returns: v.any(),
});

// List all (for System Config preview - limited)
export const listAll = query({
  args: {},
  handler: async (ctx) => ctx.db.query("images").order("desc").take(100),
  returns: v.array(mediaDoc),
});

// List with URLs (for Admin grid view)
export const listWithUrls = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const images = await ctx.db.query("images").order("desc").take(limit);
    
    return  Promise.all(
      images.map(async (img) => ({
        ...img,
        url: await ctx.storage.getUrl(img.storageId),
      }))
    );
  },
  returns: v.array(mediaWithUrl),
});

export const listWithUrlsAndUsage = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const images = await ctx.db.query("images").order("desc").take(limit);
    const urlsById = new Map<string, string | null>();
    await Promise.all(images.map(async (img) => {
      urlsById.set(normalizeValue(img._id), await ctx.storage.getUrl(img.storageId));
    }));
    const uncheckedImages = images.filter(img => img.usageCheckedAt === undefined);
    const { usageMap } = await resolveMediaUsageMap(ctx, uncheckedImages, urlsById);

    return images.map((img) => {
      const id = normalizeValue(img._id);
      const scannedUsages = usageMap.get(id) ?? [];
      const usages = img.usageCheckedAt === undefined ? scannedUsages : (img.usages ?? []);
      return {
        ...img,
        isOrphan: img.usageCheckedAt === undefined ? usages.length === 0 : img.isOrphan,
        usageCount: img.usageCheckedAt === undefined ? usages.length : img.usageCount,
        usages,
        url: urlsById.get(id) ?? null,
      };
    });
  },
  returns: v.array(v.any()),
});

export const listWithUrlsAndUsagePaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const result = await ctx.db.query("images").order("desc").paginate(args.paginationOpts);
    
    const urlsById = new Map<string, string | null>();
    await Promise.all(result.page.map(async (img) => {
      urlsById.set(normalizeValue(img._id), await ctx.storage.getUrl(img.storageId));
    }));
    const uncheckedImages = result.page.filter(img => img.usageCheckedAt === undefined);
    const { usageMap } = await resolveMediaUsageMap(ctx, uncheckedImages, urlsById);

    const enrichedPage = result.page.map((img) => {
      const id = normalizeValue(img._id);
      const scannedUsages = usageMap.get(id) ?? [];
      const usages = img.usageCheckedAt === undefined ? scannedUsages : (img.usages ?? []);
      return {
        ...img,
        isOrphan: img.usageCheckedAt === undefined ? usages.length === 0 : img.isOrphan,
        usageCount: img.usageCheckedAt === undefined ? usages.length : img.usageCount,
        usages,
        url: urlsById.get(id) ?? null,
      };
    });

    return {
      ...result,
      page: enrichedPage,
    };
  },
  returns: v.any(),
});

export const recheckUsageForMedia = mutation({
  args: { ids: v.array(v.id("images")) },
  handler: async (ctx, args) => {
    const mediaItems = (await Promise.all(args.ids.map(id => ctx.db.get(id))))
      .filter((media): media is NonNullable<typeof media> => media !== null);
    const urlsById = new Map<string, string | null>();
    await Promise.all(mediaItems.map(async (media) => {
      urlsById.set(normalizeValue(media._id), await ctx.storage.getUrl(media.storageId));
    }));
    const { usageMap } = await resolveMediaUsageMap(ctx, mediaItems, urlsById, { fullScan: true });

    const checkedAt = Date.now();
    return Promise.all(mediaItems.map(async media => {
      const id = normalizeValue(media._id);
      const usages = usageMap.get(id) ?? [];
      const usageResult = {
        isOrphan: usages.length === 0,
        usageCheckedAt: checkedAt,
        usageCount: usages.length,
        usages,
      };
      await ctx.db.patch(media._id, usageResult);
      return {
        id,
        ...usageResult,
      };
    }));
  },
  returns: v.array(v.object({
    id: v.string(),
    isOrphan: v.boolean(),
    usageCheckedAt: v.number(),
    usageCount: v.number(),
    usages: v.array(mediaUsage),
  })),
});

// Get by ID
export const getById = query({
  args: { id: v.id("images") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(mediaDoc, v.null()),
});

// Get by ID with URL
export const getByIdWithUrl = query({
  args: { id: v.id("images") },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.id);
    if (!image) {return null;}
    const url = await ctx.storage.getUrl(image.storageId);
    return { ...image, url };
  },
  returns: v.union(mediaWithUrl, v.null()),
});

// List by folder with pagination
export const listByFolder = query({
  args: { folder: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
      .query("images")
      .withIndex("by_folder", (q) => q.eq("folder", args.folder))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(mediaDoc),
  }),
});

// List by mimeType with pagination
export const listByMimeType = query({
  args: { mimeType: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
      .query("images")
      .withIndex("by_mimeType", (q) => q.eq("mimeType", args.mimeType))
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(mediaDoc),
  }),
});

// List by uploader
export const listByUploader = query({
  args: { paginationOpts: paginationOptsValidator, uploadedBy: v.id("users") },
  handler: async (ctx, args) => ctx.db
      .query("images")
      .withIndex("by_uploadedBy", (q) => q.eq("uploadedBy", args.uploadedBy))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(mediaDoc),
  }),
});

// Get URL from storageId
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => ctx.storage.getUrl(args.storageId),
  returns: v.union(v.string(), v.null()),
});

// Get all folders (optimized - reads from mediaFolders table)
export const getFolders = query({
  args: {},
  handler: async (ctx) => {
    const folders = await ctx.db.query("mediaFolders").take(500);
    return folders.map(f => f.name).sort();
  },
  returns: v.array(v.string()),
});

// Get statistics (optimized - reads from mediaStats counter table)
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const [total, image, video, document, other] = await Promise.all(
      MEDIA_STAT_KEYS.map(key => ctx.db
        .query("mediaStats")
        .withIndex("by_key", q => q.eq("key", key))
        .first())
    );

    return {
      documentCount: document?.count ?? 0,
      imageCount: image?.count ?? 0,
      otherCount: other?.count ?? 0,
      totalCount: total?.count ?? 0,
      totalSize: total?.totalSize ?? 0,
      videoCount: video?.count ?? 0,
    };
  },
  returns: v.object({
    documentCount: v.number(),
    imageCount: v.number(),
    otherCount: v.number(),
    totalCount: v.number(),
    totalSize: v.number(),
    videoCount: v.number(),
  }),
});

// Count media (optimized - reads from counter tables)
export const count = query({
  args: { folder: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.folder) {
      const folderName = args.folder;
      const folderRecord = await ctx.db
        .query("mediaFolders")
        .withIndex("by_name", (q) => q.eq("name", folderName))
        .first();
      return folderRecord?.count ?? 0;
    }
    const totalStat = await ctx.db
      .query("mediaStats")
      .withIndex("by_key", (q) => q.eq("key", "total"))
      .first();
    return totalStat?.count ?? 0;
  },
  returns: v.number(),
});

// ============ MUTATIONS ============

// Generate upload URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
  returns: v.string(),
});

// Create media record
export const create = mutation({
  args: {
    alt: v.optional(v.string()),
    filename: v.string(),
    folder: v.optional(v.string()),
    height: v.optional(v.number()),
    mimeType: v.string(),
    size: v.number(),
    storageId: v.id("_storage"),
    uploadedBy: v.optional(v.id("users")),
    width: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const extension = resolveExtension(args.filename, args.mimeType);
    const url = await ctx.storage.getUrl(args.storageId);
    const urlStorageKey = extractStorageUrlKey(url);
    const id = await ctx.db.insert("images", {
      ...args,
      extension,
      ...(urlStorageKey ? { urlStorageKey } : {}),
    });

    // Update counters
    const typeKey = getMediaTypeKey(args.mimeType);
    await updateMediaStats(ctx, "total", 1, args.size);
    await updateMediaStats(ctx, typeKey, 1, args.size);
    await updateMediaFolder(ctx, args.folder, 1);

    return { id, url };
  },
  returns: v.object({
    id: v.id("images"),
    url: v.union(v.string(), v.null()),
  }),
});

export const patchExtension = mutation({
  args: {
    id: v.id("images"),
    extension: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { extension: args.extension });
    return null;
  },
  returns: v.null(),
});

// Update media metadata
export const update = mutation({
  args: {
    alt: v.optional(v.string()),
    filename: v.optional(v.string()),
    folder: v.optional(v.string()),
    id: v.id("images"),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const media = await ctx.db.get(id);
    if (!media) {throw new Error("Media not found");}
    
    // Filter out undefined values
    const filteredUpdates: Record<string, string> = {};
    if (updates.filename !== undefined) {filteredUpdates.filename = updates.filename;}
    if (updates.alt !== undefined) {filteredUpdates.alt = updates.alt;}
    if (updates.folder !== undefined) {filteredUpdates.folder = updates.folder;}
    
    // Update folder counter if folder changed
    if (updates.folder !== undefined && updates.folder !== media.folder) {
      await updateMediaFolder(ctx, media.folder, -1); // Decrement old folder
      await updateMediaFolder(ctx, updates.folder, 1);  // Increment new folder
    }
    
    await ctx.db.patch(id, filteredUpdates);
    return null;
  },
  returns: v.null(),
});

// Remove single media
export const remove = mutation({
  args: { id: v.id("images") },
  handler: async (ctx, args) => {
    const media = await ctx.db.get(args.id);
    if (!media) {throw new Error("Media not found");}
    const sourceOfTruthUsages = await listFileUsagesByStorageId(ctx, media.storageId);
    if (sourceOfTruthUsages.length > 0) {
      throw new Error("File đang được sử dụng");
    }
    
    try {
      await ctx.storage.delete(media.storageId);
    } catch {
      // Storage file might already be deleted
    }
    await removeFileReferencesForStorage(ctx, media.storageId);
    await ctx.db.delete(args.id);

    // Update counters
    const typeKey = getMediaTypeKey(media.mimeType);
    await updateMediaStats(ctx, "total", -1, -media.size);
    await updateMediaStats(ctx, typeKey, -1, -media.size);
    await updateMediaFolder(ctx, media.folder, -1);

    return null;
  },
  returns: v.null(),
});

// Bulk remove (optimized - batch load to avoid N+1)
export const bulkRemove = mutation({
  args: { ids: v.array(v.id("images")) },
  handler: async (ctx, args) => {
    // Batch load all media items (avoid N+1)
    const mediaItems = await Promise.all(args.ids.map( async id => ctx.db.get(id)));
    const validItems = mediaItems.filter((m): m is NonNullable<typeof m> => m !== null);

    // Aggregate counter updates
    type MediaStatsKey = "total" | "image" | "video" | "document" | "other";
    const statsUpdates: Record<MediaStatsKey, { count: number; size: number }> = {
      document: { count: 0, size: 0 },
      image: { count: 0, size: 0 },
      other: { count: 0, size: 0 },
      total: { count: 0, size: 0 },
      video: { count: 0, size: 0 },
    };
    const folderUpdates: Record<string, number> = {};

    // Delete items and aggregate stats
    for (const media of validItems) {
      const sourceOfTruthUsages = await listFileUsagesByStorageId(ctx, media.storageId);
      if (sourceOfTruthUsages.length > 0) {
        continue;
      }
      try {
        await ctx.storage.delete(media.storageId);
      } catch {
        // Storage file might already be deleted
      }
      await removeFileReferencesForStorage(ctx, media.storageId);
      await ctx.db.delete(media._id);

      // Aggregate counter changes
      const typeKey = getMediaTypeKey(media.mimeType);
      statsUpdates.total.count++;
      statsUpdates.total.size += media.size;
      statsUpdates[typeKey].count++;
      statsUpdates[typeKey].size += media.size;
      if (media.folder) {
        folderUpdates[media.folder] = (folderUpdates[media.folder] || 0) + 1;
      }
    }

    // Batch update mediaStats
    for (const key of Object.keys(statsUpdates) as MediaStatsKey[]) {
      const { count, size } = statsUpdates[key];
      if (count > 0) {
        await updateMediaStats(ctx, key, -count, -size);
      }
    }

    // Batch update mediaFolders
    for (const [folder, count] of Object.entries(folderUpdates)) {
      await updateMediaFolder(ctx, folder, -count);
    }

    return validItems.length;
  },
  returns: v.number(),
});

export const bulkRemoveOnlyOrphans = mutation({
  args: { ids: v.array(v.id("images")) },
  handler: async (ctx, args) => {
    const deleted: string[] = [];
    const skipped: { filename?: string; id: string; reason: string; usages: MediaUsage[] }[] = [];
    const mediaItems = (await Promise.all(args.ids.map(id => ctx.db.get(id))))
      .filter((media): media is NonNullable<typeof media> => media !== null);
    const mediaById = new Map(mediaItems.map(media => [normalizeValue(media._id), media]));
    const urlsById = new Map<string, string | null>();
    await Promise.all(mediaItems.map(async (media) => {
      urlsById.set(normalizeValue(media._id), await ctx.storage.getUrl(media.storageId));
    }));
    const { usageMap } = await resolveMediaUsageMap(ctx, mediaItems, urlsById, { fullScan: true });

    for (const id of args.ids) {
      const media = mediaById.get(normalizeValue(id));
      if (!media) {
        skipped.push({ id, reason: "Không tìm thấy media", usages: [] });
        continue;
      }
      const sourceOfTruthUsages = await listFileUsagesByStorageId(ctx, media.storageId);
      if (sourceOfTruthUsages.length > 0) {
        skipped.push({ filename: media.filename, id, reason: "File đang được sử dụng", usages: sourceOfTruthUsages });
        continue;
      }
      const usages = usageMap.get(normalizeValue(media._id)) ?? [];
      if (usages.length > 0) {
        skipped.push({ filename: media.filename, id, reason: "File đang được sử dụng", usages });
        continue;
      }

      try {
        await ctx.storage.delete(media.storageId);
      } catch {
        // Storage file might already be deleted.
      }
      await removeFileReferencesForStorage(ctx, media.storageId);

      await ctx.db.delete(media._id);
      const typeKey = getMediaTypeKey(media.mimeType);
      await updateMediaStats(ctx, "total", -1, -media.size);
      await updateMediaStats(ctx, typeKey, -1, -media.size);
      await updateMediaFolder(ctx, media.folder, -1);
      deleted.push(id);
    }

    return { deleted, skipped };
  },
  returns: v.object({
    deleted: v.array(v.string()),
    skipped: v.array(v.object({
      filename: v.optional(v.string()),
      id: v.string(),
      reason: v.string(),
      usages: v.array(v.object({
        field: v.string(),
        label: v.optional(v.string()),
        recordId: v.string(),
        table: v.string(),
      })),
    })),
  }),
});
