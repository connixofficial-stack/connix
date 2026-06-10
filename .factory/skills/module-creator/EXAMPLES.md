# Module Creator - Ví dụ thực tế

## Ví dụ 1: Tạo Module Products (Sản phẩm)

### Yêu cầu từ user:
> "Tạo module sản phẩm với các trường: name, price, description, thumbnail, categoryId, status"

### Bước 1: Thu thập thông tin

```
- Tên module: products
- Tên hiển thị: Sản phẩm
- Các trường: name, slug, price, description, thumbnail, categoryId, status, order
- Sub-entity: productCategories
- Features: tags, featured
- Icon: Package
- Category: commerce
```

### Bước 2: Tạo Schema

```typescript
// convex/schema.ts

products: defineTable({
  name: v.string(),
  slug: v.string(),
  price: v.number(),
  description: v.optional(v.string()),
  thumbnail: v.optional(v.string()),
  categoryId: v.id("productCategories"),
  status: v.union(v.literal("Active"), v.literal("Inactive"), v.literal("OutOfStock")),
  order: v.number(),
})
  .index("by_slug", ["slug"])
  .index("by_status", ["status"])
  .index("by_category", ["categoryId"]),

productCategories: defineTable({
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  parentId: v.optional(v.id("productCategories")),
  order: v.number(),
  active: v.boolean(),
})
  .index("by_slug", ["slug"])
  .index("by_parent", ["parentId"])
  .index("by_active", ["active"]),
```

### Bước 3: Tạo Convex files

- `convex/products.ts` - CRUD queries/mutations
- `convex/productCategories.ts` - Category CRUD

### Bước 4: Tạo Seed data

```typescript
// Thêm vào convex/seed.ts

export const seedProducts = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Seed categories
    const categories = [
      { name: "Điện tử", slug: "dien-tu", order: 0, active: true },
      { name: "Thời trang", slug: "thoi-trang", order: 1, active: true },
      { name: "Gia dụng", slug: "gia-dung", order: 2, active: true },
    ];
    // ...
    
    // Seed products
    const products = [
      { name: "iPhone 15", slug: "iphone-15", price: 25000000, categoryId: categoryIds[0], status: "Active", order: 0 },
      // ...
    ];
    // ...
    
    // Seed features, fields, settings
    // ...
  },
});
```

### Bước 5: Tạo Admin pages

```
app/admin/products/
├── page.tsx           # List page
├── create/
│   └── page.tsx       # Create page
└── [id]/
    └── edit/
        └── page.tsx   # Edit page

app/admin/product-categories/
├── page.tsx
├── create/
│   └── page.tsx
└── [id]/
    └── edit/
        └── page.tsx
```

### Bước 6: Tạo System config page

```
app/system/modules/products/
└── page.tsx           # Config + Data tabs
```

### Bước 7: Đăng ký module

```typescript
// Thêm vào seedAll trong convex/seed.ts
{ 
  key: "products", 
  name: "Sản phẩm", 
  description: "Quản lý sản phẩm", 
  icon: "Package", 
  category: "commerce", 
  enabled: true, 
  isCore: false, 
  order: 4 
},
```

### Bước 8: Thêm vào Sidebar

```typescript
// app/admin/components/Sidebar.tsx
{
  name: 'Sản phẩm',
  href: '/admin/products',
  icon: Package,
  moduleKey: 'products',
},
{
  name: 'Danh mục SP',
  href: '/admin/product-categories',
  icon: FolderTree,
  moduleKey: 'products',
},
```

---

## Ví dụ 2: Tạo Module Customers (Khách hàng)

### Yêu cầu:
> "Tạo module khách hàng với: name, email, phone, address, status"

### Thông tin:
```
- moduleName: customers
- displayName: Khách hàng
- Fields: name, email, phone, address, status
- Sub-entity: không
- Icon: Users
- Category: user
```

### Files cần tạo:
1. `convex/customers.ts`
2. `convex/seed.ts` - thêm seedCustomers, clearCustomersData
3. `app/admin/customers/page.tsx`
4. `app/admin/customers/create/page.tsx`
5. `app/admin/customers/[id]/edit/page.tsx`
6. `app/system/modules/customers/page.tsx`

---

## Ví dụ 3: Tạo Module Orders (Đơn hàng)

### Yêu cầu:
> "Tạo module đơn hàng liên kết với customers và products"

### Thông tin:
```
- moduleName: orders
- displayName: Đơn hàng
- Fields: orderNumber, customerId, items, totalAmount, status, note
- Dependencies: customers, products
- Icon: ShoppingBag
- Category: commerce
```

### Schema đặc biệt:
```typescript
orders: defineTable({
  orderNumber: v.string(),
  customerId: v.id("customers"),
  items: v.array(v.object({
    productId: v.id("products"),
    quantity: v.number(),
    price: v.number(),
  })),
  totalAmount: v.number(),
  status: v.union(
    v.literal("Pending"),
    v.literal("Processing"),
    v.literal("Shipped"),
    v.literal("Delivered"),
    v.literal("Cancelled")
  ),
  note: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_customer", ["customerId"])
  .index("by_status", ["status"])
  .index("by_orderNumber", ["orderNumber"]),
```

---

## Checklist tạo Module mới

### Backend (Convex)
- [ ] Thêm schema vào `convex/schema.ts`
- [ ] Tạo file `convex/[moduleName].ts` với queries/mutations
- [ ] Tạo file `convex/[moduleName]Categories.ts` (nếu có sub-entity)
- [ ] Thêm seed functions vào `convex/seed.ts`:
  - [ ] `seed[ModuleName]` - tạo data mẫu
  - [ ] `clear[ModuleName]Data` - xóa data (giữ config)
  - [ ] `clear[ModuleName]Config` - xóa config (tùy chọn)
- [ ] Đăng ký module trong `seedAll`

### Frontend (Admin)
- [ ] Tạo `app/admin/[module-slug]/page.tsx` - List page
- [ ] Tạo `app/admin/[module-slug]/create/page.tsx` - Create page
- [ ] Tạo `app/admin/[module-slug]/[id]/edit/page.tsx` - Edit page
- [ ] Tạo pages cho sub-entity (nếu có)
- [ ] Wrap pages với `<ModuleGuard>`
- [ ] Thêm vào Sidebar

### Frontend (System)
- [ ] Tạo `app/system/modules/[module-slug]/page.tsx`
- [ ] Tab Cấu hình: Settings, Features, Fields
- [ ] Tab Dữ liệu: Statistics, Table, Seed/Clear buttons

### Testing
- [ ] TypeScript passes
- [ ] ESLint passes
- [ ] CRUD operations work
- [ ] System config syncs with admin
- [ ] Conditional fields hide/show correctly
- [ ] Seed/Clear/Reset work correctly
