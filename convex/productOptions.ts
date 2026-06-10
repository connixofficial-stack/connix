import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { seedPresetProductOptions } from "./seeders/productOptions.seeder";

const displayType = v.union(
  v.literal("dropdown"),
  v.literal("buttons"),
  v.literal("radio"),
  v.literal("color_swatch"),
  v.literal("image_swatch"),
  v.literal("color_picker"),
  v.literal("number_input"),
  v.literal("text_input")
);

const inputType = v.union(
  v.literal("text"),
  v.literal("number"),
  v.literal("color")
);

const optionDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("productOptions"),
  active: v.boolean(),
  compareUnit: v.optional(v.string()),
  displayType,
  inputType: v.optional(inputType),
  isPreset: v.boolean(),
  name: v.string(),
  order: v.number(),
  showPriceCompare: v.optional(v.boolean()),
  slug: v.string(),
  unit: v.optional(v.string()),
});

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxLimit = Math.min(args.limit ?? 100, 500);
    return ctx.db.query("productOptions").order("desc").take(maxLimit);
  },
  returns: v.array(optionDoc),
});

export const listActive = query({
  args: {},
  handler: async (ctx) => ctx.db
      .query("productOptions")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect(),
  returns: v.array(optionDoc),
});

export const listActiveWithValues = query({
  args: {},
  handler: async (ctx) => {
    const options = await ctx.db
      .query("productOptions")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    const result = await Promise.all(
      options.map(async (option) => {
        const values = await ctx.db
          .query("productOptionValues")
          .withIndex("by_option_active", (q) => q.eq("optionId", option._id).eq("active", true))
          .collect();
        return {
          ...option,
          values: values.sort((a, b) => a.order - b.order),
        };
      })
    );

    return result;
  },
  returns: v.array(
    v.object({
      _creationTime: v.number(),
      _id: v.id("productOptions"),
      active: v.boolean(),
      compareUnit: v.optional(v.string()),
      displayType,
      inputType: v.optional(inputType),
      isPreset: v.boolean(),
      name: v.string(),
      order: v.number(),
      showPriceCompare: v.optional(v.boolean()),
      slug: v.string(),
      unit: v.optional(v.string()),
      values: v.array(
        v.object({
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
        })
      ),
    })
  ),
});


export const listByIds = query({
  args: { ids: v.array(v.id("productOptions")) },
  handler: async (ctx, args) => {
    if (args.ids.length === 0) {
      return [];
    }

    const items = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return items.filter((item): item is Doc<"productOptions"> => item !== null).sort((a, b) => a.order - b.order);
  },
  returns: v.array(optionDoc),
});

export const listAdminWithOffset = query({
  args: {
    active: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 50, 1000);

    const queryBuilder = args.active === undefined
      ? ctx.db.query("productOptions")
      : ctx.db
          .query("productOptions")
          .withIndex("by_active", (q) => q.eq("active", args.active!));

    let options: Doc<"productOptions">[] = await queryBuilder.order("desc").take(fetchLimit);

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      options = options.filter((option) =>
        option.name.toLowerCase().includes(searchLower) ||
        option.slug.toLowerCase().includes(searchLower)
      );
    }

    return options.slice(offset, offset + limit);
  },
  returns: v.array(optionDoc),
});

export const countAdmin = query({
  args: {
    active: v.optional(v.boolean()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    const fetchLimit = limit + 1;

    const queryBuilder = args.active === undefined
      ? ctx.db.query("productOptions")
      : ctx.db
          .query("productOptions")
          .withIndex("by_active", (q) => q.eq("active", args.active!));

    let options: Doc<"productOptions">[] = await queryBuilder.take(fetchLimit);

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      options = options.filter((option) =>
        option.name.toLowerCase().includes(searchLower) ||
        option.slug.toLowerCase().includes(searchLower)
      );
    }

    return { count: Math.min(options.length, limit), hasMore: options.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    active: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    const fetchLimit = limit + 1;

    const queryBuilder = args.active === undefined
      ? ctx.db.query("productOptions")
      : ctx.db
          .query("productOptions")
          .withIndex("by_active", (q) => q.eq("active", args.active!));

    let options: Doc<"productOptions">[] = await queryBuilder.take(fetchLimit);

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      options = options.filter((option) =>
        option.name.toLowerCase().includes(searchLower) ||
        option.slug.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = options.length > limit;
    return { ids: options.slice(0, limit).map((option) => option._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("productOptions")), hasMore: v.boolean() }),
});

export const getById = query({
  args: { id: v.id("productOptions") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(optionDoc, v.null()),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("productOptions")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique(),
  returns: v.union(optionDoc, v.null()),
});

export const create = mutation({
  args: {
    active: v.optional(v.boolean()),
    compareUnit: v.optional(v.string()),
    displayType,
    inputType: v.optional(inputType),
    isPreset: v.optional(v.boolean()),
    name: v.string(),
    order: v.optional(v.number()),
    showPriceCompare: v.optional(v.boolean()),
    slug: v.string(),
    unit: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("productOptions")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      throw new ConvexError({
        code: "DUPLICATE_SLUG",
        message: "Slug đã tồn tại, vui lòng chọn slug khác",
      });
    }

    let nextOrder = args.order;
    if (nextOrder === undefined) {
      const lastOption = await ctx.db.query("productOptions").order("desc").first();
      nextOrder = lastOption ? lastOption.order + 1 : 0;
    }

    return ctx.db.insert("productOptions", {
      ...args,
      active: args.active ?? true,
      isPreset: args.isPreset ?? false,
      order: nextOrder,
    });
  },
  returns: v.id("productOptions"),
});

export const update = mutation({
  args: {
    active: v.optional(v.boolean()),
    compareUnit: v.optional(v.string()),
    displayType: v.optional(displayType),
    id: v.id("productOptions"),
    inputType: v.optional(inputType),
    isPreset: v.optional(v.boolean()),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
    showPriceCompare: v.optional(v.boolean()),
    slug: v.optional(v.string()),
    unit: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const option = await ctx.db.get(id);
    if (!option) {throw new Error("Option không tồn tại");}

    if (updates.slug && updates.slug !== option.slug) {
      const existing = await ctx.db
        .query("productOptions")
        .withIndex("by_slug", (q) => q.eq("slug", updates.slug!))
        .unique();
      if (existing) {
        throw new ConvexError({
          code: "DUPLICATE_SLUG",
          message: "Slug đã tồn tại, vui lòng chọn slug khác",
        });
      }
    }

    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("productOptions") },
  handler: async (ctx, args) => {
    const option = await ctx.db.get(args.id);
    if (!option) {throw new Error("Option không tồn tại");}

    const valuesPreview = await ctx.db
      .query("productOptionValues")
      .withIndex("by_option", (q) => q.eq("optionId", args.id))
      .take(1);
    if (valuesPreview.length > 0 && !args.cascade) {
      throw new Error("Option có giá trị liên quan. Vui lòng xác nhận xóa tất cả.");
    }

    if (args.cascade) {
      const values = await ctx.db
        .query("productOptionValues")
        .withIndex("by_option", (q) => q.eq("optionId", args.id))
        .collect();
      await Promise.all(values.map( async (value) => ctx.db.delete(value._id)));
    }

    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("productOptions") },
  handler: async (ctx, args) => {
    const valuesPreview = await ctx.db
      .query("productOptionValues")
      .withIndex("by_option", (q) => q.eq("optionId", args.id))
      .take(10);
    const valuesCount = await ctx.db
      .query("productOptionValues")
      .withIndex("by_option", (q) => q.eq("optionId", args.id))
      .take(1001);

    return {
      canDelete: true,
      dependencies: [
        {
          count: Math.min(valuesCount.length, 1000),
          hasMore: valuesCount.length > 1000,
          label: "Giá trị option",
          preview: valuesPreview.map((value) => ({ id: value._id, name: value.label ?? value.value })),
        },
      ],
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
  args: { items: v.array(v.object({ id: v.id("productOptions"), order: v.number() })) },
  handler: async (ctx, args) => {
    await Promise.all(
      args.items.map( async (item) => ctx.db.patch(item.id, { order: item.order }))
    );
    return null;
  },
  returns: v.null(),
});

export const seedPresetOptions = mutation({
  args: {},
  handler: async (ctx) => {
    await seedPresetProductOptions(ctx);
    return null;
  },
  returns: v.null(),
});
