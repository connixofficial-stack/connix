# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Cấu hình của component `ProductGrid` (Lưới sản phẩm) hiện tại rất rời rạc, gượng gạo và thiếu nhất quán:
  * Admin chọn Tab danh mục ở một nơi, chọn nguồn sản phẩm (tự động/thủ công) ở một nơi riêng, dễ gây ra hiện tượng tab trống hoặc lệch dữ liệu.
  * Việc nhập tay số lượng sản phẩm `itemCount` rất khó khớp với số hàng/cột của lưới.
  * Khi chọn sản phẩm thủ công, Admin rất khó tìm kiếm trong hàng trăm sản phẩm và dễ vô tình chọn phải sản phẩm bị lỗi hiển thị (hết hàng, thiếu ảnh, thiếu giá).
  * Khi danh mục trống sản phẩm, giao diện hiển thị thông báo rất tẻ nhạt và cụt lủn, không có nút điều hướng kéo chân khách hàng hay giúp Admin sửa nhanh.
* **Giải pháp**:
  a) **Gộp & Đồng bộ hóa nguồn dữ liệu (Data Source Alignment)**:
     - Nếu chọn *Lọc theo danh mục (Category-based)*: Admin chỉ chọn các danh mục. Hệ thống tự động tạo các Tab tương ứng và tự động truy vấn sản phẩm thuộc từng danh mục đó.
     - Nếu chọn *Theo sản phẩm (Product-based)* (Tự động hoặc Thủ công): Admin chỉ chọn sản phẩm. Hệ thống sẽ tự động gôm (extract) các danh mục tương ứng từ danh sách sản phẩm này để tạo các Tab.
     - Hiển thị số lượng sản phẩm hoạt động (Active products) của từng danh mục ngay trong danh sách lựa chọn của Admin để tăng trải nghiệm nhà phát triển (DX).
  b) **Chọn Số hàng & Số cột (Rows & Columns Config)**:
     - Thay thế việc nhập tay số lượng sản phẩm bằng cách chọn: `Số cột trên Desktop` (desktopColumns) và `Số dòng hiển thị` (desktopRows).
     - Hệ thống tự động tính toán số sản phẩm tối đa: `itemCount = desktopColumns × desktopRows`.
  c) **Thanh trượt Tab danh mục thông minh (Smart Tab Slider)**:
     - Thay thế thanh cuộn thô bằng một bộ trượt Tab mượt mà tích hợp hiệu ứng chuyển sắc mờ dần (gradient fade) ở hai đầu và các nút điều hướng ẩn/hiện thông minh khi có thể cuộn.
  d) **Tích hợp Option A (DX/UX thông minh nâng cao)**:
     - **Bộ lọc danh mục & Cảnh báo lỗi sản phẩm (Smart Selector & Audit Indicator)**: Thêm bộ lọc nhanh theo Danh mục trong bảng chọn sản phẩm thủ công. Hiển thị các nhãn cảnh báo trực quan cho sản phẩm hết hàng (Out of Stock), thiếu ảnh (Missing Image), chưa có giá (Missing Price) ngay lúc chọn.
     - **Trạng thái trống thông minh (Smart Empty State Action)**: Thiết kế lại Empty State cực đẹp. Trong Admin Preview, có nút nhanh dẫn tới trang tạo sản phẩm cho danh mục đó; ngoài Storefront, có nút "Khám phá sản phẩm khác" để giữ chân khách hàng.
* **Kết quả**: Giao diện cấu hình nhất quán, thông minh vượt trội. Trải nghiệm người dùng storefront mượt mà, chuyên nghiệp và có tỷ lệ chuyển đổi cao.

## 2. Elaboration & Self-Explanation
Chúng ta sẽ tiến hành một cuộc cải tổ kiến trúc UI/UX/DX toàn diện cho component `ProductGrid`. 

Đầu tiên là giải quyết sự ngắt quãng trong tư duy lựa chọn nguồn dữ liệu (Data Flow Alignment). Thay vì bắt người dùng cấu hình hai phần độc lập là "Tab danh mục hiển thị" và "Sản phẩm hiển thị", chúng ta sẽ gom chung lại thành một triết lý rõ ràng:
1. **Lấy sản phẩm theo danh mục (Category-based Selection)**: Người dùng chọn các danh mục muốn đưa lên trang chủ. Hệ thống tự động hiển thị các tab này. Khi click vào từng tab, hệ thống tự động tải các sản phẩm Active thuộc danh mục đó. Để hỗ trợ DX, chúng tôi sẽ hiển thị số lượng sản phẩm đang hoạt động của từng danh mục ngay cạnh tên danh mục (ví dụ: Nike (28), Adidas (15)).
2. **Lấy sản phẩm theo danh sách (Product-based Selection - Tự động hoặc Thủ công)**: Người dùng chọn các sản phẩm nổi bật cụ thể (hoặc tự động). Hệ thống tự động quét danh mục của các sản phẩm này và gom chúng lại thành các Tab tương ứng.

Thứ hai là việc thiết lập số lượng sản phẩm hiển thị. Chúng ta cho phép chọn `Số cột hiển thị` và `Số dòng hiển thị` để tự động tính toán ra số sản phẩm tối đa (`itemCount = Số cột × Số dòng`), giúp lưới luôn vuông vức và đẹp mắt.

Thứ ba là trải nghiệm điều hướng Tab danh mục ngoài storefront. Chúng ta phát triển component `CategoryTabSlider` dùng chung với thanh cuộn mượt mà ẩn scrollbar, hiệu ứng gradient mờ ở hai cạnh bên, và hai nút bấm Prev / Next thông minh chỉ xuất hiện khi chiều dài các tab vượt quá chiều rộng container.

Thứ tư là bộ lọc thông minh & cảnh báo sản phẩm khi chọn thủ công. Admin có thể lọc nhanh sản phẩm theo danh mục trong bảng chọn. Hệ thống hiển thị các icon cảnh báo: ⚠️ hết hàng, 🖼️ thiếu ảnh đại diện, hoặc 🏷️ chưa nhập giá. Điều này giúp loại bỏ hoàn toàn khả năng đưa sản phẩm lỗi/hết hàng lên trang chủ. Nếu gặp danh mục trống, hệ thống hiển thị Empty State kèm nút hành động thông minh (Dẫn sang trang tạo sản phẩm trong admin, hoặc dẫn về trang mua sắm ngoài storefront).

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Khi Admin bật chế độ chọn sản phẩm thủ công, họ chỉ cần chọn bộ lọc danh mục "Giày Vans" để hiện riêng các mẫu Vans. Khi duyệt danh sách, họ thấy mẫu "Vans Old Skool" hiển thị nhãn màu đỏ "⚠️ Hết hàng" và mẫu "Vans Slip-On" hiển thị nhãn "🖼️ Thiếu ảnh". Admin lập tức nhận diện được và bỏ chọn hai mẫu này để tránh làm mất thẩm mỹ trang chủ.
* **Hình ảnh ẩn dụ**: Hãy tưởng tượng bạn là một tổng biên tập chuẩn bị xuất bản trang bìa tạp chí thời trang.
  * Thiết kế cũ bắt bạn tự tay nhặt các bài viết riêng, tự viết mục lục riêng, rất dễ bị lệch mục lục và bài viết.
  * Thiết kế mới cung cấp cho bạn một trợ lý ảo thông minh: Bạn chỉ cần chọn "Tôi muốn đăng bài về Nike và Adidas", trợ lý sẽ tự động gom các bài viết tương ứng và báo cho bạn biết "Nike hiện đang có 28 bài viết sẵn sàng, Adidas có 15 bài". Khi bạn tự chọn bài viết, trợ lý sẽ giơ biển cảnh báo ngay: "Bài viết này chưa có ảnh bìa đâu nhé, bài viết kia đã hết hạn bản quyền rồi". Và nếu một mục lục bị trống bài viết, nó sẽ tự động hiển thị gợi ý hấp dẫn thay vì để một khoảng trắng vô duyên.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Trạng thái hiện tại**:
  * Component `ProductGridForm.tsx` đang có hai mục SubSection độc lập: "Tab danh mục" (chọn category ids) và "Nguồn dữ liệu" (chọn `selectionMode` auto/manual/demo).
  * Trong database, cấu hình lưu trữ ở `homeComponents` cho `ProductGrid` đang lưu `categoryTabIds` và `selectedProductIds` một cách độc lập.
  * Preview và Site thực tế cuộn tab bằng CSS cuộn ngang mặc định `overflow-x-auto`, không có nút Prev/Next cũng như hiệu ứng mờ dần (gradient fade).
* **DX/UX Audit**: 
  * Admin không biết mỗi danh mục có bao nhiêu sản phẩm để chọn.
  * Admin dễ chọn nhầm sản phẩm hết hàng hoặc không có ảnh.
  * Không có bộ lọc danh mục trong bảng chọn sản phẩm thủ công, phải scroll tìm mỏi mắt.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause Confidence**: **High (Cao)**
  * **Lý do**: Sự thiếu nhất quán trong thiết kế dòng dữ liệu (Data Flow) và sự thiếu hụt các tính năng hỗ trợ vận hành (DX/UX features) trong giai đoạn sơ khởi của dự án. Gộp nguồn dữ liệu, tích hợp rows/columns math, bổ sung lọc danh mục/cảnh báo sản phẩm lỗi, và thiết kế lại tab slider/empty state sẽ giải quyết triệt để 100% các thiếu sót này.

---

# IV. Proposal (Đề xuất)

### 1. Đồng bộ cấu hình mặc định (`constants.ts`)
* Thêm các thuộc tính mới vào `DEFAULT_PRODUCT_GRID_CONFIG`:
  * `desktopRows: 2` (mặc định hiển thị 2 dòng sản phẩm)
  * `selectionMode: 'category'` (mặc định chuyển sang chế độ chọn theo Danh mục để tối ưu UX)
  * `categoryTabIds: []`
  * `desktopColumns: 4`

### 2. Cải tổ `ProductGridForm.tsx` (Form cấu hình phía Admin)
* **Gộp Nguồn dữ liệu & Tab danh mục**:
  * Đổi thuộc tính `selectionMode` thành `selectionMode: 'category' | 'auto' | 'manual' | 'demo'`.
  * Giao diện chọn chế độ sẽ có 4 nút trực quan:
    * **Theo Danh mục (Khuyên dùng)**: Hệ thống tự động lấy sản phẩm thuộc các danh mục được chọn.
    * **Tự động (Toàn bộ sản phẩm)**: Lấy sản phẩm mới nhất / bán chạy nhất toàn site.
    * **Chọn thủ công**: Chọn từng sản phẩm cụ thể muốn trưng bày.
    * **Dữ liệu mẫu (Demo)**: Sử dụng sản phẩm demo gắn sẵn.
  * **Độ linh hoạt của Form**:
    * Ở chế độ **Theo Danh mục**: Hiển thị bảng chọn Danh mục kèm số lượng sản phẩm Active của mỗi danh mục.
    * Ở chế độ **Tự động / Chọn thủ công / Demo**: Ẩn phần chọn Danh mục thủ công, hiển thị ghi chú: *"Hệ thống sẽ tự động gôm các danh mục từ sản phẩm đã chọn để tạo thành các tab lọc tương ứng."*
* **Tích hợp đếm sản phẩm cho Danh mục (DX xịn)**:
  * Sử dụng `productsData` để đếm số sản phẩm `Active` thuộc mỗi danh mục và hiển thị dạng `Tên danh mục (Số lượng)`.
* **Cấu hình Số hàng & Số cột**:
  * Thêm bộ chọn `Số dòng hiển thị` (desktopRows: 1 -> 5 dòng).
  * Tự động tính toán `itemCount = desktopColumns × desktopRows` mỗi khi cột hoặc hàng thay đổi. Ẩn input nhập số lượng thủ công.
* **Tích hợp Option A - Cải tiến DX/UX Chọn thủ công**:
  * **Bộ lọc danh mục nhanh**: Thêm dropdown chọn danh mục bên cạnh thanh tìm kiếm sản phẩm thủ công để lọc nhanh sản phẩm.
  * **Cảnh báo lỗi sản phẩm**: Hiển thị nhãn cảnh báo trực quan:
    * `⚠️ Hết hàng` nếu `product.stock <= 0` (Màu đỏ/cam).
    * `🖼️ Thiếu ảnh` nếu sản phẩm không có ảnh đại diện (Màu xám/đỏ).
    * `🏷️ Chưa có giá` nếu sản phẩm có `price === 0` hoặc undefined (Màu đỏ).

### 3. Cải tổ `ProductGridPreview.tsx` & `ProductGridSection.tsx` (Preview & Site thực tế)
* **Đồng bộ hóa Logic Lấy dữ liệu & Tạo Tab**:
  * Viết một bộ xử lý logic lấy sản phẩm và gôm tab nhất quán cho cả Preview và Site thực tế:
    * Nếu `selectionMode === 'category'`:
      * Các tab hiển thị sẽ là các danh mục được chọn (nếu không chọn danh mục nào, hiển thị tất cả danh mục hoạt động).
      * Khi click vào tab nào, hiển thị sản phẩm thuộc danh mục đó (giới hạn tối đa là `itemCount`).
      * Khi ở tab "Tất cả": Hiển thị sản phẩm gộp từ các danh mục được chọn (hoặc toàn bộ sản phẩm hoạt động) giới hạn tối đa `itemCount`.
    * Nếu `selectionMode === 'manual' | 'auto' | 'demo'`:
      * Danh sách sản phẩm được lấy theo cấu hình tương ứng (thủ công, tự động hoặc demo).
      * Hệ thống tự động trích xuất (extract) danh sách các danh mục duy nhất từ các sản phẩm này để tạo thành các Tab lọc.
      * Khi click vào từng tab, lọc danh sách sản phẩm theo danh mục tương ứng.
* **Xây dựng Component `CategoryTabSlider.tsx` thông minh**:
  * Phát triển component `<CategoryTabSlider>` cao cấp dùng chung cho cả Preview và Storefront.
  * Sử dụng thanh cuộn mượt mà ẩn scrollbar mặc định, tích hợp hiệu ứng gradient mờ ở hai cạnh bên và hai nút bấm Prev / Next nhỏ nhắn ở hai đầu tự động ẩn/hiện dựa trên trạng thái cuộn thực tế của container.
* **Tích hợp Option A - Trạng thái trống thông minh (Smart Empty State)**:
  * Khi một danh mục không có sản phẩm nào hoạt động, hiển thị Empty State đẹp mắt kèm nút hành động:
    * *Trong Admin Preview*: Hiển thị nút "Thêm sản phẩm" mở sang trang quản lý sản phẩm với bộ lọc danh mục tương ứng được bật sẵn.
    * *Ngoài Storefront*: Hiển thị nút "Khám phá sản phẩm khác" dẫn về trang mua sắm chung `/products`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Nhóm: Cấu hình & Kiểu dữ liệu (Configuration & Types)
#### [MODIFY] [constants.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/_lib/constants.ts)
* **Vai trò**: Chứa cấu hình mặc định cho Lưới sản phẩm.
* **Sửa**: Bổ sung `desktopRows: 2` và cập nhật `selectionMode` mặc định sang `'category'`.

#### [MODIFY] [index.ts (types)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/_types/index.ts)
* **Vai trò**: Định nghĩa các kiểu dữ liệu của component.
* **Sửa**: Cập nhật kiểu `ProductGridSelectionMode` hỗ trợ `'category'` và thêm trường `desktopRows?: number` vào `ProductGridConfig`.

### Nhóm: Giao diện Quản trị (Admin Pages)
#### [MODIFY] [ProductGridForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/_components/ProductGridForm.tsx)
* **Vai trò**: Form cấu hình cho component trong admin.
* **Sửa**: Cải tổ toàn bộ phần chọn nguồn dữ liệu, tích hợp đếm sản phẩm cho từng danh mục, thiết kế lại bộ chọn số hàng/số cột và tính toán tự động số lượng tối đa. Thêm bộ lọc danh mục nhanh và hiển thị cảnh báo lỗi/hết hàng cho sản phẩm khi chọn thủ công.

#### [MODIFY] [page.tsx (create)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/create/product-grid/page.tsx)
* **Vai trò**: Trang tạo mới Product Grid.
* **Sửa**: Khai báo thêm state `desktopRows`, cập nhật giá trị mặc định của `selectionMode` thành `'category'`, truyền các state mới vào Form & Preview, cập nhật payload submit.

#### [MODIFY] [page.tsx (edit)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/[id]/edit/page.tsx)
* **Vai trò**: Trang chỉnh sửa Product Grid.
* **Sửa**: Tải thêm state `desktopRows` từ config, cập nhật các Snapshot so sánh thay đổi, truyền đầy đủ các state mới vào Form & Preview, cập nhật payload lưu.

### Nhóm: Component UI dùng chung (Shared UI Components)
#### [NEW] [CategoryTabSlider.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/shared/CategoryTabSlider.tsx)
* **Vai trò**: Component thanh trượt tab danh mục thông minh dùng chung.
* **Thêm**: Viết component với cuộn CSS mượt mà, hỗ trợ ẩn thanh cuộn thô, nút điều hướng Prev/Next tự động ẩn/hiện bằng `scrollLeft` listener, và dải che mờ gradient ở 2 đầu cuộn.

### Nhóm: Giao diện hiển thị (Preview & Storefront Components)
#### [MODIFY] [ProductGridPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/_components/ProductGridPreview.tsx)
* **Vai trò**: Khung hiển thị xem trước Product Grid ở Admin.
* **Sửa**: Tích hợp component `<CategoryTabSlider>` thay cho thanh cuộn ngang cũ, đồng bộ hóa logic gôm tab tự động theo sản phẩm hoặc danh mục. Bổ sung Empty State thông minh kèm nút hành động dẫn sang quản lý sản phẩm.

#### [MODIFY] [ProductGridSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductGridSection.tsx)
* **Vai trò**: Giao diện render Product Grid thực tế ở trang chủ storefront.
* **Sửa**: Đồng bộ hóa logic gôm tab tự động và lọc sản phẩm theo danh mục/sản phẩm thực tế giống hệt Preview, tích hợp `<CategoryTabSlider>` và Smart Empty State ngoài storefront thực tế.

---

# VI. Execution Preview (Xem trước thực thi)
1. Tạo component dùng chung `<CategoryTabSlider>` với đầy đủ hiệu ứng mượt mà và nút điều hướng Prev/Next ẩn hiện thông minh.
2. Cập nhật các kiểu dữ liệu và cấu hình mặc định trong `_types/index.ts` và `constants.ts`.
3. Chỉnh sửa `ProductGridForm.tsx` để thay đổi toàn bộ bố cục cấu hình: đếm sản phẩm cho danh mục, tích hợp Rows & Columns math, bộ lọc danh mục và cảnh báo sản phẩm hết hàng/lỗi.
4. Cập nhật trang tạo mới và trang chỉnh sửa để hỗ trợ đầy đủ các biến cấu hình cải tổ này.
5. Cập nhật `ProductGridPreview.tsx` và `ProductGridSection.tsx` để đồng bộ hoàn toàn logic dữ liệu, tích hợp thanh trượt Tab mới và Empty State thông minh.
6. Tiến hành typecheck và bàn giao.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **TypeScript Check**: Chạy lệnh `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo hệ thống build an toàn 100% không có lỗi Types.
* **Manual UI Test**:
  * Xem trước trong admin khi bật nhiều tab: Thanh trượt tab hiển thị mượt mà, có dải mờ gradient và các nút mũi tên điều hướng.
  * Đổi số cột là 5, số dòng là 3: Xác nhận số lượng sản phẩm tối đa tự động hiển thị trên preview là 15.
  * Bật chế độ "Theo Danh mục": Kiểm tra danh sách danh mục có hiển thị kèm số lượng sản phẩm.
  * Bật chế độ "Chọn sản phẩm": Các tab danh mục được tự động trích xuất chính xác và không bị trống.
  * Kiểm tra bảng chọn sản phẩm thủ công có bộ lọc danh mục, có hiển thị cảnh báo `⚠️ Hết hàng`, `🖼️ Thiếu ảnh`, `🏷️ Chưa có giá`.
  * Tạo một danh mục trống: Kiểm tra hiển thị Empty State đẹp mắt, có nút dẫn link phù hợp.

---

# VIII. Todo
- [ ] Tạo component `<CategoryTabSlider>` tại `components/shared/CategoryTabSlider.tsx`.
- [ ] Cập nhật types và constants cấu hình mặc định của Product Grid.
- [ ] Cải tổ `ProductGridForm.tsx` (bố cục nguồn dữ liệu mới, bộ chọn hàng/cột, đếm sản phẩm danh mục, lọc nhanh danh mục và cảnh báo lỗi sản phẩm).
- [ ] Cập nhật trang tạo mới `create/product-grid/page.tsx` và trang chỉnh sửa `product-grid/[id]/edit/page.tsx` để kết nối dữ liệu mới.
- [ ] Cập nhật `ProductGridPreview.tsx` để tích hợp Tab Slider mới, Smart Empty State và đồng bộ logic gôm tab.
- [ ] Cập nhật `ProductGridSection.tsx` để đồng bộ logic gôm tab, Smart Empty State và tích hợp Tab Slider mới ngoài storefront thực tế.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
1. Admin có thể cấu hình chọn theo 4 chế độ nguồn dữ liệu rõ ràng. Phần chọn danh mục hiển thị kèm số lượng sản phẩm Active của danh mục đó.
2. Khi chọn chế độ sản phẩm (Auto/Manual), phần cấu hình chọn danh mục thủ công bị ẩn và hệ thống tự gôm danh mục từ sản phẩm đã chọn để hiển thị thành các tab.
3. Không còn input nhập số lượng thủ công. Số lượng sản phẩm tối đa luôn bằng `desktopColumns * desktopRows`.
4. Bảng chọn sản phẩm thủ công hỗ trợ lọc danh mục nhanh và hiển thị rõ chỉ báo lỗi sản phẩm (hết hàng, thiếu ảnh, thiếu giá).
5. Thanh trượt danh mục ở cả Preview lẫn storefront thực tế hoạt động mượt mà, tự ẩn hiện nút Prev/Next và có gradient mờ ở 2 cạnh khi có thể cuộn.
6. Empty State hiển thị thông tin trực quan và có nút điều hướng thông minh.
7. TypeScript hoàn toàn thông qua, không có lỗi biên dịch.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Trung bình. Vì thay đổi logic gôm tab và cách truy vấn sản phẩm của component `ProductGrid` trên storefront, cần đảm bảo các trang đang dùng component này không bị vỡ giao diện. Sử dụng các phương án fallback an toàn nếu cấu hình cũ chưa có `desktopRows` hoặc `selectionMode` mới.
* **Hoàn tác**: Sử dụng git rollback về commit `99c8966c` nếu phát hiện lỗi nghiêm trọng.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thiết kế lại các trang chi tiết sản phẩm hoặc trang thanh toán.
* Sửa đổi các component homepage khác ngoài `ProductGrid`.

---

# XII. Open Questions (Câu hỏi mở)
*Không có câu hỏi mở.*
