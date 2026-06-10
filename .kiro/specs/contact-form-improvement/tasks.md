# Implementation Plan: Contact Form Improvement

## Overview

Thay thế JSON editor bằng structured form với validation đầy đủ, quản lý social links động, dynamic text fields theo style, và cân bằng lại primary/secondary color usage trong getContactColorTokens.

## Tasks

- [x] 1. Tạo validation utilities và constants
  - [x] 1.1 Tạo file validation utilities
    - Tạo `app/admin/home-components/contact/_lib/validation.ts`
    - Implement `isValidUrl(url: string): boolean` - validate http/https URLs, empty string valid
    - Implement `isValidEmail(email: string): boolean` - validate email format, empty string valid
    - Implement `isValidPhone(phone: string): boolean` - validate phone characters (digits, spaces, +, -, (, )), empty string valid
    - Implement `validateContactConfig(config: ContactConfigState): ValidationResult` - aggregate validation cho tất cả fields
    - Export interface `ValidationResult` với `isValid` và `errors` object
    - _Requirements: 7.1, 7.2, 7.3, 4.5_

  - [x]* 1.2 Write property tests cho validation utilities
    - **Property 10: URL Validation Round Trip**
    - **Property 11: Email Validation Pattern Matching**
    - **Property 12: Phone Validation Character Whitelist**
    - Tạo `app/admin/home-components/contact/_lib/__tests__/validation.property.test.ts`
    - Sử dụng `@fast-check/vitest` với 100 iterations per test
    - Test valid/invalid URLs, emails, phones với random generation
    - **Validates: Requirements 7.1, 7.2, 7.3, 4.5**

  - [ ]* 1.3 Write unit tests cho validation utilities
    - Tạo `app/admin/home-components/contact/_lib/__tests__/validation.test.ts`
    - Test edge cases: empty strings, malformed inputs, boundary cases
    - Test `validateContactConfig` với various config combinations
    - _Requirements: 7.1, 7.2, 7.3, 4.5_

- [x] 2. Implement FormFieldsSelector component
  - [x] 2.1 Tạo FormFieldsSelector component
    - Tạo `app/admin/home-components/contact/_components/FormFieldsSelector.tsx`
    - Props: `selected: string[]`, `onChange: (fields: string[]) => void`
    - Render checkboxes cho 4 options: name, email, phone, message
    - Disable checkbox nếu chỉ còn 1 field được chọn (minimum constraint)
    - Call onChange với updated array khi user toggle checkbox
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x]* 2.2 Write unit tests cho FormFieldsSelector
    - Tạo `app/admin/home-components/contact/_components/__tests__/FormFieldsSelector.test.tsx`
    - Test render checkboxes, toggle selection, minimum constraint
    - Test onChange callback với correct array
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Implement SocialLinksManager component
  - [x] 3.1 Tạo SocialLinksManager component
    - Tạo `app/admin/home-components/contact/_components/SocialLinksManager.tsx`
    - Props: `links: ContactSocialLink[]`, `onChange`, `onValidationChange`
    - Render danh sách links với platform input, URL input, delete button
    - Button "Thêm link" tạo link mới với id = Math.max(...ids) + 1
    - Real-time URL validation với `isValidUrl`
    - Emit validation errors lên parent qua `onValidationChange`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x]* 3.2 Write property tests cho SocialLinksManager
    - **Property 4: Social Links ID Uniqueness**
    - **Property 5: Social Links Deletion Removes Target**
    - Tạo `app/admin/home-components/contact/_components/__tests__/SocialLinksManager.property.test.tsx`
    - Test adding link generates unique id với random existing links
    - Test deleting link removes correct target
    - **Validates: Requirements 4.2, 4.3**

  - [x]* 3.3 Write unit tests cho SocialLinksManager
    - Tạo `app/admin/home-components/contact/_components/__tests__/SocialLinksManager.test.tsx`
    - Test render links, add link, delete link, validation errors
    - Test onChange và onValidationChange callbacks
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4. Implement DynamicTextFields component
  - [x] 4.1 Tạo DynamicTextFields component
    - Tạo `app/admin/home-components/contact/_components/DynamicTextFields.tsx`
    - Props: `style: ContactStyle`, `texts: Record<string, string>`, `onChange`
    - Lấy field definitions từ `TEXT_FIELDS[style]` constant
    - Render Input cho mỗi field với label và placeholder từ definition
    - Update texts object khi user thay đổi input
    - Re-render khi style thay đổi, preserve existing texts với matching keys
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x]* 4.2 Write property tests cho DynamicTextFields
    - **Property 6: Dynamic Text Fields Render According to Style**
    - **Property 7: Style Change Updates Field List Immediately**
    - Tạo `app/admin/home-components/contact/_components/__tests__/DynamicTextFields.property.test.tsx`
    - Test render correct fields cho random styles
    - Test style change preserves matching texts
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5**

  - [x]* 4.3 Write unit tests cho DynamicTextFields
    - Tạo `app/admin/home-components/contact/_components/__tests__/DynamicTextFields.test.tsx`
    - Test render fields, update texts, style change behavior
    - Test onChange callback với correct texts object
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Checkpoint - Ensure all component tests pass
  - Chạy `bun test` để verify tất cả component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement ConfigEditor component
  - [x] 6.1 Tạo ConfigEditor component structure
    - Tạo `app/admin/home-components/contact/_components/ConfigEditor.tsx`
    - Props: `value: ContactConfigState`, `onChange`, `title?`
    - Setup validation state: `ValidationErrors` interface với mapEmbed, email, phone, socialLinks
    - Implement `validateContactConfig` call và track errors
    - Render Card groups: Map Settings, Contact Information, Form Settings, Social Links, Color Harmony, Text Customization
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 6.2 Implement Map Settings card
    - Toggle cho `showMap` với label "Hiển thị bản đồ"
    - Conditional Textarea cho `mapEmbed` khi showMap = true
    - Placeholder: "Nhập iframe embed code từ Google Maps"
    - Validation error display cho mapEmbed nếu invalid URL
    - _Requirements: 1.1, 1.2, 7.1, 7.5_

  - [x] 6.3 Implement Contact Information card
    - Input text cho `address` với label "Địa chỉ"
    - Input text cho `phone` với label "Số điện thoại", validation error display
    - Input text cho `email` với label "Email", validation error display
    - Input text cho `workingHours` với label "Giờ làm việc"
    - _Requirements: 1.3, 7.2, 7.3, 7.5_

  - [x] 6.4 Implement Form Settings card
    - Toggle cho `showForm` với label "Hiển thị form liên hệ"
    - Conditional rendering: khi showForm = true, hiển thị FormFieldsSelector và optional fields
    - FormFieldsSelector component integration
    - Input text cho `formTitle`, `submitButtonText`, `responseTimeText`
    - Textarea cho `formDescription`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 2.1, 2.2, 2.3, 2.4_

  - [x] 6.5 Implement Social Links card
    - Integrate SocialLinksManager component
    - Pass `config.socialLinks`, onChange handler, onValidationChange handler
    - Aggregate social links validation errors vào ConfigEditor state
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.6 Implement Color Harmony card
    - Select dropdown cho `harmony` với 3 options: analogous, complementary, triadic
    - Label: "Chế độ màu hài hòa"
    - Helper text: "Chọn cách phối màu phụ từ màu chủ đạo"
    - _Requirements: 1.4_

  - [x] 6.7 Implement Text Customization card
    - Integrate DynamicTextFields component
    - Pass `config.style`, `config.texts`, onChange handler
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x]* 6.8 Write property tests cho ConfigEditor
    - **Property 1: Field Updates Trigger State Changes**
    - **Property 8: Invalid Inputs Show Validation Errors**
    - **Property 9: Valid Inputs Clear Validation Errors**
    - **Property 17: Conditional Form Fields Visibility**
    - **Property 18: Component Rendering Reflects Initial State**
    - Tạo `app/admin/home-components/contact/_components/__tests__/ConfigEditor.property.test.tsx`
    - Test field updates, validation errors, conditional rendering với random configs
    - **Validates: Requirements 1.5, 7.1, 7.2, 7.3, 7.4, 7.5, 3.2, 3.3**

  - [x]* 6.9 Write unit tests cho ConfigEditor
    - Tạo `app/admin/home-components/contact/_components/__tests__/ConfigEditor.test.tsx`
    - Test render all cards, field updates, validation, conditional rendering
    - Test integration với sub-components (FormFieldsSelector, SocialLinksManager, DynamicTextFields)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.1, 3.2, 3.3, 3.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Refactor getContactColorTokens để cân bằng primary/secondary
  - [x] 7.1 Update color token assignments
    - Mở `app/admin/home-components/contact/_lib/colors.ts`
    - Trong hàm `getContactColorTokens`:
      - Đổi `heading` từ `secondaryPalette.solid` → `primaryPalette.solid`
      - Đổi `sectionBadgeBg` từ `secondaryPalette.surface` → `primaryPalette.surface`
      - Đổi `iconTintBackground` từ `secondaryPalette.surface` → `primaryPalette.surface`
      - Giữ nguyên `socialBackground` = `secondaryPalette.surface`
    - Ensure tất cả text/background pairs vẫn được validate với `ensureAPCATextColor`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x]* 7.2 Write property tests cho color balance
    - **Property 13: APCA Contrast Preservation After Color Changes**
    - Tạo `app/admin/home-components/contact/_lib/__tests__/colors.property.test.ts`
    - Test với random primary/secondary colors, verify tất cả text/background pairs meet APCA threshold
    - Use `getContactAccessibilityScore` để verify no failing pairs
    - **Validates: Requirements 6.4, 6.5**

  - [x]* 7.3 Write unit tests cho color changes
    - Tạo `app/admin/home-components/contact/_lib/__tests__/colors.test.ts`
    - Test specific color assignments: heading uses primary, sectionBadgeBg uses primary, etc.
    - Test APCA validation với known color pairs
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Checkpoint - Verify color changes và tests
  - Chạy `bun test` để verify color tests pass
  - Visual check: preview một ContactStyle để verify primary color prominence
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Update ContactEditPage để sử dụng ConfigEditor
  - [x] 9.1 Replace ConfigJsonForm với ConfigEditor
    - Mở `app/admin/home-components/contact/[id]/edit/page.tsx`
    - Import ConfigEditor thay vì ConfigJsonForm
    - Replace `<ConfigJsonForm value={config} onChange={setConfig} />` với `<ConfigEditor value={config} onChange={setConfig} />`
    - Remove ConfigJsonForm import
    - _Requirements: 1.6, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 9.2 Integrate validation với submit button
    - Import `validateContactConfig` từ validation utilities
    - Compute `hasValidationErrors = !validateContactConfig(config).isValid`
    - Update submit button disabled condition: `!canSubmit` where `canSubmit = hasChanges && !hasValidationErrors && !isSubmitting`
    - _Requirements: 7.4, 8.4_

  - [x] 9.3 Ensure normalization functions are used
    - Verify `normalizeContactConfig` được gọi khi load config
    - Verify `toContactConfigPayload` được gọi trong mutation
    - Verify `toContactSnapshot` được gọi cho hasChanges detection
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x]* 9.4 Write property tests cho normalization
    - **Property 14: Config Normalization Round Trip**
    - **Property 15: Payload Transformation Preserves Data**
    - **Property 16: Snapshot Comparison Detects Changes**
    - Tạo `app/admin/home-components/contact/_lib/__tests__/normalize.property.test.ts`
    - Test normalization idempotency, payload round trip, snapshot comparison với random configs
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [x]* 9.5 Write integration tests cho ContactEditPage
    - Tạo `app/admin/home-components/contact/[id]/edit/__tests__/page.integration.test.tsx`
    - Test full flow: load config → edit fields → validation → submit
    - Test style change triggers DynamicTextFields update
    - Test hasChanges detection
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10. Final checkpoint và cleanup
  - [x] 10.1 Run full test suite
    - Chạy `bun test` để verify tất cả tests pass
    - Chạy `bunx tsc --noEmit` để verify no TypeScript errors
    - _Requirements: All_

  - [x] 10.2 Manual testing checklist
    - Test thêm/xóa/sửa social links
    - Test validation errors cho URL, email, phone
    - Test style change updates dynamic text fields
    - Test form fields selection với minimum constraint
    - Test conditional form fields visibility (showForm toggle)
    - Test submit button disabled khi có validation errors
    - Visual verify primary color prominence trong preview
    - _Requirements: All_

  - [x] 10.3 Commit changes
    - Commit với message: "feat(contact): replace JSON editor with structured form and balance primary/secondary colors"
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional và có thể skip để faster MVP
- Mỗi task references specific requirements cho traceability
- Property tests validate universal correctness properties với 100 iterations
- Unit tests validate specific examples và edge cases
- Checkpoints ensure incremental validation
- Sử dụng `@fast-check/vitest` cho property-based testing
- Tất cả validation phải inline errors dưới fields
- Submit button disabled khi có validation errors
- Primary color usage tăng từ ~40:60 lên ~70:30 so với secondary
