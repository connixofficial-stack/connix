
# Spec: Fix CalendarTaskForm — 4 cải tiến nhỏ

**Phạm vi:** chỉ 2 file `CalendarTaskForm.tsx` và `calendar.config.ts`.  
**Không tạo bảng / index mới.**

---

## 1. Khách hàng — 2 chế độ: chọn DB hoặc khách lẻ (text)

**Vấn đề:** Hiện chỉ có `select` từ DB, không thể nhập tay tên khách lẻ.

**Giải pháp (KISS — dùng `title` field có sẵn):**

**Schema không cần thay đổi.** Convex đã có `title` (string). Khi khách lẻ, `customerId = undefined`, `title` = text nhập tay.

**UI trong form:**

```
[Tab: Khách trong DB | Khách lẻ]
```

- Tab **"Khách trong DB"**: `select` như hiện tại + nút "Tạo nhanh khách" (icon+).
- Tab **"Khách lẻ"**: `Input` text tự do (placeholder "Nguyễn Văn A - 090xxxx").

**Quick-add customer inline:**
- Nút `+` icon bên cạnh label "Khách hàng".
- Click mở mini-form collapse ngay bên dưới: 2 field: **Tên** (required) + **SĐT** (required). Email sẽ dùng format `sdt@nhanh.vn` để bypass unique check.
- Submit → `api.customers.create` → auto-select khách vừa tạo → đóng mini-form.

**Logic auto-generate title khi submit:**
```ts
// Nếu tab "DB" và có customerId
const customerName = customers?.find(c => c._id === customerId)?.name ?? 'Khách hàng';
// Nếu tab "lẻ" 
const customerName = guestName.trim() || 'Khách lẻ';
const productName = products?.find(p => p._id === productId)?.name ?? 'Sản phẩm';
const title = `Gia hạn ${productName} — ${customerName}`;
```

---

## 2. Sản phẩm — thêm nút mở tab mới

**UI:** Bên cạnh `select` sản phẩm, thêm nút icon `ExternalLink` (Lucide):
```tsx
<a
  href={`/admin/products/${productId}/edit`}
  target="_blank"
  rel="noopener noreferrer"
  className="..."
>
  <ExternalLink size={14} />
</a>
```
- Chỉ hiện khi `productId !== ''`.
- Sử dụng `<a>` thay vì `<button>` để `target="_blank"` hoạt động native.

---

## 3. Ngày nhắc — Quick-date presets cả 2 chế độ create + edit

**Hiện tại:** Shortcuts chỉ hiện ở `mode === 'edit'`.

**Fix:** Hiện shortcuts ở **cả create và edit**. Thêm các preset còn thiếu.

**Danh sách shortcuts:**
```
[1 ngày] [1 tuần] [2 tuần] [1 tháng] [3 tháng] [6 tháng] [1 năm]
```

**Ô "bao nhiêu ngày":**
```
[___] ngày từ hôm nay  [Áp dụng]
```

**Logic `applyFromToday(days)` (thay `applyRenewalDays`):**
```ts
// Tính từ TODAY thay vì từ dueDate hiện tại
const today = new Date();
today.setHours(0, 0, 0, 0);
setDueDate(formatDateInput(today.getTime() + days * 86400000));
```

> Lưu ý: Đổi tên hàm từ `applyRenewalDays` → `applyFromToday` — tính từ **hôm nay** thay vì từ giá trị date hiện tại (phù hợp cả create lẫn edit).  
> Khi edit, nếu muốn gia hạn từ ngày cũ thì vẫn nhập tay hoặc dùng ô "bao nhiêu ngày" rồi tự sửa.

---

## 4. Module Config — đổi label "Liên kết sản phẩm AI" → "Liên kết sản phẩm"

**File:** `lib/modules/configs/calendar.config.ts`

```ts
// Trước:
{ key: 'enableProductLink', label: 'Liên kết sản phẩm AI', ... }

// Sau:
{ key: 'enableProductLink', label: 'Liên kết sản phẩm', ... }
```

---

## Các bước implement (theo file)

### File `app/admin/calendar/_components/CalendarTaskForm.tsx`

1. **Thêm import:** `ExternalLink` từ lucide-react; `useState` thêm các state mới.
2. **Thêm state:**
   - `customerMode: 'db' | 'guest'` (default `'db'`)
   - `guestName: string` (default `''`)
   - `quickAddOpen: boolean` (default `false`)
   - `quickName: string`, `quickPhone: string`, `quickAddLoading: boolean`
   - `customDays: string` (default `''`)
3. **Thêm mutation:** `const createCustomer = useMutation(api.customers.create)`
4. **Sửa validation submit:**
   - Nếu `customerMode === 'db'` và `!customerId` → error "Vui lòng chọn khách hàng"
   - Nếu `customerMode === 'guest'` và `!guestName.trim()` → error "Vui lòng nhập tên khách"
5. **Sửa title generation:** phân biệt db vs guest như mô tả trên.
6. **UI Section "Khách hàng":**
   - Tab switcher nhỏ (2 buttons inline, không cần full tab component)
   - Khi `db`: select + nút `+` toggle mini-form
   - Mini-form quick-add: field tên + SĐT + nút "Tạo & chọn"
   - Khi `guest`: Input text
7. **UI Section "Sản phẩm":**
   - Wrap trong `div className="flex gap-2 items-center"`
   - Select đầy đủ width, nút `ExternalLink` bên phải khi có `productId`
8. **UI Section "Ngày nhắc":**
   - Bỏ điều kiện `mode === 'edit'` khỏi shortcuts
   - Thêm đủ 7 preset button: 1ngày/1tuần/2tuần/1tháng/3tháng/6tháng/1năm
   - Thêm ô input số + nút "Áp dụng" ngay bên dưới
   - Hàm `applyFromToday(days)` tính từ hôm nay

### File `lib/modules/configs/calendar.config.ts`

- Đổi `label: 'Liên kết sản phẩm AI'` → `label: 'Liên kết sản phẩm'`

---

## Checklist

- [ ] `CalendarTaskForm.tsx`: Tab DB/khách lẻ + Quick-add inline customer
- [ ] `CalendarTaskForm.tsx`: Nút ExternalLink mở tab sản phẩm
- [ ] `CalendarTaskForm.tsx`: Quick-date 7 preset (cả create+edit) + ô custom ngày
- [ ] `calendar.config.ts`: Đổi label "Liên kết sản phẩm AI" → "Liên kết sản phẩm"
- [ ] `bunx tsc --noEmit` pass 0 error
- [ ] Commit
