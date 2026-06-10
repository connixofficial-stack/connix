# I. Primer

## 1. TL;DR kiểu Feynman
*   **Vấn đề:** Người dùng muốn có khả năng tùy chỉnh linh hoạt khoảng cách (spacing) của Highlights khi hiển thị ở cột phải của trang chi tiết sản phẩm và trang preview admin, thay vì cố định một khoảng cách lớn như hiện tại.
*   **Giải pháp:** Thêm một trường cấu hình `highlightsSpacing` trong trang quản lý Admin với 3 mức độ:
    *   **Nhiều** (khoảng cách hiện tại, `!mt-8 md:!mt-10`).
    *   **Ít** (bằng một nửa của Nhiều, `!mt-4 md:!mt-5`).
    *   **Bỏ** (không áp dụng khoảng cách đặc biệt, `!mt-0`).
*   **Kết quả:** Admin có thể điều khiển chính xác khoảng cách Highlights theo ý muốn thông qua menu cấu hình trong trang quản lý.

## 2. Elaboration & Self-Explanation
Chúng ta sẽ bổ sung thuộc tính cấu hình `highlightsSpacing?: 'low' | 'high' | 'none'` vào cấu hình UI chi tiết sản phẩm `product_detail_ui`.
*   Giá trị mặc định là `'high'` (tương đương với mức "Nhiều" - khoảng cách 32px/40px hiện tại).
*   Khi chọn mức "Ít" (`'low'`), khoảng cách margin-top của Highlights ở cột phải sẽ là `!mt-4 md:!mt-5` (16px/20px - bằng đúng một nửa của Nhiều).
*   Khi chọn mức "Bỏ" (`'none'`), khoảng cách margin-top sẽ được reset về `!mt-0` (0px).
Chúng ta sẽ tạo ra một hàm helper trả về class CSS tương ứng dựa trên cấu hình:
```typescript
const getHighlightsSpacingClass = (spacing?: 'low' | 'high' | 'none') => {
  if (spacing === 'none') return '!mt-0';
  if (spacing === 'low') return '!mt-4 md:!mt-5';
  return '!mt-8 md:!mt-10'; // 'high' hoặc mặc định
};
```
Hàm này sẽ được áp dụng cho block Highlights ở cột phải ở cả 4 layouts (Classic, Modern, Minimal, Premium) trong cả trang hiển thị chính thức (`ProductDetailPage.tsx`) và trang preview admin (`ProductDetailPreview.tsx`).

## 3. Concrete Examples & Analogies
*   **Ví dụ thực tế:** Trong trang cấu hình, admin chuyển đổi giữa 3 tùy chọn:
    *   Chọn "Nhiều": Khoảng cách từ các nút MXH đến Highlights là 32px (nhìn rất thoáng).
    *   Chọn "Ít": Khoảng cách giảm xuống còn 16px (vừa phải, cân đối nếu có ít phần tử khác).
    *   Chọn "Bỏ": Highlights dính sát lên trên (khoảng cách 0px).
*   **Analogy:** Giống như điều chỉnh vòi nước tắm. Thay vì chỉ có bật/tắt nước lạnh, bạn lắp thêm một bộ trộn điều khiển: nấc "Nóng nhiều" (khoảng cách lớn), nấc "Ấm vừa" (bằng một nửa nóng nhiều), và nấc "Tắt hoàn toàn" (khoảng cách 0).

# II. Audit Summary (Tóm tắt kiểm tra)
*   **Tệp tin liên quan:**
    *   [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx): Chứa cấu hình type, hook parse cấu hình và code render 4 style layout.
    *   [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx): Chứa code render preview của 4 style layout trong Admin.
    *   [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/product-detail/page.tsx): Chứa trang admin quản lý cấu hình.
*   **Hiện trạng:** Khoảng cách của Highlights cột phải đang được hardcode là `!mt-8 md:!mt-10` sau thay đổi trước.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc:** Chưa có trường dữ liệu cấu hình và UI để điều khiển động khoảng cách (spacing) này.
*   **Giả thuyết đối chứng:** Nếu chỉ thay đổi cứng thành một nửa khoảng cách (`!mt-4`), những khách hàng muốn khoảng cách rộng rãi sẽ không thể tùy chỉnh được. Do đó, việc cung cấp tùy chọn "Nhiều", "Ít", "Bỏ" là phương án linh hoạt, đáp ứng mọi nhu cầu thiết kế.

# IV. Proposal (Đề xuất)
1.  **Cập nhật cấu hình và Admin UI ([page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/product-detail/page.tsx)):**
    *   Thêm `highlightsSpacing?: 'low' | 'high' | 'none'` vào `ProductDetailExperienceConfig` và `DEFAULT_CONFIG` (mặc định `'high'`).
    *   Bổ sung điều khiển `SelectRow` trong `renderHighlightsControls` ngay dưới điều khiển vị trí:
        *   Nhãn: **Khoảng cách cột phải**
        *   Lựa chọn: "Nhiều (Mặc định)" (`high`), "Ít (Bằng một nửa)" (`low`), "Bỏ (Không khoảng cách)" (`none`).
        *   Điều kiện hiển thị: Chỉ hiển thị khi cấu hình vị trí Highlights là ở cột phải (`highlightsPosition === 'info_column'`).
    *   Truyền `highlightsSpacing` từ config qua hàm `getPreviewProps` để cấp cho Preview.
2.  **Cập nhật Detail Page ([ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx)):**
    *   Thêm `highlightsSpacing?: 'low' | 'high' | 'none'` vào type và hook `useProductDetailExperienceConfig`.
    *   Truyền prop `highlightsSpacing` xuống 4 style components.
    *   Sử dụng hàm helper `getHighlightsSpacingClass` để áp dụng class margin động cho block Highlights cột phải ở cả 4 style.
3.  **Cập nhật Preview ([ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx)):**
    *   Nhận thêm prop `highlightsSpacing`.
    *   Sử dụng hàm helper `getHighlightsSpacingClass` tương tự để cập nhật các block Highlights cột phải trong preview.

# V. Files Impacted (Tệp bị ảnh hưởng)
*   [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx)
    *   *Sửa:* Cập nhật type `ProductDetailExperienceConfig`, hook parse và logic render class margin động của Highlights cột phải ở 4 styles.
*   [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx)
    *   *Sửa:* Cập nhật props nhận vào, logic render class margin động của Highlights cột phải ở 4 styles trong preview.
*   [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/product-detail/page.tsx)
    *   *Sửa:* Cập nhật type, `DEFAULT_CONFIG`, `getPreviewProps`, và render thêm `SelectRow` điều khiển khoảng cách trong `renderHighlightsControls`.

# VI. Execution Preview (Xem trước thực thi)
1.  Đọc và cập nhật [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/product-detail/page.tsx) để hỗ trợ cấu hình và điều khiển UI mới.
2.  Cập nhật [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx) để parse cấu hình và render động.
3.  Cập nhật [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx) để hỗ trợ preview động.
4.  Typecheck TypeScript toàn bộ dự án.

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Kiểm tra tĩnh (Static Review):
*   Chạy typecheck `bunx tsc --noEmit`.

### Kiểm tra thủ công (Manual Verification):
*   Truy cập trang Admin `/system/experiences/product-detail`.
*   Chọn vị trí Highlights là "Cột phải", sau đó đổi "Khoảng cách cột phải" qua các mức "Nhiều", "Ít", "Bỏ".
*   Quan sát sự thay đổi khoảng cách theo thời gian thực trên màn hình Preview của cả 4 layouts.
*   Nhấn Lưu và kiểm tra trên trang sản phẩm thực tế `/products/[slug]`.

# VIII. Todo
*   [ ] Cập nhật cấu hình và UI Admin trong [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/product-detail/page.tsx).
*   [ ] Cập nhật parser config và style rendering trong [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx).
*   [ ] Cập nhật preview rendering trong [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
*   **Tiêu chí 1 (Pass):** Thêm thành công tùy chọn "Khoảng cách cột phải" trong Admin với 3 options "Nhiều", "Ít", "Bỏ". Tùy chọn này chỉ hiện khi Highlights ở cột phải.
*   **Tiêu chí 2 (Pass):** Khi chọn "Nhiều", khoảng cách margin-top là `!mt-8 md:!mt-10` (hiện tại).
*   **Tiêu chí 3 (Pass):** Khi chọn "Ít", khoảng cách margin-top giảm đi một nửa còn `!mt-4 md:!mt-5`.
*   **Tiêu chí 4 (Pass):** Khi chọn "Bỏ", khoảng cách margin-top biến mất (`!mt-0`).
*   **Tiêu chí 5 (Pass):** Mọi thứ thay đổi được phản chiếu tức thì trên Preview Admin và trang chi tiết sản phẩm chính thức sau khi lưu.
*   **Tiêu chí 6 (Pass):** Không lỗi typecheck.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
*   *Không có rủi ro lớn.* Hoàn tác dễ dàng qua Git revert.
