## Color Review: ProductCategories (6 layouts)

### Component Color Map hiện tại

Theo skill, ProductCategories **chưa có** trong Component Color Map. Sau khi phân tích code:

| Layout | P% | S% | Pattern |
|---|---|---|---|
| Grid | 5 | 95 | secondary: hover shadow, border, product count text, "+N more" |
| Carousel | 0 | 100 | secondary: border, "Xem tat ca" link |
| Cards | 0 | 100 | secondary: bg tint, border, hover, "Xem san pham" link |
| Minimal | 30 | 70 | brandColor: hover bg+border, icon; secondary: default bg+border, "Tat ca" link |
| Marquee | 0 | 100 | secondary: border, shadow, arrow icon |
| Circular | 0 | 100 | secondary: border, bg, hover, pagination dots, "Xem chi tiet" |

**Kết luận: Component thuộc Nhóm B (Secondary-dominant)**, vi phạm Element-Level Color Rules nghiêm trọng.

---

### Issues (theo Checklist)

#### A. Core
1. **❌ Không có `_lib/colors.ts`** - Không dùng OKLCH, không có color helper. Inline `${secondary}XX` hex opacity (e.g. `${secondary}05`, `${secondary}15`...) khắp nơi.
2. **❌ Không dùng APCA** - Text on solid (grid overlay, icon bg) dùng hard-coded `text-white`, không kiểm tra contrast.
3. **❌ Thiếu palette** - Không có solid/surface/hover/active/border/disabled cho cả primary và secondary.

#### B. Distribution (60-30-10)
4. **❌ Secondary chiếm ~95%** ở 4/6 layouts (Carousel, Cards, Marquee, Circular). Vi phạm: "Primary cho CTA/heading/active".
5. **❌ `brandColor` gần như bị bỏ qua** - Chỉ xuất hiện ở:
   - `renderCategoryVisual()` cho icon bg (`backgroundColor: brandColor`) - đúng
   - Minimal layout hover state - nhưng không nhất quán
6. **⚠️ Product count text** dùng `secondary` trên dark overlay (Grid) - có thể fail APCA.
7. **⚠️ Placeholder** (empty state): icon + bg dùng `secondary` thay vì neutral bg + primary icon.

#### C. Accent Prominence
8. **❌ Secondary không có element đủ lớn** ở một số layout - chỉ dùng cho border opacity thấp (15-20%), text nhỏ.
9. **❌ Chưa áp Accent Prominence rules** - Không có phân tích accent tier.

#### D. Single Source of Truth
10. **❌ Preview vs Site KHÔNG dùng chung helper** - Preview inline colors, Site inline colors riêng. Khác nhau về chi tiết:
    - Preview Grid: dùng `border: 1px solid rgb(226 232 240)`, hover `borderColor: secondary`
    - Site Grid: dùng `boxShadow: ${secondary}10`, hover `boxShadow: ${secondary}25`
    - Preview Minimal hover: `brandColor` bg+border; Site Minimal hover: `secondary` bg+border (BUG!)
    - Site có thêm style `showcase` mà Preview không có

#### E. Anti AI-Styling
11. **⚠️ `group-hover:scale-110`** trên images (Grid, renderCategoryVisual) - vi phạm "NO group-hover:scale-105 trên text/numbers" (scale-110 trên image thì OK, nhưng quá lớn)
12. **⚠️ `translateY(-4px)` hover** trên Grid cards - mobile không có hover
13. **⚠️ Marquee animation** (20s linear infinite) - OK nhưng fade gradient dùng `from-white` sẽ fail trên dark mode
14. **⚠️ Circular drag-to-scroll** nhiều state phức tạp - OK functionally nhưng code bloat

---

### Accent Analysis (Grid layout - content state)

| # | Element | Tier | Area Est. | Interactive? | Assigned Color | Hiện tại | Đúng theo Rule |
|---|---------|------|-----------|-------------|----------------|----------|----------------|
| 1 | Card hover shadow/border | M | ~5% | yes | secondary | secondary ✓ | ✓ |
| 2 | Product count text | S | ~1% | no | secondary | secondary | secondary ✓ |
| 3 | "+N more" card | L | ~10% | yes | secondary | secondary | **primary** (CTA-like) |
| 4 | Icon container bg | L | ~8% | no | primary | brandColor ✓ | ✓ |
| Total: 4 accents | | | | | Apply Rule: Standard (70/30) | | |

**Kết luận**: "+N more" card nên dùng `brandColor` vì là CTA-like action.

---

### Fix Plan

#### Bước 1: Tạo `_lib/colors.ts`
- File: `app/admin/home-components/product-categories/_lib/colors.ts`
- Tạo `getProductCategoriesColors(brandColor, secondary)` trả về palette chuẩn dùng OKLCH + APCA
- Palette items cần:
  - `cardBorder`, `cardBorderHover`, `cardShadow`, `cardShadowHover`
  - `sectionBg` (cards layout)
  - `linkText` (secondary - "Xem tat ca", "Xem san pham")
  - `productCountText` (secondary)
  - `ctaMoreBg`, `ctaMoreText`, `ctaMoreBorder` ("+N more" card - dùng **brandColor**)
  - `iconContainerBg` (brandColor)
  - `textOnOverlay` (APCA check)
  - `paginationDotActive` (secondary), `paginationDotInactive`
  - `pillBg`, `pillBorder` (minimal/marquee)
  - `circularBorder`, `circularBg`
  - `emptyStateIconBg`, `emptyStateIcon` (neutral bg + primary icon)
  - `arrowIcon` (brandColor - theo Element-Level: "Navigation arrows = brandColor")

#### Bước 2: Sửa phân phối màu theo Element-Level Color Rules
Áp dụng cho cả **Preview** và **Site Render**:

| Element | Hiện tại | Sửa thành | Rule |
|---|---|---|---|
| Card hover border/shadow | secondary | secondary ✓ | Card borders = secondary |
| "Xem tat ca"/"Tat ca" link | secondary | secondary ✓ | Section label = secondary |
| "Xem san pham" link | secondary | secondary ✓ | OK |
| Product count text | secondary | secondary ✓ | Data highlight = secondary |
| "+N more" card text/icon | secondary | **brandColor** | CTA action = primary |
| Icon container bg | brandColor | brandColor ✓ | Icon container bg = brandColor (10%) |
| Marquee ArrowUpRight icon | secondary | **brandColor** | Navigation arrows = brandColor |
| Empty state icon | secondary | **brandColor** (icon) + neutral bg | Placeholder: neutral bg + primary icon |
| Circular pagination dot active | secondary | secondary ✓ | Pagination active dot = secondary |
| Minimal hover state | Preview: brandColor, Site: secondary | **brandColor** | Active/selected state = brandColor |
| Section bg tint (Cards) | `${secondary}05` | neutral hoặc OKLCH tint | Neutral chiếm nền |

#### Bước 3: Sync Preview ≡ Site Render
- Cả 2 import cùng helper từ `_lib/colors.ts`
- Fix bug Minimal layout: hover state khác nhau giữa Preview và Site
- Thêm style `showcase` vào Preview (hoặc xóa khỏi Site nếu không cần)

#### Bước 4: Fix Anti AI-Styling
- Giảm `scale-110` → `scale-105` trên images
- Bỏ `translateY(-4px)` hover (mobile-first, không hover effect phức tạp)
- Thêm dark mode cho Marquee fade gradient (`from-white dark:from-slate-900` - **Preview đã có**, Site chưa có)
- Empty state: đổi `${secondary}10` bg → neutral `#f1f5f9`

#### Bước 5: TypeScript check + commit
- `bunx tsc --noEmit`
- Commit changes
