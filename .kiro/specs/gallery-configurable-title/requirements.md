# Requirements Document

## Introduction

Feature này cho phép người dùng cấu hình tiêu đề tùy chỉnh cho Gallery component. Hiện tại, Gallery component có text "Những hình ảnh" được hardcode trong form nhưng không có tiêu đề hiển thị trong preview và runtime. Sau khi implement feature này, người dùng sẽ có thể nhập tiêu đề tùy chỉnh (ví dụ: "Những ảnh đẹp của chúng tôi") và tiêu đề này sẽ hiển thị trong cả preview (admin) và runtime (site).

## Glossary

- **Gallery_Component**: Component hiển thị thư viện ảnh với nhiều style khác nhau (spotlight, explore, stories, grid, marquee, masonry)
- **GalleryForm**: Form component trong admin để cấu hình Gallery
- **GalleryPreview**: Preview component trong admin để xem trước Gallery
- **GallerySection**: Runtime component hiển thị Gallery trên site
- **Title**: Tiêu đề hiển thị phía trên gallery, có thể config bởi user
- **Create_Page**: Trang tạo mới Gallery component (/admin/home-components/create/gallery)
- **Edit_Page**: Trang chỉnh sửa Gallery component (/admin/home-components/gallery/[id]/edit)
- **ComponentRenderer**: Component render các home components trên site

## Requirements

### Requirement 1: Xóa hardcoded text trong form

**User Story:** Là một developer, tôi muốn xóa text "Những hình ảnh" hardcode trong form, để code clean và không gây nhầm lẫn với title thực sự.

#### Acceptance Criteria

1. THE GalleryForm SHALL NOT hiển thị text "Những hình ảnh" hardcode trong CardTitle
2. THE Create_Page SHALL NOT có text "Những hình ảnh" hardcode trong CardTitle
3. THE GalleryForm SHALL hiển thị text phù hợp với componentType (Gallery/Partners/TrustBadges)

### Requirement 2: Preview hiển thị title

**User Story:** Là một admin, tôi muốn xem title trong preview khi tạo/sửa Gallery, để biết title sẽ hiển thị như thế nào trên site.

#### Acceptance Criteria

1. WHEN GalleryPreview nhận title prop THEN THE GalleryPreview SHALL hiển thị title với style h2 phía trên gallery content
2. WHEN title prop là empty string THEN THE GalleryPreview SHALL NOT hiển thị title element
3. THE title element SHALL sử dụng màu từ colors.primary
4. THE title element SHALL có class "text-2xl md:text-3xl font-bold tracking-tighter mb-4"

### Requirement 3: Edit page truyền title vào preview

**User Story:** Là một admin, tôi muốn thấy title trong preview khi edit Gallery, để xem trước title hiển thị.

#### Acceptance Criteria

1. WHEN Edit_Page render GalleryPreview THEN THE Edit_Page SHALL truyền title prop vào GalleryPreview
2. THE title prop value SHALL lấy từ state title của Edit_Page
3. WHEN user thay đổi title input THEN THE preview SHALL cập nhật title hiển thị ngay lập tức

### Requirement 4: Create page truyền title vào preview

**User Story:** Là một admin, tôi muốn thấy title trong preview khi tạo Gallery mới, để xem trước title hiển thị.

#### Acceptance Criteria

1. WHEN Create_Page render GalleryPreview THEN THE Create_Page SHALL truyền title prop vào GalleryPreview
2. THE title prop value SHALL lấy từ state title của Create_Page
3. WHEN user thay đổi title input THEN THE preview SHALL cập nhật title hiển thị ngay lập tức

### Requirement 5: Runtime hiển thị title

**User Story:** Là một visitor, tôi muốn thấy tiêu đề của gallery trên site, để biết nội dung của gallery.

#### Acceptance Criteria

1. WHEN GallerySection render với type === 'Gallery' THEN THE GallerySection SHALL hiển thị title phía trên gallery content
2. WHEN title prop là empty string THEN THE GallerySection SHALL NOT hiển thị title element
3. THE title element SHALL hiển thị trước renderGalleryContent()
4. THE title element SHALL sử dụng màu từ colors.primary
5. THE title element SHALL có class "text-2xl md:text-3xl font-bold tracking-tighter mb-4"
6. THE title element SHALL nằm trong container với padding phù hợp

### Requirement 6: Consistency với các component khác

**User Story:** Là một developer, tôi muốn Gallery component hiển thị title giống các component khác, để UI nhất quán.

#### Acceptance Criteria

1. THE Gallery title style SHALL tương tự BlogSection title style
2. THE Gallery title style SHALL tương tự ServiceListSection title style
3. THE title element SHALL sử dụng h2 tag
4. THE title element SHALL có responsive font size (text-2xl md:text-3xl)
