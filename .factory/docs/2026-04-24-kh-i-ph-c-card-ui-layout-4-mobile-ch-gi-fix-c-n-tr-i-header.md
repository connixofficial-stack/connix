# I. Primer

## 1. TL;DR kiểu Feynman
- Regression lần này đến từ việc fix quá tay trong nhánh `layout4` của `BlogSectionRuntime.tsx`.
- Các class mới thêm vào item/card/content đã làm vỡ bố cục card, khiến thumbnail nhìn như biến mất và UI bị “nát”.
- Theo quyết định của anh, hướng đúng là: khôi phục UI card như trước, chỉ giữ fix căn trái ở header.
- Vì vậy cần rollback phần alignment sâu ở item/card/content, nhưng giữ lại fix header đang đúng.
- File cần sửa vẫn chỉ là `app/admin/home-components/blog/_components/BlogSectionRuntime.tsx`.

## 2. Elaboration & Self-Explanation
Lần fix trước dựa trên giả thuyết rằng không chỉ header mà cả item/card/content của layout 4 đều cần ép `text-left`, `items-start`, `w-full`. Tuy nhiên ảnh mới cho thấy hệ quả phụ: card UI bị hỏng, thumbnail không còn hiển thị đúng khối như trước. Nghĩa là fix đã đi quá sâu so với vấn đề thật.

Observation quan trọng là user vẫn muốn:
- header mobile phải căn trái giống preview
- nhưng card UI phải quay về như trước khi regression xảy ra

Điều này giúp thu hẹp scope rất rõ: không tiếp tục “khóa alignment mọi node”, mà chỉ giữ những thay đổi cần thiết ở header/wrapper header. Các class thêm vào `ItemLink`, `article`, `content wrapper`, và `text block` trong commit gần nhất cần được gỡ ra.

## 3. Concrete Examples & Analogies
### a) Ví dụ cụ thể bám repo
Trong `BlogSectionRuntime.tsx`, lần fix lỗi vừa rồi đã thêm các class như:
- `w-full text-left` vào block header text
- `group block w-full cursor-pointer bg-white text-left` cho `ItemLink`
- `flex w-full flex-col items-start bg-white text-left` cho `article`
- `w-full px-2 text-left` cho content wrapper

Những thay đổi này là phần có nguy cơ làm vỡ UI card. Theo yêu cầu hiện tại, cần:
- rollback các class trên ở vùng item/card/content
- chỉ giữ fix căn trái header/action đã đúng trước đó

### b) Analogy đời thường
Giống như đang chỉnh vô-lăng hơi lệch mà lại tháo luôn cả bánh xe. Xe có thể không lệch nữa, nhưng lại chạy không bình thường. Giờ cần lắp lại bánh xe đúng như cũ, chỉ chỉnh phần vô-lăng thật sự liên quan.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - Ảnh user gửi cho thấy sau fix mới nhất, thumbnail/card layout 4 bị vỡ.
  - Commit gần nhất `cfc2cc97` chỉ sửa 4 dòng trong `BlogSectionRuntime.tsx` nhưng đều nằm ở vùng item/card/content.
  - Đây là vùng trước đó không phải phần user yêu cầu trực tiếp; user chỉ cần site mobile căn trái giống preview.
- Evidence:
  - `git show --stat --oneline cfc2cc97` xác nhận commit mới nhất chỉ chạm `BlogSectionRuntime.tsx`.
  - Read file cho thấy các class mới thêm tập trung ở:
    - header text block
    - `ItemLink`
    - `article`
    - content wrapper
- Inference:
  - Regression đến từ việc sửa quá sâu vào card/content alignment.
- Decision:
  - Rollback phần card/content về trạng thái trước `cfc2cc97`, chỉ giữ các thay đổi header đã có từ các commit trước.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
## 1. Root Cause
- Triệu chứng quan sát được:
  - Expected: header căn trái đẹp, card vẫn giữ UI thumbnail như trước.
  - Actual: sau commit `cfc2cc97`, UI card bị vỡ và thumbnail không còn đúng bố cục.
- Phạm vi ảnh hưởng:
  - Chỉ layout 4 mobile trong `BlogSectionRuntime.tsx`.
- Mốc thay đổi gần nhất:
  - `cfc2cc97 fix(blog): lock layout 4 mobile left alignment`
- Dữ liệu còn thiếu:
  - Không có browser computed-style, nhưng ảnh regression + diff file là đủ mạnh.
- Giả thuyết thay thế đã bị loại trừ:
  - Không có evidence cho wrapper site khác gây mất thumbnail/card.
- Rủi ro nếu fix sai nguyên nhân:
  - UI tiếp tục bị churn, card vẫn vỡ hoặc header lại lệch.
- Tiêu chí pass/fail sau khi sửa:
  - Card layout 4 trở lại như trước regression, header vẫn căn trái.

**Nguyên nhân gốc:** commit gần nhất đã thêm alignment quá sâu vào item/card/content của layout 4, vượt quá phạm vi cần thiết và làm vỡ UI. Confidence: High.

## 2. Counter-Hypothesis
### a) Mất thumbnail do dữ liệu thumbnail/query site
- Confidence: Low.
- Không có thay đổi data/query trong commit regression; chỉ có className markup.

### b) Mất thumbnail do `ImageView` hoặc `PublicImage`
- Confidence: Low.
- Commit regression không đụng `ImageView`, nên khả năng rất thấp.

### c) Cần giữ toàn bộ fix `cfc2cc97` rồi vá thêm
- Confidence: Low.
- User đã xác nhận muốn khôi phục card UI như trước, không tiếp tục giữ fix sâu này.

# IV. Proposal (Đề xuất)
## 1. Hướng sửa được chọn
- Revert phần thay đổi của commit `cfc2cc97` trong vùng item/card/content.
- Giữ lại fix header/action đã đúng từ các commit trước (`d701eeec`, `caf74b31` ở phần wrapper/header hợp lý).

## 2. Cách làm cụ thể
- Mở nhánh `layout4` trong `BlogSectionRuntime.tsx`.
- Khôi phục các node sau về trạng thái trước `cfc2cc97`:
  - header text block: bỏ `w-full text-left` nếu không cần cho header parity
  - `ItemLink`: bỏ `block w-full text-left`
  - `article`: bỏ `w-full items-start text-left`
  - content wrapper: bỏ `w-full text-left`
- Giữ nguyên các fix không gây regression:
  - outer shell `items-start`
  - `layout4HeaderClassName.mobile = flex-col items-start`
  - action wrapper `self-start`
  - bỏ dashed divider
  - border thumbnail nếu đã duyệt

## 3. Vì sao đây là hướng tốt nhất
- Đúng với yêu cầu user vừa chốt.
- Scope nhỏ, rõ, dễ rollback.
- Tránh sửa đuổi theo symptom mà tiếp tục phá card UI.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/admin/home-components/blog/_components/BlogSectionRuntime.tsx`
  - Vai trò hiện tại: source of truth render cho layout 4 preview/site.
  - Thay đổi: rollback phần alignment sâu ở item/card/content, chỉ giữ fix căn trái header.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại diff quanh commit `cfc2cc97` trong `BlogSectionRuntime.tsx`.
2. Gỡ các class alignment sâu ở item/card/content.
3. Giữ nguyên các fix header/action đã đúng.
4. Review diff thật kỹ để chắc chỉ revert đúng phần gây regression.
5. Commit local với message phản ánh rollback regression.

# VII. Verification Plan (Kế hoạch kiểm chứng)
## 1. Audit Summary
- Xác nhận diff chỉ chạm `BlogSectionRuntime.tsx`.
- Xác nhận phần revert tập trung ở item/card/content của layout 4.

## 2. Root Cause Confidence
- High, vì regression map trực tiếp với commit gần nhất và ảnh user gửi.

## 3. Verification Plan
- Static review diff:
  - card/content classes quay về gần trạng thái trước `cfc2cc97`
  - header/action fixes vẫn còn
- Kỳ vọng sau sửa:
  - header mobile vẫn căn trái
  - thumbnail/card UI trở lại bình thường
  - không ảnh hưởng layout blog khác

# VIII. Todo
1. Revert phần alignment sâu gây regression trong layout 4.
2. Giữ fix căn trái header/action đã đúng.
3. Review diff và commit local.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout 4 mobile không còn bị “nát UI”.
- Thumbnail/card hiển thị lại đúng như trước regression.
- Header vẫn căn trái giống preview.
- Không ảnh hưởng layout 1/2/3/5/6.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro thấp:
  - Nếu revert quá rộng, header có thể quay lại lệch phải.
- Rollback:
  - revert riêng commit sửa lần này là đủ.

# XI. Out of Scope (Ngoài phạm vi)
- Refactor lại toàn bộ responsive contract của Blog.
- Đụng vào data/query hoặc renderer site khác.
- Sửa các drift thị giác khác ngoài regression card UI lần này.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity lớn; direction đã chốt là khôi phục card UI như trước, chỉ giữ fix căn trái header.