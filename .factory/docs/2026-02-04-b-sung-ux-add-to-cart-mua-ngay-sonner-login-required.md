## Mục tiêu
- UX rõ ràng khi click “Thêm vào giỏ” (toast + drawer/redirect theo cart layout).
- Thêm “Mua ngay” → đi thẳng `/checkout` với 1 sản phẩm.
- Rà soát dependency: module/experience/admin/frontend cần chạm tới.

---

## Kết luận khảo sát nhanh (read-only)
- Dự án **đã có `sonner`** trong `package.json`.
- **Chưa có** `/app/(site)/checkout/page.tsx` (chỉ có experience preview + admin page).

---

## Dependency cần thiết

### 1. Modules (System)
- **products**: dữ liệu sản phẩm.
- **customers**: bắt buộc login.
- **cart**: add-to-cart, drawer/page layout.
- **orders**: checkout sẽ phụ thuộc orders.
- *(tuỳ chọn)* **promotions** nếu muốn dùng coupon sau này.

### 2. Experiences (System)
- **cart_ui**: layout drawer/page quyết định hành vi click.
- **checkout_ui**: cấu hình giao diện checkout (flowStyle, orderSummaryPosition, payment/shipping).
- *(tuỳ chọn)* **product_detail_ui** nếu muốn show/hide nút “Mua ngay”.

### 3. Admin UI
- **/system/experiences/cart**: bổ sung note UX “click add → drawer/page + toast”.
- **/system/experiences/checkout**: bổ sung cấu hình “BuyNow” (bật/tắt).
- *(tuỳ chọn)* module config **cart/orders**: rule login required.

### 4. Frontend (End User)
- **Products list** `/products`: add toast + open drawer/redirect.
- **Product detail** `/products/[slug]`: add toast + BuyNow.
- **Wishlist** `/wishlist`: add toast + open drawer/redirect.
- **Cart drawer/icon**: trigger from add-to-cart.
- **New page** `/checkout` (frontend) + minimal flow 1 sản phẩm.
- **Toast provider**: đặt Sonner `<Toaster />` trong site layout/provider.

---

## UX Hành vi đã xác nhận
- **Add to cart**: `layout=drawer` → **open drawer + toast**; `layout=page` → **redirect /cart + toast**.
- **Buy now**: đi thẳng `/checkout` với **1 sản phẩm**.

---

## Kế hoạch triển khai

### Phase 1: Toast Infrastructure
1. Thêm `<Toaster />` vào `SiteProviders` hoặc `app/(site)/layout.tsx`.
2. Tạo helper `notifyAddToCart()` dùng `sonner`.

### Phase 2: Add-to-Cart UX
3. Update add-to-cart handlers ở:
   - `/products` (grid/list/catalog)
   - `/products/[slug]` (classic/modern/minimal)
   - `/wishlist`
4. Hành vi:
   - **drawer**: `addItem` → toast → `openDrawer()`
   - **page**: `addItem` → toast → `router.push('/cart')`

### Phase 3: Buy Now Flow
5. Thêm nút “Mua ngay” ở product detail (cấu hình show/hide).
6. Tạo `/checkout` page:
   - nhận `productId` + `quantity` (query param hoặc state)
   - hiển thị tóm tắt + giá + nút đặt hàng
7. Nếu chưa login → mở login modal.

### Phase 4: Experience/Admin Sync
8. Cập nhật `checkout_ui` config để có toggle `showBuyNow`.
9. Update admin experience page (checkout/cart) để mô tả UX.

---

## Rủi ro & lưu ý
- `/checkout` cần thêm Convex query/mutation nếu muốn tạo order thật.
- Nếu chưa có flow order, có thể mock và chỉ hiển thị summary trước.

---

Nếu OK, tôi sẽ bắt đầu coding theo plan trên.