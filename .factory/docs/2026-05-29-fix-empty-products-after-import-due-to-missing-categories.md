# Spec: Sửa lỗi Import sản phẩm thành công nhưng trống danh sách do thiếu danh mục mặc định

## I. Primer

### 1. TL;DR kiểu Feynman
* Khi import sản phẩm từ Excel, hệ thống cần biết mỗi sản phẩm thuộc danh mục nào (như Giày Đá Bóng, Phụ Kiện...).
* Nếu database hiện tại chưa có danh mục tương ứng với thông tin trong Excel, hệ thống sẽ tự động **tạo mới danh mục** đó ngay lập tức (ví dụ: tạo danh mục "Giày bóng đá", "Giày chạy bộ"...) để xếp sản phẩm vào đúng kệ.
* Nếu sản phẩm không khai báo danh mục, hệ thống sẽ xếp vào danh mục mặc định "Chưa phân loại".
* Giao diện UI cũng được cập nhật để hiển thị chính xác số sản phẩm thực tế đã tạo/cập nhật thành công.

### 2. Elaboration & Self-Explanation
Khi người dùng tải lên file Excel sản phẩm (Sapo), hệ thống Next.js sẽ chuyển đổi dữ liệu và gửi xuống Convex Mutation `upsertBulk`. Mỗi sản phẩm bắt buộc phải có liên kết tới một danh mục (`categoryId` tham chiếu tới bảng `productCategories`).
Nếu database trống rỗng hoặc chưa có danh mục tương ứng với tên danh mục đọc được trong Excel:
1. Adapter sẽ đọc cột `Loại sản phẩm` làm `categoryName`.
2. Trình Server Action sẽ chuyển `categoryName` cùng với dữ liệu sản phẩm xuống Convex mutation `upsertBulk`.
3. Trong `upsertBulk`, hệ thống sẽ tự tạo danh mục mới nếu chưa tồn tại danh mục nào trùng tên. Tên danh mục mới được tạo bằng cách chuẩn hóa slug từ tiếng Việt không dấu (ví dụ: "Giày bóng đá" -> "giay-bong-da").
4. Nếu sản phẩm hoàn toàn không khai báo danh mục hoặc rỗng, hệ thống sẽ fallback về danh mục mặc định đầu tiên hoặc tự tạo danh mục "Chưa phân loại".
5. Sửa UI để Toast hiển thị số liệu thực tế được lưu trả về từ Convex (createdCount, updatedCount) thay vì đếm chay số dòng từ client.

### 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:** Khi import giày SKU "THANS-01" thuộc loại sản phẩm "Giày chạy bộ Sapo". Nếu database chưa có danh mục nào tên "Giày chạy bộ Sapo", hệ thống sẽ tự động tạo danh mục "Giày chạy bộ Sapo" (slug: "giay-chay-bo-sapo") trong bảng `productCategories` trước, sau đó lưu sản phẩm "THANS-01" với `categoryId` của danh mục mới này.
* **Hình ảnh tương đồng:** Giống như bạn mang 566 cuốn sách đến thư viện. Trên bìa mỗi cuốn sách đều có nhãn phân loại như "Văn học", "Khoa học". Khi thấy thư viện chưa có những kệ sách này, thay vì vứt sách đi hoặc bỏ hết vào một thùng "Chưa phân loại", thủ thư sẽ nhanh chóng đóng thêm các kệ sách mới ghi chữ "Kệ Văn học", "Kệ Khoa học" và xếp sách vào đúng vị trí.

---

## II. Audit Summary (Tóm tắt kiểm tra)
* **Trạng thái database hiện tại:** Bảng `productCategories` trống rỗng `[]`, bảng `products` trống rỗng `[]`.
* **Trạng thái logic import:** 
  * `lib/excel/adapters/sapo-thanshoes.adapter.ts` trả về `categoryId: undefined` do `categories` truyền vào từ client là rỗng `[]`.
  * `convex/productsImport.ts` bỏ qua các sản phẩm mới có `categoryId: undefined` dẫn đến không tạo mới bản ghi nào.
  * UI hiển thị thông báo dựa trên biến client `result.data.length` thay vì kết quả trả về của `upsertBulk`.

---

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause (Nguyên nhân gốc):** Do database chưa có danh mục sản phẩm nào, dẫn đến bộ chuyển đổi (Adapter) không gán được `categoryId` cho sản phẩm mới. Convex mutation `upsertBulk` lọc bỏ và bỏ qua các sản phẩm không có `categoryId` hợp lệ. UI thì báo cáo sai số lượng thực tế được lưu do đếm số dòng từ client.
* **Độ tin cậy nguyên nhân gốc:** **High (Cao)** - Đã xác minh qua việc chạy truy vấn database thực tế bằng Convex CLI và đối chiếu mã nguồn của client và server mutation.

---

## IV. Proposal (Đề xuất)
1. **Truyền tên danh mục từ Excel:**
   * Cập nhật `ParsedProductRecord` và adapter để bổ sung trường `categoryName`.
2. **Tự động map hoặc tạo mới danh mục ở Server:**
   * Trong `convex/productsImport.ts`, schema `bulkProductDoc` sẽ nhận `categoryName`.
   * Mutation `upsertBulk` kiểm tra:
     * Nếu không có `categoryId` nhưng có `categoryName` -> Thử map với danh mục trùng tên trong database.
     * Nếu chưa có danh mục trùng tên -> Tự động chèn danh mục mới vào bảng `productCategories` (slug được sinh tự động không dấu) rồi gán ID của danh mục này cho sản phẩm.
     * Nếu sản phẩm rỗng cả danh mục, fallback về danh mục mặc định (hoặc tự tạo danh mục "Chưa phân loại").
3. **Khắc phục lỗi Giá so sánh không hợp lệ:**
   * Sửa adapter `sapo-thanshoes.adapter.ts` gán `salePrice: undefined` cho các biến thể (do file Excel Sapo chỉ có giá bán lẻ, không có giá so sánh/giá khuyến mãi).
   * Trong mutation `upsertBulk` của Convex, khi cập nhật sản phẩm cha và biến thể, gỡ bỏ toán tử `??` đối với trường `salePrice` (đổi thành `salePrice: p.salePrice` và `salePrice: rv.vData.salePrice`) để hỗ trợ patch `undefined` nhằm dọn dẹp các giá trị so sánh lỗi đã import ở phiên bản trước đó.
4. **Sửa hiển thị thông báo UI:**
   * Trong `app/admin/products/components/import-modal.tsx`, đọc kết quả trả về của `upsertBulk` chứa `{ createdCount, updatedCount }` để hiển thị toast chính xác: `"Đã thêm mới ${res.createdCount} và cập nhật ${res.updatedCount} sản phẩm."`

---

## V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa: [sapo-thanshoes.adapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/excel/adapters/sapo-thanshoes.adapter.ts)
* *Vai trò:* Adapter chuyển đổi Excel Sapo sang record chuẩn.
* *Thay đổi:* Đọc cột loại sản phẩm gán vào `categoryName` của sản phẩm cha. Không gán `salePrice` bằng `price` cho biến thể nữa (gán `undefined`).

### Sửa: [excel-actions.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/actions/excel-actions.ts)
* *Vai trò:* Định nghĩa interface dữ liệu trao đổi `ParsedProductRecord`.
* *Thay đổi:* Bổ sung trường `categoryName` vào kiểu dữ liệu.

### Sửa: [productsImport.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/productsImport.ts)
* *Vai trò:* Mutation xử lý ghi đè và thêm mới sản phẩm hàng loạt vào database Convex.
* *Thay đổi:* Thêm logic tự tạo danh mục tự động dựa vào tên danh mục. Cập nhật logic patch `salePrice` cho phép ghi đè giá trị `undefined` để dọn dẹp giá trị lỗi cũ.

### Sửa: [import-modal.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/components/import-modal.tsx)
* *Vai trò:* Giao diện Modal Import sản phẩm của Admin.
* *Thay đổi:* Đọc kết quả từ mutation `upsertBulk` để hiển thị Toast thông báo chính xác số lượng sản phẩm được tạo mới và cập nhật.

---

## VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa `convex/productsImport.ts` để bổ sung logic fallback danh mục mặc định.
2. Đọc và chỉnh sửa `app/admin/products/components/import-modal.tsx` để cập nhật hiển thị toast.
3. Review tĩnh mã nguồn để tránh lỗi TypeScript.

---

## VII. Verification Plan (Kế hoạch kiểm chứng)
1. **Kiểm tra kiểu dữ liệu:** Đảm bảo không có lỗi biên dịch TypeScript.
2. **Kiểm tra thực tế:** Người dùng tiến hành import lại file Excel Sapo trên giao diện `http://localhost:3000/admin/products`.
3. **Tiêu chí pass:** Giao diện hiển thị Toast báo đúng số lượng được tạo mới và danh sách 566 sản phẩm hiển thị đầy đủ trên bảng Admin.

---

## VIII. Todo
- [ ] Cập nhật mutation `upsertBulk` trong `convex/productsImport.ts`
- [ ] Cập nhật modal import trong `app/admin/products/components/import-modal.tsx`

---

## IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Import file Excel Sapo thành công mà không cần tạo danh mục trước.
* Trang quản trị `/admin/products` hiển thị danh sách sản phẩm đã import (chứ không báo "Chưa có sản phẩm nào.").
* Toast thông báo chính xác số lượng tạo mới và cập nhật.

---

## X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Không có rủi ro lớn vì chỉ thay đổi logic fallback khi thiếu dữ liệu và hiển thị toast.
* **Hoàn tác:** Sử dụng Git rollback về commit trước đó nếu có vấn đề.

---

## XI. Out of Scope (Ngoài phạm vi)
* Việc đồng bộ hay import danh mục phân cấp phức tạp nằm ngoài phạm vi này.
