import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type SlugScope = "record" | "category";

const RESERVED_SLUGS = new Set([
  "about",
  "account",
  "admin",
  "api",
  "book",
  "cart",
  "checkout",
  "compare",
  "contact",
  "errors",
  "faq",
  "features",
  "guides",
  "integrations",
  "khoa-hoc",
  "login",
  "logout",
  "payment",
  "privacy",
  "courses",
  "projects",
  "products",
  "promotions",
  "posts",
  "resources",
  "return-policy",
  "services",
  "shipping",
  "solutions",
  "stores",
  "system",
  "templates",
  "terms",
  "use-cases",
  "wishlist",
]);

type SlugTable = "posts" | "products" | "services" | "courses" | "projects" | "resources" | "postCategories" | "productCategories" | "serviceCategories" | "courseCategories" | "projectCategories" | "resourceCategories";
type SlugId = Id<"posts"> | Id<"products"> | Id<"services"> | Id<"courses"> | Id<"projects"> | Id<"resources"> | Id<"postCategories"> | Id<"productCategories"> | Id<"serviceCategories"> | Id<"courseCategories"> | Id<"projectCategories"> | Id<"resourceCategories">;

const TABLES_BY_SCOPE: Record<SlugScope, SlugTable[]> = {
  record: ["posts", "products", "services", "courses", "projects", "resources"],
  category: ["postCategories", "productCategories", "serviceCategories", "courseCategories", "projectCategories", "resourceCategories"],
};

const normalizeSlug = (value: string) => value.trim().toLowerCase();

const isReservedSlug = (slug: string) => RESERVED_SLUGS.has(slug);

const isSlugTaken = async (ctx: QueryCtx | MutationCtx, params: {
  slug: string;
  scope: SlugScope;
  exclude?: { table: string; id: string };
}): Promise<boolean> => {
  const candidate = normalizeSlug(params.slug);
  if (!candidate) {return false;}
  if (isReservedSlug(candidate)) {return true;}

  for (const table of TABLES_BY_SCOPE[params.scope]) {
    const existing = await ctx.db
      .query(table)
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .unique();
    if (!existing) {continue;}
    if (params.exclude && params.exclude.table === table && existing._id === params.exclude.id) {
      continue;
    }
    return true;
  }

  return false;
};

export const getAutoResolveSetting = async (ctx: QueryCtx | MutationCtx): Promise<boolean> => {
  const setting = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", "ia_auto_resolve_slug"))
    .unique();
  return typeof setting?.value === "boolean" ? setting.value : true;
};

export const resolveUniqueSlug = async (ctx: QueryCtx | MutationCtx, params: {
  slug: string;
  scope: SlugScope;
  exclude?: { table: string; id: string };
  autoResolve?: boolean;
}): Promise<{ slug: string; wasAdjusted: boolean }> => {
  const baseSlug = normalizeSlug(params.slug);
  if (!baseSlug) {
    throw new ConvexError({ code: "INVALID_SLUG", message: "Slug không hợp lệ" });
  }

  const hasConflict = await isSlugTaken(ctx, { exclude: params.exclude, scope: params.scope, slug: baseSlug });
  if (!hasConflict) {
    return { slug: baseSlug, wasAdjusted: false };
  }

  const autoResolve = params.autoResolve ?? (await getAutoResolveSetting(ctx));
  if (!autoResolve) {
    throw new ConvexError({
      code: "DUPLICATE_SLUG",
      message: "Slug đã tồn tại, vui lòng chọn slug khác",
    });
  }

  for (let index = 1; index <= 50; index += 1) {
    const candidate = `${baseSlug}-${index}`;
    const taken = await isSlugTaken(ctx, { exclude: params.exclude, scope: params.scope, slug: candidate });
    if (!taken) {
      return { slug: candidate, wasAdjusted: true };
    }
  }

  throw new ConvexError({
    code: "UNIQUE_SLUG_GENERATION_FAILED",
    message: "Không thể tạo slug duy nhất, vui lòng thử lại",
  });
};

export const listSlugConflicts = async (ctx: QueryCtx | MutationCtx, scope: SlugScope | "all") => {
  const scopes = scope === "all" ? (["record", "category"] as const) : [scope];
  type SlugEntry = {
    slug: string;
    scope: SlugScope;
    table: SlugTable;
    id: SlugId;
    label: string;
  };
  const entries: SlugEntry[] = [];

  const addEntries = async (table: SlugTable, scopeKey: SlugScope) => {
    const docs = await ctx.db.query(table).take(1000);
    docs.forEach((doc) => {
      const normalizedDoc = doc as { _id: SlugEntry['id']; slug: string; title?: string; name?: string };
      const label = normalizedDoc.title ?? normalizedDoc.name ?? normalizedDoc.slug;
      entries.push({ id: normalizedDoc._id, label, scope: scopeKey, slug: normalizedDoc.slug, table });
    });
  };

  for (const scopeKey of scopes) {
    for (const table of TABLES_BY_SCOPE[scopeKey]) {
      await addEntries(table, scopeKey);
    }
  }

  const grouped = new Map<string, SlugEntry[]>();
  entries.forEach((entry) => {
    const key = `${entry.scope}:${entry.slug.toLowerCase()}`;
    const list = grouped.get(key) ?? [];
    list.push(entry);
    grouped.set(key, list);
  });

  return Array.from(grouped.entries())
    .filter(([, list]) => list.length > 1 || isReservedSlug(list[0]?.slug ?? ""))
    .map(([key, list]) => ({
      scope: key.split(":")[0] as SlugScope,
      slug: list[0]?.slug ?? "",
      reserved: isReservedSlug(list[0]?.slug ?? ""),
      items: list.map((item) => ({
        id: item.id,
        label: item.label,
        table: item.table,
      })),
    }));
};

export const resolveSlugConflicts = async (ctx: MutationCtx, scope: SlugScope | "all") => {
  const conflicts = await listSlugConflicts(ctx, scope);
  const updates: Array<Promise<void>> = [];

  for (const conflict of conflicts) {
    const items = conflict.items;
    if (items.length <= 1 && !conflict.reserved) {continue;}
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (index === 0 && !conflict.reserved) {continue;}
      const newSlug = `${conflict.slug}-${index + (conflict.reserved ? 1 : 0)}`;
      updates.push(ctx.db.patch(item.id, { slug: newSlug }));
    }
  }

  await Promise.all(updates);
  return conflicts.length;
};
