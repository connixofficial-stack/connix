## Problem Graph
1. [Main] `/products` và `/services` có nguy cơ lệch filter giống bug cũ của `/posts`
   1.1 [Sub] Cả 2 trang đang dùng `activeCategory = selectedCategory ?? categoryFromUrl` <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] State local `selectedCategory` có thể override URL `category` khi điều hướng đột ngột/back-forward
   1.2 [Sub] UI filter bind `selectedCategory` thay vì category derive từ URL, nên label/chip/dropdown có thể sai so với dữ liệu thật
   1.3 [Sub] Chưa normalize query `category` invalid, tạo trạng thái URL/UI không nhất quán

## Execution (with reflection)
1. Soát và refactor source of truth ở `/products`
   - File: `app/(site)/products/page.tsx`
   - Thay đổi:
     - Bỏ state `selectedCategory`.
     - Đổi `activeCategory` thành derive 100% từ URL (`categoryFromUrl`).
     - Cập nhật mọi nơi đang truyền/so sánh `selectedCategory` sang `activeCategory` (CatalogLayout, ListLayout, default grid filter bar/mobile chips).
   - Reflection: ✓ URL là nguồn duy nhất, tránh stale state khi bấm link menu đột ngột.

2. Soát và refactor source of truth ở `/services`
   - File: `app/(site)/services/page.tsx`
   - Thay đổi:
     - Bỏ state `selectedCategory`.
     - Đổi `activeCategory = categoryFromUrl`.
     - Truyền `selectedCategory={activeCategory}` vào `ServicesFilter`, `SidebarLayout`, `MagazineLayout`.
   - Reflection: ✓ Đồng bộ logic với `/posts`, giảm divergence giữa các list page.

3. Chuẩn hóa handler đổi category (2 trang)
   - Files: `app/(site)/products/page.tsx`, `app/(site)/services/page.tsx`
   - Thay đổi:
     - `handleCategoryChange` chỉ update URL, không set local state.
     - Luôn `params.delete('page')` khi đổi category để tránh đứng ở page cũ gây empty state giả.
   - Reflection: ✓ Hành vi ổn định khi đổi filter liên tục.

4. Dọn URL khi category invalid (2 trang)
   - Files: `app/(site)/products/page.tsx`, `app/(site)/services/page.tsx`
   - Thay đổi:
     - Thêm `useEffect`: khi categories đã load và `searchParams.get('category')` không match slug nào → remove `category` khỏi query bằng `router.replace(..., { scroll: false })`.
     - Giữ các query hợp lệ khác (vd `page`, sort nếu có), chỉ xóa param sai.
   - Reflection: ✓ Tránh UI/data hiển thị sai kéo dài do query bẩn.

5. Verify behavior theo real-flow
   - Case cần check cho cả `/products` và `/services`:
     - `/products` → click menu `/products?category=...` hoặc `/services?category=...`: data + UI phải khớp ngay.
     - Từ `?category=a` sang `?category=b` bằng menu/link/back-forward.
     - Query invalid (`?category=khong-ton-tai`) tự bị dọn về URL sạch.
     - Đang page > 1 đổi category phải reset về page 1.
   - Reflection: ✓ Bao phủ đúng lỗi user mô tả “ấn filter đột ngột / đổi filter / load sai”.

6. Validate kỹ thuật & commit theo rule repo
   - Chạy: `bunx tsc --noEmit`.
   - Commit local (không push), include `.factory/docs` nếu có.

## Root cause chốt ngắn gọn
- `/products` và `/services` đang lặp lại đúng anti-pattern từng gây lỗi ở `/posts`: dùng song song local state + URL cho category và ưu tiên local state, dẫn tới sai lệch khi điều hướng bằng link/query.

## Checklist kỳ vọng sau fix
- [ ] URL `category` là source of truth duy nhất ở `/products`, `/services`
- [ ] UI filter luôn khớp dữ liệu render
- [ ] Back/forward/menu-link không gây lệch trạng thái
- [ ] `category` invalid tự dọn khỏi URL
- [ ] Đổi category luôn reset page hợp lý