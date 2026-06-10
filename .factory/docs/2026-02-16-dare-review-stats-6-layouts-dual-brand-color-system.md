
## Problem Graph

1. [Main] Stats component thiếu `_lib/colors.ts` - không có Single Source of Truth
   1.1 [ROOT CAUSE] Không có color helper → Preview và Render hardcode màu inline riêng rẽ
   1.2 [Sub] Preview và Render không đồng nhất về color mapping (counter layout: preview dùng `brandColor` cho progress bar nhưng render dùng `brandColor`; giá trị text thì preview dùng `brandColor` nhưng render dùng `secondary`)
   1.3 [Sub] Không dùng OKLCH/APCA - tất cả dùng hex trực tiếp + hardcode opacity suffix (`#xxx20`, `#xxx15`)
   1.4 [Sub] 60-30-10 distribution chưa tối ưu ở một số layout

---

## Color Review: Stats (6 Layouts)

### Layout 1: Horizontal

| # | Element | Hiện tại (Preview) | Hiện tại (Render) | Đề xuất | Lý do |
|---|---------|-------------------|-------------------|---------|-------|
| 1 | Value (số liệu) | `brandColor` | `brandColor` | `brandColor` (primary) | OK - số liệu nổi bật = primary |
| 2 | Label | neutral (`text-slate-600`) | neutral (`text-slate-600`) | giữ nguyên | OK - 60% neutral |
| 3 | Border card | `${brandColor}20` | `${secondary}20` | **`secondary` border (OKLCH tint)** | **BUG: Preview dùng primary, Render dùng secondary** → cần thống nhất theo Element-Level Rules: card border = secondary |
| 4 | BoxShadow | `${brandColor}15` | `${secondary}15` | **`secondary` shadow (OKLCH)** | **BUG: tương tự** |

**Issues:**
- ❌ Preview vs Render không khớp border/shadow color (Preview = brandColor, Render = secondary)
- ⚠️ Dùng hex suffix `20`/`15` thay vì OKLCH opacity

### Layout 2: Cards

| # | Element | Preview | Render | Đề xuất | Lý do |
|---|---------|---------|--------|---------|-------|
| 1 | Value | `brandColor` | `brandColor` | primary | OK |
| 2 | Label | neutral | neutral | giữ nguyên | OK |
| 3 | Card border | `${secondary}20` | `${secondary}20` | secondary border (OKLCH) | OK mapping, cần OKLCH |
| 4 | Accent line | `secondary` | `secondary` | secondary | OK - decorative accent = secondary |

**Issues:**
- ⚠️ Hex suffix `20` thay vì OKLCH tint
- ✅ Color mapping đúng 60-30-10 và đồng nhất Preview/Render

### Layout 3: Icons (Circle)

| # | Element | Preview | Render | Đề xuất | Lý do |
|---|---------|---------|--------|---------|-------|
| 1 | Circle bg | `brandColor` | `brandColor` | primary | OK - dominant element = primary |
| 2 | Value text on circle | `text-white` hardcode | `text-white` hardcode | **APCA `getAPCATextColor(brandColor)`** | ❌ Hardcode #fff, dark primary sẽ mất contrast |
| 3 | Label | `secondary` color | `secondary` color | secondary | OK - label dưới = secondary |
| 4 | Shadow | `${secondary}30/20` | `${secondary}30/20` | secondary OKLCH | OK mapping |

**Issues:**
- ❌ Hardcode `text-white` cho text on circle - cần APCA
- ⚠️ Hex suffix cho shadow

### Layout 4: Gradient

| # | Element | Preview | Render | Đề xuất | Lý do |
|---|---------|---------|--------|---------|-------|
| 1 | Gradient bg | `brandColor → secondary` | `brandColor → secondary` | giữ nguyên | OK - dual brand gradient |
| 2 | Value text | `text-white` hardcode | `text-white` hardcode | **APCA** | ❌ Nếu primary/secondary sáng → mất contrast |
| 3 | Label text | `text-white opacity-90` | `text-white opacity-90` | **APCA** | ❌ Tương tự |
| 4 | Border | `${secondary}20` | `${secondary}20` | OKLCH tint | ⚠️ Hex suffix |

**Issues:**
- ❌ Hardcode text-white, gradient sáng sẽ mất contrast
- ⚠️ Hex suffix

### Layout 5: Minimal

| # | Element | Preview | Render | Đề xuất | Lý do |
|---|---------|---------|--------|---------|-------|
| 1 | Accent line | `secondary` | `secondary` | secondary | OK - decorative = secondary |
| 2 | Value | `brandColor` | `brandColor` | primary | OK |
| 3 | Label | neutral (`text-slate-500`) | neutral (`text-slate-500`) | giữ nguyên | OK |

**Issues:**
- ✅ Layout này khá clean, mapping đúng
- Không có vấn đề nghiêm trọng

### Layout 6: Counter

| # | Element | Preview | Render | Đề xuất | Lý do |
|---|---------|---------|--------|---------|-------|
| 1 | Progress bar | `secondary` | `brandColor` | **secondary** | **❌ BUG: Preview dùng secondary, Render dùng brandColor** → progress bar = decorative = secondary |
| 2 | Value | `brandColor` | `secondary` | **brandColor** (primary) | **❌ BUG: Preview dùng brandColor, Render dùng secondary** → giá trị nổi bật = primary |
| 3 | Card border | `${secondary}20` | `${secondary}15` | secondary OKLCH | ⚠️ Opacity khác nhau (20 vs 15) |
| 4 | Watermark number | `secondary` | `secondary` | secondary | OK - decorative |
| 5 | Label | neutral | neutral | giữ nguyên | OK |

**Issues:**
- ❌ **Preview vs Render hoán đổi primary/secondary** cho progress bar và value
- ⚠️ Opacity suffix khác nhau

---

## Tổng hợp Issues

| Priority | Issue | Layouts ảnh hưởng |
|----------|-------|-------------------|
| ❌ Critical | Preview ≠ Render color mapping | Horizontal (border/shadow), Counter (progress + value bị hoán đổi) |
| ❌ High | Hardcode `text-white` thay vì APCA | Icons, Gradient |
| ⚠️ Medium | Hex suffix (`#xxx20`) thay vì OKLCH tint | Tất cả 6 layouts |
| ⚠️ Medium | Không có `_lib/colors.ts` → không Single Source of Truth | Toàn bộ component |

---

## Fix Plan (Step-by-step)

### Bước 1: Tạo `stats/_lib/colors.ts`

Tạo file color helper theo pattern Hero, export 6 hàm tương ứng 6 layout:
- `getHorizontalColors(primary, secondary)` → border, shadow (secondary OKLCH tint)
- `getCardsColors(primary, secondary)` → border (secondary tint), accent line (secondary solid)
- `getIconsColors(primary, secondary)` → circle bg (primary), text on circle (APCA), label (secondary), shadow (secondary tint)
- `getGradientColors(primary, secondary)` → gradient, textOnGradient (APCA check cả 2 endpoints)
- `getMinimalColors(primary, secondary)` → accent line (secondary), value (primary)
- `getCounterColors(primary, secondary)` → progress bar (secondary), value (primary), border (secondary tint), watermark (secondary)

Mỗi hàm dùng OKLCH từ `culori` và APCA từ `apca-w3`.

### Bước 2: Cập nhật `StatsPreview.tsx`

Import và sử dụng các hàm từ `_lib/colors.ts` thay vì inline hardcode. Đảm bảo:
- Horizontal: border + shadow dùng secondary (fix bug hiện tại dùng primary)
- Icons: text on circle dùng APCA
- Gradient: text dùng APCA
- Counter: value = primary, progress = secondary (fix bug hoán đổi)

### Bước 3: Cập nhật `ComponentRenderer.tsx` (StatsSection)

Import và sử dụng cùng hàm từ `stats/_lib/colors.ts`:
- Counter: value đổi từ secondary → primary, progress bar giữ secondary (fix consistency với preview)
- Horizontal: đã dùng secondary cho border → OK, chỉ cần dùng helper

### Bước 4: Chạy `bunx tsc --noEmit` để verify

---

## Accent Analysis (theo template)

**Stats component (tất cả layouts chung pattern):**

| # | Element | Tier | Area Est. | Interactive? | Assigned Color | Reason |
|---|---------|------|-----------|-------------|----------------|--------|
| 1 | Value (số liệu) | L | ~15% | no | primary | Dominant data = primary brand |
| 2 | Accent line/bar/circle | M | ~5% | no | secondary | Decorative accent |
| 3 | Card border/shadow | S | ~3% | no | secondary | Subtle accent |
| 4 | Label | - | ~10% | no | neutral | Body text = neutral |
| Total: 3 accent points | | | | | | Apply Rule: Triple → P:P:S |

**60-30-10 distribution (content state):**
- 60% Neutral: background, label text, dividers → ✅
- 30% Primary: value numbers (brandColor) → ✅
- 10% Secondary: accent lines, borders, shadows → ✅
