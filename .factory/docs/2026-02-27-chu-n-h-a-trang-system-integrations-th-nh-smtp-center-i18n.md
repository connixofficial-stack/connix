## Problem Graph
1. [Main] Nâng cấp `/system/integrations` thành trang “Tích hợp” có cấu hình SMTP, preview email, test gửi email và hiển thị giới hạn Gmail free <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [UI/i18n chưa đúng] label sidebar đang là “Phân tích/Analytics”, nội dung page hardcode English
   1.2 [SMTP config chưa có] trang integrations chưa lưu được các key SMTP vào settings
   1.3 [Test email chưa có backend] cần endpoint server để gửi SMTP thật an toàn
   1.4 [Mail đang nằm ở /admin/settings + module settings] cần gỡ để tránh phức tạp theo yêu cầu

## Execution (with reflection)
1. Cập nhật i18n và label “Tích hợp”
   - File: `app/system/i18n/translations.ts`
   - Đổi `sidebar.analytics` (vi) từ “Phân tích” -> “Tích hợp”; en -> “Integrations`.
   - Đổi `pages.analyticsIntegrations` thành text trung tính “Tích hợp/Integrations”.
   - Thêm namespace mới `integrations` (vi/en) cho toàn bộ text UI: tiêu đề, mô tả, field labels, nút lưu, preview, test gửi, thông báo lỗi/thành công, khối giới hạn Gmail.
   - Reflection: ✓ Giữ đúng i18n hiện có, không hardcode text mới.

2. Refactor giao diện `/system/integrations` thành SMTP Integration Center
   - File: `app/system/integrations/page.tsx`
   - Thay UI analytics card tĩnh bằng form SMTP dùng `useQuery(api.settings.getMultiple)` + `useMutation(api.settings.setMultiple)`.
   - Key lưu: `mail_driver`, `mail_host`, `mail_port`, `mail_username`, `mail_password`, `mail_encryption`, `mail_from_email`, `mail_from_name` (đúng mapping kiểu `.env`).
   - Driver mặc định khóa ở `smtp` (hoặc select chỉ SMTP) theo yêu cầu “test với smtp”.
   - Thêm khối **Email Preview**:
     - Inputs: `previewSubject`, `previewHtml` (editable)
     - Live preview card render HTML (sandbox bằng wrapper + warning, không execute script).
   - Thêm khối **Test Send**:
     - Input email nhận test
     - Nút “Gửi email test” gọi API route mới.
   - Thêm khối **Gmail SMTP Free Limits** hiển thị rõ: giới hạn gửi/ngày, giới hạn recipients/message, khả năng bị khóa tạm thời 24h, kèm note “Google có thể thay đổi chính sách”.
   - Reflection: ✓ Toàn bộ cấu hình + preview + test tập trung tại đúng `/system/integrations`.

3. Thêm backend gửi test email qua SMTP
   - File mới: `app/api/system/integrations/test-email/route.ts`
   - Dùng server-side Convex client (`getConvexClient` + `api.settings.getMultiple`) để lấy SMTP settings đã lưu.
   - Cài dependency `nodemailer` (và types nếu cần).
   - Validate input (`to`, `subject`, `html`) + validate SMTP config thiếu field bắt buộc thì trả lỗi rõ ràng.
   - Tạo transporter SMTP (host/port/secure/auth) và `sendMail` với from lấy từ settings.
   - Trả JSON success/failure để UI toast.
   - Không log password; sanitize error message.
   - Reflection: ✓ Tách gửi mail sang server route để bảo mật secret.

4. Gỡ mail khỏi `/admin/settings` và module settings của module `settings`
   - File: `app/admin/settings/page.tsx`
     - Xóa tab `mail` khỏi `TAB_CONFIG`, xóa label `mail` khỏi `GROUP_LABELS`.
     - Xóa renderer branch đặc thù cho `mail_driver`, `mail_encryption` (nếu không còn dùng).
   - File: `convex/seeders/settings.seeder.ts`
     - Xóa feature `enableMail` trong `moduleFeatures` seed.
     - Xóa toàn bộ `moduleFields` mail_* khỏi seed config của module `settings`.
   - File: `convex/seed.ts`
     - Đồng bộ xóa `enableMail` + mail fields trong phần seed module settings tương ứng.
   - Lưu ý: vẫn giữ key mail trong bảng `settings` để `/system/integrations` dùng chung dữ liệu runtime.
   - Reflection: ✓ Đúng yêu cầu “bỏ ở /admin/settings và /system/modules/settings”, không phá dữ liệu SMTP đã lưu.

5. Đồng bộ UX/Validation
   - Trong `app/system/integrations/page.tsx`:
     - Validate port số hợp lệ; email from/test đúng format cơ bản.
     - Nút Save chỉ bật khi có thay đổi; hiển thị trạng thái saving/sending.
     - Password input dạng `type=password` + nút show/hide.
   - Reflection: ✓ Tránh cấu hình sai và giảm lỗi vận hành.

6. Verification & commit (khi implement)
   - Chạy: `bunx tsc --noEmit` (theo rule repo).
   - Review diff tránh lộ secret (đặc biệt tuyệt đối không hardcode mật khẩu Gmail user cung cấp vào seed/code).
   - Commit 1 commit gọn theo scope feature (không push).
   - Reflection: ✓ Đáp ứng quy tắc repo và an toàn thông tin.

Nếu bạn duyệt plan này, mình sẽ implement đúng các bước trên.