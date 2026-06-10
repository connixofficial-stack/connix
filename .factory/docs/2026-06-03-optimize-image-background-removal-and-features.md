# Spec: Nâng Cấp Xóa Nền & Hiển Thị Thông Tin Dung Lượng Ảnh

# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Người dùng muốn xóa nền ảnh logo với chất lượng tốt nhất bằng một nút duy nhất thay vì hai nút "Nhanh" và "Nâng cao" gây bối rối. Đồng thời, admin cần xem dung lượng (size) và định dạng (extension/đuôi) của ảnh đang chỉnh sửa để kiểm soát tài nguyên tải lên website.
* **Giải pháp**:
  * Gộp hai nút xóa nền thành một nút **"Xóa nền"** duy nhất, mặc định chạy mô hình AI chính xác nhất (`isnet`).
  * Hiển thị một dòng thông tin nhỏ về dung lượng (ví dụ: `1.2 MB`) và định dạng (ví dụ: `PNG`) của ảnh đang thao tác trong hộp thoại chỉnh sửa.
  * Tạm hoãn các chức năng tự động xén biên và nén ảnh để tập trung vào trải nghiệm cốt lõi này trước.
* **Lợi ích**: Giao diện gọn gàng, nút bấm trực quan mang lại chất lượng xóa nền cao nhất và hiển thị thông tin dung lượng ảnh trực quan để admin biết rõ ảnh có quá nặng hay không.

## 2. Elaboration & Self-Explanation
Hiện trạng trong [ImageEditorDialog.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/ImageEditorDialog.tsx):
* Giao diện xóa nền hiện có hai nút: `Xóa nền nhanh` (sử dụng model AI nhẹ `isnet_fp16`) và `Xóa nền nâng cao` (sử dụng model AI chính xác hơn `isnet`). Chúng tôi sẽ đơn giản hóa bằng cách loại bỏ tùy chọn nhanh và giữ lại nút xóa nâng cao, đổi tên thành **"Xóa nền"**.
* Phía dưới ảnh xem trước hoặc trên tiêu đề của mỗi tab, chúng tôi sẽ bổ sung một dòng chữ nhỏ hiển thị thông tin của tệp ảnh hiện tại bao gồm: dung lượng file (được định dạng sang KB/MB thân thiện) và định dạng tệp (như PNG, JPG, WebP) được trích xuất từ MIME type của Blob.
* Khi người dùng thực hiện xóa nền thành công, thông tin này sẽ tự động cập nhật theo thông số của ảnh mới sau khi xóa nền (ảnh đã tách nền có định dạng PNG và dung lượng mới tương ứng).

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**:
  * Khi mở hộp thoại chỉnh sửa ảnh cho một logo có URL ảnh gốc, hệ thống sẽ tự động fetch ảnh này để lấy thông tin Blob. Giao diện hiển thị: `Thông tin ảnh gốc: 1.54 MB | Định dạng: JPG`.
  * Sau khi admin bấm nút **Xóa nền**, hệ thống chạy mô hình AI nâng cao để tách nền. Sau khi hoàn thành, ảnh xem trước cập nhật thành ảnh không nền và dòng thông tin hiển thị cập nhật: `Thông tin ảnh mới: 280.5 KB | Định dạng: PNG` (vì ảnh tách nền bắt buộc phải dùng PNG để giữ tính trong suốt).
  * Nhờ dòng thông tin này, admin biết ngay là ảnh đã giảm được dung lượng đáng kể (từ 1.54 MB xuống còn 280 KB) và định dạng đã chuyển sang PNG.

# II. Audit Summary (Tóm tắt kiểm tra)
* **Tình trạng file hiện tại**:
  * [ImageEditorDialog.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/ImageEditorDialog.tsx) chứa các state `removedBgUrl` và `removedBgBlob` dùng để lưu trữ kết quả xóa nền.
  * Chưa có state nào lưu trữ siêu dữ liệu (metadata) dung lượng và định dạng của ảnh gốc hoặc ảnh đang chỉnh sửa.
  * Nút xóa nền nhanh và nâng cao được render độc lập tại dòng 685-707.
  * [removeBgWorker.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/image/removeBgWorker.ts) xử lý logic chạy `@imgly/background-removal` trên main thread. Nó nhận mode và quyết định model.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Phân tích thiết kế**:
  * Admin không cần quan tâm đến hai mô hình AI kỹ thuật khác nhau mà chỉ cần ảnh logo của họ sạch nền nhất. Do đó, việc duy trì chế độ "fast" (isnet_fp16) chất lượng thấp là không thực tế.
  * Thiếu thông tin kích thước file khiến admin tải lên những bức ảnh quá nặng mà không hề hay biết, dẫn đến tốc độ trang web chậm đi mà không rõ nguyên nhân.

# IV. Proposal (Đề xuất)

## Option 1 (Recommend) — Confidence 98%
Cải tiến trực tiếp giao diện và worker xóa nền hiện tại theo yêu cầu tối giản của người dùng.
* **a) Hợp nhất Xóa nền**:
  * Cập nhật `removeBgWorker.ts`: Gộp API để mặc định sử dụng model `isnet`, loại bỏ tham số `RemoveBgMode` và các nhánh xử lý `fast` mode.
  * Cập nhật `ImageEditorDialog.tsx`: Xóa bỏ nút "Xóa nền nhanh". Thay đổi nhãn nút "Xóa nền nâng cao" thành **"Xóa nền"** và thiết lập chạy mặc định.
* **b) Hiển thị thông số dung lượng và định dạng ảnh**:
  * Thêm state `imageMeta` để lưu dung lượng (size) và kiểu MIME (mimeType) của ảnh đang hiển thị.
  * Sử dụng một `useEffect` để fetch dữ liệu từ `imageUrl` ban đầu, lấy blob và gán giá trị cho `imageMeta` (size và MIME type).
  * Khi người dùng thực hiện xóa nền thành công và có `removedBgBlob`, cập nhật thông số `imageMeta` theo dung lượng và định dạng của `removedBgBlob`.
  * Hiển thị thông tin này bằng một dòng chữ nhỏ màu xám tinh tế (ví dụ: `text-xs text-slate-500 font-medium`) bên dưới khu vực hiển thị ảnh xem trước ở mỗi tab.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [removeBgWorker.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/image/removeBgWorker.ts)
  * Vai trò: Worker xử lý tách nền qua thư viện AI ở client.
  * Thay đổi: Loại bỏ logic phân tách mode `fast` và `advanced`, đặt model `isnet` làm mặc định duy nhất.
* **Sửa**: [ImageEditorDialog.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/ImageEditorDialog.tsx)
  * Vai trò: Giao diện hộp thoại chỉnh sửa ảnh.
  * Thay đổi:
    * Fetch dữ liệu ảnh gốc để hiển thị dung lượng và định dạng ban đầu.
    * Cập nhật thông tin dung lượng và định dạng khi ảnh được cập nhật (ví dụ sau khi xóa nền).
    * Hiển thị dòng thông tin này ở dưới khung ảnh xem trước.
    * Gộp nút xóa nền thành một nút duy nhất, bỏ nút xóa nền nhanh.

# VI. Execution Preview (Xem trước thực thi)
1. **Bước 1**: Cập nhật `removeBgWorker.ts` để ép model `isnet` làm mặc định duy nhất, đơn giản hóa kiểu dữ liệu.
2. **Bước 2**: Trong `ImageEditorDialog.tsx`, viết logic fetch và lưu trữ siêu dữ liệu của ảnh gốc khi component mount hoặc `imageUrl` thay đổi.
3. **Bước 3**: Cập nhật hàm xóa nền trong dialog để cập nhật siêu dữ liệu mới khi xóa nền thành công.
4. **Bước 4**: Thêm dòng hiển thị thông số dung lượng và định dạng vào giao diện hiển thị ảnh xem trước của cả 3 tab (Cắt ảnh, Xóa nền, Thêm nền).
5. **Bước 5**: Loại bỏ nút "Xóa nền nhanh" và đổi tên nút nâng cao thành "Xóa nền".
6. **Bước 6**: Kiểm tra toàn bộ code TypeScript xem có lỗi biên dịch nào không.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra biên dịch**: Đảm bảo dự án không gặp lỗi TypeScript.
* **Kiểm tra thủ công**:
  * Mở hộp thoại sửa logo tại `/admin/settings/general`.
  * Xác nhận dòng thông tin kích thước và đuôi ảnh gốc được hiển thị chính xác dưới ảnh (ví dụ: `Kích thước: 1.25 MB | Định dạng: JPG`).
  * Chọn tab Xóa nền, xác nhận chỉ có 1 nút "Xóa nền".
  * Bấm nút "Xóa nền", đợi tiến trình AI hoàn thành.
  * Xác nhận ảnh xem trước được cập nhật và dòng thông tin đổi thành: `Kích thước: [dung lượng mới] | Định dạng: PNG`.
  * Thử chuyển sang các tab khác (Cắt ảnh, Thêm nền) để xác định xem thông số ảnh hiện tại có hiển thị đồng bộ hay không.

# VIII. Todo
* [x] Cập nhật spec dự án.
* [ ] Sửa file `removeBgWorker.ts` gộp mặc định model `isnet`.
* [ ] Sửa `ImageEditorDialog.tsx` để fetch thông tin ảnh gốc ban đầu.
* [ ] Thêm logic format dung lượng (Bytes/KB/MB) và lấy đuôi file từ MIME type.
* [ ] Cập nhật tab `removebg` để bỏ nút nhanh và đổi tên nút nâng cao thành "Xóa nền".
* [ ] Bổ sung dòng hiển thị thông số ảnh ở vị trí phù hợp trong 3 tab.
* [ ] Kiểm tra tĩnh code TypeScript toàn bộ component đã sửa.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Chỉ có duy nhất một nút "Xóa nền" trong tab Xóa nền. Nút này chạy model AI chính xác nhất (`isnet`).
* Có một dòng chữ nhỏ hiển thị thông tin ảnh dưới dạng: `Kích thước: <X> MB/KB | Định dạng: <Y>` hiển thị bên dưới khung preview ảnh ở tất cả các tab.
* Thông tin kích thước và định dạng này tự động cập nhật khi ảnh được sửa đổi (như sau khi xóa nền thành công).
* Không có lỗi build TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi CORS khi fetch ảnh gốc từ một tên miền ngoài nếu URL ảnh không hỗ trợ CORS, dẫn đến không lấy được blob dung lượng ảnh gốc.
* **Giải pháp giảm thiểu**: Thêm khối try-catch an toàn khi fetch ảnh gốc. Nếu lỗi fetch xảy ra, hiển thị dòng chữ thông báo dung lượng: `Không rõ (Lỗi CORS)` thay vì làm crash giao diện.
* **Hoàn tác**: Sử dụng git checkout để khôi phục các file đã sửa.
