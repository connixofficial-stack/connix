import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { updateUserStats } from "./users";
import { requireAdminPermission } from "./lib/permissions";

const roleDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("roles"),
  color: v.optional(v.string()),
  description: v.string(),
  isSuperAdmin: v.optional(v.boolean()),
  isSystem: v.boolean(),
  name: v.string(),
  permissions: v.record(v.string(), v.array(v.string())),
});

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db.query("roles").paginate(args.paginationOpts),
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(roleDoc),
  }),
});

// USR-003 FIX: Thêm limit để tránh memory overflow (roles thường ít nên 100 là đủ)
export const listAll = query({
  args: {},
  handler: async (ctx) => ctx.db.query("roles").take(100),
  returns: v.array(roleDoc),
});

export const getById = query({
  args: { id: v.id("roles") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(roleDoc, v.null()),
});

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique(),
  returns: v.union(roleDoc, v.null()),
});

export const getSystemRoles = query({
  args: {},
  handler: async (ctx) => ctx.db
      .query("roles")
      .withIndex("by_isSystem", (q) => q.eq("isSystem", true))
      .collect(),
  returns: v.array(roleDoc),
});

// Helper function to update roleStats counter
async function updateRoleStats(
  ctx: MutationCtx,
  key: string,
  delta: number
) {
  const stats = await ctx.db
    .query("roleStats")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (stats) {
    await ctx.db.patch(stats._id, { count: Math.max(0, stats.count + delta) });
  } else {
    await ctx.db.insert("roleStats", { count: Math.max(0, delta), key });
  }
}

function assertSuperAdmin(permissionMode: string, isSuperAdmin?: boolean) {
  if (permissionMode === "simple_full_admin" && !isSuperAdmin) {
    throw new Error("Chỉ Super Admin được phép chỉnh quyền");
  }
}

export const create = mutation({
  args: {
    color: v.optional(v.string()),
    description: v.string(),
    isSuperAdmin: v.optional(v.boolean()),
    isSystem: v.optional(v.boolean()),
    name: v.string(),
    permissions: v.record(v.string(), v.array(v.string())),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const { permissionMode, role: adminRole } = await requireAdminPermission(ctx, args.token, "roles", "create");
    assertSuperAdmin(permissionMode, adminRole?.isSuperAdmin);
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
    if (existing) {
      throw new Error(`Tên vai trò "${args.name}" đã tồn tại`);
    }
    const { token, ...payload } = args;
    void token;
    const roleId = await ctx.db.insert("roles", {
      ...payload,
      isSystem: args.isSystem ?? false,
    });
    
    // Update counters
    const updates = [updateRoleStats(ctx, "total", 1)];
    if (args.isSystem) {updates.push(updateRoleStats(ctx, "system", 1));}
    if (args.isSuperAdmin) {updates.push(updateRoleStats(ctx, "superAdmin", 1));}
    await Promise.all(updates);
    
    return roleId;
  },
  returns: v.id("roles"),
});

export const update = mutation({
  args: {
    color: v.optional(v.string()),
    description: v.optional(v.string()),
    id: v.id("roles"),
    name: v.optional(v.string()),
    permissions: v.optional(v.record(v.string(), v.array(v.string()))),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const { permissionMode, role: currentRole } = await requireAdminPermission(ctx, args.token, "roles", "edit");
    assertSuperAdmin(permissionMode, currentRole?.isSuperAdmin);
    const { id, token, ...updates } = args;
    void token;
    const role = await ctx.db.get(id);
    if (!role) {throw new Error("Không tìm thấy vai trò");}
    if (role.isSystem) {throw new Error("Không thể chỉnh sửa vai trò hệ thống");}
    
    // Check unique name if updating name
    if (updates.name && updates.name !== role.name) {
      const existing = await ctx.db
        .query("roles")
        .withIndex("by_name", (q) => q.eq("name", updates.name!))
        .unique();
      if (existing) {
        throw new Error(`Tên vai trò "${updates.name}" đã tồn tại`);
      }
    }
    
    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

export const clone = mutation({
  args: {
    id: v.id("roles"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const { permissionMode, role: adminRole } = await requireAdminPermission(ctx, args.token, "roles", "create");
    assertSuperAdmin(permissionMode, adminRole?.isSuperAdmin);
    const role = await ctx.db.get(args.id);
    if (!role) {throw new Error("Không tìm thấy vai trò");}

    const baseName = `${role.name} (Copy)`;
    let name = baseName;
    let counter = 1;

    while (await ctx.db.query("roles").withIndex("by_name", (q) => q.eq("name", name)).unique()) {
      name = `${baseName} ${counter}`;
      counter += 1;
    }

    const roleId = await ctx.db.insert("roles", {
      color: role.color,
      description: role.description,
      isSuperAdmin: false,
      isSystem: false,
      name,
      permissions: role.permissions,
    });

    await updateRoleStats(ctx, "total", 1);
    return roleId;
  },
  returns: v.id("roles"),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("roles"), token: v.string() },
  handler: async (ctx, args) => {
    const { permissionMode, role: adminRole } = await requireAdminPermission(ctx, args.token, "roles", "delete");
    assertSuperAdmin(permissionMode, adminRole?.isSuperAdmin);
    const role = await ctx.db.get(args.id);
    if (!role) {throw new Error("Không tìm thấy vai trò");}
    if (role.isSystem) {throw new Error("Không thể xóa vai trò hệ thống");}
    
    const usersWithRole = await ctx.db
      .query("users")
      .withIndex("by_role_status", (q) => q.eq("roleId", args.id))
      .collect();
    
    if (usersWithRole.length > 0 && !args.cascade) {
      throw new Error(`Vai trò "${role.name}" đang được gán cho người dùng. Vui lòng xác nhận xóa tất cả.`);
    }

    if (args.cascade && usersWithRole.length > 0) {
      const logs = await Promise.all(
        usersWithRole.map((user) => ctx.db
          .query("activityLogs")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect())
      );
      await Promise.all(logs.flat().map( async (log) => ctx.db.delete(log._id)));
      await Promise.all(usersWithRole.map( async (user) => ctx.db.delete(user._id)));

      const statusCounts: Record<string, number> = {};
      usersWithRole.forEach((user) => {
        statusCounts[user.status] = (statusCounts[user.status] || 0) + 1;
      });
      await Promise.all([
        updateUserStats(ctx, "total", -usersWithRole.length),
        ...Object.entries(statusCounts).map( async ([status, count]) =>
          updateUserStats(ctx, status, -count)
        ),
      ]);
    }
    
    await ctx.db.delete(args.id);
    
    // Update counters
    const updates = [updateRoleStats(ctx, "total", -1)];
    if (role.isSystem) {updates.push(updateRoleStats(ctx, "system", -1));}
    if (role.isSuperAdmin) {updates.push(updateRoleStats(ctx, "superAdmin", -1));}
    await Promise.all(updates);
    
    return null;
  },
  returns: v.null(),
});

// BULK REMOVE: Xóa nhiều role cùng lúc
export const bulkRemove = mutation({
  args: { cascade: v.optional(v.boolean()), ids: v.array(v.id("roles")), token: v.string() },
  handler: async (ctx, args) => {
    const { permissionMode, role: adminRole } = await requireAdminPermission(ctx, args.token, "roles", "delete");
    assertSuperAdmin(permissionMode, adminRole?.isSuperAdmin);
    const roles = await Promise.all(args.ids.map( async (id) => ctx.db.get(id)));
    const validRoles = roles.filter((role): role is NonNullable<typeof role> => role !== null);

    if (validRoles.some((role) => role.isSystem)) {
      throw new Error("Không thể xóa vai trò hệ thống");
    }

    if (validRoles.length === 0) {
      return null;
    }

    const roleIds = validRoles.map((role) => role._id);
    const userGroups = await Promise.all(
      roleIds.map((roleId) => ctx.db
        .query("users")
        .withIndex("by_role_status", (q) => q.eq("roleId", roleId))
        .collect())
    );
    const usersWithRoles = userGroups.flat();

    if (usersWithRoles.length > 0 && !args.cascade) {
      throw new Error("Vai trò đang được gán cho người dùng. Vui lòng xác nhận xóa tất cả.");
    }

    if (args.cascade && usersWithRoles.length > 0) {
      const logs = await Promise.all(
        usersWithRoles.map((user) => ctx.db
          .query("activityLogs")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect())
      );
      await Promise.all(logs.flat().map( async (log) => ctx.db.delete(log._id)));
      await Promise.all(usersWithRoles.map( async (user) => ctx.db.delete(user._id)));

      const statusCounts: Record<string, number> = {};
      usersWithRoles.forEach((user) => {
        statusCounts[user.status] = (statusCounts[user.status] || 0) + 1;
      });

      await Promise.all([
        updateUserStats(ctx, "total", -usersWithRoles.length),
        ...Object.entries(statusCounts).map( async ([status, count]) =>
          updateUserStats(ctx, status, -count)
        ),
      ]);
    }

    await Promise.all(roleIds.map( async (id) => ctx.db.delete(id)));

    const superAdminCount = validRoles.filter((role) => role.isSuperAdmin).length;
    const systemCount = validRoles.filter((role) => role.isSystem).length;
    const updates = [updateRoleStats(ctx, "total", -validRoles.length)];
    if (systemCount > 0) {updates.push(updateRoleStats(ctx, "system", -systemCount));}
    if (superAdminCount > 0) {updates.push(updateRoleStats(ctx, "superAdmin", -superAdminCount));}
    await Promise.all(updates);

    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("roles") },
  handler: async (ctx, args) => {
    const preview = await ctx.db
      .query("users")
      .withIndex("by_role_status", (q) => q.eq("roleId", args.id))
      .take(10);
    const count = await ctx.db
      .query("users")
      .withIndex("by_role_status", (q) => q.eq("roleId", args.id))
      .take(1001);

    return {
      canDelete: true,
      dependencies: [
        {
          count: Math.min(count.length, 1000),
          hasMore: count.length > 1000,
          label: "Người dùng",
          preview: preview.map((user) => ({ id: user._id, name: user.name })),
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

export const checkPermission = query({
  args: {
    action: v.string(),
    module: v.string(),
    roleId: v.id("roles"),
  },
  handler: async (ctx, args) => {
    const permissionMode = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "admin_permission_mode"))
      .unique();
    if (permissionMode?.value === "simple_full_admin") {
      return true;
    }
    const role = await ctx.db.get(args.roleId);
    if (!role) {return false;}
    if (role.isSuperAdmin) {return true;}
    const modulePermissions = role.permissions[args.module];
    if (!modulePermissions) {return false;}
    return modulePermissions.includes(args.action);
  },
  returns: v.boolean(),
});

// USR-002 FIX: Dùng counter table thay vì fetch ALL
export const count = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db
      .query("roleStats")
      .withIndex("by_key", (q) => q.eq("key", "total"))
      .unique();
    return stats?.count ?? 0;
  },
  returns: v.number(),
});

// USR-002 FIX: Dùng counter table cho stats
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const [total, system, superAdmin] = await Promise.all([
      ctx.db.query("roleStats").withIndex("by_key", (q) => q.eq("key", "total")).unique(),
      ctx.db.query("roleStats").withIndex("by_key", (q) => q.eq("key", "system")).unique(),
      ctx.db.query("roleStats").withIndex("by_key", (q) => q.eq("key", "superAdmin")).unique(),
    ]);

    const totalCount = total?.count ?? 0;
    const systemCount = system?.count ?? 0;
    const superAdminCount = superAdmin?.count ?? 0;

    return {
      customCount: totalCount - systemCount,
      superAdminCount,
      systemCount,
      totalCount,
    };
  },
  returns: v.object({
    customCount: v.number(),
    superAdminCount: v.number(),
    systemCount: v.number(),
    totalCount: v.number(),
  }),
});

// USR-004 FIX: Optimize với Map lookup thay vì filter O(n²)
export const getUserCountByRole = query({
  args: {},
  handler: async (ctx) => {
    const [roles, users] = await Promise.all([
      ctx.db.query("roles").take(100),
      ctx.db.query("users").take(500),
    ]);

    // Build Map for O(1) lookup instead of O(n) filter
    const userCountMap = new Map<string, number>();
    users.forEach((u) => {
      const count = userCountMap.get(u.roleId) ?? 0;
      userCountMap.set(u.roleId, count + 1);
    });

    return roles.map((role) => ({
      roleId: role._id,
      roleName: role.name,
      userCount: userCountMap.get(role._id) ?? 0,
    }));
  },
  returns: v.array(v.object({
    roleId: v.id("roles"),
    roleName: v.string(),
    userCount: v.number(),
  })),
});
