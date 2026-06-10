## Phase 3 Review - Admin Option Management

### Checklist hoàn thành

| Task | Status | Files |
|------|--------|-------|
| `/admin/product-options` list page | ✅ | `app/admin/product-options/page.tsx` |
| `/admin/product-options/create` | ✅ | `app/admin/product-options/create/page.tsx` |
| `/admin/product-options/[id]/edit` | ✅ | `app/admin/product-options/[id]/edit/page.tsx` |
| `/admin/product-options/[id]/values` | ✅ | `app/admin/product-options/[id]/values/page.tsx` |
| Shared OptionForm component | ✅ | `app/admin/product-options/components/OptionForm.tsx` |
| Sidebar link (conditional variantEnabled) | ✅ | `app/admin/components/Sidebar.tsx` |
| Commit changes | ✅ | `22ddf4b feat: add product option admin pages` |

### Features đã có trong Phase 3

- **List page**: search, filter (active/preset), sort, drag-drop reorder, bulk delete
- **Create/Edit**: form đầy đủ fields (name, slug, displayType, inputType, unit, showPriceCompare, compareUnit, active)
- **Values page**: inline edit, drag-drop reorder, color picker, image upload, badge/lifetime fields
- **Sidebar**: link "Loại tùy chọn" chỉ hiện khi `variantEnabled = true`

**Phase 3: COMPLETED** ✅

---

## Remaining Phases Overview

Theo spec gốc, còn **3 phases** nữa:

| Phase | Mô tả | Tasks | Est. |
|-------|-------|-------|------|
| **Phase 4** | Admin - Product Variants | 5 | 3-4 ngày |
| **Phase 5** | Integration (Cart/Orders/Wishlist) | 4 | 2 ngày |
| **Phase 6** | Frontend Experience | 5 | 3-4 ngày |

---

## Phase 4: Admin - Product Variants (CHI TIẾT)

### 4.1 Update `/admin/products/create` - add variant toggle
- Thêm toggle "Sản phẩm có phiên bản" (chỉ hiện khi variantEnabled)
- Nếu bật: hiện section chọn options cho sản phẩm này (multi-select)
- Lưu `hasVariants`, `optionIds` vào products

### 4.2 `/admin/products/[id]/variants` - list variants
- Hiển thị tất cả variants của product
- Columns: SKU, Option values (Màu/Size/...), Price, Stock, Status
- Actions: edit, delete, bulk actions
- Link tạo variant mới

### 4.3 `/admin/products/[id]/variants/create` - create variant
- Form tạo variant: chọn giá trị cho từng option
- Nhập SKU, barcode, price, salePrice, stock
- Upload ảnh riêng (nếu variantImages != inherit)

### 4.4 `/admin/products/[id]/variants/[vid]/edit` - edit variant
- Form sửa variant tương tự create

### 4.5 Bulk variant generator
- Tự động tạo tất cả combinations từ selected options
- VD: 3 colors x 4 sizes = 12 variants auto-generated
- Có thể set price/stock mặc định

---

## Phase 5: Integration (CHI TIẾT)

### 5.1 Update `cart.ts`
- `cartItems.variantId` (optional)
- Khi add to cart: nếu product hasVariants, phải chọn variant
- Hiển thị variant info trong cart

### 5.2 Update `orders.ts`
- `orderItems.variantId` (optional)
- `orderItems.variantTitle` (VD: "Đỏ / M / 1 năm")
- Stock deduction từ variant (nếu variantStock = variant)

### 5.3 Update `wishlist.ts`
- `wishlist.variantId` (optional)
- Hiển thị variant info trong wishlist

### 5.4 Update seed data
- Thêm sample variants cho products mẫu

---

## Phase 6: Frontend Experience (CHI TIẾT)

### 6.1 Variant Selector Component
- Component chung cho tất cả display types
- Props: options, values, selectedValues, onSelect, outOfStockDisplay

### 6.2 Display Type Components
- ColorSwatch: circle swatches với selected state
- Buttons/Pills: chip buttons
- Radio: radio list với price compare
- Dropdown: select dropdown
- NumberInput, TextInput: input fields

### 6.3 Product Detail Experience Integration
- Thêm config `showVariants` cho mỗi layout (classic/modern/minimal)
- Thêm vào preview component
- Tích hợp vào `/system/experiences/product-detail`

### 6.4 Frontend Product Detail Page
- `/products/[slug]` - hiển thị variant selector
- Image change animation khi chọn variant có ảnh riêng
- Price/stock update theo variant selected

### 6.5 Cart/Checkout Variant Display
- Hiển thị variant title trong cart items
- Checkout confirmation với variant info

---

## Summary: Còn bao nhiêu nữa?

| Đã hoàn thành | Còn lại |
|---------------|---------|
| Phase 1: Core DB ✅ | Phase 4: Admin Product Variants |
| Phase 2: System Config ✅ | Phase 5: Integration |
| Phase 3: Option Management ✅ | Phase 6: Frontend Experience |

**Tổng cộng còn: 3 phases (~14 tasks, ~8-10 ngày làm việc)**

---

Bạn muốn tiếp tục Phase 4 (Admin Product Variants) không?