## Phase 2 Review - System Config

### Checklist hoàn thành

| Task | Status | Files |
|------|--------|-------|
| Cập nhật `define-module.ts` - settingGroups, dependsOn | ✅ | `lib/modules/define-module.ts` |
| Cập nhật `products.config.ts` - variant settings | ✅ | `lib/modules/configs/products.config.ts` |
| Cập nhật `ModuleConfigPage.tsx` - grouped settings UI | ✅ | `components/modules/ModuleConfigPage.tsx` |
| Tạo `VariantSettingsSection.tsx` - preview UI | ✅ | `components/modules/products/VariantSettingsSection.tsx` |
| Thêm `seedPresetOptions` mutation | ✅ | `convex/productOptions.ts` |
| Tạo `productOptions.seeder.ts` | ✅ | `convex/seeders/productOptions.seeder.ts` |
| Tích hợp vào `seedProductsModule` | ✅ | `convex/seed.ts` |
| Commit changes | ✅ | `a7132cf feat: add product variant settings config` |

### Settings đã thêm (group: variants)

- `variantEnabled` (toggle) - master switch
- `variantPricing` (select: product/variant)
- `variantStock` (select: product/variant)  
- `variantImages` (select: inherit/override/both)
- `outOfStockDisplay` (select: hide/disable/blur)
- `imageChangeAnimation` (select: none/fade/slide)

### Preset Options (10 loại)

Color, Size, Material, Weight, Volume, Packaging, Bundle, Duration, License, Users

**Phase 2: COMPLETED** ✅

---

## Phase 3 Plan - Admin Option Management

Theo spec, Phase 3 bao gồm 3 tasks:

### 3.1 `/admin/product-options` - List Page

**Route:** `app/admin/product-options/page.tsx`

**UI Components:**
- DataTable với columns: Tên, Slug, Display Type, Unit, Preset, Active, Actions
- Search + Filter (active/all, preset/custom)
- Sort by order (drag reorder)
- Bulk actions: toggle active, delete

**Convex queries sử dụng:**
- `productOptions.listAdminWithOffset`
- `productOptions.countAdmin`

### 3.2 `/admin/product-options/create` & `/admin/product-options/[id]/edit`

**Form fields:**
- `name` (text, required)
- `slug` (auto-gen from name)
- `displayType` (select: dropdown/buttons/radio/color_swatch/image_swatch/color_picker/number_input/text_input)
- `inputType` (conditional: text/number/color)
- `unit` (text, optional - cho number_input)
- `showPriceCompare` (toggle - cho duration)
- `compareUnit` (text - "tháng")
- `active` (toggle)

**Convex mutations:**
- `productOptions.create`
- `productOptions.update`

### 3.3 `/admin/product-options/[id]/values` - Manage Values

**Route:** `app/admin/product-options/[id]/values/page.tsx`

**UI Components:**
- Header với option name + back button
- DataTable với columns: Value, Label, Color/Image, Badge, Order, Active
- Inline edit support
- Drag reorder
- Quick add form

**Form fields cho value:**
- `value` (text, required)
- `label` (text, optional - display label)
- `colorCode` (color picker - cho color_swatch)
- `image` (image upload - cho image_swatch)
- `numericValue` (number - cho duration tính giá/tháng)
- `isLifetime` (toggle - cho "Vĩnh viễn")
- `badge` (text - "Best Value", "Phổ biến")
- `active` (toggle)

**Convex queries/mutations:**
- `productOptionValues.listByOption`
- `productOptionValues.create`
- `productOptionValues.update`
- `productOptionValues.remove`
- `productOptionValues.reorder`

### Files cần tạo

| File | Mô tả |
|------|-------|
| `app/admin/product-options/page.tsx` | List options |
| `app/admin/product-options/create/page.tsx` | Create option |
| `app/admin/product-options/[id]/edit/page.tsx` | Edit option |
| `app/admin/product-options/[id]/values/page.tsx` | Manage values |
| `components/admin/product-options/OptionForm.tsx` | Shared form |
| `components/admin/product-options/ValueForm.tsx` | Value inline form |
| `components/admin/product-options/DisplayTypePreview.tsx` | Preview display |

### Sidebar Navigation

Thêm link "Loại tùy chọn" vào sidebar dưới "Sản phẩm" (khi variantEnabled = true)

---

### Tasks breakdown Phase 3

| # | Task | Est. |
|---|------|------|
| 1 | Tạo `/admin/product-options/page.tsx` - list với search/filter/sort | 1.5h |
| 2 | Tạo `/admin/product-options/create/page.tsx` + OptionForm | 1h |
| 3 | Tạo `/admin/product-options/[id]/edit/page.tsx` | 30m |
| 4 | Tạo `/admin/product-options/[id]/values/page.tsx` + ValueForm | 2h |
| 5 | Thêm sidebar link (conditional) | 30m |
| 6 | Run oxlint + commit | 30m |

**Tổng Phase 3: ~6 giờ**

---

Bạn muốn tôi bắt đầu Phase 3 không?