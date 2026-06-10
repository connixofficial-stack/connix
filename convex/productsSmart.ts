import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { productStatus } from "./lib/validators";
import { resolveUniqueSlug } from "./lib/iaSlugs";
import { dedupeStorageIds, syncOwnerFilesAndCleanup } from "./lib/fileService";
import { isMultiCategoryEnabled, syncProductCategoryAssignments } from "./lib/multiCategory";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const renderTypeDoc = v.union(v.literal("content"), v.literal("markdown"), v.literal("html"));
const productTypeDoc = v.union(v.literal("physical"), v.literal("digital"));
const digitalDeliveryTypeDoc = v.union(
  v.literal("account"),
  v.literal("license"),
  v.literal("download"),
  v.literal("custom")
);
const digitalCredentialsDoc = v.object({
  username: v.optional(v.string()),
  password: v.optional(v.string()),
  licenseKey: v.optional(v.string()),
  downloadUrl: v.optional(v.string()),
  customContent: v.optional(v.string()),
  expiresAt: v.optional(v.number()),
});

const inlineOptionValueDoc = v.object({
  optionId: v.id("productOptions"),
  valueId: v.id("productOptionValues"),
});

const inlineVariantDoc = v.object({
  id: v.optional(v.id("productVariants")),
  sku: v.string(),
  price: v.number(),
  salePrice: v.optional(v.union(v.number(), v.null())),
  stock: v.number(),
  optionValues: v.array(inlineOptionValueDoc),
});

const inlineOptionDoc = v.object({
  optionId: v.id("productOptions"),
  valueIds: v.array(v.id("productOptionValues")),
});

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

const smartProductArgs = {
  affiliateLink: v.optional(v.string()),
  categoryId: v.id("productCategories"),
  additionalCategoryIds: v.optional(v.array(v.id("productCategories"))),
  description: v.optional(v.string()),
  renderType: v.optional(renderTypeDoc),
  markdownRender: v.optional(v.string()),
  htmlRender: v.optional(v.string()),
  hasVariants: v.optional(v.boolean()),
  image: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  imageStorageIds: v.optional(v.array(v.union(v.id("_storage"), v.null()))),
  productTypeId: v.optional(v.id("productTypes")),
  attributeTermIds: v.optional(v.array(v.id("attributeTerms"))),
  productType: v.optional(productTypeDoc),
  digitalDeliveryType: v.optional(digitalDeliveryTypeDoc),
  digitalCredentialsTemplate: v.optional(digitalCredentialsDoc),
  metaDescription: v.optional(v.string()),
  metaTitle: v.optional(v.string()),
  name: v.string(),
  order: v.optional(v.number()),
  price: v.number(),
  salePrice: v.optional(v.union(v.number(), v.null())),
  sku: v.string(),
  slug: v.string(),
  status: v.optional(productStatus),
  stock: v.optional(v.number()),
  options: v.array(inlineOptionDoc),
  variants: v.array(inlineVariantDoc),
  combos: v.optional(v.array(comboItemDoc)),
};

type InlineOptionInput = {
  optionId: Id<"productOptions">;
  valueIds: Id<"productOptionValues">[];
};

type InlineVariantInput = {
  id?: Id<"productVariants">;
  sku: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  optionValues: Array<{
    optionId: Id<"productOptions">;
    valueId: Id<"productOptionValues">;
  }>;
};

const normalizeSkuText = (value: string) => value
  .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
  .replaceAll(/[đĐ]/g, "D")
  .replaceAll(/[^A-Za-z0-9]/g, "")
  .toUpperCase();

const resolveSalePrice = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;

async function getModuleSetting(ctx: MutationCtx, key: string) {
  return await ctx.db
    .query("moduleSettings")
    .withIndex("by_module_setting", (q) => q.eq("moduleKey", "products").eq("settingKey", key))
    .unique();
}

async function getVariantSettings(ctx: MutationCtx) {
  const [variantEnabled, variantPricing] = await Promise.all([
    getModuleSetting(ctx, "variantEnabled"),
    getModuleSetting(ctx, "variantPricing"),
  ]);
  return {
    variantEnabled: Boolean(variantEnabled?.value),
    variantPricing: (variantPricing?.value as "product" | "variant" | undefined) ?? "variant",
  };
}

async function getNextOrder(ctx: MutationCtx) {
  const totalStats = await ctx.db
    .query("productStats")
    .withIndex("by_key", (q) => q.eq("key", "total"))
    .unique();
  return totalStats?.lastOrder ?? 0;
}

async function updateStats(ctx: MutationCtx, statusChange: { old?: string; new?: string }) {
  const totalStats = await ctx.db
    .query("productStats")
    .withIndex("by_key", (q) => q.eq("key", "total"))
    .unique();

  if (statusChange.new && !statusChange.old) {
    if (totalStats) {
      await ctx.db.patch(totalStats._id, {
        count: totalStats.count + 1,
        lastOrder: totalStats.lastOrder + 1,
      });
    } else {
      await ctx.db.insert("productStats", { count: 1, key: "total", lastOrder: 0 });
    }
  }

  if (statusChange.old) {
    const oldStats = await ctx.db
      .query("productStats")
      .withIndex("by_key", (q) => q.eq("key", statusChange.old!))
      .unique();
    if (oldStats && oldStats.count > 0) {
      await ctx.db.patch(oldStats._id, { count: oldStats.count - 1 });
    }
  }

  if (statusChange.new) {
    const newStats = await ctx.db
      .query("productStats")
      .withIndex("by_key", (q) => q.eq("key", statusChange.new!))
      .unique();
    if (newStats) {
      await ctx.db.patch(newStats._id, { count: newStats.count + 1 });
    } else {
      await ctx.db.insert("productStats", { count: 1, key: statusChange.new, lastOrder: 0 });
    }
  }
}

async function resolveProductType(ctx: MutationCtx, requested?: "physical" | "digital", fallback?: "physical" | "digital") {
  const productTypeSetting = await getModuleSetting(ctx, "productTypeMode");
  const productTypeMode = (productTypeSetting?.value as "physical" | "digital" | "both" | undefined) ?? "both";
  if (productTypeMode === "physical" || productTypeMode === "digital") {
    return productTypeMode;
  }
  return requested ?? fallback ?? "physical";
}

async function assertProductPrice(ctx: MutationCtx, price: number, salePrice: number | undefined, hasVariants: boolean) {
  const saleModeSetting = await getModuleSetting(ctx, "saleMode");
  const saleMode = saleModeSetting?.value === "contact" || saleModeSetting?.value === "affiliate"
    ? saleModeSetting.value
    : "cart";
  const variantSettings = await getVariantSettings(ctx);
  const hideBasePricing = variantSettings.variantEnabled && hasVariants && variantSettings.variantPricing === "variant";

  if (saleMode === "cart" && !hideBasePricing && (!Number.isFinite(price) || price <= 0)) {
    throw new Error("Giá bán phải lớn hơn 0");
  }
  if (salePrice !== undefined) {
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Giá bán phải lớn hơn 0");
    }
    if (salePrice <= price) {
      throw new Error("Giá so sánh phải lớn hơn giá bán");
    }
  }
}

async function assertUniqueProductSku(ctx: MutationCtx, sku: string, ignoreProductId?: Id<"products">) {
  if (!sku.trim()) {
    return;
  }
  const existing = await ctx.db
    .query("products")
    .withIndex("by_sku", (q) => q.eq("sku", sku))
    .unique();
  if (existing && existing._id !== ignoreProductId) {
    throw new ConvexError({ code: "DUPLICATE_SKU", message: "Mã SKU đã tồn tại, vui lòng chọn mã khác" });
  }
}

async function generateUniqueSmartSku(
  ctx: MutationCtx | QueryCtx,
  name: string,
  categoryId?: Id<"productCategories">,
  ignoreProductId?: Id<"products">
) {
  const category = categoryId ? await ctx.db.get(categoryId) : null;
  const source = category?.name?.trim() || name.trim();
  const words = source.split(/\s+/).filter(Boolean);
  const prefix = words.map((word) => normalizeSkuText(word).charAt(0)).join("").slice(0, 4) || "SP";

  // Sử dụng range query để quét các sản phẩm có cùng tiền tố SKU nhằm tối ưu hóa băng thông DB
  const startSku = `${prefix}-0000`;
  const endSku = `${prefix}-9999`;
  const existingProducts = await ctx.db
    .query("products")
    .withIndex("by_sku", (q) => q.gte("sku", startSku).lte("sku", endSku))
    .collect();

  const regex = new RegExp(`^${prefix}-(\\d+)$`);
  let maxNum = 0;
  for (const p of existingProducts) {
    if (p.sku) {
      const match = p.sku.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const baseCount = maxNum + 1;

  for (let attempt = 0; attempt < 500; attempt += 1) {
    const suffix = (baseCount + attempt).toString().padStart(4, "0");
    const candidate = `${prefix}-${suffix}`;
    const existing = await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", candidate))
      .unique();
    if (!existing || existing._id === ignoreProductId) {
      return candidate;
    }
  }

  return `${prefix}-${Date.now()}`;
}

function normalizeInlineOptions(options: InlineOptionInput[]) {
  const seen = new Set<string>();
  return options
    .map((option) => ({
      optionId: option.optionId,
      valueIds: Array.from(new Set(option.valueIds)).filter(Boolean),
    }))
    .filter((option) => {
      if (option.valueIds.length === 0 || seen.has(option.optionId)) {
        return false;
      }
      seen.add(option.optionId);
      return true;
    });
}

function normalizeInlineVariants(variants: InlineVariantInput[], baseSku: string) {
  return variants
    .map((variant, index) => ({
      id: variant.id,
      sku: variant.sku.trim() || `${baseSku}-${index + 1}`,
      price: Number.isFinite(variant.price) ? variant.price : 0,
      salePrice: resolveSalePrice(variant.salePrice),
      stock: Number.isFinite(variant.stock) ? Math.max(0, Math.trunc(variant.stock)) : 0,
      optionValues: variant.optionValues.filter((item) => Boolean(item.optionId && item.valueId)),
    }))
    .filter((variant) => variant.optionValues.length > 0);
}

function assertVariantMatrix(options: ReturnType<typeof normalizeInlineOptions>, variants: ReturnType<typeof normalizeInlineVariants>) {
  if (options.length === 0) {
    throw new Error("Vui lòng chọn ít nhất một thuộc tính có sẵn");
  }
  if (variants.length === 0) {
    throw new Error("Vui lòng tạo ít nhất một phiên bản sản phẩm");
  }
  const optionIds = options.map((option) => option.optionId);
  const optionIdSet = new Set(optionIds);
  for (const variant of variants) {
    if (variant.optionValues.length !== optionIds.length) {
      throw new Error("Dữ liệu phiên bản không khớp với thuộc tính đã chọn");
    }
    for (const item of variant.optionValues) {
      if (!optionIdSet.has(item.optionId)) {
        throw new Error("Phiên bản chứa thuộc tính không nằm trong danh sách đã chọn");
      }
    }
  }
}

async function validateOptionSelections(ctx: MutationCtx, options: ReturnType<typeof normalizeInlineOptions>) {
  const optionIds: Id<"productOptions">[] = [];

  for (const option of options) {
    const optionRecord = await ctx.db.get(option.optionId);
    if (!optionRecord) {
      throw new Error("Thuộc tính phiên bản không tồn tại");
    }
    optionIds.push(option.optionId);

    const valueDocs = await Promise.all(option.valueIds.map((valueId) => ctx.db.get(valueId)));
    valueDocs.forEach((valueDoc) => {
      if (!valueDoc) {
        throw new Error("Giá trị thuộc tính không tồn tại");
      }
      if (valueDoc.optionId !== option.optionId) {
        throw new Error("Giá trị thuộc tính không khớp với thuộc tính đã chọn");
      }
    });
  }

  return optionIds;
}

async function assertVariantOptionValues(ctx: MutationCtx, variant: ReturnType<typeof normalizeInlineVariants>[number], optionIds: Id<"productOptions">[]) {
  const optionIdSet = new Set(optionIds);
  const valueDocs = await Promise.all(variant.optionValues.map((item) => ctx.db.get(item.valueId)));

  variant.optionValues.forEach((item, index) => {
    const valueDoc = valueDocs[index];
    if (!optionIdSet.has(item.optionId)) {
      throw new Error("Phiên bản chứa thuộc tính không nằm trong danh sách đã chọn");
    }
    if (!valueDoc) {
      throw new Error("Giá trị thuộc tính không tồn tại");
    }
    if (valueDoc.optionId !== item.optionId) {
      throw new Error("Giá trị thuộc tính không khớp với thuộc tính đã chọn");
    }
  });
}

async function assertUniqueVariantSkus(
  ctx: MutationCtx,
  productSku: string,
  variants: ReturnType<typeof normalizeInlineVariants>,
  ignoreProductId?: Id<"products">
) {
  const seen = new Set<string>();
  for (const variant of variants) {
    const normalizedSku = variant.sku.toLowerCase();
    if (normalizedSku === productSku.toLowerCase()) {
      throw new Error(`SKU phiên bản không được trùng SKU sản phẩm: ${variant.sku}`);
    }
    if (seen.has(normalizedSku)) {
      throw new Error(`SKU phiên bản bị trùng: ${variant.sku}`);
    }
    seen.add(normalizedSku);

    const productWithSku = await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", variant.sku))
      .unique();
    if (productWithSku && productWithSku._id !== ignoreProductId) {
      throw new Error(`SKU phiên bản đã trùng với sản phẩm khác: ${variant.sku}`);
    }

    const existingVariant = await ctx.db
      .query("productVariants")
      .withIndex("by_sku", (q) => q.eq("sku", variant.sku))
      .unique();
    if (existingVariant && existingVariant._id !== variant.id) {
      throw new Error(`SKU phiên bản đã tồn tại: ${variant.sku}`);
    }
  }
}

async function upsertVariants(
  ctx: MutationCtx,
  productId: Id<"products">,
  optionIds: Id<"productOptions">[],
  variants: ReturnType<typeof normalizeInlineVariants>
) {
  const activeVariantIds = new Set<Id<"productVariants">>();

  for (const [index, variant] of variants.entries()) {
    await assertVariantOptionValues(ctx, variant, optionIds);
    const payload = {
      sku: variant.sku,
      price: variant.price,
      salePrice: variant.salePrice,
      stock: variant.stock,
      order: index,
      optionValues: variant.optionValues,
    };

    if (variant.id) {
      const existing = await ctx.db.get(variant.id);
      if (!existing || existing.productId !== productId) {
        throw new Error("Phiên bản không thuộc sản phẩm đang chỉnh sửa");
      }
      await ctx.db.patch(variant.id, payload);
      activeVariantIds.add(variant.id);
    } else {
      const variantId = await ctx.db.insert("productVariants", {
        productId,
        status: "Active",
        ...payload,
      });
      activeVariantIds.add(variantId);
    }
  }

  const existingVariants = await ctx.db
    .query("productVariants")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .collect();
  for (const existing of existingVariants) {
    if (!activeVariantIds.has(existing._id)) {
      await cascadeDeleteVariant(ctx, existing._id);
    }
  }
}
async function assertCategoryProductTypesHomogeneity(
  ctx: MutationCtx,
  categoryId: Id<"productCategories">,
  additionalCategoryIds?: Id<"productCategories">[]
) {
  const enableProductTypesSetting = await ctx.db
    .query("moduleSettings")
    .withIndex("by_module_setting", (q) => q.eq("moduleKey", "products").eq("settingKey", "enableProductTypes"))
    .unique();

  if (enableProductTypesSetting?.value === true) {
    const allCategoryIds = [categoryId, ...(additionalCategoryIds ?? [])].filter(Boolean);
    const mappings = await Promise.all(
      allCategoryIds.map((catId) =>
        ctx.db
          .query("productCategoryTypes")
          .withIndex("by_category", (q) => q.eq("categoryId", catId))
          .collect()
      )
    );
    const uniqueTypeIds = new Set<string>();
    for (const mapList of mappings) {
      for (const m of mapList) {
        uniqueTypeIds.add(m.typeId);
      }
    }
    if (uniqueTypeIds.size > 1) {
      throw new ConvexError("Tất cả các danh mục được gán cho sản phẩm phải thuộc cùng một kiểu sản phẩm.");
    }
  }
}

export const generateSmartSku = query({
  args: { name: v.string(), categoryId: v.optional(v.id("productCategories")) },
  handler: async (ctx, args) => {
    return await generateUniqueSmartSku(ctx, args.name, args.categoryId);
  },
});

export const checkSkuExists = query({
  args: { sku: v.string(), ignoreProductId: v.optional(v.id("products")) },
  handler: async (ctx, args) => {
    const sku = args.sku.trim();
    if (!sku) {
      return false;
    }
    const existing = await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", sku))
      .unique();
    return Boolean(existing && existing._id !== args.ignoreProductId);
  },
});

export const createProductWithVariants = mutation({
  args: smartProductArgs,
  handler: async (ctx, args) => {
    await assertCategoryProductTypesHomogeneity(ctx, args.categoryId, args.additionalCategoryIds);
    const hasGallery = (args.images && args.images.filter(Boolean).length > 0) || 
                       (args.imageStorageIds && args.imageStorageIds.filter(Boolean).length > 0);
    const hasMainImage = (args.image && args.image.trim() !== "") || args.imageStorageId;
    if (hasGallery && !hasMainImage) {
      throw new ConvexError("Vui lòng chọn ảnh chính trước khi thêm ảnh vào thư viện");
    }

    const resolvedSku = args.sku.trim() || await generateUniqueSmartSku(ctx, args.name, args.categoryId);
    await assertUniqueProductSku(ctx, resolvedSku);

    const normalizedOptions = normalizeInlineOptions(args.options);
    const normalizedVariants = normalizeInlineVariants(args.variants, resolvedSku);
    const hasVariants = Boolean(args.hasVariants) && normalizedVariants.length > 0;
    if (args.hasVariants) {
      assertVariantMatrix(normalizedOptions, normalizedVariants);
      await assertUniqueVariantSkus(ctx, resolvedSku, normalizedVariants);
    }

    const resolvedSlug = await resolveUniqueSlug(ctx, { scope: "record", slug: args.slug });
    const nextOrder = await getNextOrder(ctx);
    const status = args.status ?? "Draft";
    const productType = await resolveProductType(ctx, args.productType);
    const salePrice = resolveSalePrice(args.salePrice);
    await assertProductPrice(ctx, args.price, salePrice, hasVariants);
    const optionIds = hasVariants ? await validateOptionSelections(ctx, normalizedOptions) : [];

    const productId = await ctx.db.insert("products", {
      affiliateLink: args.affiliateLink,
      categoryId: args.categoryId,
      description: args.description,
      renderType: args.renderType ?? "content",
      markdownRender: args.markdownRender,
      htmlRender: args.htmlRender,
      image: args.image,
      images: args.images,
      imageStorageId: args.imageStorageId,
      imageStorageIds: args.imageStorageIds,
      productTypeId: args.productTypeId,
      productType,
      digitalDeliveryType: productType === "digital" ? args.digitalDeliveryType : undefined,
      digitalCredentialsTemplate: productType === "digital" ? args.digitalCredentialsTemplate : undefined,
      metaDescription: args.metaDescription,
      metaTitle: args.metaTitle,
      name: args.name,
      order: args.order ?? nextOrder,
      price: args.price,
      salePrice,
      sku: resolvedSku,
      slug: resolvedSlug.slug,
      status,
      stock: args.stock ?? 0,
      sales: 0,
      hasVariants,
      optionIds: hasVariants ? optionIds : undefined,
      combos: args.combos,
    });

    if (args.attributeTermIds && args.attributeTermIds.length > 0) {
      for (let i = 0; i < args.attributeTermIds.length; i++) {
        const termId = args.attributeTermIds[i];
        await ctx.db.insert("productAttributeTerms", { productId, termId, order: i });
      }
    }

    if (await isMultiCategoryEnabled(ctx, "products")) {
      await syncProductCategoryAssignments(ctx, productId, args.categoryId, args.additionalCategoryIds);
    }

    await syncOwnerFilesAndCleanup(ctx, {
      ownerField: "images",
      ownerId: productId,
      ownerTable: "products",
      purpose: "product-gallery",
    }, dedupeStorageIds([args.imageStorageId, ...(args.imageStorageIds ?? [])]));

    if (hasVariants) {
      await upsertVariants(ctx, productId, optionIds, normalizedVariants);
    }

    await updateStats(ctx, { new: status });
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "product" });
    return productId;
  },
  returns: v.id("products"),
});

export const updateProductWithVariants = mutation({
  args: { id: v.id("products"), ...smartProductArgs },
  handler: async (ctx, args) => {
    await assertCategoryProductTypesHomogeneity(ctx, args.categoryId, args.additionalCategoryIds);
    const product = await ctx.db.get(args.id);
    if (!product) {
      throw new Error("Product not found");
    }

    const hasGallery = (args.images && args.images.filter(Boolean).length > 0) || 
                       (args.imageStorageIds && args.imageStorageIds.filter(Boolean).length > 0);
    const hasMainImage = (args.image && args.image.trim() !== "") || 
                         args.imageStorageId || 
                         (product.image && product.image.trim() !== "") || 
                         product.imageStorageId;
    if (hasGallery && !hasMainImage) {
      throw new ConvexError("Vui lòng chọn ảnh chính trước khi thêm ảnh vào thư viện");
    }

    const resolvedSku = args.sku.trim() || await generateUniqueSmartSku(ctx, args.name, args.categoryId, args.id);
    if (resolvedSku !== product.sku) {
      await assertUniqueProductSku(ctx, resolvedSku, args.id);
    }

    const normalizedOptions = normalizeInlineOptions(args.options);
    const normalizedVariants = normalizeInlineVariants(args.variants, resolvedSku);
    const hasVariants = Boolean(args.hasVariants) && normalizedVariants.length > 0;
    if (args.hasVariants) {
      assertVariantMatrix(normalizedOptions, normalizedVariants);
      await assertUniqueVariantSkus(ctx, resolvedSku, normalizedVariants, args.id);
    }

    const resolvedSlug = args.slug && args.slug !== product.slug
      ? await resolveUniqueSlug(ctx, { scope: "record", slug: args.slug, exclude: { id: args.id, table: "products" } })
      : { slug: args.slug || product.slug };
    const productType = await resolveProductType(ctx, args.productType, product.productType);
    const salePrice = resolveSalePrice(args.salePrice);
    await assertProductPrice(ctx, args.price, salePrice, hasVariants);
    const optionIds = hasVariants ? await validateOptionSelections(ctx, normalizedOptions) : [];

    async function syncProductCombos(
      ctx: MutationCtx,
      currentProductId: Id<"products">,
      currentProductCombos: any[] | undefined,
      oldProductCombos: any[] | undefined
    ) {
      const oldSyncIds = (oldProductCombos || []).filter((c: any) => c.syncId && c.isSynced).map((c: any) => c.syncId);
      const newSyncIds = (currentProductCombos || []).filter((c: any) => c.syncId && c.isSynced).map((c: any) => c.syncId);
      const removedSyncIds = oldSyncIds.filter((id: string) => !newSyncIds.includes(id));

      // 1. Dọn dẹp các combo bị xóa hoặc hủy đồng bộ trên các sản phẩm đi kèm
      for (const removedSyncId of removedSyncIds) {
        const oldCombo = (oldProductCombos || []).find((c: any) => c.syncId === removedSyncId);
        if (oldCombo && oldCombo.mixConfig && oldCombo.mixConfig.items) {
          const relatedProductIds = oldCombo.mixConfig.items.map((item: any) => item.productId);
          for (const pId of relatedProductIds) {
            const pDoc = await ctx.db.get(pId) as any;
            if (pDoc && pDoc.combos) {
              const updatedCombos = pDoc.combos.filter((c: any) => c.syncId !== removedSyncId);
              await ctx.db.patch(pId, { combos: updatedCombos });
            }
          }
        }
      }

      // 2. Tạo mới hoặc cập nhật các combo mix có bật đồng bộ sang các sản phẩm đi kèm
      const activeSyncCombos = (currentProductCombos || []).filter((c: any) => c.type === "mix" && c.syncId && c.isSynced);
      for (const combo of activeSyncCombos) {
        if (!combo.mixConfig || !combo.mixConfig.items) continue;

        const participants = [
          { productId: currentProductId, quantity: combo.mixConfig.currentProductQty || 1 },
          ...combo.mixConfig.items,
        ];

        for (const part of combo.mixConfig.items) {
          const pId = part.productId;
          if (!pId) continue;

          const pDoc = await ctx.db.get(pId) as any;
          if (!pDoc) continue;

          const itemsForP = participants
            .filter((item: any) => item.productId !== pId)
            .map((item: any) => ({ productId: item.productId, quantity: item.quantity }));

          const currentQtyForP = participants.find((item: any) => item.productId === pId)?.quantity || 1;

          const comboForP = {
            name: combo.name,
            price: combo.price,
            type: "mix",
            syncId: combo.syncId,
            isSynced: true,
            mixConfig: {
              currentProductQty: currentQtyForP,
              items: itemsForP,
              rewardType: combo.mixConfig.rewardType,
              rewardValue: combo.mixConfig.rewardValue,
              giftProductId: combo.mixConfig.giftProductId,
              giftQty: combo.mixConfig.giftQty,
            },
          };

          const pCombos = pDoc.combos || [];
          const existingIndex = pCombos.findIndex((c: any) => c.syncId === combo.syncId);

          let updatedCombos = [...pCombos];
          if (existingIndex >= 0) {
            updatedCombos[existingIndex] = comboForP;
          } else {
            updatedCombos.push(comboForP);
          }

          await ctx.db.patch(pId, { combos: updatedCombos });
        }
      }
    }

    if (args.status && args.status !== product.status) {
      await updateStats(ctx, { old: product.status, new: args.status });
    }

    // Thực hiện đồng bộ combo mix chéo
    await syncProductCombos(ctx, args.id, args.combos, product.combos);

    await ctx.db.patch(args.id, {
      affiliateLink: args.affiliateLink,
      categoryId: args.categoryId,
      description: args.description,
      renderType: args.renderType ?? "content",
      markdownRender: args.markdownRender,
      htmlRender: args.htmlRender,
      image: args.image,
      images: args.images,
      imageStorageId: args.imageStorageId,
      imageStorageIds: args.imageStorageIds,
      productTypeId: args.productTypeId,
      productType,
      digitalDeliveryType: productType === "digital" ? args.digitalDeliveryType : undefined,
      digitalCredentialsTemplate: productType === "digital" ? args.digitalCredentialsTemplate : undefined,
      metaDescription: args.metaDescription,
      metaTitle: args.metaTitle,
      name: args.name,
      order: args.order ?? product.order,
      price: args.price,
      salePrice,
      sku: resolvedSku,
      slug: resolvedSlug.slug,
      status: args.status ?? product.status,
      stock: args.stock ?? product.stock,
      hasVariants,
      optionIds: hasVariants ? optionIds : [],
      combos: args.combos,
    });

    if (args.attributeTermIds) {
      const existingTerms = await ctx.db
        .query("productAttributeTerms")
        .withIndex("by_product", (q) => q.eq("productId", args.id))
        .collect();
      for (const term of existingTerms) {
        await ctx.db.delete(term._id);
      }
      for (let i = 0; i < args.attributeTermIds.length; i++) {
        const termId = args.attributeTermIds[i];
        await ctx.db.insert("productAttributeTerms", { productId: args.id, termId, order: i });
      }
    }

    if (await isMultiCategoryEnabled(ctx, "products")) {
      await syncProductCategoryAssignments(ctx, args.id, args.categoryId, args.additionalCategoryIds);
    }

    await syncOwnerFilesAndCleanup(ctx, {
      ownerField: "images",
      ownerId: args.id,
      ownerTable: "products",
      purpose: "product-gallery",
    }, dedupeStorageIds([args.imageStorageId, ...(args.imageStorageIds ?? [])]), {
      previousStorageIds: [product.imageStorageId, ...(product.imageStorageIds ?? [])],
    });

    if (hasVariants) {
      await upsertVariants(ctx, args.id, optionIds, normalizedVariants);
    }

    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "product" });
    return args.id;
  },
  returns: v.id("products"),
});

async function cascadeDeleteVariant(ctx: MutationCtx, variantId: Id<"productVariants">) {
  const variant = await ctx.db.get(variantId);
  if (!variant) {
    return;
  }

  const cartItems = await ctx.db
    .query("cartItems")
    .withIndex("by_product", (q) => q.eq("productId", variant.productId))
    .filter((q) => q.eq(q.field("variantId"), variantId))
    .collect();

  const affectedCartIds = new Set<Id<"carts">>();
  for (const item of cartItems) {
    affectedCartIds.add(item.cartId);
    await ctx.db.delete(item._id);
  }

  for (const cartId of affectedCartIds) {
    const remainingItems = await ctx.db
      .query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", cartId))
      .collect();
    const totalAmount = remainingItems.reduce((total, item) => total + item.subtotal, 0);
    await ctx.db.patch(cartId, { totalAmount, itemsCount: remainingItems.length });
  }

  const wishlists = await ctx.db
    .query("wishlist")
    .withIndex("by_product", (q) => q.eq("productId", variant.productId))
    .filter((q) => q.eq(q.field("variantId"), variantId))
    .collect();
  for (const wishlist of wishlists) {
    await ctx.db.delete(wishlist._id);
  }

  await ctx.db.delete(variantId);
}

export const removeVariantWithCascade = mutation({
  args: { variantId: v.id("productVariants") },
  handler: async (ctx, args) => {
    await cascadeDeleteVariant(ctx, args.variantId);
    return true;
  },
});

export const checkVariantInOrders = query({
  args: { variantId: v.id("productVariants") },
  handler: async (ctx, args) => {
    const ordersWithVariant = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "Pending"))
      .collect();

    for (const order of ordersWithVariant) {
      if (order.items.some((item) => item.variantId === args.variantId)) {
        return true;
      }
    }
    return false;
  },
});
