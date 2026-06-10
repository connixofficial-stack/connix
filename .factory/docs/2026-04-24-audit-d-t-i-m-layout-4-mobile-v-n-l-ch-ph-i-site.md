# I. Primer

## 1. TL;DR kiểu Feynman
- Đã audit lại từ route site thật xuống renderer cuối cùng, không thấy wrapper site nào khác đang “bí mật” đẩy layout 4 sang phải.
- Luồng site thật là: `HomePageClient -> HomeComponentRenderer -> registry -> components/site/BlogSection.tsx -> BlogSectionRuntime`.
- Các fix trước đã chạm đúng `BlogSectionRuntime`, nhưng mới siết phần header/wrapper ngoài; chưa khóa alignment đủ sâu ở block card/content của layout 4.
- Vì vậy bug còn lại nhiều khả năng vẫn nằm trong chính nhánh `layout4` của `BlogSectionRuntime.tsx`, không phải ở renderer site khác.
- Hướng sửa tiếp theo: ép left-align dứt điểm cho các node layout 4 mobile ở đúng source of truth này, rồi review tĩnh diff thật chặt trước khi commit.

## 2. Elaboration & Self-Explanation
Lần này audit kỹ hơn thay vì đoán tiếp. Mục tiêu là trả lời câu hỏi: “Có phải site thật đang đi qua một chỗ render khác preview nên mọi fix trước không ăn?”

Kết quả: không. Cả preview và site đều dùng cùng `BlogSectionRuntime`. Preview khác ở chỗ nó gọi runtime với `context="preview"`, còn site gọi với `context="site"`. Nhưng không có evidence cho việc `HomeComponentRenderer`, `registry`, hay `components/site/BlogSection.tsx` đang thêm CSS riêng làm layout 4 mobile lệch phải.

Điểm quan trọng là các fix trước mới dừng ở:
- wrapper ngoài của layout 4
- header wrapper
- cụm nút action

Nhưng bản thân layout 4 còn các lớp bên dưới như:
- block item/card
- content wrapper
- text block

Các lớp này chưa được explicit left-align hoàn toàn. Nếu có inherited alignment hoặc interaction giữa flex/container/width trong runtime thật, UI vẫn có thể “trông như căn phải / không bám trái đúng preview”, dù header ngoài đã sửa.

Nói ngắn gọn: lần trước sửa đúng file nhưng chưa sửa đủ sâu đến đúng visual source của drift. Lần này cần khóa alignment ở toàn bộ nhánh layout 4 mobile, không chỉ header.

## 3. Concrete Examples & Analogies
### a) Ví dụ cụ thể bám repo
Trong `BlogSectionRuntime.tsx`, nhánh `layout4` hiện có các lớp đã sửa như:
- outer shell: `flex flex-col items-start`
- header wrapper: mobile `flex-col items-start`
- action wrapper: `self-start`

Nhưng card/item vẫn còn dạng gần như:
- `article className="flex flex-col bg-white"`
- content wrapper: `div className="px-2"`

Nếu mục tiêu là site mobile phải nhìn “dính trái” như preview, thì chỉ sửa header là chưa đủ. Cần audit và khóa thêm ở item/content text alignment trong cùng nhánh `layout4`.

### b) Analogy đời thường
Giống như chỉnh cho cái tủ đứng thẳng bằng cách nắn chân trên, nhưng thân tủ vẫn hơi xoay. Nhìn tổng thể nó vẫn lệch. Muốn hết lệch thì phải chỉnh cả phần thân đang giữ bố cục, không chỉ phần đầu tủ.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - User xác nhận site mobile layout 4 vẫn lệch phải sau các fix trước.
  - Audit lại cho thấy site thật render qua đúng `components/site/BlogSection.tsx` rồi vào `BlogSectionRuntime.tsx`.
  - Không tìm thấy wrapper site-specific nào override alignment của Blog layout 4 sau runtime.
- Evidence:
  - `components/site/home/registry.tsx` map `Blog` sang `BlogSection`.
  - `components/site/home/HomeComponentRenderer.tsx` chỉ bọc font, không có class alignment riêng cho Blog.
  - `components/site/BlogSection.tsx` chỉ query/map data rồi gọi `BlogSectionRuntime` với `context="site"`.
  - `app/admin/home-components/blog/_components/BlogSectionRuntime.tsx` là nơi chứa toàn bộ layout 4 markup.
  - Git history gần nhất cho layout 4 mobile đã sửa: `d701eeec`, `ef69ca56`, `caf74b31`.
- Inference:
  - Giả thuyết “site có renderer khác” bị loại trừ mạnh.
  - Root cause còn lại hợp lý nhất là layout 4 runtime chưa explicit left-align đủ ở các lớp card/content.
- Decision:
  - Tiếp tục sửa trong `BlogSectionRuntime.tsx`, nhưng lần này audit theo chiều sâu trong chính nhánh `layout4`, không dừng ở header.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
## 1. Root Cause
- Triệu chứng quan sát được:
  - Expected: site mobile layout 4 phải bám trái giống preview.
  - Actual: user vẫn thấy khối nội dung/trục nhìn như nằm bên phải hoặc không bám trái đủ đẹp.
- Phạm vi ảnh hưởng:
  - Chỉ liên quan Blog layout 4 trên site mobile/parity preview-site.
- Tái hiện:
  - Theo phản hồi user, bug vẫn tái hiện ổn định sau các commit fix trước.
- Mốc thay đổi gần nhất:
  - `d701eeec fix(blog): align mobile layout 4 header`
  - `ef69ca56 fix(blog): remove layout 4 header divider`
  - `caf74b31 fix(blog): left align layout 4 mobile content`
- Dữ liệu còn thiếu:
  - Chưa có browser repro trực tiếp trong task này để đo computed layout ngoài ảnh chụp.
- Giả thuyết thay thế đã bị loại trừ:
  - Không có site wrapper riêng đang override layout 4.
- Rủi ro nếu fix sai nguyên nhân:
  - Tiếp tục chỉnh các wrapper ngoài nhưng UI thực vẫn lệch, gây churn commit.
- Tiêu chí pass/fail sau khi sửa:
  - Site mobile nhìn bám trái như preview tại cả header lẫn content block layout 4.

**Nguyên nhân gốc khả dĩ nhất:** nhánh `layout4` trong `BlogSectionRuntime.tsx` chưa khóa left-alignment đủ triệt để cho toàn bộ block card/content mobile. Confidence: Medium-High.

## 2. Counter-Hypothesis
### a) Có renderer site khác override sau runtime
- Confidence: Low.
- Audit trace render path không tìm thấy evidence.

### b) Preview và site dùng hai markup khác nhau
- Confidence: Low.
- Cả hai cùng dùng `BlogSectionRuntime`.

### c) Site đang chạy bundle cũ/chưa reload
- Confidence: Medium.
- Có thể xảy ra, nhưng không nên lấy đó làm giải thích chính khi markup layout 4 vẫn còn vùng chưa explicit left-align.

# IV. Proposal (Đề xuất)
## 1. Hướng sửa được chọn
- Sửa tiếp trong `app/admin/home-components/blog/_components/BlogSectionRuntime.tsx`.
- Mở rộng phạm vi fix trong chính nhánh `layout4` từ header sang các lớp item/card/content để khóa left-align dứt điểm trên mobile.

## 2. Cách làm cụ thể
- Audit nội bộ nhánh `layout4` theo thứ tự:
  1. outer shell
  2. header wrapper
  3. action wrapper
  4. item list wrapper
  5. article/card root
  6. content wrapper
  7. text block
- Thêm explicit alignment ở nơi cần thiết, ví dụ nhóm class như `items-start`, `text-left`, hoặc tương đương tùy đúng node.
- Giữ scope hẹp:
  - không đụng `components/site/BlogSection.tsx`
  - không đụng `HomeComponentRenderer`
  - không đổi data flow/query/config
- Sau sửa, review diff để chắc chỉ ảnh hưởng layout 4.

## 3. Vì sao đây là hướng tốt nhất
- Bám đúng evidence mới nhất.
- Tránh tiếp tục sửa nhầm ở wrapper site không phải root cause.
- Vẫn giữ source of truth một chỗ cho cả preview và site.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/admin/home-components/blog/_components/BlogSectionRuntime.tsx`
  - Vai trò hiện tại: source of truth render cho Blog preview/site, bao gồm toàn bộ layout 4 markup.
  - Thay đổi: siết explicit left-alignment cho các node layout 4 mobile theo chiều sâu, không chỉ header.

- Không sửa: `components/site/BlogSection.tsx`
  - Vai trò hiện tại: adapter dữ liệu site.
  - Không đổi vì audit không thấy đây là nguồn gây lệch phải.

- Không sửa: `components/site/home/HomeComponentRenderer.tsx`
  - Vai trò hiện tại: home renderer tổng quát.
  - Không đổi vì không có evidence override alignment riêng cho Blog.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại nhánh `layout4` trong `BlogSectionRuntime.tsx` từ outer shell đến article/content.
2. Chỉnh explicit left-align ở các node cần thiết cho mobile parity.
3. Tự review diff để chắc chỉ chạm layout 4.
4. Commit local với message phản ánh đúng fix cuối.

# VII. Verification Plan (Kế hoạch kiểm chứng)
## 1. Audit Summary
- Xác nhận chỉ sửa `BlogSectionRuntime.tsx`.
- Xác nhận không còn phải dựa vào giả thuyết wrapper site ẩn.

## 2. Root Cause Confidence
- Medium-High: đủ evidence để loại trừ render path khác; phần còn lại nằm trong layout 4 runtime.

## 3. Verification Plan
- Static review diff:
  - chỉ nhánh `layout4` đổi
  - không đổi API props
  - không đổi query/data flow
- Visual expectation:
  - header bám trái
  - block card/content cũng bám trái như preview
  - không gây drift ở layout 1/2/3/5/6

# VIII. Todo
1. Audit sâu các node alignment trong nhánh `layout4` của `BlogSectionRuntime.tsx`.
2. Thêm explicit left-align cho block card/content mobile.
3. Review diff và commit local.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Site thực mobile của Blog layout 4 bám trái giống preview, không còn cảm giác nằm bên phải.
- Fix nằm trong source of truth `BlogSectionRuntime.tsx`.
- Không ảnh hưởng các layout blog khác.
- Không thay đổi data/query/config của Blog section.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro thấp:
  - Nếu thêm alignment quá rộng, desktop/tablet có thể bị đổi nhẹ.
- Rollback:
  - revert riêng commit chỉnh nhánh `layout4` trong `BlogSectionRuntime.tsx`.

# XI. Out of Scope (Ngoài phạm vi)
- Refactor toàn bộ hệ responsive helper của Blog.
- Sửa các drift thị giác khác không liên quan left/right alignment mobile.
- Đụng tới renderer home tổng hoặc query data site.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity lớn về nơi cần sửa; ambiguity còn lại chỉ là node cụ thể nào trong nhánh `layout4` cần siết thêm alignment, và việc này sẽ được giải bằng audit trực tiếp trong lúc implement.