import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// Helper: Validate foreign keys và maxItems (DRY)
async function validateWishlistAdd(
  ctx: MutationCtx,
  customerId: Id<"customers">,
  productId: Id<"products">,
  variantId?: Id<"productVariants">
) {
  const customer = await ctx.db.get(customerId);
  if (!customer) {throw new Error("Customer not found");}

  const product = await ctx.db.get(productId);
  if (!product) {throw new Error("Product not found");}

  if (variantId) {
    const variant = await ctx.db.get(variantId);
    if (!variant || variant.productId !== productId) {
      throw new Error("Phiên bản không hợp lệ");
    }
  }

  const existing = await ctx.db
    .query("wishlist")
    .withIndex("by_customer_product", (q) =>
      q.eq("customerId", customerId).eq("productId", productId)
    )
    .unique();
  if (existing) {throw new Error("Product already in wishlist");}

  const maxSetting = await ctx.db
    .query("moduleSettings")
    .withIndex("by_module_setting", (q) =>
      q.eq("moduleKey", "wishlist").eq("settingKey", "maxItemsPerCustomer")
    )
    .unique();
  const maxItems = (maxSetting?.value as number) || 50;

  const currentItems = await ctx.db
    .query("wishlist")
    .withIndex("by_customer", (q) => q.eq("customerId", customerId))
    .collect();

  if (currentItems.length >= maxItems) {
    throw new Error(`Đã đạt giới hạn ${maxItems} sản phẩm yêu thích`);
  }
}

const wishlistDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("wishlist"),
  customerId: v.id("customers"),
  note: v.optional(v.string()),
  productId: v.id("products"),
  variantId: v.optional(v.id("productVariants")),
});

const productPreviewDoc = v.object({
  _id: v.id("products"),
  categoryId: v.id("productCategories"),
  image: v.optional(v.string()),
  name: v.string(),
  price: v.number(),
  salePrice: v.optional(v.number()),
  hasVariants: v.optional(v.boolean()),
  slug: v.string(),
  stock: v.number(),
});

const SEARCH_LOOKUP_LIMIT = 2000;

async function getSearchIdSets(ctx: QueryCtx, search: string) {
  const searchLower = search.toLowerCase().trim();
  const [customers, products] = await Promise.all([
    ctx.db.query("customers").take(SEARCH_LOOKUP_LIMIT),
    ctx.db.query("products").take(SEARCH_LOOKUP_LIMIT),
  ]);

  const customerIds = new Set(
    customers
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.phone.toLowerCase().includes(searchLower)
      )
      .map((customer) => customer._id)
  );

  const productIds = new Set(
    products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower)
      )
      .map((product) => product._id)
  );

  return { customerIds, productIds };
}

// Queries
// WL-001 FIX: Thêm limit parameter để tránh fetch all
export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 100, 500);
    return  ctx.db.query("wishlist").take(limit);
  },
});

export const listAdminWithOffset = query({
  args: {
    customerId: v.optional(v.id("customers")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 50, 1000);

    const searchTerm = args.search?.trim();
    const searchIds = searchTerm ? await getSearchIdSets(ctx, searchTerm) : null;
    if (searchIds && searchIds.customerIds.size === 0 && searchIds.productIds.size === 0) {
      return [];
    }

    const queryBuilder = args.customerId
      ? ctx.db.query("wishlist").withIndex("by_customer", (q) => q.eq("customerId", args.customerId!))
      : ctx.db.query("wishlist");

    let items = await queryBuilder.order("desc").take(fetchLimit);

    if (searchIds) {
      items = items.filter(
        (item) => searchIds.customerIds.has(item.customerId) || searchIds.productIds.has(item.productId)
      );
    }

    return items.slice(offset, offset + limit);
  },
  returns: v.array(wishlistDoc),
});

export const countAdmin = query({
  args: {
    customerId: v.optional(v.id("customers")),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    const fetchLimit = limit + 1;

    const searchTerm = args.search?.trim();
    const searchIds = searchTerm ? await getSearchIdSets(ctx, searchTerm) : null;
    if (searchIds && searchIds.customerIds.size === 0 && searchIds.productIds.size === 0) {
      return { count: 0, hasMore: false };
    }

    const queryBuilder = args.customerId
      ? ctx.db.query("wishlist").withIndex("by_customer", (q) => q.eq("customerId", args.customerId!))
      : ctx.db.query("wishlist");

    let items = await queryBuilder.take(fetchLimit);

    if (searchIds) {
      items = items.filter(
        (item) => searchIds.customerIds.has(item.customerId) || searchIds.productIds.has(item.productId)
      );
    }

    return { count: Math.min(items.length, limit), hasMore: items.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    customerId: v.optional(v.id("customers")),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    const fetchLimit = limit + 1;

    const searchTerm = args.search?.trim();
    const searchIds = searchTerm ? await getSearchIdSets(ctx, searchTerm) : null;
    if (searchIds && searchIds.customerIds.size === 0 && searchIds.productIds.size === 0) {
      return { ids: [], hasMore: false };
    }

    const queryBuilder = args.customerId
      ? ctx.db.query("wishlist").withIndex("by_customer", (q) => q.eq("customerId", args.customerId!))
      : ctx.db.query("wishlist");

    let items = await queryBuilder.take(fetchLimit);

    if (searchIds) {
      items = items.filter(
        (item) => searchIds.customerIds.has(item.customerId) || searchIds.productIds.has(item.productId)
      );
    }

    const hasMore = items.length > limit;
    return { ids: items.slice(0, limit).map((item) => item._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("wishlist")), hasMore: v.boolean() }),
});

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) =>  ctx.db.query("wishlist").paginate(args.paginationOpts),
});

// WL-001 FIX: Thêm limit để tránh fetch all chỉ để count
export const count = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10_000;
    const items = await ctx.db.query("wishlist").take(limit);
    return items.length;
  },
  returns: v.number(),
});

export const getById = query({
  args: { id: v.id("wishlist") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(wishlistDoc, v.null()),
});

// WL-005 FIX: Thêm limit parameter
export const listByCustomer = query({
  args: { 
    customerId: v.id("customers"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    return  ctx.db
      .query("wishlist")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .take(limit);
  },
});

// WL-005 FIX: Thêm limit parameter
export const listByProduct = query({
  args: { 
    limit: v.optional(v.number()),
    productId: v.id("products")
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    return  ctx.db
      .query("wishlist")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .take(limit);
  },
});

// WL-003 FIX: Thêm limit để giới hạn fetch
export const countByCustomer = query({
  args: { 
    customerId: v.id("customers"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 1000;
    const items = await ctx.db
      .query("wishlist")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .take(limit);
    return items.length;
  },
  returns: v.number(),
});

// WL-003 FIX: Thêm limit để giới hạn fetch
export const countByProduct = query({
  args: { 
    limit: v.optional(v.number()),
    productId: v.id("products")
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 1000;
    const items = await ctx.db
      .query("wishlist")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .take(limit);
    return items.length;
  },
  returns: v.number(),
});

export const isInWishlist = query({
  args: { customerId: v.id("customers"), productId: v.id("products"), variantId: v.optional(v.id("productVariants")) },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("wishlist")
      .withIndex("by_customer_product", (q) => 
        q.eq("customerId", args.customerId).eq("productId", args.productId)
      )
      .unique();
    if (!item) {return false;}
    if (args.variantId) {
      return item.variantId === args.variantId;
    }
    return true;
  },
  returns: v.boolean(),
});

export const listCustomerProductIds = query({
  args: { customerId: v.id("customers"), productIds: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    if (args.productIds.length === 0) {return [];}
    const items = await ctx.db
      .query("wishlist")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();
    const productSet = new Set(args.productIds.map((id) => id));
    return items.filter(item => productSet.has(item.productId)).map(item => item.productId);
  },
  returns: v.array(v.id("products")),
});

export const listByCustomerWithProducts = query({
  args: { customerId: v.id("customers"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const items = await ctx.db
      .query("wishlist")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .take(limit);

    const products = await Promise.all(items.map(item => ctx.db.get(item.productId)));

    return items.map((item, index) => ({
      ...item,
      variantId: item.variantId,
      product: products[index]
        ? {
            _id: products[index]!._id,
            categoryId: products[index]!.categoryId,
            image: products[index]!.image,
            name: products[index]!.name,
            price: products[index]!.price,
            salePrice: products[index]!.salePrice,
            hasVariants: products[index]!.hasVariants,
            slug: products[index]!.slug,
            stock: products[index]!.stock,
          }
        : null,
    }));
  },
  returns: v.array(v.object({
    _creationTime: v.number(),
    _id: v.id("wishlist"),
    customerId: v.id("customers"),
    note: v.optional(v.string()),
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    product: v.union(productPreviewDoc, v.null()),
  })),
});

// Mutations
export const add = mutation({
  args: {
    customerId: v.id("customers"),
    note: v.optional(v.string()),
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
  },
  handler: async (ctx, args) => {
    await validateWishlistAdd(ctx, args.customerId, args.productId, args.variantId);

    return  ctx.db.insert("wishlist", {
      customerId: args.customerId,
      note: args.note,
      productId: args.productId,
      variantId: args.variantId,
    });
  },
  returns: v.id("wishlist"),
});

export const update = mutation({
  args: {
    id: v.id("wishlist"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const item = await ctx.db.get(id);
    if (!item) {throw new Error("Wishlist item not found");}
    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { id: v.id("wishlist") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) {throw new Error("Wishlist item not found");}
    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

export const removeByCustomerProduct = mutation({
  args: { customerId: v.id("customers"), productId: v.id("products") },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("wishlist")
      .withIndex("by_customer_product", (q) => 
        q.eq("customerId", args.customerId).eq("productId", args.productId)
      )
      .unique();
    
    if (item) {
      await ctx.db.delete(item._id);
    }
    return null;
  },
  returns: v.null(),
});

// WL-002 FIX: Sử dụng Promise.all thay vì sequential deletes
export const clearByCustomer = mutation({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("wishlist")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();
    
    await Promise.all(items.map( async (item) => ctx.db.delete(item._id)));
    return null;
  },
  returns: v.null(),
});

export const toggle = mutation({
  args: { customerId: v.id("customers"), productId: v.id("products") },
  handler: async (ctx, args) => {
    // Validate customer/product exists
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {throw new Error("Customer not found");}

    const product = await ctx.db.get(args.productId);
    if (!product) {throw new Error("Product not found");}

    const existing = await ctx.db
      .query("wishlist")
      .withIndex("by_customer_product", (q) =>
        q.eq("customerId", args.customerId).eq("productId", args.productId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { added: false };
    }

    // Check maxItemsPerCustomer when adding
    const maxSetting = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", "wishlist").eq("settingKey", "maxItemsPerCustomer")
      )
      .unique();
    const maxItems = (maxSetting?.value as number) || 50;

    const currentItems = await ctx.db
      .query("wishlist")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();

    if (currentItems.length >= maxItems) {
      throw new Error(`Đã đạt giới hạn ${maxItems} sản phẩm yêu thích`);
    }

    const id = await ctx.db.insert("wishlist", {
      customerId: args.customerId,
      productId: args.productId,
    });
    return { added: true, id };
  },
  returns: v.object({ added: v.boolean(), id: v.optional(v.id("wishlist")) }),
});
