import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { productStatus } from "./lib/validators";
import { rankByFuzzyMatches } from "./lib/search";
import { resolveUniqueSlug } from "./lib/iaSlugs";
import type { Doc, Id } from "./_generated/dataModel";
import {
  dedupeStorageIds,
  isBrokenStorageBackedUrl,
  removeOwnerFilesAndCleanup,
  syncOwnerFilesAndCleanup,
} from "./lib/fileService";
import {
  isMultiCategoryEnabled,
  listProductAdditionalCategoryIds,
  mergeProductsByCategoryAssignments,
} from "./lib/multiCategory";

export async function recalculateProductEffectivePrice(ctx: MutationCtx, productId: Id<"products">) {
  const product = await ctx.db.get(productId);
  if (!product) return;

  let effectivePrice = product.price ?? product.salePrice;

  if (product.hasVariants) {
    const variants = await ctx.db
      .query("productVariants")
      .withIndex("by_product", (q) => q.eq("productId", productId))
      .collect();
    
    const activeVariants = variants.filter(v => v.status === "Active");
    if (activeVariants.length > 0) {
      const prices = activeVariants.map(v => v.price ?? v.salePrice).filter((p): p is number => p !== undefined);
      if (prices.length > 0) {
        effectivePrice = Math.min(...prices);
      }
    }
  }

  await ctx.db.patch(productId, { effectivePrice });
}

async function searchActiveProductsByNameOrSku(
  ctx: QueryCtx,
  args: {
    categoryId?: Id<"productCategories">;
    productTypeId?: Id<"productTypes">;
    search: string;
    limit: number;
  },
) {
  const searchText = args.search.toLowerCase().trim();
  const fallbackLimit = Math.max(args.limit, 200);
  const nameQuery = ctx.db
    .query("products")
    .withSearchIndex("search_name", (q) => {
      const builder = q.search("name", searchText).eq("status", "Active");
      return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
    });
  const skuQuery = ctx.db
    .query("products")
    .withSearchIndex("search_sku", (q) => {
      const builder = q.search("sku", searchText).eq("status", "Active");
      return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
    });
  const fallbackQuery = args.categoryId
    ? ctx.db
      .query("products")
      .withIndex("by_category_status", (q) =>
        q.eq("categoryId", args.categoryId!).eq("status", "Active")
      )
    : ctx.db
      .query("products")
      .withIndex("by_status_order", (q) => q.eq("status", "Active"));

  const [nameResults, skuResults, fallbackResults] = await Promise.all([
    nameQuery.take(args.limit),
    skuQuery.take(args.limit),
    fallbackQuery.take(fallbackLimit),
  ]);

  let products = Array.from(
    new Map([...nameResults, ...skuResults, ...fallbackResults].map((product) => [product._id, product])).values(),
  );

  if (args.productTypeId) {
    products = products.filter((product) => product.productTypeId === args.productTypeId);
  }

  return products;
}

const comboItemDoc = v.object({
  name: v.string(),
  price: v.optional(v.number()),
  type: v.union(v.literal("standard"), v.literal("mix")),
  syncId: v.optional(v.string()),
  isSynced: v.optional(v.boolean()),
  standardConfig: v.optional(
    v.object({
      minQty: v.number(),
      rewardType: v.union(
        v.literal("discount_percent"),
        v.literal("discount_amount"),
        v.literal("gift_self"),
        v.literal("gift_other")
      ),
      rewardValue: v.optional(v.number()),
      giftProductId: v.optional(v.id("products")),
      giftQty: v.optional(v.number()),
    })
  ),
  mixConfig: v.optional(
    v.object({
      currentProductQty: v.optional(v.number()),
      items: v.array(
        v.object({
          productId: v.id("products"),
          quantity: v.number(),
        })
      ),
      rewardType: v.union(
        v.literal("discount_percent"),
        v.literal("discount_amount"),
        v.literal("gift_other")
      ),
      rewardValue: v.optional(v.number()),
      giftProductId: v.optional(v.id("products")),
      giftQty: v.optional(v.number()),
    })
  ),
});

const productDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("products"),
  affiliateLink: v.optional(v.string()),
  categoryId: v.id("productCategories"),
  description: v.optional(v.string()),
  renderType: v.optional(v.union(
    v.literal("content"),
    v.literal("markdown"),
    v.literal("html")
  )),
  markdownRender: v.optional(v.string()),
  htmlRender: v.optional(v.string()),
  hasVariants: v.optional(v.boolean()),
  image: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  imageStorageIds: v.optional(v.array(v.union(v.id("_storage"), v.null()))),
  metaDescription: v.optional(v.string()),
  metaTitle: v.optional(v.string()),
  name: v.string(),
  optionIds: v.optional(v.array(v.id("productOptions"))),
  order: v.number(),
  price: v.number(),
  productType: v.optional(v.union(v.literal("physical"), v.literal("digital"))),
  digitalDeliveryType: v.optional(
    v.union(
      v.literal("account"),
      v.literal("license"),
      v.literal("download"),
      v.literal("custom")
    )
  ),
  digitalCredentialsTemplate: v.optional(v.object({
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    licenseKey: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    customContent: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  })),
  salePrice: v.optional(v.number()),
  sales: v.number(),
  sku: v.string(),
  slug: v.string(),
  status: productStatus,
  stock: v.number(),
  combos: v.optional(v.array(comboItemDoc)),
  productTypeId: v.optional(v.id("productTypes")),
  effectivePrice: v.optional(v.number()),
});

const productAdminDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("products"),
  affiliateLink: v.optional(v.string()),
  categoryId: v.id("productCategories"),
  description: v.optional(v.string()),
  renderType: v.optional(v.union(
    v.literal("content"),
    v.literal("markdown"),
    v.literal("html")
  )),
  markdownRender: v.optional(v.string()),
  htmlRender: v.optional(v.string()),
  hasVariants: v.optional(v.boolean()),
  image: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  imageStorageIds: v.optional(v.array(v.union(v.id("_storage"), v.null()))),
  metaDescription: v.optional(v.string()),
  metaTitle: v.optional(v.string()),
  name: v.string(),
  optionIds: v.optional(v.array(v.id("productOptions"))),
  order: v.number(),
  price: v.number(),
  productType: v.optional(v.union(v.literal("physical"), v.literal("digital"))),
  digitalDeliveryType: v.optional(
    v.union(
      v.literal("account"),
      v.literal("license"),
      v.literal("download"),
      v.literal("custom")
    )
  ),
  digitalCredentialsTemplate: v.optional(v.object({
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    licenseKey: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    customContent: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  })),
  salePrice: v.optional(v.number()),
  sales: v.number(),
  sku: v.string(),
  slug: v.string(),
  status: productStatus,
  stock: v.number(),
  variantMinPrice: v.optional(v.union(v.number(), v.null())),
  hasPricedActiveVariant: v.optional(v.boolean()),
  hasInvalidVariantComparePrice: v.optional(v.boolean()),
  combos: v.optional(v.array(comboItemDoc)),
  productTypeId: v.optional(v.id("productTypes")),
  effectivePrice: v.optional(v.number()),
});

const paginatedProducts = v.object({
  continueCursor: v.string(),
  isDone: v.boolean(),
  page: v.array(productDoc),
  pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  splitCursor: v.optional(v.union(v.string(), v.null())),
});

type VariantPricingSetting = "product" | "variant";
type VariantStockSetting = "product" | "variant";
type VariantCtx = MutationCtx | QueryCtx;

type VariantSettings = {
  variantEnabled: boolean;
  variantPricing: VariantPricingSetting;
  variantStock: VariantStockSetting;
};

type AdminSearchArgs = {
  categoryId?: Id<"productCategories">;
  search?: string;
  status?: Doc<"products">["status"];
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const normalizeSku = (value: string) => value.trim().toLowerCase();
const normalizeSlug = (value: string) => value.trim().toLowerCase();
const buildCopiedName = (baseName: string, attempt: number) =>
  attempt <= 1 ? `${baseName} (copy)` : `${baseName} (copy ${attempt})`;

const buildCopyCode = (baseCode: string, attempt: number) => {
  const normalized = baseCode.trim().toLowerCase();
  const fallback = normalized || "item";
  return attempt <= 1 ? `${fallback}-copy` : `${fallback}-copy-${attempt}`;
};

async function generateUniqueProductSlug(ctx: MutationCtx, baseSlug: string): Promise<string> {
  const resolved = await resolveUniqueSlug(ctx, { scope: "record", slug: baseSlug });
  return resolved.slug;
}

async function generateUniqueProductSku(ctx: MutationCtx, baseSku: string): Promise<string> {
  for (let attempt = 1; attempt <= 500; attempt += 1) {
    const candidate = buildCopyCode(baseSku, attempt);
    const existing = await ctx.db.query("products").withIndex("by_sku", (q) => q.eq("sku", candidate)).unique();
    if (!existing) {
      return candidate;
    }
  }
  throw new ConvexError({ code: "UNIQUE_SKU_GENERATION_FAILED", message: "Không thể tạo SKU duy nhất cho bản sao" });
}

async function generateUniqueVariantSku(ctx: MutationCtx, baseSku: string): Promise<string> {
  for (let attempt = 1; attempt <= 500; attempt += 1) {
    const candidate = buildCopyCode(baseSku, attempt);
    const existing = await ctx.db.query("productVariants").withIndex("by_sku", (q) => q.eq("sku", candidate)).unique();
    if (!existing) {
      return candidate;
    }
  }
  throw new ConvexError({ code: "UNIQUE_VARIANT_SKU_GENERATION_FAILED", message: "Không thể tạo SKU biến thể duy nhất cho bản sao" });
}

async function generateUniqueCopiedName(ctx: MutationCtx, baseName: string): Promise<string> {
  for (let attempt = 1; attempt <= 500; attempt += 1) {
    const candidate = buildCopiedName(baseName, attempt);
    const existing = await ctx.db.query("products").withSearchIndex("search_name", (q) => q.search("name", candidate.toLowerCase())).take(20);
    if (!existing.some((item) => item.name.trim().toLowerCase() === candidate.trim().toLowerCase())) {
      return candidate;
    }
  }
  throw new ConvexError({ code: "UNIQUE_NAME_GENERATION_FAILED", message: "Không thể tạo tên bản sao" });
}

async function getVariantSettings(ctx: VariantCtx): Promise<VariantSettings> {
  const [variantEnabled, variantPricing, variantStock] = await Promise.all([
    ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", "products").eq("settingKey", "variantEnabled")
      )
      .unique(),
    ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", "products").eq("settingKey", "variantPricing")
      )
      .unique(),
    ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", "products").eq("settingKey", "variantStock")
      )
      .unique(),
  ]);

  return {
    variantEnabled: Boolean(variantEnabled?.value),
    variantPricing: (variantPricing?.value as VariantPricingSetting) ?? "variant",
    variantStock: (variantStock?.value as VariantStockSetting) ?? "variant",
  };
}

function buildAdminQuery(ctx: QueryCtx, args: AdminSearchArgs) {
  if (args.categoryId && args.status) {
    return ctx.db.query("products").withIndex("by_category_status", (q) =>
      q.eq("categoryId", args.categoryId!).eq("status", args.status!)
    );
  }
  if (args.categoryId) {
    return ctx.db.query("products").withIndex("by_category_status", (q) =>
      q.eq("categoryId", args.categoryId!)
    );
  }
  if (args.status) {
    return ctx.db.query("products").withIndex("by_status_order", (q) => q.eq("status", args.status!));
  }
  return ctx.db.query("products").withIndex("by_order");
}

function parseSearchQuery(search: string) {
  const excludes: string[] = [];
  const exacts: string[] = [];
  const normals: string[] = [];

  const regex = /(-)?(?:"([^"]+)"|([^\s"]+))/g;
  let match;
  while ((match = regex.exec(search)) !== null) {
    const isExclude = !!match[1];
    const phrase = match[2] || match[3];
    if (!phrase) continue;

    const cleanPhrase = phrase.toLowerCase().trim();
    if (isExclude) {
      excludes.push(cleanPhrase);
    } else if (match[2]) {
      exacts.push(cleanPhrase);
    } else {
      normals.push(cleanPhrase);
    }
  }

  return { excludes, exacts, normals };
}

function matchProduct(
  product: { name: string; sku?: string },
  parsed: { excludes: string[]; exacts: string[]; normals: string[] },
  exactMode: boolean
): boolean {
  const nameLower = product.name.toLowerCase();
  const skuLower = (product.sku ?? "").toLowerCase();

  for (const exclude of parsed.excludes) {
    if (nameLower.includes(exclude) || skuLower.includes(exclude)) {
      return false;
    }
  }

  for (const exact of parsed.exacts) {
    if (!nameLower.includes(exact) && !skuLower.includes(exact)) {
      return false;
    }
  }

  if (exactMode) {
    for (const normal of parsed.normals) {
      if (!nameLower.includes(normal) && !skuLower.includes(normal)) {
        return false;
      }
    }
  }

  return true;
}

async function searchAdminProducts(
  ctx: QueryCtx,
  args: AdminSearchArgs & { exactMode?: boolean }
) {
  const search = args.search?.trim();
  if (!search) {
    return [] as Doc<"products">[];
  }

  const parsed = parseSearchQuery(search);
  const exactMode = !!args.exactMode;

  let rawProducts: Doc<"products">[] = [];
  const hasPositiveSearch = parsed.normals.length > 0 || parsed.exacts.length > 0;

  if (!hasPositiveSearch) {
    rawProducts = await buildAdminQuery(ctx, args).collect();
  } else {
    const searchTerms = [...parsed.normals, ...parsed.exacts].join(" ");
    const buildSearchQuery = (indexName: "search_name" | "search_sku", field: "name" | "sku") =>
      ctx.db.query("products").withSearchIndex(indexName, (q) => {
        let builder = q.search(field, searchTerms);
        if (args.status) {
          builder = builder.eq("status", args.status);
        }
        if (args.categoryId) {
          builder = builder.eq("categoryId", args.categoryId);
        }
        return builder;
      });

    const nameQuery = buildSearchQuery("search_name", "name");
    const skuQuery = buildSearchQuery("search_sku", "sku");

    const [nameResults, skuResults] = await Promise.all([
      nameQuery.take(5000),
      skuQuery.take(5000),
    ]);

    const combined = new Map<Id<"products">, Doc<"products">>();
    [...nameResults, ...skuResults].forEach((product) => {
      combined.set(product._id, product);
    });

    rawProducts = Array.from(combined.values());
  }

  const filtered = rawProducts.filter((product) =>
    matchProduct(product, parsed, exactMode)
  );

  return filtered;
}

function resolveVariantPrice(variant: Doc<"productVariants">): number | null {
  if (typeof variant.price === "number" && variant.price > 0) {
    return variant.price;
  }
  return null;
}

async function getVariantAggregates(
  ctx: VariantCtx,
  products: Doc<"products">[]
) {
  const productsWithVariants = products.filter((product) => product.hasVariants);
  const aggregates = await Promise.all(
    productsWithVariants.map(async (product) => {
      const variants = await ctx.db
        .query("productVariants")
        .withIndex("by_product_status", (q) => q.eq("productId", product._id).eq("status", "Active"))
        .collect();

      let totalStock = 0;
      let minPrice: number | null = null;

      variants.forEach((variant) => {
        const stockValue = variant.stock ?? 0;
        totalStock += stockValue;
        const effectivePrice = resolveVariantPrice(variant);
        if (effectivePrice === null) {
          return;
        }
        minPrice = minPrice === null ? effectivePrice : Math.min(minPrice, effectivePrice);
      });

      return [product._id, { price: minPrice, stock: totalStock }] as const;
    })
  );

  return new Map<Id<"products">, { price: number | null; stock: number }>(aggregates);
}

async function getVariantAdminAggregates(
  ctx: VariantCtx,
  products: Doc<"products">[]
) {
  const productsWithVariants = products.filter((product) => product.hasVariants);
  const aggregates = await Promise.all(
    productsWithVariants.map(async (product) => {
      const variants = await ctx.db
        .query("productVariants")
        .withIndex("by_product_status", (q) => q.eq("productId", product._id).eq("status", "Active"))
        .collect();

      let minPrice: number | null = null;
      let hasInvalidVariantComparePrice = false;
      variants.forEach((variant) => {
        const effectivePrice = resolveVariantPrice(variant);
        if (effectivePrice === null) {
          return;
        }
        minPrice = minPrice === null ? effectivePrice : Math.min(minPrice, effectivePrice);
        const salePrice = variant.salePrice;
        if (typeof salePrice === "number" && salePrice > 0) {
          const price = variant.price;
          if (!Number.isFinite(price ?? NaN) || (price ?? 0) <= 0 || salePrice <= (price ?? 0)) {
            hasInvalidVariantComparePrice = true;
          }
        }
      });

      return [product._id, { hasInvalidVariantComparePrice, hasPricedActiveVariant: minPrice !== null, minPrice }] as const;
    })
  );

  return new Map<Id<"products">, { hasInvalidVariantComparePrice: boolean; hasPricedActiveVariant: boolean; minPrice: number | null }>(aggregates);
}

async function resolveVariantOverrides(
  ctx: VariantCtx,
  products: Doc<"products">[],
  settings: VariantSettings
) {
  if (!settings.variantEnabled) {
    return products;
  }

  if (settings.variantPricing !== "variant" && settings.variantStock !== "variant") {
    return products;
  }

  const aggregates = await getVariantAggregates(ctx, products);
  return products.map((product) => {
    if (!product.hasVariants) {
      return product;
    }
    const aggregate = aggregates.get(product._id);
    if (!aggregate) {
      return product;
    }
    const nextProduct = { ...product };
    if (settings.variantStock === "variant") {
      nextProduct.stock = aggregate.stock;
    }
    if (settings.variantPricing === "variant") {
      nextProduct.price = aggregate.price ?? 0;
      nextProduct.salePrice = undefined;
    }
    return nextProduct;
  });
}

// ============================================================
// QUERIES
// ============================================================

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) =>  ctx.db.query("products").paginate(args.paginationOpts),
});

// FIX #1: Replace listAll with take() limit - use for admin dropdown/select only
export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxLimit = args.limit ?? 100; // Default max 100, configurable
    const products = await ctx.db.query("products").take(maxLimit);
    const settings = await getVariantSettings(ctx);
    return resolveVariantOverrides(ctx, products, settings);
  },
  returns: v.array(productDoc),
});

export const listAdminWithOffset = query({
  args: {
    categoryId: v.optional(v.id("productCategories")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(productStatus),
    exactMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const settings = await getVariantSettings(ctx);

    let products: Doc<"products">[] = [];
    if (args.search?.trim()) {
      products = await searchAdminProducts(ctx, args);
    } else {
      const fetchLimit = Math.min(offset + limit + 50, 5000);
      products = await buildAdminQuery(ctx, args).order("desc").take(fetchLimit);
    }

    products.sort((a, b) => b.order - a.order);

    const page = products.slice(offset, offset + limit);
    if (settings.variantEnabled && settings.variantPricing === "variant") {
      const aggregates = await getVariantAdminAggregates(ctx, page);
      return page.map((product) => {
        if (!product.hasVariants) {
          return { ...product, hasInvalidVariantComparePrice: false, hasPricedActiveVariant: false, variantMinPrice: undefined };
        }
        const aggregate = aggregates.get(product._id);
        return {
          ...product,
          hasInvalidVariantComparePrice: aggregate?.hasInvalidVariantComparePrice ?? false,
          hasPricedActiveVariant: aggregate?.hasPricedActiveVariant ?? false,
          variantMinPrice: aggregate?.minPrice ?? null,
        };
      });
    }

    return page;
  },
  returns: v.array(productAdminDoc),
});

export const countAdmin = query({
  args: {
    categoryId: v.optional(v.id("productCategories")),
    search: v.optional(v.string()),
    status: v.optional(productStatus),
    exactMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let products: Doc<"products">[] = [];
    if (args.search?.trim()) {
      products = await searchAdminProducts(ctx, args);
    } else {
      products = await buildAdminQuery(ctx, args).collect();
    }

    return { count: products.length, hasMore: false };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    categoryId: v.optional(v.id("productCategories")),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(productStatus),
    exactMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);

    let products: Doc<"products">[] = [];
    if (args.search?.trim()) {
      products = await searchAdminProducts(ctx, args);
    } else {
      const fetchLimit = limit + 1;
      products = await buildAdminQuery(ctx, args).order("desc").take(fetchLimit);
    }

    products.sort((a, b) => b.order - a.order);
    const hasMore = products.length > limit;
    return { ids: products.slice(0, limit).map((product) => product._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("products")), hasMore: v.boolean() }),
});

const productExportDoc = v.object({
  categoryId: v.id("productCategories"),
  description: v.optional(v.string()),
  image: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  name: v.string(),
  price: v.number(),
  salePrice: v.optional(v.number()),
  sku: v.string(),
  slug: v.string(),
  status: productStatus,
  stock: v.number(),
});

export const listAdminExport = query({
  args: {
    categoryId: v.optional(v.id("productCategories")),
    ids: v.optional(v.array(v.id("products"))),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(productStatus),
    exactMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);

    if (args.ids?.length) {
      const ids = args.ids.slice(0, limit);
      const products = (await Promise.all(ids.map((id) => ctx.db.get(id))))
        .filter((product): product is Doc<"products"> => Boolean(product));
      products.sort((a, b) => b.order - a.order);
      return products.map((product) => ({
        categoryId: product.categoryId,
        description: product.description,
        image: product.image,
        images: product.images,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
        sku: product.sku,
        slug: product.slug,
        status: product.status,
        stock: product.stock,
      }));
    }

    let products: Doc<"products">[] = [];
    if (args.search?.trim()) {
      products = await searchAdminProducts(ctx, args);
    } else {
      const fetchLimit = Math.min(limit + 200, 5000);
      products = await buildAdminQuery(ctx, args).order("desc").take(fetchLimit);
    }

    products.sort((a, b) => b.order - a.order);
    return products.slice(0, limit).map((product) => ({
      categoryId: product.categoryId,
      description: product.description,
      image: product.image,
      images: product.images,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      sku: product.sku,
      slug: product.slug,
      status: product.status,
      stock: product.stock,
    }));
  },
  returns: v.array(productExportDoc),
});

// FIX #2: Use counter table for count instead of fetching ALL
export const count = query({
  args: { status: v.optional(productStatus) },
  handler: async (ctx, args) => {
    const key = args.status ?? "total";
    const stats = await ctx.db
      .query("productStats")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    return stats?.count ?? 0;
  },
  returns: v.number(),
});

// Get counts for all statuses from counter table
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const [activeStats, draftStats, archivedStats, totalStats] = await Promise.all([
      ctx.db.query("productStats").withIndex("by_key", (q) => q.eq("key", "Active")).unique(),
      ctx.db.query("productStats").withIndex("by_key", (q) => q.eq("key", "Draft")).unique(),
      ctx.db.query("productStats").withIndex("by_key", (q) => q.eq("key", "Archived")).unique(),
      ctx.db.query("productStats").withIndex("by_key", (q) => q.eq("key", "total")).unique(),
    ]);

    const active = activeStats?.count ?? 0;
    const draft = draftStats?.count ?? 0;
    const archived = archivedStats?.count ?? 0;
    const total = totalStats?.count ?? active + draft + archived;

    return { active, archived, draft, total };
  },
  returns: v.object({
    active: v.number(),
    archived: v.number(),
    draft: v.number(),
    total: v.number(),
  }),
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(productDoc, v.null()),
});

export const listByIds = query({
  args: { ids: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    if (args.ids.length === 0) {
      return [];
    }
    const products = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    const filtered = products.filter((product): product is Doc<"products"> => Boolean(product));
    const settings = await getVariantSettings(ctx);
    return resolveVariantOverrides(ctx, filtered, settings);
  },
  returns: v.array(productDoc),
});

export const getBySku = query({
  args: { sku: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .unique(),
  returns: v.union(productDoc, v.null()),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!product) {
      return null;
    }
    const settings = await getVariantSettings(ctx);
    const [resolved] = await resolveVariantOverrides(ctx, [product], settings);
    return resolved ?? product;
  },
  returns: v.union(productDoc, v.null()),
});

export const getAdditionalCategoryIds = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) {
      return [];
    }
    return listProductAdditionalCategoryIds(ctx, args.id, product.categoryId);
  },
  returns: v.array(v.id("productCategories")),
});

export const listByCategory = query({
  args: {
    categoryId: v.id("productCategories"),
    paginationOpts: paginationOptsValidator,
    status: v.optional(productStatus),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return  ctx.db
        .query("products")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId).eq("status", args.status!)
        )
        .paginate(args.paginationOpts);
    }
    return  ctx.db
      .query("products")
      .withIndex("by_category_status", (q) => q.eq("categoryId", args.categoryId))
      .paginate(args.paginationOpts);
  },
});

export const listByStatus = query({
  args: { paginationOpts: paginationOptsValidator, status: productStatus },
  handler: async (ctx, args) =>  ctx.db
      .query("products")
      .withIndex("by_status_order", (q) => q.eq("status", args.status))
      .paginate(args.paginationOpts),
});

// FIX #9: Add filter for threshold
export const listLowStock = query({
  args: { paginationOpts: paginationOptsValidator, threshold: v.number() },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("products")
      .withIndex("by_status_stock", (q) => q.eq("status", "Active"))
      .filter((q) => q.lt(q.field("stock"), args.threshold))
      .paginate(args.paginationOpts);
    return result;
  },
});

export const listBestSellers = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) =>  ctx.db
      .query("products")
      .withIndex("by_status_sales", (q) => q.eq("status", "Active"))
      .order("desc")
      .paginate(args.paginationOpts),
});

// ============================================================
// PUBLIC QUERIES (for frontend)
// ============================================================

export const listPublicResolved = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 100, 200);
    const products = await ctx.db
      .query("products")
      .withIndex("by_status_order", (q) => q.eq("status", "Active"))
      .order("desc")
      .take(limit);
    const settings = await getVariantSettings(ctx);
    return resolveVariantOverrides(ctx, products, settings);
  },
  returns: v.array(productDoc),
});

export const getPriceRangeStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_status_order", (q) => q.eq("status", "Active"))
      .order("desc")
      .take(200);

    if (products.length === 0) {
      return { minPrice: 0, maxPrice: 0 };
    }

    const settings = await getVariantSettings(ctx);
    const resolvedProducts = await resolveVariantOverrides(ctx, products, settings);

    let minPrice = Infinity;
    let maxPrice = -Infinity;

    for (const p of resolvedProducts) {
      const price = p.effectivePrice ?? 0;
      if (price > 0) {
        if (price < minPrice) minPrice = price;
        if (price > maxPrice) maxPrice = price;
      }
    }

    if (minPrice === Infinity) minPrice = 0;
    if (maxPrice === -Infinity) maxPrice = 0;

    return { minPrice, maxPrice };
  },
  returns: v.object({
    minPrice: v.number(),
    maxPrice: v.number(),
  }),
});


// Paginated published products for usePaginatedQuery hook (infinite scroll)
export const listPublishedPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("productCategories")),
    productTypeId: v.optional(v.id("productTypes")),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
    )),
    attributeTermIds: v.optional(v.array(v.array(v.id("attributeTerms")))),
  },
  handler: async (ctx, args) => {
    const sortBy = args.sortBy ?? "newest";
    let result;

    if (args.categoryId) {
      let query = ctx.db
        .query("products")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Active")
        );
      
      if (args.productTypeId) {
        query = query.filter((q) => q.eq(q.field("productTypeId"), args.productTypeId));
      }

      result = await query
        .order(sortBy === "oldest" ? "asc" : "desc")
        .paginate(args.paginationOpts);

      if (await isMultiCategoryEnabled(ctx, "products")) {
        result = {
          ...result,
          page: (await mergeProductsByCategoryAssignments(ctx, args.categoryId, result.page, args.paginationOpts.numItems))
            .filter((product) => product.status === "Active" && (!args.productTypeId || product.productTypeId === args.productTypeId)),
        };
      }
    } else if (args.productTypeId) {
      let query = ctx.db
        .query("products")
        .withIndex("by_type_status_effectivePrice", (q) =>
          q.eq("productTypeId", args.productTypeId!).eq("status", "Active")
        );

      result = await query
        .order(sortBy === "oldest" ? "asc" : "desc")
        .paginate(args.paginationOpts);
    } else if (sortBy === "popular") {
      let query = ctx.db
        .query("products")
        .withIndex("by_status_sales", (q) => q.eq("status", "Active"));

      result = await query
        .order("desc")
        .paginate(args.paginationOpts);
    } else {
      let query = ctx.db
        .query("products")
        .withIndex("by_status_order", (q) => q.eq("status", "Active"));

      result = await query
        .order(sortBy === "oldest" ? "asc" : "desc")
        .paginate(args.paginationOpts);
    }

    // Filter by minPrice and maxPrice using canonical sale price.
    if (args.minPrice !== undefined || args.maxPrice !== undefined) {
      result.page = result.page.filter((p) => {
        const price = p.effectivePrice ?? 0;
        if (args.minPrice !== undefined && price < args.minPrice) return false;
        if (args.maxPrice !== undefined && price > args.maxPrice) return false;
        return true;
      });
    }

    const hasAttributeFilter = args.attributeTermIds && args.attributeTermIds.length > 0;
    if (hasAttributeFilter && args.attributeTermIds) {
      let matchedProductIds: Set<Id<"products">> | null = null;
      let firstGroup = true;
      for (const groupTerms of args.attributeTermIds) {
        if (groupTerms.length === 0) continue;
        const groupProductRows = await Promise.all(
          groupTerms.map(termId => 
            ctx.db.query("productAttributeTerms").withIndex("by_term", q => q.eq("termId", termId)).collect()
          )
        );
        const groupProductIds = new Set(groupProductRows.flat().map(r => r.productId));
        if (firstGroup) {
          matchedProductIds = groupProductIds;
          firstGroup = false;
        } else {
          matchedProductIds = new Set([...matchedProductIds!].filter(id => groupProductIds.has(id)));
        }
      }
      if (matchedProductIds) {
        result.page = result.page.filter(p => matchedProductIds!.has(p._id));
      }
    }

    const settings = await getVariantSettings(ctx);
    const page = await resolveVariantOverrides(ctx, result.page, settings);
    return { ...result, page };
  },
  returns: paginatedProducts,
});

// Offset-based pagination for URL-based pagination mode
export const listPublishedWithOffset = query({
  args: {
    categoryId: v.optional(v.id("productCategories")),
    productTypeId: v.optional(v.id("productTypes")),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("price_asc"),
      v.literal("price_desc"),
      v.literal("name"),
      v.literal("name_desc")
    )),
    attributeTermIds: v.optional(v.array(v.array(v.id("attributeTerms")))),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 12, 50);
    const offset = args.offset ?? 0;
    const sortBy = args.sortBy ?? "newest";

    let products: Doc<"products">[] = [];
    const hasAttributeFilter = args.attributeTermIds && args.attributeTermIds.length > 0;
    const fetchLimit = (hasAttributeFilter || args.minPrice !== undefined || args.maxPrice !== undefined) ? 1000 : offset + limit + 10;

    if (args.search?.trim()) {
      const fetchLimit = Math.min(offset + limit + 20, 500);
      products = await searchActiveProductsByNameOrSku(ctx, {
        categoryId: args.categoryId,
        productTypeId: args.productTypeId,
        search: args.search,
        limit: fetchLimit,
      });
    } else if (args.categoryId) {
      let query = ctx.db
        .query("products")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Active")
        );
      
      if (args.productTypeId) {
        query = query.filter((q) => q.eq(q.field("productTypeId"), args.productTypeId));
      }

      products = await query.take(fetchLimit);
      if (await isMultiCategoryEnabled(ctx, "products")) {
        products = await mergeProductsByCategoryAssignments(ctx, args.categoryId, products, fetchLimit);
        products = products.filter((product) => product.status === "Active" && (!args.productTypeId || product.productTypeId === args.productTypeId));
      }
    } else if (args.productTypeId) {
      let query = ctx.db
        .query("products")
        .withIndex("by_type_status_effectivePrice", (q) =>
          q.eq("productTypeId", args.productTypeId!).eq("status", "Active")
        );

      products = await query.take(fetchLimit);
    } else if (sortBy === "popular") {
      let query = ctx.db
        .query("products")
        .withIndex("by_status_sales", (q) => q.eq("status", "Active"));

      products = await query.order("desc").take(fetchLimit);
    } else {
      let query = ctx.db
        .query("products")
        .withIndex("by_status_order", (q) => q.eq("status", "Active"));

      products = await query.take(fetchLimit);
    }

    if (args.search?.trim() && products.length > 0) {
      const ranked = rankByFuzzyMatches(
        products,
        args.search,
        (p) => [p.name ?? "", p.sku ?? ""],
        42,
      );
      products = ranked.map((entry) => entry.item);
    }

    if (args.minPrice !== undefined || args.maxPrice !== undefined) {
      products = products.filter((p) => {
        const price = p.effectivePrice ?? 0;
        if (args.minPrice !== undefined && price < args.minPrice) return false;
        if (args.maxPrice !== undefined && price > args.maxPrice) return false;
        return true;
      });
    }

    if (hasAttributeFilter && args.attributeTermIds) {
      let matchedProductIds: Set<Id<"products">> | null = null;
      let firstGroup = true;
      for (const groupTerms of args.attributeTermIds) {
        if (groupTerms.length === 0) continue;
        const groupProductRows = await Promise.all(
          groupTerms.map(termId => 
            ctx.db.query("productAttributeTerms").withIndex("by_term", q => q.eq("termId", termId)).collect()
          )
        );
        const groupProductIds = new Set(groupProductRows.flat().map(r => r.productId));
        if (firstGroup) {
          matchedProductIds = groupProductIds;
          firstGroup = false;
        } else {
          matchedProductIds = new Set([...matchedProductIds!].filter(id => groupProductIds.has(id)));
        }
      }
      if (matchedProductIds) {
        products = products.filter(p => matchedProductIds!.has(p._id));
      }
    }

    const settings = await getVariantSettings(ctx);
    products = await resolveVariantOverrides(ctx, products, settings);

    if (!args.search?.trim()) {
      switch (sortBy) {
        case "newest": {
          products.sort((a, b) => b._creationTime - a._creationTime);
          break;
        }
        case "oldest": {
          products.sort((a, b) => a._creationTime - b._creationTime);
          break;
        }
        case "popular": {
          products.sort((a, b) => b.sales - a.sales);
          break;
        }
        case "price_asc": {
          products.sort((a, b) => (a.effectivePrice ?? 0) - (b.effectivePrice ?? 0));
          break;
        }
        case "price_desc": {
          products.sort((a, b) => (b.effectivePrice ?? 0) - (a.effectivePrice ?? 0));
          break;
        }
        case "name": {
          products.sort((a, b) => a.name.localeCompare(b.name, "vi"));
          break;
        }
        case "name_desc": {
          products.sort((a, b) => b.name.localeCompare(a.name, "vi"));
          break;
        }
      }
    }

    return products.slice(offset, offset + limit);
  },
  returns: v.array(productDoc),
});

// Search active products with filters
export const searchPublished = query({
  args: {
    categoryId: v.optional(v.id("productCategories")),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(
      v.union(
        v.literal("newest"),
        v.literal("oldest"),
        v.literal("popular"),
        v.literal("price_asc"),
        v.literal("price_desc"),
        v.literal("name"),
        v.literal("name_desc")
      )
    ),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    let products;

    if (args.search?.trim()) {
      const fetchLimit = Math.min(limit * 2, 200);
      products = await searchActiveProductsByNameOrSku(ctx, {
        categoryId: args.categoryId,
        search: args.search,
        limit: fetchLimit,
      });
    } else if (args.categoryId) {
      products = await ctx.db
        .query("products")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Active")
        )
        .take(limit * 2);
      if (await isMultiCategoryEnabled(ctx, "products")) {
        products = await mergeProductsByCategoryAssignments(ctx, args.categoryId, products, limit * 2);
        products = products.filter((product) => product.status === "Active");
      }
    } else {
      products = await ctx.db
        .query("products")
        .withIndex("by_status_order", (q) => q.eq("status", "Active"))
        .take(limit * 2);
    }

    // Client-side search filter
    if (args.search?.trim() && products.length > 0) {
      const searchLower = args.search.toLowerCase().trim();
      products = products.filter((p) => {
        const name = p.name?.toLowerCase() ?? '';
        const sku = p.sku?.toLowerCase() ?? '';
        return name.includes(searchLower) || sku.includes(searchLower);
      });
    }

    const settings = await getVariantSettings(ctx);
    products = await resolveVariantOverrides(ctx, products, settings);

    // Sort
    const sortBy = args.sortBy ?? "newest";
    switch (sortBy) {
      case "newest": {
        products.sort((a, b) => b._creationTime - a._creationTime);
        break;
      }
      case "oldest": {
        products.sort((a, b) => a._creationTime - b._creationTime);
        break;
      }
      case "popular": {
        products.sort((a, b) => b.sales - a.sales);
        break;
      }
      case "price_asc": {
        products.sort((a, b) => (a.effectivePrice ?? 0) - (b.effectivePrice ?? 0));
        break;
      }
      case "price_desc": {
        products.sort((a, b) => (b.effectivePrice ?? 0) - (a.effectivePrice ?? 0));
        break;
      }
      case "name": {
        products.sort((a, b) => a.name.localeCompare(b.name, "vi"));
        break;
      }
      case "name_desc": {
        products.sort((a, b) => b.name.localeCompare(a.name, "vi"));
        break;
      }
    }

    return products.slice(0, limit);
  },
  returns: v.array(productDoc),
});

// Count published products
export const countPublished = query({
  args: {
    categoryId: v.optional(v.id("productCategories")),
    productTypeId: v.optional(v.id("productTypes")),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    search: v.optional(v.string()),
    attributeTermIds: v.optional(v.array(v.array(v.id("attributeTerms")))),
  },
  handler: async (ctx, args) => {
    if (!args.categoryId && !args.productTypeId && args.minPrice === undefined && args.maxPrice === undefined && !args.search?.trim() && !(args.attributeTermIds && args.attributeTermIds.length > 0)) {
      const activeStats = await ctx.db
        .query("productStats")
        .withIndex("by_key", (q) => q.eq("key", "Active"))
        .unique();
      if (activeStats) {
        return activeStats.count;
      }
    }

    let products;
    if (args.categoryId) {
      let query = ctx.db
        .query("products")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Active")
        );
      
      if (args.productTypeId) {
        query = query.filter((q) => q.eq(q.field("productTypeId"), args.productTypeId));
      }

      products = await query.collect();
      if (await isMultiCategoryEnabled(ctx, "products")) {
        products = await mergeProductsByCategoryAssignments(ctx, args.categoryId, products, 1000);
        products = products.filter((product) => product.status === "Active" && (!args.productTypeId || product.productTypeId === args.productTypeId));
      }
    } else if (args.productTypeId) {
      let query = ctx.db
        .query("products")
        .withIndex("by_type_status_effectivePrice", (q) =>
          q.eq("productTypeId", args.productTypeId!).eq("status", "Active")
        );

      products = await query.collect();
    } else {
      let query = ctx.db
        .query("products")
        .withIndex("by_status_order", (q) => q.eq("status", "Active"));

      products = await query.collect();
    }

    if (args.search?.trim() && products.length > 0) {
      const ranked = rankByFuzzyMatches(
        products,
        args.search,
        (product) => [product.name ?? "", product.sku ?? ""],
        42,
      );
      products = ranked.map((entry) => entry.item);
    }

    if (args.minPrice !== undefined || args.maxPrice !== undefined) {
      products = products.filter((p) => {
        const price = p.effectivePrice ?? 0;
        if (args.minPrice !== undefined && price < args.minPrice) return false;
        if (args.maxPrice !== undefined && price > args.maxPrice) return false;
        return true;
      });
    }

    const hasAttributeFilter = args.attributeTermIds && args.attributeTermIds.length > 0;
    if (hasAttributeFilter && args.attributeTermIds) {
      let matchedProductIds: Set<Id<"products">> | null = null;
      let firstGroup = true;
      for (const groupTerms of args.attributeTermIds) {
        if (groupTerms.length === 0) continue;
        const groupProductRows = await Promise.all(
          groupTerms.map(termId => 
            ctx.db.query("productAttributeTerms").withIndex("by_term", q => q.eq("termId", termId)).collect()
          )
        );
        const groupProductIds = new Set(groupProductRows.flat().map(r => r.productId));
        if (firstGroup) {
          matchedProductIds = groupProductIds;
          firstGroup = false;
        } else {
          matchedProductIds = new Set([...matchedProductIds!].filter(id => groupProductIds.has(id)));
        }
      }
      if (matchedProductIds) {
        products = products.filter(p => matchedProductIds!.has(p._id));
      }
    }

    return products.length;
  },
  returns: v.number(),
});

// Featured products (best sellers)
export const listFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 8, 20);
    const products = await ctx.db
      .query("products")
      .withIndex("by_status_sales", (q) => q.eq("status", "Active"))
      .order("desc")
      .take(limit);
    const settings = await getVariantSettings(ctx);
    return resolveVariantOverrides(ctx, products, settings);
  },
  returns: v.array(productDoc),
});

// Recent products
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 8, 20);
    const products = await ctx.db
      .query("products")
      .withIndex("by_status_order", (q) => q.eq("status", "Active"))
      .order("desc")
      .take(limit);
    const settings = await getVariantSettings(ctx);
    return resolveVariantOverrides(ctx, products, settings);
  },
  returns: v.array(productDoc),
});

// Popular products (by sales)
export const listPopular = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 8, 20);
    const products = await ctx.db
      .query("products")
      .withIndex("by_status_sales", (q) => q.eq("status", "Active"))
      .order("desc")
      .take(limit);
    const settings = await getVariantSettings(ctx);
    return resolveVariantOverrides(ctx, products, settings);
  },
  returns: v.array(productDoc),
});

// Increment views
export const incrementViews = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) {return null;}
    // Note: products schema doesn't have views field, using sales as proxy or skip
    return null;
  },
  returns: v.null(),
});

// ============================================================
// MUTATIONS
// ============================================================

// Helper: Update stats counters
async function updateStats(
  ctx: MutationCtx,
  statusChange: { old?: string; new?: string }
) {
  // Update total count
  const totalStats = await ctx.db
    .query("productStats")
    .withIndex("by_key", (q) => q.eq("key", "total"))
    .unique();

  if (statusChange.new && !statusChange.old) {
    // Creating new product
    if (totalStats) {
      await ctx.db.patch(totalStats._id, {
        count: totalStats.count + 1,
        lastOrder: totalStats.lastOrder + 1,
      });
    } else {
      await ctx.db.insert("productStats", { count: 1, key: "total", lastOrder: 0 });
    }
  } else if (statusChange.old && !statusChange.new) {
    // Deleting product
    if (totalStats && totalStats.count > 0) {
      await ctx.db.patch(totalStats._id, { count: totalStats.count - 1 });
    }
  }

  // Update status-specific counts
  if (statusChange.old) {
    const oldStatus = statusChange.old;
    const oldStats = await ctx.db
      .query("productStats")
      .withIndex("by_key", (q) => q.eq("key", oldStatus))
      .unique();
    if (oldStats && oldStats.count > 0) {
      await ctx.db.patch(oldStats._id, { count: oldStats.count - 1 });
    }
  }

  if (statusChange.new) {
    const newStatus = statusChange.new;
    const newStats = await ctx.db
      .query("productStats")
      .withIndex("by_key", (q) => q.eq("key", newStatus))
      .unique();
    if (newStats) {
      await ctx.db.patch(newStats._id, { count: newStats.count + 1 });
    } else {
      await ctx.db.insert("productStats", { count: 1, key: newStatus, lastOrder: 0 });
    }
  }
}

// Helper: Get next order value from stats (FIX #3)
async function getNextOrder(ctx: MutationCtx): Promise<number> {
  const totalStats = await ctx.db
    .query("productStats")
    .withIndex("by_key", (q) => q.eq("key", "total"))
    .unique();
  return totalStats?.lastOrder ?? 0;
}

const importRowDoc = v.object({
  categorySlug: v.string(),
  description: v.optional(v.string()),
  image: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  name: v.string(),
  price: v.number(),
  rowNumber: v.optional(v.number()),
  salePrice: v.optional(v.number()),
  sku: v.string(),
  slug: v.string(),
  status: v.optional(productStatus),
  stock: v.optional(v.number()),
});

export const importFromExcelRows = mutation({
  args: { rows: v.array(importRowDoc) },
  handler: async (ctx, args) => {
    const rows = args.rows.slice(0, 5000);
    const categories = await ctx.db
      .query("productCategories")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    const categoryMap = new Map(categories.map((category) => [category.slug.toLowerCase(), category._id]));

    const skuCandidates = rows.map((row) => row.sku.trim()).filter(Boolean);
    const slugCandidates = rows.map((row) => row.slug.trim()).filter(Boolean);
    const uniqueSkus = Array.from(new Set(skuCandidates.flatMap((sku) => [sku, sku.toLowerCase(), sku.toUpperCase()])));
    const uniqueSlugs = Array.from(new Set(slugCandidates.flatMap((slug) => [slug, slug.toLowerCase(), slug.toUpperCase()])));

    const [existingSkuList, existingSlugList] = await Promise.all([
      Promise.all(uniqueSkus.map((sku) =>
        ctx.db.query("products").withIndex("by_sku", (q) => q.eq("sku", sku)).unique()
      )),
      Promise.all(uniqueSlugs.map((slug) =>
        ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", slug)).unique()
      )),
    ]);

    const existingSkus = new Set(existingSkuList.filter(Boolean).map((product) => product!.sku.toLowerCase()));
    const existingSlugs = new Set(existingSlugList.filter(Boolean).map((product) => product!.slug.toLowerCase()));
    const seenSkus = new Set<string>();
    const seenSlugs = new Set<string>();

    let defaultStatus: "Draft" | "Active" | "Archived" = "Draft";
    const setting = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", "products").eq("settingKey", "defaultStatus")
      )
      .unique();
    if (setting?.value === "Active") {
      defaultStatus = "Active";
    }

    const productTypeSetting = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", "products").eq("settingKey", "productTypeMode")
      )
      .unique();
    const productTypeMode = (productTypeSetting?.value as "physical" | "digital" | "both") ?? "both";
    const productType = productTypeMode === "digital" ? "digital" : "physical";

    const saleModeSetting = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", "products").eq("settingKey", "saleMode")
      )
      .unique();
    const saleMode = saleModeSetting?.value === "contact" || saleModeSetting?.value === "affiliate"
      ? saleModeSetting.value
      : "cart";
    const variantSettings = await getVariantSettings(ctx);
    const hideBasePricing = variantSettings.variantEnabled && variantSettings.variantPricing === "variant";
    const totalStats = await ctx.db
      .query("productStats")
      .withIndex("by_key", (q) => q.eq("key", "total"))
      .unique();
    let nextOrder = totalStats?.lastOrder ?? 0;

    const errors: { row: number; message: string }[] = [];
    let created = 0;
    let skipped = 0;

    for (const [index, row] of rows.entries()) {
      const rowNumber = row.rowNumber ?? index + 2;
      const name = row.name.trim();
      const slug = normalizeSlug(row.slug);
      const sku = normalizeSku(row.sku);
      const categorySlug = normalizeSlug(row.categorySlug);

      if (!name || !slug || !sku || !categorySlug) {
        errors.push({ message: "Thiếu dữ liệu bắt buộc", row: rowNumber });
        continue;
      }

      if (!slugPattern.test(slug)) {
        errors.push({ message: "Slug không đúng định dạng", row: rowNumber });
        continue;
      }

      if (!Number.isFinite(row.price) || row.price < 0) {
        errors.push({ message: "Giá bán không hợp lệ", row: rowNumber });
        continue;
      }
      if (saleMode === "cart" && !hideBasePricing && row.price <= 0) {
        errors.push({ message: "Giá bán phải lớn hơn 0", row: rowNumber });
        continue;
      }

      if (Number.isFinite(row.stock ?? 0) && (row.stock ?? 0) < 0) {
        errors.push({ message: "Tồn kho không hợp lệ", row: rowNumber });
        continue;
      }

      if (typeof row.salePrice === "number") {
        if (row.salePrice < 0) {
          errors.push({ message: "Giá so sánh không hợp lệ", row: rowNumber });
          continue;
        }
        if (row.salePrice > 0 && row.salePrice <= row.price) {
          errors.push({ message: "Giá so sánh phải lớn hơn giá bán", row: rowNumber });
          continue;
        }
      }

      const categoryId = categoryMap.get(categorySlug);
      if (!categoryId) {
        errors.push({ message: "Không tìm thấy danh mục theo slug", row: rowNumber });
        continue;
      }

      if (existingSkus.has(sku) || existingSlugs.has(slug) || seenSkus.has(sku) || seenSlugs.has(slug)) {
        skipped += 1;
        errors.push({ message: "SKU/Slug bị trùng", row: rowNumber });
        continue;
      }

      const orderValue = nextOrder;
      nextOrder += 1;
      const status = row.status ?? defaultStatus;
      const stockValue = Number.isFinite(row.stock ?? 0) ? (row.stock ?? 0) : 0;
      const salePrice = row.salePrice && row.salePrice > 0 ? row.salePrice : undefined;
      const normalizedImages = row.images?.map((image) => image.trim()).filter(Boolean);

      await ctx.db.insert("products", {
        categoryId,
        description: row.description?.trim() || undefined,
        image: row.image?.trim() || undefined,
        images: normalizedImages?.length ? normalizedImages : undefined,
        name,
        price: row.price,
        salePrice,
        sku,
        slug,
        status,
        stock: stockValue,
        sales: 0,
        order: orderValue,
        renderType: "content",
        productType,
        hasVariants: false,
      });

      await updateStats(ctx, { new: status });
      existingSkus.add(sku);
      existingSlugs.add(slug);
      seenSkus.add(sku);
      seenSlugs.add(slug);
      created += 1;
    }

    if (created > 0 || skipped > 0) {
      await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "product" });
    }

    return { created, skipped, errors };
  },
  returns: v.object({
    created: v.number(),
    errors: v.array(v.object({ message: v.string(), row: v.number() })),
    skipped: v.number(),
  }),
});

export const create = mutation({
  args: {
    affiliateLink: v.optional(v.string()),
    categoryId: v.id("productCategories"),
    description: v.optional(v.string()),
    renderType: v.optional(v.union(
      v.literal("content"),
      v.literal("markdown"),
      v.literal("html")
    )),
    markdownRender: v.optional(v.string()),
    htmlRender: v.optional(v.string()),
    hasVariants: v.optional(v.boolean()),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    imageStorageIds: v.optional(v.array(v.union(v.id("_storage"), v.null()))),
    productType: v.optional(v.union(v.literal("physical"), v.literal("digital"))),
    digitalDeliveryType: v.optional(
      v.union(
        v.literal("account"),
        v.literal("license"),
        v.literal("download"),
        v.literal("custom")
      )
    ),
    digitalCredentialsTemplate: v.optional(v.object({
      username: v.optional(v.string()),
      password: v.optional(v.string()),
      licenseKey: v.optional(v.string()),
      downloadUrl: v.optional(v.string()),
      customContent: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
    })),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    name: v.string(),
    optionIds: v.optional(v.array(v.id("productOptions"))),
    order: v.optional(v.number()),
    price: v.number(),
    salePrice: v.optional(v.union(v.number(), v.null())),
    sku: v.string(),
    slug: v.string(),
    status: v.optional(productStatus),
    stock: v.optional(v.number()),
    productTypeId: v.optional(v.id("productTypes")),
    attributeTermIds: v.optional(v.array(v.id("attributeTerms"))),
  },
  handler: async (ctx, args) => {
    // Validate unique SKU
    const existingSku = await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .unique();
    if (existingSku) {
      throw new ConvexError({
        code: "DUPLICATE_SKU",
        message: "Mã SKU đã tồn tại, vui lòng chọn mã khác",
      });
    }

    const resolvedSlug = await resolveUniqueSlug(ctx, {
      scope: "record",
      slug: args.slug,
    });

    // FIX #3: Get next order from stats instead of fetching ALL
    const nextOrder = await getNextOrder(ctx);
    
    // FIX #12: Get default status from module settings instead of hardcoded
    let defaultStatus: "Draft" | "Active" | "Archived" = "Draft";
    if (!args.status) {
      const setting = await ctx.db
        .query("moduleSettings")
        .withIndex("by_module_setting", (q) => 
          q.eq("moduleKey", "products").eq("settingKey", "defaultStatus")
        )
        .unique();
      if (setting?.value === "Active") {defaultStatus = "Active";}
    }
    const status = args.status ?? defaultStatus;

    const productTypeSetting = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", "products").eq("settingKey", "productTypeMode")
      )
      .unique();
    const saleModeSetting = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", "products").eq("settingKey", "saleMode")
      )
      .unique();
    const saleMode = saleModeSetting?.value === "contact" || saleModeSetting?.value === "affiliate"
      ? saleModeSetting.value
      : "cart";
    const variantSettings = await getVariantSettings(ctx);
    const hideBasePricing = variantSettings.variantEnabled && variantSettings.variantPricing === "variant";
    if (saleMode === "cart" && !hideBasePricing && args.price <= 0) {
      throw new Error("Giá bán phải lớn hơn 0");
    }
    const productTypeMode = (productTypeSetting?.value as "physical" | "digital" | "both") ?? "both";
    const productType = productTypeMode === "physical"
      ? "physical"
      : productTypeMode === "digital"
        ? "digital"
        : (args.productType ?? "physical");
    const { salePrice, renderType, markdownRender, htmlRender, ...restArgs } = args;
    const resolvedSalePrice = typeof salePrice === "number" && salePrice > 0 ? salePrice : undefined;
    if (resolvedSalePrice !== undefined) {
      if (!Number.isFinite(args.price) || args.price <= 0) {
        throw new Error("Giá bán phải lớn hơn 0");
      }
      if (resolvedSalePrice <= args.price) {
        throw new Error("Giá so sánh phải lớn hơn giá bán");
      }
    }
    const productId = await ctx.db.insert("products", {
      ...restArgs,
      slug: resolvedSlug.slug,
      renderType: renderType ?? "content",
      markdownRender,
      htmlRender,
      productType,
      digitalDeliveryType: productType === "digital" ? args.digitalDeliveryType : undefined,
      digitalCredentialsTemplate: productType === "digital" ? args.digitalCredentialsTemplate : undefined,
      stock: args.stock ?? 0,
      status,
      sales: 0,
      order: args.order ?? nextOrder,
      hasVariants: args.hasVariants ?? false,
      optionIds: args.optionIds,
      salePrice: resolvedSalePrice,
      productTypeId: args.productTypeId,
    });

    if (args.attributeTermIds && args.attributeTermIds.length > 0) {
      for (let i = 0; i < args.attributeTermIds.length; i++) {
        const termId = args.attributeTermIds[i];
        await ctx.db.insert("productAttributeTerms", { productId, termId, order: i });
      }
    }

    await syncOwnerFilesAndCleanup(ctx, {
      ownerField: "images",
      ownerId: productId,
      ownerTable: "products",
      purpose: "product-gallery",
    }, dedupeStorageIds([args.imageStorageId, ...(args.imageStorageIds ?? [])]));

    // Update stats counters
    await updateStats(ctx, { new: status });
    await recalculateProductEffectivePrice(ctx, productId);
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "product" });

    return productId;
  },
  returns: v.id("products"),
});

export const update = mutation({
  args: {
    affiliateLink: v.optional(v.string()),
    categoryId: v.optional(v.id("productCategories")),
    description: v.optional(v.string()),
    renderType: v.optional(v.union(
      v.literal("content"),
      v.literal("markdown"),
      v.literal("html")
    )),
    markdownRender: v.optional(v.string()),
    htmlRender: v.optional(v.string()),
    id: v.id("products"),
    hasVariants: v.optional(v.boolean()),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    imageStorageIds: v.optional(v.array(v.union(v.id("_storage"), v.null()))),
    productType: v.optional(v.union(v.literal("physical"), v.literal("digital"))),
    digitalDeliveryType: v.optional(
      v.union(
        v.literal("account"),
        v.literal("license"),
        v.literal("download"),
        v.literal("custom")
      )
    ),
    digitalCredentialsTemplate: v.optional(v.object({
      username: v.optional(v.string()),
      password: v.optional(v.string()),
      licenseKey: v.optional(v.string()),
      downloadUrl: v.optional(v.string()),
      customContent: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
    })),
    name: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    optionIds: v.optional(v.array(v.id("productOptions"))),
    order: v.optional(v.number()),
    price: v.optional(v.number()),
    salePrice: v.optional(v.union(v.number(), v.null())),
    sku: v.optional(v.string()),
    slug: v.optional(v.string()),
    status: v.optional(productStatus),
    stock: v.optional(v.number()),
    productTypeId: v.optional(v.id("productTypes")),
    attributeTermIds: v.optional(v.array(v.id("attributeTerms"))),
  },
  handler: async (ctx, args) => {
    const { id, salePrice, attributeTermIds, ...updates } = args;
    const hasSalePrice = Object.prototype.hasOwnProperty.call(args, "salePrice");
    const resolvedSalePrice = typeof salePrice === "number" && salePrice > 0 ? salePrice : undefined;
    const product = await ctx.db.get(id);
    if (!product) {throw new Error("Product not found");}

    // Validate unique SKU if changing
    if (args.sku && args.sku !== product.sku) {
      const newSku = args.sku;
      const existing = await ctx.db
        .query("products")
        .withIndex("by_sku", (q) => q.eq("sku", newSku))
        .unique();
      if (existing) {
        throw new ConvexError({
          code: "DUPLICATE_SKU",
          message: "Mã SKU đã tồn tại, vui lòng chọn mã khác",
        });
      }
    }

    if (args.slug && args.slug !== product.slug) {
      const resolvedSlug = await resolveUniqueSlug(ctx, {
        scope: "record",
        slug: args.slug,
        exclude: { id: args.id, table: "products" },
      });
      if (resolvedSlug.slug !== args.slug) {
        (args as { slug?: string }).slug = resolvedSlug.slug;
      }
    }

    // Update stats if status changed
    if (args.status && args.status !== product.status) {
      await updateStats(ctx, { new: args.status, old: product.status });
    }

    const productTypeSetting = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", "products").eq("settingKey", "productTypeMode")
      )
      .unique();
    const saleModeSetting = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", "products").eq("settingKey", "saleMode")
      )
      .unique();
    const saleMode = saleModeSetting?.value === "contact" || saleModeSetting?.value === "affiliate"
      ? saleModeSetting.value
      : "cart";
    const variantSettings = await getVariantSettings(ctx);
    const hideBasePricing = variantSettings.variantEnabled && variantSettings.variantPricing === "variant";
    const nextPrice = updates.price ?? product.price;
    if (saleMode === "cart" && !hideBasePricing && (!Number.isFinite(nextPrice) || nextPrice <= 0)) {
      throw new Error("Giá bán phải lớn hơn 0");
    }
    const nextSalePrice = hasSalePrice ? resolvedSalePrice : product.salePrice;
    if (nextSalePrice !== undefined) {
      if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
        throw new Error("Giá bán phải lớn hơn 0");
      }
      if (nextSalePrice <= nextPrice) {
        throw new Error("Giá so sánh phải lớn hơn giá bán");
      }
    }
    const productTypeMode = (productTypeSetting?.value as "physical" | "digital" | "both") ?? "both";
    const resolvedProductType = productTypeMode === "physical"
      ? "physical"
      : productTypeMode === "digital"
        ? "digital"
        : (updates.productType ?? product.productType ?? "physical");

    const nextUpdates = {
      ...updates,
      productType: resolvedProductType,
    } as typeof updates & {
      productType?: "physical" | "digital";
      digitalDeliveryType?: "account" | "license" | "download" | "custom";
      digitalCredentialsTemplate?: {
        username?: string;
        password?: string;
        licenseKey?: string;
        downloadUrl?: string;
        customContent?: string;
        expiresAt?: number;
      };
      salePrice?: number;
    };

    if (hasSalePrice) {
      nextUpdates.salePrice = resolvedSalePrice;
    }
    if (
      Object.prototype.hasOwnProperty.call(args, "imageStorageId")
      && args.imageStorageId === null
      && !Object.prototype.hasOwnProperty.call(args, "image")
    ) {
      nextUpdates.image = "";
    }

    if (resolvedProductType === "digital") {
      if (updates.digitalDeliveryType === undefined) {
        nextUpdates.digitalDeliveryType = product.digitalDeliveryType;
      }
      if (updates.digitalCredentialsTemplate === undefined) {
        nextUpdates.digitalCredentialsTemplate = product.digitalCredentialsTemplate;
      }
    } else {
      nextUpdates.digitalDeliveryType = undefined;
      nextUpdates.digitalCredentialsTemplate = undefined;
    }

    await ctx.db.patch(id, nextUpdates);

    const shouldCheckStorage = Object.prototype.hasOwnProperty.call(args, "imageStorageId")
      || Object.prototype.hasOwnProperty.call(args, "imageStorageIds");
    if (shouldCheckStorage) {
      const nextImageStorageId = Object.prototype.hasOwnProperty.call(nextUpdates, "imageStorageId")
        ? nextUpdates.imageStorageId ?? null
        : product.imageStorageId ?? null;
      const nextImageStorageIds = Object.prototype.hasOwnProperty.call(nextUpdates, "imageStorageIds")
        ? nextUpdates.imageStorageIds ?? []
        : product.imageStorageIds ?? [];
      await syncOwnerFilesAndCleanup(ctx, {
        ownerField: "images",
        ownerId: id,
        ownerTable: "products",
        purpose: "product-gallery",
      }, dedupeStorageIds([nextImageStorageId, ...(nextImageStorageIds ?? [])]), {
        previousStorageIds: [product.imageStorageId, ...(product.imageStorageIds ?? [])],
      });
    }

    if (attributeTermIds) {
      const existingTerms = await ctx.db
        .query("productAttributeTerms")
        .withIndex("by_product", (q) => q.eq("productId", id))
        .collect();
      for (const term of existingTerms) {
        await ctx.db.delete(term._id);
      }
      for (let i = 0; i < attributeTermIds.length; i++) {
        await ctx.db.insert("productAttributeTerms", {
          productId: id,
          termId: attributeTermIds[i],
          order: i,
        });
      }
    }

    await recalculateProductEffectivePrice(ctx, id);
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "product" });
    return null;
  },
  returns: v.null(),
});

export const updateStock = mutation({
  args: { id: v.id("products"), quantity: v.number() },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) {
      return { ok: false, error: "Product not found" };
    }
    const newStock = product.stock + args.quantity;
    if (newStock < 0) {
      return { ok: false, error: "Insufficient stock" };
    }
    await ctx.db.patch(args.id, { stock: newStock });
    return { ok: true };
  },
  returns: v.object({
    ok: v.boolean(),
    error: v.optional(v.string()),
  }),
});

export const incrementSales = mutation({
  args: { id: v.id("products"), quantity: v.number() },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) {throw new Error("Product not found");}
    await ctx.db.patch(args.id, { sales: product.sales + args.quantity });
    return null;
  },
  returns: v.null(),
});

// FIX #7: Batch delete with Promise.all for cascade operations
export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) {throw new Error("Product not found");}

    const [commentPreview, wishlistPreview, cartPreview, variantPreview] = await Promise.all([
      ctx.db
        .query("comments")
        .withIndex("by_target_status", (q) =>
          q.eq("targetType", "product").eq("targetId", args.id)
        )
        .take(1),
      ctx.db
        .query("wishlist")
        .withIndex("by_product", (q) => q.eq("productId", args.id))
        .take(1),
      ctx.db
        .query("cartItems")
        .withIndex("by_product", (q) => q.eq("productId", args.id))
        .take(1),
      ctx.db
        .query("productVariants")
        .withIndex("by_product", (q) => q.eq("productId", args.id))
        .take(1),
    ]);

    if (!args.cascade && (commentPreview.length > 0 || wishlistPreview.length > 0 || cartPreview.length > 0 || variantPreview.length > 0)) {
      throw new Error("Sản phẩm có dữ liệu liên quan. Vui lòng xác nhận xóa tất cả.");
    }

    if (args.cascade) {
      const [comments, wishlistItems, cartItems, variants] = await Promise.all([
        ctx.db
          .query("comments")
          .withIndex("by_target_status", (q) =>
            q.eq("targetType", "product").eq("targetId", args.id)
          )
          .collect(),
        ctx.db
          .query("wishlist")
          .withIndex("by_product", (q) => q.eq("productId", args.id))
          .collect(),
        ctx.db
          .query("cartItems")
          .withIndex("by_product", (q) => q.eq("productId", args.id))
          .collect(),
        ctx.db
          .query("productVariants")
          .withIndex("by_product", (q) => q.eq("productId", args.id))
          .collect(),
      ]);

      await Promise.all([
        ...comments.map( async (c) => ctx.db.delete(c._id)),
        ...wishlistItems.map( async (w) => ctx.db.delete(w._id)),
        ...cartItems.map( async (c) => ctx.db.delete(c._id)),
        ...variants.map( async (variant) => ctx.db.delete(variant._id)),
      ]);
    }

    await removeOwnerFilesAndCleanup(ctx, {
      ownerId: args.id,
      ownerTable: "products",
    }, {
      previousStorageIds: [product.imageStorageId, ...(product.imageStorageIds ?? [])],
    });

    await ctx.db.delete(args.id);
    await updateStats(ctx, { old: product.status });
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "product" });

    return null;
  },
  returns: v.null(),
});

export const duplicate = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) {
      throw new Error("Product not found");
    }

    const copiedName = await generateUniqueCopiedName(ctx, source.name);
    const copiedSlug = await generateUniqueProductSlug(ctx, source.slug);
    const copiedSku = await generateUniqueProductSku(ctx, source.sku);
    const nextOrder = await getNextOrder(ctx);

    const newProductId = await ctx.db.insert("products", {
      affiliateLink: source.affiliateLink,
      categoryId: source.categoryId,
      description: source.description,
      digitalCredentialsTemplate: source.digitalCredentialsTemplate,
      digitalDeliveryType: source.digitalDeliveryType,
      hasVariants: source.hasVariants,
      htmlRender: source.htmlRender,
      image: source.image,
      images: source.images,
      imageStorageId: source.imageStorageId,
      imageStorageIds: source.imageStorageIds,
      markdownRender: source.markdownRender,
      metaDescription: source.metaDescription,
      metaTitle: source.metaTitle,
      name: copiedName,
      optionIds: source.optionIds,
      order: nextOrder,
      price: source.price,
      productType: source.productType,
      renderType: source.renderType,
      salePrice: source.salePrice,
      sales: 0,
      sku: copiedSku,
      slug: copiedSlug,
      status: source.status,
      stock: source.stock,
    });

    if (source.hasVariants) {
      const sourceVariants = await ctx.db
        .query("productVariants")
        .withIndex("by_product", (q) => q.eq("productId", source._id))
        .collect();

      for (const variant of sourceVariants) {
        const copiedVariantSku = await generateUniqueVariantSku(ctx, variant.sku);
        await ctx.db.insert("productVariants", {
          allowBackorder: variant.allowBackorder,
          barcode: variant.barcode,
          image: variant.image,
          images: variant.images,
          optionValues: variant.optionValues,
          order: variant.order,
          price: variant.price,
          productId: newProductId,
          salePrice: variant.salePrice,
          sku: copiedVariantSku,
          status: variant.status,
          stock: variant.stock,
        });
      }
    }

    await syncOwnerFilesAndCleanup(ctx, {
      ownerField: "images",
      ownerId: newProductId,
      ownerTable: "products",
      purpose: "product-gallery",
    }, dedupeStorageIds([source.imageStorageId, ...(source.imageStorageIds ?? [])]));

    await updateStats(ctx, { new: source.status });
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "product" });

    return { id: newProductId, name: copiedName };
  },
  returns: v.object({ id: v.id("products"), name: v.string() }),
});

export const bulkUpdateStatus = mutation({
  args: {
    ids: v.array(v.id("products")),
    status: productStatus,
  },
  handler: async (ctx, args) => {
    let updated = 0;
    let skipped = 0;

    for (const id of args.ids) {
      const product = await ctx.db.get(id);
      if (!product) {
        skipped += 1;
        continue;
      }
      if (product.status === args.status) {
        skipped += 1;
        continue;
      }
      await ctx.db.patch(id, { status: args.status });
      await updateStats(ctx, { old: product.status, new: args.status });
      updated += 1;
    }

    if (updated > 0) {
      await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "product" });
    }

    return { updated, skipped };
  },
  returns: v.object({ skipped: v.number(), updated: v.number() }),
});

export const bulkClearBrokenMedia = mutation({
  args: { ids: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    let checked = 0;
    let updated = 0;
    let clearedPrimary = 0;
    let clearedGallery = 0;
    let skipped = 0;

    for (const id of args.ids) {
      const product = await ctx.db.get(id);
      if (!product) {
        skipped += 1;
        continue;
      }
      checked += 1;

      const patch: {
        image?: string;
        imageStorageId?: Id<"_storage"> | null;
        images?: string[];
        imageStorageIds?: Array<Id<"_storage"> | null>;
      } = {};

      if (await isBrokenStorageBackedUrl(ctx, product.image, product.imageStorageId)) {
        patch.image = "";
        patch.imageStorageId = null;
        clearedPrimary += 1;
      }

      const images = product.images ?? [];
      const imageStorageIds = product.imageStorageIds ?? [];
      if (images.length > 0) {
        const keptImages: string[] = [];
        const keptStorageIds: Array<Id<"_storage"> | null> = [];
        for (let index = 0; index < images.length; index += 1) {
          const url = images[index];
          const storageId = imageStorageIds[index] ?? null;
          if (await isBrokenStorageBackedUrl(ctx, url, storageId)) {
            clearedGallery += 1;
            continue;
          }
          keptImages.push(url);
          keptStorageIds.push(storageId);
        }
        if (keptImages.length !== images.length) {
          patch.images = keptImages;
          patch.imageStorageIds = keptStorageIds;
        }
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(id, patch);
        const nextPrimaryStorageId = Object.prototype.hasOwnProperty.call(patch, "imageStorageId")
          ? patch.imageStorageId
          : product.imageStorageId;
        const nextGalleryStorageIds = Object.prototype.hasOwnProperty.call(patch, "imageStorageIds")
          ? patch.imageStorageIds
          : product.imageStorageIds;
        await syncOwnerFilesAndCleanup(ctx, {
          ownerField: "images",
          ownerId: id,
          ownerTable: "products",
          purpose: "product-gallery",
        }, dedupeStorageIds([nextPrimaryStorageId, ...(nextGalleryStorageIds ?? [])]), {
          previousStorageIds: [product.imageStorageId, ...(product.imageStorageIds ?? [])],
        });
        updated += 1;
      }
    }

    if (updated > 0) {
      await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "product" });
    }

    return { checked, clearedGallery, clearedPrimary, skipped, updated };
  },
  returns: v.object({
    checked: v.number(),
    clearedGallery: v.number(),
    clearedPrimary: v.number(),
    skipped: v.number(),
    updated: v.number(),
  }),
});

export const getDeleteInfo = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const [variantsPreview, variantsCount, commentsCount, wishlistCount, cartCount] = await Promise.all([
      ctx.db.query("productVariants").withIndex("by_product", (q) => q.eq("productId", args.id)).take(10),
      ctx.db.query("productVariants").withIndex("by_product", (q) => q.eq("productId", args.id)).take(1001),
      ctx.db.query("comments").withIndex("by_target_status", (q) => q.eq("targetType", "product").eq("targetId", args.id)).take(1001),
      ctx.db.query("wishlist").withIndex("by_product", (q) => q.eq("productId", args.id)).take(1001),
      ctx.db.query("cartItems").withIndex("by_product", (q) => q.eq("productId", args.id)).take(1001),
    ]);

    return {
      canDelete: true,
      dependencies: [
        {
          count: Math.min(variantsCount.length, 1000),
          hasMore: variantsCount.length > 1000,
          label: "Biến thể",
          preview: variantsPreview.map((variant) => ({ id: variant._id, name: variant.sku })),
        },
        {
          count: Math.min(commentsCount.length, 1000),
          hasMore: commentsCount.length > 1000,
          label: "Bình luận",
          preview: [],
        },
        {
          count: Math.min(wishlistCount.length, 1000),
          hasMore: wishlistCount.length > 1000,
          label: "Wishlist",
          preview: [],
        },
        {
          count: Math.min(cartCount.length, 1000),
          hasMore: cartCount.length > 1000,
          label: "Giỏ hàng",
          preview: [],
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

// FIX #4: Batch reorder with Promise.all
export const reorder = mutation({
  args: { items: v.array(v.object({ id: v.id("products"), order: v.number() })) },
  handler: async (ctx, args) => {
    await Promise.all(
      args.items.map( async (item) => ctx.db.patch(item.id, { order: item.order }))
    );
    return null;
  },
  returns: v.null(),
});

// Bulk delete for admin (FIX #10 support)
export const bulkRemove = mutation({
  args: { ids: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    let deletedCount = 0;

    for (const id of args.ids) {
      const product = await ctx.db.get(id);
      if (!product) {continue;}

      // Collect related items
      const [comments, wishlistItems, cartItems] = await Promise.all([
        ctx.db
          .query("comments")
          .withIndex("by_target_status", (q) =>
            q.eq("targetType", "product").eq("targetId", id)
          )
          .collect(),
        ctx.db
          .query("wishlist")
          .withIndex("by_product", (q) => q.eq("productId", id))
          .collect(),
        ctx.db
          .query("cartItems")
          .withIndex("by_product", (q) => q.eq("productId", id))
          .collect(),
      ]);

      // Batch delete related items
      await Promise.all([
        ...comments.map( async (c) => ctx.db.delete(c._id)),
        ...wishlistItems.map( async (w) => ctx.db.delete(w._id)),
        ...cartItems.map( async (c) => ctx.db.delete(c._id)),
      ]);

      await removeOwnerFilesAndCleanup(ctx, {
        ownerId: id,
        ownerTable: "products",
      }, {
        previousStorageIds: [product.imageStorageId, ...(product.imageStorageIds ?? [])],
      });

      await ctx.db.delete(id);
      await updateStats(ctx, { old: product.status });
      deletedCount++;
    }

    return deletedCount;
  },
  returns: v.number(),
});

// Initialize stats (run once or when resetting)
export const initStats = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing stats
    const existingStats = await ctx.db.query("productStats").collect();
    await Promise.all(existingStats.map( async (s) => ctx.db.delete(s._id)));

    // Count products by status
    const products = await ctx.db.query("products").collect();
    const counts = { Active: 0, Archived: 0, Draft: 0, total: 0 };
    let maxOrder = 0;

    for (const p of products) {
      counts.total++;
      counts[p.status as keyof typeof counts]++;
      if (p.order > maxOrder) {maxOrder = p.order;}
    }

    // Insert stats
    await Promise.all([
      ctx.db.insert("productStats", { count: counts.total, key: "total", lastOrder: maxOrder }),
      ctx.db.insert("productStats", { count: counts.Active, key: "Active", lastOrder: 0 }),
      ctx.db.insert("productStats", { count: counts.Draft, key: "Draft", lastOrder: 0 }),
      ctx.db.insert("productStats", { count: counts.Archived, key: "Archived", lastOrder: 0 }),
    ]);

    return null;
  },
  returns: v.null(),
});

export const getActiveTermsForProducts = query({
  args: { productIds: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    if (args.productIds.length === 0) return [];

    const allMappings = await Promise.all(
      args.productIds.map((productId) =>
        ctx.db
          .query("productAttributeTerms")
          .withIndex("by_product", (q) => q.eq("productId", productId))
          .collect()
      )
    );
    const termIds = allMappings.flat().map((m) => m.termId);
    return Array.from(new Set(termIds));
  },
  returns: v.array(v.id("attributeTerms")),
});

export const listProductsByCategoryForAdmin = query({
  args: {
    categoryId: v.id("productCategories"),
  },
  handler: async (ctx, args) => {
    // 1. Lấy sản phẩm gán chính
    let products = await ctx.db
      .query("products")
      .withIndex("by_category_status", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    // 2. Lấy sản phẩm gán phụ qua assignments
    const assignments = await ctx.db
      .query("productCategoryAssignments")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    if (assignments.length > 0) {
      const assignedProducts = await Promise.all(
        assignments.map((item) => ctx.db.get(item.productId))
      );
      const validAssignedProducts = assignedProducts.filter(
        (p): p is Doc<"products"> => Boolean(p)
      );

      const map = new Map<Id<"products">, Doc<"products">>();
      // Cho sản phẩm gán chính vào trước
      products.forEach((p) => map.set(p._id, p));
      // Cho sản phẩm gán phụ vào sau
      validAssignedProducts.forEach((p) => map.set(p._id, p));
      products = Array.from(map.values());
    }

    // Sắp xếp các sản phẩm ảo này theo order giảm dần
    products.sort((a, b) => b.order - a.order);

    return products;
  },
  returns: v.array(productDoc),
});

export const listProductsForCategories = query({
  args: {
    categoryIds: v.array(v.id("productCategories")),
  },
  handler: async (ctx, args) => {
    if (args.categoryIds.length === 0) {
      return [];
    }

    const settings = await getVariantSettings(ctx);
    const results: Doc<"products">[] = [];
    const seenKeys = new Set<string>(); // Tránh trùng lặp cho cặp (productId, categoryId)

    for (const catId of args.categoryIds) {
      // 1. Lấy sản phẩm có categoryId chính trùng với catId
      const primaryProducts = await ctx.db
        .query("products")
        .withIndex("by_category_status", (q) => q.eq("categoryId", catId).eq("status", "Active"))
        .collect();

      for (const p of primaryProducts) {
        const key = `${p._id}-${catId}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          results.push({ ...p, categoryId: catId });
        }
      }

      // 2. Lấy sản phẩm gán phụ qua assignments
      const assignments = await ctx.db
        .query("productCategoryAssignments")
        .withIndex("by_category", (q) => q.eq("categoryId", catId))
        .collect();

      if (assignments.length > 0) {
        const assignedProducts = await Promise.all(
          assignments.map((item) => ctx.db.get(item.productId))
        );
        for (const p of assignedProducts) {
          if (p && p.status === "Active") {
            const key = `${p._id}-${catId}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              results.push({ ...p, categoryId: catId });
            }
          }
        }
      }
    }

    // Sắp xếp theo order giảm dần
    results.sort((a, b) => b.order - a.order);

    const resolved = await resolveVariantOverrides(ctx, results, settings);
    return resolved;
  },
  returns: v.array(productDoc),
});

export const countActiveByCategory = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_status_order", (q) => q.eq("status", "Active"))
      .collect();

    const counts: Record<string, number> = {};
    const activeProductsMap = new Map<string, any>();
    
    products.forEach((p) => {
      activeProductsMap.set(p._id, p);
      if (p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1;
      }
    });

    // Lấy thêm các gán phụ từ productCategoryAssignments
    const assignments = await ctx.db
      .query("productCategoryAssignments")
      .collect();

    assignments.forEach((a) => {
      const product = activeProductsMap.get(a.productId);
      if (product && product.categoryId !== a.categoryId) {
        counts[a.categoryId] = (counts[a.categoryId] ?? 0) + 1;
      }
    });

    return counts;
  },
  returns: v.any(),
});

export const backfillEffectivePrices = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    let count = 0;
    for (const p of products) {
      await recalculateProductEffectivePrice(ctx, p._id);
      count++;
    }
    return count;
  },
});
