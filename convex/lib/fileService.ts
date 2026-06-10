import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { api } from "../_generated/api";

export type FileOwnerRef = {
  ownerField: string;
  ownerId: string;
  ownerTable: string;
  purpose?: string;
};

export type FileUsage = {
  field: string;
  label?: string;
  recordId: string;
  table: string;
};

export function extractStorageUrlKey(url?: string | null) {
  if (!url) {
    return null;
  }
  const marker = "/api/storage/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }
  return url.slice(markerIndex + marker.length).split("?")[0]?.split("#")[0]?.trim() || null;
}

export function normalizeStorageId(ctx: QueryCtx | MutationCtx, value: unknown): Id<"_storage"> | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  return ctx.db.system.normalizeId("_storage", value);
}

export function normalizeStorageIds(
  ctx: QueryCtx | MutationCtx,
  values: Array<string | null | undefined> | null | undefined
) {
  return values?.map(value => normalizeStorageId(ctx, value)).filter((value): value is Id<"_storage"> => Boolean(value)) ?? [];
}

export function dedupeNormalizedStorageIds(
  ctx: QueryCtx | MutationCtx,
  values: Array<string | null | undefined> | null | undefined
) {
  return Array.from(new Set(normalizeStorageIds(ctx, values)));
}

export function dedupeStorageIds(values: Array<Id<"_storage"> | null | undefined> | null | undefined) {
  return Array.from(new Set(values?.filter((value): value is Id<"_storage"> => Boolean(value)) ?? []));
}

export function isConvexManagedMediaUrl(url?: string | null) {
  return Boolean(url && (url.includes("convex.cloud") || url.includes("convex.site")));
}

export async function listFileUsagesByStorageId(
  ctx: QueryCtx | MutationCtx,
  storageId: Id<"_storage">
): Promise<FileUsage[]> {
  const references = await ctx.db
    .query("fileReferences")
    .withIndex("by_storageId", q => q.eq("storageId", storageId))
    .collect();

  const validUsages: FileUsage[] = [];
  for (const reference of references) {
    let isConvexId = false;
    let record = null;
    try {
      const normalizedId = ctx.db.normalizeId(reference.ownerTable as any, reference.ownerId);
      if (normalizedId) {
        isConvexId = true;
        record = await ctx.db.get(normalizedId);
      }
    } catch {}

    if (isConvexId && !record) {
      continue; // Orphaned reference
    }

    validUsages.push({
      field: reference.ownerField,
      recordId: reference.ownerId,
      table: reference.ownerTable,
    });
  }
  return validUsages;
}

export async function hasFileReferences(ctx: QueryCtx | MutationCtx, storageId: Id<"_storage">) {
  const usages = await listFileUsagesByStorageId(ctx, storageId);
  return usages.length > 0;
}

export async function removeFileReferencesForStorage(ctx: MutationCtx, storageId: Id<"_storage">) {
  const references = await ctx.db
    .query("fileReferences")
    .withIndex("by_storageId", q => q.eq("storageId", storageId))
    .collect();

  await Promise.all(references.map(reference => ctx.db.delete(reference._id)));
}

export async function removeOwnerFileReferences(
  ctx: MutationCtx,
  owner: Pick<FileOwnerRef, "ownerId" | "ownerTable">,
  options?: { previousStorageIds?: Array<string | null | undefined> }
) {
  const references = await ctx.db
    .query("fileReferences")
    .withIndex("by_owner", q => q.eq("ownerTable", owner.ownerTable).eq("ownerId", owner.ownerId))
    .collect();
  const removedStorageIds = new Set<Id<"_storage">>(references.map(reference => reference.storageId));

  const previousStorageIds = dedupeNormalizedStorageIds(ctx, options?.previousStorageIds);
  for (const storageId of previousStorageIds) {
    removedStorageIds.add(storageId);
  }

  await Promise.all(references.map(reference => ctx.db.delete(reference._id)));

  return { removedStorageIds: Array.from(removedStorageIds) };
}

export async function syncOwnerFileReferences(
  ctx: MutationCtx,
  owner: FileOwnerRef,
  storageIds: Array<string | null | undefined>,
  options?: { previousStorageIds?: Array<string | null | undefined> }
) {
  const now = Date.now();
  
  const validNextStorageIds = dedupeNormalizedStorageIds(ctx, storageIds);
  const validPreviousStorageIds = dedupeNormalizedStorageIds(ctx, options?.previousStorageIds);

  const nextStorageIds = new Set(validNextStorageIds);
  const existing = await ctx.db
    .query("fileReferences")
    .withIndex("by_owner_field", q =>
      q.eq("ownerTable", owner.ownerTable).eq("ownerId", owner.ownerId).eq("ownerField", owner.ownerField)
    )
    .collect();
  const existingStorageIds = new Set(existing.map(reference => reference.storageId));
  const removedStorageIds = new Set<Id<"_storage">>();

  for (const reference of existing) {
    if (!nextStorageIds.has(reference.storageId)) {
      removedStorageIds.add(reference.storageId);
      await ctx.db.delete(reference._id);
    }
  }

  for (const storageId of validPreviousStorageIds) {
    if (!nextStorageIds.has(storageId)) {
      removedStorageIds.add(storageId);
    }
  }

  await Promise.all(
    Array.from(nextStorageIds)
      .filter(storageId => !existingStorageIds.has(storageId))
      .map(async (storageId) => {
        const media = await ctx.db
          .query("images")
          .withIndex("by_storageId", q => q.eq("storageId", storageId))
          .first();
        await ctx.db.insert("fileReferences", {
          createdAt: now,
          mediaId: media?._id,
          ownerField: owner.ownerField,
          ownerId: owner.ownerId,
          ownerTable: owner.ownerTable,
          purpose: owner.purpose,
          storageId,
          updatedAt: now,
        });
      })
  );

  return { removedStorageIds: Array.from(removedStorageIds) };
}

export async function commitFileDraftUploads(
  ctx: MutationCtx,
  storageIds: Array<string | null | undefined>
) {
  const committedStorageIds = dedupeNormalizedStorageIds(ctx, storageIds);
  if (committedStorageIds.length === 0) {
    return { committed: 0 };
  }
  return await ctx.runMutation(api.fileLifecycle.commitDraftUploads, { storageIds: committedStorageIds });
}

export async function cleanupStorageIdsIfUnreferenced(
  ctx: MutationCtx,
  storageIds: Array<string | null | undefined>
) {
  const cleanupStorageIds = dedupeNormalizedStorageIds(ctx, storageIds);
  await Promise.all(cleanupStorageIds.map((storageId) =>
    ctx.runMutation(api.storage.cleanupStorageIfUnreferenced, { storageId })
  ));
  return { cleaned: cleanupStorageIds.length };
}

export async function syncOwnerFilesAndCleanup(
  ctx: MutationCtx,
  owner: FileOwnerRef,
  storageIds: Array<string | null | undefined>,
  options?: { previousStorageIds?: Array<string | null | undefined> }
) {
  const result = await syncOwnerFileReferences(ctx, owner, storageIds, options);
  await commitFileDraftUploads(ctx, storageIds);
  await cleanupStorageIdsIfUnreferenced(ctx, result.removedStorageIds);
  return result;
}

export async function removeOwnerFilesAndCleanup(
  ctx: MutationCtx,
  owner: Pick<FileOwnerRef, "ownerId" | "ownerTable">,
  options?: { previousStorageIds?: Array<string | null | undefined> }
) {
  const result = await removeOwnerFileReferences(ctx, owner, options);
  await cleanupStorageIdsIfUnreferenced(ctx, result.removedStorageIds);
  return result;
}

export async function isBrokenStorageBackedUrl(
  ctx: MutationCtx,
  url?: string,
  storageId?: Id<"_storage"> | null
) {
  if (!url) {return false;}
  if (!storageId) {return isConvexManagedMediaUrl(url);}
  const resolvedUrl = await ctx.storage.getUrl(storageId);
  return !resolvedUrl;
}

export async function resolveStorageIdsFromLegacyUrls(
  ctx: QueryCtx | MutationCtx,
  urls: Array<string | null | undefined>,
  options?: { folder?: string; limit?: number }
) {
  const targetUrls = new Set(urls.filter((url): url is string => Boolean(url && extractStorageUrlKey(url))));
  if (targetUrls.size === 0) {
    return [];
  }

  const targetUrlKeys = Array.from(new Set(
    Array.from(targetUrls)
      .map(extractStorageUrlKey)
      .filter((key): key is string => Boolean(key))
  ));
  const resolvedStorageIds: Id<"_storage">[] = [];

  for (const urlStorageKey of targetUrlKeys) {
    const matches = await ctx.db
      .query("images")
      .withIndex("by_urlStorageKey", q => q.eq("urlStorageKey", urlStorageKey))
      .take(10);
    matches.forEach((image) => resolvedStorageIds.push(image.storageId));
  }

  const limit = options?.limit ?? 1000;
  const folder = options?.folder;
  const images = folder
    ? await ctx.db.query("images").withIndex("by_folder", q => q.eq("folder", folder)).take(limit)
    : await ctx.db.query("images").take(limit);

  for (const image of images) {
    const url = await ctx.storage.getUrl(image.storageId);
    if (url && (targetUrls.has(url) || targetUrlKeys.includes(extractStorageUrlKey(url) ?? ""))) {
      resolvedStorageIds.push(image.storageId);
    }
  }
  return dedupeNormalizedStorageIds(ctx, resolvedStorageIds);
}

export function fileReferenceUsage(reference: Doc<"fileReferences">): FileUsage {
  return {
    field: reference.ownerField,
    recordId: reference.ownerId,
    table: reference.ownerTable,
  };
}
