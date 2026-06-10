# Spec: Tích Hợp Tìm Kiếm Nhanh & Cuộn Dọc Danh Mục Trên Sidebar Storefront

## I. Primer

### 1. TL;DR kiểu Feynman
* **Vấn đề**: Khi cửa hàng có quá nhiều danh mục sản phẩm (ví dụ > 10 danh mục), Sidebar danh sách danh mục ở trang sản phẩm bị kéo dài vô hạn xuống phía dưới. Điều này làm hỏng giao diện (UI) và bắt người dùng phải cuộn chuột rất nhiều.
* **Giải pháp**: 
  * Nếu số lượng danh mục ít (<= 8), giữ nguyên UI cũ để tối giản.
  * Nếu có nhiều danh mục (> 8), chúng ta thêm một ô tìm kiếm nhanh (autocomplete/search) và giới hạn chiều cao hiển thị của danh mục ở mức 240px (cuộn dọc).
  * Việc tìm kiếm hỗ trợ lọc không dấu (gõ "vang do" vẫn tìm ra danh mục "Vang đỏ").

### 2. Elaboration & Self-Explanation
Hiện tại ở Sidebar của layout catalog, danh sách danh mục sản phẩm được render đầy đủ tất cả các danh mục con đang hoạt động qua vòng lặp map. Nếu hệ thống có nhiều danh mục (như ảnh người dùng gửi), Sidebar sẽ bị phình to theo chiều dọc.
Chúng ta sẽ giải quyết bài toán này bằng cách:
* Thêm một state nội bộ `categorySearchQuery` trong component `CatalogLayout` để theo dõi nội dung người dùng nhập vào ô tìm kiếm nhanh danh mục.
* Sử dụng `useMemo` để tính toán danh sách danh mục đã được lọc theo query tìm kiếm. Để tăng cường trải nghiệm người dùng, hàm tìm kiếm sẽ chuẩn hóa tiếng Việt thành không dấu để so khớp (không phân biệt chữ hoa, chữ thường và dấu tiếng Việt).
* Đặt nút "Tất cả sản phẩm" cố định ở phía trên, không bị cuộn đi, giúp người dùng luôn luôn có thể click để quay lại xem toàn bộ catalog.
* Giới hạn chiều cao danh sách danh mục còn lại bằng thuộc tính `max-h-60` (hoặc `maxHeight: 240px`) và bật `overflow-y-auto` để cho phép cuộn mượt mà trên cả máy tính lẫn thiết bị cảm ứng.

### 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Bạn vào một trang web bán rượu vang có 20 danh mục (Vang đỏ, Vang trắng, Champagne, Whisky, Single Malt, Sake, Soju...). Thay vì cuộn mỏi tay để tìm đến danh mục "Sake", bạn chỉ cần gõ "sake" vào ô tìm kiếm nhỏ trên Sidebar, danh sách lập tức co lại chỉ hiển thị danh mục "Sake" để bạn click chọn.
* **Ví dụ đời thường**: Nó giống như danh bạ điện thoại trên smartphone của bạn. Thay vì cuộn qua hàng trăm tên từ A đến Z, bạn dùng thanh tìm kiếm nhanh ở đầu danh bạ để tìm ngay tên người cần liên lạc trong 1 giây.

---

## II. Audit Summary (Tóm tắt kiểm tra)

* **Vị trí code hiện tại**: Giao diện danh mục ở Sidebar được render trong component con `CatalogLayout` nằm trong file [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx) tại dòng 2515 đến 2542.
* **Các layout khác**:
  * `ListLayout` và layout mặc định (Grid) sử dụng select dropdown ở top bar để chọn danh mục, không có Sidebar thẳng đứng nên không bị ảnh hưởng bởi danh sách danh mục dài.
  * `MobileProductsFilters` sử dụng cơ chế `flex-wrap` nằm ngang để gom danh mục lại trên thiết bị di động.
  * Do đó, thay đổi này chỉ tập trung tối ưu hóa tại Sidebar của `CatalogLayout`.

---

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc**: Code giao diện Sidebar danh mục hiện tại không giới hạn chiều cao hiển thị và thiếu công cụ lọc nhanh danh mục trên giao diện.
* **Giả thuyết đối chứng**: Việc thêm ô tìm kiếm nhanh và thanh cuộn dọc không làm ảnh hưởng đến SEO URL hay hành vi lọc sản phẩm thực tế của Convex, vì khi người dùng click vào danh mục đã lọc, callback `onCategoryChange` vẫn được kích hoạt bình thường giống như trước đây.

---

## IV. Proposal (Đề xuất)

### 1. Logic tìm kiếm tiếng Việt không dấu
Sử dụng hàm chuẩn hóa ký tự Unicode để chuyển chuỗi tìm kiếm và tên danh mục thành dạng không dấu trước khi so khớp:
```typescript
const removeDiacritics = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};
```

### 2. State quản lý
Thêm React State trong component `CatalogLayout` để lưu trữ chuỗi tìm kiếm nhanh:
```typescript
const [categorySearchQuery, setCategorySearchQuery] = useState('');
```

### 3. Cấu trúc UI mới cho Sidebar Danh mục
* Thêm ô tìm kiếm có nút X xóa nhanh và icon kính lúp.
* Chia làm 2 phần:
  * Nút "Tất cả sản phẩm" (cố định ở trên).
  * Khối danh sách các danh mục khác (cuộn dọc có chiều cao tối đa `maxHeight: '240px'`).

---

## V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa**: [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx)
  * Khai báo thêm state `categorySearchQuery` và logic lọc `filteredCategories` trong component `CatalogLayout`.
  * Thay thế khối giao diện Sidebar danh mục cũ bằng giao diện mới có ô tìm kiếm và khung cuộn dọc.

---

## VI. Execution Preview (Xem trước thực thi)

1. Mở file [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx).
2. Tìm đến vị trí khai báo component `CatalogLayout`.
3. Thêm state và logic `filteredCategories`.
4. Cập nhật khối JSX hiển thị danh mục.
5. Thực hiện kiểm tra biên dịch TypeScript (`bunx tsc --noEmit`).

---

## VII. Verification Plan (Kế hoạch kiểm chứng)

### 1. Automated Tests
* Chạy `bunx tsc --noEmit` để đảm bảo code Next.js sạch lỗi biên dịch TypeScript.

### 2. Manual Verification
* Mở trình duyệt truy cập `http://localhost:3000/products` ở giao diện Catalog Sidebar layout.
* Xác nhận danh sách danh mục hiển thị gọn gàng trong khung cuộn dọc nếu tổng số danh mục > 8.
* Thử nhập ký tự có dấu/không dấu vào ô tìm kiếm nhanh (ví dụ: "vang", "do", "trang") và kiểm tra danh mục được lọc chính xác.
* Thử click vào một danh mục đã lọc và kiểm tra xem danh sách sản phẩm ở khung bên phải có thay đổi theo danh mục tương ứng hay không.
* Click vào nút "Tất cả sản phẩm" để kiểm tra xem có tải lại toàn bộ sản phẩm không.

---

## VIII. Todo

* [ ] Cập nhật React State và logic `useMemo` lọc danh mục trong component `CatalogLayout` ở [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx).
* [ ] Cập nhật khối JSX render danh mục ở Sidebar trong component `CatalogLayout`.
* [ ] Chạy `bunx tsc --noEmit` để xác thực TypeScript.
* [ ] Kích hoạt âm báo hoàn thành Task.

---

## IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Khi danh sách danh mục của hệ thống > 8 danh mục, ô tìm kiếm nhanh danh mục tự động hiển thị trên Sidebar danh mục.
* Chiều cao của danh sách danh mục được giới hạn ở mức 240px và có thanh cuộn dọc (scrollable).
* Nhập từ khoá vào ô tìm kiếm nhanh sẽ hiển thị chính xác các danh mục chứa từ khoá (hỗ trợ không dấu tiếng Việt).
* Nút "Tất cả sản phẩm" luôn cố định ở trên cùng, không bị cuộn và không bị lọc đi khi gõ tìm kiếm.
* Khi click vào danh mục trong danh sách đã lọc, trang sản phẩm cập nhật bộ lọc thành công và URL cập nhật chính xác.
* Không có lỗi Type compile TypeScript nào xảy ra.

---

## X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Rất thấp vì đây hoàn toàn là cải tiến giao diện hiển thị phía Client, không làm thay đổi cấu trúc DB hay các hàm API backend của Convex.
* **Hoàn tác**: Sử dụng lệnh `git checkout` để khôi phục file `ProductsPage.tsx` về commit gần nhất.
