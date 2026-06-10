# I. Primer

## 1. TL;DR kiểu Feynman
Khi sử dụng bố cục **Minimal (Tối giản)** cho trang chi tiết sản phẩm, các ảnh phụ (thumbnail) ở cột dọc bên trái bị biến mất (xẹp về kích thước 0x0) mặc dù vẫn có khoảng trống nhường chỗ cho chúng. Nguyên nhân là do các nút thumbnail này được cấu hình CSS width là `w-full` (100% chiều rộng cha), trong khi container cha của chúng lại là một flexbox có thuộc tính co giãn tự động theo con. Điều này tạo ra một vòng lặp tính toán kích thước vô hạn khiến trình duyệt chọn giá trị mặc định là 0px. Giải pháp là chỉ định kích thước cố định `w-20` (80px) cho các nút thumbnail này, tương tự như cách làm ở các bố cục Classic và Modern.

## 2. Elaboration & Self-Explanation
Trong CSS Flexbox, khi một container cha có chế độ co lại theo nội dung (như `flex flex-col items-center` mà không định vị kích thước rõ ràng cho phần tử con trực tiếp) và các phần tử con bên trong lại dùng `w-full` (co giãn theo cha), trình duyệt sẽ rơi vào trạng thái "không biết bên nào quyết định kích thước". Kết quả là chiều rộng của cả cụm thumbnail bị xẹp về `0px`. Vì các thumbnail này có tỷ lệ khung hình cố định (aspect ratio `1 / 1` hoặc tương đương), chiều cao cũng bị kéo về `0px` theo công thức tính của trình duyệt. Việc đổi `w-full` thành kích thước cố định `w-20` (80px) phá vỡ vòng lặp này bằng cách cung cấp một mốc kích thước tuyệt đối, giúp trình duyệt dựng hình chính xác.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: 
  - Tại file [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx#L3214), component `ThumbnailRail` của style Minimal đang truyền `itemClassName="w-full rounded-sm"`.
  - Tại file [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx#L1159), component `PreviewThumbnailRail` cũng truyền `itemClassName="w-full rounded-sm"`.
  - Trong khi đó, ở style Classic và Modern, cả hai đều truyền `itemClassName="w-20 rounded-lg"` (hoặc `"w-20 rounded-xl"`). Do đó Classic và Modern hoạt động bình thường, còn Minimal bị lỗi.
- **Hình ảnh đời thường**: Hãy tưởng tượng một bức tranh treo tường. Khung tranh bảo: "Tôi sẽ tự co giãn vừa khít với bức ảnh bên trong", còn bức ảnh lại bảo: "Tôi sẽ tự co giãn vừa khít với cái khung". Kết quả là cả hai co lại thành một điểm vô cực và không ai nhìn thấy gì cả. Để sửa, ta chỉ cần đặt kích thước cố định cho bức ảnh (ví dụ: rộng 20cm), khi đó cái khung sẽ tự động rộng 20cm theo.

---

# II. Audit Summary (Tóm tắt kiểm tra)

- **Triệu chứng quan sát được**:
  - Trang chi tiết sản phẩm ngoài site (`/giay-nike/nike-air-force-1-07-giay-sneaker-nam-nu`) và trang preview admin (`/system/experiences/product-detail`) khi chuyển sang layout `Minimal` đều không hiển thị cột ảnh phụ bên trái.
  - Vùng không gian dành cho thumbnail (rộng khoảng 80px) vẫn tồn tại và đẩy ảnh chính lệch sang phải, chứng tỏ điều kiện render container thumbnail vẫn được thỏa mãn.
  - Kiểm tra code tĩnh cho thấy các layout Classic và Modern hoạt động tốt nhờ truyền kích thước tuyệt đối `w-20` cho các phần tử thumbnail con, còn layout Minimal dùng `w-full` dẫn đến lỗi co xẹp layout (width và height bằng 0).

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Root Cause (Nguyên nhân gốc)**: Lỗi thiết lập CSS width trong layout Minimal. Việc sử dụng `itemClassName="w-full rounded-sm"` trong component `ThumbnailRail` / `PreviewThumbnailRail` khiến các button thumbnail không có kích thước cơ sở tuyệt đối, dẫn đến hiện tượng sập layout (xẹp về kích thước 0x0) do flexbox cha (`items-center` và không co giãn tuyệt đối) co lại theo con.
- **Root Cause Confidence**: **High (Cao)**. Lý do là sự tương phản hoàn toàn giữa Minimal (`w-full`) và Classic/Modern (`w-20`) trong cùng một cấu trúc flex cha, và hành vi xẹp layout này là một lỗi CSS Flexbox kinh điển khi kết hợp `items-center` với phần tử con `w-full` không có kích thước cố định.
- **Counter-Hypothesis (Giả thuyết đối chứng)**: Do hàm `getVerticalThumbnailSlots` tính toán slots bị sai (trả về 0 hoặc `NaN`). Tuy nhiên, giả thuyết này bị loại trừ vì:
  1. Hàm đã có guard mặc định trả về tối thiểu là 1 (`Math.max(minSlots, 1)`).
  2. Nếu trả về `NaN` hoặc crash do split, React sẽ ném lỗi console lớn hoặc sập toàn bộ trang. Nhưng thực tế trang vẫn chạy tốt, các thành phần khác hoạt động bình thường.
  3. Nếu trả về 1, ít nhất 1 thumbnail vẫn phải hiển thị nếu kích thước của nó được xác định đúng.

---

# IV. Proposal (Đề xuất)

Thay đổi giá trị thuộc tính `itemClassName` truyền vào `ThumbnailRail` (ở trang chi tiết sản phẩm thật) và `PreviewThumbnailRail` (ở trang preview admin) của layout `Minimal` từ `"w-full rounded-sm"` thành `"w-20 rounded-sm"`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI Components

#### [MODIFY] [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx)
- Sửa: Thay đổi prop `itemClassName` của `ThumbnailRail` trong component `MinimalStyle` (khoảng dòng 3214) từ `"w-full rounded-sm"` thành `"w-20 rounded-sm"`.

#### [MODIFY] [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx)
- Sửa: Thay đổi prop `itemClassName` của `PreviewThumbnailRail` trong phần layout `minimal` (khoảng dòng 1159) từ `"w-full rounded-sm"` thành `"w-20 rounded-sm"`.

---

# VI. Execution Preview (Xem trước thực thi)

1. Đọc và chỉnh sửa file [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx).
2. Đọc và chỉnh sửa file [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx).
3. Sử dụng static review hoặc typecheck tĩnh (`bunx tsc --noEmit`) để đảm bảo không phát sinh lỗi cú pháp hay TypeScript.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy kiểm tra TypeScript compiler để xác nhận không có lỗi type:
  `bunx tsc --noEmit 2>&1 | Select-Object -First 10`

### Manual Verification
- Người dùng truy cập trang `/system/experiences/product-detail` ở layout `Minimal` và kiểm tra xem cột thumbnail bên trái đã hiển thị 2 ảnh phụ bình thường chưa.
- Người dùng truy cập trang chi tiết sản phẩm thực tế `/giay-nike/nike-air-force-1-07-giay-sneaker-nam-nu` ở layout `Minimal` để xác nhận kết quả tương tự.

---

# VIII. Todo

- [ ] Thay đổi `itemClassName` thành `"w-20 rounded-sm"` tại dòng 3214 trong [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx).
- [ ] Thay đổi `itemClassName` thành `"w-20 rounded-sm"` tại dòng 1159 trong [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx).

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Cột thumbnail bên trái của cả trang thật và trang preview ở layout `Minimal` hiển thị đầy đủ các ảnh phụ (không còn khoảng trống trơn).
- Các ảnh thumbnail này hiển thị theo tỷ lệ khung hình chính xác (không bị bóp méo hoặc xẹp kích thước).
- Click vào thumbnail thay đổi ảnh chính bình thường.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Hầu như bằng không. Đây chỉ là việc thay đổi kích thước hiển thị của phần tử thumbnail từ co giãn linh hoạt (bị lỗi) sang kích thước cố định (đồng bộ với các style khác đã chạy ổn định).
- **Hoàn tác**: Hoàn tác các thay đổi trên 2 file về lại `"w-full rounded-sm"`.

---

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa hay cấu trúc lại các logic tính toán vị trí, số lượng slot hiển thị thumbnail hoặc ResizeObserver.
- Không can thiệp vào CSS hay logic của các style `classic` và `modern`.
