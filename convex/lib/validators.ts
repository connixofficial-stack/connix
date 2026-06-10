import { v } from "convex/values";

// ============================================================
// SHARED VALIDATORS - Reusable validator fragments
// ============================================================

// Status validators
export const userStatus = v.union(
  v.literal("Active"),
  v.literal("Inactive"),
  v.literal("Banned")
);

export const customerStatus = v.union(
  v.literal("Active"),
  v.literal("Inactive")
);

export const contentStatus = v.union(
  v.literal("Published"),
  v.literal("Draft"),
  v.literal("Archived")
);

export const productStatus = v.union(
  v.literal("Active"),
  v.literal("Draft"),
  v.literal("Archived")
);

export const commentStatus = v.union(
  v.literal("Pending"),
  v.literal("Approved"),
  v.literal("Spam")
);

export const kanbanPriority = v.union(
  v.literal("LOW"),
  v.literal("MEDIUM"),
  v.literal("HIGH")
);

export const orderStatus = v.string();

export const paymentMethod = v.union(
  v.literal("COD"),
  v.literal("BankTransfer"),
  v.literal("VietQR"),
  v.literal("CreditCard"),
  v.literal("EWallet")
);

export const paymentStatus = v.union(
  v.literal("Pending"),
  v.literal("Paid"),
  v.literal("Failed"),
  v.literal("Refunded")
);

// Module category
export const moduleCategory = v.union(
  v.literal("content"),
  v.literal("commerce"),
  v.literal("user"),
  v.literal("system"),
  v.literal("marketing")
);

// Field types
export const fieldType = v.union(
  v.literal("text"),
  v.literal("textarea"),
  v.literal("richtext"),
  v.literal("number"),
  v.literal("price"),
  v.literal("boolean"),
  v.literal("image"),
  v.literal("gallery"),
  v.literal("select"),
  v.literal("date"),
  v.literal("daterange"),
  v.literal("email"),
  v.literal("phone"),
  v.literal("tags"),
  v.literal("password"),
  v.literal("json"),
  v.literal("color")
);

// Target type for polymorphic relations
export const targetType = v.union(v.literal("post"), v.literal("product"), v.literal("service"), v.literal("course"));

// Dependency type
export const dependencyType = v.union(v.literal("all"), v.literal("any"));

// ============================================================
// COMMON FIELD GROUPS
// ============================================================

// SEO fields
export const seoFields = {
  metaDescription: v.optional(v.string()),
  metaTitle: v.optional(v.string()),
  slug: v.string(),
};

// Timestamp fields (for manual tracking beyond _creationTime)
export const timestampFields = {
  publishedAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
};

// Ordering fields
export const orderingFields = {
  active: v.boolean(),
  order: v.number(),
};
