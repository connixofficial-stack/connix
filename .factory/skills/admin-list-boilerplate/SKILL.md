---
name: admin-list-boilerplate
description: "Chuẩn hóa trang list resource trong /admin theo chuẩn VietAdmin (search, filter, sort, pagination, bulk actions, column toggle, sticky header, empty state, ModuleGuard). Dùng khi user nói: \"chuẩn hóa list admin\", \"list resource admin\", hoặc cần tạo/chuẩn hóa trang /admin/[resource]."
version: 1.0.0
---

# Admin List Boilerplate

## Mục tiêu

Chuẩn hóa trang list resource trong `/admin` theo chuẩn sẵn có của dự án, **reference: `/admin/posts`**.

## Khi nào dùng

- User yêu cầu chuẩn hóa list admin
- Tạo mới trang list cho module admin
- Muốn đồng bộ UX table giữa các resource

## Quick start

1. Mở reference: `app/admin/posts/page.tsx`
2. Tìm trang list cần chuẩn hóa: `app/admin/[resource]/page.tsx`
3. Áp dụng checklist dưới đây

## Checklist chuẩn hóa (phải có)

### 1) Guard + Settings

- Bọc bằng `<ModuleGuard moduleKey="[resource]">`.
- Lấy `itemsPerPage` từ module settings (key chuẩn theo module).

### 2) Query & State chuẩn

- `useQuery` cho list + count (không fetch all).
- `searchTerm` có debounce 300ms.
- `filterStatus` (Published/Draft/Archived) nếu content-type.
- `currentPage`, `pageSizeOverride`.

### 3) Table UX

- `SortableHeader` + `useSortableData`.
- `ColumnToggle` + lưu `localStorage` (key: `admin_[resource]_visible_columns`).
- `SelectCheckbox` với trạng thái indeterminate.
- **Sticky header** trên `TableHeader`:
  ```tsx
  <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
  ```

### 4) Bulk actions

- `BulkActionBar` khi có selected.
- Cho phép `Chọn trang này` + `Chọn tất cả kết quả`.
- Có giới hạn số lượng nếu API trả `hasMore`.

### 5) Empty + Loading

- Skeleton rows theo `resolvedItemsPerPage`.
- Empty state phân biệt: “không có dữ liệu” vs “không có kết quả lọc”.

### 6) Pagination chuẩn

- Hiển thị range `x–y/total`.
- Có chọn page size (10/20/30/50/100).
- Pagination có ellipsis (giống Posts).

## Snippet nền (rút gọn)

```tsx
<Table>
  <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
    <TableRow>
      <TableHead className="w-[40px]">
        <SelectCheckbox ... />
      </TableHead>
      <SortableHeader label="Tiêu đề" sortKey="title" ... />
      <TableHead className="text-right">Hành động</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>...</TableBody>
</Table>
```

## Best practices nội bộ (KISS/YAGNI/DRY)

- Ưu tiên dùng lại `TableUtilities` và `ui.tsx`.
- Không thêm logic mới nếu Posts đã có pattern tương đương.
- Không fetch all rồi filter JS.

## Reference files

- `app/admin/posts/page.tsx`
- `app/admin/components/TableUtilities.tsx`
- `app/admin/components/ModuleGuard.tsx`
- `app/admin/components/ui.tsx`

## Validation

- Chạy: `bunx oxlint --type-aware --type-check --fix`
- Chạy: `npm run lint`
