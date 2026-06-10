## TL;DR kiểu Feynman
- Logic sinh hiện tại chỉ chạy đẹp khi danh mục có cây cha-con; nếu tắt feature cây danh mục thì nó gần như sinh rỗng.
- User muốn flow mới rõ ràng: tầng 0 → tầng 1 → tầng 2 → nếu không có nữa thì xuống sản phẩm thật.
- Để làm đúng yêu cầu này, phải sửa cả thuật toán sinh, schema item của hero, và runtime render ngoài site.
- `Ẩn mục không có SP` hiện đang lọc sai ở case cha không có SP trực tiếp nhưng con có SP; cần chuyển sang tính aggregate theo cây.
- Danh sách dài ở sidebar chưa có mũi tên điều hướng; cần thêm arrow up/down để không phá layout/hình.

## Audit Summary
### Observation
- Route edit/admin của component vẫn dùng hook `useHomepageCategoryHeroAutoGenerate` và hàm `autoGenerateHomepageCategoryHeroMenu` để sinh menu. Evidence: `app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`, `app/admin/home-components/homepage-category-hero/_lib/useHomepageCategoryHeroAutoGenerate.ts`, `app/admin/home-components/homepage-category-hero/_lib/auto-generate.ts`.
- Thuật toán hiện tại build theo `childrenMap(parentId)` rồi chỉ `push` root category khi root đó có `groups.length > 0`. Evidence: `app/admin/home-components/homepage-category-hero/_lib/auto-generate.ts` đoạn `levelOne` và `if ((categoryItem.groups ?? []).length > 0) { result.push(categoryItem); }`.
- Feature tree của products được điều khiển bởi `enableCategoryHierarchy`; khi tắt, backend còn patch toàn bộ `parentId` về `undefined`. Evidence: `lib/modules/configs/products.config.ts`, `convex/admin/modules.ts:761-801`, `convex/productCategories.ts`.
- Runtime site hiện tại khi `selectionMode === 'auto'` không dùng generator, mà chỉ map toàn bộ categories thành item với `groups: []`. Evidence: `components/site/HomepageCategoryHeroSection.tsx:219-224`.
- Runtime hide-empty hiện dùng `listNonEmptyCategoryIds`, là kiểu check non-empty trực tiếp theo category, chưa aggregate theo cây. Evidence: `components/site/HomepageCategoryHeroSection.tsx:189`, `convex/productCategories.ts` query `listNonEmptyCategoryIds`.
- Sidebar dài hiện chỉ `overflow-y-auto` + ẩn scrollbar + còn bị cắt bởi `maxCategories*`, chưa có nút mũi tên điều hướng như user yêu cầu. Evidence: `components/site/HomepageCategoryHeroSection.tsx` phần sidebar list và `visibleCategories = resolvedCategories.slice(0, maxCategories)`.
- User đã chốt: khi fallback xuống sản phẩm thì muốn **support product link thật**, và với list dài muốn **nút mũi tên lên/xuống**.

### Root cause answers (theo protocol)
1. Triệu chứng: logic sinh hiện tại không phản ánh flow mong muốn `tầng 0 -> tầng 1 -> tầng 2 -> sản phẩm`, đặc biệt khi feature cây danh mục tắt thì kết quả dễ rỗng hoặc không có cấu trúc hữu ích.
2. Phạm vi: admin create/edit của `homepage-category-hero`, preview, runtime site component, và Convex query phục vụ aggregate/fallback sản phẩm.
3. Tái hiện tối thiểu: tắt `enableCategoryHierarchy` trong products module rồi bấm sinh; hoặc bật hierarchy nhưng category root không có level 2; hoặc dùng `selectionMode=auto` ngoài site.
4. Mốc thay đổi gần nhất: chưa cần bới git history sâu; evidence hiện tại đã đủ chỉ ra logic hiện hành không cover mode hierarchy disabled và runtime auto mode.
5. Dữ liệu còn thiếu: exact volume sản phẩm/category ngoài local để tuning default số lượng product fallback; nhưng không cản trở spec.
6. Giả thuyết thay thế chưa loại trừ hoàn toàn: (a) user chỉ cần category fallback chứ không cần product thật; tuy nhiên user đã trả lời rõ là muốn support product link thật. (b) chỉ sửa admin generator mà không sửa runtime; nhưng runtime auto mode hiện đang bypass generator nên sẽ lệch hành vi.
7. Rủi ro fix sai nguyên nhân: nếu chỉ vá generator admin mà không đụng runtime/schema, preview có thể đúng nhưng site thật vẫn sai hoặc mất link sản phẩm.
8. Tiêu chí pass/fail: hierarchy bật/tắt đều sinh được menu đúng flow; hide-empty loại đúng mục không có SP aggregate; sidebar dài có mũi tên điều hướng; runtime site và preview không vỡ layout.

## Root Cause Confidence
**High** — Có evidence trực tiếp ở 3 điểm: (1) generator phụ thuộc `groups > 0`, (2) hierarchy disabled xóa hết `parentId`, (3) runtime auto mode không dùng generator. Ba điểm này cộng lại giải thích chính xác vì sao logic hiện tại không thể đáp ứng yêu cầu mới.

## Counter-Hypothesis
- **Medium**: Có thể chỉ cần sửa admin-side saved config, không cần runtime auto mode. Tôi loại phương án này vì file runtime đang có nhánh `selectionMode === 'auto'` riêng, nghĩa là site thật sẽ tiếp tục sai dù admin sinh đúng.
- **Low/Medium**: Có thể không cần product link thật mà chỉ category link là đủ. User đã chọn rõ `Thêm support product link thật`, nên không nên giữ schema cũ.

## Proposal
### Option A (Recommend) — Confidence 88%
Sửa đầy đủ nhưng vẫn giữ scope gọn quanh Homepage Category Hero:
1. Mở rộng schema hero để item có thể trỏ tới **category hoặc product**.
2. Viết lại generator theo cây 3 tầng + fallback sản phẩm thật.
3. Dùng chung generator/resolve logic cho admin preview và site runtime.
4. Bổ sung aggregate hide-empty và arrow up/down cho sidebar.

**Vì sao recommend:** đây là option nhỏ nhất mà vẫn đúng hết yêu cầu behavior + không để preview/site lệch nhau. Tradeoff là đụng nhiều file hơn patch UX trước đó, nhưng vẫn trong phạm vi một feature.

### Option B — Confidence 54%
Chỉ sửa generator admin và lưu config tĩnh sau khi bấm “Sinh ngay”, không sửa runtime auto mode/site schema sâu.

**Khi nào phù hợp:** chỉ khi team chấp nhận `selectionMode=auto` ngoài site vẫn không đồng nhất, hoặc chấp nhận product fallback chỉ tồn tại trong config đã sinh sẵn. Không recommend vì user nói “Audit kỹ và fix lại theo logic này”.

## Files Impacted
### Shared / types
- `Sửa: app/admin/home-components/homepage-category-hero/_types/index.ts`
  - Vai trò hiện tại: định nghĩa `HomepageCategoryHeroMenuLink` chỉ có `categoryId`.
  - Thay đổi: mở rộng link item thành discriminated union hoặc shape có `targetType: 'category' | 'product'`, `categoryId?`, `productId?`, `label?`, `image?`, `slug?` để render product fallback thật mà không phá category links cũ.

- `Sửa: app/admin/home-components/homepage-category-hero/_lib/constants.ts`
  - Vai trò hiện tại: normalize config/categories cũ.
  - Thay đổi: normalize backward-compatible cho link mới; dữ liệu cũ chỉ có `categoryId` vẫn chạy như trước.

### Generator / admin logic
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/auto-generate.ts`
  - Vai trò hiện tại: chọn root/level1/level2 theo category tree và tạo groups/items chỉ từ category.
  - Thay đổi:
    - nhận thêm `hierarchyEnabled`;
    - nếu hierarchy bật: chọn level 0 roots, dưới mỗi root lấy level 1, dưới mỗi level 1 lấy level 2; nếu level 2 không có thì lấy product fallback của level 1; nếu root không có level 1 thì fallback product của root;
    - nếu hierarchy tắt: coi toàn bộ categories là root, mỗi root tạo groups/items từ product fallback ngay;
    - `hideEmptyCategories=true` sẽ loại root/group nếu aggregate product count = 0;
    - giữ giới hạn `maxRootCategories`, `maxGroupsPerCategory`, `maxItemsPerGroup` nhưng `maxItemsPerGroup` lúc fallback product sẽ là số product tối đa hiển thị để không phá UI.

- `Sửa: app/admin/home-components/homepage-category-hero/_lib/useHomepageCategoryHeroAutoGenerate.ts`
  - Vai trò hiện tại: query categories + stats rồi gọi generator.
  - Thay đổi: query thêm trạng thái `enableCategoryHierarchy`; query thêm dữ liệu product fallback tối thiểu; truyền đủ data vào generator và meta summary mới (ví dụ bao nhiêu category link, bao nhiêu product link).

- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroForm.tsx`
  - Vai trò hiện tại: render danh sách groups/items dưới dạng chọn category.
  - Thay đổi: hiển thị item đã sinh có thể là category hoặc product; label readonly đủ rõ để editor biết đây là “SP fallback” hay “Danh mục con”; tránh ép editor phải edit product thủ công nếu chưa cần.

- `Sửa: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: trang edit component.
  - Thay đổi: nối contract mới của generator và ensure save/load config support item product.

- `Sửa: app/admin/home-components/create/homepage-category-hero/page.tsx`
  - Vai trò hiện tại: trang create component.
  - Thay đổi: giống edit page để create/save config mới không lỗi type và không mất product fallback items.

### Runtime / preview
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: render site/preview menu; auto mode bypass generator; item link chỉ hiểu category.
  - Thay đổi:
    - resolve item links theo `targetType` category/product;
    - khi `selectionMode='auto'`, dùng cùng source/generated logic thay vì map categories thô;
    - render label/image cho product fallback items;
    - hide-empty theo aggregate;
    - thêm nút mũi tên lên/xuống cho sidebar dài, kết hợp scroll container cố định để không vỡ layout/banner.

- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx`
  - Vai trò hiện tại: bọc runtime section cho preview.
  - Thay đổi: có thể không cần logic riêng, nhưng cần chắc preview nhận config mới và hiển thị đúng item product.

### Server / data queries
- `Sửa: convex/productCategories.ts`
  - Vai trò hiện tại: trả categories + stats, và non-empty category IDs trực tiếp.
  - Thay đổi:
    - thêm query trả category tree payload + aggregate stats + product fallback candidates theo category;
    - hoặc nâng cấp `listActiveWithStats` để trả kèm `productsByCategory` tối giản (id, name, slug, image) giới hạn theo category để generator dùng;
    - bổ sung query aggregate non-empty theo cây nếu runtime cần tách riêng.

- `Sửa: convex/products.ts`
  - Vai trò hiện tại: nhiều query sản phẩm nhưng chưa có query tối ưu cho fallback hero.
  - Thay đổi: nếu cần, thêm query chuyên biệt trả top active products theo category ids, chỉ projection tối thiểu (`_id`, `name`, `slug`, `image`, `categoryId`, `sales`, `_creationTime`) và giới hạn số lượng để tránh băng thông lớn.

- `Không bắt buộc sửa: lib/modules/configs/products.config.ts`
  - Vai trò hiện tại: định nghĩa feature `enableCategoryHierarchy`.
  - Thay đổi: chỉ đọc, không cần sửa behavior config.

## Execution Preview
1. Audit schema hiện tại của hero link/item để chọn shape backward-compatible cho product link.
2. Nâng cấp query dữ liệu cho generator: hierarchy flag + aggregate stats + fallback products tối giản.
3. Viết lại `autoGenerateHomepageCategoryHeroMenu` theo flow mới:
   - hierarchy on: root → child1 → child2/product fallback
   - hierarchy off: all categories as root → product fallback ngay
   - hide-empty theo aggregate.
4. Nối hook auto-generate với payload mới và summary mới.
5. Cập nhật create/edit form + save/load config cho item product.
6. Cập nhật runtime section để render product/category links, dùng chung logic auto mode, thêm arrow scroll cho sidebar dài.
7. Static review TypeScript/null-safety/backward compatibility; sau đó chạy `bunx tsc --noEmit`.
8. Commit local kèm `.factory/docs`.

## Thiết kế logic chi tiết đề xuất
### 1) Data contract mới cho menu item
Đề xuất nhỏ gọn:
```ts
export interface HomepageCategoryHeroMenuLink {
  id: number;
  targetType?: 'category' | 'product';
  categoryId?: string;
  productId?: string;
  label?: string;
  image?: string;
  slug?: string;
}
```
- Dữ liệu cũ không có `targetType` thì normalize thành `category`.
- Với `product`, runtime link sang `/products/[slug]`.

### 2) Generator flow mới
#### Case A: hierarchy enabled
- Lấy các root `parentId = undefined`.
- Mỗi root:
  - lấy level 1 children.
  - mỗi level 1:
    - nếu có level 2 children đủ điều kiện thì group title = level 1 name, items = level 2 categories.
    - nếu không có level 2 children thì group title = level 1 name, items = top products của chính level 1 (hoặc aggregate subtree của level 1 tùy payload).
  - nếu root không có level 1 nào thì root tạo 1 group fallback bằng top products của root.
- `hideEmptyCategories=true` thì root chỉ hiện nếu aggregate product count của root > 0; level 1 group chỉ hiện nếu có child/product item sau filter.

#### Case B: hierarchy disabled
- Vì backend đã xóa `parentId`, coi tất cả categories là root.
- Mỗi root sinh 1 group fallback từ top products của category đó.
- Root nào không có product aggregate thì loại nếu `hideEmptyCategories=true`.

### 3) Chọn product fallback
- Chỉ lấy số ít, ví dụ tối đa = `maxItemsPerGroup` hiện có.
- Ưu tiên theo score đang dùng sẵn (`sales`, `recency`, image), hoặc nếu muốn scope nhỏ thì sort theo `sales desc`, rồi `_creationTime desc`.
- Chỉ trả fields tối thiểu để không phình payload.

### 4) Sidebar dài với arrow
- Giữ container sidebar height như hiện tại.
- Thêm 2 nút up/down sticky hoặc absolute trên đầu/cuối danh sách.
- Nút disabled khi scrollTop ở đầu/cuối.
- Có thể giữ `maxCategories*` để control density, nhưng list còn dài thì user điều hướng bằng arrow chứ không chỉ cắt cụt vô feedback.

## Acceptance Criteria
- Khi `enableCategoryHierarchy = true`, auto-generate sinh theo flow `root -> child1 -> child2`, và nếu child2 không có thì fallback sang product thật.
- Khi `enableCategoryHierarchy = false`, auto-generate không rỗng chỉ vì thiếu `parentId`; tất cả categories được coi là root và fallback sang product thật.
- Với `hideEmptyCategories = true`, root/category/group không có sản phẩm aggregate thì không xuất hiện.
- Runtime site và preview render được cả category links lẫn product links mà không vỡ type và không vỡ layout ảnh.
- Sidebar danh mục dài có nút mũi tên lên/xuống hoạt động, không làm tràn khung hoặc đè banner.
- Dữ liệu config cũ đã lưu trước đây vẫn render được sau normalize mà không crash.

## Out of Scope
- Thay toàn bộ UX editor để cho phép người dùng manually chọn product ở từng item bằng form phức tạp.
- Refactor toàn bộ module products/category ngoài payload/query cần thiết cho hero.
- Tối ưu SEO hay behavior ở trang products/detail ngoài link routing cần thiết.

## Risk / Rollback
- Risk trung bình: đụng schema config và runtime render nên cần giữ backward-compatible normalize thật chắc.
- Rollback: revert nhóm file hero + query mới; dữ liệu cũ vẫn an toàn nếu normalize không mutate dữ liệu cũ.

## Verification Plan
- Static review:
  - kiểm tra normalize cho data cũ (`categoryId` only) vẫn pass;
  - kiểm tra runtime render item `product` và `category` đều không null/undefined;
  - kiểm tra branch hierarchy on/off.
- Typecheck:
  - chạy `bunx tsc --noEmit` sau khi implement vì có thay đổi TS/schema.
- Repro plan cho tester:
  1. Bật hierarchy, chuẩn bị root → child1 → child2 + products; bấm sinh, verify cấu trúc đúng.
  2. Bật hierarchy nhưng child1 không có child2, verify fallback sang product thật.
  3. Tắt hierarchy, verify tất cả category được coi root và mỗi root có products fallback.
  4. Bật `Ẩn mục không có SP`, verify category aggregate 0 không hiện.
  5. Tạo danh sách dài hơn giới hạn nhìn thấy, verify arrow up/down hoạt động và layout không vỡ.
  6. Mở component cũ đã lưu trước khi đổi schema, verify không crash và vẫn render.

## Open Questions
- Không còn ambiguity lớn sau khi user đã chốt `support product link thật` và `nút mũi tên lên xuống`.