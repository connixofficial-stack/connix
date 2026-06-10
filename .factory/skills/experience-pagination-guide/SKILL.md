---
name: experience-pagination-guide
description: Chuẩn hoá phân trang cho experiences (pagination + infinite scroll), skeleton loading, URL params, và màu thương hiệu. Dùng khi user muốn áp dụng pagination cho experience pages (posts list, product list, blog list) hoặc yêu cầu “phân trang”, “infinite scroll”, “skeleton”, “page size”.
---

# Experience Pagination Guide

Skill này hướng dẫn triển khai phân trang chuẩn cho các experiences theo pattern đã áp dụng ở post-list.

## Quick start

1. Xác định `paginationType` (pagination/infiniteScroll) từ experience config.
2. Dùng cursor pagination cho trang (cache) nếu không có search/sort phức tạp.
3. Fallback offset pagination khi có search/sort `title`.
4. Hiển thị skeleton khi đang load trang.
5. Áp dụng màu thương hiệu cho UI pagination.

## Quy trình chuẩn

### 1) Config & state
- Đọc config từ experience (postsPerPage, paginationType, showSearch/showCategories).
- Đồng bộ `page` từ URL (`useSearchParams`).
- Tạo `postsPerPage` state nếu có dropdown page size.

### 2) Backend query (Convex)
- **Cursor pagination**: dùng `paginate(paginationOpts)` để giảm độ trễ.
- **Offset fallback**: dùng `listWithOffset` khi có search hoặc sort không index được.
- Bảo đảm có index đúng cho filter/sort (status, category, views, publishedAt).

### 3) Frontend data flow
- `usePaginatedQuery` cho infinite scroll và cursor cache.
- Nếu `paginationType=pagination`:
  - Khi **không** search/sort title → dùng cursor cache (slice theo page).
  - Khi **có** search/sort title → dùng query offset.
- Khi chuyển page, **không** reset về page 1 trừ khi filter/search thật sự thay đổi.

### 4) Skeleton loading
- Khi đang load trang (chưa đủ items cho page hiện tại) → render skeleton layout thay vì “không tìm thấy”.
- Với cursor mode: nếu `infiniteResults.length < page * pageSize` thì vẫn là loading.

### 5) UI Pagination
- Dùng sliding window (1 … 5 [6] 7 … 12 13).
- Active page dùng màu thương hiệu.
- Prev/Next border + text theo màu thương hiệu.
- Layout responsive: mobile ẩn page trung gian, giữ 1/last/current.

### 6) Checklist QA
- [ ] Page URL cập nhật đúng (`?page=X`)
- [ ] Không bị reset page khi chỉ click pagination
- [ ] Skeleton xuất hiện khi chờ data
- [ ] Không flash “không tìm thấy” khi đang load
- [ ] Prev/Next disable đúng
- [ ] Brand color áp dụng cho active + controls
- [ ] Infinite scroll vẫn hoạt động (nếu bật)

## Ví dụ snippet (logic cursor cache)

```ts
const useCursorPagination =
  paginationType === 'pagination' &&
  !debouncedSearch?.trim() &&
  sortBy !== 'title';

const posts = useCursorPagination
  ? infiniteResults.slice(offset, offset + pageSize)
  : paginatedPosts ?? [];

const requiredCount = page * pageSize;
const isLoading = useCursorPagination
  ? status === 'LoadingFirstPage' || infiniteResults.length < requiredCount
  : paginatedPosts === undefined;
```

## Lưu ý hiệu năng
- Tránh offset lớn nếu có thể.
- Ưu tiên cursor pagination + cache.
- Chỉ fallback offset khi cần search/sort không index.

## Khi nào dùng
- “Tạo pagination cho experience X”
- “Cần infinite scroll + skeleton loading”
- “Phân trang theo URL”
- “Áp dụng màu thương hiệu cho pagination”
