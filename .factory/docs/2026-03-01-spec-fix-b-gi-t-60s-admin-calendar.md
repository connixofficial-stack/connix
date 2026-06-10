Chuẩn, mình chốt fix theo lựa chọn của bạn: **chỉ cập nhật khi có thao tác CRUD/filter/switch view**, không auto tick 60s nữa.

## Vì sao Convex realtime vẫn bị case này?
- Convex realtime tự đẩy khi **data DB thay đổi**.
- Trạng thái “quá hạn/sắp đến hạn” phụ thuộc **thời gian hiện tại (now)**, mà now không phải record DB.
- Nên trước đó mới dùng `setInterval` để đẩy `now` đi lên; cái này gây cảm giác giựt.

## Kế hoạch implement (không chia phase)
1. **File** `app/admin/calendar/page.tsx`
   - Xóa state `nowTick` và `useEffect(setInterval 60_000)`.
   - Thay `now: nowTick` trong `useQuery(api.calendar.listUpcomingTasks, ...)` bằng `now: queryNow` (state cố định, chỉ đổi khi user action).
   - Thay `overdueCount` trong month cell từ so sánh `... < nowTick` sang `... < queryNow`.

2. **File** `app/admin/calendar/page.tsx`
   - Thêm state mới: `const [queryNow, setQueryNow] = useState(() => Date.now())`.
   - Tạo helper `refreshNow()` = `setQueryNow(Date.now())`.
   - Gọi `refreshNow()` tại đúng các điểm user action:
     - Sau `handleMarkDone` thành công.
     - Sau `handleDelete` thành công.
     - Khi đổi `statusFilter`, `priorityFilter`, `assigneeFilter`.
     - Khi đổi view month/list (`setView`).
     - Khi chuyển tháng (`handlePrevMonth`, `handleNextMonth`) để đồng bộ overdue badge.

3. **File** `app/admin/calendar/page.tsx`
   - Giữ nguyên các query/filter/pagination còn lại (KISS, không đụng backend).
   - Không thêm polling, không thêm timer, không thêm listener focus.

4. **Verification**
   - Chạy: `bunx tsc --noEmit`.
   - Manual check:
     - Mở `/admin/calendar` đứng yên không còn nháy/giựt theo chu kỳ.
     - Sau CRUD/filter/switch view, block overdue/dueSoon cập nhật đúng.
     - Không còn loop render.

5. **Commit**
   - Commit 1 phát theo convention: `fix(calendar): remove 60s tick and refresh on user actions`
   - Add kèm `.factory/docs` theo rule repo.

## Kết quả mong đợi
- Hết giựt 60s.
- UX mượt khi đứng yên màn hình.
- Dữ liệu “quá hạn/sắp đến hạn” vẫn cập nhật đúng theo thao tác người dùng.