## Spec: CoC cho Khối hiển thị Experience Account Orders

### 1. Xóa toggle "Cho phép hủy"

**Lý do:** Đã có cấu hình `allowCancel` per-status trong Tab Trạng thái (OrderStatusesEditor). Không cần duplicate ở experience.

**Thay đổi:**
- Xóa `allowCancel` khỏi `AccountOrdersExperienceConfig`
- Xóa `<ToggleRow label="Cho phép hủy" .../>` trong experience editor
- Preview và site sẽ lấy `allowCancel` từ status config (đã làm từ trước)

---

### 2. CoC: Ẩn toggles theo module features

**Module Orders features:**
| Feature | Toggles ẩn nếu tắt |
|---------|-------------------|
| `enablePayment` | `showPaymentMethod` |
| `enableShipping` | `showShippingMethod`, `showShippingAddress` |
| `enableTracking` | `showTracking` |

**Thay đổi:**
1. Query thêm 3 features:
```tsx
const paymentFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enablePayment', moduleKey: 'orders' });
const shippingFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableShipping', moduleKey: 'orders' });
const trackingFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableTracking', moduleKey: 'orders' });
```

2. Conditional render toggles:
```tsx
{paymentFeature?.enabled && (
  <ToggleRow label="Phương thức thanh toán" ... />
)}
{shippingFeature?.enabled && (
  <>
    <ToggleRow label="Phương thức giao hàng" ... />
    <ToggleRow label="Địa chỉ giao hàng" ... />
  </>
)}
{trackingFeature?.enabled && (
  <ToggleRow label="Tracking" ... />
)}
```

---

### Files cần sửa:

| File | Action |
|------|--------|
| `app/system/experiences/account-orders/page.tsx` | Xóa allowCancel toggle, query features, ẩn toggles theo CoC |
| `lib/experiences/useSiteConfig.ts` | Xóa `allowCancel` khỏi AccountOrdersConfig |

---

### Kết quả UI (nếu module bật đầy đủ features):

```
┌─────────────────────────────────────────┐
│ KHỐI HIỂN THỊ                           │
├─────────────────────────────────────────┤
│ Trạng thái mặc định    [3 Đã chọn ▼]   │
│ Thống kê đơn hàng              [toggle] │
│ Danh sách sản phẩm             [toggle] │
│ Phương thức thanh toán         [toggle] │  ← chỉ hiện nếu enablePayment
│ Phương thức giao hàng          [toggle] │  ← chỉ hiện nếu enableShipping
│ Địa chỉ giao hàng              [toggle] │  ← chỉ hiện nếu enableShipping
│ Tracking                       [toggle] │  ← chỉ hiện nếu enableTracking
│ Timeline                       [toggle] │
│                                         │
│ (Đã xóa: "Cho phép hủy" - dùng từ status config)
└─────────────────────────────────────────┘
```