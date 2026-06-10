import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { resolveUniqueSlug } from "./lib/iaSlugs";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

const priceRangeSchema = v.object({
  label: v.string(),
  slug: v.string(),
  minPrice: v.optional(v.number()),
  maxPrice: v.optional(v.number()),
});

const productTypeDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("productTypes"),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  order: v.number(),
  active: v.boolean(),
  attributeGroupIds: v.optional(v.array(v.id("attributeGroups"))),
  priceRanges: v.optional(v.array(priceRangeSchema)),
});

// Helper function to sync productCategoryTypes
async function syncProductCategoryTypes(
  ctx: MutationCtx,
  typeId: Id<"productTypes">,
  categoryIds: Id<"productCategories">[]
) {
  const existing = await ctx.db
    .query("productCategoryTypes")
    .withIndex("by_type", (q) => q.eq("typeId", typeId))
    .collect();

  const nextSet = new Set(categoryIds);
  for (const item of existing) {
    if (!nextSet.has(item.categoryId)) {
      await ctx.db.delete(item._id);
    }
  }

  const existingCatIds = new Set(existing.map(item => item.categoryId));
  for (const catId of categoryIds) {
    if (!existingCatIds.has(catId)) {
      // Clean up any existing product type assignments for this category first
      const oldMappings = await ctx.db
        .query("productCategoryTypes")
        .withIndex("by_category", (q) => q.eq("categoryId", catId))
        .collect();
      for (const mapping of oldMappings) {
        await ctx.db.delete(mapping._id);
      }

      await ctx.db.insert("productCategoryTypes", {
        categoryId: catId,
        typeId,
      });
    }
  }
}

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const types = await ctx.db.query("productTypes").collect();
    const rows = [];
    for (const type of types) {
      const mappings = await ctx.db
        .query("productTypeAttributeGroups")
        .withIndex("by_type_order", (q) => q.eq("typeId", type._id))
        .collect();
      rows.push({
        ...type,
        attributeGroupIds: mappings.map((mapping) => mapping.groupId),
      });
    }
    return rows.sort((a, b) => a.order - b.order);
  },
  returns: v.array(productTypeDoc),
});

export const listAdminWithOffset = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;

    let types = await ctx.db.query("productTypes").take(1000);
    types = types.sort((a, b) => a.order - b.order);

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      types = types.filter((t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.slug.toLowerCase().includes(searchLower)
      );
    }

    return types.slice(offset, offset + limit);
  },
  returns: v.array(productTypeDoc),
});

export const countAdmin = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const limit = 5000;
    const fetchLimit = limit + 1;

    let types = await ctx.db.query("productTypes").take(fetchLimit);

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      types = types.filter((t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.slug.toLowerCase().includes(searchLower)
      );
    }

    return { count: Math.min(types.length, limit), hasMore: types.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const getById = query({
  args: { id: v.id("productTypes") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(productTypeDoc, v.null()),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("productTypes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
  returns: v.union(productTypeDoc, v.null()),
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
    active: v.optional(v.boolean()),
    attributeGroupIds: v.optional(v.array(v.id("attributeGroups"))),
    priceRanges: v.optional(v.array(priceRangeSchema)),
    categoryIds: v.optional(v.array(v.id("productCategories"))),
  },
  handler: async (ctx, args) => {
    const resolvedSlug = await resolveUniqueSlug(ctx, { scope: "category", slug: args.slug });
    
    let nextOrder = args.order;
    if (nextOrder === undefined) {
      const lastType = await ctx.db.query("productTypes").collect().then(res => res.sort((a, b) => b.order - a.order)[0]);
      nextOrder = lastType ? lastType.order + 1 : 0;
    }
    
    const typeId = await ctx.db.insert("productTypes", {
      name: args.name,
      slug: resolvedSlug.slug,
      description: args.description,
      order: nextOrder,
      active: args.active ?? true,
      priceRanges: args.priceRanges,
    });

    if (args.attributeGroupIds && args.attributeGroupIds.length > 0) {
      for (let i = 0; i < args.attributeGroupIds.length; i++) {
        await ctx.db.insert("productTypeAttributeGroups", {
          typeId,
          groupId: args.attributeGroupIds[i],
          order: i,
        });
      }
    }

    if (args.categoryIds) {
      await syncProductCategoryTypes(ctx, typeId, args.categoryIds);
    }

    return typeId;
  },
  returns: v.id("productTypes"),
});

export const update = mutation({
  args: {
    id: v.id("productTypes"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
    active: v.optional(v.boolean()),
    attributeGroupIds: v.optional(v.array(v.id("attributeGroups"))),
    priceRanges: v.optional(v.array(priceRangeSchema)),
    categoryIds: v.optional(v.array(v.id("productCategories"))),
  },
  handler: async (ctx, args) => {
    const { id, attributeGroupIds, categoryIds, ...updates } = args;
    const type = await ctx.db.get(id);
    if (!type) throw new Error("Product Type not found");

    if (args.slug && args.slug !== type.slug) {
      const resolvedSlug = await resolveUniqueSlug(ctx, {
        scope: "category",
        slug: args.slug,
        exclude: { id: args.id, table: "productTypes" },
      });
      if (resolvedSlug.slug !== args.slug) {
        updates.slug = resolvedSlug.slug;
      }
    }
    await ctx.db.patch(id, updates);

    // Update Attribute Groups pivot if provided
    if (attributeGroupIds) {
      const existingMappings = await ctx.db
        .query("productTypeAttributeGroups")
        .withIndex("by_type", (q) => q.eq("typeId", id))
        .collect();
      
      for (const mapping of existingMappings) {
        await ctx.db.delete(mapping._id);
      }

      for (let i = 0; i < attributeGroupIds.length; i++) {
        await ctx.db.insert("productTypeAttributeGroups", {
          typeId: id,
          groupId: attributeGroupIds[i],
          order: i,
        });
      }
    }

    if (categoryIds) {
      await syncProductCategoryTypes(ctx, id, categoryIds);
    }

    return null;
  },
  returns: v.null(),
});

export const reorder = mutation({
  args: { items: v.array(v.object({ id: v.id("productTypes"), order: v.number() })) },
  handler: async (ctx, args) => {
    for (const item of args.items) {
      await ctx.db.patch(item.id, { order: item.order });
    }
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { id: v.id("productTypes") },
  handler: async (ctx, args) => {
    const type = await ctx.db.get(args.id);
    if (!type) throw new Error("Product Type not found");

    const productsCount = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("productTypeId"), args.id))
      .take(1);
    if (productsCount.length > 0) {
      throw new Error("Không thể xóa: Có sản phẩm đang sử dụng Loại này.");
    }

    const mappings = await ctx.db
      .query("productTypeAttributeGroups")
      .withIndex("by_type", (q) => q.eq("typeId", args.id))
      .collect();
    for (const mapping of mappings) {
      await ctx.db.delete(mapping._id);
    }

    const catMappings = await ctx.db
      .query("productCategoryTypes")
      .withIndex("by_type", (q) => q.eq("typeId", args.id))
      .collect();
    for (const m of catMappings) {
      await ctx.db.delete(m._id);
    }

    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("productTypes") },
  handler: async (ctx, args) => {
    const productsCount = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("productTypeId"), args.id))
      .take(1001);

    return {
      canDelete: productsCount.length === 0,
      dependencies: [
        {
          count: Math.min(productsCount.length, 1000),
          hasMore: productsCount.length > 1000,
          label: "Sản phẩm",
          preview: productsCount.slice(0, 5).map((p) => ({ id: p._id, name: p.name })),
        },
      ],
    };
  },
});

export const listAssignedGroups = query({
  args: { typeId: v.id("productTypes") },
  handler: async (ctx, args) => {
    const mappings = await ctx.db
      .query("productTypeAttributeGroups")
      .withIndex("by_type_order", (q) => q.eq("typeId", args.typeId))
      .collect();
    
    const groups = [];
    for (const m of mappings) {
      const g = await ctx.db.get(m.groupId);
      if (g) groups.push(g);
    }
    return groups;
  },
});

export const listAssignedGroupCounts = query({
  args: { typeIds: v.array(v.id("productTypes")) },
  handler: async (ctx, args) => {
    const rows = await Promise.all(
      args.typeIds.map(async (typeId) => {
        const mappings = await ctx.db
          .query("productTypeAttributeGroups")
          .withIndex("by_type", (q) => q.eq("typeId", typeId))
          .collect();
        return { typeId, count: mappings.length };
      })
    );
    return rows;
  },
  returns: v.array(v.object({
    typeId: v.id("productTypes"),
    count: v.number(),
  })),
});

export const listAssignedCategories = query({
  args: { typeId: v.id("productTypes") },
  handler: async (ctx, args) => {
    const mappings = await ctx.db
      .query("productCategoryTypes")
      .withIndex("by_type", (q) => q.eq("typeId", args.typeId))
      .collect();
    const categories = [];
    for (const m of mappings) {
      const cat = await ctx.db.get(m.categoryId);
      if (cat) categories.push(cat);
    }
    return categories;
  },
});

export const listAssignedTypesForCategory = query({
  args: { categoryId: v.id("productCategories") },
  handler: async (ctx, args) => {
    const mappings = await ctx.db
      .query("productCategoryTypes")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();
    const types: Doc<"productTypes">[] = [];
    for (const m of mappings) {
      const type = await ctx.db.get(m.typeId);
      if (type) types.push(type);
    }
    return types.sort((a, b) => a.order - b.order);
  },
  returns: v.array(productTypeDoc),
});

export const listAssignedTypesForCategories = query({
  args: { categoryIds: v.array(v.id("productCategories")) },
  handler: async (ctx, args) => {
    const rows: { categoryId: Id<"productCategories">; types: Doc<"productTypes">[] }[] = [];

    for (const categoryId of args.categoryIds) {
      const mappings = await ctx.db
        .query("productCategoryTypes")
        .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
        .collect();
      const types: Doc<"productTypes">[] = [];
      for (const mapping of mappings) {
        const type = await ctx.db.get(mapping.typeId);
        if (type) types.push(type);
      }
      rows.push({
        categoryId,
        types: types.sort((a, b) => a.order - b.order),
      });
    }

    return rows;
  },
  returns: v.array(v.object({
    categoryId: v.id("productCategories"),
    types: v.array(productTypeDoc),
  })),
});

export const getFormConfig = query({
  args: { typeId: v.optional(v.id("productTypes")) },
  handler: async (ctx, args) => {
    const typeId = args.typeId;
    if (!typeId) return null;
    const type = await ctx.db.get(typeId);
    if (!type) return null;
    const mappings = await ctx.db
      .query("productTypeAttributeGroups")
      .withIndex("by_type_order", (q) => q.eq("typeId", typeId))
      .collect();
    
    const groups = [];
    for (const m of mappings) {
      const g = await ctx.db.get(m.groupId);
      if (g) {
        const terms = await ctx.db
          .query("attributeTerms")
          .withIndex("by_group", (q) => q.eq("groupId", g._id))
          .collect()
          .then(res => res.sort((a, b) => a.order - b.order));
        groups.push({ ...g, terms });
      }
    }
    return { type, groups };
  },
});

export const listAdminIds = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("productTypes").take(5001);
    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      items = items.filter((t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.slug.toLowerCase().includes(searchLower)
      );
    }
    return {
      ids: items.slice(0, 5000).map((t) => t._id),
      hasMore: items.length > 5000,
    };
  },
});
