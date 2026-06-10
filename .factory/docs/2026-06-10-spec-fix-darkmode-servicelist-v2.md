# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**:
  1. Trong Admin: Preview của Dịch vụ vẫn có nền trắng và card trắng tinh vì component cha cố đọc thông tin Dark Mode từ component con (lỗi phân cấp Context).
  2. Trên Site thực tế (Trang Chủ): Các thẻ dịch vụ bị kẹt ở màu trắng mặc dù nền trang màu đen. Nguyên nhân do biến `isDark` được tính toán trực tiếp từ `typeof window !== 'undefined'` gây ra lỗi Hydration Mismatch, làm trình duyệt giữ nguyên giao diện sáng được render từ server.
* **Cách sửa**:
  1. Trong Admin: Tách phần hiển thị preview thực tế thành component con `ServiceListPreviewInner` đặt bên trong `PreviewWrapper` để nó nhận đúng giá trị `isDark` từ Context và Props truyền xuống.
  2. Trên Site thực tế: Cập nhật `HomeComponentRenderer.tsx` chuyển `isDark` sang React State + Effect + Event Listener để tránh hydration mismatch và đồng bộ real-time.

## 2. Elaboration & Self-Explanation
* **Cơ chế lỗi Context**: `usePreviewDark` sử dụng React Context được cung cấp bởi `PreviewWrapper.Provider`. Nhưng component `ServiceListPreview` lại là component render ra `PreviewWrapper` (tức là cha của Provider). Theo quy tắc của React, component cha không bao giờ đọc được dữ liệu của component con thông qua Context. Giải pháp là tạo một component con `ServiceListPreviewInner` nằm bên trong `PreviewWrapper` để nó tiêu thụ Context một cách chính xác.
* **Cơ chế lỗi Hydration**: `HomeComponentRenderer.tsx` tính toán `isDark` trực tiếp bằng cách kiểm tra `window.matchMedia`. Ở phía server render, `window` không tồn tại nên `isDark` là `false` (Light Mode). Khi xuống Client, `isDark` là `true` (Dark Mode). Sự bất nhất này khiến React ném lỗi Hydration Mismatch và giữ nguyên style nền trắng từ server render. Giải pháp là đưa `isDark` vào `useState(false)` và cập nhật nó sau khi mount bằng `useEffect`.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: Khi truy cập trang chủ, nền trang tối đen nhưng phần danh sách dịch vụ lại hiện lên 3 card nền trắng tinh chói mắt. Khi vào admin edit, dù bật chế độ tối, khung preview dịch vụ vẫn trơ trơ nền trắng và card trắng.
* **Hình ảnh tương tự**: Giống như việc bạn gửi thư mời dự tiệc tối (Dark Mode), nhưng do thông tin in trên phong bì (Server render) ghi là "Tiệc sáng", nên khách mời vẫn mặc đồ công sở màu trắng (Light Mode style) đến dự tiệc tối, tạo ra một sự khập khiễng kỳ quặc.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* Đã kiểm tra file preview: [ServiceListPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/service-list/_components/ServiceListPreview.tsx) gọi `usePreviewDark()` ở ngoài Provider.
* Đã kiểm tra file renderer Trang Chủ: [HomeComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/HomeComponentRenderer.tsx) tính `isDark` trực tiếp gây lỗi Hydration Mismatch.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Root Cause (Nguyên nhân gốc):
1. **Admin Preview**: Lỗi phân cấp Context trong React (Context Consumer nằm ngoài/trên Context Provider).
2. **Site thực tế (Trang Chủ)**: Hydration Mismatch do tính toán `isDark` trực tiếp chứa kiểm tra `window` trong thân hàm render.

---

# IV. Proposal (Đề xuất)

* **Giải pháp 1 (Sửa Preview Admin)**:
  * Tách phần hiển thị của `ServiceListPreview` thành component con `ServiceListPreviewInner` và render nó bên trong `BrowserFrame` của `PreviewWrapper`.
  * Di chuyển logic `usePreviewDark` và `adaptTokensForDarkMode` vào `ServiceListPreviewInner`.

* **Giải pháp 2 (Sửa Site thực tế)**:
  * Sửa `HomeComponentRenderer.tsx` chuyển `isDark` thành React State và cập nhật trong `useEffect`.
  * Lắng nghe sự kiện `'site-theme-change'` để cập nhật `isDark` real-time.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa:
1. [ServiceListPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/service-list/_components/ServiceListPreview.tsx)
   * Tách component con `ServiceListPreviewInner` để nhận đúng context `isDark`.
2. [HomeComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/HomeComponentRenderer.tsx)
   * Thay đổi cách xác định `isDark` sang State + Effect để loại bỏ hydration mismatch.

---

# VI. Execution Preview (Xem trước thực thi)

1. Sửa file `ServiceListPreview.tsx`.
2. Sửa file `HomeComponentRenderer.tsx`.
3. Kiểm tra biên dịch dự án bằng `bunx tsc --noEmit`.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra biên dịch (Static Check)
* Chạy lệnh `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo không có lỗi type.

### Kiểm tra thực tế (Manual)
* Mở trang chỉnh sửa Home Component của Service List trong Admin, bật Dark Mode preview, kiểm tra giao diện đổi sang tối.
* Mở Trang Chủ ngoài site thực tế, bật Dark Mode, kiểm tra Card dịch vụ hiển thị nền xám đen/chữ sáng đồng bộ.

---

# VIII. Todo

- [ ] Cập nhật `ServiceListPreview.tsx` tách component con `ServiceListPreviewInner`.
- [ ] Cập nhật `HomeComponentRenderer.tsx` chuyển `isDark` sang React State + Effect.
- [ ] Chạy `bunx tsc --noEmit` verify compile.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Nền preview admin đổi sang màu tối khi click toggle.
* Card dịch vụ trong preview admin đổi sang màu tối xám đen tương thích.
* Card dịch vụ trên trang chủ site thực tế hiển thị màu tối đồng bộ với theme tối của trang web.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* Rủi ro thấp. Nếu lỗi xảy ra, có thể rollback các file về phiên bản commit trước đó.
