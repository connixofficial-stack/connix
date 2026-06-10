## Problem Graph
1. [Main] Filter danh mục trang `/posts` bị lệch khi bấm link query (`?catpost=...`) đột ngột / back-forward / đổi menu
   1.1 [Sub] Source of truth đang bị tách đôi (URL + state local `selectedCategory`) <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] `activeCategory = selectedCategory ?? categoryFromUrl` nên state local có thể override URL cũ, gây lọc sai dữ liệu
   1.2 [Sub] UI filter nhận `selectedCategory` thay vì category thực tế từ URL, nên badge/dropdown hiển thị sai dù data đã lọc đúng
   1.3 [Sub] Không có cơ chế normalize URL khi `catpost` invalid, nên trạng thái URL/UI có thể “treo”

## Execution (with reflection)
1. Solving 1.1.1 (đồng bộ source of truth)
   - Thought: Theo quyết định của anh, URL `catpost` là nguồn sự thật duy nhất.
   - Action: Refactor `app/(site)/posts/page.tsx` để bỏ state `selectedCategory`; tạo `activeCategory` thuần derive từ `searchParams + categories`.
   - Reflection: ✓ Loại bỏ triệt để conflict giữa local state và URL khi chuyển link đột ngột.

2. Solving 1.2 (đồng bộ UI với state thật)
   - Thought: UI phải bind vào `activeCategory` (derived từ URL), không bind vào state local.
   - Action: Trong `PostsPage`, truyền `selectedCategory={activeCategory}` cho `PostsFilter`, `SidebarLayout`, `MagazineLayout`.
   - Reflection: ✓ Dropdown/tag/sidebar luôn phản ánh đúng URL hiện tại.

3. Solving 1.3 (invalid slug)
   - Thought: Với `catpost` không tồn tại, UX cần tự làm sạch URL về `/posts`.
   - Action: Thêm `useEffect` trong `app/(site)/posts/page.tsx`: khi categories đã load và `catpost` không match slug nào thì `router.replace('/posts' hoặc giữ các param hợp lệ khác, xóa catpost)` với `scroll:false`.
   - Reflection: ✓ Tránh trạng thái URL sai kéo dài, nhất quán với yêu cầu anh chọn.

4. Cập nhật handler filter để 100% URL-driven
   - Thought: Action user click category chỉ nên update URL; render sẽ tự phản ánh qua derived state.
   - Action: Sửa `handleCategoryChange` chỉ thao tác `URLSearchParams` (`set/delete catpost`, reset `page`), không `setSelectedCategory`.
   - Reflection: ✓ Chống lỗi race/stale state khi click nhanh hoặc điều hướng liên tục.

5. Củng cố behavior khi đổi filter đột ngột
   - Thought: Đang ở page >1 rồi đổi category có thể gây empty view giả.
   - Action: Trong `handleCategoryChange` và luồng reset filter giữ logic xóa `page` về 1 trước khi replace/push.
   - Reflection: ✓ Kết quả hiển thị hợp lý ngay lần đầu sau đổi filter.

6. Verify thủ công các case user nêu
   - Thought: Cần test đúng các đường đi thực tế gây bug.
   - Action: Kiểm tra các case:
     - `/posts` -> click menu `/posts?catpost=du-an` (data + UI cùng đúng)
     - Từ `/posts?catpost=a` đổi sang `/posts?catpost=b` bằng menu/link
     - Back/forward browser giữa các `catpost`
     - `/posts?catpost=khong-ton-tai` tự về `/posts`
     - Đổi category khi đang page 2+ phải về page 1
   - Reflection: ✓ Bao phủ đúng nhóm lỗi “ấn filter đột ngột / đổi filter / load sai”.

7. Validate kỹ thuật trước commit
   - Action: Chạy `bunx tsc --noEmit`.
   - Action: Commit local (không push), kèm `.factory/docs` nếu thư mục này có thay đổi theo rule repo.
   - Reflection: ✓ Đúng convention dự án.

## Root cause chốt ngắn gọn
- Lỗi cốt lõi nằm ở `app/(site)/posts/page.tsx`: state local `selectedCategory` override URL (`catpost`) và UI lại bind theo state local, nên khi điều hướng bằng link/query thì data/UI bị lệch nhau.
- `/system/experiences/posts-list` chỉ tạo link preview và config layout, không phải nguồn gây sai logic filter runtime của `/posts`.

## Checklist kỳ vọng sau fix
- [ ] URL `catpost` luôn quyết định filter thực tế
- [ ] UI filter luôn khớp dữ liệu đang render
- [ ] Đổi link/query/back-forward không lệch trạng thái
- [ ] `catpost` invalid tự được dọn sạch
- [ ] Đổi filter luôn reset page hợp lý