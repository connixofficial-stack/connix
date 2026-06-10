# Requirements: Fix Clients Component Placeholder & Preview

## Tổng quan

Component Clients tại `/admin/home-components/create/clients` có vấn đề về hiển thị placeholder khi chưa có ảnh. Cần fix để đảm bảo UX tốt như các component khác (Stats, Hero).

## Vấn đề hiện tại

### 1. Preview không hiển thị gì khi có slot ảnh nhưng chưa upload
- **Hiện trạng**: Khi thêm slot ảnh mới (clientItems.length > 0) nhưng chưa upload ảnh (url rỗng), preview hoàn toàn trống
- **Nguyên nhân**: `normalizeClientItems()` trong `ClientsSectionShared.tsx` filter bỏ items có `url` rỗng → `normalizedItems.length === 0` → hiển thị empty state
- **Mong đợi**: Hiển thị placeholder icon/box cho từng slot chưa có ảnh, giống như form editor

### 2. Inconsistency với pattern Stats/Hero
- Stats/Hero dùng `MultiImageUploader` với placeholder rõ ràng
- Clients dùng custom form với logic khác biệt
- Cần đồng bộ UX giữa các components

### 3. Empty state chỉ nên hiện khi thực sự không có items
- Empty state hiện tại: "Chưa có logo khách hàng" + icon
- Nên chỉ hiện khi `clientItems.length === 0` (chưa thêm slot nào)
- Không nên hiện khi đã có slots nhưng chưa upload

## User Stories

### US-1: Placeholder cho slot chưa có ảnh
**Là** admin đang tạo Clients component  
**Tôi muốn** thấy placeholder rõ ràng cho mỗi slot ảnh chưa upload  
**Để** biết được có bao nhiêu slots và cần upload ảnh nào

**Acceptance Criteria:**
- AC1.1: Khi thêm slot mới (chưa upload), preview hiển thị placeholder box với icon ImageIcon
- AC1.2: Placeholder có style nhất quán với form editor (border dashed, màu neutral)
- AC1.3: Placeholder có kích thước phù hợp với style đã chọn (marquee/grid/carousel...)
- AC1.4: Khi upload ảnh thành công, placeholder biến thành ảnh thật

### US-2: Empty state chính xác
**Là** admin mới vào trang create  
**Tôi muốn** thấy empty state chỉ khi chưa thêm slot nào  
**Để** hiểu được cần bắt đầu từ đâu

**Acceptance Criteria:**
- AC2.1: Empty state chỉ hiện khi `clientItems.length === 0`
- AC2.2: Khi đã có >= 1 slot (dù chưa upload), không hiện empty state
- AC2.3: Empty state có message rõ ràng: "Chưa có logo khách hàng. Thêm ít nhất 3 logo để marquee mượt hơn"

### US-3: Consistency với dual-brand-color-system
**Là** developer maintain codebase  
**Tôi muốn** Clients component tuân thủ dual-brand-color-system skill  
**Để** đảm bảo màu sắc nhất quán và accessibility

**Acceptance Criteria:**
- AC3.1: Placeholder background dùng `tokens.placeholderBackground` (neutral)
- AC3.2: Placeholder icon dùng `tokens.placeholderIcon` (neutral)
- AC3.3: Không dùng primary/secondary tint cho placeholder (theo rule Content-Aware Color Distribution)
- AC3.4: Text trên placeholder pass APCA contrast

## Technical Context

### Files liên quan
- `app/admin/home-components/create/clients/page.tsx` - Create page
- `app/admin/home-components/clients/_components/ClientsForm.tsx` - Form editor
- `app/admin/home-components/clients/_components/ClientsPreview.tsx` - Preview wrapper
- `app/admin/home-components/clients/_components/ClientsSectionShared.tsx` - Render logic
- `app/admin/home-components/clients/_lib/colors.ts` - Color tokens

### Pattern tham khảo
- `app/admin/home-components/create/stats/page.tsx` - Stats pattern (simple)
- `app/admin/home-components/create/hero/page.tsx` - Hero pattern (MultiImageUploader)
- `app/admin/components/MultiImageUploader.tsx` - Reusable uploader component

### Constraints
- KHÔNG refactor sang MultiImageUploader (scope quá lớn)
- CHỈ fix logic render placeholder trong ClientsSectionShared
- Giữ nguyên ClientsForm UI (đã có placeholder tốt)
- Tuân thủ dual-brand-color-system skill (neutral cho placeholder)

## Out of Scope

- Refactor ClientsForm sang MultiImageUploader
- Thay đổi upload logic
- Thêm tính năng mới (drag-drop, bulk upload...)
- Fix các components khác (Stats, Hero đã OK)

## Success Metrics

- Preview hiển thị placeholder cho 100% slots chưa có ảnh
- Empty state chỉ hiện khi `clientItems.length === 0`
- Placeholder colors pass APCA contrast check
- Code tuân thủ 100% dual-brand-color-system rules

## References

- Skill: `.factory/skills/dual-brand-color-system/SKILL.md`
- Pattern: Content-Aware Color Distribution (Layer 2: Placeholder State)
- APCA: `apca-w3` library for contrast validation
