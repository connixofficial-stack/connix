## Problem Graph (DARE Framework)

```
1. [Main] Account Experiences thiếu tính năng so với experiences khác
   |
   ├── 1.1 [ROOT CAUSE] Thiếu Layout Tabs (multi-layout selection)
   |   └── account-orders: Chỉ có 1 layout cố định
   |   └── account-profile: Chỉ có 1 layout cố định
   |   └── So sánh: cart, wishlist, checkout, search có 3+ layouts
   |
   ├── 1.2 [ROOT CAUSE] Thiếu ExampleLinks component
   |   └── Không có link xem thử trang thực tế
   |   └── So sánh: posts-list, products-list, wishlist, checkout có ExampleLinks
   |
   ├── 1.3 [ROOT CAUSE] Thiếu ModuleFeatureStatus component
   |   └── Không hiển thị trạng thái features từ module (như enableNote, enableExpiry)
   |   └── So sánh: cart, wishlist, checkout, search có ModuleFeatureStatus
   |
   ├── 1.4 [Sub] Account-Profile Preview không nhận device prop
   |   └── Preview không responsive theo device selection
   |   └── So sánh: AccountOrdersPreview có device prop
   |
   ├── 1.5 [Sub] Cấu trúc config đơn giản, thiếu layouts per layout-style
   |   └── Không có nested layouts config như các experience phức tạp
   |   └── So sánh: cart/wishlist/checkout có layouts: { drawer: {...}, page: {...} }
   |
   ├── 1.6 [Sub] Thiếu Card "Module & liên kết" riêng
   |   └── Module links và hints gộp chung 1 Card
   |   └── So sánh: posts-list, products-list có Card "Module & liên kết" tách biệt
   |
   └── 1.7 [Sub] Thiếu brandColor từ settings
       └── Hardcode brandColor thay vì đọc từ site_brand_color
       └── So sánh: posts-list, products-list, search đọc brandColor từ settings
```

## Chi tiết thiếu sót

### 1. account-orders (8 toggle options, 1 layout)
**Thiếu:**
- LayoutTabs để chọn layout style (grid/list/accordion)
- ExampleLinks (link xem `/account/orders`)
- ModuleFeatureStatus cho features của orders module
- brandColor từ `site_brand_color` setting (đang hardcode #4f46e5)
- Card "Module & liên kết" tách riêng

**Có đủ:**
- Device toggle ✓
- Preview component có device prop ✓
- Module links (orders, customers) ✓
- HintCard ✓
- Save/hasChanges logic ✓

### 2. account-profile (3 toggle options, 1 layout)
**Thiếu:**
- LayoutTabs để chọn layout style
- ExampleLinks (link xem `/account/profile`)
- ModuleFeatureStatus cho features của customers module
- brandColor từ settings (đang hardcode #14b8a6)
- Card "Module & liên kết" tách riêng
- **Preview không nhận device prop** (thiếu responsive preview)

**Có đủ:**
- Device toggle ✓
- Module link (customers) ✓
- HintCard ✓
- Save/hasChanges logic ✓

## Execution Plan (nếu muốn fix)

1. **Thêm LayoutTabs cho account-orders** (3 layouts: accordion, grid, list)
2. **Thêm LayoutTabs cho account-profile** (2-3 layouts: card, sidebar, compact)
3. **Thêm ExampleLinks** cho cả 2 experiences
4. **Thêm ModuleFeatureStatus** hiển thị features từ module
5. **Fix AccountProfilePreview** nhận device prop
6. **Đọc brandColor từ settings** thay vì hardcode
7. **Tách Card "Module & liên kết"** ra riêng như các experience khác

Bạn có muốn tôi implement các fix này không?