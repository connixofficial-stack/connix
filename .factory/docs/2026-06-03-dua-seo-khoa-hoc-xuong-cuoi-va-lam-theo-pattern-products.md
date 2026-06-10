# I. Primer

## 1. TL;DR kiểu Feynman
* Phần SEO (Meta Title, Meta Description, Google Search Preview) của khóa học hiện đang nằm lửng lơ ở giữa trang hoặc thiếu phần xem trước trực quan (Google Preview) giống như trang Sản phẩm.
* Người dùng muốn di chuyển phần SEO này xuống dưới cùng của cột nội dung chính bên trái.
* Đồng thời hiển thị một khung giả lập hiển thị trên Google (tiêu đề màu xanh, link màu xanh lá, mô tả màu xám) giống hệt trang Tạo sản phẩm để admin biết thông tin SEO hiển thị thế nào.
* Trình bày cột bên phải tối giản: chỉ giữ lại 2 mục là "Xuất bản" và "Ảnh đại diện". Các mục khác như "Thông tin khóa học", "Giá khóa học", "Video giới thiệu" sẽ được chuyển sang cột trái giống như trang Chỉnh sửa.

## 2. Elaboration & Self-Explanation
* **Vấn đề**:
  * Trang `courses/create/page.tsx` và `courses/[id]/edit/page.tsx` có sự khác biệt về cấu trúc hiển thị cột. Ở trang Create, các mục như "Thông tin khóa học", "Giá", "Video giới thiệu" đang nằm ở cột phụ bên phải làm cột này rất dài và mất cân đối, trong khi ở trang Edit, chúng đã được chuyển sang cột chính bên trái.
  * Card SEO ở trang Edit đang nằm phía trên các card "Thông tin khóa học", "Giá", "Video giới thiệu" chứ không nằm ở cuối cùng của cột trái. Hơn nữa, trang Edit đang bị thiếu box SEO Preview giả lập kết quả tìm kiếm Google (trang Create và trang Product đều có).
* **Giải pháp**:
  * Đồng bộ hóa layout của `courses/create/page.tsx` bằng cách chuyển "Thông tin khóa học", "Giá khóa học", "Video giới thiệu" sang cột chính bên trái (bên dưới Card chính/LexicalEditor) giống như layout của trang Edit. Cột phải chỉ giữ lại "Xuất bản" và "Ảnh đại diện".
  * Với cả hai trang, di chuyển Card "SEO" xuống dưới cùng của cột chính bên trái (dưới card "Video giới thiệu").
  * Bổ sung box SEO Preview giả lập Google vào Card SEO của trang `courses/[id]/edit/page.tsx` để hiển thị trực quan thông tin SEO khi admin nhập liệu.

## 3. Concrete Examples & Analogies
* **Ví dụ**:
  * Khi admin nhập tiêu đề khóa học là "Khóa học React Next.js từ cơ bản đến nâng cao", đường dẫn slug là "react-nextjs-co-ban-nang-cao", và mô tả SEO là "Học React Next.js chuyên sâu...".
  * Box SEO Preview ở dưới cùng sẽ lập tức hiển thị giả lập:
    * Tiêu đề xanh: `Khóa học React Next.js từ cơ bản đến nâng cao`
    * Link xanh lá: `/lap-trinh/react-nextjs-co-ban-nang-cao`
    * Mô tả xám: `Học React Next.js chuyên sâu...`
  * Layout cột bên phải sẽ rất ngắn gọn, chỉ có nút trạng thái Xuất bản và khung tải ảnh lên, giúp admin tập trung vào luồng nhập thông tin chính ở cột bên trái từ trên xuống dưới.

# II. Audit Summary (Tóm tắt kiểm tra)

* Đã kiểm tra file [products/create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/products/create/page.tsx#L1498-L1547): Có Card SEO ở cuối cột trái chứa input Meta Title, textarea Meta Description và box giả lập Google Search Preview.
* Đã kiểm tra file [courses/create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/create/page.tsx#L268-L297): Card SEO đã có box Preview nhưng đang xếp trên các card thông tin phụ nằm ở cột bên phải.
* Đã kiểm tra file [courses/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/%5Bid%5D/edit/page.tsx#L493-L517): Card SEO đang nằm ở giữa cột trái, thiếu box Preview trực quan.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc**: Giao diện tạo mới và chỉnh sửa khóa học được phát triển ở các thời điểm khác nhau nên chưa đồng bộ layout cột. Đồng thời, form SEO của khóa học chưa được cập nhật box Preview trực quan ở trang Edit, và vị trí của nó chưa được xếp ở cuối cột chính để tránh làm loãng luồng nhập liệu thông tin cơ bản.
* **Độ tin cậy nguyên nhân gốc**: High (Do code thực tế trong 2 file page.tsx của courses hiển thị rõ sự lệch layout này).

# IV. Proposal (Đề xuất)

* **Bước 1**: Cập nhật `app/admin/courses/create/page.tsx`:
  * Di chuyển 3 Card: "Thông tin khóa học", "Giá khóa học", "Video giới thiệu" từ cột phải sang cột trái, đặt dưới Card "Nội dung nâng cao" (nếu hiển thị) hoặc Card chính.
  * Di chuyển Card "SEO" xuống cuối cùng của cột trái (dưới Card "Video giới thiệu").
  * Giữ Card "Xuất bản" và Card "Ảnh đại diện" ở cột phải.
* **Bước 2**: Cập nhật `app/admin/courses/[id]/edit/page.tsx`:
  * Di chuyển Card "SEO" xuống dưới cùng của cột trái (dưới Card "Video giới thiệu").
  * Bổ sung box SEO Preview giả lập kết quả tìm kiếm Google vào Card "SEO", sử dụng các biến `metaTitle`, `title`, `selectedCategorySlug` (hoặc fallback `khoa-hoc`), `slug` và `metaDescription` / `excerpt` phù hợp.

# V. Files Impacted (Tệp bị ảnh hưởng)

* [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/create/page.tsx)
  * *Vai trò hiện tại*: Form tạo mới khóa học.
  * *Thay đổi*: Di chuyển các card phụ từ cột phải sang cột trái, đưa Card SEO xuống cuối cột trái để đồng bộ layout.
* [[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/%5Bid%5D/edit/page.tsx)
  * *Vai trò hiện tại*: Form chỉnh sửa khóa học.
  * *Thay đổi*: Di chuyển Card SEO xuống cuối cột trái và bổ sung box SEO Preview giả lập Google.

# VI. Execution Preview (Xem trước thực thi)

1. Mở file [courses/create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/create/page.tsx) và cắt code các card "Thông tin khóa học", "Giá khóa học", "Video giới thiệu" từ cột bên phải đưa vào cuối cột trái, trước card SEO. Xếp card SEO ở vị trí cuối cùng của cột trái.
2. Mở file [courses/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/%5Bid%5D/edit/page.tsx) và di chuyển khối mã Card SEO xuống cuối cột trái (sau card "Video giới thiệu"). Thêm box SEO Preview với JSX thích hợp vào cuối Card SEO.
3. Chạy lệnh check TypeScript compiler để xác minh không có lỗi cú pháp hoặc kiểu dữ liệu.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy `bunx tsc --noEmit` để đảm bảo code TypeScript biên dịch thành công.

### Manual Verification
* Mở trang tạo mới khóa học và chỉnh sửa khóa học trên trình duyệt, kiểm tra trực quan:
  * Các card thông tin phụ nằm ở cột bên trái.
  * Card SEO nằm ở cuối cột bên trái.
  * Có box preview giả lập Google hiển thị đúng dữ liệu động (Meta Title / Title, Slug, Meta Description / Excerpt).
  * Sticky footer và nút save hoạt động bình thường, nhận diện thay đổi (dirty state) chính xác.

# VIII. Todo

- [ ] Cập nhật layout trang tạo khóa học [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/create/page.tsx)
- [ ] Cập nhật layout và bổ sung SEO Preview cho trang chỉnh sửa khóa học [[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/%5Bid%5D/edit/page.tsx)
- [ ] Chạy kiểm tra kiểu TypeScript để đảm bảo code an toàn

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Cả hai trang Tạo mới và Chỉnh sửa khóa học đều có layout cột thống nhất: Cột phải chỉ chứa card "Xuất bản" và card "Ảnh đại diện". Các card khác nằm ở cột trái.
2. Card SEO là card cuối cùng ở cột trái trên cả hai trang.
3. Card SEO ở cả hai trang đều có box SEO Preview giả lập kết quả tìm kiếm Google.
4. Không có lỗi biên dịch TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Lỗi cú pháp JSX khi di chuyển code giữa các thẻ div.
* **Hoàn tác**: Sử dụng `git checkout` để rollback code nếu gặp lỗi nghiêm trọng không thể tự fix nhanh.

# XI. Out of Scope (Ngoài phạm vi)

* Thay đổi schema backend của Convex.
* Thay đổi logic import AI.
