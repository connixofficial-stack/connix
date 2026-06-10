import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

// HIGH-004 FIX: Helper function to update promotionStats counter
async function updatePromotionStats(
  ctx: MutationCtx,
  key: string,
  delta: number
) {
  const stats = await ctx.db
    .query("promotionStats")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (stats) {
    await ctx.db.patch(stats._id, { count: Math.max(0, stats.count + delta) });
  } else {
    await ctx.db.insert("promotionStats", { count: Math.max(0, delta), key });
  }
}

const promotionStatus = v.union(
  v.literal("Active"),
  v.literal("Inactive"),
  v.literal("Expired"),
  v.literal("Scheduled")
);

const promotionType = v.union(
  v.literal("coupon"),
  v.literal("campaign"),
  v.literal("flash_sale"),
  v.literal("bundle"),
  v.literal("loyalty")
);

const discountType = v.union(
  v.literal("percent"),
  v.literal("fixed"),
  v.literal("buy_x_get_y"),
  v.literal("buy_a_get_b"),
  v.literal("tiered"),
  v.literal("free_shipping"),
  v.literal("gift")
);

const applicableTo = v.union(
  v.literal("all"),
  v.literal("products"),
  v.literal("categories"),
  v.literal("brands"),
  v.literal("tags")
);

const customerType = v.union(
  v.literal("all"),
  v.literal("new"),
  v.literal("returning"),
  v.literal("vip")
);

const scheduleType = v.union(
  v.literal("always"),
  v.literal("dateRange"),
  v.literal("recurring")
);

const promotionDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("promotions"),
  applicableIds: v.optional(v.array(v.string())),
  applicableTo: v.optional(applicableTo),
  budget: v.optional(v.number()),
  budgetUsed: v.optional(v.number()),
  code: v.optional(v.string()),
  customerGroupIds: v.optional(v.array(v.string())),
  customerTierIds: v.optional(v.array(v.string())),
  customerType: v.optional(customerType),
  description: v.optional(v.string()),
  discountConfig: v.optional(v.any()),
  discountType: discountType,
  discountValue: v.optional(v.number()),
  displayOnPage: v.optional(v.boolean()),
  endDate: v.optional(v.number()),
  excludeIds: v.optional(v.array(v.string())),
  featured: v.optional(v.boolean()),
  maxDiscountAmount: v.optional(v.number()),
  minOrderAmount: v.optional(v.number()),
  minOrderHistory: v.optional(v.number()),
  minQuantity: v.optional(v.number()),
  minTotalSpent: v.optional(v.number()),
  name: v.string(),
  order: v.number(),
  priority: v.optional(v.number()),
  promotionType: promotionType,
  recurringDays: v.optional(v.array(v.number())),
  recurringHours: v.optional(v.object({ from: v.number(), to: v.number() })),
  scheduleType: v.optional(scheduleType),
  stackable: v.optional(v.boolean()),
  startDate: v.optional(v.number()),
  status: promotionStatus,
  thumbnail: v.optional(v.string()),
  usageLimit: v.optional(v.number()),
  usagePerCustomer: v.optional(v.number()),
  usedCount: v.number(),
});

// HIGH-004 FIX: Thêm limit
export const listAll = query({
  args: {},
  handler: async (ctx) => ctx.db.query("promotions").take(500),
  returns: v.array(promotionDoc),
});

export const listAdminWithOffset = query({
  args: {
    discountType: v.optional(discountType),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    promotionType: v.optional(promotionType),
    search: v.optional(v.string()),
    status: v.optional(promotionStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 50, 1000);

    let discountTypeFiltered = false;
    let promotions: Doc<"promotions">[] = [];
    if (args.status && args.promotionType) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_status_promotionType", (q) =>
          q.eq("status", args.status!).eq("promotionType", args.promotionType!)
        )
        .order("desc")
        .take(fetchLimit);
    } else if (args.status && args.discountType) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_status_discountType", (q) =>
          q.eq("status", args.status!).eq("discountType", args.discountType!)
        )
        .order("desc")
        .take(fetchLimit);
      discountTypeFiltered = true;
    } else if (args.status) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else if (args.promotionType) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_promotionType", (q) => q.eq("promotionType", args.promotionType!))
        .order("desc")
        .take(fetchLimit);
    } else if (args.discountType) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_discountType", (q) => q.eq("discountType", args.discountType!))
        .order("desc")
        .take(fetchLimit);
    } else {
      promotions = await ctx.db.query("promotions").take(1000);
      promotions.sort((a, b) => a.order - b.order);
    }

    if (args.discountType && !discountTypeFiltered) {
      promotions = promotions.filter((promo) => promo.discountType === args.discountType);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      promotions = promotions.filter((promo) =>
        promo.name.toLowerCase().includes(searchLower) ||
        (promo.code ?? '').toLowerCase().includes(searchLower)
      );
    }

    return promotions.slice(offset, offset + limit);
  },
  returns: v.array(promotionDoc),
});

export const countAdmin = query({
  args: {
    discountType: v.optional(discountType),
    promotionType: v.optional(promotionType),
    search: v.optional(v.string()),
    status: v.optional(promotionStatus),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    const fetchLimit = limit + 1;

    let discountTypeFiltered = false;
    let promotions: Doc<"promotions">[] = [];
    if (args.status && args.promotionType) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_status_promotionType", (q) =>
          q.eq("status", args.status!).eq("promotionType", args.promotionType!)
        )
        .take(fetchLimit);
    } else if (args.status && args.discountType) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_status_discountType", (q) =>
          q.eq("status", args.status!).eq("discountType", args.discountType!)
        )
        .take(fetchLimit);
      discountTypeFiltered = true;
    } else if (args.status) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(fetchLimit);
    } else if (args.promotionType) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_promotionType", (q) => q.eq("promotionType", args.promotionType!))
        .take(fetchLimit);
    } else if (args.discountType) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_discountType", (q) => q.eq("discountType", args.discountType!))
        .take(fetchLimit);
    } else {
      promotions = await ctx.db.query("promotions").take(fetchLimit);
    }

    if (args.discountType && !discountTypeFiltered) {
      promotions = promotions.filter((promo) => promo.discountType === args.discountType);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      promotions = promotions.filter((promo) =>
        promo.name.toLowerCase().includes(searchLower) ||
        (promo.code ?? '').toLowerCase().includes(searchLower)
      );
    }

    return { count: Math.min(promotions.length, limit), hasMore: promotions.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    discountType: v.optional(discountType),
    limit: v.optional(v.number()),
    promotionType: v.optional(promotionType),
    search: v.optional(v.string()),
    status: v.optional(promotionStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    const fetchLimit = limit + 1;

    let discountTypeFiltered = false;
    let promotions: Doc<"promotions">[] = [];
    if (args.status && args.promotionType) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_status_promotionType", (q) =>
          q.eq("status", args.status!).eq("promotionType", args.promotionType!)
        )
        .take(fetchLimit);
    } else if (args.status && args.discountType) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_status_discountType", (q) =>
          q.eq("status", args.status!).eq("discountType", args.discountType!)
        )
        .take(fetchLimit);
      discountTypeFiltered = true;
    } else if (args.status) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(fetchLimit);
    } else if (args.promotionType) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_promotionType", (q) => q.eq("promotionType", args.promotionType!))
        .take(fetchLimit);
    } else if (args.discountType) {
      promotions = await ctx.db
        .query("promotions")
        .withIndex("by_discountType", (q) => q.eq("discountType", args.discountType!))
        .take(fetchLimit);
    } else {
      promotions = await ctx.db.query("promotions").take(fetchLimit);
    }

    if (args.discountType && !discountTypeFiltered) {
      promotions = promotions.filter((promo) => promo.discountType === args.discountType);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      promotions = promotions.filter((promo) =>
        promo.name.toLowerCase().includes(searchLower) ||
        (promo.code ?? '').toLowerCase().includes(searchLower)
      );
    }

    const hasMore = promotions.length > limit;
    return { ids: promotions.slice(0, limit).map((promo) => promo._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("promotions")), hasMore: v.boolean() }),
});

// HIGH-004 FIX: Thêm limit
export const listActive = query({
  args: {},
  handler: async (ctx) => ctx.db
      .query("promotions")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .take(200),
  returns: v.array(promotionDoc),
});

export const getById = query({
  args: { id: v.id("promotions") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(promotionDoc, v.null()),
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("promotions")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique(),
  returns: v.union(promotionDoc, v.null()),
});

// HIGH-004 FIX: Thêm limit
export const listByStatus = query({
  args: { status: promotionStatus },
  handler: async (ctx, args) => ctx.db
      .query("promotions")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .take(200),
  returns: v.array(promotionDoc),
});

// MED-001 FIX: Thêm validation discountValue + HIGH-004: Update counters
export const create = mutation({
  args: {
    applicableIds: v.optional(v.array(v.string())),
    applicableTo: v.optional(applicableTo),
    budget: v.optional(v.number()),
    code: v.optional(v.string()),
    customerGroupIds: v.optional(v.array(v.string())),
    customerTierIds: v.optional(v.array(v.string())),
    customerType: v.optional(customerType),
    description: v.optional(v.string()),
    discountConfig: v.optional(v.any()),
    discountType: discountType,
    discountValue: v.optional(v.number()),
    displayOnPage: v.optional(v.boolean()),
    endDate: v.optional(v.number()),
    excludeIds: v.optional(v.array(v.string())),
    featured: v.optional(v.boolean()),
    maxDiscountAmount: v.optional(v.number()),
    minOrderAmount: v.optional(v.number()),
    minOrderHistory: v.optional(v.number()),
    minQuantity: v.optional(v.number()),
    minTotalSpent: v.optional(v.number()),
    name: v.string(),
    priority: v.optional(v.number()),
    promotionType: promotionType,
    recurringDays: v.optional(v.array(v.number())),
    recurringHours: v.optional(v.object({ from: v.number(), to: v.number() })),
    scheduleType: v.optional(scheduleType),
    stackable: v.optional(v.boolean()),
    startDate: v.optional(v.number()),
    status: v.optional(promotionStatus),
    thumbnail: v.optional(v.string()),
    usageLimit: v.optional(v.number()),
    usagePerCustomer: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // MED-001: Validate discountValue
    if ((args.discountType === "percent" || args.discountType === "fixed") && (args.discountValue ?? 0) <= 0) {
      throw new Error("Giá trị giảm phải lớn hơn 0");
    }
    if (args.discountType === "percent" && (args.discountValue ?? 0) > 100) {
      throw new Error("Phần trăm giảm không được lớn hơn 100%");
    }
    if (["buy_x_get_y", "buy_a_get_b", "tiered", "gift"].includes(args.discountType) && !args.discountConfig) {
      throw new Error("Vui lòng cấu hình chi tiết giảm giá");
    }
    if (args.promotionType === "coupon" && !args.code?.trim()) {
      throw new Error("Voucher coupon cần mã giảm giá");
    }
    if (args.recurringDays?.some((day) => day < 0 || day > 6)) {
      throw new Error("Ngày lặp lại chỉ từ 0-6");
    }
    if (args.recurringHours && args.recurringHours.from >= args.recurringHours.to) {
      throw new Error("Khung giờ lặp lại không hợp lệ");
    }
    if (args.budget !== undefined && args.budget < 0) {
      throw new Error("Ngân sách không hợp lệ");
    }
    
    let code: string | undefined;
    if (args.code?.trim()) {
      code = args.code.trim().toUpperCase();
      const existing = await ctx.db
        .query("promotions")
        .withIndex("by_code", (q) => q.eq("code", code!))
        .unique();
      if (existing) {
        throw new ConvexError({
          code: "DUPLICATE_VOUCHER",
          message: "Mã voucher đã tồn tại, vui lòng chọn mã khác",
        });
      }
    }
    
    const promotions = await ctx.db.query("promotions").take(1000);
    const newOrder = promotions.reduce((max, promo) => Math.max(max, promo.order), -1) + 1;
    const status = args.status ?? "Active";
    const displayOnPage = args.displayOnPage ?? args.promotionType === "coupon";
    
    const id = await ctx.db.insert("promotions", {
      ...args,
      code,
      budgetUsed: args.budget ? 0 : undefined,
      displayOnPage,
      status,
      usedCount: 0,
      order: newOrder,
    });
    
    // Update counters
    await Promise.all([
      updatePromotionStats(ctx, "total", 1),
      updatePromotionStats(ctx, status, 1),
      updatePromotionStats(ctx, args.discountType, 1),
      updatePromotionStats(ctx, args.promotionType, 1),
    ]);
    
    return id;
  },
  returns: v.id("promotions"),
});

// MED-001 FIX: Thêm validation + HIGH-004: Update counters khi status thay đổi
export const update = mutation({
  args: {
    applicableIds: v.optional(v.array(v.string())),
    applicableTo: v.optional(applicableTo),
    budget: v.optional(v.number()),
    code: v.optional(v.string()),
    customerGroupIds: v.optional(v.array(v.string())),
    customerTierIds: v.optional(v.array(v.string())),
    customerType: v.optional(customerType),
    description: v.optional(v.string()),
    discountConfig: v.optional(v.any()),
    discountType: v.optional(discountType),
    discountValue: v.optional(v.number()),
    displayOnPage: v.optional(v.boolean()),
    endDate: v.optional(v.number()),
    id: v.id("promotions"),
    excludeIds: v.optional(v.array(v.string())),
    featured: v.optional(v.boolean()),
    maxDiscountAmount: v.optional(v.number()),
    minOrderAmount: v.optional(v.number()),
    minOrderHistory: v.optional(v.number()),
    minQuantity: v.optional(v.number()),
    minTotalSpent: v.optional(v.number()),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
    priority: v.optional(v.number()),
    promotionType: v.optional(promotionType),
    recurringDays: v.optional(v.array(v.number())),
    recurringHours: v.optional(v.object({ from: v.number(), to: v.number() })),
    scheduleType: v.optional(scheduleType),
    stackable: v.optional(v.boolean()),
    startDate: v.optional(v.number()),
    status: v.optional(promotionStatus),
    thumbnail: v.optional(v.string()),
    usageLimit: v.optional(v.number()),
    usagePerCustomer: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const promotion = await ctx.db.get(id);
    if (!promotion) {throw new Error("Promotion not found");}
    
    // MED-001: Validate discountValue nếu được cập nhật
    if (args.discountValue !== undefined) {
      if ((args.discountType ?? promotion.discountType) === "percent" && args.discountValue > 100) {
        throw new Error("Phần trăm giảm không được lớn hơn 100%");
      }
      if ((args.discountType ?? promotion.discountType) === "percent" || (args.discountType ?? promotion.discountType) === "fixed") {
        if (args.discountValue <= 0) {
          throw new Error("Giá trị giảm phải lớn hơn 0");
        }
      }
    }

    if (args.discountType && ["buy_x_get_y", "buy_a_get_b", "tiered", "gift"].includes(args.discountType) && !args.discountConfig && !promotion.discountConfig) {
      throw new Error("Vui lòng cấu hình chi tiết giảm giá");
    }

    if (args.recurringDays?.some((day) => day < 0 || day > 6)) {
      throw new Error("Ngày lặp lại chỉ từ 0-6");
    }
    if (args.recurringHours && args.recurringHours.from >= args.recurringHours.to) {
      throw new Error("Khung giờ lặp lại không hợp lệ");
    }
    if (args.budget !== undefined && args.budget < 0) {
      throw new Error("Ngân sách không hợp lệ");
    }

    const currentPromotionType = (args.promotionType ?? promotion.promotionType) ?? (promotion.code ? "coupon" : "campaign");
    if (currentPromotionType === "coupon") {
      const nextCode = args.code?.trim() ?? promotion.code ?? '';
      if (!nextCode) {
        throw new Error("Voucher coupon cần mã giảm giá");
      }
    }

    if (args.code !== undefined && args.code?.trim()) {
      const code = args.code.trim().toUpperCase();
      if (code !== promotion.code) {
        const existing = await ctx.db
          .query("promotions")
          .withIndex("by_code", (q) => q.eq("code", code))
          .unique();
        if (existing) {
          throw new ConvexError({
            code: "DUPLICATE_VOUCHER",
            message: "Mã voucher đã tồn tại, vui lòng chọn mã khác",
          });
        }
      }
      updates.code = code;
    } else if (args.code === '') {
      updates.code = undefined;
    }
    
    await ctx.db.patch(id, updates);
    
    // Update counters nếu status thay đổi
    if (args.status && args.status !== promotion.status) {
      await Promise.all([
        updatePromotionStats(ctx, promotion.status, -1),
        updatePromotionStats(ctx, args.status, 1),
      ]);
    }
    
    // Update counters nếu discountType thay đổi
    if (args.discountType && args.discountType !== promotion.discountType) {
      await Promise.all([
        updatePromotionStats(ctx, promotion.discountType, -1),
        updatePromotionStats(ctx, args.discountType, 1),
      ]);
    }

    // Update counters nếu promotionType thay đổi
    if (args.promotionType && args.promotionType !== promotion.promotionType) {
      const currentPromotionType = promotion.promotionType ?? (promotion.code ? "coupon" : "campaign");
      await Promise.all([
        updatePromotionStats(ctx, currentPromotionType, -1),
        updatePromotionStats(ctx, args.promotionType, 1),
      ]);
    }
    
    return null;
  },
  returns: v.null(),
});

// HIGH-004 FIX: Update totalUsed counter
export const incrementUsage = mutation({
  args: { id: v.id("promotions") },
  handler: async (ctx, args) => {
    const promotion = await ctx.db.get(args.id);
    if (!promotion) {throw new Error("Promotion not found");}
    await ctx.db.patch(args.id, { usedCount: promotion.usedCount + 1 });
    
    // Update totalUsed counter
    await updatePromotionStats(ctx, "totalUsed", 1);
    
    return null;
  },
  returns: v.null(),
});

// HIGH-004 FIX: Update counters khi remove
export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("promotions") },
  handler: async (ctx, args) => {
    const promotion = await ctx.db.get(args.id);
    if (!promotion) {throw new Error("Promotion not found");}

    const usagePreview = await ctx.db
      .query("promotionUsage")
      .withIndex("by_promotion", (q) => q.eq("promotionId", args.id))
      .take(1);
    if (usagePreview.length > 0 && !args.cascade) {
      throw new Error("Khuyến mãi đã có lịch sử sử dụng. Vui lòng xác nhận xóa tất cả.");
    }

    if (args.cascade) {
      const usage = await ctx.db
        .query("promotionUsage")
        .withIndex("by_promotion", (q) => q.eq("promotionId", args.id))
        .collect();
      await Promise.all(usage.map( async (record) => ctx.db.delete(record._id)));
    }
    
    await ctx.db.delete(args.id);
    
    // Update counters
    await Promise.all([
      updatePromotionStats(ctx, "total", -1),
      updatePromotionStats(ctx, promotion.status, -1),
      updatePromotionStats(ctx, promotion.discountType, -1),
      updatePromotionStats(ctx, promotion.promotionType ?? (promotion.code ? "coupon" : "campaign"), -1),
      updatePromotionStats(ctx, "totalUsed", -promotion.usedCount),
    ]);
    
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("promotions") },
  handler: async (ctx, args) => {
    const preview = await ctx.db
      .query("promotionUsage")
      .withIndex("by_promotion", (q) => q.eq("promotionId", args.id))
      .take(10);
    const count = await ctx.db
      .query("promotionUsage")
      .withIndex("by_promotion", (q) => q.eq("promotionId", args.id))
      .take(1001);

    return {
      canDelete: true,
      dependencies: [
        {
          count: Math.min(count.length, 1000),
          hasMore: count.length > 1000,
          label: "Lịch sử sử dụng",
          preview: preview.map((usage) => ({ id: usage._id, name: usage.orderId })),
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

export const reorder = mutation({
  args: { items: v.array(v.object({ id: v.id("promotions"), order: v.number() })) },
  handler: async (ctx, args) => {
    await Promise.all(args.items.map(async (item) => ctx.db.patch(item.id, { order: item.order })));
    return null;
  },
  returns: v.null(),
});

// HIGH-004 FIX: Dùng counter table thay vì fetch ALL
export const count = query({
  args: { status: v.optional(promotionStatus) },
  handler: async (ctx, args) => {
    const key = args.status ?? "total";
    const stats = await ctx.db
      .query("promotionStats")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    return stats?.count ?? 0;
  },
  returns: v.number(),
});

// HIGH-004 FIX: Dùng counter table thay vì fetch ALL
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    // Fetch tất cả stats 1 lần
    const allStats = await ctx.db.query("promotionStats").take(100);
    const statsMap = new Map(allStats.map(s => [s.key, s.count]));

    return {
      activeCount: statsMap.get("Active") ?? 0,
      bundleCount: statsMap.get("bundle") ?? 0,
      campaignCount: statsMap.get("campaign") ?? 0,
      couponCount: statsMap.get("coupon") ?? 0,
      expiredCount: statsMap.get("Expired") ?? 0,
      fixedTypeCount: statsMap.get("fixed") ?? 0,
      flashSaleCount: statsMap.get("flash_sale") ?? 0,
      freeShippingCount: statsMap.get("free_shipping") ?? 0,
      giftCount: statsMap.get("gift") ?? 0,
      buyAGetBCount: statsMap.get("buy_a_get_b") ?? 0,
      buyXGetYCount: statsMap.get("buy_x_get_y") ?? 0,
      loyaltyCount: statsMap.get("loyalty") ?? 0,
      percentTypeCount: statsMap.get("percent") ?? 0,
      scheduledCount: statsMap.get("Scheduled") ?? 0,
      tieredCount: statsMap.get("tiered") ?? 0,
      totalCount: statsMap.get("total") ?? 0,
      totalUsed: statsMap.get("totalUsed") ?? 0,
    };
  },
  returns: v.object({
    activeCount: v.number(),
    bundleCount: v.number(),
    campaignCount: v.number(),
    couponCount: v.number(),
    expiredCount: v.number(),
    fixedTypeCount: v.number(),
    flashSaleCount: v.number(),
    freeShippingCount: v.number(),
    giftCount: v.number(),
    buyAGetBCount: v.number(),
    buyXGetYCount: v.number(),
    loyaltyCount: v.number(),
    percentTypeCount: v.number(),
    scheduledCount: v.number(),
    tieredCount: v.number(),
    totalCount: v.number(),
    totalUsed: v.number(),
  }),
});

const publicVoucherDoc = v.object({
  code: v.string(),
  description: v.optional(v.string()),
  discountType: discountType,
  discountValue: v.optional(v.number()),
  endDate: v.optional(v.number()),
  maxDiscountAmount: v.optional(v.number()),
  name: v.string(),
  thumbnail: v.optional(v.string()),
});

const isPublicPromotion = (promo: Doc<"promotions">, now: number) => {
  if (promo.displayOnPage === false) {return false;}
  if (promo.startDate && now < promo.startDate) {return false;}
  if (promo.endDate && now > promo.endDate) {return false;}
  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {return false;}
  if (promo.budget !== undefined && promo.budgetUsed !== undefined && promo.budgetUsed >= promo.budget) {return false;}
  return true;
};

export const listPublicPromotions = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const promotions = await ctx.db
      .query("promotions")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .take(200);

    return promotions.filter((promo) => isPublicPromotion(promo, now));
  },
  returns: v.array(promotionDoc),
});

export const listPublicVouchers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 4, 8));
    const now = Date.now();
    const promotions = await ctx.db
      .query("promotions")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .take(200);

    return promotions
      .filter((promo) => isPublicPromotion(promo, now))
      .filter((promo) => Boolean(promo.code))
      .slice(0, limit)
      .map((promo) => ({
        code: promo.code!,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        endDate: promo.endDate,
        maxDiscountAmount: promo.maxDiscountAmount,
        name: promo.name,
        thumbnail: promo.thumbnail,
      }));
  },
  returns: v.array(publicVoucherDoc),
});

// Migration: bổ sung promotionType cho data cũ
export const migrateAddPromotionType = mutation({
  args: {},
  handler: async (ctx) => {
    const promotions = await ctx.db.query("promotions").take(500);
    let updated = 0;

    for (const promo of promotions) {
      if (!promo.promotionType) {
        const promotionType = promo.code ? "coupon" : "campaign";
        await ctx.db.patch(promo._id, { promotionType });
        updated++;
      }
    }

    return { updated };
  },
  returns: v.object({ updated: v.number() }),
});

// Migration: bổ sung displayOnPage cho data cũ
export const migrateAddDisplayOnPage = mutation({
  args: {},
  handler: async (ctx) => {
    const promotions = await ctx.db.query("promotions").take(500);
    let updated = 0;

    for (const promo of promotions) {
      if (promo.displayOnPage === undefined) {
        await ctx.db.patch(promo._id, { displayOnPage: true });
        updated++;
      }
    }

    return { updated };
  },
  returns: v.object({ updated: v.number() }),
});

export const recordUsage = mutation({
  args: {
    customerId: v.id("customers"),
    discountAmount: v.number(),
    orderId: v.id("orders"),
    promotionId: v.id("promotions"),
  },
  handler: async (ctx, args) => {
    const promotion = await ctx.db.get(args.promotionId);
    if (!promotion) {throw new Error("Promotion not found");}

    await ctx.db.insert("promotionUsage", {
      customerId: args.customerId,
      discountAmount: args.discountAmount,
      orderId: args.orderId,
      promotionId: args.promotionId,
      usedAt: Date.now(),
    });

    await ctx.db.patch(args.promotionId, {
      budgetUsed: promotion.budgetUsed !== undefined ? promotion.budgetUsed + args.discountAmount : promotion.budgetUsed,
      usedCount: promotion.usedCount + 1,
    });

    await updatePromotionStats(ctx, "totalUsed", 1);

    return null;
  },
  returns: v.null(),
});

export const validateCode = query({
  args: {
    categoryIds: v.optional(v.array(v.id("productCategories"))),
    code: v.string(),
    customerId: v.optional(v.id("customers")),
    orderAmount: v.optional(v.number()),
    productIds: v.optional(v.array(v.id("products"))),
    totalQuantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const promotion = await ctx.db
      .query("promotions")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!promotion) {
      return { discountAmount: 0, message: "Mã voucher không tồn tại", promotion: null, valid: false };
    }

    if (promotion.status !== "Active") {
      return { discountAmount: 0, message: "Mã voucher không còn hiệu lực", promotion: null, valid: false };
    }

    const promotionType = promotion.promotionType ?? "campaign";
    if (promotionType !== "coupon") {
      return { discountAmount: 0, message: "Mã voucher không hợp lệ", promotion: null, valid: false };
    }

    const now = Date.now();
    if (promotion.startDate && now < promotion.startDate) {
      return { discountAmount: 0, message: "Mã voucher chưa đến thời gian sử dụng", promotion: null, valid: false };
    }
    if (promotion.endDate && now > promotion.endDate) {
      return { discountAmount: 0, message: "Mã voucher đã hết hạn", promotion: null, valid: false };
    }

    if (promotion.scheduleType === "recurring") {
      const nowDate = new Date(now);
      if (promotion.recurringDays && promotion.recurringDays.length > 0) {
        const day = nowDate.getDay();
        if (!promotion.recurringDays.includes(day)) {
          return { discountAmount: 0, message: "Chưa đến thời gian khuyến mãi", promotion: null, valid: false };
        }
      }
      if (promotion.recurringHours) {
        const minutes = nowDate.getHours() * 60 + nowDate.getMinutes();
        if (minutes < promotion.recurringHours.from || minutes > promotion.recurringHours.to) {
          return { discountAmount: 0, message: "Chưa đến khung giờ khuyến mãi", promotion: null, valid: false };
        }
      }
    }

    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      return { discountAmount: 0, message: "Mã voucher đã hết lượt sử dụng", promotion: null, valid: false };
    }

    if (promotion.budget !== undefined && promotion.budgetUsed !== undefined && promotion.budgetUsed >= promotion.budget) {
      return { discountAmount: 0, message: "Ngân sách khuyến mãi đã hết", promotion: null, valid: false };
    }

    const orderAmount = args.orderAmount ?? 0;
    if (promotion.minOrderAmount && orderAmount < promotion.minOrderAmount) {
      return { 
        discountAmount: 0, 
        message: `Đơn hàng tối thiểu ${promotion.minOrderAmount.toLocaleString()}đ`, 
        promotion: null, 
        valid: false 
      };
    }

    if (promotion.minQuantity && (args.totalQuantity ?? 0) < promotion.minQuantity) {
      return { discountAmount: 0, message: "Chưa đạt số lượng tối thiểu", promotion: null, valid: false };
    }

    if (promotion.applicableTo && promotion.applicableTo !== "all") {
      const applicableIds = new Set(promotion.applicableIds ?? []);
      const excludeIds = new Set(promotion.excludeIds ?? []);
      const productIds = (args.productIds ?? []).map((id) => id.toString());
      const categoryIds = (args.categoryIds ?? []).map((id) => id.toString());
      const hasExcluded = productIds.some((id) => excludeIds.has(id)) || categoryIds.some((id) => excludeIds.has(id));
      if (hasExcluded) {
        return { discountAmount: 0, message: "Sản phẩm không hợp lệ", promotion: null, valid: false };
      }

      if (promotion.applicableTo === "products" && applicableIds.size > 0) {
        const matched = productIds.some((id) => applicableIds.has(id));
        if (!matched) {
          return { discountAmount: 0, message: "Không áp dụng cho sản phẩm này", promotion: null, valid: false };
        }
      }

      if (promotion.applicableTo === "categories" && applicableIds.size > 0) {
        const matched = categoryIds.some((id) => applicableIds.has(id));
        if (!matched) {
          return { discountAmount: 0, message: "Không áp dụng cho danh mục này", promotion: null, valid: false };
        }
      }
    }

    if (promotion.customerType && promotion.customerType !== "all") {
      if (!args.customerId) {
        return { discountAmount: 0, message: "Khuyến mãi chỉ áp dụng cho khách đã đăng nhập", promotion: null, valid: false };
      }
      const customer = await ctx.db.get(args.customerId);
      if (!customer) {
        return { discountAmount: 0, message: "Khách hàng không hợp lệ", promotion: null, valid: false };
      }
      if (promotion.customerType === "new" && customer.ordersCount > 0) {
        return { discountAmount: 0, message: "Chỉ áp dụng cho khách mới", promotion: null, valid: false };
      }
      if (promotion.customerType === "returning" && customer.ordersCount === 0) {
        return { discountAmount: 0, message: "Chỉ áp dụng cho khách quay lại", promotion: null, valid: false };
      }
      if (promotion.customerType === "vip" && customer.totalSpent < 1) {
        return { discountAmount: 0, message: "Chỉ áp dụng cho khách VIP", promotion: null, valid: false };
      }
      if (promotion.minOrderHistory && customer.ordersCount < promotion.minOrderHistory) {
        return { discountAmount: 0, message: "Chưa đủ số đơn tối thiểu", promotion: null, valid: false };
      }
      if (promotion.minTotalSpent && customer.totalSpent < promotion.minTotalSpent) {
        return { discountAmount: 0, message: "Chưa đủ tổng chi tiêu", promotion: null, valid: false };
      }
    }

    if (promotion.usagePerCustomer) {
      if (!args.customerId) {
        return { discountAmount: 0, message: "Khuyến mãi yêu cầu đăng nhập", promotion: null, valid: false };
      }
      const usage = await ctx.db
        .query("promotionUsage")
        .withIndex("by_customer_promotion", (q) =>
          q.eq("customerId", args.customerId!).eq("promotionId", promotion._id)
        )
        .take(promotion.usagePerCustomer + 1);
      if (usage.length >= promotion.usagePerCustomer) {
        return { discountAmount: 0, message: "Bạn đã dùng hết lượt khuyến mãi", promotion: null, valid: false };
      }
    }

    let discountAmount = 0;
    if (promotion.discountType === "percent") {
      const discountValue = promotion.discountValue ?? 0;
      discountAmount = Math.round(orderAmount * discountValue / 100);
      if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
        discountAmount = promotion.maxDiscountAmount;
      }
    } else if (promotion.discountType === "fixed") {
      discountAmount = promotion.discountValue ?? 0;
    } else {
      return { discountAmount: 0, message: "Loại giảm giá chưa hỗ trợ", promotion: null, valid: false };
    }

    return { discountAmount, message: "Áp dụng thành công", promotion, valid: true };
  },
  returns: v.object({
    discountAmount: v.number(),
    message: v.string(),
    promotion: v.union(promotionDoc, v.null()),
    valid: v.boolean(),
  }),
});
