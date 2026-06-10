# SPEC: Hero Component - Reference Implementation cho Color System 1-Màu/2-Màu

## 🎯 MỤC TIÊU

Implement **hoàn chỉnh** color system cho Hero component với support cho cả **mode='single'** (monochromatic) và **mode='dual'** (60-30-10 rule), sau đó dùng làm **boilerplate** cho 29 components còn lại.

---

## 📊 TẠI SAO CHỌN HERO?

**Phân tích từ 10 GOOD components → Hero đạt 25/25 điểm:**

| Tiêu chí | Score | Lý do |
|----------|-------|-------|
| Color Complexity | 5⭐ | Primary + secondary + tints + borders + gradients + hover states |
| Layout Diversity | 5⭐ | 6 layouts hoàn toàn khác biệt (slider, fade, bento, fullscreen, split, parallax) |
| UI Variety | 5⭐ | Buttons, badges, borders, overlays, navigation, dots, thumbnails |
| Implementation Quality | 5⭐ | Clean code, helpers, responsive, accessibility, performance |
| Representative Value | 5⭐ | Patterns apply cho tất cả 29 components |

**Patterns Hero cover:**
- ✅ Primary solid (buttons, CTAs)
- ✅ Secondary solid (navigation icons, badges)
- ✅ Primary tints (backgrounds `${brandColor}15/25/30`)
- ✅ Secondary tints (accents `${secondary}30/40/60`)
- ✅ Borders (hover `${secondary}40`)
- ✅ Hover states (scale, opacity, border-color)
- ✅ Active states (dots, thumbnails)
- ⚠️ **THIẾU:** Brand gradients (chỉ có black gradients)
- ❌ **THIẾU:** Mode='single' fallback logic
- ❌ **THIẾU:** Helper functions chuẩn hóa

---

## 🔍 VẤN ĐỀ HIỆN TẠI (Hero Component)

### Issue #1: Tint/Shade Logic Sai

```typescript
// ❌ HIỆN TẠI - String concat (INVALID CSS)
style={{ backgroundColor: `${brandColor}25` }}  
// → '#3b82f625' ❌ không phải hex hợp lệ

style={{ borderColor: `${secondary}40` }}
// → '#ec489940' ❌ không phải hex hợp lệ

// Nhưng vẫn WORK vì Tailwind xử lý ở build time? → KHÔNG rõ, cần verify
```

**Cần:**
```typescript
// ✅ ĐÚNG - RGBA với opacity
getTint(brandColor, 0.25)  // → 'rgba(59, 130, 246, 0.25)' ✅
getTint(secondary, 0.40)   // → 'rgba(236, 72, 153, 0.40)' ✅
```

### Issue #2: Thiếu Mode='Single' Fallback

```typescript
// ❌ HIỆN TẠI - Không check secondary
export const HeroPreview = ({ brandColor, secondary, ... }) => {
  // Khi mode='single': secondary = ''
  // → borderColor: '40' ❌ CSS lỗi
  <button style={{ borderColor: `${secondary}40` }}>
}
```

**Cần:**
```typescript
// ✅ ĐÚNG - Có fallback
const resolvedSecondary = secondary || brandColor;
const useDualBrand = !!secondary;

{useDualBrand ? (
  <button style={{ borderColor: getTint(secondary, 0.40) }}>
) : (
  <button style={{ borderColor: getTint(brandColor, 0.20) }}>
)}
```

### Issue #3: Thiếu Brand Gradients

```typescript
// ❌ HIỆN TẠI - Chỉ có black gradients
<div className="bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

// ✅ CẦN THÊM - Brand gradient variant
<div style={{ 
  background: `linear-gradient(135deg, ${getTint(brandColor, 0.80)} 0%, ${getTint(secondary, 0.60)} 100%)` 
}} />
```

### Issue #4: Không Tuân Thủ 60-30-10 Rule

Hiện tại không có quy chuẩn rõ ràng về tỷ lệ sử dụng primary vs secondary.

**Cần:**
- 60% neutral (backgrounds, text)
- 30% primary (CTAs, active states, focus)
- 10% secondary (accents, borders, badges)

---

## 🎨 CHUẨN MÀU MỚI (Best Practices)

### Single-Color System (Monochromatic)

```typescript
// Base: #3b82f6
// Tint scale (lighter):
getTint(brandColor, 0.05)  // Very subtle background
getTint(brandColor, 0.10)  // Light background
getTint(brandColor, 0.15)  // Borders
getTint(brandColor, 0.20)  // Cards/hover
getTint(brandColor, 0.30)  // Medium accents
getTint(brandColor, 0.40)  // Visible accents

// Shade scale (darker):
getShade(brandColor, 10)   // Slightly darker
getShade(brandColor, 20)   // Much darker
```

**Usage khi mode='single':**
- CTAs: base color (brandColor 100%)
- Hover: shade -10%
- Backgrounds: tint 5-15%
- Borders: tint 15-20%
- Accents: tint 30-40%

### Dual-Color System (60-30-10 Rule)

```typescript
// Neutral (60%): white, slate-50, slate-900 (built-in Tailwind)

// Primary (30%):
brandColor              // Solid CTAs, active dots
getTint(brandColor, 0.10)  // Subtle backgrounds
getTint(brandColor, 0.20)  // Light accents

// Secondary (10%):
secondary               // Solid badges/icons
getTint(secondary, 0.10)   // Very subtle backgrounds
getTint(secondary, 0.15)   // Badge backgrounds
getTint(secondary, 0.20)   // Dividers
getTint(secondary, 0.30)   // Borders
getTint(secondary, 0.40)   // Hover borders
getTint(secondary, 0.60)   // Ring decorations
```

**Usage khi mode='dual':**
- CTAs/buttons: primary solid (30%)
- Navigation arrows: secondary solid (10%)
- Badges: secondary bg 30% + secondary text (10%)
- Borders: secondary 40% (10%)
- Dots active: primary solid (30%)
- Placeholders: primary tint 15-25% (30%)

---

## 📦 IMPLEMENTATION PLAN

### BƯỚC 1: Tạo Color Utilities Library

**File:** `lib/utils/colors.ts` (NEW)

```typescript
'use client';

/**
 * Convert hex color to rgba with opacity
 * @param hex - Hex color (e.g., '#3b82f6' or '3b82f6')
 * @param opacity - Opacity from 0 to 1 (e.g., 0.25)
 * @returns RGBA string (e.g., 'rgba(59, 130, 246, 0.25)')
 */
export function hexToRgba(hex: string, opacity: number): string {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 3 && cleaned.length !== 6) {
    console.warn(`Invalid hex color: ${hex}`);
    return hex;
  }
  
  const normalized = cleaned.length === 3
    ? cleaned.split('').map(c => c + c).join('')
    : cleaned;
    
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    console.warn(`Failed to parse hex color: ${hex}`);
    return hex;
  }
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get tint (lighter version) of a color
 * Alias for hexToRgba for clarity
 */
export function getTint(hex: string, opacity: number): string {
  return hexToRgba(hex, opacity);
}

/**
 * Get shade (darker version) of a color using HSL
 * @param hex - Hex color
 * @param percentage - How much darker (0-100)
 * @returns Hex string of darker color
 */
export function getShade(hex: string, percentage: number): string {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) {
    console.warn(`Invalid hex for shade: ${hex}`);
    return hex;
  }
  
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  
  // RGB → HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  // Darken lightness
  l = Math.max(0, l - percentage / 100);
  
  // HSL → RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let rOut, gOut, bOut;
  if (s === 0) {
    rOut = gOut = bOut = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    rOut = hue2rgb(p, q, h + 1/3);
    gOut = hue2rgb(p, q, h);
    bOut = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rOut)}${toHex(gOut)}${toHex(bOut)}`;
}

/**
 * Helper to get brand colors with fallback logic
 */
export interface BrandColorsConfig {
  primary: string;
  secondary: string;
  mode: 'single' | 'dual';
}

export interface BrandColorsResult {
  primary: string;
  secondary: string;
  useDualBrand: boolean;
  getTint: (opacity: number, useSecondary?: boolean) => string;
  getShade: (percent: number, useSecondary?: boolean) => string;
}

export function getBrandColors(config: BrandColorsConfig): BrandColorsResult {
  const { primary, secondary, mode } = config;
  const useDualBrand = mode === 'dual' && !!secondary;
  
  return {
    primary,
    secondary: useDualBrand ? secondary : primary,
    useDualBrand,
    getTint: (opacity: number, useSecondary = false) => {
      const color = useSecondary && useDualBrand ? secondary : primary;
      return hexToRgba(color, opacity);
    },
    getShade: (percent: number, useSecondary = false) => {
      const color = useSecondary && useDualBrand ? secondary : primary;
      return getShade(color, percent);
    },
  };
}
```

---

### BƯỚC 2: Tạo Color Constants cho Hero

**File:** `app/admin/home-components/hero/_lib/colors.ts` (NEW)

```typescript
'use client';

import { getTint, getShade } from '@/lib/utils/colors';

export interface HeroColorScheme {
  // Primary (30% visual weight)
  primarySolid: string;           // CTAs, active dots
  primaryHover: string;           // Button hover (shade -10%)
  primaryTintSubtle: string;      // Very light bg (tint 10%)
  primaryTintLight: string;       // Light bg (tint 15%)
  primaryTintMedium: string;      // Placeholders (tint 25%)
  
  // Secondary (10% visual weight) - hoặc fallback to primary nếu mode='single'
  secondarySolid: string;         // Navigation icons, badges solid
  secondaryTintVeryLight: string; // Badge bg (tint 10%)
  secondaryTintLight: string;     // Badge bg (tint 15%)
  secondaryTintMedium: string;    // Badge bg, dividers (tint 30%)
  secondaryTintStrong: string;    // Borders (tint 40%)
  secondaryTintRing: string;      // Ring decoration (tint 60%)
  
  // Gradients
  overlayGradient: string;        // Black overlay (existing)
  brandGradient?: string;         // Brand gradient (new)
}

export function getHeroColors(
  primary: string, 
  secondary: string, 
  useDualBrand: boolean
): HeroColorScheme {
  // Primary colors (always use primary)
  const primaryColors = {
    primarySolid: primary,
    primaryHover: getShade(primary, 10),
    primaryTintSubtle: getTint(primary, 0.10),
    primaryTintLight: getTint(primary, 0.15),
    primaryTintMedium: getTint(primary, 0.25),
  };
  
  // Secondary colors - fallback to primary nếu mode='single'
  const secondaryBase = useDualBrand ? secondary : primary;
  const secondaryColors = {
    secondarySolid: secondaryBase,
    secondaryTintVeryLight: getTint(secondaryBase, useDualBrand ? 0.10 : 0.08),
    secondaryTintLight: getTint(secondaryBase, useDualBrand ? 0.15 : 0.12),
    secondaryTintMedium: getTint(secondaryBase, useDualBrand ? 0.30 : 0.20),
    secondaryTintStrong: getTint(secondaryBase, useDualBrand ? 0.40 : 0.25),
    secondaryTintRing: getTint(secondaryBase, useDualBrand ? 0.60 : 0.35),
  };
  
  // Gradients
  const overlayGradient = 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)';
  const brandGradient = useDualBrand
    ? `linear-gradient(135deg, ${getTint(primary, 0.80)} 0%, ${getTint(secondary, 0.60)} 100%)`
    : `linear-gradient(135deg, ${getTint(primary, 0.80)} 0%, ${getTint(primary, 0.50)} 100%)`;
  
  return {
    ...primaryColors,
    ...secondaryColors,
    overlayGradient,
    brandGradient,
  };
}
```

---

### BƯỚC 3: Update HeroPreview Component

**File:** `app/admin/home-components/hero/_components/HeroPreview.tsx` (UPDATE)

**Changes:**

1. Import color utilities:
```typescript
import { getBrandColors } from '@/lib/utils/colors';
import { getHeroColors } from '../_lib/colors';
```

2. Add mode prop và compute colors:
```typescript
export const HeroPreview = ({ 
  slides, 
  brandColor,
  secondary,
  selectedStyle = 'slider',
  onStyleChange,
  content,
  mode = 'dual', // NEW PROP
}: { 
  slides: { id: number; image: string; link: string }[]; 
  brandColor: string;
  secondary: string;
  mode?: 'single' | 'dual'; // NEW
  selectedStyle?: HeroStyle;
  onStyleChange?: (style: HeroStyle) => void;
  content?: HeroContent;
}) => {
  // Compute colors
  const brandColors = getBrandColors({
    primary: brandColor,
    secondary,
    mode,
  });
  
  const colors = getHeroColors(
    brandColors.primary,
    brandColors.secondary,
    brandColors.useDualBrand
  );
  
  // ... rest
```

3. Replace tất cả color usages:

**TRƯỚC:**
```typescript
// ❌ String concat
style={{ backgroundColor: `${brandColor}25` }}
style={{ borderColor: `${secondary}40` }}
style={{ color: secondary }}
style={{ backgroundColor: brandColor }}
```

**SAU:**
```typescript
// ✅ Use color scheme
style={{ backgroundColor: colors.primaryTintMedium }}
style={{ borderColor: colors.secondaryTintStrong }}
style={{ color: colors.secondarySolid }}
style={{ backgroundColor: colors.primarySolid }}
```

---

### BƯỚC 4: Update Từng Layout

#### 4.1. Slider Style

**TRƯỚC:**
```typescript
<button style={{ borderColor: `${secondary}40` }}>
  <ChevronLeft style={{ color: secondary }} />
</button>

<button style={idx === currentSlide ? { backgroundColor: brandColor } : {}} />
```

**SAU:**
```typescript
<button style={{ borderColor: colors.secondaryTintStrong }}>
  <ChevronLeft style={{ color: colors.secondarySolid }} />
</button>

<button style={idx === currentSlide ? { backgroundColor: colors.primarySolid } : {}} />
```

#### 4.2. Fade Style

**TRƯỚC:**
```typescript
<button style={idx === currentSlide ? { borderColor: secondary } : {}}>
  {!slide.image && <div style={{ backgroundColor: brandColor }} />}
</button>
```

**SAU:**
```typescript
<button style={idx === currentSlide ? { borderColor: colors.secondarySolid } : {}}>
  {!slide.image && <div style={{ backgroundColor: colors.primarySolid }} />}
</button>
```

#### 4.3. Bento Style

**TRƯỚC:**
```typescript
<div style={{ '--tw-ring-color': `${secondary}60` }}>
  <div style={{ backgroundColor: `${brandColor}15` }}>
    <ImageIcon style={{ color: brandColor }} />
  </div>
</div>

<div style={{ backgroundColor: `${brandColor}${15 + idx * 5}` }}>
```

**SAU:**
```typescript
<div style={{ '--tw-ring-color': colors.secondaryTintRing }}>
  <div style={{ backgroundColor: colors.primaryTintLight }}>
    <ImageIcon style={{ color: colors.primarySolid }} />
  </div>
</div>

// Progressive tints cho mobile bento
<div style={{ 
  backgroundColor: idx === 0 ? colors.primaryTintLight :
                    idx === 1 ? colors.primaryTintMedium :
                    idx === 2 ? getTint(brandColors.primary, 0.30) :
                    getTint(brandColors.primary, 0.35)
}}>
```

#### 4.4. Fullscreen Style

**TRƯỚC:**
```typescript
<div style={{ backgroundColor: `${secondary}30`, color: secondary }}>
  <span style={{ backgroundColor: brandColor }} />
  {c.badge}
</div>

<button style={{ backgroundColor: brandColor }}>
```

**SAU:**
```typescript
<div style={{ backgroundColor: colors.secondaryTintMedium, color: colors.secondarySolid }}>
  <span style={{ backgroundColor: colors.primarySolid }} />
  {c.badge}
</div>

<button style={{ backgroundColor: colors.primarySolid }}>
```

#### 4.5. Split Style

**TRƯỚC:**
```typescript
<span style={{ backgroundColor: `${secondary}15`, color: secondary }}>
  {c.badge}
</span>

<button style={{ backgroundColor: brandColor }}>

<button style={idx === currentSlide ? { backgroundColor: brandColor } : {}} />

<ChevronLeft style={{ color: secondary }} />
```

**SAU:**
```typescript
<span style={{ backgroundColor: colors.secondaryTintLight, color: colors.secondarySolid }}>
  {c.badge}
</span>

<button style={{ backgroundColor: colors.primarySolid }}>

<button style={idx === currentSlide ? { backgroundColor: colors.primarySolid } : {}} />

<ChevronLeft style={{ color: colors.secondarySolid }} />
```

#### 4.6. Parallax Style

**TRƯỚC:**
```typescript
<div style={{ backgroundColor: brandColor }} />

<span style={{ backgroundColor: `${secondary}15`, color: secondary }}>
  {c.badge}
</span>

<button style={{ backgroundColor: brandColor }}>
```

**SAU:**
```typescript
<div style={{ backgroundColor: colors.primarySolid }} />

<span style={{ backgroundColor: colors.secondaryTintLight, color: colors.secondarySolid }}>
  {c.badge}
</span>

<button style={{ backgroundColor: colors.primarySolid }}>
```

#### 4.7. Placeholder Function

**TRƯỚC:**
```typescript
const renderPlaceholder = (idx: number) => (
  <div>
    <div style={{ backgroundColor: `${brandColor}25` }}>
      <ImageIcon style={{ color: brandColor }} />
    </div>
  </div>
);
```

**SAU:**
```typescript
const renderPlaceholder = (idx: number) => (
  <div>
    <div style={{ backgroundColor: colors.primaryTintMedium }}>
      <ImageIcon style={{ color: colors.primarySolid }} />
    </div>
  </div>
);
```

---

### BƯỚC 5: Update Parent Component (Edit Page)

**File:** `app/admin/home-components/hero/[id]/edit/page.tsx` (UPDATE)

**Changes:**

1. Import useBrandColors hook:
```typescript
import { useBrandColors } from '@/components/site/hooks';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
```

2. Get colors + mode:
```typescript
export default function HeroEditPage({ params }: { params: { id: string } }) {
  const { primary, secondary } = useBrandColors();
  const modeSetting = useQuery(api.settings.getByKey, { key: 'site_brand_mode' });
  const mode = modeSetting?.value === 'single' ? 'single' : 'dual';
  
  // ... rest
  
  return (
    <HeroPreview 
      slides={slides}
      brandColor={primary}
      secondary={secondary}
      mode={mode} // PASS MODE
      selectedStyle={selectedStyle}
      onStyleChange={setSelectedStyle}
      content={content}
    />
  );
}
```

---

### BƯỚC 6: Add Brand Gradient Variant (Optional Enhancement)

**Thêm toggle trong UI để switch giữa black gradient và brand gradient:**

**File:** `HeroPreview.tsx`

```typescript
// State
const [useGradientType, setGradientType] = useState<'black' | 'brand'>('black');

// Fullscreen overlay
{slide.image ? (
  <div className="w-full h-full relative">
    <PreviewImage src={slide.image} alt="" className="w-full h-full object-cover" />
    <div 
      className="absolute inset-0" 
      style={{ 
        background: useGradientType === 'black' 
          ? colors.overlayGradient 
          : colors.brandGradient 
      }} 
    />
  </div>
) : renderPlaceholder(idx)}

// Toggle UI (trong PreviewWrapper hoặc settings)
<div className="flex gap-2">
  <button onClick={() => setGradientType('black')}>Black Overlay</button>
  <button onClick={() => setGradientType('brand')}>Brand Gradient</button>
</div>
```

---

## 🧪 TESTING PLAN

### Test Case 1: Mode='Single'

**Setup:**
```
- Settings: site_brand_mode = 'single'
- Primary: #3b82f6 (blue)
- Secondary: '' (empty)
```

**Expected:**
- Tất cả secondary colors fallback to primary
- Không có CSS errors (`borderColor: '40'`)
- Colors harmonious (monochromatic)
- Tint opacity nhẹ hơn (0.08, 0.12, 0.20 thay vì 0.10, 0.15, 0.30)

### Test Case 2: Mode='Dual' với Complementary

**Setup:**
```
- Settings: site_brand_mode = 'dual'
- Primary: #3b82f6 (blue)
- Secondary: '' (empty) → auto-generate complementary
```

**Expected:**
- Secondary = complementary color (180° từ primary)
- 60-30-10 balance visible
- Primary 30% (buttons, active dots)
- Secondary 10% (borders, badges, navigation)

### Test Case 3: Mode='Dual' với Custom Secondary

**Setup:**
```
- Settings: site_brand_mode = 'dual'
- Primary: #3b82f6 (blue)
- Secondary: #ec4899 (pink) - custom
```

**Expected:**
- Secondary = #ec4899 exact
- Tất cả secondary elements dùng pink
- Visual contrast giữa primary và secondary rõ ràng

### Test Case 4: All 6 Layouts Consistency

**Check mỗi layout:**
- Slider: arrows (secondary), dots (primary)
- Fade: thumbnails border (secondary), placeholder (primary)
- Bento: ring (secondary), main placeholder (primary)
- Fullscreen: badge bg (secondary tint 30%), badge dot (primary)
- Split: badge bg (secondary tint 15%), button (primary)
- Parallax: badge bg (secondary tint 15%), button (primary)

### Test Case 5: Accessibility

**Contrast ratios:**
- Primary solid vs white text: ≥ 4.5:1
- Secondary solid vs white text: ≥ 4.5:1
- Tint 15% vs dark text: ≥ 3:1
- Border tint 40% vs white bg: visible

---

## 📋 DELIVERABLES CHECKLIST

### Phase 1: Core Implementation

- [ ] Tạo `lib/utils/colors.ts` với helpers:
  - [ ] `hexToRgba()`
  - [ ] `getTint()`
  - [ ] `getShade()`
  - [ ] `getBrandColors()`

- [ ] Tạo `hero/_lib/colors.ts`:
  - [ ] `HeroColorScheme` interface
  - [ ] `getHeroColors()` function

- [ ] Update `HeroPreview.tsx`:
  - [ ] Add `mode` prop
  - [ ] Compute `brandColors` và `colors`
  - [ ] Replace tất cả string concat colors

### Phase 2: Layout Updates

- [ ] Slider style (6 replacements)
- [ ] Fade style (4 replacements)
- [ ] Bento style (8 replacements + mobile progressive tints)
- [ ] Fullscreen style (4 replacements)
- [ ] Split style (5 replacements)
- [ ] Parallax style (3 replacements)
- [ ] Placeholder helper (2 replacements)

### Phase 3: Parent Integration

- [ ] Update `hero/[id]/edit/page.tsx`:
  - [ ] Import `useBrandColors` hook
  - [ ] Fetch `site_brand_mode` setting
  - [ ] Pass `mode` prop to preview

### Phase 4: Testing

- [ ] Test mode='single': không CSS errors
- [ ] Test mode='dual' complementary: colors harmonious
- [ ] Test mode='dual' custom: exact secondary color
- [ ] Test all 6 layouts: consistency
- [ ] Test accessibility: contrast ratios pass
- [ ] Test responsive: mobile/tablet/desktop

### Phase 5: Documentation (Boilerplate)

- [ ] Tạo `HERO_COLOR_BOILERPLATE.md` với:
  - [ ] Pattern summary
  - [ ] Code examples
  - [ ] Migration guide cho 29 components còn lại
  - [ ] Common pitfalls

---

## 🔄 APPLY CHO 29 COMPONENTS KHÁC

**Pattern từ Hero áp dụng được:**

1. **Color utilities** (`colors.ts`):
   - Copy exact sang project root
   - Reuse cho tất cả components

2. **Component-specific colors** (e.g., `stats/_lib/colors.ts`):
   - Clone `hero/_lib/colors.ts`
   - Rename interface: `StatsColorScheme`, `ProductListColorScheme`, etc.
   - Adjust tint/shade values nếu cần (usually giữ nguyên)

3. **Preview component pattern**:
   - Add `mode` prop
   - Import `getBrandColors()`, `getComponentColors()`
   - Replace string concat
   - Test 2 modes

4. **Parent edit page pattern**:
   - Import `useBrandColors` hook
   - Fetch `site_brand_mode`
   - Pass to preview

**Ưu tiên migrate:**
1. ⚠️ **P0:** Partners, Blog (2 PARTIAL components)
2. 🔥 **P1-High:** Stats, ProductList, ProductCategories (3 GOOD nhưng cần chuẩn hóa)
3. 📦 **P1-Medium:** ServiceList, ProductGrid, CategoryProducts (3 GOOD)
4. 🚀 **P2:** 18 legacy components (tách khỏi legacy file trước)

---

## ⚠️ RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes cho existing users | HIGH | Add feature flag `use_new_color_system: boolean` trong settings |
| Performance hit từ color calculations | LOW | Memoize `getHeroColors()` với `useMemo()` |
| Tint/shade không đẹp như mong đợi | MEDIUM | Provide opacity presets adjustable qua constants |
| Legacy components conflict | MEDIUM | Migrate dần, không force all at once |

---

## 📊 SUCCESS METRICS

**Completion criteria:**

1. ✅ Hero component pass tất cả 5 test cases
2. ✅ Zero CSS errors trong console khi toggle mode
3. ✅ Accessibility: all contrasts ≥ required ratios
4. ✅ Code review: no hard-coded colors left
5. ✅ Documentation: boilerplate guide complete
6. ✅ Performance: no visible lag khi render

**Post-launch:**

- User feedback: màu đẹp hơn/tệ hơn?
- Usage metrics: bao nhiêu % users dùng mode='single' vs 'dual'?
- Bug reports: có CSS lỗi ở layouts nào không?

---

## 🎯 TIMELINE ESTIMATE

| Phase | Tasks | Estimate |
|-------|-------|----------|
| Phase 1 | Core utilities | 1-2 giờ |
| Phase 2 | Layout updates (6 styles) | 2-3 giờ |
| Phase 3 | Parent integration | 30 phút |
| Phase 4 | Testing (5 test cases) | 1-2 giờ |
| Phase 5 | Documentation | 1 giờ |
| **TOTAL** | **Hero Component** | **5-8 giờ** |

**Cho 29 components còn lại:**
- PARTIAL (2): 2-3 giờ
- GOOD (7): 7-10 giờ (reuse pattern)
- Legacy (18): 18-25 giờ (cần tách + refactor)
- **TOTAL ALL:** **~40-50 giờ**

---

## 💡 NEXT STEPS

1. **Approve spec này** → Start implement Hero
2. **Sau khi Hero done** → Tạo boilerplate doc
3. **Pick 1 GOOD component** (e.g., Stats) → Apply pattern → Verify reusable
4. **Pick 1 PARTIAL component** (e.g., Partners) → Fix → Test
5. **Pick 1 legacy component** (e.g., CTA) → Migrate full → Document challenges
6. **Scale to remaining components** theo priority

---

**CÂU HỎI CHO USER:**

1. Có muốn thêm **brand gradient variant** ngay từ đầu không? (toggle black vs brand)
2. Có muốn **feature flag** để users opt-in từ từ?
3. Có cần **dark mode** support cho color system không? (hiện Hero đã có `dark:` classes)
4. Ưu tiên migrate **2 PARTIAL** (nhanh) hay **18 legacy** (lâu nhưng impact lớn) trước?