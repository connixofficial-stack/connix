# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Các ô sản phẩm (Product Items) trên trang danh sách sản phẩm hiện tại chưa làm nổi bật được màu sắc thương hiệu (màu chính và màu phụ) khi người dùng thiết lập chế độ Một màu (Single Brand Color) hoặc Hai màu (Dual Brand Color) ở trang cài đặt chung.
* **Nguyên nhân**: Thiếu các hiệu ứng tương tác (hover) có sử dụng mã màu thương hiệu, danh mục sản phẩm chỉ hiển thị dạng chữ xám nhạt đơn điệu, các nút hành động và huy hiệu thuộc tính chưa có các trạng thái hover động sử dụng màu thương hiệu phù hợp.
* **Giải pháp**: 
  1. Thêm hiệu ứng di chuột (hover) cao cấp cho toàn bộ ô sản phẩm: viền đổi sang màu thương hiệu, tiêu đề sản phẩm đổi màu thương hiệu, tạo bóng đổ màu thương hiệu mờ và hiệu ứng nhấc nhẹ ô sản phẩm lên.
  2. Nâng cấp danh mục sản phẩm từ dạng chữ xám thuần thành một huy hiệu (badge) bo tròn tinh tế sử dụng màu phụ nhạt (tint) làm nền và màu phụ đậm làm chữ (tự động chuyển thành màu chính trong chế độ Single).
  3. Cải tiến hiệu ứng hover trên nút yêu thích (Wishlist) và các nút hành động (Thêm vào giỏ - Mua ngay) để chuyển màu sắc uyển chuyển và mượt mà sang màu thương hiệu tương ứng.
  4. Nâng cấp các huy hiệu thuộc tính (Attribute Badges) để khi một thuộc tính đang được chọn lọc, toàn bộ huy hiệu đó sẽ có viền và nền mang màu thương hiệu nhạt để tạo điểm nhấn nổi bật.

## 2. Elaboration & Self-Explanation
Hệ thống hiện tại quản lý màu sắc rất chuyên nghiệp thông qua một hook có tên là `useBrandColors()`, trả về 3 thông tin:
1. `primary` (Màu thương hiệu chính).
2. `secondary` (Màu thương hiệu phụ, tự động trùng với `primary` nếu hệ thống được cấu hình ở chế độ `single` brand color).
3. `mode` (`single` hoặc `dual` brand color).

Từ các màu sắc này, hàm `getProductsListColors` trong `components/site/products/colors.ts` sẽ tạo ra một bộ sưu tập token màu (`tokens`) dùng cho trang sản phẩm.
Tuy nhiên, cấu trúc UI của các ô sản phẩm (Product Items) hiện tại lại chưa khai thác tối đa bộ token này. Khi người dùng thiết lập chế độ Dual Brand Color (ví dụ: Màu chính xanh lục, màu phụ vàng cam), ô sản phẩm trông vẫn khá trung tính và thiếu điểm nhấn.
Bằng cách lồng ghép các biến CSS động (`CSS Variables`) vào thuộc tính `style` inline của React, chúng ta có thể truyền trực tiếp màu sắc thương hiệu từ `tokens` vào trong các lớp CSS Tailwind. Nhờ đó, các trạng thái tương tác động như `:hover`, `:active` hay các hiệu ứng chuyển động vi mô (Micro-animations) sẽ phản hồi lại màu sắc thương hiệu cực kỳ chính xác mà không cần tạo thêm React State gây giảm hiệu năng kết xuất (render).

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Giả sử admin cấu hình **Dual Brand Color** với Màu chính là Đỏ rượu (#800020) và Màu phụ là Vàng cát (#F4A460).
  * **Trước khi sửa**: Khi hover vào ô sản phẩm, viền ô sản phẩm vẫn giữ màu xám nhạt thông thường, tiêu đề sản phẩm giữ màu đen. Các nút bấm khi hover không có phản hồi màu sắc rõ nét.
  * **Sau khi sửa**: 
    * Huy hiệu danh mục sản phẩm hiển thị nổi bật với nền Vàng cát nhạt (#F4A460 ở độ mờ 15%) và chữ Đỏ rượu hoặc Vàng cát đậm.
    * Khi di chuột vào ô sản phẩm, viền ô chuyển thành màu Đỏ rượu (#800020), toàn bộ ô nhấc nhẹ lên 4px và tỏa ra một lớp bóng mờ màu đỏ rượu tinh tế. Tên sản phẩm chuyển sang màu Đỏ rượu.
    * Di chuột vào nút "Mua ngay" viền vàng cát sẽ chuyển màu nền sang màu vàng cát nhạt đầy tự nhiên.
* **Hình ảnh ẩn dụ**: Hãy tưởng tượng ô sản phẩm giống như một chiếc xe hơi sang trọng. Thiết lập màu thương hiệu hiện tại giống như xe chỉ sơn màu cơ bản nhưng chưa bật đèn nội thất hay chưa có các chi tiết mạ chrome đổi màu khi xe khởi động. Việc nâng cấp này giống như việc bổ sung hệ thống đèn viền nội thất thông minh (Ambient Light) tự động đổi màu theo tông sơn của xe, giúp xe tỏa sáng lộng lẫy mỗi khi mở cửa (hover).

---

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra file `components/site/hooks.ts`: Xác nhận hook `useBrandColors` lấy các cài đặt từ DB Convex (`site_brand_primary`, `site_brand_secondary`, `site_brand_mode`) và trả về đối tượng màu chuẩn xác.
* Đã kiểm tra file `components/site/products/colors.ts`: Xác nhận bộ token `getProductsListColors` đã tính toán đầy đủ các biến màu như `primaryActionBg`, `secondaryActionBorder`, `secondaryActionHoverBg`, `categoryBadgeBg`, `categoryBadgeText`, `categoryBadgeBorder`, v.v. bảo đảm tương phản APCA tốt.
* Đã kiểm tra file `app/(site)/_components/products/ProductsPage.tsx`:
  * Có 3 vị trí render sản phẩm cần nâng cấp đồng bộ:
    1. Component `ProductGrid` (dòng 1758): Dùng cho Grid Layout mặc định và Catalog Layout.
    2. Component `ProductList` (dòng 1847): Dùng cho List Layout.
    3. Đoạn mã render sản phẩm thủ công bên trong `CatalogLayout` (dòng 2883): Cần được đồng bộ để tránh bỏ sót giao diện khi người dùng chuyển chế độ xem.
  * Các nút hành động được quản lý bởi component chung `ProductCardActions` (dòng 1599).
  * Các thuộc tính sản phẩm được quản lý bởi component `ProductAttributesBadges` (dòng 1652).

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân chính**: Thiết kế UI ban đầu của trang `/products` chỉ tập trung vào trạng thái tĩnh (static state) của màu thương hiệu, chưa áp dụng màu thương hiệu vào các trạng thái động (hover, active, focus) và thiếu sự liên kết chặt chẽ với các token màu phụ (`secondaryResolved` / `categoryBadgeText`) trong chế độ màu kép.
* **Giả thuyết đối chứng**: Nếu ta chỉ áp dụng Tailwind class tĩnh kiểu `hover:border-primary` thì sẽ không hoạt động vì màu thương hiệu là màu động được lưu trong cơ sở dữ liệu và tải lên runtime thông qua Convex, không thể biên dịch tĩnh (build-time compiling) thông qua Tailwind CSS mặc định. Vì thế, giải pháp bắt buộc là sử dụng **Inline CSS Custom Properties** để truyền màu sắc runtime vào CSS.

---

# IV. Proposal (Đề xuất)

Chúng ta sẽ nâng cấp đồng bộ 3 khu vực chính trong `app/(site)/_components/products/ProductsPage.tsx` bằng cách sử dụng các biến CSS nội bộ (`CSS Variables`) nhằm bảo đảm hiệu năng tối đa và tính thẩm mỹ cao cấp.

### 1. Nâng cấp các nút trong `ProductCardActions` (Dòng 1599):
* Thêm micro-animation đàn hồi (`hover:scale-[1.02] active:scale-[0.98] transition-all duration-300`).
* Nút "Thêm vào giỏ" (Primary Action): Thêm bộ lọc độ sáng nhẹ khi hover (`hover:brightness-95`) để tạo hiệu ứng nhấn tự nhiên.
* Nút "Mua ngay" (Secondary Action): Áp dụng màu nền hover lấy từ `tokens.secondaryActionHoverBg` thông qua biến `--btn-hover-bg`.

### 2. Nâng cấp `ProductAttributesBadges` (Dòng 1652):
* Kiểm tra xem thuộc tính sản phẩm có bất kỳ lựa chọn nào đang được chọn lọc hay không (`isAnyTermChecked`).
* Nếu có, tô màu viền thương hiệu (`tokens.primary`) và nền màu thương hiệu siêu nhạt (`tokens.primary` với độ mờ 12%).
* Thêm hiệu ứng hover viền mờ màu thương hiệu nhạt để tăng tương tác trực quan.

### 3. Nâng cấp Ô sản phẩm (Product Items) trong `ProductGrid`, `ProductList`, và `CatalogLayout`:
* **Huy hiệu danh mục sản phẩm (Category Badge)**: Thay thế văn bản danh mục màu xám mặc định bằng huy hiệu bo tròn siêu đẹp sử dụng màu phụ nhạt làm nền (`tokens.categoryBadgeBg`), màu phụ đậm làm chữ (`tokens.categoryBadgeText`) và viền (`tokens.categoryBadgeBorder`).
* **Hiệu ứng hover trên toàn bộ ô**:
  * Chuyển đổi viền sang màu thương hiệu chính (`tokens.primary`).
  * Tạo bóng đổ màu thương hiệu mờ (`tokens.primary` với độ mờ 15%).
  * Nhấc nhẹ ô lên (`hover:-translate-y-1` hoặc `hover:-translate-y-0.5`).
  * Đổi màu tên sản phẩm sang màu thương hiệu chính khi di chuột vào bất kỳ vị trí nào trên ô.
* **Nút yêu thích (Wishlist Button)**: Nâng cấp hover đổi màu viền và nền sang màu thương hiệu tương ứng với trạng thái yêu thích.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa đổi:
* #### [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx)
  * Vai trò hiện tại: Quản lý toàn bộ giao diện, lọc, phân trang và hiển thị danh sách sản phẩm.
  * Thay đổi: Cập nhật các component `ProductCardActions`, `ProductAttributesBadges`, `ProductGrid`, `ProductList` và đoạn render sản phẩm của `CatalogLayout` để tích hợp các biến CSS màu thương hiệu động và hiệu ứng hover premium.

---

# VI. Execution Preview (Xem trước thực thi)
1. **Đọc và Phân tích kỹ**: Xem xét lại các dòng code cụ thể trong `app/(site)/_components/products/ProductsPage.tsx` để bảo đảm vị trí thay đổi chính xác 100%.
2. **Cập nhật component `ProductCardActions`**: Thay thế bằng mã nguồn nâng cấp chứa hover và micro-animation.
3. **Cập nhật component `ProductAttributesBadges`**: Thêm kiểm tra `isAnyTermChecked` và tô màu nền/viền theo màu thương hiệu động.
4. **Cập nhật component `ProductGrid`**: Sửa Link card, thêm Category Badge, Wishlist button hover và biến CSS.
5. **Cập nhật component `ProductList`**: Sửa cấu trúc Link card và Category Badge tương tự Grid.
6. **Cập nhật Catalog Layout Products Map**: Sửa cấu trúc Link card tương tự và đồng bộ Category Badge.
7. **Tự Review Tĩnh**: Soát lại các thẻ đóng mở, tính an toàn kiểu dữ liệu (TypeScript) và bảo đảm không có lỗi cú pháp.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra tĩnh (Static Verification):
* Chạy kiểm tra TypeScript trong dự án bằng lệnh:
  `bunx tsc --noEmit`
  (Pipe qua `2>&1 | Select-Object -First 10` để giới hạn hiển thị).

### Kiểm tra trực quan (Manual Verification):
* Yêu cầu người dùng kiểm tra trên trình duyệt tại `http://localhost:3000/products`:
  * Đổi cài đặt màu thương hiệu ở `http://localhost:3000/admin/settings/general` (chuyển đổi qua lại giữa Single và Dual Mode, thay đổi mã màu).
  * Di chuột vào các ô sản phẩm ở tất cả các layout (Grid, List, Catalog) để xem hiệu ứng viền đổi màu, bóng đổ màu thương hiệu mờ, nhấc nhẹ ô và đổi màu tên sản phẩm.
  * Xem hiển thị huy hiệu Danh mục sản phẩm (Category Badge) có đúng tông màu phụ không.
  * Kiểm tra các thuộc tính sản phẩm (Brand, Origin, Grape, Flavor) khi bấm chọn lọc xem huy hiệu thuộc tính có chuyển sang viền và nền màu thương hiệu nhạt rực rỡ không.
  * Kiểm tra nút Wishlist và các nút Thêm vào giỏ / Mua ngay khi di chuột vào.

---

# VIII. Todo
- [ ] Cập nhật `ProductCardActions` trong `ProductsPage.tsx`
- [ ] Cập nhật `ProductAttributesBadges` trong `ProductsPage.tsx`
- [ ] Cập nhật `ProductGrid` trong `ProductsPage.tsx`
- [ ] Cập nhật `ProductList` trong `ProductsPage.tsx`
- [ ] Cập nhật đoạn render sản phẩm của `CatalogLayout` trong `ProductsPage.tsx`
- [ ] Tiến hành tự đánh giá tĩnh và chạy biên dịch TypeScript dự phòng

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* [x] **Không lỗi biên dịch**: Toàn bộ dự án phải compile thành công mà không có lỗi TypeScript hay cú pháp React.
* [x] **Tôn trọng Single Mode**: Khi settings chọn Single Brand Color, các hiệu ứng hover, badge danh mục, badge thuộc tính, và nút bấm sử dụng duy nhất màu chính (primary) ở các sắc độ khác nhau.
* [x] **Tôn trọng Dual Mode**: Khi settings chọn Dual Brand Color, các huy hiệu danh mục, nút "Mua ngay", giá cả sản phẩm sử dụng đúng màu phụ (secondaryResolved) và màu phụ nhạt (tint) làm nổi bật thiết kế đa sắc.
* [x] **Trải nghiệm Premium**: Các hiệu ứng hover mượt mà (`transition-all duration-300`), có micro-animation nhấc nhẹ, tạo bóng đổ màu thương hiệu và thay đổi trạng thái tự nhiên khi click.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi cú pháp do file `ProductsPage.tsx` rất lớn (hơn 3000 dòng).
* **Biện pháp phòng ngừa**: Lưu trữ bản sao lưu và chỉ sử dụng công cụ thay thế phân đoạn nhỏ chính xác (`replace_file_content` hoặc `multi_replace_file_content`) thay vì ghi đè toàn bộ file.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi logic giỏ hàng, thanh toán hoặc API lấy danh sách sản phẩm.
* Thay đổi cấu trúc cơ sở dữ liệu Convex của sản phẩm hay cấu hình cài đặt.
