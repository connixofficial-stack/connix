# Spec: Áp dụng Dual Brand Color System cho 5 Hero Layouts

## Tổng quan
Áp dụng **dual-brand color system** (OKLCH + APCA + Color Harmony) cho 5 layouts Hero còn lại (Fade, Bento, Fullscreen, Split, Parallax) theo pattern **Slider** đã implement.

## Files thay đổi
1. `app/admin/home-components/hero/_lib/colors.ts` - Thêm 5 color helpers
2. `app/admin/home-components/hero/_components/HeroPreview.tsx` - Refactor 5 render functions

---

## Chi tiết implementation

### 1. Tạo 5 color helpers trong `_lib/colors.ts`

Mỗi helper theo signature:
```ts
function get[Layout]Colors(
  primary: string,
  secondary: string,
  mode: 'single' | 'dual',
  harmony: HeroHarmony = 'analogous'
): [Layout]ColorScheme
```

#### 1.1 `getFadeColors()` 
```ts
export interface FadeColorScheme {
  thumbnailBorderActive: string;      // secondary.solid
  thumbnailBorderInactive: string;    // transparent
  placeholderBg: string;              // primary tint +0.4
  placeholderIconColor: string;       // primary.solid
  similarity: number;
}
```

#### 1.2 `getBentoColors()`
```ts
export interface BentoColorScheme {
  mainImageRing: string;              // secondary tint +0.35
  gridTint1: string;                  // primary tint +0.4 (main)
  gridTint2: string;                  // primary tint +0.35
  gridTint3: string;                  // primary tint +0.3
  gridTint4: string;                  // primary tint +0.25
  placeholderIcon: string;            // primary.solid
  similarity: number;
}
```

#### 1.3 `getFullscreenColors()`
```ts
export interface FullscreenColorScheme {
  badgeBg: string;                    // secondary tint +0.3
  badgeText: string;                  // secondary.solid
  badgeDotPulse: string;              // primary.solid
  primaryCTA: string;                 // primary.solid
  primaryCTAText: string;             // APCA text
  dotActive: string;                  // primary.solid
  dotInactive: string;                // white/50
  placeholderBg: string;              // primary tint +0.35
  placeholderIcon: string;            // primary.solid
  similarity: number;
}
```

#### 1.4 `getSplitColors()`
```ts
export interface SplitColorScheme {
  badgeBg: string;                    // secondary tint +0.4
  badgeText: string;                  // secondary.solid
  primaryCTA: string;                 // primary.solid
  primaryCTAText: string;             // APCA text
  navButtonIcon: string;              // secondary.solid
  navButtonBg: string;                // white/90
  progressDotActive: string;          // primary.solid
  progressDotInactive: string;        // slate-300
  similarity: number;
}
```

#### 1.5 `getParallaxColors()`
```ts
export interface ParallaxColorScheme {
  cardBadgeBg: string;                // secondary tint +0.4
  cardBadgeText: string;              // secondary.solid
  cardBadgeDot: string;               // primary.solid (pulse)
  primaryCTA: string;                 // primary.solid
  primaryCTAText: string;             // APCA text
  navButtonBg: string;                // white/20
  navButtonIcon: string;              // white
  placeholderBg: string;              // primary tint +0.35
  placeholderIcon: string;            // primary.solid
  similarity: number;
}
```

**Tất cả helpers**:
- Áp dụng harmony nếu `mode === 'single'`
- Tính `similarity` giống `getSliderColors()`
- Dùng `generatePalette()` và `getAPCATextColor()`

---

### 2. Refactor `HeroPreview.tsx`

#### 2.1 Import helpers
```ts
import { 
  getHeroColors, getSliderColors,
  getFadeColors, getBentoColors, getFullscreenColors, getSplitColors, getParallaxColors
} from '../_lib/colors';
```

#### 2.2 Khai báo colors trong component
```ts
const fadeColors = getFadeColors(brandColors.primary, brandColors.secondary, mode, harmony);
const bentoColors = getBentoColors(brandColors.primary, brandColors.secondary, mode, harmony);
const fullscreenColors = getFullscreenColors(brandColors.primary, brandColors.secondary, mode, harmony);
const splitColors = getSplitColors(brandColors.primary, brandColors.secondary, mode, harmony);
const parallaxColors = getParallaxColors(brandColors.primary, brandColors.secondary, mode, harmony);
```

#### 2.3 Refactor từng render function

**renderFadeStyle():**
- Line ~158: `style={{ borderColor: colors.secondarySolid }}` → `fadeColors.thumbnailBorderActive`
- Line ~159: `style={{ backgroundColor: colors.primarySolid }}` → `fadeColors.placeholderBg`
- Placeholder: Dùng `fadeColors.placeholderBg` + `fadeColors.placeholderIconColor`

**renderBentoStyle():**
- Line ~178-182: `mobileBentoTints` → Dùng `bentoColors.gridTint[1-4]`
- Line ~197: `ring` color → `bentoColors.mainImageRing`
- Line ~207: `primaryTintLight` → `bentoColors.gridTint1`
- Line ~207: Icon color → `bentoColors.placeholderIcon`
- Lines ~218/231/245: Tints → `bentoColors.gridTint[2-4]`

**renderFullscreenStyle():**
- Line ~285: Badge bg → `fullscreenColors.badgeBg`, text → `fullscreenColors.badgeText`
- Line ~286: Dot → `fullscreenColors.badgeDotPulse`
- Line ~297: CTA bg → `fullscreenColors.primaryCTA`
- Line ~315: Dot active → `fullscreenColors.dotActive`
- Placeholder: Dùng `fullscreenColors.placeholderBg` + icon color

**renderSplitStyle():**
- Line ~347: Badge bg → `splitColors.badgeBg`, text → `splitColors.badgeText`
- Line ~360: CTA → `splitColors.primaryCTA`
- Line ~378: Nav icon → `splitColors.navButtonIcon`
- Line ~388: Progress dot → `splitColors.progressDotActive`
- Placeholder: Background solid color

**renderParallaxStyle():**
- Line ~445: Badge bg → `parallaxColors.cardBadgeBg`, text → `parallaxColors.cardBadgeText`
- Line ~447: Dot → `parallaxColors.cardBadgeDot`
- Line ~456: CTA → `parallaxColors.primaryCTA`
- Line ~476: Nav buttons → `parallaxColors.navButtonBg` + icon white
- Placeholder: Dùng `parallaxColors.placeholderBg`

---

### 3. Similarity warnings

Thêm warning blocks giống Slider (sau return của HeroPreview):

```tsx
{previewStyle === 'fade' && mode === 'dual' && fadeColors.similarity > 0.9 && (
  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 ...">
    ⚠️ Hai màu quá giống nhau (similarity: {(fadeColors.similarity * 100).toFixed(0)}%)...
  </div>
)}
```

Lặp lại cho: `bento`, `fullscreen`, `split`, `parallax`.

---

### 4. Color swatch preview

Di chuyển đoạn `mode === 'dual'` color swatch (lines ~530-551) ra khỏi block `previewStyle === 'slider'` để hiển thị cho **tất cả layouts**.

---

### 5. Validation checklist

Sau khi implement:
- [ ] Tất cả 5 layouts compile không lỗi TS
- [ ] Test với 3 primary colors khác nhau
- [ ] Test với 2 secondary colors khác nhau  
- [ ] Test cả 3 harmony modes (analogous, complementary, triadic)
- [ ] Similarity warning xuất hiện khi primary ≈ secondary
- [ ] APCA contrast đủ cho text on CTA buttons
- [ ] Color swatch hiển thị cho tất cả layouts

---

## Expected outcome

- Hero component có **full dual-brand color system** cho cả 6 layouts
- Mỗi layout có color helper riêng, dễ maintain
- User có thể chọn harmony mode cho mọi layout
- Tất cả màu tuân thủ OKLCH + APCA + Color Harmony rules
- Hero component trở thành **reference implementation** cho các home-components khác