## Plan ngắn gọn

1. **Rà soát phạm vi posts-list (system + site + preview/components liên quan)**
   - Quét toàn bộ file của `/system/experiences/posts-list` và `/posts` (kể cả `components/site/posts/*`, `components/experiences/*` nếu dùng cho posts-list) để lập danh sách lỗi theo skill: hardcode màu, opacity decor (`${color}15`, `opacity` trang trí), thiếu token semantic, chưa sync `primary/secondary/mode`, chưa resolve single/dual đúng chuẩn.

2. **Chuẩn hoá nguồn màu theo CoC cho Experience posts-list**
   - Thay `useBrandColor` bằng `useBrandColors` ở `app/system/experiences/posts-list/page.tsx`.
   - Khởi tạo state đầy đủ `brandColor`, `secondaryColor`, `colorMode`; thêm `useEffect` sync cả 3 giá trị từ settings.
   - Bổ sung `ColorConfigCard` để preview override màu real-time (single/dual), không đổi scope ngoài posts-list.

3. **Tạo single source of truth: `getPostsListColors` (OKLCH + APCA)**
   - Tạo/chuẩn hoá helper trong `_lib/colors.ts` cho posts-list:
     - parse màu an toàn, resolve secondary theo mode.
     - generate tint/shade bằng OKLCH (culori), clamp L/C.
     - APCA guard đúng pipeline (`hex -> rgb -> sRGBtoY -> APCAcontrast`) cho text/icon trên nền solid.
     - token semantic đầy đủ cho heading, badge, filter, input, pagination, body/meta/neutral text, card bg/border, sidebar states.
     - tuân thủ 60-30-10 và Color Adjacency Rule.

4. **Áp token cho Preview + Site render (đồng bộ tuyệt đối)**
   - Ở preview posts-list: dùng `getPostsListColors(primary, secondary, mode)` thay mọi màu hardcode.
   - Ở `app/(site)/posts/page.tsx`: load `useBrandColors`, tạo `tokens` bằng cùng helper, truyền `tokens` xuống toàn bộ layout/filter/pagination blocks.
   - Update signature các layout liên quan (`FullWidthLayout`, `SidebarLayout`, `MagazineLayout`, `PostsFilter`, ... nếu đang dùng màu) để nhận và dùng `tokens`; xoá inline/hardcode color còn sót.

5. **Fix toàn bộ issue tồn đọng trong phạm vi posts-list**
   - Sửa tất cả vi phạm audit đã liệt kê: thiếu token, mismatch preview/site, thiếu secondary/mode sync, opacity decor, hardcode Tailwind color cho semantic elements cần token.
   - Bảo đảm single mode chỉ đơn sắc; dual mode mới hiển thị/áp dụng secondary.

6. **Validate + commit**
   - Chạy `bunx tsc --noEmit`.
   - Commit toàn bộ thay đổi (không push) với message ngắn gọn đúng mục tiêu posts-list.