## Audit Summary
- Evidence 1: `app/(site)/products/page.tsx`, `app/(site)/services/page.tsx`, `app/(site)/posts/page.tsx` đều đang lấy toàn bộ category active qua `listActive`, rồi render trực tiếp UI filter/category selector từ danh sách này. Không có bước lọc category theo số item publish.
- Evidence 2: 3 hooks cấu hình public tương ứng trong `lib/experiences/useSiteConfig.ts` chỉ có `showCategories`, chưa có setting kiểu `hideEmptyCategories`.
- Evidence 3: 3 trang system experience (`app/system/experiences/products-list/page.tsx`, `services-list/page.tsx`, `posts-list/page.tsx`) cũng chưa có toggle nào cho behavior này.
- Evidence 4: Đã có nền tảng đếm theo category cho `posts` và `services` ở `convex/model/posts.ts` + `convex/model/services.ts` (`countByCategory`), nhưng chưa được expose thành query public dùng cho UI filter. Với `products` hiện chưa thấy helper/query tương ứng.
- Expected vs actual:
  - Expected: ngoài public, category không có item publish phải tự ẩn mặc định; admin vẫn có toggle để tắt behavior này nếu muốn giữ cách cũ.
  - Actual: mọi category active đều hiện lên, kể cả category rỗng.
- Phạm vi ảnh hưởng: `products-list`, `services-list`, `posts-list` ở public + 3 trang `/system/experiences/*` tương ứng.
- Repro tối thiểu: tạo category active nhưng không có item publish gắn vào, mở `/products`, `/services`, `/posts` sẽ vẫn thấy category đó trong UI filter.
- Giả thuyết đối chứng đã loại: lỗi không nằm ở component filter/layout riêng lẻ, vì cả 3 trang public đều truyền nguyên `categories` từ query nguồn vào nhiều layout khác nhau; root cause nằm ở data shaping trước render.
- Pass/fail sau sửa:
  - Pass: mặc định category rỗng không xuất hiện ở public của cả 3 pages.
  - Pass: khi tắt toggle ở experience tương ứng thì category rỗng hiện lại như hiện tại.
  - Pass: deep link category rỗng bị loại khỏi URL nếu toggle bật.

## Root Cause Confidence
**High** — vì code path đã chỉ ra rất rõ data nguồn category chưa được intersect với tập category có item publish, đồng thời config experience chưa có cờ điều khiển behavior này.

## Problem Graph
1. [Hiển thị category rỗng ở public] <- depends on 1.1, 1.2, 1.3
   1.1 [Config experience chưa có cờ hide empty categories]
   1.2 [Public pages render toàn bộ active categories]
   1.3 [Backend chưa expose dữ liệu category có item publish cho cả 3 domain]
      1.3.1 [Products chưa có helper/query count theo category] <- ROOT CAUSE solve first

## Proposal / Step-by-step actionable plan
1. Cập nhật kiểu config public trong `lib/experiences/useSiteConfig.ts`
   - Thêm field boolean chung cho mỗi experience: `hideEmptyCategories` vào `ProductsListConfig`, `ServicesListConfig`, `PostsListConfig`.
   - Parse mặc định `raw?.hideEmptyCategories ?? true` để behavior public mặc định là tự ẩn category rỗng.
   - Giữ backward compatibility: setting cũ không có field này vẫn chạy được và tự nhận giá trị mặc định `true`.

2. Cập nhật system experience editor cho `products-list`
   - File: `app/system/experiences/products-list/page.tsx`
   - Thêm `hideEmptyCategories: boolean` vào `ProductsListExperienceConfig`, `DEFAULT_CONFIG`, `serverConfig` normalize.
   - Thêm một `ToggleRow` trong nhóm “Khối hiển thị” hoặc nhóm hiển thị riêng, label kiểu: `Ẩn danh mục rỗng`.
   - Mô tả ngắn: “Ngoài public chỉ hiện danh mục có sản phẩm published”.
   - Vì user chọn toggle chung cho toàn experience, field này nằm top-level, không nhét vào từng layout.
   - Truyền prop này xuống preview nếu muốn preview phản ánh label/trạng thái; không bắt buộc preview phải mock chính xác count thật.

3. Cập nhật system experience editor cho `services-list`
   - File: `app/system/experiences/services-list/page.tsx`
   - Thêm `hideEmptyCategories` vào type, default config, server normalize, và UI toggle tương tự products.
   - Giữ nó là setting chung toàn experience, không nhân bản vào từng `layouts.*`.

4. Cập nhật system experience editor cho `posts-list`
   - File: `app/system/experiences/posts-list/page.tsx`
   - Thêm `hideEmptyCategories` vào `PostsListExperienceConfig`, `DEFAULT_CONFIG`, `serverConfig`.
   - Bổ sung `ToggleRow` cùng nhóm với `showSearch`, `showCategories`.
   - Không đụng legacy `posts_list_style`; chỉ lưu field mới trong `posts_list_ui` là đủ.

5. Expose query backend cho category counts / non-empty category ids
   - `convex/model/products.ts`: thêm helper `countByCategory(ctx, { categoryId })` hoặc tốt hơn helper trả về tập categoryIds có product `status = Active`.
   - `convex/model/services.ts`: tái dùng hoặc mở rộng helper đang có.
   - `convex/model/posts.ts`: tái dùng hoặc mở rộng helper đang có.
   - Tạo query Convex public mới, ưu tiên pattern trả về `ids` thay vì count để payload nhỏ và UI chỉ cần biết category nào còn item. Ví dụ:
     - `convex/productCategories.ts` -> `listNonEmptyCategoryIds`
     - `convex/serviceCategories.ts` -> `listNonEmptyCategoryIds`
     - `convex/postCategories.ts` -> `listNonEmptyCategoryIds`
   - Logic query:
     - lấy active categories,
     - song song `Promise.all` đếm item publish theo từng category,
     - trả về mảng categoryId có count > 0.
   - Vì codebase hiện số category list public đã limit nhỏ (20 hoặc all active), cách này đủ KISS cho scope hiện tại; không cần premature optimization sang aggregate table.

6. Lọc category ở public `products`
   - File: `app/(site)/products/page.tsx`
   - Giữ query `api.productCategories.listActive`.
   - Thêm query `api.productCategories.listNonEmptyCategoryIds`.
   - Tạo `visibleCategories` bằng `useMemo`:
     - nếu `!listConfig.hideEmptyCategories` => dùng toàn bộ `categories`
     - nếu bật => filter category theo set non-empty ids.
   - Dùng `visibleCategories` thay cho `categories` ở tất cả chỗ render dropdown/chips/sidebar/category map lookup liên quan danh sách category.
   - Điều chỉnh `categoryFromUrl` + effect sanitize URL để khi `hideEmptyCategories=true` mà URL trỏ tới category rỗng thì tự remove `category` param.
   - Không đổi query lấy products; category rỗng khi bị filter khỏi UI cũng không còn đường chọn từ UI.

7. Lọc category ở public `services`
   - File: `app/(site)/services/page.tsx`
   - Thêm query `api.serviceCategories.listNonEmptyCategoryIds`.
   - Sinh `visibleCategories` tương tự products.
   - Truyền `visibleCategories` xuống `ServicesFilter`, `SidebarLayout`, `MagazineLayout` thay cho `categories` gốc.
   - Cập nhật `categoryFromUrl`, `handleCategoryChange`, effect sanitize URL theo `visibleCategories`.

8. Lọc category ở public `posts`
   - File: `app/(site)/posts/page.tsx`
   - Thêm query `api.postCategories.listNonEmptyCategoryIds`.
   - Sinh `visibleCategories` dựa trên `listConfig.hideEmptyCategories`.
   - Truyền `visibleCategories` vào `PostsFilter`, `SidebarLayout`, `MagazineLayout`.
   - Sanitize `catpost` URL theo `visibleCategories` thay vì toàn bộ categories gốc.

9. Preview alignment tối thiểu
   - Với 3 preview components, không cần fetch count thật.
   - Chỉ cần thêm prop `hideEmptyCategories?: boolean` nếu muốn editor phản ánh trạng thái setting ở level copy/UI; mock category data có thể giữ nguyên để tránh overbuild.
   - Nếu muốn parity tốt hơn nhưng vẫn KISS: trong preview bỏ 1 category mock khi toggle bật, chỉ để user cảm nhận behavior. Đây là optional trong implement; không bắt buộc cho root behavior public.

10. Guardrails và naming
   - Dùng cùng một key thống nhất ở cả 3 experience: `hideEmptyCategories`.
   - Label UI thống nhất: `Ẩn danh mục rỗng`.
   - Description thống nhất: `Mặc định ngoài public chỉ hiện danh mục có nội dung/sản phẩm/dịch vụ published`.
   - Không đổi semantics của `showCategories`; `showCategories=false` vẫn là ẩn toàn bộ block category, còn `hideEmptyCategories=true` chỉ là lọc bớt category rỗng khi block category đang bật.

11. Verification Plan
   - Typecheck: chạy `bunx tsc --noEmit`.
   - Repro manual:
     1. tạo 1 category active rỗng cho products/services/posts;
     2. mở `/products`, `/services`, `/posts` khi toggle mặc định bật -> category rỗng không xuất hiện;
     3. gắn 1 item publish vào category đó -> category xuất hiện lại;
     4. quay lại experience, tắt toggle -> category rỗng xuất hiện lại;
     5. thử URL trực tiếp với category rỗng khi toggle bật -> param category/catpost bị sanitize khỏi URL hoặc không còn được giữ.
   - Regression checks:
     - `showCategories=false` vẫn ẩn cả block category.
     - Search/sort/pagination/infinite scroll vẫn hoạt động.
     - Các layout grid/sidebar/list/magazine vẫn render bình thường.

## Counter-Hypothesis Check
- Alternative hypothesis: chỉ cần filter ở component filter UI là đủ.
- Loại vì không đủ: category còn được dùng ở nhiều layout và cả logic parse URL; nếu chỉ filter trong một component con sẽ sinh lệch giữa URL state và sidebar/top filter, dễ bug regression.

## Post-Audit
- Blast radius: thấp-trung bình, giới hạn trong 3 experiences + 3 public list pages + 3 query categories.
- Regression risk chính: sanitize URL và loading state khi `visibleCategories` phụ thuộc thêm 1 query mới.
- KISS/YAGNI/DRY:
  - KISS: dùng boolean top-level chung mỗi experience.
  - YAGNI: không làm aggregate/cached counter table lúc này.
  - DRY: dùng chung naming `hideEmptyCategories` và pattern `visibleCategories` cho cả 3 pages.

## Chốt lại cho user
Checklist implement sau khi bạn duyệt plan:
- [ ] Thêm toggle `Ẩn danh mục rỗng` cho `products-list`
- [ ] Thêm toggle `Ẩn danh mục rỗng` cho `services-list`
- [ ] Thêm toggle `Ẩn danh mục rỗng` cho `posts-list`
- [ ] Mặc định public auto ẩn category rỗng
- [ ] Tắt toggle thì quay về behavior hiện tại
- [ ] Sanitize URL category rỗng khi toggle bật
- [ ] Verify bằng `bunx tsc --noEmit` + repro tay

Nếu bạn duyệt spec này, tôi sẽ implement đúng scope trên, không mở rộng thêm.