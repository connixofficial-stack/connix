# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Khi bật nút "Bật watermark sản phẩm" ở trang Cài đặt nâng cao và ấn Lưu, sau khi F5 (tải lại trang) thì ô checkbox đó bị mất dấu tích.
* **Nguyên nhân**: Trường cài đặt `enable_product_watermark` chưa được khai báo mặc định khi load trang, không có tên trong danh sách lưu `watermarkKeys` ở hàm `handleSave` nên không bao giờ được ghi xuống cơ sở dữ liệu. Đồng thời, checkbox ở UI và hàm kiểm tra watermark ở trang ngoài đang so sánh nghiêm ngặt kiểu boolean (`=== true`) trong khi cơ sở dữ liệu Convex lưu dưới dạng chuỗi (`"true"` hoặc `"false"`), dẫn đến lỗi không nhận diện được trạng thái đã bật.
* **Giải pháp**: 
  1. Thêm `enable_product_watermark` vào danh sách `watermarkKeys` để lưu vào DB khi nhấn Lưu.
  2. Bổ dung giá trị mặc định cho `enable_product_watermark` là `false` khi load trang.
  3. Cập nhật checkbox UI và hàm logic ở `ProductImageWatermarkOverlay.tsx` để hỗ trợ so sánh cả giá trị boolean và chuỗi (`=== true || === 'true'`).

## 2. Elaboration & Self-Explanation
Hệ thống lưu cấu hình watermark sản phẩm thông qua Convex DB bằng cách gom cụm các khoá cấu hình và cập nhật hàng loạt (`setMultiple`). Tuy nhiên, trường `enable_product_watermark` (là nút bật/tắt tổng của tính năng watermark) bị bỏ quên hoàn toàn trong danh sách các khoá cần quét để lưu (`watermarkKeys`) khi người dùng ấn nút "Lưu cài đặt". Vì lý do đó, nút này dù có được bật hay tắt trên giao diện thì khi ấn Lưu cũng không có bất kỳ dòng dữ liệu nào gửi xuống DB. Khi người dùng nhấn F5, hệ thống tải dữ liệu cấu hình từ DB lên, không tìm thấy khoá này nên trả về giá trị mặc định (trong trường hợp này là `undefined`), làm nút checkbox biến về trạng thái chưa tích.

Hơn nữa, một vấn đề tiềm ẩn về kiểu dữ liệu (data type mismatch) là các giá trị boolean được Convex chuyển đổi thành chuỗi dạng `'true'` hoặc `'false'` khi lưu bằng phương pháp ép kiểu thủ công (`String(value)`). Trong khi đó, component kiểm tra trạng thái ở trang hiển thị sản phẩm (`ProductImageWatermarkOverlay.tsx`) và giao diện quản trị lại chỉ kiểm tra bằng toán tử so sánh nghiêm ngặt `=== true`. Do đó, ngay cả khi dữ liệu có được lưu là `'true'` trong DB, UI vẫn hiểu sai là `false`. Chúng ta cần chuẩn hoá việc đọc/ghi giá trị này bằng cách kiểm tra linh hoạt cả hai kiểu dữ liệu `true` và `'true'`.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: 
  * Trước khi sửa: form lưu chỉ gửi `['product_watermark_image_enabled', 'product_watermark_image_url', ...]` xuống DB. Thiếu mất `enable_product_watermark`.
  * Sau khi sửa: form gửi đầy đủ `enable_product_watermark` dạng chuỗi `"true"` xuống DB. Khi F5, UI đọc lên thấy `"true"`, checkbox so sánh `form.enable_product_watermark === true || form.enable_product_watermark === 'true'` và tự động tích chọn chính xác.
* **Hình ảnh tương đồng đời thường**: Giống như việc bạn đi siêu thị mua một rổ đồ và viết danh sách thanh toán. Bạn bỏ sản phẩm "Máy lọc nước Watermark" vào rổ, nhưng trên tờ giấy thanh toán đưa cho thu ngân (`watermarkKeys`) lại quên ghi tên nó. Thu ngân quét rổ hàng nhưng chỉ tính tiền các món có trong giấy thanh toán, làm cho món hàng đó không được thanh toán và không được mang về nhà. Khi bạn về nhà mở rổ ra (F5), món hàng đó biến mất.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng ta đã tiến hành kiểm tra mã nguồn và xác định các điểm sau:
1. **Triệu chứng quan sát được**: 
   * Trên UI, người dùng tích chọn checkbox "Bật watermark sản phẩm" (ID: `enable_product_watermark`).
   * Người dùng nhấn nút "Lưu cài đặt". API `setMultiple` được gọi thành công nhưng không chứa key `enable_product_watermark`.
   * Khi tải lại trang (F5), checkbox trở về trạng thái trống (chưa tích).
2. **Nguyên nhân gốc**:
   * File `SettingsPageShell.tsx` thiếu key `enable_product_watermark` trong mảng `watermarkKeys` tại dòng 678.
   * File `SettingsPageShell.tsx` thiếu gán mặc định cho `enable_product_watermark = false` tại dòng 413 khi đồng bộ dữ liệu cài đặt từ DB.
   * Checkbox kiểm tra kiểu so sánh nghiêm ngặt `=== true` trong khi giá trị trong DB khi lưu bị ép kiểu thành chuỗi `"true"`.
3. **Phạm vi ảnh hưởng**: Giao diện cài đặt nâng cao của Admin (`/admin/settings/advanced`) và hiển thị watermark sản phẩm ở trang chi tiết/danh sách sản phẩm ngoài storefront.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Root Cause (Nguyên nhân gốc)**: High Confidence (Độ tin cậy cực cao). 
  * Do thiếu khai báo key `enable_product_watermark` trong quy trình save/load của `SettingsPageShell.tsx` và lệch kiểu dữ liệu (boolean vs string) khi đọc cấu hình bật watermark toàn cục.
* **Giả thuyết đối chứng**: 
  * *Giả thuyết*: Dữ liệu có lưu nhưng bị một hàm nền khác hoặc cron-job xoá đi? 
  * *Bác bỏ*: Không có tác vụ nền nào tự động dọn dẹp các cài đặt có nhóm là `'advanced'`. Các trường khác như `product_watermark_image_enabled` vẫn được lưu và tải lên bình thường sau khi F5.

---

# IV. Proposal (Đề xuất)

1. **Sửa đổi `SettingsPageShell.tsx`**:
   * Thêm giá trị mặc định cho `values.enable_product_watermark` là `false` khi khởi tạo dữ liệu trong `useEffect`.
   * Cập nhật điều kiện `checked` của checkbox `enable_product_watermark` thành `form.enable_product_watermark === true || form.enable_product_watermark === 'true'`.
   * Bổ sung `'enable_product_watermark'` vào danh sách `watermarkKeys` của hàm `handleSave`.
   * Bổ sung trường hợp kiểm tra boolean đặc biệt cho `enable_product_watermark` khi ép kiểu ở vòng lặp lưu để lưu giá trị chính xác.
2. **Sửa đổi `ProductImageWatermarkOverlay.tsx`**:
   * Cập nhật cách xác định `globalEnabled` để hỗ trợ cả giá trị chuỗi `'true'` từ DB: `const globalEnabled = globalEnabledSetting === true || globalEnabledSetting === 'true';`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI / Admin
#### [MODIFY] [SettingsPageShell.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/settings/_components/SettingsPageShell.tsx)
* *Vai trò hiện tại*: Quản lý giao diện cài đặt Admin, xử lý lưu và tải cấu hình hệ thống.
* *Thay đổi*: Bổ sung logic load mặc định, hiển thị checkbox an toàn kiểu chuỗi và ghi nhận key `enable_product_watermark` khi lưu cấu hình.

### Shared / Storefront
#### [MODIFY] [ProductImageWatermarkOverlay.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/shared/ProductImageWatermarkOverlay.tsx)
* *Vai trò hiện tại*: Hook và component hiển thị watermark đè lên ảnh sản phẩm ngoài trang chủ và trang chi tiết sản phẩm.
* *Thay đổi*: Hỗ trợ đọc trạng thái bật watermark toàn cục `enable_product_watermark` dưới dạng chuỗi `'true'` hoặc boolean `true`.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Đọc và chuẩn bị**: Mở các file bị ảnh hưởng để định vị chính xác dòng code cần thay thế.
2. **Cập nhật `SettingsPageShell.tsx`**:
   * Chèn giá trị mặc định `enable_product_watermark` vào trước phần default của watermark hình.
   * Sửa nút checkbox `enable_product_watermark` để kiểm tra an toàn.
   * Thêm key vào `watermarkKeys` và cập nhật logic parse boolean cho key này trong `handleSave`.
3. **Cập nhật `ProductImageWatermarkOverlay.tsx`**:
   * Sửa dòng gán `globalEnabled` để check cả dạng string `"true"`.
4. **Kiểm tra tĩnh**: Chạy typecheck tĩnh `bunx tsc --noEmit` để đảm bảo code không có lỗi TypeScript.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated/Static Tests
* Chạy lệnh kiểm tra TypeScript để đảm bảo các thay đổi không gây lỗi type:
  `bunx tsc --noEmit 2>&1 | Select-Object -First 10`

### Manual Verification
1. Truy cập trang `http://localhost:3000/admin/settings/advanced` và mở tab **Watermark**.
2. Tích chọn "Bật watermark sản phẩm", chỉnh sửa một vài thông tin watermark (ví dụ watermark chữ hoặc logo hình nếu có).
3. Ấn nút **Lưu cài đặt** và chờ thông báo thành công.
4. Nhấn **F5** để tải lại trang. Xác nhận checkbox "Bật watermark sản phẩm" vẫn giữ nguyên trạng thái được tích.
5. Kiểm tra ngoài trang chủ hoặc trang chi tiết sản phẩm để đảm bảo watermark hiển thị đúng như cấu hình.

---

# VIII. Todo
- [ ] Khởi tạo mặc định `enable_product_watermark` trong `SettingsPageShell.tsx`.
- [ ] Cập nhật UI Checkbox `enable_product_watermark` hỗ trợ so sánh chuỗi.
- [ ] Thêm `enable_product_watermark` vào `watermarkKeys` và xử lý parse tại `handleSave`.
- [ ] Hỗ trợ so sánh chuỗi trong hook `useProductWatermarkConfig` tại `ProductImageWatermarkOverlay.tsx`.
- [ ] Chạy kiểm tra TypeScript tĩnh.
- [ ] Báo cáo hoàn thành tác vụ với hiệu ứng âm thanh.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Checkbox "Bật watermark sản phẩm" lưu trạng thái thành công và giữ nguyên dấu tích sau khi tải lại trang (F5).
* Watermark sản phẩm ngoài storefront hoạt động chính xác tương ứng với trạng thái bật/tắt của checkbox này.
* Không có lỗi biên dịch TypeScript mới nào xuất hiện.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Mức độ rủi ro**: Rất thấp. Sửa đổi chỉ giới hạn trong phần xử lý giao diện admin cài đặt và hiển thị overlay ảnh sản phẩm.
* **Hoàn tác**: Sử dụng `git checkout` để khôi phục lại trạng thái ban đầu của 2 file `SettingsPageShell.tsx` và `ProductImageWatermarkOverlay.tsx` nếu phát hiện bất thường.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi cấu trúc cơ sở dữ liệu hoặc logic xử lý tập tin hình ảnh nâng cao của Convex.
* Refactor lại toàn bộ form cài đặt hệ thống.
