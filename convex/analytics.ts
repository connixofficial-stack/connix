import { query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { normalizeOrderStatusPreset, parseOrderStatuses, type OrderStatusConfig } from "../lib/orders/statuses";

// Helper: Calculate period timestamps
function getPeriodTimestamps(period: string) {
  const now = Date.now();
  const periodMs = {
    "1y": 365 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
  }[period] ?? 30 * 24 * 60 * 60 * 1000;
  
  return {
    now,
    periodMs,
    prevStartDate: now - periodMs * 2,
    startDate: now - periodMs,
  };
}

async function getOrderStatusSettings(ctx: QueryCtx) {
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

const getRevenueStatuses = (statuses: OrderStatusConfig[]) => {
  const revenueStatuses = statuses.filter(
    (status) => status.isFinal && !status.key.toLowerCase().includes("cancel") && !status.key.toLowerCase().includes("refund")
  );
  return revenueStatuses.length > 0 ? revenueStatuses : statuses;
};

// Get revenue statistics from orders - OPTIMIZED: filter by status index + limit
export const getRevenueStats = query({
  args: {
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period ?? "30d";
    const { startDate, prevStartDate } = getPeriodTimestamps(period);
    const { statuses } = await getOrderStatusSettings(ctx);
    const revenueStatuses = getRevenueStatuses(statuses);
    
    // OPTIMIZED: Query by status index instead of fetching ALL
    // Fetch orders for each valid status with limit (max 1000 per status)
    const ordersByStatus = await Promise.all(
      revenueStatuses.map( async status =>
        ctx.db.query("orders")
          .withIndex("by_status", q => q.eq("status", status.key))
          .take(1000)
      )
    );
    const validOrders = ordersByStatus.flat();
    
    // Filter by period client-side (but on much smaller dataset)
    const currentOrders = validOrders.filter(o => o._creationTime >= startDate);
    const prevOrders = validOrders.filter(o => 
      o._creationTime >= prevStartDate && o._creationTime < startDate
    );
    
    const totalRevenue = currentOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = currentOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    const prevRevenue = prevOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const prevOrdersCount = prevOrders.length;
    
    const revenueChange = prevRevenue > 0 
      ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) 
      : (totalRevenue > 0 ? 100 : 0);
    const ordersChange = prevOrdersCount > 0 
      ? Math.round(((totalOrders - prevOrdersCount) / prevOrdersCount) * 100) 
      : (totalOrders > 0 ? 100 : 0);
    
    return {
      avgOrderValue,
      ordersChange,
      revenueChange,
      totalOrders,
      totalRevenue,
    };
  },
  returns: v.object({
    avgOrderValue: v.number(),
    ordersChange: v.number(),
    revenueChange: v.number(),
    totalOrders: v.number(),
    totalRevenue: v.number(),
  }),
});

// Get customer statistics - OPTIMIZED: use status index
export const getCustomerStats = query({
  args: {
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period ?? "30d";
    const { startDate, prevStartDate } = getPeriodTimestamps(period);
    
    // OPTIMIZED: Query by status index with limits
    const [activeCustomers, inactiveCustomers] = await Promise.all([
      ctx.db.query("customers")
        .withIndex("by_status", q => q.eq("status", "Active"))
        .take(5000),
      ctx.db.query("customers")
        .withIndex("by_status", q => q.eq("status", "Inactive"))
        .take(5000),
    ]);
    
    const allCustomers = [...activeCustomers, ...inactiveCustomers];
    const totalCustomers = allCustomers.length;
    
    // New customers in current period
    const newCustomers = allCustomers.filter(c => c._creationTime >= startDate).length;
    const prevNewCustomers = allCustomers.filter(c => 
      c._creationTime >= prevStartDate && c._creationTime < startDate
    ).length;
    
    const newCustomersChange = prevNewCustomers > 0
      ? Math.round(((newCustomers - prevNewCustomers) / prevNewCustomers) * 100)
      : (newCustomers > 0 ? 100 : 0);
    
    return {
      activeCustomers: activeCustomers.length,
      newCustomers,
      newCustomersChange,
      totalCustomers,
    };
  },
  returns: v.object({
    activeCustomers: v.number(),
    newCustomers: v.number(),
    newCustomersChange: v.number(),
    totalCustomers: v.number(),
  }),
});

// Get top selling products
export const getTopProducts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    
    const products = await ctx.db
      .query("products")
      .withIndex("by_status_sales")
      .order("desc")
      .collect();
    
    // Filter active products and sort by sales
    const activeProducts = products
      .filter((product: Doc<"products">) => product.status === "Active")
      .sort((a: Doc<"products">, b: Doc<"products">) => b.sales - a.sales)
      .slice(0, limit);
    
    return activeProducts.map((product: Doc<"products">) => ({
      id: product._id,
      image: product.image,
      name: product.name,
      revenue: product.sales * (product.salePrice ?? product.price),
      sales: product.sales,
    }));
  },
  returns: v.array(v.object({
    id: v.string(),
    image: v.optional(v.string()),
    name: v.string(),
    revenue: v.number(),
    sales: v.number(),
  })),
});

// Get low stock products
export const getLowStockProducts = query({
  args: {
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const threshold = args.threshold ?? 10;
    const limit = args.limit ?? 10;
    
    const products = await ctx.db
      .query("products")
      .collect();
    
    const lowStock = products
      .filter((product: Doc<"products">) => product.status === "Active" && product.stock <= threshold)
      .sort((a: Doc<"products">, b: Doc<"products">) => a.stock - b.stock)
      .slice(0, limit);
    
    return lowStock.map((product: Doc<"products">) => ({
      id: product._id,
      name: product.name,
      sku: product.sku,
      stock: product.stock,
    }));
  },
  returns: v.array(v.object({
    id: v.string(),
    name: v.string(),
    sku: v.string(),
    stock: v.number(),
  })),
});

// Get revenue chart data (daily/weekly aggregation) - OPTIMIZED: filter by status index
export const getRevenueChartData = query({
  args: {
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period ?? "30d";
    const { now, startDate } = getPeriodTimestamps(period);
    const { statuses } = await getOrderStatusSettings(ctx);
    const revenueStatuses = getRevenueStatuses(statuses);
    
    // OPTIMIZED: Query by status index with limit
    const ordersByStatus = await Promise.all(
      revenueStatuses.map( async status =>
        ctx.db.query("orders")
          .withIndex("by_status", q => q.eq("status", status.key))
          .take(2000)
      )
    );
    const filteredOrders = ordersByStatus.flat().filter(o => o._creationTime >= startDate);
    
    // Group by date
    const dailyData: Record<string, { revenue: number; orders: number }> = {};
    
    // Determine grouping (daily for <=30d, weekly for >30d)
    const isWeekly = period === "90d" || period === "1y";
    
    for (const order of filteredOrders) {
      const date = new Date(order._creationTime);
      let key: string;
      
      if (isWeekly) {
        // Get week start (Monday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + 1);
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = date.toISOString().split('T')[0];
      }
      
      if (!dailyData[key]) {
        dailyData[key] = { orders: 0, revenue: 0 };
      }
      dailyData[key].revenue += order.totalAmount;
      dailyData[key].orders += 1;
    }
    
    // Fill missing dates and sort
    const result: { date: string; revenue: number; orders: number }[] = [];
    const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 13 : 52; // Weeks for longer periods
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      if (isWeekly) {
        d.setDate(d.getDate() - (i * 7));
        d.setDate(d.getDate() - d.getDay() + 1);
      } else {
        d.setDate(d.getDate() - i);
      }
      const key = d.toISOString().split('T')[0];
      const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
      
      result.push({
        date: displayDate,
        orders: dailyData[key]?.orders || 0,
        revenue: dailyData[key]?.revenue || 0,
      });
    }
    
    return result;
  },
  returns: v.array(v.object({
    date: v.string(),
    orders: v.number(),
    revenue: v.number(),
  })),
});

// Get order status distribution - OPTIMIZED: query by each status index
export const getOrderStatusDistribution = query({
  args: {},
  handler: async (ctx) => {
    const { statuses } = await getOrderStatusSettings(ctx);
    if (statuses.length === 0) {
      return [];
    }
    
    // OPTIMIZED: Query count by status index (instead of fetching ALL)
    const statusCounts = await Promise.all(
      statuses.map(async status => {
        const orders = await ctx.db.query("orders")
          .withIndex("by_status", q => q.eq("status", status.key))
          .take(10_000);
        return { count: orders.length, status: status.key };
      })
    );
    
    const total = statusCounts.reduce((sum, s) => sum + s.count, 0);
    if (total === 0) {return [];}
    
    return statusCounts
      .filter(s => s.count > 0)
      .map(({ status, count }) => ({
        count,
        percentage: Math.round((count / total) * 100),
        status,
      }));
  },
  returns: v.array(v.object({
    count: v.number(),
    percentage: v.number(),
    status: v.string(),
  })),
});

// Get summary stats (for dashboard cards) - OPTIMIZED: parallel queries with indexes
export const getSummaryStats = query({
  args: {
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period ?? "30d";
    const { startDate, prevStartDate } = getPeriodTimestamps(period);
    const { statuses } = await getOrderStatusSettings(ctx);
    const summaryStatuses = statuses.filter(
      (status) => !status.allowCancel && !status.key.toLowerCase().includes("cancel")
    );
    const resolvedSummaryStatuses = summaryStatuses.length > 0 ? summaryStatuses : statuses;
    
    // OPTIMIZED: Parallel queries with indexes
    const [
      ordersByStatus,
      activeCustomers,
      inactiveCustomers,
      activeProducts,
    ] = await Promise.all([
      Promise.all(
        resolvedSummaryStatuses.map((status) =>
          ctx.db.query("orders").withIndex("by_status", q => q.eq("status", status.key)).take(2000)
        )
      ),
      ctx.db.query("customers").withIndex("by_status", q => q.eq("status", "Active")).take(5000),
      ctx.db.query("customers").withIndex("by_status", q => q.eq("status", "Inactive")).take(5000),
      ctx.db.query("products").withIndex("by_status_stock", q => q.eq("status", "Active")).take(5000),
    ]);
    
    const validOrders = ordersByStatus.flat();
    const currentOrders = validOrders.filter(o => o._creationTime >= startDate);
    const prevOrders = validOrders.filter(o => 
      o._creationTime >= prevStartDate && o._creationTime < startDate
    );
    
    const currentRevenue = currentOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const prevRevenue = prevOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    const revenueChange = prevRevenue > 0 
      ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)
      : (currentRevenue > 0 ? 100 : 0);
    const ordersChange = prevOrders.length > 0
      ? Math.round(((currentOrders.length - prevOrders.length) / prevOrders.length) * 100)
      : (currentOrders.length > 0 ? 100 : 0);
    
    // Customers
    const allCustomers = [...activeCustomers, ...inactiveCustomers];
    const newCustomers = allCustomers.filter(c => c._creationTime >= startDate).length;
    const prevNewCustomers = allCustomers.filter(c => 
      c._creationTime >= prevStartDate && c._creationTime < startDate
    ).length;
    
    const customersChange = prevNewCustomers > 0
      ? Math.round(((newCustomers - prevNewCustomers) / prevNewCustomers) * 100)
      : (newCustomers > 0 ? 100 : 0);
    
    // Products - count low stock
    const lowStockCount = activeProducts.filter(p => p.stock <= 10).length;
    
    return {
      customers: { change: customersChange, value: newCustomers },
      orders: { change: ordersChange, value: currentOrders.length },
      products: { lowStock: lowStockCount, value: activeProducts.length },
      revenue: { change: revenueChange, value: currentRevenue },
    };
  },
  returns: v.object({
    customers: v.object({ change: v.number(), value: v.number() }),
    orders: v.object({ change: v.number(), value: v.number() }),
    products: v.object({ lowStock: v.number(), value: v.number() }),
    revenue: v.object({ change: v.number(), value: v.number() }),
  }),
});
