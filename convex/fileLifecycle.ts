import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation } from "./_generated/server";
import { hasFileReferences } from "./lib/fileService";

const DEFAULT_DRAFT_TTL_MS = 1000 * 60 * 60 * 6;
const MAX_DRAFT_CLEANUP_BATCH = 50;

async function markDrafts(
  ctx: MutationCtx,
  storageIds: Array<Id<"_storage">>,
  status: "committed" | "cleaned"
) {
  const now = Date.now();
  for (const storageId of storageIds) {
    const drafts = await ctx.db
      .query("fileDraftUploads")
      .withIndex("by_storageId", q => q.eq("storageId", storageId))
      .collect();
    await Promise.all(drafts.map(draft => ctx.db.patch(draft._id, { status, updatedAt: now })));
  }
}

export const registerDraftUpload = mutation({
  args: {
    expiresInMs: v.optional(v.number()),
    folder: v.optional(v.string()),
    ownerKey: v.optional(v.string()),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const media = await ctx.db
      .query("images")
      .withIndex("by_storageId", q => q.eq("storageId", args.storageId))
      .first();
    const existing = await ctx.db
      .query("fileDraftUploads")
      .withIndex("by_storageId", q => q.eq("storageId", args.storageId))
      .first();
    const draft = {
      expiresAt: now + (args.expiresInMs ?? DEFAULT_DRAFT_TTL_MS),
      folder: args.folder,
      mediaId: media?._id,
      ownerKey: args.ownerKey,
      status: "draft" as const,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, draft);
      return existing._id;
    }

    return ctx.db.insert("fileDraftUploads", {
      ...draft,
      createdAt: now,
      storageId: args.storageId,
    });
  },
  returns: v.id("fileDraftUploads"),
});

export const commitDraftUploads = mutation({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, args) => {
    await markDrafts(ctx, args.storageIds, "committed");
    return { committed: args.storageIds.length };
  },
  returns: v.object({ committed: v.number() }),
});

export const commitDraftUploadsByStorageIds = mutation({
  args: { storageIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const validIds: Array<Id<"_storage">> = [];
    for (const idStr of args.storageIds) {
      if (idStr && !idStr.includes("/") && !idStr.startsWith("http")) {
        validIds.push(idStr as Id<"_storage">);
      }
    }
    if (validIds.length > 0) {
      await markDrafts(ctx, validIds, "committed");
    }
    return { committed: validIds.length };
  },
  returns: v.object({ committed: v.number() }),
});


export const cleanupDraftUploads = mutation({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, args) => {
    let cleaned = 0;
    let committed = 0;
    const uniqueStorageIds = Array.from(new Set(args.storageIds));

    for (const storageId of uniqueStorageIds) {
      const referenced = await hasFileReferences(ctx, storageId);
      if (referenced) {
        await markDrafts(ctx, [storageId], "committed");
        committed += 1;
        continue;
      }

      const result = await ctx.runMutation(api.storage.cleanupStorageIfUnreferenced, { storageId });
      if (result.deleted) {
        await markDrafts(ctx, [storageId], "cleaned");
        cleaned += 1;
      } else {
        await markDrafts(ctx, [storageId], "committed");
        committed += 1;
      }
    }

    return { cleaned, committed };
  },
  returns: v.object({ cleaned: v.number(), committed: v.number() }),
});

export const cleanupExpiredDraftUploads = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const drafts = await ctx.db
      .query("fileDraftUploads")
      .withIndex("by_status_expiresAt", q => q.eq("status", "draft").lt("expiresAt", now))
      .take(MAX_DRAFT_CLEANUP_BATCH);

    let cleaned = 0;
    let committed = 0;
    for (const draft of drafts) {
      const referenced = await hasFileReferences(ctx, draft.storageId);
      if (referenced) {
        await ctx.db.patch(draft._id, { status: "committed", updatedAt: now });
        committed += 1;
        continue;
      }

      const result = await ctx.runMutation(api.storage.cleanupStorageIfUnreferenced, { storageId: draft.storageId });
      if (result.deleted) {
        await ctx.db.patch(draft._id, { status: "cleaned", updatedAt: now });
        cleaned += 1;
      } else {
        await ctx.db.patch(draft._id, { status: "committed", updatedAt: now });
        committed += 1;
      }
    }

    return { cleaned, committed, hasMore: drafts.length === MAX_DRAFT_CLEANUP_BATCH };
  },
  returns: v.object({ cleaned: v.number(), committed: v.number(), hasMore: v.boolean() }),
});

