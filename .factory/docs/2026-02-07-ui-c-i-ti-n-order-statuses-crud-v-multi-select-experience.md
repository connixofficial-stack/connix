## Spec: UI cải tiến cho Order Statuses & Experience Account Orders

### 1. Tab "Trạng thái đơn" mới trong Module Orders (`/system/modules/orders`)

**Vị trí:** Thêm tab mới `statuses` vào sau tab `address`

**Component mới:** `OrderStatusesEditor.tsx`
- CRUD dạng table giống `ShippingMethodsEditor` và `PaymentMethodsEditor`
- Các trường cho mỗi trạng thái:
  - `key` (text) - mã trạng thái (ví dụ: Pending)
  - `label` (text) - tên hiển thị (ví dụ: Chờ xử lý)
  - `color` (color picker/text) - màu badge (#64748b)
  - `step` (number 1-4) - bước trong timeline
  - `isFinal` (checkbox) - trạng thái kết thúc
  - `allowCancel` (checkbox) - cho phép hủy
- Nút "Thêm trạng thái", "Xóa"
- Dropdown "Preset" ở trên để chọn nhanh (simple/standard/advanced) → auto-fill table

**Thay đổi `OrdersConfigTab.tsx`:**
- Thêm tab `{ key: 'statuses', label: 'Trạng thái', icon: ListChecks }`
- Xóa setting `orderStatuses` (JSON textarea) khỏi tab General
- Giữ lại `orderStatusPreset` select trong tab General (hoặc chuyển vào tab Statuses)

---

### 2. Experience Account Orders (`/system/experiences/account-orders`)

**2.1. Multi-select dropdown thay thế status pills:**
- Thay vì trải ra nhiều nút trạng thái, dùng dropdown multi-select
- Component `MultiSelectRow` mới trong `ControlCard.tsx`:
  ```tsx
  <MultiSelectRow
    label="Trạng thái mặc định"
    values={config.defaultStatusFilter}
    options={orderStatuses.map(s => ({ value: s.key, label: s.label }))}
    onChange={(values) => setConfig(prev => ({ ...prev, defaultStatusFilter: values }))}
  />
  ```
- Hiển thị số lượng đã chọn + dropdown checkbox list

**2.2. Config mới `defaultStatusFilter`:**
- Thêm vào `AccountOrdersExperienceConfig`:
  ```ts
  defaultStatusFilter: string[]; // ['Pending', 'Processing', 'Shipped']
  ```
- Mặc định: tất cả statuses (hoặc rỗng = tất cả)
- Truyền xuống `AccountOrdersPreview` để khởi tạo filter mặc định
- Truyền xuống site `/account/orders` để hiển thị mặc định

---

### Files cần tạo/sửa:

| File | Action |
|------|--------|
| `components/modules/orders/OrderStatusesEditor.tsx` | **Tạo mới** |
| `components/modules/orders/OrdersConfigTab.tsx` | Thêm tab statuses, gọi editor |
| `components/experiences/editor/ControlCard.tsx` | Thêm `MultiSelectRow` |
| `app/system/experiences/account-orders/page.tsx` | Thêm config `defaultStatusFilter` + UI |
| `lib/experiences/useSiteConfig.ts` | Thêm `defaultStatusFilter` vào config type |
| `components/experiences/previews/AccountOrdersPreview.tsx` | Nhận prop `defaultStatusFilter` |
| `app/(site)/account/orders/page.tsx` | Dùng `defaultStatusFilter` từ experience config |

---

### Preview UI:

**Tab Trạng thái (Module Orders):**
```
┌─────────────────────────────────────────────────────────┐
│ [Preset: Advanced ▼]                        [+ Thêm]   │
├────────┬─────────────┬────────┬──────┬───────┬─────────┤
│ Key    │ Label       │ Color  │ Step │ Final │ Cancel  │
├────────┼─────────────┼────────┼──────┼───────┼─────────┤
│ Pending│ Chờ xử lý   │ #64748b│  1   │ [ ]   │ [x]     │
│ Process│ Đang xử lý  │ #f59e0b│  2   │ [ ]   │ [ ]     │
│ ...    │ ...         │ ...    │ ...  │ ...   │ ...     │
└────────┴─────────────┴────────┴──────┴───────┴─────────┘
```

**Multi-select dropdown (Experience):**
```
┌────────────────────────────────────────┐
│ Trạng thái mặc định  [2 đã chọn ▼]    │
│                      ┌───────────────┐ │
│                      │[x] Chờ xử lý  │ │
│                      │[x] Đang giao  │ │
│                      │[ ] Đã giao    │ │
│                      │[ ] Đã hủy     │ │
│                      └───────────────┘ │
└────────────────────────────────────────┘
```