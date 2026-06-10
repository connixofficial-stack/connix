# I. Primer

## 1. TL;DR kiểu Feynman
Giống như việc bạn đi siêu thị: Thay vì để tất cả thông tin sản phẩm và nút mua hàng xếp chồng thành một hàng dọc dài dằng dặc ở bên trái, làm cho nửa bên phải kệ hàng trống trơn vô ích; chúng ta sẽ xếp chúng nằm ngang trên màn hình máy tính (Desktop). Tên và mô tả sản phẩm nằm ở bên trái, còn giá tiền và nút "Thêm vào giỏ" / "Mua ngay" được xếp gọn gàng ở bên phải. Điều này giúp tận dụng không gian màn hình tốt hơn và làm cho giao diện trông cao cấp hơn, giống như cách Apple trình bày sản phẩm của họ. Đồng thời, đối với trang Tài nguyên (Resources), người dùng có thể trực tiếp tải xuống hoặc thêm vào giỏ hàng ngay từ danh sách mà không cần phải nhấp vào xem chi tiết rồi mới tải.

## 2. Elaboration & Self-Explanation
Hiện tại, trên giao diện danh sách dạng hàng (List Layout) của trang **Sản phẩm (Products)** và trang **Tài nguyên (Resources)**, đang có một vùng trống rất lớn ở phía bên phải của mỗi thẻ sản phẩm (gọi là "dead space" hay khoảng trắng thừa).
- Đối với **Sản phẩm**: Tên, mô tả, giá và các nút hành động (Thêm giỏ, Mua ngay) đang xếp chồng theo hàng dọc ở cột bên trái, khiến cho chiều ngang của thẻ sản phẩm bị mất cân đối nghiêm trọng trên màn hình lớn.
- Đối với **Tài nguyên**: Cột bên phải hiện chỉ hiển thị giá tiền và dòng chữ "Xem chi tiết →". Người dùng không thể thực hiện thêm vào giỏ hàng hay tải xuống trực tiếp từ danh sách.

Để khắc phục điều này và mang lại trải nghiệm Premium Apple:
- Chúng ta sẽ cấu trúc lại `ProductList` trong [ProductCardComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/products/ProductCardComponents.tsx) bằng cách chia phần nội dung thành 2 cột trên Desktop (`md:flex-row`). Cột trái chứa thông tin chi tiết (badge danh mục, tên, mô tả ngắn, thuộc tính sản phẩm). Cột phải chứa giá sản phẩm, trạng thái kho hàng, và cụm nút hành động `ProductCardActions`.
- Tương tự, đối với trang danh sách **Tài nguyên** trong [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/resources/ResourcesPage.tsx), chúng ta sẽ tạo một component con `ResourceListItem` cho từng hàng. Component này sẽ tự động kiểm tra quyền truy cập của khách hàng hiện tại đối với tài nguyên đó (qua `getResourceAccess`). Trên Desktop, cột bên phải của hàng sẽ không chỉ hiển thị giá mà còn hiển thị nút bấm tương ứng: "Tải xuống" (nếu là miễn phí hoặc đã mua), "Thêm vào giỏ / Mua ngay" (nếu là tài nguyên trả phí chưa mua và module ở chế độ giỏ hàng), hoặc "Liên hệ" (nếu ở chế độ liên hệ). Các nút này được ngăn chặn nổi bọt sự kiện (`e.preventDefault()`, `e.stopPropagation()`) để không làm chuyển trang khi click.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Hãy tưởng tượng trang so sánh các gói cước hoặc dịch vụ của Apple (như iCloud+ hoặc Apple Music). Tên gói cước và các tính năng đi kèm luôn được xếp ở bên trái, còn giá tiền và nút "Chọn" hoặc "Mua" luôn nằm gọn gàng ở góc phải, ngang hàng với tiêu đề.
* **Analogy**: Layout cũ giống như một tờ hóa đơn thanh toán dài ngoằn xếp dọc tất cả mọi thứ từ trên xuống dưới. Layout mới giống như một dòng sản phẩm trên bảng báo giá: Tên sản phẩm ở đầu dòng (trái) và Giá kèm nút mua ở cuối dòng (phải).

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Sản phẩm (Products)**:
  * File điều chỉnh: [ProductCardComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/products/ProductCardComponents.tsx).
  * Hàm chịu trách nhiệm: `ProductList`.
  * Cấu trúc hiện tại:
    ```tsx
    <div className="flex-1 min-w-0 flex flex-col justify-center">
      {/* Thông tin sản phẩm + Giá + Nút hành động nằm chung 1 cột dọc */}
    </div>
    ```
* **Tài nguyên (Resources)**:
  * File điều chỉnh: [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/resources/ResourcesPage.tsx).
  * Nơi render list hiện tại: Dòng 697-756 trong `ResourcesContent` (khi `config.layoutStyle === 'list'`).
  * Trạng thái hiện tại: Chỉ hiển thị Giá và "Xem chi tiết →", toàn bộ thẻ bọc bởi `<Link>`. Chưa có nút thao tác giỏ hàng hay tải trực tiếp. Chưa có logic check auth/access cho từng dòng ở trang danh sách.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Thiết kế ban đầu của `ProductList` xếp chồng tất cả các thành phần theo chiều dọc mà không chia cột ngang ở kích thước màn hình lớn (Desktop), dẫn đến việc dư thừa diện tích ngang ở phía bên phải. Đối với trang `Resources`, tính năng giỏ hàng và tải trực tiếp chưa được thiết kế trên danh sách, làm giảm tỷ lệ chuyển đổi của khách hàng.
* **Giả thuyết đối chứng**: Nếu chia card thành 2 cột ngang trên Desktop, giao diện sẽ cân đối hơn, tận dụng tối đa chiều rộng màn hình, và giúp hành động mua hàng/tải xuống của người dùng trực quan, nhanh chóng hơn.

---

# IV. Proposal (Đề xuất)

### a) Tối ưu hóa `ProductList` (Sản phẩm)
Chia thẻ thông tin của sản phẩm trong `ProductList` thành 2 cột trên Desktop (`md:flex-row md:items-center justify-between gap-6`):
- **Cột Trái (Thông tin)**:
  - Thẻ bao ngoài: `flex-1 min-w-0 flex flex-col justify-center`
  - Chứa: Category Badge, Name, Description, Attributes Badges.
- **Cột Phải (Giá & CTA)**:
  - Thẻ bao ngoài: `flex flex-col items-start md:items-end justify-center shrink-0 min-w-[220px] md:text-right gap-2`
  - Chứa: Giá sản phẩm (căn phải trên md), Thông tin tồn kho (Chỉ còn X SP/Hết hàng), và Nút hành động (AddToCart/BuyNow).

### b) Nâng cấp danh sách Tài nguyên (Resources)
1. Tạo một component con mới tên là `ResourceListItem` để render từng tài nguyên trong chế độ danh sách hàng (List Layout).
2. Trong `ResourceListItem`:
   - Sử dụng `useCustomerAuth()` để lấy `token` và `openLoginModal`.
   - Sử dụng `useCart()` để lấy `addItem` và `openDrawer`.
   - Sử dụng `useQuery(api.resources.getResourceAccess)` để check trạng thái tải/mua của người dùng.
   - Sử dụng `useMutation(api.resources.requestDownload)` để thực hiện tải tài nguyên trực tiếp khi click.
   - Trên Desktop (`md` breakpoint), chia đôi phần bên phải ảnh thumbnail thành 2 cột ngang:
     - **Cột Trái**: Tên tài nguyên, Mô tả ngắn (excerpt), Danh mục, Bộ lọc gán kèm (assigned values).
     - **Cột Phải**: Cụm Giá tiền & các nút CTA tương ứng (Tải xuống / Thêm giỏ / Liên hệ / Đăng nhập để tải) có ngăn chặn sự kiện nổi bọt để tránh chuyển trang.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

#### [MODIFY] [ProductCardComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/products/ProductCardComponents.tsx)
* Vai trò hiện tại: Chứa các component render card sản phẩm dạng lưới (Grid) và hàng (List).
* Thay đổi: Tái cấu trúc component `ProductList` để chia thông tin và giá/CTA thành 2 cột trên màn hình Desktop.

#### [MODIFY] [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/resources/ResourcesPage.tsx)
* Vai trò hiện tại: Trang hiển thị danh sách tài nguyên và bộ lọc tài nguyên.
* Thay đổi: Tạo component `ResourceListItem` chứa logic giỏ hàng/tải xuống/kiểm tra quyền truy cập và áp dụng giao diện 2 cột trên Desktop cho chế độ list, thay thế cho đoạn render inline cũ.

---

# VI. Execution Preview (Xem trước thực thi)
1. **Đọc và chỉnh sửa [ProductCardComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/products/ProductCardComponents.tsx)**:
   - Cấu trúc lại phần JSX bên trong `ProductList`.
   - Đảm bảo layout Responsive hoạt động tốt (Mobile hiển thị dọc, Desktop hiển thị ngang).
2. **Đọc và chỉnh sửa [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/resources/ResourcesPage.tsx)**:
   - Thêm các import cần thiết từ `@/lib/cart`, `@/app/(site)/auth/context`, `lucide-react`, v.v.
   - Định nghĩa component `ResourceListItem` nhận các prop tương tự như trong loop của resources list.
   - Implement logic xử lý tải xuống `handleDownload` tương tự như ở trang chi tiết.
   - Thiết kế giao diện 2 cột cho `ResourceListItem` trên Desktop.
   - Thay thế đoạn code map render inline cũ bằng component `ResourceListItem`.
3. **Kiểm tra biên dịch và chạy thử nghiệm**:
   - Sử dụng `bunx tsc --noEmit` để xác nhận không có lỗi kiểu dữ liệu.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy lệnh kiểm tra kiểu dữ liệu tĩnh:
  `bunx tsc --noEmit`

### Manual Verification
1. Truy cập `http://localhost:3000/products` trên trình duyệt:
   - Chuyển sang chế độ xem dạng List (nếu có hỗ trợ).
   - Kiểm tra giao diện xem thông tin sản phẩm và giá/nút bấm đã được chia làm 2 cột cân đối hay chưa.
   - Kiểm tra các nút bấm "Thêm giỏ", "Mua ngay" hoạt động đúng, không gây chuyển trang sang trang chi tiết sản phẩm.
2. Truy cập `http://localhost:3000/resources` trên trình duyệt:
   - Chuyển sang chế độ xem dạng List (`layoutStyle === 'list'`).
   - Kiểm tra giao diện xem tiêu đề/mô tả nằm bên trái, cụm giá và nút hành động nằm bên phải trên Desktop.
   - Thử nghiệm nhấp nút hành động (Tải xuống / Thêm giỏ) xem có hoạt động chính xác không (thêm vào giỏ thành công hoặc mở liên kết tải xuống).

---

# VIII. Todo
- [ ] Tái cấu trúc giao diện `ProductList` trong `ProductCardComponents.tsx` thành 2 cột trên Desktop (`md:flex-row`).
- [ ] Tạo component `ResourceListItem` trong `ResourcesPage.tsx` tích hợp logic giỏ hàng & tải trực tiếp.
- [ ] Thay thế render inline cũ trong `ResourcesPage.tsx` bằng component `ResourceListItem` vừa tạo.
- [ ] Chạy `bunx tsc --noEmit` để verify kiểu dữ liệu tĩnh.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout danh sách sản phẩm dạng hàng (`ProductList`) hiển thị thông tin ở bên trái, giá và nút bấm ở bên hợp lý trên Desktop. Không còn khoảng trắng thừa màu tối khổng lồ bên phải.
- Layout danh sách tài nguyên dạng hàng hiển thị thông tin ở bên trái, giá và nút hành động tương ứng ở bên phải trên Desktop.
- Người dùng có thể click trực tiếp các nút CTA ("Thêm giỏ", "Mua ngay", "Tải xuống") trên cả 2 danh sách mà không bị chuyển trang ngoài ý muốn.
- Chạy `bunx tsc --noEmit` thành công không có lỗi type.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi biên dịch TypeScript do thiếu kiểu dữ liệu hoặc import sai đường dẫn.
* **Hoàn tác**: Sử dụng `git checkout` để rollback các file đã chỉnh sửa về trạng thái commit gần nhất nếu phát sinh lỗi không thể khắc phục nhanh.

---

# XI. Out of Scope (Ngoài phạm vi)
- Không thay đổi thiết kế của layout dạng lưới (Grid Layout).
- Không sửa đổi logic lưu trữ hoặc xử lý thanh toán của hệ thống Convex.

---

# XII. Open Questions (Câu hỏi mở)
- *Không có câu hỏi mở nào cần giải quyết tại thời điểm này.*
