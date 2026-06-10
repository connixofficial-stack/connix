## Phase 1 Review - Core Database

### Checklist hoàn thành

| Task | Status | Files |
|------|--------|-------|
| Schema `productOptions` + indexes | ✅ | `schema.ts` L298-325 |
| Schema `productOptionValues` + indexes | ✅ | `schema.ts` L326-342 |
| Schema `productVariants` + indexes | ✅ | `schema.ts` L343-367 |
| Queries/Mutations productOptions | ✅ | `productOptions.ts` (250 lines) |
| Queries/Mutations productOptionValues | ✅ | `productOptionValues.ts` (261 lines) |
| Queries/Mutations productVariants | ✅ | `productVariants.ts` (289 lines) |
| Update products table (hasVariants, optionIds) | ✅ | `products.ts` + `schema.ts` |

### API Coverage

| Module | Queries | Mutations |
|--------|---------|-----------|
| **productOptions** | listAll, listActive, listAdminWithOffset, countAdmin, listAdminIds, getById, getBySlug | create, update, remove, reorder |
| **productOptionValues** | listAll, listByOption, listByOptionActive, listAdminWithOffset, countAdmin, listAdminIds, getById | create, update, remove, reorder |
| **productVariants** | listAll, listByProduct, listByProductActive, listAdminWithOffset, countAdmin, listAdminIds, getById, getBySku | create, update, remove, reorder |

**Phase 1: COMPLETED** ✅

---

## Phase 2 Detailed Plan - System Config

### 2.1 Cập nhật `products.config.ts`

Thêm settings mới cho Variants:

```typescript
settings: [
  // ... existing settings
  
  // NEW: Variant Settings Group
  { 
    key: 'variantEnabled', 
    label: 'Bật tính năng phiên bản', 
    type: 'boolean', 
    default: false,
    group: 'variants'
  },
  { 
    key: 'variantPricing', 
    label: 'Giá theo', 
    type: 'select', 
    default: 'variant',
    options: [
      { value: 'product', label: 'Sản phẩm (giá chung)' },
      { value: 'variant', label: 'Phiên bản (giá riêng)' },
    ],
    group: 'variants',
    dependsOn: 'variantEnabled'
  },
  { 
    key: 'variantStock', 
    label: 'Tồn kho theo', 
    type: 'select', 
    default: 'variant',
    options: [
      { value: 'product', label: 'Sản phẩm (tồn chung)' },
      { value: 'variant', label: 'Phiên bản (tồn riêng)' },
    ],
    group: 'variants',
    dependsOn: 'variantEnabled'
  },
  { 
    key: 'variantImages', 
    label: 'Ảnh phiên bản', 
    type: 'select', 
    default: 'inherit',
    options: [
      { value: 'inherit', label: 'Kế thừa từ sản phẩm' },
      { value: 'override', label: 'Ảnh riêng mỗi phiên bản' },
      { value: 'both', label: 'Cả hai (có thể override)' },
    ],
    group: 'variants',
    dependsOn: 'variantEnabled'
  },
  { 
    key: 'outOfStockDisplay', 
    label: 'Hiển thị hết hàng', 
    type: 'select', 
    default: 'blur',
    options: [
      { value: 'hide', label: 'Ẩn hoàn toàn' },
      { value: 'disable', label: 'Vô hiệu hóa + gạch ngang' },
      { value: 'blur', label: 'Mờ đi + Badge "Hết hàng"' },
    ],
    group: 'variants',
    dependsOn: 'variantEnabled'
  },
  { 
    key: 'imageChangeAnimation', 
    label: 'Hiệu ứng đổi ảnh', 
    type: 'select', 
    default: 'fade',
    options: [
      { value: 'none', label: 'Không có' },
      { value: 'fade', label: 'Fade (mờ dần)' },
      { value: 'slide', label: 'Slide (trượt)' },
    ],
    group: 'variants',
    dependsOn: 'variantEnabled'
  },
],

// NEW: Setting groups
settingGroups: [
  { key: 'general', label: 'Cài đặt chung' },
  { key: 'variants', label: 'Phiên bản sản phẩm', icon: Layers },
],
```

### 2.2 Cập nhật UI System Page

Sửa `/app/system/modules/products/page.tsx` hoặc component:

- Thêm section "Phiên bản sản phẩm" riêng
- Toggle chính `variantEnabled` để bật/tắt toàn bộ section
- Các settings phụ ẩn khi `variantEnabled = false`
- Preview UI cho từng display type (color swatch, buttons,...)

### 2.3 Seed Preset Option Types

Tạo mutation `seedPresetOptions` trong `productOptions.ts`:

```typescript
// Preset options to seed
const PRESET_OPTIONS = [
  // Physical
  { name: 'Màu sắc', slug: 'color', displayType: 'color_swatch', isPreset: true },
  { name: 'Kích thước', slug: 'size', displayType: 'buttons', isPreset: true },
  { name: 'Chất liệu', slug: 'material', displayType: 'dropdown', isPreset: true },
  { name: 'Khối lượng', slug: 'weight', displayType: 'number_input', unit: 'kg', isPreset: true },
  { name: 'Dung tích', slug: 'volume', displayType: 'number_input', unit: 'ml', isPreset: true },
  { name: 'Đóng gói', slug: 'packaging', displayType: 'buttons', isPreset: true },
  { name: 'Số lượng', slug: 'bundle', displayType: 'buttons', isPreset: true },
  
  // Digital
  { name: 'Thời hạn', slug: 'duration', displayType: 'radio', showPriceCompare: true, compareUnit: 'tháng', isPreset: true },
  { name: 'Loại license', slug: 'license', displayType: 'radio', isPreset: true },
  { name: 'Số người dùng', slug: 'users', displayType: 'number_input', isPreset: true },
];
```

### 2.4 Files cần tạo/sửa

| File | Action | Mô tả |
|------|--------|-------|
| `lib/modules/configs/products.config.ts` | UPDATE | Thêm variant settings |
| `lib/modules/define-module.ts` | UPDATE | Hỗ trợ settingGroups, dependsOn |
| `components/modules/ModuleConfigPage.tsx` | UPDATE | Render grouped settings |
| `components/modules/products/VariantSettingsSection.tsx` | CREATE | UI cho variant settings |
| `convex/productOptions.ts` | UPDATE | Thêm seedPresetOptions mutation |
| `convex/seeders/productOptions.seeder.ts` | CREATE | Seed preset options |

### 2.5 Tasks breakdown

| # | Task | Est. |
|---|------|------|
| 1 | Cập nhật `define-module.ts` - thêm settingGroups, dependsOn | 30m |
| 2 | Cập nhật `products.config.ts` - thêm variant settings | 30m |
| 3 | Cập nhật `ModuleConfigPage.tsx` - render grouped settings | 1h |
| 4 | Tạo `VariantSettingsSection.tsx` - UI preview | 1h |
| 5 | Thêm `seedPresetOptions` mutation | 30m |
| 6 | Tạo `productOptions.seeder.ts` | 30m |
| 7 | Test + commit | 30m |

**Tổng Phase 2: ~4-5 giờ**

---

Bạn muốn tôi bắt đầu Phase 2 không?