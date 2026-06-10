
# Spec: Đơn giản hóa Calendar → Nhắc Gia Hạn AI cho anh Điền (Full)

## Bài toán cốt lõi

Anh Điền bán tài khoản AI (ChatGPT, Claude...). Mỗi khách mua = 1 task có ngày hết hạn. Anh cần nhìn vào `/admin/calendar` và thấy ngay **"ai sắp hết hạn → gọi điện kêu gia hạn"**.

```
Khách: Nguyễn Văn A | Sản phẩm: ChatGPT Plus | Hết hạn: 15/04/2026
→ Nhắc trước 3 ngày → xuất hiện ở "Sắp đến hạn"
→ Gọi khách → Gia hạn thêm 1 tháng → Sửa dueDate → 15/05/2026
```

---

## Phần 1 — Schema & Backend

### 1.1 `convex/schema.ts` — thêm 2 field vào `calendarTasks`
```ts
customerId: v.optional(v.id("customers")),
productId: v.optional(v.id("products")),
// Thêm 2 index:
.index("by_customer", ["customerId"])
.index("by_product", ["productId"])
```
> Giữ nguyên `rrule`, `startAt`, `recurrenceEndAt`, `exdates` — **không xóa** để không mất data cũ.

### 1.2 `convex/calendar.ts` — cập nhật 3 chỗ
- `calendarTaskDoc`: thêm `customerId: v.optional(v.id('customers'))`, `productId: v.optional(v.id('products'))`
- `createCalendarTask`: thêm 2 args optional → lưu vào `ctx.db.insert`
- `updateCalendarTask`: thêm 2 args optional → patch vào DB

---

## Phần 2 — Form đơn giản hóa

### 2.1 `app/admin/calendar/_components/CalendarTaskForm.tsx`

**Xóa hoàn toàn:**
- Tất cả state/logic RRULE (`recurrenceType`, `recurrenceInterval`, `recurrenceByDay`, `recurrenceEndType`, `recurrenceUntil`, `recurrenceCount`)
- Hàm `buildRrule`, `parseRrule`, `formatUntilInput`, `extractUntilTimestamp`, hằng `WEEK_DAY_OPTIONS`
- Field `startAt` trên form (backend tự set `startAt = dueDate`)
- Field `allDay` checkbox (luôn submit `allDay = true`)
- Toàn bộ JSX block RRULE

**Giữ lại (đổi label/label):**
- `title` — "Tiêu đề"
- `dueDate` → đổi label thành **"Ngày hết hạn"**, type `date` (không cần giờ phút)
- `status` — giữ nguyên
- `reminderOffset` → đổi label thành **"Nhắc trước (ngày)"**, placeholder "VD: 3", nhân 1440 khi submit
- `assigneeId`, `priority`, `description` — giữ nguyên nếu feature enabled

**Thêm mới:**
```tsx
// Dropdown khách hàng (nếu feature enableCustomerLink enabled)
const customers = useQuery(api.customers.listAll, {});
// Dropdown sản phẩm (nếu feature enableProductLink enabled)
const products = useQuery(api.products.listAll, {});

// State:
const [customerId, setCustomerId] = useState<Id<'customers'> | ''>('');
const [productId, setProductId] = useState<Id<'products'> | ''>('');
```

**Nút gia hạn nhanh (chỉ hiện khi mode === 'edit'):**
```tsx
// Bên dưới field "Ngày hết hạn"
<div className="flex gap-2">
  <button onClick={() => addDays(30)}>+1 tháng</button>
  <button onClick={() => addDays(90)}>+3 tháng</button>
  <button onClick={() => addDays(365)}>+1 năm</button>
</div>
// Logic: tính ngày mới từ dueDate state hiện tại, set lại dueDate input
function addDays(days: number) {
  const current = parseDateInput(dueDate, true);
  if (!current) return;
  setDueDate(formatDateInput(current + days * 86400000, true));
}
```

**Logic submit thay đổi:**
- Bỏ validation `startAt || dueDate` → chỉ validate `dueDate`
- Bỏ `recurrenceRule`, `recurrenceEndAt` khỏi payload
- Submit thêm `customerId: customerId || undefined`, `productId: productId || undefined`

---

## Phần 3 — Module config

### 3.1 `lib/modules/configs/calendar.config.ts`

**Xóa:** feature `enableRecurring` (linkedField: 'rrule')

**Thêm 2 feature:**
```ts
{ key: 'enableCustomerLink', label: 'Liên kết khách hàng', icon: Users, linkedField: 'customerId' },
{ key: 'enableProductLink', label: 'Liên kết sản phẩm AI', icon: ListTodo, linkedField: 'productId' },
```

---

## Phần 4 — Calendar Views (điều chỉnh cho use case nhắc hạn)

### 4.1 Month View — cập nhật cell task item
**File:** `app/admin/calendar/page.tsx` — phần render `items.slice(0, 2).map`

Hiện tại mỗi item trong cell chỉ hiện `item.title`. Cần batch load customer + product name để hiện thêm:

```tsx
// Thêm vào CalendarRangeItem type:
customerName?: string;
productName?: string;

// Sau khi lấy rangeItems, batch load:
const customerIds = [...new Set(rangeItems.flatMap(i => i.customerId ? [i.customerId] : []))];
const productIds = [...new Set(rangeItems.flatMap(i => i.productId ? [i.productId] : []))];
// Dùng useQuery với các id list → hoặc enrichment từ customersMap/productsMap

// Trong cell hiện:
• {item.customerName ?? item.title} — {item.productName}
```

> **Lưu ý:** Do Convex không có batch get by ids built-in dễ dùng, cách đơn giản nhất là: trong `listCalendarTasksRange` trả thêm `customerId` + `productId` (đã có sẵn qua schema), rồi ở client dùng 2 query `api.customers.listAll` + `api.products.listAll` làm Map tra nhanh O(1). Chỉ làm 1 lần duy nhất thay vì N query.

### 4.2 Month View — "Selected day panel"
Khi click vào ngày, panel dưới hiện task list. Thêm 1 dòng sub-text:
```tsx
<div className="font-medium truncate">{task.title}</div>
<div className="text-xs text-slate-500">
  {customerName} {productName && `— ${productName}`}
</div>
```

### 4.3 Week View — không thay đổi lớn
Use case nhắc hạn theo ngày (allDay=true), week view hiện task theo ngày là phù hợp. Chỉ cần thêm customerName vào item title display (tương tự month view). **Giữ nguyên.**

### 4.4 Day View — xem xét có nên giữ không
Day view hiện thiết kế theo giờ. Với use case allDay (nhắc hạn), task sẽ hiện ở vùng "all-day events" đầu trang. **Giữ nguyên, không sửa** — anh Điền ít dùng nhưng không gây hại.

### 4.5 Year View — rất hữu ích, thêm context
Năm view hiện tại hiện badge số task theo tháng. Với 100+ khách, anh Điền nhìn năm view sẽ thấy **tháng nào bận nhất** (VD: tháng 3 có 30 đơn hết hạn). **Giữ nguyên logic, không thay đổi.** Chỉ đổi label tooltip nếu có hover.

### 4.6 List View — quan trọng nhất, thêm cột
**File:** `app/admin/calendar/page.tsx` — phần `view === 'list'`

Thêm 2 cột vào table:
- **Khách hàng** — hiện `customerName` (lookup từ customersMap)
- **Sản phẩm** — hiện `productName` (lookup từ productsMap)

Thêm 2 filter dropdown:
- Filter theo khách hàng (chỉ hiện nếu `enableCustomerLink`)
- Filter theo sản phẩm (chỉ hiện nếu `enableProductLink`)

**Lưu ý filter:** `listCalendarTasksPage` hiện không có filter by customerId/productId. Cần thêm args + filter logic vào Convex query, thêm index `by_customer_dueDate`.

### 4.7 Upcoming panel ("Quá hạn" + "Sắp đến hạn")
Hiện chỉ hiện `task.title`. Thêm sub-text: `{customerName} — {productName}` để anh Điền biết cần gọi cho ai ngay mà không cần click vào task.

---

## Phần 5 — Batch loading customers + products

**Không dùng N+1.** Pattern:
```tsx
// Ở CalendarWorkspace, thêm 2 query:
const allCustomers = useQuery(api.customers.listAll, 
  enableCustomerLink ? {} : 'skip'
);
const allProducts = useQuery(api.products.listAll,
  enableProductLink ? {} : 'skip'
);

// Build Map O(1):
const customersMap = useMemo(() => {
  const map = new Map<string, string>(); // id → name
  allCustomers?.forEach(c => map.set(c._id, c.name));
  return map;
}, [allCustomers]);

const productsMap = useMemo(() => {
  const map = new Map<string, string>();
  allProducts?.forEach(p => map.set(p._id, p.name));
  return map;
}, [allProducts]);
```

Pass `customersMap` + `productsMap` xuống tất cả render views.

---

## Checklist thực hiện

- [ ] `convex/schema.ts` — thêm `customerId`, `productId`, 2 index
- [ ] `convex/calendar.ts` — thêm field vào `calendarTaskDoc`, `createCalendarTask`, `updateCalendarTask`; thêm args `customerId`/`productId` vào `listCalendarTasksPage` (filter)
- [ ] `app/admin/calendar/_components/CalendarTaskForm.tsx` — xóa RRULE, ẩn startAt/allDay, thêm 2 dropdown, nút gia hạn nhanh, đổi reminder sang ngày
- [ ] `app/admin/calendar/page.tsx`:
  - Thêm query `allCustomers`, `allProducts` + 2 Map
  - Month view cell: hiện customerName + productName trong item
  - Month selected panel: thêm sub-text khách + SP
  - Upcoming panels: thêm sub-text khách + SP
  - List view: thêm 2 cột + 2 filter dropdown
- [ ] `lib/modules/configs/calendar.config.ts` — xóa enableRecurring, thêm enableCustomerLink + enableProductLink
- [ ] `bunx tsc --noEmit`
- [ ] Commit kèm `.factory/docs`

---

## Tóm tắt thay đổi per view

| View | Thay đổi |
|---|---|
| **Month** | Cell task hiện tên khách + SP; selected panel có sub-text |
| **Week** | Hiện tên khách trong item (minor) |
| **Day** | Giữ nguyên |
| **Year** | Giữ nguyên (đã hữu ích) |
| **List** | Thêm 2 cột + 2 filter, hiện tên khách + SP |
| **Upcoming panels** | Thêm sub-text tên khách + SP |
