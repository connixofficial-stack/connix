import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { orderCanUnlockCourse, resolveCustomerIdByToken } from "./courseEnrollment";

type DbCtx = QueryCtx | MutationCtx;

export { resolveCustomerIdByToken };

export function orderCanUnlockResource(order: Doc<"orders">) {
  return orderCanUnlockCourse(order);
}

export async function getResourceCustomer(
  ctx: DbCtx,
  customerId: Id<"customers">,
  resourceId: Id<"resources">
) {
  return ctx.db
    .query("resourceCustomers")
    .withIndex("by_resourceId_and_customerId", (q) =>
      q.eq("resourceId", resourceId).eq("customerId", customerId)
    )
    .unique();
}

export async function customerHasResourceOrderAccess(
  ctx: DbCtx,
  customerId: Id<"customers">,
  resourceId: Id<"resources">,
  excludeOrderId?: Id<"orders">
) {
  const orders = await ctx.db
    .query("orders")
    .withIndex("by_customer", (q) => q.eq("customerId", customerId))
    .order("desc")
    .take(500);

  return orders.some((order) =>
    order._id !== excludeOrderId &&
    orderCanUnlockResource(order) &&
    order.items.some((item) =>
      item.itemType === "resource" &&
      item.resourceId === resourceId
    )
  );
}

export async function ensureResourceCustomerForCustomerResource(
  ctx: MutationCtx,
  customerId: Id<"customers">,
  resourceId: Id<"resources">,
  source: { sourceType: "order" | "free" | "manual"; sourceOrderId?: Id<"orders"> }
) {
  const now = Date.now();
  const existing = await getResourceCustomer(ctx, customerId, resourceId);

  if (existing) {
    await ctx.db.patch(existing._id, {
      sourceOrderId: source.sourceOrderId ?? existing.sourceOrderId,
      sourceType: source.sourceType,
      status: "active",
      updatedAt: now,
    });
    return existing._id;
  }

  return ctx.db.insert("resourceCustomers", {
    customerId,
    downloadCount: 0,
    enrolledAt: now,
    grantedAt: now,
    resourceId,
    ...(source.sourceOrderId ? { sourceOrderId: source.sourceOrderId } : {}),
    sourceType: source.sourceType,
    status: "active",
    updatedAt: now,
  });
}

export async function syncResourceCustomersForOrder(ctx: MutationCtx, orderId: Id<"orders">) {
  const order = await ctx.db.get(orderId);
  if (!order) {
    return;
  }

  const resourceIds = Array.from(new Set(order.items
    .filter((item) => item.itemType === "resource" && item.resourceId)
    .map((item) => item.resourceId!)
  ));
  if (resourceIds.length === 0) {
    return;
  }

  const canUnlock = orderCanUnlockResource(order);
  for (const resourceId of resourceIds) {
    const existing = await getResourceCustomer(ctx, order.customerId, resourceId);
    if (canUnlock) {
      await ensureResourceCustomerForCustomerResource(ctx, order.customerId, resourceId, {
        sourceOrderId: order._id,
        sourceType: "order",
      });
      continue;
    }

    if (!existing || existing.sourceOrderId !== order._id) {
      continue;
    }

    const hasOtherValidOrder = await customerHasResourceOrderAccess(ctx, order.customerId, resourceId, order._id);
    if (!hasOtherValidOrder) {
      await ctx.db.patch(existing._id, {
        status: "revoked",
        updatedAt: Date.now(),
      });
    }
  }
}
