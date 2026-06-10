import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import * as OrdersModel from "./model/orders";
import type { Doc, Id } from "./_generated/dataModel";
import {
  normalizeOrderStatusPreset,
  parseOrderStatuses,
  type OrderStatusConfig,
} from "../lib/orders/statuses";
import { EMAIL_CONFIG_SETTING_KEYS, getEmailConfigurationStatus } from "../lib/email-config-status";
import { internal } from "./_generated/api";
import {
  getOrderPlacedCustomerTemplate,
  getOrderPlacedShopTemplate,
  getOrderCancelledTemplate,
} from "./emailTemplates";
import { isProviderCartCapable, type CommerceProviderKey } from "./lib/commerce";
import { syncCourseStudentsForOrder } from "./lib/courseEnrollment";
import { syncResourceCustomersForOrder } from "./lib/resourceAccess";

const orderStatus = v.string();

const paymentMethod = v.union(
  v.literal("COD"),
  v.literal("BankTransfer"),
  v.literal("VietQR"),
  v.literal("CreditCard"),
  v.literal("EWallet")
);

const paymentStatus = v.union(
  v.literal("Pending"),
  v.literal("Paid"),
  v.literal("Failed"),
  v.literal("Refunded")
);

const orderStatusConfig = v.object({
  key: v.string(),
  label: v.string(),
  color: v.string(),
  step: v.number(),
  isFinal: v.boolean(),
  allowCancel: v.boolean(),
});

async function getOrderStatusSettings(ctx: MutationCtx | QueryCtx) {
  const [presetSetting, statusesSetting] = await Promise.all([
    ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) => q.eq("moduleKey", "orders").eq("settingKey", "orderStatusPreset"))
      .unique(),
    ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) => q.eq("moduleKey", "orders").eq("settingKey", "orderStatuses"))
      .unique(),
  ]);

  const preset = normalizeOrderStatusPreset(presetSetting?.value);
  const statuses = parseOrderStatuses(statusesSetting?.value, preset);

  return { preset, statuses };
}

async function resolveOrderNotificationEmails(ctx: MutationCtx): Promise<string> {
  const advancedSetting = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", "order_notification_emails"))
    .unique();
  const advancedEmails = (advancedSetting?.value as string) ?? "";
  if (advancedEmails.trim()) {
    return advancedEmails;
  }

  const contactSetting = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", "contact_email"))
    .unique();
  return (contactSetting?.value as string) ?? "";
}

async function getSettingsByKeys(ctx: MutationCtx, keys: string[]) {
  const uniqueKeys = [...new Set(keys)];
  const settings = await Promise.all(uniqueKeys.map((key) =>
    ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique()
  ));

  const result: Record<string, unknown> = {};
  for (const setting of settings) {
    if (setting) {
      result[setting.key] = setting.value;
    }
  }
  return result;
}

async function handleOrderStatusTransition(
  ctx: MutationCtx,
  orderId: Id<"orders">,
  oldStatus: string,
  newStatus: string,
  options?: { notifyShopOnCancel?: boolean }
) {
  if (oldStatus === newStatus) return;

  const orderDoc = await ctx.db.get(orderId);
  if (!orderDoc) return;

  const customerDoc = await ctx.db.get(orderDoc.customerId);
  if (!customerDoc) return;

  const { statuses } = await getOrderStatusSettings(ctx);

  const isCancelledStatus = (statusKey: string) => {
    const config = statuses.find((s) => s.key === statusKey);
    const lowerKey = statusKey.toLowerCase();
    const lowerLabel = config ? config.label.toLowerCase() : "";
    return (
      lowerKey.includes("cancel") ||
      lowerKey.includes("refund") ||
      lowerKey.includes("hủy") ||
      lowerLabel.includes("cancel") ||
      lowerLabel.includes("refund") ||
      lowerLabel.includes("hủy")
    );
  };

  // Chuyển sang Cancelled
  if (isCancelledStatus(newStatus) && !isCancelledStatus(oldStatus)) {
    const settings = await getSettingsByKeys(ctx, [
      "site_name",
      "site_url",
      ...EMAIL_CONFIG_SETTING_KEYS,
    ]);
    const brandName = settings.site_name ? String(settings.site_name as string).trim() : "YourBrand";
    const siteUrl = settings.site_url ? String(settings.site_url as string).trim() : "http://localhost:3000";
    const emailStatus = getEmailConfigurationStatus(settings);

    if (!emailStatus.configured) {
      await ctx.db.insert("notifications", {
        title: "Cần gửi thông báo thủ công",
        content: `Đơn #${orderDoc.orderNumber} đã cập nhật trạng thái. Email thông báo chưa được gửi tự động. Vui lòng liên hệ khách qua kênh phù hợp nếu cần.`,
        type: "warning",
        status: "Sent",
        targetType: "users",
        order: Date.now(),
        readCount: 0,
        sentAt: Date.now(),
      });
      return;
    }

    if (customerDoc.email) {
      const cancelledHtml = getOrderCancelledTemplate(orderDoc, siteUrl, brandName);
      await ctx.scheduler.runAfter(0, internal.email.sendTransactionalEmail, {
        to: customerDoc.email,
        subject: `[${brandName}] Đơn hàng #${orderDoc.orderNumber} đã bị hủy`,
        html: cancelledHtml,
        eventType: "order_cancelled",
        orderId: orderDoc._id,
      });
    }

    if (options?.notifyShopOnCancel) {
      const shopEmails = await resolveOrderNotificationEmails(ctx);
      if (shopEmails) {
        const cancelledHtml = getOrderCancelledTemplate(orderDoc, siteUrl, brandName, "Khách hàng hoặc quản trị viên yêu cầu hủy.");
        await ctx.scheduler.runAfter(0, internal.email.sendTransactionalEmail, {
          to: shopEmails,
          subject: `[${brandName}] Đơn hàng #${orderDoc.orderNumber} đã bị hủy`,
          html: cancelledHtml,
          eventType: "order_cancelled_shop",
          orderId: orderDoc._id,
        });
      }
    }
  }
}

const orderItemValidator = v.object({
  itemType: v.optional(v.union(v.literal("product"), v.literal("service"), v.literal("course"), v.literal("resource"))),
  price: v.number(),
  productId: v.optional(v.id("products")),
  serviceId: v.optional(v.id("services")),
  courseId: v.optional(v.id("courses")),
  resourceId: v.optional(v.id("resources")),
  productImage: v.optional(v.string()),
  productName: v.string(),
  quantity: v.number(),
  variantId: v.optional(v.id("productVariants")),
  variantTitle: v.optional(v.string()),
  isDigital: v.optional(v.boolean()),
  digitalDeliveryType: v.optional(v.string()),
  digitalCredentials: v.optional(v.object({
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    licenseKey: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    customContent: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
  })),
});

type VariantPricingSetting = "product" | "variant";
type VariantStockSetting = "product" | "variant";

type OrderItemInput = {
  itemType?: "product" | "service" | "course" | "resource";
  price: number;
  productId?: Id<"products">;
  serviceId?: Id<"services">;
  courseId?: Id<"courses">;
  resourceId?: Id<"resources">;
  productImage?: string;
  productName: string;
  quantity: number;
  variantId?: Id<"productVariants">;
  variantTitle?: string;
  isDigital?: boolean;
  digitalDeliveryType?: string;
  digitalCredentials?: {
    username?: string;
    password?: string;
    licenseKey?: string;
    downloadUrl?: string;
    customContent?: string;
    expiresAt?: number;
    deliveredAt?: number;
  };
};

const getOrderItemType = (item: Pick<OrderItemInput, "itemType">) => item.itemType ?? "product";

const isShippableOrderItem = (item: OrderItemInput) =>
  getOrderItemType(item) === "product" && !item.isDigital;

const isCodRestrictedOrderItem = (item: OrderItemInput) =>
  getOrderItemType(item) !== "product" || Boolean(item.isDigital);

const validateOrderFulfillmentPolicy = (params: {
  items: OrderItemInput[];
  paymentMethod?: string;
  shippingFee?: number;
  shippingMethodId?: string;
  shippingMethodLabel?: string;
}) => {
  const hasShippableItems = params.items.some(isShippableOrderItem);
  const hasCodRestrictedItems = params.items.some(isCodRestrictedOrderItem);

  if (params.paymentMethod === "COD" && hasCodRestrictedItems) {
    return "COD chỉ áp dụng cho đơn chỉ gồm sản phẩm vật lý cần giao hàng. Đơn có khóa học, dịch vụ hoặc sản phẩm số cần dùng phương thức thanh toán khác.";
  }
  if (!hasShippableItems && (params.shippingFee ?? 0) > 0) {
    return "Đơn không có sản phẩm cần giao hàng nên không được tính phí vận chuyển.";
  }
  if (!hasShippableItems && (params.shippingMethodId || params.shippingMethodLabel)) {
    return "Đơn không có sản phẩm cần giao hàng nên không cần phương thức vận chuyển.";
  }
  return null;
};

const isSameOrderLine = (
  a: Pick<OrderItemInput, "itemType" | "productId" | "serviceId" | "courseId" | "resourceId" | "variantId">,
  b: Pick<OrderItemInput, "itemType" | "productId" | "serviceId" | "courseId" | "resourceId" | "variantId">
) => {
  const itemType = getOrderItemType(a);
  if (itemType !== getOrderItemType(b)) {
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

async function getVariantSettings(ctx: MutationCtx): Promise<{
  variantPricing: VariantPricingSetting;
  variantStock: VariantStockSetting;
}> {
  const [variantPricing, variantStock] = await Promise.all([
    ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) => q.eq("moduleKey", "products").eq("settingKey", "variantPricing"))
      .unique(),
    ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) => q.eq("moduleKey", "products").eq("settingKey", "variantStock"))
      .unique(),
  ]);

  return {
    variantPricing: (variantPricing?.value as VariantPricingSetting) ?? "variant",
    variantStock: (variantStock?.value as VariantStockSetting) ?? "variant",
  };
}

async function isStockCheckEnabled(ctx: MutationCtx): Promise<boolean> {
  const feature = await ctx.db
    .query("moduleFeatures")
    .withIndex("by_module_feature", (q) => q.eq("moduleKey", "products").eq("featureKey", "enableStock"))
    .unique();
  return feature?.enabled ?? false;
}

async function buildVariantTitle(ctx: MutationCtx, variant: Doc<"productVariants">): Promise<string | undefined> {
  if (!variant.optionValues.length) {
    return undefined;
  }
  const valueDocs = await Promise.all(variant.optionValues.map((item) => ctx.db.get(item.valueId)));
  const titleParts = variant.optionValues
    .map((item, index) => item.customValue?.trim() || valueDocs[index]?.label || valueDocs[index]?.value)
    .filter((value): value is string => Boolean(value));

  return titleParts.length > 0 ? titleParts.join(" / ") : undefined;
}

async function normalizeOrderItems(
  ctx: MutationCtx,
  items: OrderItemInput[],
  variantPricing: VariantPricingSetting
): Promise<OrderItemInput[]> {
  if (items.length === 0) {
    return items;
  }

  const normalizedItems: OrderItemInput[] = await Promise.all(items.map(async (item) => {
    const itemType = getOrderItemType(item);

    if (itemType === "product") {
      if (!item.productId) {
        throw new Error("Product not found");
      }

      const [product, variant] = await Promise.all([
        ctx.db.get(item.productId),
        item.variantId ? ctx.db.get(item.variantId) : Promise.resolve(null),
      ]);
      if (!product) {
        throw new Error("Product not found");
      }
      if (item.variantId && (!variant || variant.productId !== item.productId)) {
        throw new Error("Phiên bản không hợp lệ");
      }

      const price = variantPricing === "variant" && variant
        ? (variant.salePrice ?? variant.price ?? item.price)
        : item.price;
      const variantTitle = variant ? await buildVariantTitle(ctx, variant) : undefined;

      return {
        ...item,
        itemType: "product",
        price,
        productImage: item.productImage ?? product.image ?? undefined,
        variantTitle,
        isDigital: product.productType === "digital",
        digitalDeliveryType: product.digitalDeliveryType ?? undefined,
        digitalCredentials: product.productType === "digital"
          ? (product.digitalCredentialsTemplate ?? undefined)
          : undefined,
      };
    }

    if (itemType === "service") {
      if (!item.serviceId) {
        throw new Error("Service not found");
      }
      const service = await ctx.db.get(item.serviceId);
      if (!service || service.status !== "Published") {
        throw new Error("Service not found");
      }
      if (service.price === undefined || service.price < 0) {
        throw new Error(`Giá dịch vụ ${service.title} không hợp lệ`);
      }
      return {
        ...item,
        itemType: "service",
        price: service.price,
        productImage: item.productImage ?? service.thumbnail ?? undefined,
        productName: service.title,
        variantId: undefined,
        variantTitle: undefined,
        isDigital: false,
        digitalDeliveryType: undefined,
        digitalCredentials: undefined,
      };
    }

    if (itemType === "resource") {
      if (!item.resourceId) {
        throw new Error("Resource not found");
      }
      const resource = await ctx.db.get(item.resourceId);
      if (!resource || resource.status !== "Published") {
        throw new Error("Resource not found");
      }
      if (resource.pricingType === "contact") {
        throw new Error("Tài nguyên đang ở chế độ liên hệ, chưa thể thanh toán");
      }
      const price = resource.pricingType === "free" ? 0 : resource.priceAmount;
      if (price === undefined || price < 0) {
        throw new Error(`Giá tài nguyên ${resource.title} không hợp lệ`);
      }
      return {
        ...item,
        itemType: "resource",
        price,
        productImage: item.productImage ?? resource.thumbnail ?? undefined,
        productName: resource.title,
        quantity: 1,
        variantId: undefined,
        variantTitle: undefined,
        isDigital: false,
        digitalDeliveryType: undefined,
        digitalCredentials: undefined,
      };
    }

    if (!item.courseId) {
      throw new Error("Course not found");
    }
    const course = await ctx.db.get(item.courseId);
    if (!course || course.status !== "Published") {
      throw new Error("Course not found");
    }
    if (course.pricingType === "contact") {
      throw new Error("Khóa học đang ở chế độ liên hệ, chưa thể thanh toán");
    }
    const price = course.pricingType === "free" ? 0 : course.priceAmount;
    if (price === undefined || price < 0) {
      throw new Error(`Giá khóa học ${course.title} không hợp lệ`);
    }
    return {
      ...item,
      itemType: "course",
      price,
      productImage: item.productImage ?? course.thumbnail ?? undefined,
      productName: course.title,
      quantity: 1,
      variantId: undefined,
      variantTitle: undefined,
      isDigital: false,
      digitalDeliveryType: undefined,
      digitalCredentials: undefined,
    };
  }));

  const seenCourseIds = new Set<string>();
  const seenResourceIds = new Set<string>();
  return normalizedItems.filter((item) => {
    const itemType = getOrderItemType(item);
    if (itemType === "resource" && item.resourceId) {
      if (seenResourceIds.has(item.resourceId)) {
        return false;
      }
      seenResourceIds.add(item.resourceId);
      return true;
    }
    if (itemType !== "course" || !item.courseId) {
      return true;
    }
    if (seenCourseIds.has(item.courseId)) {
      return false;
    }
    seenCourseIds.add(item.courseId);
    return true;
  });
}

async function decrementVariantStock(ctx: MutationCtx, items: OrderItemInput[]) {
  const variantItems = items.filter((item) => getOrderItemType(item) === "product" && item.variantId);
  if (variantItems.length === 0) {
    return;
  }

  const variants = await Promise.all(variantItems.map((item) => ctx.db.get(item.variantId!)));
  await Promise.all(variantItems.map((item, index) => {
    const variant = variants[index];
    if (!variant || variant.stock === undefined) {
      return Promise.resolve(null);
    }
    const nextStock = Math.max(0, variant.stock - item.quantity);
    return ctx.db.patch(variant._id, { stock: nextStock });
  }));
}

async function decrementProductStock(ctx: MutationCtx, items: OrderItemInput[]) {
  const productItems = items.filter((item) => getOrderItemType(item) === "product" && item.productId);
  if (productItems.length === 0) {
    return;
  }

  const quantities = new Map<string, number>();
  productItems.forEach((item) => {
    const key = item.productId!;
    quantities.set(key, (quantities.get(key) ?? 0) + item.quantity);
  });

  const productIds = Array.from(quantities.keys()) as Id<"products">[];
  const products = await Promise.all(productIds.map((id) => ctx.db.get(id)));

  await Promise.all(products.map((product, index) => {
    if (!product || product.stock === undefined) {
      return Promise.resolve(null);
    }
    const quantity = quantities.get(productIds[index]) ?? 0;
    const nextStock = Math.max(0, product.stock - quantity);
    return ctx.db.patch(product._id, { stock: nextStock });
  }));
}

async function validateStockBeforeCreate(
  ctx: MutationCtx,
  items: OrderItemInput[],
  variantStock: VariantStockSetting
): Promise<string | null> {
  const productItems = items.filter((item) => getOrderItemType(item) === "product" && item.productId);
  if (productItems.length === 0) {
    return null;
  }

  if (variantStock === "product") {
    const quantities = new Map<string, number>();
    productItems.forEach((item) => {
      const key = item.productId!;
      quantities.set(key, (quantities.get(key) ?? 0) + item.quantity);
    });
    const productIds = Array.from(quantities.keys()) as Id<"products">[];
    const products = await Promise.all(productIds.map((id) => ctx.db.get(id)));

    for (const [index, product] of products.entries()) {
      if (!product || product.stock === undefined) {
        continue;
      }
      const quantity = quantities.get(productIds[index]) ?? 0;
      if (quantity > product.stock) {
        return `Không đủ hàng trong kho cho ${product.name}. Còn lại: ${product.stock}`;
      }
    }

    return null;
  }

  const [products, variants] = await Promise.all([
    Promise.all(productItems.map((item) => ctx.db.get(item.productId!))),
    Promise.all(productItems.map((item) => (item.variantId ? ctx.db.get(item.variantId) : Promise.resolve(null)))),
  ]);

  for (const [index, item] of productItems.entries()) {
    const product = products[index];
    if (!product) {
      throw new Error("Product not found");
    }
    const variant = variants[index];
    if (item.variantId && variant?.stock !== undefined) {
      if (item.quantity > variant.stock) {
        const label = item.variantTitle ? ` (${item.variantTitle})` : "";
        return `Không đủ hàng trong kho cho ${item.productName}${label}. Còn lại: ${variant.stock}`;
      }
      continue;
    }
    if (product.stock !== undefined && item.quantity > product.stock) {
      return `Không đủ hàng trong kho cho ${item.productName}. Còn lại: ${product.stock}`;
    }
  }

  return null;
}

async function validateCheckoutCommerce(ctx: MutationCtx, items: OrderItemInput[]) {
  const requiredProviders = new Set<CommerceProviderKey>();
  for (const item of items) {
    const itemType = getOrderItemType(item);
    if (itemType === "product") {
      requiredProviders.add("products");
    } else if (itemType === "service") {
      requiredProviders.add("services");
    } else if (itemType === "course") {
      requiredProviders.add("courses");
    } else if (itemType === "resource") {
      requiredProviders.add("resources");
    }
  }

  for (const provider of requiredProviders) {
    if (!await isProviderCartCapable(ctx, provider)) {
      const label = provider === "products" ? "Sản phẩm" : provider === "services" ? "Dịch vụ" : provider === "resources" ? "Tài nguyên" : "Khóa học";
      throw new Error(`${label} chưa được bật chế độ giỏ hàng và thanh toán`);
    }
  }
}

const orderDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("orders"),
  customerId: v.id("customers"),
  items: v.array(orderItemValidator),
  note: v.optional(v.string()),
  promotionId: v.optional(v.id("promotions")),
  promotionCode: v.optional(v.string()),
  discountAmount: v.optional(v.number()),
  orderNumber: v.string(),
  paymentMethod: v.optional(paymentMethod),
  paymentStatus: v.optional(paymentStatus),
  shippingAddress: v.optional(v.string()),
  shippingMethodId: v.optional(v.string()),
  shippingMethodLabel: v.optional(v.string()),
  shippingFee: v.number(),
  status: orderStatus,
  subtotal: v.number(),
  totalAmount: v.number(),
  trackingNumber: v.optional(v.string()),
  isDigitalOrder: v.optional(v.boolean()),
});

// ============================================================
// QUERIES
// ============================================================

export const getOrderStatuses = query({
  args: {},
  handler: async (ctx) => {
    const { preset, statuses } = await getOrderStatusSettings(ctx);
    return { preset, statuses: statuses as OrderStatusConfig[] };
  },
  returns: v.object({
    preset: v.string(),
    statuses: v.array(orderStatusConfig),
  }),
});

// Paginated list (for production use)
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db.query("orders").order("desc").paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(orderDoc),
  }),
});

// Limited list for admin (max 100 items - use pagination for more)
export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) =>  OrdersModel.listWithLimit(ctx, { limit: args.limit }),
});

export const listAdminWithOffset = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    paymentStatus: v.optional(paymentStatus),
    search: v.optional(v.string()),
    status: v.optional(orderStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 50, 1000);

    let paymentStatusFiltered = false;
    let orders: Doc<"orders">[] = [];
    if (args.status && args.paymentStatus) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status_paymentStatus", (q) =>
          q.eq("status", args.status!).eq("paymentStatus", args.paymentStatus!)
        )
        .order("desc")
        .take(fetchLimit);
      paymentStatusFiltered = true;
    } else if (args.status) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else if (args.paymentStatus) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_paymentStatus", (q) => q.eq("paymentStatus", args.paymentStatus!))
        .order("desc")
        .take(fetchLimit);
      paymentStatusFiltered = true;
    } else {
      orders = await ctx.db.query("orders").order("desc").take(fetchLimit);
    }

    if (args.paymentStatus && !paymentStatusFiltered) {
      orders = orders.filter((order) => order.paymentStatus === args.paymentStatus);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      orders = orders.filter((order) => order.orderNumber.toLowerCase().includes(searchLower));
    }

    return orders.slice(offset, offset + limit);
  },
  returns: v.array(orderDoc),
});

export const countAdmin = query({
  args: {
    paymentStatus: v.optional(paymentStatus),
    search: v.optional(v.string()),
    status: v.optional(orderStatus),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    const fetchLimit = limit + 1;

    let paymentStatusFiltered = false;
    let orders: Doc<"orders">[] = [];
    if (args.status && args.paymentStatus) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status_paymentStatus", (q) =>
          q.eq("status", args.status!).eq("paymentStatus", args.paymentStatus!)
        )
        .take(fetchLimit);
      paymentStatusFiltered = true;
    } else if (args.status) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(fetchLimit);
    } else if (args.paymentStatus) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_paymentStatus", (q) => q.eq("paymentStatus", args.paymentStatus!))
        .take(fetchLimit);
      paymentStatusFiltered = true;
    } else {
      orders = await ctx.db.query("orders").take(fetchLimit);
    }

    if (args.paymentStatus && !paymentStatusFiltered) {
      orders = orders.filter((order) => order.paymentStatus === args.paymentStatus);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      orders = orders.filter((order) => order.orderNumber.toLowerCase().includes(searchLower));
    }

    return { count: Math.min(orders.length, limit), hasMore: orders.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    limit: v.optional(v.number()),
    paymentStatus: v.optional(paymentStatus),
    search: v.optional(v.string()),
    status: v.optional(orderStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    const fetchLimit = limit + 1;

    let paymentStatusFiltered = false;
    let orders: Doc<"orders">[] = [];
    if (args.status && args.paymentStatus) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status_paymentStatus", (q) =>
          q.eq("status", args.status!).eq("paymentStatus", args.paymentStatus!)
        )
        .take(fetchLimit);
      paymentStatusFiltered = true;
    } else if (args.status) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(fetchLimit);
    } else if (args.paymentStatus) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_paymentStatus", (q) => q.eq("paymentStatus", args.paymentStatus!))
        .take(fetchLimit);
      paymentStatusFiltered = true;
    } else {
      orders = await ctx.db.query("orders").take(fetchLimit);
    }

    if (args.paymentStatus && !paymentStatusFiltered) {
      orders = orders.filter((order) => order.paymentStatus === args.paymentStatus);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      orders = orders.filter((order) => order.orderNumber.toLowerCase().includes(searchLower));
    }

    const hasMore = orders.length > limit;
    return { ids: orders.slice(0, limit).map((order) => order._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("orders")), hasMore: v.boolean() }),
});

// Efficient count using take() instead of collect()
export const count = query({
  args: { status: v.optional(orderStatus) },
  handler: async (ctx, args) => OrdersModel.countWithLimit(ctx, { status: args.status }),
  returns: v.object({
    count: v.number(),
    hasMore: v.boolean(),
  }),
});

// Legacy count for backward compatibility (returns number)
export const countSimple = query({
  args: { status: v.optional(orderStatus) },
  handler: async (ctx, args) => {
    const result = await OrdersModel.countWithLimit(ctx, { status: args.status });
    return result.count;
  },
  returns: v.number(),
});

export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => OrdersModel.getById(ctx, { id: args.id }),
  returns: v.union(orderDoc, v.null()),
});

export const getByOrderNumber = query({
  args: { orderNumber: v.string() },
  handler: async (ctx, args) => OrdersModel.getByOrderNumber(ctx, { orderNumber: args.orderNumber }),
  returns: v.union(orderDoc, v.null()),
});

// Paginated list by customer
export const listByCustomer = query({
  args: { customerId: v.id("customers"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
      .query("orders")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(orderDoc),
  }),
});

// Limited list by customer (max 100 items)
export const listAllByCustomer = query({
  args: { customerId: v.id("customers"), limit: v.optional(v.number()) },
  handler: async (ctx, args) =>  OrdersModel.listByCustomer(ctx, {
      customerId: args.customerId,
      limit: args.limit,
    }),
});

// Paginated list by status
export const listByStatus = query({
  args: { paginationOpts: paginationOptsValidator, status: orderStatus },
  handler: async (ctx, args) => ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(orderDoc),
  }),
});

// Limited list by status (max 100 items)
export const listAllByStatus = query({
  args: { limit: v.optional(v.number()), status: orderStatus },
  handler: async (ctx, args) =>  OrdersModel.listByStatus(ctx, {
      limit: args.limit,
      status: args.status,
    }),
});

// Count by customer (efficient)
export const countByCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => OrdersModel.countByCustomer(ctx, { customerId: args.customerId }),
  returns: v.object({
    count: v.number(),
    hasMore: v.boolean(),
  }),
});

// Get order statistics (for dashboard/system page)
export const getStats = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { statuses } = await getOrderStatusSettings(ctx);
    return OrdersModel.getStats(ctx, { limit: args.limit, statuses });
  },
  returns: v.object({
    cancelled: v.number(),
    delivered: v.number(),
    pending: v.number(),
    processing: v.number(),
    total: v.number(),
    totalRevenue: v.number(),
  }),
});

// ============================================================
// MUTATIONS
// ============================================================

export const create = mutation({
  args: {
    customerId: v.id("customers"),
    items: v.array(orderItemValidator),
    note: v.optional(v.string()),
    paymentMethod: v.optional(paymentMethod),
    shippingMethodId: v.optional(v.string()),
    shippingMethodLabel: v.optional(v.string()),
    shippingAddress: v.optional(v.string()),
    shippingFee: v.optional(v.number()),
    promotionId: v.optional(v.id("promotions")),
    promotionCode: v.optional(v.string()),
    discountAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { variantPricing, variantStock } = await getVariantSettings(ctx);
    const normalizedItems = await normalizeOrderItems(ctx, args.items, variantPricing);
    const fulfillmentError = validateOrderFulfillmentPolicy({
      items: normalizedItems,
      paymentMethod: args.paymentMethod,
      shippingFee: args.shippingFee,
      shippingMethodId: args.shippingMethodId,
      shippingMethodLabel: args.shippingMethodLabel,
    });
    if (fulfillmentError) {
      return { ok: false, error: fulfillmentError };
    }
    const stockCheckEnabled = await isStockCheckEnabled(ctx);
    if (stockCheckEnabled) {
      const stockError = await validateStockBeforeCreate(ctx, normalizedItems, variantStock);
      if (stockError) {
        return { ok: false, error: stockError };
      }
    }
    const isDigitalOrder = normalizedItems.some((item) => item.isDigital);
    const { statuses } = await getOrderStatusSettings(ctx);
    const defaultStatus = statuses[0]?.key ?? "Pending";
    const orderId = await OrdersModel.create(ctx, {
      ...args,
      items: normalizedItems,
      isDigitalOrder,
      status: defaultStatus,
    });
    await syncCourseStudentsForOrder(ctx, orderId);
    await syncResourceCustomersForOrder(ctx, orderId);

    if (stockCheckEnabled) {
      if (variantStock === "variant") {
        await decrementVariantStock(ctx, normalizedItems);
      } else {
        await decrementProductStock(ctx, normalizedItems);
      }
    }

    return { ok: true, orderId };
  },
  returns: v.object({
    ok: v.boolean(),
    orderId: v.optional(v.id("orders")),
    error: v.optional(v.string()),
  }),
});

export const update = mutation({
  args: {
    id: v.id("orders"),
    note: v.optional(v.string()),
    paymentMethod: v.optional(paymentMethod),
    paymentStatus: v.optional(paymentStatus),
    shippingAddress: v.optional(v.string()),
    status: v.optional(orderStatus),
    trackingNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const oldOrder = await ctx.db.get(args.id);
    if (!oldOrder) {
      throw new Error("Order not found");
    }

    await OrdersModel.update(ctx, args);

    if (args.status && args.status !== oldOrder.status) {
      await handleOrderStatusTransition(ctx, args.id, oldOrder.status, args.status);
    }
    if ((args.status && args.status !== oldOrder.status) || args.paymentStatus !== undefined) {
      await syncCourseStudentsForOrder(ctx, args.id);
      await syncResourceCustomersForOrder(ctx, args.id);
    }
    return null;
  },
  returns: v.null(),
});

export const updateStatus = mutation({
  args: { id: v.id("orders"), status: orderStatus },
  handler: async (ctx, args) => {
    const oldOrder = await ctx.db.get(args.id);
    if (!oldOrder) {
      throw new Error("Order not found");
    }

    await OrdersModel.updateStatus(ctx, args);

    await handleOrderStatusTransition(ctx, args.id, oldOrder.status, args.status);
    await syncCourseStudentsForOrder(ctx, args.id);
    await syncResourceCustomersForOrder(ctx, args.id);
    return null;
  },
  returns: v.null(),
});

export const updatePaymentStatus = mutation({
  args: { id: v.id("orders"), paymentStatus: paymentStatus },
  handler: async (ctx, args) => {
    await OrdersModel.updatePaymentStatus(ctx, args);
    await syncCourseStudentsForOrder(ctx, args.id);
    await syncResourceCustomersForOrder(ctx, args.id);
    return null;
  },
  returns: v.null(),
});

export const deliverDigitalItem = mutation({
  args: {
    orderId: v.id("orders"),
    itemIndex: v.number(),
    credentials: v.object({
      username: v.optional(v.string()),
      password: v.optional(v.string()),
      licenseKey: v.optional(v.string()),
      downloadUrl: v.optional(v.string()),
      customContent: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    if (args.itemIndex < 0 || args.itemIndex >= order.items.length) {
      throw new Error("Invalid item index");
    }

    const updatedItems = [...order.items];
    updatedItems[args.itemIndex] = {
      ...updatedItems[args.itemIndex],
      digitalCredentials: {
        ...args.credentials,
        deliveredAt: Date.now(),
      },
    };

    await ctx.db.patch(args.orderId, { items: updatedItems });
    return null;
  },
  returns: v.null(),
});

export const cancel = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await OrdersModel.getById(ctx, { id: args.id });
    if (!order) {
      throw new Error("Order not found");
    }
    const { statuses } = await getOrderStatusSettings(ctx);
    const currentStatus = statuses.find((status) => status.key === order.status);
    if (!currentStatus?.allowCancel) {
      throw new Error("Chỉ có thể hủy đơn hàng đang chờ xử lý");
    }
    const cancelledStatus = statuses.find((status) => status.key.toLowerCase().includes("cancel"));
    if (!cancelledStatus) {
      throw new Error("Chưa cấu hình trạng thái hủy đơn");
    }
    await OrdersModel.updateStatus(ctx, { id: args.id, status: cancelledStatus.key });
    
    // Gửi email hủy đơn hàng
    await handleOrderStatusTransition(ctx, args.id, order.status, cancelledStatus.key);
    await syncCourseStudentsForOrder(ctx, args.id);
    await syncResourceCustomersForOrder(ctx, args.id);
    return null;
  },
  returns: v.null(),
});

export const cancelOwnOrder = mutation({
  args: {
    orderId: v.id("orders"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.token || !args.token.startsWith("cus_")) {
      throw new Error("Phiên đăng nhập không hợp lệ");
    }

    const session = await ctx.db
      .query("customerSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Đơn hàng không tồn tại");
    }

    if (order.customerId !== session.customerId) {
      throw new Error("Bạn không có quyền hủy đơn hàng này");
    }

    const { statuses } = await getOrderStatusSettings(ctx);
    const currentStatus = statuses.find((status) => status.key === order.status);
    if (!currentStatus?.allowCancel) {
      throw new Error("Đơn hàng hiện không ở trạng thái được phép hủy");
    }

    const cancelledStatus = statuses.find((status) => status.key.toLowerCase().includes("cancel"));
    if (!cancelledStatus) {
      throw new Error("Chưa cấu hình trạng thái hủy đơn trên hệ thống");
    }

    await ctx.db.patch(order._id, { status: cancelledStatus.key });

    // Gửi email hủy đơn hàng
    await handleOrderStatusTransition(ctx, order._id, order.status, cancelledStatus.key);
    await syncCourseStudentsForOrder(ctx, order._id);
    await syncResourceCustomersForOrder(ctx, order._id);

    const stockCheckEnabled = await isStockCheckEnabled(ctx);
    if (stockCheckEnabled) {
      const { variantStock } = await getVariantSettings(ctx);
      if (variantStock === "variant") {
        await Promise.all(
          order.items.map(async (item) => {
            if (getOrderItemType(item) !== "product" || !item.productId) {
              return;
            }
            if (item.variantId) {
              const variant = await ctx.db.get(item.variantId);
              if (variant && variant.stock !== undefined) {
                await ctx.db.patch(item.variantId, { stock: variant.stock + item.quantity });
              }
            } else {
              const product = await ctx.db.get(item.productId);
              if (product && product.stock !== undefined) {
                await ctx.db.patch(item.productId, { stock: product.stock + item.quantity });
              }
            }
          })
        );
      } else {
        await Promise.all(
          order.items.map(async (item) => {
            if (getOrderItemType(item) !== "product" || !item.productId) {
              return;
            }
            const product = await ctx.db.get(item.productId);
            if (product && product.stock !== undefined) {
              await ctx.db.patch(item.productId, { stock: product.stock + item.quantity });
            }
          })
        );
      }
    }

    if (order.promotionId) {
      const promotion = await ctx.db.get(order.promotionId);
      if (promotion) {
        const usedCount = Math.max(0, promotion.usedCount - 1);
        const budgetUsed = Math.max(0, (promotion.budgetUsed ?? 0) - (order.discountAmount ?? 0));
        await ctx.db.patch(promotion._id, { usedCount, budgetUsed });
      }

      const usage = await ctx.db
        .query("promotionUsage")
        .withIndex("by_order", (q) => q.eq("orderId", order._id))
        .first();
      if (usage) {
        await ctx.db.delete(usage._id);
      }
    }

    const customer = await ctx.db.get(order.customerId);
    await ctx.db.insert("notifications", {
      title: `Đơn hàng #${order.orderNumber} đã bị khách hủy`,
      content: `Khách hàng ${customer?.name ?? ""} đã chủ động hủy đơn hàng qua tài khoản.`,
      type: "warning",
      status: "Sent",
      targetType: "users",
      order: Date.now(),
      readCount: 0,
      sentAt: Date.now(),
    });

    return { ok: true };
  },
  returns: v.object({ ok: v.boolean() }),
});

async function recalculateCartInternal(ctx: MutationCtx, cartId: Id<"carts">) {
  const items = await ctx.db
    .query("cartItems")
    .withIndex("by_cart", (q) => q.eq("cartId", cartId))
    .collect();

  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  const patchData: any = { itemsCount, totalAmount };
  if (itemsCount === 0) {
    patchData.status = "Converted";
  }
  await ctx.db.patch(cartId, patchData);
}

export const placeOrder = mutation({
  args: {
    customer: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
    }),
    items: v.array(orderItemValidator),
    note: v.optional(v.string()),
    paymentMethod: v.optional(paymentMethod),
    shippingMethodId: v.optional(v.string()),
    shippingMethodLabel: v.optional(v.string()),
    shippingAddress: v.optional(v.string()),
    shippingFee: v.optional(v.number()),
    promotionId: v.optional(v.id("promotions")),
    promotionCode: v.optional(v.string()),
    discountAmount: v.optional(v.number()),
    cartId: v.optional(v.id("carts")),
    customerId: v.optional(v.id("customers")),
    customerAddress: v.optional(
      v.object({
        format: v.union(v.literal("text"), v.literal("2-level"), v.literal("3-level")),
        detail: v.string(),
        provinceCode: v.optional(v.string()),
        provinceName: v.optional(v.string()),
        districtCode: v.optional(v.string()),
        districtName: v.optional(v.string()),
        wardCode: v.optional(v.string()),
        wardName: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let customerId: Id<"customers">;
    const cleanEmail = args.customer.email.trim().toLowerCase();
    const cleanPhone = args.customer.phone.trim().replace(/[^\d+]/g, "");

    let customer = null;
    if (args.customerId) {
      customer = await ctx.db.get(args.customerId);
    }

    if (!customer) {
      customer = await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", cleanEmail))
        .first();
    }

    if (!customer && cleanPhone) {
      customer = await ctx.db
        .query("customers")
        .withIndex("by_phone", (q) => q.eq("phone", cleanPhone))
        .first();
    }

    if (customer) {
      customerId = customer._id;
      const patchData: any = {
        name: args.customer.name,
        address: args.shippingAddress ?? customer.address,
      };
      if (args.customerAddress) {
        patchData.addressFormat = args.customerAddress.format;
        patchData.addressDetail = args.customerAddress.detail;
        patchData.provinceCode = args.customerAddress.provinceCode;
        patchData.provinceName = args.customerAddress.provinceName;
        patchData.districtCode = args.customerAddress.districtCode;
        patchData.districtName = args.customerAddress.districtName;
        patchData.wardCode = args.customerAddress.wardCode;
        patchData.wardName = args.customerAddress.wardName;
      }
      await ctx.db.patch(customerId, patchData);
    } else {
      const insertData: any = {
        name: args.customer.name,
        email: cleanEmail,
        phone: cleanPhone,
        address: args.shippingAddress,
        ordersCount: 0,
        totalSpent: 0,
        status: "Active",
      };
      if (args.customerAddress) {
        insertData.addressFormat = args.customerAddress.format;
        insertData.addressDetail = args.customerAddress.detail;
        insertData.provinceCode = args.customerAddress.provinceCode;
        insertData.provinceName = args.customerAddress.provinceName;
        insertData.districtCode = args.customerAddress.districtCode;
        insertData.districtName = args.customerAddress.districtName;
        insertData.wardCode = args.customerAddress.wardCode;
        insertData.wardName = args.customerAddress.wardName;
      }
      customerId = await ctx.db.insert("customers", insertData);
    }

    const { variantPricing, variantStock } = await getVariantSettings(ctx);
    const normalizedItems = await normalizeOrderItems(ctx, args.items, variantPricing);

    // Siết chặt validation đầu vào
    if (normalizedItems.length === 0) {
      throw new Error("Không có mục nào để đặt hàng");
    }
    const fulfillmentError = validateOrderFulfillmentPolicy({
      items: normalizedItems,
      paymentMethod: args.paymentMethod,
      shippingFee: args.shippingFee,
      shippingMethodId: args.shippingMethodId,
      shippingMethodLabel: args.shippingMethodLabel,
    });
    if (fulfillmentError) {
      throw new Error(fulfillmentError);
    }
    await validateCheckoutCommerce(ctx, normalizedItems);
    for (const item of normalizedItems) {
      if (item.quantity <= 0 || !Number.isFinite(item.quantity)) {
        throw new Error(`Số lượng sản phẩm ${item.productName} không hợp lệ`);
      }
      if (item.price < 0 || !Number.isFinite(item.price)) {
        throw new Error(`Giá sản phẩm ${item.productName} không hợp lệ`);
      }
    }

    const shippingFee = Math.max(0, args.shippingFee ?? 0);
    const discountAmount = Math.max(0, args.discountAmount ?? 0);

    const stockCheckEnabled = await isStockCheckEnabled(ctx);
    if (stockCheckEnabled) {
      const stockError = await validateStockBeforeCreate(ctx, normalizedItems, variantStock);
      if (stockError) {
        throw new Error(stockError);
      }
    }

    const isDigitalOrder = normalizedItems.some((item) => item.isDigital);
    const { statuses } = await getOrderStatusSettings(ctx);
    const defaultStatus = statuses[0]?.key ?? "Pending";

    // Tạo đơn hàng trước để lấy orderId
    const orderId = await OrdersModel.create(ctx, {
      customerId,
      items: normalizedItems,
      note: args.note,
      paymentMethod: args.paymentMethod,
      shippingMethodId: args.shippingMethodId,
      shippingMethodLabel: args.shippingMethodLabel,
      shippingAddress: args.shippingAddress,
      shippingFee,
      promotionId: args.promotionId,
      promotionCode: args.promotionCode,
      discountAmount,
      status: defaultStatus,
      isDigitalOrder,
    });
    await syncCourseStudentsForOrder(ctx, orderId);
    await syncResourceCustomersForOrder(ctx, orderId);

    // Lưu promotion usage sau khi đã có orderId hợp lệ
    if (args.promotionId) {
      const promotion = await ctx.db.get(args.promotionId);
      if (!promotion || promotion.status !== "Active") {
        throw new Error("Mã giảm giá không hợp lệ hoặc đã hết hạn");
      }
      const usedCount = promotion.usedCount + 1;
      const budgetUsed = (promotion.budgetUsed ?? 0) + discountAmount;
      await ctx.db.patch(promotion._id, { usedCount, budgetUsed });
      await ctx.db.insert("promotionUsage", {
        customerId,
        discountAmount,
        orderId,
        promotionId: promotion._id,
        usedAt: Date.now(),
      });
    }

    if (stockCheckEnabled) {
      if (variantStock === "variant") {
        await decrementVariantStock(ctx, normalizedItems);
      } else {
        await decrementProductStock(ctx, normalizedItems);
      }
    }

    if (args.cartId) {
      const cartItems = await ctx.db
        .query("cartItems")
        .withIndex("by_cart", (q) => q.eq("cartId", args.cartId!))
        .collect();

      for (const item of cartItems) {
        const isInOrder = normalizedItems.some((orderItem) => isSameOrderLine(orderItem, item));
        if (isInOrder) {
          await ctx.db.delete(item._id);
        }
      }
      await recalculateCartInternal(ctx, args.cartId);
    }

    const orderNumber = await ctx.db.get(orderId).then((o) => o?.orderNumber ?? "");
    const formattedAmount = (normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0) - discountAmount + shippingFee).toLocaleString("vi-VN") + "đ";

    await ctx.db.insert("notifications", {
      title: "Đơn hàng mới #" + orderNumber,
      content: `Khách hàng ${args.customer.name} vừa đặt đơn hàng trị giá ${formattedAmount}.`,
      type: "success",
      status: "Sent",
      targetType: "users",
      order: Date.now(),
      readCount: 0,
      sentAt: Date.now(),
    });

    // Schedule gửi email cho khách hàng và shop
    const orderDoc = await ctx.db.get(orderId);
    const customerDoc = await ctx.db.get(customerId);
    if (orderDoc && customerDoc) {
      const settings = await getSettingsByKeys(ctx, [
        "site_url",
        "site_name",
        ...EMAIL_CONFIG_SETTING_KEYS,
      ]);
      const siteUrl = settings.site_url ? String(settings.site_url as string).trim() : "http://localhost:3000";
      const brandName = settings.site_name ? String(settings.site_name as string).trim() : "YourBrand";
      const emailStatus = getEmailConfigurationStatus(settings);

      if (!emailStatus.configured) {
        await ctx.db.insert("notifications", {
          title: "Cần gửi thông báo thủ công",
          content: `Đơn #${orderDoc.orderNumber} đã tạo thành công. Email thông báo chưa được gửi tự động. Vui lòng xử lý đơn và gửi mã đơn cho khách nếu cần tra cứu.`,
          type: "warning",
          status: "Sent",
          targetType: "users",
          order: Date.now(),
          readCount: 0,
          sentAt: Date.now(),
        });
      } else {
        if (customerDoc.email) {
          const customerHtml = getOrderPlacedCustomerTemplate(orderDoc, siteUrl, brandName);
          await ctx.scheduler.runAfter(0, internal.email.sendTransactionalEmail, {
            to: customerDoc.email,
            subject: `[${brandName}] Xác nhận đơn hàng #${orderDoc.orderNumber}`,
            html: customerHtml,
            eventType: "order_placed",
            orderId: orderDoc._id,
          });
        }

        const shopEmails = await resolveOrderNotificationEmails(ctx);
        if (shopEmails) {
          const shopHtml = getOrderPlacedShopTemplate(orderDoc, customerDoc, siteUrl, brandName);
          await ctx.scheduler.runAfter(0, internal.email.sendTransactionalEmail, {
            to: shopEmails,
            subject: `[${brandName}] Đơn hàng mới #${orderDoc.orderNumber}`,
            html: shopHtml,
            eventType: "order_placed_shop",
            orderId: orderDoc._id,
          });
        }
      }
    }

    return { ok: true, orderId, orderNumber };
  },
  returns: v.object({
    ok: v.boolean(),
    orderId: v.optional(v.id("orders")),
    orderNumber: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
});

export const cancelByCustomer = mutation({
  args: {
    orderId: v.id("orders"),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      return { ok: false, error: "Không tìm thấy đơn hàng" };
    }

    const customer = await ctx.db.get(order.customerId);
    if (!customer || customer.phone.trim() !== args.phone.trim()) {
      return { ok: false, error: "Số điện thoại không khớp với thông tin đặt hàng" };
    }

    const { statuses } = await getOrderStatusSettings(ctx);
    const currentStatus = statuses.find((status) => status.key === order.status);
    if (!currentStatus?.allowCancel) {
      return { ok: false, error: "Đơn hàng hiện không ở trạng thái được phép hủy." };
    }
    const cancelledStatus = statuses.find((status) => status.key.toLowerCase().includes("cancel"));
    if (!cancelledStatus) {
      return { ok: false, error: "Chưa cấu hình trạng thái hủy đơn trên hệ thống." };
    }

    await ctx.db.patch(order._id, { status: cancelledStatus.key });

    // Gửi email hủy đơn hàng
    await handleOrderStatusTransition(ctx, order._id, order.status, cancelledStatus.key, { notifyShopOnCancel: true });
    await syncCourseStudentsForOrder(ctx, order._id);
    await syncResourceCustomersForOrder(ctx, order._id);

    const stockCheckEnabled = await isStockCheckEnabled(ctx);
    if (stockCheckEnabled) {
      const { variantStock } = await getVariantSettings(ctx);
      if (variantStock === "variant") {
        await Promise.all(
          order.items.map(async (item) => {
            if (getOrderItemType(item) !== "product" || !item.productId) {
              return;
            }
            if (item.variantId) {
              const variant = await ctx.db.get(item.variantId);
              if (variant && variant.stock !== undefined) {
                await ctx.db.patch(item.variantId, { stock: variant.stock + item.quantity });
              }
            } else {
              const product = await ctx.db.get(item.productId);
              if (product && product.stock !== undefined) {
                await ctx.db.patch(item.productId, { stock: product.stock + item.quantity });
              }
            }
          })
        );
      } else {
        await Promise.all(
          order.items.map(async (item) => {
            if (getOrderItemType(item) !== "product" || !item.productId) {
              return;
            }
            const product = await ctx.db.get(item.productId);
            if (product && product.stock !== undefined) {
              await ctx.db.patch(item.productId, { stock: product.stock + item.quantity });
            }
          })
        );
      }
    }

    if (order.promotionId) {
      const promotion = await ctx.db.get(order.promotionId);
      if (promotion) {
        const usedCount = Math.max(0, promotion.usedCount - 1);
        const budgetUsed = Math.max(0, (promotion.budgetUsed ?? 0) - (order.discountAmount ?? 0));
        await ctx.db.patch(promotion._id, { usedCount, budgetUsed });
      }

      const usage = await ctx.db
        .query("promotionUsage")
        .withIndex("by_order", (q) => q.eq("orderId", order._id))
        .first();
      if (usage) {
        await ctx.db.delete(usage._id);
      }
    }

    await ctx.db.insert("notifications", {
      title: `Đơn hàng #${order.orderNumber} đã bị khách hủy`,
      content: `Khách hàng ${customer.name} đã chủ động hủy đơn hàng này.`,
      type: "warning",
      status: "Sent",
      targetType: "users",
      order: Date.now(),
      readCount: 0,
      sentAt: Date.now(),
    });

    return { ok: true };
  },
  returns: v.object({
    ok: v.boolean(),
    error: v.optional(v.string()),
  }),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("orders") },
  handler: async (ctx, args) => {
    await OrdersModel.remove(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => OrdersModel.getDeleteInfo(ctx, args),
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

// Bulk delete orders
export const bulkRemove = mutation({
  args: { cascade: v.optional(v.boolean()), ids: v.array(v.id("orders")) },
  handler: async (ctx, args) => OrdersModel.bulkRemove(ctx, { cascade: args.cascade, ids: args.ids }),
  returns: v.number(),
});

// Delete all orders by customer (for cascade delete)
export const removeByCustomer = mutation({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => OrdersModel.removeByCustomer(ctx, args),
  returns: v.number(),
});
