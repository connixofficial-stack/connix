
## Problem Graph

1. [Main] Gallery có áp dụng đúng Dual-Brand Color System skill chưa?
   1.1 `_lib/colors.ts` — OKLCH, APCA, resolveSecondary
   1.2 `GalleryPreview.tsx` — 60-30-10 distribution, color token usage
   1.3 `TrustBadgesPreview.tsx` — color token usage, heading rule
   1.4 `edit/page.tsx` — validation pattern, dirty-state, save button

---

## Đối chiếu với Hero/Stats (đã chuẩn)

### ✅ Điểm Gallery làm đúng

| Hạng mục | Gallery | Hero/Stats |
|---|---|---|
| OKLCH only | ✅ dùng `oklch` + `formatHex` | ✅ |
| `safeParseOklch` | ✅ có | ✅ |
| `getAPCATextColor` | ✅ có | ✅ |
| `resolveSecondaryForMode` | ✅ `mode='single'` → return primary | ✅ |
| Harmony validation chỉ khi `dual` | ✅ `if (mode === 'dual' && harmonyStatus.isTooSimilar)` | ✅ |
| Save disabled khi pristine | ✅ `disabled={isSubmitting \|\| !hasChanges}` | ✅ |
| Reset `hasChanges` sau save | ✅ | ✅ |
| `clampLightness` | ✅ | ✅ |

---

## ROOT CAUSE — Các lỗi cần fix

### RC-1: `heading` token dùng `primary` nhưng `SectionHeader` trong TrustBadgesPreview lại có `style={{ color: colors.heading }}` — chuẩn ✅
Nhưng `heading` trong `getGalleryColorTokens` được set = `primaryResolved` → **đúng**.

### RC-2: `subheading` token = `secondaryResolved` — vi phạm Element-Level Color Rules

**Skill rule:** *"Section label/subtitle → secondary; Card title text/name → secondary"*  
**Nhưng** trong TrustBadgesPreview, `colors.subheading` được dùng cho:
- `renderCardsStyle`: card item name text → `colors.subheading` ✅ (secondary)
- `renderWallStyle`: item name text → `colors.subheading` ✅
- `renderFeaturedStyle`: `featuredItem.name` text → `colors.heading` ✅, other item names không có màu brand

**Nhưng vấn đề**: trong `renderCarouselStyle`, các pagination dot dùng:
```tsx
backgroundColor: carouselIndex === idx ? colors.subheading : colors.badgeBorder
```
`colors.badgeBorder` = `accentBorder` = `getSolidTint(secondaryResolved, 0.3)` — đây là tint của secondary làm dot inactive. Đây là **borderOpacity** chứ không phải solid. Theo Anti Opacity Rule v11.2: cần solid color, không dùng opacity-based tint làm dot.

### RC-3: `heroColors` trong `_lib/colors.ts` có `resolveSecondaryColor` vi phạm Single Mode Rule (BIG BUG)

```typescript
// hero/colors.ts - resolveSecondaryColor
const resolveSecondaryColor = (primary, secondary, mode, harmony) => {
  if (mode === 'single') {
    if (harmony === 'complementary') return getComplementary(primary);  // ❌ VI PHẠM
    if (harmony === 'triadic') return getTriadic(primary)[0];           // ❌ VI PHẠM
    return getAnalogous(primary)[0];                                    // ❌ VI PHẠM
  }
  return secondary;
};
```

Skill v11.4 STRICT: **Single mode PHẢI return primary**, không tạo harmony color. Hero đang vi phạm!

> Nhưng task yêu cầu review Gallery — nên Hero bug này chỉ ghi nhận, không thuộc scope Gallery review.

### RC-4: `GalleryPreview.tsx` — Style 1/2/3 (Spotlight, Explore, Stories) không dùng `colors` token cho placeholder

```tsx
// Spotlight/Explore/Stories empty state
<ImageIcon size={48} className="opacity-20 mb-4" />
```
- Dùng `opacity-20` là **vi phạm Anti Opacity Rule v11.2**
- Empty state icon không dùng `colors.placeholderIcon` (primary)
- Style 4/5/6 (Grid, Marquee, Masonry) đã dùng đúng `renderGalleryEmptyState()` với `colors.placeholderIcon`

**Root cause**: 3 styles đầu có empty state riêng không dùng `colors` token.

### RC-5: `GalleryPreview.tsx` — `renderStoriesStyle` dùng class `grayscale-[15%]`

```tsx
className="...grayscale-[15%] group-hover:grayscale-0 transition-all duration-700"
```
- `grayscale` + `transition-all duration-700` = **animation decorative phức tạp**, vi phạm Anti AI-Styling
- Skill: "Transitions chỉ 150-300ms, chỉ cho state changes thật sự", "NO hover effects phức tạp"

### RC-6: `GalleryPreview.tsx` — `renderSpotlightStyle` dùng `group-hover:scale-105` trên ảnh

```tsx
className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
```
- **`duration-700` quá lâu** (skill: 150-300ms)
- Skill: "NO group-hover:scale-105 trên text/numbers" → trên ảnh cũng nên cẩn thận với scale-105 nếu dùng trong gallery context (nhưng trên ảnh thì có thể chấp nhận hơn)

### RC-7: `TrustBadgesPreview.tsx` — `renderGridStyle` dùng `opacity-0 group-hover:opacity-100` trên icon overlay

```tsx
<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
```
- Đây là hover effect phức tạp, nhưng chỉ dành cho icon nhỏ (zoom indicator) → có thể chấp nhận vì functional
- Tương tự `renderCardsStyle` có overlay hover → `opacity-0 group-hover:opacity-100`

### RC-8: `edit/page.tsx` — Save button label thiếu trạng thái "Đã lưu"

**Stats pattern (chuẩn):**
```tsx
{isSubmitting ? 'Đang lưu...' : (hasChanges ? 'Lưu thay đổi' : 'Đã lưu')}
```

**Gallery pattern (thiếu):**
```tsx
{isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
```
- Vi phạm S3: "Label chuẩn: `Đang lưu...` / `Lưu thay đổi` / `Đã lưu`"
- Khi `hasChanges=false`, button disabled nhưng text vẫn là "Lưu thay đổi" thay vì "Đã lưu"

### RC-9: `getGalleryColorTokens` — `badgeText` dùng `badgeBg` làm background nhưng `badgeBg` = secondary tint

```typescript
badgeBg: secondaryTint,  // getSolidTint(secondaryResolved, 0.42)
badgeText: getAPCATextColor(secondaryTint, 12, 600),
```
- `badgeText` với `fontSize=12, fontWeight=600` → threshold = 45 (vì weight >= 600)
- Nhưng `getAPCAThreshold(12, 600)` trả về: `(12 >= 18 || 600 >= 700) ? 45 : 60` → **60** (vì 12 < 18 và 600 < 700)
- **BUG**: badge text 12px/600 → threshold phải là **60**, nhưng skill APCA rule nói "fontWeight >= 600 → threshold = 45 (bold)" → mâu thuẫn với implementation

Kiểm tra lại skill: "APCA threshold: fontWeight >= 600 → threshold = 45 (bold)"  
Implementation: `(fontSize >= 18 || fontWeight >= 700) ? 45 : 60`  
→ **Mismatch**: skill bảo `>= 600` dùng 45, code dùng `>= 700`. Cần check Hero/Stats dùng rule nào:

Stats dùng: `(fontSize >= 18 || fontWeight >= 700) ? 45 : 60` — Stats không check `600`.

Gallery copy từ Stats nên dùng `>= 700`. Nhưng checklist ghi `>= 600`. Đây là inconsistency trong skill/checklist — không phải Gallery lỗi riêng.

### RC-10: `resolveSecondaryForMode` trong Gallery — khi `mode='dual'` mà `secondary` hợp lệ, không fallback qua harmony

```typescript
if (isValidHexColor(secondary)) {
  return normalizeHex(secondary, normalizedPrimary);
}
return getHarmonyColor(normalizedPrimary, harmony);
```
Đây là **đúng chuẩn** theo skill. ✅

---

## Tổng kết Root Causes theo mức độ nghiêm trọng

| # | Root Cause | Severity | File | Vi phạm rule |
|---|---|---|---|---|
| **RC-4** | Empty state styles 1-2-3 không dùng `colors` token + dùng `opacity-20` | 🔴 High | `GalleryPreview.tsx` | Anti Opacity Rule v11.2, Single Source of Truth |
| **RC-8** | Save button thiếu label "Đã lưu" khi pristine | 🟠 Medium | `edit/page.tsx` | S3 dirty-state parity |
| **RC-5** | `renderStoriesStyle` dùng `grayscale + duration-700` | 🟠 Medium | `GalleryPreview.tsx` | Anti AI-Styling: no complex hover, 150-300ms |
| **RC-6** | `renderSpotlightStyle/ExploreStyle/etc` dùng `duration-700` | 🟡 Low | `GalleryPreview.tsx` | Transitions chỉ 150-300ms |
| **RC-7** | `renderCarouselStyle` pagination dot inactive dùng `colors.badgeBorder` (tint, không solid) | 🟡 Low | `TrustBadgesPreview.tsx` | Anti Opacity Rule: badge bg/border phải solid |

> **Note**: Hero có RC-3 (single mode vi phạm) nhưng đó là lỗi của Hero, không phải Gallery. Gallery's `resolveSecondaryForMode` đã chuẩn — trả `primary` trong single mode.

---

## Summary điểm Gallery đã OK

- ✅ `_lib/colors.ts`: OKLCH, APCA, safeParseOklch, clampLightness
- ✅ `resolveSecondaryForMode`: single mode → primary (monochromatic)
- ✅ Harmony validation chỉ khi dual mode
- ✅ Accessibility pairs check
- ✅ `hasChanges` dirty state tracking
- ✅ `heading` token = primary (heading h2 dùng đúng brandColor)
- ✅ `placeholderBg` neutral, `placeholderIcon` = primary
- ✅ Badge bg solid tint (không opacity)

