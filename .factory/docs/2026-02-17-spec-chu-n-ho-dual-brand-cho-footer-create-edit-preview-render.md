## Problem Graph
1. Footer chưa đồng bộ màu giữa create/edit/preview/render <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [ROOT CAUSE] Preview đang re-export legacy, chưa dùng `_lib/colors.ts` hiện tại
   1.2 Render site (`components/site/DynamicFooter.tsx`) đang tự shade RGB + hardcode nhiều màu/opacity/hover, không dùng SSoT
   1.3 Form create/edit dùng `secondary` trực tiếp (`${secondary}10`) nên sai khi mode=single và sai rule anti-opacity
   1.4 Mode handling chưa xuyên suốt (single/dual) ở render; preview-render mismatch theo từng style

## Execution (with reflection)
1. Chuẩn hoá Single Source of Truth cho Footer
- Tạo/hoàn thiện API màu trong `app/admin/home-components/footer/_lib/colors.ts` để export đầy đủ token dùng chung cho cả preview + render (bg/surface/border/text/social/link/divider theo từng style).
- Giữ rule bắt buộc: `resolveSecondaryForMode()` trả `primary` khi `single`.
- Reflection: ✓ Đã có nền tốt; chỉ cần mở rộng token để đủ cho 6 style và loại bỏ hex/opacity hardcode.

2. Đồng bộ Preview về token mới (không dùng legacy)
- Thay `app/admin/home-components/footer/_components/FooterPreview.tsx` từ re-export legacy sang component preview local.
- Preview lấy màu qua `getFooterLayoutColors(style, primary, secondary, mode)` + cùng logic fallback data như render.
- 6 style preview phải map 1-1 với render (structure + accent assignment) để không lệch.
- Reflection: ✓ Fix trực tiếp mismatch lớn nhất hiện tại.

3. Đồng bộ Render site theo token preview
- Refactor `components/site/DynamicFooter.tsx`:
  - Bỏ `shadeColor` và bảng `socialColors` hardcode.
  - Dùng cùng helper từ `app/admin/home-components/footer/_lib/colors.ts`.
  - Lấy mode từ setting `site_brand_mode` (single/dual) để resolve secondary đúng.
  - Dùng token màu nhất quán cho 6 style, đảm bảo heading/CTA-like accents dùng primary, labels/divider/social accents dùng secondary ở dual; single thì monochromatic.
- Reflection: ✓ Đây là bước đảm bảo “render tương ứng preview”.

4. Sửa create/edit form để đúng mode + anti-opacity
- Trong `app/admin/home-components/footer/_components/FooterForm.tsx`:
  - Nhận thêm `primary` + `mode` hoặc trực tiếp `resolvedSecondary` từ page.
  - Empty state icon badge không dùng `${secondary}10`; chuyển sang token solid/tint từ helper (`withAlpha` bị hạn chế decorative -> ưu tiên solid tint OKLCH).
- Update page truyền props tương ứng:
  - `app/admin/home-components/footer/[id]/edit/page.tsx`
  - (nếu có) trang create footer tương ứng để parity create/edit.
- Reflection: ✓ Sửa nguồn lệch màu ngay lúc cấu hình.

5. Kiểm soát phân phối màu theo skill v11.4
- Áp rule 60-30-10 ở content state:
  - Primary: heading/logo anchor/action nổi bật.
  - Secondary: subtitle/label/divider/social-accent.
  - Neutral: text body/surface.
- Single mode: ẩn thông tin secondary/harmony trên UI preview info (nếu đang hiển thị) và đảm bảo không tạo hue khác.
- Reflection: ✓ Giải quyết đúng nhận xét “chưa phân phối màu hợp lý”.

6. Validation bắt buộc trước khi chốt
- Chạy `bunx tsc --noEmit` (theo AGENTS.md của repo).
- Nếu fail thì fix tới khi pass.

7. Commit (không push)
- Commit gói thay đổi footer sau khi tsc pass, theo convention commit hiện tại.

## File-level thay đổi dự kiến
- `app/admin/home-components/footer/_lib/colors.ts` (mở rộng token/logic style và mode-safe)
- `app/admin/home-components/footer/_components/FooterPreview.tsx` (bỏ legacy, render preview chuẩn mới)
- `app/admin/home-components/footer/_components/FooterForm.tsx` (bỏ secondary hardcode/opacities)
- `app/admin/home-components/footer/[id]/edit/page.tsx` (truyền props mode/color chuẩn)
- `app/admin/home-components/create/footer/page.tsx` (nếu tồn tại, đồng bộ như edit)
- `components/site/DynamicFooter.tsx` (render dùng chung helper màu)

Mình sẽ implement theo đúng spec này để đảm bảo: create = edit = preview = render, và single/dual mode tuân thủ dual-brand-color-system v11.4.