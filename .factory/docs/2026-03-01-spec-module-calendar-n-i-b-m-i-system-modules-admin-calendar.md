Đã chốt theo lựa chọn của bạn: **tạo module calendar mới hoàn toàn**, ưu tiên **Month + List**, nhắc việc mặc định **quá hạn + sắp đến hạn 24h**, và có **recurring đầy đủ theo RRULE**.

## 1) Scope & impacted paths
- System module config:
  - `app/system/modules/calendar/page.tsx`
  - `lib/modules/configs/calendar.config.ts`
  - `lib/modules/configs/index.ts`
- Admin UI:
  - `app/admin/calendar/page.tsx`
  - `app/admin/calendar/create/page.tsx`
  - `app/admin/calendar/[id]/edit/page.tsx`
- Convex:
  - `convex/schema.ts` (thêm table + index)
  - `convex/calendar.ts` (queries/mutations)
  - `convex/seeders/calendar.seeder.ts` (seed idempotent)
  - `lib/modules/seed-registry.ts` + `convex/seedManager.ts` (đăng ký seeder)

## 2) Ordered actions (step-by-step implement được ngay)
1. **Định nghĩa data contract Calendar**
   - Tạo table `calendarTasks` trong `convex/schema.ts` với field cốt lõi:
     - `title`, `description?`, `status`, `priority`, `startAt?`, `dueDate?`, `allDay`, `assigneeId?`, `createdBy`, `notes?`
     - RRULE stack: `rrule?`, `timezone`, `recurrenceEndAt?`, `exdates?` (mảng timestamp)
     - tracking: `reminderAt?`, `completedAt?`, `order`, `createdAt`, `updatedAt`
   - Index bắt buộc để tránh scan:
     - `by_dueDate`, `by_status_dueDate`, `by_assignee_dueDate`, `by_startAt`, `by_createdBy_updatedAt`.

2. **Tạo Convex API cho Calendar (không fetch-all)**
   - `listCalendarTasksRange({ from, to, assigneeId?, status?, limit, cursor? })`: filter theo range bằng index + pagination.
   - `listUpcomingTasks({ now, horizonHours=24, limit })`: trả về overdue + dueSoon.
   - `listCalendarTasksPage({ pageSize, page, sortBy, filters })`: cho List view.
   - `createCalendarTask`, `updateCalendarTask`, `deleteCalendarTask`, `markCalendarTaskDone`, `reorderCalendarTasks`.
   - `expandRecurringInstances({ from, to, timezone, limitInstances })`: parse RRULE server-side, merge với task thường, loại EXDATE.

3. **Cấu hình module ở /system/modules/calendar**
   - `calendar.config.ts` theo pattern `defineModule` đang dùng:
     - features: `enableRecurring`, `enableAssignee`, `enableReminder`, `enablePriority`, `enableListView`, `enableMonthView`
     - settings: `calendarPerPage`, `defaultStatus`, `defaultPriority`, `upcomingWindowHours` (mặc định 24), `timezoneDefault`, `weekStartsOn`
   - `app/system/modules/calendar/page.tsx` dùng `ModuleConfigPage config={calendarModule}`.
   - Export vào `lib/modules/configs/index.ts`.

4. **Xây admin page /admin/calendar (Month + List)**
   - Header: bộ lọc (status, assignee, priority, keyword, range).
   - **Month view**: hiển thị ngày có task + badge overdue/dueSoon/completed; click ngày => panel list task ngày đó.
   - **List view**: bảng/phân trang theo `calendarPerPage`, sort theo dueDate ưu tiên overdue trước.
   - Quick actions: tạo mới, mark done, chuyển overdue.
   - Banner nhắc việc: “Quá hạn” + “Sắp đến hạn trong 24h” từ `listUpcomingTasks`.

5. **Tạo create/edit pages cho calendar task**
   - Form `create/page.tsx` + `[id]/edit/page.tsx`:
     - Base fields: title, description, status, priority, dueDate/startAt, assignee, note.
     - Recurring advanced: RRULE raw + helper controls (freq, interval, byDay, until/count) để build RRULE.
     - Timezone selector (default lấy setting module).
     - Reminder offset (ví dụ 10p/30p/1h/24h trước dueDate).
   - Ẩn/hiện field theo module features giống pattern module hiện tại.

6. **Seed + wiring để module chạy ngay**
   - `calendar.seeder.ts`:
     - seed moduleFeatures/moduleFields/moduleSettings cho `moduleKey: 'calendar'` (idempotent).
     - seed sample tasks gồm: overdue, dueSoon(24h), recurring daily/weekly/monthly.
   - đăng ký vào seed registry/manager theo convention sẵn có.

7. **Tối ưu nghiệp vụ recurring (best practice 2026)**
   - Lưu RRULE canonical + timezone theo RFC 5545; không copy hàng loạt occurrence vào DB.
   - Expand occurrence theo range query (Month/List đang xem), giới hạn `limitInstances` để chống over-fetch.
   - Hỗ trợ EXDATE cho skip instance; cập nhật “this event only” bằng cách ghi exception.
   - DST-safe: luôn tính theo timezone IANA, render theo local UI.

8. **Verification trước bàn giao**
   - Chạy đúng rule repo: `bunx tsc --noEmit`.
   - Tự check đường dẫn `/system/modules/calendar` và `/admin/calendar` hoạt động, không phá module cũ.

## 3) Gate matrix (critical/non-critical) áp theo system-extension-guideline
- **Critical (phải pass)**
  - C1: Schema + index cho mọi filter/sort/range của calendar.
  - C2: Query/mutation có validator đầy đủ.
  - C3: Pagination/limit chuẩn (default 20, clamp max).
  - C4: `calendarPerPage` + `defaultStatus/defaultPriority` đọc từ moduleSettings.
  - C5: Recurring chạy theo RRULE + timezone + EXDATE, không materialize toàn bộ.
  - C6: Seed idempotent + wiring seed registry đúng.
- **Non-critical (fail thì warning + remediation)**
  - N1: UX nâng cao (drag-drop calendar cell).
  - N2: nâng cao reminder đa kênh (email/push).
  - N3: natural language scheduling.

## 4) Warnings + remediation notes
- RRULE full có độ phức tạp cao (DST/EXDATE/update single instance).
  - Remediation: implement parser/validator chặt + limit expansion range + test ca DST.
- Month view dễ over-fetch nếu không query theo range.
  - Remediation: chỉ fetch theo cửa sổ tháng hiện tại + prefetch nhẹ tháng kế.

## 5) Brainstorm feature set (để chốt backlog sau khi bạn duyệt spec)
- **Core bắt buộc (MVP)**: Month view, List view, overdue/dueSoon 24h, CRUD task, assignee, priority, recurring RRULE, filter/search, per-page setting.
- **Nâng cao hợp lý**:
  - “My Tasks” preset filter.
  - Quick complete từ month cell/list row.
  - Reminder rules theo role/team.
  - ICS export/import.
  - Dependency mini-graph (task blocked by task).
- **Không làm ngay (YAGNI)**: real-time collaboration phức tạp, Gantt timeline, AI auto-plan.

## Next-safe-step
Nếu bạn duyệt spec này, mình sẽ triển khai đúng các bước trên và commit theo quy ước repo (không push).