## Mục tiêu
Thay thế hardcode 5 trạng thái đơn hàng bằng hệ thống **Preset + Custom** cấu hình tại `/system/modules/orders`. Experience account-orders sẽ CoC hoàn toàn theo module.

## Thiết kế trạng thái đơn hàng

### Preset Levels (3 cấp)
| Preset | Statuses | Use case |
|--------|----------|----------|
| **Simple** (3) | Processing, Completed, Cancelled | Landing page, dịch vụ đơn giản |
| **Standard** (5) | Pending, Processing, Shipped, Delivered, Cancelled | E-commerce tiêu chuẩn |
| **Advanced** (8) | PendingPayment, Pending, Processing, Shipped, PartiallyShipped, Delivered, Cancelled, Refunded | Enterprise, B2B |

### Cấu trúc mỗi Status (JSON)
```typescript
{
  key: string;           // "pending", "processing"...
  label: string;         // "Chờ xử lý", "Đang xử lý"...
  color: string;         // "#f59e0b" (semantic color)
  step: number;          // 1-4 cho timeline stepper
  isFinal: boolean;      // true = không chuyển tiếp được
  allowCancel: boolean;  // cho phép hủy từ status này
}
```

## Phạm vi thay đổi

### 1. Module Config (`lib/modules/configs/orders.config.ts`)
Thêm settings:
- `orderStatusPreset`: select (simple/standard/advanced)
- `orderStatuses`: JSON array với cấu trúc trên
- UI auto-populate khi chọn preset, cho phép edit custom

### 2. Convex Schema + Validators
- **Giữ nguyên** schema `orders` table (không đổi)
- Cập nhật `lib/validators.ts` để accept dynamic statuses từ settings
- Thêm query `getOrderStatuses()` để lấy danh sách status từ moduleSettings

### 3. Experience Account Orders
- **Xóa** cấu hình `defaultStatusFilter` ở experience editor
- **CoC** lấy statuses từ `api.admin.modules.getModuleSetting({ moduleKey: 'orders', settingKey: 'orderStatuses' })`
- Tabs tự động render theo statuses được cấu hình
- Màu semantic lấy từ config thay vì hardcode

### 4. Frontend `/account/orders`
- Import statuses từ module setting (qua hook mới `useOrderStatuses`)
- Render tabs động theo config
- Màu badges lấy từ `status.color`

### 5. Admin Orders pages
- Dropdown status dựa trên config
- Validation theo danh sách cho phép

## Files cần sửa
1. `lib/modules/configs/orders.config.ts` - Thêm preset + statuses settings
2. `convex/lib/validators.ts` - Dynamic validator (optional, có thể giữ union type)
3. `convex/orders.ts` - Thêm query getOrderStatuses
4. `lib/experiences/useSiteConfig.ts` - Thêm hook useOrderStatuses
5. `app/(site)/account/orders/page.tsx` - CoC từ module
6. `components/experiences/previews/AccountOrdersPreview.tsx` - CoC từ module
7. `app/system/experiences/account-orders/page.tsx` - Xóa cấu hình filter riêng

## Default Preset Data (Advanced - 8 statuses)
```json
[
  { "key": "PendingPayment", "label": "Chờ thanh toán", "color": "#94a3b8", "step": 1, "isFinal": false, "allowCancel": true },
  { "key": "Pending", "label": "Chờ xử lý", "color": "#64748b", "step": 1, "isFinal": false, "allowCancel": true },
  { "key": "Processing", "label": "Đang xử lý", "color": "#f59e0b", "step": 2, "isFinal": false, "allowCancel": false },
  { "key": "Shipped", "label": "Đang giao", "color": "#3b82f6", "step": 3, "isFinal": false, "allowCancel": false },
  { "key": "PartiallyShipped", "label": "Giao một phần", "color": "#8b5cf6", "step": 3, "isFinal": false, "allowCancel": false },
  { "key": "Delivered", "label": "Đã giao", "color": "#22c55e", "step": 4, "isFinal": true, "allowCancel": false },
  { "key": "Cancelled", "label": "Đã hủy", "color": "#ef4444", "step": 1, "isFinal": true, "allowCancel": false },
  { "key": "Refunded", "label": "Hoàn tiền", "color": "#ec4899", "step": 4, "isFinal": true, "allowCancel": false }
]
```

## Migration Strategy
- Seed data sẽ thêm default preset = "standard" (backward compatible với 5 status hiện tại)
- Existing orders không bị ảnh hưởng
- Admin có thể upgrade lên advanced hoặc downgrade xuống simple bất kỳ lúc nào