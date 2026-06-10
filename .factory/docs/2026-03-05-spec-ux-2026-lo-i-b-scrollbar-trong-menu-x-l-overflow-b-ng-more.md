## Problem Graph
1. [Main] Trải nghiệm menu chưa tốt vì nguy cơ scrollbar dọc/ngang ở admin + classic header
   1.1 [Sub] Header Classic (site + preview) đang dùng `overflow-x-auto` cho nav chính
      1.1.1 [ROOT CAUSE] Thiếu cơ chế overflow có chủ đích cho top-level items khi tổng chiều rộng vượt viewport
   1.2 [Sub] `/admin/menus` có layout dễ chật khi nhiều action/cột
      1.2.1 [ROOT CAUSE] Action cluster dày và giữ cùng mức ưu tiên thị giác với trường chính

## Execution (with reflection)
1. Solving 1.1.1 — thay horizontal-scroll bằng chiến lược **More** (theo lựa chọn của bạn)
   - Thought: Best practice (NN/g + Baymard) ưu tiên tránh horizontal scroll cho navigation chính desktop; dùng overflow menu “More” dễ discover hơn.
   - Action:
     - File `components/site/Header.tsx` (style `classic`, desktop):
       - Bỏ `overflow-x-auto` ở nav chính.
       - Tạo logic tính `visibleRootItems` + `overflowRootItems` dựa trên số lượng tối đa hiển thị desktop (ví dụ 6, có thể tinh chỉnh theo breakpoint bằng `resize`).
       - Render thêm item top-level **More** ở cuối nav khi có overflow:
         - `More` dùng cùng pattern hover/dropdown hiện tại.
         - Dropdown của `More` chứa các root item dư; mỗi root item vẫn giữ children/sub-children đúng hierarchy.
       - Giữ nguyên behavior openInNewTab/hover delay/token màu.
     - File `components/experiences/previews/HeaderMenuPreview.tsx` (`renderClassicStyle`, desktop):
       - Áp dụng y hệt logic More để đảm bảo parity 100% với site thật (theo lựa chọn của bạn).
       - Reuse cùng naming/flow state (`hoveredItem`) để giảm lệch hành vi.
   - Reflection: ✓ Đúng mục tiêu UX: bỏ phụ thuộc horizontal scrollbar cho điều hướng chính; vẫn giữ đầy đủ link.

2. Đồng bộ contract preview = site thật (parity)
   - Thought: Bạn chọn “Giống 100%”, nên cần tránh 2 implementation khác nhau gây drift.
   - Action:
     - Đồng bộ cùng rule phân bổ item vào More giữa 2 file (site + preview):
       - Cùng ngưỡng hiển thị item.
       - Cùng cách render dropdown cấp 2/3.
       - Cùng handling hover state của More.
     - Nếu cần, trích helper local trong từng file (không tạo module mới khi chưa cần) để giữ KISS/YAGNI.
   - Reflection: ✓ Giảm rủi ro “preview đẹp nhưng site vỡ”.

3. Tối ưu `/admin/menus` để tránh cảm giác phải kéo ngang
   - Thought: Bạn chọn giữ 1 hàng, giảm cột phụ + icon-only action.
   - Action (file `app/admin/menus/page.tsx`):
     - Giữ cấu trúc 1 hàng mỗi item.
     - Thu gọn vùng action:
       - Duy trì icon-only cho Add-below/Copy/Indent/Toggle/Delete.
       - Chuẩn hóa kích thước nút (h-8 w-8) + tooltip title rõ nghĩa.
       - Giảm border/spacing thừa giữa các nhóm action.
     - Vùng input:
       - Ưu tiên không gian cho Label/URL (grid cân bằng hơn, tránh URL đẩy layout).
       - Thêm truncate/ellipsis ở text phụ nếu cần thay vì nới chiều ngang.
     - Không thêm scrollbar ngang cho row; giữ responsive tự co hợp lý.
   - Reflection: ✓ Đúng hướng “gọn, 1 hàng, không phá thao tác hiện tại”.

4. Giữ nguyên các thay đổi business logic đã có trong WIP
   - Thought: Các thay đổi draft + Save All + Add Below + Copy đang phù hợp spec trước, chỉ cần đảm bảo không xung đột với UX mới.
   - Action:
     - Không đổi contract mutation hiện tại (`saveMenuItemsBulk`) trừ khi phát hiện bug.
     - Chỉ chạm UI/layout và overflow behavior menu render.
   - Reflection: ✓ Giữ scope chuẩn YAGNI, hạn chế regression backend.

5. Validate trước commit (theo rule repo)
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Review diff đảm bảo không còn `overflow-x-auto` cho nav desktop classic site/preview.
     - Commit toàn bộ thay đổi code + add `.factory/docs` nếu có file spec mới.

## Best-practice nguồn tham chiếu (WebSearch)
- NN/g: người dùng desktop không ưa horizontal scrolling cho nội dung/điều hướng chính; dễ miss content và tăng tải nhận thức.
- Baymard: với menu dài nên dùng nhóm/overflow hợp lý (ví dụ More), tránh nhồi full top-level khiến điều hướng kém ổn định.

## Checklist implement
- [ ] Site Header Classic desktop không còn horizontal scroll cho nav chính
- [ ] Preview Classic desktop xử lý overflow bằng More giống hệt site
- [ ] Item dư top-level xuất hiện trong dropdown More, không mất hierarchy
- [ ] `/admin/menus` giữ 1 hàng, action gọn icon-only, giảm nguy cơ tràn ngang
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit local đầy đủ (kèm `.factory/docs` nếu có)