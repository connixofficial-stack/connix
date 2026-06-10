# Implementation Plan: Gallery Configurable Title

## Overview

Feature này thêm khả năng hiển thị tiêu đề có thể config cho Gallery component. Implementation tập trung vào 3 phần chính:
1. Thêm title rendering vào GalleryPreview (admin preview)
2. Thêm title prop vào Create/Edit pages
3. Di chuyển title rendering vào đúng vị trí trong GallerySection (runtime)

## Tasks

- [x] 1. Thêm title rendering vào GalleryPreview component
  - Mở file `app/admin/home-components/gallery/_components/GalleryPreview.tsx`
  - Tìm các style render functions (renderSpotlightStyle, renderExploreStyle, renderStoriesStyle, renderGalleryGridStyle, renderGalleryMarqueeStyle, renderGalleryMasonryStyle)
  - Trong mỗi function, thêm title element ở đầu return statement (trước gallery content)
  - Title element: `{title && <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-4" style={{ color: colors.primary }}>{title}</h2>}`
  - Đảm bảo title chỉ hiển thị khi title prop có giá trị (truthy check)
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Thêm title prop vào GalleryPreview trong Create page
  - Mở file `app/admin/home-components/create/gallery/page.tsx`
  - Tìm component `<GalleryPreview>`
  - Thêm prop `title={title}` vào GalleryPreview
  - Verify rằng title state đã được truyền đúng
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 3. Thêm title prop vào GalleryPreview trong Edit page
  - Mở file `app/admin/home-components/gallery/[id]/edit/page.tsx`
  - Tìm component `<GalleryPreview>`
  - Thêm prop `title={title}` vào GalleryPreview (có thể đã có comment "Thêm dòng này")
  - Verify rằng title state đã được truyền đúng
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Di chuyển title rendering vào đúng vị trí trong GallerySection runtime
  - Mở file `components/site/ComponentRenderer.tsx`
  - Tìm function `GallerySection` và function `renderGalleryContent()`
  - Xóa đoạn code title rendering hiện tại (đang nằm giữa Gallery và Partners logic):
    ```tsx
    {title && (
      <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-4" style={{ color: colors.primary }}>
        {title}
      </h2>
    )}
    ```
  - Di chuyển title rendering vào TRONG `renderGalleryContent()` function
  - Vị trí: Sau opening `<div className="container...">` và trước accent bar `<div className="mx-auto mb-6 h-1 w-12...">`
  - Đảm bảo title chỉ hiển thị khi type === 'Gallery' (logic này đã có trong if statement)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 5. Verify và cleanup code
  - Verify không còn hardcoded "Những hình ảnh" trong GalleryForm.tsx
  - Verify không còn hardcoded "Những hình ảnh" trong create/gallery/page.tsx
  - Check rằng GalleryForm CardTitle hiển thị đúng text theo componentType
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 6. Checkpoint - Test thủ công và verify
  - Chạy `bunx tsc --noEmit` để check TypeScript errors
  - Test tạo Gallery mới với title "Test Gallery"
  - Verify title hiển thị trong preview (admin)
  - Save và verify title hiển thị trên site
  - Test edit Gallery và thay đổi title
  - Test với empty title (không hiển thị)
  - Test với title dài
  - So sánh style với BlogSection và ServiceListSection để đảm bảo consistency
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

## Notes

- Feature này không cần property-based tests vì chỉ là UI rendering logic đơn giản
- Tất cả changes đều là thêm/di chuyển title element, không thay đổi logic phức tạp
- Title prop đã tồn tại trong interfaces, chỉ cần sử dụng
- Style classes và colors đã được define sẵn, chỉ cần apply
- Sau khi hoàn thành, commit changes với message: "feat: add configurable title display for Gallery component"
