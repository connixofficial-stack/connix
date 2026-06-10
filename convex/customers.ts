import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { customerStatus } from "./lib/validators";
import type { Doc } from "./_generated/dataModel";

const customerDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("customers"),
  address: v.optional(v.string()),
  avatar: v.optional(v.string()),
  city: v.optional(v.string()),
  email: v.string(),
  name: v.string(),
  notes: v.optional(v.string()),
  ordersCount: v.number(),
  phone: v.string(),
  status: customerStatus,
  totalSpent: v.number(),
  addressFormat: v.optional(v.union(v.literal("text"), v.literal("2-level"), v.literal("3-level"))),
  addressDetail: v.optional(v.string()),
  provinceCode: v.optional(v.string()),
  provinceName: v.optional(v.string()),
  districtCode: v.optional(v.string()),
  districtName: v.optional(v.string()),
  wardCode: v.optional(v.string()),
  wardName: v.optional(v.string()),
});

const sanitizeCustomer = (customer: Doc<"customers">) => {
  const { passwordHash, ...safeCustomer } = customer;
  void passwordHash;
  return safeCustomer;
};

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const result = await ctx.db.query("customers").paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map(sanitizeCustomer),
    };
  },
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(customerDoc),
  }),
});

// Limited list for admin (max 100 items - use pagination for more)
export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxLimit = Math.min(args.limit ?? 100, 100);
    const customers = await ctx.db.query("customers").order("desc").take(maxLimit);
    return customers.map(sanitizeCustomer);
  },
  returns: v.array(customerDoc),
});

export const listAdminWithOffset = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(customerStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 50, 1000);

    let customers: Doc<"customers">[] = [];
    if (args.status) {
      customers = await ctx.db
        .query("customers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else {
      customers = await ctx.db.query("customers").order("desc").take(fetchLimit);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      customers = customers.filter((customer) =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.toLowerCase().includes(searchLower)
      );
    }

    return customers.slice(offset, offset + limit).map(sanitizeCustomer);
  },
  returns: v.array(customerDoc),
});

export const countAdmin = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(customerStatus),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    const fetchLimit = limit + 1;

    let customers: Doc<"customers">[] = [];
    if (args.status) {
      customers = await ctx.db
        .query("customers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(fetchLimit);
    } else {
      customers = await ctx.db.query("customers").take(fetchLimit);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      customers = customers.filter((customer) =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.toLowerCase().includes(searchLower)
      );
    }

    return { count: Math.min(customers.length, limit), hasMore: customers.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(customerStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    const fetchLimit = limit + 1;

    let customers: Doc<"customers">[] = [];
    if (args.status) {
      customers = await ctx.db
        .query("customers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(fetchLimit);
    } else {
      customers = await ctx.db.query("customers").take(fetchLimit);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      customers = customers.filter((customer) =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = customers.length > limit;
    return { ids: customers.slice(0, limit).map((customer) => customer._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("customers")), hasMore: v.boolean() }),
});

export const getById = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.id);
    return customer ? sanitizeCustomer(customer) : null;
  },
  returns: v.union(customerDoc, v.null()),
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    return customer ? sanitizeCustomer(customer) : null;
  },
  returns: v.union(customerDoc, v.null()),
});

export const getByStatus = query({
  args: { paginationOpts: paginationOptsValidator, status: customerStatus },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("customers")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map(sanitizeCustomer),
    };
  },
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(customerDoc),
  }),
});

export const getTopSpenders = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("customers")
      .withIndex("by_status_totalSpent", (q) => q.eq("status", "Active"))
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map(sanitizeCustomer),
    };
  },
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(customerDoc),
  }),
});

export const getByCity = query({
  args: { city: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("customers")
      .withIndex("by_city_status", (q) => q.eq("city", args.city))
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map(sanitizeCustomer),
    };
  },
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(customerDoc),
  }),
});

export const create = mutation({
  args: {
    address: v.optional(v.string()),
    avatar: v.optional(v.string()),
    city: v.optional(v.string()),
    email: v.string(),
    name: v.string(),
    notes: v.optional(v.string()),
    phone: v.string(),
    status: v.optional(customerStatus),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (existing) {throw new Error("Email already exists");}
    return  ctx.db.insert("customers", {
      ...args,
      status: args.status ?? "Active",
      ordersCount: 0,
      totalSpent: 0,
    });
  },
  returns: v.id("customers"),
});

export const update = mutation({
  args: {
    address: v.optional(v.string()),
    avatar: v.optional(v.string()),
    city: v.optional(v.string()),
    email: v.optional(v.string()),
    id: v.id("customers"),
    name: v.optional(v.string()),
    notes: v.optional(v.string()),
    phone: v.optional(v.string()),
    status: v.optional(customerStatus),
    addressFormat: v.optional(v.union(v.literal("text"), v.literal("2-level"), v.literal("3-level"))),
    addressDetail: v.optional(v.string()),
    provinceCode: v.optional(v.string()),
    provinceName: v.optional(v.string()),
    districtCode: v.optional(v.string()),
    districtName: v.optional(v.string()),
    wardCode: v.optional(v.string()),
    wardName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const customer = await ctx.db.get(id);
    if (!customer) {throw new Error("Customer not found");}

    // CUST-006 FIX: Check email uniqueness when updating
    if (updates.email && updates.email !== customer.email) {
      const existing = await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", updates.email!))
        .unique();
      if (existing) {
        throw new Error("Email đã được sử dụng bởi khách hàng khác");
      }
    }

    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

export const updateStats = mutation({
  args: {
    addOrdersCount: v.optional(v.number()),
    addTotalSpent: v.optional(v.number()),
    id: v.id("customers"),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.id);
    if (!customer) {throw new Error("Customer not found");}
    await ctx.db.patch(args.id, {
      ordersCount: customer.ordersCount + (args.addOrdersCount ?? 0),
      totalSpent: customer.totalSpent + (args.addTotalSpent ?? 0),
    });
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("customers") },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.id);
    if (!customer) {throw new Error("Customer not found");}

    const [orders, carts, wishlistItems, comments] = await Promise.all([
      ctx.db.query("orders").withIndex("by_customer", (q) => q.eq("customerId", args.id)).collect(),
      ctx.db.query("carts").withIndex("by_customer", (q) => q.eq("customerId", args.id)).collect(),
      ctx.db.query("wishlist").withIndex("by_customer", (q) => q.eq("customerId", args.id)).collect(),
      ctx.db.query("comments").withIndex("by_customer", (q) => q.eq("customerId", args.id)).collect(),
    ]);

    if (!args.cascade && (orders.length > 0 || carts.length > 0 || wishlistItems.length > 0 || comments.length > 0)) {
      throw new Error("Khách hàng có dữ liệu liên quan. Vui lòng xác nhận xóa tất cả.");
    }

    if (args.cascade) {
      await Promise.all([
        ...orders.map( async order => ctx.db.delete(order._id)),
        ...carts.map( async cart => ctx.db.delete(cart._id)),
        ...wishlistItems.map( async item => ctx.db.delete(item._id)),
        ...comments.map( async comment => ctx.db.delete(comment._id)),
      ]);
    }

    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    const [ordersPreview, ordersCount, cartsCount, wishlistCount, commentsCount] = await Promise.all([
      ctx.db.query("orders").withIndex("by_customer", (q) => q.eq("customerId", args.id)).take(10),
      ctx.db.query("orders").withIndex("by_customer", (q) => q.eq("customerId", args.id)).take(1001),
      ctx.db.query("carts").withIndex("by_customer", (q) => q.eq("customerId", args.id)).take(1001),
      ctx.db.query("wishlist").withIndex("by_customer", (q) => q.eq("customerId", args.id)).take(1001),
      ctx.db.query("comments").withIndex("by_customer", (q) => q.eq("customerId", args.id)).take(1001),
    ]);

    return {
      canDelete: true,
      dependencies: [
        {
          count: Math.min(ordersCount.length, 1000),
          hasMore: ordersCount.length > 1000,
          label: "Đơn hàng",
          preview: ordersPreview.map((order) => ({ id: order._id, name: order.orderNumber })),
        },
        {
          count: Math.min(cartsCount.length, 1000),
          hasMore: cartsCount.length > 1000,
          label: "Giỏ hàng",
          preview: [],
        },
        {
          count: Math.min(wishlistCount.length, 1000),
          hasMore: wishlistCount.length > 1000,
          label: "Wishlist",
          preview: [],
        },
        {
          count: Math.min(commentsCount.length, 1000),
          hasMore: commentsCount.length > 1000,
          label: "Bình luận",
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

// Efficient count using take() instead of collect()
export const count = query({
  args: { status: v.optional(customerStatus) },
  handler: async (ctx, args) => {
    const limit = 1000;
    const query = args.status
      ? ctx.db.query("customers").withIndex("by_status", (q) => q.eq("status", args.status!))
      : ctx.db.query("customers");
    
    const items = await query.take(limit + 1);
    return {
      count: Math.min(items.length, limit),
      hasMore: items.length > limit,
    };
  },
  returns: v.object({
    count: v.number(),
    hasMore: v.boolean(),
  }),
});

// CUST-003 FIX: Get stats using parallel indexed queries instead of fetch all
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const countLimit = 1001;
    
    // Parallel fetch with indexed queries
    const [activeCustomers, inactiveCustomers] = await Promise.all([
      ctx.db.query("customers").withIndex("by_status", (q) => q.eq("status", "Active")).take(countLimit),
      ctx.db.query("customers").withIndex("by_status", (q) => q.eq("status", "Inactive")).take(countLimit),
    ]);

    const activeCount = Math.min(activeCustomers.length, 1000);
    const inactiveCount = Math.min(inactiveCustomers.length, 1000);
    const totalCount = activeCount + inactiveCount;

    // Calculate totals from fetched data
    let totalSpent = 0;
    let totalOrders = 0;
    for (const c of activeCustomers) {
      totalSpent += c.totalSpent;
      totalOrders += c.ordersCount;
    }
    for (const c of inactiveCustomers) {
      totalSpent += c.totalSpent;
      totalOrders += c.ordersCount;
    }

    return {
      activeCount,
      avgOrderValue: totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0,
      inactiveCount,
      totalCount,
      totalOrders,
      totalSpent,
    };
  },
  returns: v.object({
    activeCount: v.number(),
    avgOrderValue: v.number(),
    inactiveCount: v.number(),
    totalCount: v.number(),
    totalOrders: v.number(),
    totalSpent: v.number(),
  }),
});

export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const normalizedPhone = args.phone.trim();
    // No by_phone index in schema → scan with limit 500 then filter
    const customers = await ctx.db.query('customers').take(500);
    const customer = customers.find((c) => c.phone.trim() === normalizedPhone) ?? null;
    return customer ? sanitizeCustomer(customer) : null;
  },
  returns: v.union(customerDoc, v.null()),
});

// CUST-004 FIX: Get unique cities - optimized with indexed query
export const getCities = query({
  args: {},
  handler: async (ctx) => {
    // Use indexed query by city to get distinct cities more efficiently
    // Fetch customers with city field, limited to reasonable amount
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_city_status")
      .take(500);
    
    const cities = new Set<string>();
    for (const c of customers) {
      if (c.city) {cities.add(c.city);}
    }
    return [...cities].sort();
  },
  returns: v.array(v.string()),
});
