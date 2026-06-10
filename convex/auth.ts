import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { updateUserStats } from "./users";
import { hashPassword, verifyPassword } from "./lib/password";
import { consumeRateLimit, resetRateLimit } from "./lib/rateLimit";
import { internal } from "./_generated/api";
import {
  normalizeOrderStatusPreset,
  parseOrderStatuses,
} from "../lib/orders/statuses";
import { EMAIL_CONFIG_SETTING_KEYS, getEmailConfigurationStatus } from "../lib/email-config-status";


async function resolveSuperAdminRole(ctx: MutationCtx) {
  let superAdminRole = await ctx.db
    .query("roles")
    .filter((q) => q.eq(q.field("isSuperAdmin"), true))
    .first();

  if (!superAdminRole) {
    const roleId = await ctx.db.insert("roles", {
      color: "#ef4444",
      description: "Quản trị viên cao nhất, toàn quyền hệ thống",
      isSuperAdmin: true,
      isSystem: true,
      name: "Super Admin",
      permissions: { "*": ["*"] },
    });
    superAdminRole = await ctx.db.get(roleId);
  }

  return superAdminRole;
}

async function resolveAdminRoleId(ctx: MutationCtx) {
  const adminRole = await ctx.db
    .query("roles")
    .withIndex("by_name", (q) => q.eq("name", "Admin"))
    .first();
  if (adminRole) {
    return adminRole._id;
  }
  const fallbackRole = await ctx.db
    .query("roles")
    .filter((q) => q.eq(q.field("isSuperAdmin"), false))
    .first();
  if (!fallbackRole) {
    throw new Error("Không tìm thấy vai trò mặc định để gán người dùng");
  }
  return fallbackRole._id;
}

type TrialDurationDays = 1 | 7 | 30 | 90;
const trialDurationValidator = v.union(v.literal(1), v.literal(7), v.literal(30), v.literal(90));

function resolveTrialMetadata(trialDurationDays?: TrialDurationDays) {
  if (!trialDurationDays) {
    return {
      superAdminTrialCreatedAt: undefined,
      superAdminTrialDurationDays: undefined,
      superAdminTrialExpiresAt: undefined,
    };
  }

  const now = Date.now();
  return {
    superAdminTrialCreatedAt: now,
    superAdminTrialDurationDays: trialDurationDays,
    superAdminTrialExpiresAt: now + trialDurationDays * 24 * 60 * 60 * 1000,
  };
}

function isTrialExpired(user: Pick<Doc<"users">, "superAdminTrialExpiresAt">) {
  return typeof user.superAdminTrialExpiresAt === "number" && user.superAdminTrialExpiresAt <= Date.now();
}

async function deleteUserSessions(ctx: MutationCtx, userId: Id<"users">) {
  const sessions = await ctx.db
    .query("userSessions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  await Promise.all(sessions.map((session) => ctx.db.delete(session._id)));
}

async function cleanupExpiredTrialUser(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user) {
    return false;
  }

  const role = await ctx.db.get(user.roleId);
  if (!role?.isSuperAdmin || !isTrialExpired(user)) {
    return false;
  }

  await deleteUserSessions(ctx, user._id);
  await ctx.db.delete(user._id);
  await Promise.all([
    updateUserStats(ctx, "total", -1),
    updateUserStats(ctx, user.status, -1),
  ]);

  return true;
}

function buildTrialStatus(user: Pick<Doc<"users">, "superAdminTrialCreatedAt" | "superAdminTrialDurationDays" | "superAdminTrialExpiresAt">) {
  const expiresAt = user.superAdminTrialExpiresAt;
  if (typeof expiresAt !== "number") {
    return null;
  }

  const remainingMs = Math.max(expiresAt - Date.now(), 0);
  return {
    createdAt: user.superAdminTrialCreatedAt ?? null,
    durationDays: user.superAdminTrialDurationDays ?? null,
    expiresAt,
    isExpired: remainingMs <= 0,
    remainingMs,
  };
}

// ============================================================
// SYSTEM AUTH - Hardcoded single account for /system
// ============================================================

const SYSTEM_EMAIL = process.env.SYSTEM_EMAIL;
const SYSTEM_PASSWORD = process.env.SYSTEM_PASSWORD;

function normalizeLoginKey(email: string) {
  return email.trim().toLowerCase();
}

export const verifySystemLogin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const loginKey = `system:${normalizeLoginKey(args.email)}`;
    const rateLimit = await consumeRateLimit(ctx, loginKey, "auth");
    if (!rateLimit.allowed) {
      return { message: "Bạn thử đăng nhập quá nhanh. Vui lòng thử lại sau.", success: false };
    }

    if (!SYSTEM_EMAIL || !SYSTEM_PASSWORD) {
      return { message: "Chưa cấu hình tài khoản hệ thống", success: false };
    }

    if (args.email !== SYSTEM_EMAIL) {
      return { message: "Thông tin đăng nhập không đúng", success: false };
    }

    if (args.password !== SYSTEM_PASSWORD) {
      return { message: "Thông tin đăng nhập không đúng", success: false };
    }
    
    // Generate simple session token
    const token = `sys_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    // Store session
    await ctx.db.insert("systemSessions", {
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      token, // 24 hours
    });

    await resetRateLimit(ctx, loginKey, "auth");
    
    return { message: "Đăng nhập thành công", success: true, token };
  },
  returns: v.object({
    message: v.string(),
    success: v.boolean(),
    token: v.optional(v.string()),
  }),
});

export const verifySystemSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token || !args.token.startsWith("sys_")) {
      return { message: "Token không hợp lệ", valid: false };
    }
    
    const session = await ctx.db
      .query("systemSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    
    if (!session) {
      return { message: "Session không tồn tại", valid: false };
    }
    
    if (session.expiresAt < Date.now()) {
      return { message: "Session đã hết hạn", valid: false };
    }
    
    return { message: "Session hợp lệ", valid: true };
  },
  returns: v.object({
    message: v.string(),
    valid: v.boolean(),
  }),
});

export const logoutSystem = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("systemSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    
    if (session) {
      await ctx.db.delete(session._id);
    }
    return null;
  },
  returns: v.null(),
});

// ============================================================
// ADMIN AUTH - SuperAdmin and users with RBAC
// ============================================================

export const verifyAdminLogin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const loginKey = `admin:${normalizeLoginKey(args.email)}`;
    const rateLimit = await consumeRateLimit(ctx, loginKey, "auth");
    if (!rateLimit.allowed) {
      return { message: "Bạn thử đăng nhập quá nhanh. Vui lòng thử lại sau.", success: false };
    }

    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!adminUser || !adminUser.passwordHash) {
      return { message: "Email hoặc mật khẩu không đúng", success: false };
    }

    const role = await ctx.db.get(adminUser.roleId);
    if (!role) {
      return { message: "Vai trò không tồn tại", success: false };
    }

    if (role.isSuperAdmin && isTrialExpired(adminUser)) {
      await cleanupExpiredTrialUser(ctx, adminUser._id);
      return { message: "Tài khoản dùng thử đã hết hạn", success: false };
    }

    if (adminUser.status !== "Active") {
      return { message: "Tài khoản đã bị vô hiệu hóa", success: false };
    }

    const passwordValid = await verifyPassword(args.password, adminUser.passwordHash);
    if (!passwordValid) {
      return { message: "Email hoặc mật khẩu không đúng", success: false };
    }

    const token = `adm_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    await ctx.db.insert("userSessions", {
      userId: adminUser._id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
      token,
    });

    await ctx.db.patch(adminUser._id, { lastLogin: Date.now() });
    await resetRateLimit(ctx, loginKey, "auth");

    return {
      message: "Đăng nhập thành công",
      success: true,
      token,
      user: {
        email: adminUser.email,
        id: adminUser._id,
        isSuperAdmin: role.isSuperAdmin ?? false,
        name: adminUser.name,
        roleId: adminUser.roleId,
      },
    };
  },
  returns: v.object({
    message: v.string(),
    success: v.boolean(),
    token: v.optional(v.string()),
    user: v.optional(v.object({
      email: v.string(),
      id: v.string(),
      isSuperAdmin: v.boolean(),
      name: v.string(),
      roleId: v.string(),
    })),
  }),
});

export const verifyAdminSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token || !args.token.startsWith("adm_")) {
      return { message: "Token không hợp lệ", valid: false };
    }

    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session) {
      return { message: "Session không tồn tại", valid: false };
    }

    if (session.expiresAt < Date.now()) {
      return { message: "Session đã hết hạn", valid: false };
    }

    const adminUser = await ctx.db.get(session.userId);
    if (!adminUser || adminUser.status !== "Active") {
      return { message: "Tài khoản không hợp lệ", valid: false };
    }

    const role = await ctx.db.get(adminUser.roleId);
    if (!role) {
      return { message: "Role không tồn tại", valid: false };
    }

    const trialStatus = buildTrialStatus(adminUser);
    if (role.isSuperAdmin && trialStatus?.isExpired) {
      return { message: "Tài khoản dùng thử đã hết hạn", valid: false };
    }

    return {
      message: "Session hợp lệ",
      user: {
        avatar: adminUser.avatar,
        email: adminUser.email,
        id: adminUser._id,
        isSuperAdmin: role.isSuperAdmin ?? false,
        name: adminUser.name,
        permissions: role.permissions ?? {},
        roleId: adminUser.roleId,
        trial: trialStatus
          ? {
              createdAt: trialStatus.createdAt,
              durationDays: trialStatus.durationDays,
              expiresAt: trialStatus.expiresAt,
              remainingMs: trialStatus.remainingMs,
            }
          : undefined,
      },
      valid: true,
    };
  },
  returns: v.object({
    message: v.string(),
    user: v.optional(v.object({
      avatar: v.optional(v.string()),
      email: v.string(),
      id: v.string(),
      isSuperAdmin: v.boolean(),
      name: v.string(),
      permissions: v.record(v.string(), v.array(v.string())),
      roleId: v.string(),
      trial: v.optional(v.object({
        createdAt: v.union(v.number(), v.null()),
        durationDays: v.union(v.union(v.literal(1), v.literal(7), v.literal(30), v.literal(90)), v.null()),
        expiresAt: v.number(),
        remainingMs: v.number(),
      })),
    })),
    valid: v.boolean(),
  }),
});

export const logoutAdmin = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }
    return null;
  },
  returns: v.null(),
});

export const cleanupExpiredAdminTrialByToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session) {
      return { cleaned: false };
    }

    const cleaned = await cleanupExpiredTrialUser(ctx, session.userId);

    if (!cleaned) {
      await ctx.db.delete(session._id);
    }

    return { cleaned };
  },
  returns: v.object({ cleaned: v.boolean() }),
});

export const getMyAdminTrialStatus = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.status !== "Active") {
      return null;
    }

    const role = await ctx.db.get(user.roleId);
    if (!role?.isSuperAdmin) {
      return null;
    }

    const trialStatus = buildTrialStatus(user);
    if (!trialStatus || trialStatus.isExpired) {
      return null;
    }

    return {
      createdAt: trialStatus.createdAt,
      durationDays: trialStatus.durationDays,
      expiresAt: trialStatus.expiresAt,
      remainingMs: trialStatus.remainingMs,
    };
  },
  returns: v.union(
    v.object({
      createdAt: v.union(v.number(), v.null()),
      durationDays: v.union(trialDurationValidator, v.null()),
      expiresAt: v.number(),
      remainingMs: v.number(),
    }),
    v.null()
  ),
});

export const changeMyPassword = mutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.newPassword.length < 6) {
      return { message: "Mật khẩu mới tối thiểu 6 ký tự", success: false };
    }

    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!session || session.expiresAt < Date.now()) {
      return { message: "Session không hợp lệ", success: false };
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.status !== "Active") {
      return { message: "Tài khoản không hợp lệ", success: false };
    }

    if (!user.passwordHash) {
      return { message: "Tài khoản chưa có mật khẩu", success: false };
    }

    const passwordValid = await verifyPassword(args.currentPassword, user.passwordHash);
    if (!passwordValid) {
      return { message: "Mật khẩu hiện tại không đúng", success: false };
    }

    const passwordHash = await hashPassword(args.newPassword);
    await ctx.db.patch(user._id, { passwordHash });

    return { message: "Đổi mật khẩu thành công", success: true };
  },
  returns: v.object({
    message: v.string(),
    success: v.boolean(),
  }),
});

// ============================================================
// CUSTOMER AUTH - End user account
// ============================================================

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string) {
  return phone.trim().replace(/[^\d+]/g, "");
}

export async function resolveCustomerByIdentifier(ctx: MutationCtx, identifier: string) {
  const cleanId = identifier.trim();
  const isEmail = cleanId.includes("@");
  if (isEmail) {
    const normalized = normalizeEmail(cleanId);
    return await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .unique();
  } else {
    const normalized = normalizePhone(cleanId);
    return await ctx.db
      .query("customers")
      .withIndex("by_phone", (q) => q.eq("phone", normalized))
      .unique();
  }
}

export const identifyCustomerAuthState = mutation({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    const loginKey = `customer_identify:${normalizeLoginKey(args.identifier)}`;
    const rateLimit = await consumeRateLimit(ctx, loginKey, "auth");
    if (!rateLimit.allowed) {
      return { success: false, message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.", state: "error" };
    }

    const customer = await resolveCustomerByIdentifier(ctx, args.identifier);
    if (!customer) {
      return { success: true, state: "notFound", message: "Tài khoản không tồn tại" };
    }

    if (customer.status !== "Active") {
      return { success: false, state: "error", message: "Tài khoản đã bị vô hiệu hóa" };
    }

    if (!customer.passwordHash) {
      // Mask phone or email for privacy
      const maskedEmail = customer.email.replace(/^(.)(.*)(@.*)$/, (_: string, first: string, middle: string, last: string) => {
        return first + middle.replace(/./g, "*") + last;
      });
      const maskedPhone = customer.phone.replace(/^(.*)(.{3})$/, (_: string, prefix: string, suffix: string) => {
        return prefix.replace(/./g, "*") + suffix;
      });
      return {
        success: true,
        state: "requiresPasswordSetup",
        message: "Tài khoản chưa được thiết lập mật khẩu",
        maskedEmail,
        maskedPhone,
      };
    }

    return { success: true, state: "requiresPassword", message: "Tài khoản yêu cầu mật khẩu" };
  },
  returns: v.object({
    success: v.boolean(),
    state: v.string(),
    message: v.string(),
    maskedEmail: v.optional(v.string()),
    maskedPhone: v.optional(v.string()),
  }),
});

async function checkEmailConfigured(ctx: MutationCtx) {
  const keys = EMAIL_CONFIG_SETTING_KEYS;
  const uniqueKeys = [...new Set(keys)];
  const settingsList = await Promise.all(uniqueKeys.map((key) =>
    ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique()
  ));

  const settings: Record<string, unknown> = {};
  for (const setting of settingsList) {
    if (setting) {
      settings[setting.key] = setting.value;
    }
  }

  const emailStatus = getEmailConfigurationStatus(settings);
  return emailStatus.configured;
}

export const requestCustomerPasswordSetup = mutation({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    const loginKey = `customer_otp:${normalizeLoginKey(args.identifier)}`;
    const rateLimit = await consumeRateLimit(ctx, loginKey, "auth");
    if (!rateLimit.allowed) {
      return { success: false, message: "Yêu cầu mã quá nhanh. Vui lòng thử lại sau." };
    }

    const customer = await resolveCustomerByIdentifier(ctx, args.identifier);
    if (!customer) {
      return { success: false, message: "Không tìm thấy thông tin tài khoản." };
    }

    if (customer.status !== "Active") {
      return { success: false, message: "Tài khoản đã bị vô hiệu hóa." };
    }

    if (customer.passwordHash) {
      return { success: false, message: "Tài khoản đã có mật khẩu. Vui lòng đăng nhập bình thường." };
    }

    // Clean up old active challenges for this customer
    const oldChallenges = await ctx.db
      .query("customerAuthChallenges")
      .withIndex("by_customer_purpose", (q) =>
        q.eq("customerId", customer._id).eq("purpose", "password_setup")
      )
      .collect();
    for (const challenge of oldChallenges) {
      await ctx.db.delete(challenge._id);
    }

    // Check if email outgoing is configured
    const isEmailConfigured = await checkEmailConfigured(ctx);

    // Generate code
    const otpCode = isEmailConfigured
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : "BYPASS";
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const challengeId = await ctx.db.insert("customerAuthChallenges", {
      customerId: customer._id,
      purpose: "password_setup",
      code: otpCode,
      expiresAt,
      attempts: 0,
    });

    if (isEmailConfigured) {
      // Schedule SMTP action to send the email
      await ctx.scheduler.runAfter(0, internal.email.sendOtpEmail, {
        email: customer.email,
        otpCode,
      });
    }

    return {
      success: true,
      challengeId,
      message: isEmailConfigured
        ? "Mã xác minh đã được gửi đến email của bạn."
        : "",
      otpRequired: isEmailConfigured,
    };
  },
  returns: v.object({
    success: v.boolean(),
    challengeId: v.optional(v.string()),
    message: v.string(),
    otpRequired: v.optional(v.boolean()),
  }),
});

export const completeCustomerPasswordSetup = mutation({
  args: {
    identifier: v.string(),
    code: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.password.length < 6) {
      return { success: false, message: "Mật khẩu tối thiểu phải từ 6 ký tự." };
    }

    const customer = await resolveCustomerByIdentifier(ctx, args.identifier);
    if (!customer) {
      return { success: false, message: "Không tìm thấy thông tin tài khoản." };
    }

    const challenge = await ctx.db
      .query("customerAuthChallenges")
      .withIndex("by_customer_purpose", (q) =>
        q.eq("customerId", customer._id).eq("purpose", "password_setup")
      )
      .order("desc") // Newest first
      .first();

    if (!challenge) {
      return { success: false, message: "Không tìm thấy mã xác minh hợp lệ." };
    }

    if (challenge.consumedAt !== undefined) {
      return { success: false, message: "Mã xác minh đã được sử dụng." };
    }

    if (challenge.expiresAt < Date.now()) {
      return { success: false, message: "Mã xác minh đã hết hạn." };
    }

    // Check if email outgoing is configured
    const isEmailConfigured = await checkEmailConfigured(ctx);

    if (isEmailConfigured && challenge.attempts >= 5) {
      return { success: false, message: "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới." };
    }

    if (isEmailConfigured && challenge.code !== args.code.trim()) {
      await ctx.db.patch(challenge._id, { attempts: challenge.attempts + 1 });
      return { success: false, message: `Mã xác minh không đúng. Bạn còn ${5 - (challenge.attempts + 1)} lần thử.` };
    }



    // Success! Update password
    const passwordHash = await hashPassword(args.password);
    await ctx.db.patch(customer._id, { passwordHash });

    // Mark challenge consumed
    await ctx.db.patch(challenge._id, { consumedAt: Date.now() });

    // Generate token and session
    const token = `cus_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await ctx.db.insert("customerSessions", {
      createdAt: Date.now(),
      customerId: customer._id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      token,
    });

    return {
      success: true,
      message: "Tạo mật khẩu thành công! Bạn đang được đăng nhập.",
      token,
      customer: {
        email: customer.email,
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
      },
    };
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    token: v.optional(v.string()),
    customer: v.optional(v.object({
      email: v.string(),
      id: v.id("customers"),
      name: v.string(),
      phone: v.string(),
    })),
  }),
});

export const registerCustomer = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const loginKey = `customer:${normalizeLoginKey(args.email)}`;
    const rateLimit = await consumeRateLimit(ctx, loginKey, "auth");
    if (!rateLimit.allowed) {
      return { message: "Bạn thử đăng ký quá nhanh. Vui lòng thử lại sau.", success: false };
    }

    const cleanEmail = normalizeEmail(args.email);
    const cleanPhone = normalizePhone(args.phone);

    let existing = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .unique();

    if (!existing && cleanPhone) {
      existing = await ctx.db
        .query("customers")
        .withIndex("by_phone", (q) => q.eq("phone", cleanPhone))
        .unique();
    }

    if (existing) {
      if (!existing.passwordHash) {
        return {
          success: false,
          code: "GUEST_ACCOUNT_EXISTS",
          message: "Thông tin này đã từng được sử dụng để mua hàng vãng lai. Vui lòng thiết lập mật khẩu để đăng nhập.",
        };
      }
      return { message: "Email hoặc số điện thoại đã tồn tại", success: false };
    }

    const customerId = await ctx.db.insert("customers", {
      email: cleanEmail,
      name: args.name,
      ordersCount: 0,
      passwordHash: await hashPassword(args.password),
      phone: cleanPhone,
      status: "Active",
      totalSpent: 0,
    });

    const token = `cus_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await ctx.db.insert("customerSessions", {
      createdAt: Date.now(),
      customerId,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      token,
    });

    await resetRateLimit(ctx, loginKey, "auth");

    return {
      customer: { email: cleanEmail, id: customerId, name: args.name, phone: cleanPhone },
      message: "Đăng ký thành công",
      success: true,
      token,
    };
  },
  returns: v.object({
    customer: v.optional(v.object({
      email: v.string(),
      id: v.id("customers"),
      name: v.string(),
      phone: v.string(),
    })),
    message: v.string(),
    success: v.boolean(),
    token: v.optional(v.string()),
    code: v.optional(v.string()),
  }),
});

export const verifyCustomerLogin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const loginKey = `customer:${normalizeLoginKey(args.email)}`;
    const rateLimit = await consumeRateLimit(ctx, loginKey, "auth");
    if (!rateLimit.allowed) {
      return { message: "Bạn thử đăng nhập quá nhanh. Vui lòng thử lại sau.", success: false };
    }

    const customer = await resolveCustomerByIdentifier(ctx, args.email);

    if (!customer || !customer.passwordHash) {
      return { message: "Email/SĐT hoặc mật khẩu không đúng", success: false };
    }
    if (customer.status !== "Active") {
      return { message: "Tài khoản đã bị vô hiệu hóa", success: false };
    }
    const passwordValid = await verifyPassword(args.password, customer.passwordHash);
    if (!passwordValid) {
      return { message: "Email/SĐT hoặc mật khẩu không đúng", success: false };
    }

    const token = `cus_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await ctx.db.insert("customerSessions", {
      createdAt: Date.now(),
      customerId: customer._id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      token,
    });

    await resetRateLimit(ctx, loginKey, "auth");

    return {
      customer: { email: customer.email, id: customer._id, name: customer.name, phone: customer.phone },
      message: "Đăng nhập thành công",
      success: true,
      token,
    };
  },
  returns: v.object({
    customer: v.optional(v.object({
      email: v.string(),
      id: v.id("customers"),
      name: v.string(),
      phone: v.string(),
    })),
    message: v.string(),
    success: v.boolean(),
    token: v.optional(v.string()),
  }),
});

export const verifyCustomerSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token || !args.token.startsWith("cus_")) {
      return { message: "Token không hợp lệ", valid: false };
    }

    const session = await ctx.db
      .query("customerSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session) {
      return { message: "Session không tồn tại", valid: false };
    }

    if (session.expiresAt < Date.now()) {
      return { message: "Session đã hết hạn", valid: false };
    }

    const customer = await ctx.db.get(session.customerId);
    if (!customer || customer.status !== "Active") {
      return { message: "Tài khoản không hợp lệ", valid: false };
    }

    return {
      customer: {
        email: customer.email,
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
      },
      message: "Session hợp lệ",
      valid: true,
    };
  },
  returns: v.object({
    customer: v.optional(v.object({
      email: v.string(),
      id: v.id("customers"),
      name: v.string(),
      phone: v.string(),
    })),
    message: v.string(),
    valid: v.boolean(),
  }),
});

export const logoutCustomer = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("customerSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }
    return null;
  },
  returns: v.null(),
});

// ============================================================
// ADMIN USER MANAGEMENT (called from /system)
// ============================================================

export const createSuperAdmin = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    password: v.string(),
    trialDurationDays: v.optional(trialDurationValidator),
  },
  handler: async (ctx, args) => {
    const superAdminRole = await resolveSuperAdminRole(ctx);

    if (!superAdminRole) {
      return { message: "Không thể tạo vai trò SuperAdmin", success: false };
    }

    const existingSuperAdmin = await ctx.db
      .query("users")
      .withIndex("by_role_status", (q) => q.eq("roleId", superAdminRole!._id))
      .first();

    if (existingSuperAdmin) {
      return { message: "SuperAdmin đã tồn tại", success: false };
    }

    const email = args.email;
    const password = args.password;

    const existingEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existingEmail) {
      return { message: "Email đã được sử dụng", success: false };
    }

    const passwordHash = await hashPassword(password);
    const trialMetadata = resolveTrialMetadata(args.trialDurationDays);

    await ctx.db.insert("users", {
      email,
      name: args.name ?? "Super Admin",
      passwordHash,
      roleId: superAdminRole._id,
      status: "Active",
      ...trialMetadata,
    });

    await updateUserStats(ctx, "total", 1);
    await updateUserStats(ctx, "Active", 1);

    return { message: "Đã tạo SuperAdmin thành công", success: true };
  },
  returns: v.object({
    message: v.string(),
    success: v.boolean(),
  }),
});

export const getSuperAdmin = query({
  args: {},
  handler: async (ctx) => {
    const superAdminRole = await ctx.db
      .query("roles")
      .filter((q) => q.eq(q.field("isSuperAdmin"), true))
      .first();

    if (!superAdminRole) {return null;}

    const superAdmin = await ctx.db
      .query("users")
      .withIndex("by_role_status", (q) => q.eq("roleId", superAdminRole._id))
      .first();

    if (!superAdmin) {return null;}

    return {
      createdAt: superAdmin._creationTime,
      email: superAdmin.email,
      id: superAdmin._id,
      name: superAdmin.name,
      status: superAdmin.status,
      trialExpiresAt: superAdmin.superAdminTrialExpiresAt,
    };
  },
  returns: v.union(
    v.object({
      createdAt: v.number(),
      email: v.string(),
      id: v.string(),
      name: v.string(),
      status: v.string(),
      trialExpiresAt: v.optional(v.number()),
    }),
    v.null()
  ),
});

export const listSuperAdmins = query({
  args: {},
  handler: async (ctx) => {
    const superAdminRoles = await ctx.db
      .query("roles")
      .filter((q) => q.eq(q.field("isSuperAdmin"), true))
      .collect();

    if (superAdminRoles.length === 0) {
      return [];
    }

    const users = await Promise.all(
      superAdminRoles.map((role) =>
        ctx.db
          .query("users")
          .withIndex("by_role_status", (q) => q.eq("roleId", role._id))
          .collect()
      )
    );

    return users
      .flat()
      .map((user) => ({
        createdAt: user._creationTime,
        email: user.email,
        id: user._id,
        name: user.name,
        status: user.status,
        trialDurationDays: user.superAdminTrialDurationDays,
        trialExpiresAt: user.superAdminTrialExpiresAt,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
  returns: v.array(
    v.object({
      createdAt: v.number(),
      email: v.string(),
      id: v.id("users"),
      name: v.string(),
      status: v.string(),
      trialDurationDays: v.optional(trialDurationValidator),
      trialExpiresAt: v.optional(v.number()),
    })
  ),
});

export const cleanupExpiredSuperAdminTrials = mutation({
  args: {},
  handler: async (ctx) => {
    const roles = await ctx.db
      .query("roles")
      .filter((q) => q.eq(q.field("isSuperAdmin"), true))
      .collect();

    if (roles.length === 0) {
      return { deletedCount: 0 };
    }

    let deletedCount = 0;
    for (const role of roles) {
      const users = await ctx.db
        .query("users")
        .withIndex("by_role_status", (q) => q.eq("roleId", role._id))
        .collect();

      for (const user of users) {
        const cleaned = await cleanupExpiredTrialUser(ctx, user._id);
        if (cleaned) {
          deletedCount += 1;
        }
      }
    }

    return { deletedCount };
  },
  returns: v.object({ deletedCount: v.number() }),
});

export const listAdminUsersForSystem = query({
  args: {
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const fetchLimit = Math.min(limit + 50, 200);
    const roles = await ctx.db.query("roles").take(200);
    const roleMap = new Map(roles.map((role) => [role._id, role]));
    const superAdminRoleIds = new Set(roles.filter((role) => role.isSuperAdmin).map((role) => role._id));

    let users = await ctx.db.query("users").order("desc").take(fetchLimit);

    if (args.search?.trim()) {
      const searchLower = args.search.trim().toLowerCase();
      users = users.filter((user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.phone?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    users = users.filter((user) => !superAdminRoleIds.has(user.roleId));

    return users.slice(0, limit).map((user) => ({
      email: user.email,
      id: user._id,
      name: user.name,
      roleName: roleMap.get(user.roleId)?.name,
      status: user.status,
    }));
  },
  returns: v.array(
    v.object({
      email: v.string(),
      id: v.id("users"),
      name: v.string(),
      roleName: v.optional(v.string()),
      status: v.string(),
    })
  ),
});

export const addSuperAdmin = mutation({
  args: {
    email: v.optional(v.string()),
    existingUserId: v.optional(v.id("users")),
    name: v.optional(v.string()),
    password: v.optional(v.string()),
    trialDurationDays: v.optional(trialDurationValidator),
  },
  handler: async (ctx, args) => {
    const superAdminRole = await resolveSuperAdminRole(ctx);
    if (!superAdminRole) {
      return { message: "Không thể tạo vai trò SuperAdmin", success: false };
    }

    const trialMetadata = resolveTrialMetadata(args.trialDurationDays);

    if (args.existingUserId) {
      const targetUser = await ctx.db.get(args.existingUserId);
      if (!targetUser) {
        return { message: "Không tìm thấy người dùng", success: false };
      }
      const targetRole = await ctx.db.get(targetUser.roleId);
      if (targetRole?.isSuperAdmin) {
        return { message: "Người dùng đã là Super Admin", success: false };
      }
      await ctx.db.patch(targetUser._id, {
        roleId: superAdminRole._id,
        ...trialMetadata,
      });
      return { message: "Đã nâng quyền Super Admin", success: true };
    }

    if (!args.email || !args.password) {
      return { message: "Vui lòng nhập đủ email và mật khẩu", success: false };
    }

    if (args.password.length < 6) {
      return { message: "Mật khẩu tối thiểu 6 ký tự", success: false };
    }

    const email = args.email;
    const password = args.password;

    const existingEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existingEmail) {
      return { message: "Email đã được sử dụng", success: false };
    }

    const passwordHash = await hashPassword(password);

    await ctx.db.insert("users", {
      email,
      name: args.name ?? "Super Admin",
      passwordHash,
      roleId: superAdminRole._id,
      status: "Active",
      ...trialMetadata,
    });

    await Promise.all([
      updateUserStats(ctx, "total", 1),
      updateUserStats(ctx, "Active", 1),
    ]);

    return { message: "Đã tạo Super Admin", success: true };
  },
  returns: v.object({
    message: v.string(),
    success: v.boolean(),
  }),
});

export const demoteSuperAdmin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const superAdminRoles = await ctx.db
      .query("roles")
      .filter((q) => q.eq(q.field("isSuperAdmin"), true))
      .collect();
    if (superAdminRoles.length === 0) {
      return { message: "Super Admin chưa được tạo", success: false };
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      return { message: "Không tìm thấy người dùng", success: false };
    }
    const targetRole = await ctx.db.get(targetUser.roleId);
    if (!targetRole?.isSuperAdmin) {
      return { message: "Người dùng không phải Super Admin", success: false };
    }

    const superAdmins = await Promise.all(
      superAdminRoles.map((role) =>
        ctx.db
          .query("users")
          .withIndex("by_role_status", (q) => q.eq("roleId", role._id))
          .collect()
      )
    );
    const superAdminCount = superAdmins.flat().length;
    if (superAdminCount <= 1) {
      return { message: "Phải giữ tối thiểu 1 Super Admin", success: false };
    }

    const adminRoleId = await resolveAdminRoleId(ctx);
    await ctx.db.patch(targetUser._id, {
      roleId: adminRoleId,
      superAdminTrialCreatedAt: undefined,
      superAdminTrialDurationDays: undefined,
      superAdminTrialExpiresAt: undefined,
    });

    return { message: "Đã gỡ quyền Super Admin", success: true };
  },
  returns: v.object({
    message: v.string(),
    success: v.boolean(),
  }),
});

export const updateSuperAdminCredentials = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const superAdminRole = await ctx.db
      .query("roles")
      .filter((q) => q.eq(q.field("isSuperAdmin"), true))
      .first();

    if (!superAdminRole) {
      return { message: "SuperAdmin chưa được tạo", success: false };
    }

    const superAdmin = await ctx.db
      .query("users")
      .withIndex("by_role_status", (q) => q.eq("roleId", superAdminRole._id))
      .first();

    if (!superAdmin) {
      return { message: "SuperAdmin chưa được tạo", success: false };
    }

    const updates: Partial<Doc<"users">> = {};

    if (args.email && args.email !== superAdmin.email) {
      const emailToCheck = args.email;
      const existingEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", emailToCheck))
        .unique();

      if (existingEmail) {
        return { message: "Email đã được sử dụng", success: false };
      }
      updates.email = args.email;
    }

    if (args.password) {
      updates.passwordHash = await hashPassword(args.password);
    }

    if (args.name) {
      updates.name = args.name;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(superAdmin._id, updates);
    }

    return { message: "Đã cập nhật thông tin SuperAdmin", success: true };
  },
  returns: v.object({
    message: v.string(),
    success: v.boolean(),
  }),
});

export const ensureSuperAdminCredentials = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    let superAdminRole = await ctx.db
      .query("roles")
      .filter((q) => q.eq(q.field("isSuperAdmin"), true))
      .first();

    if (!superAdminRole) {
      const roleId = await ctx.db.insert("roles", {
        color: "#ef4444",
        description: "Quản trị viên cao nhất, toàn quyền hệ thống",
        isSuperAdmin: true,
        isSystem: true,
        name: "Super Admin",
        permissions: { "*": ["*"] },
      });
      superAdminRole = await ctx.db.get(roleId);
    }

    if (!superAdminRole) {
      return { message: "Không thể tạo vai trò SuperAdmin", success: false };
    }

    let adminRole = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", "Admin"))
      .first();

    if (!adminRole) {
      adminRole = await ctx.db
        .query("roles")
        .filter((q) => q.eq(q.field("isSuperAdmin"), false))
        .first();
    }

    if (!adminRole) {
      const roleId = await ctx.db.insert("roles", {
        color: "#3b82f6",
        description: "Quản trị viên hệ thống",
        isSystem: true,
        name: "Admin",
        permissions: { "*": ["read"] },
      });
      adminRole = await ctx.db.get(roleId);
    }

    const existingSuperAdmin = await ctx.db
      .query("users")
      .withIndex("by_role_status", (q) => q.eq("roleId", superAdminRole._id))
      .first();

    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    const passwordHash = await hashPassword(args.password);
    const resolvedName = args.name?.trim();

    if (existingByEmail && (!existingSuperAdmin || existingByEmail._id !== existingSuperAdmin._id)) {
      await ctx.db.patch(existingByEmail._id, {
        email: args.email,
        name: resolvedName ?? existingByEmail.name,
        passwordHash,
        roleId: superAdminRole._id,
        status: "Active",
        superAdminTrialCreatedAt: undefined,
        superAdminTrialDurationDays: undefined,
        superAdminTrialExpiresAt: undefined,
      });

      if (existingSuperAdmin && existingSuperAdmin._id !== existingByEmail._id && adminRole) {
        await ctx.db.patch(existingSuperAdmin._id, { roleId: adminRole._id });
      }

      return { message: "Đã đảm bảo SuperAdmin theo cấu hình", success: true };
    }

    if (existingSuperAdmin) {
      const updates: Partial<Doc<"users">> = {};

      if (args.email !== existingSuperAdmin.email) {
        updates.email = args.email;
      }

      if (resolvedName) {
        updates.name = resolvedName;
      }

      updates.passwordHash = passwordHash;
      updates.superAdminTrialCreatedAt = undefined;
      updates.superAdminTrialDurationDays = undefined;
      updates.superAdminTrialExpiresAt = undefined;

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existingSuperAdmin._id, updates);
      }

      return { message: "Đã cập nhật SuperAdmin", success: true };
    }

    await ctx.db.insert("users", {
      email: args.email,
      name: resolvedName || "Super Admin",
      passwordHash,
      roleId: superAdminRole._id,
      status: "Active",
    });

    await updateUserStats(ctx, "total", 1);
    await updateUserStats(ctx, "Active", 1);

    return { message: "Đã tạo SuperAdmin", success: true };
  },
  returns: v.object({
    message: v.string(),
    success: v.boolean(),
  }),
});

// ============================================================
// PERMISSION HELPERS
// ============================================================

export const checkPermission = query({
  args: {
    action: v.string(),
    moduleKey: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session first
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    
    if (!session || session.expiresAt < Date.now()) {
      return { allowed: false, reason: "Session không hợp lệ" };
    }
    
    const adminUser = await ctx.db.get(session.userId);
    if (!adminUser || adminUser.status !== "Active") {
      return { allowed: false, reason: "Tài khoản không hợp lệ" };
    }
    
    const role = await ctx.db.get(adminUser.roleId);
    if (!role) {
      return { allowed: false, reason: "Role không tồn tại" };
    }

    // SuperAdmin has all permissions
    if (role.isSuperAdmin) {
      return { allowed: true, reason: "SuperAdmin" };
    }
    
    // Check if module is enabled
    const moduleRecord = await ctx.db
      .query("adminModules")
      .withIndex("by_key", (q) => q.eq("key", args.moduleKey))
      .unique();
    
    if (!moduleRecord || !moduleRecord.enabled) {
      return { allowed: false, reason: "Module chưa được bật" };
    }

    const permissionMode = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "admin_permission_mode"))
      .unique();

    if (permissionMode?.value === "simple_full_admin") {
      return { allowed: true, reason: "Simple full admin" };
    }
    
    // Check permissions
    const {permissions} = role;
    
    // Check wildcard
    if (permissions["*"]?.includes("*") || permissions["*"]?.includes(args.action)) {
      return { allowed: true, reason: "Wildcard permission" };
    }
    
    // Check module-specific permission
    if (permissions[args.moduleKey]?.includes("*") || permissions[args.moduleKey]?.includes(args.action)) {
      return { allowed: true, reason: "Module permission" };
    }
    
    return { allowed: false, reason: "Không có quyền thực hiện" };
  },
  returns: v.object({
    allowed: v.boolean(),
    reason: v.string(),
  }),
});

export const getCustomerClaimStateByOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    const customer = await ctx.db.get(order.customerId);
    if (!customer) return null;

    // Get order status settings
    const presetSetting = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", "orders").eq("settingKey", "orderStatusPreset")
      )
      .unique();
    const statusesSetting = await ctx.db
      .query("moduleSettings")
      .withIndex("by_module_setting", (q) =>
        q.eq("moduleKey", "orders").eq("settingKey", "orderStatuses")
      )
      .unique();

    const preset = normalizeOrderStatusPreset(presetSetting?.value);
    const statuses = parseOrderStatuses(statusesSetting?.value, preset);

    const currentStatus = statuses.find((status) => status.key === order.status);
    const allowCancel = currentStatus?.allowCancel ?? false;

    return {
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      canClaimAccount: !customer.passwordHash,
      allowCancel,
    };
  },
  returns: v.union(
    v.object({
      email: v.string(),
      name: v.string(),
      phone: v.string(),
      canClaimAccount: v.boolean(),
      allowCancel: v.boolean(),
    }),
    v.null()
  ),
});
