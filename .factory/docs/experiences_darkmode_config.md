# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Người dùng muốn bật/tắt chế độ Dark Mode cho toàn bộ các trang giao diện (experiences) và layout public từ trang admin tập trung.
* **Giải pháp**:
  * Thêm tab cấu hình "Chế độ tối" trong trang `/system/experiences`.
  * Lưu cấu hình `site_dark_mode` ('light' | 'dark' | 'system') trong Convex DB settings.
  * Cập nhật layout Server-side và SiteProviders Client-side để kích hoạt class `dark` dựa trên cài đặt này, loại bỏ trạng thái khóa cứng "light" hiện tại.

## 2. Elaboration & Self-Explanation
* Hiện tại các trang public (site) đều có sẵn class `dark:` cho Dark Mode nhưng bị chặn hiển thị vì `SiteProviders` luôn ép đặt theme `light` và xóa class `dark` khi hydrate, đồng thời layout server-side cũng đang hardcode `data-theme="light"`.
* Bằng cách thêm cấu hình `site_dark_mode` vào DB:
  * Ở server-side (Server Components `layout.tsx`), hệ thống sẽ đọc trực tiếp từ DB để chèn sẵn class `dark` và `data-theme="dark"` vào HTML trước khi gửi xuống client, giúp giao diện tối lập tức mà không bị nháy trắng (flicker).
  * Ở client-side (`SiteProviders`), hook `useSiteSettings` sẽ cập nhật trạng thái theme và tự động lắng nghe thay đổi của hệ điều hành nếu cấu hình là `system`. Khi unmount (rời trang public về admin), theme của trang admin (lưu trong localStorage) sẽ được khôi phục nguyên vẹn.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: Admin bật chế độ "Tối" ở trang cấu hình. Khi F5 trang `/posts`, server tạo ra mã HTML có thẻ `<html class="dark">` giúp trang hiển thị ngay màu đen. Nếu đổi sang "Hệ thống", trang sẽ tự động chuyển màu sáng/tối đồng bộ với cài đặt giao diện của hệ điều hành Windows/macOS.
* **Hình ảnh đời thường**: Việc này tương tự như lắp đặt một công tắc tự động điều chỉnh độ sáng đèn trong cả tòa nhà. Bạn có thể ép bật, ép tắt, hoặc để cảm biến ánh sáng của tòa nhà tự động điều chỉnh.

# II. Audit Summary (Tóm tắt kiểm tra)

* **Trang experiences**: [app/system/experiences/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx) quản lý layout lists qua `api.settings.setMultiple`.
* **Cơ chế theme public**: [components/site/SiteProviders.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/SiteProviders.tsx) ép đặt `light` theme và xóa class `dark`.
* **Layout server**: [app/(site)/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/layout.tsx) và [app/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/layout.tsx) hardcode `data-theme="light"`.
* **Settings keys**: [lib/get-settings.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/get-settings.ts) chưa khai báo key `site_dark_mode`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc**: Hệ thống chưa có cấu hình `site_dark_mode` và các file layout/provider phía public bị khóa cứng ở chế độ `light`.
* **Giả thuyết đối chứng**: Nếu ta chỉ bật class `dark` ở client-side, trang web sẽ bị nháy nền trắng lúc tải trang lần đầu trước khi JS chạy. Do đó, việc can thiệp từ server-side layout là vô cùng cần thiết để mang lại trải nghiệm tối ưu.

# IV. Proposal (Đề xuất)

* **Thiết lập backend settings**:
  * Thêm `site_dark_mode` vào danh sách keys của nhóm `site` trong [get-settings.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/get-settings.ts).
  * Cập nhật interface `SiteSettings` và hàm normalize.
* **Server-side Layouts**:
  * [app/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/layout.tsx) và [app/(site)/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/layout.tsx) đọc `site_dark_mode` từ `getSiteSettings()`.
  * Áp dụng class `dark` và `data-theme` thích hợp ở server render.
* **Client-side Providers**:
  * [SiteProviders.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/SiteProviders.tsx) sử dụng hook `useSiteSettings()`.
  * Điều phối toggles class `dark` dựa trên cấu hình, đồng thời thêm media query listener cho chế độ `system`.
* **Admin UI**:
  * Thêm tab `dark_mode` vào [app/system/experiences/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx).
  * Thiết kế giao diện phẳng MacBook (Calm Productivity UI) với các nút phẳng, trạng thái hover tinh tế, icon Sun/Moon/Laptop và mutation `api.settings.set`.

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa:** [lib/get-settings.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/get-settings.ts)
  * Vai trò: Load settings từ DB phía server.
  * Thay đổi: Thêm key `site_dark_mode` vào schema nạp.
* **Sửa:** [app/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/layout.tsx)
  * Vai trò: Layout cơ sở của Next.js.
  * Thay đổi: Thêm class `dark` vào thẻ `<html>` nếu `site_dark_mode === 'dark'`.
* **Sửa:** [app/(site)/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/layout.tsx)
  * Vai trò: Layout các trang public.
  * Thay đổi: Thiết lập thuộc tính `data-theme` động.
* **Sửa:** [components/site/SiteProviders.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/SiteProviders.tsx)
  * Vai trò: Quản lý trạng thái theme ở client public.
  * Thay đổi: Điều chỉnh logic toggle class và listener hệ thống.
* **Sửa:** [app/system/experiences/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx)
  * Vai trò: Trang quản trị experiences.
  * Thay đổi: Thêm tab cấu hình và thiết kế UI MacBook flat.

# VI. Execution Preview (Xem trước thực thi)

1. Thêm key `site_dark_mode` trong [lib/get-settings.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/get-settings.ts).
2. Chỉnh sửa logic class và attributes trong [app/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/layout.tsx) và [app/(site)/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/layout.tsx).
3. Cập nhật state & listeners trong [SiteProviders.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/SiteProviders.tsx).
4. Thiết kế tab cấu hình chế độ tối trong [app/system/experiences/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx).
5. Typecheck kiểm thử.

# VII. Verification Plan (Kế hoạch kiểm chứng)

* **TypeScript**: Chạy `bunx tsc --noEmit`.
* **Manual**: Test bật/tắt/system theme trên trang quản lý experiences và xác minh hiển thị ngoài site public.

# VIII. Todo

- [ ] Sửa [lib/get-settings.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/get-settings.ts).
- [ ] Sửa [app/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/layout.tsx).
- [ ] Sửa [app/(site)/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/layout.tsx).
- [ ] Sửa [components/site/SiteProviders.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/SiteProviders.tsx).
- [ ] Sửa [app/system/experiences/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx).
- [ ] Typecheck dự án.
- [ ] Phát âm thông báo hoàn thành task.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Trang `/system/experiences` hiển thị tab "Chế độ tối".
* Cho phép đổi 3 cấu hình và lưu thành công (nút lưu disable khi pristine).
* Trang public hiển thị đúng dark theme theo thiết lập, không bị chớp nháy trắng lúc tải trang.
* Theme admin không bị lỗi khi quay lại trang quản trị.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Hydration mismatch khi dùng chế độ `system`.
* **Giảm thiểu**: Render mặc định `light` phía server cho chế độ `system`, chỉ thay đổi class qua `useEffect` ở client.
* **Hoàn tác**: Sử dụng git để rollback.

# XI. Out of Scope (Ngoài phạm vi)

* Không viết lại các class `dark:` cho các component.
* Không thay đổi theme riêng của Admin dashboard.
