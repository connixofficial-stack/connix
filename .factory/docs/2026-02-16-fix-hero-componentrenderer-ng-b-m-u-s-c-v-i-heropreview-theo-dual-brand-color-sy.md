## Problem Graph

```
1. [Main] Màu sắc Hero trên trang chủ (ComponentRenderer) khác với preview (edit page)
   1.1 [ROOT CAUSE] ComponentRenderer.HeroSection dùng raw hex + CSS alpha hack
       Preview (HeroPreview) dùng OKLCH + APCA color system từ _lib/colors.ts
   1.2 [Sub] ComponentRenderer không đọc `harmony` và `mode` từ config/settings
   1.3 [Sub] Không áp dụng dual-brand rules (dot active, nav arrows, badge colors...)
```

## Chi tiết sự khác biệt (6 styles)

### Slider

| Element | Preview (HeroPreview) | Site (ComponentRenderer) |
|---------|----------------------|--------------------------|
| Nav arrows | `getNavIndicatorColors()` - 2-layer contrast (W3C C40) | `bg-white/80`, `color: secondary` raw |
| Dot active | dual: `secondaryPalette.solid`, single: `primaryPalette.solid` | `brandColor` luôn (bỏ qua dual/single) |
| Dot inactive | `rgba(255,255,255,0.5)` | `bg-white/50` (giống nhưng CSS class) |

### Fade

| Element | Preview | Site |
|---------|---------|------|
| Thumbnail border active | `primaryPalette.solid` | `secondary` raw |
| Placeholder | neutral bg + primary icon | `brandColor` fill |

### Bento

| Element | Preview | Site |
|---------|---------|------|
| Main image ring | `getSecondaryTint(0.35)` OKLCH | `${secondary}60` CSS alpha hack |
| Placeholder | neutral bg + primary icon | `bg-slate-800` |

### Fullscreen

| Element | Preview | Site |
|---------|---------|------|
| Badge bg | `getSecondaryTint(0.3)` OKLCH | `${secondary}30` CSS alpha hack |
| Badge text | `getAPCATextColor()` | `secondary` raw (no contrast check) |
| CTA text | `getAPCATextColor(primary)` | `text-white` hard-coded |
| Dot active | dual: secondary, single: primary | `brandColor` luôn |

### Split

| Element | Preview | Site |
|---------|---------|------|
| Badge bg | `getSecondaryTint(0.4)` OKLCH | `${secondary}15` CSS alpha hack |
| Badge text | `getAPCATextColor()` | `secondary` raw |
| CTA text | `getAPCATextColor(primary)` | `text-white` hard-coded |
| Nav arrows | `getNavIndicatorColors()` 2-layer | `bg-white/90`, `color: secondary` |
| Progress dots | dual: secondary, single: primary | `brandColor` luôn |

### Parallax

| Element | Preview | Site |
|---------|---------|------|
| Card badge bg | `getSecondaryTint(0.4)` OKLCH | `${secondary}15` CSS alpha hack |
| Card badge text | `getAPCATextColor()` | `secondary` raw |
| CTA text | `getAPCATextColor(primary)` | `text-white` hard-coded |
| Nav arrows | `getNavIndicatorColors()` 2-layer | `bg-white/20` + `text-white` |

### Thiếu hoàn toàn trong ComponentRenderer:
- Không đọc `config.harmony` (single mode cần harmony để tính secondary)
- Không biết `mode` (single/dual) -> không áp dụng dual-brand rules
- Không dùng OKLCH tint/shade -> CSS alpha hack (`${color}30`) không chính xác
- Không dùng APCA text contrast -> hard-code `#ffffff` có thể fail với primary sáng

## Plan Fix

### File cần sửa: `components/site/ComponentRenderer.tsx` - chỉ phần `HeroSection`

### Bước 1: Import color functions từ hero `_lib/colors.ts`

```typescript
import {
  getSliderColors,
  getFadeColors,
  getBentoColors,
  getFullscreenColors,
  getSplitColors,
  getParallaxColors,
  getAPCATextColor,
} from '@/app/admin/home-components/hero/_lib/colors';
import type { HeroHarmony } from '@/app/admin/home-components/hero/_types';
```

### Bước 2: Cập nhật `useBrandColors()` hook hoặc `ComponentRenderer` để biết mode

Thêm `mode` vào hook `useBrandColors()` return value:
```typescript
// components/site/hooks.ts
return { primary, secondary, mode }; // thêm mode
```

### Bước 3: Update `HeroSection` function signature và logic

```typescript
function HeroSection({ config, brandColor, secondary, mode }: { 
  config: Record<string, unknown>; 
  brandColor: string; 
  secondary: string;
  mode: 'single' | 'dual';
}) {
  const harmony = (config.harmony as HeroHarmony) || 'analogous';
  
  // Tính toán color schemes giống preview
  const sliderColors = getSliderColors(brandColor, secondary, mode, harmony);
  const fadeColors = getFadeColors(brandColor, secondary, mode, harmony);
  // ... tương tự cho các style khác
```

### Bước 4: Thay thế raw hex/CSS alpha hack bằng color scheme values

Cho mỗi style, thay thế:
- `${secondary}30` -> OKLCH tint từ color scheme
- `color: secondary` -> `getAPCATextColor()` 
- `backgroundColor: brandColor` + `text-white` -> `backgroundColor: primary` + `color: getAPCATextColor(primary)`
- Nav arrows: dùng `getNavIndicatorColors()` pattern
- Dots: dùng dual/single rule (secondary vs primary)

### Bước 5: Update `ComponentRenderer` truyền `mode` xuống

```typescript
export function ComponentRenderer({ component }: ComponentRendererProps) {
  const { primary, secondary, mode } = useBrandColors();
  // ...
  case 'Hero':
    return <HeroSection config={config} brandColor={brandColor} secondary={secondary} mode={mode} />;
}
```

### Scope
- Chỉ fix **HeroSection** trong `ComponentRenderer.tsx`
- Chỉ fix **hooks.ts** (thêm return `mode`)
- Không đụng các section khác (Stats, About, etc.)
- Không thay đổi HeroPreview (đã đúng)