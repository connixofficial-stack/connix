
## Problem Graph

```
1. [Main] Hero Slider không áp dụng đúng Dual-Brand Color System
   1.1 [ROOT CAUSE] Primary hoàn toàn "biến mất" khi có data (ảnh)
       - Placeholder icon (primary) chỉ hiện khi CHƯA có ảnh
       - Khi có ảnh: primary = 0 element types → FAIL (cần >= 3)
   1.2 Secondary chỉ dùng cho nav buttons (Tier S) + dots (Tier M)
       - Nav buttons: icon 14-16px → quá nhỏ
       - Dots: ~2% diện tích → vừa đủ Tier M
       - Thiếu element diện tích lớn cho secondary
```

## Accent Analysis (Slider - DATA ĐẦY ĐỦ, có ảnh)

| # | Element | Tier | Area Est. | Interactive? | Current Color | Issue |
|---|---------|------|-----------|-------------|---------------|-------|
| 1 | Nav arrow buttons | S | <1% | yes | secondary (dual) | OK nhưng quá nhỏ |
| 2 | Pagination dot active | M | ~2% | yes | secondary (dual) | OK |
| 3 | (không có gì khác) | - | - | - | - | **Primary = 0 elements!** |
| **Total: 2 accent points** | | | | | | **FAIL: Primary invisible** |

## Bối cảnh đặc biệt của Slider

Slider layout là layout **image-only** - chỉ có ảnh + navigation. Không có:
- Badge/heading/description overlay
- CTA button
- Text content

→ Không thể thêm primary vào CTA/heading/badge vì Slider không có những thành phần này.

## Giải pháp: Thêm accent elements phù hợp với Slider

### Áp dụng Accent Prominence Engine (3 accent points mới → total 4+)

| # | Element | Tier | Area Est. | Interactive? | Assigned Color | Reason |
|---|---------|------|-----------|-------------|----------------|--------|
| 1 | **Bottom gradient strip** (full-width bar dưới slider) | L | ~5-8% | no | **primary** | Luôn visible, diện tích lớn, brand presence |
| 2 | Nav arrow buttons | S | <1% | yes | secondary (dual) | Giữ nguyên |
| 3 | Pagination dot active | M | ~2% | yes | secondary (dual) | Giữ nguyên |
| 4 | **Slide counter text** ("1/3") hoặc **progress bar** | M | ~2-3% | no | **primary** | Thêm brand accent |
| **Total: 4 accent points** | | | | | | **60-30-10: 2 primary + 2 secondary** |

### Chi tiết implementation

#### 1. Thêm bottom gradient strip (primary accent)
- Dải gradient mỏng ở đáy slider: `height: 3-4px`
- Gradient: `primary solid` → `transparent` (hoặc `primary → secondary` cho dual mode)
- Vị trí: absolute bottom, full width, z-20
- Diện tích visual ~5% (full width = L tier)

#### 2. Thêm slide progress bar thay dots (hoặc kết hợp)
- Progress bar nhỏ bên dưới dots
- Active segment: `primary` color
- Inactive: neutral (white/20%)
- Hoặc: giữ dots + thêm thin line primary ở top slider

### Files cần sửa

#### File 1: `colors.ts` - Thêm fields cho SliderColorScheme
```ts
export interface SliderColorScheme {
  // ... existing fields
  bottomStripGradient: string;   // NEW: primary gradient strip
  progressBarActive: string;     // NEW: primary progress bar
  progressBarInactive: string;   // NEW: neutral inactive
}
```

Trong `getSliderColors()`:
```ts
return {
  // ... existing
  bottomStripGradient: mode === 'dual'
    ? `linear-gradient(to right, ${primaryPalette.solid}, ${secondaryPalette.solid})`
    : `linear-gradient(to right, ${primaryPalette.solid}, ${primaryPalette.hover})`,
  progressBarActive: primaryPalette.solid,
  progressBarInactive: 'rgba(255, 255, 255, 0.2)',
};
```

#### File 2: `HeroPreview.tsx` - `renderSliderStyle()`
Thêm bottom strip + progress bar vào JSX:
```tsx
{/* Bottom brand strip - primary accent */}
<div
  className="absolute bottom-0 left-0 right-0 h-1 z-30"
  style={{ background: sliderColors.bottomStripGradient }}
/>
```

Và sửa dots thêm progress indicator:
```tsx
{/* Progress bar under dots */}
<div className="absolute bottom-0 left-0 right-0 h-0.5 z-20">
  <div
    className="h-full transition-all duration-700"
    style={{
      backgroundColor: sliderColors.progressBarActive,
      width: `${((currentSlide + 1) / slides.length) * 100}%`,
    }}
  />
</div>
```

#### File 3: `ComponentRenderer.tsx` - HeroSection slider block
Thêm tương tự bottom strip + progress bar vào render thực tế, giữ logic đồng bộ với preview.

### Color Role Matrix (Slider - sau fix)

| Element | Trạng thái | Primary | Secondary | Neutral | Ghi chú |
|---------|-----------|---------|-----------|---------|---------|
| Bottom gradient strip | content | from-color | to-color (dual) | - | Brand presence, L tier |
| Progress bar active | content | solid | - | - | Slide indicator |
| Nav arrow btn | content | single: icon | dual: icon | bg + ring | W3C C40 |
| Pagination dot active | content | single: solid | dual: solid | - | Rule 7 |
| Pagination dot inactive | content | - | - | rgba white | Neutral |
| Placeholder bg | empty | - | - | slate-100 | Neutral |
| Placeholder icon | empty | solid | - | - | Hint only |

### Dual-Brand Visibility Checklist (sau fix)

**Primary (>= 3 types):**
- [x] Bottom gradient strip (brand line) → brand presence
- [x] Progress bar active → active indicator  
- [x] Placeholder icon (khi empty)
- **= 2 khi có data** (bottom strip + progress) → vẫn chưa đủ 3, cần thêm 1

**Bổ sung thêm**: slide link overlay ring khi hover (active indicator)
```tsx
// Khi hover slide, thêm border ring primary
<div className="... hover:ring-2 hover:ring-offset-1"
  style={{ '--tw-ring-color': primaryPalette.solid } as React.CSSProperties}>
```

→ **Primary = 3 types**: bottom strip + progress bar + hover ring

**Secondary (>= 2 types diện tích đủ lớn):**
- [x] Nav arrow buttons (icon)
- [x] Pagination dots active
- [x] Bottom gradient strip (to-color, dual mode)
- **= 3 types** ✅
