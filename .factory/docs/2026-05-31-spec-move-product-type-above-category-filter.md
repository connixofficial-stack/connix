# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Hiện tại, trên giao diện máy tính để bàn (Desktop sidebar), bộ lọc "Danh mục sản phẩm" đang hiển thị phía trên bộ lọc "Nhóm sản phẩm". Tuy nhiên trên giao diện di động (Mobile drawer), bộ lọc "Nhóm sản phẩm" đã được đặt ở phía trên "Danh mục sản phẩm". Điều này gây ra sự không nhất quán giữa hai giao diện và không đúng với mong muốn ưu tiên nhóm sản phẩm trước của người dùng.
* **Giải pháp**: Di chuyển Component (Thành phần) bộ lọc "Nhóm sản phẩm" lên phía trên "Danh mục sản phẩm" trong Sidebar (Thanh bên) giao diện máy tính để bàn ở cả hai bố cục: `CatalogLayout` và `ListLayout` của file [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/LayoutComponents.tsx).
* **Kết quả**: Thứ tự hiển thị các khối bộ lọc trên Desktop sẽ đồng bộ với Mobile: Tìm kiếm -> Nhóm sản phẩm -> Danh mục sản phẩm -> Khoảng giá -> Các thuộc tính khác.

## 2. Elaboration & Self-Explanation
Trong cấu trúc hiển thị trang danh sách sản phẩm, bộ lọc ở thanh bên đóng vai trò định hướng người dùng. Hệ thống hỗ trợ Phân loại & Thuộc tính bao gồm:
* **Product Type (Nhóm sản phẩm)**: Cấp độ phân loại cao nhất (ví dụ: Rượu vang & Sâm panh, Rượu mạnh, Phụ kiện...).
* **Product Category (Danh mục sản phẩm)**: Cấp độ phân loại nhỏ hơn trực thuộc hoặc song song (ví dụ: Vang đỏ, Vang trắng...).

Hiện tại, trong file [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/LayoutComponents.tsx) có hai Layout (Bố cục) hiển thị danh sách sản phẩm chính trên Desktop là `CatalogLayout` và `ListLayout`. Cả hai layout này đều đang render "Danh mục sản phẩm" trước, sau đó mới tới "Nhóm sản phẩm".
Chúng ta chỉ cần đảo vị trí render của khối code JSX chứa bộ lọc "Nhóm sản phẩm" (`productTypes`) lên trên khối code JSX chứa bộ lọc "Danh mục sản phẩm" (`categories`) tại cả hai layout này để đáp ứng yêu cầu người dùng.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**:
  * Trước khi sửa: Khi người dùng truy cập trang `/products` trên máy tính, họ sẽ thấy thanh bên trái xếp theo thứ tự: ô nhập Tìm kiếm -> Danh mục sản phẩm (Vang đỏ, Vang trắng) -> Nhóm sản phẩm (Rượu vang & sâm panh, Rượu mạnh).
  * Sau khi sửa: Thứ tự sẽ đổi thành: ô nhập Tìm kiếm -> Nhóm sản phẩm (Rượu vang & sâm panh, Rượu mạnh) -> Danh mục sản phẩm (Vang đỏ, Vang trắng).
* **Analogy (Phép ẩn dụ) đời thường**: Giống như việc sắp xếp một tủ sách lớn. Nhóm sản phẩm đại diện cho các kệ lớn (Kệ sách Văn học, Kệ sách Khoa học), còn Danh mục sản phẩm đại diện cho các ngăn nhỏ bên trong kệ đó (Ngăn sách Tiểu thuyết, Ngăn sách Thơ). Sắp xếp hợp lý phải là chọn kệ lớn trước (Nhóm sản phẩm) rồi mới tới ngăn nhỏ (Danh mục sản phẩm).

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra file [FilterComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/FilterComponents.tsx): Component `MobileProductsFilters` đã render Nhóm sản phẩm ở trên Danh mục sản phẩm.
* Đã kiểm tra file [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/LayoutComponents.tsx):
  * Trong `CatalogLayout` Desktop sidebar (dòng 596-697): "Danh mục sản phẩm" đang nằm trên "Nhóm sản phẩm".
  * Trong `ListLayout` Desktop sidebar (dòng 1369-1470): "Danh mục sản phẩm" đang nằm trên "Nhóm sản phẩm".
  * Trong phần Mobile Drawer của `ListLayout` và `CatalogLayout`: Nhóm sản phẩm đã nằm trên Danh mục sản phẩm.
* Đã kiểm tra file [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx): Đối với layout ngang trên Desktop (nếu có), Nhóm sản phẩm cũng đã nằm trước Danh mục sản phẩm.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause (Nguyên nhân gốc)**: Độ tin cậy: **High (Cao)**. Khối code hiển thị bộ lọc "Nhóm sản phẩm" (`enableProductTypes && productTypes && productTypes.length > 0`) được đặt phía dưới khối code hiển thị bộ lọc "Danh mục sản phẩm" (`showCategories && (...)`) trong phần Desktop sidebar sidebar của cả `CatalogLayout` và `ListLayout` thuộc file [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/LayoutComponents.tsx).
* **Counter-Hypothesis (Giả thuyết đối chứng)**: Việc đổi chỗ này có thể làm thay đổi logic hoạt động của các hàm callback xử lý lọc hay không? Không, vì các khối code hoàn toàn độc lập về mặt hiển thị JSX và nhận các hàm callback tương ứng như `onCategoryChange` và `onProductTypeChange` mà không phụ thuộc lẫn nhau về thứ tự gọi trong DOM (Document Object Model).

# IV. Proposal (Đề xuất)
Đổi chỗ vị trí khối render của "Nhóm sản phẩm" lên trên "Danh mục sản phẩm" tại 2 component:
1. `CatalogLayout` (trong phần Desktop sidebar)
2. `ListLayout` (trong phần Desktop sidebar)

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/LayoutComponents.tsx)
  * Vai trò hiện tại: Chứa định nghĩa các layout hiển thị sản phẩm như `CatalogLayout`, `ListLayout`.
  * Thay đổi: Đảo thứ tự render JSX của khối Nhóm sản phẩm và khối Danh mục sản phẩm trên Desktop Sidebar của cả hai layout.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại chính xác đoạn code JSX cần di chuyển trong file `LayoutComponents.tsx` ở cả 2 component `CatalogLayout` và `ListLayout`.
2. Dùng công cụ thay đổi nội dung file để thực hiện di chuyển khối code JSX.
3. Chạy kiểm tra tĩnh lỗi type bằng `bunx tsc --noEmit` nếu cần thiết (giới hạn hiển thị kết quả).

# VII. Verification Plan (Kế hoạch kiểm chứng)
Vì quy tắc dự án cấm tự động chạy `npm run lint` hoặc `npm run build` cho việc nghiệm thu cuối cùng (Tester sẽ phụ trách chạy runtime/integration), chúng ta sẽ thực hiện:
* **Kiểm tra tĩnh**: Chạy `bunx tsc --noEmit` để đảm bảo code React không bị lỗi cú pháp hoặc sai kiểu dữ liệu (type safety) sau khi di chuyển JSX.
* **Xác nhận giao diện**: Nhờ người dùng tải lại trang và kiểm tra xem vị trí bộ lọc "Nhóm sản phẩm" đã được đẩy lên trên "Danh mục sản phẩm" ở sidebar bên trái giao diện Desktop chưa.

# VIII. Todo
* [ ] Di chuyển khối code bộ lọc Nhóm sản phẩm lên trên Danh mục sản phẩm trong `CatalogLayout` của `LayoutComponents.tsx`
* [ ] Di chuyển khối code bộ lọc Nhóm sản phẩm lên trên Danh mục sản phẩm trong `ListLayout` của `LayoutComponents.tsx`
* [ ] Chạy kiểm tra kiểu tĩnh (typecheck) để xác nhận không lỗi biên dịch.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Trên giao diện Desktop của cả hai layout (`CatalogLayout` và `ListLayout`), phần sidebar bên trái hiển thị bộ lọc "Nhóm sản phẩm" nằm ngay dưới bộ lọc "Tìm kiếm" (nếu có bật) và nằm phía trên bộ lọc "Danh mục sản phẩm".
* Không xảy ra lỗi biên dịch TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi cú pháp JSX do đóng mở thẻ không khớp trong quá trình di chuyển code.
* **Hoàn tác**: Hoàn tác các thay đổi trên file [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/LayoutComponents.tsx) về trạng thái commit trước đó bằng Git (`git checkout -- app/(site)/_components/products/LayoutComponents.tsx`).

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi logic lọc hoặc định tuyến URL của Nhóm sản phẩm và Danh mục sản phẩm.
* Thay đổi giao diện bộ lọc trên thiết bị di động (vì đã ở đúng vị trí mong muốn).
