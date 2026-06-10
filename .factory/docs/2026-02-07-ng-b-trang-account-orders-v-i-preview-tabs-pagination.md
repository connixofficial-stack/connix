## Mục tiêu
Đồng bộ trang `/account/orders` thực tế với preview đã làm: thêm tabs lọc trạng thái + pagination/infinite scroll cho layout "cards".

## Phạm vi thay đổi

### 1. Cập nhật hook `useAccountOrdersConfig`
**File:** `lib/experiences/useSiteConfig.ts`

Thêm 3 fields mới vào `AccountOrdersConfig`:
```typescript
type AccountOrdersConfig = {
  // ... existing
  paginationType: 'pagination' | 'infiniteScroll';
  ordersPerPage: number;
  defaultStatusFilter: string[];
};
```

### 2. Cập nhật trang `/account/orders`
**File:** `app/(site)/account/orders/page.tsx`

**A. Thêm status tabs** (ngay dưới title, trước stats):
```
[Tất cả] [Đang xử lý🟡] [Đang giao🔵] [Đã giao🟢] [Đã hủy🔴]
```
- Mặc định theo `config.defaultStatusFilter`
- Click toggle trạng thái

**B. Màu trạng thái semantic** (giống preview):
| Trạng thái | Màu |
|------------|-----|
| Chờ xử lý | `#64748b` |
| Đang xử lý | `#f59e0b` |
| Đang giao | `#3b82f6` |
| Đã giao | `#22c55e` |
| Đã hủy | `#ef4444` |

**C. Pagination/Infinite scroll** cuối danh sách:
- Nếu `paginationType === 'pagination'`: nút Trước/Sau + số trang
- Nếu `paginationType === 'infiniteScroll'`: loading indicator + "Cuộn để xem thêm"

**D. Bỏ nút dư + cải thiện "Mua lại"**:
- ❌ Bỏ nút "Hóa đơn VAT"
- ❌ Bỏ nút "Xem chi tiết"
- ✅ "Mua lại" → thêm SP vào giỏ + redirect `/cart` + sonner toast (kiểm tra stock nếu có)

**E. Filter orders theo status**:
- Query orders với status filter hoặc filter client-side

## Files cần sửa
1. `lib/experiences/useSiteConfig.ts` - Cập nhật hook + type
2. `app/(site)/account/orders/page.tsx` - Thêm tabs, pagination, màu semantic, bỏ nút dư