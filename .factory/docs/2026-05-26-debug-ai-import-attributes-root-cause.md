# I. Primer

## 1. TL;DR kiểu Feynman
- Khi import sản phẩm bằng AI, ta dán một JSON chứa các thuộc tính.
- Đáng lẽ hệ thống phải tự check chọn các thuộc tính đã có sẵn trong cơ sở dữ liệu (ví dụ: Xuất xứ: "Nhật Bản", Thương hiệu: "Yamazaki") và điền giá trị thuộc tính khoảng (ví dụ: Tuổi rượu: "12 năm").
- Nhưng thực tế các thuộc tính này bị bỏ trống (không check, không điền số).
- Ta đã thêm code để chuẩn hóa Unicode tiếng Việt (tránh lỗi lệch dấu NFC/NFD) và chèn thêm log debug chi tiết ở phía Client (trình duyệt).
- Cần chạy lại thao tác và xem log ở Console của trình duyệt để tìm ra nguyên nhân chính xác tại sao so khớp bị thất bại (do dữ liệu chưa load kịp, tên nhóm bị lệch hoàn toàn, hay do state React bị ghi đè ngầm).

## 2. Elaboration & Self-Explanation
Hệ thống quản lý sản phẩm có module thuộc tính phân loại (Standard và Range). Khi Admin import thông tin sản phẩm bằng AI thông qua một hộp thoại (Dialog), AI sẽ sinh ra JSON chứa thông tin sản phẩm cùng với các thuộc tính của sản phẩm đó.
- Với thuộc tính Standard (chọn một/chọn nhiều): AI sẽ gửi các giá trị mới chưa có sẵn vào trường `newAttributes`, còn các giá trị đã có sẵn sẽ được AI điền ID vào `attributeTermIds`. Tuy nhiên, nếu AI không biết ID hoặc nhầm lẫn, AI có thể đưa các giá trị đã có sẵn (như "Nhật Bản" hay "Yamazaki") vào trường `newAttributes`. Hộp thoại Import AI có nhiệm vụ thông minh: duyệt qua `newAttributes`, đối chiếu với DB, nếu thấy giá trị đó thực tế đã tồn tại trong DB thì tự động tìm ra ID của nó và gộp vào `attributeTermIds` của form chính để check chọn trên giao diện.
- Với thuộc tính Range (khoảng số): AI gửi giá trị dạng text (như "12 năm" hay "700ml") trong `attributeRangeValues`. Hệ thống sẽ bóc tách phần số (ví dụ: "12") và đơn vị (ví dụ: "năm") để điền vào ô nhập số tương ứng của nhóm thuộc tính Range.
Hiện tại, cả hai tính năng trên đều đang gặp lỗi: Yamazaki và Nhật Bản không được tick, còn Tuổi rượu bị trống hoàn toàn, mặc dù Dung tích và Thùng gỗ sồi vẫn hoạt động tốt. Chúng ta cần tìm ra nguyên nhân gốc bằng cách đặt các điểm log debug tại runtime của trình duyệt, sau đó Admin sẽ thực hiện lại và gửi log.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng Admin giống như một người thủ kho đang điền một tờ phiếu nhập kho. Hộp thoại Import AI giống như một trợ lý đọc to thông tin sản phẩm cho thủ kho điền.
- Trợ lý nói: *"Xuất xứ sản phẩm này là Nhật Bản, thương hiệu Yamazaki nhé"* (dữ liệu trong JSON AI).
- Thủ kho nhìn vào danh sách các nhãn dán sẵn có trên kệ: có sẵn nhãn "Nhật Bản" và nhãn "Yamazaki". Đáng lẽ thủ kho chỉ cần lấy hai nhãn này dán lên sản phẩm (tick chọn checkbox). Nhưng vì lý do nào đó, thủ kho lại bỏ qua và không dán hai nhãn này.
- Trợ lý nói tiếp: *"Tuổi rượu là 12 năm nhé"*. Trên tờ phiếu có ô "Tuổi rượu: ...... %". Thủ kho nghe xong nhưng lại để trống không ghi số 12 vào ô đó.
Chúng ta cần biết thủ kho bị điếc (không nhận được dữ liệu), hay danh sách nhãn trên kệ bị thiếu (dữ liệu DB chưa load xong), hay có ai đó giật tờ phiếu và tẩy xóa thông tin ngay sau khi thủ kho vừa viết xong (state React bị ghi đè).

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra file cấu hình thuộc tính trả về từ query Convex: `api.productTypes.getFormConfig` trả về đúng cấu trúc `{ type, groups }`, trong đó mỗi group chứa đầy đủ danh sách `terms`.
- Đã kiểm tra code points của các chuỗi tiếng Việt có dấu trong database (qua log Convex của group "Thương Hiệu", "Xuất xứ", "Tuổi rượu") và đối chiếu với JSON AI dán vào: Kết quả code point trùng khớp 100% khi được normalize NFC (ví dụ: chữ "Tuổi rượu" có mã là `\u0054 \u0075 \u1ed5 \u0069 \u0020 \u0072 \u01b0 \u1ee3 \u0075`).
- Đã tích hợp thành công NFC normalization khi so khớp thuộc tính Range ở cả trang tạo sản phẩm ([create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx)) và trang sửa sản phẩm ([edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/%5Bid%5D/edit/page.tsx)).
- Đã chèn các câu lệnh `console.log` debug chi tiết tại runtime để theo dõi luồng dữ liệu khi bấm nút "Áp dụng" trên modal Import AI.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
Độ tin cậy nguyên nhân gốc: **Medium** (cần log của Admin để khẳng định chắc chắn 100%).

### Các giả thuyết đang được xem xét:
1. **Giả thuyết 1 (Độ tin cậy cao):** Race condition hoặc đồng bộ trễ của React State.
   - *Mô tả:* Khi `handleApplyAiProduct` chạy, nó đồng thời cập nhật nhiều state (`setName`, `setSlug`, `setDescription`, `setPrice` và đặc biệt là `setAttributeTermIds` và `setRangeInputs`). Việc cập nhật đồng thời này có thể kích hoạt một `useEffect` ẩn nào đó trong component cha tự động chạy lại và reset các trường thuộc tính lọc (ví dụ: useEffect lắng nghe sự thay đổi của category hoặc product type và tự động set `attributeTermIds([])` hoặc `setRangeInputs({})`).
2. **Giả thuyết 2 (Độ tin cậy trung bình):** `formConfig` bị rỗng tại thời điểm bấm nút "Áp dụng".
   - *Mô tả:* Khi dialog được mở, `formConfig` truyền từ component cha qua prop có thể bị `undefined` hoặc cũ do React render cycle, dẫn đến logic tìm kiếm `existingTermIdsFromNewAttrs` trả về mảng rỗng `[]`.
3. **Giả thuyết 3 (Độ tin cậy thấp):** Lỗi so khớp chuỗi do ký tự đặc biệt ở Yamazaki và Nhật Bản.
   - *Mô tả:* Đã bị loại trừ phần lớn vì test script so sánh code point cho thấy chúng khớp hoàn toàn. Tuy nhiên, vẫn có khả năng nhỏ là ở phía Client, dữ liệu DB thực sự bị nhiễm ký tự rác (như dấu cách không nhìn thấy).

# IV. Proposal (Đề xuất)
1. Thêm `console.log` debug tại `AiEntityImportDialog.tsx` để in ra giá trị của:
   - `formConfig` nhận được.
   - `result.item.newAttributes` được phân tích từ JSON.
   - Kết quả so khớp từng từ (tên group, tên term).
   - Mảng ID cuối cùng `finalItem.attributeTermIds`.
2. Thêm `console.log` debug tại `create/page.tsx` trong `handleApplyAiProduct` để in ra:
   - Mảng `attributeTermIds` nhận được.
   - Mảng `attributeRangeValues` nhận được và kết quả match regex của từng Range group.
   - Giá trị `rangeInputs` được gán.
3. Yêu cầu Admin chạy lại thao tác Import AI trên trình duyệt, mở F12 Console, copy/chụp ảnh màn hình log debug trả lại cho Agent để xác định chính xác giả thuyết nào đúng. Sau đó tiến hành sửa triệt để.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [AiEntityImportDialog.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/components/AiEntityImportDialog.tsx)
  - Chèn log debug vào hàm `applyItem`.
- **Sửa**: [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx)
  - Chèn log debug vào hàm `handleApplyAiProduct`.
- **Sửa**: [edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/%5Bid%5D/edit/page.tsx)
  - Cập nhật chuẩn hóa NFC cho thuộc tính Range để đồng bộ với trang create.

# VI. Execution Preview (Xem trước thực thi)
1. Ghi log debug vào `AiEntityImportDialog.tsx` và `create/page.tsx`.
2. Đồng bộ logic chuẩn hóa NFC vào `edit/page.tsx`.
3. Kiểm tra biên dịch TypeScript toàn dự án bằng lệnh `tsc`.
4. Trình bày báo cáo và hướng dẫn Admin cách lấy log Console để tìm ra Root Cause chính xác.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy lệnh `bunx tsc --noEmit` để đảm bảo code không có lỗi cú pháp hoặc Type TypeScript.
- Admin sẽ thực hiện manual test trên giao diện localhost bằng cách Import AI và gửi log console cho Agent.

# VIII. Todo
- [x] Thêm console.log debug vào `AiEntityImportDialog.tsx`.
- [x] Thêm console.log debug vào `create/page.tsx`.
- [x] Cập nhật chuẩn hóa NFC cho Range attributes ở `edit/page.tsx`.
- [x] Chạy kiểm tra TypeScript (`bunx tsc --noEmit`).
- [ ] Nhận log từ Admin và sửa triệt để lỗi.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Code biên dịch thành công.
- Khi dán JSON AI vào, client in ra đầy đủ log chi tiết về quá trình so khớp thuộc tính.
