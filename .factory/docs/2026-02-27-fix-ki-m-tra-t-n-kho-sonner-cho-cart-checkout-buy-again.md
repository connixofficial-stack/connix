## Problem Graph
1. Không có sonner “không đủ hàng” khi vượt tồn kho ở `/cart` và `/checkout` <- phụ thuộc 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] `convex/cart.ts` (`addItem`, `updateItemQuantity`) chưa validate tồn kho trước khi tăng số lượng.
   1.2 [ROOT CAUSE] `convex/orders.ts` (`create`) chưa validate tồn kho trước khi tạo đơn; logic trừ tồn chỉ `Math.max(0, ...)` nên không báo lỗi thiếu hàng.
   1.3 Feature `/system/modules` (`enableStock`) hiện có nhưng chưa được cart/orders dùng để bật/tắt kiểm tra tồn kho.

## Execution (with reflection)
1. **Backend: chặn vượt tồn kho trong cart** (`convex/cart.ts`)
   - Thêm helper đọc setting/feature:
     - `isStockCheckEnabled` từ `moduleFeatures` (`moduleKey='products'`, `featureKey='enableStock'`).
     - `variantStock` từ `moduleSettings` để biết check theo `product` hay `variant`.
   - Trong `addItem`:
     - Trước khi insert/patch, tính `targetQuantity` (bao gồm quantity cũ nếu item đã tồn tại).
     - Nếu `enableStock=false` => bỏ qua check.
     - Nếu `enableStock=true`:
       - `variantStock='variant'` + có `variantId`: check `variant.stock`.
       - Ngược lại: check `product.stock`.
       - Nếu vượt, throw error message rõ ràng (VD: `Không đủ hàng trong kho. Còn lại: X`).
   - Trong `updateItemQuantity`:
     - Tương tự: check trước khi patch quantity (chỉ khi `quantity > 0`).
   - Reflection: đảm bảo chỉ chặn khi bật quản lý kho, đúng yêu cầu bạn đã chọn.

2. **Backend: chặn vượt tồn kho khi đặt hàng/checkout** (`convex/orders.ts`)
   - Thêm `isStockCheckEnabled` (đọc `enableStock`) và hàm `validateStockBeforeCreate`.
   - Trong `create`:
     - Sau `normalizeOrderItems`, gọi `validateStockBeforeCreate` (chỉ khi `enableStock=true`).
     - Validate theo `variantStock`:
       - `variant`: check từng `variantId`.
       - `product`: gộp quantity theo `productId` rồi check `product.stock`.
     - Nếu thiếu hàng: throw error có tên sản phẩm/biến thể để frontend hiển thị sonner chính xác.
   - Điều chỉnh trừ tồn kho:
     - Nếu `enableStock=false` thì **không trừ tồn** (đúng rule “tắt kiểm tra tồn kho hoàn toàn”).
     - Nếu `enableStock=true` giữ logic hiện tại cho `variantStock='variant'`.
   - Reflection: checkout hiện đã có `catch -> toast.error(error.message)`, nên chỉ cần backend throw đúng message là có sonner.

3. **Frontend: hiển thị sonner đúng chỗ người dùng thao tác**
   - `app/(site)/cart/page.tsx` và `components/site/CartDrawer.tsx`:
     - Bọc action tăng/giảm số lượng trong handler async có `try/catch`.
     - `catch` -> `toast.error(error.message)` để click `+` vượt tồn kho sẽ báo ngay.
   - `app/(site)/products/page.tsx`, `app/(site)/products/[slug]/page.tsx`, `app/(site)/wishlist/page.tsx`:
     - Bọc `addItem(...)` trong `try/catch`, lỗi tồn kho thì `toast.error` (tránh promise reject im lặng sau khi backend bắt đầu chặn).
   - `app/(site)/account/orders/page.tsx` (Buy Again):
     - Giữ flow hiện tại (đã catch), cập nhật regex/message mapping để nhận diện chắc chắn lỗi thiếu hàng mới từ backend.
   - Reflection: đảm bảo cả 3 phạm vi bạn chọn đều có thông báo sonner.

4. **Kiểm tra & commit**
   - Chạy `bunx tsc --noEmit`.
   - Test tay 4 case:
     - `/cart`: tăng vượt tồn -> sonner lỗi.
     - `/checkout` (Buy now): quantity vượt tồn -> sonner lỗi khi đặt hàng.
     - `/account/orders` mua lại có item thiếu hàng -> báo lỗi đúng item.
     - `/system/modules/products` tắt `enableStock`: không chặn tồn kho và không báo thiếu hàng.
   - Commit 1 lần với message kiểu: `fix(stock): enforce inventory checks for cart/checkout/buy-again with module-aware toggle`.