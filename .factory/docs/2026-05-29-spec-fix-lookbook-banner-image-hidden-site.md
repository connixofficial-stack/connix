# Spec: Khắc Phục Lỗi Lookbook Banner Bị Mất Ảnh Ngoài Site Thực

## I. Primer

### 1. TL;DR kiểu Feynman
- **Hiện tượng:** Ở admin Preview, layout Lookbook Banner hiển thị ảnh gốc của giày bình thường. Nhưng ngoài site thực, ảnh gốc bị biến mất (chỉ hiện màu xám trắng), chỉ khi hover chuột vào mới thấy ảnh giày trồi lên.
- **Nguyên nhân gốc:** 
  - Component dùng chung `ProductImageWithOverlay` bị xung đột CSS khi nhận class `absolute inset-0` từ ngoài truyền vào, tạo thành class `relative overflow-hidden absolute inset-0`. Trình duyệt ưu tiên áp dụng `position: relative`. Vì tất cả các con bên trong (ảnh gốc, khung viền, watermark) đều là `absolute`, nên thẻ cha `relative` bị xẹp chiều cao về `0px` và bị ẩn đi hoàn toàn do `overflow-hidden`.
  - z-index của lớp gradient đen ngoài site thực được đặt quá cao (`z-30`), đè lên cụm text chi tiết sản phẩm (`z-20`) ở trạng thái không hover.
- **Giải pháp:**
  - Cập nhật `ProductImageWithOverlay` để tự động loại bỏ class `relative` nếu class truyền vào chứa `absolute`.
  - Điều chỉnh z-index của lớp gradient đen từ `z-30` về `z-10` trong layout `lookbook` của site thực để đồng bộ hoàn toàn với Preview.

### 2. Elaboration & Self-Explanation
- Trong component `ProductImageWithOverlay.tsx`, container div ngoài cùng được khai báo:
  `className={className ? "relative overflow-hidden " + className : "relative overflow-hidden"}`
- Khi layout `lookbook` ở site thực render component này với `className="absolute inset-0"`, class thực tế của container div trở thành `"relative overflow-hidden absolute inset-0"`.
- Trong CSS Tailwind, khi hai class `.relative` và `.absolute` cùng được áp dụng, trình duyệt sẽ chọn thuộc tính được định nghĩa sau trong file CSS đã biên dịch. Tại môi trường thực tế (production build hoặc local dev), trình duyệt đang áp dụng `position: relative`.
- Một div có `position: relative` nhưng tất cả con của nó (ảnh `<Image fill />`, khung viền `z-10`, watermark `z-20`) đều có `position: absolute` sẽ không có chiều cao tự nhiên (chiều cao bằng 0). Do có thuộc tính `overflow-hidden`, toàn bộ ảnh gốc bên trong bị ẩn hoàn toàn khỏi giao diện.
- Khi người dùng hover chuột vào thẻ sản phẩm, ảnh phụ (`hoverImage`) trồi lên. Ảnh này nằm độc lập bên ngoài `ProductImageWithOverlay` và nằm trực tiếp trong container thẻ Link có tỉ lệ `aspect-[380/460]` rõ ràng nên vẫn hiển thị bình thường.
- Đối với z-index: Lớp gradient đen ở site thực có `z-30`, cao hơn cụm text (`z-20`). Điều này khiến cụm text bị lớp làm tối đè lên ở trạng thái bình thường. Đưa gradient đen về `z-10` (giống Preview) sẽ giúp text `z-20` hiển thị rõ nét trên nền gradient.

### 3. Concrete Examples & Analogies
- **Ví dụ thực tế:** Hãy tưởng tượng bạn có một chiếc khung ảnh di động. Nếu bạn vừa bảo chiếc khung ảnh đó phải "treo cố định trên tường" (`absolute`) vừa phải "đặt tự do trên bàn" (`relative`), chiếc khung ảnh sẽ bị bối rối và co lại thành một điểm vô hình (chiều rộng và chiều cao bằng 0). Dù bức ảnh bên trong có lộng lẫy thế nào, bạn cũng chỉ thấy khoảng tường trống đằng sau nó.
- **Khi hover:** Giống như việc bạn mang một bức ảnh thứ hai to hơn đặt đè lên vị trí chiếc khung ảnh bị xẹp đó. Khi bạn bỏ tay ra (hết hover), bức ảnh thứ hai cất đi, và bạn lại thấy khoảng không vô hình.

---

## II. Audit Summary (Tóm tắt kiểm tra)

- **Các tệp đã kiểm tra:**
  1. `components/shared/ProductImageWithOverlay.tsx`: Phát hiện xung đột class `relative` và `absolute` tại thẻ div container ngoài cùng.
  2. `components/site/ProductListSection.tsx`: Phát hiện layout `lookbook` (dòng 1009-1120) có z-index của lớp gradient đen là `z-30`, lớp trắng là `z-10`, trong khi ảnh gốc bọc trong `ProductImageWithOverlay` bị xẹp.
  3. `app/admin/home-components/product-list/_components/ProductListPreview.tsx`: So sánh và xác nhận Preview hoạt động tốt vì render ảnh trực tiếp qua thẻ `<PreviewImage>` không dùng `ProductImageWithOverlay`, đồng thời z-index của lớp gradient đen là `z-10`.

---

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### 1. Trả lời các câu hỏi bắt buộc (Audit Protocol):
- **Câu #1: Triệu chứng quan sát được là gì?**
  - *Expected:* Ảnh gốc sản phẩm phải hiển thị mờ dưới lớp gradient đen ở trạng thái bình thường. Khi hover thì ảnh gốc mờ đi và ảnh trồi lên (`hoverImage`) hiển thị sinh động.
  - *Actual:* Ảnh gốc biến mất hoàn toàn, chỉ hiển thị một màu xám trắng của nền card. Chỉ khi hover mới thấy ảnh giày trồi lên.
- **Câu #3: Có tái hiện ổn định không?**
  - Có, lỗi xảy ra ổn định tại site thực đối với bất kỳ sản phẩm nào hiển thị dưới layout `Lookbook Banner` (style `lookbook`).
- **Câu #6: Có giả thuyết thay thế hợp lý nào chưa bị loại trừ?**
  - *Giả thuyết phụ:* Ảnh từ Convex Storage bị chặn bởi Next.js Image Optimizer.
  - *Đối chứng:* Giả thuyết này bị loại trừ vì ảnh trồi lên (`hoverImage`) sử dụng cùng một URL từ Convex Storage nhưng vẫn hiển thị bình thường khi hover.
- **Câu #8: Tiêu chí pass/fail sau khi sửa?**
  - *Pass:* Ảnh gốc của tất cả sản phẩm trong layout Lookbook Banner hiển thị đầy đủ ở trạng thái tĩnh. Khi hover, ảnh trồi lên mượt mà và cụm text hiển thị sắc nét không bị làm tối bất thường.
  - *Fail:* Ảnh gốc vẫn bị biến mất hoặc cụm text bị mờ tối ở trạng thái tĩnh.

### 2. Độ tin cậy nguyên nhân gốc:
- **Đánh giá:** `High` (Độ tin cậy cao).
- **Lý do:** Phân tích CSS Stacking Context và xung đột vị trí `relative/absolute` của Tailwind giải thích hoàn hảo vì sao ảnh gốc bị ẩn (chiều cao container bằng 0), tại sao Preview hiển thị đúng (không dùng component bọc ảnh), và tại sao hover vẫn thấy ảnh (ảnh hover nằm ngoài component bọc).

---

## IV. Proposal (Đề xuất)

### 1. Cập nhật `ProductImageWithOverlay.tsx`:
- Viết lại logic gán class cho container div ngoài cùng để kiểm tra xem `className` được truyền vào có chứa `'absolute'` hay không.
- Nếu chứa `'absolute'`, chỉ gán `"overflow-hidden"` làm lớp cơ sở (loại bỏ `"relative"` để tránh xung đột).
- Nếu không chứa, giữ nguyên mặc định `"relative overflow-hidden"`.

### 2. Cập nhật `ProductListSection.tsx` (Layout Lookbook):
- Đổi z-index của lớp phủ gradient đen từ `z-30` thành `z-10`:
  ```diff
  - <div className={cn("absolute inset-0 z-30 bg-gradient-to-t from-slate-950/80 ...", isActive && "opacity-0")} />
  + <div className={cn("absolute inset-0 z-10 bg-gradient-to-t from-slate-950/80 ...", isActive && "opacity-0")} />
  ```
- Việc chuyển về `z-10` giúp nó đồng bộ với lớp màu trắng (`z-10`) và nằm dưới cụm text (`z-20`), đảm bảo text hiển thị sắc nét nhất.

---

## V. Files Impacted (Tệp bị ảnh hưởng)

### 1. Sửa: `components/shared/ProductImageWithOverlay.tsx`
- **Vai trò hiện tại:** Shared component bọc ảnh sản phẩm + watermark + khung viền.
- **Thay đổi:** Cải tiến logic gán class để tự động loại bỏ `relative` nếu `className` đầu vào chứa `absolute`.

### 2. Sửa: `components/site/ProductListSection.tsx`
- **Vai trò hiện tại:** Hiển thị danh sách sản phẩm ngoài site thực.
- **Thay đổi:** Điều chỉnh z-index của lớp gradient đen từ `z-30` về `z-10` trong style `lookbook`.

---

## VI. Execution Preview (Xem trước thực thi)

1. Đọc kĩ lại các tệp tin để đảm bảo không làm mất các thuộc tính và logic sẵn có.
2. Áp dụng các thay đổi trong `ProductImageWithOverlay.tsx` và `ProductListSection.tsx`.
3. Kiểm tra tĩnh lỗi TypeScript bằng lệnh `bunx tsc --noEmit`.

---

## VII. Verification Plan (Kế hoạch kiểm chứng)

### 1. Kiểm tra tĩnh (TypeScript Compilation):
- Chạy lệnh `bunx tsc --noEmit` để đảm bảo không có lỗi type hoặc compile.

### 2. Xác minh thủ công:
- Người dùng kiểm tra giao diện site thực tại `http://localhost:3000/` với layout `Lookbook Banner`.
- Kiểm tra xem ảnh sản phẩm gốc có hiển thị bình thường ở trạng thái tĩnh không.
- Kiểm tra hiệu ứng hover và tính rõ nét của cụm text sản phẩm.

---

## VIII. Todo

- [ ] Sửa đổi logic gán class trong [ProductImageWithOverlay.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/shared/ProductImageWithOverlay.tsx).
- [ ] Sửa đổi z-index của gradient đen trong [ProductListSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductListSection.tsx).
- [ ] Chạy lệnh kiểm tra TypeScript.
- [ ] Kích hoạt âm báo hoàn thành task và phản hồi người dùng.

---

## IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Ảnh gốc hiển thị đầy đủ, đúng tỉ lệ và không bị biến mất ở trạng thái bình thường (không hover) của layout Lookbook Banner ở site thực.
- Hover chuột vào sản phẩm hiển thị ảnh trồi lên bình thường.
- Cụm text (tên sản phẩm, giá) hiển thị rõ nét trên nền gradient, không bị đè che mờ tối.
- Không phát sinh lỗi biên dịch TypeScript.

---

## X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro:** Việc sửa đổi `ProductImageWithOverlay` có thể làm ảnh hưởng đến các layout khác.
- **Đánh giá rủi ro:** Rất thấp, vì sự thay đổi này chỉ loại bỏ class `relative` khi class truyền vào chứa `absolute` một cách tường minh (nhằm giải quyết xung đột CSS). Các trường hợp truyền `relative` hoặc không truyền gì vẫn giữ nguyên class `relative overflow-hidden` mặc định.
- **Rollback:** `git checkout components/shared/ProductImageWithOverlay.tsx components/site/ProductListSection.tsx`.

---

## XI. Out of Scope (Ngoài phạm vi)

- Không thay đổi hành vi/API hay cấu trúc dữ liệu của các component khác.
- Không thay đổi logic lấy dữ liệu từ Convex.
