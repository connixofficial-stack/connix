# Spec: Nâng Cấp Nút Nhập Sản Phẩm Bằng AI Thông Minh Với Hệ Thống Phân Loại & Combo

## I. Primer

### 1. TL;DR kiểu Feynman
* **Vấn đề**: Khi bật tính năng "Hệ thống Phân loại & Thuộc tính" hoặc "Hệ thống Combo", công cụ "Import AI" khi tạo/sửa sản phẩm chỉ sinh ra các nội dung tĩnh cơ bản (tên, giá, mô tả), không tự động đề xuất combo và không tự điền thuộc tính phân loại (vì AI không biết ID của thuộc tính trong DB).
* **Giải pháp**: 
  * Tích hợp thêm 2 toggle bật/tắt (mặc định tắt) trong modal Import AI: "Đề xuất Combo thường" và "Điền thuộc tính lọc".
  * Khi bật "Đề xuất Combo thường": prompt yêu cầu AI gợi ý các combo dạng "standard" bán kèm hợp lý (không mix).
  * Khi bật "Điền thuộc tính lọc": prompt sẽ đính kèm thông tin danh mục, kiểu sản phẩm hiện tại cùng danh sách ID thuộc tính hợp lệ để AI tự so khớp và điền chính xác mảng `attributeTermIds` vào JSON kết quả.

### 2. Elaboration & Self-Explanation
Chúng ta mở rộng component `AiEntityImportDialog` để nhận thêm các cấu hình bật/tắt hệ thống và dữ liệu `formConfig` chứa cấu trúc thuộc tính thực tế của Kiểu sản phẩm đang chọn.
* Khi người dùng bật **"Đề xuất Combo thường"**: JSON Schema & mẫu được cập nhật để yêu cầu trường `combos: Array`. Cấu trúc combo chỉ giới hạn ở kiểu `standard` để tránh sinh combo mix theo ý đồ người dùng.
* Khi người dùng bật **"Điền thuộc tính lọc"**: Chúng ta duyệt qua `formConfig` truyền từ form cha vào, kết xuất thông tin trực quan dưới dạng văn bản chỉ rõ các nhóm thuộc tính (ví dụ "Quốc gia") và danh sách các cặp `"Giá trị" (ID: "id_value")` để đính kèm vào prompt. AI sẽ đọc danh sách này, phân tích tính chất sản phẩm đang viết và điền các ID phù hợp vào mảng `attributeTermIds` ở JSON đầu ra.
* Tại hàm `handleApplyAiProduct` của trang create và edit sản phẩm, chúng ta bắt mảng `attributeTermIds` và gán vào state của form, đồng thời bắt mảng `combos` ở trang edit và gán vào state `combos` tương ứng.

### 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Khi bạn tạo sản phẩm "Rượu vang Chateau Margaux" và đã chọn danh mục "Vang đỏ" (thuộc kiểu sản phẩm "Rượu vang").
  * Nếu bật toggle "Điền thuộc tính lọc": Prompt chuẩn sẽ bổ sung: `Nhóm thuộc tính "Quốc gia": "Pháp" (ID: "id_phap"), "Ý" (ID: "id_y")`. AI đọc được sẽ tự động chọn `attributeTermIds: ["id_phap"]` và trả về. Khi bạn bấm áp dụng vào form, thuộc tính "Pháp" tự động được check mà không cần bạn bấm tay.
  * Nếu bật "Đề xuất Combo thường": AI tự động đề xuất thêm combo: Mua 2 chai Chateau Margaux tặng 1 khui rượu (standardConfig rewardType: "gift", giftProductQuery: "Khui rượu").

---

## II. Audit Summary (Tóm tắt kiểm tra)

* **Vị trí code hiện tại**:
  * Component modal Import AI: [AiEntityImportDialog.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/components/AiEntityImportDialog.tsx)
  * Trang tạo sản phẩm: [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx)
  * Trang sửa sản phẩm: [[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/[id]/edit/page.tsx)
* **Trạng thái hiện tại**: Đã fetch đầy đủ các cấu hình `enableProductTypes`, `enableCombos` (hoặc `enableCombosSetting`) và `formConfig` ở cả 2 trang tạo/sửa sản phẩm.

---

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc**: Prompt AI của admin và JSON parser chưa được tích hợp liên kết động với siêu dữ liệu thuộc tính (metadata) và hệ thống combo của dự án.
* **Giả thuyết đối chứng**: Việc truyền dữ liệu `formConfig` và bật các tùy chọn prompt hoàn toàn không gây chậm trang vì chúng ta chỉ lấy dữ liệu đã được query sẵn tại trang cha, hoàn toàn xử lý cục bộ trên Client khi sinh Text prompt.

---

## IV. Proposal (Đề xuất)

### 1. Mở rộng Type
Cập nhật type `AiEntityImportPayload` trong `AiEntityImportDialog.tsx` để chấp nhận thêm `combos?: any[]` và `attributeTermIds?: string[]`.

### 2. Thêm UI Checkbox Toggle
Vẽ giao diện chọn tùy chọn AI prompt bằng component `Checkbox` từ `./ui` ở đầu DialogContent, thiết kế tối giản và cao cấp.

### 3. Đổ dữ liệu vào Prompt động
Sử dụng `useMemo` để render lại `prompt` và `sample` bất cứ khi nào người dùng tương tác bật/tắt checkbox hoặc thay đổi kiểu sản phẩm trên form.

---

## V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa**: [AiEntityImportDialog.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/components/AiEntityImportDialog.tsx)
  * Bổ sung props, state toggles, hàm `buildSample`, chỉnh sửa `buildPrompt`, `buildSchema` và `parseAiEntity`.
* **Sửa**: [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx)
  * Gửi `enableProductTypes`, `enableCombos` và `formConfig` vào dialog.
  * Nhận `attributeTermIds` từ AI và set vào state của form.
* **Sửa**: [[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/[id]/edit/page.tsx)
  * Gửi các cấu hình tương tự vào dialog.
  * Nhận `attributeTermIds` và `combos` từ AI và set vào state tương ứng.

---

## VI. Execution Preview (Xem trước thực thi)

1. Mở file [AiEntityImportDialog.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/components/AiEntityImportDialog.tsx), cập nhật kiểu dữ liệu payload, thêm state và hàm helper.
2. Cập nhật JSX dialog render checkbox toggles và gọi `buildPrompt`/`buildSample` động.
3. Mở các file `create/page.tsx` và `[id]/edit/page.tsx`, chỉnh sửa hook `handleApplyAiProduct` để đón nhận dữ liệu mới và gán vào form.
4. Chạy compiler kiểm tra TypeScript.

---

## VII. Verification Plan (Kế hoạch kiểm chứng)

### 1. Automated Tests
* Chạy `bunx tsc --noEmit` để đảm bảo Next.js compile thành công sạch lỗi.

### 2. Manual Verification
* Mở trang Thêm mới sản phẩm, chọn một Danh mục và Kiểu sản phẩm có thuộc tính lọc.
* Bấm nút "Import AI", kiểm tra xem có xuất hiện checkbox "Điền thuộc tính lọc" hay không.
* Click bật checkbox, copy "Prompt chuẩn" và kiểm tra xem trong prompt đã được đính kèm chính xác danh sách các giá trị thuộc tính lọc của kiểu sản phẩm đó cùng ID của chúng chưa.
* JSON mẫu có xuất hiện mảng `attributeTermIds` mẫu hay không.
* Dán một đoạn JSON kết quả từ AI chứa các `attributeTermIds` hợp lệ, bấm áp dụng và kiểm tra xem các checkbox thuộc tính trên form có tự động được tích chọn hay không.
* Mở trang Sửa sản phẩm, kiểm tra tương tự với cả checkbox "Đề xuất Combo thường" và xác nhận các combo mới được chèn vào form.

---

## VIII. Todo

* [x] Bổ sung các trường optional vào `AiEntityImportPayload` trong `AiEntityImportDialog.tsx`.
* [x] Cập nhật các helper sinh prompt, schema và sample động theo toggles.
* [x] Cập nhật hàm `parseAiEntity` bóc tách `combos` và `attributeTermIds`.
* [x] Render checkbox toggles trên Dialog UI.
* [x] Tích hợp gán state trong `create/page.tsx` và `[id]/edit/page.tsx`.
* [ ] Kiểm tra compile TypeScript.
* [ ] Commit thay đổi và phát âm báo hoàn thành.

---

## IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Khi hệ thống Phân loại được bật và sản phẩm đang chọn kiểu sản phẩm có thuộc tính, nút toggle "Điền thuộc tính lọc" hiển thị trong modal Import AI.
* Khi hệ thống Combo được bật, nút toggle "Đề xuất Combo thường" hiển thị trong modal Import AI.
* Prompt chuẩn và JSON mẫu cập nhật động tức thì khi bật/tắt các toggle này.
* AI đề xuất đúng cấu hình combo dạng standard (không mix).
* AI chọn chính xác các ID thuộc tính lọc thích hợp và trả về mảng `attributeTermIds`.
* Khi áp dụng vào form, các thuộc tính lọc được chọn tự động và danh sách combo được điền tự động.
* Compiler TypeScript không báo bất kỳ lỗi nào.

---

## X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Thấp vì chỉ tác động vào giao diện và cơ chế map dữ liệu từ AI ở client admin.
* **Hoàn tác**: Sử dụng `git checkout` để khôi phục các file về trạng thái commit gần nhất.
