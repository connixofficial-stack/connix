# I. Primer

## 1. TL;DR kiểu Feynman
- Tính năng Import/Export Excel cho sản phẩm hiện tại chủ yếu hỗ trợ tạo mới (Create-only), bỏ qua các sản phẩm đã có sẵn mã SKU/Slug (không hỗ trợ Update/Upsert).
- Quá trình Import đi đường tắt (bypass) qua hàm tạo `create` chuẩn của hệ thống, sử dụng trực tiếp `insert`, dẫn đến việc sản phẩm mới thiếu một số giá trị mặc định quan trọng như cách hiển thị (`renderType`), loại sản phẩm (`productType`), và trạng thái biến thể (`hasVariants`).
- Dữ liệu xuất (Export) chỉ lấy ảnh đại diện chính, bỏ qua danh sách ảnh phụ (`images`), khiến người dùng mất dữ liệu ảnh phụ nếu tải file về rồi up ngược lên lại.
- Import xong không kích hoạt trigger đồng bộ (ví dụ: `syncProgrammaticFromSourceChange`), có thể làm các trang hiển thị liên quan chậm cập nhật.

## 2. Elaboration & Self-Explanation
- Khi tải lên file Excel, hệ thống Frontend ở `app/admin/products/page.tsx` sẽ đọc và gửi danh sách các dòng cho hàm `importFromExcelRows` ở Backend (Convex). 
- Vấn đề nằm ở chỗ hàm `importFromExcelRows` chèn thẳng dữ liệu vào database bằng lệnh `ctx.db.insert("products", ...)`. Nó quên mất việc khởi tạo các trường giá trị mặc định mà hệ thống mong đợi giống như trong hàm `create` bình thường (ví dụ: `renderType: "content"`, `hasVariants: false`). Điều này tạo ra những bản ghi (records) bị khuyết dữ liệu (undefined fields). Khi Frontend lấy dữ liệu này ra để hiển thị, nếu thiếu kiểm tra fallback, nó có thể gây lỗi giao diện.
- Ở chiều ngược lại, khi tải xuống (Export), hệ thống dùng file `excel-contract.ts` để map các cột. Nhưng cột `image` hiện tại chỉ được gán bằng ảnh đầu tiên, mảng `images` bị bỏ qua hoàn toàn.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Nếu bạn tạo 1 sản phẩm tay cầm chơi game qua giao diện web, nó tự động được gán loại là "Sản phẩm vật lý". Nhưng nếu bạn nhập 100 tay cầm chơi game từ file Excel, 100 sản phẩm đó sẽ không có thuộc tính "Sản phẩm vật lý" trong database.
- **Analogy (So sánh trực giác)**: Việc này giống như bạn đón khách vào nhà. Nếu khách đi qua cửa chính (hàm `create`), lễ tân sẽ phát cho mỗi người 1 vé vào cửa, 1 bảng tên và 1 chai nước (các trường mặc định). Nhưng khách đi từ Excel lại lách qua cửa sau (lệnh `insert`), nên họ vào nhà mà không có bất kỳ trang bị cơ bản nào, khiến ban tổ chức (UI) bị rối khi kiểm tra.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Tệp đã kiểm tra**: `app/admin/products/page.tsx`, `lib/products/excel-contract.ts`, `convex/products.ts`, `convex/schema.ts`.
- **Logic Validation**: Validation phía Client và Backend khá đồng bộ, đều kiểm tra tốt các điều kiện như giá âm, trạng thái tồn kho, và logic hiển thị giá tuỳ theo `saleMode`.
- **Lỗ hổng Logic Backend**: Hàm mutation `importFromExcelRows` thiếu bước gán `productType` (dựa trên settings), `renderType`, và `hasVariants`. Đồng thời, sau khi insert loạt sản phẩm, thiếu lời gọi `syncProgrammaticFromSourceChange`.
- **Lỗ hổng Export**: Code xuất Excel không gộp (join) mảng `images` thành chuỗi phân cách bằng dấu chấm phẩy (`;`) như định dạng mà code Import đang hỗ trợ.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause Confidence**: High (Độ tin cậy cao). Đã đối chiếu mã nguồn trực tiếp giữa hàm `create` và `importFromExcelRows` để thấy sự sai lệch về các trường được thêm vào database.
- **Nguyên nhân**: Tính năng Import Excel được viết độc lập hoặc viết trước khi bảng `products` được bổ sung các tính năng nâng cao (như Digital product, Render type). Người viết chưa đồng bộ logic của hàm `create` vào hàm import.
- **Giả thuyết đối chứng**: Có thể UI tự fallback các trường này thành mặc định khi render? Thực tế, trong nhiều trường hợp UI có tự gán default (như `product.productType ?? "physical"` trong hàm `update`), nhưng việc dữ liệu dưới DB không đồng nhất sẽ gây rủi ro lâu dài cho các module phân tích dữ liệu, tìm kiếm hoặc API bên thứ 3.

# IV. Proposal (Đề xuất)
1. **Sửa Backend (`convex/products.ts`)**:
   - Ở đầu hàm `importFromExcelRows`, đọc thêm cấu hình `productTypeMode` từ `moduleSettings`.
   - Trong vòng lặp `insert`, thêm các trường mặc định: `renderType: "content"`, `hasVariants: false`, và gán `productType` theo cấu hình.
   - Thêm câu lệnh gọi đồng bộ `await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "product" });` vào cuối quá trình import.
2. **Sửa Frontend (`app/admin/products/page.tsx`)**:
   - Cập nhật đoạn build rows để kết hợp `image` và mảng `images` thành chuỗi xuất ra Excel (VD: URL chính; URL phụ 1; URL phụ 2). Cụ thể đổi cách gán thuộc tính `image` xuất ra: `image: [product.image, ...(product.images || [])].filter(Boolean).join(';')`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: `convex/products.ts` - Đồng bộ logic thêm mới bản ghi sản phẩm của hàm import.
- **Sửa**: `app/admin/products/page.tsx` - Bổ sung danh sách ảnh phụ khi xuất file Excel.

# VI. Execution Preview (Xem trước thực thi)
- Khai báo thêm truy vấn lấy cấu hình `productTypeMode` trong `importFromExcelRows`.
- Sửa payload của lệnh `ctx.db.insert("products", {...})`.
- Thêm lời gọi trigger ở cuối hàm `importFromExcelRows`.
- Sửa file `page.tsx` dòng gán dữ liệu `image` cho mảng `rows`.
- Rà soát kiểu dữ liệu `ProductExcelRow` để đảm bảo tương thích.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy lệnh typecheck `bunx tsc --noEmit` để đảm bảo không lỗi kiểu.
- Thử nghiệm tải xuống 1 file Excel chứa sản phẩm có nhiều ảnh, xác nhận cột `image` có dấu chấm phẩy phân tách các link.
- Tải file Excel đó lên lại, xác nhận Convex Dashboard hiển thị đúng các trường `renderType`, `productType`.

# VIII. Todo
- [ ] Cập nhật mutation `importFromExcelRows` trong `convex/products.ts`.
- [ ] Cập nhật logic `buildProductExportSheet` trong `app/admin/products/page.tsx`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Xuất file Excel giữ được toàn bộ hình ảnh sản phẩm.
- Nhập file Excel tạo ra dữ liệu đồng nhất 100% về cấu trúc với thao tác tạo sản phẩm qua UI.
- Giao diện không bị sập hay gián đoạn tính năng.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Rất thấp, do chỉ bổ sung trường mặc định và sửa chuỗi xuất dữ liệu.
- **Hoàn tác**: Revert các thay đổi trong 2 tệp `convex/products.ts` và `app/admin/products/page.tsx`.

# XI. Out of Scope (Ngoài phạm vi)
- Không bổ sung tính năng Cập nhật (Upsert) khi import Excel trong ticket này. Tính năng đó cần logic kiểm tra va chạm nâng cao hơn.

# XII. Open Questions (Câu hỏi mở)
- None.
