## Fix Compact Layout + Thêm Order Detail Drawer

---

### Vấn đề hiện tại
1. **Table Compact bị tràn cột** - quá nhiều cột toggle (thanh toán, giao hàng, địa chỉ, tracking, bước) làm bảng bể layout
2. **Nút "Chi tiết" không hoạt động** - cần mở drawer hiển thị full info đơn hàng

---

### Giải pháp

#### 1. Compact Table - Giữ cột cơ bản
Ẩn các cột toggle, chỉ giữ:
- Mã đơn | Ngày | Số SP | Tổng | Trạng thái | Thao tác (Chi tiết)

#### 2. Order Detail Drawer
Tạo component `OrderDetailDrawer` (tái sử dụng pattern từ `CartDrawer.tsx`):
- Slide từ phải vào
- Hiển thị full info: header (mã đơn + trạng thái), timeline/stepper, sản phẩm, thanh toán, giao hàng, tracking, địa chỉ
- Actions: Hủy đơn (nếu allowCancel), Mua lại, Đóng

---

### Files cần sửa/tạo

| File | Action |
|------|--------|
| `components/orders/OrderDetailDrawer.tsx` | **Tạo mới** - Drawer chi tiết đơn hàng |
| `components/experiences/previews/AccountOrdersPreview.tsx` | Ẩn cột toggle trong Compact, thêm state + render drawer |
| `app/(site)/account/orders/page.tsx` | Ẩn cột toggle trong Compact, thêm state + render drawer |

---

### OrderDetailDrawer Props
```tsx
interface OrderDetailDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  brandColor: string;
  statusMap: Map<string, StatusConfig>;
  config: {
    showTimeline: boolean;
    showOrderItems: boolean;
    showPaymentMethod: boolean;
    showShippingMethod: boolean;
    showShippingAddress: boolean;
    showTracking: boolean;
  };
  onReorder?: (order: Order) => void;
  onCancel?: (orderId: string) => void;
}
```

---

### Ước lượng
- **Tạo mới:** 1 file (~150 dòng)
- **Sửa:** 2 files (~40 dòng mỗi file)
- **Tổng:** ~230 dòng