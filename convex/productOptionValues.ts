import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

const valueDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("productOptionValues"),
  active: v.boolean(),
  badge: v.optional(v.string()),
  colorCode: v.optional(v.string()),
  image: v.optional(v.string()),
  isLifetime: v.optional(v.boolean()),
  label: v.optional(v.string()),
  numericValue: v.optional(v.number()),
  optionId: v.id("productOptions"),
  order: v.number(),
  value: v.string(),
});

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxLimit = Math.min(args.limit ?? 200, 500);
    return ctx.db.query("productOptionValues").order("desc").take(maxLimit);
  },
  returns: v.array(valueDoc),
});

export const listByOption = query({
  args: { optionId: v.id("productOptions") },
  handler: async (ctx, args) => ctx.db
      .query("productOptionValues")
      .withIndex("by_option", (q) => q.eq("optionId", args.optionId))
      .collect(),
  returns: v.array(valueDoc),
});

export const listByOptionActive = query({
  args: { optionId: v.id("productOptions") },
  handler: async (ctx, args) => ctx.db
      .query("productOptionValues")
      .withIndex("by_option_active", (q) => q.eq("optionId", args.optionId).eq("active", true))
      .collect(),
  returns: v.array(valueDoc),
});

export const listByIds = query({
  args: { ids: v.array(v.id("productOptionValues")) },
  handler: async (ctx, args) => {
    if (args.ids.length === 0) {
      return [];
    }

    const items = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return items.filter((item): item is Doc<"productOptionValues"> => item !== null).sort((a, b) => a.order - b.order);
  },
  returns: v.array(valueDoc),
});

export const listAdminWithOffset = query({
  args: {
    active: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    optionId: v.optional(v.id("productOptions")),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 50, 1000);

    const queryBuilder = args.optionId
      ? ctx.db
          .query("productOptionValues")
          .withIndex("by_option", (q) => q.eq("optionId", args.optionId!))
      : ctx.db.query("productOptionValues");

    let values: Doc<"productOptionValues">[] = await queryBuilder.order("desc").take(fetchLimit);

    if (args.active !== undefined) {
      values = values.filter((item) => item.active === args.active);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      values = values.filter((item) =>
        item.value.toLowerCase().includes(searchLower) ||
        (item.label ?? "").toLowerCase().includes(searchLower)
      );
    }

    return values.slice(offset, offset + limit);
  },
  returns: v.array(valueDoc),
});

export const countAdmin = query({
  args: {
    active: v.optional(v.boolean()),
    optionId: v.optional(v.id("productOptions")),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    const fetchLimit = limit + 1;

    const queryBuilder = args.optionId
      ? ctx.db
          .query("productOptionValues")
          .withIndex("by_option", (q) => q.eq("optionId", args.optionId!))
      : ctx.db.query("productOptionValues");

    let values: Doc<"productOptionValues">[] = await queryBuilder.take(fetchLimit);

    if (args.active !== undefined) {
      values = values.filter((item) => item.active === args.active);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      values = values.filter((item) =>
        item.value.toLowerCase().includes(searchLower) ||
        (item.label ?? "").toLowerCase().includes(searchLower)
      );
    }

    return { count: Math.min(values.length, limit), hasMore: values.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    active: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    optionId: v.optional(v.id("productOptions")),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    const fetchLimit = limit + 1;

    const queryBuilder = args.optionId
      ? ctx.db
          .query("productOptionValues")
          .withIndex("by_option", (q) => q.eq("optionId", args.optionId!))
      : ctx.db.query("productOptionValues");

    let values: Doc<"productOptionValues">[] = await queryBuilder.take(fetchLimit);

    if (args.active !== undefined) {
      values = values.filter((item) => item.active === args.active);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      values = values.filter((item) =>
        item.value.toLowerCase().includes(searchLower) ||
        (item.label ?? "").toLowerCase().includes(searchLower)
      );
    }

    const hasMore = values.length > limit;
    return { ids: values.slice(0, limit).map((item) => item._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("productOptionValues")), hasMore: v.boolean() }),
});

export const getById = query({
  args: { id: v.id("productOptionValues") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(valueDoc, v.null()),
});

export const create = mutation({
  args: {
    active: v.optional(v.boolean()),
    badge: v.optional(v.string()),
    colorCode: v.optional(v.string()),
    image: v.optional(v.string()),
    isLifetime: v.optional(v.boolean()),
    label: v.optional(v.string()),
    numericValue: v.optional(v.number()),
    optionId: v.id("productOptions"),
    order: v.optional(v.number()),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const option = await ctx.db.get(args.optionId);
    if (!option) {throw new Error("Option không tồn tại");}

    const existing = await ctx.db
      .query("productOptionValues")
      .withIndex("by_option", (q) => q.eq("optionId", args.optionId))
      .filter((q) => q.eq(q.field("value"), args.value))
      .unique();
    if (existing) {throw new Error("Giá trị đã tồn tại");}

    let nextOrder = args.order;
    if (nextOrder === undefined) {
      const lastValue = await ctx.db
        .query("productOptionValues")
        .withIndex("by_option_order", (q) => q.eq("optionId", args.optionId))
        .order("desc")
        .first();
      nextOrder = lastValue ? lastValue.order + 1 : 0;
    }

    return ctx.db.insert("productOptionValues", {
      ...args,
      active: args.active ?? true,
      order: nextOrder,
    });
  },
  returns: v.id("productOptionValues"),
});

export const update = mutation({
  args: {
    active: v.optional(v.boolean()),
    badge: v.optional(v.string()),
    colorCode: v.optional(v.string()),
    id: v.id("productOptionValues"),
    image: v.optional(v.string()),
    isLifetime: v.optional(v.boolean()),
    label: v.optional(v.string()),
    numericValue: v.optional(v.number()),
    optionId: v.optional(v.id("productOptions")),
    order: v.optional(v.number()),
    value: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const item = await ctx.db.get(id);
    if (!item) {throw new Error("Giá trị không tồn tại");}

    const optionId = updates.optionId ?? item.optionId;
    if ((updates.value && updates.value !== item.value) || (updates.optionId && updates.optionId !== item.optionId)) {
      const existing = await ctx.db
        .query("productOptionValues")
        .withIndex("by_option", (q) => q.eq("optionId", optionId))
        .filter((q) => q.eq(q.field("value"), updates.value ?? item.value))
        .unique();
      if (existing && existing._id !== id) {throw new Error("Giá trị đã tồn tại");}
    }

    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { id: v.id("productOptionValues") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) {throw new Error("Giá trị không tồn tại");}
    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

export const reorder = mutation({
  args: { items: v.array(v.object({ id: v.id("productOptionValues"), order: v.number() })) },
  handler: async (ctx, args) => {
    await Promise.all(
      args.items.map( async (item) => ctx.db.patch(item.id, { order: item.order }))
    );
    return null;
  },
  returns: v.null(),
});
