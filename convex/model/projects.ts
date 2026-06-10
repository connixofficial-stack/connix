import { resolveUniqueSlug } from "../lib/iaSlugs";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

const MAX_ITEMS_LIMIT = 100;

type ProjectStatus = Doc<"projects">["status"];
type RenderType = "content" | "markdown" | "html";
type VideoType = "none" | "youtube" | "drive" | "external";

export async function getById(
  ctx: QueryCtx,
  { id }: { id: Id<"projects"> }
): Promise<Doc<"projects"> | null> {
  return ctx.db.get(id);
}

export async function getByIdOrThrow(
  ctx: QueryCtx,
  { id }: { id: Id<"projects"> }
): Promise<Doc<"projects">> {
  const project = await ctx.db.get(id);
  if (!project) {throw new Error("Project not found");}
  return project;
}

export async function getBySlug(
  ctx: QueryCtx,
  { slug }: { slug: string }
): Promise<Doc<"projects"> | null> {
  return ctx.db
    .query("projects")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

export async function listWithLimit(
  ctx: QueryCtx,
  { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}
): Promise<Doc<"projects">[]> {
  return ctx.db
    .query("projects")
    .order("desc")
    .take(Math.min(limit, MAX_ITEMS_LIMIT));
}

export async function countWithLimit(
  ctx: QueryCtx,
  { status, limit = 1000 }: { status?: ProjectStatus; limit?: number } = {}
): Promise<{ count: number; hasMore: boolean }> {
  const query = status
    ? ctx.db.query("projects").withIndex("by_status_publishedAt", (q) => q.eq("status", status))
    : ctx.db.query("projects");

  const items = await query.take(limit + 1);
  return {
    count: Math.min(items.length, limit),
    hasMore: items.length > limit,
  };
}

export async function getNextOrder(ctx: QueryCtx): Promise<number> {
  const lastProject = await ctx.db.query("projects").order("desc").first();
  return lastProject ? lastProject.order + 1 : 0;
}

export async function create(
  ctx: MutationCtx,
  args: {
    categoryId: Id<"projectCategories">;
    clientName?: string;
    completedAt?: number;
    content: string;
    excerpt?: string;
    featured?: boolean;
    htmlRender?: string;
    images?: string[];
    imageStorageIds?: Array<Id<"_storage"> | null>;
    introVideoType?: VideoType;
    introVideoUrl?: string;
    markdownRender?: string;
    metaDescription?: string;
    metaTitle?: string;
    order?: number;
    projectUrl?: string;
    renderType?: RenderType;
    slug: string;
    status?: ProjectStatus;
    thumbnail?: string;
    thumbnailStorageId?: Id<"_storage"> | null;
    title: string;
  }
): Promise<Id<"projects">> {
  const resolvedSlug = await resolveUniqueSlug(ctx, {
    scope: "record",
    slug: args.slug,
  });

  const order = args.order ?? (await getNextOrder(ctx));
  const status = args.status ?? "Draft";

  return ctx.db.insert("projects", {
    categoryId: args.categoryId,
    clientName: args.clientName,
    completedAt: args.completedAt,
    content: args.content,
    excerpt: args.excerpt,
    featured: args.featured,
    htmlRender: args.htmlRender,
    images: args.images,
    imageStorageIds: args.imageStorageIds,
    introVideoType: args.introVideoType ?? "none",
    introVideoUrl: args.introVideoUrl,
    markdownRender: args.markdownRender,
    metaDescription: args.metaDescription,
    metaTitle: args.metaTitle,
    order,
    projectUrl: args.projectUrl,
    publishedAt: status === "Published" ? Date.now() : undefined,
    renderType: args.renderType ?? "content",
    slug: resolvedSlug.slug,
    status,
    thumbnail: args.thumbnail,
    thumbnailStorageId: args.thumbnailStorageId ?? null,
    title: args.title,
    views: 0,
  });
}

export async function update(
  ctx: MutationCtx,
  args: {
    categoryId?: Id<"projectCategories">;
    clientName?: string;
    completedAt?: number;
    content?: string;
    excerpt?: string;
    featured?: boolean;
    htmlRender?: string;
    id: Id<"projects">;
    images?: string[];
    imageStorageIds?: Array<Id<"_storage"> | null>;
    introVideoType?: VideoType;
    introVideoUrl?: string;
    markdownRender?: string;
    metaDescription?: string;
    metaTitle?: string;
    order?: number;
    projectUrl?: string;
    renderType?: RenderType;
    slug?: string;
    status?: ProjectStatus;
    thumbnail?: string;
    thumbnailStorageId?: Id<"_storage"> | null;
    title?: string;
  }
): Promise<void> {
  const project = await getByIdOrThrow(ctx, { id: args.id });

  if (args.slug && args.slug !== project.slug) {
    const resolvedSlug = await resolveUniqueSlug(ctx, {
      scope: "record",
      slug: args.slug,
      exclude: { id: args.id, table: "projects" },
    });
    if (resolvedSlug.slug !== args.slug) {
      (args as { slug?: string }).slug = resolvedSlug.slug;
    }
  }

  const { id, ...updates } = args;
  const patchData: Record<string, unknown> = { ...updates };

  if (args.status === "Published" && project.status !== "Published") {
    patchData.publishedAt = Date.now();
  }

  await ctx.db.patch(id, patchData);
}

export async function remove(
  ctx: MutationCtx,
  { id }: { id: Id<"projects"> }
): Promise<void> {
  await getByIdOrThrow(ctx, { id });
  const assignments = await ctx.db
    .query("projectCategoryAssignments")
    .withIndex("by_project", (q) => q.eq("projectId", id))
    .take(1000);
  await Promise.all(assignments.map((assignment) => ctx.db.delete(assignment._id)));
  await ctx.db.delete(id);
}

export async function getDeleteInfo(
  ctx: QueryCtx,
  { id }: { id: Id<"projects"> }
): Promise<{ canDelete: boolean; dependencies: { count: number; hasMore: boolean; label: string; preview: { id: string; name: string }[] }[] }> {
  const assignments = await ctx.db
    .query("projectCategoryAssignments")
    .withIndex("by_project", (q) => q.eq("projectId", id))
    .take(1001);

  return {
    canDelete: true,
    dependencies: [
      {
        count: Math.min(assignments.length, 1000),
        hasMore: assignments.length > 1000,
        label: "Danh mục phụ",
        preview: assignments.slice(0, 10).map((assignment) => ({ id: assignment._id, name: assignment.categoryId })),
      },
    ],
  };
}

export async function incrementViews(
  ctx: MutationCtx,
  { id }: { id: Id<"projects"> }
): Promise<void> {
  const project = await getByIdOrThrow(ctx, { id });
  await ctx.db.patch(id, { views: project.views + 1 });
}
