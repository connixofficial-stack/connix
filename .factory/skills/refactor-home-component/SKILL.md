---
name: refactor-home-component
description: Tách home component từ file monolithic (edit/page.tsx, previews.tsx) thành module feature-based với _types, _lib, _components và route riêng. Dùng khi user nói "tách component", "refactor home component", "split component", "modularize", hoặc cần chuẩn hoá theo pattern Hero.
---

# Refactor Home Component

## Quick start
- Input: tên component (vd: `stats`, `product-list`, `cta`)
- Output: module mới theo pattern Hero + cleanup code cũ

## Instructions

### 1) Khảo sát code hiện tại
- Tìm tất cả logic của component trong `app/admin/home-components/[id]/edit/page.tsx` và `app/admin/home-components/previews.tsx`
- Ghi lại: types, constants, preview render, form state, save logic, conditional rendering
- Nếu component có upload, kích hoạt `.factory/skills/file-lifecycle-service/SKILL.md` và ghi lại toàn bộ field file/media + `storageId`

### 2) Tạo structure module
```
app/admin/home-components/[component]/
├── [id]/edit/page.tsx
├── _types/index.ts
├── _lib/constants.ts
└── _components/
    ├── [Component]Preview.tsx
    └── [Component]Form.tsx
```

### 3) Tách types
- Tạo `_types/index.ts`
- Move union types, interfaces (style, content, item/slide)

### 4) Tách constants
- Tạo `_lib/constants.ts`
- Move style list, default content, config arrays

### 5) Tách Preview component
- Tạo `_components/[Component]Preview.tsx`
- Dùng shared components: `_shared/components/PreviewWrapper`, `PreviewImage`, `BrowserFrame`
- Dùng hook `_shared/hooks/usePreviewDevice`
- Áp dụng màu brand (primary + secondary)

### 6) Tách Form component
- Tạo `_components/[Component]Form.tsx`
- Dùng shadcn/ui và pattern form của Hero
- Conditional fields theo style/type
- Với upload file, dùng shared uploader đã register draft hoặc `useFileDraftUploads`; không xóa storage trực tiếp cho file đã thuộc record

### 7) Tạo route edit mới
- Tạo `app/admin/home-components/[component]/[id]/edit/page.tsx`
- Load data bằng `useQuery`, save bằng `useMutation`
- Layout 2 cột: Form trái, Preview phải (sticky)
- Preserve `storageId` khi load/save config để backend sync `fileReferences`. **CRITICAL**: Khi tách từ legacy editor, bắt buộc phải audit kỹ lưỡng các hàm map (`.map(...)`), normalizer, và serializer để đảm bảo không bị rò rỉ hoặc bị strip/drop mất trường `storageId` của media.

### 8) Redirect từ route cũ
- Trong `app/admin/home-components/[id]/edit/page.tsx`, nếu `type === [component]` thì `router.replace()` sang route mới

### 9) Cleanup code cũ
- Xoá phần preview trong `previews.tsx`
- Xoá phần form/state/import trong `edit/page.tsx`

### 10) Test & Commit
- Chạy checklist trong `checklist.md`
- Commit theo chuẩn repo (không push)

## Best practices
- Luôn dùng shared preview utilities ở `app/admin/home-components/_shared`
- Giữ naming convention: `[Component]Preview`, `[Component]Form`, `[Component]Style`
- Không thay đổi behaviour ngoài scope
- Tuân thủ KISS/YAGNI/DRY
- Upload lifecycle phải qua FLS: draft cleanup, save sync references, replace/remove/delete không orphan file

## Requirements
- Shared components đã có sẵn trong `_shared/`
- Convex API `homeComponents` hoạt động
- Pattern tham chiếu: Hero (xem `reference.md`)

## Outputs
- Module mới theo pattern Hero
- Route cũ chỉ còn redirect + logic còn lại
- Code cũ được dọn sạch

## Testing
- Xem `checklist.md`

## Reference
- Xem `reference.md` để đối chiếu Hero pattern
