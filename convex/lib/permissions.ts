import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export type AdminPermissionMode = "simple_full_admin" | "rbac";

export async function getAdminPermissionMode(ctx: MutationCtx): Promise<AdminPermissionMode> {
  const setting = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", "admin_permission_mode"))
    .unique();
  return setting?.value === "simple_full_admin" ? "simple_full_admin" : "rbac";
}

export async function requireAdminPermission(
  ctx: MutationCtx,
  token: string,
  moduleKey: string,
  action: string
) {
  if (!token) {
    throw new Error("Thiếu token xác thực");
  }

  const session = await ctx.db
    .query("userSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Session không hợp lệ");
  }

  const user = await ctx.db.get(session.userId as Doc<"users">["_id"]);
  if (!user || user.status !== "Active") {
    throw new Error("Tài khoản không hợp lệ");
  }

  const role = await ctx.db.get(user.roleId as Doc<"roles">["_id"]);
  if (!role) {
    throw new Error("Role không tồn tại");
  }

  const permissionMode = await getAdminPermissionMode(ctx);
  if (permissionMode === "simple_full_admin") {
    return { permissionMode, role, user };
  }

  if (role.isSuperAdmin) {
    return { permissionMode, role, user };
  }

  const { permissions } = role;
  if (permissions["*"]?.includes("*") || permissions["*"]?.includes(action)) {
    return { permissionMode, role, user };
  }

  if (permissions[moduleKey]?.includes("*") || permissions[moduleKey]?.includes(action)) {
    return { permissionMode, role, user };
  }

  throw new Error("Không có quyền thực hiện");
}
