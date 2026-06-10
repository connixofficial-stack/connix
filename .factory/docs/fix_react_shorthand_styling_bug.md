# I. Primer

## 1. TL;DR kiểu Feynman
Khi ta viết CSS trong React, việc dùng thuộc tính viết tắt `background` (shorthand) chung với các thuộc tính chi tiết như `backgroundClip` (non-shorthand) sẽ khiến React bối rối mỗi lần vẽ lại giao diện (rerender). React khuyên ta nên tách bạch: dùng thuộc tính chi tiết `backgroundImage` thay vì thuộc tính gộp `background`. Bằng cách này, trình duyệt sẽ biết chính xác cái nào cần thay đổi mà không ghi đè lẫn nhau.

## 2. Elaboration & Self-Explanation
Trong React, style inline được chuyển đổi thành các lệnh thay đổi trực tiếp thuộc tính CSS trên phần tử DOM (DOM style properties). Khi ta gán `style.background` (đại diện cho toàn bộ các thuộc tính nền như màu nền, ảnh nền, vị trí, kích thước, clip, v.v.), React sẽ cố gắng đồng bộ hóa nó. 
Tuy nhiên, nếu ta đồng thời gán cả `style.backgroundClip = 'text'`, vì `background` là thuộc tính viết tắt bao trùm lên cả `background-clip` (thiết lập nó về giá trị mặc định `border-box`), sự xung đột thứ tự thiết lập hoặc cập nhật khi rerender sẽ xảy ra. Cụ thể, React phát hiện sự xung đột giữa việc cập nhật thuộc tính shorthand `background` và thuộc tính non-shorthand `backgroundClip`, gây ra cảnh báo trên Console.
Giải pháp là sử dụng `backgroundImage` thay cho `background` khi gán dải màu `linear-gradient` (bởi vì `linear-gradient` về bản chất thuộc loại dữ liệu ảnh nền trong CSS).

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: 
  - *Sai*: `<span style={{ background: 'linear-gradient(...)', backgroundClip: 'text' }}>`
  - *Đúng*: `<span style={{ backgroundImage: 'linear-gradient(...)', backgroundClip: 'text' }}>`
* **Hình ảnh ẩn dụ**: Hãy tưởng tượng bạn ra lệnh cho thợ sơn: "Hãy sơn lại toàn bộ bức tường" (tương đương shorthand `background`), đồng thời "Hãy giữ lớp chống thấm ở viền" (tương đương `backgroundClip`). Người thợ sơn sẽ bối rối vì việc "sơn lại toàn bộ" có thể đè lên lớp viền chống thấm. Thay vào đó, hãy chỉ đạo cụ thể hơn: "Hãy vẽ bức tranh phong cảnh lên tường" (`backgroundImage`) và "Định hình khung viền" (`backgroundClip`), họ sẽ làm việc mượt mà mà không dẫm chân lên nhau.

# II. Audit Summary (Tóm tắt kiểm tra)
* **Triệu chứng**: Xuất hiện Warning đỏ trên Console log của Trình duyệt khi xem trang chi tiết sản phẩm hoặc preview:
  > *Updating a style property during rerender (background) when a conflicting property is set (backgroundClip) can lead to styling bugs.*
* **Phạm vi**: 
  - Trang chi tiết sản phẩm: [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx) tại dòng 4301.
  - Trang xem trước (Preview): [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx) tại dòng 1607.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Gán `titleEffectStyle.background = 'linear-gradient(...)'` kết hợp với `titleEffectStyle.backgroundClip = 'text'`. React cảnh báo xung đột cập nhật style động giữa shorthand và non-shorthand property trên cùng một node khi phần tử con `<span key={...} style={{ ...titleEffectStyle, animationDelay: ... }}>` rerender.
* **Giả thuyết đối chứng**: Nếu ta đổi sang `titleEffectStyle.backgroundImage = 'linear-gradient(...)'`, React sẽ cập nhật riêng biệt thuộc tính `background-image` mà không chạm tới thuộc tính `background-clip` hay `background-color`, triệt tiêu hoàn toàn cảnh báo lỗi.

# IV. Proposal (Đề xuất)
Thay đổi việc gán dải màu gradient trong cả hai tệp:
1. Đổi `titleEffectStyle.background = linear-gradient(...)` thành `titleEffectStyle.backgroundImage = linear-gradient(...)`.
2. Trong trường hợp không phải gradient (`!isGradient`), ta gán rõ ràng `titleEffectStyle.backgroundImage = 'none'` để xóa bỏ ảnh nền từ các lần render trước đó, đồng thời thiết lập lại các giá trị clip về trạng thái ban đầu (`initial` hoặc `unset`).

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx)
  - Đóng vai trò là component hiển thị thông tin chi tiết sản phẩm ngoài site thực.
  - Thay đổi cách khởi tạo `titleEffectStyle` trong hàm `applyEffectColor`.
* **Sửa**: [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx)
  - Đóng vai trò xem trước giao diện cấu hình chi tiết sản phẩm trong admin.
  - Thực hiện thay đổi cấu trúc `titleEffectStyle` tương tự.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại vùng mã nguồn chứa hàm `applyEffectColor` ở cả hai file.
2. Thực hiện sửa đổi bằng công cụ `replace_file_content` hoặc `multi_replace_file_content`.
3. Chạy lệnh TypeScript compile tĩnh để xác minh không có lỗi cú pháp hoặc kiểu dữ liệu.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra tĩnh**: Chạy lệnh `bunx tsc --noEmit` để đảm bảo code biên dịch sạch sẽ.
* **Kiểm tra thủ công**: Người dùng kiểm tra Console của trình duyệt tại trang `http://localhost:3000/system/experiences/product-detail` hoặc trang chi tiết sản phẩm bất kỳ ngoài site thực để xác nhận lỗi Warning không còn xuất hiện.

# VIII. Todo
- [ ] Cập nhật `applyEffectColor` trong `ProductDetailPage.tsx`.
- [ ] Cập nhật `applyEffectColor` trong `ProductDetailPreview.tsx`.
- [ ] Chạy kiểm tra TypeScript `bunx tsc --noEmit`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Ứng dụng chạy bình thường mà không báo lỗi console về `background` và `backgroundClip`.
- Hiệu ứng màu gradient của chữ trong combo (chữ nhảy tuần tự, v.v.) hoạt động chính xác.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Rất thấp vì đây chỉ là thay đổi nhỏ về thuộc tính CSS style để tuân thủ quy tắc cập nhật của React.
* **Hoàn tác**: Sử dụng `git checkout` hoặc phục hồi các dòng thay đổi style cũ nếu cần.

# XI. Out of Scope (Ngoài phạm vi)
* Không thay đổi hành vi logic hay các kiểu hiệu ứng chữ hiện có của combo.
