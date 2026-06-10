# Spec: Fix 3 Issues cho Hero Component

## Vấn đề cần fix

1. **getHeroColors() còn dùng HSL legacy** (getTint/getShade)
2. **Preview không hiển thị rõ màu phụ** khi mode = 'dual'
3. **Save button không disable** sau khi save hoặc khi không có thay đổi

## Giải pháp (theo user preferences)

- Preview: Thêm **color swatch badges** (2 ô màu + label)
- Save button: **Track hasChanges state** (enable khi có thay đổi)
- Scope: **Chỉ fix Hero component** (không refactor global)

---

## Implementation Plan

### **Task 1: Migrate `getHeroColors()` từ HSL → OKLCH**

**File**: `app/admin/home-components/hero/_lib/colors.ts`

**Changes**:

1. **Xóa import legacy**:
   ```ts
   // REMOVE
   import { getShade, getTint } from '@/lib/utils/colors';
   ```

2. **Refactor `getHeroColors()` function** (lines 111-143):
   ```ts
   export function getHeroColors(
     primary: string,
     secondary: string,
     useDualBrand: boolean,
   ): HeroColorScheme {
     const primaryPalette = generatePalette(primary);
     const secondaryBase = useDualBrand ? secondary : primary;
     const secondaryPalette = generatePalette(secondaryBase);
     
     // OKLCH tint helpers (replace getTint)
     const getPrimaryTint = (lightness: number) => {
       const color = oklch(primary);
       return formatHex(oklch({ ...color, l: Math.min(color.l + lightness, 0.98) }));
     };
     
     const getSecondaryTint = (lightness: number) => {
       const color = oklch(secondaryBase);
       return formatHex(oklch({ ...color, l: Math.min(color.l + lightness, 0.98) }));
     };
     
     return {
       primarySolid: primary,
       primaryHover: primaryPalette.hover,
       primaryTintSubtle: getPrimaryTint(0.4),   // surface
       primaryTintLight: getPrimaryTint(0.45),
       primaryTintMedium: getPrimaryTint(0.35),
       
       secondarySolid: secondaryBase,
       secondaryTintVeryLight: getSecondaryTint(useDualBrand ? 0.45 : 0.42),
       secondaryTintLight: getSecondaryTint(useDualBrand ? 0.4 : 0.38),
       secondaryTintMedium: getSecondaryTint(useDualBrand ? 0.3 : 0.35),
       secondaryTintStrong: getSecondaryTint(useDualBrand ? 0.25 : 0.3),
       secondaryTintRing: getSecondaryTint(useDualBrand ? 0.15 : 0.25),
       
       overlayGradient: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
       brandGradient: useDualBrand
         ? `linear-gradient(135deg, ${getPrimaryTint(0.4)} 0%, ${getSecondaryTint(0.35)} 100%)`
         : `linear-gradient(135deg, ${getPrimaryTint(0.4)} 0%, ${getPrimaryTint(0.25)} 100%)`,
     };
   }
   ```

**Validation**:
- Kiểm tra các layout `fullscreen`, `split`, `parallax`, `bento` vẫn render đúng màu
- So sánh preview trước/sau refactor (màu sắc phải tương đồng)

---

### **Task 2: Thêm Color Swatch Badges trong Preview**

**File**: `app/admin/home-components/hero/_components/HeroPreview.tsx`

**Location**: Sau warning similarity (line ~526), trước image recommendation

**Code to add**:
```tsx
{/* Color Swatch Badges */}
{mode === 'dual' && (
  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400">Màu chính:</span>
        <div 
          className="w-8 h-8 rounded border-2 border-slate-300 dark:border-slate-600 shadow-sm" 
          style={{ backgroundColor: brandColor }} 
          title={brandColor}
        />
        <span className="font-mono text-slate-600 dark:text-slate-400">{brandColor}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400">Màu phụ:</span>
        <div 
          className="w-8 h-8 rounded border-2 border-slate-300 dark:border-slate-600 shadow-sm" 
          style={{ backgroundColor: secondary }} 
          title={secondary}
        />
        <span className="font-mono text-slate-600 dark:text-slate-400">{secondary}</span>
      </div>
    </div>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
      💡 Màu phụ được áp dụng cho: nav buttons, borders, badges, accents
    </p>
  </div>
)}
```

**Mobile responsive**:
```tsx
<div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
  {/* color swatches */}
</div>
```

---

### **Task 3: Track hasChanges State cho Save Button**

**File**: `app/admin/home-components/hero/[id]/edit/page.tsx`

**Changes**:

1. **Add state & helper** (sau line 29):
   ```ts
   const [hasChanges, setHasChanges] = useState(false);
   const [initialData, setInitialData] = useState<{
     title: string;
     active: boolean;
     slides: HeroSlide[];
     style: HeroStyle;
     content: HeroContent;
     harmony: HeroHarmony;
   } | null>(null);
   ```

2. **Capture initial data** trong useEffect (sau setHeroHarmony, line ~54):
   ```ts
   // Capture initial state for change tracking
   if (!initialData) {
     setInitialData({
       title: component.title,
       active: component.active,
       slides: config.slides?.map((s: any, i: number) => ({ 
         id: `slide-${i}`, 
         link: s.link || '', 
         url: s.image 
       })) ?? [{ id: 'slide-1', link: '', url: '' }],
       style: (config.style as HeroStyle) || 'slider',
       content: config.content as HeroContent || DEFAULT_HERO_CONTENT,
       harmony: (config.harmony as HeroHarmony) || 'analogous',
     });
   }
   ```

3. **Track changes** với useEffect (thêm mới):
   ```ts
   useEffect(() => {
     if (!initialData) return;
     
     const currentSlides = JSON.stringify(heroSlides);
     const initialSlides = JSON.stringify(initialData.slides);
     const currentContent = JSON.stringify(heroContent);
     const initialContent = JSON.stringify(initialData.content);
     
     const changed = 
       title !== initialData.title ||
       active !== initialData.active ||
       currentSlides !== initialSlides ||
       heroStyle !== initialData.style ||
       currentContent !== initialContent ||
       heroHarmony !== initialData.harmony;
     
     setHasChanges(changed);
   }, [title, active, heroSlides, heroStyle, heroContent, heroHarmony, initialData]);
   ```

4. **Reset hasChanges sau save** (trong handleSubmit, sau toast.success):
   ```ts
   toast.success('Đã cập nhật Hero Banner');
   
   // Reset initial data to current state
   setInitialData({
     title,
     active,
     slides: heroSlides,
     style: heroStyle,
     content: heroContent,
     harmony: heroHarmony,
   });
   setHasChanges(false);
   ```

5. **Update Button disabled** (line ~149):
   ```tsx
   <Button 
     type="submit" 
     variant="accent" 
     disabled={isSubmitting || !hasChanges}
   >
     {isSubmitting ? 'Đang lưu...' : (hasChanges ? 'Lưu thay đổi' : 'Đã lưu')}
   </Button>
   ```

---

## Testing Checklist

### Task 1: OKLCH Migration
- [ ] Chạy `bunx oxlint --type-aware --type-check --fix`
- [ ] Preview tất cả 6 layouts: slider, fade, bento, fullscreen, split, parallax
- [ ] Test với 3 màu primary khác nhau: `#3b82f6`, `#ef4444`, `#10b981`
- [ ] Test mode single vs dual
- [ ] Kiểm tra gradient trong fullscreen/split layout

### Task 2: Color Swatch
- [ ] Mode = 'single': không hiển thị swatch
- [ ] Mode = 'dual': hiển thị 2 ô màu đúng hex code
- [ ] Responsive mobile: vertical stack
- [ ] Dark mode: border colors contrast đủ

### Task 3: hasChanges
- [ ] Load page lần đầu: button disabled (text "Đã lưu")
- [ ] Thay đổi title: button enabled
- [ ] Thêm/xóa slide: button enabled
- [ ] Đổi style: button enabled
- [ ] Đổi harmony: button enabled
- [ ] Click Save: button disabled lại
- [ ] Không thay đổi gì: button vẫn disabled

---

## Commit Message

```
fix(hero): migrate colors to OKLCH + preview swatch + hasChanges tracking

- Refactor getHeroColors() from HSL (getTint/getShade) to OKLCH
- Add color swatch badges in preview for dual-brand mode
- Track hasChanges state to disable save button when no edits
- Follow dual-brand-color-system skill v5.0.0 standards
```

---

## Files Changed

1. `app/admin/home-components/hero/_lib/colors.ts` - OKLCH migration
2. `app/admin/home-components/hero/_components/HeroPreview.tsx` - color swatch UI
3. `app/admin/home-components/hero/[id]/edit/page.tsx` - hasChanges logic

**Estimated LOC**: ~120 lines changed/added