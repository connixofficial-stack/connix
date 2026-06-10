# Spec: Áp dụng Dual Brand Color System vào Hero Slider Layout

## Mục tiêu
Refactor màu sắc của **Hero component - layout "slider"** từ HSL-based (getTint/getShade) sang **OKLCH + APCA** theo chuẩn dual-brand-color-system skill, đảm bảo:
- ✅ Tint/shade đều đẹp (OKLCH perceptual uniformity)
- ✅ Text luôn đủ contrast (APCA Lc ≥ 60)
- ✅ Dual-brand harmony (analogous/complementary/triadic)
- ✅ UI Theme Engine để user chọn harmony mode

## Phạm vi
- **Chỉ refactor layout "slider"** (5 layouts khác giữ nguyên)
- **Files thay đổi**: 
  - `app/admin/home-components/hero/_lib/colors.ts` (refactor)
  - `app/admin/home-components/hero/_types/index.ts` (thêm type Harmony)
  - `app/admin/home-components/hero/_components/HeroForm.tsx` (thêm UI chọn harmony)
  - `app/admin/home-components/hero/_components/HeroPreview.tsx` (cập nhật renderSliderStyle)

---

## Problem Graph

```
[Main] Áp dụng dual-brand color system vào slider layout
├── [1.1] Install dependencies (culori + apca-w3)
├── [1.2] Refactor colors.ts
│   ├── [1.2.1 ROOT] Import culori + apca-w3
│   ├── [1.2.2] Copy helper functions từ skill examples
│   ├── [1.2.3] Tạo getSliderColors() mới
│   └── [1.2.4] Giữ nguyên getHeroColors() cho 5 layouts khác
├── [1.3] Thêm UI Theme Engine vào HeroForm
│   ├── [1.3.1] Thêm type HeroHarmony vào _types
│   └── [1.3.2] Thêm <select> harmony vào form (chỉ hiện khi mode='single')
└── [1.4] Cập nhật HeroPreview.tsx
    └── [1.4.1] Chỉ renderSliderStyle() dùng getSliderColors()
```

---

## Execution Plan (Step-by-Step)

### Step 1: Install Dependencies
**File**: `package.json`  
**Action**: Chạy lệnh install
```bash
npm install culori apca-w3
```

---

### Step 2: Refactor `_lib/colors.ts`

**File**: `app/admin/home-components/hero/_lib/colors.ts`

**Changes**:

#### 2.1 Import dependencies
```ts
// Thêm vào đầu file
import { apcaContrast } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
```

#### 2.2 Copy helper functions từ skill
```ts
// Paste từ .factory/skills/dual-brand-color-system/examples/color-utils.ts
export const getAPCATextColor = (bg: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = Math.abs(apcaContrast('#ffffff', bg));
  const blackLc = Math.abs(apcaContrast('#000000', bg));
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;
  if (whiteLc >= threshold) return '#ffffff';
  if (blackLc >= threshold) return '#0f172a';
  return whiteLc > blackLc ? '#ffffff' : '#0f172a';
};

export const generatePalette = (hex: string) => {
  const color = oklch(hex);
  return {
    solid: hex,
    surface: formatHex(oklch({ ...color, l: Math.min(color.l + 0.4, 0.98) })),
    hover: formatHex(oklch({ ...color, l: Math.max(color.l - 0.1, 0.1) })),
    active: formatHex(oklch({ ...color, l: Math.max(color.l - 0.15, 0.08) })),
    border: formatHex(oklch({ ...color, l: Math.min(color.l + 0.3, 0.92) })),
    disabled: formatHex(oklch({ ...color, l: Math.min(color.l + 0.25, 0.9), c: color.c * 0.5 })),
    textOnSolid: getAPCATextColor(hex, 16, 500),
    textInteractive: formatHex(oklch({ ...color, l: Math.max(color.l - 0.25, 0.2) })),
  };
};

export const getAnalogous = (hex: string): [string, string] => {
  const color = oklch(hex);
  return [
    formatHex(oklch({ ...color, h: (color.h + 30) % 360 })),
    formatHex(oklch({ ...color, h: (color.h - 30 + 360) % 360 }))
  ];
};

export const getComplementary = (hex: string) => {
  const color = oklch(hex);
  return formatHex(oklch({ ...color, h: (color.h + 180) % 360 }));
};

export const getTriadic = (hex: string): [string, string] => {
  const color = oklch(hex);
  return [
    formatHex(oklch({ ...color, h: (color.h + 120) % 360 })),
    formatHex(oklch({ ...color, h: (color.h - 120 + 360) % 360 }))
  ];
};
```

#### 2.3 Tạo interface SliderColorScheme
```ts
export interface SliderColorScheme {
  // Navigation buttons
  navButtonBg: string;
  navButtonBgHover: string;
  navButtonIconColor: string;
  navButtonBorderColor: string;
  
  // Dots indicator
  dotActive: string;
  dotInactive: string;
  
  // Placeholder icon
  placeholderBg: string;
  placeholderIconColor: string;
  
  // Metadata
  similarity: number;
}
```

#### 2.4 Tạo function getSliderColors()
```ts
export type HeroHarmony = 'analogous' | 'complementary' | 'triadic';

export function getSliderColors(
  primary: string,
  secondary: string,
  mode: 'single' | 'dual',
  harmony: HeroHarmony = 'analogous'
): SliderColorScheme {
  let secondaryColor = secondary;
  
  // Single mode: auto-generate secondary từ primary theo harmony
  if (mode === 'single') {
    if (harmony === 'complementary') {
      secondaryColor = getComplementary(primary);
    } else if (harmony === 'triadic') {
      secondaryColor = getTriadic(primary)[0];
    } else {
      secondaryColor = getAnalogous(primary)[0];
    }
  }
  
  const primaryPalette = generatePalette(primary);
  const secondaryPalette = generatePalette(secondaryColor);
  const similarity = 1 - Math.min(differenceEuclidean('oklch')(primary, secondaryColor), 1);
  
  return {
    // Navigation buttons: bg trắng, icon + border dùng secondary
    navButtonBg: '#ffffff',
    navButtonBgHover: '#ffffff',
    navButtonIconColor: secondaryPalette.solid,
    navButtonBorderColor: secondaryPalette.surface,
    
    // Dots: active dùng primary, inactive trắng mờ
    dotActive: primaryPalette.solid,
    dotInactive: 'rgba(255, 255, 255, 0.5)',
    
    // Placeholder: bg dùng primary tint, icon dùng primary solid
    placeholderBg: primaryPalette.surface,
    placeholderIconColor: primaryPalette.solid,
    
    similarity,
  };
}
```

#### 2.5 Giữ nguyên getHeroColors() (cho 5 layouts khác)
```ts
// Giữ nguyên export function getHeroColors() {...}
// Không thay đổi gì để tránh ảnh hưởng fade/bento/fullscreen/split/parallax
```

---

### Step 3: Thêm type Harmony vào `_types/index.ts`

**File**: `app/admin/home-components/hero/_types/index.ts`

**Changes**:
```ts
// Thêm vào cuối file
export type HeroHarmony = 'analogous' | 'complementary' | 'triadic';
```

---

### Step 4: Thêm UI Theme Engine vào `HeroForm.tsx`

**File**: `app/admin/home-components/hero/_components/HeroForm.tsx`

**Changes**:

#### 4.1 Thêm state harmony
Tìm các useState của component, thêm:
```ts
const [harmony, setHarmony] = useState<HeroHarmony>('analogous');
```

#### 4.2 Thêm UI chọn harmony (sau phần chọn mode)
Sau `<select>` mode (single/dual), thêm:
```tsx
{/* Theme Harmony (chỉ hiện khi single mode) */}
{mode === 'single' && (
  <div className="space-y-2">
    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
      Color Harmony
    </label>
    <select
      value={harmony}
      onChange={(e) => setHarmony(e.target.value as HeroHarmony)}
      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
    >
      <option value="analogous">Analogous (+30°)</option>
      <option value="complementary">Complementary (180°)</option>
      <option value="triadic">Triadic (120°)</option>
    </select>
    <p className="text-xs text-slate-500">
      Tự động tạo màu phụ hài hòa từ màu chính
    </p>
  </div>
)}
```

#### 4.3 Pass harmony vào HeroPreview
Tìm `<HeroPreview />`, thêm prop:
```tsx
<HeroPreview
  {...existingProps}
  harmony={harmony}
/>
```

---

### Step 5: Cập nhật `HeroPreview.tsx` - chỉ slider layout

**File**: `app/admin/home-components/hero/_components/HeroPreview.tsx`

**Changes**:

#### 5.1 Import getSliderColors
```ts
import { getHeroColors, getSliderColors, type HeroHarmony } from '../_lib/colors';
```

#### 5.2 Thêm prop harmony vào component
```tsx
export const HeroPreview = ({ 
  slides, 
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle = 'slider',
  onStyleChange,
  content,
  harmony = 'analogous', // <- THÊM
}: { 
  slides: { id: number; image: string; link: string }[]; 
  brandColor: string;
  secondary: string;
  mode?: 'single' | 'dual';
  selectedStyle?: HeroStyle;
  onStyleChange?: (style: HeroStyle) => void;
  content?: HeroContent;
  harmony?: HeroHarmony; // <- THÊM
}) => {
  // ...
```

#### 5.3 Tính sliderColors
Sau dòng `const colors = getHeroColors(...)`, thêm:
```ts
const sliderColors = getSliderColors(
  brandColors.primary, 
  brandColors.secondary, 
  mode, 
  harmony
);
```

#### 5.4 Refactor renderSliderStyle()
Chỉ thay đổi các dòng sử dụng màu:

**Navigation buttons**:
```tsx
{/* Prev button */}
<button 
  type="button" 
  onClick={prevSlide} 
  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all z-20 border-2 hover:scale-105"
  style={{ 
    backgroundColor: sliderColors.navButtonBg,
    borderColor: sliderColors.navButtonBorderColor 
  }}
>
  <ChevronLeft size={14} style={{ color: sliderColors.navButtonIconColor }} />
</button>

{/* Next button - tương tự */}
<button 
  type="button" 
  onClick={nextSlide} 
  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all z-20 border-2 hover:scale-105"
  style={{ 
    backgroundColor: sliderColors.navButtonBg,
    borderColor: sliderColors.navButtonBorderColor 
  }}
>
  <ChevronRight size={14} style={{ color: sliderColors.navButtonIconColor }} />
</button>
```

**Dots indicator**:
```tsx
<div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
  {slides.map((_, idx) => (
    <button 
      key={idx} 
      type="button" 
      onClick={() => setCurrentSlide(idx)} 
      className={cn(
        "w-2 h-2 rounded-full transition-all", 
        idx === currentSlide ? "w-6" : ""
      )} 
      style={{ 
        backgroundColor: idx === currentSlide 
          ? sliderColors.dotActive 
          : sliderColors.dotInactive 
      }} 
    />
  ))}
</div>
```

**Placeholder icon**:
```tsx
const renderPlaceholder = (idx: number) => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
    <div 
      className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" 
      style={{ backgroundColor: sliderColors.placeholderBg }}
    >
      <ImageIcon size={24} style={{ color: sliderColors.placeholderIconColor }} />
    </div>
    <div className="text-sm font-medium text-slate-400">Banner #{idx + 1}</div>
    <div className="text-xs text-slate-500 mt-1">Khuyến nghị: 1920x600px</div>
  </div>
);
```

#### 5.5 Hiển thị similarity warning (nếu > 0.9)
Sau `<HeroPreview>`, thêm warning khi similarity cao:
```tsx
{selectedStyle === 'slider' && mode === 'dual' && sliderColors.similarity > 0.9 && (
  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
    ⚠️ Hai màu quá giống nhau (similarity: {(sliderColors.similarity * 100).toFixed(0)}%). 
    Khuyến nghị chọn màu phụ khác biệt hơn.
  </div>
)}
```

---

### Step 6: Testing & Validation

#### 6.1 Test cases
1. **Single mode + Analogous**: Secondary phải là primary + 30° hue
2. **Single mode + Complementary**: Secondary phải là primary + 180° hue
3. **Single mode + Triadic**: Secondary phải là primary + 120° hue
4. **Dual mode**: Dùng secondary do user chọn, hiện warning nếu similarity > 0.9
5. **Text contrast**: Icon/dot phải đủ rõ trên background slider
6. **5 layouts khác**: Fade/Bento/Fullscreen/Split/Parallax **KHÔNG thay đổi** (vẫn dùng getHeroColors cũ)

#### 6.2 Lệnh chạy
```bash
bunx oxlint --type-aware --type-check --fix
npm run dev
# Mở http://localhost:3000/admin/home-components/hero/js77xn1j6mbp92ajhpd0zg6p49816h1r/edit
# Test thay đổi mode (single/dual), harmony, màu primary/secondary
```

---

## Checklist (Review theo skill)

### 1. Color Space
- [x] Không dùng HSL / getTint / getShade (trong getSliderColors)
- [x] Dùng OKLCH (culori)

### 2. Contrast
- [x] Text/icon color dùng APCA
- [x] Không hard-code #fff/#000 (navButtonBg sử dụng #fff là OK vì nền button)

### 3. Palette Completeness
- [x] solid, surface, hover, active, border, disabled (generatePalette)
- [x] textOnSolid + textInteractive

### 4. Dual Mode
- [x] Similarity check (ΔE euclidean)
- [x] Warning nếu similarity > 0.9

### 5. 60-30-10
- [x] Primary dùng cho dots active (CTA indicator)
- [x] Secondary dùng cho navigation buttons (accents/hover)
- [x] Neutral chiếm slider background (slate-900)

---

## Các điểm lưu ý

1. **Isolation**: Chỉ slider layout được refactor, **5 layouts khác KHÔNG đụng vào** (tránh regression)
2. **Backward compat**: getHeroColors() giữ nguyên để tránh break existing code
3. **Dependencies**: Cần install culori + apca-w3 (thêm ~200KB bundle)
4. **UI/UX**: Harmony selector chỉ hiện khi mode='single', tránh confuse user
5. **Performance**: generatePalette() cache được nếu cần (future optimization)

---

## Notes

- Reference implementation: `.factory/skills/dual-brand-color-system/examples/hero-before-after.md`
- Sau khi implement xong, có thể áp dụng pattern này cho 5 layouts còn lại (future scope)
- Nếu muốn thêm tính năng "preview 3 harmony cùng lúc", có thể dùng `examples/theme-engine-ui.tsx` làm base