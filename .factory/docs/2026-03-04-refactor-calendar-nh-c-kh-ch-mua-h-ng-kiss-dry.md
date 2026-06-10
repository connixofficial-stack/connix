
# Spec: Refactor Calendar Module — Nhắc Khách Gia Hạn

## Mục tiêu
Tinh gọn + nâng cấp module Calendar thành công cụ **nhắc khách gia hạn sản phẩm AI** (Canva, CapCut...). Bỏ những gì thừa, thêm những gì thiếu. Đảm bảo KISS + DRY.

---

## Thay đổi 1: Schema Convex — Thêm status mới

**File:** `convex/schema.ts`

Thay `status` của `calendarTasks` từ:
```ts
v.union(v.literal("Todo"), v.literal("InProgress"), v.literal("Done"))
```
Thành:
```ts
v.union(
  v.literal("Todo"),       // Chưa nhắc
  v.literal("Contacted"),  // Đã liên hệ
  v.literal("Renewed"),    // Đã gia hạn ✓
  v.literal("Churned"),    // Không gia hạn ✗
)
```
> Bỏ `InProgress` (không cần trong flow nhắc). Thêm `Contacted`, `Renewed`, `Churned`.

**Thêm index mới** cho status Renewed/Churned vẫn dùng `by_status_dueDate` — không cần index mới.

---

## Thay đổi 2: Convex Backend — Cập nhật calendar.ts

**File:** `convex/calendar.ts`

- Cập nhật `calendarStatus` union: xóa `InProgress`, thêm `Contacted`, `Renewed`, `Churned`
- Cập nhật `calendarTaskDoc` tương ứng
- Cập nhật `markCalendarTaskDone` → đổi thành `markCalendarTaskRenewed` (set status = `Renewed`)
- Thêm mutation `markCalendarTaskContacted` (set status = `Contacted`)
- Thêm mutation `markCalendarTaskChurned` (set status = `Churned`)
- `listUpcomingTasks`: chỉ query status `Todo` và `Contacted` (bỏ `InProgress`)
- `listCalendarTasksPage/Range`: filter status cũ vẫn hoạt động vì union mới bao gồm các giá trị mới

---

## Thay đổi 3: Form tạo nhắc — Tối giản hoàn toàn

**File:** `app/admin/calendar/_components/CalendarTaskForm.tsx`

**Bỏ hoàn toàn các field:**
- `title` (tự động generate)
- `description` (không cần)
- `priority` (không cần trong flow nhắc)
- `reminderOffset` / `reminderAt` (1 nhắc duy nhất, không cần offset)
- `assigneeId` (không cần)
- `rrule` / `startAt` (không lặp, đơn giản)

**Chỉ còn 3 field khi tạo (mode=create):**
1. **Khách hàng** (select bắt buộc)
2. **Sản phẩm AI** (select bắt buộc)
3. **Ngày nhắc** (date picker bắt buộc)

**Logic auto-generate title:**
```ts
// Khi submit create
const customerName = customers.find(c => c._id === customerId)?.name ?? ''
const productName = products.find(p => p._id === productId)?.name ?? ''
const title = `Gia hạn ${productName} — ${customerName}`
```

**Khi edit (mode=edit):** Hiện thêm field `status` (dropdown: Chưa nhắc / Đã liên hệ / Đã gia hạn / Không gia hạn) và field `Ngày nhắc` với quick-button `+1 tháng / +3 tháng / +6 tháng / +1 năm`.

---

## Thay đổi 4: Trang /admin/calendar — Refactor toàn bộ layout

**File:** `app/admin/calendar/page.tsx`

### 4a. Bỏ những thứ thừa:
- Bỏ view: `week`, `day`, `year` — chỉ giữ **Board** (mới) + **List**
- Bỏ widget "Quá hạn" và "Sắp đến hạn" riêng lẻ → gộp vào Board
- Bỏ filter `priority`, `assignee` (không còn dùng)
- Bỏ "Hành động > Xóa toàn bộ / Xóa task cũ" (gây nguy hiểm, không cần)
- Bỏ `upcomingWindowPreset` selector

### 4b. Thêm Board View (thay thế month/week/day/year):
Layout: **4 cột ngang** (hoặc stack dọc trên mobile):

| Quá hạn 🔴 | Hôm nay 🟡 | Tuần này 🔵 | Tháng này ⚪ |
|------------|------------|------------|-------------|
| N task | N task | N task | N task |

Mỗi card trong board hiển thị:
- Tên khách hàng (bold)
- Tên sản phẩm (badge nhỏ)
- Ngày nhắc
- 3 nút action inline: **Đã liên hệ** | **Gia hạn ✓** | **Xóa**

### 4c. Widget tóm tắt đầu trang (thay 2 card cũ):
```
[ Quá hạn: 5 ]  [ Hôm nay: 3 ]  [ Tuần này: 12 ]  [ Tháng này: 28 ]
```
4 số lớn, click để scroll đến board tương ứng.

### 4d. Filter bar — chỉ giữ:
- Search theo tên khách
- Filter theo sản phẩm
- Filter theo status (Tất cả / Chưa nhắc / Đã liên hệ / Đã gia hạn / Không gia hạn)

### 4e. List View — giữ nguyên pagination nhưng cập nhật columns:
Bỏ cột: Priority, Assignee
Giữ: Checkbox | Task (tên tự động) | Khách hàng | Sản phẩm | Ngày nhắc | Trạng thái | Hành động

---

## Thay đổi 5: Module Config — calendar.config.ts

**File:** `lib/modules/configs/calendar.config.ts`

Cập nhật:
- Bỏ feature `enableMonthView` (thay bằng Board view cố định)
- Bỏ setting `upcomingWindowPreset` (không còn dùng)
- Bỏ setting `defaultPriority` (priority bị bỏ)
- Cập nhật `defaultStatus` options: bỏ `InProgress`, thêm `Contacted`, `Renewed`, `Churned`
- Giữ `calendarPerPage`, `weekStartsOn` (còn dùng cho list view)

---

## Thay đổi 6: CalendarTaskModal — cập nhật

**File:** `app/admin/calendar/_components/CalendarTaskModal.tsx`

Đọc file này để kiểm tra, nhưng về cơ bản chỉ cần pass form mới xuống — không thay đổi nhiều.

---

## Checklist hoàn thành

- [ ] `convex/schema.ts`: Đổi status union calendarTasks
- [ ] `convex/calendar.ts`: Cập nhật union, thêm 3 mutation mới, bỏ `InProgress` khỏi listUpcoming
- [ ] `CalendarTaskForm.tsx`: Rewrite — 3 field create, auto-title, edit có status + date shortcuts
- [ ] `page.tsx` (`/admin/calendar`): Bỏ view thừa, thêm Board 4 cột, cập nhật widget summary, clean filter
- [ ] `calendar.config.ts`: Bỏ feature/setting thừa, cập nhật status options
- [ ] `bunx tsc --noEmit` — pass 0 error
- [ ] Commit

---

## Lưu ý quan trọng (KISS/DRY)

- **Không tạo bảng mới** — tái dùng `calendarTasks` với status mới
- **Không thêm index mới** — `by_status_dueDate` đã cover mọi query board
- **Board query** dùng lại `listCalendarTasksRange` với date range từng cột — không cần query mới
- **Title auto-generate** chỉ xảy ra ở client khi submit create — không cần mutation riêng
- Convex migration tự động: thêm literal mới vào union không breaking data cũ (data cũ có `Todo`/`Done` vẫn valid)
