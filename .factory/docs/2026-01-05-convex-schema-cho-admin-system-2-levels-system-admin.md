# Spec: Convex Schema - 2 Levels Architecture

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│  /system (Dev/SuperAdmin)                               │
│  - Module Management (bật/tắt features)                 │
│  - Field Configuration (customize fields per module)    │
│  - System Settings & Presets                            │
│  - Feature Flags                                        │
└────────────────────────┬────────────────────────────────┘
                         │ controls
                         ▼
┌─────────────────────────────────────────────────────────┐
│  /admin (Admin/Editor users)                            │
│  - Products, Posts, Categories...                       │
│  - Customers, Orders                                    │
│  - Menus, Home Components                               │
│  - Content Management                                   │
└─────────────────────────────────────────────────────────┘
```

---

## Schema Design (20 Tables)

### LEVEL 1: SYSTEM CONFIGURATION (cho /system)

#### 1. adminModules - Quản lý modules bật/tắt
```ts
adminModules: defineTable({
  key: v.string(),           // "products", "posts", "orders"
  name: v.string(),          // "Sản phẩm & Danh mục"
  description: v.string(),
  icon: v.string(),          // "Package", "FileText"
  category: v.union(
    v.literal("content"), v.literal("commerce"), 
    v.literal("user"), v.literal("system"), v.literal("marketing")
  ),
  enabled: v.boolean(),
  isCore: v.boolean(),       // Core modules cannot be disabled
  dependencies: v.optional(v.array(v.string())), // ["products", "customers"]
  dependencyType: v.optional(v.union(v.literal("all"), v.literal("any"))),
  order: v.number(),
  updatedBy: v.optional(v.id("users")),
})
  .index("by_key", ["key"])
  .index("by_category_enabled", ["category", "enabled"])
  .index("by_enabled_order", ["enabled", "order"])
```

#### 2. moduleFields - Cấu hình fields động cho mỗi module
```ts
moduleFields: defineTable({
  moduleKey: v.string(),      // "products", "posts"
  fieldKey: v.string(),       // "price", "thumbnail", "gallery"
  name: v.string(),           // "Giá bán"
  type: v.union(
    v.literal("text"), v.literal("textarea"), v.literal("richtext"),
    v.literal("number"), v.literal("price"), v.literal("boolean"),
    v.literal("image"), v.literal("gallery"), v.literal("select"),
    v.literal("date"), v.literal("email"), v.literal("phone")
  ),
  required: v.boolean(),
  enabled: v.boolean(),
  isSystem: v.boolean(),      // System fields cannot be disabled
  linkedFeature: v.optional(v.string()), // "enableVariants"
  order: v.number(),
  group: v.optional(v.string()), // "basic", "pricing", "media"
})
  .index("by_module", ["moduleKey"])
  .index("by_module_enabled", ["moduleKey", "enabled"])
  .index("by_module_order", ["moduleKey", "order"])
```

#### 3. moduleFeatures - Features bật/tắt cho từng module
```ts
moduleFeatures: defineTable({
  moduleKey: v.string(),      // "products"
  featureKey: v.string(),     // "enableVariants", "enableInventory"
  name: v.string(),           // "Biến thể SP"
  description: v.optional(v.string()),
  enabled: v.boolean(),
  linkedFieldKey: v.optional(v.string()), // "variants" field
})
  .index("by_module", ["moduleKey"])
  .index("by_module_feature", ["moduleKey", "featureKey"])
```

#### 4. moduleSettings - Settings cấu hình cho module
```ts
moduleSettings: defineTable({
  moduleKey: v.string(),
  settingKey: v.string(),     // "productsPerPage", "defaultStatus"
  value: v.any(),             // 12, "draft", true
})
  .index("by_module", ["moduleKey"])
  .index("by_module_setting", ["moduleKey", "settingKey"])
```

#### 5. systemPresets - Preset configurations
```ts
systemPresets: defineTable({
  key: v.string(),            // "blog", "ecommerce-full", "landing"
  name: v.string(),
  description: v.string(),
  enabledModules: v.array(v.string()), // ["posts", "comments", "media"]
  isDefault: v.optional(v.boolean()),
})
  .index("by_key", ["key"])
```

---

### LEVEL 2: DATA TABLES (cho /admin)

#### 6. users - Quản trị viên hệ thống
```ts
users: defineTable({
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
  avatar: v.optional(v.string()),
  roleId: v.id("roles"),
  status: v.union(v.literal("Active"), v.literal("Inactive"), v.literal("Banned")),
  lastLogin: v.optional(v.number()),
})
  .index("by_email", ["email"])
  .index("by_role_status", ["roleId", "status"])
  .index("by_status", ["status"])
```

#### 7. roles - RBAC
```ts
roles: defineTable({
  name: v.string(),
  description: v.string(),
  color: v.optional(v.string()),
  isSystem: v.boolean(),
  isSuperAdmin: v.optional(v.boolean()),
  permissions: v.record(v.string(), v.array(v.string())),
  // {"products": ["view","create","edit"], "posts": ["view"]}
})
  .index("by_name", ["name"])
  .index("by_isSystem", ["isSystem"])
```

#### 8. customers
```ts
customers: defineTable({
  name: v.string(),
  email: v.string(),
  phone: v.string(),
  avatar: v.optional(v.string()),
  status: v.union(v.literal("Active"), v.literal("Inactive")),
  ordersCount: v.number(),
  totalSpent: v.number(),
  address: v.optional(v.string()),
  city: v.optional(v.string()),
  notes: v.optional(v.string()),
})
  .index("by_email", ["email"])
  .index("by_status", ["status"])
  .index("by_status_totalSpent", ["status", "totalSpent"])
  .index("by_city_status", ["city", "status"])
```

#### 9. productCategories (Hierarchical)
```ts
productCategories: defineTable({
  name: v.string(),
  slug: v.string(),
  parentId: v.optional(v.id("productCategories")),
  description: v.optional(v.string()),
  image: v.optional(v.string()),
  order: v.number(),
  active: v.boolean(),
})
  .index("by_slug", ["slug"])
  .index("by_parent", ["parentId"])
  .index("by_parent_order", ["parentId", "order"])
  .index("by_active", ["active"])
```

#### 10. products
```ts
products: defineTable({
  name: v.string(),
  sku: v.string(),
  slug: v.string(),
  categoryId: v.id("productCategories"),
  price: v.number(),
  salePrice: v.optional(v.number()),
  stock: v.number(),
  status: v.union(v.literal("Active"), v.literal("Draft"), v.literal("Archived")),
  image: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  sales: v.number(),
  description: v.optional(v.string()),
  order: v.number(),
  // Dynamic fields stored in separate table hoặc v.any()
})
  .index("by_sku", ["sku"])
  .index("by_slug", ["slug"])
  .index("by_category_status", ["categoryId", "status"])
  .index("by_status_price", ["status", "price"])
  .index("by_status_stock", ["status", "stock"])
  .index("by_status_sales", ["status", "sales"])
  .index("by_status_order", ["status", "order"])
```

#### 11. postCategories (Hierarchical)
```ts
postCategories: defineTable({
  name: v.string(),
  slug: v.string(),
  parentId: v.optional(v.id("postCategories")),
  description: v.optional(v.string()),
  order: v.number(),
  active: v.boolean(),
})
  .index("by_slug", ["slug"])
  .index("by_parent", ["parentId"])
  .index("by_parent_order", ["parentId", "order"])
```

#### 12. posts
```ts
posts: defineTable({
  title: v.string(),
  slug: v.string(),
  content: v.string(),
  excerpt: v.optional(v.string()),
  thumbnail: v.optional(v.string()),
  categoryId: v.id("postCategories"),
  authorId: v.id("users"),
  status: v.union(v.literal("Published"), v.literal("Draft"), v.literal("Archived")),
  views: v.number(),
  publishedAt: v.optional(v.number()),
  order: v.number(),
})
  .index("by_slug", ["slug"])
  .index("by_category_status", ["categoryId", "status"])
  .index("by_author_status", ["authorId", "status"])
  .index("by_status_publishedAt", ["status", "publishedAt"])
  .index("by_status_views", ["status", "views"])
```

#### 13. comments (Polymorphic)
```ts
comments: defineTable({
  content: v.string(),
  authorName: v.string(),
  authorEmail: v.optional(v.string()),
  authorIp: v.optional(v.string()),
  targetType: v.union(v.literal("post"), v.literal("product")),
  targetId: v.string(),
  parentId: v.optional(v.id("comments")),
  status: v.union(v.literal("Pending"), v.literal("Approved"), v.literal("Spam")),
  customerId: v.optional(v.id("customers")),
})
  .index("by_target_status", ["targetType", "targetId", "status"])
  .index("by_status", ["status"])
  .index("by_parent", ["parentId"])
  .index("by_customer", ["customerId"])
```

#### 14. images
```ts
images: defineTable({
  storageId: v.id("_storage"),
  filename: v.string(),
  mimeType: v.string(),
  size: v.number(),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  alt: v.optional(v.string()),
  folder: v.optional(v.string()),
  uploadedBy: v.optional(v.id("users")),
})
  .index("by_folder", ["folder"])
  .index("by_mimeType", ["mimeType"])
  .index("by_uploadedBy", ["uploadedBy"])
```

#### 15. menus
```ts
menus: defineTable({
  name: v.string(),
  location: v.string(), // "header", "footer", "sidebar"
})
  .index("by_location", ["location"])
```

#### 16. menuItems (Hierarchical)
```ts
menuItems: defineTable({
  menuId: v.id("menus"),
  label: v.string(),
  url: v.string(),
  order: v.number(),
  depth: v.number(),
  parentId: v.optional(v.id("menuItems")),
  icon: v.optional(v.string()),
  openInNewTab: v.optional(v.boolean()),
  active: v.boolean(),
})
  .index("by_menu_order", ["menuId", "order"])
  .index("by_menu_depth", ["menuId", "depth"])
  .index("by_parent", ["parentId"])
  .index("by_menu_active", ["menuId", "active"])
```

#### 17. homeComponents
```ts
homeComponents: defineTable({
  type: v.string(), // "Hero", "Stats", "ProductGrid", "CTA", "FAQ"
  title: v.string(),
  active: v.boolean(),
  order: v.number(),
  config: v.any(), // Flexible JSON config
})
  .index("by_active_order", ["active", "order"])
  .index("by_type", ["type"])
```

#### 18. settings (Key-Value)
```ts
settings: defineTable({
  key: v.string(),
  value: v.any(),
  group: v.string(), // "general", "contact", "seo", "social"
})
  .index("by_key", ["key"])
  .index("by_group", ["group"])
```

#### 19. visitors (Analytics)
```ts
visitors: defineTable({
  sessionId: v.string(),
  ip: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  referrer: v.optional(v.string()),
  path: v.string(),
  country: v.optional(v.string()),
})
  .index("by_sessionId", ["sessionId"])
  .index("by_path", ["path"])
```

#### 20. activityLogs (Audit Trail)
```ts
activityLogs: defineTable({
  userId: v.id("users"),
  action: v.string(),       // "create", "update", "delete", "toggle"
  targetType: v.string(),   // "product", "post", "module"
  targetId: v.string(),
  details: v.optional(v.any()),
  ip: v.optional(v.string()),
})
  .index("by_user", ["userId"])
  .index("by_targetType", ["targetType"])
  .index("by_action", ["action"])
```

---

## Workflow: /system controls /admin

```ts
// 1. Check if module is enabled
const productsModule = await ctx.db
  .query("adminModules")
  .withIndex("by_key", q => q.eq("key", "products"))
  .unique();

if (!productsModule?.enabled) {
  throw new Error("Products module is disabled");
}

// 2. Get enabled fields for this module
const enabledFields = await ctx.db
  .query("moduleFields")
  .withIndex("by_module_enabled", q => 
    q.eq("moduleKey", "products").eq("enabled", true)
  )
  .collect();

// 3. Validate data against enabled fields only
// 4. Save to products table
```

---

## Best Practices Applied

1. **Index Selectivity**: High selectivity fields first (`status`, `moduleKey`)
2. **Compound Index Order**: Equality → Range → Sort
3. **Hierarchical Data**: Self-reference với `parentId` + `by_parent_order` index
4. **Polymorphic Comments**: `targetType` + `targetId` pattern
5. **Dynamic Configuration**: Separate tables cho modules, fields, features
6. **Audit Trail**: `activityLogs` cho tracking changes

---

Xác nhận để implement `convex/schema.ts` đầy đủ?