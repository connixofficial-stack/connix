
# Spec: Thêm lại status "Đã gia hạn" cho task cũ

## Vấn đề hiện tại
Khi bấm "Gia hạn" → task cũ bị đánh status `Churned` ("Không gia hạn") → sai nghĩa về mặt UI.

**Yêu cầu đúng:**
- Task cũ sau khi gia hạn → status `Renewed` ("Đã gia hạn")
- Task mới được tạo → status `Todo`
- `Renewed` chỉ là trạng thái kết quả, **không hiện trong dropdown** khi tạo/edit thủ công

---

## Thay đổi cần làm

### 1. `convex/schema.ts`
Thêm lại `v.literal("Renewed")` vào union status của `calendarTasks`.

### 2. `convex/calendar.ts`
Thêm lại `v.literal('Renewed')` vào `calendarStatus` validator.  
Sửa `renewCalendarTask`: đổi patch task cũ từ `Churned` → `Renewed`.

```ts
// Trong renewCalendarTask:
await ctx.db.patch(args.id, { status: 'Renewed', completedAt: now, updatedAt: now });
```

### 3. `app/admin/calendar/page.tsx`
Thêm lại `Renewed` vào `STATUS_LABELS` và `STATUS_BADGES`:
```ts
const STATUS_LABELS: Record<CalendarStatus, string> = {
  Todo: 'Chưa nhắc',
  Contacted: 'Đã liên hệ',
  Renewed: 'Đã gia hạn',   // ← thêm lại
  Churned: 'Không gia hạn',
};
const STATUS_BADGES = {
  ...
  Renewed: { variant: 'secondary' },  // ← thêm lại
  ...
};
```

Sửa filter `doneItems` để hiện cả `Renewed` và `Churned` trong cột board (nhưng tách thành 2 cột hoặc gộp chung tuỳ):
- Option đơn giản (KISS): gộp cả `Renewed` và `Churned` vào cột "Đã xử lý".

```ts
const doneItems = [...filteredOverdueItems, ...filteredUpcomingItems]
  .filter(item => item.status === 'Renewed' || item.status === 'Churned');
```

Đổi label cột board từ "Không gia hạn" → "Đã xử lý" (gộp cả 2 status).

Sửa điều kiện hiện nút "Gia hạn" trong list và board: chỉ ẩn khi `Renewed || Churned`:
```ts
// board button:
disabled={task.status === 'Renewed' || task.status === 'Churned'}
// list:
{task.status !== 'Renewed' && task.status !== 'Churned' && (...)}
```

### 4. `convex/seed.ts` và `convex/seeders/calendar.seeder.ts`
Thêm lại `'Renewed'` vào `statusPool` trong seeder.  
**Không cần** thêm option Renewed vào `defaultStatus` settings (vì nó không dùng làm default).

### 5. `app/admin/calendar/_components/CalendarTaskForm.tsx`
**Giữ nguyên** — không thêm `Renewed` vào `STATUS_OPTIONS` vì user không cần chọn thủ công.

---

## Checklist
- [ ] `convex/schema.ts` — thêm lại `v.literal("Renewed")`
- [ ] `convex/calendar.ts` — thêm lại `v.literal('Renewed')` + sửa `renewCalendarTask` patch `Renewed`
- [ ] `app/admin/calendar/page.tsx` — thêm lại `Renewed` vào labels/badges, sửa filter doneItems + disabled logic
- [ ] `convex/seeders/calendar.seeder.ts` — thêm lại `'Renewed'` vào statusPool
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit
