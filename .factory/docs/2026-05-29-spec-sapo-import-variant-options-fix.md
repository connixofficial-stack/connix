# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng tải lên file Excel từ Sapo để nhập sản phẩm, hệ thống đang bị nhầm lẫn tai hại: các kích thước giày như `36`, `37`, `38` lại bị xếp vào nhóm thuộc tính **"Màu sắc"**.
Nguyên nhân là do adapter import hiện tại chỉ trích xuất các giá trị như `36`, `37` mà không trích xuất tên của thuộc tính tương ứng (cột `"Size"`). Ở phía backend, hệ thống tự động gán các giá trị này vào thuộc tính đầu tiên có sẵn trong cơ sở dữ liệu (trong DB hiện tại, thuộc tính đầu tiên là `"Màu sắc"`).
Giải pháp là cập nhật adapter để đọc tên thuộc tính thực tế từ file Excel (ví dụ: `"Size"`, `"Màu sắc"`), sau đó gửi danh sách tên thuộc tính này xuống backend Convex để phân loại chính xác các giá trị vào đúng thuộc tính của nó.

## 2. Elaboration & Self-Explanation
Hiện nay, quy trình import Excel Sapo diễn ra như sau:
1. Client tải file Excel lên -> Gọi Server Action `parseProductExcelBase64` để chuyển đổi dữ liệu.
2. Server Action gọi `SapoThanShoesAdapter.parse(...)` để chuyển Excel thành mảng `ParsedProductRecord[]`.
3. `SapoThanShoesAdapter` hiện tại chỉ đọc cột `Giá trị thuộc tính 1` (cột H) gán vào `variantOption1` của biến thể. Nó hoàn toàn bỏ qua tên thuộc tính tại cột G (`"Size"`) và các thuộc tính khác (nếu có).
4. Sau khi parse xong, Client gọi Convex mutation `upsertBulk`. Tham số `optionNames` truyền xuống backend hiện đang được lấy tĩnh từ các options hiện có trong DB:
   `const optionNames = excelOptions.map((opt) => opt.name);` // Kết quả: `["Màu sắc", "Size quần áo"]`
5. Tại backend Convex, mutation `upsertBulk` gán `optionNames[0]` (tức `"Màu sắc"`) cho `variantOption1`. Do đó, kích thước `36`, `37` bị dán nhãn màu sắc.

Để sửa lỗi này một cách triệt để và an toàn:
a) Mở rộng interface `ParsedProductRecord` trong [excel-actions.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/actions/excel-actions.ts) để chứa thêm thuộc tính ẩn `detectedOptionNames?: string[]` ở cấp record cha.
b) Cập nhật adapter `sapo-thanshoes.adapter.ts`:
   - Xác định thêm các cột tên thuộc tính: `opt1NameCol = 7` (Thuộc tính 1), `opt2NameCol = 9` (Thuộc tính 2).
   - Xác định thêm các cột giá trị thuộc tính tương ứng: `opt1ValueCol = 8` (Giá trị thuộc tính 1), `opt2ValueCol = 10` (Giá trị thuộc tính 2).
   - Trong quá trình duyệt các dòng, trích xuất tên thuộc tính 1 và 2 (ví dụ: `"Size"`, `"Màu sắc"`) khi đọc dòng sản phẩm cha và lưu giữ làm trạng thái chung.
   - Gán `variantOption1` và `variantOption2` cho từng biến thể một cách chính xác.
   - Thu thập tất cả các tên thuộc tính độc bản phát hiện được, gán vào `detectedOptionNames` của record đầu tiên trong danh sách kết quả.
c) Cập nhật Server Action `parseProductExcelBase64` để đọc `detectedOptionNames` từ record đầu tiên và trả về cùng với mảng dữ liệu:
   `return { success: true, data, optionNames: data[0]?.detectedOptionNames };`
d) Cập nhật component Client [import-modal.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/components/import-modal.tsx) để ưu tiên sử dụng `result.optionNames` được trả về từ Server Action khi gọi mutation `upsertBulk`.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn có một chiếc tủ nhiều ngăn kéo để phân loại đồ đạc. Hiện tại tủ có ngăn kéo thứ nhất dán nhãn **"Màu sắc"** và ngăn kéo thứ hai dán nhãn **"Size quần áo"**.
- **Lỗi hiện tại:** Khi bạn mang một chiếc hộp chứa các thẻ ghi số `36`, `37` đến, người phân loại đồ chỉ nhìn thấy các thẻ số mà không đọc nhãn của chiếc hộp là "Size giày". Họ tự động bỏ các thẻ số `36`, `37` vào ngăn kéo đầu tiên là "Màu sắc". Kết quả là ngăn kéo "Màu sắc" chứa các số `36`, `37`.
- **Giải pháp mới:** Chúng ta sẽ ghi rõ nhãn "Size" lên chiếc hộp chứa thẻ số. Người phân loại đồ đọc nhãn "Size" trên hộp, đối chiếu với tủ, tự động tạo thêm một ngăn kéo dán nhãn "Size" (hoặc bỏ vào ngăn kéo "Size quần áo" tương đương) và cất đúng các thẻ số `36`, `37` vào đó.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã truy vấn cơ sở dữ liệu thực tế bằng Convex CLI (`npx convex data productOptions` và `npx convex data productOptionValues`).
- Phát hiện các giá trị kích cỡ (`36`, `37`, `38`...) đều bị liên kết sai lệch với `optionId` của thuộc tính `"Màu sắc"`.
- Đã chạy script phân tích file Excel thực tế `"C:\Users\VTOS\Downloads\danh_sach_san_pham_29.05.2026_20ef772640eb25cb7e42e48b625939ff.xlsx"`.
- Xác nhận cấu trúc cột của Sapo Excel:
  - Cột 7 (`Col 7`): `"Thuộc tính 1"` (Chứa tên thuộc tính, ví dụ: `"Size"`)
  - Cột 8 (`Col 8`): `"Giá trị thuộc tính 1"` (Chứa giá trị kích cỡ, ví dụ: `"36"`)
  - Cột 9 (`Col 9`): `"Thuộc tính 2"` (Chứa tên thuộc tính 2, ví dụ: `"Màu sắc"`)
  - Cột 10 (`Col 10`): `"Giá trị thuộc tính 2"` (Chứa giá trị màu sắc)

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:** Adapter `sapo-thanshoes.adapter.ts` không trích xuất tên thuộc tính từ Excel, và phía Client gán cứng danh sách `optionNames` theo thứ tự các options hiện có trong DB (dẫn đến `"Màu sắc"` đứng đầu mảng map đè lên `"Size"`).
- **Giả thuyết đối chứng:** Nếu chỉ sửa cứng thứ tự `optionNames` trên Client thì khi người dùng import một file Excel khác có cấu trúc khác (ví dụ: Màu sắc đứng trước, Size đứng sau hoặc chỉ có Màu sắc), lỗi phân loại sai sẽ lại tiếp tục tái diễn. Giải pháp duy nhất bền vững là adapter tự động phát hiện tên thuộc tính từ chính file Excel và trả về động cho Client/Backend xử lý.

# IV. Proposal (Đề xuất)
1. Cập nhật `ParsedProductRecord` trong `excel-actions.ts` để thêm trường `detectedOptionNames?: string[]`.
2. Cập nhật adapter `sapo-thanshoes.adapter.ts` để đọc và phân loại động các thuộc tính:
   - Trích xuất `currentOpt1Name` và `currentOpt2Name` từ cột `Thuộc tính 1` và `Thuộc tính 2` tại dòng cha.
   - Map `variantOption1` và `variantOption2` một cách tương ứng.
   - Gán mảng các tên thuộc tính phát hiện được vào `detectedOptionNames` của record đầu tiên.
3. Cập nhật `parseProductExcelBase64` trong `excel-actions.ts` để trả về `optionNames: data[0]?.detectedOptionNames`.
4. Cập nhật `import-modal.tsx` để truyền `result.optionNames` nhận được vào mutation `upsertBulk`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa:` [excel-actions.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/actions/excel-actions.ts)
  - Thay đổi: Mở rộng kiểu dữ liệu `ParsedProductRecord` và trả về `optionNames` phát hiện được từ Server Action.
- `Sửa:` [sapo-thanshoes.adapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/excel/adapters/sapo-thanshoes.adapter.ts)
  - Thay đổi: Đọc động các cột `Thuộc tính 1`, `Thuộc tính 2` để phân loại chuẩn xác thuộc tính và gán vào `detectedOptionNames`.
- `Sửa:` [import-modal.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/components/import-modal.tsx)
  - Thay đổi: Nhận và truyền `optionNames` động từ kết quả parse Excel vào mutation `upsertBulk`.

# VI. Execution Preview (Xem trước thực thi)
1. Sửa `excel-actions.ts` để cập nhật kiểu dữ liệu và Server Action.
2. Sửa `sapo-thanshoes.adapter.ts` để triển khai logic phân tích thuộc tính động từ Excel Sapo.
3. Sửa `import-modal.tsx` để truyền động `optionNames` cho backend.
4. Chạy `bunx tsc --noEmit` để kiểm tra lỗi kiểu tĩnh.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy biên dịch TypeScript để đảm bảo không có lỗi type.
- Bàn giao cho user để họ xóa DB hiện tại, sau đó thực hiện import lại file Excel Sapo và xác nhận các options được tạo và map chính xác.

# VIII. Todo
- [ ] Thay đổi file [excel-actions.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/actions/excel-actions.ts)
- [ ] Thay đổi file [sapo-thanshoes.adapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/excel/adapters/sapo-thanshoes.adapter.ts)
- [ ] Thay đổi file [import-modal.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/components/import-modal.tsx)
- [ ] Thực hiện biên dịch dự án để kiểm tra lỗi type.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Sau khi import lại, các kích thước `36`, `37`, `38`... phải nằm trong đúng thuộc tính tên là `"Size"` (hoặc `"Kích cỡ"` tương ứng với nhãn trong Excel).
- Các thuộc tính màu sắc (nếu có) phải được phân loại chuẩn xác vào đúng thuộc tính `"Màu sắc"`.
- Toàn bộ dự án Next.js biên dịch thành công không có lỗi type.
