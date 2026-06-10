# I. Primer

## 1. TL;DR kiểu Feynman
Khi sử dụng tính năng Import AI hoặc thao tác trực tiếp trên form tạo/sửa sản phẩm:
- **Import AI**: Nếu AI đề xuất một giá trị thuộc tính mới (ví dụ giống nho "nho ABC") mà hệ thống chưa từng có, hệ thống không có ID của nó để điền. Chúng tôi cập nhật prompt để AI liệt kê các giá trị mới này vào trường `newAttributes`. Trong cửa sổ xem trước (Preview), hệ thống phát hiện ra các giá trị mới này, hiển thị cảnh báo kèm nút bấm "Đồng ý thêm vào DB". Sau khi Admin đồng ý, hệ thống tạo term mới, nhận về ID mới và gộp vào form.
- **Vấn đề lệch Unicode Tiếng Việt**: Tiếng Việt có hai chuẩn gõ là dựng sẵn (NFC) và tổ hợp. Nếu tên nhóm hoặc tên giá trị bị lệch chuẩn Unicode giữa DB và JSON của AI (ví dụ: nhóm "Xuất xứ" hoặc "Thương hiệu"), hệ thống sẽ không khớp được key dẫn đến bỏ sót giá trị hoặc không điền được. Giải pháp là chuẩn hóa tất cả chuỗi về NFC bằng `.normalize('NFC')` trước khi so khớp.
- **Tự động ánh xạ giá trị có sẵn**: Nếu AI trả về một giá trị trong `newAttributes` nhưng thực tế giá trị này đã tồn tại trong DB, hệ thống sẽ tự động tìm ID của giá trị đó trong DB và gộp vào form mà không yêu cầu tạo mới hay bỏ sót.
- **Thao tác trực tiếp trên form**: Ở phần "Phân loại chuyên sâu", bên cạnh các nhóm thuộc tính lựa chọn (Standard), chúng tôi bổ sung một nút bấm `+` nhỏ giúp Admin thêm nhanh giá trị mới trực tiếp trên form.

## 2. Elaboration & Self-Explanation
Hệ thống thuộc tính lọc (Attribute System) của sản phẩm bao gồm hai loại chính:
- **Standard (Chọn một/nhiều)**: Người dùng chọn các giá trị (Terms) đã định nghĩa trước dưới dạng checkbox/radio. AI chỉ biết được các ID có sẵn qua prompt cấu hình. Nếu AI muốn gợi ý một giá trị hoàn toàn mới, nó không có ID để điền.
- **Range (Khoảng số)**: Người dùng nhập số kèm đơn vị (ví dụ "13.5%"). Hệ thống đã có cơ chế tự động tạo term mới trong quá trình lưu sản phẩm chính.

Đề xuất cải tiến tập trung vào loại **Standard**:
a) **Cơ chế Import AI**:
   - Prompt AI: Bổ sung hướng dẫn và cấu hình schema để AI trả về trường `newAttributes` dạng `Record<string, string[]>` đại diện cho nhóm và các giá trị mới muốn thêm.
   - UI Preview: Khi Admin dán JSON từ AI vào, Client phân tích trường `newAttributes`, so khớp với cấu hình hiện tại để lọc ra các giá trị chưa có. Admin xem xét và bấm "Đồng ý thêm vào DB". Client gọi mutation `api.attributeTerms.create` để tạo các bản ghi term mới.
   - Chuẩn hóa Unicode: Tất cả các so sánh chuỗi liên quan đến tên nhóm thuộc tính và giá trị đều được chuẩn hóa qua `.normalize('NFC').toLowerCase().trim()` để tránh lỗi lệch chuẩn tiếng Việt dựng sẵn và tổ hợp.
   - Tự động ánh xạ giá trị có sẵn: Khi áp dụng vào form, hệ thống kiểm tra các giá trị trong `newAttributes`. Nếu giá trị nào thực tế đã có sẵn trong DB, hệ thống tự động lấy ID của nó và đưa vào danh sách được chọn.
   - Gộp ID tự động: Các ID của term mới tạo được lưu vào state tạm thời `createdTermIds`. Khi Admin bấm "Áp dụng vào form", Client gộp các ID mới tạo, các ID có sẵn được ánh xạ, và các ID có sẵn trước đó để điền vào form sản phẩm.
   - Sửa lỗi đồng bộ trễ: Tại hàm `handleApplyAiProduct` ở form cha, thay vì lọc `item.attributeTermIds` theo `formConfig` (gây mất ID mới do Convex chưa kịp đồng bộ về client), ta gán trực tiếp `setAttributeTermIds(item.attributeTermIds)`.
b) **Nút Thêm Nhanh Trực Tiếp trên Form**:
   - Tại component render thuộc tính lọc Standard của form tạo/sửa sản phẩm, thêm một nút bấm `+` nhỏ bên cạnh tiêu đề nhóm.
   - Khi click, hiển thị `window.prompt` cho phép Admin nhập nhanh tên giá trị (ví dụ "Thùng sồi Mỹ").
   - Sau khi nhập, Client thực hiện gọi mutation `api.attributeTerms.create` để ghi trực tiếp term mới này vào DB, nhận về ID mới và cập nhật `attributeTermIds` để tick chọn giá trị này ngay trên giao diện.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể 1 (Lệch Unicode)**: AI trả về `"newAttributes": { "Xuất xứ": ["Nhật Bản"] }`. Trong DB có sẵn "Xuất xứ" gõ bằng tổ hợp. Nhờ chuẩn hóa NFC, hệ thống tìm thấy "Xuất xứ" khớp hoàn toàn, phát hiện "Nhật Bản" chưa có và hiển thị nút đồng ý tạo.
- **Ví dụ cụ thể 2 (Tự động ánh xạ)**: AI trả về `"newAttributes": { "Xuất xứ": ["Pháp"] }` do không tìm thấy ID của "Pháp". Hệ thống phát hiện "Pháp" thực tế đã có trong DB với ID `id_phap`. Khi Admin bấm áp dụng, `id_phap` tự động được tick chọn trên form mà không cần tạo mới bản ghi "Pháp".

---

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã xác định nguyên nhân gốc gây lỗi không điền được thuộc tính mới là do lệch chuẩn Unicode tiếng Việt giữa JSON của AI và DB khiến so khớp key thất bại, và bộ lọc ID hợp lệ ở form cha loại bỏ các ID mới tạo trước khi đồng bộ hoàn tất.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**:
  1. Lệch Unicode (NFC vs NFD) khiến so khớp tên nhóm thuộc tính (như "Tuổi rượu", "Xuất xứ") bị lỗi.
  2. Lỗi race condition của Convex/React sync khiến bộ lọc ở form cha loại bỏ ID mới tạo.
  3. AI không biết ID của giá trị sẵn có nên đưa vào `newAttributes`, nhưng hệ thống chưa tự động ánh xạ ngược các giá trị đã tồn tại này về ID của chúng.

---

# IV. Proposal (Đề xuất)
- Bổ sung helper chuẩn hóa Unicode tiếng Việt NFC trong tất cả các logic so khớp thuộc tính lọc.
- Tự động tìm kiếm và ánh xạ ID của các giá trị đã có sẵn từ `newAttributes` trước khi gộp vào form.
- Loại bỏ bộ lọc `validIds` trong hàm `handleApplyAiProduct` ở cả hai file `create/page.tsx` và `edit/page.tsx`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [AiEntityImportDialog.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/components/AiEntityImportDialog.tsx)
  - Thay đổi: Cập nhật hàm `detectedNewAttributes` và `applyItem` để chuẩn hóa Unicode NFC và tự động ánh xạ ID các giá trị đã tồn tại.
- **Sửa**: [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx)
  - Thay đổi: Cập nhật hàm `handleApplyAiProduct`, loại bỏ `validIds` và chuẩn hóa Unicode NFC khi map thuộc tính Range.
- **Sửa**: [edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/[id]/edit/page.tsx)
  - Thay đổi: Cập nhật hàm `handleApplyAiProduct`, loại bỏ `validIds` và chuẩn hóa Unicode NFC khi map thuộc tính Range.

---

# VI. Execution Preview (Xem trước thực thi)
1. Sửa `AiEntityImportDialog.tsx` để thêm chuẩn hóa NFC và ánh xạ ID.
2. Sửa `create/page.tsx` và `edit/page.tsx` để sửa range inputs mapping và remove bộ lọc.
3. Chạy `bunx tsc --noEmit` kiểm tra lỗi compile.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Tests
- Chạy `bunx tsc --noEmit`.

### Manual Verification
- Dán JSON whisky Yamazaki 12 có chứa các thuộc tính mới và khoảng số.
- Xác nhận tất cả các thuộc tính "Tuổi rượu: 12 năm", "Dung tích: 700ml", "Thương Hiệu: Yamazaki" (mới tạo), "Xuất xứ: Nhật Bản" (mới tạo) được chọn đầy đủ trên form.
