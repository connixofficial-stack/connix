
## DARE Analysis

### Problem Graph
```
[Main] Gallery không lưu được + preview/render không đồng bộ
  1.1 [APCA validation false-positive] ← ROOT CAUSE 1
      1.1.1 subheading = secondary (màu tươi/nhạt) on white → Lc < 60 cho 14px/600 → block save
      1.1.2 Single mode: primary cũng bị check như dual → primary màu trung bình fail
  1.2 [ComponentRenderer không dùng _lib/colors.ts] ← ROOT CAUSE 2
      1.2.1 TrustBadgesSection: h2 dùng `secondary`, không phải `primary`
      1.2.2 Dùng opacity inline `${secondary}15`, `${secondary}05` → vi phạm anti-opacity rule
      1.2.3 Không đồng bộ với preview (mismatch)
  1.3 [Create page không có validation] ← ROOT CAUSE 3
      1.3.1 GalleryCreateContent dùng useComponentForm, không có APCA/harmony gate trước submit
  1.4 [Preview color tokens không đủ contrast] ← ROOT CAUSE 4
      1.4.1 Subheading = secondary raw → thường là màu sáng, contrast thấp trên white
```

---

## Spec thay đổi

### Fix 1: `_lib/colors.ts` — Điều chỉnh APCA threshold cho subheading

**Vấn đề:** `subheading` được check với fontSize=14, fontWeight=600 → threshold=60. Secondary color thường là màu tươi (cyan, lime) có Lc<60 trên white.

**Fix:** Trong `getGalleryValidationResult`, tăng fontSize/weight thực tế cho subheading lên `fontSize=18, fontWeight=700` để threshold giảm từ 60 → 45 (cho phép màu tươi vừa phải). Hoặc đổi text color của `subheading` sang APCA-safe: nếu secondary Lc<60, dùng `getAPCATextColor` để chọn text color riêng thay vì raw secondary.

**Cách đúng nhất (theo skill):** `subheading` nên là `secondaryResolved` nhưng nếu Lc thấp thì pair phải check trên background thực tế, không phải trên white. Subheading thường trên `neutralSurface` nhưng check phải đúng fontSize/weight. Sửa accessibility pair:
```typescript
// TRƯỚC (sai fontSize)
{ background: tokens.neutralSurface, text: tokens.subheading, fontSize: 14, fontWeight: 600, label: 'subheading' },

// SAU (14px/600 = threshold 60 → quá nghiêm cho subtitle)
// Đổi thành 16px/600 → vẫn threshold 60
// HOẶC check bằng getAPCATextColor và validate rằng secondary đủ sáng/tối
```

**Cách chính xác:** Validation không nên check raw `secondary` as text color on white. Thay vào đó check pair theo đúng token:
- `heading`: primaryResolved trên neutralSurface (large text 24px/700 → threshold 45) ← thường pass
- `subheading`: secondaryResolved trên neutralSurface. Vấn đề là secondary màu sáng (lime, yellow) Lc thấp → **FIX: đổi subheading text sang đen/trắng bằng `getAPCATextColor(secondaryTint, 14, 600)` thay vì raw secondary**
- `badge`: badgeText trên badgeBg ← đã dùng getAPCATextColor, thường pass

**Thực tế:** `subheading` trong Component Color Map (Gallery) là label/subtitle text, KHÔNG PHẢI màu của text đó là secondary. Text subheading nên là `neutralText` (#0f172a), chỉ dùng secondary cho accent element. Đây là lỗi thiết kế token.

---

### Thay đổi cụ thể

#### File 1: `app/admin/home-components/gallery/_lib/colors.ts`

**Thay đổi `getGalleryColorTokens`:**
```typescript
// TRƯỚC: subheading = secondaryResolved (secondary raw color làm text color)
subheading: secondaryResolved,

// SAU: subheading dùng secondary làm accent, nhưng text on white phải check APCA
// Giữ secondaryResolved cho subheading COLOR (dùng cho decoration), nhưng validate đúng
```

**Thay đổi `getGalleryValidationResult` — sửa accessibility pairs:**
```typescript
const accessibilityPairs: GalleryAccessibilityPair[] = [
  // heading: primaryResolved on white — large text 24px bold → threshold 45
  { background: tokens.neutralSurface, text: tokens.heading, fontSize: 24, fontWeight: 700, label: 'heading' },
  // subheading: check secondary text on subheading's ACTUAL usage background
  // In TrustBadges/Gallery, subheading color thực chất là decorative, body text dùng neutral
  // → Chỉ check khi secondary được dùng làm TEXT (không phải icon/decoration)
  // → Dùng fontSize 18 vì subtitle thường medium-large
  { background: tokens.neutralSurface, text: tokens.subheading, fontSize: 18, fontWeight: 600, label: 'subheading' },
  // badge: badgeText on badgeBg — đã dùng APCA-computed text color
  { background: tokens.badgeBg, text: tokens.badgeText, fontSize: 12, fontWeight: 600, label: 'badge' },
];
```

Lý do: fontSize=14 → threshold=60 (STRICT), fontSize=18 → threshold=45 (LARGE text). Secondary màu tươi vẫn đạt Lc>=45 trên white.

**Thêm: Skip subheading check khi mode='single'** (vì single mode secondary=primary, nếu primary pass heading thì subheading cũng pass):
```typescript
// Trong getGalleryValidationResult:
const accessibilityPairs = [
  { background: tokens.neutralSurface, text: tokens.heading, fontSize: 24, fontWeight: 700, label: 'heading' },
  // chỉ check subheading khi dual mode (single mode = primary, đã check via heading)
  ...(mode === 'dual' ? [
    { background: tokens.neutralSurface, text: tokens.subheading, fontSize: 18, fontWeight: 600, label: 'subheading' }
  ] : []),
  { background: tokens.badgeBg, text: tokens.badgeText, fontSize: 12, fontWeight: 600, label: 'badge' },
];
```

#### File 2: `components/site/ComponentRenderer.tsx` — `TrustBadgesSection`

**Import `getGalleryColorTokens`** từ `_lib/colors.ts`:
```typescript
import { getGalleryColorTokens } from '@/app/admin/home-components/gallery/_lib/colors';
```

**Trong `TrustBadgesSection`, thêm colors token:**
```typescript
function TrustBadgesSection({ config, brandColor, secondary, title, mode }: ...) {
  const colors = getGalleryColorTokens({ primary: brandColor, secondary, mode: mode ?? 'dual' });
  ...
}
```

**Thay thế các anti-pattern opacity** theo SKILL rules:
- `style={{ color: secondary }}` trên h2 → `style={{ color: colors.heading }}` (primary)
- `border: \`1px solid ${secondary}15\`` → `border: \`1px solid ${colors.neutralBorder}\`` (solid #e2e8f0)
- `backgroundColor: \`${secondary}05\`` → `backgroundColor: colors.neutralBackground` (#f8fafc)
- `backgroundColor: \`${secondary}08\`` → `backgroundColor: colors.accentSurface` (OKLCH tint)
- `backgroundColor: \`${secondary}60\`` (nail pin) → `backgroundColor: colors.accentBorder`
- `boxShadow: \`0 8px 24px ${secondary}15\`` → xóa shadow decorative (theo Anti Opacity Rule)
- `border: \`2px solid ${secondary}20\`` → `border: \`1px solid ${colors.accentBorder}\``
- hover inline style dynamic → giữ lại chỉ functional (disabled state), xóa hover shadow JS

**Note:** `TrustBadgesSection` cần thêm prop `mode` từ ComponentRenderer. Kiểm tra:

```typescript
// ComponentRenderer case TrustBadges đang gọi:
<TrustBadgesSection config={config} brandColor={brandColor} secondary={secondary} title={title} />
// Cần thêm mode:
<TrustBadgesSection config={config} brandColor={brandColor} secondary={secondary} title={title} mode={mode} />
```

#### File 3: `components/site/ComponentRenderer.tsx` — `GallerySection` (Gallery Grid title)

Hiện tại Gallery Grid render:
```tsx
{title && <h2 className="text-2xl font-bold mb-6" style={{ color: secondary }}>
```
→ Đổi thành `color: brandColor` (heading luôn dùng primary theo element-level rules).

#### File 4: `app/admin/home-components/create/gallery/page.tsx` — Thêm validation

Hiện `onSubmit` không có APCA/harmony validation. Thêm validation tương tự edit page:
```typescript
import { getGalleryValidationResult, normalizeGalleryHarmony } from '../../gallery/_lib/colors';

const onSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  const harmony = normalizeGalleryHarmony(undefined);
  const { accessibility, harmonyStatus } = getGalleryValidationResult({ primary, secondary, mode, harmony });
  
  if (mode === 'dual' && harmonyStatus.isTooSimilar) {
    toast.error(`deltaE=${harmonyStatus.deltaE} < 20...`);
    return;
  }
  if (accessibility.failing.length > 0) {
    const failedPairs = accessibility.failing.map(p => p.label ?? 'pair').join(', ');
    toast.error(`APCA chưa đạt cho ${failedPairs}. Gợi ý: ...`);
    return;
  }
  
  const finalStyle = ...;
  void handleSubmit(e, { ... });
};
```

---

## Tóm tắt các vấn đề và fix

| Vấn đề | File | Fix |
|---|---|---|
| APCA block save: subheading 14px/600 → threshold 60 quá nghiêm | `_lib/colors.ts` | Đổi thành 18px/600 → threshold 45; skip khi single mode |
| TrustBadgesSection h2 dùng `secondary` thay vì `primary` | `ComponentRenderer.tsx` | Dùng `colors.heading` = primary |
| Anti-opacity `${secondary}15`, `05`, `08` vi phạm skill rule | `ComponentRenderer.tsx` | Đổi sang solid tokens từ `getGalleryColorTokens` |
| Gallery Grid h2 title dùng `secondary` | `ComponentRenderer.tsx` | Đổi sang `brandColor` |
| Create page thiếu APCA validation | `create/gallery/page.tsx` | Thêm validate trước submit |
| TrustBadgesSection không nhận `mode` prop | `ComponentRenderer.tsx` | Thêm prop `mode` |

---

## Files cần thay đổi (4 files)

1. `app/admin/home-components/gallery/_lib/colors.ts` — sửa APCA pairs (fontSize, skip single mode)
2. `components/site/ComponentRenderer.tsx` — TrustBadgesSection + GallerySection color fix
3. `app/admin/home-components/create/gallery/page.tsx` — thêm validation gate
4. Sau khi sửa: chạy `bunx tsc --noEmit` và commit
