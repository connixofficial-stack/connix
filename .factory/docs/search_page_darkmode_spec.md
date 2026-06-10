# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng chuyển sang giao diện tối (Dark Mode) trên website, trang tìm kiếm (`/search`) vẫn bị chói mắt vì các thẻ sản phẩm, bài viết và thanh lọc danh mục vẫn giữ màu nền trắng sáng của chế độ sáng (Light Mode). Chúng ta sẽ thêm các CSS class đặc biệt bắt đầu bằng `dark:` của Tailwind (ví dụ `dark:bg-[#161617]` thay vì `bg-white`, hay `dark:text-[#f5f5f7]` thay vì `text-slate-800`) vào file code. Điều này giúp trình duyệt tự động chuyển các thành phần sang màu tối sang trọng kiểu Apple (màu đen tuyền và xám mờ mịn) ngay khi phát hiện chế độ Dark Mode được kích hoạt, mang lại cảm giác dễ chịu và cao cấp cho người dùng.

## 2. Elaboration & Self-Explanation
Hiện trạng trang tìm kiếm của hệ thống đang gặp lỗi bất nhất giao diện ở chế độ tối: trong khi thanh menu và nền bao ngoài của trang đã tối màu, thì nội dung chính bên trong (bao gồm thanh tìm kiếm, các tab sản phẩm/bài viết/dịch vụ/khoá học/tài nguyên, khung lọc danh mục và toàn bộ các thẻ card kết quả) vẫn hiển thị màu nền trắng (`bg-white`) và chữ tối (`text-slate-800`). Điều này là do các component này chưa được khai báo các variant `dark:` tương ứng của Tailwind. 

Giải pháp là bổ sung các thuộc tính `dark:` cho toàn bộ các thành phần hiển thị trên trang `/search/page.tsx` và combobox lọc danh mục `CategoryCombobox.tsx`. Phong cách thiết kế Apple Dark Mode sẽ sử dụng:
- Nền chính của trang: màu đen tuyền (`dark:bg-black`)
- Nền của các khối nội dung và thẻ card: màu xám tối cao cấp của Apple (`dark:bg-[#161617]`)
- Nền hover hoặc nút phụ: màu xám trung tính (`dark:bg-[#1c1c1e]`, `dark:bg-[#2c2c2e]`)
- Đường viền chia cắt: màu viền tối mờ (`dark:border-zinc-800` hoặc `dark:border-zinc-850`)
- Chữ chính: màu trắng ngà dễ chịu (`dark:text-[#f5f5f7]`)
- Chữ phụ/mô tả ngắn: màu xám sáng (`dark:text-[#86868b]`)

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Đối với thẻ sản phẩm (Product Card), ta sẽ thay đổi:
  ```html
  <!-- Trước đây: Chỉ có màu light mode -->
  <div className="bg-white border border-slate-100 text-slate-800">
  
  <!-- Sau khi sửa: Tự động đổi màu khi ở dark mode -->
  <div className="bg-white dark:bg-[#161617] border border-slate-100 dark:border-zinc-850 text-slate-800 dark:text-[#f5f5f7]">
  ```
- **Phép so sánh thực tế**: Hãy tưởng tượng một rạp chiếu phim sang trọng. Khi đèn trong rạp tắt đi (chuyển sang Dark Mode), tất cả mọi người đều hạ giọng và màn hình chỉ phát ánh sáng dịu. Tuy nhiên, có một vài chiếc ghế hoặc biển hiệu đột nhiên bật đèn neon sáng chói lên (các card màu trắng sáng). Việc thêm `dark:` tương tự như việc lắp đặt hệ thống tự động giảm độ sáng của tất cả các đèn và biển hiệu này đồng bộ khi rạp phim tắt đèn, giúp người xem không bị chói mắt và có trải nghiệm xem phim hoàn hảo.

# II. Audit Summary (Tóm tắt kiểm tra)
- **File đầu tiên**: `app/(site)/search/page.tsx`
  - Đã quét và phân tích cấu trúc render. File có 1688 dòng code, chứa giao diện trang tìm kiếm cùng 5 kiểu card kết quả ở cả 2 layout grid/list. Các class CSS hiện tại hoàn toàn là màu sáng (`bg-white`, `bg-slate-50`, `border-slate-100`, `text-slate-800`, `text-slate-400`).
- **File thứ hai**: `app/(site)/search/_components/CategoryCombobox.tsx`
  - Hộp chọn danh mục sử dụng `bg-white`, `border-slate-200`, `text-slate-700` cho nút trigger và các class tương tự cho danh sách dropdown. Tất cả đều chưa hỗ trợ dark mode.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Triệu chứng**: Khi hệ thống kích hoạt Dark Mode (thẻ `<html>` có class `dark`), trang tìm kiếm hiển thị các khối màu sáng chói chang, chữ mờ nhạt khó đọc.
- **Nguyên nhân gốc**: Các class màu sắc của Tailwind trong `page.tsx` và `CategoryCombobox.tsx` chỉ định nghĩa màu sáng tĩnh (light mode) mà không khai báo các variant `dark:`. Do đó, khi theme thay đổi, trình duyệt vẫn render theo màu sắc mặc định của light mode.
- **Giả thuyết đối chứng**: Nếu ta chỉ thêm `dark:bg-zinc-900` chung chung, giao diện trông sẽ rất thô và không giống phong cách sang trọng của Apple. Do đó bắt buộc phải sử dụng các mã màu chuẩn của Apple: `#161617` (nền card), `#1c1c1e` (nền xám), `#f5f5f7` (chữ chính), `#86868b` (chữ phụ) để đạt được độ premium mong muốn.

# IV. Proposal (Đề xuất)
1. Cập nhật `app/(site)/search/page.tsx` bổ sung các class `dark:` cho:
   - Thanh tìm kiếm chính và nút xóa tìm kiếm.
   - Nút Tab phụ hiển thị số lượng kết quả (nền tab không active, viền ngăn cách).
   - Thanh toolbar lọc (Filters Toolbar), dropdown sắp xếp, nút chuyển đổi grid/list.
   - Thẻ hiển thị trống (Empty State).
   - Toàn bộ các thẻ Card kết quả (Products, Posts, Services, Courses, Resources) ở cả 2 chế độ hiển thị lưới & danh sách.
   - Các nút phân trang (Pagination).
2. Cập nhật `app/(site)/search/_components/CategoryCombobox.tsx` bổ sung các class `dark:` cho:
   - Nút bấm trigger dropdown.
   - Panel chứa danh sách danh mục dropdown.
   - Ô nhập từ khóa tìm kiếm danh mục.
   - Các nút danh mục lựa chọn (bao gồm cả trạng thái hover và active).

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [CategoryCombobox.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/search/_components/CategoryCombobox.tsx)
  - Vai trò: Hiển thị bộ chọn danh mục để lọc kết quả tìm kiếm.
  - Thay đổi: Thêm các class `dark:` cho nút trigger, dropdown panel, ô tìm kiếm và các dòng danh mục.
- **Sửa**: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/search/page.tsx)
  - Vai trò: Giao diện chính của trang tìm kiếm, chứa logic lọc và danh sách card kết quả.
  - Thay đổi: Bổ sung hook `useSiteSettings` để đồng bộ hoá tab style inline (nếu cần đổi màu động thông qua JS style object), đồng thời thêm các class `dark:` vào các thẻ HTML/Tailwind của tab, toolbar, card, empty state và pagination.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chuẩn bị các chunk thay đổi cho `CategoryCombobox.tsx`. Thực hiện thay đổi file này trước để tối ưu hóa bộ lọc.
2. Đọc và chuẩn bị các chunk thay đổi cho `page.tsx` theo từng khu vực:
   - Khu vực 1: Search Header Area & Tab Selection.
   - Khu vực 2: Filters Toolbar & Empty State.
   - Khu vực 3: Product Cards (Grid & List layout).
   - Khu vực 4: Post Cards (Grid & List layout).
   - Khu vực 5: Service Cards (Grid & List layout).
   - Khu vực 6: Course Cards (Grid & List layout).
   - Khu vực 7: Resource Cards (Grid & List layout).
   - Khu vực 8: Pagination Controls.
3. Thực hiện sửa đổi `page.tsx` sử dụng công cụ thay đổi file.
4. Kiểm tra tĩnh code (Static review) để đảm bảo không có lỗi cú pháp hoặc thiếu thẻ đóng.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Vì quy tắc cấm tự chạy lệnh lint hoặc tsc/build thủ công khi không cần thiết, ta sẽ tin tưởng vào Git Hook kiểm tra lúc commit.
- Để tự tin, ta sẽ rà soát lại kiểu dữ liệu (Types) của các hook/component được thêm vào.

# VIII. Todo
- [ ] Cập nhật `app/(site)/search/_components/CategoryCombobox.tsx` hỗ trợ Dark Mode.
- [ ] Tích hợp `useSiteSettings` vào `app/(site)/search/page.tsx` và tạo biến `isDark` để xử lý các style inline.
- [ ] Cập nhật Header và các nút Tab trong `app/(site)/search/page.tsx` hỗ trợ Dark Mode.
- [ ] Cập nhật Filters Toolbar và các dropdown/icon toggle trong `app/(site)/search/page.tsx`.
- [ ] Cập nhật các Card hiển thị Sản phẩm (Product) ở dạng Lưới & Danh sách.
- [ ] Cập nhật các Card hiển thị Bài viết (Post) ở dạng Lưới & Danh sách.
- [ ] Cập nhật các Card hiển thị Dịch vụ (Service) ở dạng Lưới & Danh sách.
- [ ] Cập nhật các Card hiển thị Khóa học (Course) ở dạng Lưới & Danh sách.
- [ ] Cập nhật các Card hiển thị Tài nguyên (Resource) ở dạng Lưới & Danh sách.
- [ ] Cập nhật bộ điều khiển Phân trang (Pagination) ở cuối trang.
- [ ] Kiểm tra tích hợp và commit code qua Git.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Trang `/search` hiển thị đúng giao diện Dark Mode cao cấp:
  - Khi bật dark mode:
    - Nền trang màu đen (`#000000`).
    - Nền các Card và dropdown màu xám chuẩn Apple (`#161617`).
    - Chữ hiển thị màu trắng ngà dịu mắt (`#f5f5f7`), mô tả màu xám (`#86868b`).
    - Các nút phân trang và bộ lọc chuyển đổi màu tối mượt mà, không bị viền trắng hay nền trắng chói.
- Dự án compile thành công thông qua hệ thống pre-commit hook (oxlint + tsc).

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Lỗi cú pháp React do sửa đổi nhầm các thẻ đóng mở của file lớn `page.tsx` (1688 dòng).
- **Phòng ngừa**: Thực hiện thay đổi bằng các chunk nhỏ chuẩn xác thông qua công cụ `replace_file_content` hoặc `multi_replace_file_content` với định vị dòng chi tiết.
- **Hoàn tác**: Sử dụng `git checkout -- <filepath>` để rollback nhanh nếu có lỗi nghiêm trọng xảy ra.

# XI. Out of Scope (Ngoài phạm vi)
- Thay đổi logic tìm kiếm backend của Convex.
- Chỉnh sửa trang chi tiết hoặc các trang khác ngoài phạm vi tìm kiếm.
- Sửa đổi cấu trúc layout cha (`layout.tsx`).
