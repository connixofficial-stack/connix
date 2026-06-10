
# Spec: Full Cleanup Calendar Module — Schema + Convex + Seeder + UI "Sắp hết hạn"

**Kết quả brainstorm đã chốt:**
- Eliminate: xóa hẳn các field thừa trong schema, convex/calendar.ts, seeder
- Thêm setting "Cảnh báo sớm N ngày" → cột "Sắp hết hạn" riêng trên board
- Seeder cleanup: format title đúng, bỏ field thừa, đồng bộ label

---

## Các file cần thay đổi

1. `convex/schema.ts`
2. `convex/calendar.ts`
3. `convex/seeders/calendar.seeder.ts`
4. `lib/modules/configs/calendar.config.ts`
5. `app/admin/calendar/page.tsx`

---

## Bước 1 — `convex/schema.ts`: Xóa fields thừa trong `calendarTasks`

**Xóa khỏi defineTable:**
```
assigneeId, description, notes, priority, recurrenceEndAt, reminderAt, rrule, startAt, exdates
```

**Giữ lại:**
```ts
calendarTasks: defineTable({
  allDay: v.boolean(),
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
  createdBy: v.id('users'),
  customerId: v.optional(v.id('customers')),
  dueDate: v.optional(v.number()),
  order: v.number(),
  productId: v.optional(v.id('products')),
  status: v.union(v.literal('Todo'), v.literal('Contacted'), v.literal('Renewed'), v.literal('Churned')),
  timezone: v.string(),
  title: v.string(),
  updatedAt: v.number(),
})
```

**Giữ lại indexes (chỉ những index dùng field còn tồn tại):**
```ts
.index('by_dueDate', ['dueDate'])
.index('by_status_dueDate', ['status', 'dueDate'])
.index('by_customer_dueDate', ['customerId', 'dueDate'])
.index('by_product_dueDate', ['productId', 'dueDate'])
.index('by_createdBy_updatedAt', ['createdBy', 'updatedAt'])
```
**Xóa indexes:**  `by_assignee_dueDate`, `by_priority_dueDate`, `by_startAt`, `by_recurrence_end`

---

## Bước 2 — `convex/calendar.ts`: Làm sạch toàn bộ

### 2a. Xóa các hàm/logic thừa không còn dùng
- Xóa toàn bộ hàm: `parseUntil`, `parseByDay`, `parseNumberList`, `parseRrule`, `getUtcDateKey`, `startOfUtcDay`, `addUtcDays`, `getDaysInMonthUtc`, `getNthWeekdayOfMonthUtc`, `shouldIncludeMonth`, `buildReminderAt`, và logic expand rrule (tất cả code liên quan đến recurrence)
- Xóa `FAR_FUTURE`, `DAY_MAP`, các type `Frequency`, `ByDaySpec`, `RRuleSpec`
- Xóa `calendarPriority` validator

### 2b. Cập nhật `calendarTaskDoc` validator
Bỏ các field đã xóa: `assigneeId`, `description`, `notes`, `priority`, `recurrenceEndAt`, `reminderAt`, `rrule`, `startAt`, `exdates`

### 2c. Cập nhật `createCalendarTask` mutation args + handler
**Args mới (chỉ giữ):**
```ts
args: {
  allDay: v.boolean(),
  createdBy: v.id('users'),
  customerId: v.optional(v.id('customers')),
  dueDate: v.optional(v.number()),
  productId: v.optional(v.id('products')),
  status: calendarStatus,
  timezone: v.string(),
  title: v.string(),
}
```
**Handler:** bỏ logic reminderAt, rrule, priority, recurrenceEndAt. Giữ `completedAt` logic.

### 2d. Cập nhật `updateCalendarTask` mutation args + handler  
Tương tự — chỉ giữ fields còn dùng.

### 2e. Cập nhật `listCalendarTasksRange` query — bỏ param `assigneeId` nếu có

### 2f. Cập nhật `getEffectiveDueDate` helper  
Không còn dùng `startAt`, chỉ dùng `dueDate`:
```ts
function getEffectiveDueDate(task: { dueDate?: number }) {
  return task.dueDate ?? 0;
}
```

---

## Bước 3 — `convex/seeders/calendar.seeder.ts`: Cleanup + Realistic

### 3a. Cập nhật `generateFake()`:
```ts
generateFake(): CalendarTaskData {
  const createdBy = this.randomElement(this.users);
  const status = this.randomElement(['Todo', 'Contacted', 'Renewed', 'Churned'] as const);
  const daysOffset = this.randomInt(-10, 60);
  const dueDate = Date.now() + daysOffset * 86400000;
  const customerNames = ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Cường', 'Phạm Thu Dung', 'Hoàng Văn Em'];
  const productNames = ['ChatGPT Plus', 'Claude Pro', 'Gemini Advanced', 'Copilot Pro', 'Midjourney'];
  const customerName = this.randomElement(customerNames);
  const productName = this.randomElement(productNames);
  return {
    allDay: true,
    completedAt: status === 'Renewed' ? Date.now() : undefined,
    createdAt: Date.now(),
    createdBy: createdBy._id,
    dueDate,
    order: Date.now(),
    status,
    timezone: 'Asia/Ho_Chi_Minh',
    title: `Gia hạn ${productName} — ${customerName}`,
    updatedAt: Date.now(),
  };
}
```
> Lưu ý: Không seed `customerId`/`productId` để tránh dependency phức tạp. Title đã có tên thật.

### 3b. Cập nhật `seedModuleConfig()`:
- Đổi feature name `'Liên kết sản phẩm AI'` → `'Liên kết sản phẩm'`  
- Đổi field name `'Sản phẩm AI'` → `'Sản phẩm'`
- Thêm setting mới: `{ moduleKey: 'calendar', settingKey: 'warningDays', value: 7 }`

### 3c. Cập nhật `dependencies`: bỏ yêu cầu `users` là `required: true` vì title giờ faker, không cần user real

---

## Bước 4 — `lib/modules/configs/calendar.config.ts`: Thêm setting mới

```ts
settings: [
  { key: 'calendarPerPage', label: 'Số dòng mỗi trang', type: 'number', default: 20 },
  { key: 'defaultStatus', label: 'Trạng thái mặc định', type: 'select', default: 'Todo', options: [...] },
  { key: 'weekStartsOn', label: 'Bắt đầu tuần', type: 'select', default: 'monday', options: [...] },
  // THÊM MỚI:
  {
    key: 'warningDays',
    label: 'Cảnh báo sớm (ngày)',
    type: 'number',
    default: 7,
  },
],
```

---

## Bước 5 — `app/admin/calendar/page.tsx`: Cột "Sắp hết hạn" + UI cleanup

### 5a. Đọc setting `warningDays`:
```ts
const warningDays = useMemo(() => {
  const raw = settingsData?.find(s => s.settingKey === 'warningDays')?.value as number | undefined;
  return Math.max(raw ?? 7, 1);
}, [settingsData]);
```

### 5b. Tính ngưỡng cảnh báo sớm:
```ts
const warnThreshold = useMemo(() => todayStart + warningDays * 86400000, [todayStart, warningDays]);
```

### 5c. Tách `upcomingItems` thành 2 bucket:
```ts
const dueSoonItems = useMemo(() =>
  filteredUpcomingItems.filter(item => {
    const due = getEffectiveDueDate(item);
    return due > todayEnd && due <= warnThreshold;
  }), [...]);

const laterItems = useMemo(() =>
  filteredUpcomingItems.filter(item => {
    const due = getEffectiveDueDate(item);
    return due > warnThreshold;
  }), [...]);
```

### 5d. Board columns mới (5 cột):
```ts
const boardColumns = [
  { key: 'overdue', label: 'Quá hạn', items: filteredOverdueItems },
  { key: 'today', label: 'Hôm nay', items: todayItems },
  { key: 'soon', label: `Sắp hết hạn (${warningDays}n)`, items: dueSoonItems },
  { key: 'later', label: 'Sắp tới', items: laterItems },
  { key: 'done', label: 'Đã xử lý', items: doneItems },   // Renewed + Churned gần đây
];
```

> `doneItems`: task Renewed/Churned có `completedAt` trong 30 ngày gần đây (từ query hiện tại lấy upcoming, có thể thêm query riêng nhỏ cho completed gần đây)

### 5e. Card highlight màu:
- Card trong cột `overdue`: border-red-200 bg-red-50
- Card trong cột `soon`: border-yellow-200 bg-yellow-50  
- Card trong cột `today`: border-blue-200 bg-blue-50
- Card khác: border-slate-200 (mặc định)

### 5f. Xóa các biến/state không còn dùng sau cleanup schema:
- Bỏ `weekStart`, `weekEnd`, `weekItems` nếu không có cột "Tuần này" nữa
- Đơn giản hóa: board chỉ cần dueDate, không cần startAt

### 5g. Cập nhật `getEffectiveDueDate` trong page:
```ts
const getEffectiveDueDate = (task: { dueDate?: number }) => task.dueDate ?? 0;
```

---

## Checklist tổng thể

- [ ] `convex/schema.ts`: xóa 9 fields + 4 indexes thừa
- [ ] `convex/calendar.ts`: xóa rrule logic, cập nhật mutations/validator
- [ ] `convex/seeders/calendar.seeder.ts`: generateFake mới, label đồng bộ, thêm warningDays setting
- [ ] `lib/modules/configs/calendar.config.ts`: thêm setting `warningDays`
- [ ] `app/admin/calendar/page.tsx`: cột "Sắp hết hạn", highlight màu card, đọc warningDays
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit

---

## Lưu ý quan trọng

- Convex không có migration tự động — khi xóa fields khỏi schema, **data cũ có thể còn các field đó trong DB nhưng Convex sẽ ignore** (không lỗi, chỉ cần Convex schema dùng `optional` hoặc field không bao giờ được đọc). Vì chưa production thì safe hoàn toàn.
- Nếu cần xóa data cũ: dùng `deleteAllCalendarTasks` mutation trong `/system/data` để reset và seed lại.
