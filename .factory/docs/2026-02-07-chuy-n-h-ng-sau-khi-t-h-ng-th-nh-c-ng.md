## Spec: Chuyển hướng sau khi đặt hàng thành công

### Vấn đề hiện tại
- Sau khi đặt hàng → xóa giỏ hàng → hiển thị "Đã đặt hàng" + mã đơn tại chỗ
- User vẫn ở trang checkout rỗng, trải nghiệm không tốt

### Giải pháp
Sau khi đặt hàng thành công:
1. Hiển thị toast success với link xem đơn hàng
2. Delay ~1.5s rồi tự động chuyển hướng đến `/account/orders`

### Thay đổi code
**File:** `app/(site)/checkout/page.tsx`

```tsx
// Import thêm useRouter
import { useRouter, useSearchParams } from 'next/navigation';

// Trong component
const router = useRouter();

// Sau khi đặt hàng thành công (trong handlePlaceOrder)
if (fromCart && cart?._id) {
  await removeCart({ id: cart._id });
}
setOrderId(createdOrderId);
toast.success('Đặt hàng thành công! Đang chuyển đến trang đơn hàng...');

// Chuyển hướng sau 1.5s
setTimeout(() => {
  router.push('/account/orders');
}, 1500);
```

### UX Flow mới
1. User nhấn "Đặt hàng ngay"
2. Toast: "Đặt hàng thành công! Đang chuyển đến trang đơn hàng..."
3. Sau 1.5s → tự động chuyển đến `/account/orders`
4. User thấy đơn hàng mới nhất ở đầu danh sách