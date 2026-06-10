import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import * as CategoriesModel from "./model/serviceCategories";

const categoryDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("serviceCategories"),
  active: v.boolean(),
  description: v.optional(v.string()),
  name: v.string(),
  order: v.number(),
  parentId: v.optional(v.id("serviceCategories")),
  slug: v.string(),
  thumbnail: v.optional(v.string()),
});

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => CategoriesModel.listWithLimit(ctx, { limit: args.limit }),
  returns: v.array(categoryDoc),
});

export const listActive = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => CategoriesModel.listActive(ctx, { limit: args.limit }),
  returns: v.array(categoryDoc),
});

export const listNonEmptyCategoryIds = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const categories = await CategoriesModel.listActive(ctx, { limit: args.limit });
    if (categories.length === 0) {
      return [];
    }

    const results = await Promise.all(
      categories.map(async (category) => {
        const preview = await ctx.db
          .query("services")
          .withIndex("by_category_status", (q) => q.eq("categoryId", category._id).eq("status", "Published"))
          .take(1);
        return preview.length > 0 ? category._id : null;
      })
    );

    return results.filter((id): id is Id<"serviceCategories"> => id !== null);
  },
  returns: v.array(v.id("serviceCategories")),
});

export const listByParent = query({
  args: { parentId: v.optional(v.id("serviceCategories")) },
  handler: async (ctx, args) => CategoriesModel.listByParent(ctx, { parentId: args.parentId }),
  returns: v.array(categoryDoc),
});

export const listByParentOrdered = query({
  args: { parentId: v.optional(v.id("serviceCategories")) },
  handler: async (ctx, args) => ctx.db
      .query("serviceCategories")
      .withIndex("by_parent_order", (q) => q.eq("parentId", args.parentId))
      .collect(),
  returns: v.array(categoryDoc),
});

export const getById = query({
  args: { id: v.id("serviceCategories") },
  handler: async (ctx, args) => CategoriesModel.getById(ctx, args),
  returns: v.union(categoryDoc, v.null()),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => CategoriesModel.getBySlug(ctx, args),
  returns: v.union(categoryDoc, v.null()),
});

export const count = query({
  args: {},
  handler: async (ctx) => CategoriesModel.countWithLimit(ctx),
  returns: v.object({
    count: v.number(),
    hasMore: v.boolean(),
  }),
});

export const create = mutation({
  args: {
    active: v.optional(v.boolean()),
    description: v.optional(v.string()),
    name: v.string(),
    order: v.optional(v.number()),
    parentId: v.optional(v.id("serviceCategories")),
    slug: v.string(),
    thumbnail: v.optional(v.string()),
  },
  handler: async (ctx, args) => CategoriesModel.create(ctx, args),
  returns: v.id("serviceCategories"),
});

export const update = mutation({
  args: {
    active: v.optional(v.boolean()),
    description: v.optional(v.string()),
    id: v.id("serviceCategories"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
    parentId: v.optional(v.id("serviceCategories")),
    slug: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await CategoriesModel.update(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("serviceCategories") },
  handler: async (ctx, args) => {
    await CategoriesModel.remove(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("serviceCategories") },
  handler: async (ctx, args) => CategoriesModel.getDeleteInfo(ctx, args),
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
  args: { items: v.array(v.object({ id: v.id("serviceCategories"), order: v.number() })) },
  handler: async (ctx, args) => {
    await CategoriesModel.reorder(ctx, args);
    return null;
  },
  returns: v.null(),
});
