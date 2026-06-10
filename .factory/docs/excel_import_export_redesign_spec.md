# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: File Excel mẫu nhập sản phẩm hiện tại phối màu kém chuyên nghiệp, cột quá hẹp làm tràn chữ, dropdown danh mục bị lỗi. Biến thể sản phẩm thì bị cố định thành "Phân loại 1/2" thay vì dùng các thuộc tính thực tế (như Màu sắc, Kích cỡ) và không có dropdown để chọn giá trị, cũng như không import được ảnh của phiên bản biến thể.
* **Giải pháp**:
  * Tự động lấy tối đa 2 thuộc tính (Product Options) đang kích hoạt trong hệ thống để tạo thành các cột thực tế trong file Excel (ví dụ: cột "Màu sắc" và "Kích cỡ").
  * Thiết kế lại sheet từ điển dữ liệu (`_Data_TuDien`) hiển thị rõ ràng, đẹp đẽ, tự động giãn độ rộng để không bị rớt dòng. Cột thuộc tính sẽ được liên kết dropdown trực tiếp với sheet từ điển này.
  * Hỗ trợ import ảnh riêng cho từng phiên bản (Variant Image) nếu cấu hình hệ thống cho phép ghi đè ảnh.
  * Tối ưu hóa giao diện file Excel bằng bảng màu Navy/Teal sang trọng, font Segoe UI đồng bộ, căn chỉnh cột rộng rãi và tự động xuống dòng hợp lý.

## 2. Elaboration & Self-Explanation
Hệ thống hiện tại đang sử dụng cấu hình tĩnh cho file Excel. Khi xuất file mẫu, hệ thống chỉ tạo ra 2 cột tượng trưng là "Phân loại 1" và "Phân loại 2" dưới dạng ô nhập văn bản tự do. Điều này khiến người quản trị dễ nhập sai chính tả (ví dụ dòng trên nhập "Đỏ", dòng dưới nhập "đỏ " có khoảng trắng), dẫn đến việc hệ thống tạo ra các thuộc tính trùng lặp hoặc sai lệch. Ngoài ra, việc phối màu chói mắt và cột quá hẹp khiến file Excel trông thiếu chuyên nghiệp.

Để khắc phục, chúng ta sẽ làm cho quy trình này trở nên động và an toàn (schema-driven & data-validated):
* **Bước 1**: Khi người dùng nhấn tải Template, Client Component sẽ fetch danh sách các danh mục (Categories) và các thuộc tính biến thể đang hoạt động (Active Product Options kèm theo danh sách các giá trị hợp lệ của chúng).
* **Bước 2**: Thay vì tạo các cột "Phân loại 1/2" chung chung, chúng ta sẽ tạo các cột tương ứng với tên thuộc tính thật (ví dụ cột "Màu sắc", cột "Kích cỡ").
* **Bước 3**: Tạo ra một sheet từ điển `_Data_TuDien` hiển thị rõ ràng ở cuối file Excel, được định dạng chuyên nghiệp với các cột dữ liệu tương ứng. Dùng tính năng `dataValidation` của ExcelJS để liên kết dropdown của các cột biến thể ở sheet chính với vùng dữ liệu tương ứng ở sheet từ điển.
* **Bước 4**: Khi người dùng upload file Excel đã điền dữ liệu, bộ phân tích (parser) ở Client sẽ đọc các cột động này, trích xuất dữ liệu biến thể cùng với hình ảnh biến thể (nếu có), sau đó gửi lên mutation `upsertBulk` ở Convex kèm theo danh sách tên các thuộc tính thực tế.
* **Bước 5**: Server Convex sẽ so khớp chính xác tên thuộc tính và giá trị thuộc tính để lưu vào database một cách nhất quán, không sinh thêm dữ liệu rác.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**:
  * Hệ thống đang có 2 thuộc tính hoạt động:
    1. **Màu sắc** (Option values: `Đỏ`, `Xanh`, `Vàng`)
    2. **Kích cỡ** (Option values: `38`, `39`, `40`, `41`)
  * File Excel mẫu tải về sẽ có:
    * Sheet chính `SanPham` có cột `Màu sắc` và cột `Kích cỡ`.
    * Khi click vào một ô ở cột `Màu sắc`, Excel hiển thị dropdown cho phép chọn: `Đỏ`, `Xanh`, `Vàng`.
    * Khi click vào một ô ở cột `Kích cỡ`, Excel hiển thị dropdown cho phép chọn: `38`, `39`, `40`, `41`.
    * Sheet từ điển `_Data_TuDien` sẽ hiển thị công khai ở tab thứ hai, liệt kê rõ ràng các danh mục và danh sách giá trị của Màu sắc, Kích cỡ với màu sắc chuyên nghiệp.
* **Hình ảnh so sánh (Analogy)**:
  * Việc nhập liệu tự do giống như viết tay trên một tờ giấy trắng, người dùng dễ viết lệch dòng hoặc sai chính tả. Việc thêm dropdown liên kết từ điển giống như một biểu mẫu trắc nghiệm có sẵn các ô để tích chọn. Nó đảm bảo mọi người nhập liệu đều đưa ra một đáp án chuẩn hóa giống nhau, giúp máy tính xử lý tự động mà không gặp lỗi.

# II. Audit Summary (Tóm tắt kiểm tra)

* **Hiện trạng tệp tin**:
  * [excel-actions.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/actions/excel-actions.ts): Đang xuất template với các cột cố định `variantOption1`, `variantOption2` (Phân loại 1, Phân loại 2). Dropdown category bị ẩn sheet từ điển. Chưa hỗ trợ dropdown cho biến thể. Chưa parse ảnh phiên bản.
  * [product-schema-builder.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/excel/product-schema-builder.ts): Hàm `buildExcelColumns` nhận cấu hình `ProductModuleConfig` tĩnh và tạo ra các cột Excel định sẵn.
  * [import-modal.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/components/import-modal.tsx): Chỉ truyền danh mục vào hàm tạo template excel, thiếu product options.
  * [productsImport.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/productsImport.ts): Mutation `upsertBulk` hardcode tên thuộc tính là `"Phân loại 1"` và `"Phân loại 2"`, đồng thời bỏ qua việc lưu trường `image` cho `productVariants`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc**:
  * **Dropdown bị lỗi**: Excel giới hạn chuỗi dropdown trực tiếp dạng `"Đỏ,Xanh,Vàng"` tối đa 255 ký tự. Khi danh sách giá trị quá dài hoặc chứa ký tự đặc biệt, Excel sẽ báo lỗi hoặc không hiển thị dropdown.
  * **Cột "Phân loại 1 / 2" bị cứng**: Hệ thống chưa truyền metadata về các thuộc tính (Product Options) thực tế từ database vào quá trình xây dựng schema Excel và parser.
  * **Tràn chữ/Hẹp/Xấu**: Kích thước cột thiết lập cứng quá nhỏ, không tự động co giãn theo nội dung dài nhất của danh sách từ điển, sheet từ điển bị ẩn đi khiến người dùng không biết dữ liệu chuẩn để đối chiếu.
  * **Thiếu ảnh phiên bản**: Parser Excel chưa đọc cột `imageUrl` khi xử lý dòng biến thể, và mutation `upsertBulk` chưa khai báo trường `imageUrl`/`image` trong schema của biến thể.

* **Độ tin cậy nguyên nhân gốc**: **High (Cao)** vì qua phân tích mã nguồn ta thấy rõ các điểm nghẽn logic và giao diện này.

# IV. Proposal (Đề xuất)

## 1. Convex Backend
* Thêm query `listActiveWithValues` vào [productOptions.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/productOptions.ts) để trả về các options active kèm active values của chúng.
* Cập nhật mutation `upsertBulk` ở [productsImport.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/productsImport.ts):
  * Nhận thêm đối số tùy chọn `optionNames: v.optional(v.array(v.string()))`.
  * Cập nhật `bulkVariantDoc` hỗ trợ nhận trường `imageUrl: v.optional(v.string())`.
  * Trong logic import biến thể, nếu `vData.imageUrl` được truyền lên thì lưu vào trường `image` của bảng `productVariants`.
  * Thay thế tên mặc định `"Phân loại 1"`, `"Phân loại 2"` bằng các giá trị tương ứng trong `optionNames` nhận được.

## 2. Frontend & Excel Template Generator
* Cập nhật [import-modal.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/components/import-modal.tsx):
  * Dùng `useQuery(api.productOptions.listActiveWithValues)` để lấy danh sách thuộc tính động.
  * Truyền danh sách thuộc tính động này vào `generateProductTemplateBase64` và `parseProductExcelBase64`.
  * Gửi danh sách tên thuộc tính (`optionNames`) lên mutation `upsertBulk` khi tiến hành import.
* Cập nhật [product-schema-builder.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/excel/product-schema-builder.ts):
  * Cho phép hàm `buildExcelColumns` nhận thêm mảng `options` động.
  * Dựa trên mảng `options` này để tạo cột động thay thế cho "Phân loại 1", "Phân loại 2".
* Cập nhật [excel-actions.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/actions/excel-actions.ts):
  * Nhận mảng `options` động trong `generateProductTemplateBase64`.
  * Vẽ sheet `_Data_TuDien` hiển thị ở dạng công khai, định dạng đẹp mắt (Navy/Teal header, Segoe UI, viền mỏng, tự co giãn độ rộng cột dựa trên nội dung dài nhất để không bị rớt dòng).
  * Liên kết dropdown validation của cột option 1 và option 2 trực tiếp tới các cột dữ liệu tương ứng trong sheet `_Data_TuDien`.
  * Cập nhật `parseProductExcelBase64` để trích xuất dữ liệu thuộc tính biến thể dựa theo tên cột động, đồng thời đọc trường `imageUrl` gán vào variant nếu cấu hình hệ thống cho phép ghi đè ảnh.

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa**: [convex/productOptions.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/productOptions.ts)
  * Vai trò: Quản lý các truy vấn và mutation của Product Options.
  * Thay đổi: Thêm query `listActiveWithValues` để lấy toàn bộ option hoạt động kèm các giá trị của chúng.
* **Sửa**: [convex/productsImport.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/productsImport.ts)
  * Vai trò: Mutation import số lượng lớn sản phẩm.
  * Thay đổi: Mở rộng schema nhận `optionNames` và `variant.imageUrl`, map tên thuộc tính động khi tạo/gán option, lưu ảnh cho `productVariants`.
* **Sửa**: [lib/excel/product-schema-builder.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/excel/product-schema-builder.ts)
  * Vai trò: Định nghĩa cấu trúc cột của file Excel.
  * Thay đổi: Cho phép nhận danh sách options động để định nghĩa tên và kiểu dữ liệu (dropdown) cho các cột biến thể.
* **Sửa**: [app/admin/products/actions/excel-actions.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/actions/excel-actions.ts)
  * Vai trò: Tạo và parse file Excel.
  * Thay đổi: Tạo sheet từ điển đẹp đẽ co giãn cột tự động, thiết lập validation dropdown từ sheet từ điển, parse ảnh biến thể và map biến thể theo cột động.
* **Sửa**: [app/admin/products/components/import-modal.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/components/import-modal.tsx)
  * Vai trò: Modal giao diện Import/Export Excel.
  * Thay đổi: Lấy dữ liệu options và values hoạt động gửi vào engine sinh excel/parser, truyền tên option lên server khi import.

# VI. Execution Preview (Xem trước thực thi)

1. Thêm query `listActiveWithValues` vào `convex/productOptions.ts`.
2. Mở rộng schema và logic map biến thể, lưu ảnh phiên bản trong `convex/productsImport.ts`.
3. Sửa `lib/excel/product-schema-builder.ts` để hỗ trợ sinh cột biến thể động từ dữ liệu options truyền vào.
4. Cải tiến `app/admin/products/actions/excel-actions.ts` để vẽ sheet từ điển đẹp đẽ, giãn cột, set validation dropdown động và parse ảnh biến thể.
5. Cập nhật `app/admin/products/components/import-modal.tsx` để kết nối dữ liệu từ Convex vào quy trình tạo và parse Excel.
6. Chạy kiểm tra TypeScript (`bunx tsc --noEmit`) để đảm bảo không lỗi cú pháp.

# VII. Verification Plan (Kế hoạch kiểm chứng)

## 1. Automated Tests
* Chạy `bunx tsc --noEmit` để đảm bảo hệ thống build thành công và không bị lỗi kiểu dữ liệu (Type safety).

## 2. Manual Verification
* Người dùng thực hiện:
  * Vào `http://localhost:3000/admin/products`, click chọn "Import / Export".
  * Nhấn "Tải Mẫu Excel Mới Nhất".
  * Mở file Excel vừa tải về, kiểm tra:
    * Sheet chính `SanPham` có các cột thuộc tính đúng như database (ví dụ "Màu sắc", "Kích cỡ" thay vì "Phân loại 1", "Phân loại 2").
    * Các cột thuộc tính này có hiển thị dropdown chính xác chứa các giá trị từ database hay không.
    * Xem sheet `_Data_TuDien` có hiển thị rõ ràng, đẹp đẽ, màu sắc Navy/Teal sang trọng, cột rộng rãi không bị rớt dòng hay tràn chữ không.
  * Thử thêm mới sản phẩm và các phiên bản biến thể trong file Excel, nhập link ảnh cho biến thể.
  * Thực hiện Import file vừa sửa và kiểm tra trên giao diện xem sản phẩm và ảnh của từng phiên bản đã hiển thị đúng chưa.

# VIII. Todo
- [x] Thêm query `listActiveWithValues` vào `convex/productOptions.ts`.
- [x] Cập nhật schema và logic lưu variant image, map option động trong `convex/productsImport.ts`.
- [x] Thay đổi signature và logic `buildExcelColumns` trong `lib/excel/product-schema-builder.ts`.
- [x] Nâng cấp logic tạo và parse Excel trong `app/admin/products/actions/excel-actions.ts` (phối màu, giãn cột, dropdown động, từ điển đẹp mắt, đọc ảnh biến thể).
- [x] Tích hợp logic mới vào `app/admin/products/components/import-modal.tsx`.
- [x] Chạy check kiểu dữ liệu TypeScript.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* File Excel template tải xuống hiển thị đúng tên thuộc tính thực tế (Màu sắc, Kích cỡ...) thay vì tên cột mặc định.
* Sheet từ điển dữ liệu hiển thị rõ ràng, độ rộng cột tự động giãn vừa khít nội dung dài nhất của nó, không bị tràn hay xuống dòng xấu.
* Người dùng có thể chọn giá trị từ dropdown trên Excel cho các cột biến thể, dropdown hoạt động bình thường không lỗi.
* Khi import file Excel chứa link ảnh ở dòng biến thể, hình ảnh của các phiên bản biến thể được cập nhật chính xác vào database.
* Toàn bộ mã nguồn NextJS compile thành công không lỗi type.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Nếu người dùng upload file Excel mẫu cũ không có các cột thuộc tính mới, strict mode có thể báo lỗi cấu hình không khớp.
* **Hoàn tác**: Sử dụng Git rollback về phiên bản trước nếu gặp sự cố nghiêm trọng.

# XI. Out of Scope (Ngoài phạm vi)
* Việc đồng bộ các thuộc tính từ các nguồn thương mại điện tử bên thứ ba hoặc quản lý quyền truy cập chi tiết của file Excel.
