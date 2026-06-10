## Problem Graph
1. [Main] Gallery chưa tinh tế theo rule mới <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] Token palette có cặp brand-solid kề brand-tint/shade cùng family
   1.2 [ROOT CAUSE] Preview đang tiêu thụ các token đó nên nhìn gắt

## Execution (with reflection)
1. Solving 1.1 (colors.ts)
   - Thought: Chỉ cần sửa token source-of-truth để Preview tự đồng bộ.
   - Action: Update `app/admin/home-components/gallery/_lib/colors.ts`.
   - Reflection: ✓ Ít thay đổi, đúng pattern hiện có.

2. Solving 1.2 (preview consumers)
   - Thought: Không sửa layout nếu token mới đã đủ.
   - Action: Giữ nguyên `GalleryPreview.tsx` và `TrustBadgesPreview.tsx`, chỉ verify không có hardcode vi phạm adjacency.
   - Reflection: ✓ Tránh over-engineer.

---

## Chi tiết implementation

### 1) File: `app/admin/home-components/gallery/_lib/colors.ts`

Trong `getGalleryColorTokens(...)`, đổi 3 token:

1. `iconBg`
- Trước: `primaryTint`
- Sau: `neutralSurface`
- Mục tiêu: icon/text primary luôn đứng trên neutral.

2. `accentBorder`
- Trước: `getSolidTint(secondaryResolved, 0.3)`
- Sau: `neutralBorder`
- Mục tiêu: tránh secondary-family border kề secondary tint surface.

3. `cardHoverBorder`
- Trước: `getSolidTint(secondaryResolved, 0.25)`
- Sau: `secondaryResolved`
- Mục tiêu: nếu dùng secondary thì đặt trực tiếp trên neutral card bg, không qua tint cùng family.

Không đổi các token còn lại để giữ ổn định UI.

### 2) File: `app/admin/home-components/gallery/_components/GalleryPreview.tsx`
- Không sửa logic/layout.
- Verify các chỗ dùng `colors.iconBg`, `colors.accentBorder`, `colors.cardHoverBorder` vẫn đúng semantic.

### 3) File: `app/admin/home-components/gallery/_components/TrustBadgesPreview.tsx`
- Không sửa logic/layout.
- Verify các card/badge/border không hardcode thêm cặp vi phạm adjacency.

---

## Validation bắt buộc

Theo rule repo khi có đổi code/TS:
- Chạy: `bunx tsc --noEmit`
- Nếu fail: fix lỗi và chạy lại đến khi pass.

---

## Commit plan

Sau khi pass validation:
- Commit local (không push) với message gợi ý:
  - `fix(gallery): align tokens with color adjacency rule`

---

## Acceptance Criteria
- Gallery tokens không còn cặp `brand solid` kề `brand tint/shade` cùng family cho 3 điểm chính: icon bg, accent border, hover border.
- Preview Gallery/TrustBadges vẫn render bình thường, không đổi cấu trúc UI.
- `bunx tsc --noEmit` pass.
- Có commit local chứa đúng phạm vi file.