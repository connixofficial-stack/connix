## Problem Graph
1. Hợp nhất tuyệt đối route chi tiết sản phẩm về `/products/[slug]` <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] Đang hardcode lẫn 2 prefix `/products/` và `/san-pham/` trong các UI render
   1.2 Chưa có bước quét toàn cục để đảm bảo thay sạch toàn bộ `/san-pham/` liên quan product detail

## Execution (with reflection)
1. Chốt quy tắc duy nhất
   - Canonical duy nhất: `/products/[slug]`.
   - Không thêm redirect, không rewrite, không route compatibility.
   - Reflection: ✓ đúng yêu cầu “sửa hết luôn, không để phải làm redirect”.

2. Sửa các điểm đã xác định chắc chắn
   - File `components/site/ComponentRenderer.tsx`:
     - Thay toàn bộ `href={`/san-pham/${product.slug ?? product._id}`}` thành `href={`/products/${product.slug ?? product._id}`}` tại các vị trí đang có (khoảng line ~3419, 3595, 3751, 3787, 3871, 3911, 4018).
   - Reflection: ✓ xử lý nguồn mâu thuẫn chính trong luồng home-components.

3. Quét toàn repo để thay sạch các chuỗi `/san-pham/` liên quan chi tiết sản phẩm
   - Search toàn dự án các pattern: `"/san-pham/"`, `` `/san-pham/${` ``.
   - Chỉ thay các chỗ là link điều hướng trang chi tiết sản phẩm; không đụng chuỗi text/docs không liên quan runtime.
   - Reflection: ✓ đảm bảo không còn sót prefix cũ trong code chạy thực tế.

4. Đồng bộ preview/example URL
   - Rà `app/system/experiences/**` và `components/experiences/**` để đảm bảo tất cả link preview chi tiết sản phẩm dùng `/products/[slug]`.
   - `app/system/experiences/product-detail/page.tsx` hiện đã đúng `/products/${exampleProductSlug}` -> giữ nguyên, chỉ verify không còn `/san-pham/`.
   - Reflection: ✓ tránh lệch giữa preview trong system và route thực tế.

5. Không tạo mới route `/san-pham/[slug]`, không sửa `next.config.ts` cho redirect/rewrite
   - Cố ý bỏ toàn bộ phương án compatibility.
   - Reflection: ✓ đúng yêu cầu loại bỏ hoàn toàn hướng redirect.

6. Validate kỹ thuật
   - Search lại toàn repo để xác nhận không còn `/san-pham/` cho luồng product detail.
   - Chạy `bunx tsc --noEmit` theo rule dự án.
   - Reflection: ✓ xác nhận fix sạch + không lỗi TypeScript.

7. Commit theo quy tắc repo
   - `git status` + `git diff --cached` kiểm tra trước commit.
   - Commit message đề xuất: `fix(routing): replace san-pham product detail links with canonical products route`.
   - Không push.
   - Reflection: ✓ hoàn tất đúng quy trình dự án.

## Kết quả mong đợi
- Luồng chi tiết sản phẩm chỉ còn `/products/[slug]`.
- Codebase không còn sử dụng prefix `/san-pham/` cho product detail.
- Không tồn tại lớp redirect/rewrite/compatibility nào cho `/san-pham/`.