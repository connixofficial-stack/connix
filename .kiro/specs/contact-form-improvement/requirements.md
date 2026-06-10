# Requirements Document

## Introduction

Tính năng cải thiện form Contact trong admin home-components nhằm thay thế JSON editor bằng form fields thực tế với validation và UX tốt hơn, đồng thời cân bằng lại việc sử dụng màu chủ đạo (primary) và màu phụ (secondary) trong các layout để tăng tính nhất quán về thương hiệu.

## Glossary

- **Contact_Form**: Form chỉnh sửa cấu hình Contact component tại `/admin/home-components/contact/[id]/edit`
- **Config_Editor**: Component thay thế ConfigJsonForm, hiển thị các trường nhập liệu cụ thể thay vì JSON editor
- **Color_Balance_System**: Hệ thống phân bổ màu sắc trong hàm `getContactColorTokens` để cân bằng primary/secondary usage
- **Dynamic_Text_Fields**: Các trường text động thay đổi theo ContactStyle được chọn (dựa trên TEXT_FIELDS constant)
- **Social_Links_Manager**: Component quản lý danh sách social links với khả năng thêm/xóa/sửa
- **Form_Fields_Selector**: Component cho phép chọn các trường form (name, email, phone, message)

## Requirements

### Requirement 1: Thay thế JSON Editor bằng Structured Form

**User Story:** Là admin, tôi muốn chỉnh sửa cấu hình Contact qua các trường form cụ thể thay vì JSON editor, để tránh lỗi cú pháp và dễ sử dụng hơn.

#### Acceptance Criteria

1. THE Config_Editor SHALL hiển thị toggle switch cho trường `showMap`
2. THE Config_Editor SHALL hiển thị textarea cho trường `mapEmbed` với placeholder hợp lý
3. THE Config_Editor SHALL hiển thị input text cho các trường `address`, `phone`, `email`, `workingHours`
4. THE Config_Editor SHALL hiển thị select dropdown cho trường `harmony` với 3 options: analogous, complementary, triadic
5. WHEN user thay đổi bất kỳ trường nào, THE Config_Editor SHALL cập nhật state config tương ứng
6. THE Config_Editor SHALL thay thế hoàn toàn component ConfigJsonForm trong page.tsx

### Requirement 2: Form Fields Selection

**User Story:** Là admin, tôi muốn chọn các trường hiển thị trong contact form, để tùy chỉnh thông tin thu thập từ khách hàng.

#### Acceptance Criteria

1. THE Form_Fields_Selector SHALL hiển thị checkboxes hoặc multi-select cho 4 options: name, email, phone, message
2. WHEN user chọn/bỏ chọn một option, THE Form_Fields_Selector SHALL cập nhật mảng `formFields` trong config
3. THE Form_Fields_Selector SHALL hiển thị các options đã chọn theo thứ tự trong mảng `formFields`
4. THE Form_Fields_Selector SHALL cho phép chọn ít nhất 1 field (không được để trống)

### Requirement 3: Optional Form Configuration Fields

**User Story:** Là admin, tôi muốn cấu hình các text hiển thị trong form (title, description, button text), để tùy chỉnh nội dung phù hợp với ngữ cảnh.

#### Acceptance Criteria

1. THE Config_Editor SHALL hiển thị toggle cho `showForm` với label rõ ràng
2. WHEN `showForm` is true, THE Config_Editor SHALL hiển thị các trường optional: `formTitle`, `formDescription`, `submitButtonText`, `responseTimeText`
3. WHEN `showForm` is false, THE Config_Editor SHALL ẩn các trường optional form
4. THE Config_Editor SHALL cho phép các trường optional để trống (không bắt buộc)

### Requirement 4: Social Links Management

**User Story:** Là admin, tôi muốn quản lý danh sách social links với platform và URL, để hiển thị các kênh mạng xã hội của doanh nghiệp.

#### Acceptance Criteria

1. THE Social_Links_Manager SHALL hiển thị danh sách các social links hiện có với platform và url
2. WHEN user clicks "Thêm link", THE Social_Links_Manager SHALL thêm một social link mới với id unique
3. WHEN user clicks "Xóa" trên một link, THE Social_Links_Manager SHALL xóa link đó khỏi mảng `socialLinks`
4. THE Social_Links_Manager SHALL cho phép chỉnh sửa `platform` và `url` cho mỗi link
5. THE Social_Links_Manager SHALL validate URL format khi user nhập (basic validation)

### Requirement 5: Dynamic Text Fields Based on Style

**User Story:** Là admin, tôi muốn các trường text tùy chỉnh thay đổi theo style được chọn, để chỉnh sửa đúng các label/heading của từng layout.

#### Acceptance Criteria

1. WHEN user chọn một ContactStyle, THE Dynamic_Text_Fields SHALL hiển thị các trường text tương ứng từ TEXT_FIELDS constant
2. THE Dynamic_Text_Fields SHALL hiển thị label và placeholder cho mỗi trường theo định nghĩa trong TEXT_FIELDS
3. WHEN user thay đổi style, THE Dynamic_Text_Fields SHALL cập nhật danh sách trường hiển thị ngay lập tức
4. THE Dynamic_Text_Fields SHALL lưu giá trị vào object `texts` trong config với key tương ứng
5. THE Dynamic_Text_Fields SHALL hiển thị giá trị hiện có từ `config.texts` khi load

### Requirement 6: Cân bằng Primary và Secondary Color Usage

**User Story:** Là admin, tôi muốn màu chủ đạo (primary) được sử dụng nhiều hơn màu phụ (secondary) trong các layout, để tăng tính nhất quán thương hiệu.

#### Acceptance Criteria

1. THE Color_Balance_System SHALL sử dụng primary color cho `heading` thay vì secondary
2. THE Color_Balance_System SHALL giảm việc sử dụng secondary color trong `sectionBadgeBg`, `iconTintBackground`, `socialBackground`
3. THE Color_Balance_System SHALL tăng việc sử dụng primary color cho ít nhất 2 trong 3 tokens: `sectionBadgeBg`, `iconTintBackground`, `socialBackground`
4. THE Color_Balance_System SHALL giữ nguyên logic APCA contrast checking cho accessibility
5. THE Color_Balance_System SHALL đảm bảo tất cả các cặp màu text/background vẫn đạt APCA threshold

### Requirement 7: Form Validation và Error Handling

**User Story:** Là admin, tôi muốn được thông báo lỗi khi nhập sai format, để đảm bảo dữ liệu hợp lệ trước khi lưu.

#### Acceptance Criteria

1. WHEN user nhập URL không hợp lệ trong `mapEmbed` hoặc social links, THE Config_Editor SHALL hiển thị error message
2. WHEN user nhập email không đúng format, THE Config_Editor SHALL hiển thị error message
3. WHEN user nhập phone không hợp lệ (chứa ký tự đặc biệt không cho phép), THE Config_Editor SHALL hiển thị error message
4. THE Config_Editor SHALL disable nút "Lưu thay đổi" khi có validation error
5. THE Config_Editor SHALL hiển thị error message màu đỏ dưới trường bị lỗi

### Requirement 8: Preserve Existing Functionality

**User Story:** Là admin, tôi muốn các tính năng hiện có (preview, style selection, color validation) vẫn hoạt động bình thường, để đảm bảo không có regression.

#### Acceptance Criteria

1. THE Contact_Form SHALL giữ nguyên ContactPreview component và vị trí hiển thị
2. THE Contact_Form SHALL giữ nguyên logic style selection và onStyleChange callback
3. THE Contact_Form SHALL giữ nguyên logic color validation warnings (deltaE, APCA)
4. THE Contact_Form SHALL giữ nguyên logic hasChanges detection dựa trên snapshot
5. THE Contact_Form SHALL giữ nguyên mutation call với toContactConfigPayload normalization

### Requirement 9: UI/UX Improvements

**User Story:** Là admin, tôi muốn form có layout rõ ràng với grouping hợp lý, để dễ dàng tìm và chỉnh sửa các trường liên quan.

#### Acceptance Criteria

1. THE Config_Editor SHALL nhóm các trường liên quan vào các Card riêng biệt (Map Settings, Contact Info, Form Settings, Social Links, Text Customization)
2. THE Config_Editor SHALL hiển thị label rõ ràng cho mỗi trường với required indicator (*) nếu cần
3. THE Config_Editor SHALL sử dụng spacing nhất quán giữa các trường (space-y-4 hoặc tương đương)
4. THE Config_Editor SHALL hiển thị helper text cho các trường phức tạp (mapEmbed, harmony)
5. THE Config_Editor SHALL responsive trên mobile (stack vertical)

### Requirement 10: Data Normalization và Backward Compatibility

**User Story:** Là developer, tôi muốn đảm bảo data được normalize đúng và tương thích với code hiện có, để tránh breaking changes.

#### Acceptance Criteria

1. THE Config_Editor SHALL sử dụng `normalizeContactConfig` trước khi hiển thị và sau khi user thay đổi
2. THE Config_Editor SHALL sử dụng `toContactConfigPayload` khi submit form
3. THE Config_Editor SHALL sử dụng `toContactSnapshot` cho hasChanges detection
4. THE Config_Editor SHALL handle missing fields bằng cách sử dụng DEFAULT_CONTACT_CONFIG
5. THE Config_Editor SHALL không thay đổi cấu trúc data model (ContactConfigState interface)
