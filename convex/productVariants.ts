import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { recalculateProductEffectivePrice } from "./products";

const variantStatus = v.union(v.literal("Active"), v.literal("Inactive"));

const optionValueDoc = v.object({
  customValue: v.optional(v.string()),
  optionId: v.id("productOptions"),
  valueId: v.id("productOptionValues"),
});

const variantDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("productVariants"),
  allowBackorder: v.optional(v.boolean()),
  barcode: v.optional(v.string()),
  image: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  optionValues: v.array(optionValueDoc),
  order: v.number(),
  price: v.optional(v.number()),
  productId: v.id("products"),
  salePrice: v.optional(v.number()),
  sku: v.string(),
  status: variantStatus,
  stock: v.optional(v.number()),
});

const bulkRowDoc = v.object({
  allowBackorder: v.optional(v.boolean()),
  optionValues: v.array(optionValueDoc),
  price: v.optional(v.number()),
  salePrice: v.optional(v.number()),
  selected: v.boolean(),
  sku: v.optional(v.string()),
  status: v.optional(variantStatus),
  stock: v.optional(v.number()),
});

const resolveSalePrice = (value?: number) => (typeof value === "number" && value > 0 ? value : undefined);

const assertSalePrice = (price?: number, salePrice?: number) => {
  if (typeof salePrice === "number") {
    const normalizedPrice = typeof price === "number" ? price : NaN;
    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      throw new Error("Giá bán phải lớn hơn 0");
    }
    if (salePrice <= normalizedPrice) {
      throw new Error("Giá so sánh phải lớn hơn giá bán");
    }
  }
};

const buildVariantKey = (optionValues: { optionId: string; valueId: string; customValue?: string }[]) =>
  optionValues
    .slice()
    .sort((a, b) => a.optionId.localeCompare(b.optionId))
    .map((item) => `${item.optionId}:${item.valueId}:${item.customValue ?? ''}`)
    .join('|');

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxLimit = Math.min(args.limit ?? 200, 500);
    return ctx.db.query("productVariants").order("desc").take(maxLimit);
  },
  returns: v.array(variantDoc),
});

export const listByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => ctx.db
      .query("productVariants")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect(),
  returns: v.array(variantDoc),
});

export const listByProductActive = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => ctx.db
      .query("productVariants")
      .withIndex("by_product_status", (q) => q.eq("productId", args.productId).eq("status", "Active"))
      .collect(),
  returns: v.array(variantDoc),
});

export const listByIds = query({
  args: { ids: v.array(v.id("productVariants")) },
  handler: async (ctx, args) => {
    if (args.ids.length === 0) {
      return [];
    }

    const items = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return items.filter((item): item is Doc<"productVariants"> => item !== null).sort((a, b) => a.order - b.order);
  },
  returns: v.array(variantDoc),
});

export const listAdminWithOffset = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    productId: v.optional(v.id("products")),
    search: v.optional(v.string()),
    status: v.optional(variantStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 50, 1000);

    const queryBuilder = args.productId && args.status
      ? ctx.db
          .query("productVariants")
          .withIndex("by_product_status", (q) => q.eq("productId", args.productId!).eq("status", args.status!))
      : args.productId
        ? ctx.db
            .query("productVariants")
            .withIndex("by_product", (q) => q.eq("productId", args.productId!))
        : ctx.db.query("productVariants");

    let variants: Doc<"productVariants">[] = await queryBuilder.order("desc").take(fetchLimit);

    if (args.status && !args.productId) {
      variants = variants.filter((variant) => variant.status === args.status);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      variants = variants.filter((variant) => variant.sku.toLowerCase().includes(searchLower));
    }

    return variants.slice(offset, offset + limit);
  },
  returns: v.array(variantDoc),
});

export const countAdmin = query({
  args: {
    productId: v.optional(v.id("products")),
    search: v.optional(v.string()),
    status: v.optional(variantStatus),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    const fetchLimit = limit + 1;

    const queryBuilder = args.productId
      ? ctx.db
          .query("productVariants")
          .withIndex("by_product", (q) => q.eq("productId", args.productId!))
      : ctx.db.query("productVariants");

    let variants: Doc<"productVariants">[] = await queryBuilder.take(fetchLimit);

    if (args.status) {
      variants = variants.filter((variant) => variant.status === args.status);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      variants = variants.filter((variant) => variant.sku.toLowerCase().includes(searchLower));
    }

    return { count: Math.min(variants.length, limit), hasMore: variants.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    limit: v.optional(v.number()),
    productId: v.optional(v.id("products")),
    search: v.optional(v.string()),
    status: v.optional(variantStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    const fetchLimit = limit + 1;

    const queryBuilder = args.productId
      ? ctx.db
          .query("productVariants")
          .withIndex("by_product", (q) => q.eq("productId", args.productId!))
      : ctx.db.query("productVariants");

    let variants: Doc<"productVariants">[] = await queryBuilder.take(fetchLimit);

    if (args.status) {
      variants = variants.filter((variant) => variant.status === args.status);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      variants = variants.filter((variant) => variant.sku.toLowerCase().includes(searchLower));
    }

    const hasMore = variants.length > limit;
    return { ids: variants.slice(0, limit).map((variant) => variant._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("productVariants")), hasMore: v.boolean() }),
});

export const getById = query({
  args: { id: v.id("productVariants") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(variantDoc, v.null()),
});

export const getBySku = query({
  args: { sku: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("productVariants")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .unique(),
  returns: v.union(variantDoc, v.null()),
});

export const create = mutation({
  args: {
    allowBackorder: v.optional(v.boolean()),
    barcode: v.optional(v.string()),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    optionValues: v.array(optionValueDoc),
    order: v.optional(v.number()),
    price: v.optional(v.number()),
    productId: v.id("products"),
    salePrice: v.optional(v.number()),
    sku: v.string(),
    status: v.optional(variantStatus),
    stock: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {throw new Error("Product không tồn tại");}

    const existingSku = await ctx.db
      .query("productVariants")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .unique();
    if (existingSku) {throw new Error("SKU đã tồn tại");}

    const optionValueIds = args.optionValues.map((item) => item.valueId);
    const optionValues = await Promise.all(
      optionValueIds.map( async (id) => ctx.db.get(id))
    );
    optionValues.forEach((value, index) => {
      const input = args.optionValues[index];
      if (!value) {throw new Error("Option value không tồn tại");}
      if (value.optionId !== input.optionId) {
        throw new Error("Option value không khớp với optionId");
      }
    });

    let nextOrder = args.order;
    if (nextOrder === undefined) {
      const lastVariant = await ctx.db
        .query("productVariants")
        .withIndex("by_product_order", (q) => q.eq("productId", args.productId))
        .order("desc")
        .first();
      nextOrder = lastVariant ? lastVariant.order + 1 : 0;
    }

    const resolvedSalePrice = resolveSalePrice(args.salePrice);
    assertSalePrice(args.price, resolvedSalePrice);

    const variantId = await ctx.db.insert("productVariants", {
      ...args,
      salePrice: resolvedSalePrice,
      order: nextOrder,
      status: args.status ?? "Active",
    });

    await recalculateProductEffectivePrice(ctx, args.productId);
    return variantId;
  },
  returns: v.id("productVariants"),
});

export const update = mutation({
  args: {
    allowBackorder: v.optional(v.boolean()),
    barcode: v.optional(v.string()),
    id: v.id("productVariants"),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    optionValues: v.optional(v.array(optionValueDoc)),
    order: v.optional(v.number()),
    price: v.optional(v.number()),
    productId: v.optional(v.id("products")),
    salePrice: v.optional(v.number()),
    sku: v.optional(v.string()),
    status: v.optional(variantStatus),
    stock: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const hasSalePrice = Object.prototype.hasOwnProperty.call(args, "salePrice");
    const resolvedSalePrice = resolveSalePrice(updates.salePrice);
    const variant = await ctx.db.get(id);
    if (!variant) {throw new Error("Variant không tồn tại");}

    if (updates.sku && updates.sku !== variant.sku) {
      const existingSku = await ctx.db
        .query("productVariants")
        .withIndex("by_sku", (q) => q.eq("sku", updates.sku!))
        .unique();
      if (existingSku) {throw new Error("SKU đã tồn tại");}
    }

    if (updates.optionValues) {
      const optionValues = await Promise.all(
        updates.optionValues.map( async (item) => ctx.db.get(item.valueId))
      );
      optionValues.forEach((value, index) => {
        const input = updates.optionValues![index];
        if (!value) {throw new Error("Option value không tồn tại");}
        if (value.optionId !== input.optionId) {
          throw new Error("Option value không khớp với optionId");
        }
      });
    }

    if (updates.productId && updates.productId !== variant.productId) {
      const product = await ctx.db.get(updates.productId);
      if (!product) {throw new Error("Product không tồn tại");}
    }

    const nextPrice = updates.price ?? variant.price;
    const nextSalePrice = hasSalePrice ? resolvedSalePrice : variant.salePrice;
    assertSalePrice(nextPrice, nextSalePrice);

    const nextUpdates = {
      ...updates,
      ...(hasSalePrice ? { salePrice: resolvedSalePrice } : {}),
    };

    await ctx.db.patch(id, nextUpdates);
    await recalculateProductEffectivePrice(ctx, variant.productId);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { id: v.id("productVariants") },
  handler: async (ctx, args) => {
    const variant = await ctx.db.get(args.id);
    if (!variant) {throw new Error("Variant không tồn tại");}
    await ctx.db.delete(args.id);
    await recalculateProductEffectivePrice(ctx, variant.productId);
    return null;
  },
  returns: v.null(),
});

export const reorder = mutation({
  args: { items: v.array(v.object({ id: v.id("productVariants"), order: v.number() })) },
  handler: async (ctx, args) => {
    await Promise.all(
      args.items.map( async (item) => ctx.db.patch(item.id, { order: item.order }))
    );
    return null;
  },
  returns: v.null(),
});

export const bulkUpsertFromCombinations = mutation({
  args: {
    overwriteExisting: v.boolean(),
    productId: v.id("products"),
    rows: v.array(bulkRowDoc),
    skuEnabled: v.boolean(),
    skuPrefix: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {throw new Error("Product không tồn tại");}

    const rows = args.rows.filter((row) => row.selected);
    if (rows.length === 0) {
      return { created: 0, errors: [], skipped: args.rows.length, updated: 0 };
    }

    const existingVariants = await ctx.db
      .query("productVariants")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    const existingByKey = new Map<string, Doc<"productVariants">>();
    existingVariants.forEach((variant) => {
      existingByKey.set(buildVariantKey(variant.optionValues), variant);
    });

    const existingSkus = new Set(existingVariants.map((variant) => variant.sku));

    const valueIds = new Set(rows.flatMap((row) => row.optionValues.map((item) => item.valueId)));
    const valueDocs = await Promise.all(Array.from(valueIds).map((id) => ctx.db.get(id)));
    const valueMap = new Map<string, Doc<"productOptionValues">>();
    valueDocs.forEach((doc) => {
      if (doc) {valueMap.set(doc._id, doc);}
    });

    let counter = 1;
    const nextSkuWithPrefix = (prefix: string) => {
      let candidate = `${prefix}-${counter}`;
      while (existingSkus.has(candidate)) {
        counter += 1;
        candidate = `${prefix}-${counter}`;
      }
      existingSkus.add(candidate);
      counter += 1;
      return candidate;
    };

    const nextFallbackSku = () => {
      const stamp = Date.now();
      let candidate = `VAR-${stamp}-${counter}`;
      while (existingSkus.has(candidate)) {
        counter += 1;
        candidate = `VAR-${stamp}-${counter}`;
      }
      existingSkus.add(candidate);
      counter += 1;
      return candidate;
    };

    const lastVariant = await ctx.db
      .query("productVariants")
      .withIndex("by_product_order", (q) => q.eq("productId", args.productId))
      .order("desc")
      .first();
    let nextOrder = lastVariant ? lastVariant.order + 1 : 0;

    const result = { created: 0, errors: [] as { rowIndex: number; message: string }[], skipped: 0, updated: 0 };

    for (const [index, row] of rows.entries()) {
      try {
        row.optionValues.forEach((item) => {
          const valueDoc = valueMap.get(item.valueId);
          if (!valueDoc) {throw new Error("Option value không tồn tại");}
          if (valueDoc.optionId !== item.optionId) {throw new Error("Option value không khớp với optionId");}
        });

        const key = buildVariantKey(row.optionValues);
        const existing = existingByKey.get(key);
        if (existing && !args.overwriteExisting) {
          result.skipped += 1;
          continue;
        }

        const resolvedSalePrice = resolveSalePrice(row.salePrice);
        assertSalePrice(row.price, resolvedSalePrice);

        const resolvedSku = args.skuEnabled
          ? row.sku?.trim() || (args.skuPrefix?.trim() ? nextSkuWithPrefix(args.skuPrefix.trim()) : '')
          : nextFallbackSku();

        if (args.skuEnabled && !resolvedSku) {
          throw new Error("Thiếu SKU prefix");
        }

        if (existing) {
          const updates = {
            allowBackorder: row.allowBackorder,
            price: row.price,
            salePrice: resolvedSalePrice,
            status: row.status ?? existing.status,
            stock: row.stock,
          };
          if (row.sku?.trim() && row.sku.trim() !== existing.sku) {
            const skuCandidate = row.sku.trim();
            const skuExists = await ctx.db
              .query("productVariants")
              .withIndex("by_sku", (q) => q.eq("sku", skuCandidate))
              .unique();
            if (skuExists) {throw new Error("SKU đã tồn tại");}
            await ctx.db.patch(existing._id, { ...updates, sku: skuCandidate });
          } else {
            await ctx.db.patch(existing._id, updates);
          }
          result.updated += 1;
        } else {
          const skuCandidate = resolvedSku;
          const skuExists = await ctx.db
            .query("productVariants")
            .withIndex("by_sku", (q) => q.eq("sku", skuCandidate))
            .unique();
          if (skuExists) {throw new Error("SKU đã tồn tại");}

          await ctx.db.insert("productVariants", {
            allowBackorder: row.allowBackorder,
            optionValues: row.optionValues,
            order: nextOrder,
            price: row.price,
            productId: args.productId,
            salePrice: resolvedSalePrice,
            sku: skuCandidate,
            status: row.status ?? "Active",
            stock: row.stock,
          });
          nextOrder += 1;
          result.created += 1;
        }
      } catch (error) {
        result.errors.push({ rowIndex: index, message: error instanceof Error ? error.message : "Không thể xử lý dòng" });
      }
    }

    result.skipped += args.rows.length - rows.length;
    await recalculateProductEffectivePrice(ctx, args.productId);
    return result;
  },
  returns: v.object({
    created: v.number(),
    errors: v.array(v.object({ message: v.string(), rowIndex: v.number() })),
    skipped: v.number(),
    updated: v.number(),
  }),
});
