## Product Variants Module - Spec Chi Tiết v2

### 1. Tổng quan kiến trúc

| Quyết định | Lựa chọn |
|------------|----------|
| Module structure | Module riêng `productVariants` (1-n với products) |
| Option types | EAV Pattern - không giới hạn, động |
| Pricing mode | Hybrid - cấu hình qua System Settings |
| Stock mode | Hybrid - cấu hình qua System Settings |
| Image mode | Hybrid - inherit/override |
| Variant limit | Không giới hạn |

---

### 2. Option Display Types hỗ trợ

| Display Type | Use Case | Ví dụ |
|--------------|----------|-------|
| **Dropdown** | Nhiều giá trị, không cần visual | Material (Cotton, Polyester,...) |
| **Buttons/Pills** | Ít giá trị, dễ click | Size text (S, M, L, XL) |
| **Radio** | Single choice rõ ràng | License type |
| **Color Swatch** | Màu sắc solid | Đỏ, Xanh, Vàng (hex code) |
| **Image Swatch** | Cần hình ảnh minh họa | Pattern vải, texture |
| **Color Picker** | Màu tùy chọn | Custom color |
| **Number Input** | Giá trị số | Size giày (38, 39, 40) |
| **Text Input** | Giá trị custom | Khắc tên, in chữ |

---

### 3. Preset Option Types (có sẵn)

```
📦 Physical Products:
├── Color      (swatch: solid color)
├── Size       (pills: S/M/L hoặc number: 38/39/40)
├── Material   (dropdown: Cotton, Polyester, Silk)
├── Weight     (number + unit: 500g, 1kg)
├── Volume     (number + unit: 250ml, 500ml)
├── Packaging  (pills: Standard, Gift box, Premium)
└── Bundle     (pills: 1 cái, 3 cái, 5 cái)

📦 Digital Products:
├── Duration   (pills + price compare: 1 tuần, 1 tháng, 1 năm, Vĩnh viễn)
├── License    (radio: Personal, Commercial, Extended)
├── Users      (number: 1 user, 5 users, Unlimited)
└── Features   (checkbox: Basic, Pro, Enterprise)

📦 Custom:
└── [Admin tự tạo option type mới]
```

---

### 4. Schema Database (Convex)

```typescript
// 1. productOptions - Định nghĩa loại option
productOptions: defineTable({
  name: v.string(),              // "Color", "Size", "Duration"
  slug: v.string(),              // "color", "size", "duration"
  displayType: v.union(
    v.literal("dropdown"),
    v.literal("buttons"),        // pills/chips
    v.literal("radio"),
    v.literal("color_swatch"),
    v.literal("image_swatch"),
    v.literal("color_picker"),
    v.literal("number_input"),
    v.literal("text_input")
  ),
  inputType: v.optional(v.union(
    v.literal("text"),
    v.literal("number"),
    v.literal("color")
  )),
  unit: v.optional(v.string()),  // "kg", "ml", "tháng", "năm"
  isPreset: v.boolean(),         // true = system preset
  showPriceCompare: v.optional(v.boolean()),  // cho Duration
  compareUnit: v.optional(v.string()),        // "tháng" - quy đổi về
  order: v.number(),
  active: v.boolean(),
})

// 2. productOptionValues - Giá trị của option
productOptionValues: defineTable({
  optionId: v.id("productOptions"),
  value: v.string(),             // "Red", "M", "1 tháng"
  label: v.optional(v.string()), // Display label khác value
  colorCode: v.optional(v.string()),   // "#FF0000" cho color swatch
  image: v.optional(v.string()),       // URL cho image swatch
  numericValue: v.optional(v.number()), // 1, 3, 12 cho duration (tháng)
  isLifetime: v.optional(v.boolean()),  // true cho "Vĩnh viễn"
  badge: v.optional(v.string()),        // "Best Value", "Phổ biến"
  order: v.number(),
  active: v.boolean(),
})

// 3. productVariants - Biến thể sản phẩm
productVariants: defineTable({
  productId: v.id("products"),
  sku: v.string(),
  barcode: v.optional(v.string()),
  
  // Pricing (khi variantPricing = "variant")
  price: v.optional(v.number()),
  salePrice: v.optional(v.number()),
  
  // Stock (khi variantStock = "variant")
  stock: v.optional(v.number()),
  allowBackorder: v.optional(v.boolean()),
  
  // Images (khi variantImages = "override" hoặc "both")
  image: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  
  // Option values - flexible array
  optionValues: v.array(v.object({
    optionId: v.id("productOptions"),
    valueId: v.id("productOptionValues"),
    customValue: v.optional(v.string()),  // cho text_input, color_picker
  })),
  
  status: v.union(v.literal("Active"), v.literal("Inactive")),
  order: v.number(),
})

// 4. Sửa products table - thêm fields
products: {
  // ... existing fields
  hasVariants: v.optional(v.boolean()),
  optionIds: v.optional(v.array(v.id("productOptions"))),
}
```

---

### 5. Frontend UI Behaviors

#### 5.1 Variant Selector
```
┌─────────────────────────────────────────────┐
│ Màu sắc:  [🔴] [🔵] [🟢] [⚫]              │  ← Color Swatch
│                                             │
│ Size:     [S] [M] [L̲] [XL]                 │  ← Buttons (L selected)
│                                             │
│ Thời hạn: ┌─────────────────────────────┐  │
│           │ ○ 1 tuần    -    50.000đ    │  │
│           │ ○ 1 tháng   -   150.000đ    │  │  ← Radio + Price compare
│           │ ● 1 năm     - 1.200.000đ    │  │
│           │   └─ 100.000đ/tháng         │  │
│           │ ○ Vĩnh viễn - 2.500.000đ    │  │
│           │   └─ ⭐ Best Value          │  │
│           └─────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

#### 5.2 Out-of-Stock Display
```
[S] [M] [L̲] [X̲L̲ Hết hàng]   ← Blur/Fade + Badge, vẫn click được để xem
```

#### 5.3 Image Change on Selection
- Khi chọn variant có ảnh riêng → **Fade animation** đổi main image
- Smooth transition 300ms

---

### 6. System Settings mới

| Module | Setting Key | Values | Default |
|--------|-------------|--------|---------|
| products | `variantEnabled` | boolean | false |
| products | `variantPricing` | `product` / `variant` | `variant` |
| products | `variantStock` | `product` / `variant` | `variant` |
| products | `variantImages` | `inherit` / `override` / `both` | `inherit` |
| products | `outOfStockDisplay` | `hide` / `disable` / `blur` | `blur` |
| products | `imageChangeAnimation` | `none` / `fade` / `slide` | `fade` |

---

### 7. Admin Pages cần tạo

| Route | Mô tả |
|-------|-------|
| `/system/products` | Thêm Variants settings section |
| `/admin/product-options` | CRUD Option types (Color, Size, Duration,...) |
| `/admin/product-options/[id]/values` | CRUD Values cho từng option |
| `/admin/products/create` | Thêm Variants tab/section |
| `/admin/products/[id]/edit` | Manage variants cho product |
| `/admin/products/[id]/variants` | Bulk manage variants |
| `/admin/products/[id]/variants/create` | Tạo variant mới |
| `/admin/products/[id]/variants/[vid]/edit` | Sửa variant |

---

### 8. Integration với các module khác

#### Cart
```typescript
// cartItems - thêm variantId
cartItems: {
  productId: v.id("products"),
  variantId: v.optional(v.id("productVariants")),  // NEW
  // price lấy từ variant nếu có
}
```

#### Orders
```typescript
// order items - thêm variant info
items: v.array(v.object({
  productId: v.id("products"),
  productName: v.string(),
  variantId: v.optional(v.id("productVariants")),  // NEW
  variantTitle: v.optional(v.string()),            // "Đỏ / M / 1 năm"
  price: v.number(),
  quantity: v.number(),
}))
```

#### Wishlist
```typescript
wishlist: {
  productId: v.id("products"),
  variantId: v.optional(v.id("productVariants")),  // NEW
}
```

---

### 9. Phân chia Tasks (20-25 tasks)

**Phase 1: Core Database (5 tasks)**
1. Schema `productOptions` + indexes
2. Schema `productOptionValues` + indexes  
3. Schema `productVariants` + indexes
4. Queries/Mutations cho productOptions
5. Queries/Mutations cho productVariants

**Phase 2: System Config (2 tasks)**
6. `/system/products` - Variant settings UI
7. Seed preset option types (Color, Size, Duration,...)

**Phase 3: Admin - Option Management (3 tasks)**
8. `/admin/product-options` list page
9. `/admin/product-options` create/edit
10. `/admin/product-options/[id]/values` manage values

**Phase 4: Admin - Product Variants (5 tasks)**
11. Update `/admin/products/create` - add variant toggle
12. `/admin/products/[id]/variants` - list variants
13. `/admin/products/[id]/variants/create` - create variant
14. `/admin/products/[id]/variants/[vid]/edit` - edit variant
15. Bulk variant generator (tạo combinations tự động)

**Phase 5: Integration (4 tasks)**
16. Update `cart.ts` - add variantId support
17. Update `orders.ts` - add variant info
18. Update `wishlist.ts` - add variantId
19. Update seed data với sample variants

**Phase 6: Frontend Experience (5 tasks)**
20. Variant selector component (all display types)
21. Color swatch component
22. Duration selector với price compare
23. Product detail page integration
24. Cart/Checkout variant display
25. Image change animation

---

### 10. Timeline ước tính

| Phase | Tasks | Thời gian |
|-------|-------|-----------|
| Phase 1: Core DB | 5 | 2-3 ngày |
| Phase 2: System Config | 2 | 1 ngày |
| Phase 3: Option Management | 3 | 2 ngày |
| Phase 4: Product Variants | 5 | 3-4 ngày |
| Phase 5: Integration | 4 | 2 ngày |
| Phase 6: Frontend | 5 | 3-4 ngày |
| **Tổng** | **24** | **13-17 ngày** |

---

### 11. Use Cases được hỗ trợ

| Use Case | Cấu hình |
|----------|----------|
| Web đơn giản (không variant) | `variantEnabled: false` |
| Quần áo (Color + Size, cùng giá) | `variantPricing: product` |
| Giày (Color + Size số, khác giá) | `variantPricing: variant` |
| Digital (Duration, License) | Duration option + price compare |
| Acc Canva (1 tuần/tháng/năm/vĩnh viễn) | Duration với isLifetime |
| Sản phẩm có ảnh riêng từng màu | `variantImages: override` |

---

**Bạn muốn bắt đầu với Phase nào?** Recommend Phase 1 (Core Database) trước.