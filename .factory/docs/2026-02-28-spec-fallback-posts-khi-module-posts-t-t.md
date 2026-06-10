## Problem Graph
1. [Tối ưu hành vi /posts khi module Posts tắt] <- depends on 1.1, 1.2, 1.3
   1.1 [Phát hiện trạng thái module posts ở route public]
   1.2 [Chặn render danh sách/chi tiết khi module đã tắt]
   1.3 [Giữ SEO đúng để tránh index route không còn phục vụ]

## Execution (with reflection)
1. Solving 1.1...
   - Thought: Hiện `/app/(site)/posts/page.tsx` đang query dữ liệu bài viết trực tiếp, chưa thấy guard theo module.
   - Action: Thêm đọc `api.admin.modules.getModuleByKey({ key: 'posts' })` ở route public liên quan.
   - Reflection: ✓ Hợp với pattern codebase vì nhiều nơi đã dùng `getModuleByKey`.

2. Solving 1.2...
   - Thought: Best practice cho route feature bị tắt là coi như route không tồn tại với user cuối, tránh render trang rỗng và tránh query thừa.
   - Action: Ở `/app/(site)/posts/page.tsx` nếu `postsModule?.enabled === false` thì render state tương đương not-found (hoặc tốt hơn: chuyển sang server guard để `notFound()`). Áp cùng nguyên tắc cho `/app/(site)/posts/[slug]/page.tsx` để chặn deep link bài viết cũ.
   - Reflection: ✓ UX sạch hơn, không còn “danh sách rỗng nhưng route vẫn sống”.

3. Solving 1.3...
   - Thought: `/app/(site)/posts/layout.tsx` hiện vẫn generate metadata canonical + ItemList schema, nên nếu module tắt mà không guard thì SEO sai.
   - Action: Guard ngay tại server layer (`layout.tsx` hoặc route-level server wrapper) để khi module tắt thì trả 404 và metadata không tiếp tục tạo schema/canonical cho `/posts`; đồng thời đảm bảo not-found response đi kèm `noindex` theo Next.js behavior.
   - Reflection: ✓ Đây là phương án tối ưu nhất cho SEO + crawl budget.

## Spec đề xuất (đã chốt theo lựa chọn của bạn: 404 + noindex)
1. `app/(site)/posts/layout.tsx`
   - Thêm kiểm tra module `posts` ở server trước khi query `api.posts.listPublishedWithOffset`.
   - Nếu module tắt: gọi `notFound()` ngay, không tạo `JsonLd`, không trả canonical `/posts`.
   - Nếu module bật: giữ nguyên logic hiện tại.

2. `app/(site)/posts/page.tsx`
   - Không để client page tự quyết định fallback chính nữa.
   - Giữ phần UI danh sách như hiện tại cho trường hợp module bật.
   - Nếu cần, chỉ giữ defensive guard nhẹ ở client để tránh flashing khi hydration, nhưng không phải nguồn quyết định chính.

3. `app/(site)/posts/[slug]/page.tsx`
   - Áp cùng policy: nếu module `posts` tắt thì route chi tiết cũng coi như không tồn tại và trả 404.
   - Tránh trường hợp `/posts` 404 nhưng `/posts/some-slug` vẫn truy cập được.

4. Tối ưu phụ thêm (khuyến nghị, vẫn trong cùng scope)
   - Không query posts/categories/comments liên quan khi module đã tắt để giảm bandwidth và tránh call thừa.
   - Giữ link từ experience `/system/experiences/posts-list` như hiện tại, nhưng về mặt runtime public thì route bị đóng hoàn toàn khi module off.

## Vì sao đây là phương án tối ưu nhất
- SEO: 404 + noindex tốt hơn redirect về trang chủ hoặc render empty page vì tránh index URL không còn nội dung.
- UX: User hiểu route không còn khả dụng, không bị gặp trang trắng/rỗng khó hiểu.
- Performance: dừng query sớm, giảm call Convex không cần thiết.
- Consistency: đồng bộ giữa list page và detail page.

## Checklist implement
- [ ] Guard server cho `/posts`
- [ ] Guard server cho `/posts/[slug]`
- [ ] Ngăn metadata/schema phát sinh khi module tắt
- [ ] Verify deep link bài viết cũ cũng 404
- [ ] Chạy `bunx tsc --noEmit`
- [ ] Review diff và commit

Nếu bạn duyệt spec này, bước implement nên đi theo hướng server-first guard bằng `notFound()` thay vì chỉ render fallback ở client.