
## Problem Graph

1. [Main] Heading h2 trong ComponentRenderer KHÔNG có `style={{ color: colors.primary.solid }}` - tất cả 6 styles đều thiếu
   1.1 [ROOT CAUSE] ComponentRenderer không gán `colors.primary.solid` cho heading `<h2>`, trong khi Preview có gán đúng

## Phân tích chi tiết

### Preview (ProductCategoriesPreview.tsx) - CÓ màu primary cho heading
Tất cả 6 styles đều có `style={{ color: colors.primary.solid }}` trên `<h2>`:
- `renderGridStyle()` - line: `style={{ color: colors.primary.solid }}`
- `renderCarouselStyle()` - có
- `renderCardsStyle()` - có
- `renderMinimalStyle()` - có
- `renderMarqueeStyle()` - có
- `renderCircularStyle()` - có

### ComponentRenderer (site render) - THIẾU màu primary cho heading
Tất cả 6 styles đều **KHÔNG** có `style={{ color: colors.primary.solid }}` trên `<h2>`:
- Grid (line ~5740): `<h2 className="text-xl ...">` - THIẾU style
- Carousel (line ~5770): `<h2 className="text-xl ...">` - THIẾU style
- Cards (line ~5870): `<h2 className="text-xl ...">` - THIẾU style
- Minimal (line ~5910): `<h2 className="text-lg ...">` - THIẾU style
- Circular (line ~5950): `<h2 className="text-xl ...">` - THIẾU style
- Marquee (fallback, line ~6010): `<h2 className="text-xl ...">` - THIẾU style

### Theo Dual Brand Color System Skill
- **Element-Level Color Rules**: "Section title/heading accent" -> dùng `brandColor` (primary)
- **Principle 6**: Single Source of Truth - Render ≡ Preview, dùng chung helper

## Fix Plan

**File**: `components/site/ComponentRenderer.tsx`

Thêm `style={{ color: colors.primary.solid }}` cho tất cả 6 thẻ `<h2>` trong `ProductCategoriesSection`:

1. **Grid** `<h2>`: thêm `style={{ color: colors.primary.solid }}`
2. **Carousel** `<h2>`: thêm `style={{ color: colors.primary.solid }}`
3. **Cards** `<h2>`: thêm `style={{ color: colors.primary.solid }}`
4. **Minimal** `<h2>`: thêm `style={{ color: colors.primary.solid }}`
5. **Circular** `<h2>`: thêm `style={{ color: colors.primary.solid }}`
6. **Marquee** (fallback) `<h2>`: thêm `style={{ color: colors.primary.solid }}`

Đây là fix đơn giản, chỉ thêm inline style cho 6 heading đã có sẵn, đảm bảo Render ≡ Preview.
