## Problem Graph
1. [Main] Marquee nhiều item chưa trượt đẹp + nút lưu chưa phản ánh trạng thái dirty ở Partners edit <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] Marquee đang chạy step cố định, chưa adaptive theo số item/chiều rộng, và reduced-motion chưa theo mode “chậm hơn”
   1.2 [ROOT CAUSE] Trang edit chưa có cơ chế so sánh snapshot ban đầu vs state hiện tại để disable submit khi không đổi

## Execution (with reflection)
1. Tinh chỉnh marquee auto-scroll cho trường hợp nhiều item (chỉ Partners)
   - File: `app/admin/home-components/partners/_components/PartnersMarqueeShared.tsx`
   - Thay logic tốc độ từ hằng số sang adaptive speed:
     - Tính `itemCount` sau normalize/dedupe.
     - Tạo `effectiveSpeed` theo số lượng item (nhiều item thì nhanh nhẹ để cảm giác đều, ít item giữ chậm).
     - Giữ behavior bạn chọn: `Auto + pause` (hover/focus/touch pause).
   - Reflection: ✓ Trượt “đẹp” hơn khi list dài, không giật/khựng.

2. Reduced-motion theo yêu cầu “giảm tốc rất chậm”
   - File: `PartnersMarqueeShared.tsx`
   - Không tắt animation nữa; khi `prefers-reduced-motion` thì set `effectiveSpeed` về mức rất thấp thay vì dừng.
   - Reflection: ✓ Đúng accessibility preference bạn chọn.

3. Disable nút “Lưu thay đổi” khi không có thay đổi (chỉ Partners edit)
   - File: `app/admin/home-components/partners/[id]/edit/page.tsx`
   - Tạo `initialSnapshot` (title, active, items chuẩn hoá, style) sau khi load component.
   - Tính `isDirty` bằng so sánh snapshot hiện tại vs initial snapshot (so sánh dữ liệu đã normalize để tránh false-positive do whitespace/order không liên quan).
   - Cập nhật button submit:
     - `disabled={isSubmitting || !isDirty}`
     - thêm class xám rõ ràng khi disabled.
   - Guard `handleSubmit`: nếu `!isDirty` thì return sớm.
   - Reflection: ✓ UX đúng kỳ vọng: không đổi thì nút xám, không submit.

4. Giữ tương thích flow hiện có
   - Không đổi API payload và không đổi schema DB.
   - Không mở rộng sang page edit khác theo scope bạn chọn.
   - Reflection: ✓ Không ảnh hưởng phạm vi ngoài yêu cầu.

5. Validation bắt buộc
   - Chạy `bunx tsc --noEmit`.
   - Nếu lỗi type/runtime guard, sửa và chạy lại đến khi pass.

6. Commit (không push)
   - Commit message đề xuất: `fix(partners): improve marquee motion and disable save when unchanged`

## Files dự kiến chỉnh
- `app/admin/home-components/partners/_components/PartnersMarqueeShared.tsx`
- `app/admin/home-components/partners/[id]/edit/page.tsx`