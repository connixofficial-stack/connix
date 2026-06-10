
## Problem Graph

```
1. [Skill thiếu rules dẫn đến lặp lại 4 bugs]
   1.1 [Site ≠ Preview colors] ← commit ec385b9
      1.1.1 [ROOT CAUSE: Thiếu rule Single Source of Truth]
   1.2 [Bento placeholder dùng primary tint] ← commit 0acc1c2
      1.2.1 [ROOT CAUSE: Rule 5 chưa explicit cho grid/multi-cell case]
   1.3 [Slider thiếu accent, thêm rồi lại xóa] ← commits 3f0c35f + d8bf4fb
      1.3.1 [ROOT CAUSE: Thiếu rule YAGNI cho decorative accents]
      1.3.2 [ROOT CAUSE: Rule 8 Nav Arrows sai - dual icon = primary, không phải secondary]
```

## Thay đổi cụ thể

### 1. SKILL.md — Thêm 3 rules mới + sửa Rule 8

**Rule 10 (MỚI): Single Source of Truth — Render ≡ Preview**
- Mọi style (site `ComponentRenderer` + admin `Preview`) phải gọi **cùng hàm** từ `_lib/colors.ts`
- KHÔNG duplicate logic color ở 2 nơi (ví dụ: hardcode `bg-white/20` ở site trong khi preview dùng `sliderColors.navButtonBg`)
- Import trực tiếp: `import { getSliderColors, ... } from '@/app/admin/home-components/hero/_lib/colors'`
- Khi sửa color logic → chỉ sửa 1 file `colors.ts`, cả 2 nơi tự sync

**Rule 11 (MỚI): Placeholder Grid/Multi-cell cũng dùng Neutral**
- Rule 5 mở rộng: Bento grid placeholder cells **CŨNG** dùng neutral (`#f1f5f9`, `#e2e8f0`)
- KHÔNG dùng `gridTint1/2/3/4` (primary/secondary tint) cho placeholder
- `gridTint` chỉ dùng khi cell có data thật (image/content)

**Rule 12 (MỚI): YAGNI — Không thêm decorative accent thừa**
- Không thêm element mới (bottom strip, gradient bar, decorative line) chỉ để "tăng visibility secondary"
- Nếu secondary đã đủ 2 element types (ví dụ: dot active + nav base) → KHÔNG thêm nữa
- Mỗi accent element phải có **functional purpose** (navigation, state indicator, CTA), không chỉ decorative

**Sửa Rule 8: Nav Arrows — Icon dùng Primary (dual mode)**
- Dual mode: **nav base (bg logic) = secondary** nhưng **icon = primary** (tạo contrast dual-brand)
- Single mode: icon dùng theo navIndicator logic (contrast-based)
- Lý do: icon primary trên nền tính từ secondary → cả 2 brand đều "hiện" trong 1 element nhỏ

### 2. Sửa Color Role Matrix

| Element | Trạng thái | Primary | Secondary | Neutral | Ghi chú |
|---------|-----------|---------|-----------|---------|---------|
| Nav arrow btn | content | **dual: icon** | dual: bg logic base | bg + ring | Icon=primary, base=secondary |
| Placeholder grid cell | empty | - | - | **fill** | Bento cells dùng neutral |
| Progress bar | content | fill | - | track | Optional, không bắt buộc |

### 3. Sửa checklists/review-checklist.md

Thêm mục:
- `## 8. Single Source of Truth`: Site và Preview dùng cùng hàm color
- `## 9. YAGNI Decorative`: Không có decorative accent không có functional purpose

### 4. Sửa checklists/create-checklist.md

Thêm mục:
- `## 7. Single Source of Truth`: ComponentRenderer import từ `_lib/colors.ts`, không hardcode
- `## 8. Placeholder Grid`: Multi-cell placeholder dùng neutral

### 5. Sửa checklists/dual-visibility-checklist.md

Sửa mục Nav arrow: `dual mode: bg logic base = secondary, icon = primary`
Thêm mục YAGNI: Không thêm decorative element chỉ để đạt minimum visibility

### 6. Bump version → 7.1.0

## Files sẽ thay đổi (6 files)
1. `.factory/skills/dual-brand-color-system/SKILL.md` — thêm 3 rules mới, sửa Rule 8, sửa Color Role Matrix, bump version
2. `.factory/skills/dual-brand-color-system/checklists/review-checklist.md` — thêm 2 mục mới
3. `.factory/skills/dual-brand-color-system/checklists/create-checklist.md` — thêm 2 mục mới
4. `.factory/skills/dual-brand-color-system/checklists/dual-visibility-checklist.md` — sửa nav arrow, thêm YAGNI
5. `.factory/skills/dual-brand-color-system/examples/color-utils.ts` — sửa `getNavButtonColors` cho dual mode icon = primary
6. `.factory/skills/dual-brand-color-system/examples/hero-before-after.md` — thêm ví dụ Single Source of Truth
