
# Spec: Calendar — Bỏ Features + Đổi "Gia hạn" thành tạo task mới

## DARE Analysis

```
1. [Main] 3 thay đổi song song:
   1.1 [A] Bỏ mục "Tính năng" ở /system/modules/calendar
       ROOT: calendar.config.ts có features[] → ModuleConfigPage render FeaturesCard
   1.2 [B] Bỏ status "Đã gia hạn" (Renewed) khỏi toàn bộ hệ thống
       ROOT: CalendarStatus type, STATUS_OPTIONS, STATUS_LABELS, STATUS_BADGES,
              calendarStatus validator trong convex/calendar.ts, config defaultStatus options,
              markCalendarTaskRenewed mutation (không dùng nữa), column "Đã xử lý" trên board
   1.3 [C] Đổi hành vi nút "Gia hạn" → mở modal chọn ngày gia hạn mới (như form create)
       ROOT: handleMarkRenewed trong page.tsx → thay bằng mở RenewModal
             markCalendarTaskRenewed mutation → thay bằng createCalendarTask (task mới)
             task cũ sau gia hạn → status thành "Churned" (đã xử lý, không gia hạn tiếp)
```

---

## Chi tiết thay đổi

### Bước 1 — `lib/modules/configs/calendar.config.ts`
Xóa hoàn toàn mảng `features: [...]` (3 feature: enableListView, enableCustomerLink, enableProductLink).  
Giữ nguyên `settings`, `key`, `name`, v.v.  
Bỏ `defaultStatus` option `'Renewed'` khỏi danh sách options.

```ts
// Xóa:
features: [
  { key: 'enableListView', ... },
  { key: 'enableCustomerLink', ... },
  { key: 'enableProductLink', ... },
],

// Xóa option Renewed trong settings:
{ value: 'Renewed', label: 'Đã gia hạn' },
```

### Bước 2 — `convex/calendar.ts`
Xóa `v.literal('Renewed')` khỏi `calendarStatus` validator.  
Xóa `completedAt` set trong `createCalendarTask` và `updateCalendarTask` cho case `Renewed`.  
Xóa mutation `markCalendarTaskRenewed` (không còn dùng).  
Thêm mutation `renewCalendarTask`: nhận `id` (task cũ) + `newDueDate` → tạo task mới với cùng customerId/productId/title nhưng dueDate mới, status='Todo' → patch task cũ thành `Churned`.

```ts
export const renewCalendarTask = mutation({
  args: {
    id: v.id('calendarTasks'),
    newDueDate: v.number(),
    createdBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error('Task không tồn tại');
    const now = Date.now();
    // tạo task mới
    await ctx.db.insert('calendarTasks', {
      allDay: task.allDay,
      createdAt: now,
      createdBy: args.createdBy,
      customerId: task.customerId,
      dueDate: args.newDueDate,
      order: now,
      productId: task.productId,
      status: 'Todo',
      timezone: task.timezone,
      title: task.title,
      updatedAt: now,
    });
    // mark task cũ thành Churned
    await ctx.db.patch(args.id, { status: 'Churned', completedAt: now, updatedAt: now });
    return null;
  },
  returns: v.null(),
});
```

### Bước 3 — `convex/seed.ts` — `seedCalendarModule`
Trong mảng features: xóa 3 feature (enableListView, enableCustomerLink, enableProductLink).  
Trong defaultStatus options: xóa 'Renewed'.

### Bước 4 — `app/admin/calendar/_components/CalendarTaskForm.tsx`
Xóa `{ value: 'Renewed', label: 'Đã gia hạn' }` khỏi `STATUS_OPTIONS`.  
Xóa `completedAt` logic liên quan Renewed (không còn trong form).

### Bước 5 — `app/admin/calendar/page.tsx`
**5a. Xóa Renewed khỏi type và constants:**
```ts
// CalendarStatus type sẽ tự cập nhật từ Doc<'calendarTasks'>
// Xóa 'Renewed' khỏi STATUS_LABELS, STATUS_BADGES
```

**5b. Xóa `markRenewed` mutation call, thêm state cho RenewModal:**
```ts
const renewTask = useMutation(api.calendar.renewCalendarTask);
const [renewModalOpen, setRenewModalOpen] = useState(false);
const [renewTarget, setRenewTarget] = useState<Id<'calendarTasks'> | null>(null);
```

**5c. Thêm `handleRenew(taskId)` mở modal:**
```ts
const handleRenew = (taskId: Id<'calendarTasks'>) => {
  setRenewTarget(taskId);
  setRenewModalOpen(true);
};
```

**5d. Đổi nút "Gia hạn ✓" (board) và "Gia hạn" (list):**
- Trước: `onClick={() => handleMarkRenewed(task.sourceId)}`  
- Sau: `onClick={() => handleRenew(task.sourceId)}`  
- Bỏ `disabled={task.status === 'Renewed' || ...}` → `disabled={task.status === 'Churned'}`

**5e. Đổi cột "Đã xử lý" trên board:**
- Trước: filter `status === 'Renewed' || status === 'Churned'`  
- Sau: filter chỉ `status === 'Churned'`  
- Đổi label: "Đã xử lý" → "Không gia hạn"

**5f. Thêm `RenewModal` component inline (hoặc tách file):**
Modal đơn giản gồm: date picker chọn "Ngày gia hạn mới" + các nút quick (+1 tháng, +3 tháng, +6 tháng, +1 năm) + nút Confirm.  
Khi confirm: gọi `renewTask({ id: renewTarget, newDueDate, createdBy: user.id })`.  
Dùng lại `Dialog` + pattern của `CalendarTaskModal`.

**5g. Xóa import `markCalendarTaskRenewed`.**

---

## Checklist

- [ ] `calendar.config.ts` — xóa `features[]`, xóa option Renewed trong settings
- [ ] `convex/calendar.ts` — xóa `v.literal('Renewed')`, xóa `markCalendarTaskRenewed`, thêm `renewCalendarTask`
- [ ] `convex/seed.ts` / `seedCalendarModule` — xóa features + Renewed option
- [ ] `CalendarTaskForm.tsx` — xóa Renewed khỏi STATUS_OPTIONS
- [ ] `page.tsx` — xóa Renewed khỏi labels/badges, đổi nút Gia hạn, thêm RenewModal, sửa board column "Đã xử lý"
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit
