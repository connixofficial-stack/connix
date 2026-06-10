# I. Primer

## 1. TL;DR kiểu Feynman
Trang liên hệ hiện tại khi chuyển sang chế độ tối (Dark Mode) trông rất chói mắt vì các hộp nhập liệu (input) và thẻ thông tin bên phải vẫn giữ nguyên màu nền trắng toét của chế độ sáng. Nó giống như việc bạn đang ở trong một phòng chiếu phim tối nhưng ai đó bất ngờ bật đèn pin chiếu thẳng vào mặt. Để khắc phục điều này, chúng ta sẽ biến các hộp màu trắng đó thành màu xám tối và tinh tế (phong cách Apple/Macbook), làm cho các chữ sáng lên và điều chỉnh các nút mạng xã hội trở nên tối giản, hòa hợp hoàn toàn vào nền tối mà không làm thay đổi giao diện đẹp đẽ của chế độ sáng.

## 2. Elaboration & Self-Explanation
Vấn đề cốt lõi là trang Liên hệ (`/contact`) chưa được đồng bộ hóa với chế độ Dark Mode của hệ thống. Trong khi nền trang đã chuyển sang màu đen sâu thì các thành phần UI con như `ContactInquiryForm` và `ContactInfoCard` vẫn sử dụng các lớp CSS tĩnh cho chế độ sáng (`bg-white`, `border-slate-200`, `text-slate-900`).
Chúng ta sẽ sử dụng hook `useSiteSettings` (đã có sẵn trong dự án để đọc cấu hình dark mode động từ Convex) trong cả trang liên hệ và form gửi tin nhắn. Khi chế độ tối được bật:
- Wrapper của trang sẽ có màu nền đen sâu (`dark:bg-black`).
- Các card container (cả form và card thông tin) sẽ chuyển sang màu xám Apple đặc trưng `#161617` (`dark:bg-[#161617]`) và viền zinc mỏng `#27272a` (`dark:border-zinc-800`).
- Các input và textarea trong form sẽ chuyển từ nền trắng sang nền xám tối `#1c1c1e` (`dark:bg-[#1c1c1e]`), chữ sáng `#f5f5f7`, placeholder xám `#86868b`, và khi click vào sẽ có viền sáng màu brand.
- Các nút mạng xã hội (mặc định sặc sỡ) sẽ được chuyển thành các hình tròn xám tối giản màu `#2c2c2e` với icon sáng ở Dark Mode, và chỉ đổi màu thương hiệu khi rê chuột qua (hover), tạo cảm giác vô cùng cao cấp và dễ chịu.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế:** Trên trang web của Apple, các trường nhập liệu tìm kiếm hoặc form điền thông tin khi ở Dark Mode sẽ không bao giờ có màu nền trắng. Thay vào đó, chúng có màu nền xám rất nhẹ trên nền đen (`#1c1c1e` hoặc `#2c2c2e`).
* **Sự tương đồng đời thường:** Giống như bảng điều khiển (dashboard) của một chiếc xe hơi sang trọng vào ban đêm. Tất cả các nút bấm và màn hình đều tự động giảm độ sáng và chuyển sang tông màu dịu, thay vì chiếu ánh sáng trắng chói lòa vào mắt tài xế.

# II. Audit Summary (Tóm tắt kiểm tra)
- Tệp tin trang liên hệ: [app/(site)/contact/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/contact/page.tsx)
  - Layout hiển thị hiện tại: `with-info`.
  - Thành phần `ContactInfoCard` dùng cứng `bg-white border-slate-200 p-5 shadow-sm` và text màu tối.
  - Các nút MXH sử dụng cứng màu nền thương hiệu (`item.color`) trực tiếp trên card trắng.
- Tệp tin form liên hệ: [components/contact/ContactInquiryForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/contact/ContactInquiryForm.tsx)
  - Form được cấu hình bằng `sharedInputStyle` tĩnh với `backgroundColor: '#ffffff'`, `borderColor: '#e2e8f0'`, `color: '#0f172a'` nếu không có tokens truyền vào từ admin.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:** `ContactInquiryForm` và `ContactInfoCard` hoàn toàn không có thuộc tính hoặc style hỗ trợ Dark Mode khi chạy ngoài trang public site, dẫn đến việc chúng giữ nguyên thiết kế nền trắng chói mắt của Light Mode.
- **Giả thuyết đối chứng:** Nếu chúng ta chỉ áp dụng CSS `dark:` thông thường của Tailwind, một số style inline (như `style={sharedInputStyle}` trong form) sẽ ghi đè lên các class Tailwind. Vì thế, giải pháp triệt để là tích hợp kiểm tra trạng thái `isDark` động thông qua hook `useSiteSettings` để ghi đè style inline một cách sạch sẽ, kết hợp với các class Tailwind `dark:bg-[#161617]` và `dark:border-zinc-800` cho phần khung.

# IV. Proposal (Đề xuất)
1. **Tinh chỉnh `ContactInquiryForm`:**
   - Import `useSiteSettings` để lấy trạng thái `isDark` động.
   - Thêm class Tailwind tối vào thẻ `form` (`dark:bg-[#161617] dark:border-zinc-800`).
   - Cập nhật `sharedInputStyle` động: ở Dark Mode, nền input là `#1c1c1e`, viền là `#27272a`, chữ là `#f5f5f7`, placeholder là `#86868b`.
   - Cập nhật màu chữ tiêu đề và mô tả của form sang màu sáng phù hợp.
2. **Tinh chỉnh `ContactInfoCard` và `ContactPage`:**
   - Sử dụng hook `useSiteSettings` trong `ContactPage` để truyền biến `isDark` xuống `ContactInfoCard`.
   - Bao bọc toàn bộ trang liên hệ bằng một wrapper `main` có nền đồng bộ (`bg-slate-50 dark:bg-black text-slate-700 dark:text-[#f5f5f7] transition-colors duration-200`).
   - Cập nhật `ContactInfoCard` sang màu nền `#161617` và viền `#27272a` khi ở Dark Mode.
   - Thay đổi các nút MXH ở Dark Mode thành dạng hình tròn tối giản nền xám tối `#2c2c2e` và icon trắng `#f5f5f7`, hover chuyển màu thương hiệu.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** [components/contact/ContactInquiryForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/contact/ContactInquiryForm.tsx)
  - Tích hợp `useSiteSettings`, cập nhật logic `sharedInputStyle` động theo `isDark`.
  - Cập nhật wrapper form và màu văn bản để hiển thị tối ưu trên nền tối.
- **Sửa:** [app/(site)/contact/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/contact/page.tsx)
  - Tích hợp `useSiteSettings`, cập nhật cấu trúc nền trang đồng bộ.
  - Cập nhật `ContactInfoCard` sang phong cách Apple dark container `#161617` và viền `#27272a`.
  - Nâng cấp phong cách hiển thị nút MXH tối giản cao cấp ở chế độ tối.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ hai file đích để định vị chính xác vị trí cần sửa.
2. Cập nhật `components/contact/ContactInquiryForm.tsx` để hỗ trợ `isDark` trong input styles và form container.
3. Cập nhật `app/(site)/contact/page.tsx` để đồng bộ hóa giao diện trang và card thông tin liên hệ.
4. Chạy kiểm tra tĩnh TypeScript `bunx tsc --noEmit` để đảm bảo không lỗi kiểu dữ liệu.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Kiểm tra kiểu tĩnh:** Chạy `bunx tsc --noEmit` và giới hạn kết quả bằng `Select-Object -First 10` để kiểm tra lỗi biên dịch.
- **Xác minh trực quan:** Người dùng kiểm tra trang `/contact` trên trình duyệt ở cả chế độ sáng và tối để xác nhận form nhập liệu dịu mắt, các thẻ thông tin và mạng xã hội hiển thị đúng phong cách Apple Premium tối giản.

# VIII. Todo
- [ ] Tích hợp Dark Mode phong cách Apple cho `ContactInquiryForm.tsx`
- [ ] Cập nhật nền trang và thiết kế tối phong cách Apple cho `ContactInfoCard` và `ContactPage` ở `contact/page.tsx`
- [ ] Chạy kiểm tra TypeScript (`bunx tsc --noEmit`)
- [ ] Phát âm báo hoàn thành

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Trang liên hệ ở Dark Mode có nền đen sâu `#000000`.
- Các input và card thông tin không còn màu nền trắng chói mắt.
- Input có nền xám tối `#1c1c1e` và chữ sáng `#f5f5f7`.
- Card thông tin liên hệ có nền xám phẳng `#161617`, viền zinc `#27272a`.
- Các nút mạng xã hội ở Dark Mode có hình tròn tối giản màu xám `#2c2c2e`, icon màu trắng sáng, hover đổi màu thương hiệu mượt mà.
- Light Mode giữ nguyên không đổi.
- Dự án biên dịch thành công không có lỗi TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Một số màu thương hiệu MXH hoặc màu text trong form bị chìm trên nền tối.
- **Giải quyết:** Sử dụng các màu chuẩn của hệ thống và kiểm tra độ tương phản APCA tĩnh trước khi bàn giao. Nếu có lỗi, rollback dễ dàng bằng `git checkout`.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa layout admin của trang liên hệ hoặc các module không liên quan đến trải nghiệm người dùng public.
