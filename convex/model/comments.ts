import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// ============================================================
// HELPER FUNCTIONS - Comments Model Layer
// ============================================================

const MAX_ITEMS_LIMIT = 100;

// SVC-011: Added "service" to target types
type TargetType = "post" | "product" | "service" | "course";
type CommentStatus = "Pending" | "Approved" | "Spam";

function assertValidRating(rating?: number): void {
  if (rating === undefined) {return;}
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be an integer from 1 to 5");
  }
}

/**
 * Get comment by ID with null check
 */
export async function getById(
  ctx: QueryCtx,
  { id }: { id: Id<"comments"> }
): Promise<Doc<"comments"> | null> {
  return  ctx.db.get(id);
}

/**
 * Get comment by ID or throw error
 */
export async function getByIdOrThrow(
  ctx: QueryCtx,
  { id }: { id: Id<"comments"> }
): Promise<Doc<"comments">> {
  const comment = await ctx.db.get(id);
  if (!comment) {throw new Error("Comment not found");}
  return comment;
}

/**
 * List comments with limit
 */
export async function listWithLimit(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"comments">[]> {
  return  ctx.db
    .query("comments")
    .order("desc")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

/**
 * List comments by target type
 */
export async function listByTargetType(
  ctx: QueryCtx,
  { targetType, limit = MAX_ITEMS_LIMIT }: { targetType: TargetType; limit?: number }
): Promise<Doc<"comments">[]> {
  return  ctx.db
    .query("comments")
    .withIndex("by_target_status", (q) => q.eq("targetType", targetType))
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

/**
 * List comments by status
 */
export async function listByStatus(
  ctx: QueryCtx,
  { status, limit = MAX_ITEMS_LIMIT }: { status: CommentStatus; limit?: number }
): Promise<Doc<"comments">[]> {
  return  ctx.db
    .query("comments")
    .withIndex("by_status", (q) => q.eq("status", status))
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

/**
 * List pending comments
 */
export async function listPending(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"comments">[]> {
  return  listByStatus(ctx, { limit, status: "Pending" });
}

/**
 * List comments by target
 */
export async function listByTarget(
  ctx: QueryCtx,
  { targetType, targetId, limit = MAX_ITEMS_LIMIT }: { targetType: TargetType; targetId: string; limit?: number }
): Promise<Doc<"comments">[]> {
  return  ctx.db
    .query("comments")
    .withIndex("by_target_status", (q) =>
      q.eq("targetType", targetType).eq("targetId", targetId)
    )
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

/**
 * List child comments with limit
 */
export async function listByParent(
  ctx: QueryCtx,
  { parentId, limit = 50 }: { parentId: Id<"comments">; limit?: number }
): Promise<Doc<"comments">[]> {
  return  ctx.db
    .query("comments")
    .withIndex("by_parent", (q) => q.eq("parentId", parentId))
    .take(Math.min(limit, 100));
}

/**
 * Count comments efficiently
 */
export async function countWithLimit(
  ctx: QueryCtx,
  { status, limit = 1000 }: { status?: CommentStatus; limit?: number } = {}
): Promise<{ count: number; hasMore: boolean }> {
  const query = status
    ? ctx.db.query("comments").withIndex("by_status", (q) => q.eq("status", status))
    : ctx.db.query("comments");

  const items = await query.take(limit + 1);
  return {
    count: Math.min(items.length, limit),
    hasMore: items.length > limit,
  };
}

/**
 * Count comments by target type
 */
export async function countByTargetType(
  ctx: QueryCtx,
  { targetType }: { targetType: TargetType }
): Promise<number> {
  const comments = await ctx.db
    .query("comments")
    .withIndex("by_target_status", (q) => q.eq("targetType", targetType))
    .take(1000);
  return comments.length;
}

/**
 * Count pending comments
 */
export async function countPending(ctx: QueryCtx): Promise<number> {
  const result = await countWithLimit(ctx, { status: "Pending" });
  return result.count;
}

/**
 * Validate target exists
 */
export async function validateTarget(
  ctx: QueryCtx,
  { targetType, targetId }: { targetType: TargetType; targetId: string }
): Promise<boolean> {
  if (targetType === "post") {
    const post = await ctx.db.get(targetId as Id<"posts">);
    return post !== null;
  } else if (targetType === "product") {
    const product = await ctx.db.get(targetId as Id<"products">);
    return product !== null;
  } else if (targetType === "service") {
    const service = await ctx.db.get(targetId as Id<"services">);
    return service !== null;
  } else if (targetType === "course") {
    const course = await ctx.db.get(targetId as Id<"courses">);
    return course !== null;
  }
  return false;
}

/**
 * Get default status from module settings
 */
async function getDefaultStatus(ctx: QueryCtx): Promise<CommentStatus> {
  const setting = await ctx.db
    .query("moduleSettings")
    .withIndex("by_module_setting", (q) =>
      q.eq("moduleKey", "comments").eq("settingKey", "defaultStatus")
    )
    .unique();
  return (setting?.value as CommentStatus) || "Pending";
}


/**
 * Create comment
 */
export async function create(
  ctx: MutationCtx,
  args: {
    content: string;
    authorName: string;
    authorEmail?: string;
    authorIp?: string;
    targetType: TargetType;
    targetId: string;
    parentId?: Id<"comments">;
    customerId?: Id<"customers">;
    rating?: number;
    status?: CommentStatus;
  }
): Promise<Id<"comments">> {
  assertValidRating(args.rating);
  const status = args.status ?? (await getDefaultStatus(ctx));

  return  ctx.db.insert("comments", {
    authorEmail: args.authorEmail,
    authorIp: args.authorIp,
    authorName: args.authorName,
    content: args.content,
    customerId: args.customerId,
    likesCount: 0,
    parentId: args.parentId,
    rating: args.rating,
    status,
    targetId: args.targetId,
    targetType: args.targetType,
  });
}

/**
 * Update comment
 */
export async function update(
  ctx: MutationCtx,
  args: {
    id: Id<"comments">;
    content?: string;
    authorName?: string;
    authorEmail?: string;
    rating?: number;
    status?: CommentStatus;
  }
): Promise<void> {
  await getByIdOrThrow(ctx, { id: args.id });

  assertValidRating(args.rating);

  const { id, ...updates } = args;
  const patchData: Record<string, unknown> = {};

  if (updates.content !== undefined) {patchData.content = updates.content;}
  if (updates.authorName !== undefined) {patchData.authorName = updates.authorName;}
  if (updates.authorEmail !== undefined) {patchData.authorEmail = updates.authorEmail;}
  if (updates.rating !== undefined) {patchData.rating = updates.rating;}
  if (updates.status !== undefined) {patchData.status = updates.status;}

  if (Object.keys(patchData).length > 0) {
    await ctx.db.patch(id, patchData);
  }
}

/**
 * Update status
 */
export async function updateStatus(
  ctx: MutationCtx,
  { id, status }: { id: Id<"comments">; status: CommentStatus }
): Promise<void> {
  await getByIdOrThrow(ctx, { id });
  await ctx.db.patch(id, { status });
}

/**
 * Approve comment
 */
export async function approve(
  ctx: MutationCtx,
  { id }: { id: Id<"comments"> }
): Promise<void> {
  await updateStatus(ctx, { id, status: "Approved" });
}

/**
 * Mark as spam
 */
export async function markAsSpam(
  ctx: MutationCtx,
  { id }: { id: Id<"comments"> }
): Promise<void> {
  await updateStatus(ctx, { id, status: "Spam" });
}

/**
 * Bulk update status
 */
export async function bulkUpdateStatus(
  ctx: MutationCtx,
  { ids, status }: { ids: Id<"comments">[]; status: CommentStatus }
): Promise<void> {
  for (const id of ids) {
    await ctx.db.patch(id, { status });
  }
}

/**
 * Delete comment and children
 */
export async function remove(
  ctx: MutationCtx,
  { cascade, id }: { cascade?: boolean; id: Id<"comments"> }
): Promise<void> {
  const preview = await ctx.db
    .query("comments")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(1);

  if (preview.length > 0 && !cascade) {
    throw new Error("Bình luận có phản hồi. Vui lòng xác nhận xóa tất cả.");
  }

  if (cascade) {
    const children = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", id))
      .collect();
    await Promise.all(children.map( async (child) => ctx.db.delete(child._id)));
  }

  await ctx.db.delete(id);
}

export async function getDeleteInfo(
  ctx: QueryCtx,
  { id }: { id: Id<"comments"> }
): Promise<{ canDelete: boolean; dependencies: { count: number; hasMore: boolean; label: string; preview: { id: string; name: string }[] }[] }> {
  const preview = await ctx.db
    .query("comments")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(10);
  const count = await ctx.db
    .query("comments")
    .withIndex("by_parent", (q) => q.eq("parentId", id))
    .take(1001);

  return {
    canDelete: true,
    dependencies: [
      {
        count: Math.min(count.length, 1000),
        hasMore: count.length > 1000,
        label: "Phản hồi",
        preview: preview.map((comment) => ({ id: comment._id, name: comment.content })),
      },
    ],
  };
}

export async function incrementLike(
  ctx: MutationCtx,
  { id }: { id: Id<"comments"> }
): Promise<void> {
  const comment = await getByIdOrThrow(ctx, { id });
  const current = comment.likesCount ?? 0;
  await ctx.db.patch(id, { likesCount: current + 1 });
}

export async function decrementLike(
  ctx: MutationCtx,
  { id }: { id: Id<"comments"> }
): Promise<void> {
  const comment = await getByIdOrThrow(ctx, { id });
  const current = comment.likesCount ?? 0;
  await ctx.db.patch(id, { likesCount: Math.max(0, current - 1) });
}
