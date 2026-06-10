## TL;DR kiểu Feynman
- Ảnh mới cho thấy vấn đề không chỉ là khoảng cách mép phải; preview hiện còn gây hiểu nhầm vì có phần tử giả (`+` tile) và trạng thái scroll lấy từ trang admin thật.
- Kết quả là người nhìn preview khó biết đâu là speed dial thật, đâu là chi tiết minh hoạ của page mock.
- Ngoài ra, tab đang chọn là `Sidebar` nhưng cảm giác hiển thị chưa đủ rõ, nên audit phải xử lý cả độ rõ của closed-state và tín hiệu preview.
- Em đề xuất sửa đúng 3 thứ: bỏ/giảm nhiễu của page mock ở góc phải, tách scroll preview khỏi scroll trang admin, và làm closed-state/sidebar rõ hơn đúng layout đang chọn.
- Như vậy mới audit đúng UX thay vì chỉ tiếp tục giảm `right-*` mù quáng.

## Audit Summary
### Observation
- `renderPageMock()` trong `app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx` đang luôn render một ô `+` giả ở góc trên phải:
  - `absolute top-3 right-3 w-10 h-10 ... > +`
- Ảnh user gửi cho thấy chính ô `+` giả này làm preview rối: người xem có thể tưởng đó là một phần của speed dial/layout.
- `SpeedDialSectionShared` đang lấy `isScrolled` từ `window.scrollY` của trang admin thật:
  - Điều này làm nút back-to-top trong preview phụ thuộc vào việc scroll trang create/edit, không phải scroll của chính preview mock.
- `SpeedDialPreview` và `PreviewWrapper` không có cơ chế reset state riêng theo style; khi đổi style, preview dùng state dùng chung của renderer nên closed/open perception có thể không rõ.
- Với `Sidebar`, closed-state hiện chỉ là một tab mảnh `w-6` ở mép phải; trong preview nó quá nhẹ, nên dù tab `Sidebar` đang active người nhìn vẫn khó nhận ra layout.

### Root cause answers
1. Triệu chứng: preview “vẫn chưa oke” dù đã chỉnh mép phải; user vẫn thấy layout chưa đúng/khó đọc.
2. Phạm vi ảnh hưởng: create preview, edit preview; site render bị ảnh hưởng một phần ở anchor/closed-state nhưng không bị ô `+` giả của page mock.
3. Tái hiện ổn định: có; chỉ cần mở preview là thấy ô `+` giả ở góc phải và behavior back-to-top lệch ngữ cảnh.
4. Mốc thay đổi gần nhất: các fix trước chủ yếu chỉnh offset nhưng chưa xử lý nhiễu preview hay dependency vào `window.scrollY` của admin page.
5. Dữ liệu còn thiếu: không thiếu thêm; ảnh user + code hiện tại đủ để kết luận.
6. Giả thuyết thay thế đã loại trừ: không chỉ là `right-0/right-1`; dù offset sát hơn, preview vẫn rối vì signal sai (mock tile, scroll state thật, closed-state sidebar quá mờ).
7. Rủi ro nếu fix sai nguyên nhân: sẽ tiếp tục có các vòng chỉnh spacing nhưng UX preview vẫn sai cảm nhận.
8. Tiêu chí pass/fail: nhìn vào preview phải phân biệt ngay speed dial thật, layout đang chọn phải dễ nhận, back-to-top chỉ xuất hiện khi hợp lý trong preview/site.

## Root Cause Confidence
**High** — vì evidence trực tiếp trong code chỉ ra 3 nguồn nhiễu rõ ràng: mock `+` tile, `window.scrollY` dùng chung, và closed-state `Sidebar` quá subtle trong preview.

## Files Impacted
### UI
- `Sửa: app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`
  - Vai trò hiện tại: renderer shared cho preview/site.
  - Thay đổi:
    1. bỏ hoặc de-emphasize `+` tile trong `renderPageMock` khi preview speed dial;
    2. tách logic hiển thị back-to-top khỏi `window.scrollY` của admin page, thay bằng preview-only contract hợp lý;
    3. làm closed-state `Sidebar` rõ hơn trong preview/site.
- `Có thể sửa nhẹ: app/admin/home-components/speed-dial/_components/SpeedDialPreview.tsx`
  - Vai trò hiện tại: wrapper preview.
  - Thay đổi: thêm key/reset signal theo style nếu cần để preview phản ánh đúng layout khi đổi tab.
- `Có thể sửa nhẹ: app/admin/home-components/_shared/components/PreviewWrapper.tsx`
  - Vai trò hiện tại: khung preview + controls.
  - Thay đổi: chỉ nếu cần truyền signal preview scroll/focus riêng; khả năng thấp hơn.

## Execution Preview
1. Gỡ nhầm lẫn thị giác: bỏ `+` tile giả ở `renderPageMock` hoặc thay bằng phần tử neutral không cạnh tranh với speed dial thật.
2. Chỉnh contract preview scroll:
   - preview không nên dựa vào `window.scrollY` của trang admin;
   - có thể ẩn hẳn back-to-top trong preview closed-state hoặc dùng cờ preview riêng để deterministic hơn.
3. Tăng độ nhận biết cho `Sidebar` closed-state (handle rõ hơn, contrast cao hơn, width/hit area rõ hơn) để nhìn phát biết đây là sidebar.
4. Nếu cần, reset `isOpen` theo style change để khi đổi tab preview không mang theo state gây hiểu lầm.
5. Sau implement: `bunx tsc --noEmit`, rồi commit local kèm `.factory/docs`.

## Proposal
### Option A (Recommend) — Confidence 94%
Sửa preview signal + visual noise trước, rồi mới tinh chỉnh spacing còn lại nếu cần.
- Vì sao tốt nhất: xử lý đúng nguyên nhân người dùng đang thấy “chưa oke” trong ảnh.
- Tradeoff: scope rộng hơn một chút so với chỉ đổi `right-*`, nhưng đúng bệnh hơn nhiều.

### Option B — Confidence 63%
Chỉ tiếp tục chỉnh spacing/anchor cho sidebar và closed-state.
- Phù hợp nếu anh chỉ quan tâm mép phải.
- Tradeoff: preview vẫn rối vì ô `+` giả và back-to-top lấy theo scroll của trang admin.

## Acceptance Criteria
- Preview không còn gây nhầm lẫn giữa speed dial thật và phần tử mock góc phải.
- `Sidebar` khi được chọn nhìn rõ là sidebar, kể cả closed-state.
- Back-to-top trong preview không còn phụ thuộc scroll của toàn trang admin theo cách gây hiểu nhầm.
- Create/edit/site giữ cùng logic tổng thể, không đổi schema/icon/màu.

## Verification Plan
- Static review: preview-only mock elements, state source của back-to-top, contrast/size của sidebar handle.
- Typecheck: `bunx tsc --noEmit`.
- Repro cho tester:
  1. Mở create page, chọn từng tab style.
  2. Kiểm tra `Sidebar` closed-state nhìn ra ngay.
  3. Xác nhận không còn ô `+` giả gây hiểu nhầm.
  4. Scroll trang admin và kiểm tra preview không phản ứng sai ngữ cảnh.

## Counter-Hypothesis
- Có thể user chỉ đang chê anchor. Nhưng ảnh mới cho thấy vấn đề nhận diện preview cũng rất rõ; nếu không xử lý, tiếp tục chỉnh offset sẽ vẫn bị đánh giá “chưa oke”.

## Out of Scope
- Không đổi schema config.
- Không thêm animation library.
- Không sửa các home-component khác.

## Risk / Rollback
- Rủi ro chính: nếu ẩn toàn bộ back-to-top trong preview có thể mất tín hiệu behavior.
- Giảm rủi ro: chỉ làm preview deterministic hơn, site render vẫn giữ behavior thật.
- Rollback: revert các thay đổi trong shared renderer/preview wrapper.

Nếu anh duyệt, em sẽ triển khai theo Option A: sửa đúng tín hiệu preview và visual noise trước rồi mới tinh chỉnh spacing nhỏ nếu còn cần.