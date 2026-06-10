# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Ở website thực (Hình 1), widget liên hệ (Speed Dial) có nền trắng mặc dù trang đang ở chế độ tối. Nhưng ở trang preview admin (Hình 2), nó hiển thị đúng màu tối.
* **Nguyên nhân**: Trong code của `GlobalSpeedDial.tsx` (và 3 file render khác), giao diện vẫn đọc biến tạm `site_theme_override` từ `localStorage`. Do trình duyệt còn lưu lại giá trị cũ của `localStorage` từ các lần chạy trước, widget bị "lệch pha" (nền sáng) so với giao diện chung (đã đổi sang nền tối theo DB).
* **Giải pháp**: Xóa hoàn toàn việc đọc `localStorage` ở tất cả các file hiển thị. Thay vào đó, lấy thẳng giá trị `isDark` từ hook `useSiteSettings()` – nơi đã có logic lắng nghe sự kiện thay đổi theme rất chuẩn xác.

## 2. Elaboration & Self-Explanation
Trước đây, khi chuyển đổi sáng/tối, hệ thống lưu trạng thái vào `localStorage` dưới tên `site_theme_override`. Ở task trước, chúng ta đã bỏ việc lưu vào `localStorage` này và chuyển sang ghi trực tiếp vào Database Convex để làm "Single Source of Truth". 

Tuy nhiên, các file hiển thị ở giao diện người dùng (gồm `GlobalSpeedDial.tsx`, `ComponentRenderer.tsx`, `DynamicFooter.tsx`, và `HomeComponentRenderer.tsx`) vẫn giữ đoạn code cũ tự đồng bộ theme: chúng kiểm tra `localStorage.getItem('site_theme_override')` trước tiên. Khi trình duyệt của người dùng vẫn còn lưu giá trị cũ là `light`, các component này sẽ hiểu sai là giao diện đang ở chế độ sáng, dẫn đến việc widget liên hệ (Speed Dial) hiển thị nền trắng (Hình 1).

Để giải quyết triệt để, ta cần refactor 4 file này bằng cách loại bỏ state `isDark` tự quản lý cùng các hàm `useEffect` tự đồng bộ, chuyển sang dùng trực tiếp giá trị `isDark` được trả về từ hook `useSiteSettings()`. Vì hook này đã được thiết kế chuẩn chỉnh, luôn lắng nghe sự kiện `site-theme-change` để cập nhật trạng thái theo class `.dark` của thẻ `<html>`.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Giống như trong một tòa nhà, trước đây mỗi phòng có một công tắc riêng (`localStorage`) và một bảng điều khiển trung tâm (`DB`). Giờ ta đã bỏ công tắc riêng đi và chỉ dùng bảng điều khiển trung tâm. Nhưng một số bóng đèn (widget) vẫn cố đọc trạng thái từ chiếc công tắc cũ đã bị hỏng hoặc kẹt ở trạng thái "Bật", dẫn đến việc cả tòa nhà đã tắt đèn tối thui nhưng bóng đèn đó vẫn sáng trưng.
* **Giải pháp**: Đấu nối dây trực tiếp từ bóng đèn đó vào bảng điều khiển trung tâm (`useSiteSettings().isDark`).

---

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra file `components/site/GlobalSpeedDial.tsx`, `ComponentRenderer.tsx`, `DynamicFooter.tsx` và `HomeComponentRenderer.tsx`.
* Phát hiện cả 4 file này đều có chung một đoạn logic tự đồng bộ dark mode bằng cách đọc `localStorage.getItem('site_theme_override')`.
* Việc này tạo ra lỗ hổng dữ liệu khiến các component hiển thị sai theme khi `localStorage` chứa giá trị cũ không còn khớp với DB.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause**: Lỗi đọc ghi không đồng bộ (Dual-read mismatch). Các file hiển thị tự đọc từ `localStorage` cũ thay vì đọc từ trạng thái theme thực tế của tài liệu.
* **Độ tin cậy nguyên nhân gốc**: High (100% tái hiện được nếu `localStorage` có sẵn giá trị `site_theme_override` ngược với DB).
* **Giả thuyết đối chứng**: Nếu ta xóa `localStorage` bằng tay (`localStorage.clear()`), widget sẽ hiển thị đúng. Tuy nhiên, ta không thể bắt mọi khách truy cập web phải xóa `localStorage`, vì vậy việc refactor code là bắt buộc.

---

# IV. Proposal (Đề xuất)
* Refactor 4 file runtime chính để loại bỏ state `isDark` tự quản lý và `useEffect` tự đồng bộ.
* Sử dụng thuộc tính `isDark` được cung cấp trực tiếp từ `useSiteSettings()` hook.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [GlobalSpeedDial.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/GlobalSpeedDial.tsx) — Xóa state `isDark`, `useEffect` sync và dùng trực tiếp `isDark` từ `useSiteSettings()`.
* **Sửa**: [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/ComponentRenderer.tsx) — Xóa state `isDark`, `useEffect` sync và dùng trực tiếp `isDark` từ `useSiteSettings()`.
* **Sửa**: [DynamicFooter.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/DynamicFooter.tsx) — Xóa state `isDark`, `useEffect` sync và dùng trực tiếp `isDark` từ `useSiteSettings()`.
* **Sửa**: [HomeComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/HomeComponentRenderer.tsx) — Xóa state `isDark`, `useEffect` sync và dùng trực tiếp `isDark` từ `useSiteSettings()`.

---

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa `GlobalSpeedDial.tsx` để tích hợp `isDark` từ `useSiteSettings()`.
2. Đọc và chỉnh sửa `ComponentRenderer.tsx` để dùng trực tiếp `isDark` từ hook.
3. Đọc và chỉnh sửa `DynamicFooter.tsx` để dùng trực tiếp `isDark` từ hook.
4. Đọc và chỉnh sửa `HomeComponentRenderer.tsx` để dùng trực tiếp `isDark` từ hook.
5. Chạy TypeScript compiler (`tsc --noEmit`) để kiểm tra kiểu dữ liệu sau khi sửa đổi.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra tự động**: Chạy `bunx tsc --noEmit` để đảm bảo không lỗi cú pháp hoặc import sai.
* **Kiểm tra thủ công**: Người dùng bật tắt theme sáng/tối ở Header, kiểm tra xem widget liên hệ (Speed Dial) và Footer trên site thực có đổi màu nền tức thì và đồng bộ 100% hay không.

---

# VIII. Todo
- [ ] Refactor `GlobalSpeedDial.tsx` để dùng `isDark` từ `useSiteSettings()`
- [ ] Refactor `ComponentRenderer.tsx` để dùng `isDark` từ `useSiteSettings()`
- [ ] Refactor `DynamicFooter.tsx` để dùng `isDark` từ `useSiteSettings()`
- [ ] Refactor `HomeComponentRenderer.tsx` để dùng `isDark` từ `useSiteSettings()`
- [ ] Chạy typecheck và commit các thay đổi

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Widget liên hệ (Speed Dial) hiển thị nền tối trên dark mode và nền sáng trên light mode đồng bộ 100%.
* Code không còn bất kỳ dòng nào đọc `localStorage.getItem('site_theme_override')` ở phía client hiển thị.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Rất thấp vì `useSiteSettings()` đã hoạt động ổn định và kế thừa toàn bộ logic lắng nghe sự kiện thay đổi theme.
* **Hoàn tác**: Sử dụng `git checkout` để khôi phục trạng thái cũ nếu cần.

---

# XI. Out of Scope (Ngoài phạm vi)
* Các cấu hình màu sắc khác ngoài dark/light mode của widget.
