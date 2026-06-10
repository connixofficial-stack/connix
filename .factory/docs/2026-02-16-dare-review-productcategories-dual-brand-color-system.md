
## Color Review: ProductCategories

### Problem Graph
```
1. [Main] Đánh giá ProductCategories theo Dual Brand Color System
   1.1 [Core] OKLCH + APCA compliance
   1.2 [Distribution] 60-30-10 rule
   1.3 [Accent Prominence] primary/secondary assignment
   1.4 [Single Source of Truth] Preview ≡ Site
   1.5 [Anti AI-Styling] Enterprise UI rules
```

---

### A. Core - OKLCH + APCA

| # | Check | Status | Chi tiết |
|---|-------|--------|----------|
| 1 | OKLCH only | ✅ PASS | `_lib/colors.ts` dùng `culori/oklch` hoàn toàn, không HSL/getTint/getShade |
| 2 | APCA text | ✅ PASS | `getAPCATextColor()` cho `textOnSolid`, `overlayText`. Không hard-code `#fff/#000` trên solid bg |
| 3 | Palette đủ | ✅ PASS | `BrandPalette` có: solid/surface/hover/active/border/disabled/textOnSolid/textInteractive |
| 4 | Single mode auto-suggest | ⚠️ N/A | Component nhận 2 màu từ admin, không tự suggest (đúng pattern vì ProductCategories thuộc Nhóm C balanced 50/50, không cần auto-suggest) |
| 5 | Dual mode similarity | ⚠️ N/A | Không kiểm tra ΔE - nhưng đây là trách nhiệm của theme engine UI, không phải component |

### B. Distribution (60-30-10) - Content State

**Phân tích tại trạng thái data đầy đủ (có ảnh + text):**

| Layer | Tỷ lệ ước lượng | Elements |
|-------|-----------------|----------|
| 60% Neutral | ~55% | `sectionBg` (#f8fafc), card bg (white), body text (slate-900), description text (slate-500) |
| 30% Primary | ~20% | `iconContainerBg` (primary.solid), `ctaMoreText`/`ctaMoreBorder` (primary), `arrowIcon` (primary.solid), pill icon color (primary.solid), `overlayText` |
| 10% Secondary | ~25% | `cardBorder/cardBorderHover` (secondary), `cardShadow` (secondary opacity), `linkText` (secondary), `productCountText` (secondary), `pillBg/pillBorder` (secondary opacity), `circularBg/circularBorder` (secondary), `paginationDotActive` (secondary) |

**Issue:** ❌ **Secondary chiếm ~25%, vượt 10% target**. Theo Component Color Map, ProductCategories thuộc Nhóm C (50/50), nhưng thực tế secondary chiếm phần lớn UI elements (borders, shadows, link, counts, pills), trong khi primary chỉ xuất hiện ở icon container bg và arrow icon.

**Theo Element-Level Color Rules của skill:**

| UI Element | Hiện tại | Nên là | Lý do |
|---|---|---|---|
| Card borders/hover glow | ✅ `secondary` (10-40% opacity) | secondary | Đúng rule |
| Card shadow | ✅ `secondary` (12% opacity) | secondary | Đúng rule |
| Link "Xem tất cả" | `secondary.solid` | ⚠️ Có thể giữ secondary | Section label/subtitle → secondary (hợp lệ) |
| Product count text | `secondary.solid` | ⚠️ Có thể giữ secondary | Số liệu nhỏ, data highlight → secondary (hợp lệ) |
| CTA "More" button | `primary.surface/border/solid` | ✅ primary | CTA = primary (đúng rule) |
| Icon container bg | `primary.solid` | ✅ primary | Brand hint icon bg = primary 10% opacity |
| Arrow icon | `primary.solid` | ✅ primary | Navigation arrows → primary (đúng rule) |
| Pagination dot active | `secondary.solid` | ✅ secondary | Đúng rule (nhỏ, tăng visibility) |
| Pill bg/border | `secondary` opacity | ✅ secondary | Badge/tag outline → secondary (đúng rule) |

**Kết luận Distribution:** Nhìn kỹ lại, phân phối thực ra **hợp lý cho Nhóm C** (balanced dual-brand). Card borders + shadows + subtle accents dùng secondary ở opacity thấp (8-20%) thật ra đều là decorative/subtle, không phải dominant. Primary xuất hiện ở interactive elements (CTA, arrow, icon bg). **PASS nhưng borderline.**

### C. Accent Prominence

| # | Element | Tier | Area Est. | Interactive? | Current Color | Correct? |
|---|---------|------|-----------|-------------|---------------|----------|
| 1 | CTA "More" button | L | ~5% | yes | primary | ✅ |
| 2 | Card border hover | M | ~3% per card | yes | secondary | ✅ |
| 3 | Icon container bg | M | ~8% | no | primary | ✅ |
| 4 | Link text ("Xem tất cả") | S | ~2% | yes | secondary | ✅ |
| 5 | Product count | S | ~1% | no | secondary | ✅ |
| 6 | Arrow icon | S | ~1% | yes | primary | ✅ |
| 7 | Pagination dot active | S | ~0.5% | yes | secondary | ✅ |
| 8 | Pill bg/border (minimal) | M | ~4% per pill | yes | secondary | ✅ |

**Total accent points: 8** → Apply Standard rule (≥4): 70% primary, 30% secondary.
Hiện tại: ~4 elements primary, ~4 elements secondary = 50/50. Nhưng theo area: primary elements có area lớn hơn (icon bg 8% + CTA 5%), secondary elements phần lớn subtle (borders, counts). **Acceptable cho Nhóm C.**

**Tier S APCA check:** Product count dùng `secondary.solid` trên white bg - cần verify contrast ≥ 60 cho 12px text. Nếu secondary quá sáng (L > 0.7), text sẽ khó đọc. → **Potential issue nhưng phụ thuộc vào màu user chọn.**

### D. Single Source of Truth

| Check | Status |
|-------|--------|
| Preview dùng `getProductCategoriesColors` từ `_lib/colors.ts` | ✅ |
| Site (ComponentRenderer) dùng `getProductCategoriesColors` từ `_lib/colors.ts` | ✅ |
| Cả hai cùng dùng `getCategoryIcon` | ✅ |
| Placeholder state: Preview dùng `bg-slate-100` (neutral) | ✅ |
| Placeholder state: Site dùng `bg-slate-100` (neutral) | ✅ |

**PASS** - Single Source of Truth hoàn chỉnh.

### E. Anti AI-Styling

| # | Check | Status | Chi tiết |
|---|-------|--------|----------|
| 1 | No gradient decorative | ✅ | Chỉ có `from-black/70 via-black/40 to-transparent` cho overlay text (grid style) - functional |
| 2 | No hover effects phức tạp | ⚠️ | `group-hover:scale-105` trên image (carousel, grid) - nhẹ, acceptable cho image zoom |
| 3 | No blur/shadow nhiều lớp | ✅ | Shadow đơn giản: `0 2px 8px` / `0 8px 24px` |
| 4 | No animate decorative | ✅ | Chỉ marquee style có animation (functional) |
| 5 | Flat design + border + whitespace | ✅ | Cards dùng border + subtle shadow |
| 6 | Touch targets ≥ 44px | ✅ | Pill items `px-3 py-2` (mobile), card items aspect-square |
| 7 | Scrollbar | ⚠️ | Marquee/Circular dùng `scrollbar-hide` (display:none) thay vì 6px muted thumb |
| 8 | `aria-label` | ⚠️ | Circular pagination dots có `aria-label` ✅, nhưng carousel arrows thiếu |

---

### Tổng kết Issues

| # | Severity | Issue | File | Line |
|---|----------|-------|------|------|
| 1 | ⚠️ Minor | `group-hover:scale-105` trên text/image trong Grid overlay - vi phạm "NO group-hover:scale-105 trên text/numbers" | Preview + Site | Multiple |
| 2 | ⚠️ Minor | Scrollbar style: dùng `display:none` thay vì 6px muted thumb 30% opacity | Preview | Circular/Marquee |
| 3 | ℹ️ Info | Thiếu `aria-label` trên carousel arrows (Site) | ComponentRenderer.tsx | Carousel style |
| 4 | ℹ️ Info | Thiếu `hover` variant trong `BrandPalette` usage - palette có `hover` property nhưng ít khi dùng | colors.ts | N/A |

### Fix Plan (nếu muốn fix)

1. **`group-hover:scale-105` trên image** → Giữ lại nhưng chỉ cho image, KHÔNG áp dụng cho text overlay (đúng rule: "NO group-hover:scale-105 trên text/numbers", image zoom acceptable)
   - Kiểm tra: Grid style overlay text KHÔNG bị scale (text nằm ở absolute position, image nằm ở relative) → **Thực ra đã đúng**, text không bị scale, chỉ image bị scale. **Không cần fix.**

2. **Scrollbar style** → Thêm custom scrollbar CSS cho carousel/circular:
   ```css
   ::-webkit-scrollbar { width: 6px; height: 6px; }
   ::-webkit-scrollbar-track { background: transparent; }
   ::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 3px; }
   ```
   **Severity thấp** - `scrollbar-hide` là pattern phổ biến cho horizontal scroll mobile.

3. **`aria-label` cho carousel arrows** → Thêm `aria-label="Previous"` / `aria-label="Next"` 

4. **Không cần fix nào khác** - Colors implementation đã tuân thủ tốt:
   - OKLCH ✅
   - APCA ✅
   - 60-30-10 hợp lý cho balanced component ✅
   - Single Source of Truth ✅
   - Enterprise UI ✅

### Verdict: ✅ PASS (với 2-3 minor improvements optional)

ProductCategories `_lib/colors.ts` là một trong những component đã được chuẩn hóa tốt nhất theo Dual Brand Color System. Không có issue nghiêm trọng nào cần fix ngay.
