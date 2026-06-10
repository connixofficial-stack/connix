import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

const filterDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("resourceFilters"),
  active: v.boolean(),
  description: v.optional(v.string()),
  name: v.string(),
  order: v.optional(v.number()),
  slug: v.string(),
  icon: v.optional(v.string()),
  iconStorageId: v.optional(v.union(v.id("_storage"), v.null())),
});

const filterValueDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("resourceFilterValues"),
  filterId: v.id("resourceFilters"),
  name: v.string(),
  slug: v.string(),
  active: v.boolean(),
  order: v.number(),
  icon: v.optional(v.string()),
  iconStorageId: v.optional(v.union(v.id("_storage"), v.null())),
});

const filterWithCountDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("resourceFilters"),
  active: v.boolean(),
  description: v.optional(v.string()),
  name: v.string(),
  order: v.optional(v.number()),
  slug: v.string(),
  icon: v.optional(v.string()),
  iconStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  valuesCount: v.number(),
});

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const filters = await ctx.db
      .query("resourceFilters")
      .take(limit);
    filters.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return Promise.all(
      filters.map(async (filter) => {
        const values = await ctx.db
          .query("resourceFilterValues")
          .withIndex("by_filter", (q) => q.eq("filterId", filter._id))
          .collect();
        return { ...filter, valuesCount: values.length };
      })
    );
  },
  returns: v.array(filterWithCountDoc),
});

export const listActive = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    return ctx.db
      .query("resourceFilters")
      .withIndex("by_active", (q) => q.eq("active", true))
      .take(limit);
  },
  returns: v.array(filterDoc),
});

export const getById = query({
  args: { id: v.id("resourceFilters") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(filterDoc, v.null()),
});

export const create = mutation({
  args: {
    active: v.boolean(),
    description: v.optional(v.string()),
    name: v.string(),
    order: v.optional(v.number()),
    slug: v.string(),
    icon: v.optional(v.string()),
    iconStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    copyToPartner: v.optional(v.boolean()),
    copyValuesFromPartnerSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { copyToPartner, copyValuesFromPartnerSlug, ...filterData } = args;
    let nextOrder = filterData.order;
    if (nextOrder === undefined) {
      const filters = await ctx.db.query("resourceFilters").take(1000);
      nextOrder = filters.reduce((max, filter) => Math.max(max, filter.order ?? -1), -1) + 1;
    }
    const filterId = await ctx.db.insert("resourceFilters", { ...filterData, order: nextOrder });
    if (copyToPartner) {
      await ctx.db.insert("courseFilters", { ...filterData, order: nextOrder });
    }
    if (copyValuesFromPartnerSlug) {
      const partnerFilter = await ctx.db
        .query("courseFilters")
        .withIndex("by_slug", (q) => q.eq("slug", copyValuesFromPartnerSlug))
        .unique();
      if (partnerFilter) {
        const partnerValues = await ctx.db
          .query("courseFilterValues")
          .withIndex("by_filter", (q) => q.eq("filterId", partnerFilter._id))
          .collect();
        for (const pv of partnerValues) {
          await ctx.db.insert("resourceFilterValues", {
            filterId,
            name: pv.name,
            slug: pv.slug,
            active: pv.active,
            order: pv.order,
            icon: pv.icon,
            iconStorageId: pv.iconStorageId,
          });
        }
      }
    }
    return filterId;
  },
  returns: v.id("resourceFilters"),
});

export const update = mutation({
  args: {
    id: v.id("resourceFilters"),
    active: v.optional(v.boolean()),
    description: v.optional(v.string()),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
    slug: v.optional(v.string()),
    icon: v.optional(v.string()),
    iconStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("resourceFilters") },
  handler: async (ctx, args) => {
    const filter = await ctx.db.get(args.id);
    if (!filter) return null;

    // Find values
    const values = await ctx.db
      .query("resourceFilterValues")
      .withIndex("by_filter", (q) => q.eq("filterId", args.id))
      .collect();

    // Delete assignments of those values
    const assignments = await ctx.db
      .query("resourceFilterAssignments")
      .withIndex("by_filter", (q) => q.eq("filterId", args.id))
      .collect();

    await Promise.all(assignments.map((a) => ctx.db.delete(a._id)));
    await Promise.all(values.map((v) => ctx.db.delete(v._id)));

    // Delete filter
    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("resourceFilters") },
  handler: async (ctx, args) => {
    const filter = await ctx.db.get(args.id);
    if (!filter) {
      return { canDelete: false, dependencies: [] };
    }
    const assignments = await ctx.db
      .query("resourceFilterAssignments")
      .withIndex("by_filter", (q) => q.eq("filterId", args.id))
      .collect();

    const resourceIds = assignments.map((a) => a.resourceId);
    const resources = await Promise.all(resourceIds.slice(0, 5).map((resourceId) => ctx.db.get(resourceId)));
    const preview = resources.filter(Boolean).map((c) => ({ id: c!._id, name: c!.title }));

    return {
      canDelete: true,
      dependencies: assignments.length > 0 ? [
        {
          count: assignments.length,
          hasMore: assignments.length > 5,
          label: "Tài nguyên liên quan",
          preview,
        }
      ] : [],
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

// ============ FILTER VALUES API ============

export const listValuesByFilter = query({
  args: { filterId: v.id("resourceFilters") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("resourceFilterValues")
      .withIndex("by_filter", (q) => q.eq("filterId", args.filterId))
      .collect()
      .then(res => res.sort((a, b) => a.order - b.order));
  },
  returns: v.array(filterValueDoc),
});

export const listActiveValuesByFilter = query({
  args: { filterId: v.id("resourceFilters") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("resourceFilterValues")
      .withIndex("by_filter_active_order", (q) => q.eq("filterId", args.filterId).eq("active", true))
      .collect();
  },
  returns: v.array(filterValueDoc),
});

export const listAllValues = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("resourceFilterValues")
      .withIndex("by_order")
      .collect();
  },
  returns: v.array(filterValueDoc),
});

export const createValue = mutation({
  args: {
    filterId: v.id("resourceFilters"),
    name: v.string(),
    slug: v.string(),
    active: v.boolean(),
    order: v.optional(v.number()),
    icon: v.optional(v.string()),
    iconStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    copyToPartner: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { copyToPartner, ...valueData } = args;
    let nextOrder = valueData.order;
    if (nextOrder === undefined) {
      const lastValue = await ctx.db
        .query("resourceFilterValues")
        .withIndex("by_filter", (q) => q.eq("filterId", valueData.filterId))
        .collect()
        .then(res => res.sort((a, b) => b.order - a.order)[0]);
      nextOrder = lastValue ? lastValue.order + 1 : 0;
    }
    const valueId = await ctx.db.insert("resourceFilterValues", {
      ...valueData,
      order: nextOrder,
    });

    if (copyToPartner) {
      const parentFilter = await ctx.db.get(valueData.filterId);
      if (parentFilter) {
        const partnerFilter = await ctx.db
          .query("courseFilters")
          .withIndex("by_slug", (q) => q.eq("slug", parentFilter.slug))
          .unique();
        if (partnerFilter) {
          const existingPartnerValue = await ctx.db
            .query("courseFilterValues")
            .withIndex("by_filter", (q) => q.eq("filterId", partnerFilter._id))
            .collect()
            .then(res => res.find(v => v.slug === valueData.slug));

          if (!existingPartnerValue) {
            let partnerNextOrder = valueData.order;
            if (partnerNextOrder === undefined) {
              const partnerLastValue = await ctx.db
                .query("courseFilterValues")
                .withIndex("by_filter", (q) => q.eq("filterId", partnerFilter._id))
                .collect()
                .then(res => res.sort((a, b) => b.order - a.order)[0]);
              partnerNextOrder = partnerLastValue ? partnerLastValue.order + 1 : 0;
            }
            await ctx.db.insert("courseFilterValues", {
              filterId: partnerFilter._id,
              name: valueData.name,
              slug: valueData.slug,
              active: valueData.active,
              order: partnerNextOrder,
              icon: valueData.icon,
              iconStorageId: valueData.iconStorageId,
            });
          }
        }
      }
    }

    return valueId;
  },
  returns: v.id("resourceFilterValues"),
});

export const copyValuesToPartner = mutation({
  args: {
    filterId: v.id("resourceFilters"),
  },
  handler: async (ctx, args) => {
    const parentFilter = await ctx.db.get(args.filterId);
    if (!parentFilter) {
      throw new Error("Không tìm thấy bộ lọc nguồn");
    }

    const partnerFilter = await ctx.db
      .query("courseFilters")
      .withIndex("by_slug", (q) => q.eq("slug", parentFilter.slug))
      .unique();

    if (!partnerFilter) {
      throw new Error(`Không tìm thấy bộ lọc đối tác có cùng slug "${parentFilter.slug}" bên Khóa học. Vui lòng tạo bộ lọc bên Khóa học trước.`);
    }

    const sourceValues = await ctx.db
      .query("resourceFilterValues")
      .withIndex("by_filter", (q) => q.eq("filterId", args.filterId))
      .collect();

    const targetValues = await ctx.db
      .query("courseFilterValues")
      .withIndex("by_filter", (q) => q.eq("filterId", partnerFilter._id))
      .collect();

    const targetValuesMap = new Map(targetValues.map(v => [v.slug, v]));

    let copiedCount = 0;
    let updatedCount = 0;

    for (const sv of sourceValues) {
      const existingTv = targetValuesMap.get(sv.slug);
      if (existingTv) {
        await ctx.db.patch(existingTv._id, {
          name: sv.name,
          active: sv.active,
          order: sv.order,
          icon: sv.icon,
          iconStorageId: sv.iconStorageId,
        });
        updatedCount++;
      } else {
        await ctx.db.insert("courseFilterValues", {
          filterId: partnerFilter._id,
          name: sv.name,
          slug: sv.slug,
          active: sv.active,
          order: sv.order,
          icon: sv.icon,
          iconStorageId: sv.iconStorageId,
        });
        copiedCount++;
      }
    }

    return { copiedCount, updatedCount };
  },
  returns: v.object({
    copiedCount: v.number(),
    updatedCount: v.number(),
  }),
});

export const updateValue = mutation({
  args: {
    id: v.id("resourceFilterValues"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    active: v.optional(v.boolean()),
    order: v.optional(v.number()),
    icon: v.optional(v.string()),
    iconStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

export const reorder = mutation({
  args: { items: v.array(v.object({ id: v.id("resourceFilters"), order: v.number() })) },
  handler: async (ctx, args) => {
    await Promise.all(args.items.map(async (item) => ctx.db.patch(item.id, { order: item.order })));
    return null;
  },
  returns: v.null(),
});

export const reorderValue = mutation({
  args: { items: v.array(v.object({ id: v.id("resourceFilterValues"), order: v.number() })) },
  handler: async (ctx, args) => {
    await Promise.all(
      args.items.map(async (item) => ctx.db.patch(item.id, { order: item.order }))
    );
    return null;
  },
  returns: v.null(),
});

export const removeValue = mutation({
  args: { id: v.id("resourceFilterValues") },
  handler: async (ctx, args) => {
    // Cascade delete assignments
    const assignments = await ctx.db
      .query("resourceFilterAssignments")
      .withIndex("by_value", (q) => q.eq("valueId", args.id))
      .collect();
    await Promise.all(assignments.map((a) => ctx.db.delete(a._id)));

    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

// ============ ASSIGNMENTS API ============

export const listByResource = query({
  args: { resourceId: v.id("resources") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("resourceFilterAssignments")
      .withIndex("by_resource", (q) => q.eq("resourceId", args.resourceId))
      .collect();
    const values = await Promise.all(assignments.map((item) => ctx.db.get(item.valueId)));
    return values.filter((item): item is Doc<"resourceFilterValues"> => Boolean(item));
  },
  returns: v.array(filterValueDoc),
});

export const listAssignmentsByResources = query({
  args: { resourceIds: v.array(v.id("resources")) },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.resourceIds.map(async (resourceId) => {
        const assignments = await ctx.db
          .query("resourceFilterAssignments")
          .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
          .collect();
        const values = await Promise.all(assignments.map((item) => ctx.db.get(item.valueId)));
        return {
          resourceId,
          values: values.filter((item): item is Doc<"resourceFilterValues"> => Boolean(item)),
        };
      })
    );
    return results;
  },
  returns: v.array(v.object({
    resourceId: v.id("resources"),
    values: v.array(filterValueDoc),
  })),
});

// Helper function used by resource mutations
export async function syncResourceFilterAssignments(
  ctx: MutationCtx,
  resourceId: Id<"resources">,
  valueIds?: Id<"resourceFilterValues">[],
) {
  const ids = Array.from(new Set((valueIds ?? []).filter(Boolean)));
  const existing = await ctx.db
    .query("resourceFilterAssignments")
    .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
    .collect();
  const next = new Set(ids);

  // Delete removed assignments
  await Promise.all(
    existing
      .filter((item) => !next.has(item.valueId))
      .map((item) => ctx.db.delete(item._id))
  );

  // Insert new assignments
  const existingSet = new Set(existing.map((item) => item.valueId));
  await Promise.all(
    ids
      .filter((valueId) => !existingSet.has(valueId))
      .map(async (valueId) => {
        const val = await ctx.db.get(valueId);
        if (!val) return;
        await ctx.db.insert("resourceFilterAssignments", {
          resourceId,
          valueId,
          filterId: val.filterId,
          createdAt: Date.now()
        });
      })
  );
}

export const copyCourseFiltersToResources = mutation({
  args: {},
  handler: async (ctx) => {
    const courseFilters = await ctx.db.query("courseFilters").take(500);
    let filtersCreated = 0;
    let valuesCreated = 0;

    for (const courseFilter of courseFilters) {
      let targetFilter = await ctx.db
        .query("resourceFilters")
        .withIndex("by_slug", (q) => q.eq("slug", courseFilter.slug))
        .unique();
      if (!targetFilter) {
        const targetFilterId = await ctx.db.insert("resourceFilters", {
          active: courseFilter.active,
          description: courseFilter.description,
          icon: courseFilter.icon,
          iconStorageId: courseFilter.iconStorageId,
          name: courseFilter.name,
          order: courseFilter.order,
          slug: courseFilter.slug,
        });
        targetFilter = await ctx.db.get(targetFilterId);
        filtersCreated++;
      }
      if (!targetFilter) {
        continue;
      }

      const sourceValues = await ctx.db
        .query("courseFilterValues")
        .withIndex("by_filter", (q) => q.eq("filterId", courseFilter._id))
        .collect();
      const targetValues = await ctx.db
        .query("resourceFilterValues")
        .withIndex("by_filter", (q) => q.eq("filterId", targetFilter._id))
        .collect();
      const existingSlugs = new Set(targetValues.map((value) => value.slug));
      for (const sourceValue of sourceValues) {
        if (existingSlugs.has(sourceValue.slug)) {
          continue;
        }
        await ctx.db.insert("resourceFilterValues", {
          active: sourceValue.active,
          filterId: targetFilter._id,
          icon: sourceValue.icon,
          iconStorageId: sourceValue.iconStorageId,
          name: sourceValue.name,
          order: sourceValue.order,
          slug: sourceValue.slug,
        });
        valuesCreated++;
      }
    }

    return { filtersCreated, valuesCreated };
  },
  returns: v.object({
    filtersCreated: v.number(),
    valuesCreated: v.number(),
  }),
});

export const copyResourceFiltersToCourses = mutation({
  args: {},
  handler: async (ctx) => {
    const resourceFilters = await ctx.db.query("resourceFilters").take(500);
    let filtersCreated = 0;
    let valuesCreated = 0;

    for (const resourceFilter of resourceFilters) {
      let targetFilter = await ctx.db
        .query("courseFilters")
        .withIndex("by_slug", (q) => q.eq("slug", resourceFilter.slug))
        .unique();
      if (!targetFilter) {
        const targetFilterId = await ctx.db.insert("courseFilters", {
          active: resourceFilter.active,
          description: resourceFilter.description,
          icon: resourceFilter.icon,
          iconStorageId: resourceFilter.iconStorageId,
          name: resourceFilter.name,
          order: resourceFilter.order,
          slug: resourceFilter.slug,
        });
        targetFilter = await ctx.db.get(targetFilterId);
        filtersCreated++;
      }
      if (!targetFilter) {
        continue;
      }

      const sourceValues = await ctx.db
        .query("resourceFilterValues")
        .withIndex("by_filter", (q) => q.eq("filterId", resourceFilter._id))
        .collect();
      const targetValues = await ctx.db
        .query("courseFilterValues")
        .withIndex("by_filter", (q) => q.eq("filterId", targetFilter._id))
        .collect();
      const existingSlugs = new Set(targetValues.map((value) => value.slug));
      for (const sourceValue of sourceValues) {
        if (existingSlugs.has(sourceValue.slug)) {
          continue;
        }
        await ctx.db.insert("courseFilterValues", {
          active: sourceValue.active,
          filterId: targetFilter._id,
          icon: sourceValue.icon,
          iconStorageId: sourceValue.iconStorageId,
          name: sourceValue.name,
          order: sourceValue.order,
          slug: sourceValue.slug,
        });
        valuesCreated++;
      }
    }

    return { filtersCreated, valuesCreated };
  },
  returns: v.object({
    filtersCreated: v.number(),
    valuesCreated: v.number(),
  }),
});

export const listUnmappedPartnerFilters = query({
  args: {},
  handler: async (ctx) => {
    const currentFilters = await ctx.db.query("resourceFilters").collect();
    const currentSlugs = new Set(currentFilters.map((f) => f.slug));

    const partnerFilters = await ctx.db.query("courseFilters").collect();
    return partnerFilters.filter((pf) => !currentSlugs.has(pf.slug));
  },
  returns: v.array(
    v.object({
      _creationTime: v.number(),
      _id: v.id("courseFilters"),
      active: v.boolean(),
      description: v.optional(v.string()),
      name: v.string(),
      order: v.optional(v.number()),
      slug: v.string(),
      icon: v.optional(v.string()),
      iconStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    })
  ),
});
