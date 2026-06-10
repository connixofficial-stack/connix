import { ConvexError } from "convex/values";

const SLUG_DUPLICATE_MESSAGES = new Set([
  "Slug already exists",
  "Slug đã tồn tại",
  "Slug này đã được sử dụng, vui lòng chọn slug khác",
]);

const SKU_DUPLICATE_MESSAGES = new Set(["SKU already exists"]);

const VOUCHER_DUPLICATE_MESSAGES = new Set(["Mã voucher đã tồn tại"]);

export const getAdminMutationErrorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof Error)) {
    return fallback;
  }
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string } | string | null | undefined;
    if (typeof data === "string" && data.trim()) {
      return data.trim();
    }
    if (data && typeof data === "object" && typeof data.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
  }
  const message = error.message?.trim();
  if (!message) {
    return fallback;
  }
  if (SLUG_DUPLICATE_MESSAGES.has(message)) {
    return "Slug đã tồn tại, vui lòng chọn slug khác";
  }
  if (SKU_DUPLICATE_MESSAGES.has(message)) {
    return "Mã SKU đã tồn tại, vui lòng chọn mã khác";
  }
  if (VOUCHER_DUPLICATE_MESSAGES.has(message)) {
    return "Mã voucher đã tồn tại, vui lòng chọn mã khác";
  }
  return message;
};
