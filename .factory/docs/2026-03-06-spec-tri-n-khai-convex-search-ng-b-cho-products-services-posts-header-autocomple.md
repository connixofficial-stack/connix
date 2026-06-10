Đã chốt theo lựa chọn của bạn:
- Typo handling: **Chỉ Convex Search thuần**
- Header scope: **Chỉ autocomplete dropdown**
- Mức refactor: **Tối thiểu** (chỉ thay search path sang `withSearchIndex`, không đại tu sort/count)

## Problem Graph
1. [Main] Đồng bộ Convex Search cho 3 trang list + header <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT] `/services` list đang search bằng JS filter sau `.take()`
   1.2 [ROOT] `/posts` list đang search bằng JS filter sau `.take()`
   1.3 [Sub] Header autocomplete đã dùng Convex Search nhưng cần rà soát parity với logic mới

## Execution (with reflection)
1. Solving 1.1 (`convex/services.ts`)
   - Thought: thay nhánh search trong `listPublishedWithOffset` sang `.withSearchIndex("search_title", ...)` để không filter JS.
   - Action:
     - File: `convex/services.ts`
     - Hàm: `listPublishedWithOffset`
     - Khi `args.search?.trim()`:
       - Dùng `searchLower = args.search.toLowerCase().trim()`
       - Query: `ctx.db.query("services").withSearchIndex("search_title", q => { ... })`
       - Bắt buộc `.eq("status", "Published")`
       - Nếu có `categoryId` thì thêm `.eq("categoryId", args.categoryId)`
       - `.take(fetchLimit)` như hiện tại (giữ minimal refactor)
     - Xóa đoạn client-side `services.filter(...includes...)` cho search text.
   - Reflection: ✓ Giữ behavior cũ về phân trang/sort tổng thể, chỉ thay search path.

2. Solving 1.2 (`convex/posts.ts`)
   - Thought: tương tự services, thay search branch DB-first bằng search index.
   - Action:
     - File: `convex/posts.ts`
     - Hàm: `listPublishedWithOffset`
     - Thêm nhánh ưu tiên `args.search?.trim()`:
       - Query `withSearchIndex("search_title", ...)`
       - `.eq("status", "Published")`
       - Có `categoryId` thì `.eq("categoryId", args.categoryId)`
       - `.take(fetchLimit)`
     - Bỏ client-side filter `post.title/excerpt includes(...)` ở luồng search.
   - Reflection: ✓ Tối thiểu thay đổi, đúng định hướng DB filter trước.

3. Solving 1.3 (header autocomplete parity)
   - Thought: `components/site/HeaderSearchAutocomplete.tsx` + `convex/search.ts` đã dùng search index; chỉ cần đảm bảo không phải chỉnh behavior ngoài scope.
   - Action:
     - File: `convex/search.ts`
     - Giữ nguyên API `autocomplete` (dropdown only), không thêm semantic/typo layer.
     - Chỉ rà lại consistency: products dùng `search_name`, posts/services dùng `search_title`, giữ limit hiện tại.
   - Reflection: ✓ Không mở rộng tính năng ngoài yêu cầu.

4. Validation
   - Chạy: `bunx tsc --noEmit` (theo rule dự án).
   - Smoke check thủ công:
     - `/products`, `/services`, `/posts`: nhập keyword và xác nhận có kết quả từ Convex Search path.
     - Header search: dropdown vẫn trả kết quả 3 loại entity.

5. Commit (sau khi code + typecheck pass)
   - `git status`
   - `git diff --cached`
   - Kiểm tra không lộ secrets.
   - Commit message đề xuất: `refactor(search): unify list search to Convex search indexes`
   - Include `.factory/docs` nếu có theo rule repo.

## Checklist implement
- [ ] `services.listPublishedWithOffset` dùng `withSearchIndex(search_title)` cho search text
- [ ] `posts.listPublishedWithOffset` dùng `withSearchIndex(search_title)` cho search text
- [ ] Bỏ filter JS text search ở 2 module trên
- [ ] Header autocomplete giữ nguyên dropdown-only và vẫn dùng Convex Search
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit local, không push