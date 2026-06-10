import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { commentStatus, targetType } from "./lib/validators";
import * as CommentsModel from "./model/comments";
import type { Doc } from "./_generated/dataModel";

const commentDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("comments"),
  authorEmail: v.optional(v.string()),
  authorIp: v.optional(v.string()),
  authorName: v.string(),
  content: v.string(),
  customerId: v.optional(v.id("customers")),
  likesCount: v.optional(v.number()),
  parentId: v.optional(v.id("comments")),
  rating: v.optional(v.number()),
  status: commentStatus,
  targetId: v.string(),
  targetType: targetType,
});

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) =>  ctx.db.query("comments").paginate(args.paginationOpts),
});

// Limited list for admin (max 100 items)
export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => CommentsModel.listWithLimit(ctx, { limit: args.limit }),
  returns: v.array(commentDoc),
});

export const listAdminWithOffset = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(commentStatus),
    targetType: v.optional(targetType),
    targetId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 50, 500);
    let comments: Doc<"comments">[] = [];

    if (args.targetType && args.targetId) {
      if (args.status) {
        comments = await ctx.db
          .query("comments")
          .withIndex("by_target_status", (q) =>
            q.eq("targetType", args.targetType!).eq("targetId", args.targetId!).eq("status", args.status!)
          )
          .order("desc")
          .take(fetchLimit);
      } else {
        comments = await ctx.db
          .query("comments")
          .withIndex("by_target_status", (q) =>
            q.eq("targetType", args.targetType!).eq("targetId", args.targetId!)
          )
          .order("desc")
          .take(fetchLimit);
      }
    } else if (args.status) {
      comments = await ctx.db
        .query("comments")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else {
      comments = await ctx.db
        .query("comments")
        .order("desc")
        .take(fetchLimit);
    }

    if (args.targetType && !args.targetId) {
      comments = comments.filter((comment) => comment.targetType === args.targetType);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      comments = comments.filter((comment) =>
        comment.authorName.toLowerCase().includes(searchLower) ||
        comment.content.toLowerCase().includes(searchLower)
      );
    }

    return comments.slice(offset, offset + limit);
  },
  returns: v.array(commentDoc),
});

export const countAdmin = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(commentStatus),
    targetType: v.optional(targetType),
    targetId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    let comments: Doc<"comments">[] = [];

    if (args.targetType && args.targetId) {
      if (args.status) {
        comments = await ctx.db
          .query("comments")
          .withIndex("by_target_status", (q) =>
            q.eq("targetType", args.targetType!).eq("targetId", args.targetId!).eq("status", args.status!)
          )
          .take(limit + 1);
      } else {
        comments = await ctx.db
          .query("comments")
          .withIndex("by_target_status", (q) =>
            q.eq("targetType", args.targetType!).eq("targetId", args.targetId!)
          )
          .take(limit + 1);
      }
    } else if (args.status) {
      comments = await ctx.db
        .query("comments")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      comments = await ctx.db
        .query("comments")
        .take(limit + 1);
    }

    if (args.targetType && !args.targetId) {
      comments = comments.filter((comment) => comment.targetType === args.targetType);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      comments = comments.filter((comment) =>
        comment.authorName.toLowerCase().includes(searchLower) ||
        comment.content.toLowerCase().includes(searchLower)
      );
    }

    return { count: Math.min(comments.length, limit), hasMore: comments.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(commentStatus),
    targetType: v.optional(targetType),
    targetId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    let comments: Doc<"comments">[] = [];

    if (args.targetType && args.targetId) {
      if (args.status) {
        comments = await ctx.db
          .query("comments")
          .withIndex("by_target_status", (q) =>
            q.eq("targetType", args.targetType!).eq("targetId", args.targetId!).eq("status", args.status!)
          )
          .take(limit + 1);
      } else {
        comments = await ctx.db
          .query("comments")
          .withIndex("by_target_status", (q) =>
            q.eq("targetType", args.targetType!).eq("targetId", args.targetId!)
          )
          .take(limit + 1);
      }
    } else if (args.status) {
      comments = await ctx.db
        .query("comments")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      comments = await ctx.db
        .query("comments")
        .take(limit + 1);
    }

    if (args.targetType && !args.targetId) {
      comments = comments.filter((comment) => comment.targetType === args.targetType);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      comments = comments.filter((comment) =>
        comment.authorName.toLowerCase().includes(searchLower) ||
        comment.content.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = comments.length > limit;
    return { ids: comments.slice(0, limit).map((comment) => comment._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("comments")), hasMore: v.boolean() }),
});

export const listByTargetType = query({
  args: { limit: v.optional(v.number()), targetType: targetType },
  handler: async (ctx, args) => CommentsModel.listByTargetType(ctx, { 
      limit: args.limit, 
      targetType: args.targetType 
    }),
  returns: v.array(commentDoc),
});

// Paginated version for system page
export const listByTargetTypePaginated = query({
  args: { paginationOpts: paginationOptsValidator, targetType: targetType },
  handler: async (ctx, args) => ctx.db
      .query("comments")
      .withIndex("by_target_status", (q) => q.eq("targetType", args.targetType))
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(commentDoc),
    pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
});

// Efficient count using take()
export const countByTargetType = query({
  args: { targetType: targetType },
  handler: async (ctx, args) => CommentsModel.countByTargetType(ctx, { targetType: args.targetType }),
  returns: v.number(),
});

export const getById = query({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => CommentsModel.getById(ctx, args),
  returns: v.union(commentDoc, v.null()),
});

// Efficient count
export const count = query({
  args: { status: v.optional(commentStatus) },
  handler: async (ctx, args) => CommentsModel.countWithLimit(ctx, { status: args.status }),
  returns: v.object({
    count: v.number(),
    hasMore: v.boolean(),
  }),
});

export const listByTarget = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(commentStatus),
    targetId: v.string(),
    targetType: targetType,
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return  ctx.db
        .query("comments")
        .withIndex("by_target_status", (q) =>
          q.eq("targetType", args.targetType).eq("targetId", args.targetId).eq("status", args.status!)
        )
        .paginate(args.paginationOpts);
    }
    return  ctx.db
      .query("comments")
      .withIndex("by_target_status", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .paginate(args.paginationOpts);
  },
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(commentDoc),
    pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
});

export const listByStatus = query({
  args: { paginationOpts: paginationOptsValidator, status: commentStatus },
  handler: async (ctx, args) => ctx.db
      .query("comments")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(commentDoc),
    pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
});

export const listPending = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
      .query("comments")
      .withIndex("by_status", (q) => q.eq("status", "Pending"))
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(commentDoc),
    pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
});

export const listByParent = query({
  args: { limit: v.optional(v.number()), parentId: v.id("comments") },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100);
    return  ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .take(limit);
  },
  returns: v.array(commentDoc),
});

export const listByCustomer = query({
  args: { customerId: v.id("customers"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
      .query("comments")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(commentDoc),
    pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
});

export const getRatingSummary = query({
  args: {
    targetId: v.string(),
    targetType: targetType,
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_target_status", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId).eq("status", "Approved")
      )
      .take(1000);

    const ratings = comments.filter((comment) => typeof comment.rating === "number");
    const count = ratings.length;
    const total = ratings.reduce((sum, comment) => sum + (comment.rating ?? 0), 0);
    const average = count > 0 ? total / count : 0;

    return { average, count };
  },
  returns: v.object({ average: v.number(), count: v.number() }),
});

export const create = mutation({
  args: {
    authorEmail: v.optional(v.string()),
    authorIp: v.optional(v.string()),
    authorName: v.string(),
    content: v.string(),
    customerId: v.optional(v.id("customers")),
    parentId: v.optional(v.id("comments")),
    rating: v.optional(v.number()),
    status: v.optional(commentStatus),
    targetId: v.string(),
    targetType: targetType,
  },
  handler: async (ctx, args) => CommentsModel.create(ctx, args),
  returns: v.id("comments"),
});

export const update = mutation({
  args: {
    authorEmail: v.optional(v.string()),
    authorName: v.optional(v.string()),
    content: v.optional(v.string()),
    id: v.id("comments"),
    rating: v.optional(v.number()),
    status: v.optional(commentStatus),
  },
  handler: async (ctx, args) => {
    await CommentsModel.update(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const updateStatus = mutation({
  args: { id: v.id("comments"), status: commentStatus },
  handler: async (ctx, args) => {
    await CommentsModel.updateStatus(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const approve = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    await CommentsModel.approve(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const markAsSpam = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    await CommentsModel.markAsSpam(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const bulkUpdateStatus = mutation({
  args: { ids: v.array(v.id("comments")), status: commentStatus },
  handler: async (ctx, args) => {
    await CommentsModel.bulkUpdateStatus(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("comments") },
  handler: async (ctx, args) => {
    await CommentsModel.remove(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => CommentsModel.getDeleteInfo(ctx, args),
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

export const incrementLike = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    await CommentsModel.incrementLike(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const decrementLike = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    await CommentsModel.decrementLike(ctx, args);
    return null;
  },
  returns: v.null(),
});

// Efficient count pending using take()
export const countPending = query({
  args: {},
  handler: async (ctx) => CommentsModel.countPending(ctx),
  returns: v.number(),
});
