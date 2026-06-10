# I. Primer

## 1. TL;DR kiểu Feynman
*   **Vấn đề:** Phần "Highlights" (Tính năng nổi bật - ví dụ: Giao hàng nhanh, Bảo hành chính hãng) ở trang chi tiết sản phẩm của 3 giao diện Classic, Modern, Minimal đang nằm ở cột thông tin bên phải và dính quá sát với các nút bấm.
*   **Giải pháp:** Cho phép người dùng cấu hình vị trí hiển thị của Highlights trong trang quản lý (Admin). Họ có thể chọn đặt nó ở dưới cột thông tin sản phẩm (cột phải) hoặc đặt dưới chân ảnh sản phẩm (cột trái). Áp dụng cho cả 4 layout: Classic, Modern, Minimal, và Premium.
*   **Kết quả:** Giao diện chi tiết sản phẩm sẽ cân đối hơn, thông tin nổi bật được hiển thị rõ ràng ngay dưới ảnh sản phẩm mà không làm rối mắt hay đè nén các nút bấm hành động ở cột bên phải.

## 2. Elaboration & Self-Explanation
Trang chi tiết sản phẩm hiện có 4 phong cách hiển thị (Layout Styles): Classic, Modern, Minimal, Premium. 
Ở 3 layout đầu (Classic, Modern, Minimal), phần Highlights đang được hiển thị cố định ở cột thông tin bên phải (dưới nút Mua ngay / Giỏ hàng / Mạng xã hội). Điều này tạo cảm giác chật chội và làm cột bên phải quá dài, trong khi cột bên trái (chứa ảnh sản phẩm) lại bị trống trải ở phía dưới.
Bằng cách thêm một thuộc tính cấu hình là `highlightsPosition` vào đối tượng cấu hình trải nghiệm `product_detail_ui` với hai giá trị `'info_column'` (mặc định cũ) và `'image_column'` (dưới chân ảnh sản phẩm), admin có thể chủ động chuyển đổi vị trí hiển thị.
Khi cấu hình chọn `'image_column'`, phần Highlights sẽ được di chuyển sang cột bên trái và render ngay dưới vùng hiển thị ảnh sản phẩm cùng thumbnail. Điều này giúp tận dụng không gian trống dưới ảnh và làm nổi bật các cam kết dịch vụ/sản phẩm ngay khi người dùng xem ảnh.

## 3. Concrete Examples & Analogies
*   **Ví dụ thực tế:** Trên một trang bán rượu Yamazaki, ảnh chai rượu nằm ở bên trái chiếm 50% chiều ngang màn hình desktop, còn cột bên phải chứa tên, giá, nút chọn dung tích và nút "Liên hệ". Nếu đặt 3 khối Highlights "Giao nhanh", "Bảo hành", "Đổi trả" ở ngay dưới nút "Liên hệ", chúng sẽ bị dính sát vào nút liên hệ tạo cảm giác ngột ngạt. Khi chuyển sang dưới chân ảnh chai rượu Yamazaki bên trái, giao diện sẽ thoáng hơn rất nhiều và nhìn cực kỳ premium giống các trang thương mại điện tử lớn.
*   **Analogy:** Giống như việc bạn bày một đĩa thức ăn. Thay vì xếp tất cả các món ăn phụ chồng chất lên góc của món chính (cột phải), bạn xếp các món phụ trang trí sang một chiếc đĩa nhỏ riêng đặt ngay cạnh đĩa món chính (dưới ảnh sản phẩm), giúp tổng thể mâm cơm trông gọn gàng, đẹp mắt và sang trọng hơn.

# II. Audit Summary (Tóm tắt kiểm tra)
*   **Tệp tin liên quan:** 
    *   [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx): Chứa mã nguồn hiển thị của cả 4 layout sản phẩm (`ClassicStyle`, `ModernStyle`, `MinimalStyle`, `PremiumStyle`).
    *   [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/product-detail/page.tsx): Chứa trang admin quản lý cấu hình giao diện chi tiết sản phẩm.
*   **Cấu trúc dữ liệu hiện tại:** Cấu hình được lưu trong bảng `settings` thông qua Convex với key `product_detail_ui`.
*   **Khả năng tương thích:** Việc thêm trường mới `highlightsPosition` vào config JSON không làm ảnh hưởng đến dữ liệu cũ, chỉ cần fallback về vị trí cũ hoặc vị trí mong muốn mới nếu thuộc tính này chưa tồn tại.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc:** Phần Highlights ở 3 layout Classic, Modern, Minimal được hardcode nằm ở cuối cột thông tin (cột phải), không có cơ chế tùy chỉnh linh hoạt và thiếu padding/margin hợp lý dẫn đến tình trạng dính quá sát vào các thành phần phía trên.
*   **Giả thuyết đối chứng:** Nếu chỉ tăng margin-top của Highlights ở cột phải, giao diện vẫn sẽ bị mất cân đối chiều dài giữa 2 cột (cột phải quá dài và cột trái quá ngắn). Chuyển Highlights sang dưới chân ảnh sản phẩm là phương án tối ưu nhất để cân bằng thị giác.

# IV. Proposal (Đề xuất)
1.  **Cập nhật kiểu dữ liệu cấu hình (Configuration Type):**
    Thêm thuộc tính `highlightsPosition?: 'info_column' | 'image_column'` vào `ProductDetailExperienceConfig` ở cả file frontend hiển thị và file quản lý admin.
2.  **Cập nhật Trang quản lý Admin:**
    *   Thêm một điều khiển `SelectRow` trong card quản lý Highlights để admin chọn vị trí hiển thị: "Dưới thông tin sản phẩm (cột phải)" hoặc "Dưới ảnh sản phẩm (cột trái)".
    *   Lưu cấu hình mới này vào cơ sở dữ liệu qua Convex mutation.
3.  **Cập nhật 4 Layouts hiển thị chi tiết sản phẩm:**
    *   **ClassicStyle:**
        *   Ẩn Highlights ở cột phải nếu `highlightsPosition === 'image_column'`.
        *   Render Highlights dưới thumbnail rail ở cột trái nếu `highlightsPosition === 'image_column'`.
    *   **ModernStyle:**
        *   Ẩn Highlights ở cột phải nếu `highlightsPosition === 'image_column'`.
        *   Render Highlights dưới thumbnail rail ở cột trái nếu `highlightsPosition === 'image_column'`.
    *   **MinimalStyle:**
        *   Ẩn Highlights ở cột phải nếu `highlightsPosition === 'image_column'`.
        *   Render Highlights dưới khu vực ảnh sản phẩm (bên trong block sticky) ở cột trái nếu `highlightsPosition === 'image_column'`.
    *   **PremiumStyle:**
        *   Hiện tại PremiumStyle mặc định render dưới ảnh. Cập nhật để hỗ trợ hiển thị ở cột phải nếu chọn `info_column`, và giữ nguyên vị trí dưới ảnh nếu chọn `image_column` (hoặc undefined).

# V. Files Impacted (Tệp bị ảnh hưởng)
*   [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx)
    *   *Vai trò hiện tại:* Render giao diện chi tiết sản phẩm.
    *   *Thay đổi:* Cập nhật type `ProductDetailExperienceConfig`, truyền `highlightsPosition` xuống các Style component và cập nhật logic render Highlights ở cả 4 layout theo cấu hình vị trí.
*   [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/product-detail/page.tsx)
    *   *Vai trò hiện tại:* Quản lý cấu hình giao diện trong admin.
    *   *Thay đổi:* Cập nhật type `ProductDetailExperienceConfig` và `DEFAULT_CONFIG`, bổ sung điều khiển chọn vị trí hiển thị Highlights trong UI admin.

# VI. Execution Preview (Xem trước thực thi)
1.  Đọc và chỉnh sửa [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx) để bổ sung `highlightsPosition` vào type và hook parsing.
2.  Chỉnh sửa logic render Highlights của `ClassicStyle`, `ModernStyle`, `MinimalStyle`, `PremiumStyle` trong file này.
3.  Đọc và chỉnh sửa [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/product-detail/page.tsx) trong admin để thêm control `SelectRow` cho vị trí Highlights.
4.  Thực hiện review tĩnh mã nguồn.

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Kiểm tra tĩnh (Static Review):
*   Chạy typecheck bằng lệnh `bunx tsc --noEmit` để đảm bảo không bị lỗi TypeScript.
*   Sử dụng compiler/IDE kiểm tra các trường truyền nhận props đầy đủ.

### Kiểm tra thủ công (Manual Verification):
*   Tester / User truy cập vào trang Admin `/system/experiences/product-detail` để kiểm tra xem có xuất hiện ô lựa chọn "Vị trí hiển thị" của Highlights hay không. Thử chuyển đổi giữa 2 vị trí và lưu lại.
*   Truy cập trang chi tiết sản phẩm thực tế và kiểm tra giao diện trên cả 4 layout:
    *   Classic Layout: Highlights hiển thị đúng dưới ảnh sản phẩm (cột trái) khi chọn `image_column` và ở cột phải khi chọn `info_column`.
    *   Modern Layout: Tương tự.
    *   Minimal Layout: Tương tự.
    *   Premium Layout: Tương tự.

# VIII. Todo
*   [ ] Cập nhật `ProductDetailExperienceConfig` và logic parse config trong [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx).
*   [ ] Cập nhật render Highlights trong `ClassicStyle`.
*   [ ] Cập nhật render Highlights trong `ModernStyle`.
*   [ ] Cập nhật render Highlights trong `MinimalStyle`.
*   [ ] Cập nhật render Highlights trong `PremiumStyle`.
*   [ ] Cập nhật `ProductDetailExperienceConfig`, `DEFAULT_CONFIG` và UI chỉnh sửa trong [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/product-detail/page.tsx).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
*   **Tiêu chí 1 (Pass):** Thêm thành công tùy chọn "Vị trí hiển thị" (Highlights Position) trong Admin với 2 options: "Dưới thông tin sản phẩm (cột phải)" và "Dưới ảnh sản phẩm (cột trái)".
*   **Tiêu chí 2 (Pass):** Khi chọn "Dưới ảnh sản phẩm (cột trái)", phần Highlights phải xuất hiện ngay bên dưới ảnh sản phẩm/thumbnail ở cả 4 layout (Classic, Modern, Minimal, Premium) trên màn hình chi tiết sản phẩm thực tế, đồng thời ẩn ở cột phải.
*   **Tiêu chí 3 (Pass):** Khi chọn "Dưới thông tin sản phẩm (cột phải)", phần Highlights phải xuất hiện ở cột thông tin bên phải (vị trí cũ) và ẩn dưới chân ảnh sản phẩm.
*   **Tiêu chí 4 (Pass):** Không làm vỡ layout, không lỗi TypeScript khi biên dịch.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
*   **Rủi ro:** Một số màn hình có thể bị lệch khoảng cách (margin) khi chuyển vị trí Highlights.
*   **Cách khắc phục:** Sử dụng các class Tailwind phù hợp để tạo khoảng cách hợp lý (`mt-4`, `mb-6`...) tùy thuộc vào từng layout.
*   **Hoàn tác:** Dùng lệnh Git checkout hoặc revert các file đã sửa đổi về trạng thái trước đó.

# XI. Out of Scope (Ngoài phạm vi)
*   Chỉnh sửa các tính năng khác của trang chi tiết sản phẩm không liên quan đến Highlights (như Combo, Variants selector logic, Add to cart logic...).
*   Thay đổi các icons hay text của Highlights (đã có tính năng sửa nội dung Highlights sẵn rồi).
