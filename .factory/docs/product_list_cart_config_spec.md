# I. Primer

## 1. TL;DR kiểu Feynman
Khi một trang web bán giày (như ThanShoes) bật tính năng "Mua hàng qua Giỏ hàng & Thanh toán", chúng ta muốn ở trang chủ, phần Danh sách sản phẩm (Product List) có thể hiển thị thêm các nút bấm nhanh: "Thêm giỏ" và "Mua ngay" để khách hàng mua sắm nhanh hơn. 
Trước đây, các nút này mới chỉ được hỗ trợ hoàn hảo ở cấu hình "Sản phẩm theo danh mục" (Category Products), còn ở cấu hình "Danh sách sản phẩm" (Product List) thì giao diện tạo mới bị thiếu cài đặt, phần hiển thị xem trước (Preview) và phần hiển thị thực tế ngoài trang chủ (Storefront) chưa đồng bộ và ẩn/hiện đúng cách theo cấu hình.
Mục tiêu là: Đồng bộ 100% cấu hình giỏ hàng của Product List giống hệt Category Products, đảm bảo hiển thị đúng, đồng nhất, đẹp mắt trên cả trang Tạo mới (Create), Chỉnh sửa (Edit), Xem trước (Preview) và Trang chủ thực tế (Storefront).

## 2. Elaboration & Self-Explanation
Để giải quyết bài toán này một cách triệt để và đồng bộ, chúng ta cần can thiệp vào 3 khu vực:
a) **Trang Tạo mới (Create Admin Panel)**: Bổ sung các state quản lý cấu hình nút (`showAddToCartButton`, `showBuyNowButton`, `cartButtonsLayout`), lắng nghe xem chế độ bán hàng (`saleMode`) của website có phải là giỏ hàng (`cart`) hay không. Nếu đúng, hiển thị khu vực cấu hình các nút này giống hệt bên trang Chỉnh sửa (Edit).
b) **Giao diện Xem trước (Preview Component)**: Nhận biết chế độ bán hàng hiện tại (`saleMode`) từ cơ sở dữ liệu Convex. Dù Admin cấu hình thế nào, các nút giỏ hàng trong Preview chỉ được phép hiển thị khi hệ thống đang ở chế độ Giỏ hàng (`saleMode === 'cart'`).
c) **Giao diện Trang chủ thực tế (Storefront Section)**: Đảm bảo tương tự Preview, các nút chỉ render khi `saleMode === 'cart'` và tôn trọng cấu hình bật/tắt cụ thể của Admin.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng giao diện quản trị Admin giống như bảng điều khiển của một rạp chiếu phim:
- Nếu rạp phim đang bật chế độ bán bắp rang bơ (tương ứng `saleMode === 'cart'`), bảng điều khiển phải hiện các nút bật/tắt máy làm bắp và chọn cỡ ly bắp (cấu hình nút Thêm giỏ/Mua ngay). Nếu rạp phim cấm bán bắp (ví dụ chế độ `contact` hoặc `affiliate`), bảng điều khiển không cần hiện các nút cấu hình này để tránh làm người quản lý bối rối.
- Màn hình chiếu phim thực tế cho khán giả (Storefront) và màn hình kiểm tra của nhân viên kỹ thuật (Preview) cũng phải thống nhất: Chỉ khi chế độ bán bắp hoạt động thì quầy bắp mới sáng đèn và bán bắp cho khách hàng.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng ta đã tiến hành kiểm tra mã nguồn hiện tại của Home Component `ProductList` và phát hiện các chi tiết kỹ thuật sau:
- **Trang Chỉnh sửa (`app/admin/home-components/product-list/[id]/edit/page.tsx`)**: Đã có sẵn logic lưu trữ và giao diện cấu hình giỏ hàng khi `saleMode === 'cart'`. Đồng thời truyền đầy đủ các props `showAddToCartButton`, `showBuyNowButton`, `cartButtonsLayout` vào `ProductListPreview`.
- **Trang Tạo mới (`app/admin/home-components/create/product-list/_shared.tsx`)**: Đang thiếu hoàn toàn các state giỏ hàng này, dẫn đến việc khi gửi dữ liệu lên Convex DB sẽ không lưu cấu hình, và Preview khi tạo mới cũng không cập nhật được.
- **Preview (`app/admin/home-components/product-list/_components/ProductListPreview.tsx`)**: Mặc dù nhận các props giỏ hàng, Preview chưa thực hiện truy vấn `saleMode` từ DB mà mặc định hiển thị bừa bãi hoặc không kiểm soát tốt theo cấu hình hệ thống.
- **Storefront (`components/site/ProductListSection.tsx`)**: Chưa đồng bộ điều kiện kiểm tra `saleMode === 'cart'` vào việc ẩn/hiện nút `showAddToCartButton` và `showBuyNowButton`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Root Cause (Nguyên nhân gốc)**: Tính năng cấu hình giỏ hàng của Home Component được phát triển cuốn chiếu. `CategoryProducts` đã được nâng cấp trọn vẹn, trong khi `ProductList` mới chỉ được nâng cấp một nửa ở trang Edit, bỏ quên trang Create, Preview và chưa đồng bộ chặt chẽ với điều kiện `saleMode === 'cart'` trên Storefront.
- **Giả thuyết đối chứng**: Nếu ta chỉ sửa ở trang Admin mà không đồng bộ logic check `saleMode === 'cart'` ở Preview và Storefront, giao diện người dùng ngoài trang chủ vẫn sẽ tự động render các nút giỏ hàng ngay cả khi website đang cấu hình chế độ liên hệ (`contact`) hoặc tiếp thị liên kết (`affiliate`), gây lỗi UX nghiêm trọng và vi phạm quy tắc nghiệp vụ. Do đó, bắt buộc phải đồng bộ logic check từ DB lên tất cả các bề mặt hiển thị.

---

# IV. Proposal (Đề xuất)

1. **Nâng cấp trang Create (`app/admin/home-components/create/product-list/_shared.tsx`)**:
   - Khai báo 3 state: `showAddToCartButton` (mặc định `true`), `showBuyNowButton` (mặc định `true`), `cartButtonsLayout` (mặc định `stack`).
   - Query `saleModeSetting` từ Convex DB.
   - Thêm phần cấu hình giỏ hàng vào `HomeComponentDisplaySettingsSection` khi `saleMode === 'cart'`.
   - Gắn 3 trường này vào payload gửi lên hàm `handleSubmit` và truyền vào `ProductListPreview`.
2. **Nâng cấp Preview (`app/admin/home-components/product-list/_components/ProductListPreview.tsx`)**:
   - Query `saleModeSetting` từ Convex DB tương tự storefront.
   - Tính toán biến `effectiveShowAddToCartButton` và `effectiveShowBuyNowButton` dựa trên `saleMode === 'cart'` kết hợp với cấu hình của Admin.
   - Áp dụng các biến `effective` này vào tất cả các style render.
3. **Nâng cấp Storefront (`components/site/ProductListSection.tsx`)**:
   - Cập nhật biến `showAddToCartButton` và `showBuyNowButton` để chỉ có hiệu lực khi `saleMode === 'cart'`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### 1. `app/admin/home-components/create/product-list/_shared.tsx`
- *Vai trò hiện tại*: Quản lý form tạo mới cho Product List, Service List và Blog.
- *Thay đổi*: 
  - Thêm state và query `saleMode`.
  - Hiển thị cấu hình giỏ hàng trong mục Display Settings tương tự trang edit.
  - Gửi cấu hình giỏ hàng khi submit form và đồng bộ sang Preview.

### 2. `app/admin/home-components/product-list/_components/ProductListPreview.tsx`
- *Vai trò hiện tại*: Render giao diện xem trước sản phẩm trong Admin Panel.
- *Thay đổi*:
  - Query `saleMode` từ DB.
  - Lọc điều kiện hiển thị nút giỏ hàng chặt chẽ theo `saleMode === 'cart'`.

### 3. `components/site/ProductListSection.tsx`
- *Vai trò hiện tại*: Render danh sách sản phẩm ngoài trang chủ thực tế.
- *Thay đổi*:
  - Ràng buộc hiển thị nút giỏ hàng chỉ khi chế độ bán hàng là giỏ hàng (`saleMode === 'cart'`).

---

# VI. Execution Preview (Xem trước thực thi)

1. Đọc và cập nhật `app/admin/home-components/create/product-list/_shared.tsx` bổ sung state, form config và payload submit.
2. Đọc và cập nhật `app/admin/home-components/product-list/_components/ProductListPreview.tsx` tích hợp query `saleMode` và effective flags.
3. Đọc và cập nhật `components/site/ProductListSection.tsx` ràng buộc điều kiện storefront.
4. Chạy kiểm tra tĩnh toàn bộ code và chạy git commit để Harness Engine tự động typecheck.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy `bunx tsc --noEmit` để đảm bảo không có bất kỳ lỗi biên dịch Typescript nào xảy ra sau khi thay đổi code.

### Manual Verification
- Hỗ trợ kiểm thử thông qua review code tĩnh tỉ mỉ và xác nhận tính nhất quán của giao diện Admin/Storefront.

---

# VIII. Todo

- [ ] Cập nhật file `_shared.tsx` (Create Page).
- [ ] Cập nhật file `ProductListPreview.tsx` (Preview Panel).
- [ ] Cập nhật file `ProductListSection.tsx` (Storefront Render).
- [ ] Chạy commit và kích hoạt âm báo hoàn thành.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- [ ] Trang tạo mới `create/product-list` hiển thị đúng mục cấu hình giỏ hàng khi và chỉ khi chế độ bán hàng là `cart`.
- [ ] Gửi dữ liệu tạo mới lưu trữ đầy đủ `showAddToCartButton`, `showBuyNowButton`, `cartButtonsLayout`.
- [ ] Giao diện preview trong admin ẩn các nút giỏ hàng nếu `saleMode !== 'cart'`.
- [ ] Giao diện storefront thực tế ẩn các nút giỏ hàng nếu `saleMode !== 'cart'`.
- [ ] Code không sinh ra bất kỳ lỗi Typescript hay logic nào.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Thay đổi code ảnh hưởng đến component `ProductListPreview` dùng chung cho cả trang Create và Edit.
- **Hoàn tác**: Sử dụng lệnh `git checkout` để rollback các file đã chỉnh sửa về trạng thái ban đầu nếu xảy ra lỗi nghiêm trọng.

---

# XI. Out of Scope (Ngoài phạm vi)

- Không chỉnh sửa cấu trúc DB, Convex schema hay các mutation xử lý dữ liệu lõi.
- Không tối ưu hiệu năng hay sửa đổi layout cốt lõi của các component khác ngoài `ProductList`.
