## Problem Graph
1. Console Error vẫn bật dù đã có validate tồn kho <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] `CartContext` đang để mutation reject đi thẳng ra component nên Next Dev Overlay log lỗi đỏ.
   1.2 [ROOT CAUSE] UI gọi `addItem/updateQuantity` chưa có contract thống nhất (success/error) nên mỗi nơi tự xử lý, dễ lọt lỗi.

## Execution (with reflection)
1. **Chuẩn hóa error handling tại CartContext (theo lựa chọn của bạn)**
   - File: `lib/cart/CartContext.tsx`
   - Thêm helper nội bộ kiểu `runSafely(action, fallbackMessage)`:
     - `try/catch` mutation error.
     - `toast.error(error.message)` ngay trong context.
     - **Không rethrow** để chặn Dev Overlay.
     - Trả về boolean `true/false` cho caller biết kết quả.
   - Đổi signature context methods:
     - `addItem(...) => Promise<boolean>`
     - `updateQuantity(...) => Promise<boolean>`
     - (khuyến nghị đồng bộ thêm `removeItem/clearCart/updateNote` để thống nhất contract, nhưng vẫn giữ tối giản).
   - Reflection: đảm bảo lỗi nghiệp vụ vẫn hiển thị sonner, nhưng không thành unhandled error ở UI.

2. **Đơn giản hóa UI site để không tự throw/noti trùng**
   - Files:
     - `app/(site)/cart/page.tsx`
     - `components/site/CartDrawer.tsx`
     - `app/(site)/products/page.tsx`
     - `app/(site)/products/[slug]/page.tsx`
     - `app/(site)/wishlist/page.tsx`
   - Bỏ `try/catch` local cho các action cart (vì context đã toast + swallow lỗi).
   - Dùng kết quả boolean:
     - chỉ `notifyAddToCart()/openDrawer()/router.push('/cart')` khi `ok === true`.
     - khi `ok === false` thì dừng flow, không chuyển trang.
   - Reflection: tránh double-sonner và tránh tình huống báo lỗi nhưng vẫn redirect.

3. **Buy Again: partial add + tổng hợp sonner theo yêu cầu**
   - File: `app/(site)/account/orders/page.tsx`
   - Cập nhật `handleReorder`:
     - Dùng return boolean từ `addItem` thay vì bắt exception.
     - Gom 2 mảng `successItems` / `failedItems` (failed suy ra từ `false`).
     - Sau loop:
       - Nếu có `successItems` -> sonner success + chuyển `/cart`.
       - Nếu có `failedItems` -> sonner tổng hợp tên sản phẩm thiếu hàng.
       - Nếu tất cả fail -> sonner “Tất cả sản phẩm trong đơn đã hết hàng”.
   - Reflection: đúng hành vi “bỏ qua item lỗi, thêm item hợp lệ + báo sonner tổng”.

4. **Typecheck + commit**
   - Chạy: `bunx tsc --noEmit`.
   - Manual verify:
     - `/cart` tăng quá tồn kho: chỉ sonner, không Dev Overlay.
     - `/products` thêm vượt tồn kho: chỉ sonner, không redirect.
     - `/account/orders` mua lại: thêm được item hợp lệ, item lỗi báo tổng hợp.
   - Commit đề xuất: `fix(cart): handle stock errors in context and show sonner without overlay`.