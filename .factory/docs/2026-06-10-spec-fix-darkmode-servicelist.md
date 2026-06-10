# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Trang quản trị (Admin Preview) của Dịch vụ không thay đổi màu khi bật Dark Mode. Trên trang dịch vụ thực tế (`/services`), các thẻ dịch vụ (Card) bị lỗi hiển thị: nền bị kẹt màu trắng, chữ xám mờ không đọc được trên nền tối do cơ chế xác định Dark Mode cũ bị lỗi Hydration Mismatch (xung đột thông tin giữa máy chủ và trình duyệt).
* **Cách sửa**: 
  1. Trong Admin Preview: Lấy trạng thái `isDark` từ Wrapper chung và sử dụng `adaptTokensForDarkMode` để tự động tính toán lại bảng màu tối cho Dịch vụ.
  2. Trên Site thực tế: Đưa trạng thái `isDark` vào `useState` và chỉ cập nhật giá trị sau khi trang tải xong (`useEffect`), đồng thời lắng nghe sự kiện thay đổi theme từ giao diện của người dùng để cập nhật màu sắc ngay lập tức.

## 2. Elaboration & Self-Explanation
Hệ thống hiển thị màu sắc dựa trên các Token màu được cấu hình.
* Khi ở chế độ sáng (Light Mode), Card có nền trắng và chữ tối.
* Khi ở chế độ tối (Dark Mode), hệ thống cần chuyển nền Card thành xám đen và chữ thành màu sáng để dễ đọc (Premium Apple Style).
Tuy nhiên:
* Ở trang Admin Preview, phần code chưa kết nối với nút bật/tắt Dark Mode của Wrapper preview, dẫn đến Token màu luôn ở trạng thái Light Mode.
* Ở trang thực tế, code tính toán `isDark` trực tiếp bằng cách kiểm tra môi trường trình duyệt (`window.matchMedia`) ngay khi render trên máy chủ (SSR). Do máy chủ không có đối tượng `window`, nó mặc định render ra HTML Light Mode. Khi xuống trình duyệt (Client), trình duyệt cố áp dụng trạng thái Dark Mode nhưng Next.js giữ nguyên HTML cũ tạo ra lỗi Hydration. Thẻ Card bị kẹt cứng ở màu trắng.
Giải pháp là trì hoãn việc xác định `isDark` cho đến khi Component mount trên trình duyệt bằng cách sử dụng `useEffect`, và cập nhật thông qua `useState`. Lắng nghe sự kiện `site-theme-change` để đồng bộ real-time.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: Khi người dùng vào trang `/services`, nền trang web màu đen thui (`#0a0a0a`), nhưng các thẻ dịch vụ lại có nền màu trắng tinh (`#ffffff`) và chữ màu xám nhạt (`#71717a`). Giao diện trông chắp vá và cực kỳ khó nhìn.
* **Hình ảnh tương tự**: Giống như việc bạn đeo kính râm đi vào một căn phòng tối. Lẽ ra phòng phải bật đèn sáng thích hợp (Dark Mode thích ứng), nhưng hệ thống tự động điều khiển đèn lại nghĩ rằng ngoài trời vẫn đang nắng to nên tắt hết đèn, khiến bạn không thể nhìn thấy gì.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* Đã kiểm tra file preview: [ServiceListPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/service-list/_components/ServiceListPreview.tsx) chưa dùng hook `usePreviewDark` và chưa bọc `adaptTokensForDarkMode`.
* Đã kiểm tra file trang thực tế: 
  * [ServicesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/services/ServicesPage.tsx)
  * [ServicesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/%5BcategorySlug%5D/_components/ServicesPage.tsx)
  Cả hai đều xác định `isDark` trực tiếp gây lỗi hydration mismatch và không lắng nghe sự kiện thay đổi theme `'site-theme-change'`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Root Cause (Nguyên nhân gốc):
1. **Admin Preview**: Thiếu wiring kết nối với `usePreviewDark` của Wrapper để nhận biết khi nào quản trị viên đổi sang chế độ preview tối.
2. **Site thực tế**: Xác định `isDark` trực tiếp bằng biểu thức điều kiện bao gồm `typeof window !== 'undefined'` ở cấp độ render hàng đầu của component, gây ra Hydration Mismatch khiến React bỏ qua cập nhật style của card trên client.

---

# IV. Proposal (Đề xuất)

* **Giải pháp 1 (Đồng bộ Dark Mode cho Preview)**:
  * Thêm import `usePreviewDark` và `adaptTokensForDarkMode`.
  * Lấy `isDark` và bọc `validation.tokens` bằng `adaptTokensForDarkMode`.
  * Thay đổi màu nền của container preview dựa trên `isDark` (sử dụng `#0a0a0a` cho Dark Mode).

* **Giải pháp 2 (Sửa lỗi Hydration & Real-time Sync cho Site thực)**:
  * Đưa `isDark` thành một React State: `const [isDark, setIsDark] = useState(false);`.
  * Trong `useEffect`, kiểm tra theme từ cài đặt trang `siteDarkMode`, từ `localStorage` và `matchMedia`.
  * Đăng ký listener sự kiện `'site-theme-change'` để đồng bộ lập tức khi người dùng click đổi theme trên header.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa:
1. [ServiceListPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/service-list/_components/ServiceListPreview.tsx)
   * Thêm logic adapt token và đổi màu nền preview khi ở Dark Mode.
2. [ServicesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/services/ServicesPage.tsx)
   * Sử dụng State và Effect để quản lý `isDark`, lắng nghe event `'site-theme-change'`.
3. [ServicesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/%5BcategorySlug%5D/_components/ServicesPage.tsx)
   * Cập nhật tương tự file trên để đồng bộ trang danh mục dịch vụ.

---

# VI. Execution Preview (Xem trước thực thi)

1. Sửa file `ServiceListPreview.tsx`.
2. Sửa file `app/(site)/_components/services/ServicesPage.tsx`.
3. Sửa file `app/(site)/[categorySlug]/_components/ServicesPage.tsx`.
4. Kiểm tra biên dịch dự án bằng `bunx tsc --noEmit`.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra biên dịch (Static Check)
* Chạy lệnh `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo không phát sinh lỗi kiểu dữ liệu (TypeScript build errors).

### Kiểm tra thực tế (Manual)
* Mở trang chỉnh sửa home-component dịch vụ trong Admin, bật Dark Mode preview, kiểm tra giao diện đổi sang màu tối chuẩn Premium Apple.
* Mở trang `/services` ngoài site thực tế, chuyển đổi giao diện sáng/tối, kiểm tra Card dịch vụ đổi màu nền và màu chữ một cách mượt mà và chính xác.

---

# VIII. Todo

- [ ] Cập nhật `ServiceListPreview.tsx` để hỗ trợ Dark Mode adapter và nền tối.
- [ ] Cập nhật `app/(site)/_components/services/ServicesPage.tsx` chuyển `isDark` sang React State + Effect + Event Listener.
- [ ] Cập nhật `app/(site)/[categorySlug]/_components/ServicesPage.tsx` tương tự như trên.
- [ ] Kiểm tra lỗi Typescript bằng lệnh compile.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Preview trong Admin hiển thị đúng Dark Mode khi toggle.
* Không còn lỗi Hydration Mismatch trên trang `/services` ở client.
* Các Card dịch vụ hiển thị rõ chữ, nền xám đen sang trọng khi ở chế độ Dark Mode.
* Chuyển đổi theme real-time hoạt động hoàn hảo mà không cần reload trang.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* Rủi ro thấp vì chỉ thay đổi logic tính toán màu sắc trên client và không thay đổi cấu trúc dữ liệu hoặc API.
* Nếu lỗi xảy ra, có thể rollback các file đã sửa về phiên bản git trước đó.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không tối ưu hoặc thay đổi các logic nghiệp vụ (business logic) lọc, tìm kiếm, phân trang của dịch vụ.

---

# XII. Open Questions (Câu hỏi mở)
* Không có câu hỏi mở.
