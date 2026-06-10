## Phase 5 & 6: Remaining Implementation Plan

### Phase 5: Integration (4 tasks)

#### 5.1 Update `convex/cart.ts`
- Thêm `variantId` (optional) vào cartItems schema
- Khi add to cart: nếu product `hasVariants`, bắt buộc chọn variant
- Lấy price từ variant nếu `variantPricing = variant`
- Validate variant tồn tại và thuộc product

#### 5.2 Update `convex/orders.ts`
- Thêm `variantId` và `variantTitle` vào order items
- `variantTitle` = "Đỏ / M / 1 năm" (summary các option values)
- Stock deduction từ variant nếu `variantStock = variant`

#### 5.3 Update `convex/wishlist.ts`
- Thêm `variantId` (optional)
- Khi add to wishlist có thể chọn variant cụ thể hoặc không

#### 5.4 Update seed data
- Thêm sample variants cho products mẫu (nếu đã có products seed)

---

### Phase 6: Frontend Experience (5 tasks)

#### 6.1 Variant Selector Component
- `components/products/VariantSelector.tsx`
- Props: options, values, selectedValues, onSelect, outOfStockDisplay
- Render đúng display type (swatch/buttons/radio/dropdown/input)

#### 6.2 Display Type Components
- `ColorSwatch`: circle swatches với selected state, border ring
- `ButtonsPills`: chip buttons, có thể disable nếu out of stock
- `RadioList`: radio với price compare (cho Duration)
- `Dropdown`: select dropdown
- `NumberInput`, `TextInput`: input fields cho custom value

#### 6.3 Product Detail Experience Config
- Thêm `showVariants` vào config mỗi layout (classic/modern/minimal)
- Thêm vào `/system/experiences/product-detail` page
- Update preview component hiển thị variant selector

#### 6.4 Frontend Product Detail Page
- Update `/products/[slug]` page
- Hiển thị variant selector khi product hasVariants
- Price/stock update theo variant selected
- Image change animation khi chọn variant có ảnh riêng

#### 6.5 Cart/Checkout Variant Display
- Hiển thị variant title trong cart items
- Checkout confirmation với variant info
- Update cart page UI

---

### Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| Phase 5: Integration | 4 | 1-2 ngày |
| Phase 6: Frontend | 5 | 2-3 ngày |
| **Total** | **9** | **3-5 ngày** |

Bắt đầu Phase 5 (Integration)?