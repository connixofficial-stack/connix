## Problem Graph
1. Loại bỏ hardcode text vô nghĩa ở 6 route <- depends on 1.1, 1.2, 1.3
   1.1 Hardcode tiêu đề/mô tả marketing ở page-level list/detail <- ROOT CAUSE
   1.2 Hardcode fallback label trong layout con (products/posts/services)
   1.3 Fallback categoryName ở detail page dùng text cố định ngoài empty/error

## Execution (with reflection)
1. Solving 1.1 (page-level hardcode marketing)
   - File: `app/(site)/products/page.tsx`
     - Xóa các subtitle cứng kiểu marketing trong 3 layout render (`Grid/Catalog/List`) như “Khám phá các sản phẩm chất lượng của chúng tôi”.
     - Giữ heading page nếu cần định danh route, nhưng không thêm copy marketing.
   - File: `app/(site)/posts/page.tsx`
     - Thay heading cứng “Tin tức & Bài viết” thành heading trung tính từ route context (không marketing), hoặc bỏ heading nếu không cần.
   - File: `app/(site)/services/page.tsx`
     - Thay heading cứng “Dịch vụ của chúng tôi” theo hướng trung tính tương tự.
   - Reflection: chỉ đụng 3 page đúng phạm vi user yêu cầu, không lan sang header/footer/search.

2. Solving 1.2 (fallback label hardcode ở layout con)
   - File: `components/site/products/*` (được dùng bởi `/products` và `/products/[slug]`)
     - Với các chỗ `categoryMap.get(...) ?? 'Sản phẩm'`: đổi sang render có điều kiện (không có category thì không render chip/label), vì user yêu cầu bỏ fallback text ở flow bình thường.
   - File: `components/site/posts/layouts/MagazineLayout.tsx`
     - Đổi fallback `'Bài viết mới nhất'` thành logic không render text fallback; chỉ hiển thị khi có category thật.
   - File: `components/site/services/layouts/{FullWidthLayout,SidebarLayout,MagazineLayout}.tsx`
     - Bỏ fallback `'Dịch vụ'`, `'Dịch vụ mới nhất'` theo cùng pattern render có điều kiện.
   - Reflection: chỉ giữ fallback ở lỗi/empty state; các luồng bình thường không còn hardcode nhãn mặc định.

3. Solving 1.3 (detail page categoryName fallback cứng)
   - File: `app/(site)/products/[slug]/page.tsx`
     - `categoryName: category?.name ?? 'Sản phẩm'` -> dùng `category?.name ?? ''` và UI chỉ render breadcrumb/category badge khi có tên category.
   - File: `app/(site)/services/[slug]/page.tsx`
     - `categoryName: category?.name ?? 'Dịch vụ'` -> xử lý tương tự.
   - File: `app/(site)/posts/[slug]/page.tsx`
     - `categoryName: category?.name ?? 'Tin tức'` -> xử lý tương tự.
   - Reflection: đúng yêu cầu “chỉ giữ fallback cho lỗi/empty state”, không làm vỡ UI do đã thêm điều kiện render.

4. Verification
   - Chạy duy nhất: `bunx tsc --noEmit` (theo rule repo).
   - Soát lại nhanh 6 route mục tiêu để đảm bảo:
     - Không còn copy marketing hardcode vô nghĩa.
     - Không còn fallback text “Sản phẩm/Bài viết/Dịch vụ/Liên hệ” trong luồng bình thường.
     - Empty/error state vẫn giữ thông báo hợp lý.

5. Commit
   - Commit sau khi pass typecheck, message dạng: `refactor(site): remove hardcoded marketing/fallback text on products posts services pages`.
   - Không push.