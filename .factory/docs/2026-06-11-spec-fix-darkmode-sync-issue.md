# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Khi admin thay đổi chế độ tối mặc định cho cả web ở trang quản trị (ví dụ: chuyển từ Tối sang Sáng), giao diện ngoài site thực và nút Dark Mode ở Header của chính admin đó không thay đổi tương ứng. Điều này xảy ra do trình duyệt của họ đã lưu giá trị ghi đè (`site_theme_override`) trong `localStorage` từ các lần click trước, và hệ thống chưa phát sự kiện đồng bộ khi DB thay đổi.
* **Giải pháp**: 
  - Lưu cấu hình mặc định đã áp dụng gần nhất vào `localStorage` dưới khóa `site_theme_last_default`.
  - Khi cấu hình DB thay đổi, nếu mặc định mới khác `site_theme_last_default`, hệ thống sẽ tự động xoá `site_theme_override` trong `localStorage` để áp dụng ngay mặc định mới.
  - Đồng thời phát sự kiện `'site-theme-change'` để cập nhật đồng bộ icon mặt trăng/mặt trời của nút Toggle ở Header.

## 2. Elaboration & Self-Explanation
* Hiện tại, cơ chế theme hoạt động theo thứ tự ưu tiên: `localStorage (site_theme_override)` > `Convex DB (site_dark_mode)`.
* Khi admin nhấn nút đổi theme ở Header ngoài site thực, `site_theme_override` được lưu lại. Về sau, khi admin thay đổi `site_dark_mode` trong trang quản trị, Convex đẩy cấu hình mới xuống trình duyệt, nhưng do `site_theme_override` vẫn tồn tại, hàm `applyTheme()` bỏ qua giá trị DB mới dẫn đến việc thay đổi cấu hình DB không có tác dụng trên trình duyệt của admin.
* Để giải quyết, ta đưa vào cơ chế phát hiện thay đổi cấu hình từ DB:
  - So sánh cấu hình DB hiện tại với `site_theme_last_default`. Nếu có sự khác biệt, chứng tỏ admin vừa mới lưu cấu hình mặc định mới.
  - Lúc này ta xoá bỏ `site_theme_override` để buộc trình duyệt phải tuân thủ cấu hình DB mới của admin.
  - Sau đó, phát sự kiện `'site-theme-change'` (có kiểm tra tránh vòng lặp vô hạn) để nút bấm ở Header và toàn bộ các component khác cập nhật lại giao diện tương ứng theo class `dark` của thẻ `<html>`.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: Admin đang mở song song trang quản trị `/system/experiences` (đang chọn Chế độ sáng) và trang chủ site thực (đang hiển thị màu tối do trước đó admin click nút mặt trăng). Khi admin đổi cấu hình ở trang quản trị thành "Chế độ tối" và bấm Lưu, site thực lập tức nhận được cấu hình Tối từ Convex, nhận thấy sự thay đổi từ Sáng -> Tối, xoá giá trị ghi đè cũ và lập tức chuyển trang web sang chế độ tối. Đồng thời icon ở Header tự động chuyển sang hình Mặt trời (tương ứng với việc đang ở chế độ tối).
* **Hình ảnh đời thường**: Việc này giống như một căn phòng có nút chỉnh độ sáng thủ công ở tường (localStorage) và một trung tâm điều khiển từ xa (DB). Khi trung tâm phát lệnh thay đổi chế độ chiếu sáng mặc định của cả toà nhà, công tắc thủ công ở tường sẽ tự động được reset lại theo lệnh mới của trung tâm để tránh tình trạng công tắc ở trạng thái Tắt nhưng bóng đèn thì đang Sáng.

# II. Audit Summary (Tóm tắt kiểm tra)
* **Thành phần quản lý Theme**: [components/site/SiteProviders.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/SiteProviders.tsx)
  - Đọc `site_theme_override` và áp dụng class `dark` nhưng không phát hiện thay đổi của `siteDarkMode` để xoá override cũ.
  - Không dispatch sự kiện `'site-theme-change'` khi theme thay đổi do DB cập nhật, khiến nút Toggle ở Header bị lệch trạng thái.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**:
  1. Thiếu cơ chế phát hiện và xoá override cũ trong `localStorage` khi cấu hình DB thay đổi.
  2. Thiếu sự kiện đồng bộ `'site-theme-change'` phát ra từ theme provider khi thay đổi class của root document.
* **Giả thuyết đối chứng**: Nếu ta chỉ xoá `site_theme_override` khi lưu ở trang admin mà không làm ở phía provider, thì những trình duyệt khác của người dùng/khách truy cập đang mở site thực sẽ không tự động cập nhật được khi admin đổi cấu hình. Do đó, việc xử lý ở `SiteProviders.tsx` là giải pháp bao quát và triệt để nhất cho tất cả các thiết bị.

# IV. Proposal (Đề xuất)
* **Cập nhật `components/site/SiteProviders.tsx`**:
  - So sánh `siteDarkMode` với `site_theme_last_default`. Nếu khác nhau, thực hiện `localStorage.removeItem('site_theme_override')` và lưu lại mặc định mới.
  - Cập nhật hàm `applyTheme(isFromEvent)` để chỉ dispatch sự kiện khi có sự thay đổi thực tế về class và không phải gọi từ chính sự kiện đó.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [components/site/SiteProviders.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/SiteProviders.tsx)
  - Vai trò: Theme Provider cấp client-side cho site thực.
  - Thay đổi: Cập nhật logic `applyTheme` và đăng ký sự kiện đồng bộ theme.

# VI. Execution Preview (Xem trước thực thi)
1. Chỉnh sửa logic trong `useEffect` của [components/site/SiteProviders.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/SiteProviders.tsx) theo đề xuất.
2. Typecheck kiểm tra.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **TypeScript**: Chạy `bunx tsc --noEmit`.
* **Manual**:
  - Mở site thực ở một tab, click nút Dark Mode ở Header để chuyển sang Tối.
  - Mở trang quản trị `/system/experiences` ở tab khác, chuyển "Giao diện mặc định" sang "Chế độ Sáng" và bấm Lưu.
  - Xác minh tab site thực lập tức tự động chuyển sang Sáng và nút Dark Mode ở Header tự động cập nhật icon Mặt trăng tương ứng mà không bị lệch.

# VIII. Todo
- [ ] Cập nhật logic trong [components/site/SiteProviders.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/SiteProviders.tsx).
- [ ] Chạy typecheck kiểm thử.
- [ ] Commit code thay đổi.
- [ ] Phát âm báo hoàn thành task.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Thay đổi chế độ tối mặc định ở admin lập tức được áp dụng ngoài site thực.
* Nút theme toggle ở Header tự động cập nhật icon khớp với giao diện thực tế (Sáng -> hiển thị Moon; Tối -> hiển thị Sun).
* Không bị lỗi vòng lặp vô hạn hay hydration mismatch.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Không có rủi ro lớn.
* **Hoàn tác**: Sử dụng git để hoàn tác file.
