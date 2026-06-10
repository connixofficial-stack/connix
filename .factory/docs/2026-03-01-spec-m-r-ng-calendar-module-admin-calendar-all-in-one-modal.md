Đã chốt theo lựa chọn của bạn:
- View data: chỉ task trong range đang xem.
- Modal routing: state nội bộ trên 1 trang `/admin/calendar`.
- Upcoming window: lưu vào module setting (default 24h).
- RRULE: chỉ form tiếng Việt, không cho nhập raw.

## Problem Graph
1. [Main] Nâng cấp Calendar module + /admin/calendar theo 5 yêu cầu <- depends on 1.1, 1.2, 1.3, 1.4, 1.5
   1.1 [Range + upcoming window UX] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Cấu hình upcoming chỉ đang là số giờ cố định, chưa có preset + selector UI
   1.2 [Calendar views] <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Chỉ có month/list, chưa có week/day/year grid + range query tương ứng
   1.3 [All-in-one modal CRUD] <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] Create/Edit đang tách route riêng, không có form component tái sử dụng
   1.4 [Recurring UX thuần Việt] <- depends on 1.4.1
      1.4.1 [ROOT CAUSE] Form hiện còn lộ RRULE mental model kỹ thuật
   1.5 [CoC: bỏ notes] <- depends on 1.5.1
      1.5.1 [ROOT CAUSE] Module config + form + payload vẫn còn `notes`

## Execution (with reflection)
1. Solving 1.1.1 (Upcoming presets + setting)
- Thought: Chuẩn hóa sang enum preset để admin chọn nhanh 24h/1 tuần/1 tháng/3 tháng.
- Action:
  - `lib/modules/configs/calendar.config.ts`
    - Đổi setting `upcomingWindowHours` thành `upcomingWindowPreset` (select): `24h`, `7d`, `1m`, `3m`, default `24h`.
  - `app/admin/calendar/page.tsx`
    - Thêm selector UI cho khu “Sắp đến hạn”.
    - Map preset -> horizonHours runtime (`24`, `168`, `720`, `2160`).
    - Khi đổi preset: gọi mutation cập nhật module setting `upcomingWindowPreset`.
- Reflection: ✓ Đúng CoC, UX gọn, không hardcode giờ rời rạc trong UI.

2. Solving 1.2.1 (Month/Week/Year/Day views)
- Thought: Tách logic tính range theo view; query vẫn dùng `listCalendarTasksRange` để DRY.
- Action:
  - `app/admin/calendar/page.tsx`
    - Thay state `view` thành union: `month | week | year | day | list`, mặc định `month`.
    - Thêm toolbar switch view (Month/Week/Year/Day/List).
    - Viết helper range:
      - month: đầu-tháng -> cuối-tháng.
      - week: theo `weekStartsOn`.
      - day: ngày hiện tại (today hoặc selected day).
      - year: đầu-năm -> cuối-năm.
    - Reuse `listCalendarTasksRange` theo range view hiện tại.
    - UI render:
      - Week: 7 cột theo tuần.
      - Day: 1 cột timeline đơn giản theo ngày.
      - Year: 12 ô tháng (mỗi ô tổng hợp badge/count, click vào tháng chuyển month view tháng đó).
  - Không thêm query mới nếu chưa cần, chỉ mở rộng frontend range + render skeleton.
- Reflection: ✓ Đủ 4 view mới, tránh nổ scope backend.

3. Solving 1.3.1 (All-in-one modal CRUD)
- Thought: Tái sử dụng form logic để tránh duplicate create/edit page.
- Action:
  - Tạo component mới:
    - `app/admin/calendar/_components/CalendarTaskModal.tsx` (modal create/edit dùng chung).
    - `app/admin/calendar/_components/CalendarTaskForm.tsx` (fields + submit handler dùng chung).
  - `app/admin/calendar/page.tsx`
    - Bỏ điều hướng `router.push('/admin/calendar/create')` và link edit route.
    - Thay bằng mở modal nội bộ: mode `create | edit`, lưu `editingTaskId`.
    - Sau submit thành công: đóng modal, refresh data hiện tại.
  - `app/admin/calendar/create/page.tsx` và `[id]/edit/page.tsx`
    - Giữ file để không vỡ route cũ nhưng chuyển thành redirect nhẹ về `/admin/calendar` (hoặc hiển thị message + link quay lại), tránh duy trì flow tách trang.
- Reflection: ✓ Đúng yêu cầu all-in-one, giảm context switch.

4. Solving 1.4.1 (Recurring UX thuần Việt, ẩn RRULE raw)
- Thought: Admin cần form ngôn ngữ tự nhiên, backend vẫn lưu RRULE canonical.
- Action:
  - `app/admin/calendar/_components/CalendarTaskForm.tsx`
    - Bỏ ô nhập RRULE raw hoàn toàn.
    - Thêm nhóm tiếng Việt:
      - “Không lặp / Hàng ngày / Hàng tuần / Hàng tháng / Hàng năm”.
      - “Lặp mỗi [n] đơn vị”.
      - Với hàng tuần: chọn thứ trong tuần (T2..CN).
      - Kết thúc: “Không bao giờ / Đến ngày / Sau [n] lần”.
    - Build RRULE ngầm trước khi submit (không hiện code RRULE cho admin).
    - Ẩn các field không liên quan theo freq (ví dụ chỉ show chọn thứ khi weekly).
  - `app/admin/calendar/create/page.tsx`, `[id]/edit/page.tsx` (nếu còn dùng fallback)
    - Đồng bộ cùng form mới nếu giữ fallback.
- Reflection: ✓ Thuần Việt, ít nhiễu kỹ thuật, vẫn tương thích backend RRULE.

5. Solving 1.5.1 (Bỏ notes khỏi module + admin)
- Thought: CoC: đã có description thì bỏ notes ở mọi lớp UI/module config.
- Action:
  - `lib/modules/configs/calendar.config.ts`
    - Xóa settings/feature liên quan notes nếu có.
  - `components/modules/ModuleConfigPage.tsx`
    - Ẩn field `notes` cho calendar tương tự cách đã ẩn `timezone`.
  - `app/admin/calendar/_components/CalendarTaskForm.tsx` (và fallback pages nếu còn)
    - Xóa input ghi chú.
    - Không gửi `notes` trong payload create/update.
- Reflection: ✓ CoC rõ ràng, form gọn hơn.

## File-level checklist triển khai
- `app/admin/calendar/page.tsx`: view switch 5 chế độ, upcoming selector preset, mở modal create/edit, remove link route create/edit.
- `app/admin/calendar/_components/CalendarTaskModal.tsx`: modal wrapper.
- `app/admin/calendar/_components/CalendarTaskForm.tsx`: form dùng chung, recurring tiếng Việt, bỏ notes/timezone input.
- `app/admin/calendar/create/page.tsx`: fallback redirect về `/admin/calendar`.
- `app/admin/calendar/[id]/edit/page.tsx`: fallback redirect về `/admin/calendar`.
- `lib/modules/configs/calendar.config.ts`: cập nhật setting upcoming preset, bỏ notes/timezone khỏi bề mặt module.
- `components/modules/ModuleConfigPage.tsx`: ẩn field `notes` cho calendar (kế thừa logic hide timezone hiện có).

## Validation
- Typecheck: `bunx tsc --noEmit`.
- Manual QA:
  - `/system/modules/calendar`: thấy setting preset upcoming mới, không thấy notes/timezone.
  - `/admin/calendar`: đổi được 24h/1w/1m/3m; chuyển Month/Week/Year/Day/List ổn.
  - Tạo/sửa task hoàn toàn trong modal, không nhảy route create/edit.
  - Recurring UX tiếng Việt, không lộ RRULE raw.
  - Không còn trường ghi chú.

## Commit plan
- Commit message đề xuất: `feat(calendar): add multi-view, modal CRUD, and localized recurrence UX`
- Include `.factory/docs` nếu có file spec mới phát sinh theo rule repo.