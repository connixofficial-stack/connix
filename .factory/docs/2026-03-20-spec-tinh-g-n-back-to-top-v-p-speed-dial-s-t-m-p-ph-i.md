## TL;DR kiểu Feynman
- Vấn đề không nằm ở màu hay toggle nữa, mà nằm ở spacing: cụm speed dial đang bị đẩy quá xa mép phải nên nhìn tách khỏi thanh scroll dọc.
- Nút back-to-top hiện cũng hơi to và nhiều shadow/border nên trông nặng, không gọn như tinh thần showcase.
- Root cause chính là trong renderer hiện tại đang dùng nhiều giá trị hardcode như `right-6`, `bottom-6`, `mr-2`, `h-10 w-10`, làm khoảng hở lớn hơn showcase.
- Em sẽ audit và chỉnh lại spacing token theo hướng “ôm mép phải hơn”, đồng thời giảm visual weight của back-to-top.
- Phạm vi sửa sẽ là create, edit và site render vì tất cả đang dùng chung `SpeedDialSectionShared.tsx`.

## Audit Summary
### Observation
- Trong code hiện tại `app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`, nhiều layout site đang dùng:
  - `right-6` / `bottom-6` cho wrapper (`renderFab`, `renderDock`, `renderStack`).
  - `mr-2` cho back-to-top ở `renderSidebar`.
  - `h-10 w-10` hoặc `h-9 w-9` cho back-to-top và toggle nên cụm nhìn nặng.
- Ở showcase:
  - `SpeedDial1.tsx` dùng `fixed bottom-3 right-2`.
  - `SpeedDial4.tsx` dùng `right-0`, còn back-to-top chỉ `mr-2` nhưng gắn trong layout edge-attached nên không bị rời.
- Ảnh user gửi cho thấy nút back-to-top và nút `+` đang đứng cách mép phải trắng quá nhiều, tạo cảm giác tách khỏi scrollbar.
- Vì renderer hiện tại là shared cho preview/site nên mọi lỗi spacing đều lan sang create, edit và site render.

### Root cause answers
1. Triệu chứng: back-to-top chưa gọn, cụm speed dial lệch xa mép phải/scrollbar nên nhìn “rời”.
2. Phạm vi ảnh hưởng: create preview, edit preview, site render của Speed Dial.
3. Tái hiện ổn định: có; chỉ cần mở trang có speed dial ở mobile/narrow viewport là thấy khoảng hở lớn.
4. Mốc thay đổi gần nhất: commit toggle default closed vừa thêm nhiều wrapper/button spacing mới bằng class hardcoded.
5. Dữ liệu còn thiếu: không thiếu thêm; evidence đủ từ code hiện tại + ảnh user + showcase.
6. Giả thuyết thay thế đã loại trừ: không phải do scrollbar của browser hay layout ngoài component; chính class `right-*`, `mr-*`, `w/h-*` trong renderer đang quyết định khoảng hở và độ nặng.
7. Rủi ro nếu fix sai nguyên nhân: một layout có thể sát hơn nhưng layout khác vẫn hở, hoặc preview/site lệch nhau.
8. Tiêu chí pass/fail: cụm speed dial ôm mép phải hơn, back-to-top nhỏ gọn hơn, nhìn liền mạch với scrollbar và không còn cảm giác “rời”.

## Root Cause Confidence
**High** — có evidence trực tiếp từ class spacing hardcoded trong `SpeedDialSectionShared.tsx` và đối chiếu với showcase `right-2/right-0` cùng ảnh user cung cấp.

## Files Impacted
### UI
- `Sửa: app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`
  - Vai trò hiện tại: shared renderer cho create/edit/site.
  - Thay đổi: giảm offset phải/dưới, tinh gọn size/backdrop/shadow của back-to-top và đồng bộ lại khoảng cách giữa back-to-top với toggle/action list.
- `Có thể sửa nhẹ: app/admin/home-components/speed-dial/_lib/colors.ts`
  - Vai trò hiện tại: token màu/surface.
  - Thay đổi: chỉ nếu cần làm back-to-top nhẹ visual hơn bằng border/shadow/subtle surface; khả năng cao không cần.

## Execution Preview
1. Audit từng renderer `renderFab/renderSidebar/renderPills/renderStack/renderDock/renderMinimal` để gom các spacing hardcoded cần chỉnh.
2. Giảm offset site từ nhóm kiểu `right-6/bottom-6` về gần showcase hơn (`right-2~right-3`, `bottom-3~bottom-4` tùy layout).
3. Với `renderSidebar`, giữ edge-attached bám mép và giảm độ tách của back-to-top để không bị lơ lửng.
4. Thu gọn back-to-top: giảm size, shadow/border nhẹ hơn, icon scale nhỏ hơn nếu cần.
5. Review static trên cả preview và site path để đảm bảo cụm vẫn dễ bấm, không chạm scrollbar quá sát, không overlap nội dung.
6. Sau implement: `bunx tsc --noEmit`, rồi commit local kèm `.factory/docs`.

## Proposal
### Option A (Recommend) — Confidence 93%
Tinh chỉnh spacing trực tiếp trong từng renderer hiện tại, ưu tiên bám sát showcase và ảnh feedback của anh.
- Vì sao tốt nhất: scope nhỏ, sửa đúng root cause, không cần đổi schema hay API.
- Tradeoff: spacing vẫn là per-layout tuning chứ chưa được token hóa hoàn toàn.

### Option B — Confidence 66%
Tạo helper spacing chung kiểu `getFloatingOffsets(context, style)` để gom toàn bộ offset phải/dưới vào một chỗ.
- Phù hợp khi anh muốn tiếp tục tinh chỉnh nhiều vòng sau này.
- Tradeoff: refactor rộng hơn một chút dù vấn đề hiện tại chủ yếu là tuning UI.

## Acceptance Criteria
- Back-to-top nhỏ gọn hơn, nhìn nhẹ hơn toggle hiện tại.
- Speed dial bám mép phải/scrollbar hơn, không còn khoảng trắng lớn gây cảm giác “rời”.
- Edge-attached layout vẫn bám cạnh đúng tinh thần showcase.
- Toggle, closed-state, màu và icon không bị đổi behavior.
- Create, edit và site render nhất quán spacing.

## Verification Plan
- Static review: spacing classes, touch target, overlap với scrollbar, consistency giữa 6 style.
- Typecheck: `bunx tsc --noEmit`.
- Repro cho tester:
  1. Mở mobile viewport/narrow viewport.
  2. Kiểm tra closed-state của từng style.
  3. So sánh khoảng cách mép phải trước/sau.
  4. Kiểm tra back-to-top không còn quá to/nặng.

## Counter-Hypothesis
- Có thể do layout container của page chứ không phải speed dial. Nhưng evidence từ `fixed right-6/right-4` trong shared renderer cho thấy component tự tạo khoảng hở riêng.
- Có thể chỉ cần sửa một layout. Nhưng ảnh feedback và code audit cho thấy nhiều layout đang dùng cùng pattern offset lớn.

## Out of Scope
- Không đổi animation logic toggle.
- Không đổi schema config.
- Không thêm setting spacing trong admin.
- Không chỉnh home-component khác.

## Risk / Rollback
- Rủi ro chính: ép sát quá mức làm cụm chạm scrollbar hoặc khó bấm ở vài browser.
- Giảm rủi ro: giữ touch target tối thiểu hợp lý, chỉ giảm offset vừa đủ theo showcase.
- Rollback: revert spacing classes trong shared renderer là đủ.

Nếu anh duyệt, em sẽ triển khai theo Option A: chỉnh trực tiếp spacing và thu gọn back-to-top trong shared renderer.