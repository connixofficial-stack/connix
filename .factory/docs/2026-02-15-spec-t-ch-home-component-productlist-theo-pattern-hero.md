# Spec

## Problem Graph
1. [Main] Tách ProductList thành module feature-based <- depends on 1.1, 1.2, 1.3
   1.1 [Sub] Trích types/constants/preview/form từ file monolithic
   1.2 [Sub] Tạo route edit mới và migrate logic load/save
   1.3 [Sub] Redirect + cleanup code cũ và cập nhật import

## DARE
### Decompose
- Xác định toàn bộ logic ProductList trong `app/admin/home-components/[id]/edit/page.tsx` và `app/admin/home-components/previews.tsx`.
- Tạo module `product-list` theo structure Hero.
- Di chuyển preview + types + constants + form vào module mới.
- Tạo route edit mới cho ProductList.
- Redirect từ route cũ và dọn code cũ.
- Cập nhật nơi đang dùng `ProductListPreview` (create page).

### Analyze
- `ProductListPreview`, `ProductListStyle`, `ProductListPreviewItem` đang nằm trong `previews.tsx`.
- Edit logic ProductList (state, init config, buildConfig, UI, preview) nằm trong `app/admin/home-components/[id]/edit/page.tsx`.
- Create page `app/admin/home-components/create/product-list/page.tsx` đang import `ProductListPreview`/`ProductListStyle` từ `previews.tsx`.
- Route create dùng path `product-list`, nên edit route nên là `/admin/home-components/product-list/[id]/edit` để đồng nhất.

### Reflect
- Rủi ro chính: xóa `ProductListPreview` khỏi `previews.tsx` sẽ làm create page lỗi nếu không đổi import.
- Cần đảm bảo shape config không đổi: `itemCount`, `sortBy`, `style`, `selectionMode`, `selectedProductIds`, `subTitle`, `sectionTitle`.
- Redirect cũ phải xử lý cả `type=productlist` và `component.type === 'ProductList'`.

### Execute plan (step-by-step)
1. **Tạo module mới**
   - Tạo thư mục `app/admin/home-components/product-list/` với:
     - `_types/index.ts`: `ProductListStyle`, `ProductListPreviewItem`, `ProductListConfig`, `ProductSelectionMode`.
     - `_lib/constants.ts`: `PRODUCT_LIST_STYLES`, `DEFAULT_PRODUCT_LIST_CONFIG`, `DEFAULT_PRODUCT_LIST_TEXT` (subTitle/sectionTitle).
     - `_components/ProductListPreview.tsx`: di chuyển logic preview từ `previews.tsx`, dùng `PreviewWrapper`, `BrowserFrame`, `usePreviewDevice`.
     - `_components/ProductListForm.tsx`: tách UI form (tiêu đề phụ/chính + selection mode + auto/manual list), nhận props state/setters từ page.

2. **Di chuyển Preview**
   - Cắt toàn bộ `ProductListStyle`, `ProductListPreviewItem`, `ProductListPreview` từ `previews.tsx` sang module mới.
   - Trong preview mới:
     - Giữ props tương đương hiện tại (`brandColor`, `secondary`, `itemCount`, `selectedStyle`, `onStyleChange`, `items`, `subTitle`, `sectionTitle`).
     - Dùng `PreviewWrapper` + `BrowserFrame` + `usePreviewDevice` và device widths từ `_shared/hooks/usePreviewDevice`.

3. **Tạo edit route mới** `app/admin/home-components/product-list/[id]/edit/page.tsx`
   - Theo pattern `hero/[id]/edit` và `stats/[id]/edit`.
   - `useQuery` lấy component, nếu `type !== 'ProductList'` thì `router.replace(/admin/home-components/${id}/edit?type=${component.type.toLowerCase()})`.
   - State cần có:
     - `title`, `active`, `isSubmitting`.
     - `productListConfig` (`itemCount`, `sortBy`), `productListStyle`.
     - `productSelectionMode`, `selectedProductIds`, `productSearchTerm`.
     - `productSubTitle`, `productSectionTitle`.
   - Query `api.products.listAll` và tạo `filteredProducts`, `selectedProducts` giống logic cũ.
   - `handleSubmit` xây config y hệt cũ (giữ `selectionMode`, `selectedProductIds` khi manual, `subTitle`, `sectionTitle`).
   - Layout 2 cột: Form bên trái, Preview sticky bên phải (giống Hero/Stats).

4. **Cập nhật create page**
   - `app/admin/home-components/create/product-list/page.tsx`:
     - Thay import `ProductListPreview`, `ProductListStyle`, `ProductListPreviewItem` từ `previews.tsx` sang module mới (`product-list/_components` và `product-list/_types`).
     - Không đổi logic create.

5. **Redirect & cleanup route cũ**
   - `app/admin/home-components/[id]/edit/page.tsx`:
     - Thêm redirect cho `typeParam?.toLowerCase() === 'productlist'` và `component?.type === 'ProductList'` sang `/admin/home-components/product-list/${id}/edit`.
     - Xóa state, useMemo, query, buildConfig case, và render block liên quan ProductList.
     - Gỡ import `ProductListPreview` và `ProductListStyle`.

6. **Cleanup preview chung**
   - `app/admin/home-components/previews.tsx`:
     - Xóa `ProductListStyle`, `ProductListPreviewItem`, `ProductListPreview` và helpers chỉ dùng cho ProductList.
     - Đảm bảo không còn export thừa.

7. **Validation**
   - Theo yêu cầu user: **không chạy** `bunx oxlint`, `bun run lint`, `bunx tsc --noEmit` và **không commit**.
