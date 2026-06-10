# I. Primer

## 1. TL;DR kiểu Feynman
*   **Vấn đề:** Khi cấu hình phần Highlights (các cam kết như giao hàng nhanh, bảo hành) hiển thị ở cột thông tin bên phải (cột phải), nó bị dính sát sạt vào các nút liên hệ mạng xã hội và các thành phần phía trên.
*   **Nguyên nhân:** Lớp container cha của cột phải sử dụng class `space-y-*` (ví dụ `space-y-4` hay `space-y-3`) của Tailwind. Class này ép khoảng cách `margin-top` của tất cả các phần tử con trực tiếp về một giá trị cố định (12px hoặc 16px) và ghi đè hoàn toàn class `mt-6 md:mt-8` trên block Highlights (do specificity của selector `space-y-` cao hơn).
*   **Giải pháp:** Sử dụng prefix `!` (important) trong Tailwind (`!mt-8 md:!mt-10`) cho block Highlights khi hiển thị ở cột phải ở cả 4 layout (Classic, Modern, Minimal, Premium) trên trang chi tiết chính thức và trang xem trước (preview) để ép trình duyệt áp dụng khoảng cách 32px rộng rãi, thoáng mát. Đồng thời thêm `pb-2` cho block nút MXH để tối ưu khoảng cách khi các nút bị rớt dòng.

## 2. Elaboration & Self-Explanation
Trong lập trình CSS và Tailwind CSS, lớp tiện ích `space-y-[value]` hoạt động bằng cách áp dụng một selector con trực tiếp: `> * + * { margin-top: [value] }`.
Selector này có độ ưu tiên (specificity) cao hơn so với một selector class đơn lẻ như `.mt-6`. Do đó, bất kể nhà phát triển khai báo class `mt-6` (24px) hay `md:mt-8` (32px) trên thẻ div Highlights, trình duyệt vẫn áp dụng `margin-top` do `space-y-` quy định (chỉ khoảng 12px đến 16px).
Khi kết hợp với phần nút MXH ở phía trên (có tính năng flex-wrap khiến các nút rớt dòng và không có padding bottom), khoảng cách thực tế giữa các nút bấm MXH dòng cuối và hộp Highlights bị thu hẹp lại chỉ còn vài pixel, gây ra hiện tượng "dính sát" cực kỳ khó chịu về mặt thị giác.
Bằng cách thêm dấu chấm than `!` vào trước class margin của Highlights (thành `!mt-8 md:!mt-10`), Tailwind sẽ sinh ra thuộc tính có kèm `!important`, giúp ghi đè hoàn toàn selector của `space-y-` và trả lại khoảng cách 32px rộng rãi chuẩn thiết kế cao cấp.

## 3. Concrete Examples & Analogies
*   **Ví dụ thực tế:** Trên màn hình điện thoại hoặc máy tính, khi admin cấu hình Highlights ở cột phải, các nút Facebook, Zalo, Youtube xếp thành 2 dòng. Ngay dưới dòng Youtube/TikTok, hộp Highlights màu xanh nhạt dính sát vào nút TikTok chỉ cách khoảng 4px. Sau khi áp dụng `!mt-8 md:!mt-10`, hộp Highlights tự động đẩy xuống dưới, tạo ra một khoảng trống 32px (khoảng 2 ngón tay trên màn hình điện thoại) giúp mắt người đọc dễ chịu và phân biệt rõ ràng hai phần chức năng khác nhau.
*   **Analogy:** Giống như bạn đang xếp hàng mua vé. Ban tổ chức quy định mọi người phải đứng cách nhau 1 mét (`space-y-4`). Nhưng bạn mang theo một chiếc xe đẩy cồng kềnh (hộp Highlights) và cần đứng cách người phía trước ít nhất 2 mét (`mt-8`) để không đụng vào họ. Bạn phải đeo một tấm biển "ƯU TIÊN ĐẶC BIỆT" (`!important`) để mọi người và bảo vệ chấp nhận cho bạn đứng lùi lại 2 mét, thay vì ép bạn tuân theo quy định chung 1 mét.

# II. Audit Summary (Tóm tắt kiểm tra)
*   **Tệp tin liên quan:**
    *   [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx): Quản lý hiển thị chi tiết sản phẩm chính thức.
    *   [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx): Quản lý hiển thị xem trước (preview) cấu hình trong trang admin.
*   **Hiện trạng:** Cả hai file đều sử dụng class `space-y-` cho cột bên phải ở cả 4 layouts (Classic, Modern, Minimal, Premium) và render Highlights ở cột phải bị ghi đè margin.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc:** Lớp container cha của cột phải áp dụng class `space-y-` làm ghi đè lớp margin-top `mt-6 md:mt-8` của block Highlights.
*   **Giả thuyết đối chứng:** Nếu chỉ tăng `space-y-` của container cha lên `space-y-8`, toàn bộ các phần tử khác (như khoảng cách giữa Tên sản phẩm, Giá, Nút mua hàng) cũng sẽ bị giãn cách quá rộng và làm mất đi thiết kế chặt chẽ ban đầu. Việc sử dụng `!mt-8 md:!mt-10` cục bộ trên Highlights là giải pháp tối ưu nhất, chỉ tác động đúng nơi cần tác động mà không làm ảnh hưởng đến các phần tử khác.

# IV. Proposal (Đề xuất)
1.  **Cập nhật [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx):**
    *   **ClassicStyle:** Thay class `mt-6 md:mt-8 mb-8` bằng `!mt-8 md:!mt-10 mb-8` ở block Highlights cột phải.
    *   **ModernStyle:** Thay class `mt-6 md:mt-8 mb-6` bằng `!mt-8 md:!mt-10 mb-6` ở block Highlights cột phải.
    *   **MinimalStyle:** Thay class `mt-6 md:mt-8 mb-6` bằng `!mt-8 md:!mt-10 mb-6` ở block Highlights cột phải.
    *   **PremiumStyle:** Thay class `mt-6 md:mt-8` bằng `!mt-8 md:!mt-10` ở block Highlights cột phải.
    *   **ProductSocialButtons:** Thêm class `pb-2` vào wrapper div để tạo khoảng đệm phía dưới các nút MXH phòng trường hợp các nút rớt dòng.
2.  **Cập nhật [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx):**
    *   Áp dụng thay đổi tương tự cho 4 layout (Classic, Modern, Minimal, Premium) ở block Highlights cột phải (sử dụng `!mt-8 md:!mt-10`).
    *   **PreviewSocialButtons:** Thêm class `pb-2` tương tự.

# V. Files Impacted (Tệp bị ảnh hưởng)
*   [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx)
    *   *Sửa:* Sửa class của block Highlights ở cột phải của cả 4 layouts để bổ sung `!important` cho margin-top. Thêm `pb-2` cho `ProductSocialButtons`.
*   [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx)
    *   *Sửa:* Sửa class của block Highlights ở cột phải của cả 4 layouts trong preview. Thêm `pb-2` cho `PreviewSocialButtons`.

# VI. Execution Preview (Xem trước thực thi)
1.  Chỉnh sửa file `ProductDetailPage.tsx`.
2.  Chỉnh sửa file `ProductDetailPreview.tsx`.
3.  Chạy kiểm tra tĩnh TypeScript bằng `bunx tsc --noEmit` để đảm bảo không có lỗi type.
4.  Tự review tĩnh.

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Kiểm tra tĩnh (Static Review):
*   Chạy typecheck `bunx tsc --noEmit` để đảm bảo code sạch lỗi type.
*   Grep kiểm tra xem toàn bộ các điểm render Highlights ở cột phải đã được cập nhật class `!mt-8` hay chưa.

### Kiểm tra thủ công (Manual Verification):
*   Truy cập trang cấu hình admin `/system/experiences/product-detail`, chọn hiển thị Highlights ở cột phải và kiểm tra trên cả 4 layouts xem khoảng cách đã thoáng đãng, không bị dính sát vào các nút MXH hay không.

# VIII. Todo
*   [ ] Sửa đổi block Highlights cột phải và `ProductSocialButtons` trong [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx).
*   [ ] Sửa đổi block Highlights cột phải và `PreviewSocialButtons` trong [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
*   **Tiêu chí 1 (Pass):** Block Highlights khi hiển thị ở cột phải ở cả 4 layouts (Classic, Modern, Minimal, Premium) trên cả trang chi tiết sản phẩm chính thức và trang preview admin đều được cách giãn rõ ràng với các nút bấm phía trên (khoảng cách tối thiểu 32px), không bị dính sát.
*   **Tiêu chí 2 (Pass):** Khi không có Highlights hoặc Highlights được chuyển sang cột trái, khoảng cách giữa các phần tử còn lại vẫn tự nhiên, không bị hở quá mức.
*   **Tiêu chí 3 (Pass):** Không có lỗi cú pháp hoặc lỗi biên dịch TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
*   **Rủi ro:** Không có rủi ro đáng kể vì đây chỉ là thay đổi CSS cục bộ và sử dụng important class chuẩn của Tailwind.
*   **Hoàn tác:** Sử dụng `git checkout` để khôi phục trạng thái cũ của hai file đã sửa đổi.

# XI. Out of Scope (Ngoài phạm vi)
*   Không thay đổi logic nghiệp vụ (business logic) của Highlights hay Social buttons.
*   Không chỉnh sửa các trang web khác ngoài trang chi tiết sản phẩm và trang preview admin.
