import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { resolveUniqueSlug } from "./lib/iaSlugs";

const attributeGroupDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("attributeGroups"),
  code: v.string(),
  slug: v.string(),
  name: v.string(),
  filterType: v.string(),
  inputType: v.string(),
  isFilterable: v.boolean(),
  isSpecialFilter: v.optional(v.boolean()),
  order: v.number(),
  displayConfig: v.optional(v.any()),
  iconPath: v.optional(v.string()),
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("attributeGroups").order("asc").collect();
  },
  returns: v.array(attributeGroupDoc),
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

    let groups = await ctx.db.query("attributeGroups").take(1000);

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      groups = groups.filter((g) =>
        g.name.toLowerCase().includes(searchLower) ||
        g.code.toLowerCase().includes(searchLower)
      );
    }

    groups.sort((a, b) => a.order - b.order);

    return groups.slice(offset, offset + limit);
  },
  returns: v.array(attributeGroupDoc),
});

export const countAdmin = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const limit = 5000;
    const fetchLimit = limit + 1;

    let groups = await ctx.db.query("attributeGroups").take(fetchLimit);

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      groups = groups.filter((g) =>
        g.name.toLowerCase().includes(searchLower) ||
        g.code.toLowerCase().includes(searchLower)
      );
    }

    return { count: Math.min(groups.length, limit), hasMore: groups.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const getById = query({
  args: { id: v.id("attributeGroups") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(attributeGroupDoc, v.null()),
});

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    slug: v.string(),
    filterType: v.string(),
    inputType: v.string(),
    isFilterable: v.boolean(),
    isSpecialFilter: v.optional(v.boolean()),
    order: v.optional(v.number()),
    displayConfig: v.optional(v.any()),
    iconPath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resolvedSlug = await resolveUniqueSlug(ctx, { scope: "category", slug: args.slug });
    
    if (args.isSpecialFilter && (args.filterType === 'range' || args.inputType === 'range')) {
      throw new Error("Bộ lọc đặc biệt không được phép sử dụng kiểu range");
    }
    
    let nextOrder = args.order;
    if (nextOrder === undefined) {
      const groups = await ctx.db.query("attributeGroups").take(1000);
      nextOrder = groups.reduce((max, group) => Math.max(max, group.order), -1) + 1;
    }
    
    return ctx.db.insert("attributeGroups", {
      ...args,
      slug: resolvedSlug.slug,
      order: nextOrder,
    });
  },
  returns: v.id("attributeGroups"),
});

export const update = mutation({
  args: {
    id: v.id("attributeGroups"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    slug: v.optional(v.string()),
    filterType: v.optional(v.string()),
    inputType: v.optional(v.string()),
    isFilterable: v.optional(v.boolean()),
    isSpecialFilter: v.optional(v.boolean()),
    order: v.optional(v.number()),
    displayConfig: v.optional(v.any()),
    iconPath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const group = await ctx.db.get(id);
    if (!group) throw new Error("Attribute Group not found");

    const finalIsSpecialFilter = args.isSpecialFilter !== undefined ? args.isSpecialFilter : group.isSpecialFilter;
    const finalFilterType = args.filterType !== undefined ? args.filterType : group.filterType;
    const finalInputType = args.inputType !== undefined ? args.inputType : group.inputType;

    if (finalIsSpecialFilter && (finalFilterType === 'range' || finalInputType === 'range')) {
      throw new Error("Bộ lọc đặc biệt không được phép sử dụng kiểu range");
    }

    if (args.slug && args.slug !== group.slug) {
      const resolvedSlug = await resolveUniqueSlug(ctx, {
        scope: "category",
        slug: args.slug,
        exclude: { id: args.id, table: "attributeGroups" },
      });
      if (resolvedSlug.slug !== args.slug) {
        updates.slug = resolvedSlug.slug;
      }
    }
    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { id: v.id("attributeGroups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.id);
    if (!group) throw new Error("Attribute Group not found");

    const terms = await ctx.db
      .query("attributeTerms")
      .withIndex("by_group", (q) => q.eq("groupId", args.id))
      .collect();
    
    for (const term of terms) {
      const productTerms = await ctx.db
        .query("productAttributeTerms")
        .withIndex("by_term", (q) => q.eq("termId", term._id))
        .collect();
      for (const pt of productTerms) {
        await ctx.db.delete(pt._id);
      }
      await ctx.db.delete(term._id);
    }

    const typeMappings = await ctx.db
      .query("productTypeAttributeGroups")
      .withIndex("by_group", (q) => q.eq("groupId", args.id))
      .collect();
    for (const m of typeMappings) {
      await ctx.db.delete(m._id);
    }

    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("attributeGroups") },
  handler: async (ctx, args) => {
    const termsCount = await ctx.db
      .query("attributeTerms")
      .withIndex("by_group", (q) => q.eq("groupId", args.id))
      .take(1001);

    return {
      canDelete: true,
      dependencies: [
        {
          count: Math.min(termsCount.length, 1000),
          hasMore: termsCount.length > 1000,
          label: "Giá trị (Terms)",
          preview: termsCount.slice(0, 5).map((t) => ({ id: t._id, name: t.name })),
        },
      ],
    };
  },
});

export const reorder = mutation({
  args: { items: v.array(v.object({ id: v.id("attributeGroups"), order: v.number() })) },
  handler: async (ctx, args) => {
    await Promise.all(args.items.map(async (item) => ctx.db.patch(item.id, { order: item.order })));
    return null;
  },
  returns: v.null(),
});

export const listAdminIds = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("attributeGroups").take(5001);
    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      items = items.filter((t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.code.toLowerCase().includes(searchLower)
      );
    }
    return {
      ids: items.slice(0, 5000).map((t) => t._id),
      hasMore: items.length > 5000,
    };
  },
});

export const listFilterable = query({
  args: {},
  handler: async (ctx) => {
    const groups = await ctx.db
      .query("attributeGroups")
      .filter(q => q.eq(q.field("isFilterable"), true))
      .order("asc")
      .collect();

    const result = [];
    for (const group of groups) {
      const terms = await ctx.db
        .query("attributeTerms")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .filter(q => q.eq(q.field("active"), true))
        .order("asc")
        .collect();
      if (terms.length > 0) {
        result.push({ ...group, terms });
      }
    }
    return result;
  },
  returns: v.array(
    v.object({
      _creationTime: v.number(),
      _id: v.id("attributeGroups"),
      code: v.string(),
      slug: v.string(),
      name: v.string(),
      filterType: v.string(),
      inputType: v.string(),
      isFilterable: v.boolean(),
      isSpecialFilter: v.optional(v.boolean()),
      order: v.number(),
      displayConfig: v.optional(v.any()),
      iconPath: v.optional(v.string()),
      terms: v.array(v.object({
        _creationTime: v.number(),
        _id: v.id("attributeTerms"),
        groupId: v.id("attributeGroups"),
        slug: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        active: v.boolean(),
        order: v.number(),
        iconType: v.optional(v.string()),
        iconValue: v.optional(v.string()),
      })),
    })
  ),
});

export const getFirstAssignedProductType = query({
  args: { groupId: v.id("attributeGroups") },
  handler: async (ctx, args) => {
    const mapping = await ctx.db
      .query("productTypeAttributeGroups")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();
    if (!mapping) return null;
    const type = await ctx.db.get(mapping.typeId);
    return type ? { slug: type.slug, name: type.name } : null;
  },
  returns: v.union(
    v.object({
      slug: v.string(),
      name: v.string(),
    }),
    v.null()
  ),
});

const assignedProductTypeDoc = v.object({
  _id: v.id("productTypes"),
  active: v.boolean(),
  name: v.string(),
  slug: v.string(),
});

export const listAssignedProductTypes = query({
  args: { groupId: v.id("attributeGroups") },
  handler: async (ctx, args) => {
    const mappings = await ctx.db
      .query("productTypeAttributeGroups")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const types = await Promise.all(mappings.map((mapping) => ctx.db.get(mapping.typeId)));
    return types
      .filter((type): type is NonNullable<typeof type> => Boolean(type))
      .map((type) => ({
        _id: type._id,
        active: type.active,
        name: type.name,
        slug: type.slug,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  returns: v.array(assignedProductTypeDoc),
});

export const listAssignedProductTypesForGroups = query({
  args: { groupIds: v.array(v.id("attributeGroups")) },
  handler: async (ctx, args) => {
    const groupIdSet = new Set(args.groupIds);
    const rows = await Promise.all(
      args.groupIds.map(async (groupId) => {
        const mappings = await ctx.db
          .query("productTypeAttributeGroups")
          .withIndex("by_group", (q) => q.eq("groupId", groupId))
          .collect();
        const types = await Promise.all(mappings.map((mapping) => ctx.db.get(mapping.typeId)));
        return {
          groupId,
          productTypes: types
            .filter((type): type is NonNullable<typeof type> => Boolean(type))
            .map((type) => ({
              _id: type._id,
              active: type.active,
              name: type.name,
              slug: type.slug,
            }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        };
      })
    );
    return rows.filter((row) => groupIdSet.has(row.groupId));
  },
  returns: v.array(v.object({
    groupId: v.id("attributeGroups"),
    productTypes: v.array(assignedProductTypeDoc),
  })),
});

export const listTermCountsForGroups = query({
  args: { groupIds: v.array(v.id("attributeGroups")) },
  handler: async (ctx, args) => {
    const rows = await Promise.all(
      args.groupIds.map(async (groupId) => {
        const terms = await ctx.db
          .query("attributeTerms")
          .withIndex("by_group", (q) => q.eq("groupId", groupId))
          .collect();
        return { groupId, count: terms.length };
      })
    );
    return rows;
  },
  returns: v.array(v.object({
    groupId: v.id("attributeGroups"),
    count: v.number(),
  })),
});
