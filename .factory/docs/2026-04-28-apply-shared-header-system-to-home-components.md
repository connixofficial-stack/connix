# I. Primer

## 1. TL;DR kiểu Feynman

- Đã tạo shared component system cho header (title/subtitle/badge) với đầy đủ tính năng từ Stats
- Cần áp dụng cho 12 home-component khác: Benefits, Services, Pricing, Team, Features, Testimonials, FAQ, Gallery, Partners, Video, Contact, About
- Mặc định `hideHeader: false` khi create mới để header luôn hiển thị
- Shared components: `HeaderConfigSection` (admin form), `SectionHeader` (runtime), types và hooks

## 2. Elaboration & Self-Explanation

Hiện tại Stats component đã có hệ thống header hoàn chỉnh với các tính năng:
- Toggle ẩn toàn bộ header (nằm ngoài dropdown)
- Title/subtitle với show/hide toggles
- Badge với text config
- Alignment (left/center/right)
- Title color primary
- Subtitle above title
- Uppercase text
- InputWithClear cho text inputs

Tôi đã tạo shared components để tái sử dụng cho các component khác:
1. **Types**: `SectionHeaderConfig` interface và default config
2. **Admin Form**: `HeaderConfigSection` - UI section cho edit page
3. **Runtime**: `SectionHeader` - component render header trên site
4. **Hooks**: `useSectionHeaderState` và `extractSectionHeaderConfig`

Nhiệm vụ là áp dụng hệ thống này cho 12 component khác, thay thế các implementation riêng lẻ (heading/subHeading/subtitle) bằng shared system chuẩn.

## 3. Concrete Examples & Analogies

**Ví dụ cụ thể:**

Benefits hiện tại:
```typescript
heading: 'Giá trị cốt lõi'
subHeading: 'Vì sao chọn chúng tôi?'
headerAlign: 'left'
```

Sau khi áp dụng shared system:
```typescript
hideHeader: false
showTitle: true
title: 'Giá trị cốt lõi' // component.title
showSubtitle: true
subtitle: 'Vì sao chọn chúng tôi?'
headerAlign: 'left'
titleColorPrimary: false
subtitleAboveTitle: false
uppercaseText: false
showBadge: true
badgeText: ''
```

**Analogy**: Giống như việc thay thế nhiều loại ổ cắm điện khác nhau bằng một chuẩn USB-C thống nhất - tất cả đều dùng chung interface, dễ bảo trì và mở rộng.

# II. Audit Summary (Tóm tắt kiểm tra)

## Components cần áp dụng (theo độ ưu tiên):

### Ưu tiên cao (đã có title/subtitle):
1. **Benefits** - có `heading`, `subHeading`, `headerAlign`
2. **Services** - có `title`, `subtitle`, `showTitle`, `showSubtitle`, `headerAlign`
3. **Pricing** - có `subtitle`
4. **Team** - có `texts.subtitle`
5. **Clients** - có `heading`, `subtitle`
6. **Video** - có `heading`
7. **Contact** - có `heading`
8. **About** - có `heading`

### Ưu tiên trung bình (nên có):
9. **Features** - chưa có section header
10. **Testimonials** - chưa có section header
11. **FAQ** - chưa có section header
12. **Gallery** - chưa có section header
13. **Partners** - chưa có section header

## Shared components đã tạo:

✅ `app/admin/home-components/_shared/types/sectionHeader.ts`
✅ `app/admin/home-components/_shared/components/HeaderConfigSection.tsx`
✅ `app/admin/home-components/_shared/components/SectionHeader.tsx`
✅ `app/admin/home-components/_shared/hooks/useSectionHeaderState.ts`

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

**Root Cause**: Mỗi component tự implement header riêng với naming và features khác nhau (heading vs title, subHeading vs subtitle), dẫn đến:
- Inconsistent UX
- Duplicate code
- Khó maintain và extend features
- Không có InputWithClear, badge, uppercase, color options ở các component khác

**Counter-Hypothesis**: Có thể giữ nguyên implementation riêng và chỉ sync features?
- ❌ Không khả thi: tốn effort gấp 12 lần, dễ sai lệch
- ✅ Shared component: một lần implement, apply cho tất cả

**Confidence**: High (95%) - Shared component pattern đã proven trong Stats

# IV. Proposal (Đề xuất)

## Approach: Incremental Migration

### Phase 1: Benefits (pilot)
- Migrate Benefits component hoàn toàn sang shared system
- Verify preview và site rendering
- Test data migration (heading → title, subHeading → subtitle)

### Phase 2: Services, Pricing, Team (có sẵn config tương tự)
- Apply shared system
- Map existing fields sang new structure
- Backward compatible với data cũ

### Phase 3: Features, Testimonials, FAQ, Gallery, Partners (thêm mới)
- Add header config vào constants
- Integrate HeaderConfigSection vào edit page
- Add SectionHeader vào runtime component

## Default behavior khi create:
```typescript
hideHeader: false  // Luôn hiển thị header mặc định
showTitle: true
showSubtitle: true
showBadge: true
```

# V. Files Impacted (Tệp bị ảnh hưởng)

## Shared (đã tạo):
- `_shared/types/sectionHeader.ts` - Types và default config
- `_shared/components/HeaderConfigSection.tsx` - Admin form section
- `_shared/components/SectionHeader.tsx` - Runtime component
- `_shared/hooks/useSectionHeaderState.ts` - State management hooks

## Per component (12 components × 3-4 files):
- `[component]/_lib/constants.ts` - Thêm: header config vào DEFAULT_CONFIG
- `[component]/[id]/edit/page.tsx` - Sửa: dùng HeaderConfigSection thay vì custom form
- `components/site/home/sections/[Component]RuntimeSection.tsx` - Sửa: dùng SectionHeader
- `[component]/_types/index.ts` - Sửa: extend SectionHeaderConfig (nếu cần)

# VI. Execution Preview (Xem trước thực thi)

## Step 1: Pilot với Benefits
1. Update `benefits/_lib/constants.ts`: thêm header fields
2. Update `benefits/[id]/edit/page.tsx`: replace custom form với HeaderConfigSection
3. Update `BenefitsRuntimeSection.tsx`: dùng SectionHeader component
4. Test preview và site
5. Verify data migration

## Step 2: Apply cho Services, Pricing, Team
- Tương tự Benefits
- Map existing fields (heading/subHeading → title/subtitle)

## Step 3: Apply cho Features, Testimonials, FAQ, Gallery, Partners
- Add new header config
- Integrate components

## Step 4: Verify tất cả
- Test create new component → hideHeader: false
- Test edit existing → preserve data
- Test preview và site rendering

# VII. Verification Plan (Kế hoạch kiểm chứng)

## Typecheck:
```bash
bunx tsc --noEmit
```

## Manual testing:
1. Create new component → header visible by default
2. Toggle hideHeader → header ẩn ở preview và site
3. Edit title/subtitle → update realtime
4. Toggle các options → render đúng
5. Save → persist vào DB
6. Reload page → load đúng config

## Data migration:
- Existing components với heading/subHeading vẫn hoạt động
- New components dùng shared system

# VIII. Todo

- [ ] Phase 1: Migrate Benefits component
- [ ] Phase 2: Migrate Services component
- [ ] Phase 2: Migrate Pricing component
- [ ] Phase 2: Migrate Team component
- [ ] Phase 3: Add header to Features component
- [ ] Phase 3: Add header to Testimonials component
- [ ] Phase 3: Add header to FAQ component
- [ ] Phase 3: Add header to Gallery component
- [ ] Phase 3: Add header to Partners component
- [ ] Phase 3: Add header to Video component
- [ ] Phase 3: Add header to Contact component
- [ ] Phase 3: Add header to About component
- [ ] Verify all components
- [ ] Update documentation

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

✅ Tất cả 12 components có HeaderConfigSection trong edit page
✅ Tất cả 12 components dùng SectionHeader trong runtime
✅ Create new component → hideHeader: false (header visible)
✅ Toggle hideHeader → ẩn/hiện header đúng
✅ InputWithClear hoạt động cho title/subtitle/badge
✅ Tất cả options (align, color, uppercase, badge) hoạt động
✅ Data cũ vẫn load đúng (backward compatible)
✅ TypeScript compile không lỗi
✅ Preview và site render đúng

# X. Risk / Rollback (Rủi ro / Hoàn tác)

## Risks:
- **Data migration**: Component cũ có heading/subHeading, cần map sang title/subtitle
  - Mitigation: extractSectionHeaderConfig handle backward compatibility
- **Breaking changes**: User đang edit component cũ
  - Mitigation: Incremental migration, test từng component

## Rollback:
- Git revert từng commit
- Mỗi component là một commit riêng
- Có thể rollback từng component mà không ảnh hưởng toàn bộ

# XI. Out of Scope (Ngoài phạm vi)

- Migration data cũ trong DB (sẽ handle on-the-fly khi load)
- Refactor các component khác ngoài 12 component đã liệt kê
- Thêm features mới ngoài những gì Stats đã có
- UI/UX redesign cho header section

# XII. Open Questions (Câu hỏi mở)

1. Có nên tạo migration script để update data cũ trong DB không?
   - Answer: Không cần, handle on-the-fly khi load config
2. Có nên giữ backward compatibility với heading/subHeading không?
   - Answer: Có, extractSectionHeaderConfig sẽ map cả 2 naming conventions
