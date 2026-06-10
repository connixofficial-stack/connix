## TL;DR kiểu Feynman
- Em audit lại code hiện tại thì đúng là fix trước vẫn chưa đủ: closed-state vẫn đang dùng `right-1`, nên mắt thường vẫn thấy hở.
- Với UI floating nhỏ như nút `+`, chỉ giảm từ `right-2` xuống `right-1` là chưa đủ để tạo cảm giác “dính mép”.
- Root cause không còn là chuyện có hay không back-to-top nữa, mà là offset hiện tại vẫn còn dương và wrapper chưa thật sự neo sát cạnh.
- Em sẽ ép closed-state của các layout floating sát mép phải hơn nữa, khả năng là `right-0` hoặc `right-[2px]` tùy layout để vừa sát vừa không cấn border.
- Phạm vi vẫn là create, edit, site render vì tất cả đi qua shared renderer.

## Audit Summary
### Observation
- Hiện tại trong `app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`:
  - `renderFab`, `renderPills`, `renderStack`, `renderDock`, `renderMinimal` đang dùng `siteRight = showBackToTop ? 'right-2' : 'right-1'`.
  - Preview tương ứng dùng `right-3/right-2`.
- User feedback mới xác nhận `right-1` vẫn còn hở rõ bằng mắt.
- Với nút tròn `w-9 h-9` có border/shadow, offset 0.25rem vẫn tạo khoảng trắng thấy được cạnh scrollbar.
- `renderSidebar` đã dùng `right-0`, nên ít bị phàn nàn hơn; điều này củng cố rằng closed-state floating cần bám mép mạnh hơn.

### Root cause answers
1. Triệu chứng: closed-state vẫn chưa sát mép phải dù đã giảm offset một lần.
2. Phạm vi ảnh hưởng: các layout floating ở create preview, edit preview, site render.
3. Tái hiện ổn định: có; ở trạng thái chưa scroll và closed-state luôn thấy.
4. Mốc thay đổi gần nhất: commit `fix(speed-dial): anchor closed state to edge` mới đưa từ `right-2` xuống `right-1`, nhưng chưa đủ.
5. Dữ liệu còn thiếu: không thiếu thêm; feedback user là evidence trực tiếp rằng mức chỉnh hiện tại chưa đạt.
6. Giả thuyết thay thế đã loại trừ: không phải do back-to-top nữa; bug vẫn còn ngay cả khi đã có logic theo `showBackToTop`.
7. Rủi ro nếu fix sai nguyên nhân: tiếp tục chỉnh nhỏ giọt mà UI vẫn còn hở, tốn vòng feedback.
8. Tiêu chí pass/fail: closed-state phải nhìn “dính mép” ngay bằng mắt, không còn bị user cảm nhận là hở.

## Root Cause Confidence
**High** — code hiện tại vẫn để `right-1`, và feedback trực tiếp của anh xác nhận mức này chưa đạt yêu cầu.

## Files Impacted
### UI
- `Sửa: app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`
  - Vai trò hiện tại: shared renderer cho toàn bộ create/edit/site.
  - Thay đổi: ép closed-state offset của các layout floating từ `right-1` xuống sát hơn (`right-0` hoặc gần tương đương), đồng thời giữ spacing hợp lý khi có back-to-top.

## Execution Preview
1. Audit lại từng renderer floating để xác định closed-state offset hiện tại đang lấy từ đâu.
2. Đổi closed-state bên phải từ `right-1` sang `right-0` cho site; preview cũng giảm tương ứng để phản ánh đúng hơn.
3. Giữ open-state/back-to-top state riêng nếu cần để cụm không bị dồn quá sát khi đã có nhiều phần tử.
4. Review nhanh symmetry cho bên trái (`left-0/left-1`) để không làm gãy support `bottom-left`.
5. Sau implement: `bunx tsc --noEmit`, rồi commit local kèm `.factory/docs`.

## Proposal
### Option A (Recommend) — Confidence 96%
Ép closed-state của các layout floating sang `right-0`/`left-0`.
- Vì sao tốt nhất: xử lý thẳng vào mức offset đang còn dư, ít vòng lặp nhất.
- Tradeoff: ở vài browser có scrollbar/gutter rất dày có thể nhìn sát hơn hẳn, nhưng đây đúng ý anh đang muốn.

### Option B — Confidence 72%
Dùng offset siêu nhỏ kiểu `right-[2px]` thay vì `right-0`.
- Phù hợp nếu muốn “gần sát” nhưng vẫn chừa một khe an toàn rất nhỏ.
- Tradeoff: khó nhất quán hơn và vẫn có nguy cơ bị anh thấy còn hở.

## Acceptance Criteria
- Closed-state của speed dial floating nhìn sát mép phải thực sự, không còn cảm giác hở.
- Khi có back-to-top hoặc open-state, layout vẫn ổn, không bị đè/xấu.
- Không đổi behavior toggle, icon, màu, schema.
- Create, edit, site render nhất quán.

## Verification Plan
- Static review: offset classes closed/open state, symmetry phải/trái.
- Typecheck: `bunx tsc --noEmit`.
- Repro cho tester:
  1. Chưa scroll + closed-state: kiểm tra sát mép phải.
  2. Đã scroll + closed-state: kiểm tra cụm với back-to-top.
  3. Open-state: kiểm tra action list không bị lệch mép xấu.

## Counter-Hypothesis
- Có thể do shadow/border làm cảm giác còn hở. Điều đó đúng một phần, nhưng evidence hiện tại cho thấy offset bản thân wrapper vẫn còn dư; phải xử lý offset trước.

## Out of Scope
- Không đổi animation.
- Không đổi schema.
- Không sửa component khác.

## Risk / Rollback
- Rủi ro chính: closed-state có thể quá sát ở vài browser.
- Giảm rủi ro: chỉ ép sát closed-state floating, không đụng sidebar và không thay đổi behavior khác.
- Rollback: revert phần offset class trong shared renderer.

Nếu anh duyệt, em sẽ triển khai theo Option A: ép closed-state sang sát mép thực sự thay vì giảm nhẹ như hiện tại.