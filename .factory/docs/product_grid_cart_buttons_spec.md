# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Component `ProductGrid` (Lưới sản phẩm) trên trang chủ hiện tại chưa cho phép cấu hình và hiển thị hai nút "Thêm vào giỏ" và "Mua ngay" như hai component tương tự là `ProductList` và `CategoryProducts`.
* **Nguyên nhân**: Ở phía Admin (trang Tạo mới/Chỉnh sửa), code chưa định nghĩa và truyền các biến trạng thái (state) cấu hình giỏ hàng vào form cấu hình `ProductGridForm`, chưa truyền vào preview `ProductGridPreview`, và chưa lưu các thuộc tính này lên Server khi submit. Đồng thời, giao diện Preview của `ProductGrid` đối với một số layout tự tạo (như `tabbed` và `storefront`) đang hiển thị nút "Xem chi tiết" cứng mà chưa tích hợp `ProductCardActions`.
* **Giải pháp**:
  a) Cập nhật cấu hình mặc định ở `constants.ts` của `product-grid`.
  b) Khai báo các state (`showAddToCartButton`, `showBuyNowButton`, `cartButtonsLayout`) và truyền đầy đủ vào `ProductGridForm`, `ProductGridPreview` ở cả hai trang `create/page.tsx` và `edit/page.tsx`, đồng thời bổ sung chúng vào payload submit của hai trang này.
  c) Cập nhật `ProductGridPreview.tsx` nhận các prop này và thay thế nút "Xem chi tiết" cứng bằng component `ProductCardActions` dùng chung trong các giao diện render thủ công (`tabbed`, `storefront`).
* **Kết quả**: Component `ProductGrid` sẽ đồng bộ hoàn toàn với `ProductList` và `CategoryProducts`, hiển thị đầy đủ và cấu hình linh hoạt các nút giỏ hàng trên mọi thiết bị và môi trường (site thực lẫn preview).

## 2. Elaboration & Self-Explanation
Chúng ta có 3 component hiển thị sản phẩm trên trang chủ: `ProductList` (Danh sách sản phẩm), `CategoryProducts` (Sản phẩm theo danh mục), và `ProductGrid` (Lưới sản phẩm).
Để tối ưu tỷ lệ chuyển đổi, hai component đầu tiên đã được cập nhật tính năng: cho phép Admin bật/tắt nút "Thêm nhanh vào giỏ", nút "Mua ngay" (đi thẳng tới checkout), và chọn bố cục hiển thị là "Xếp dọc (Stack)" hoặc "Xếp ngang (Grid 2)".

Tuy nhiên, component `ProductGrid` bị bỏ quên. Mặc dù cấu trúc dữ liệu (`types`) đã được chuẩn bị sẵn và giao diện site thực (`ProductGridSection.tsx`) cũng đã viết sẵn logic render `ProductCardActions`, nhưng trang quản trị lại thiếu sự kết nối. Khi Admin truy cập trang tạo mới hoặc chỉnh sửa `ProductGrid`, họ không thấy các tùy chọn này vì trang `page.tsx` chưa định nghĩa các state tương ứng để truyền vào form. Hơn nữa, component Preview của `ProductGrid` (`ProductGridPreview.tsx`) khi render các kiểu biến thể đặc biệt (như `tabbed` - giao diện tab và `storefront` - giao diện cửa hàng) lại tự vẽ (hardcode) một nút "Xem chi tiết" thay vì sử dụng component `ProductCardActions` dùng chung.

Chúng ta cần sửa đổi kết nối dữ liệu (wiring) này bằng cách thêm các state cấu hình vào cả trang `create` và `edit` của `product-grid`, lưu chúng xuống Convex khi nhấn nút lưu, truyền chúng sang Preview, và đảm bảo Preview vẽ đúng các nút này tương tự như trên site thực để Admin có thể kiểm tra trực quan trên các kích thước màn hình Responsive (Mobile / Tablet / Desktop).

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Khi Admin chọn component `ProductGrid` kiểu "Storefront", bật "Hiển thị nút Thêm vào giỏ" và "Hiển thị nút Mua ngay", đồng thời cấu hình "Bố cục nút hiển thị" là "Xếp dọc (Stack)". Trên khung preview, mỗi card sản phẩm trong lưới sẽ không còn hiển thị nút "Xem chi tiết" đơn điệu nữa. Thay vào đó, nó sẽ hiển thị hai nút xếp chồng lên nhau: nút màu thương hiệu "Mua ngay" và nút viền mờ "Thêm vào giỏ", y hệt như những gì khách hàng sẽ nhìn thấy ngoài trang chủ.
* **Hình ảnh ẩn dụ**: Hãy tưởng tượng bạn đang lắp ráp một chiếc ô tô đồ chơi. Bạn đã có động cơ chạy pin rất xịn bên trong (logic render ở site thực) và bảng điều khiển điều khiển từ xa cũng có sẵn nút bấm (các input trong `ProductGridForm`). Thế nhưng, bạn lại quên chưa nối dây điện từ nút bấm trên bảng điều khiển đến động cơ (chưa khai báo state và truyền prop ở `page.tsx`). Nhiệm vụ của chúng ta bây giờ là nối các sợi dây điện này lại để khi bấm nút trên bảng điều khiển, chiếc xe sẽ chạy mượt mà.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Trạng thái hiện tại**:
  * Các loại dữ liệu (Types) đã hỗ trợ đầy đủ các trường `showAddToCartButton`, `showBuyNowButton`, `cartButtonsLayout`.
  * `ProductGridForm.tsx` đã xây dựng sẵn giao diện cấu hình (các checkbox và select box) nhưng chỉ hiển thị khi nhận được các props tương ứng từ cha.
  * `ProductGridSection.tsx` (giao diện site thực) đã tích hợp đầy đủ `ProductCardActions` và hoạt động hoàn hảo dựa trên cấu hình lưu trữ.
  * **Thiếu sót**: Cả `create/product-grid/page.tsx` và `product-grid/[id]/edit/page.tsx` đều chưa khai báo state, chưa truyền props cho Form/Preview, và chưa lưu dữ liệu khi submit. `ProductGridPreview.tsx` chưa render `ProductCardActions` cho các style `tabbed` và `storefront`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause Confidence (Độ tin cậy nguyên nhân gốc)**: **High (Cao)**
  * **Lý do**: Toàn bộ luồng dữ liệu cấu hình giỏ hàng của `ProductGrid` bị ngắt quãng tại tầng trung gian (Page Controller/View Controller). Phía backend và phía render site thực đã có đầy đủ nền tảng vững chắc, chỉ cần nối luồng (wiring) ở phía Admin Client nữa là hoàn thành.

---

# IV. Proposal (Đề xuất)
1. Cập nhật `DEFAULT_PRODUCT_GRID_CONFIG` trong `app/admin/home-components/product-grid/_lib/constants.ts` để bổ sung các giá trị cấu hình giỏ hàng mặc định:
   * `showAddToCartButton: true`
   * `showBuyNowButton: true`
   * `cartButtonsLayout: 'stack'`
2. Khai báo 3 state mới trong `ProductGridCreateContent` ở `app/admin/home-components/create/product-grid/page.tsx`:
   * `showAddToCartButton` (mặc định: `true`)
   * `showBuyNowButton` (mặc định: `true`)
   * `cartButtonsLayout` (mặc định: `'stack'`)
3. Truyền các state và hàm setter này vào `<ProductGridForm>` và `<ProductGridPreview>` trong trang create.
4. Bổ sung 3 trường này vào payload lưu trữ trong hàm `onSubmit` của trang create.
5. Thực hiện tương tự cho trang edit `app/admin/home-components/product-grid/[id]/edit/page.tsx`: lấy dữ liệu từ `component.config` để khởi tạo state, khai báo state, truyền cho Form và Preview, và cập nhật trong hàm `handleSubmit` gửi lên Convex.
6. Cập nhật `ProductGridPreview.tsx` để:
   * Nhận các prop `showAddToCartButton`, `showBuyNowButton`, `cartButtonsLayout`.
   * Khởi tạo `tokens` bằng hàm `getProductsListColors` tương tự như `ProductListPreview`.
   * Sử dụng component `<ProductCardActions>` thay cho nút "Xem chi tiết" cứng trong hai hàm `renderStorefrontStyle` (render layout `tabbed` và `storefront`).

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Nhóm: Cấu hình và Kiểu dữ liệu (Configuration & Types)
#### [MODIFY] [constants.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/_lib/constants.ts)
* **Vai trò hiện tại**: Định nghĩa cấu hình mặc định `DEFAULT_PRODUCT_GRID_CONFIG` cho lưới sản phẩm.
* **Sửa**: Thêm `showAddToCartButton: true`, `showBuyNowButton: true`, và `cartButtonsLayout: 'stack'` vào `DEFAULT_PRODUCT_GRID_CONFIG` để làm giá trị mặc định khi tạo mới.

### Nhóm: Giao diện Quản trị (Admin Pages)
#### [MODIFY] [page.tsx (create)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/create/product-grid/page.tsx)
* **Vai trò hiện tại**: Controller và giao diện của trang tạo mới component `ProductGrid`.
* **Sửa**: Khai báo các state cho nút giỏ hàng, truyền cho Form và Preview, và bổ sung vào payload submit gửi lên server.

#### [MODIFY] [page.tsx (edit)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/[id]/edit/page.tsx)
* **Vai trò hiện tại**: Controller và giao diện của trang chỉnh sửa component `ProductGrid`.
* **Sửa**: Đọc các giá trị cấu hình cũ từ `config` để khởi tạo state, khai báo các state, truyền cho Form và Preview, bổ sung vào payload lưu trữ và snapshot comparison.

### Nhóm: Component Preview (Preview Component)
#### [MODIFY] [ProductGridPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/_components/ProductGridPreview.tsx)
* **Vai trò hiện tại**: Hiển thị xem trước (preview) trực quan cho component `ProductGrid`.
* **Sửa**: Nhận các props cấu hình nút giỏ hàng, khởi tạo color tokens, và thay thế nút "Xem chi tiết" cứng bằng component `<ProductCardActions>` trong các layout `tabbed` và `storefront`.

---

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa `constants.ts` của `product-grid` để cập nhật cấu hình mặc định.
2. Cập nhật trang tạo mới `create/product-grid/page.tsx` để hỗ trợ các state giỏ hàng.
3. Cập nhật trang chỉnh sửa `product-grid/[id]/edit/page.tsx` để tải, so sánh thay đổi và lưu các cấu hình giỏ hàng mới.
4. Cập nhật component `ProductGridPreview.tsx` để render `ProductCardActions` trong mọi biến thể layout, đảm bảo sự nhất quán trực quan tối đa.
5. Tiến hành review tĩnh toàn bộ code thay đổi để đảm bảo không có lỗi TypeScript hay cú pháp.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
Vì chúng ta tuân thủ quy tắc nghiêm ngặt: **Cấm tuyệt đối tự chạy lint/unit test** và **Verification runtime/integration do tester phụ trách**, kế hoạch kiểm chứng sẽ tập trung vào phân tích tĩnh (Static Review) và chuẩn bị các tiêu chí nghiệm thu rõ ràng.

### Khảo sát tĩnh (Static Verification):
* Chạy `bunx tsc --noEmit` thủ công trong quá trình code (nếu cần thiết) và pipe qua `Select-Object -First 10` để đảm bảo hệ thống build/typecheck hoàn toàn thông qua, không có lỗi kiểu dữ liệu (Types).

---

# VIII. Todo
- [ ] Bổ sung cấu hình mặc định vào `DEFAULT_PRODUCT_GRID_CONFIG` trong `constants.ts`.
- [ ] Cập nhật state, form bindings, preview bindings và submit payload trong `create/product-grid/page.tsx`.
- [ ] Cập nhật state, config loader, form bindings, preview bindings, snapshot comparator và submit payload trong `product-grid/[id]/edit/page.tsx`.
- [ ] Cập nhật `ProductGridPreview.tsx` để nhận các props cấu hình giỏ hàng và thay thế nút "Xem chi tiết" cứng trong layout `tabbed` và `storefront` bằng `ProductCardActions`.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
1. Khi truy cập trang tạo mới `/admin/home-components/create/product-grid`, phần cấu hình hiển thị có đầy đủ:
   * Checkbox "Hiển thị nút Thêm vào giỏ" (mặc định: Checked)
   * Checkbox "Hiển thị nút Mua ngay" (mặc định: Checked)
   * Dropdown "Bố cục nút hiển thị" (chỉ hiện khi cả 2 nút trên đều bật, mặc định: "Xếp dọc (Stack)")
2. Giao diện preview bên phải phản ánh chính xác cấu hình:
   * Khi bật cả hai nút, các card sản phẩm hiển thị cả hai nút giỏ hàng.
   * Khi thay đổi bố cục "Xếp dọc" hoặc "Xếp ngang", các nút trên preview thay đổi tương ứng.
   * Hoạt động chính xác trên cả 3 chế độ xem responsive: Desktop, Tablet, Mobile.
3. Khi nhấn nút lưu ở trang Tạo mới hoặc Chỉnh sửa, các trường cấu hình được lưu thành công vào Convex backend và không bị mất khi tải lại trang.
4. Ngoài trang chủ thực tế, component `ProductGrid` hiển thị và vận hành các nút giỏ hàng một cách chính xác theo cấu hình đã lưu.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Rất thấp do chỉ can tiệp vào tầng cấu hình UI của trang quản trị và preview, không làm ảnh hưởng đến cấu trúc cơ sở dữ liệu cốt lõi hay các trang thanh toán của khách hàng.
* **Hoàn tác**: Sử dụng git để rollback các file bị chỉnh sửa về trạng thái commit gần nhất nếu phát hiện lỗi bất ngờ.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi logic giỏ hàng hoặc luồng checkout của hệ thống (hệ thống đã xử lý rất tốt qua hook `useCart` và `ProductCardActions`).
* Thay đổi CSS cốt lõi của các nút giỏ hàng hay thiết kế của `ProductCardActions` (sử dụng lại các component và CSS đồng bộ sẵn có của hệ thống).

---

# XII. Open Questions (Câu hỏi mở)
*Không có câu hỏi mở. Yêu cầu của người dùng đã rất rõ ràng và khớp hoàn toàn với các cấu trúc code hiện có.*
