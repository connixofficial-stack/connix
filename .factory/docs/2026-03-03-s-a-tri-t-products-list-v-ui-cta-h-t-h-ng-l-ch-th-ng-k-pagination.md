## Problem Graph
1. [Main] /products render sai UI + sai số liệu <- depends on 1.1, 1.2
   1.1 [UI card vỡ khi trạng thái CTA theo tồn kho] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] CTA hiện/ẩn theo từng product làm chiều cao card không ổn định, chưa có contract out-of-stock thống nhất
   1.2 [Số liệu Total/Active/Draft và pagination lệch] <- depends on 1.2.1, 1.2.2
      1.2.1 [ROOT CAUSE] Admin đang đọc `api.products.getStats` từ bảng `productStats` (counter cache có thể stale)
      1.2.2 [ROOT CAUSE] Site `/products` đọc `countPublished` (cũng dựa `productStats` khi không filter) + search dùng `products.length` nên total không authoritative

## Execution (with reflection)
1. Solving 1.1.1 (UI/CTA contract thống nhất)
   - Thought: Chuẩn hóa action area để mọi card luôn giữ chiều cao ổn định, kể cả khi stock=0 hoặc mode đổi giữa cart/contact/affiliate.
   - Action:
     - Sửa file `app/(site)/products/page.tsx`:
       - Tạo helper dùng chung (ví dụ `isOutOfStock = product.stock <= 0`) và action renderer dùng cho `ProductGrid` + card trong `CatalogLayout`.
       - Giữ **2 slot CTA cố định** theo lựa chọn của anh:
         - Slot 1: `Thêm vào giỏ` (nếu bật feature) -> disable khi hết hàng.
         - Slot 2: `Mua ngay/Liên hệ` -> disable khi hết hàng và label chuyển `Hết hàng`.
       - Áp layout chống vỡ: phần card content dùng `flex flex-col h-full`, vùng CTA dùng `mt-auto` + `min-h`/grid rows cố định để không nhảy chiều cao.
       - Đồng bộ style disabled (opacity/cursor/bg/border) theo tokens hiện có.
   - Reflection: Cách này xử lý triệt để biến thể UI do stock/CTA khác nhau mà không phá theme hiện tại.

2. Solving 1.2.1 (Admin stats authoritative)
   - Thought: Theo quyết định của anh, nguồn hiển thị phải authoritative từ bảng products, không phụ thuộc counter cache.
   - Action:
     - Sửa `convex/products.ts`:
       - Thêm query mới (ví dụ `getStatsAuthoritative`) đếm trực tiếp từ bảng `products` theo status (`Active/Draft/Archived`) và total.
       - Giữ giới hạn hợp lý + query theo index/status để tránh scan thừa.
     - Sửa `app/admin/products/page.tsx`:
       - Đổi `useQuery(api.products.getStats)` -> `useQuery(api.products.getStatsAuthoritative)` cho phần header `(Tổng | Active | Draft)`.
   - Reflection: Header admin sẽ luôn đúng với dữ liệu thật kể cả khi `productStats` bị lệch.

3. Solving 1.2.2 (Site total/pagination authoritative)
   - Thought: `/products` phải có total đúng cho category/search/sort context và không dùng `products.length` làm total khi search.
   - Action:
     - Sửa `convex/products.ts`:
       - Thêm query count mới cho site (ví dụ `countPublishedAuthoritative`) hỗ trợ `categoryId`, `search` (nếu có), luôn đếm từ bảng `products` status `Active`.
     - Sửa `app/(site)/products/page.tsx`:
       - Thay `totalCountRaw`/`isSearchActive ? products.length : totalCountRaw` bằng total từ query authoritative mới.
       - Giữ logic pagination hiện tại nhưng dùng total mới để tính `x-y / total` và số trang.
   - Reflection: Sẽ hết tình trạng hiển thị kiểu `4/18` sai thực tế và pagination sẽ khớp dữ liệu.

4. Kiểm thử và chốt
   - Action:
     - Test tay các route:
       - `/system/experiences/products-list` (toggle CTA/pagination)
       - `/products` (grid/list/catalog, stock=0, mode cart/contact/affiliate, search/category)
       - `/admin/products` (header thống kê).
     - Chạy đúng rule dự án: `bunx tsc --noEmit`.
     - Commit toàn bộ thay đổi (kèm `.factory/docs` nếu có thay đổi trong thư mục này), không push.
   - Reflection: Đảm bảo đúng yêu cầu nghiệp vụ + không phát sinh regressions chính.

## Checklist cam kết khi implement
- [x] Out-of-stock luôn không làm vỡ card UI
- [x] CTA contract thống nhất cho cart/contact/affiliate
- [x] Header admin dùng số liệu authoritative
- [x] `/products` total/pagination authoritative, không còn lệch
- [x] Chạy `bunx tsc --noEmit` và commit