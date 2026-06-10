import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export const MULTI_CATEGORY_SETTING_KEY = "enableMultipleCategories";

export async function isMultiCategoryEnabled(
  ctx: QueryCtx | MutationCtx,
  moduleKey: "posts" | "products" | "services" | "courses" | "projects" | "resources",
) {
  const setting = await ctx.db
    .query("moduleSettings")
    .withIndex("by_module_setting", (q) => q.eq("moduleKey", moduleKey).eq("settingKey", MULTI_CATEGORY_SETTING_KEY))
    .unique();
  return Boolean(setting?.value);
}

function uniqueIds<T extends string>(ids: T[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

export async function syncPostCategoryAssignments(
  ctx: MutationCtx,
  postId: Id<"posts">,
  primaryCategoryId: Id<"postCategories">,
  additionalCategoryIds?: Id<"postCategories">[],
) {
  const categoryIds = uniqueIds([primaryCategoryId, ...(additionalCategoryIds ?? [])]);
  const existing = await ctx.db
    .query("postCategoryAssignments")
    .withIndex("by_post", (q) => q.eq("postId", postId))
    .collect();
  const next = new Set(categoryIds);
  await Promise.all(existing.filter((item) => !next.has(item.categoryId)).map((item) => ctx.db.delete(item._id)));
  const existingSet = new Set(existing.map((item) => item.categoryId));
  await Promise.all(categoryIds.filter((categoryId) => !existingSet.has(categoryId)).map((categoryId) =>
    ctx.db.insert("postCategoryAssignments", { categoryId, createdAt: Date.now(), postId })
  ));
}

export async function syncProductCategoryAssignments(
  ctx: MutationCtx,
  productId: Id<"products">,
  primaryCategoryId: Id<"productCategories">,
  additionalCategoryIds?: Id<"productCategories">[],
) {
  const categoryIds = uniqueIds([primaryCategoryId, ...(additionalCategoryIds ?? [])]);
  const existing = await ctx.db
    .query("productCategoryAssignments")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .collect();
  const next = new Set(categoryIds);
  await Promise.all(existing.filter((item) => !next.has(item.categoryId)).map((item) => ctx.db.delete(item._id)));
  const existingSet = new Set(existing.map((item) => item.categoryId));
  await Promise.all(categoryIds.filter((categoryId) => !existingSet.has(categoryId)).map((categoryId) =>
    ctx.db.insert("productCategoryAssignments", { categoryId, createdAt: Date.now(), productId })
  ));
}

export async function syncServiceCategoryAssignments(
  ctx: MutationCtx,
  serviceId: Id<"services">,
  primaryCategoryId: Id<"serviceCategories">,
  additionalCategoryIds?: Id<"serviceCategories">[],
) {
  const categoryIds = uniqueIds([primaryCategoryId, ...(additionalCategoryIds ?? [])]);
  const existing = await ctx.db
    .query("serviceCategoryAssignments")
    .withIndex("by_service", (q) => q.eq("serviceId", serviceId))
    .collect();
  const next = new Set(categoryIds);
  await Promise.all(existing.filter((item) => !next.has(item.categoryId)).map((item) => ctx.db.delete(item._id)));
  const existingSet = new Set(existing.map((item) => item.categoryId));
  await Promise.all(categoryIds.filter((categoryId) => !existingSet.has(categoryId)).map((categoryId) =>
    ctx.db.insert("serviceCategoryAssignments", { categoryId, createdAt: Date.now(), serviceId })
  ));
}

export async function syncProjectCategoryAssignments(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  primaryCategoryId: Id<"projectCategories">,
  additionalCategoryIds?: Id<"projectCategories">[],
) {
  const categoryIds = uniqueIds([primaryCategoryId, ...(additionalCategoryIds ?? [])]);
  const existing = await ctx.db
    .query("projectCategoryAssignments")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .take(1000);
  const next = new Set(categoryIds);
  await Promise.all(existing.filter((item) => !next.has(item.categoryId)).map((item) => ctx.db.delete(item._id)));
  const existingSet = new Set(existing.map((item) => item.categoryId));
  await Promise.all(categoryIds.filter((categoryId) => !existingSet.has(categoryId)).map((categoryId) =>
    ctx.db.insert("projectCategoryAssignments", { categoryId, createdAt: Date.now(), projectId })
  ));
}

export async function syncCourseCategoryAssignments(
  ctx: MutationCtx,
  courseId: Id<"courses">,
  primaryCategoryId: Id<"courseCategories">,
  additionalCategoryIds?: Id<"courseCategories">[],
) {
  const categoryIds = uniqueIds([primaryCategoryId, ...(additionalCategoryIds ?? [])]);
  const existing = await ctx.db
    .query("courseCategoryAssignments")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .collect();
  const next = new Set(categoryIds);
  await Promise.all(existing.filter((item) => !next.has(item.categoryId)).map((item) => ctx.db.delete(item._id)));
  const existingSet = new Set(existing.map((item) => item.categoryId));
  await Promise.all(categoryIds.filter((categoryId) => !existingSet.has(categoryId)).map((categoryId) =>
    ctx.db.insert("courseCategoryAssignments", { categoryId, courseId, createdAt: Date.now() })
  ));
}

export async function syncResourceCategoryAssignments(
  ctx: MutationCtx,
  resourceId: Id<"resources">,
  primaryCategoryId: Id<"resourceCategories">,
  additionalCategoryIds?: Id<"resourceCategories">[],
) {
  const categoryIds = uniqueIds([primaryCategoryId, ...(additionalCategoryIds ?? [])]);
  const existing = await ctx.db
    .query("resourceCategoryAssignments")
    .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
    .collect();
  const next = new Set(categoryIds);
  await Promise.all(existing.filter((item) => !next.has(item.categoryId)).map((item) => ctx.db.delete(item._id)));
  const existingSet = new Set(existing.map((item) => item.categoryId));
  await Promise.all(categoryIds.filter((categoryId) => !existingSet.has(categoryId)).map((categoryId) =>
    ctx.db.insert("resourceCategoryAssignments", { categoryId, resourceId, createdAt: Date.now() })
  ));
}

export async function listPostAdditionalCategoryIds(ctx: QueryCtx, postId: Id<"posts">, primaryCategoryId: Id<"postCategories">) {
  const rows = await ctx.db.query("postCategoryAssignments").withIndex("by_post", (q) => q.eq("postId", postId)).collect();
  return rows.map((row) => row.categoryId).filter((categoryId) => categoryId !== primaryCategoryId);
}

export async function listProductAdditionalCategoryIds(ctx: QueryCtx, productId: Id<"products">, primaryCategoryId: Id<"productCategories">) {
  const rows = await ctx.db.query("productCategoryAssignments").withIndex("by_product", (q) => q.eq("productId", productId)).collect();
  return rows.map((row) => row.categoryId).filter((categoryId) => categoryId !== primaryCategoryId);
}

export async function listServiceAdditionalCategoryIds(ctx: QueryCtx, serviceId: Id<"services">, primaryCategoryId: Id<"serviceCategories">) {
  const rows = await ctx.db.query("serviceCategoryAssignments").withIndex("by_service", (q) => q.eq("serviceId", serviceId)).collect();
  return rows.map((row) => row.categoryId).filter((categoryId) => categoryId !== primaryCategoryId);
}

export async function listProjectAdditionalCategoryIds(ctx: QueryCtx, projectId: Id<"projects">, primaryCategoryId: Id<"projectCategories">) {
  const rows = await ctx.db.query("projectCategoryAssignments").withIndex("by_project", (q) => q.eq("projectId", projectId)).take(1000);
  return rows.map((row) => row.categoryId).filter((categoryId) => categoryId !== primaryCategoryId);
}

export async function listCourseAdditionalCategoryIds(ctx: QueryCtx, courseId: Id<"courses">, primaryCategoryId: Id<"courseCategories">) {
  const rows = await ctx.db.query("courseCategoryAssignments").withIndex("by_course", (q) => q.eq("courseId", courseId)).collect();
  return rows.map((row) => row.categoryId).filter((categoryId) => categoryId !== primaryCategoryId);
}

export async function listResourceAdditionalCategoryIds(ctx: QueryCtx, resourceId: Id<"resources">, primaryCategoryId: Id<"resourceCategories">) {
  const rows = await ctx.db.query("resourceCategoryAssignments").withIndex("by_resource", (q) => q.eq("resourceId", resourceId)).collect();
  return rows.map((row) => row.categoryId).filter((categoryId) => categoryId !== primaryCategoryId);
}

export async function mergePostsByCategoryAssignments(
  ctx: QueryCtx,
  categoryId: Id<"postCategories">,
  primaryPosts: Doc<"posts">[],
  limit: number,
) {
  const assignments = await ctx.db.query("postCategoryAssignments").withIndex("by_category", (q) => q.eq("categoryId", categoryId)).take(limit);
  const assignedPosts = await Promise.all(assignments.map((item) => ctx.db.get(item.postId)));
  const map = new Map<Id<"posts">, Doc<"posts">>();
  [...primaryPosts, ...assignedPosts.filter((item): item is Doc<"posts"> => Boolean(item))].forEach((post) => map.set(post._id, post));
  return Array.from(map.values());
}

export async function mergeProductsByCategoryAssignments(
  ctx: QueryCtx,
  categoryId: Id<"productCategories">,
  primaryProducts: Doc<"products">[],
  limit: number,
) {
  const assignments = await ctx.db.query("productCategoryAssignments").withIndex("by_category", (q) => q.eq("categoryId", categoryId)).take(limit);
  const assignedProducts = await Promise.all(assignments.map((item) => ctx.db.get(item.productId)));
  const map = new Map<Id<"products">, Doc<"products">>();
  [...primaryProducts, ...assignedProducts.filter((item): item is Doc<"products"> => Boolean(item))].forEach((product) => map.set(product._id, product));
  return Array.from(map.values());
}

export async function mergeServicesByCategoryAssignments(
  ctx: QueryCtx,
  categoryId: Id<"serviceCategories">,
  primaryServices: Doc<"services">[],
  limit: number,
) {
  const assignments = await ctx.db.query("serviceCategoryAssignments").withIndex("by_category", (q) => q.eq("categoryId", categoryId)).take(limit);
  const assignedServices = await Promise.all(assignments.map((item) => ctx.db.get(item.serviceId)));
  const map = new Map<Id<"services">, Doc<"services">>();
  [...primaryServices, ...assignedServices.filter((item): item is Doc<"services"> => Boolean(item))].forEach((service) => map.set(service._id, service));
  return Array.from(map.values());
}

export async function mergeProjectsByCategoryAssignments(
  ctx: QueryCtx,
  categoryId: Id<"projectCategories">,
  primaryProjects: Doc<"projects">[],
  limit: number,
) {
  const assignments = await ctx.db.query("projectCategoryAssignments").withIndex("by_category", (q) => q.eq("categoryId", categoryId)).take(limit);
  const assignedProjects = await Promise.all(assignments.map((item) => ctx.db.get(item.projectId)));
  const map = new Map<Id<"projects">, Doc<"projects">>();
  [...primaryProjects, ...assignedProjects.filter((item): item is Doc<"projects"> => Boolean(item))].forEach((project) => map.set(project._id, project));
  return Array.from(map.values());
}

export async function mergeCoursesByCategoryAssignments(
  ctx: QueryCtx,
  categoryId: Id<"courseCategories">,
  primaryCourses: Doc<"courses">[],
  limit: number,
) {
  const assignments = await ctx.db.query("courseCategoryAssignments").withIndex("by_category", (q) => q.eq("categoryId", categoryId)).take(limit);
  const assignedCourses = await Promise.all(assignments.map((item) => ctx.db.get(item.courseId)));
  const map = new Map<Id<"courses">, Doc<"courses">>();
  [...primaryCourses, ...assignedCourses.filter((item): item is Doc<"courses"> => Boolean(item))].forEach((course) => map.set(course._id, course));
  return Array.from(map.values());
}

export async function mergeResourcesByCategoryAssignments(
  ctx: QueryCtx,
  categoryId: Id<"resourceCategories">,
  primaryResources: Doc<"resources">[],
  limit: number,
) {
  const assignments = await ctx.db.query("resourceCategoryAssignments").withIndex("by_category", (q) => q.eq("categoryId", categoryId)).take(limit);
  const assignedResources = await Promise.all(assignments.map((item) => ctx.db.get(item.resourceId)));
  const map = new Map<Id<"resources">, Doc<"resources">>();
  [...primaryResources, ...assignedResources.filter((item): item is Doc<"resources"> => Boolean(item))].forEach((resource) => map.set(resource._id, resource));
  return Array.from(map.values());
}
