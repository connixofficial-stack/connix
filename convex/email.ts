"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";
import { api, internal } from "./_generated/api";
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";

// ============================================================
// HELPERS & CORE BUSINESS LOGIC
// ============================================================

async function sendTransactionalEmailInternal(
  ctx: any,
  args: {
    to: string;
    subject: string;
    html: string;
    eventType: string;
    orderId?: string;
  }
) {
  const settings: Record<string, any> = await ctx.runQuery(api.settings.getMultiple, {
    keys: [
      "mail_driver",
      "mail_host",
      "mail_port",
      "mail_username",
      "mail_password",
      "mail_encryption",
      "mail_from_email",
      "mail_from_name",
      "resend_accounts",
      "site_name",
      "site_url",
    ],
  });

  const driver = (settings.mail_driver ?? "smtp").trim().toLowerCase();
  const fromEmail = (settings.mail_from_email ?? "").trim();
  const fromName = (settings.mail_from_name ?? "").trim();
  
  // Parse recipients safely
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const toList = Array.from(
    new Set(
      args.to
        .split(/[,\n;]+/)
        .map((email: string) => email.trim())
        .filter((email: string) => emailRegex.test(email))
    )
  );
  const recipientCount = toList.length;
  if (recipientCount === 0) {
    return { success: false, reason: "Không có địa chỉ email nhận hợp lệ" };
  }

  const idempotencyKey = args.orderId ? `${args.orderId}:${args.eventType}` : undefined;

  // Check idempotency
  if (idempotencyKey) {
    const isAlreadySent = await ctx.runQuery(internal.emailDb.checkIdempotency, { idempotencyKey });
    if (isAlreadySent) {
      console.log(`[Email Service] Skip sending due to duplicate idempotencyKey: ${idempotencyKey}`);
      return { success: true, reason: "Email đã được gửi trước đó" };
    }
  }

  // ─── SMTP Driver ────────────────────────────────────────────────────────
  if (driver === "smtp") {
    const host = (settings.mail_host ?? "").trim();
    const portValue = Number(settings.mail_port ?? 0);
    const username = (settings.mail_username ?? "").trim();
    const password = (settings.mail_password ?? "").trim();
    const encryption = (settings.mail_encryption ?? "").trim();

    if (!host || !portValue || !username || !password || !fromEmail) {
      console.warn("[Email Service] SMTP is not configured. Logging email content to console.");
      console.log(`[CONSOLE SMTP MAIL] To: ${args.to}, Subject: ${args.subject}`);
      
      await ctx.runMutation(internal.emailDb.logEmailDispatch, {
        eventType: args.eventType,
        orderId: args.orderId,
        recipient: args.to,
        provider: "smtp",
        accountId: "smtp",
        status: "failed",
        idempotencyKey,
      });

      return { success: false, reason: "Thiếu cấu hình SMTP" };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port: portValue,
        secure: encryption === "ssl",
        auth: {
          user: username,
          pass: password,
        },
      });

      const info = await transporter.sendMail({
        from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
        to: toList,
        subject: args.subject,
        html: args.html,
      });

      await ctx.runMutation(internal.emailDb.logEmailDispatch, {
        eventType: args.eventType,
        orderId: args.orderId,
        recipient: args.to,
        provider: "smtp",
        accountId: "smtp",
        status: "success",
        emailId: info.messageId,
        idempotencyKey,
      });

      return { success: true };
    } catch (error) {
      console.error("[Email Service] Failed to send email via SMTP:", error);
      
      await ctx.runMutation(internal.emailDb.logEmailDispatch, {
        eventType: args.eventType,
        orderId: args.orderId,
        recipient: args.to,
        provider: "smtp",
        accountId: "smtp",
        status: "failed",
        idempotencyKey,
      });

      return { success: false, reason: "Lỗi kết nối hoặc gửi SMTP" };
    }
  }

  // ─── Resend Driver ──────────────────────────────────────────────────────
  if (driver === "resend") {
    let accounts: any[] = [];
    try {
      const rawAccounts = settings.resend_accounts;
      if (typeof rawAccounts === "string") {
        accounts = JSON.parse(rawAccounts);
      } else if (Array.isArray(rawAccounts)) {
        accounts = rawAccounts;
      }
    } catch (e) {
      console.error("[Email Service] Failed to parse resend_accounts JSON:", e);
    }

    const activeAccounts = accounts.filter((acc) => acc.enabled && acc.apiKey);
    if (activeAccounts.length === 0) {
      console.warn("[Email Service] No active Resend accounts found. Skip sending.");
      
      await ctx.runMutation(internal.emailDb.logEmailDispatch, {
        eventType: args.eventType,
        orderId: args.orderId,
        recipient: args.to,
        provider: "resend",
        accountId: "none",
        status: "failed",
        idempotencyKey,
      });

      return { success: false, reason: "Không có tài khoản Resend hoạt động" };
    }

    // Prepare date keys for quota checking
    const date = new Date();
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    // Check current usage of all active accounts in parallel
    const accountIds = activeAccounts.map((acc) => acc.id);
    const usage = await ctx.runQuery(internal.emailDb.getAccountsUsage, {
      accountIds,
      dateKey,
      monthKey,
    });

    // Filter accounts that have enough daily and monthly quota
    const eligibleAccounts = activeAccounts.filter((acc) => {
      const dailyLimit = acc.dailyLimit ?? 100;
      const monthlyLimit = acc.monthlyLimit ?? 3000;
      const dailyUsage = usage.dailyUsageMap[acc.id] ?? 0;
      const monthlyUsage = usage.monthlyUsageMap[acc.id] ?? 0;

      return (
        dailyUsage + recipientCount <= dailyLimit &&
        monthlyUsage + recipientCount <= monthlyLimit
      );
    });

    if (eligibleAccounts.length === 0) {
      console.error("[Email Service] Quota exhausted for all Resend accounts!");
      
      // Log dispatch with skipped status
      await ctx.runMutation(internal.emailDb.logEmailDispatch, {
        eventType: args.eventType,
        orderId: args.orderId,
        recipient: args.to,
        provider: "resend",
        accountId: "all",
        status: "skipped_quota_exhausted",
        idempotencyKey,
      });

      // Bắn thông báo hệ thống cho Admin biết
      await ctx.runMutation(internal.emailDb.createSystemNotification, {
        title: "Cần kiểm tra kênh gửi email",
        content: `Một số email chưa được gửi tự động do giới hạn gửi. Vui lòng liên hệ dev để kiểm tra.`,
        type: "error",
      });

      return { success: false, reason: "Tất cả tài khoản Resend hết quota" };
    }

    // Select the account with the lowest daily usage to load balance
    eligibleAccounts.sort((a, b) => {
      const usageA = usage.dailyUsageMap[a.id] ?? 0;
      const usageB = usage.dailyUsageMap[b.id] ?? 0;
      return usageA - usageB;
    });

    const selectedAccount = eligibleAccounts[0];

    try {
      // Increment usage counters first (concurrency reservation)
      await ctx.runMutation(internal.emailDb.incrementUsage, {
        accountId: selectedAccount.id,
        dateKey,
        monthKey,
        recipientCount,
      });

      // Initialize Convex Resend component client
      // @ts-ignore
      const resendClient = new Resend(components.resend, {
        apiKey: selectedAccount.apiKey,
        testMode: selectedAccount.testMode !== false, // default to testMode: true if not specified
      });

      const brandName = (settings.site_name ?? "YourBrand").trim();
      const finalFromEmail = selectedAccount.fromEmail || fromEmail;
      const finalFromName = selectedAccount.fromName || fromName || brandName || "Store";

      const response = await resendClient.sendEmail(ctx, {
        from: finalFromName ? `${finalFromName} <${finalFromEmail}>` : finalFromEmail,
        to: toList,
        subject: args.subject,
        html: args.html,
      });

      await ctx.runMutation(internal.emailDb.logEmailDispatch, {
        eventType: args.eventType,
        orderId: args.orderId,
        recipient: args.to,
        provider: "resend",
        accountId: selectedAccount.id,
        status: "success",
        emailId: response,
        idempotencyKey,
      });

      return { success: true };
    } catch (error) {
      console.error(`[Email Service] Failed to send email via Resend account [${selectedAccount.label}]:`, error);

      await ctx.runMutation(internal.emailDb.logEmailDispatch, {
        eventType: args.eventType,
        orderId: args.orderId,
        recipient: args.to,
        provider: "resend",
        accountId: selectedAccount.id,
        status: "failed",
        idempotencyKey,
      });

      return { success: false, reason: "Lỗi kết nối API Resend" };
    }
  }

  return { success: false, reason: "Driver không hợp lệ" };
}

// ============================================================
// MAIN EMAIL ACTIONS
// ============================================================

export const sendTransactionalEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    eventType: v.string(),
    orderId: v.optional(v.id("orders")),
  },
  handler: async (ctx, args) => {
    return await sendTransactionalEmailInternal(ctx, args);
  },
});

// Gửi email OTP (Backward compatible)
export const sendOtpEmail = internalAction({
  args: {
    email: v.string(),
    otpCode: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const settings = (await ctx.runQuery(api.settings.getMultiple, {
      keys: ["site_name"],
    })) as Record<string, any>;
    const brandName = settings.site_name ? String(settings.site_name).trim() : "YourBrand";

    const { getOtpTemplate } = await import("./emailTemplates");
    const htmlContent = getOtpTemplate(args.otpCode, brandName);

    return await sendTransactionalEmailInternal(ctx, {
      to: args.email,
      subject: `[${brandName}] Mã xác minh tạo mật khẩu`,
      html: htmlContent,
      eventType: "otp",
    });
  },
});

export const sendTestEmailAction = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, args) => {
    return await sendTransactionalEmailInternal(ctx, {
      to: args.to,
      subject: args.subject,
      html: args.html,
      eventType: "test",
    });
  },
});
