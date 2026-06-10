## Problem
3 layout previews (Cards, Compact, Timeline) ở account-orders hiện tại gần như giống nhau, chỉ khác padding/border. Cần thiết kế lại để mỗi layout có UI hoàn toàn khác biệt, phù hợp enterprise.

## Solution: 3 Layouts Hoàn Toàn Khác Biệt

### 1. **Cards Layout** (Default - Full Detail)
- Accordion expandable cho mỗi đơn hàng
- Hiện đầy đủ thông tin: stats bar, order items với hình ảnh, payment/shipping info
- Order card với header (mã đơn, trạng thái badge) + expandable body
- Action buttons: View Detail, Cancel, Re-order
- **Phù hợp**: Desktop, user cần xem chi tiết

```
┌─────────────────────────────────────┐
│ [Stats: Tổng tiêu | Đang xử lý | Đã giao | SP] │
├─────────────────────────────────────┤
│ ▼ ORD-001 | 2 SP | 640K [Chờ xử lý] │
│   ┌───────────────────────────────┐ │
│   │ [img] Áo thun x1    320,000đ │ │
│   │ [img] Nón x1        320,000đ │ │
│   ├───────────────────────────────┤ │
│   │ Thanh toán: COD               │ │
│   │ Giao hàng: Tiêu chuẩn         │ │
│   │ Địa chỉ: Q1, HCM              │ │
│   │ Tracking: GHTK-123456         │ │
│   │ [Hủy đơn] [Chi tiết]          │ │
│   └───────────────────────────────┘ │
│ ► ORD-002 | 1 SP | 320K [Đã giao]  │
└─────────────────────────────────────┘
```

### 2. **Compact Layout** (Table/List - Quick Overview)
- Dạng bảng (desktop) hoặc list cards (mobile)
- Hiện tóm tắt: Mã đơn, Ngày, Số SP, Tổng tiền, Trạng thái, Actions
- Click row để xem detail
- Sort/Filter built-in
- **Phù hợp**: Quản lý nhiều đơn hàng, cần scan nhanh

```
Desktop:
┌─────┬──────────┬────┬─────────┬──────────┬─────────┐
│ Mã  │ Ngày     │ SP │ Tổng    │ Trạng thái│ Actions │
├─────┼──────────┼────┼─────────┼──────────┼─────────┤
│ 001 │ 07/02/26 │ 2  │ 640,000 │ [Pending]│ [Detail]│
│ 002 │ 05/02/26 │ 1  │ 320,000 │ [Done]   │ [Detail]│
└─────┴──────────┴────┴─────────┴──────────┴─────────┘

Mobile:
┌─────────────────────────────────────┐
│ ORD-001 · 07/02/26                  │
│ 2 sản phẩm · 640,000đ               │
│ [Chờ xử lý]              [Chi tiết]│
├─────────────────────────────────────┤
│ ORD-002 · 05/02/26                  │
│ 1 sản phẩm · 320,000đ               │
│ [Đã giao]                [Chi tiết]│
└─────────────────────────────────────┘
```

### 3. **Timeline Layout** (Visual Progress)
- Vertical timeline với dots + connector lines
- Mỗi node = 1 đơn hàng với trạng thái visual
- Progress bar cho đơn đang xử lý (4 bước: Đặt → Xác nhận → Vận chuyển → Hoàn thành)
- Hover/click để expand detail
- **Phù hợp**: Track tiến trình, UX visual

```
┌─────────────────────────────────────┐
│ ● 07/02/2026 - ORD-001              │
│ │ ┌─────────────────────────────┐   │
│ │ │ 2 SP · 640,000đ · Chờ xử lý │   │
│ │ │ [○──○──○──○] 1/4 Đã đặt     │   │
│ │ │ Timeline: 10:30 Đặt hàng    │   │
│ │ │ [Hủy đơn]                   │   │
│ │ └─────────────────────────────┘   │
│ │                                    │
│ ● 05/02/2026 - ORD-002              │
│   │ ┌─────────────────────────────┐ │
│   │ │ 1 SP · 320,000đ · ✓ Đã giao│ │
│   │ │ [●──●──●──●] Hoàn thành    │ │
│   │ └─────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Implementation
1. Viết lại `AccountOrdersPreview.tsx` với 3 render functions riêng biệt
2. Mock data với 2-3 đơn hàng ở các trạng thái khác nhau
3. Responsive: Cards/Timeline giữ layout, Compact chuyển table→cards trên mobile
4. Thêm visual elements: progress bars, timeline dots, status colors

## Files cần sửa
- `components/experiences/previews/AccountOrdersPreview.tsx`