## Phân tích Design Reference

Folder `luxury-wishlist-ui` có giao diện **luxury, hiện đại** với:

### Desktop: Data Table Layout
- Header: Search + Sort select + Bulk delete button
- Table với columns: Checkbox | Sản phẩm (ảnh + tên + category) | Giá | Trạng thái (Badge) | Đánh giá | Actions (xóa + thêm giỏ)
- Row hover effect, selected state highlight
- Checkbox để multi-select và bulk actions

### Mobile: Stacked Card Layout  
- Compact horizontal card: Ảnh trái + Content phải
- Category badge, tên, rating, giá, actions
- Discount percentage badge trên ảnh

---

## Kế hoạch Refactor

### 1. Xóa layout Masonry
- `app/system/experiences/wishlist/page.tsx`: Xóa `'masonry'` khỏi type và LAYOUT_STYLES
- `components/experiences/previews/WishlistPreview.tsx`: Xóa masonry preview
- `lib/experiences/useSiteConfig.ts`: Xóa `'masonry'` khỏi WishlistConfig type
- `app/(site)/wishlist/page.tsx`: Xóa masonry logic

### 2. Thêm layout Table (thay thế Masonry)
**Type:** `'grid' | 'list' | 'table'`

**Table Layout features:**
- Desktop: Full data table với columns như reference
- Mobile: Fallback về compact card (giống ProductCard reference)
- Checkbox multi-select (optional, nếu user muốn)
- Search + Sort controls
- Badge trạng thái: "Sẵn hàng" (green) / "Hết hàng" (gray)

### 3. Files cần thay đổi

| File | Thay đổi |
|------|----------|
| `app/system/experiences/wishlist/page.tsx` | Đổi `masonry` → `table` |
| `components/experiences/previews/WishlistPreview.tsx` | Refactor masonry → table preview |
| `lib/experiences/useSiteConfig.ts` | Đổi type `masonry` → `table` |
| `app/(site)/wishlist/page.tsx` | Implement table layout thực tế |

### 4. Preview sẽ như thế nào

**Table Layout Preview (Desktop):**
```
┌─────────────────────────────────────────────────────────┐
│ ☐ │ [IMG] Sản phẩm      │ Giá       │ TT    │ Actions  │
├─────────────────────────────────────────────────────────┤
│ ☐ │ [🖼] iPhone 15 Pro   │ 34.990.000│ ✓ Còn │ 🗑 🛒    │
│ ☐ │ [🖼] MacBook Pro     │ 52.990.000│ ✓ Còn │ 🗑 🛒    │
│ ☐ │ [🖼] AirPods Pro     │  6.490.000│ ✗ Hết │ 🗑 🛒    │
└─────────────────────────────────────────────────────────┘
```

**Table Layout Preview (Mobile):**
```
┌─────────────────────────────┐
│ [🖼] iPhone 15 Pro Max      │
│      Điện thoại • ⭐ 4.8    │
│      34.990.000đ    🗑 🛒   │
└─────────────────────────────┘
```

### 5. Giữ nguyên
- Grid layout hiện tại
- List layout hiện tại
- Tất cả toggles (note, notification, add to cart)
- Module dependencies