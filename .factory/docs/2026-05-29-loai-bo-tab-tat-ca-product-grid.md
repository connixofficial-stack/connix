# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Giao diện cũ của bộ lọc sản phẩm trong Product Grid hiển thị một nút có tên "Tất cả" (All) ở đầu thanh trượt tab. Thiết kế này vừa chiếm không gian vừa không thực sự cần thiết, vì trạng thái mặc định ban đầu khi chưa chọn gì vốn dĩ đã là hiển thị tất cả sản phẩm rồi. Hơn nữa, khi đã click chọn một tab danh mục cụ thể (ví dụ: Nike), người dùng không có cách nào click lại để bỏ chọn (deselect) quay về trạng thái hiển thị tất cả, mà bắt buộc phải di chuột click vào nút "Tất cả".
* **Giải pháp**: 
  a) Loại bỏ hoàn toàn nút "Tất cả" ra khỏi thanh trượt tab danh mục.
  b) Sửa đổi logic click chọn tab: Khi người dùng click vào một tab danh mục bất kỳ đang được chọn, hệ thống sẽ tự động bỏ chọn (deselect) danh mục đó, đưa trạng thái được chọn về trống (`null`), từ đó khôi phục hiển thị toàn bộ sản phẩm của các danh mục/sản phẩm đã cấu hình.
  c) Thiết lập trạng thái hiển thị mặc định khi không chọn tab nào luôn là toàn bộ sản phẩm.

## 2. Elaboration & Self-Explanation
Thanh trượt tab danh mục (`CategoryTabSlider`) là một component dùng chung được sử dụng trong cả giao diện Xem trước ở Admin (`ProductGridPreview`) và giao diện hiển thị thực tế của khách hàng ngoài Storefront (`ProductGridSection`). 
Hiện tại, cả hai giao diện này đều truyền prop `showAllTab={true}` vào `<CategoryTabSlider>`, dẫn tới việc thanh trượt luôn có một tab "Tất cả" nằm ở vị trí đầu tiên. 
Đồng thời, hàm callback khi đổi tab (`onTabChange`) đang được gán trực tiếp bằng state setter (`setActiveTab` ở Admin và `setActiveTabId` ở Storefront). Cách gán trực tiếp này chỉ hỗ trợ hành động "chọn một giá trị mới", chứ không hỗ trợ hành động "bỏ chọn giá trị cũ khi click lại".
Bằng cách thay đổi prop `showAllTab` thành `false` và cải tiến hàm callback `onTabChange` thành một hàm kiểm tra: "Nếu tab được click trùng với tab đang hoạt động thì đặt trạng thái về `null`, ngược lại thì chọn tab đó", chúng ta vừa loại bỏ được tab thừa, vừa đem lại trải nghiệm tương tác mượt mờ và trực quan (Click để chọn, click lại lần nữa để bỏ chọn).

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Bạn có 3 danh mục sản phẩm: "Giày Nike", "Giày Adidas" và "Giày Puma" trong cấu hình Product Grid.
  * *Trước khi sửa đổi*: Trên thanh tab hiển thị: `[Tất cả] [Giày Nike] [Giày Adidas] [Giày Puma]`. Mặc định hiển thị toàn bộ sản phẩm. Nếu bạn click vào `[Giày Nike]`, giao diện lọc và hiển thị chỉ giày Nike. Để xem lại toàn bộ, bạn phải click vào `[Tất cả]`.
  * *Sau khi sửa đổi*: Trên thanh tab hiển thị: `[Giày Nike] [Giày Adidas] [Giày Puma]`. Mặc định hiển thị toàn bộ sản phẩm. Khi bạn click vào `[Giày Nike]`, giao diện lọc và chỉ hiển thị giày Nike (tab `[Giày Nike]` sáng lên). Khi bạn click lại vào `[Giày Nike]`, tab này tắt đi, trạng thái trở về trống, giao diện khôi phục hiển thị toàn bộ sản phẩm.
* **Hình ảnh tương tự đời thường**: Giống như việc bạn nhấn một công tắc đèn có nhiều nút chọn chế độ màu. Nếu không nhấn nút nào thì đèn sáng trắng tự nhiên (mặc định hiển thị tất cả). Bạn nhấn nút "Màu vàng", đèn chuyển sang vàng. Bạn nhấn nút "Màu vàng" một lần nữa, nút nảy lên trở lại trạng thái ban đầu và đèn quay về màu sáng trắng tự nhiên. Bạn không cần một nút riêng biệt tên là "Màu tự nhiên" để tắt màu vàng đi.

# II. Audit Summary (Tóm tắt kiểm tra)
* **CategoryTabSlider.tsx**: 
  * Định nghĩa prop `showAllTab` mặc định là `true` (dòng 29).
  * Chứa logic render tab "Tất cả" bằng cách nối thêm tùy chọn `{ id: 'all-tabs-option', name: allTabLabel }` vào danh sách tabs (dòng 99).
* **ProductGridPreview.tsx**:
  * Chứa 4 vị trí render `<CategoryTabSlider>` đều được set cứng `showAllTab={true}`.
  * State active tab là `activeTab` (mặc định: `null`).
  * Logic lọc `filteredItems` sử dụng `activeTab`: nếu `!activeTab` trả về toàn bộ `items`.
  * Hàm callback đổi tab là `onTabChange={setActiveTab}`.
* **ProductGridSection.tsx**:
  * Chứa 4 vị trí render `<CategoryTabSlider>` đều được set cứng `showAllTab={true}`.
  * State active tab là `activeTabId` (mặc định: `null`).
  * Logic lọc `products` sử dụng `activeTabId`: nếu `!activeTabId` trả về toàn bộ `allProducts`.
  * Hàm callback đổi tab là `onTabChange={setActiveTabId}`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause Confidence**: **High** (Độ tin cậy cực cao).
* **Nguyên nhân gốc**: Cấu hình `showAllTab={true}` được truyền cứng vào tất cả các component con, đồng thời hàm callback `onTabChange` chưa xử lý toggle deselect về `null`.
* **Giả thuyết đối chứng**: Nếu chỉ ẩn nút "Tất cả" mà không thay đổi logic `onTabChange`, người dùng sau khi chọn một danh mục sẽ bị "mắc kẹt" ở danh mục đó và không bao giờ quay lại xem được toàn bộ sản phẩm nữa do không có nút deselect. Do đó, việc ẩn nút "Tất cả" bắt buộc phải đi kèm với logic toggle deselect ở hàm callback.

# IV. Proposal (Đề xuất)
* **Sửa đổi CategoryTabSlider.tsx**: Đổi giá trị mặc định của `showAllTab` từ `true` thành `false` để tăng tính nhất quán và gọn nhẹ.
* **Sửa đổi ProductGridPreview.tsx**:
  a) Truyền `showAllTab={false}` cho tất cả các vị trí render `<CategoryTabSlider>`.
  b) Sửa đổi `onTabChange={setActiveTab}` thành `onTabChange={(tabId) => setActiveTab(tabId === activeTab ? null : tabId)}`.
* **Sửa đổi ProductGridSection.tsx**:
  a) Truyền `showAllTab={false}` cho tất cả các vị trí render `<CategoryTabSlider>`.
  b) Sửa đổi `onTabChange={setActiveTabId}` thành `onTabChange={(tabId) => setActiveTabId(tabId === activeTabId ? null : tabId)}`.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [CategoryTabSlider.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/shared/CategoryTabSlider.tsx) - Cập nhật giá trị mặc định của `showAllTab` thành `false`.
* **Sửa**: [ProductGridPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/_components/ProductGridPreview.tsx) - Ẩn tab "Tất cả" và cập nhật logic deselect cho Preview ở trang quản trị.
* **Sửa**: [ProductGridSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductGridSection.tsx) - Ẩn tab "Tất cả" và cập nhật logic deselect cho Storefront thực tế.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa `CategoryTabSlider.tsx` để đổi giá trị mặc định `showAllTab`.
2. Đọc và cập nhật logic trong `ProductGridPreview.tsx` (tất cả 4 vị trí render `CategoryTabSlider`).
3. Đọc và cập nhật logic trong `ProductGridSection.tsx` (tất cả 4 vị trí render `CategoryTabSlider`).
4. Kiểm tra phân tích tĩnh TypeScript (`tsc --noEmit`).

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra biên dịch tĩnh**: Chạy lệnh `bunx tsc --noEmit` để đảm bảo hệ thống type không phát sinh bất kỳ lỗi nào.
* **Xác minh trực quan**:
  * Truy cập trang Preview ở Admin và Storefront thực tế.
  * Đảm bảo nút "Tất cả" đã hoàn toàn biến mất.
  * Mặc định hiển thị đầy đủ sản phẩm.
  * Click vào tab "Giày Nike" -> hiển thị giày Nike.
  * Click lại tab "Giày Nike" -> tắt lựa chọn, quay về hiển thị đầy đủ sản phẩm.

# VIII. Todo
- [ ] Cập nhật `components/shared/CategoryTabSlider.tsx` (thay đổi giá trị mặc định `showAllTab = false`).
- [ ] Cập nhật `app/admin/home-components/product-grid/_components/ProductGridPreview.tsx` (loại bỏ `showAllTab={true}` hoặc thay bằng `showAllTab={false}`, thêm logic deselect).
- [ ] Cập nhật `components/site/ProductGridSection.tsx` (loại bỏ `showAllTab={true}` hoặc thay bằng `showAllTab={false}`, thêm logic deselect).
- [ ] Chạy `bunx tsc --noEmit` để xác thực hệ thống.
- [ ] Phát âm thanh thông báo hoàn thành task `"Done, Sir."`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Thanh tab slider của Product Grid trên toàn bộ site và preview không còn nút "Tất cả".
* Khi không chọn tab nào, mặc định là hiển thị toàn bộ sản phẩm.
* Click chọn tab -> hiển thị sản phẩm của tab đó. Click lại tab đó -> hủy chọn tab và hiển thị toàn bộ sản phẩm.
* Toàn bộ dự án build thành công không lỗi TypeScript hay linter.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Rất thấp. Việc thay đổi logic này chỉ tác động đến bộ chọn tab và cơ chế lọc ở Client, không ảnh hưởng đến schema, cơ sở dữ liệu hay API Convex.
* **Hoàn tác**: Sử dụng `git checkout` để rollback các file bị ảnh hưởng về trạng thái trước đó.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi cấu trúc dữ liệu của các component home-components khác ngoài `ProductGrid`.
* Refactor các Convex API hoặc UI không liên quan.
