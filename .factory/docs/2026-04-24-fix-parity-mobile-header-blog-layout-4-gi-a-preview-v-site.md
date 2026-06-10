# I. Primer

## 1. TL;DR kiểu Feynman
- Preview mobile của Blog layout 4 đang đẹp vì nó bị khóa cứng ở breakpoint mobile.
- Site thật lại dùng chuỗi class responsive `mobile md:tablet lg:desktop`, nên khi viewport/container chạm `md`, header bị đẩy sang phải theo `justify-between`.
- Vì vậy preview và site đang dùng cùng runtime nhưng khác contract breakpoint.
- Hướng sửa tối thiểu là chỉnh logic responsive của header/action trong `BlogSectionRuntime.tsx` để mobile site bám đúng preview hiện tại.
- Mục tiêu anh đã chốt: site mobile phải giống preview hiện tại, không tự dạt sang phải.

## 2. Elaboration & Self-Explanation
Bề ngoài nhìn như preview và site là hai giao diện khác nhau, nhưng thực tế cả hai đều đi qua cùng một component render là `BlogSectionRuntime`. Khác biệt nằm ở cách component này tính breakpoint.

Ở preview, khi chọn mobile thì runtime nhận thẳng `device='mobile'`, nên nó render đúng nhánh mobile. Còn ở site, runtime không dùng `device`; thay vào đó nó luôn sinh class responsive kiểu `flex-col md:flex-row md:justify-between ...`. Điều này có nghĩa là chỉ cần viewport hoặc container của site chạm breakpoint `md`, khối action sẽ nhảy sang phải. Đó chính là thứ anh đang thấy trong ảnh site thật.

Vậy nên nguyên nhân gốc không phải do dữ liệu, cũng không phải do `BlogPreview.tsx` hay `components/site/BlogSection.tsx` render khác HTML. Nguyên nhân là contract responsive của layout 4 header/action hiện đang không đảm bảo parity giữa preview mobile và site mobile thực tế.

## 3. Concrete Examples & Analogies
### a) Ví dụ cụ thể bám repo
Trong `BlogSectionRuntime.tsx`, `layout4HeaderClassName` hiện map như sau:
- desktop: `flex-row items-end justify-between`
- tablet: `flex-row items-end justify-between`
- mobile: `flex-col`

Với `context='preview'`, chọn mobile sẽ lấy đúng `flex-col`.
Với `context='site'`, nó sinh ra class kiểu:
- `flex-col md:flex-row md:items-end md:justify-between ...`

Nên preview mobile thì nút nằm trái đẹp, còn site nếu chạm `md` thì nút chạy sang phải.

### b) Analogy đời thường
Giống như hai người cùng dùng một bản thiết kế, nhưng một người xem bản in A5 còn người kia xem bản auto-scale theo màn hình. Nội dung giống nhau, nhưng vì quy tắc scale khác nhau nên bố cục nhìn khác hẳn.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - Preview và site cùng render qua `BlogSectionRuntime`.
  - Preview mobile truyền `context='preview'` + `device='mobile'`.
  - Site truyền `context='site'` và để runtime tự sinh class responsive `mobile/md/lg`.
  - Vùng bị lệch nằm ở header/action của `layout4`.
- Evidence:
  - `app/admin/home-components/blog/_components/BlogPreview.tsx` render `BlogSectionRuntime` với `context="preview"`.
  - `components/site/BlogSection.tsx` render `BlogSectionRuntime` với `context="site"`.
  - `app/admin/home-components/blog/_components/BlogSectionRuntime.tsx` có `layout4HeaderClassName` và helper `getResponsiveClassName`.
- Inference:
  - Lệch phải ở site đến từ nhánh responsive `md:flex-row md:justify-between`, không phải từ wrapper preview riêng.
- Decision:
  - Sửa trong `BlogSectionRuntime.tsx`, không vá riêng trong `BlogPreview.tsx` hay `components/site/BlogSection.tsx`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
## 1. Root Cause
- Root cause: contract responsive của `layout4HeaderClassName` đang cho site chuyển sang `flex-row justify-between` theo breakpoint CSS, trong khi preview mobile bị khóa cứng ở nhánh mobile.
- Expected: mobile site nhìn giống preview mobile.
- Actual: site thật có thể nhảy sang trạng thái giống tablet/desktop, làm action lệch phải.
- Confidence: High.

## 2. Counter-Hypothesis
### a) Giả thuyết: `BlogPreview.tsx` có CSS riêng làm nút nằm trái
- Không phải nguyên nhân chính.
- `BlogPreview.tsx` chỉ bọc shell/device frame, không override layout header/action của layout 4.

### b) Giả thuyết: `components/site/BlogSection.tsx` render khác markup
- Không đúng.
- File này chỉ map data và truyền props vào `BlogSectionRuntime`.

### c) Giả thuyết: lỗi do dữ liệu/subtitle/title dài
- Confidence: Low.
- Nội dung dài có thể làm layout lộ rõ hơn, nhưng không tạo ra `justify-between` sang phải. Đó là do class responsive.

## 3. Tiêu chí pass/fail sau khi sửa
- Pass:
  - Header/action của layout 4 trên site mobile bám đúng preview mobile.
  - Nút điều hướng không bị dạt phải ở trạng thái mobile mà anh đang phản ánh.
  - Preview/site parity tốt hơn mà không ảnh hưởng layout 1/2/3/5/6.
- Fail:
  - Chỉ sửa preview mà site vẫn lệch.
  - Chạm vào layout khác hoặc đổi hành vi desktop/tablet ngoài ý muốn.

# IV. Proposal (Đề xuất)
## 1. Hướng sửa được chọn
- Chỉnh riêng contract responsive của phần header/action trong nhánh `layout4` tại `BlogSectionRuntime.tsx`.
- Mục tiêu là mobile site phải giữ behavior giống preview hiện tại.

## 2. Cách làm cụ thể
- Rà `layout4HeaderClassName` trong `BlogSectionRuntime.tsx`.
- Điều chỉnh class mobile của wrapper header/action để trạng thái stack mobile ổn định hơn, ví dụ explicit hơn về `items-start` và/hoặc kiểm soát rõ điểm chuyển hàng ngang.
- Nếu cần, tách riêng class cho action wrapper trong layout 4 để đảm bảo ở mobile nó bám trái đúng như preview, thay vì phụ thuộc default align behavior.
- Giữ nguyên data flow, props API, renderer path của preview/site.

## 3. Vì sao đây là hướng tốt nhất
- Đây là nơi duy nhất quyết định parity của layout 4 cho cả preview lẫn site.
- Sửa ở đây là thay đổi nhỏ nhất nhưng đúng root cause.
- Tránh tạo drift mới nếu vá riêng preview hoặc site.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/admin/home-components/blog/_components/BlogSectionRuntime.tsx`
  - Vai trò hiện tại: runtime UI source-of-truth cho mọi layout Blog ở cả preview và site.
  - Thay đổi: chuẩn hóa responsive contract của phần header/action layout 4 để mobile site khớp preview.

- Không sửa: `app/admin/home-components/blog/_components/BlogPreview.tsx`
  - Vai trò hiện tại: bọc preview shell và chọn device.
  - Không đổi vì không phải root cause.

- Không sửa: `components/site/BlogSection.tsx`
  - Vai trò hiện tại: lấy dữ liệu thật và truyền vào runtime.
  - Không đổi vì không phải nơi quyết định markup/layout của header layout 4.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại nhánh `layout4` trong `BlogSectionRuntime.tsx`.
2. Điều chỉnh class responsive của header/action cho mobile parity.
3. Tự review tĩnh diff để xác nhận chỉ chạm layout 4.
4. Commit local kèm spec file theo rule repo.

# VII. Verification Plan (Kế hoạch kiểm chứng)
## 1. Audit Summary
- Xác nhận diff chỉ tác động logic class của layout 4 header/action.
- Xác nhận không đổi data query, route, hoặc preview shell.

## 2. Root Cause Confidence
- High, vì evidence nằm trực tiếp ở `getResponsiveClassName` + `layout4HeaderClassName` và call-site preview/site.

## 3. Verification Plan
- Static review diff:
  - chỉ file runtime bị sửa cho logic UI
  - preview/site vẫn cùng đi qua runtime
  - không có thay đổi props/API
- Kỳ vọng sau sửa:
  - preview mobile giữ nguyên như hiện tại
  - site mobile không bị lệch phải ở vùng header/action
  - desktop/tablet không đổi hoặc chỉ đổi tối thiểu có chủ đích

# VIII. Todo
1. Chỉnh class responsive của header/action cho Blog layout 4.
2. Giữ source of truth ở `BlogSectionRuntime.tsx`.
3. Tự review diff và commit local.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Site thực của Blog layout 4 ở mobile nhìn giống preview mobile hiện tại tại vùng tiêu đề/subtitle/nút.
- Nút điều hướng không bị dạt sang phải trong trạng thái mobile mà user phản ánh.
- Không tạo thay đổi ngoài layout 4.
- Không thay đổi flow dữ liệu và config blog.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro thấp:
  - Nếu chỉnh breakpoint quá tay, tablet/desktop có thể bị ảnh hưởng nhẹ.
- Rollback:
  - revert phần class responsive vừa thay trong nhánh `layout4` của `BlogSectionRuntime.tsx`.

# XI. Out of Scope (Ngoài phạm vi)
- Sửa toàn bộ hệ thống breakpoint của preview device.
- Refactor helper responsive dùng chung cho mọi layout.
- Chỉnh spacing/typography các layout khác.
- Sửa các issue khác của Blog layout 4 không liên quan header/action mobile.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity quan trọng; mục tiêu parity đã được chốt là “giống preview hiện tại”.