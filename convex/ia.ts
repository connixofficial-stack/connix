import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { listSlugConflicts, resolveSlugConflicts } from "./lib/iaSlugs";
import { isMultiCategoryEnabled } from "./lib/multiCategory";

async function resolveUnifiedCategoryInternal(ctx: QueryCtx, args: { slug: string }) {
  const slug = args.slug.trim().toLowerCase();
  if (!slug) {return null;}

  const [postCategory, productCategory, serviceCategory, courseCategory, projectCategory, resourceCategory] = await Promise.all([
    ctx.db.query("postCategories").withIndex("by_slug", (q) => q.eq("slug", slug)).unique(),
    ctx.db.query("productCategories").withIndex("by_slug", (q) => q.eq("slug", slug)).unique(),
    ctx.db.query("serviceCategories").withIndex("by_slug", (q) => q.eq("slug", slug)).unique(),
    ctx.db.query("courseCategories").withIndex("by_slug", (q) => q.eq("slug", slug)).unique(),
    ctx.db.query("projectCategories").withIndex("by_slug", (q) => q.eq("slug", slug)).unique(),
    ctx.db.query("resourceCategories").withIndex("by_slug", (q) => q.eq("slug", slug)).unique(),
  ]);

  const matches = [
    postCategory && { moduleKey: "posts" as const, category: postCategory },
    productCategory && { moduleKey: "products" as const, category: productCategory },
    serviceCategory && { moduleKey: "services" as const, category: serviceCategory },
    courseCategory && { moduleKey: "courses" as const, category: courseCategory },
    projectCategory && { moduleKey: "projects" as const, category: projectCategory },
    resourceCategory && { moduleKey: "resources" as const, category: resourceCategory },
  ].filter(Boolean);

  if (matches.length !== 1) {
    return null;
  }

  const match = matches[0]!;
  return {
    moduleKey: match.moduleKey,
    categoryId: match.category._id,
    categorySlug: match.category.slug,
    categoryName: match.category.name,
    categoryDescription: match.category.description ?? "",
  };
}

async function resolveUnifiedDetailInternal(ctx: QueryCtx, args: { categorySlug: string, recordSlug: string }) {
  const categorySlug = args.categorySlug.trim().toLowerCase();
  const recordSlug = args.recordSlug.trim().toLowerCase();
  if (!categorySlug || !recordSlug) {return null;}

  const [postCategory, productCategory, serviceCategory, courseCategory, projectCategory, resourceCategory] = await Promise.all([
    ctx.db.query("postCategories").withIndex("by_slug", (q) => q.eq("slug", categorySlug)).unique(),
    ctx.db.query("productCategories").withIndex("by_slug", (q) => q.eq("slug", categorySlug)).unique(),
    ctx.db.query("serviceCategories").withIndex("by_slug", (q) => q.eq("slug", categorySlug)).unique(),
    ctx.db.query("courseCategories").withIndex("by_slug", (q) => q.eq("slug", categorySlug)).unique(),
    ctx.db.query("projectCategories").withIndex("by_slug", (q) => q.eq("slug", categorySlug)).unique(),
    ctx.db.query("resourceCategories").withIndex("by_slug", (q) => q.eq("slug", categorySlug)).unique(),
  ]);

  const matches = [
    postCategory && { moduleKey: "posts" as const, category: postCategory },
    productCategory && { moduleKey: "products" as const, category: productCategory },
    serviceCategory && { moduleKey: "services" as const, category: serviceCategory },
    courseCategory && { moduleKey: "courses" as const, category: courseCategory },
    projectCategory && { moduleKey: "projects" as const, category: projectCategory },
    resourceCategory && { moduleKey: "resources" as const, category: resourceCategory },
  ].filter(Boolean);

  if (matches.length !== 1) {
    return null;
  }

  const match = matches[0]!;

  if (match.moduleKey === "posts") {
    const post = await ctx.db.query("posts").withIndex("by_slug", (q) => q.eq("slug", recordSlug)).unique();
    if (!post || post.status !== "Published") {return null;}
    const now = Date.now();
    if (typeof post.publishedAt === "number" && post.publishedAt > now) {return null;}
    if (post.categoryId !== match.category._id) {
      const assignment = await ctx.db
        .query("postCategoryAssignments")
        .withIndex("by_post_category", (q) => q.eq("postId", post._id).eq("categoryId", match.category._id))
        .unique();
      if (!assignment || !await isMultiCategoryEnabled(ctx, "posts")) {return null;}
    }
    const primaryCategory = await ctx.db.get(post.categoryId);
    if (!primaryCategory) {return null;}
    return {
      moduleKey: "posts" as const,
      categoryId: primaryCategory._id,
      categorySlug: primaryCategory.slug,
      recordId: post._id,
      recordSlug: post.slug,
    };
  }
  if (match.moduleKey === "products") {
    const product = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", recordSlug)).unique();
    if (!product || product.status !== "Active") {return null;}
    if (product.categoryId !== match.category._id) {
      const assignment = await ctx.db
        .query("productCategoryAssignments")
        .withIndex("by_product_category", (q) => q.eq("productId", product._id).eq("categoryId", match.category._id))
        .unique();
      if (!assignment || !await isMultiCategoryEnabled(ctx, "products")) {return null;}
    }
    const primaryCategory = await ctx.db.get(product.categoryId);
    if (!primaryCategory) {return null;}
    return {
      moduleKey: "products" as const,
      categoryId: primaryCategory._id,
      categorySlug: primaryCategory.slug,
      recordId: product._id,
      recordSlug: product.slug,
    };
  }
  if (match.moduleKey === "services") {
    const service = await ctx.db.query("services").withIndex("by_slug", (q) => q.eq("slug", recordSlug)).unique();
    if (!service || service.status !== "Published") {return null;}
    if (service.categoryId !== match.category._id) {
      const assignment = await ctx.db
        .query("serviceCategoryAssignments")
        .withIndex("by_service_category", (q) => q.eq("serviceId", service._id).eq("categoryId", match.category._id))
        .unique();
      if (!assignment || !await isMultiCategoryEnabled(ctx, "services")) {return null;}
    }
    const primaryCategory = await ctx.db.get(service.categoryId);
    if (!primaryCategory) {return null;}
    return {
      moduleKey: "services" as const,
      categoryId: primaryCategory._id,
      categorySlug: primaryCategory.slug,
      recordId: service._id,
      recordSlug: service.slug,
    };
  }
  if (match.moduleKey === "courses") {
    const course = await ctx.db.query("courses").withIndex("by_slug", (q) => q.eq("slug", recordSlug)).unique();
    if (!course || course.status !== "Published") {return null;}
    if (course.categoryId !== match.category._id) {
      const assignment = await ctx.db
        .query("courseCategoryAssignments")
        .withIndex("by_course_category", (q) => q.eq("courseId", course._id).eq("categoryId", match.category._id))
        .unique();
      if (!assignment || !await isMultiCategoryEnabled(ctx, "courses")) {return null;}
    }
    const primaryCategory = await ctx.db.get(course.categoryId);
    if (!primaryCategory) {return null;}
    return {
      moduleKey: "courses" as const,
      categoryId: primaryCategory._id,
      categorySlug: primaryCategory.slug,
      recordId: course._id,
      recordSlug: course.slug,
    };
  }
  if (match.moduleKey === "projects") {
    const project = await ctx.db.query("projects").withIndex("by_slug", (q) => q.eq("slug", recordSlug)).unique();
    if (!project || project.status !== "Published") {return null;}
    if (project.categoryId !== match.category._id) {
      const assignment = await ctx.db
        .query("projectCategoryAssignments")
        .withIndex("by_project_category", (q) => q.eq("projectId", project._id).eq("categoryId", match.category._id))
        .unique();
      if (!assignment || !await isMultiCategoryEnabled(ctx, "projects")) {return null;}
    }
    const primaryCategory = await ctx.db.get(project.categoryId);
    if (!primaryCategory) {return null;}
    return {
      moduleKey: "projects" as const,
      categoryId: primaryCategory._id,
      categorySlug: primaryCategory.slug,
      recordId: project._id,
      recordSlug: project.slug,
    };
  }
  if (match.moduleKey === "resources") {
    const resource = await ctx.db.query("resources").withIndex("by_slug", (q) => q.eq("slug", recordSlug)).unique();
    if (!resource || resource.status !== "Published") {return null;}
    if (resource.categoryId !== match.category._id) {
      const assignment = await ctx.db
        .query("resourceCategoryAssignments")
        .withIndex("by_resource_category", (q) => q.eq("resourceId", resource._id).eq("categoryId", match.category._id))
        .unique();
      if (!assignment || !await isMultiCategoryEnabled(ctx, "resources")) {return null;}
    }
    const primaryCategory = await ctx.db.get(resource.categoryId);
    if (!primaryCategory) {return null;}
    return {
      moduleKey: "resources" as const,
      categoryId: primaryCategory._id,
      categorySlug: primaryCategory.slug,
      recordId: resource._id,
      recordSlug: resource.slug,
    };
  }
  return null;
}

export const resolveUnifiedCategory = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return resolveUnifiedCategoryInternal(ctx, args);
  },
  returns: v.union(v.object({
    moduleKey: v.union(v.literal("posts"), v.literal("products"), v.literal("services"), v.literal("courses"), v.literal("projects"), v.literal("resources")),
    categoryId: v.union(v.id("postCategories"), v.id("productCategories"), v.id("serviceCategories"), v.id("courseCategories"), v.id("projectCategories"), v.id("resourceCategories")),
    categorySlug: v.string(),
    categoryName: v.string(),
    categoryDescription: v.string(),
  }), v.null()),
});

export const resolveUnifiedDetail = query({
  args: { categorySlug: v.string(), recordSlug: v.string() },
  handler: async (ctx, args) => {
    return resolveUnifiedDetailInternal(ctx, args);
  },
  returns: v.union(v.object({
    moduleKey: v.union(v.literal("posts"), v.literal("products"), v.literal("services"), v.literal("courses"), v.literal("projects"), v.literal("resources")),
    categoryId: v.union(v.id("postCategories"), v.id("productCategories"), v.id("serviceCategories"), v.id("courseCategories"), v.id("projectCategories"), v.id("resourceCategories")),
    categorySlug: v.string(),
    recordId: v.union(v.id("posts"), v.id("products"), v.id("services"), v.id("courses"), v.id("projects"), v.id("resources")),
    recordSlug: v.string(),
  }), v.null()),
});

export const listConflicts = query({
  args: { scope: v.optional(v.union(v.literal("record"), v.literal("category"), v.literal("all"))) },
  handler: async (ctx, args) => listSlugConflicts(ctx, args.scope ?? "all"),
  returns: v.array(v.object({
    scope: v.union(v.literal("record"), v.literal("category")),
    slug: v.string(),
    reserved: v.boolean(),
    items: v.array(v.object({
      id: v.union(v.id("posts"), v.id("products"), v.id("services"), v.id("courses"), v.id("projects"), v.id("resources"), v.id("postCategories"), v.id("productCategories"), v.id("serviceCategories"), v.id("courseCategories"), v.id("projectCategories"), v.id("resourceCategories")),
      label: v.string(),
      table: v.union(
        v.literal("posts"),
        v.literal("products"),
        v.literal("services"),
        v.literal("courses"),
        v.literal("projects"),
        v.literal("resources"),
        v.literal("postCategories"),
        v.literal("productCategories"),
        v.literal("serviceCategories"),
        v.literal("courseCategories"),
        v.literal("projectCategories"),
        v.literal("resourceCategories")
      ),
    })),
  })),
});

export const resolveConflicts = mutation({
  args: { scope: v.optional(v.union(v.literal("record"), v.literal("category"), v.literal("all"))) },
  handler: async (ctx, args) => resolveSlugConflicts(ctx, args.scope ?? "all"),
  returns: v.number(),
});

export const resolveProductLandingContext = query({
  args: { slugs: v.array(v.string()) },
  handler: async (ctx, args) => {
    const slugs = args.slugs.map((s) => s.trim().toLowerCase());
    if (slugs.length === 0 || slugs.length > 3) return null;

    const enabled = await isProductTypesEnabled(ctx);

    if (!enabled) {
      if (slugs.length === 1) {
        const cat = await resolveUnifiedCategoryInternal(ctx, { slug: slugs[0]! });
        if (cat) {
          return {
            type: "category" as const,
            moduleKey: cat.moduleKey,
            categoryId: cat.categoryId,
            categorySlug: cat.categorySlug,
            categoryName: cat.categoryName,
            categoryDescription: cat.categoryDescription,
          };
        }
      } else if (slugs.length === 2) {
        const detail = await resolveUnifiedDetailInternal(ctx, { categorySlug: slugs[0]!, recordSlug: slugs[1]! });
        if (detail) {
          return {
            type: "detail" as const,
            moduleKey: detail.moduleKey,
            categoryId: detail.categoryId,
            categorySlug: detail.categorySlug,
            recordId: detail.recordId,
            recordSlug: detail.recordSlug,
          };
        }
      }
      return null;
    }

    if (slugs.length === 1) {
      const typeSlug = slugs[0]!;
      const productType = await ctx.db
        .query("productTypes")
        .withIndex("by_slug", (q) => q.eq("slug", typeSlug))
        .unique();
      
      if (productType && productType.active) {
        return {
          type: "productType" as const,
          productTypeId: productType._id,
          productTypeSlug: productType.slug,
          productTypeName: productType.name,
          productTypeDescription: productType.description ?? "",
        };
      }

      const cat = await resolveUnifiedCategoryInternal(ctx, { slug: typeSlug });
      if (cat) {
        return {
          type: "category" as const,
          moduleKey: cat.moduleKey,
          categoryId: cat.categoryId,
          categorySlug: cat.categorySlug,
          categoryName: cat.categoryName,
          categoryDescription: cat.categoryDescription,
        };
      }
      return null;
    }

    if (slugs.length === 2) {
      const [typeSlug, subSlug] = slugs as [string, string];
      
      if (typeSlug === "products") {
        const cat = await ctx.db
          .query("productCategories")
          .withIndex("by_slug", (q) => q.eq("slug", subSlug))
          .unique();
        
        if (cat && cat.active) {
          return {
            type: "productTypeCategory" as const,
            categoryId: cat._id,
            productTypeSlug: "products",
            categorySlug: cat.slug,
            categoryName: cat.name,
            categoryDescription: cat.description ?? "",
          };
        }

        const group = await ctx.db
          .query("attributeGroups")
          .withIndex("by_slug", (q) => q.eq("slug", subSlug))
          .unique();
        
        if (group && group.isFilterable) {
          return {
            type: "productTypeAttribute" as const,
            productTypeSlug: "products",
            groupId: group._id,
            groupSlug: group.slug,
            groupName: group.name,
          };
        }
      }

      const productType = await ctx.db
        .query("productTypes")
        .withIndex("by_slug", (q) => q.eq("slug", typeSlug))
        .unique();
      
      if (productType && productType.active) {
        const mappings = await ctx.db
          .query("productCategoryTypes")
          .withIndex("by_type", (q) => q.eq("typeId", productType._id))
          .collect();
        
        let targetCategory = null;
        for (const m of mappings) {
          const cat = await ctx.db.get(m.categoryId);
          if (cat && cat.active && cat.slug === subSlug) {
            targetCategory = cat;
            break;
          }
        }
        
        if (targetCategory) {
          return {
            type: "productTypeCategory" as const,
            productTypeId: productType._id,
            categoryId: targetCategory._id,
            productTypeSlug: productType.slug,
            categorySlug: targetCategory.slug,
            categoryName: targetCategory.name,
            categoryDescription: targetCategory.description ?? "",
          };
        }

        const ranges = productType.priceRanges ?? [];
        const targetRange = ranges.find((r) => r.slug === subSlug);
        if (targetRange) {
          return {
            type: "productTypePriceRange" as const,
            productTypeId: productType._id,
            productTypeSlug: productType.slug,
            priceRange: targetRange,
          };
        }

        const group = await ctx.db
          .query("attributeGroups")
          .withIndex("by_slug", (q) => q.eq("slug", subSlug))
          .unique();
        
        if (group && group.isFilterable) {
          const mapping = await ctx.db
            .query("productTypeAttributeGroups")
            .withIndex("by_type", (q) => q.eq("typeId", productType._id))
            .collect();
          
          const isAssigned = mapping.some((m) => m.groupId === group._id);
          if (isAssigned) {
            return {
              type: "productTypeAttribute" as const,
              productTypeId: productType._id,
              productTypeSlug: productType.slug,
              groupId: group._id,
              groupSlug: group.slug,
              groupName: group.name,
            };
          }
        }

        const detail = await resolveUnifiedDetailInternal(ctx, { categorySlug: typeSlug, recordSlug: subSlug });
        if (detail && detail.moduleKey === "products") {
          return {
            type: "detail" as const,
            moduleKey: "products" as const,
            categoryId: detail.categoryId,
            categorySlug: detail.categorySlug,
            recordId: detail.recordId,
            recordSlug: detail.recordSlug,
          };
        }
      } else {
        const detail = await resolveUnifiedDetailInternal(ctx, { categorySlug: typeSlug, recordSlug: subSlug });
        if (detail) {
          return {
            type: "detail" as const,
            moduleKey: detail.moduleKey,
            categoryId: detail.categoryId,
            categorySlug: detail.categorySlug,
            recordId: detail.recordId,
            recordSlug: detail.recordSlug,
          };
        }
      }
      return null;
    }

    if (slugs.length === 3) {
      const [typeSlug, groupSlug, termSlug] = slugs as [string, string, string];
      
      if (typeSlug === "products") {
        const group = await ctx.db
          .query("attributeGroups")
          .withIndex("by_slug", (q) => q.eq("slug", groupSlug))
          .unique();
        
        if (group && group.isFilterable) {
          const requestedSlugs = termSlug.split(",");
          const uniqueRequested = Array.from(new Set(requestedSlugs));
          if (
            requestedSlugs.length !== uniqueRequested.length ||
            uniqueRequested.length === 0 ||
            uniqueRequested.some((slug) => !slug)
          ) {
            return null;
          }
          if (uniqueRequested.length > 1 && group.filterType !== "multiple") {
            return null;
          }
          if (group.filterType === "range") {
            return null;
          }
          const allTerms = await ctx.db
            .query("attributeTerms")
            .withIndex("by_group", (q) => q.eq("groupId", group._id))
            .collect();
          
          const matchedTerms = allTerms.filter(t => uniqueRequested.includes(t.slug) && t.active);
          
          if (matchedTerms.length === uniqueRequested.length && matchedTerms.length > 0) {
            return {
              type: "productTypeAttribute" as const,
              productTypeSlug: "products",
              groupId: group._id,
              groupSlug: group.slug,
              groupName: group.name,
              termId: matchedTerms[0]._id,
              termSlug: termSlug,
              termName: matchedTerms.map(t => t.name).join(", "),
            };
          }
        }
        return null;
      }

      const productType = await ctx.db
        .query("productTypes")
        .withIndex("by_slug", (q) => q.eq("slug", typeSlug))
        .unique();
      
      if (productType && productType.active) {
        const group = await ctx.db
          .query("attributeGroups")
          .withIndex("by_slug", (q) => q.eq("slug", groupSlug))
          .unique();
        
        if (group && group.isFilterable) {
          const mapping = await ctx.db
            .query("productTypeAttributeGroups")
            .withIndex("by_type", (q) => q.eq("typeId", productType._id))
            .collect();
          
          const isAssigned = mapping.some((m) => m.groupId === group._id);
          if (isAssigned) {
            const requestedSlugs = termSlug.split(",");
            const uniqueRequested = Array.from(new Set(requestedSlugs));
            if (
              requestedSlugs.length !== uniqueRequested.length ||
              uniqueRequested.length === 0 ||
              uniqueRequested.some((slug) => !slug)
            ) {
              return null;
            }
            if (uniqueRequested.length > 1 && group.filterType !== "multiple") {
              return null;
            }
            if (group.filterType === "range") {
              return null;
            }
            const allTerms = await ctx.db
              .query("attributeTerms")
              .withIndex("by_group", (q) => q.eq("groupId", group._id))
              .collect();
            
            const matchedTerms = allTerms.filter(t => uniqueRequested.includes(t.slug) && t.active);
            
            if (matchedTerms.length === uniqueRequested.length && matchedTerms.length > 0) {
              return {
                type: "productTypeAttribute" as const,
                productTypeId: productType._id,
                productTypeSlug: productType.slug,
                groupId: group._id,
                groupSlug: group.slug,
                groupName: group.name,
                termId: matchedTerms[0]._id,
                termSlug: termSlug,
                termName: matchedTerms.map(t => t.name).join(", "),
              };
            }
          }
        }
      }
      return null;
    }

    return null;
  },
  returns: v.union(
    v.object({
      type: v.literal("category"),
      moduleKey: v.union(v.literal("posts"), v.literal("products"), v.literal("services"), v.literal("courses"), v.literal("projects"), v.literal("resources")),
      categoryId: v.union(v.id("postCategories"), v.id("productCategories"), v.id("serviceCategories"), v.id("courseCategories"), v.id("projectCategories"), v.id("resourceCategories")),
      categorySlug: v.string(),
      categoryName: v.string(),
      categoryDescription: v.string(),
    }),
    v.object({
      type: v.literal("detail"),
      moduleKey: v.union(v.literal("posts"), v.literal("products"), v.literal("services"), v.literal("courses"), v.literal("projects"), v.literal("resources")),
      categoryId: v.union(v.id("postCategories"), v.id("productCategories"), v.id("serviceCategories"), v.id("courseCategories"), v.id("projectCategories"), v.id("resourceCategories")),
      categorySlug: v.string(),
      recordId: v.union(v.id("posts"), v.id("products"), v.id("services"), v.id("courses"), v.id("projects"), v.id("resources")),
      recordSlug: v.string(),
    }),
    v.object({
      type: v.literal("productType"),
      productTypeId: v.id("productTypes"),
      productTypeSlug: v.string(),
      productTypeName: v.string(),
      productTypeDescription: v.string(),
    }),
    v.object({
      type: v.literal("productTypeCategory"),
      productTypeId: v.optional(v.id("productTypes")),
      categoryId: v.id("productCategories"),
      productTypeSlug: v.string(),
      categorySlug: v.string(),
      categoryName: v.string(),
      categoryDescription: v.string(),
    }),
    v.object({
      type: v.literal("productTypePriceRange"),
      productTypeId: v.id("productTypes"),
      productTypeSlug: v.string(),
      priceRange: v.object({
        label: v.string(),
        slug: v.string(),
        minPrice: v.optional(v.number()),
        maxPrice: v.optional(v.number()),
      }),
    }),
    v.object({
      type: v.literal("productTypeAttribute"),
      productTypeId: v.optional(v.id("productTypes")),
      productTypeSlug: v.string(),
      groupId: v.id("attributeGroups"),
      groupSlug: v.string(),
      groupName: v.string(),
      termId: v.optional(v.id("attributeTerms")),
      termSlug: v.optional(v.string()),
      termName: v.optional(v.string()),
    }),
    v.null()
  ),
});

async function isProductTypesEnabled(ctx: QueryCtx) {
  const setting = await ctx.db
    .query("moduleSettings")
    .withIndex("by_module_setting", (q) =>
      q.eq("moduleKey", "products").eq("settingKey", "enableProductTypes")
    )
    .unique();
  return Boolean(setting?.value);
}
