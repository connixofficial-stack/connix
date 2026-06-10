import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { userStatus } from "./lib/validators";
import { requireAdminPermission } from "./lib/permissions";
import { hashPassword } from "./lib/password";

const userDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("users"),
  avatar: v.optional(v.string()),
  email: v.string(),
  lastLogin: v.optional(v.number()),
  name: v.string(),
  phone: v.optional(v.string()),
  roleId: v.id("roles"),
  status: userStatus,
});

const sanitizeUser = (user: Doc<"users">) => {
  const { passwordHash, ...safeUser } = user;
  void passwordHash;
  return safeUser;
};

async function assertCanModifySuperAdmin(
  ctx: MutationCtx,
  actorIsSuperAdmin: boolean,
  targetRoleId: Doc<"roles">["_id"]
) {
  const role = await ctx.db.get(targetRoleId);
  if (role?.isSuperAdmin && !actorIsSuperAdmin) {
    throw new Error("Không thể sửa/xóa tài khoản Super Admin");
  }
}

async function assertNotSuperAdmin(ctx: MutationCtx, targetRoleId: Doc<"roles">["_id"]) {
  const role = await ctx.db.get(targetRoleId);
  if (role?.isSuperAdmin) {
    throw new Error("Không thể xóa tài khoản Super Admin");
  }
}

async function resolveDefaultRoleId(ctx: MutationCtx): Promise<Doc<"roles">["_id"]> {
  const adminRole = await ctx.db
    .query("roles")
    .withIndex("by_name", (q) => q.eq("name", "Admin"))
    .unique();
  if (adminRole) {
    return adminRole._id;
  }
  const roles = await ctx.db.query("roles").take(100);
  const fallback = roles.find((role) => !role.isSuperAdmin);
  if (!fallback) {
    throw new Error("Không tìm thấy vai trò mặc định để gán người dùng");
  }
  return fallback._id;
}

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const result = await ctx.db.query("users").paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map(sanitizeUser),
    };
  },
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(userDoc),
  }),
});

// USR-003 FIX: Thêm limit để tránh memory overflow
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(500);
    return users.map(sanitizeUser);
  },
  returns: v.array(userDoc),
});

export const listAdminWithOffset = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    roleId: v.optional(v.id("roles")),
    search: v.optional(v.string()),
    status: v.optional(userStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 50, 1000);

    let users: Doc<"users">[] = [];
    if (args.roleId && args.status) {
      users = await ctx.db
        .query("users")
        .withIndex("by_role_status", (q) => q.eq("roleId", args.roleId!).eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else if (args.roleId) {
      users = await ctx.db
        .query("users")
        .withIndex("by_role_status", (q) => q.eq("roleId", args.roleId!))
        .order("desc")
        .take(fetchLimit);
    } else if (args.status) {
      users = await ctx.db
        .query("users")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else {
      users = await ctx.db.query("users").order("desc").take(fetchLimit);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      users = users.filter((user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.phone?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    return users.slice(offset, offset + limit).map(sanitizeUser);
  },
  returns: v.array(userDoc),
});

export const listAdminExport = query({
  args: {
    limit: v.optional(v.number()),
    roleId: v.optional(v.id("roles")),
    search: v.optional(v.string()),
    status: v.optional(userStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    let users: Doc<"users">[] = [];
    if (args.roleId && args.status) {
      users = await ctx.db
        .query("users")
        .withIndex("by_role_status", (q) => q.eq("roleId", args.roleId!).eq("status", args.status!))
        .order("desc")
        .take(limit);
    } else if (args.roleId) {
      users = await ctx.db
        .query("users")
        .withIndex("by_role_status", (q) => q.eq("roleId", args.roleId!))
        .order("desc")
        .take(limit);
    } else if (args.status) {
      users = await ctx.db
        .query("users")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    } else {
      users = await ctx.db.query("users").order("desc").take(limit);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      users = users.filter((user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.phone?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    return users.slice(0, limit).map(sanitizeUser);
  },
  returns: v.array(userDoc),
});

export const countAdmin = query({
  args: {
    roleId: v.optional(v.id("roles")),
    search: v.optional(v.string()),
    status: v.optional(userStatus),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    const fetchLimit = limit + 1;

    let users: Doc<"users">[] = [];
    if (args.roleId && args.status) {
      users = await ctx.db
        .query("users")
        .withIndex("by_role_status", (q) => q.eq("roleId", args.roleId!).eq("status", args.status!))
        .take(fetchLimit);
    } else if (args.roleId) {
      users = await ctx.db
        .query("users")
        .withIndex("by_role_status", (q) => q.eq("roleId", args.roleId!))
        .take(fetchLimit);
    } else if (args.status) {
      users = await ctx.db
        .query("users")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(fetchLimit);
    } else {
      users = await ctx.db.query("users").take(fetchLimit);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      users = users.filter((user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.phone?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    return { count: Math.min(users.length, limit), hasMore: users.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    excludeSuperAdmin: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    roleId: v.optional(v.id("roles")),
    search: v.optional(v.string()),
    status: v.optional(userStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    const fetchLimit = limit + 1;

    const superAdminRoles = args.excludeSuperAdmin
      ? await ctx.db
        .query("roles")
        .filter((q) => q.eq(q.field("isSuperAdmin"), true))
        .collect()
      : [];
    const superAdminRoleIds = new Set(superAdminRoles.map(role => role._id));

    let users: Doc<"users">[] = [];
    if (args.roleId && args.status) {
      users = await ctx.db
        .query("users")
        .withIndex("by_role_status", (q) => q.eq("roleId", args.roleId!).eq("status", args.status!))
        .take(fetchLimit);
    } else if (args.roleId) {
      users = await ctx.db
        .query("users")
        .withIndex("by_role_status", (q) => q.eq("roleId", args.roleId!))
        .take(fetchLimit);
    } else if (args.status) {
      users = await ctx.db
        .query("users")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(fetchLimit);
    } else {
      users = await ctx.db.query("users").take(fetchLimit);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      users = users.filter((user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.phone?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    if (args.excludeSuperAdmin) {
      users = users.filter((user) => !superAdminRoleIds.has(user.roleId));
    }

    const hasMore = users.length > limit;
    return { ids: users.slice(0, limit).map((user) => user._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("users")), hasMore: v.boolean() }),
});

// USR-001 FIX: Dùng counter table thay vì fetch ALL
export const count = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db
      .query("userStats")
      .withIndex("by_key", (q) => q.eq("key", "total"))
      .unique();
    return stats?.count ?? 0;
  },
  returns: v.number(),
});

// Helper: Get count by status from counter table
export const countByStatus = query({
  args: { status: userStatus },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query("userStats")
      .withIndex("by_key", (q) => q.eq("key", args.status))
      .unique();
    return stats?.count ?? 0;
  },
  returns: v.number(),
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    return user ? sanitizeUser(user) : null;
  },
  returns: v.union(userDoc, v.null()),
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    return user ? sanitizeUser(user) : null;
  },
  returns: v.union(userDoc, v.null()),
});

export const getByRoleAndStatus = query({
  args: {
    paginationOpts: paginationOptsValidator,
    roleId: v.id("roles"),
    status: userStatus,
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("users")
      .withIndex("by_role_status", (q) =>
        q.eq("roleId", args.roleId).eq("status", args.status)
      )
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map(sanitizeUser),
    };
  },
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(userDoc),
  }),
});

export const getByStatus = query({
  args: { paginationOpts: paginationOptsValidator, status: userStatus },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map(sanitizeUser),
    };
  },
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(userDoc),
  }),
});

// Helper function to update userStats counter
export async function updateUserStats(
  ctx: MutationCtx,
  key: string,
  delta: number
) {
  const stats = await ctx.db
    .query("userStats")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (stats) {
    await ctx.db.patch(stats._id, { count: Math.max(0, stats.count + delta) });
  } else {
    await ctx.db.insert("userStats", { count: Math.max(0, delta), key });
  }
}

export const create = mutation({
  args: {
    avatar: v.optional(v.string()),
    email: v.string(),
    name: v.string(),
    password: v.string(),
    phone: v.optional(v.string()),
    roleId: v.optional(v.id("roles")),
    status: userStatus,
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const { permissionMode, role: actorRole } = await requireAdminPermission(ctx, args.token, "users", "create");
    const rolesModule = await ctx.db
      .query("adminModules")
      .withIndex("by_key", (q) => q.eq("key", "roles"))
      .unique();
    const rolesEnabled = rolesModule?.enabled ?? false;
    let resolvedRoleId = args.roleId;
    if (!rolesEnabled) {
      if (!resolvedRoleId) {
        resolvedRoleId = await resolveDefaultRoleId(ctx);
      }
    } else if (!resolvedRoleId) {
      throw new Error("Vui lòng chọn vai trò");
    }
    if (permissionMode === "simple_full_admin" && !actorRole?.isSuperAdmin) {
      await assertCanModifySuperAdmin(ctx, false, resolvedRoleId);
    }
    if (args.password.length < 6) {
      throw new Error("Mật khẩu tối thiểu 6 ký tự");
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (existing) {
      throw new Error("Email already exists");
    }
    const { password, token, ...payload } = args;
    void token;
    const passwordHash = await hashPassword(password);
    const userId = await ctx.db.insert("users", { ...payload, passwordHash, roleId: resolvedRoleId });
    
    // Update counters
    await Promise.all([
      updateUserStats(ctx, "total", 1),
      updateUserStats(ctx, args.status, 1),
    ]);
    
    return userId;
  },
  returns: v.id("users"),
});

export const update = mutation({
  args: {
    avatar: v.optional(v.string()),
    email: v.optional(v.string()),
    id: v.id("users"),
    lastLogin: v.optional(v.number()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    roleId: v.optional(v.id("roles")),
    status: v.optional(userStatus),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const { permissionMode, role: actorRole } = await requireAdminPermission(ctx, args.token, "users", "edit");
    const { id, token, ...updates } = args;
    void token;
    const user = await ctx.db.get(id);
    if (!user) {throw new Error("User not found");}
    await assertCanModifySuperAdmin(ctx, Boolean(actorRole?.isSuperAdmin), user.roleId);
    if (permissionMode === "simple_full_admin" && updates.roleId) {
      await assertCanModifySuperAdmin(ctx, Boolean(actorRole?.isSuperAdmin), updates.roleId);
    }
    
    // Update status counters if status changed
    if (updates.status && updates.status !== user.status) {
      await Promise.all([
        updateUserStats(ctx, user.status, -1),
        updateUserStats(ctx, updates.status, 1),
      ]);
    }
    
    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

export const changePassword = mutation({
  args: {
    id: v.id("users"),
    password: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const { role: actorRole } = await requireAdminPermission(ctx, args.token, "users", "edit");
    if (args.password.length < 6) {
      throw new Error("Mật khẩu tối thiểu 6 ký tự");
    }
    const user = await ctx.db.get(args.id);
    if (!user) {throw new Error("User not found");}
    await assertCanModifySuperAdmin(ctx, Boolean(actorRole?.isSuperAdmin), user.roleId);
    const passwordHash = await hashPassword(args.password);
    await ctx.db.patch(args.id, { passwordHash });
    return null;
  },
  returns: v.null(),
});

export const bulkStatusChange = mutation({
  args: {
    ids: v.array(v.id("users")),
    status: userStatus,
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.token, "users", "edit");
    const users = await Promise.all(args.ids.map( async (id) => ctx.db.get(id)));
    const validUsers = users.filter((u): u is NonNullable<typeof u> => u !== null);
    const targetUsers = validUsers.filter((u) => u.status !== args.status);
    if (targetUsers.length === 0) {
      return { updated: 0 };
    }

    const statusCounts = targetUsers.reduce<Record<string, number>>((acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {});

    await Promise.all(targetUsers.map( async (user) => ctx.db.patch(user._id, { status: args.status })));

    const updates = Object.entries(statusCounts).map(([status, count]) => updateUserStats(ctx, status, -count));
    updates.push(updateUserStats(ctx, args.status, targetUsers.length));
    await Promise.all(updates);

    return { updated: targetUsers.length };
  },
  returns: v.object({ updated: v.number() }),
});

export const updateLastLogin = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastLogin: Date.now() });
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("users"), token: v.string() },
  handler: async (ctx, args) => {
    const { role: actorRole } = await requireAdminPermission(ctx, args.token, "users", "delete");
    const user = await ctx.db.get(args.id);
    if (!user) {throw new Error("User not found");}
    await assertNotSuperAdmin(ctx, user.roleId);
    await assertCanModifySuperAdmin(ctx, Boolean(actorRole?.isSuperAdmin), user.roleId);

    const preview = await ctx.db
      .query("activityLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.id))
      .take(1);
    if (preview.length > 0 && !args.cascade) {
      throw new Error("Người dùng có lịch sử hoạt động. Vui lòng xác nhận xóa tất cả.");
    }

    if (args.cascade) {
      const logs = await ctx.db
        .query("activityLogs")
        .withIndex("by_user", (q) => q.eq("userId", args.id))
        .collect();
      await Promise.all(logs.map( async (log) => ctx.db.delete(log._id)));
    }
    
    await ctx.db.delete(args.id);
    
    // Update counters
    await Promise.all([
      updateUserStats(ctx, "total", -1),
      updateUserStats(ctx, user.status, -1),
    ]);
    
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const preview = await ctx.db
      .query("activityLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.id))
      .take(10);
    const count = await ctx.db
      .query("activityLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.id))
      .take(1001);

    return {
      canDelete: true,
      dependencies: [
        {
          count: Math.min(count.length, 1000),
          hasMore: count.length > 1000,
          label: "Nhật ký hoạt động",
          preview: preview.map((log) => ({ id: log._id, name: log.action })),
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

// USR-005 FIX: Bulk delete with parallel execution
export const bulkRemove = mutation({
  args: { cascade: v.optional(v.boolean()), ids: v.array(v.id("users")), token: v.string() },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.token, "users", "delete");
    const users = await Promise.all(args.ids.map( async (id) => ctx.db.get(id)));
    const validUsers = users.filter((u): u is NonNullable<typeof u> => u !== null);
    const roles = await Promise.all(validUsers.map((u) => ctx.db.get(u.roleId)));
    if (roles.some((role) => role?.isSuperAdmin)) {
      throw new Error("Không thể xóa tài khoản Super Admin");
    }

    if (args.cascade) {
      const logs = await Promise.all(
        args.ids.map((id) => ctx.db
          .query("activityLogs")
          .withIndex("by_user", (q) => q.eq("userId", id))
          .collect())
      );
      await Promise.all(logs.flat().map( async (log) => ctx.db.delete(log._id)));
    }
    
    // Delete all users in parallel
    await Promise.all(args.ids.map( async (id) => ctx.db.delete(id)));
    
    // Update counters
    const statusCounts: Record<string, number> = {};
    validUsers.forEach((u) => {
      statusCounts[u.status] = (statusCounts[u.status] || 0) + 1;
    });
    
    await Promise.all([
      updateUserStats(ctx, "total", -validUsers.length),
      ...Object.entries(statusCounts).map( async ([status, count]) =>
        updateUserStats(ctx, status, -count)
      ),
    ]);
    
    return null;
  },
  returns: v.null(),
});
