
## Color Review: ProductCategories - Hiện trạng

### Đã OK (từ commits trước)
- `_lib/colors.ts` dùng OKLCH + APCA hoàn chỉnh ✅
- Preview + Site cùng dùng `getProductCategoriesColors()` ✅
- 6 headings h2 đều có `style={{ color: colors.primary.solid }}` ✅
- Element-Level Color Rules cho iconContainerBg, arrowIcon, cardBorder, etc. ✅
- Placeholder state dùng neutral bg + primary icon ✅

### Issues còn lại cần fix

| # | Severity | Issue | File |
|---|----------|-------|------|
| 1 | **❌ Critical** | Site Grid thiếu gradient overlay `from-black/70 via-black/40` cho text readability (Preview có) | ComponentRenderer.tsx |
| 2 | **⚠️ Medium** | Preview Grid có `+N more` card nhưng không có ở Site render | ComponentRenderer.tsx |
| 3 | **⚠️ Medium** | Site Carousel thiếu `aria-label` trên navigation arrows | ComponentRenderer.tsx |
| 4 | **⚠️ Medium** | Preview Circular có pagination dots + drag-to-scroll, Site Circular thiếu pagination dots | ComponentRenderer.tsx |
| 5 | **⚠️ Medium** | Preview Circular có hover "Xem chi tiết" text animation, Site thiếu | ComponentRenderer.tsx |
| 6 | **ℹ️ Minor** | Site Grid overlay text dùng `opacity-80` trên productCount thay vì style color trực tiếp | ComponentRenderer.tsx |

### Fix Plan (3 files)

#### File 1: `components/site/ComponentRenderer.tsx` - ProductCategoriesSection

**1. Grid - Thêm gradient overlay (sync với Preview)**
```tsx
// TRƯỚC: text overlay trực tiếp trên ảnh, không có gradient
<div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">

// SAU: thêm gradient overlay như Preview
<div
  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"
  style={{ height: '60%' }}
/>
<div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 z-10">
```

**2. Grid - Fix opacity-80 → dùng color helper**
```tsx
// TRƯỚC
<p className="text-xs opacity-80 mt-0.5" style={{ color: colors.productCountText }}>

// SAU - bỏ opacity-80, productCountText đã đủ contrast
<p className="text-xs mt-0.5" style={{ color: colors.productCountText }}>
```

**3. Carousel - Thêm aria-label cho navigation arrows**
```tsx
<button aria-label="Cuộn trước" ...>
<button aria-label="Cuộn sau" ...>
```

**4. Circular - Thêm pagination dots (giống Preview)**
- Thêm state `scrollPosition` + logic `handleScroll`
- Thêm 3 pagination dots ở dưới khi `resolvedCategories.length > 3`
- Dots dùng `colors.paginationDotActive` / `colors.paginationDotInactive`

**5. Circular - Thêm hover "Xem chi tiết" text (giống Preview)**
- Thêm hover text overlay chuyển đổi với `productCount` text

#### File 2: `app/admin/home-components/product-categories/_components/ProductCategoriesPreview.tsx`
- Không cần thay đổi - Preview đã đạt chuẩn

#### File 3: `app/admin/home-components/product-categories/_lib/colors.ts`
- Không cần thay đổi - colors helper đã đạt chuẩn

### Checklist sau khi fix

- [x] OKLCH only ✅ (đã OK)
- [x] APCA cho text/UI ✅ (đã OK)
- [x] Heading h2 dùng brandColor ✅ (đã OK)
- [x] Primary >= 25% visual weight ✅ (heading + CTA + icon)
- [ ] **Grid gradient overlay** → fix #1
- [ ] **Carousel aria-label** → fix #3
- [ ] **Circular pagination dots** → fix #4
- [ ] **Circular hover text** → fix #5
- [ ] Single Source of Truth (Preview ≡ Site) → fix #1, #4, #5
- [x] Anti AI-Styling ✅
- [x] Placeholder neutral ✅

### Scope
- Chỉ sửa `ComponentRenderer.tsx` (site render) để sync với Preview
- Không sửa Preview hay colors helper (đã chuẩn)
- Chạy `bunx tsc --noEmit` rồi commit
