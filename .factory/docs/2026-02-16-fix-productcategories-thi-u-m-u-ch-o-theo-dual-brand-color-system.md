
## Problem Graph

```
1. [Main] ProductCategories gần như không nhìn thấy màu chủ đạo
   1.1 [ROOT CAUSE 1] colors.ts: opacity quá thấp, thiếu nhiều semantic tokens
      - pillBg: opacity 0.08, pillBorder: 0.2 → gần như invisible
      - circularBg: 0.05, circularBorder: 0.15 → gần như invisible
      - Thiếu: headingAccent, subtitleColor, gradientAccentLine, hoverBg rõ ràng
   1.2 [ROOT CAUSE 2] Preview + Render không dùng accent cho heading
      - Section heading luôn neutral (slate-900), không có accent brand
      - Không có gradient accent line/bar (skill rule: "brandColor → secondary")
   1.3 [ROOT CAUSE 3] Grid style overlay from-black/70 che mất mọi brand color
      - productCountText dùng secondary.solid nhưng trên overlay tối → mất contrast/vô nghĩa
   1.4 Chưa có trong Component Color Map → không rõ target P%/S%
```

## Phân tích Accent hiện tại (Content State)

| # | Element | Visible? | Color | Vấn đề |
|---|---------|----------|-------|--------|
| 1 | Card border | Subtle | secondary.border (rất nhạt) | Opacity thấp, khó thấy |
| 2 | Card shadow | Barely | secondary 12% opacity | Invisible |
| 3 | Icon container bg | Yes (icon mode only) | primary.solid | Chỉ khi dùng icon, không phải default |
| 4 | productCountText | On grid: invisible | secondary.solid | Bị overlay đen che mất |
| 5 | linkText | Small | secondary.solid | Chỉ "Xem tất cả" nhỏ |
| 6 | Pill bg/border | Barely | secondary 8%/20% | Quá nhạt |
| 7 | Arrow icon | Small | primary.solid | Chỉ marquee, nhỏ |
| 8 | Heading | None | neutral | Không có brand accent |

**Kết luận**: ~90% neutral, ~5% secondary (opacity thấp), ~5% primary (chỉ icon mode). Không đạt 60-30-10.

## Fix Plan

### Mục tiêu: Balanced dual-brand (~50/50) theo Element-Level Color Rules

### File 1: `app/admin/home-components/product-categories/_lib/colors.ts`

Thêm semantic tokens mới:

```ts
// Thêm vào interface ProductCategoriesColors
headingAccent: string;        // primary.solid - cho accent text heading
subtitleColor: string;        // secondary.solid - cho subtitle/description
accentLine: string;           // primary.solid - gradient accent line
accentLineEnd: string;        // secondary.solid - gradient accent line end
hoverBgCard: string;          // primary.surface - hover state rõ hơn
badgeBg: string;              // primary.solid - badge background
badgeText: string;            // primary.textOnSolid - badge text
productCountBg: string;       // secondary surface opacity 0.15 (thay vì text trần)
```

Tăng opacity cho các token hiện có:
- `pillBg`: 0.08 → **0.12**
- `pillBorder`: 0.2 → **0.3**
- `circularBg`: 0.05 → **0.08**
- `circularBorder`: 0.15 → **0.25**
- `cardShadow`: 0.12 → **0.15**

### File 2: `app/admin/home-components/product-categories/_components/ProductCategoriesPreview.tsx`

Áp dụng semantic tokens mới vào 6 styles:

1. **Tất cả styles**: Heading có accent line gradient (primary → secondary) bên dưới, width ~60px
2. **Grid**: 
   - Thay overlay `from-black/70` bằng overlay dùng brand shade: `from-{primaryShade}/80`
   - productCount text trên bg pill nhỏ thay vì text trần trên overlay
3. **Carousel**: Thêm accent border-bottom cho heading
4. **Cards**: linkText có underline on hover, thêm category icon nhỏ bên trái heading
5. **Minimal**: Tăng pill visibility (opacity đã tăng ở colors.ts)
6. **Circular**: Tăng border visibility, thêm hover bg rõ hơn

### File 3: `components/site/ComponentRenderer.tsx` (ProductCategoriesSection)

Đồng bộ thay đổi tương tự File 2 (Single Source of Truth):
- Heading accent line
- Grid overlay brand shade
- ProductCount badge style
- Tăng opacity các border/bg

### File 4: `.factory/skills/dual-brand-color-system/SKILL.md`

Thêm ProductCategories vào Component Color Map:

```
| ProductCategories | 50 | 50 | P: heading accent, icon bg, CTA, overlay shade; S: borders, pills, count badge, links |
```
