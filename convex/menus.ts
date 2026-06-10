import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { MENU_MAX_DEPTH, clampMenuDepth } from "../lib/utils/menu-tree";
import { TRUST_PAGE_SLOTS } from "../lib/ia/trust-pages";

const menuDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("menus"),
  location: v.string(),
  name: v.string(),
});

const menuItemDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("menuItems"),
  active: v.boolean(),
  depth: v.number(),
  icon: v.optional(v.string()),
  label: v.string(),
  menuId: v.id("menus"),
  openInNewTab: v.optional(v.boolean()),
  order: v.number(),
  parentId: v.optional(v.id("menuItems")),
  url: v.string(),
});

const normalizeMenuDepth = (depth: number | undefined) => clampMenuDepth(depth ?? 0);
const MENU_ITEMS_LIMIT = 500;

const ensureMenuItemsWithinLimit = (count: number) => {
  if (count >= MENU_ITEMS_LIMIT) {
    throw new Error(`Tối đa ${MENU_ITEMS_LIMIT} menu items`);
  }
};

// ============ MENUS ============

// HIGH-005 FIX: Thêm limit
export const listMenus = query({
  args: {},
  handler: async (ctx) => ctx.db.query("menus").take(50),
  returns: v.array(menuDoc),
});

export const getMenuById = query({
  args: { id: v.id("menus") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(menuDoc, v.null()),
});

export const getMenuByLocation = query({
  args: { location: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("menus")
      .withIndex("by_location", (q) => q.eq("location", args.location))
      .unique(),
  returns: v.union(menuDoc, v.null()),
});

export const createMenu = mutation({
  args: { location: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("menus")
      .withIndex("by_location", (q) => q.eq("location", args.location))
      .unique();
    if (existing) {throw new Error("Menu location already exists");}
    return  ctx.db.insert("menus", args);
  },
  returns: v.id("menus"),
});

export const updateMenu = mutation({
  args: {
    id: v.id("menus"),
    location: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const menu = await ctx.db.get(id);
    if (!menu) {throw new Error("Menu not found");}
    if (args.location && args.location !== menu.location) {
      const newLocation = args.location;
      const existing = await ctx.db
        .query("menus")
        .withIndex("by_location", (q) => q.eq("location", newLocation))
        .unique();
      if (existing) {throw new Error("Menu location already exists");}
    }
    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

// TICKET #4 FIX: Dùng Promise.all thay vì sequential deletes
export const removeMenu = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("menus") },
  handler: async (ctx, args) => {
    const menu = await ctx.db.get(args.id);
    if (!menu) {throw new Error("Menu not found");}

    const preview = await ctx.db
      .query("menuItems")
      .withIndex("by_menu_order", (q) => q.eq("menuId", args.id))
      .take(1);
    if (preview.length > 0 && !args.cascade) {
      throw new Error("Menu có items liên quan. Vui lòng xác nhận xóa tất cả.");
    }

    if (args.cascade) {
      const items = await ctx.db
        .query("menuItems")
        .withIndex("by_menu_order", (q) => q.eq("menuId", args.id))
        .collect();
      await Promise.all(items.map( async item => ctx.db.delete(item._id)));
    }

    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("menus") },
  handler: async (ctx, args) => {
    const preview = await ctx.db
      .query("menuItems")
      .withIndex("by_menu_order", (q) => q.eq("menuId", args.id))
      .take(10);
    const count = await ctx.db
      .query("menuItems")
      .withIndex("by_menu_order", (q) => q.eq("menuId", args.id))
      .take(1001);

    return {
      canDelete: true,
      dependencies: [
        {
          count: Math.min(count.length, 1000),
          hasMore: count.length > 1000,
          label: "Menu items",
          preview: preview.map((item) => ({ id: item._id, name: item.label })),
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

// ============ MENU ITEMS ============

// HIGH-005 FIX: Thêm limit
export const listMenuItems = query({
  args: { menuId: v.id("menus") },
  handler: async (ctx, args) => ctx.db
      .query("menuItems")
      .withIndex("by_menu_order", (q) => q.eq("menuId", args.menuId))
      .take(MENU_ITEMS_LIMIT),
  returns: v.array(menuItemDoc),
});

// HIGH-005 FIX: Thêm limit
export const listActiveMenuItems = query({
  args: { menuId: v.id("menus") },
  handler: async (ctx, args) => ctx.db
      .query("menuItems")
      .withIndex("by_menu_active", (q) => q.eq("menuId", args.menuId).eq("active", true))
      .take(100),
  returns: v.array(menuItemDoc),
});

export const getMenuItemById = query({
  args: { id: v.id("menuItems") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(menuItemDoc, v.null()),
});

// HIGH-005 FIX: Thêm limit
export const listChildItems = query({
  args: { parentId: v.id("menuItems") },
  handler: async (ctx, args) => ctx.db
      .query("menuItems")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .take(50),
  returns: v.array(menuItemDoc),
});

// HIGH-003 FIX: Dùng order("desc").first() thay vì count + MED-005: URL validation
export const createMenuItem = mutation({
  args: {
    active: v.optional(v.boolean()),
    depth: v.optional(v.number()),
    icon: v.optional(v.string()),
    label: v.string(),
    menuId: v.id("menus"),
    openInNewTab: v.optional(v.boolean()),
    order: v.optional(v.number()),
    parentId: v.optional(v.id("menuItems")),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const existingCount = (await ctx.db
      .query("menuItems")
      .withIndex("by_menu_order", (q) => q.eq("menuId", args.menuId))
      .take(MENU_ITEMS_LIMIT)).length;
    ensureMenuItemsWithinLimit(existingCount);

    // MED-005: Basic URL validation
    const url = args.url.trim();
    if (!url) {
      throw new Error("URL không được để trống");
    }
    // Allow relative URLs starting with / or #, or absolute URLs
    if (!url.startsWith("/") && !url.startsWith("#") && !url.startsWith("http")) {
      throw new Error("URL phải bắt đầu bằng /, # hoặc http");
    }
    
    // HIGH-003 FIX: Get order from last item instead of count
    const lastItem = await ctx.db
      .query("menuItems")
      .withIndex("by_menu_order", (q) => q.eq("menuId", args.menuId))
      .order("desc")
      .first();
    const newOrder = args.order ?? (lastItem ? lastItem.order + 1 : 0);
    
    return  ctx.db.insert("menuItems", {
      ...args,
      url,
      order: newOrder,
      depth: normalizeMenuDepth(args.depth),
      active: args.active ?? true,
    });
  },
  returns: v.id("menuItems"),
});

// TICKET #7 FIX: Thêm URL validation như createMenuItem
export const updateMenuItem = mutation({
  args: {
    active: v.optional(v.boolean()),
    depth: v.optional(v.number()),
    icon: v.optional(v.string()),
    id: v.id("menuItems"),
    label: v.optional(v.string()),
    openInNewTab: v.optional(v.boolean()),
    order: v.optional(v.number()),
    parentId: v.optional(v.id("menuItems")),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const item = await ctx.db.get(id);
    if (!item) {throw new Error("Menu item not found");}
    
    // URL validation nếu được cập nhật
    if (updates.url !== undefined) {
      const url = updates.url.trim();
      if (!url) {
        throw new Error("URL không được để trống");
      }
      if (!url.startsWith("/") && !url.startsWith("#") && !url.startsWith("http")) {
        throw new Error("URL phải bắt đầu bằng /, # hoặc http");
      }
      updates.url = url;
    }

    if (updates.depth !== undefined) {
      updates.depth = normalizeMenuDepth(updates.depth);
    }
    
    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

// TICKET #5 FIX: Recursive delete với Promise.all
export const removeMenuItem = mutation({
  args: { id: v.id("menuItems") },
  handler: async (ctx, args) => {
    // Recursive function để xóa item và tất cả descendants
    const deleteWithChildren = async (itemId: typeof args.id): Promise<void> => {
      const children = await ctx.db
        .query("menuItems")
        .withIndex("by_parent", (q) => q.eq("parentId", itemId))
        .collect();
      // Xóa tất cả children đệ quy (parallel)
      await Promise.all(children.map( async child => deleteWithChildren(child._id)));
      // Xóa item hiện tại
      await ctx.db.delete(itemId);
    };
    
    await deleteWithChildren(args.id);
    return null;
  },
  returns: v.null(),
});

// TICKET #3 FIX: Dùng Promise.all thay vì sequential updates
export const reorderMenuItems = mutation({
  args: { items: v.array(v.object({ depth: v.optional(v.number()), id: v.id("menuItems"), order: v.number() })) },
  handler: async (ctx, args) => {
    await Promise.all(args.items.map( async item => {
      const updates: Record<string, number> = { order: item.order };
      if (item.depth !== undefined) {updates.depth = normalizeMenuDepth(item.depth);}
      return ctx.db.patch(item.id, updates);
    }));
    return null;
  },
  returns: v.null(),
});

export const saveMenuItemsBulk = mutation({
  args: {
    menuId: v.id("menus"),
    items: v.array(v.object({
      id: v.optional(v.id("menuItems")),
      label: v.string(),
      url: v.string(),
      depth: v.number(),
      active: v.boolean(),
      icon: v.optional(v.string()),
      openInNewTab: v.optional(v.boolean()),
      parentId: v.optional(v.id("menuItems")),
    })),
  },
  handler: async (ctx, args) => {
    if (args.items.length > MENU_ITEMS_LIMIT) {
      throw new Error(`Tối đa ${MENU_ITEMS_LIMIT} menu items`);
    }

    const existingItems = await ctx.db
      .query("menuItems")
      .withIndex("by_menu_order", (q) => q.eq("menuId", args.menuId))
      .collect();

    const existingById = new Map(existingItems.map(item => [item._id, item] as const));
    const keepIds = new Set<string>();

    for (const [index, item] of args.items.entries()) {
      const url = item.url.trim();
      if (!url) {
        throw new Error("URL không được để trống");
      }
      if (!url.startsWith("/") && !url.startsWith("#") && !url.startsWith("http")) {
        throw new Error("URL phải bắt đầu bằng /, # hoặc http");
      }

      const normalizedDepth = normalizeMenuDepth(item.depth);

      if (item.id && existingById.has(item.id)) {
        keepIds.add(item.id);
        await ctx.db.patch(item.id, {
          label: item.label,
          url,
          depth: normalizedDepth,
          active: item.active,
          icon: item.icon,
          openInNewTab: item.openInNewTab,
          parentId: item.parentId,
          order: index,
        });
      } else {
        const insertedId = await ctx.db.insert("menuItems", {
          menuId: args.menuId,
          label: item.label,
          url,
          depth: normalizedDepth,
          active: item.active,
          icon: item.icon,
          openInNewTab: item.openInNewTab,
          parentId: item.parentId,
          order: index,
        });
        keepIds.add(insertedId);
      }
    }

    const toDelete = existingItems.filter(item => !keepIds.has(item._id));
    await Promise.all(toDelete.map( async item => ctx.db.delete(item._id)));
    return null;
  },
  returns: v.null(),
});

// ============ FULL MENU WITH ITEMS ============

export const getFullMenu = query({
  args: { location: v.string() },
  handler: async (ctx, args) => {
    const menu = await ctx.db
      .query("menus")
      .withIndex("by_location", (q) => q.eq("location", args.location))
      .unique();
    if (!menu) {return null;}
    const items = (await ctx.db
      .query("menuItems")
      .withIndex("by_menu_active", (q) => q.eq("menuId", menu._id).eq("active", true))
      .collect()).map((item) => ({
        ...item,
        depth: normalizeMenuDepth(item.depth),
      }));
    return { items, menu };
  },
  returns: v.union(
    v.object({
      items: v.array(menuItemDoc),
      menu: menuDoc,
    }),
    v.null()
  ),
});

export const normalizeMenuDepths = mutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("menuItems").collect();
    let updated = 0;

    await Promise.all(items.map(async (item) => {
      const normalizedDepth = normalizeMenuDepth(item.depth);
      if (normalizedDepth === item.depth) {return;}
      updated += 1;
      await ctx.db.patch(item._id, { depth: normalizedDepth });
    }));

    return { maxDepth: MENU_MAX_DEPTH, updated };
  },
  returns: v.object({
    maxDepth: v.number(),
    updated: v.number(),
  }),
});

// ============ MENU PICKER ============

export const listPostsForPicker = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order("desc")
      .take(limit);

    const categories = await Promise.all(posts.map((post) => ctx.db.get(post.categoryId)));
    const categoryMap = new Map(categories.filter(Boolean).map((cat) => [cat!._id, cat!]));

    const formatPost = (post: Doc<"posts">) => ({
      _id: post._id,
      title: post.title,
      slug: post.slug,
      categorySlug: categoryMap.get(post.categoryId)?.slug ?? "",
    });

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase();
      return posts
        .filter((post) => post.title.toLowerCase().includes(searchLower))
        .map(formatPost);
    }

    return posts.map(formatPost);
  },
  returns: v.array(v.object({
    _id: v.id("posts"),
    title: v.string(),
    slug: v.string(),
    categorySlug: v.string(),
  })),
});

export const listProductsForPicker = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const products = await ctx.db
      .query("products")
      .withIndex("by_status_order", (q) => q.eq("status", "Active"))
      .order("desc")
      .take(limit);

    const categories = await Promise.all(products.map((product) => ctx.db.get(product.categoryId)));
    const categoryMap = new Map(categories.filter(Boolean).map((cat) => [cat!._id, cat!]));

    const formatProduct = (product: Doc<"products">) => ({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      categorySlug: categoryMap.get(product.categoryId)?.slug ?? "",
    });

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase();
      return products
        .filter((product) => product.name.toLowerCase().includes(searchLower))
        .map(formatProduct);
    }

    return products.map(formatProduct);
  },
  returns: v.array(v.object({
    _id: v.id("products"),
    name: v.string(),
    slug: v.string(),
    categorySlug: v.string(),
  })),
});

export const listServicesForPicker = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const services = await ctx.db
      .query("services")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order("desc")
      .take(limit);

    const categories = await Promise.all(services.map((service) => ctx.db.get(service.categoryId)));
    const categoryMap = new Map(categories.filter(Boolean).map((cat) => [cat!._id, cat!]));

    const formatService = (service: Doc<"services">) => ({
      _id: service._id,
      title: service.title,
      slug: service.slug,
      categorySlug: categoryMap.get(service.categoryId)?.slug ?? "",
    });

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase();
      return services
        .filter((service) => service.title.toLowerCase().includes(searchLower))
        .map(formatService);
    }

    return services.map(formatService);
  },
  returns: v.array(v.object({
    _id: v.id("services"),
    title: v.string(),
    slug: v.string(),
    categorySlug: v.string(),
  })),
});

export const listProjectsForPicker = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order("desc")
      .take(limit);

    const categories = await Promise.all(projects.map((project) => ctx.db.get(project.categoryId)));
    const categoryMap = new Map(categories.filter(Boolean).map((cat) => [cat!._id, cat!]));

    const formatProject = (project: Doc<"projects">) => ({
      _id: project._id,
      title: project.title,
      slug: project.slug,
      categorySlug: categoryMap.get(project.categoryId)?.slug ?? "",
    });

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase();
      return projects
        .filter((project) => project.title.toLowerCase().includes(searchLower))
        .map(formatProject);
    }

    return projects.map(formatProject);
  },
  returns: v.array(v.object({
    _id: v.id("projects"),
    title: v.string(),
    slug: v.string(),
    categorySlug: v.string(),
  })),
});

export const listCoursesForPicker = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const search = args.search?.trim();
    const courses = search
      ? await ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) => q.search("title", search.toLowerCase()).eq("status", "Published"))
        .take(limit)
      : await ctx.db
        .query("courses")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order("desc")
        .take(limit);

    const categories = await Promise.all(courses.map((course) => ctx.db.get(course.categoryId)));
    const categoryMap = new Map(categories.filter(Boolean).map((cat) => [cat!._id, cat!]));

    return courses.map((course: Doc<"courses">) => ({
      _id: course._id,
      title: course.title,
      slug: course.slug,
      categorySlug: categoryMap.get(course.categoryId)?.slug ?? "",
    }));
  },
  returns: v.array(v.object({
    _id: v.id("courses"),
    title: v.string(),
    slug: v.string(),
    categorySlug: v.string(),
  })),
});

const resolvePostId = (value: unknown) =>
  typeof value === "string" && value.trim() ? (value.trim() as Id<"posts">) : null;

export const listTrustPageRoutesForPicker = query({
  args: {},
  handler: async (ctx) => {
    const trustPagesFeature = await ctx.db
      .query("moduleFeatures")
      .withIndex("by_module_feature", (q) => q.eq("moduleKey", "settings").eq("featureKey", "enableTrustPages"))
      .unique();
    if (trustPagesFeature && !trustPagesFeature.enabled) {
      return [];
    }

    const settingKeys = TRUST_PAGE_SLOTS.flatMap((slot) => [slot.iaKey, slot.mappingKey]);
    const settings = await Promise.all(settingKeys.map((key) => ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique()
    ));
    const settingMap = new Map(settings.filter(Boolean).map((setting) => [setting!.key, setting!.value]));

    const slots = TRUST_PAGE_SLOTS
      .map((slot) => ({
        slot,
        enabled: settingMap.get(slot.iaKey) !== false,
        postId: resolvePostId(settingMap.get(slot.mappingKey)),
      }))
      .filter((entry) => entry.enabled && entry.postId);

    const posts = await Promise.all(slots.map((entry) => ctx.db.get(entry.postId!)));

    return slots.flatMap((entry, index) => {
      const post = posts[index];
      if (!post || post.status !== "Published") {
        return [];
      }
      return [{
        key: entry.slot.key,
        label: entry.slot.defaultTitle,
        postTitle: post.title,
        url: entry.slot.slug,
      }];
    });
  },
  returns: v.array(v.object({
    key: v.string(),
    label: v.string(),
    postTitle: v.string(),
    url: v.string(),
  })),
});

export const getSmartMenuBuilderData = query({
  args: {},
  handler: async (ctx) => {
    const productTypes = await ctx.db.query("productTypes").filter(q => q.eq(q.field("active"), true)).collect().then(res => res.sort((a, b) => a.order - b.order));
    const productCategoryTypes = await ctx.db.query("productCategoryTypes").collect();
    const attributeGroups = await ctx.db.query("attributeGroups").collect();
    const productTypeAttributeGroups = await ctx.db.query("productTypeAttributeGroups").collect();
    const attributeTerms = await ctx.db.query("attributeTerms").filter(q => q.eq(q.field("active"), true)).collect().then(res => res.sort((a, b) => a.order - b.order));

    return {
      productTypes,
      productCategoryTypes,
      attributeGroups,
      productTypeAttributeGroups,
      attributeTerms,
    };
  },
});

export const listResourcesForPicker = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const search = args.search?.trim();
    const resources = search
      ? await ctx.db
        .query("resources")
        .withSearchIndex("search_title", (q) => q.search("title", search.toLowerCase()).eq("status", "Published"))
        .take(limit)
      : await ctx.db
        .query("resources")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order("desc")
        .take(limit);

    const categories = await Promise.all(resources.map((resource) => ctx.db.get(resource.categoryId)));
    const categoryMap = new Map(categories.filter(Boolean).map((cat) => [cat!._id, cat!]));

    return resources.map((resource: Doc<"resources">) => ({
      _id: resource._id,
      title: resource.title,
      slug: resource.slug,
      categorySlug: categoryMap.get(resource.categoryId)?.slug ?? "",
    }));
  },
  returns: v.array(v.object({
    _id: v.id("resources"),
    title: v.string(),
    slug: v.string(),
    categorySlug: v.string(),
  })),
});

