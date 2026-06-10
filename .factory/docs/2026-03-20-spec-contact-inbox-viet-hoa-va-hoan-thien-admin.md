## TL;DR kiểu Feynman
- Đổi nhãn `Contact Inbox` sang **`Tin nhắn liên hệ`** vì đây là cách gọi ngắn, rõ nghĩa nhất cho nơi chứa tin nhắn gửi từ form liên hệ.
- Giữ `contactInbox` làm key kỹ thuật/internal route logic, chỉ Việt hoá label, tiêu đề, mô tả, microcopy hiển thị.
- Nâng `/admin/contact-inbox` lên chuẩn resource admin giống `/admin/products`: có xem chi tiết, sửa/xóa, chọn nhiều, thao tác hàng loạt.
- Mục tiêu là admin mới vào lần đầu cũng hiểu ngay: đây là danh sách tin nhắn khách gửi từ homepage hoặc trang `/contact`.
- Thay đổi nhỏ theo pattern sẵn có, ưu tiên reuse table utilities và Convex APIs hiện hữu.

## Audit Summary
### Observation
- Hiện UI dùng tên **`Contact Inbox`** ở module config, sidebar và trang admin, trong khi phần còn lại của admin chủ yếu là tiếng Việt.
- `/admin/contact-inbox` hiện chỉ có list + đổi trạng thái từng dòng; chưa có detail/edit/delete/bulk actions.
- Pattern chuẩn để bám theo đã có sẵn ở `/admin/products` với `BulkActionBar`, `DeleteConfirmDialog`, pagination, filter, column toggle.

### Inference
- Vấn đề "không rõ nghĩa" đến từ **label tiếng Anh + từ `Inbox` dễ liên tưởng email**, không mô tả rõ đây là dữ liệu từ form liên hệ.
- Vấn đề "không làm admin resource hoàn chỉnh" đến từ việc Contact Inbox mới dừng ở mức MVP ingestion/listing, chưa follow pattern list resource chuẩn của repo.

### Decision
- Dùng label chính: **`Tin nhắn liên hệ`**.
- Lý do: gọn hơn `Liên hệ từ khách hàng`, ít mơ hồ hơn `Hộp thư liên hệ`, và sát nhất với hành vi thật là lưu các message submit từ form.

## Root Cause Confidence
**High** — Evidence rõ từ các file hiện tại:
- `lib/modules/configs/contact-inbox.config.ts`: tên module đang là `Contact Inbox`.
- `app/admin/contact-inbox/page.tsx`: title/subtitle còn pha EN/VN, chỉ có status update.
- `app/admin/components/Sidebar.tsx`: sidebar label dùng `Contact Inbox`.
- `convex/contactInbox.ts`: chưa có CRUD/bulk APIs tương đương products.
- `app/admin/products/page.tsx` + `app/admin/components/TableUtilities.tsx`: đã có pattern chuẩn để copy/reuse.

## Tên hiển thị đề xuất
**Option A (Recommend) — `Tin nhắn liên hệ`** — Confidence 90%  
Ngắn, đúng ngữ nghĩa, quen với SaaS/admin CMS, và nói rõ đây là message từ contact form chứ không phải email inbox.

**Option B — `Yêu cầu liên hệ`** — Confidence 65%  
Phù hợp nếu muốn nhấn vào lead/request, nhưng hơi lệch vì không phải mọi submission đều là "yêu cầu".

## Files Impacted
### UI / module labels
- **Sửa:** `lib/modules/configs/contact-inbox.config.ts`  
  Vai trò hiện tại: khai báo metadata/feature/settings của module contact inbox.  
  Thay đổi: đổi `name`, description, feature labels/note sang tiếng Việt rõ nghĩa hơn, thống nhất với admin UI.

- **Sửa:** `app/admin/components/Sidebar.tsx`  
  Vai trò hiện tại: render menu admin theo module enable state.  
  Thay đổi: đổi label menu từ `Contact Inbox` sang `Tin nhắn liên hệ`.

- **Sửa:** `app/admin/contact-inbox/page.tsx`  
  Vai trò hiện tại: list inbox cơ bản + đổi trạng thái từng dòng.  
  Thay đổi: đổi toàn bộ title/subtitle/empty state/filter text/action text sang tiếng Việt rõ nghĩa.

- **Sửa:** `app/admin/dashboard/page.tsx`  
  Vai trò hiện tại: widget tổng quan dashboard có card recent contact inbox.  
  Thay đổi: đổi label widget/link liên quan sang tiếng Việt đồng bộ.

### Admin resource completion
- **Sửa:** `convex/contactInbox.ts`  
  Vai trò hiện tại: submit/list/stats/update status cho contact inquiries.  
  Thay đổi: thêm `getById`, `remove`, `bulkRemove`, `listAdminIds`, có thể thêm `updateInquiry` nếu cần edit trong admin.

- **Sửa:** `app/admin/contact-inbox/page.tsx`  
  Vai trò hiện tại: list đơn giản.  
  Thay đổi: nâng lên pattern products với row select, bulk action bar, delete confirm, pagination chuẩn hơn, có thể thêm column toggle nếu scope cho phép.

- **Thêm:** `app/admin/contact-inbox/[id]/page.tsx` hoặc `...[id]/edit/page.tsx`  
  Vai trò hiện tại: chưa có trang detail/edit.  
  Thay đổi: tạo trang xem chi tiết hoặc chỉnh sửa bản ghi để hoàn thiện CRUD.

- **Có thể sửa/reuse:** `app/admin/components/DeleteConfirmDialog.tsx`, `app/admin/components/TableUtilities.tsx`  
  Vai trò hiện tại: shared utilities cho resources admin.  
  Thay đổi: chỉ reuse; không sửa nếu API contract contact inbox bám được pattern products.

## Execution Preview
1. Đọc lại `contact-inbox` module/admin/convex để chốt field và terminology hiển thị.
2. Việt hoá nhãn ở module config, sidebar, dashboard và trang admin thành `Tin nhắn liên hệ`.
3. Bổ sung Convex admin APIs còn thiếu cho detail/delete/bulk delete/list ids.
4. Nâng list page `/admin/contact-inbox` theo pattern `/admin/products`: chọn dòng, bulk actions, confirm xóa, filter/pagination rõ ràng.
5. Tạo trang detail/edit tối thiểu để resource có CRUD usable.
6. Static review: typing, null-safety, compatibility với dữ liệu cũ; sau đó commit local.

## Acceptance Criteria
- Sidebar, module config, dashboard card, title trang admin đều hiển thị **`Tin nhắn liên hệ`** thay cho `Contact Inbox`.
- Một admin mới nhìn vào là hiểu đây là nơi chứa tin nhắn khách gửi từ form liên hệ trên homepage hoặc trang `/contact`.
- `/admin/contact-inbox` có thể xóa từng bản ghi và xóa hàng loạt.
- Có ít nhất một màn xem chi tiết hoặc chỉnh sửa cho từng tin nhắn.
- Bulk select hoạt động theo pattern quen thuộc của repo, không phá behavior hiện tại của status update/listing.
- Không đổi key kỹ thuật `contactInbox` và không cần migration dữ liệu.

## Verification Plan
- **Typecheck:** sau khi code, chạy `bunx tsc --noEmit` vì có thay đổi TS/code.
- **Static review:** rà lại imports, Convex arg/return types, handling null/undefined, state pagination/selection khi filter đổi.
- **Repro checklist:**
  1. Mở `/system/modules/contactInbox` thấy label tiếng Việt.
  2. Mở `/admin/contact-inbox` thấy title/subtitle tiếng Việt, list load bình thường.
  3. Chọn 1 dòng và nhiều dòng để xóa.
  4. Mở detail/edit của một inquiry.
  5. Kiểm tra dashboard card/link liên quan hiển thị đúng label.

## Out of Scope
- Không đổi route `/admin/contact-inbox` sang URL tiếng Việt.
- Không thêm email sending/workflow automation.
- Không triển khai retention cleanup job trừ khi user muốn mở rộng scope.
- Không làm import/export Excel nếu chưa thật sự cần cho inbox.

## Risk / Rollback
- **Rủi ro thấp:** chủ yếu là đổi label + thêm CRUD/bulk theo pattern có sẵn.
- **Rủi ro trung bình:** bulk selection/delete có thể lệch behavior nếu API contract không khớp products; giảm rủi ro bằng cách reuse đúng utilities hiện có.
- **Rollback:** revert commit là đủ vì không đổi schema bắt buộc hay migration phá dữ liệu.

Nếu duyệt spec này, tôi sẽ triển khai theo hướng **`Tin nhắn liên hệ`** làm tên hiển thị chính và hoàn thiện admin resource theo chuẩn products.