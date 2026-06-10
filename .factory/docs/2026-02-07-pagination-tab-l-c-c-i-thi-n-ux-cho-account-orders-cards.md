## Mục tiêu
Thêm cơ chế phân trang, tab lọc trạng thái, và cải thiện UX cho layout "Cards" của trang `/system/experiences/account-orders`.

## Phạm vi thay đổi

### 1. Cập nhật Config Type & Default
**File:** `app/system/experiences/account-orders/page.tsx`

```typescript
type AccountOrdersExperienceConfig = {
  // ... existing fields
  // NEW:
  paginationType: 'pagination' | 'infiniteScroll';
  ordersPerPage: number;
  defaultStatusFilter: ('Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled')[];
};

const DEFAULT_CONFIG = {
  // ... existing
  paginationType: 'pagination',
  ordersPerPage: 12,
  defaultStatusFilter: ['Pending', 'Processing'], // Mặc định: đang xử lý + đang giao
};
```

### 2. Thêm Controls trong Experience Editor
**File:** `app/system/experiences/account-orders/page.tsx`

Thêm 1 ControlCard mới "Phân trang & Lọc" với:
- **SelectRow:** Kiểu phân trang (pagination / cuộn vô hạn)
- **SelectRow:** Số đơn mỗi trang (6/12/20/24)
- **Checkbox Group:** Trạng thái mặc định hiển thị
  - [ ] Chờ xử lý (Pending)
  - [x] Đang xử lý (Processing) - checked by default
  - [x] Đang giao (Shipped) - checked by default  
  - [ ] Đã giao (Delivered)
  - [ ] Đã hủy (Cancelled)

### 3. Cập nhật Preview Component
**File:** `components/experiences/previews/AccountOrdersPreview.tsx`

#### 3.1 Thêm props
```typescript
type AccountOrdersPreviewProps = {
  // ... existing
  paginationType: 'pagination' | 'infiniteScroll';
  ordersPerPage: number;
  defaultStatusFilter: string[];
};
```

#### 3.2 Thay đổi UI - Layout "Cards"

**A. Tab bar trạng thái** (ngay dưới title):
```
[Tất cả] [Đang xử lý*] [Đang giao*] [Đã giao] [Đã hủy]
```

**B. Màu trạng thái semantic** (thay vì dùng brandColor):
| Trạng thái | Màu | Hex |
|------------|-----|-----|
| Chờ xử lý (Pending) | Slate/Gray | `#64748b` |
| Đang xử lý (Processing) | Amber/Yellow | `#f59e0b` |
| Đang giao (Shipped) | Blue | `#3b82f6` |
| Đã giao (Delivered) | Green | `#22c55e` |
| Đã hủy (Cancelled) | Red | `#ef4444` |

**C. Bỏ nút không cần thiết:**
- ❌ Bỏ nút "Hóa đơn VAT"
- ❌ Bỏ nút "Xem chi tiết"

**D. Cải thiện nút "Mua lại":**
- Click → Thêm tất cả SP của đơn vào giỏ hàng
- Redirect đến `/cart` (trang giỏ hàng)
- Nếu có quản lý kho:
  - SP hết hàng → không thêm
  - SP còn hàng → thêm bình thường
  - Hiện **sonner notification** báo rõ:
    - ✅ "Đã thêm 3 sản phẩm vào giỏ hàng"
    - ⚠️ "2 sản phẩm đã hết hàng: Áo thun XL, Nón đen"

**E. Pagination controls** ở cuối danh sách

### 4. Mockup UI Preview (Cards layout)

```
┌─────────────────────────────────────────────────┐
│ Đơn hàng của tôi                                │
│ Preview account orders                          │
├─────────────────────────────────────────────────┤
│ [Tất cả] [Đang xử lý🟡] [Đang giao🔵] [Đã giao🟢] [Đã hủy🔴] │
├─────────────────────────────────────────────────┤
│ [Stats Cards...]                                │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ ORD-123 · 07/02/2026        [🟡 Đang xử lý] │ │
│ │ 2 sản phẩm · 640,000đ                       │ │
│ │ ─────────────────────────────────────────── │ │
│ │ [Sản phẩm list...]                          │ │
│ │                                             │ │
│ │                              [Mua lại]      │ │  ← Chỉ còn 1 nút
│ │                              [Hủy đơn]      │ │  ← Nếu status=Pending
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│        [← Trước] [1] [2] [3] [Sau →]           │
│        hoặc [Xem thêm đơn hàng...]             │
└─────────────────────────────────────────────────┘
```

## Files cần sửa
1. `app/system/experiences/account-orders/page.tsx` - Thêm config & controls
2. `components/experiences/previews/AccountOrdersPreview.tsx` - UI tabs + pagination + semantic colors + simplified buttons