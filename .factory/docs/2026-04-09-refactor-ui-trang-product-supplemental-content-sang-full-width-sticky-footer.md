# I. Primer

## 1. TL;DR kiểu Feynman
- Trang `/admin/settings/product-supplemental-content` hiện xấu vì đang chia layout 3 cột cố định, khiến form chính chỉ còn khoảng 1/3 chiều ngang.
- Bạn muốn đổi sang `1 cột full width`, tức `Templates -> Form -> Preview` xếp dọc, ưu tiên không gian cho editor và dễ đọc hơn.
- Đồng thời bạn muốn thêm `sticky footer` giống trang edit product, với 2 nút: `Hủy` + `Lưu template`.
- Root cause nằm ở `ProductSupplementalContentManager.tsx`, hiện đang dùng grid `xl:grid-cols-[320px_minmax(0,1fr)_420px]` và action bar chỉ là block thường ở cuối form.
- Hướng sửa hợp lý nhất là giữ nguyên logic CRUD hiện tại, chỉ refactor layout shell + footer actions theo pattern có sẵn ở `app/admin/products/[id]/edit/page.tsx`.

## 2. Elaboration & Self-Explanation
Hiện tại manager của feature này đang được dựng theo kiểu desktop tool 3 cột:
- cột trái: danh sách templates,
- cột giữa: form chỉnh sửa,
- cột phải: preview.

Kiểu này phù hợp khi mỗi cột đều ngắn và đơn giản. Nhưng ở đây phần giữa lại chứa nhiều khối lớn như:
- thông tin template,
- chọn phạm vi áp dụng,
- rich editor nội dung đầu,
- FAQ editor,
- rich editor nội dung cuối.

Khi nhét form đó vào cột giữa, chiều ngang editor bị bóp lại, nhìn rất chật, đặc biệt với LexicalEditor. Trong screenshot có thể thấy phần nhập liệu và preview đều bị “cột hóa”, nên toàn bộ trang trông loãng và khó dùng.

Nếu chuyển sang 1 cột full width, từng section sẽ có đủ chiều ngang để thở. Cách này hợp hơn với một trang cấu hình dài, nhiều editor, nhiều card. Danh sách templates có thể để thành một card riêng ở trên cùng; form nằm ngay dưới; preview nằm cuối trang. Như vậy luồng đọc và thao tác sẽ tự nhiên hơn.

Sticky footer cũng là phần còn thiếu. Hiện action `Lưu template` đang nằm ở cuối nội dung nên khi kéo xuống/đang chỉnh editor dài, người dùng khó quay lại thao tác lưu. Pattern trang edit product đã giải quyết chuyện này bằng 1 footer cố định dưới màn hình với nút `Hủy bỏ` và `Lưu thay đổi`. Đây là pattern rất nên copy cho trang này để đồng bộ UX.

## 3. Concrete Examples & Analogies
Ví dụ trực tiếp từ trang hiện tại:
- `LexicalEditor` trong “Nội dung đầu mô tả sản phẩm” đang bị đặt ở cột giữa của grid 3 cột, nên editor nhìn hẹp và cao quá mức cần thiết.
- Preview sản phẩm thật nằm ở cột phải, nhưng cũng khá hẹp nên nội dung preview khó đọc và không tận dụng được full chiều ngang trang.

Analogy đời thường:
- Giống như bạn trải 3 món đồ lớn lên một chiếc bàn hẹp: mỗi món đều chật. Trong khi món chính ở đây là “form soạn nội dung”, nên tốt hơn là trải từng món theo hàng dọc trên một bàn dài, chứ không chia 3 ô nhỏ ngang nhau.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - `app/admin/settings/_components/ProductSupplementalContentManager.tsx` đang render root layout bằng:
    - `grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_420px]`
  - Điều này tạo 3 cột: list / form / preview.
  - Action bar hiện tại chỉ là block cuối form:
    - `div.flex.items-center.justify-between...`
    - không sticky.
  - Trang edit product có sticky footer chuẩn ở:
    - `app/admin/products/[id]/edit/page.tsx`
    - block `fixed bottom-0 left-0 lg:left-[280px] right-0 ...`
- Inference:
  - Vấn đề chính là layout shell không phù hợp với loại nội dung dài + editor rich text.
  - Footer action hiện chưa theo pattern admin chính của repo.
- Decision:
  - Chỉ refactor UI shell và footer actions, không đổi logic CRUD/validation/data flow.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root Cause Confidence: High
- Reason:
  - Evidence trực tiếp có trong JSX layout của `ProductSupplementalContentManager.tsx`.
  - 3 cột cố định là nguyên nhân làm nội dung chính chỉ chiếm khoảng 1/3 chiều ngang usable.

- Trả lời 5/8 câu bắt buộc theo protocol:
  1. Triệu chứng quan sát được là gì?
     - Expected: trang cấu hình editor dài phải thoáng, full-width, dễ thao tác; footer lưu luôn nhìn thấy.
     - Actual: form bị bóp ngang do grid 3 cột, footer lưu không sticky.
  2. Phạm vi ảnh hưởng?
     - Chỉ ảnh hưởng UI/UX trang `/admin/settings/product-supplemental-content`.
  3. Có tái hiện ổn định không?
     - Có, mở route này là thấy ngay layout 3 cột + thiếu sticky footer.
  4. Mốc thay đổi gần nhất?
     - Đây là UI của feature mới vừa thêm, chưa được tối ưu layout cho use case thực tế.
  5. Dữ liệu nào đang thiếu?
     - Không thiếu dữ liệu để chốt refactor UI này.
  6. Có giả thuyết thay thế hợp lý nào chưa bị loại trừ?
     - Có thể chỉ cần nới cột giữa rộng hơn; nhưng bạn đã chốt muốn 1 cột full width, nên không còn là hướng tối ưu.
  7. Rủi ro nếu fix sai nguyên nhân?
     - Có thể tạo layout mới vẫn chưa đủ thoáng hoặc sticky footer đè nội dung cuối trang.
  8. Tiêu chí pass/fail sau khi sửa?
     - Pass khi layout chuyển sang 1 cột full width và có sticky footer `Hủy + Lưu template` giống pattern edit product.

- Counter-Hypothesis (Giả thuyết đối chứng)
  - Giả thuyết: chỉ cần tăng chiều rộng cột giữa là đủ.
  - Bác bỏ:
    - Không giải quyết việc preview và list vẫn chiếm ngang.
    - Không đúng yêu cầu bạn đã chốt: `1 cột full width (Templates -> Form -> Preview xếp dọc)`.

# IV. Proposal (Đề xuất)
## 1. Layout mới: 1 cột full width
Refactor root layout của manager từ grid 3 cột sang stack dọc:
1. Card `Templates`
2. Card/Form `Cấu hình template`
3. Card `Nội dung đầu`
4. Card `FAQ bổ sung`
5. Card `Nội dung cuối`
6. Card `Preview trên sản phẩm thật`
7. Sticky footer ở đáy viewport

### Cách hiển thị đề xuất
- Toàn bộ nội dung nằm trong 1 cột duy nhất.
- `Templates` vẫn giữ danh sách chọn template, nhưng chuyển thành block full-width phía trên.
- `Preview` chuyển xuống cuối trang, full-width, để dễ đọc hơn.
- Có thể trong block `Templates`, items vẫn xếp dọc như hiện tại hoặc responsive grid 2-3 cột nhỏ nếu nhiều template; nhưng overall page vẫn là 1 column flow.

## 2. Sticky footer
Copy pattern từ edit product:
- footer cố định ở đáy màn hình
- có 2 nút:
  - `Hủy`
  - `Lưu template`
- trạng thái nút save giữ logic hiện có:
  - loading khi đang lưu
  - disable khi không có quyền edit hoặc đang saving

### Hành vi nút Hủy
Có 2 lựa chọn hành vi hợp lý, nhưng trong bối cảnh hiện tại nên dùng cách ít bất ngờ nhất:
- Nếu đang sửa template đã chọn: reset form về dữ liệu của template đó.
- Nếu đang tạo template mới: clear form về empty state.

Không nên `router.push` ra trang khác, vì đây là settings manager chứ không phải trang edit dedicated như product edit.

## 3. Khoảng đệm cuối trang
Vì có sticky footer, cần thêm bottom spacing cho main content để phần editor cuối / preview cuối không bị footer che.
- ví dụ: `pb-28` hoặc tương đương ở container content trong manager.

## 4. Giữ nguyên logic không động tới
- Không đổi API query/mutation.
- Không đổi validation no-overlap.
- Không đổi cấu trúc FAQ drag-drop.
- Không đổi rich editor.
- Không đổi route/sidebar/module setting.

Mục tiêu là UI-only refactor, rollback dễ.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/admin/settings/_components/ProductSupplementalContentManager.tsx`
  - Vai trò hiện tại: render toàn bộ manager gồm list, form, preview và action buttons.
  - Thay đổi: đổi shell layout từ grid 3 cột sang 1 cột full width; chuyển preview xuống dưới; thêm sticky footer `Hủy + Lưu template`; thêm spacing đáy để tránh footer đè nội dung.

- Tham chiếu, không sửa hoặc chỉ đọc để copy pattern: `app/admin/products/[id]/edit/page.tsx`
  - Vai trò hiện tại: trang edit product có sticky footer chuẩn.
  - Thay đổi dự kiến: chỉ học pattern UI/footer từ đây để áp dụng sang manager page.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại `ProductSupplementalContentManager.tsx` và xác định các block section hiện có.
2. Gỡ root grid 3 cột, chuyển sang stack dọc full-width.
3. Đưa `Templates` thành card đầu trang, `Preview` thành card cuối trang.
4. Tách action buttons cuối form thành sticky footer cố định.
5. Thêm logic `Hủy` để reset form theo selected template hoặc clear khi đang tạo mới.
6. Thêm bottom padding cho content để footer không che editor/preview.
7. Static review để chắc không làm vỡ save/delete/select template flow.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Verification tĩnh theo code path.
- Checklist:
  - Root container không còn `xl:grid-cols-[320px_minmax(0,1fr)_420px]`.
  - Flow hiển thị đúng thứ tự: `Templates -> Form -> Preview`.
  - Footer dùng `fixed bottom-0 ...` tương tự pattern product edit.
  - Có đủ 2 nút `Hủy` và `Lưu template`.
  - Nội dung cuối trang không bị footer che nhờ padding bottom.
  - Logic chọn template / tạo mới / lưu / xóa không bị ảnh hưởng.

- Repro mong đợi sau khi sửa:
  1. Mở `/admin/settings/product-supplemental-content`.
  2. Thấy trang hiển thị 1 cột full width.
  3. Editor pre/post rộng ngang, dễ soạn hơn.
  4. Preview nằm dưới cùng, full width, dễ đọc hơn.
  5. Kéo xuống đâu cũng thấy sticky footer với `Hủy` + `Lưu template`.

# VIII. Todo
- [ ] Refactor layout manager sang 1 cột full width
- [ ] Chuyển preview xuống cuối flow dọc
- [ ] Thêm sticky footer theo pattern edit product
- [ ] Thêm logic `Hủy` reset form phù hợp selected template / new template
- [ ] Thêm spacing đáy tránh footer che nội dung
- [ ] Static review và commit local

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Trang `/admin/settings/product-supplemental-content` không còn layout 3 cột.
- Toàn bộ page hiển thị theo 1 cột full width: `Templates -> Form -> Preview`.
- Các editor nội dung đầu/cuối và FAQ có chiều ngang lớn, không còn bị bóp như hiện tại.
- Có sticky footer cố định ở đáy màn hình.
- Sticky footer có đúng 2 nút: `Hủy` và `Lưu template`.
- Nút `Hủy` reset form hợp lý theo trạng thái đang sửa/tạo mới.
- Nội dung cuối trang không bị footer che.
- Không thay đổi behavior CRUD hiện có.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro:
  - Sticky footer có thể đè nội dung nếu quên padding đáy.
  - Nếu reset logic viết chưa chuẩn, nút `Hủy` có thể clear nhầm state đang edit.
- Rollback:
  - Revert riêng `ProductSupplementalContentManager.tsx` là quay về layout cũ.

# XI. Out of Scope (Ngoài phạm vi)
- Đổi data model / validation / assignment logic.
- Refactor preview component sâu hơn.
- Tối ưu mobile layout beyond mức cần thiết.
- Thêm autosave hoặc save status nâng cao như trang edit product.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity lớn; bạn đã chốt rõ:
  - `1 cột full width`
  - sticky footer có `Hủy + Lưu template`

Nếu bạn duyệt spec này, mình sẽ chỉ làm UI refactor đúng scope: full-width 1 cột + sticky footer, không đụng logic feature khác.