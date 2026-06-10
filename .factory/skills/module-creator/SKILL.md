---
name: module-creator
description: "Tạo module admin chuẩn cho hệ thống VietAdmin với Convex backend và Next.js frontend. Sử dụng khi user muốn: (1) Tạo module mới như Products, Orders, Customers, (2) Tạo CRUD pages cho admin, (3) Tạo system config page, (4) Tạo seed data và queries/mutations cho Convex. Module được tạo theo chuẩn Posts module với đầy đủ: Convex backend, admin pages (list/create/edit), system config page, seed data."
version: 2.0.0
---

# Module Creator - Tạo Module Admin Chuẩn

## Overview

Skill này giúp tạo module admin hoàn chỉnh theo chuẩn của hệ thống VietAdmin, **REFERENCE: Posts Module** là module chuẩn.

### Cấu trúc Module chuẩn:

```
📦 Module Structure (Reference: Posts)
├── 📁 convex/
│   ├── posts.ts              # Queries/Mutations với validators
│   ├── model/posts.ts        # Business logic layer (optional)
│   ├── postCategories.ts     # Sub-entity (nếu có)
│   └── schema.ts             # Schema definition
├── 📁 app/admin/posts/
│   ├── page.tsx              # List page với pagination, sort, filter
│   ├── create/page.tsx       # Create form với conditional fields
│   └── [id]/edit/page.tsx    # Edit form với initial data
├── 📁 app/system/modules/posts/
│   └── page.tsx              # Config (features/fields/settings), Data tab, Appearance tab
└── 📁 convex/seed.ts         # seedPostsModule, clearPostsData
```

## Khi nào sử dụng

- User yêu cầu tạo module mới (Products, Orders, Customers, Media...)
- User muốn tạo CRUD pages cho một entity
- User cần system config page để quản lý cấu hình module
- User muốn tạo seed data cho module

## Conflict Resolution

Nếu có xung đột với `system-extension-guideline`, luôn ưu tiên master playbook.

## Quy trình tạo Module

### Phase 1: Thu thập thông tin

Hỏi user các thông tin sau:

```markdown
1. **Tên module**: VD: products, orders, customers
2. **Tên hiển thị**: VD: Sản phẩm, Đơn hàng, Khách hàng
3. **Các trường dữ liệu chính**: VD: name, price, description, status
4. **Có sub-entity không?**: VD: products có productCategories
5. **Các tính năng bổ sung**: VD: tags, featured, scheduling
6. **Icon module**: VD: Package, ShoppingBag, Users (Lucide icons)
7. **Category module**: content | commerce | user | system | marketing
```

### Phase 2: Tạo Convex Backend

#### 2.1 Tạo Schema (nếu chưa có)

Thêm vào `convex/schema.ts` (REFERENCE: posts schema):

```typescript
// Main entity - LUÔN có indexes cần thiết
[moduleName]: defineTable({
  title: v.string(),
  slug: v.string(),
  content: v.string(),
  excerpt: v.optional(v.string()),
  thumbnail: v.optional(v.string()),
  categoryId: v.id("[moduleName]Categories"),
  authorId: v.id("users"),
  status: v.union(v.literal("Published"), v.literal("Draft"), v.literal("Archived")),
  views: v.number(),
  publishedAt: v.optional(v.number()),
  order: v.number(),
})
  .index("by_slug", ["slug"])
  .index("by_category_status", ["categoryId", "status"])  // Compound index
  .index("by_author_status", ["authorId", "status"])      // Compound index
  .index("by_status_publishedAt", ["status", "publishedAt"])
  .index("by_status_views", ["status", "views"]),

// Sub-entity (nếu có) - Hierarchical với parentId
[moduleName]Categories: defineTable({
  name: v.string(),
  slug: v.string(),
  parentId: v.optional(v.id("[moduleName]Categories")),
  description: v.optional(v.string()),
  thumbnail: v.optional(v.string()),
  order: v.number(),
  active: v.boolean(),
})
  .index("by_slug", ["slug"])
  .index("by_parent", ["parentId"])
  .index("by_parent_order", ["parentId", "order"])
  .index("by_active", ["active"]),
```

#### 2.2 Tạo Queries/Mutations (REFERENCE: convex/posts.ts)

File: `convex/[moduleName].ts`

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { contentStatus } from "./lib/validators";
import * as Model from "./model/[moduleName]";

// ⚠️ CRITICAL: Luôn có doc validator cho type safety
const [moduleName]Doc = v.object({
  _id: v.id("[moduleName]"),
  _creationTime: v.number(),
  title: v.string(),
  slug: v.string(),
  // ... all fields with exact types
});

// Pagination result validator
const paginated[ModuleName] = v.object({
  page: v.array([moduleName]Doc),
  isDone: v.boolean(),
  continueCursor: v.string(),
  pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  splitCursor: v.optional(v.union(v.string(), v.null())),
});

// ⚠️ CRITICAL: Pagination query cho list
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginated[ModuleName],
  handler: async (ctx, args) => {
    return await ctx.db.query("[moduleName]").paginate(args.paginationOpts);
  },
});

// Limited list for admin (max 100 items)
export const listAll = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array([moduleName]Doc),
  handler: async (ctx, args) => {
    return await Model.listWithLimit(ctx, { limit: args.limit });
  },
});

// ⚠️ CRITICAL: Efficient count using take() NOT collect()
export const count = query({
  args: { status: v.optional(contentStatus) },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
  handler: async (ctx, args) => {
    return await Model.countWithLimit(ctx, { status: args.status });
  },
});

export const getById = query({
  args: { id: v.id("[moduleName]") },
  returns: v.union([moduleName]Doc, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union([moduleName]Doc, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("[moduleName]")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

// Filter queries using compound indexes
export const listByCategory = query({
  args: {
    categoryId: v.id("[moduleName]Categories"),
    status: v.optional(contentStatus),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginated[ModuleName],
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("[moduleName]")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId).eq("status", args.status!)
        )
        .paginate(args.paginationOpts);
    }
    return await ctx.db
      .query("[moduleName]")
      .withIndex("by_category_status", (q) => q.eq("categoryId", args.categoryId))
      .paginate(args.paginationOpts);
  },
});

// Search with filtering (for public/frontend)
export const searchPublished = query({
  args: {
    search: v.optional(v.string()),
    categoryId: v.optional(v.id("[moduleName]Categories")),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title")
    )),
    limit: v.optional(v.number()),
  },
  returns: v.array([moduleName]Doc),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    // ... filter + sort logic using indexes
  },
});

// Mutations với validation
export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    excerpt: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    categoryId: v.id("[moduleName]Categories"),
    authorId: v.id("users"),
    status: v.optional(contentStatus),
    order: v.optional(v.number()),
  },
  returns: v.id("[moduleName]"),
  handler: async (ctx, args) => {
    return await Model.create(ctx, args);
  },
});

export const update = mutation({
  args: {
    id: v.id("[moduleName]"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    categoryId: v.optional(v.id("[moduleName]Categories")),
    status: v.optional(contentStatus),
    order: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await Model.update(ctx, args);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("[moduleName]") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await Model.remove(ctx, args);  // Handles cascade delete
    return null;
  },
});
```

#### 2.3 Tạo Model Layer (Optional nhưng recommended)

File: `convex/model/[moduleName].ts` (REFERENCE: convex/model/posts.ts)

```typescript
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

const MAX_ITEMS_LIMIT = 100;

export async function getByIdOrThrow(ctx: QueryCtx, { id }: { id: Id<"[moduleName]"> }): Promise<Doc<"[moduleName]">> {
  const item = await ctx.db.get(id);
  if (!item) throw new Error("[ModuleName] not found");
  return item;
}

export async function isSlugExists(ctx: QueryCtx, { slug, excludeId }: { slug: string; excludeId?: Id<"[moduleName]"> }): Promise<boolean> {
  const existing = await ctx.db.query("[moduleName]").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
  if (!existing) return false;
  if (excludeId && existing._id === excludeId) return false;
  return true;
}

// ⚠️ CRITICAL: Use take() not collect() for bandwidth optimization
export async function listWithLimit(ctx: QueryCtx, { limit = MAX_ITEMS_LIMIT }: { limit?: number } = {}): Promise<Doc<"[moduleName]">[]> {
  return await ctx.db.query("[moduleName]").order("desc").take(Math.min(limit, MAX_ITEMS_LIMIT));
}

export async function countWithLimit(ctx: QueryCtx, { status, limit = 1000 }: { status?: Doc<"[moduleName]">["status"]; limit?: number } = {}): Promise<{ count: number; hasMore: boolean }> {
  const query = status
    ? ctx.db.query("[moduleName]").withIndex("by_status_publishedAt", (q) => q.eq("status", status))
    : ctx.db.query("[moduleName]");
  const items = await query.take(limit + 1);
  return { count: Math.min(items.length, limit), hasMore: items.length > limit };
}

export async function create(ctx: MutationCtx, args: { /* ... */ }): Promise<Id<"[moduleName]">> {
  if (await isSlugExists(ctx, { slug: args.slug })) throw new Error("Slug already exists");
  const order = args.order ?? (await getNextOrder(ctx));
  const status = args.status ?? "Draft";
  return await ctx.db.insert("[moduleName]", {
    ...args,
    status,
    views: 0,
    publishedAt: status === "Published" ? Date.now() : undefined,
    order,
  });
}

export async function update(ctx: MutationCtx, args: { id: Id<"[moduleName]">; /* ... */ }): Promise<void> {
  const item = await getByIdOrThrow(ctx, { id: args.id });
  if (args.slug && args.slug !== item.slug) {
    if (await isSlugExists(ctx, { slug: args.slug, excludeId: args.id })) throw new Error("Slug already exists");
  }
  const { id, ...updates } = args;
  const patchData: Record<string, unknown> = { ...updates };
  if (args.status === "Published" && item.status !== "Published") {
    patchData.publishedAt = Date.now();
  }
  await ctx.db.patch(id, patchData);
}

// ⚠️ FLS WARNING & REQUIRED CHECK: Nếu module có chứa trường upload ảnh/media (như `thumbnailStorageId` hoặc `imageStorageIds`):
// 1. TUYỆT ĐỐI KHÔNG sử dụng `ctx.storage.delete` trực tiếp trong mutation logic hay Model layer (ngoại trừ seed/clear data cô lập là exception).
// 2. Khi create/update bắt buộc phải gọi syncOwnerFileReferences và dọn dẹp qua safe cleanup gateway:
//    const { removedStorageIds } = await syncOwnerFileReferences(ctx, {
//      ownerTable: "[moduleName]",
//      ownerId: id,
//      ownerField: "thumbnail",
//      purpose: "[moduleName]-thumbnail",
//    }, nextStorageIds, { previousStorageIds });
//    for (const storageId of removedStorageIds) {
//      await ctx.runMutation(api.storage.cleanupStorageIfUnreferenced, { storageId });
//    }
// 3. Khi remove/delete bắt buộc phải giải phóng references và cleanup trước khi db.delete:
//    const { removedStorageIds } = await removeOwnerFileReferences(ctx, {
//      ownerTable: "[moduleName]",
//      ownerId: id,
//    }, { previousStorageIds });
//    for (const storageId of removedStorageIds) {
//      await ctx.runMutation(api.storage.cleanupStorageIfUnreferenced, { storageId });
//    }

// ⚠️ CRITICAL: Cascade delete related entities
export async function remove(ctx: MutationCtx, { id }: { id: Id<"[moduleName]"> }): Promise<void> {
  const comments = await ctx.db.query("comments")
    .withIndex("by_target_status", (q) => q.eq("targetType", "[moduleName]").eq("targetId", id))
    .collect();
  for (const comment of comments) await ctx.db.delete(comment._id);
  await ctx.db.delete(id);
}
```

### Phase 3: Tạo Seed Data (REFERENCE: convex/seed.ts - seedPostsModule)

```typescript
// Seed [ModuleName] Module - Tạo đầy đủ data, features, fields, settings
export const seed[ModuleName]Module = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // 1. Check existing data
    const existing = await ctx.db.query("[moduleName]").first();
    if (existing) return null;

    // 2. Seed roles if not exist (for authorId)
    let adminRoleId = (await ctx.db.query("roles").withIndex("by_name", q => q.eq("name", "Admin")).first())?._id;
    if (!adminRoleId) {
      adminRoleId = await ctx.db.insert("roles", { name: "Admin", description: "Administrator", isSystem: true, permissions: {} });
    }
    let adminUserId = (await ctx.db.query("users").first())?._id;
    if (!adminUserId) {
      adminUserId = await ctx.db.insert("users", { name: "Admin", email: "admin@example.com", roleId: adminRoleId, status: "Active" });
    }

    // 3. Seed categories
    const categories = [
      { name: "Danh mục 1", slug: "danh-muc-1", order: 0, active: true },
      { name: "Danh mục 2", slug: "danh-muc-2", order: 1, active: true },
    ];
    const categoryIds: Id<"[moduleName]Categories">[] = [];
    for (const cat of categories) {
      const id = await ctx.db.insert("[moduleName]Categories", cat);
      categoryIds.push(id);
    }

    // 4. Seed main entities
    const items = [
      { title: "Tiêu đề 1", slug: "tieu-de-1", content: "Nội dung...", categoryId: categoryIds[0], authorId: adminUserId, status: "Published" as const, views: 100, publishedAt: Date.now(), order: 0 },
      { title: "Tiêu đề 2", slug: "tieu-de-2", content: "Nội dung...", categoryId: categoryIds[1], authorId: adminUserId, status: "Draft" as const, views: 0, order: 1 },
    ];
    for (const item of items) {
      await ctx.db.insert("[moduleName]", item);
    }

    // 5. Seed module features (linked với fields)
    const features = [
      { moduleKey: "[moduleName]", featureKey: "enableTags", name: "Tags", enabled: false, linkedFieldKey: "tags" },
      { moduleKey: "[moduleName]", featureKey: "enableFeatured", name: "Nổi bật", enabled: false, linkedFieldKey: "featured" },
    ];
    for (const f of features) {
      const existing = await ctx.db.query("moduleFeatures").withIndex("by_module_feature", q => q.eq("moduleKey", f.moduleKey).eq("featureKey", f.featureKey)).first();
      if (!existing) await ctx.db.insert("moduleFeatures", f);
    }

    // 6. Seed module fields (system + optional)
    const fields = [
      { moduleKey: "[moduleName]", fieldKey: "title", name: "Tiêu đề", type: "text" as const, required: true, enabled: true, isSystem: true, order: 0 },
      { moduleKey: "[moduleName]", fieldKey: "slug", name: "Slug", type: "text" as const, required: true, enabled: true, isSystem: true, order: 1 },
      { moduleKey: "[moduleName]", fieldKey: "content", name: "Nội dung", type: "richtext" as const, required: true, enabled: true, isSystem: true, order: 2 },
      { moduleKey: "[moduleName]", fieldKey: "excerpt", name: "Mô tả ngắn", type: "textarea" as const, required: false, enabled: true, isSystem: false, order: 3 },
      { moduleKey: "[moduleName]", fieldKey: "thumbnail", name: "Ảnh đại diện", type: "image" as const, required: false, enabled: true, isSystem: false, order: 4 },
      { moduleKey: "[moduleName]", fieldKey: "tags", name: "Tags", type: "tags" as const, required: false, enabled: false, isSystem: false, linkedFeature: "enableTags", order: 5 },
    ];
    for (const f of fields) {
      const existing = await ctx.db.query("moduleFields").withIndex("by_module", q => q.eq("moduleKey", f.moduleKey)).filter(q => q.eq(q.field("fieldKey"), f.fieldKey)).first();
      if (!existing) await ctx.db.insert("moduleFields", f);
    }

    // 7. Seed module settings
    const settings = [
      { moduleKey: "[moduleName]", settingKey: "[moduleName]PerPage", value: 10 },
      { moduleKey: "[moduleName]", settingKey: "defaultStatus", value: "draft" },
    ];
    for (const s of settings) {
      const existing = await ctx.db.query("moduleSettings").withIndex("by_module_setting", q => q.eq("moduleKey", s.moduleKey).eq("settingKey", s.settingKey)).first();
      if (!existing) await ctx.db.insert("moduleSettings", s);
    }

    return null;
  },
});

// Clear [ModuleName] Data (keeps config)
export const clear[ModuleName]Data = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Delete storage files in related folders
    const images = await ctx.db.query("images").withIndex("by_folder", q => q.eq("folder", "[moduleName]")).collect();
    for (const img of images) {
      try { await ctx.storage.delete(img.storageId); } catch {}
      await ctx.db.delete(img._id);
    }
    // Delete main entities
    const items = await ctx.db.query("[moduleName]").collect();
    for (const item of items) await ctx.db.delete(item._id);
    // Delete categories
    const cats = await ctx.db.query("[moduleName]Categories").collect();
    for (const cat of cats) await ctx.db.delete(cat._id);
    return null;
  },
});
```

### Phase 4: Tạo Admin Pages (REFERENCE: app/admin/posts/)

#### 4.1 List Page với Pagination (REFERENCE: app/admin/posts/page.tsx)

File: `app/admin/[module-name]/page.tsx`

```typescript
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Plus, Edit, Trash2, ExternalLink, Search, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, Badge, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui';
import { SortableHeader, BulkActionBar, SelectCheckbox, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';

export default function [ModuleName]ListPage() {
  return (
    <ModuleGuard moduleKey="[moduleName]">
      <[ModuleName]Content />
    </ModuleGuard>
  );
}

function [ModuleName]Content() {
  const categoriesData = useQuery(api.[moduleName]Categories.listAll, { limit: 50 });
  // ⚠️ CRITICAL: Get pagination setting from module settings
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: '[moduleName]' });
  const deleteItem = useMutation(api.[moduleName].remove);
  const seedModule = useMutation(api.seed.seed[ModuleName]Module);
  const clearData = useMutation(api.seed.clear[ModuleName]Data);
  
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState<Id<"[moduleName]">[]>([]);
  const isLoading = categoriesData === undefined;

  // ⚠️ CRITICAL: Get itemsPerPage from settings
  const itemsPerPage = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === '[moduleName]PerPage');
    const raw = (setting?.value as number) || 20;
    return Math.min(Math.max(raw, 10), 100);
  }, [settingsData]);

  const {
    results: itemsData,
    status: itemsStatus,
    loadMore: loadMoreItems,
  } = usePaginatedQuery(api.[moduleName].list, {}, { initialNumItems: itemsPerPage });

  // Map category ID to name
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoriesData?.forEach(cat => { map[cat._id] = cat.name; });
    return map;
  }, [categoriesData]);

  const items = useMemo(() => {
    return itemsData?.map(item => ({
      ...item,
      id: item._id,
      category: categoryMap[item.categoryId] || 'Không có',
    })) || [];
  }, [itemsData, categoryMap]);

  const filteredItems = useMemo(() => {
    let data = [...items];
    if (searchTerm) data = data.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterStatus) data = data.filter(p => p.status === filterStatus);
    return data;
  }, [items, searchTerm, filterStatus]);

  const sortedItems = useSortableData(filteredItems, sortConfig);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    // reset sorting state only
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
  };

  // ... selection handlers, delete handlers, reseed handler

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quản lý [Display Name]</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleReseed} title="Reset dữ liệu mẫu">
            <RefreshCw size={16}/> Reset
          </Button>
          <Link href="/admin/[module-name]/create"><Button className="gap-2"><Plus size={16}/> Thêm mới</Button></Link>
        </div>
      </div>

      <BulkActionBar selectedCount={selectedIds.length} onDelete={handleBulkDelete} onClearSelection={() => setSelectedIds([])} />

      <Card>
        {/* Search & Filter */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
          <div className="relative max-w-xs flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Tìm kiếm..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={filterStatus} onChange={(e) => handleFilterChange(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="Published">Đã xuất bản</option>
            <option value="Draft">Bản nháp</option>
            <option value="Archived">Lưu trữ</option>
          </select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"><SelectCheckbox checked={selectedIds.length === sortedItems.length && sortedItems.length > 0} onChange={toggleSelectAll} /></TableHead>
              <SortableHeader label="Tiêu đề" sortKey="title" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Danh mục" sortKey="category" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Trạng thái" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map(item => (
              <TableRow key={item._id} className={selectedIds.includes(item._id) ? 'bg-blue-500/5' : ''}>
                {/* ... table cells */}
              </TableRow>
            ))}
            {sortedItems.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">Chưa có dữ liệu</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        {/* ⚠️ CRITICAL: Pagination UI */}
        {itemsStatus === 'CanLoadMore' && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
            <Button variant="outline" size="sm" onClick={() => loadMoreItems(itemsPerPage)}>Tải thêm</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
```

#### 4.2 Create Page với Conditional Fields (REFERENCE: app/admin/posts/create/page.tsx)

File: `app/admin/[module-name]/create/page.tsx`

```typescript
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label } from '../../components/ui';
import { LexicalEditor } from '../../components/LexicalEditor';
import { ImageUploader } from '../../components/ImageUploader';
import { useFormShortcuts } from '../../components/useKeyboardShortcuts';
import { QuickCreateCategoryModal } from '../../components/QuickCreateCategoryModal';

const MODULE_KEY = '[moduleName]';

export default function [ModuleName]CreatePage() {
  const router = useRouter();
  const categoriesData = useQuery(api.[moduleName]Categories.listAll, {});
  const usersData = useQuery(api.users.listAll);
  const createItem = useMutation(api.[moduleName].create);
  // ⚠️ CRITICAL: Get enabled fields from system config
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // ⚠️ CRITICAL: Sync default status from settings
  useEffect(() => {
    if (settingsData) {
      const defaultStatus = settingsData.find(s => s.settingKey === 'defaultStatus')?.value as string;
      if (defaultStatus === 'published') setStatus('Published');
    }
  }, [settingsData]);

  // Keyboard shortcuts (Ctrl+S, Esc)
  const handleSaveShortcut = useCallback(() => {
    const form = document.querySelector('form');
    if (form && title.trim() && categoryId) form.requestSubmit();
  }, [title, categoryId]);
  const handleCancelShortcut = useCallback(() => router.push('/admin/[module-name]'), [router]);
  useFormShortcuts({ onSave: handleSaveShortcut, onCancel: handleCancelShortcut });

  // ⚠️ CRITICAL: Check enabled fields để conditional render
  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    const generatedSlug = val.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId || !usersData?.length) return;
    setIsSubmitting(true);
    try {
      await createItem({
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/\s+/g, '-'),
        content,
        excerpt: excerpt.trim() || undefined,
        thumbnail,
        categoryId: categoryId as Id<"[moduleName]Categories">,
        authorId: usersData[0]._id,
        status,
      });
      toast.success("Tạo thành công");
      router.push('/admin/[module-name]');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <QuickCreateCategoryModal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} onCreated={(id) => setCategoryId(id)} />
      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Thêm [Display Name] mới</h1>
            <div className="text-sm text-slate-500 mt-1">Tạo nội dung mới</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* Title - ALWAYS shown (system field) */}
                <div className="space-y-2">
                  <Label>Tiêu đề <span className="text-red-500">*</span></Label>
                  <Input value={title} onChange={handleTitleChange} required placeholder="Nhập tiêu đề..." />
                </div>
                {/* Slug - ALWAYS shown (system field) */}
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="tu-dong-tao-tu-tieu-de" className="font-mono text-sm" />
                </div>
                {/* ⚠️ Excerpt - CONDITIONAL based on enabledFields */}
                {enabledFields.has('excerpt') && (
                  <div className="space-y-2">
                    <Label>Mô tả ngắn</Label>
                    <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Tóm tắt nội dung..." />
                  </div>
                )}
                {/* Content - ALWAYS shown (system field) */}
                <div className="space-y-2">
                  <Label>Nội dung</Label>
                  <LexicalEditor onChange={setContent} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Xuất bản</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as 'Draft' | 'Published')} className="w-full h-10 rounded-md border ...">
                    <option value="Draft">Bản nháp</option>
                    <option value="Published">Đã xuất bản</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Danh mục <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="flex-1 h-10 ...">
                      <option value="">-- Chọn danh mục --</option>
                      {categoriesData?.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                    </select>
                    <Button type="button" variant="outline" size="icon" onClick={() => setShowCategoryModal(true)} title="Tạo danh mục mới"><Plus size={16} /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ⚠️ Thumbnail - can be conditional */}
            <Card>
              <CardHeader><CardTitle className="text-base">Ảnh đại diện</CardTitle></CardHeader>
              <CardContent>
                <ImageUploader value={thumbnail} onChange={(url) => setThumbnail(url)} folder="[moduleName]" aspectRatio="video" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fixed bottom action bar */}
        <div className="fixed bottom-0 left-0 lg:left-[280px] right-0 p-4 bg-white dark:bg-slate-900 border-t flex justify-between items-center z-10">
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/[module-name]')} title="Hủy (Esc)">Hủy bỏ</Button>
          <div className="flex gap-2">
            <span className="text-xs text-slate-400 self-center hidden sm:block">Ctrl+S để lưu</span>
            <Button type="button" variant="secondary" onClick={() => setStatus('Draft')}>Lưu nháp</Button>
            <Button type="submit" variant="accent" disabled={isSubmitting} title="Lưu (Ctrl+S)">
              {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
              Đăng
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
```

#### 4.3 Edit Page (REFERENCE: app/admin/posts/[id]/edit/page.tsx)

Similar to Create page nhưng:
- Load data từ `useQuery(api.[moduleName].getById, { id })`
- `useEffect` để sync state khi data load xong
- Gọi `update` mutation thay vì `create`
- Support thêm status "Archived"

### Phase 5: Tạo System Config Page (REFERENCE: app/system/modules/posts/page.tsx)

File: `app/system/modules/[module-name]/page.tsx`

**⚠️ CRITICAL Features:**
- Tab Config: Settings, Features (linked với Fields), Fields (system vs optional)
- Tab Data: Statistics, Tables preview, Seed/Clear/Reset buttons
- Tab Appearance (optional): Style selector với preview
- Change detection: hasChanges, batch save với Promise.all()
- Use `usePaginatedQuery` thay vì `listAll` cho Data tab

```typescript
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, usePaginatedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { [Icon], FolderTree, Tag, Star, Clock, Loader2, Database, Trash2, RefreshCw, Settings, Palette } from 'lucide-react';
import { FieldConfig } from '@/types/moduleConfig';
import { ModuleHeader, ModuleStatus, ConventionNote, Code, SettingsCard, SettingInput, SettingSelect, FeaturesCard, FieldsCard } from '@/components/modules/shared';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, cn } from '@/app/admin/components/ui';

const MODULE_KEY = '[moduleName]';
const CATEGORY_MODULE_KEY = '[moduleName]Categories';

const FEATURES_CONFIG = [
  { key: 'enableTags', label: 'Tags', icon: Tag, linkedField: 'tags' },
  { key: 'enableFeatured', label: 'Nổi bật', icon: Star, linkedField: 'featured' },
];

type FeaturesState = Record<string, boolean>;
type SettingsState = { [moduleName]PerPage: number; defaultStatus: string };
type TabType = 'config' | 'data' | 'appearance';

export default function [ModuleName]ConfigPage() {
  const [activeTab, setActiveTab] = useState<TabType>('config');
  
  // Config queries
  const moduleData = useQuery(api.admin.modules.getModuleByKey, { key: MODULE_KEY });
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  const fieldsData = useQuery(api.admin.modules.listModuleFields, { moduleKey: MODULE_KEY });
  const categoryFieldsData = useQuery(api.admin.modules.listModuleFields, { moduleKey: CATEGORY_MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });

  // ⚠️ CRITICAL: Data tab queries với pagination thay vì listAll
  const { results: itemsData, status: itemsStatus, loadMore: loadMoreItems } = usePaginatedQuery(
    api.[moduleName].list,
    {},
    { initialNumItems: 10 }
  );
  const categoriesData = useQuery(api.[moduleName]Categories.listAll, { limit: 50 });

  // Mutations
  const toggleFeature = useMutation(api.admin.modules.toggleModuleFeature);
  const updateField = useMutation(api.admin.modules.updateModuleField);
  const setSetting = useMutation(api.admin.modules.setModuleSetting);
  const seedModule = useMutation(api.seed.seed[ModuleName]Module);
  const clearData = useMutation(api.seed.clear[ModuleName]Data);

  // Local state for change tracking
  const [localFeatures, setLocalFeatures] = useState<FeaturesState>({});
  const [localFields, setLocalFields] = useState<FieldConfig[]>([]);
  const [localCategoryFields, setLocalCategoryFields] = useState<FieldConfig[]>([]);
  const [localSettings, setLocalSettings] = useState<SettingsState>({ [moduleName]PerPage: 10, defaultStatus: 'draft' });
  const [isSaving, setIsSaving] = useState(false);

  const isLoading = moduleData === undefined || featuresData === undefined || fieldsData === undefined || settingsData === undefined;

  // Sync effects... (same pattern as Posts)
  
  // Server state for comparison
  const serverFeatures = useMemo(() => { /* ... */ }, [featuresData]);
  const serverFields = useMemo(() => { /* ... */ }, [fieldsData]);
  const serverSettings = useMemo(() => { /* ... */ }, [settingsData]);

  // ⚠️ CRITICAL: Change detection
  const hasChanges = useMemo(() => {
    const featuresChanged = Object.keys(localFeatures).some(key => localFeatures[key] !== serverFeatures[key]);
    const fieldsChanged = localFields.some(f => { /* compare */ });
    const settingsChanged = localSettings.[moduleName]PerPage !== serverSettings.[moduleName]PerPage || /* ... */;
    return featuresChanged || fieldsChanged || settingsChanged;
  }, [localFeatures, serverFeatures, localFields, serverFields, localSettings, serverSettings]);

  // Feature toggle handler - also updates linked fields
  const handleToggleFeature = (key: string) => {
    const newState = !localFeatures[key];
    setLocalFeatures(prev => ({ ...prev, [key]: newState }));
    setLocalFields(prev => prev.map(f => f.linkedFeature === key ? { ...f, enabled: newState } : f));
  };

  // ⚠️ CRITICAL: Batch save với Promise.all
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      // Collect feature updates
      for (const key of Object.keys(localFeatures)) {
        if (localFeatures[key] !== serverFeatures[key]) {
          promises.push(toggleFeature({ moduleKey: MODULE_KEY, featureKey: key, enabled: localFeatures[key] }));
        }
      }
      // Collect field updates
      // Collect settings updates
      await Promise.all(promises);
      toast.success('Đã lưu cấu hình!');
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsSaving(false);
    }
  };

  // Data tab handlers
  const handleSeedAll = async () => { /* ... */ };
  const handleClearAll = async () => { /* ... */ };
  const handleResetAll = async () => { /* ... */ };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <ModuleHeader
        icon={[Icon]}
        title="Module [Display Name]"
        description="Cấu hình [module display name]"
        iconBgClass="bg-[color]-500/10"
        iconTextClass="text-[color]-600 dark:text-[color]-400"
        buttonClass="bg-[color]-600 hover:bg-[color]-500"
        onSave={activeTab === 'config' ? handleSave : undefined}
        hasChanges={activeTab === 'config' ? hasChanges : false}
        isSaving={isSaving}
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => setActiveTab('config')} className={cn("...", activeTab === 'config' ? 'border-[color]-500' : '')}>
          <Settings size={16} /> Cấu hình
        </button>
        <button onClick={() => setActiveTab('data')} className={cn("...", activeTab === 'data' ? 'border-[color]-500' : '')}>
          <Database size={16} /> Dữ liệu
        </button>
      </div>

      {/* Config Tab */}
      {activeTab === 'config' && (
        <>
          <ModuleStatus isCore={moduleData?.isCore ?? false} enabled={moduleData?.enabled ?? true} toggleColor="bg-[color]-500" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-4">
              <SettingsCard>
                <SettingInput label="Số item / trang" value={localSettings.[moduleName]PerPage} onChange={(v) => setLocalSettings({...localSettings, [moduleName]PerPage: v})} />
                <SettingSelect label="Trạng thái mặc định" value={localSettings.defaultStatus} onChange={(v) => setLocalSettings({...localSettings, defaultStatus: v})} options={[{ value: 'draft', label: 'Bản nháp' }, { value: 'published', label: 'Xuất bản' }]} />
              </SettingsCard>
              <FeaturesCard features={FEATURES_CONFIG.map(f => ({ config: f, enabled: localFeatures[f.key] ?? false }))} onToggle={handleToggleFeature} toggleColor="bg-[color]-500" />
            </div>
            <FieldsCard title="Trường [Entity]" icon={[Icon]} fields={localFields} onToggle={handleToggleField} />
            <FieldsCard title="Trường danh mục" icon={FolderTree} fields={localCategoryFields} onToggle={handleToggleCategoryField} />
          </div>
          <ConventionNote><strong>Convention:</strong> Slug tự động từ tiêu đề. Trường <Code>order</Code> và <Code>active</Code> bắt buộc.</ConventionNote>
        </>
      )}

      {/* Data Tab */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Action buttons */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Quản lý dữ liệu mẫu</h3>
                <p className="text-sm text-slate-500 mt-1">Seed, clear hoặc reset dữ liệu</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSeedAll} className="gap-2"><Database size={16} /> Seed Data</Button>
                <Button variant="outline" onClick={handleClearAll} className="gap-2 text-red-500"><Trash2 size={16} /> Clear All</Button>
                <Button onClick={handleResetAll} className="gap-2 bg-[color]-600"><RefreshCw size={16} /> Reset</Button>
              </div>
            </div>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[color]-500/10 rounded-lg"><[Icon] className="w-5 h-5 text-[color]-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{itemsData?.length ?? 0}{itemsStatus === 'CanLoadMore' ? '+' : ''}</p>
                  <p className="text-sm text-slate-500">[Entity Name]</p>
                </div>
              </div>
            </Card>
            {/* More stats cards... */}
          </div>

          {/* Data Tables với pagination */}
          <Card>
            <div className="p-4 border-b flex items-center gap-2">
              <[Icon] className="w-5 h-5 text-[color]-500" />
              <h3 className="font-semibold">[Entity Name] ({itemsData?.length ?? 0}{itemsStatus === 'CanLoadMore' ? '+' : ''})</h3>
            </div>
            <Table>
              {/* Table content... */}
            </Table>
            {itemsStatus === 'CanLoadMore' && (
              <div className="p-3 border-t text-center">
                <Button variant="ghost" size="sm" onClick={() => loadMoreItems(10)}>Tải thêm</Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
```

### Phase 6: Đăng ký Module & Sidebar

#### 6.1 Đăng ký trong seed.ts

```typescript
// Trong seedAll mutation, thêm module
{ key: "[moduleName]", name: "[Display Name]", description: "[Description]", icon: "[Icon]", category: "[category]" as const, enabled: true, isCore: false, order: [number] },
```

#### 6.2 Thêm vào Sidebar

File: `app/admin/components/Sidebar.tsx`

```typescript
{ name: '[Display Name]', href: '/admin/[module-name]', icon: [Icon], moduleKey: '[moduleName]' },
```

## Bandwidth Guardrails (BẮT BUỘC)

- Mặc định limit 20, max 100 (hoặc theo `{module}PerPage`).
- Không dùng `listAll`/`collect()` cho luồng hiển thị list chính.
- Filter/sort phải thực hiện ở DB (index phù hợp), không filter JS sau fetch-all.
- `collect()` chỉ chấp nhận trong luồng cleanup/reset có kiểm soát.

## Checklist hoàn thành Module

### ✅ Convex Backend
- [ ] Schema trong `convex/schema.ts` với đầy đủ indexes
- [ ] Queries/Mutations với validators trong `convex/[moduleName].ts`
- [ ] Model layer (optional) trong `convex/model/[moduleName].ts`
- [ ] Sub-entity file (nếu có): `convex/[moduleName]Categories.ts`

### ✅ Seed Data
- [ ] `seed[ModuleName]Module` mutation (data + features + fields + settings)
- [ ] `clear[ModuleName]Data` mutation (cascade delete + storage cleanup)
- [ ] Module registered trong seedAll

### ✅ Admin Pages
- [ ] List page với **pagination** từ settings
- [ ] Create page với **conditional fields** từ module config
- [ ] Edit page với **initial data** sync
- [ ] **Keyboard shortcuts** (Ctrl+S, Esc)
- [ ] **ModuleGuard** wrapping

### ✅ System Config Page
- [ ] Tab Config: Settings, Features (linked fields), Fields (toggle)
- [ ] Tab Data: Statistics, Tables preview, Seed/Clear/Reset
- [ ] Tab Appearance (optional): Style selector với preview
- [ ] **Change detection** (hasChanges)
- [ ] **Batch save** với Promise.all()
- [ ] **usePaginatedQuery** cho Data tab

### ✅ Integration
- [ ] Sidebar entry added
- [ ] Settings apply đúng (pagination, default status)
- [ ] Feature toggles ảnh hưởng admin UI

### ✅ DB Bandwidth Optimization (từ AGENTS.md)
- [ ] Sử dụng `take()` thay vì `collect()` trong queries
- [ ] Sử dụng compound indexes cho filters
- [ ] Pagination mặc định (20), max (100)
- [ ] Không N+1 queries - batch load với Promise.all()
- [ ] Cascade delete xóa related data

## Reference Files (Posts Module - CHUẨN)

```
convex/posts.ts              # Queries/Mutations với validators + pagination
convex/model/posts.ts        # Business logic layer
convex/postCategories.ts     # Sub-entity
convex/schema.ts             # Schema với indexes
convex/seed.ts               # seedPostsModule, clearPostsData

app/admin/posts/page.tsx         # List với pagination, sort, filter, bulk actions
app/admin/posts/create/page.tsx  # Create với conditional fields, keyboard shortcuts
app/admin/posts/[id]/edit/page.tsx # Edit với initial data sync

app/system/modules/posts/page.tsx # Config + Data + Appearance tabs
```

---

## Home Component Manual Selection Pattern

Khi tạo home component có khả năng hiển thị data từ module khác (Blog hiển thị Posts, ProductList hiển thị Products), cần hỗ trợ 2 chế độ:

### 1. Config Schema

```typescript
// homeComponents config cho Blog/ProductList component
{
  itemCount: number,           // Số lượng hiển thị (cho auto mode)
  sortBy: 'newest' | 'popular' | 'random',  // Sắp xếp (cho auto mode)
  style: 'grid' | 'list' | 'featured',      // Style hiển thị
  selectionMode: 'auto' | 'manual',         // Chế độ chọn
  selectedPostIds: string[],   // Danh sách ID đã chọn (cho manual mode)
}
```

### 2. Edit Page States

```typescript
// States cho manual selection
const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto');
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [searchTerm, setSearchTerm] = useState('');

// Query data để chọn
const itemsData = useQuery(api.[module].listAll, { limit: 100 });

// Filter và get selected items
const filteredItems = useMemo(() => {
  if (!itemsData) return [];
  return itemsData
    .filter(item => item.status === 'Published')
    .filter(item => !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase()));
}, [itemsData, searchTerm]);

const selectedItems = useMemo(() => {
  if (!itemsData || selectedIds.length === 0) return [];
  const map = new Map(itemsData.map(p => [p._id, p]));
  return selectedIds.map(id => map.get(id)).filter(Boolean);
}, [itemsData, selectedIds]);
```

### 3. Initialize từ config

```typescript
case 'Blog':
  setSelectionMode(config.selectionMode || 'auto');
  setSelectedIds(config.selectedPostIds || []);
  // ... other config
  break;
```

### 4. Build config

```typescript
case 'Blog':
  return { 
    ...autoConfig, 
    style,
    selectionMode,
    selectedPostIds: selectionMode === 'manual' ? selectedIds : [],
  };
```

### 5. UI Pattern (REFERENCE: app/admin/home-components/[id]/edit/page.tsx - Blog section)

```tsx
{/* Selection Mode Toggle */}
<div className="space-y-2">
  <Label>Chế độ chọn</Label>
  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => setSelectionMode('auto')}
      className={cn(
        "flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all",
        selectionMode === 'auto'
          ? "border-blue-500 bg-blue-500/10 text-blue-600"
          : "border-slate-200 hover:border-slate-300"
      )}
    >
      Tự động
    </button>
    <button
      type="button"
      onClick={() => setSelectionMode('manual')}
      className={cn(
        "flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all",
        selectionMode === 'manual'
          ? "border-blue-500 bg-blue-500/10 text-blue-600"
          : "border-slate-200 hover:border-slate-300"
      )}
    >
      Chọn thủ công
    </button>
  </div>
</div>

{/* Auto mode settings */}
{selectionMode === 'auto' && (
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label>Số lượng hiển thị</Label>
      <Input type="number" value={itemCount} onChange={...} />
    </div>
    <div className="space-y-2">
      <Label>Sắp xếp theo</Label>
      <select value={sortBy} onChange={...}>
        <option value="newest">Mới nhất</option>
        <option value="popular">Xem nhiều nhất</option>
        <option value="random">Ngẫu nhiên</option>
      </select>
    </div>
  </div>
)}

{/* Manual mode - Item selector */}
{selectionMode === 'manual' && (
  <div className="space-y-4">
    {/* Selected items list với drag handle, thumbnail, title, remove button */}
    {selectedItems.length > 0 && (
      <div className="space-y-2">
        <Label>Đã chọn ({selectedItems.length})</Label>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {selectedItems.map((item, index) => (
            <div key={item._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <GripVertical size={16} className="text-slate-400" />
              <span className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {index + 1}
              </span>
              {/* Thumbnail */}
              {/* Title + Date */}
              <Button variant="ghost" size="icon" onClick={() => removeItem(item._id)}>
                <X size={16} />
              </Button>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Search and add items */}
    <div className="space-y-2">
      <Label>Thêm</Label>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Tìm kiếm..." className="pl-9" value={searchTerm} onChange={...} />
      </div>
      <div className="border rounded-lg max-h-[250px] overflow-y-auto">
        {filteredItems.map(item => {
          const isSelected = selectedIds.includes(item._id);
          return (
            <div 
              key={item._id}
              onClick={() => toggleSelect(item._id)}
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer border-b last:border-0",
                isSelected ? "bg-blue-50" : "hover:bg-slate-50"
              )}
            >
              {/* Checkbox */}
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center",
                isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"
              )}>
                {isSelected && <Check size={12} className="text-white" />}
              </div>
              {/* Thumbnail */}
              {/* Title + metadata */}
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}
```

### 6. Áp dụng cho các component khác

Pattern này có thể áp dụng cho:
- **Blog**: Chọn Posts
- **ProductList**: Chọn Products  
- **Gallery**: Chọn Images
- **Testimonials**: Chọn Reviews/Testimonials
- **Partners**: Chọn Partner logos

Icons cần import: `Search`, `GripVertical`, `X`, `Check` từ lucide-react
