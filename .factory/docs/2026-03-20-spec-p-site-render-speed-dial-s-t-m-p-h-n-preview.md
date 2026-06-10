## TL;DR kiểu Feynman
- Preview đã ổn vì em làm nó deterministic hơn, nhưng site render vẫn chưa sát là chuyện khác.
- Nguyên nhân là site render vẫn cố tình chừa offset `right-2` khi có back-to-top hoặc open-state ở hầu hết layout floating.
- Tức là preview và site hiện đang có hai mức anchor khác nhau: preview bớt nhiễu, còn site vẫn giữ khoảng đệm “an toàn” nên mắt anh thấy chưa sát.
- Em sẽ chỉnh riêng site render cho sát mép hơn nữa, không động vào preview đang ổn.
- Mục tiêu là site bám cạnh thực sự, còn preview giữ dễ nhìn trong admin.

## Audit Summary
### Observation
- `components/site/SpeedDialSection.tsx` chỉ pass `context="site"` vào `SpeedDialSectionShared`, không có logic riêng khác.
- Vì vậy toàn bộ khác biệt site vs preview nằm trong `SpeedDialSectionShared.tsx`.
- Audit code cho thấy các layout floating (`renderFab`, `renderPills`, `renderStack`, `renderDock`, `renderMinimal`) đều còn giữ site offset như:
  - `showBackToTop ? 'right-2' : 'right-0'`
  - tương tự cho `left-*`.
- Nghĩa là khi site có back-to-top hoặc open-state, wrapper vẫn bị đẩy vào 0.5rem khỏi mép.
- Đây khớp với feedback mới của anh: preview oke nhưng site render tương ứng chưa sát.
- `renderSidebar` đã dùng `right-0`, nên vấn đề chính nằm ở nhóm floating đáy phải/trái chứ không phải sidebar edge-attached.

### Root cause answers
1. Triệu chứng: site render vẫn chưa sát mép, dù preview đã ổn.
2. Phạm vi ảnh hưởng: site render của các layout floating Speed Dial.
3. Tái hiện ổn định: có; chỉ cần xem site ở trạng thái có back-to-top/open-state là thấy khoảng đệm còn dư.
4. Mốc thay đổi gần nhất: các commit trước ưu tiên preview clarity và closed-state; site vẫn giữ `right-2` cho nhiều state.
5. Dữ liệu còn thiếu: không thiếu thêm; evidence trực tiếp từ code site branch là đủ.
6. Giả thuyết thay thế đã loại trừ: không phải do `components/site/SpeedDialSection.tsx`; file này chỉ bridge props. Root cause là offset trong shared renderer khi `context==='site'`.
7. Rủi ro nếu fix sai nguyên nhân: preview có thể bị ảnh hưởng lại, hoặc site vẫn chưa đủ sát nếu chỉ chỉnh partial.
8. Tiêu chí pass/fail: site render nhìn sát mép rõ rệt hơn preview/admin và đúng ý user, trong khi preview giữ nguyên trạng thái đang ổn.

## Root Cause Confidence
**High** — `SpeedDialSection.tsx` không thêm spacing; offset còn dư nằm trực tiếp trong branch `context === 'site'` của shared renderer.

## Files Impacted
### UI
- `Sửa: app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`
  - Vai trò hiện tại: renderer shared cho preview/site.
  - Thay đổi: giảm riêng site offset của các layout floating ở các state đang còn `right-2/left-2`, giữ preview branch gần như nguyên.
- `Không cần sửa: components/site/SpeedDialSection.tsx`
  - Vai trò hiện tại: bridge config sang shared renderer.
  - Giữ nguyên vì không phải root cause.

## Execution Preview
1. Audit toàn bộ các `siteRight` / `siteLeft` trong 5 layout floating.
2. Đổi riêng branch `context==='site'` sang mức anchor sát hơn (`right-0` hoặc `right-[2px]` kể cả khi có back-to-top/open-state nếu phù hợp).
3. Giữ nguyên preview branch để không phá trạng thái admin hiện đã ổn.
4. Review symmetry cho `bottom-left` để không làm gãy hỗ trợ vị trí trái.
5. Sau implement: `bunx tsc --noEmit`, rồi commit local kèm `.factory/docs`.

## Proposal
### Option A (Recommend) — Confidence 95%
Ép site render floating sát mép hơn preview bằng cách chỉnh riêng branch `context==='site'`.
- Vì sao tốt nhất: giải quyết đúng feedback hiện tại mà không làm preview xấu lại.
- Tradeoff: site và preview sẽ có spacing khác nhau có chủ đích.

### Option B — Confidence 68%
Đồng bộ preview và site cùng một mức anchor sát mép.
- Phù hợp nếu anh muốn parity tuyệt đối.
- Tradeoff: preview admin có thể lại khó đọc hoặc quá sát khung BrowserFrame.

## Acceptance Criteria
- Site render của Speed Dial sát mép hơn rõ rệt, không còn khoảng đệm khó chịu.
- Preview hiện tại giữ nguyên cảm giác “oke”.
- Sidebar edge-attached không bị phá.
- Không đổi behavior toggle/icon/màu/schema.

## Verification Plan
- Static review: site branch offsets vs preview branch offsets.
- Typecheck: `bunx tsc --noEmit`.
- Repro cho tester:
  1. So sánh preview và site cùng style.
  2. Kiểm tra site ở closed/open state.
  3. Kiểm tra cả `bottom-right` và `bottom-left`.

## Counter-Hypothesis
- Có thể cần sửa cả preview để parity. Nhưng feedback hiện tại nói rõ “preview oke”, nên sửa preview tiếp là sai scope.

## Out of Scope
- Không sửa preview đang ổn.
- Không đổi schema config.
- Không đổi animation.

## Risk / Rollback
- Rủi ro chính: site có thể bị sát quá mức ở vài layout/open-state.
- Giảm rủi ro: chỉ chỉnh branch site, giữ preview nguyên và review symmetry trái/phải.
- Rollback: revert riêng phần site offsets trong shared renderer.

Nếu anh duyệt, em sẽ triển khai theo Option A: ép riêng site render sát mép hơn mà không đụng preview.