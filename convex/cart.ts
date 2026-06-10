import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getCommerceCapabilities as resolveCommerceCapabilities, isProviderCartCapable } from "./lib/commerce";

// ============ CONSTANTS ============
const CART_DEFAULTS = {
  CLEANUP_BATCH_SIZE: 100,
  EXPIRY_DAYS: 7,
  ITEMS_PER_PAGE: 20,
  MAX_ITEMS_PER_CART: 50,
  MAX_ITEMS_PER_PAGE: 100,
} as const;
const COURSE_CART_QUANTITY = 1;

const cartStatus = v.union(
  v.literal("Active"),
  v.literal("Converted"),
  v.literal("Abandoned")
);

const cartDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("carts"),
  customerId: v.optional(v.id("customers")),
  expiresAt: v.optional(v.number()),
  itemsCount: v.number(),
  note: v.optional(v.string()),
  sessionId: v.optional(v.string()),
  status: cartStatus,
  totalAmount: v.number(),
});

const cartItemDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("cartItems"),
  cartId: v.id("carts"),
  itemType: v.optional(v.union(v.literal("product"), v.literal("service"), v.literal("course"), v.literal("resource"))),
  price: v.number(),
  productId: v.optional(v.id("products")),
  serviceId: v.optional(v.id("services")),
  courseId: v.optional(v.id("courses")),
  resourceId: v.optional(v.id("resources")),
  productImage: v.optional(v.string()),
  productName: v.string(),
  quantity: v.number(),
  subtotal: v.number(),
  variantId: v.optional(v.id("productVariants")),
});

const cartAddItemArgs = {
  cartId: v.id("carts"),
  itemType: v.optional(v.union(v.literal("product"), v.literal("service"), v.literal("course"), v.literal("resource"))),
  productId: v.optional(v.id("products")),
  serviceId: v.optional(v.id("services")),
  courseId: v.optional(v.id("courses")),
  resourceId: v.optional(v.id("resources")),
  quantity: v.number(),
  variantId: v.optional(v.id("productVariants")),
};

type CartLineItemInput = {
  itemType?: "product" | "service" | "course" | "resource";
  productId?: Id<"products">;
  serviceId?: Id<"services">;
  courseId?: Id<"courses">;
  resourceId?: Id<"resources">;
  variantId?: Id<"productVariants">;
};

type ResolvedCartItem = {
  itemType: "product" | "service" | "course" | "resource";
  price: number;
  productId?: Id<"products">;
  serviceId?: Id<"services">;
  courseId?: Id<"courses">;
  resourceId?: Id<"resources">;
  productImage?: string;
  productName: string;
  variantId?: Id<"productVariants">;
  productStock?: number;
  variantStock?: number;
};

const getCartItemType = (item: CartLineItemInput) => item.itemType ?? "product";

const isSameCartLine = (a: CartLineItemInput, b: CartLineItemInput) => {
  const itemType = getCartItemType(a);
  if (itemType !== getCartItemType(b)) {
    return false;
  }
  if (itemType === "product") {
    return a.productId === b.productId && a.variantId === b.variantId;
  }
  if (itemType === "service") {
    return a.serviceId === b.serviceId;
  }
  if (itemType === "resource") {
    return a.resourceId === b.resourceId;
  }
  return a.courseId === b.courseId;
};

async function getVariantPricingSetting(ctx: MutationCtx): Promise<"product" | "variant"> {
  const setting = await ctx.db
    .query("moduleSettings")
    .withIndex("by_module_setting", (q) => q.eq("moduleKey", "products").eq("settingKey", "variantPricing"))
    .unique();
  return (setting?.value as "product" | "variant") ?? "variant";
}

async function getVariantStockSetting(ctx: MutationCtx): Promise<"product" | "variant"> {
  const setting = await ctx.db
    .query("moduleSettings")
    .withIndex("by_module_setting", (q) => q.eq("moduleKey", "products").eq("settingKey", "variantStock"))
    .unique();
  return (setting?.value as "product" | "variant") ?? "variant";
}

async function isStockCheckEnabled(ctx: MutationCtx): Promise<boolean> {
  const feature = await ctx.db
    .query("moduleFeatures")
    .withIndex("by_module_feature", (q) => q.eq("moduleKey", "products").eq("featureKey", "enableStock"))
    .unique();
  return feature?.enabled ?? false;
}

async function resolveCartItem(ctx: MutationCtx, args: CartLineItemInput): Promise<
  | { ok: true; item: ResolvedCartItem }
  | { ok: false; error: string }
> {
  const itemType = getCartItemType(args);

  if (itemType === "product") {
    if (!args.productId) {
      return { ok: false, error: "Thiếu sản phẩm cần thêm vào giỏ hàng" };
    }
    if (!await isProviderCartCapable(ctx, "products")) {
      return { ok: false, error: "Sản phẩm chưa được bật chế độ giỏ hàng và thanh toán" };
    }

    const product = await ctx.db.get(args.productId);
    if (!product || product.status !== "Active") {
      return { ok: false, error: "Sản phẩm không tồn tại hoặc chưa được bán" };
    }

    let variant = null;
    if (product.hasVariants) {
      if (!args.variantId) {
        return { ok: false, error: "Vui lòng chọn phiên bản sản phẩm" };
      }
      variant = await ctx.db.get(args.variantId);
      if (!variant || variant.productId !== args.productId) {
        return { ok: false, error: "Phiên bản không hợp lệ" };
      }
    } else if (args.variantId) {
      return { ok: false, error: "Sản phẩm không hỗ trợ phiên bản" };
    }

    const variantPricing = product.hasVariants ? await getVariantPricingSetting(ctx) : "product";
    const basePrice = variantPricing === "variant" && variant
      ? (variant.salePrice ?? variant.price ?? product.salePrice ?? product.price)
      : (product.salePrice ?? product.price);
    const price = basePrice ?? product.price;

    return {
      ok: true,
      item: {
        itemType: "product",
        price,
        productId: args.productId,
        productImage: product.image,
        productName: product.name,
        variantId: args.variantId,
        productStock: product.stock,
        variantStock: variant?.stock,
      },
    };
  }

  if (itemType === "service") {
    if (!args.serviceId) {
      return { ok: false, error: "Thiếu dịch vụ cần thêm vào giỏ hàng" };
    }
    if (!await isProviderCartCapable(ctx, "services")) {
      return { ok: false, error: "Dịch vụ chưa được bật chế độ giỏ hàng và thanh toán" };
    }

    const service = await ctx.db.get(args.serviceId);
    if (!service || service.status !== "Published") {
      return { ok: false, error: "Dịch vụ không tồn tại hoặc chưa được xuất bản" };
    }
    if (service.price === undefined || service.price < 0) {
      return { ok: false, error: "Dịch vụ cần có giá hợp lệ để thanh toán" };
    }

    return {
      ok: true,
      item: {
        itemType: "service",
        price: service.price,
        serviceId: args.serviceId,
        productImage: service.thumbnail,
        productName: service.title,
      },
    };
  }

  if (itemType === "resource") {
    if (!args.resourceId) {
      return { ok: false, error: "Thiếu tài nguyên cần thêm vào giỏ hàng" };
    }
    if (!await isProviderCartCapable(ctx, "resources")) {
      return { ok: false, error: "Tài nguyên chưa được bật chế độ giỏ hàng và thanh toán" };
    }

    const resource = await ctx.db.get(args.resourceId);
    if (!resource || resource.status !== "Published") {
      return { ok: false, error: "Tài nguyên không tồn tại hoặc chưa được xuất bản" };
    }
    if (resource.pricingType === "contact") {
      return { ok: false, error: "Tài nguyên đang ở chế độ liên hệ, chưa thể thanh toán qua giỏ hàng" };
    }
    const price = resource.pricingType === "free" ? 0 : resource.priceAmount;
    if (price === undefined || price < 0) {
      return { ok: false, error: "Tài nguyên cần có giá hợp lệ để thanh toán" };
    }

    return {
      ok: true,
      item: {
        itemType: "resource",
        price,
        resourceId: args.resourceId,
        productImage: resource.thumbnail,
        productName: resource.title,
      },
    };
  }

  if (!args.courseId) {
    return { ok: false, error: "Thiếu khóa học cần thêm vào giỏ hàng" };
  }
  if (!await isProviderCartCapable(ctx, "courses")) {
    return { ok: false, error: "Khóa học chưa được bật chế độ giỏ hàng và thanh toán" };
  }

  const course = await ctx.db.get(args.courseId);
  if (!course || course.status !== "Published") {
    return { ok: false, error: "Khóa học không tồn tại hoặc chưa được xuất bản" };
  }
  if (course.pricingType === "contact") {
    return { ok: false, error: "Khóa học đang ở chế độ liên hệ, chưa thể thanh toán qua giỏ hàng" };
  }
  const price = course.pricingType === "free" ? 0 : course.priceAmount;
  if (price === undefined || price < 0) {
    return { ok: false, error: "Khóa học cần có giá hợp lệ để thanh toán" };
  }

  return {
    ok: true,
    item: {
      itemType: "course",
      price,
      courseId: args.courseId,
      productImage: course.thumbnail,
      productName: course.title,
    },
  };
}

// ============ CART QUERIES ============

export const getCommerceCapabilities = query({
  args: {},
  handler: async (ctx) => resolveCommerceCapabilities(ctx),
  returns: v.object({
    providers: v.array(v.object({
      provider: v.union(v.literal("products"), v.literal("services"), v.literal("courses"), v.literal("resources")),
      moduleEnabled: v.boolean(),
      commerceMode: v.union(v.literal("off"), v.literal("cart"), v.literal("contact"), v.literal("affiliate")),
      cartCapable: v.boolean(),
      contactCapable: v.boolean(),
      affiliateCapable: v.boolean(),
    })),
    cartEnabled: v.boolean(),
    ordersEnabled: v.boolean(),
    hasCartProvider: v.boolean(),
    cartAvailable: v.boolean(),
  }),
});

// FIX Issue #1: Added limit parameter with default
export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? CART_DEFAULTS.ITEMS_PER_PAGE, CART_DEFAULTS.MAX_ITEMS_PER_PAGE);
    return  ctx.db
      .query("carts")
      .order("desc")
      .take(limit);
  },
});

// FIX Issue #1: Added paginated query for server-side pagination (Issue #7)
export const listPaginated = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    status: v.optional(cartStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? CART_DEFAULTS.ITEMS_PER_PAGE, CART_DEFAULTS.MAX_ITEMS_PER_PAGE);
    
    const results = args.status
      ? await ctx.db.query("carts")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .paginate({ cursor: args.cursor ?? null, numItems: limit })
      : await ctx.db.query("carts")
          .order("desc")
          .paginate({ cursor: args.cursor ?? null, numItems: limit });
    
    return {
      isDone: results.isDone,
      items: results.page,
      nextCursor: results.continueCursor,
    };
  },
});

export const listActive = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? CART_DEFAULTS.ITEMS_PER_PAGE, CART_DEFAULTS.MAX_ITEMS_PER_PAGE);
    return  ctx.db
      .query("carts")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .order("desc")
      .take(limit);
  },
});

export const listAbandoned = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? CART_DEFAULTS.ITEMS_PER_PAGE, CART_DEFAULTS.MAX_ITEMS_PER_PAGE);
    return  ctx.db
      .query("carts")
      .withIndex("by_status", (q) => q.eq("status", "Abandoned"))
      .order("desc")
      .take(limit);
  },
});

export const getById = query({
  args: { id: v.id("carts") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(cartDoc, v.null()),
});

export const getByCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => ctx.db
      .query("carts")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .filter((q) => q.eq(q.field("status"), "Active"))
      .first(),
  returns: v.union(cartDoc, v.null()),
});

export const getBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("carts")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("status"), "Active"))
      .first(),
  returns: v.union(cartDoc, v.null()),
});

// FIX Issue #3 & #10: Added limit to prevent fetching ALL
export const countByStatus = query({
  args: { status: cartStatus },
  handler: async (ctx, args) => {
    const carts = await ctx.db
      .query("carts")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .take(10_000);
    return carts.length;
  },
  returns: v.number(),
});

// FIX Issue #10: Added limit to prevent fetching ALL
export const getTotalValue = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 1000;
    const carts = await ctx.db
      .query("carts")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .take(limit);
    return carts.reduce((sum, cart) => sum + cart.totalAmount, 0);
  },
  returns: v.number(),
});

// FIX Issue #3: Added limit to prevent fetching ALL
export const count = query({
  args: { status: v.optional(cartStatus) },
  handler: async (ctx, args) => {
    if (args.status) {
      const carts = await ctx.db
        .query("carts")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(10_000);
      return carts.length;
    }
    const carts = await ctx.db.query("carts").take(10_000);
    return carts.length;
  },
  returns: v.number(),
});

// Get statistics efficiently - all counts in one query
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const [active, abandoned, converted] = await Promise.all([
      ctx.db.query("carts").withIndex("by_status", (q) => q.eq("status", "Active")).take(10_000),
      ctx.db.query("carts").withIndex("by_status", (q) => q.eq("status", "Abandoned")).take(10_000),
      ctx.db.query("carts").withIndex("by_status", (q) => q.eq("status", "Converted")).take(10_000),
    ]);
    
    const totalValue = active.reduce((sum, cart) => sum + cart.totalAmount, 0);
    
    return {
      abandoned: abandoned.length,
      active: active.length,
      converted: converted.length,
      total: active.length + abandoned.length + converted.length,
      totalValue,
    };
  },
});

// ============ CART ITEM QUERIES ============

export const listCartItems = query({
  args: { cartId: v.id("carts") },
  handler: async (ctx, args) => ctx.db
      .query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", args.cartId))
      .collect(),
  returns: v.array(cartItemDoc),
});

// FIX Issue #2: Added limit to prevent fetching ALL items
export const listAllItems = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? CART_DEFAULTS.ITEMS_PER_PAGE, CART_DEFAULTS.MAX_ITEMS_PER_PAGE);
    return  ctx.db.query("cartItems").order("desc").take(limit);
  },
});

// Count all items efficiently
export const countAllItems = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("cartItems").take(10_000);
    return items.length;
  },
  returns: v.number(),
});

// ============ CART MUTATIONS ============

export const create = mutation({
  args: {
    customerId: v.optional(v.id("customers")),
    expiresAt: v.optional(v.number()),
    note: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let {expiresAt} = args;
    if (!expiresAt) {
      const expirySetting = await ctx.db
        .query("moduleSettings")
        .withIndex("by_module", (q) => q.eq("moduleKey", "cart"))
        .filter((q) => q.eq(q.field("settingKey"), "expiryDays"))
        .first();
      const expiryDays = (expirySetting?.value as number) ?? CART_DEFAULTS.EXPIRY_DAYS;
      expiresAt = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
    }

    return  ctx.db.insert("carts", {
      customerId: args.customerId,
      expiresAt,
      itemsCount: 0,
      note: args.note,
      sessionId: args.sessionId,
      status: "Active",
      totalAmount: 0,
    });
  },
  returns: v.id("carts"),
});

export const updateStatus = mutation({
  args: { id: v.id("carts"), status: cartStatus },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.id);
    if (!cart) {throw new Error("Cart not found");}
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
  returns: v.null(),
});

export const updateNote = mutation({
  args: { id: v.id("carts"), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.id);
    if (!cart) {throw new Error("Cart not found");}
    await ctx.db.patch(args.id, { note: args.note });
    return null;
  },
  returns: v.null(),
});

export const markAsAbandoned = mutation({
  args: { id: v.id("carts") },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.id);
    if (!cart) {throw new Error("Cart not found");}
    await ctx.db.patch(args.id, { status: "Abandoned" });
    return null;
  },
  returns: v.null(),
});

export const markAsConverted = mutation({
  args: { id: v.id("carts") },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.id);
    if (!cart) {throw new Error("Cart not found");}
    await ctx.db.patch(args.id, { status: "Converted" });
    return null;
  },
  returns: v.null(),
});

export const mergeCart = mutation({
  args: {
    customerId: v.id("customers"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionCart = await ctx.db
      .query("carts")
      .withIndex("by_session_status", (q) =>
        q.eq("sessionId", args.sessionId).eq("status", "Active")
      )
      .first();

    if (!sessionCart) {
      return { ok: true, message: "Không tìm thấy giỏ hàng vãng lai hoạt động" };
    }

    const customerCart = await ctx.db
      .query("carts")
      .withIndex("by_customer_status", (q) =>
        q.eq("customerId", args.customerId).eq("status", "Active")
      )
      .first();

    if (!customerCart) {
      await ctx.db.patch(sessionCart._id, {
        customerId: args.customerId,
        sessionId: undefined,
      });
      return { ok: true, cartId: sessionCart._id, merged: false };
    }

    const sessionItems = await ctx.db
      .query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", sessionCart._id))
      .collect();

    if (sessionItems.length > 0) {
      const [variantStock, stockCheckEnabled] = await Promise.all([
        getVariantStockSetting(ctx),
        isStockCheckEnabled(ctx),
      ]);
      const customerItems = await ctx.db
        .query("cartItems")
        .withIndex("by_cart", (q) => q.eq("cartId", customerCart._id))
        .collect();

      for (const item of sessionItems) {
        const existingItem = customerItems.find((customerItem) => isSameCartLine(customerItem, item));

        if (existingItem) {
          const itemType = item.itemType ?? "product";
          const newQty = itemType === "course" || itemType === "resource"
            ? COURSE_CART_QUANTITY
            : existingItem.quantity + item.quantity;

          if (itemType === "product" && item.productId && stockCheckEnabled) {
            const product = await ctx.db.get(item.productId);
            let stockValue = product?.stock;
            if (variantStock === "variant" && item.variantId) {
              const variant = await ctx.db.get(item.variantId);
              if (variant?.stock !== undefined) {
                stockValue = variant.stock;
              }
            }
            if (product && stockValue !== undefined && newQty > stockValue) {
              const adjustedQty = Math.max(existingItem.quantity, stockValue);
              await ctx.db.patch(existingItem._id, {
                quantity: adjustedQty,
                subtotal: existingItem.price * adjustedQty,
              });
              await ctx.db.delete(item._id);
              continue;
            }
          }

          await ctx.db.patch(existingItem._id, {
            quantity: newQty,
            subtotal: existingItem.price * newQty,
          });
          existingItem.quantity = newQty;
          existingItem.subtotal = existingItem.price * newQty;
          await ctx.db.delete(item._id);
        } else {
          const quantity = (item.itemType ?? "product") === "course" || item.itemType === "resource" ? COURSE_CART_QUANTITY : item.quantity;
          const subtotal = item.price * quantity;
          await ctx.db.patch(item._id, {
            cartId: customerCart._id,
            quantity,
            subtotal,
          });
          customerItems.push({ ...item, cartId: customerCart._id, quantity, subtotal });
        }
      }
    }

    await ctx.db.patch(sessionCart._id, { status: "Converted" });
    await ctx.db.delete(sessionCart._id);
    await recalculateCart(ctx, customerCart._id);

    return { ok: true, cartId: customerCart._id, merged: true };
  },
  returns: v.object({
    ok: v.boolean(),
    cartId: v.optional(v.id("carts")),
    merged: v.optional(v.boolean()),
    message: v.optional(v.string()),
  }),
});

// FIX Issue #4: Use Promise.all instead of sequential loop
export const remove = mutation({
  args: { id: v.id("carts") },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.id);
    if (!cart) {throw new Error("Cart not found");}

    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", args.id))
      .collect();
    
    // FIX: Parallel delete instead of sequential
    await Promise.all(items.map( async item => ctx.db.delete(item._id)));
    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

// ============ CART ITEM MUTATIONS ============

// FIX Issue #11: Added quantity validation
export const addItem = mutation({
  args: cartAddItemArgs,
  handler: async (ctx, args) => {
    // FIX Issue #11: Validate quantity > 0
    if (args.quantity <= 0) {
      return { ok: false, error: "Quantity must be greater than 0" };
    }

    const cart = await ctx.db.get(args.cartId);
    if (!cart) {
      return { ok: false, error: "Cart not found" };
    }

    const resolved = await resolveCartItem(ctx, args);
    if (!resolved.ok) {
      return resolved;
    }
    const item = resolved.item;

    const [variantStock, stockCheckEnabled] = await Promise.all([
      getVariantStockSetting(ctx),
      isStockCheckEnabled(ctx),
    ]);

    const maxItemsSetting = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module", (q) => q.eq("moduleKey", "cart"))
      .filter((q) => q.eq(q.field("settingKey"), "maxItemsPerCart"))
      .first();
    const maxItems = (maxItemsSetting?.value as number) ?? CART_DEFAULTS.MAX_ITEMS_PER_CART;

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", args.cartId))
      .collect();
    const existingItem = cartItems.find((cartItem) => isSameCartLine(cartItem, item));

    const requestedQuantity = item.itemType === "course" || item.itemType === "resource" ? COURSE_CART_QUANTITY : args.quantity;
    const targetQuantity = item.itemType === "course" || item.itemType === "resource"
      ? COURSE_CART_QUANTITY
      : (existingItem?.quantity ?? 0) + requestedQuantity;
    if (item.itemType === "product" && stockCheckEnabled) {
      const stockValue = variantStock === "variant" && item.variantStock !== undefined
        ? item.variantStock
        : item.productStock;
      if (stockValue !== undefined && targetQuantity > stockValue) {
        return { ok: false, error: `Không đủ hàng trong kho cho ${item.productName}. Còn lại: ${stockValue}` };
      }
    }

    if (existingItem) {
      const newSubtotal = existingItem.price * targetQuantity;
      await ctx.db.patch(existingItem._id, {
        quantity: targetQuantity,
        subtotal: newSubtotal,
      });
      await recalculateCart(ctx, args.cartId);
      return { ok: true, itemId: existingItem._id };
    }

    if (cartItems.length >= maxItems) {
      return { ok: false, error: `Giỏ hàng đã đạt giới hạn ${maxItems} sản phẩm` };
    }

    const itemId = await ctx.db.insert("cartItems", {
      cartId: args.cartId,
      itemType: item.itemType,
      price: item.price,
      productId: item.productId,
      serviceId: item.serviceId,
      courseId: item.courseId,
      resourceId: item.resourceId,
      productImage: item.productImage,
      productName: item.productName,
      quantity: requestedQuantity,
      subtotal: item.price * requestedQuantity,
      variantId: item.variantId,
    });

    await recalculateCart(ctx, args.cartId);
    return { ok: true, itemId };
  },
  returns: v.object({
    ok: v.boolean(),
    itemId: v.optional(v.id("cartItems")),
    error: v.optional(v.string()),
  }),
});

export const updateItemQuantity = mutation({
  args: {
    itemId: v.id("cartItems"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      return { ok: false, error: "Cart item not found" };
    }

    if (args.quantity > 0 && (item.itemType ?? "product") === "product") {
      if (!item.productId) {
        return { ok: false, error: "Cart item product is invalid" };
      }
      const [product, variantStock, stockCheckEnabled] = await Promise.all([
        ctx.db.get(item.productId),
        getVariantStockSetting(ctx),
        isStockCheckEnabled(ctx),
      ]);

      if (!product) {
        return { ok: false, error: "Product not found" };
      }

      if (stockCheckEnabled) {
        let stockValue = product.stock;
        if (variantStock === "variant" && item.variantId) {
          const variant = await ctx.db.get(item.variantId);
          if (variant?.stock !== undefined) {
            stockValue = variant.stock;
          }
        }

        if (stockValue !== undefined && args.quantity > stockValue) {
          return { ok: false, error: `Không đủ hàng trong kho cho ${product.name}. Còn lại: ${stockValue}` };
        }
      }
    }

    const itemType = item.itemType ?? "product";
    const nextQuantity = (itemType === "course" || itemType === "resource") && args.quantity > 0
      ? COURSE_CART_QUANTITY
      : args.quantity;

    if (args.quantity <= 0) {
      await ctx.db.delete(args.itemId);
    } else {
      await ctx.db.patch(args.itemId, {
        quantity: nextQuantity,
        subtotal: item.price * nextQuantity,
      });
    }

    await recalculateCart(ctx, item.cartId);
    return { ok: true };
  },
  returns: v.object({
    ok: v.boolean(),
    error: v.optional(v.string()),
  }),
});

export const removeItem = mutation({
  args: { itemId: v.id("cartItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) {throw new Error("Cart item not found");}

    await ctx.db.delete(args.itemId);
    await recalculateCart(ctx, item.cartId);
    return null;
  },
  returns: v.null(),
});

// FIX Issue #5: Use Promise.all instead of sequential loop
export const clearCart = mutation({
  args: { cartId: v.id("carts") },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.cartId);
    if (!cart) {throw new Error("Cart not found");}

    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_cart", (q) => q.eq("cartId", args.cartId))
      .collect();
    
    // FIX: Parallel delete instead of sequential
    await Promise.all(items.map( async item => ctx.db.delete(item._id)));
    await ctx.db.patch(args.cartId, { itemsCount: 0, totalAmount: 0 });
    return null;
  },
  returns: v.null(),
});

async function recalculateCart(ctx: MutationCtx, cartId: Id<"carts">) {
  const items = await ctx.db
    .query("cartItems")
    .withIndex("by_cart", (q) => q.eq("cartId", cartId))
    .collect();

  const normalizedItems = await Promise.all(items.map(async (item) => {
    const quantity = (item.itemType ?? "product") === "course" || item.itemType === "resource" ? COURSE_CART_QUANTITY : item.quantity;
    const subtotal = item.price * quantity;
    if (item.quantity !== quantity || item.subtotal !== subtotal) {
      await ctx.db.patch(item._id, { quantity, subtotal });
    }
    return { quantity, subtotal };
  }));

  const itemsCount = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);

  await ctx.db.patch(cartId, { itemsCount, totalAmount });
}

// ============ CLEANUP MUTATIONS ============

// FIX Issue #6: Use Promise.all with batch size limit
export const cleanupExpiredCarts = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredCarts = await ctx.db
      .query("carts")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .filter((q) => 
        q.and(
          q.neq(q.field("expiresAt"), undefined),
          q.lt(q.field("expiresAt"), now)
        )
      )
      .take(CART_DEFAULTS.CLEANUP_BATCH_SIZE);

    // FIX: Parallel patch instead of sequential
    await Promise.all(
      expiredCarts.map( async cart => ctx.db.patch(cart._id, { status: "Abandoned" }))
    );

    return expiredCarts.length;
  },
  returns: v.number(),
});
