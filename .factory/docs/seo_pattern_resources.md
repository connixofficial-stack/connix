# I. Primer

## 1. TL;DR kiểu Feynman
* Trang quản trị tài nguyên (`/admin/resources/create` và `/admin/resources/[id]/edit`) đang dùng một giao diện nhập SEO rất đơn giản và thô sơ (chỉ có 2 ô nhập văn bản).
* Trang quản trị sản phẩm (`/admin/products/create` và `/admin/products/[id]/edit`) lại có giao diện SEO rất xịn: có đếm số ký tự trực quan (cảnh báo đỏ khi vượt quá độ dài khuyến nghị) và khung xem trước (SERP Preview) giống như hiển thị trên Google Search.
* Nhiệm vụ của chúng ta là đưa giao diện SEO xịn từ trang sản phẩm sang trang tài nguyên để hệ thống đồng bộ và nhất quán.

## 2. Elaboration & Self-Explanation
* Khi người dùng tối ưu hóa công cụ tìm kiếm (SEO), việc biết độ dài của Meta Title (tối đa 60 ký tự) và Meta Description (tối đa 160 ký tự) là cực kỳ quan trọng. Nếu viết quá dài, nội dung sẽ bị Google cắt bớt bằng dấu ba chấm `...`.
* Bằng cách thêm bộ đếm ký tự và thay đổi màu sắc của bộ đếm sang màu đỏ khi vượt quá giới hạn, người quản trị sẽ nhận biết ngay lập tức để điều chỉnh.
* Khung hiển thị xem trước (Google Search Preview) giúp người dùng thấy trực quan kết quả sẽ hiển thị như thế nào trên công cụ tìm kiếm thực tế, bao gồm Tiêu đề, URL đường dẫn và phần mô tả tóm tắt, tự động lấy dữ liệu từ các trường thực tế (tiêu đề tài nguyên, danh mục, slug, mô tả ngắn) làm fallback nếu người dùng bỏ trống các ô SEO.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**:
  * Khi nhập tiêu đề tài nguyên là "Bộ tài liệu hướng dẫn học Next.js 15 từ cơ bản đến nâng cao cho người mới bắt đầu", tiêu đề này dài 84 ký tự.
  * Bộ đếm Meta Title sẽ hiện `84/60` với màu đỏ cảnh báo.
  * Khung xem trước sẽ hiển thị tiêu đề màu xanh dương và đường dẫn URL dạng `/hoc-nextjs/bo-tai-lieu-huong-dan-hoc-nextjs-15...` cùng phần mô tả ngắn bên dưới.
* **Hình ảnh ẩn dụ**: Nó giống như việc bạn viết một bức thư và hệ thống cung cấp cho bạn một chiếc phong bì kính để bạn nhìn thấy chính xác địa chỉ và tên người nhận có bị lệch hay bị che khuất trước khi gửi đi gửi lại.

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra tệp tin [resources/create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/create/page.tsx) dòng 216-234: Đang sử dụng Card SEO cơ bản, nhãn tiếng Việt "Tiêu đề SEO", "Mô tả SEO", không có bộ đếm và preview.
* Đã kiểm tra tệp tin [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx) dòng 331-349: Đang sử dụng Card SEO tương tự trang tạo mới, thiếu các tính năng đếm ký tự và preview.
* Đã đối chiếu với [products/create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/products/create/page.tsx) dòng 1498-1546 và [products/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/products/[id]/edit/page.tsx) dòng 1971-2019: Đã có sẵn cấu trúc SEO chuẩn hóa với `metaTitle.length/60`, `metaDescription.length/160`, và phần xem trước Google Search.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause Confidence**: High.
* **Nguyên nhân**: Module `resources` được phát triển sau hoặc chưa được cập nhật giao diện SEO theo tiêu chuẩn thiết kế mới của dự án vốn đã được áp dụng trên module `products`.
* **Giả thuyết đối chứng**: Việc giữ nguyên giao diện cũ không gây ra lỗi logic lưu trữ cơ sở dữ liệu vì schema của Convex đã hỗ trợ các trường `metaTitle` và `metaDescription`, nhưng nó tạo ra sự không đồng nhất về mặt trải nghiệm người dùng (UX) trên cùng một hệ thống quản trị (Admin Panel).

# IV. Proposal (Đề xuất)
* Áp dụng chính xác pattern hiển thị SEO từ trang quản trị sản phẩm sang trang quản trị tài nguyên:
  1. Thay đổi nhãn thành "Meta Title" và "Meta Description".
  2. Thêm bộ đếm ký tự bên góc phải của nhãn, chuyển màu đỏ nếu `length > 60` (đối với Title) và `length > 160` (đối với Description).
  3. Thêm khung hiển thị xem trước Google Search Preview sử dụng màu sắc chuẩn (`text-blue-600` cho tiêu đề, `text-emerald-600` cho URL, và `text-slate-600` cho mô tả).
  4. Sử dụng fallback tự động:
     * Tiêu đề: `metaTitle.trim() || title || 'Tiêu đề tài nguyên'`
     * URL: `/${categorySlugPreview || 'resources'}/${slug || 'tai-nguyen'}` (đối với trang tạo mới) và `/${selectedCategorySlug || 'resources'}/${slug || 'tai-nguyen'}` (đối với trang sửa đổi).
     * Mô tả: `metaDescription.trim() || stripHtml(excerpt || content || '') || 'Mô tả ngắn sẽ hiển thị tại đây.'`

# V. Files Impacted (Tệp bị ảnh hưởng)
* `Sửa`: [resources/create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/create/page.tsx)
  * Cập nhật block Card SEO để bổ sung bộ đếm ký tự và khung hiển thị xem trước Google Search.
* `Sửa`: [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx)
  * Cập nhật block Card SEO tương tự trang tạo mới để đồng bộ hóa giao diện chỉnh sửa tài nguyên.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và phân tích các đoạn mã liên quan đến SEO trong các tệp tài nguyên.
2. Cập nhật mã nguồn của tệp `app/admin/resources/create/page.tsx`.
3. Cập nhật mã nguồn của tệp `app/admin/resources/[id]/edit/page.tsx`.
4. Rà soát tĩnh (Static Review) để đảm bảo không có lỗi cú pháp hoặc thiếu biến (như `categorySlugPreview` hay `selectedCategorySlug`).

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kế hoạch kiểm chứng**:
  * Kiểm tra kiểu dữ liệu và build tĩnh của TypeScript bằng cách chạy lệnh kiểm tra lỗi type.
  * Đảm bảo giao diện không bị vỡ và các fallback hoạt động đúng như mong đợi.

# VIII. Todo
* [ ] Cập nhật phần SEO trong trang tạo mới tài nguyên ([resources/create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/create/page.tsx))
* [ ] Cập nhật phần SEO trong trang chỉnh sửa tài nguyên ([resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx))
* [ ] Kiểm tra lỗi biên dịch TypeScript toàn dự án.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Giao diện SEO của trang tạo/sửa tài nguyên hiển thị tương đồng 100% về mặt cấu trúc và style với trang quản lý sản phẩm.
* Bộ đếm ký tự hoạt động chính xác khi người dùng gõ phím. Nếu vượt quá giới hạn ký tự (60 ký tự cho Title, 160 cho Description), chữ số đếm sẽ đổi sang màu đỏ (`text-red-500`).
* Khung xem trước hiển thị đúng định dạng kết quả tìm kiếm Google Search và tự động cập nhật theo nội dung nhập vào.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Không có rủi ro lớn nào đối với logic nghiệp vụ hay cơ sở dữ liệu vì đây thuần túy là thay đổi về mặt hiển thị giao diện người dùng (UI).
* **Hoàn tác**: Sử dụng Git để hoàn tác các chỉnh sửa trên hai file `page.tsx` bị ảnh hưởng.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi schema dữ liệu hoặc thay đổi logic xử lý trong các hàm Convex Mutation.
* Tối ưu hóa SEO thực tế ở phía client-side/server-side render của trang hiển thị bên ngoài (frontend site).
