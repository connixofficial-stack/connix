import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { buildProgrammaticLandingPlan, type ProgrammaticLandingSeed } from "../lib/seo/programmatic-landing";
import {
  buildProgrammaticSyncDecision,
  type ExistingProgrammaticLandingPage,
} from "../lib/seo/programmatic-landing-sync";

const landingPageDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("landingPages"),
  slug: v.string(),
  title: v.string(),
  summary: v.string(),
  content: v.optional(v.string()),
  heroImage: v.optional(v.string()),
  status: v.union(v.literal("draft"), v.literal("published")),
  landingType: v.union(
    v.literal("feature"),
    v.literal("use-case"),
    v.literal("solution"),
    v.literal("compare"),
    v.literal("integration"),
    v.literal("template"),
    v.literal("guide")
  ),
  primaryIntent: v.optional(v.string()),
  faqItems: v.optional(v.array(v.object({
    question: v.string(),
    answer: v.string(),
  }))),
  relatedSlugs: v.optional(v.array(v.string())),
  relatedProductSlugs: v.optional(v.array(v.string())),
  relatedServiceSlugs: v.optional(v.array(v.string())),
  updatedAt: v.number(),
  publishedAt: v.optional(v.number()),
  order: v.optional(v.number()),
});

const paginatedLandingPages = v.object({
  continueCursor: v.string(),
  isDone: v.boolean(),
  page: v.array(landingPageDoc),
  pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  splitCursor: v.optional(v.union(v.string(), v.null())),
});

const getSettingValue = async (ctx: { db: any }, key: string): Promise<string | undefined> => {
  const setting = await ctx.db
    .query("settings")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .unique();
  return setting?.value as string | undefined;
};

const PROGRAMMATIC_LIMIT = 6;

const getProgrammaticSeedData = async (ctx: { db: any }): Promise<ProgrammaticLandingSeed> => {
  const [siteName, modules, products, services, posts, homeComponents] = await Promise.all([
    getSettingValue(ctx, "site_name"),
    ctx.db.query("adminModules").withIndex("by_enabled_order", (q: any) => q.eq("enabled", true)).collect(),
    ctx.db
      .query("products")
      .withIndex("by_status_order", (q: any) => q.eq("status", "Active"))
      .order("desc")
      .collect(),
    ctx.db
      .query("services")
      .withIndex("by_status_publishedAt", (q: any) => q.eq("status", "Published"))
      .order("desc")
      .collect(),
    ctx.db
      .query("posts")
      .withIndex("by_status_publishedAt", (q: any) => q.eq("status", "Published"))
      .order("desc")
      .collect(),
    ctx.db
      .query("homeComponents")
      .withIndex("by_active_order", (q: any) => q.eq("active", true))
      .order("desc")
      .collect(),
  ]);

  return {
    homeComponents: homeComponents.slice(0, PROGRAMMATIC_LIMIT).map((item: any) => ({
      title: item.title,
      type: item.type,
    })),
    modules: modules.map((moduleItem: any) => ({
      category: moduleItem.category,
      description: moduleItem.description,
      key: moduleItem.key,
      name: moduleItem.name,
    })),
    posts: posts.slice(0, PROGRAMMATIC_LIMIT).map((post: any) => ({
      slug: post.slug,
      title: post.title,
    })),
    products: products.slice(0, PROGRAMMATIC_LIMIT).map((product: any) => ({
      name: product.name,
      slug: product.slug,
    })),
    services: services.slice(0, PROGRAMMATIC_LIMIT).map((service: any) => ({
      slug: service.slug,
      title: service.title,
    })),
    siteName: siteName ?? "Website",
  };
};

const listExistingProgrammaticPages = async (ctx: { db: any }): Promise<ExistingProgrammaticLandingPage[]> => {
  const existing = await ctx.db.query("landingPages").collect();
  return existing.map((page: any) => ({
    _id: page._id,
    content: page.content,
    faqItems: page.faqItems,
    heroImage: page.heroImage,
    landingType: page.landingType,
    order: page.order,
    primaryIntent: page.primaryIntent,
    publishedAt: page.publishedAt,
    relatedProductSlugs: page.relatedProductSlugs,
    relatedServiceSlugs: page.relatedServiceSlugs,
    relatedSlugs: page.relatedSlugs,
    slug: page.slug,
    status: page.status,
    summary: page.summary,
    title: page.title,
  }));
};

const buildProgrammaticDecision = async (ctx: { db: any }) => {
  const seed = await getProgrammaticSeedData(ctx);
  const plan = buildProgrammaticLandingPlan(seed);
  const existingPages = await listExistingProgrammaticPages(ctx);

  return buildProgrammaticSyncDecision({
    existingPages,
    nextPlan: plan,
  });
};

const applyProgrammaticDecision = async (ctx: { db: any }, now: number) => {
  const decision = await buildProgrammaticDecision(ctx);

  for (const item of decision.create) {
    await ctx.db.insert("landingPages", {
      content: item.content,
      faqItems: item.faqItems,
      landingType: item.landingType,
      order: item.order,
      primaryIntent: item.primaryIntent,
      relatedProductSlugs: item.relatedProductSlugs,
      relatedServiceSlugs: item.relatedServiceSlugs,
      relatedSlugs: item.relatedSlugs,
      slug: item.slug,
      status: "draft",
      summary: item.summary,
      title: item.title,
      updatedAt: now,
      publishedAt: undefined,
    });
  }

  for (const item of decision.update) {
    const publishedAt =
      item.status === "published" && item.existing.status !== "published"
        ? now
        : item.existing.publishedAt;
    await ctx.db.patch(item.existing._id, {
      content: item.next.content,
      faqItems: item.next.faqItems,
      landingType: item.next.landingType,
      order: item.next.order,
      primaryIntent: item.next.primaryIntent,
      relatedProductSlugs: item.next.relatedProductSlugs,
      relatedServiceSlugs: item.next.relatedServiceSlugs,
      relatedSlugs: item.next.relatedSlugs,
      slug: item.next.slug,
      status: item.status,
      summary: item.next.summary,
      title: item.next.title,
      updatedAt: now,
      publishedAt,
    });
  }

  return decision;
};

// Public: list published by type
export const listPublishedByType = query({
  args: {
    landingType: v.union(
      v.literal("feature"),
      v.literal("use-case"),
      v.literal("solution"),
      v.literal("compare"),
      v.literal("integration"),
      v.literal("template"),
      v.literal("guide")
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("landingPages")
      .withIndex("by_type_status", (q) => q.eq("landingType", args.landingType).eq("status", "published"))
      .order("desc")
      .paginate(args.paginationOpts);
  },
  returns: paginatedLandingPages,
});

// Public: get by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .filter((q) => q.eq(q.field("status"), "published"))
      .first();
  },
  returns: v.union(landingPageDoc, v.null()),
});

// Public: list all published (for sitemap)
export const listAllPublished = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return ctx.db
      .query("landingPages")
      .withIndex("by_status_updatedAt", (q) => q.eq("status", "published"))
      .order("desc")
      .paginate(args.paginationOpts);
  },
  returns: paginatedLandingPages,
});

// Admin: list all
export const listAll = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return ctx.db
      .query("landingPages")
      .order("desc")
      .paginate(args.paginationOpts);
  },
  returns: paginatedLandingPages,
});

// Admin: get by id
export const getById = query({
  args: { id: v.id("landingPages") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
  returns: v.union(landingPageDoc, v.null()),
});

// Admin: create
export const create = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    summary: v.string(),
    content: v.optional(v.string()),
    heroImage: v.optional(v.string()),
    landingType: v.union(
      v.literal("feature"),
      v.literal("use-case"),
      v.literal("solution"),
      v.literal("compare"),
      v.literal("integration"),
      v.literal("template"),
      v.literal("guide")
    ),
    primaryIntent: v.optional(v.string()),
    faqItems: v.optional(v.array(v.object({
      question: v.string(),
      answer: v.string(),
    }))),
    relatedSlugs: v.optional(v.array(v.string())),
    relatedProductSlugs: v.optional(v.array(v.string())),
    relatedServiceSlugs: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("landingPages", {
      ...args,
      status: args.status ?? "draft",
      updatedAt: now,
      publishedAt: args.status === "published" ? now : undefined,
    });
  },
  returns: v.id("landingPages"),
});

// Admin: update
export const update = mutation({
  args: {
    id: v.id("landingPages"),
    slug: v.optional(v.string()),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    content: v.optional(v.string()),
    heroImage: v.optional(v.string()),
    landingType: v.optional(v.union(
      v.literal("feature"),
      v.literal("use-case"),
      v.literal("solution"),
      v.literal("compare"),
      v.literal("integration"),
      v.literal("template"),
      v.literal("guide")
    )),
    primaryIntent: v.optional(v.string()),
    faqItems: v.optional(v.array(v.object({
      question: v.string(),
      answer: v.string(),
    }))),
    relatedSlugs: v.optional(v.array(v.string())),
    relatedProductSlugs: v.optional(v.array(v.string())),
    relatedServiceSlugs: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Landing page not found");
    }

    const now = Date.now();
    const publishedAt =
      updates.status === "published" && existing.status !== "published"
        ? now
        : existing.publishedAt;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
      publishedAt,
    });

    return id;
  },
  returns: v.id("landingPages"),
});

// Admin: delete
export const remove = mutation({
  args: { id: v.id("landingPages") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
  returns: v.null(),
});

export const bulkUpdateStatus = mutation({
  args: {
    ids: v.array(v.id("landingPages")),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = await Promise.all(args.ids.map(async (id) => {
      const existing = await ctx.db.get(id);
      if (!existing) {
        return false;
      }
      const publishedAt = args.status === "published"
        ? (existing.status !== "published" ? now : existing.publishedAt)
        : existing.publishedAt;
      await ctx.db.patch(id, {
        status: args.status,
        updatedAt: now,
        publishedAt,
      });
      return true;
    }));

    return { updated: results.filter(Boolean).length };
  },
  returns: v.object({
    updated: v.number(),
  }),
});

export const previewProgrammaticPlan = mutation({
  args: {},
  handler: async (ctx) => {
    const decision = await buildProgrammaticDecision(ctx);
    return decision.preview;
  },
  returns: v.object({
    byType: v.record(v.string(), v.number()),
    createCount: v.number(),
    draftCount: v.number(),
    publishedCount: v.number(),
    skippedCount: v.number(),
    total: v.number(),
    updateCount: v.number(),
  }),
});

export const upsertProgrammaticFromModules = mutation({
  args: {},
  handler: async (ctx) => {
    const decision = await applyProgrammaticDecision(ctx, Date.now());

    return {
      created: decision.create.length,
      draftCount: decision.preview.draftCount,
      publishedCount: decision.preview.publishedCount,
      skippedCount: decision.preview.skippedCount,
      total: decision.preview.total,
      updated: decision.update.length,
    };
  },
  returns: v.object({
    created: v.number(),
    draftCount: v.number(),
    publishedCount: v.number(),
    skippedCount: v.number(),
    total: v.number(),
    updated: v.number(),
  }),
});

export const syncProgrammaticFromSourceChange = mutation({
  args: {
    source: v.union(
      v.literal("module"),
      v.literal("product"),
      v.literal("service"),
      v.literal("post")
    ),
  },
  handler: async (ctx, args) => {
    const decision = await applyProgrammaticDecision(ctx, Date.now());

    return {
      created: decision.create.length,
      skippedCount: decision.preview.skippedCount,
      source: args.source,
      total: decision.preview.total,
      updated: decision.update.length,
    };
  },
  returns: v.object({
    created: v.number(),
    skippedCount: v.number(),
    source: v.union(
      v.literal("module"),
      v.literal("product"),
      v.literal("service"),
      v.literal("post")
    ),
    total: v.number(),
    updated: v.number(),
  }),
});
