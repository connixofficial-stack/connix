import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getExtensionFromMime } from "../lib/image/uploadNaming";
import { extractStorageUrlKey, hasFileReferences, removeFileReferencesForStorage } from "./lib/fileService";

const collectReferencedUrls = (value: unknown, acc: Set<string>) => {
  if (typeof value === "string" && /^https?:\/\//.test(value)) {
    acc.add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectReferencedUrls(item, acc));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) => collectReferencedUrls(item, acc));
  }
};

const valueMatchesStorage = (
  value: unknown,
  storageId: string,
  storageUrl: string | null
): boolean => {
  if (value === null || value === undefined) {return false;}
  if (typeof value === "string") {
    return value === storageId || Boolean(storageUrl && (value === storageUrl || value.includes(storageUrl)));
  }
  if (typeof value === "number" || typeof value === "boolean") {return false;}
  if (Array.isArray(value)) {
    return value.some(item => valueMatchesStorage(item, storageId, storageUrl));
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(item => valueMatchesStorage(item, storageId, storageUrl));
  }
  return false;
};

const getExtensionFromFilename = (filename: string) => {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1];
};

const resolveExtension = (filename: string, mimeType: string) => {
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
};

function getMediaTypeKey(mimeType: string): "image" | "video" | "document" | "other" {
  if (mimeType.startsWith("image/")) {return "image";}
  if (mimeType.startsWith("video/")) {return "video";}
  if (mimeType === "application/pdf" || mimeType.includes("document") || mimeType.includes("spreadsheet")) {
    return "document";
  }
  return "other";
}

type MediaStatsKey = "total" | "image" | "video" | "document" | "other";

const isStorageNotFoundError = (error: unknown) => (
  error instanceof Error
  && /storage id .+ not found/i.test(error.message)
);

async function updateMediaStats(
  ctx: MutationCtx,
  typeKey: MediaStatsKey,
  countDelta: number,
  sizeDelta: number
) {
  const existing = await ctx.db
    .query("mediaStats")
    .withIndex("by_key", q => q.eq("key", typeKey))
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

async function updateMediaFolder(ctx: MutationCtx, folder: string | undefined, countDelta: number) {
  if (!folder) {return;}
  const existing = await ctx.db
    .query("mediaFolders")
    .withIndex("by_name", q => q.eq("name", folder))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, {
      count: Math.max(0, existing.count + countDelta),
    });
  } else if (countDelta > 0) {
    await ctx.db.insert("mediaFolders", {
      count: countDelta,
      name: folder,
    });
  }
}

async function updateDeletedMediaCounters(ctx: MutationCtx, images: Doc<"images">[]) {
  const statsUpdates: Record<MediaStatsKey, { count: number; size: number }> = {
    document: { count: 0, size: 0 },
    image: { count: 0, size: 0 },
    other: { count: 0, size: 0 },
    total: { count: 0, size: 0 },
    video: { count: 0, size: 0 },
  };
  const folderUpdates: Record<string, number> = {};

  for (const image of images) {
    const typeKey = getMediaTypeKey(image.mimeType);
    statsUpdates.total.count += 1;
    statsUpdates.total.size += image.size;
    statsUpdates[typeKey].count += 1;
    statsUpdates[typeKey].size += image.size;
    if (image.folder) {
      folderUpdates[image.folder] = (folderUpdates[image.folder] ?? 0) + 1;
    }
  }

  for (const key of Object.keys(statsUpdates) as MediaStatsKey[]) {
    const update = statsUpdates[key];
    if (update.count > 0) {
      await updateMediaStats(ctx, key, -update.count, -update.size);
    }
  }

  for (const [folder, count] of Object.entries(folderUpdates)) {
    await updateMediaFolder(ctx, folder, -count);
  }
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return  ctx.storage.generateUploadUrl();
  },
  returns: v.string(),
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return  ctx.storage.getUrl(args.storageId);
  },
  returns: v.union(v.string(), v.null()),
});

export const saveImage = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    alt: v.optional(v.string()),
    folder: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const extension = resolveExtension(args.filename, args.mimeType);
    const url = await ctx.storage.getUrl(args.storageId);
    const urlStorageKey = extractStorageUrlKey(url);
    const id = await ctx.db.insert("images", {
      storageId: args.storageId,
      filename: args.filename,
      extension,
      mimeType: args.mimeType,
      size: args.size,
      width: args.width,
      height: args.height,
      alt: args.alt,
      folder: args.folder,
      ...(urlStorageKey ? { urlStorageKey } : {}),
    });
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

export const deleteImage = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    if (await hasFileReferences(ctx, args.storageId)) {
      throw new Error("File đang được sử dụng");
    }

    // Harden delete check giống cleanupStorageIfUnreferenced
    const maxScan = 1000;
    const products = await ctx.db.query("products").take(maxScan);
    const posts = await ctx.db.query("posts").take(maxScan);
    const services = await ctx.db.query("services").take(maxScan);
    const courses = await ctx.db.query("courses").take(maxScan);
    const projects = await ctx.db.query("projects").take(maxScan);
    const settings = await ctx.db.query("settings").take(maxScan);
    const homeComponents = await ctx.db.query("homeComponents").take(maxScan);
    const storageUrl = await ctx.storage.getUrl(args.storageId);
    const storageIdValue = args.storageId as string;

    const isUsedInProducts = products.some((product) =>
      valueMatchesStorage(product.imageStorageId, storageIdValue, storageUrl)
      || valueMatchesStorage(product.imageStorageIds, storageIdValue, storageUrl)
      || valueMatchesStorage(product.image, storageIdValue, storageUrl)
      || valueMatchesStorage(product.images, storageIdValue, storageUrl)
      || valueMatchesStorage(product.description, storageIdValue, storageUrl)
      || valueMatchesStorage(product.markdownRender, storageIdValue, storageUrl)
      || valueMatchesStorage(product.htmlRender, storageIdValue, storageUrl)
    );
    const isUsedInPosts = posts.some((post) =>
      valueMatchesStorage(post.thumbnailStorageId, storageIdValue, storageUrl)
      || valueMatchesStorage(post.thumbnail, storageIdValue, storageUrl)
      || valueMatchesStorage(post.content, storageIdValue, storageUrl)
      || valueMatchesStorage(post.markdownRender, storageIdValue, storageUrl)
      || valueMatchesStorage(post.htmlRender, storageIdValue, storageUrl)
    );
    const isUsedInServices = services.some((service) =>
      valueMatchesStorage(service.thumbnailStorageId, storageIdValue, storageUrl)
      || valueMatchesStorage(service.thumbnail, storageIdValue, storageUrl)
      || valueMatchesStorage(service.content, storageIdValue, storageUrl)
      || valueMatchesStorage(service.markdownRender, storageIdValue, storageUrl)
      || valueMatchesStorage(service.htmlRender, storageIdValue, storageUrl)
    );
    const isUsedInCourses = courses.some((course) =>
      valueMatchesStorage(course.thumbnailStorageId, storageIdValue, storageUrl)
      || valueMatchesStorage(course.thumbnail, storageIdValue, storageUrl)
      || valueMatchesStorage(course.content, storageIdValue, storageUrl)
      || valueMatchesStorage(course.markdownRender, storageIdValue, storageUrl)
      || valueMatchesStorage(course.htmlRender, storageIdValue, storageUrl)
    );
    const isUsedInProjects = projects.some((project) =>
      valueMatchesStorage(project.thumbnailStorageId, storageIdValue, storageUrl)
      || valueMatchesStorage(project.imageStorageIds, storageIdValue, storageUrl)
      || valueMatchesStorage(project.thumbnail, storageIdValue, storageUrl)
      || valueMatchesStorage(project.images, storageIdValue, storageUrl)
      || valueMatchesStorage(project.content, storageIdValue, storageUrl)
      || valueMatchesStorage(project.markdownRender, storageIdValue, storageUrl)
      || valueMatchesStorage(project.htmlRender, storageIdValue, storageUrl)
    );
    const isUsedInSettings = settings.some((setting) => valueMatchesStorage(setting.value, storageIdValue, storageUrl));
    const isUsedInHomeComponents = homeComponents.some((component) =>
      valueMatchesStorage(component.config, storageIdValue, storageUrl)
    );

    if (isUsedInProducts || isUsedInPosts || isUsedInServices || isUsedInCourses || isUsedInProjects || isUsedInSettings || isUsedInHomeComponents) {
      throw new Error("File đang được sử dụng bởi một thành phần khác");
    }

    await ctx.storage.delete(args.storageId);
    
    // Delete from images table if exists
    const image = await ctx.db
      .query("images")
      .withIndex("by_storageId", q => q.eq("storageId", args.storageId))
      .first();
    if (image) {
      await ctx.db.delete(image._id);
      const typeKey = getMediaTypeKey(image.mimeType);
      await updateMediaStats(ctx, "total", -1, -image.size);
      await updateMediaStats(ctx, typeKey, -1, -image.size);
      await updateMediaFolder(ctx, image.folder, -1);
    }
    await removeFileReferencesForStorage(ctx, args.storageId);
    
    return null;
  },
  returns: v.null(),
});

export const cleanupStorageIfUnreferenced = mutation({
  args: { storageId: v.id("_storage"), maxScan: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (await hasFileReferences(ctx, args.storageId)) {
      return { deleted: false, reason: "referenced" as const };
    }

    const maxScan = args.maxScan ?? 1000;
    const products = await ctx.db.query("products").take(maxScan);
    const posts = await ctx.db.query("posts").take(maxScan);
    const services = await ctx.db.query("services").take(maxScan);
    const courses = await ctx.db.query("courses").take(maxScan);
    const projects = await ctx.db.query("projects").take(maxScan);
    const settings = await ctx.db.query("settings").take(maxScan);
    const homeComponents = await ctx.db.query("homeComponents").take(maxScan);
    const storageUrl = await ctx.storage.getUrl(args.storageId);
    const storageIdValue = args.storageId as string;

    const hitScanLimit = products.length === maxScan
      || posts.length === maxScan
      || services.length === maxScan
      || courses.length === maxScan
      || projects.length === maxScan
      || settings.length === maxScan
      || homeComponents.length === maxScan;
    if (hitScanLimit) {
      return { deleted: false, reason: "scan_limit" as const };
    }

    const isUsedInProducts = products.some((product) =>
      valueMatchesStorage(product.imageStorageId, storageIdValue, storageUrl)
      || valueMatchesStorage(product.imageStorageIds, storageIdValue, storageUrl)
      || valueMatchesStorage(product.image, storageIdValue, storageUrl)
      || valueMatchesStorage(product.images, storageIdValue, storageUrl)
      || valueMatchesStorage(product.description, storageIdValue, storageUrl)
      || valueMatchesStorage(product.markdownRender, storageIdValue, storageUrl)
      || valueMatchesStorage(product.htmlRender, storageIdValue, storageUrl)
    );
    const isUsedInPosts = posts.some((post) =>
      valueMatchesStorage(post.thumbnailStorageId, storageIdValue, storageUrl)
      || valueMatchesStorage(post.thumbnail, storageIdValue, storageUrl)
      || valueMatchesStorage(post.content, storageIdValue, storageUrl)
      || valueMatchesStorage(post.markdownRender, storageIdValue, storageUrl)
      || valueMatchesStorage(post.htmlRender, storageIdValue, storageUrl)
    );
    const isUsedInServices = services.some((service) =>
      valueMatchesStorage(service.thumbnailStorageId, storageIdValue, storageUrl)
      || valueMatchesStorage(service.thumbnail, storageIdValue, storageUrl)
      || valueMatchesStorage(service.content, storageIdValue, storageUrl)
      || valueMatchesStorage(service.markdownRender, storageIdValue, storageUrl)
      || valueMatchesStorage(service.htmlRender, storageIdValue, storageUrl)
    );
    const isUsedInCourses = courses.some((course) =>
      valueMatchesStorage(course.thumbnailStorageId, storageIdValue, storageUrl)
      || valueMatchesStorage(course.thumbnail, storageIdValue, storageUrl)
      || valueMatchesStorage(course.content, storageIdValue, storageUrl)
      || valueMatchesStorage(course.markdownRender, storageIdValue, storageUrl)
      || valueMatchesStorage(course.htmlRender, storageIdValue, storageUrl)
    );
    const isUsedInProjects = projects.some((project) =>
      valueMatchesStorage(project.thumbnailStorageId, storageIdValue, storageUrl)
      || valueMatchesStorage(project.imageStorageIds, storageIdValue, storageUrl)
      || valueMatchesStorage(project.thumbnail, storageIdValue, storageUrl)
      || valueMatchesStorage(project.images, storageIdValue, storageUrl)
      || valueMatchesStorage(project.content, storageIdValue, storageUrl)
      || valueMatchesStorage(project.markdownRender, storageIdValue, storageUrl)
      || valueMatchesStorage(project.htmlRender, storageIdValue, storageUrl)
    );
    const isUsedInSettings = settings.some((setting) => valueMatchesStorage(setting.value, storageIdValue, storageUrl));
    const isUsedInHomeComponents = homeComponents.some((component) =>
      valueMatchesStorage(component.config, storageIdValue, storageUrl)
    );

    if (isUsedInProducts || isUsedInPosts || isUsedInServices || isUsedInCourses || isUsedInProjects || isUsedInSettings || isUsedInHomeComponents) {
      return { deleted: false, reason: "referenced" as const };
    }

    let storageMissing = false;
    try {
      await ctx.storage.delete(args.storageId);
    } catch (error) {
      if (!isStorageNotFoundError(error)) {
        throw error;
      }
      storageMissing = true;
    }
    const image = await ctx.db
      .query("images")
      .withIndex("by_storageId", q => q.eq("storageId", args.storageId))
      .first();
    if (image) {
      await ctx.db.delete(image._id);
      const typeKey = getMediaTypeKey(image.mimeType);
      await updateMediaStats(ctx, "total", -1, -image.size);
      await updateMediaStats(ctx, typeKey, -1, -image.size);
      await updateMediaFolder(ctx, image.folder, -1);
    }
    await removeFileReferencesForStorage(ctx, args.storageId);

    return { deleted: true, reason: storageMissing ? "missing_storage" as const : "deleted" as const };
  },
  returns: v.object({
    deleted: v.boolean(),
    reason: v.union(v.literal("deleted"), v.literal("referenced"), v.literal("scan_limit"), v.literal("missing_storage")),
  }),
});

// QA-HIGH-006 FIX: Add limit to prevent fetching ALL images
export const listByFolder = query({
  args: { folder: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxLimit = args.limit ?? 100; // Default max 100
    const images = args.folder
      ? await ctx.db.query("images").withIndex("by_folder", q => q.eq("folder", args.folder)).take(maxLimit)
      : await ctx.db.query("images").take(maxLimit);
    
    const result = await Promise.all(
      images.map(async (img) => ({
        _id: img._id,
        storageId: img.storageId,
        filename: img.filename,
        mimeType: img.mimeType,
        size: img.size,
        url: await ctx.storage.getUrl(img.storageId),
      }))
    );
    
    return result;
  },
  returns: v.array(v.object({
    _id: v.id("images"),
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    url: v.union(v.string(), v.null()),
  })),
});

// QA-HIGH-006 FIX: Cleanup orphaned images with batch processing and limits
export const cleanupOrphanedImages = mutation({
  args: { folder: v.string(), batchSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxBatch = args.batchSize ?? 50; // Process in batches to avoid timeout
    const images = await ctx.db
      .query("images")
      .withIndex("by_folder", q => q.eq("folder", args.folder))
      .take(maxBatch);
    
    if (images.length === 0) {
      return { deleted: 0, hasMore: false };
    }
    
    // Pre-fetch all URLs in parallel
    const imageUrls = await Promise.all(
      images.map(async (img) => ({
        image: img,
        url: await ctx.storage.getUrl(img.storageId),
      }))
    );
    
    // Pre-fetch posts/products once (not per image!)
    let posts: { thumbnail?: string; content: string }[] = [];
    let products: { image?: string; images?: string[]; description?: string }[] = [];
    
    if (args.folder === "posts" || args.folder === "posts-content") {
      posts = await ctx.db.query("posts").take(500);
    }
    if (args.folder === "products" || args.folder === "products-content") {
      products = await ctx.db.query("products").take(500);
    }
    
    // Find orphaned images
    const toDelete: typeof images = [];
    for (const { image, url } of imageUrls) {
      if (!url) continue;
      
      let isUsed = false;
      
      if (args.folder === "posts" || args.folder === "posts-content") {
        isUsed = posts.some(post => 
          post.thumbnail === url || (post.content && post.content.includes(url))
        );
      }
      
      if (args.folder === "products" || args.folder === "products-content") {
        isUsed = isUsed || products.some(product => 
          product.image === url || 
          (product.images && product.images.includes(url)) ||
          (product.description && product.description.includes(url))
        );
      }
      
      if (!isUsed) {
        toDelete.push(image);
      }
    }
    
    // Batch delete
    await Promise.all(toDelete.map(async (image) => {
      await ctx.storage.delete(image.storageId);
      await ctx.db.delete(image._id);
    }));
    await updateDeletedMediaCounters(ctx, toDelete);
    
    // Check if there are more images to process
    const remaining = await ctx.db
      .query("images")
      .withIndex("by_folder", q => q.eq("folder", args.folder))
      .first();
    
    return { deleted: toDelete.length, hasMore: remaining !== null };
  },
  returns: v.object({ deleted: v.number(), hasMore: v.boolean() }),
});

// Cleanup settings images - compare with used URLs from settings
export const cleanupSettingsImages = mutation({
  args: { usedUrls: v.array(v.string()) },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("images")
      .withIndex("by_folder", q => q.eq("folder", "settings"))
      .take(100);

    if (images.length === 0) {
      return { deleted: 0 };
    }

    // Get URLs for all images
    const imageUrls = await Promise.all(
      images.map(async (img) => ({
        image: img,
        url: await ctx.storage.getUrl(img.storageId),
      }))
    );

    // Find orphaned images (not in usedUrls)
    const usedUrlSet = new Set(args.usedUrls);
    const toDelete = imageUrls.filter(({ url }) => url && !usedUrlSet.has(url));

    // Delete orphaned images
    await Promise.all(toDelete.map(async ({ image }) => {
      await ctx.storage.delete(image.storageId);
      await ctx.db.delete(image._id);
    }));
    await updateDeletedMediaCounters(ctx, toDelete.map(({ image }) => image));

    return { deleted: toDelete.length };
  },
  returns: v.object({ deleted: v.number() }),
});

// Cleanup home-components images - compare with used URLs from homeComponents table
export const cleanupHomeComponentImages = mutation({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxBatch = args.batchSize ?? 50;
    
    // Get images in home-components folder
    const images = await ctx.db
      .query("images")
      .withIndex("by_folder", q => q.eq("folder", "home-components"))
      .take(maxBatch);

    if (images.length === 0) {
      return { deleted: 0, hasMore: false };
    }

    // Get URLs for all images
    const imageUrls = await Promise.all(
      images.map(async (img) => ({
        image: img,
        url: await ctx.storage.getUrl(img.storageId),
      }))
    );

    // Get all home components configs to find used images
    const homeComponents = await ctx.db.query("homeComponents").take(500);
    
    // Extract all used image URLs from configs
    const usedUrls = new Set<string>();
    for (const component of homeComponents) {
      collectReferencedUrls(component.config, usedUrls);
    }

    // Find orphaned images
    const toDelete = imageUrls.filter(({ image, url }) =>
      url
      && !usedUrls.has(url)
      && !homeComponents.some(component => valueMatchesStorage(component.config, image.storageId as string, url))
    );

    // Delete orphaned images
    const deletedImages: Doc<"images">[] = [];
    for (const { image } of toDelete) {
      if (await hasFileReferences(ctx, image.storageId)) {
        continue;
      }
      await ctx.storage.delete(image.storageId);
      await ctx.db.delete(image._id);
      deletedImages.push(image);
    }
    await updateDeletedMediaCounters(ctx, deletedImages);

    // Check if there are more images to process
    const remaining = await ctx.db
      .query("images")
      .withIndex("by_folder", q => q.eq("folder", "home-components"))
      .first();

    return { deleted: deletedImages.length, hasMore: remaining !== null };
  },
  returns: v.object({ deleted: v.number(), hasMore: v.boolean() }),
});

export const cleanupImportedBinOrphans = mutation({
  args: {
    folders: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const images = await ctx.db.query("images").take(5000);
    const candidates = images.filter((image) => {
      const isBinExt = image.extension === "bin";
      const isBinName = image.filename.toLowerCase().endsWith(".bin");
      const inFolder = !args.folders || args.folders.length === 0 || args.folders.includes(image.folder ?? "");
      return inFolder && (isBinExt || isBinName);
    });

    if (candidates.length === 0) {
      return { deleted: 0 };
    }

    const urls = await Promise.all(candidates.map(async (image) => ({
      image,
      url: await ctx.storage.getUrl(image.storageId),
    })));

    const referencedUrls = new Set<string>();
    const [settings, homeComponents] = await Promise.all([
      ctx.db.query("settings").take(5000),
      ctx.db.query("homeComponents").take(5000),
    ]);

    settings.forEach((item) => collectReferencedUrls(item.value, referencedUrls));
    homeComponents.forEach((item) => collectReferencedUrls(item.config, referencedUrls));

    const toDelete: typeof urls = [];
    for (const item of urls) {
      const storageId = item.image.storageId as string;
      const referencedByConfig = settings.some(setting => valueMatchesStorage(setting.value, storageId, item.url))
        || homeComponents.some(component => valueMatchesStorage(component.config, storageId, item.url));
      if (!item.url || referencedUrls.has(item.url) || referencedByConfig || await hasFileReferences(ctx, item.image.storageId)) {
        continue;
      }
      toDelete.push(item);
    }
    await Promise.all(toDelete.map(async ({ image }) => {
      await ctx.storage.delete(image.storageId);
      await ctx.db.delete(image._id);
    }));
    await updateDeletedMediaCounters(ctx, toDelete.map(({ image }) => image));

    return { deleted: toDelete.length };
  },
  returns: v.object({ deleted: v.number() }),
});
