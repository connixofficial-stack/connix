
## Problem Graph

```
1. [Main] Hero 6 layouts color compliance <- depends on 1.1, 1.2, 1.3
   1.1 [Color Space & Contrast] <- depends on 1.1.1, 1.1.2
      1.1.1 [ROOT CAUSE] OKLCH vs HSL usage
      1.1.2 [ROOT CAUSE] APCA vs hard-coded text
   1.2 [60-30-10 & Accent Distribution] <- depends on 1.2.1, 1.2.2
      1.2.1 [ROOT CAUSE] Placeholder dùng neutral hay primary tint?
      1.2.2 [ROOT CAUSE] Accent Prominence Engine compliance
   1.3 [Dual-Brand Visibility] <- depends on 1.3.1, 1.3.2
      1.3.1 [ROOT CAUSE] Nav arrows two-color indicator (W3C C40)
      1.3.2 [ROOT CAUSE] Pagination dots dual/single mode
```

---

## Execution (with reflection per layout)

### Phân tích chung cho `colors.ts`

| # | Hạng mục | Trạng thái | Chi tiết |
|---|----------|-----------|----------|
| 1 | OKLCH thay HSL | ✅ PASS | `colors.ts` dùng `oklch()` từ culori, `generatePalette()` dùng OKLCH |
| 2 | APCA text color | ✅ PASS | `getAPCATextColor()` dùng `APCAcontrast`, threshold 60/45 đúng chuẩn |
| 3 | Palette completeness | ✅ PASS | `generatePalette()` có solid, surface, hover, active, border, disabled, textOnSolid, textInteractive |
| 4 | Similarity check (ΔE) | ✅ PASS | Dùng `differenceEuclidean('oklch')`, warning ở similarity > 0.9 |
| 5 | Harmony resolution | ✅ PASS | analogous/complementary/triadic đúng chuẩn |

**⚠️ Vấn đề chung `lib/utils/colors.ts`**:
- `getPlaceholder()` dùng `getTint(primary, 0.4)` cho background → **Vi phạm Rule 5**: Placeholder phải dùng neutral (slate-100/200), KHÔNG dùng primary tint.

---

### Layout 1: SLIDER

**Accent Analysis (khi có data đầy đủ):**

| # | Element | Tier | Area | Interactive? | Assigned Color | Đúng/Sai |
|---|---------|------|------|-------------|----------------|----------|
| 1 | Pagination dot active | M | ~2% | yes | primary | ⚠️ |
| 2 | Nav arrow icon | S | <1% | yes | secondary | ⚠️ |
| 3 | Nav arrow border | M | ~2% | no | secondary surface | ⚠️ |
| Total: 3 accents | | | | | Rule: Triple | |

**Đúng:**
- ✅ OKLCH palette cho tất cả color generation
- ✅ APCA cho text (qua `getAPCATextColor`)
- ✅ Placeholder bg = `#f1f5f9` (slate-100) - neutral, đúng chuẩn
- ✅ Placeholder icon = primary solid - đúng
- ✅ Similarity warning hiện khi > 0.9
- ✅ `dotInactive: 'rgba(255, 255, 255, 0.5)'` - neutral, đúng

**Chưa đúng:**
- ❌ **Rule 7 (Pagination dots)**: `dotActive` dùng `primaryPalette.solid` ở cả 2 mode → Dual mode phải dùng **secondary** solid
- ❌ **Rule 8 (Nav arrows W3C C40)**: Chỉ có 1 lớp (bg white + icon secondary). Thiếu **outer ring** (two-color indicator). Cần `box-shadow: 0 0 0 2px <outer>` + logic phân biệt secondary sáng/tối
- ⚠️ **Accent Prominence (3 accents)**: Theo Triple rule: 2 primary + 1 secondary. Hiện tại dot = primary (1), nav icon = secondary (1), nav border = secondary (1) → 1 primary + 2 secondary → **sai tỷ lệ**, cần swap dot sang secondary (vì Rule 7 ưu tiên) và nav arrows theo Rule 8

---

### Layout 2: FADE

**Accent Analysis:**

| # | Element | Tier | Area | Interactive? | Assigned Color | Đúng/Sai |
|---|---------|------|------|-------------|----------------|----------|
| 1 | Thumbnail border active | M | ~3% | yes | dual: secondary / single: primary | ✅ |
| Total: 1 accent | | | | | Rule: Lone | |

**Đúng:**
- ✅ Lone Accent Rule: Thumbnail border dùng primary (single) / secondary (dual) - HỢP LÝ
- ✅ Placeholder bg = `#f1f5f9` - neutral
- ✅ Placeholder icon = primary solid
- ✅ Thumbnail inactive = transparent - neutral

**Chưa đúng:**
- ❌ **Lone Accent Rule (Rule 9 Bước 3)**: Khi chỉ có 1 accent, **luôn dùng primary**, không dùng secondary. Nhưng hiện tại dual mode dùng secondary cho thumbnail border → **Vi phạm Lone Accent Rule**. Secondary chỉ nên dùng khi có >= 2 accents.
- ⚠️ **Dual-Brand Visibility**: Nếu dùng Lone Accent = primary, thì secondary **không xuất hiện ở đâu cả** trong Fade layout → cần thêm element cho secondary (ví dụ: thêm pagination dots, hoặc overlay tint) hoặc chấp nhận fade layout chỉ support single mode tốt nhất.

---

### Layout 3: BENTO

**Accent Analysis:**

| # | Element | Tier | Area | Interactive? | Assigned Color | Đúng/Sai |
|---|---------|------|------|-------------|----------------|----------|
| 1 | Main image ring | L | ~5% | no | secondary tint | ⚠️ |
| 2 | Grid tint backgrounds (placeholder) | XL | ~60% | no | primary tint | ❌ |
| Total: 2 accents (data state) | | | | | Rule: Dual | |

**Đúng:**
- ✅ OKLCH cho tint generation
- ✅ `mainImageRing` dùng secondary tint - hợp lý cho dual mode

**Chưa đúng:**
- ❌ **Rule 5 (Placeholder neutral)**: `gridTint1-4` dùng PRIMARY tint (`getPrimaryTint(0.4/0.35/0.3/0.25)`) cho placeholder background → Phải dùng **neutral** (slate-100/200). Đây là placeholder state (khi chưa có ảnh), tuyệt đối không dùng primary/secondary tint cho background.
- ❌ **Mobile placeholder**: Dùng `mobileBentoTints` (primary tint) cho placeholder → cũng vi phạm Rule 5
- ❌ **Placeholder icon**: Desktop dùng `bentoColors.placeholderIcon` = primary solid (✅ đúng). Mobile dùng `className="text-white/50"` cho icon → **sai**, phải dùng primary solid
- ⚠️ **Accent Prominence (Dual rule - data state)**: Khi có data, main image ring = secondary (đúng vì nhỏ hơn), nhưng primary không xuất hiện ở element nào khi có data → **primary chiếm 0%** → vi phạm minimum visibility rule (>= 15%)

---

### Layout 4: FULLSCREEN

**Accent Analysis (khi có data):**

| # | Element | Tier | Area | Interactive? | Assigned Color | Đúng/Sai |
|---|---------|------|------|-------------|----------------|----------|
| 1 | CTA button | L | ~8% | yes | primary | ✅ |
| 2 | Badge bg | M | ~3% | no | secondary tint | ✅ |
| 3 | Badge dot pulse | S | <1% | no | primary | ✅ |
| 4 | Pagination dot active | M | ~2% | yes | primary | ⚠️ |
| Total: 4 accents | | | | | Rule: Standard (70/30) | |

**Đúng:**
- ✅ CTA dùng primary + APCA text - đúng
- ✅ Badge bg dùng secondary tint + APCA text color - đúng
- ✅ Badge dot dùng primary - đúng
- ✅ Placeholder bg = `#f1f5f9` - neutral
- ✅ `dotInactive: 'rgba(255, 255, 255, 0.5)'` - neutral
- ✅ Overlay gradient = `from-black/70 via-black/40 to-transparent` - neutral (tốt)
- ✅ Content text: heading = white, description = white/80 - hợp lý trên dark overlay
- ✅ Secondary button dùng `border-white/30 text-white` - neutral (tốt)

**Chưa đúng:**
- ❌ **Rule 7 (Pagination dots)**: `dotActive: primary` ở cả 2 mode → Dual mode phải dùng **secondary** solid
- ⚠️ **Standard rule (4 accents, 70/30)**: Primary = CTA (L) + badge dot (S) + pagination (M) = ~11% → ~73% accent area. Secondary = badge bg (M) = ~3% → ~27%. Tỷ lệ gần đạt 70/30 nhưng pagination nên là secondary theo Rule 7.

---

### Layout 5: SPLIT

**Accent Analysis (khi có data):**

| # | Element | Tier | Area | Interactive? | Assigned Color | Đúng/Sai |
|---|---------|------|------|-------------|----------------|----------|
| 1 | CTA button | L | ~6% | yes | primary | ✅ |
| 2 | Badge bg | M | ~3% | no | secondary tint | ✅ |
| 3 | Nav arrow icon | S | <1% | yes | secondary | ✅ |
| 4 | Progress dot active | M | ~2% | yes | primary | ⚠️ |
| Total: 4 accents | | | | | Rule: Standard (70/30) | |

**Đúng:**
- ✅ CTA dùng primary + APCA text - đúng
- ✅ Badge dùng secondary tint + APCA text - đúng
- ✅ Nav arrow icon dùng secondary (dual mode) - hợp lý
- ✅ `progressDotInactive: '#cbd5e1'` (slate-300) - neutral
- ✅ Placeholder placeholder area dùng `bg-slate-200 dark:bg-slate-700` + `className="text-slate-400"` - neutral

**Chưa đúng:**
- ❌ **Rule 7 (Pagination dots)**: `progressDotActive: primary` ở cả 2 mode → Dual mode phải dùng **secondary** solid
- ❌ **Rule 8 (Nav arrows W3C C40)**: Nav button chỉ có 1 lớp (`bg: rgba(255,255,255,0.9)` + icon secondary). Thiếu **outer ring** two-color indicator. Cần `box-shadow: 0 0 0 2px <outer>` + logic secondary sáng/tối
- ⚠️ **Nav arrow single mode**: Hiện tại `navButtonIcon: secondaryColor` luôn dùng secondary → Single mode phải dùng **primary** (vì secondary = auto-generated, Rule 8 nói single mode icon dùng primary)

---

### Layout 6: PARALLAX

**Accent Analysis (khi có data):**

| # | Element | Tier | Area | Interactive? | Assigned Color | Đúng/Sai |
|---|---------|------|------|-------------|----------------|----------|
| 1 | CTA button | L | ~5% | yes | primary | ✅ |
| 2 | Badge bg | M | ~3% | no | secondary tint | ✅ |
| 3 | Badge dot | S | <1% | no | primary | ✅ |
| 4 | Nav arrow icon | S | <1% | yes | white (fixed) | ❌ |
| Total: 4 accents | | | | | Rule: Standard (70/30) | |

**Đúng:**
- ✅ CTA dùng primary + APCA text - đúng
- ✅ Badge dùng secondary tint + APCA text - đúng
- ✅ Badge dot dùng primary - đúng
- ✅ Placeholder bg = `#f1f5f9` - neutral
- ✅ Card content area dùng `bg-white/95` - neutral

**Chưa đúng:**
- ❌ **Rule 8 (Nav arrows)**: `navButtonIcon: '#ffffff'` (hard-coded white) → Dual mode phải dùng **secondary solid**, single mode dùng **primary solid**. Không được hard-code.
- ❌ **Rule 8 (Two-color indicator)**: `navButtonBg: 'rgba(255, 255, 255, 0.2)'` - chỉ 1 lớp semi-transparent → thiếu outer ring. Trên nền ảnh sáng sẽ **không nhìn thấy** nav button.
- ❌ **Không có pagination dots**: Parallax layout không có pagination dots → ít hơn 1 cơ hội cho secondary visibility. Tuy nhiên có badge nên chấp nhận được nếu nav arrows sửa đúng.

---

## Tổng hợp Issues theo Priority

### Critical (vi phạm core rules):

| # | Issue | Layouts bị ảnh hưởng | Rule |
|---|-------|---------------------|------|
| 1 | Pagination dots dual mode phải dùng secondary | Slider, Fullscreen, Split | Rule 7 |
| 2 | Nav arrows thiếu two-color indicator (W3C C40) | Slider, Split, Parallax | Rule 8 |
| 3 | Nav arrows icon hard-coded hoặc sai mode | Parallax (hard-coded white), Split (luôn dùng secondary kể cả single) | Rule 8 |
| 4 | Bento placeholder bg dùng primary tint | Bento | Rule 5 |

### Warning (cần cải thiện):

| # | Issue | Layouts bị ảnh hưởng | Rule |
|---|-------|---------------------|------|
| 5 | `getPlaceholder()` trong `lib/utils/colors.ts` dùng primary tint cho bg | Tất cả (qua getBrandColors) | Rule 5 |
| 6 | Fade: Lone Accent dùng secondary (dual) thay vì primary | Fade | Rule 9 Lone |
| 7 | Bento mobile placeholder icon dùng `text-white/50` thay vì primary solid | Bento | Rule 5 |
| 8 | Bento data state: primary không xuất hiện khi có ảnh | Bento | Minimum visibility |

---

## Fix Plan (nếu user approve)

1. **`colors.ts` - Pagination dots (Rule 7)**: `getSliderColors`, `getFullscreenColors`, `getSplitColors` → dual mode: `dotActive = secondaryPalette.solid`, single mode: `dotActive = primaryPalette.solid`
2. **`colors.ts` - Nav arrows (Rule 8)**: Thêm logic two-color indicator cho `getSliderColors`, `getSplitColors`, `getParallaxColors` → kiểm tra secondary lightness (L >= 0.65 → bg tối + icon trắng + ring trắng; L < 0.65 → bg trắng + icon secondary + ring tối)
3. **`colors.ts` - Parallax nav**: Thay `'#ffffff'` bằng logic dynamic theo mode/secondary lightness
4. **`colors.ts` - Split nav**: Single mode dùng primary cho icon thay vì secondary
5. **`colors.ts` - Fade**: Lone Accent → luôn dùng primary (cả single lẫn dual)
6. **`HeroPreview.tsx` - Bento placeholder**: Đổi `gridTint1-4` thành neutral (slate-100/200) cho placeholder. Mobile icon đổi thành primary solid.
7. **`lib/utils/colors.ts` - getPlaceholder()**: Đổi background từ `getTint(primary, 0.4)` thành `'#f1f5f9'` (slate-100) neutral
8. **`HeroPreview.tsx` - Nav arrows UI**: Thêm `boxShadow: '0 0 0 2px <outer>'` cho nav buttons ở Slider, Split, Parallax
