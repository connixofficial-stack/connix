## Audit Summary
### Pre-Audit (evidence đã có)
- `/contact` hiện có form UI nhưng `onSubmit` chỉ `preventDefault`, chưa ghi DB, chưa gửi email (evidence: `app/(site)/contact/page.tsx`).
- Route contact runtime lấy dữ liệu từ `settings group=contact/social` + `contact experience config` (evidence: `components/site/useContactPageData.ts`).
- `/admin/dashboard` đang là dashboard analytics, render theo feature flags module `analytics` và pattern card/list rõ ràng (evidence: `app/admin/dashboard/page.tsx`).
- Hệ thống có trục `/system/modules`, `/system/experiences`, `/system/data` và Data Command Center đang thiên về seed/clear/reset dữ liệu, không phải inbox vận hành (evidence: `components/data/DataCommandCenter.tsx`).
- Convex schema chưa có table cho contact submissions/inbox (evidence: `convex/schema.ts`).

### Gaps còn thiếu
- Chưa có model trạng thái xử lý message (new/read/resolved/spam).
- Chưa có mapping rõ giữa feature ở System Module và khả năng submit form thực tế.

### Root Cause
- Root cause chính: Kiến trúc hiện tại chỉ cấu hình hiển thị Contact page (UI + settings) nhưng thiếu domain “contact inbox” end-to-end (storage + admin handling + dashboard surfacing), nên form tồn tại nhưng không có nghiệp vụ lưu/đọc.

### Counter-hypothesis check
- Giả thuyết đối chứng 1: Có thể tái dùng `notifications` để lưu inbox.
  - Loại trừ: `notifications` là outbound communication, không phải inbound customer message; sai domain semantics, khó mở rộng workflow xử lý.
- Giả thuyết đối chứng 2: Lưu vào `activityLogs`.
  - Loại trừ: `activityLogs` là audit trail hành động user/admin, không phù hợp làm dữ liệu nghiệp vụ cần query/filter/pagination theo trạng thái xử lý.

### Audit Questions (đã trả lời theo evidence)
1) Triệu chứng: expected = submit lưu tin; actual = bấm gửi không lưu gì.  
2) Phạm vi: site `/contact`, admin dashboard, system module config.  
3) Repro: ổn định 100% vì `preventDefault` cố định, không gọi mutation.  
4) Mốc thay đổi: chưa thấy implementation inbox; hiện chỉ có config/preview contact.  
5) Dữ liệu thiếu: chưa có policy giữ dữ liệu bao lâu (có thể để default vô hạn + tùy chọn sau).  
6) Giả thuyết thay thế: notifications/activityLogs/settings-json (đã loại theo domain mismatch).  
7) Rủi ro fix sai: nhồi sai bảng gây technical debt, khó lọc trạng thái và dashboard chậm.  
8) Pass/fail: submit lưu DB thành công, dashboard chỉ hiện khi có, module/experience đồng bộ enable/disable.

## Root Cause Confidence
**High** — vì evidence trực tiếp từ code path runtime (`onSubmit` không mutation) + schema không có inbox table + cấu trúc module hiện hữu chỉ bao phủ config hiển thị.

## Proposal (đã chốt theo lựa chọn của bạn)
Bạn đã chọn:
- **Module inbox riêng**
- **Dashboard: Card + danh sách mới nhất**
- **Cấu hình: module riêng Contact Inbox; experience chỉ quản lý hiển thị form**

### Problem Graph
1. [Main] Contact form không email nhưng phải lưu trữ + hiển thị dashboard đồng bộ hệ thống  
   1.1 [ROOT CAUSE] Thiếu domain Contact Inbox trong schema + API  
   1.2 Thiếu lớp quản trị /admin để xử lý message  
   1.3 Thiếu kết nối module flags giữa /system/modules ↔ /contact ↔ /admin/dashboard

## Execution (with reflection) — Step-by-step actionable (1 lần implement)
1. **Thêm domain dữ liệu Contact Inbox trong Convex**
   - File: `convex/schema.ts`
   - Thêm table `contactInquiries` (hoặc `contactInbox`) với fields tối giản:
     - `name`, `email`, `phone`, `subject`, `message`
     - `status`: `new | in_progress | resolved | spam`
     - `sourcePath` (default `/contact`), `createdAt`, `updatedAt`
     - `handledBy` optional (`users` id), `handledAt` optional
   - Index:
     - `by_status_createdAt` (`status`, `createdAt`) để list nhanh
     - `by_createdAt` cho latest feed
     - `by_email_createdAt` cho tra cứu khách gửi nhiều lần
   - Reflection: đúng KISS/YAGNI (không thêm fields thừa như tags/priority ở bản đầu).

2. **Tạo API inbox (query/mutation) rõ ràng inbound**
   - File mới: `convex/contactInbox.ts`
   - Mutations/queries:
     - `submitContactInquiry` (public-safe): validate input, trim, length cap, set status=`new`
     - `listInbox` (admin): pagination + filter status (default limit 20, max 100)
     - `getInboxStats`: tổng mới/chưa xử lý/hôm nay
     - `listRecentInbox`: lấy 5-10 bản ghi mới nhất cho dashboard
     - `updateInquiryStatus`: đổi trạng thái xử lý
   - Có thể tận dụng rateLimitBuckets nếu project đang dùng cho public mutation để chống spam cơ bản.
   - Reflection: tách file riêng theo domain giúp dễ maintain và đồng bộ với module riêng.

3. **Tạo module hệ thống mới: `contactInbox`**
   - Files:
     - `lib/modules/configs/contact-inbox.config.ts` (module definition)
     - cập nhật registry module hiện có (nơi map module configs)
   - Features đề xuất:
     - `enableContactFormSubmission` (cho phép submit lưu DB)
     - `enableContactInboxAdmin` (cho phép xuất hiện menu/quản trị)
     - `enableContactDashboardWidget` (cho phép widget dashboard)
   - Settings module này (nhẹ):
     - `requireEmail` (bool), `requirePhone` (bool)
     - `inboxRetentionDays` (number, optional; 0 = không tự xóa)
   - Dependency:
     - phụ thuộc `settings` (để đồng bộ contact info/form fields)
   - Reflection: đúng convention `/system/modules` và tránh nhồi vào module settings.

4. **Nối `/contact` với module flags + submit mutation**
   - File: `app/(site)/contact/page.tsx`
   - Tạo state form controlled + loading + success/error message.
   - Submit flow:
     - Check feature `enableContactFormSubmission` (query module feature)
     - Nếu bật: call `submitContactInquiry`
     - Nếu tắt: disable nút gửi + hiển thị notice nhẹ “Biểu mẫu tạm tắt”
   - Chỉ render section form khi feature bật; map/info vẫn theo contact experience config hiện tại.
   - Reflection: giữ UI hiện tại, chỉ bổ sung behavior (không thay layout hiện có).

5. **Đồng bộ Experience Contact với module mới (1-way dependency)**
   - File: `app/system/experiences/contact/page.tsx`
   - Thay/đổi block trạng thái module để hiển thị thêm `contactInbox` feature status.
   - Rule:
     - Experience chỉ kiểm soát hiển thị (map/contact info/social/form layout)
     - quyền submit thực tế phụ thuộc module `contactInbox.enableContactFormSubmission`
   - Thêm hint rõ nghĩa trong UI editor để tránh nhầm “thấy form = gửi được”.

6. **Tạo trang quản lý inbox ở admin**
   - Files mới (theo pattern admin list hiện có):
     - `app/admin/contact-inbox/page.tsx`
     - component phụ nếu cần trong `app/admin/contact-inbox/_components/*`
   - Scope v1 (KISS):
     - bảng list: thời gian, tên, email/phone, chủ đề, trạng thái
     - filter trạng thái + search basic (name/email/subject)
     - action đổi trạng thái nhanh
     - panel/detail xem message đầy đủ
   - Bảo vệ bằng ModuleGuard key `contactInbox`.

7. **Bổ sung widget dashboard tổng quan (chỉ hiện nếu có data)**
   - File: `app/admin/dashboard/page.tsx`
   - Thêm query `getInboxStats` + `listRecentInbox`.
   - Render điều kiện:
     - chỉ khi feature `enableContactDashboardWidget` bật **và** count > 0
   - UI theo yêu cầu đã chọn:
     - 1 card “Tin nhắn liên hệ mới”
     - danh sách 5 tin gần nhất (tên + chủ đề + thời gian + status badge)
     - link “Xem tất cả” sang `/admin/contact-inbox`
   - Tránh nặng dashboard: query limit nhỏ, có index theo createdAt.

8. **Seed + System Data alignment**
   - Cập nhật seed config để có module `contactInbox` + default features bật hợp lý.
   - Không đưa inbox vận hành vào Data Command Center quick clear mặc định nếu chưa confirm, để tránh xóa nhầm lead thật; nếu cần thì đặt cảnh báo riêng cấp cao.
   - `system/data` vẫn giữ vai trò quản trị data lifecycle, không dùng làm màn hình vận hành inbox hàng ngày.

9. **Guardrails bảo mật & chất lượng dữ liệu**
   - Validate input chiều dài, format email/phone tối thiểu.
   - Strip/escape text đầu vào, không render raw HTML từ message.
   - Rate-limit submit theo IP/session (nếu có helper sẵn thì dùng).
   - Trạng thái mặc định `new`, không auto-resolve.

10. **Verification plan (khi vào implement)**
   - Repro manual:
     - Gửi form ở `/contact` → record xuất hiện trong admin inbox.
     - Dashboard chỉ hiện widget khi có record.
     - Tắt feature submit → form không gửi được (UI báo rõ).
   - Kiểm tra đồng bộ:
     - `/system/modules/contactInbox` bật/tắt ảnh hưởng đúng `/contact` + dashboard + admin inbox.
     - `/system/experiences/contact` chỉ ảnh hưởng hiển thị, không override quyền submit.
   - Typecheck theo rule repo: `bunx tsc --noEmit`.

## Post-Audit (blast radius / regression / complexity)
- Blast radius: trung bình (động vào schema + site contact + admin dashboard + system module).
- Regression risk: trung bình-thấp nếu giữ thay đổi additive, không sửa analytics logic cũ.
- Complexity/Cost: hợp lý, vì đi đúng pattern sẵn có (module flags + convex query/mutation + conditional dashboard rendering).
- KISS/YAGNI/DRY: đạt, do tách domain inbox riêng, không tái dụng sai bảng.

## Verification Plan
- **Typecheck**: `bunx tsc --noEmit`
- **Test/Repro**:
  1) Submit contact thành công và lưu DB
  2) Dashboard hiển thị card + list mới nhất khi có dữ liệu, ẩn khi không có
  3) Toggle feature/module phản ánh đúng tại `/contact`, `/admin/dashboard`, `/admin/contact-inbox`
  4) Chuyển trạng thái tin nhắn hoạt động đúng

Checklist chốt cho bạn:
- [x] Không dùng email, chỉ lưu trữ
- [x] Dashboard tổng quan gọn, chỉ hiện nếu có
- [x] Đồng bộ 3 trục `/system/modules` + `/system/experiences` + `/system/data`
- [x] Cơ động, dễ hiểu, đúng ngữ nghĩa domain