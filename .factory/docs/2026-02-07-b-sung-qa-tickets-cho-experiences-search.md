## Phân tích

Sau khi đọc file `qa-experiences-search.md` và đối chiếu với codebase, tôi nhận thấy các ticket hiện tại đã cover khá đầy đủ. Tuy nhiên, có một số điểm cần bổ sung hoặc cập nhật:

## Các bổ sung đề xuất

### 1. **[BỔ SUNG] Ticket #5 đã đúng - brandColor hardcoded**
- Ticket hiện tại chính xác: Search page dùng `brandColor="#14b8a6"` hardcoded
- Các page khác (posts-list, products-list, services-list) đều query `site_brand_color` từ settings
- **Đề xuất fix**: Thêm query `brandColorSetting` và truyền vào preview

### 2. **[MỚI] Thiếu hook `useSearchFilterConfig` trong `useSiteConfig.ts`**
- `useSiteConfig.ts` có các hook: `usePostsListConfig`, `useProductsListConfig`, `useServicesListConfig`, `useCartConfig`, `useCheckoutConfig`, `useWishlistConfig`
- **Thiếu**: `useSearchFilterConfig` - site pages không thể lấy config của search
- **Đề xuất**: Thêm hook này để site pages có thể consume config

### 3. **[MỚI] Thiếu export `useSearchFilterConfig` trong `lib/experiences/index.ts`**
- File index.ts export tất cả hooks từ useSiteConfig nhưng sẽ thiếu search filter hook nếu bổ sung

### 4. **[CẬP NHẬT] Ticket #7 - Xác nhận không có route `/search` trong site**
- Đã verify: Không tồn tại `app/(site)/search` hoặc `app/(site)/search.tsx`
- Config `search_filter_ui` hiện không được consume bởi route nào
- **Priority cao**: Cần decision từ stakeholder

### 5. **[MỚI] Thiếu postsPerPage trong Search config**
- Posts-list, products-list, services-list đều có `postsPerPage` config
- Search config chỉ có: `resultsDisplayStyle`, `showFilters`, `showSorting`, `showResultCount`
- **Nếu có pagination** thì cần thêm `postsPerPage`

### 6. **[CẬP NHẬT] Ticket #9 - isLoading chưa hoàn chỉnh**
- Hiện tại: `isLoading = experienceSetting === undefined`
- So sánh products-list: `isLoading = experienceSetting === undefined || productsModule === undefined || wishlistModule === undefined || ...`
- Search query 3 modules (posts, products, services) nhưng không chờ chúng load

### 7. **[MỚI] Thiếu dark mode support trong text colors của page header**
- Posts-list có: `text-slate-900 dark:text-slate-100` cho h1
- Search page thiếu: `text-slate-900 dark:text-slate-100` (chỉ có class không dark variant)

## Tổng kết tickets mới cần thêm

| # | Ticket | Priority |
|---|--------|----------|
| 11 | Thiếu `useSearchFilterConfig` hook trong useSiteConfig.ts | Medium |
| 12 | Thiếu `postsPerPage` nếu search có pagination | Low |
| 13 | Thiếu dark mode class cho page header text | Low |

## Action items

1. Cập nhật file `qa-experiences-search.md` với 3 tickets mới
2. Cập nhật mô tả ticket #9 với chi tiết về modules cần chờ
3. Thêm priority cho mỗi ticket (đề xuất)
