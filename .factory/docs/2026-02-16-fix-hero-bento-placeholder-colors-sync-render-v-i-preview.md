
## Problem Graph

1. [Main] Placeholder bento ở render khác màu với preview
   1.1 [ROOT CAUSE] `ComponentRenderer.tsx` dùng `bentoColors.gridTint1/2/3/4` (primary tint) cho placeholder background
   1.2 `HeroPreview.tsx` dùng neutral `['#f1f5f9', '#e2e8f0', '#f1f5f9', '#e2e8f0']` (đúng theo skill)

## Phân tích

| Style | ComponentRenderer | HeroPreview | Khớp? |
|-------|------------------|-------------|-------|
| Slider | `#f1f5f9` (neutral) | `#f1f5f9` | OK |
| Fade | `#f1f5f9` (neutral) | `#f1f5f9` | OK |
| **Bento** | **`gridTint1/2/3/4` (primary tint)** | **neutral slate** | **SAI** |
| Fullscreen | `#f1f5f9` (neutral) | `#f1f5f9` | OK |
| Split | `bg-slate-200` (neutral) | `bg-slate-200` | OK |
| Parallax | `#f1f5f9` (neutral) | `#f1f5f9` | OK |

Theo **Skill Rule 5**: "Background placeholder: neutral (slate-100/200), **KHÔNG** dùng primary hoặc secondary tint"

## Sửa lỗi

### File: `components/site/ComponentRenderer.tsx`

**Bento style (mobile grid + desktop grid)** - thay `bentoPlaceholders[idx]` (là `bentoColors.gridTint1/2/3/4` - primary tint) bằng neutral tints giống preview:

```tsx
// BEFORE - dùng brand tint (SAI theo skill Rule 5)
const bentoPlaceholders = [
  bentoColors.gridTint1,
  bentoColors.gridTint2,
  bentoColors.gridTint3,
  bentoColors.gridTint4,
];
// ... renderPlaceholder(bentoPlaceholders[idx] ?? bentoColors.gridTint1, ...)

// AFTER - dùng neutral tints (ĐÚNG, khớp preview)
const bentoPlaceholders = ['#f1f5f9', '#e2e8f0', '#f1f5f9', '#e2e8f0'];
// ... renderPlaceholder(bentoPlaceholders[idx] ?? '#f1f5f9', ...)
```

> **Lưu ý**: `bentoColors.gridTint1/2/3/4` vẫn giữ nguyên trong `colors.ts` vì chúng có thể dùng cho mục đích khác (ví dụ content state). Chỉ sửa placeholder background ở render để khớp skill rule.
