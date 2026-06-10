
## Problem Graph

1. [Main: Skill dài, nhiều DRY, quá domain-specific] ← depends on 1.1, 1.2, 1.3
   1.1 [3 reference files lặp lại code đã có trong examples/color-utils.ts] ← ROOT CAUSE
   1.2 [3 checklists lặp lại Core Rules trong SKILL.md] ← ROOT CAUSE  
   1.3 [12 Core Rules quá nhiều, nhiều cái là hệ quả — cần abstract] ← ROOT CAUSE

---

## Kế hoạch nâng cấp v8.0

### Bước 1: Merge 3 reference files → 1 file `reference.md`

Gộp `reference-oklch.md` + `reference-apca.md` + `reference-harmony.md` → **1 file `reference.md`** chỉ chứa:
- Bảng tóm tắt OKLCH values (L/C/H ranges)
- Bảng APCA thresholds (body/heading/UI)
- Bảng Harmony schemes (angles)
- Nav Button adaptive contrast (W3C C40)
- **Bỏ code snippets** vì đã có trong `examples/color-utils.ts`

### Bước 2: Merge 4 checklists → 1 file `checklist.md`

Gộp `review-checklist.md` + `create-checklist.md` + `dual-visibility-checklist.md` + `accent-analysis-template.md` → **1 file `checklist.md`** với 2 sections:
- **Universal Checklist** (dùng cho cả review và create, ~15 items thay vì 35+)
- **Accent Analysis Template** (bảng template + 1 ví dụ)

### Bước 3: Thu gọn Core Rules từ 12 → 6 nguyên tắc tổng quát

**Hiện tại 12 rules**, nhiều cái là hệ quả. Gộp lại thành **6 Principles**:

| # | Principle | Gộp từ |
|---|-----------|--------|
| 1 | **OKLCH Only** — Dùng OKLCH cho mọi color generation | Rule 1 |
| 2 | **APCA Contrast** — Text/UI phải pass APCA thresholds | Rule 2 |
| 3 | **60-30-10 Distribution** — Đo tại data-đầy-đủ state; placeholder luôn neutral | Rule 4, 5, 11 (gộp) |
| 4 | **Accent Prominence** — Phân phối P/S theo accent count + tier | Rule 6, 7, 8, 9, 12 (gộp) |
| 5 | **Harmony Auto-suggest** — Single mode auto-gen secondary từ primary | Rule 3 |
| 6 | **Single Source of Truth** — Render ≡ Preview, logic màu chỉ ở `_lib/colors.ts` | Rule 10 |

Trong mỗi principle, ghi rules con cụ thể (nav arrow, pagination dot, etc.) dưới dạng bullet examples — không phải rule riêng.

### Bước 4: Giữ nguyên examples/ (không thay đổi)

- `color-utils.ts` — đã là single source of code, giữ nguyên
- `theme-engine-ui.tsx` — giữ nguyên
- `hero-before-after.md` — giữ nguyên (ví dụ tham chiếu tốt)
- `ambient.d.ts` — giữ nguyên

### Bước 5: Cập nhật SKILL.md

- Cập nhật version → 8.0.0
- Thu gọn Core Rules thành 6 Principles (Bước 3)
- Bỏ các section trùng lặp: Color Role Matrix, Accent Analysis Template, Dual-Brand Visibility Checklist (đã có trong checklist.md)
- Giữ: Quick Start, Content-Aware Distribution (gọn lại), Output Report Format, Dependencies, Testing
- Files tham chiếu cập nhật danh sách mới (bớt files)

---

## Kết quả sau nâng cấp

| Metric | Before | After |
|--------|--------|-------|
| Files tổng | 10 | 7 |
| Reference files | 3 | 1 |
| Checklist files | 4 | 1 |
| Core Rules | 12 | 6 Principles |
| SKILL.md length | ~350 lines | ~180 lines (ước) |
| DRY violations | ~8 | 0 |

**Structure sau nâng cấp:**
```
dual-brand-color-system/
├── SKILL.md              (v8.0 — gọn ~50%)
├── reference.md          (merged từ 3 files)
├── checklist.md          (merged từ 4 files)
└── examples/
    ├── ambient.d.ts
    ├── color-utils.ts
    ├── theme-engine-ui.tsx
    └── hero-before-after.md
```
