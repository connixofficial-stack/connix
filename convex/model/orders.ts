import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// ============================================================
// HELPER FUNCTIONS - Orders Model Layer
// ============================================================

const MAX_ITEMS_LIMIT = 100;
const MAX_COUNT_LIMIT = 1000;

type OrderStatus = string;
type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";
type PaymentMethod = "COD" | "BankTransfer" | "VietQR" | "CreditCard" | "EWallet";

interface OrderItem {
  itemType?: "product" | "service" | "course" | "resource";
  productId?: Id<"products">;
  serviceId?: Id<"services">;
  courseId?: Id<"courses">;
  resourceId?: Id<"resources">;
  productImage?: string;
  productName: string;
  quantity: number;
  price: number;
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
}

/**
 * Get order by ID with null check
 */
export async function getById(
  ctx: QueryCtx,
  { id }: { id: Id<"orders"> }
): Promise<Doc<"orders"> | null> {
  return  ctx.db.get(id);
}

/**
 * Get order by ID or throw error
 */
export async function getByIdOrThrow(
  ctx: QueryCtx,
  { id }: { id: Id<"orders"> }
): Promise<Doc<"orders">> {
  const order = await ctx.db.get(id);
  if (!order) {throw new Error("Order not found");}
  return order;
}

/**
 * Get order by order number
 */
export async function getByOrderNumber(
  ctx: QueryCtx,
  { orderNumber }: { orderNumber: string }
): Promise<Doc<"orders"> | null> {
  return  ctx.db
    .query("orders")
    .withIndex("by_orderNumber", (q) => q.eq("orderNumber", orderNumber))
    .unique();
}

/**
 * List orders with limit (for admin listing without pagination)
 * Use take() instead of collect() to limit bandwidth
 */
export async function listWithLimit(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"orders">[]> {
  return  ctx.db
    .query("orders")
    .order("desc")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

/**
 * List orders by status with limit
 */
export async function listByStatus(
  ctx: QueryCtx,
  { status, limit = MAX_ITEMS_LIMIT }: { status: OrderStatus; limit?: number }
): Promise<Doc<"orders">[]> {
  return  ctx.db
    .query("orders")
    .withIndex("by_status", (q) => q.eq("status", status))
    .order("desc")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

/**
 * List orders by customer with limit
 */
export async function listByCustomer(
  ctx: QueryCtx,
  { customerId, limit = MAX_ITEMS_LIMIT }: { customerId: Id<"customers">; limit?: number }
): Promise<Doc<"orders">[]> {
  return  ctx.db
    .query("orders")
    .withIndex("by_customer", (q) => q.eq("customerId", customerId))
    .order("desc")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

/**
 * Count orders efficiently using take() and checking length
 */
export async function countWithLimit(
  ctx: QueryCtx,
  { status, limit = MAX_COUNT_LIMIT }: { status?: OrderStatus; limit?: number } = {}
): Promise<{ count: number; hasMore: boolean }> {
  const query = status
    ? ctx.db.query("orders").withIndex("by_status", (q) => q.eq("status", status))
    : ctx.db.query("orders");

  const items = await query.take(limit + 1);
  return {
    count: Math.min(items.length, limit),
    hasMore: items.length > limit,
  };
}

/**
 * Count orders by customer
 */
export async function countByCustomer(
  ctx: QueryCtx,
  { customerId, limit = MAX_COUNT_LIMIT }: { customerId: Id<"customers">; limit?: number }
): Promise<{ count: number; hasMore: boolean }> {
  const items = await ctx.db
    .query("orders")
    .withIndex("by_customer", (q) => q.eq("customerId", customerId))
    .take(limit + 1);

  return {
    count: Math.min(items.length, limit),
    hasMore: items.length > limit,
  };
}

/**
 * Generate unique order number: ORD-YYYYMMDD-XXXX
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replaceAll('-', "");
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomNum}`;
}

/**
 * Calculate order totals
 */
export function calculateTotals(
  items: OrderItem[],
  shippingFee: number = 0,
  discountAmount: number = 0
): { subtotal: number; totalAmount: number } {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const safeDiscount = Math.min(discountAmount, subtotal);
  return {
    subtotal,
    totalAmount: subtotal - safeDiscount + shippingFee,
  };
}

/**
 * Create order
 */
export async function create(
  ctx: MutationCtx,
  args: {
    customerId: Id<"customers">;
    items: OrderItem[];
    shippingFee?: number;
    paymentMethod?: PaymentMethod;
    shippingMethodId?: string;
    shippingMethodLabel?: string;
    shippingAddress?: string;
    note?: string;
    promotionId?: Id<"promotions">;
    promotionCode?: string;
    discountAmount?: number;
    status?: OrderStatus;
    isDigitalOrder?: boolean;
  }
): Promise<Id<"orders">> {
  const orderNumber = generateOrderNumber();
  const { subtotal, totalAmount } = calculateTotals(args.items, args.shippingFee, args.discountAmount ?? 0);

  return  ctx.db.insert("orders", {
    customerId: args.customerId,
    items: args.items,
    note: args.note,
    orderNumber,
    paymentMethod: args.paymentMethod,
    paymentStatus: "Pending",
    promotionId: args.promotionId,
    promotionCode: args.promotionCode,
    discountAmount: args.discountAmount ?? 0,
    shippingAddress: args.shippingAddress,
    shippingMethodId: args.shippingMethodId,
    shippingMethodLabel: args.shippingMethodLabel,
    shippingFee: args.shippingFee ?? 0,
    status: args.status ?? "Pending",
    subtotal,
    totalAmount,
    isDigitalOrder: args.isDigitalOrder ?? false,
  });
}

/**
 * Update order
 */
export async function update(
  ctx: MutationCtx,
  args: {
    id: Id<"orders">;
    status?: OrderStatus;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    shippingAddress?: string;
    trackingNumber?: string;
    note?: string;
  }
): Promise<void> {
  await getByIdOrThrow(ctx, { id: args.id });

  const { id, ...updates } = args;
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );

  if (Object.keys(filteredUpdates).length === 0) {return;}

  await ctx.db.patch(id, filteredUpdates);
}

/**
 * Update order status
 */
export async function updateStatus(
  ctx: MutationCtx,
  { id, status }: { id: Id<"orders">; status: OrderStatus }
): Promise<void> {
  await getByIdOrThrow(ctx, { id });
  await ctx.db.patch(id, { status });
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  ctx: MutationCtx,
  { id, paymentStatus }: { id: Id<"orders">; paymentStatus: PaymentStatus }
): Promise<void> {
  const order = await getByIdOrThrow(ctx, { id });
  const shouldAutoDeliver = paymentStatus === "Paid";

  if (!shouldAutoDeliver) {
    await ctx.db.patch(id, { paymentStatus });
    return;
  }

  const setting = await ctx.db
    .query("moduleSettings")
    .withIndex("by_module_setting", (q) => q.eq("moduleKey", "orders").eq("settingKey", "digitalDeliveryMode"))
    .unique();
  const deliveryMode = (setting?.value as string) ?? "semi-auto";

  if (deliveryMode !== "auto" && deliveryMode !== "semi-auto") {
    await ctx.db.patch(id, { paymentStatus });
    return;
  }

  const updatedItems = order.items.map((item) => {
    if (!item.isDigital || !item.digitalCredentials || item.digitalCredentials.deliveredAt) {
      return item;
    }
    return {
      ...item,
      digitalCredentials: {
        ...item.digitalCredentials,
        deliveredAt: Date.now(),
      },
    };
  });

  await ctx.db.patch(id, { paymentStatus, items: updatedItems });
}

/**
 * Delete order
 */
export async function remove(
  ctx: MutationCtx,
  { cascade, id }: { cascade?: boolean; id: Id<"orders"> }
): Promise<void> {
  await getByIdOrThrow(ctx, { id });

  const preview = await ctx.db
    .query("promotionUsage")
    .withIndex("by_order", (q) => q.eq("orderId", id))
    .take(1);
  if (preview.length > 0 && !cascade) {
    throw new Error("Đơn hàng có lịch sử sử dụng khuyến mãi. Vui lòng xác nhận xóa tất cả.");
  }

  if (cascade) {
    const usage = await ctx.db
      .query("promotionUsage")
      .withIndex("by_order", (q) => q.eq("orderId", id))
      .collect();
    await Promise.all(usage.map( async (record) => ctx.db.delete(record._id)));
  }

  await ctx.db.delete(id);
}

export async function getDeleteInfo(
  ctx: QueryCtx,
  { id }: { id: Id<"orders"> }
): Promise<{ canDelete: boolean; dependencies: { count: number; hasMore: boolean; label: string; preview: { id: string; name: string }[] }[] }> {
  const preview = await ctx.db
    .query("promotionUsage")
    .withIndex("by_order", (q) => q.eq("orderId", id))
    .take(10);
  const count = await ctx.db
    .query("promotionUsage")
    .withIndex("by_order", (q) => q.eq("orderId", id))
    .take(1001);

  return {
    canDelete: true,
    dependencies: [
      {
        count: Math.min(count.length, 1000),
        hasMore: count.length > 1000,
        label: "Lịch sử khuyến mãi",
        preview: preview.map((record) => ({ id: record._id, name: record.promotionId })),
      },
    ],
  };
}

/**
 * Bulk delete orders
 */
export async function bulkRemove(
  ctx: MutationCtx,
  { cascade, ids }: { cascade?: boolean; ids: Id<"orders">[] }
): Promise<number> {
  let deletedCount = 0;
  for (const id of ids) {
    const order = await ctx.db.get(id);
    if (!order) {continue;}

    const preview = await ctx.db
      .query("promotionUsage")
      .withIndex("by_order", (q) => q.eq("orderId", id))
      .take(1);
    if (preview.length > 0 && !cascade) {
      throw new Error("Đơn hàng có lịch sử sử dụng khuyến mãi. Vui lòng xác nhận xóa tất cả.");
    }

    if (cascade) {
      const usage = await ctx.db
        .query("promotionUsage")
        .withIndex("by_order", (q) => q.eq("orderId", id))
        .collect();
      await Promise.all(usage.map( async (record) => ctx.db.delete(record._id)));
    }

    await ctx.db.delete(id);
    deletedCount++;
  }
  return deletedCount;
}

/**
 * Delete all orders by customer (for cascade delete)
 */
export async function removeByCustomer(
  ctx: MutationCtx,
  { customerId }: { customerId: Id<"customers"> }
): Promise<number> {
  const orders = await ctx.db
    .query("orders")
    .withIndex("by_customer", (q) => q.eq("customerId", customerId))
    .collect();

  for (const order of orders) {
    await ctx.db.delete(order._id);
  }

  return orders.length;
}

/**
 * Get order statistics (for dashboard)
 */
export async function getStats(
  ctx: QueryCtx,
  {
    limit = 100,
    statuses = [],
  }: {
    limit?: number;
    statuses?: { key: string; allowCancel: boolean; isFinal: boolean }[];
  } = {}
): Promise<{
  total: number;
  pending: number;
  processing: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}> {
  const resolvedStatuses = statuses.length > 0
    ? statuses
    : [
        { key: "Pending", allowCancel: true, isFinal: false },
        { key: "Processing", allowCancel: false, isFinal: false },
        { key: "Shipped", allowCancel: false, isFinal: false },
        { key: "Delivered", allowCancel: false, isFinal: true },
        { key: "Cancelled", allowCancel: false, isFinal: true },
      ];
  const cancelledKeys = resolvedStatuses
    .filter((status) => status.key.toLowerCase().includes("cancel"))
    .map((status) => status.key);
  const pendingKeys = resolvedStatuses
    .filter((status) => status.allowCancel)
    .map((status) => status.key);
  const deliveredKeys = resolvedStatuses
    .filter((status) => status.isFinal && !cancelledKeys.includes(status.key) && !status.key.toLowerCase().includes("refund"))
    .map((status) => status.key);
  const resolvedDeliveredKeys = deliveredKeys.length > 0
    ? deliveredKeys
    : resolvedStatuses.length > 0
      ? [resolvedStatuses[resolvedStatuses.length - 1].key]
      : [];
  const processingKeys = resolvedStatuses
    .filter((status) => !status.isFinal && !pendingKeys.includes(status.key))
    .map((status) => status.key);

  const orders = await ctx.db.query("orders").order("desc").take(limit);

  const pending = pendingKeys.length > 0
    ? orders.filter((order) => pendingKeys.includes(order.status)).length
    : 0;
  const processing = processingKeys.length > 0
    ? orders.filter((order) => processingKeys.includes(order.status)).length
    : 0;
  const delivered = resolvedDeliveredKeys.length > 0
    ? orders.filter((order) => resolvedDeliveredKeys.includes(order.status)).length
    : 0;
  const cancelled = cancelledKeys.length > 0
    ? orders.filter((order) => cancelledKeys.includes(order.status)).length
    : 0;
  const totalRevenue = resolvedDeliveredKeys.length > 0
    ? orders
        .filter((order) => resolvedDeliveredKeys.includes(order.status))
        .reduce((sum, order) => sum + order.totalAmount, 0)
    : 0;

  return {
    cancelled,
    delivered,
    pending,
    processing,
    total: orders.length,
    totalRevenue,
  };
}
