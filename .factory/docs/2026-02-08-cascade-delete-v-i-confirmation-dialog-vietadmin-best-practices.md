## Dependency Graph - VietAdmin

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPENDENCY RELATIONSHIPS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  productCategories (1) ───┬──► products (N)                     │
│                           └──► productCategories (N) [children] │
│                                                                  │
│  postCategories (1) ──────┬──► posts (N)                        │
│                           └──► postCategories (N) [children]    │
│                                                                  │
│  serviceCategories (1) ───┬──► services (N)                     │
│                           └──► serviceCategories (N) [children] │
│                                                                  │
│  roles (1) ───────────────┬──► users (N)                        │
│                           └──► adminUsers (N)                   │
│                                                                  │
│  customers (1) ───────────┬──► orders (N)                       │
│                           ├──► carts (N)                        │
│                           ├──► wishlist (N)                     │
│                           └──► comments (N)                     │
│                                                                  │
│  products (1) ────────────┬──► productVariants (N)              │
│                           ├──► cartItems (N)                    │
│                           ├──► wishlist (N)                     │
│                           └──► comments (N)                     │
│                                                                  │
│  productOptions (1) ──────┬──► productOptionValues (N)          │
│                           └──► productVariants (N) [tham chiếu] │
│                                                                  │
│  menus (1) ───────────────┬──► menuItems (N)                    │
│                                                                  │
│  carts (1) ───────────────┬──► cartItems (N)                    │
│                                                                  │
│  promotions (1) ──────────┬──► promotionUsage (N)               │
│                           └──► orders (N) [tham chiếu]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan: CASCADE với Confirmation Dialog

### 1. Pattern chung (Convention over Configuration)

**Backend - Convex mutations:**
```typescript
// Mỗi entity có dependencies cần 2 functions:

// 1. getDeleteInfo - Query lấy thông tin trước khi xóa
export const getDeleteInfo = query({
  args: { id: v.id("table") },
  handler: async (ctx, args) => {
    const children = await ctx.db.query("childTable")
      .withIndex("by_parent", q => q.eq("parentId", args.id))
      .take(10); // Lấy max 10 để preview
    
    const childCount = await ctx.db.query("childTable")
      .withIndex("by_parent", q => q.eq("parentId", args.id))
      .take(1001); // Count với limit
    
    return {
      canDelete: true, // Luôn cho phép cascade
      childCount: Math.min(childCount.length, 1000),
      childPreview: children.map(c => ({ id: c._id, name: c.name })),
      hasMore: childCount.length > 1000,
    };
  },
});

// 2. remove - Mutation với cascade option
export const remove = mutation({
  args: { 
    id: v.id("table"),
    cascade: v.optional(v.boolean()), // Default: false (RESTRICT)
  },
  handler: async (ctx, args) => {
    const children = await ctx.db.query("childTable")
      .withIndex("by_parent", q => q.eq("parentId", args.id))
      .collect();
    
    if (children.length > 0) {
      if (!args.cascade) {
        throw new Error(`Có ${children.length} items liên quan. Chọn cascade để xóa tất cả.`);
      }
      // CASCADE: Xóa hết children
      await Promise.all(children.map(c => ctx.db.delete(c._id)));
    }
    
    await ctx.db.delete(args.id);
  },
});
```

### 2. Frontend - DeleteConfirmDialog Component

```typescript
// components/DeleteConfirmDialog.tsx
interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  itemName: string;
  dependencies?: {
    label: string;
    count: number;
    preview: { id: string; name: string }[];
    hasMore: boolean;
  }[];
  onConfirm: (cascade: boolean) => Promise<void>;
  isLoading?: boolean;
}

// UI hiển thị:
// - Title: "Xóa {itemName}?"
// - Nếu có dependencies:
//   - Cảnh báo màu vàng/đỏ
//   - List các items sẽ bị xóa (max 10, hiện "và X items khác...")
// - 2 buttons:
//   - "Hủy" (secondary)
//   - "Xóa tất cả" (destructive) - cascade=true
```

### 3. Áp dụng cho từng entity

| Entity | Dependencies | Cascade Items |
|--------|--------------|---------------|
| `productCategories` | children, products | categories con, sản phẩm |
| `postCategories` | children, posts | categories con, bài viết |
| `serviceCategories` | children, services | categories con, dịch vụ |
| `roles` | users, adminUsers | **RESTRICT** (không cascade) |
| `customers` | orders, carts, wishlist, comments | đơn hàng, giỏ hàng, wishlist, comments |
| `products` | variants, cartItems, wishlist | biến thể, items trong giỏ |
| `productOptions` | optionValues, variants tham chiếu | giá trị option |
| `menus` | menuItems | menu items |
| `promotions` | promotionUsage | lịch sử sử dụng |

### 4. Files cần thay đổi

**Backend (Convex):**
- `convex/productCategories.ts` - Đã có `getDeleteInfo`, cần thêm `cascade` param
- `convex/postCategories.ts` / `model/postCategories.ts` - Tương tự
- `convex/serviceCategories.ts` / `model/serviceCategories.ts` - Tương tự
- `convex/products.ts` - Thêm cascade cho variants, cartItems
- `convex/productOptions.ts` - Cascade optionValues
- `convex/customers.ts` - Đã có `cascadeOrders`, mở rộng thêm
- `convex/menus.ts` - Cascade menuItems
- `convex/promotions.ts` - Cascade promotionUsage

**Frontend:**
- `components/DeleteConfirmDialog.tsx` - Component mới
- Các trang `/admin/**/page.tsx` - Sử dụng dialog mới

### 5. UX Flow

```
User click Delete
      │
      ▼
┌─────────────────────┐
│ Gọi getDeleteInfo() │
└─────────────────────┘
      │
      ▼
   Có deps? ──No──► Xóa luôn (không cần confirm)
      │
     Yes
      │
      ▼
┌─────────────────────────────────────┐
│     DeleteConfirmDialog             │
│                                     │
│  ⚠️ Danh mục "Điện thoại" có:       │
│                                     │
│  📦 12 sản phẩm sẽ bị xóa:          │
│     • iPhone 15 Pro                 │
│     • Samsung Galaxy S24            │
│     • Xiaomi 14 Ultra               │
│     • ... và 9 sản phẩm khác        │
│                                     │
│  📁 2 danh mục con sẽ bị xóa:       │
│     • iPhone                        │
│     • Samsung                       │
│                                     │
│  [Hủy]            [Xóa tất cả (14)] │
└─────────────────────────────────────┘
      │
      ▼
User click "Xóa tất cả"
      │
      ▼
┌─────────────────────┐
│ remove(cascade:true)│
└─────────────────────┘
```

---

## Summary Best Practices

1. **Default: CASCADE với Confirmation** - Cho phép xóa nhưng luôn cảnh báo
2. **Exception: RESTRICT cho Roles** - Vì ảnh hưởng bảo mật, user phải tự reassign
3. **getDeleteInfo query** - Luôn có để frontend biết trước dependencies
4. **Preview list max 10 items** - UX tốt, không làm dialog quá dài
5. **Count với limit 1000** - Tránh full scan, hiện "1000+" nếu vượt

---

**Ước tính công việc:** ~2-3 giờ
- Backend mutations: 1h
- DeleteConfirmDialog component: 30m
- Áp dụng cho các trang admin: 1h
- Test: 30m