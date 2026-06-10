## TL;DR kiểu Feynman
- Em audit lại ảnh và code thì đúng là khi chưa scroll, không có nút back-to-top, nút `+` vẫn đang bị chừa khoảng hở với mép phải.
- Lý do là wrapper hiện vẫn dùng offset cố định `right-2/right-3`, nên dù có hay không có mũi tên thì cả cụm vẫn không dính sát mép như anh muốn.
- Nghĩa là fix trước chỉ làm “gọn hơn”, nhưng chưa giải quyết đúng root cause của trạng thái closed khi chưa scroll.
- Em sẽ chỉnh anchor của wrapper/toggle theo closed-state: khi không có back-to-top thì cụm phải bám sát mép hơn; khi có back-to-top vẫn giữ cân đối.
- Phạm vi vẫn là create, edit và site render vì dùng chung renderer.

## Audit Summary
### Observation
- Trong `app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`, các layout floating (`renderFab`, `renderPills`, `renderStack`, `renderDock`, `renderMinimal`) đang dùng wrapper hardcoded kiểu:
  - site: `right-2`, `bottom-4`
  - preview: `right-3`, `bottom-3`
- Các offset này luôn cố định, không phụ thuộc vào `showBackToTop`.
- Vì vậy khi `showBackToTop = false`, chỉ còn nút `+`, nhưng wrapper vẫn giữ khoảng đệm cũ nên nhìn bị hở như ảnh anh gửi.
- Showcase `SpeedDial1.tsx` và `SpeedDial3.tsx` dùng `right-2`, nhưng đó là trong context thiết kế demo của họ; còn ở UI hiện tại của dự án, scrollbar/gutter làm khoảng `right-2` vẫn còn nhìn thấy rõ là hở.
- Layout `renderSidebar` ít vấn đề hơn vì đã bám `right-0`; bug chính nằm ở các layout floating đáy phải.

### Root cause answers
1. Triệu chứng: khi chưa scroll, không có back-to-top, nút `+` vẫn bị cách mép phải nên trông “không dính”.
2. Phạm vi ảnh hưởng: create preview, edit preview, site render của các layout floating Speed Dial.
3. Tái hiện ổn định: có; chỉ cần vào trạng thái closed + chưa scroll là thấy.
4. Mốc thay đổi gần nhất: fix spacing trước đó chỉ giảm offset tổng thể, chưa thêm logic offset theo trạng thái `showBackToTop`.
5. Dữ liệu còn thiếu: không thiếu thêm; ảnh user + code hiện tại đủ để kết luận.
6. Giả thuyết thay thế đã loại trừ: không phải do riêng back-to-top; ngay cả khi arrow không render thì wrapper offset vẫn tồn tại. Không phải do page container ngoài component.
7. Rủi ro nếu fix sai nguyên nhân: khi chưa scroll vẫn còn hở, hoặc khi đã scroll thì cụm bị xô lệch giữa arrow và toggle.
8. Tiêu chí pass/fail: ở trạng thái closed và chưa scroll, nút `+` phải dính mép phải hơn rõ rệt; khi có back-to-top, cụm vẫn cân và không bị lệch xấu.

## Root Cause Confidence
**High** — vì evidence trực tiếp là wrapper offset hiện không phụ thuộc `showBackToTop`, trong khi vấn đề user nêu chính xác xuất hiện khi `showBackToTop = false`.

## Files Impacted
### UI
- `Sửa: app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`
  - Vai trò hiện tại: renderer shared cho create/edit/site.
  - Thay đổi: thêm logic anchor/offset theo trạng thái `showBackToTop` và/hoặc closed-state, đặc biệt cho các layout floating bên phải.

## Execution Preview
1. Audit nhóm renderer floating (`fab/pills/stack/dock/minimal`) để tìm điểm chung về wrapper class.
2. Tách offset phải thành 2 trạng thái:
   - có back-to-top: giữ offset cân đối;
   - không có back-to-top: ép sát mép phải hơn.
3. Giữ `renderSidebar` gần như nguyên vì đã bám cạnh; chỉ chỉnh nếu cần consistency.
4. Review static để đảm bảo preview/site cùng logic và không đụng scrollbar quá gắt.
5. Sau implement: `bunx tsc --noEmit`, rồi commit local kèm `.factory/docs`.

## Proposal
### Option A (Recommend) — Confidence 95%
Thêm conditional offset theo `showBackToTop` ngay trong các wrapper class hiện tại.
- Vì sao tốt nhất: sửa đúng root cause, thay đổi nhỏ, rollback dễ.
- Tradeoff: vẫn là tuning theo state, chưa abstract thành helper chung.

### Option B — Confidence 70%
Tạo helper `getRightOffset({ context, isRight, showBackToTop, style })` để quản lý toàn bộ anchor state.
- Phù hợp khi anh muốn tiếp tục tinh chỉnh sâu nhiều vòng nữa.
- Tradeoff: refactor rộng hơn mức cần thiết cho bug hiện tại.

## Acceptance Criteria
- Khi chưa scroll và không có back-to-top, nút `+` bám mép phải hơn rõ rệt, không còn khoảng hở khó chịu như ảnh.
- Khi đã scroll và có back-to-top, cụm vẫn cân đối, không bị lệch rời nhau.
- Không đổi behavior toggle, icon, màu, schema.
- Create, edit và site render cùng hành vi anchor.

## Verification Plan
- Static review: conditional class theo `showBackToTop`, right/left symmetry, overlap với scrollbar.
- Typecheck: `bunx tsc --noEmit`.
- Repro cho tester:
  1. Trạng thái chưa scroll: xác nhận `+` dính mép phải hơn.
  2. Trạng thái đã scroll: xác nhận arrow + `+` vẫn đẹp và không hở xấu.
  3. Test đủ 6 style ở create/edit/site.

## Counter-Hypothesis
- Có thể chỉ cần giảm `right-2` thành `right-1` toàn cục. Nhưng như vậy khi có back-to-top, cụm có thể quá sít hoặc mất cân đối. Vấn đề thật là offset phải cần phụ thuộc state.

## Out of Scope
- Không đổi animation.
- Không đổi schema config.
- Không sửa home-component khác.

## Risk / Rollback
- Rủi ro chính: ép sát quá mức ở state closed làm nút trông dính hẳn vào mép ở vài browser.
- Giảm rủi ro: chỉnh theo state và giữ khoảng tối thiểu an toàn.
- Rollback: revert phần conditional offset trong shared renderer.

Nếu anh duyệt, em sẽ triển khai theo Option A: fix đúng trạng thái `chưa scroll, không có back-to-top` để nút `+` bám mép phải hơn.