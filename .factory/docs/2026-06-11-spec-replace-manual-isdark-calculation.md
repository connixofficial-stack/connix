# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Nhiều trang và components khác nhau đang tự tính toán xem website đang ở chế độ tối (Dark Mode) hay không một cách thủ công (đọc từ `siteDarkMode`, check sự kiện `site-theme-change`, kiểm tra `window.matchMedia`...). Điều này dễ dẫn đến lỗi không đồng bộ giao diện và làm phình to mã nguồn.
* **Giải pháp**: Tận dụng hook dùng chung `useSiteSettings()`. Hook này đã được nâng cấp để trả về sẵn biến `isDark` đã tự động xử lý tất cả logic trên. Chúng ta chỉ cần lấy trực tiếp `const { isDark } = useSiteSettings();` và loại bỏ các dòng tính toán thủ công dư thừa.

## 2. Elaboration & Self-Explanation
Hiện tại, hệ thống sử dụng một hook trung tâm là `useSiteSettings()` nằm ở `components/site/hooks.ts` để lấy thông tin cấu hình trang web. Trong hook này, logic xác định chế độ tối `isDark` đã được cài đặt hoàn chỉnh: lắng nghe sự thay đổi của class `dark` trên thẻ `html` (nhờ sự kiện `'site-theme-change'`), kiểm tra localStorage và trạng thái cấu hình từ DB.

Tuy nhiên, trong thư mục `app/(site)/`, có 15 tệp tin vẫn đang tự tính toán `isDark` bằng các đoạn code lặp đi lặp lại hoặc tự lắng nghe event thủ công. Việc này vi phạm nguyên tắc DRY (Don't Repeat Yourself) và dễ gây ra hiện tượng không nhất quán (ví dụ: một trang nhận diện là tối, trang khác nhận diện là sáng do thiếu code cập nhật sự kiện hoặc kiểm tra thiếu điều kiện). Việc thay thế bằng `isDark` trực tiếp từ `useSiteSettings()` giúp quy về một nguồn sự thật duy nhất (Single Source of Truth), tăng độ ổn định của Dark Mode trên toàn site.

## 3. Concrete Examples & Analogies
* **Ví dụ**:
  * *Trước khi sửa*:
    ```tsx
    const { siteDarkMode } = useSiteSettings();
    const isDark = siteDarkMode === 'dark' || (siteDarkMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    ```
  * *Sau khi sửa*:
    ```tsx
    const { isDark } = useSiteSettings();
    ```
* **Hình ảnh ẩn dụ**: Thay vì mỗi lớp học tự lắp một cảm biến đo độ sáng để quyết định bật đèn (dễ dẫn đến phòng bật phòng tắt do cảm biến lệch chuẩn hoặc bụi bẩn), trường học lắp một cảm biến tổng duy nhất ở phòng điều hành (hook `useSiteSettings()`) và gửi tín hiệu Bật/Tắt (`isDark`) tới tất cả các phòng để cả trường luôn đồng bộ.

# II. Audit Summary (Tóm tắt kiểm tra)
Chúng ta đã kiểm tra 15 tệp tin do người dùng cung cấp. Tất cả đều đang tự tính toán biến `isDark` hoặc tự định nghĩa state lắng nghe event chỉnh màu tối thủ công. Cụ thể:
* Các trang như `ProductDetailPage.tsx`, `HomePageClient.tsx`, `CourseDetailPage.tsx`, v.v. sử dụng logic check `siteDarkMode` kết hợp `matchMedia` và/hoặc `localStorage`.
* Các trang `ServicesPage.tsx` tự duy trì một `useState(false)` cho `isDark` và dùng `useEffect` lắng nghe sự kiện để thay đổi state.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Code được viết tại các thời điểm khác nhau khi hook `useSiteSettings()` chưa hỗ trợ trả về `isDark` động. Các lập trình viên phải tự viết logic kiểm tra thủ công tại từng trang.
* **Giả thuyết đối chứng**: Nếu chỉ thay thế `siteDarkMode` mà không xoá các `useEffect` tự lắng nghe event ở một số trang như `ServicesPage.tsx`, code vẫn chạy được nhưng sẽ dư thừa bộ nhớ, làm chạy lại render không cần thiết và vi phạm nguyên tắc KISS/DRY. Do đó, cần dọn dẹp triệt để cả các hook `useState`/`useEffect` dư thừa liên quan đến `isDark`.

# IV. Proposal (Đề xuất)
* **Bước 1**: Đảm bảo tệp tin đã import `useSiteSettings` đúng đường dẫn.
* **Bước 2**: Thay thế dòng `const { siteDarkMode } = useSiteSettings();` và logic gán `isDark = ...` bằng `const { isDark } = useSiteSettings();`.
* **Bước 3**: Loại bỏ các `useState`, `useEffect` không cần thiết dùng để cập nhật `isDark` (như trong `ServicesPage.tsx`).
* **Bước 4**: Kiểm tra tất cả các vị trí khai báo component bên trong cùng một file (nếu có nhiều component dùng `isDark`) để cập nhật đồng loạt.

# V. Files Impacted (Tệp bị ảnh hưởng)
1. `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx`
   * *Vai trò*: Trang chi tiết sản phẩm.
   * *Thay đổi*: Lấy `isDark` trực tiếp từ `useSiteSettings()`, bỏ `siteDarkMode` và dòng tính `isDark` thủ công.
2. `app/(site)/[categorySlug]/_components/ServicesPage.tsx`
   * *Vai trò*: Trang danh sách dịch vụ theo danh mục.
   * *Thay đổi*: Xoá `useState(isDark)`, `useEffect` đồng bộ và lấy trực tiếp `isDark` từ `useSiteSettings()`.
3. `app/(site)/_components/HomePageClient.tsx`
   * *Vai trò*: Client component trang chủ.
   * *Thay đổi*: Loại bỏ `siteThemeOverride` state, `useEffect` lắng nghe theme change, lấy trực tiếp `isDark` từ `useSiteSettings()`.
4. `app/(site)/_components/courses/CourseDetailPage.tsx`
   * *Vai trò*: Trang chi tiết khóa học.
   * *Thay đổi*: Thay thế logic tính `isDark` thủ công bằng `isDark` từ `useSiteSettings()`.
5. `app/(site)/_components/resources/ResourceDetailPage.tsx`
   * *Vai trò*: Trang chi tiết tài nguyên.
   * *Thay đổi*: Thay thế logic tính `isDark` thủ công bằng `isDark` từ `useSiteSettings()`.
6. `app/(site)/_components/services/ServicesPage.tsx`
   * *Vai trò*: Trang danh sách dịch vụ chung.
   * *Thay đổi*: Loại bỏ `useState(isDark)`, `useEffect` đồng bộ và lấy trực tiếp `isDark` từ `useSiteSettings()`.
7. `app/(site)/account/orders/page.tsx`
   * *Vai trò*: Trang lịch sử đơn hàng của tài khoản.
   * *Thay đổi*: Thay thế logic tính `isDark` thủ công bằng `isDark` từ `useSiteSettings()`.
8. `app/(site)/account/profile/page.tsx`
   * *Vai trò*: Trang thông tin tài khoản.
   * *Thay đổi*: Thay thế logic tính `isDark` thủ công bằng `isDark` từ `useSiteSettings()`.
9. `app/(site)/checkout/page.tsx`
   * *Vai trò*: Trang thanh toán đơn hàng.
   * *Thay đổi*: Thay thế logic tính `isDark` ở các component trong file bằng `isDark` từ `useSiteSettings()`.
10. `app/(site)/checkout/thank-you/page.tsx`
    * *Vai trò*: Trang cảm ơn sau khi thanh toán.
    * *Thay đổi*: Thay thế logic tính `isDark` ở các component bằng `isDark` từ `useSiteSettings()`.
11. `app/(site)/contact/page.tsx`
    * *Vai trò*: Trang liên hệ.
    * *Thay đổi*: Thay thế logic tính `isDark` thủ công bằng `isDark` từ `useSiteSettings()`.
12. `app/(site)/khoa-hoc/[slug]/bai-hoc/[lessonSlugAndId]/page.tsx`
    * *Vai trò*: Trang chi tiết bài học.
    * *Thay đổi*: Thay thế logic tính `isDark` thủ công bằng `isDark` từ `useSiteSettings()`.
13. `app/(site)/projects/page.tsx`
    * *Vai trò*: Trang danh sách dự án.
    * *Thay đổi*: Thay thế logic tính `isDark` thủ công bằng `isDark` từ `useSiteSettings()`.
14. `app/(site)/search/page.tsx`
    * *Vai trò*: Trang tìm kiếm chung.
    * *Thay đổi*: Thay thế logic tính `isDark` thủ công bằng `isDark` từ `useSiteSettings()`.
15. `app/(site)/tra-cuu-don-hang/page.tsx`
    * *Vai trò*: Trang tra cứu đơn hàng.
    * *Thay đổi*: Thay thế logic tính `isDark` thủ công bằng `isDark` từ `useSiteSettings()`.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và phân tích kỹ từng file.
2. Thực hiện sửa đổi bằng công cụ `replace_file_content` hoặc `multi_replace_file_content`.
3. Kiểm tra tĩnh (static review) xem imports có đầy đủ không và code có lỗi cú pháp không.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* Vì yêu cầu nghiêm ngặt cấm chạy compile/lint tự trị ("KHÔNG tự ý chạy lint/compile hay commit. Hãy báo cáo lại danh sách các file đã sửa đổi thành công để tôi thực hiện verification"), ta chỉ thực hiện review tĩnh kỹ lượng và chuyển giao cho tester/user verify.

# VIII. Todo
* [ ] Sửa file 1: `ProductDetailPage.tsx`
* [ ] Sửa file 2: `ServicesPage.tsx` (danh mục)
* [ ] Sửa file 3: `HomePageClient.tsx`
* [ ] Sửa file 4: `CourseDetailPage.tsx`
* [ ] Sửa file 5: `ResourceDetailPage.tsx`
* [ ] Sửa file 6: `ServicesPage.tsx` (chung)
* [ ] Sửa file 7: `account/orders/page.tsx`
* [ ] Sửa file 8: `account/profile/page.tsx`
* [ ] Sửa file 9: `checkout/page.tsx`
* [ ] Sửa file 10: `checkout/thank-you/page.tsx`
* [ ] Sửa file 11: `contact/page.tsx`
* [ ] Sửa file 12: `khoa-hoc/[slug]/bai-hoc/[lessonSlugAndId]/page.tsx`
* [ ] Sửa file 13: `projects/page.tsx`
* [ ] Sửa file 14: `search/page.tsx`
* [ ] Sửa file 15: `tra-cuu-don-hang/page.tsx`

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Tất cả 15 file trên đều được dọn dẹp logic tự tính toán `isDark` thủ công.
* Không có lỗi cú pháp TypeScript/React nào xuất hiện trong các vùng sửa đổi.
* Tất cả component sử dụng hook `useSiteSettings` thay vì tự viết logic check.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* Rủi ro rất thấp vì đây chỉ là refactor đồng nhất hoá hook.
* Cách rollback: Dùng `git checkout -- <file_path>` để khôi phục lại trạng thái ban đầu của file bị lỗi.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi màu sắc giao diện hay sửa đổi các logic khác không liên quan đến Dark Mode.
* Tự động chạy build hay commit code.
