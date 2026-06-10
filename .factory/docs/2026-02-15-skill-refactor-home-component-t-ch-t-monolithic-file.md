# Spec: Tạo Skill "refactor-home-component"

## 🎯 Mục tiêu
Tạo skill tự động hóa việc tách home component từ file monolithic (`edit/page.tsx` + `previews.tsx`) thành feature-based module riêng biệt, theo đúng pattern đã thực hiện thành công với Hero component.

## 📋 Thông tin Skill

### Frontmatter
```yaml
---
name: refactor-home-component
description: Tách home component từ file monolithic thành feature-based module với _types, _lib, _components, route riêng. Sử dụng khi cần refactor home component (Stats, ProductList, Blog, CTA, FAQ, etc.) theo pattern Hero đã thực hiện. Use when user says "tách component", "refactor home component", "modularize", "split component".
---
```

### Location
**Project Skill**: `.factory/skills/refactor-home-component/SKILL.md`  
(Team-wide workflow cho dự án VietAdmin)

## 📁 Cấu trúc Skill

```
.factory/skills/refactor-home-component/
├── SKILL.md              # Main skill
├── reference.md          # Chi tiết Hero pattern đã implement
└── checklist.md          # Testing checklist
```

## 📝 Nội dung SKILL.md

### Sections chính:

1. **Quick Start**
   - Input cần thiết: Component type (ví dụ: "stats", "product-list")
   - Output: Toàn bộ module với structure chuẩn

2. **Instructions (Step-by-step)**
   
   **Bước 1: Khảo sát component hiện tại**
   - Grep tìm component type trong `edit/page.tsx` và `previews.tsx`
   - Extract types, constants, preview code, form logic
   - Xác định dependencies (shared components, types, utilities)

   **Bước 2: Tạo folder structure**
   ```
   app/admin/home-components/[component-name]/
   ├── [id]/edit/page.tsx
   ├── _types/index.ts
   ├── _lib/constants.ts
   ├── _components/
   │   ├── [Component]Preview.tsx
   │   └── [Component]Form.tsx
   ```

   **Bước 3: Extract types**
   - Tạo `_types/index.ts` với interfaces và type unions
   - Export types cần thiết cho Preview và Form

   **Bước 4: Extract constants**
   - Tạo `_lib/constants.ts` với default values, style configs
   - Export constants array cho style selector

   **Bước 5: Extract Preview component**
   - Tạo `_components/[Component]Preview.tsx`
   - Import shared components từ `_shared/`
   - Implement multi-device preview với BrowserFrame
   - Apply dual brand colors (primary + secondary)

   **Bước 6: Extract Form component**
   - Tạo `_components/[Component]Form.tsx`
   - Implement form fields với shadcn/ui components
   - Conditional rendering based on style selection

   **Bước 7: Tạo Edit Page (Route mới)**
   - Tạo `[id]/edit/page.tsx` với:
     - Convex integration (useQuery + useMutation)
     - Form state management
     - Save/Submit logic
     - Left-right layout (Form | Preview)
     - Sticky preview sidebar

   **Bước 8: Update route cũ**
   - Thêm redirect logic trong `[id]/edit/page.tsx` cũ
   - Redirect component type sang route mới

   **Bước 9: Cleanup**
   - Xóa code cũ từ `edit/page.tsx`
   - Xóa preview code từ `previews.tsx`
   - Update imports

   **Bước 10: Testing**
   - Kiểm tra route mới hoạt động
   - Verify form save vào Convex
   - Test preview responsive (desktop/tablet/mobile)
   - Verify dual brand colors
   - Test redirect từ route cũ

3. **Best Practices**
   - Luôn dùng shared components (`_shared/components/`, `_shared/hooks/`)
   - Apply dual brand colors theo skill `dual-brand-color-system`
   - Preserve conditional logic (style-based rendering)
   - Maintain type safety với TypeScript strict mode
   - Follow naming convention: `[Component]Preview`, `[Component]Form`, `[Component]Style`

4. **Requirements**
   - Hero component đã được refactor thành công (reference pattern)
   - Shared components đã tồn tại (`PreviewWrapper`, `PreviewImage`, `BrowserFrame`, `usePreviewDevice`)
   - Convex queries/mutations cho homeComponents table

5. **Reference Pattern**
   - Xem `reference.md` cho chi tiết Hero implementation
   - Xem commit `bb45763` để hiểu migration path

6. **Testing Checklist**
   - Link đến `checklist.md`

## 📚 reference.md - Nội dung

Chi tiết Hero pattern đã implement:
- File structure thực tế
- Code snippets từ Hero components
- Convex schema mapping
- Dual brand color integration
- Device preview implementation

## ✅ checklist.md - Nội dung

Testing checklist template:
```markdown
## Testing Checklist for [Component] Refactor

- [ ] Route `/admin/home-components/[component]/[id]/edit` hoạt động
- [ ] Form khởi tạo đúng data từ Convex
- [ ] Form lưu config đúng vào Convex
- [ ] Preview hiển thị tất cả styles
- [ ] Device toggle (desktop/tablet/mobile) hoạt động
- [ ] Upload media (nếu có) hoạt động
- [ ] Conditional rendering based on style
- [ ] Dual brand colors áp dụng đúng
- [ ] Redirect từ route cũ sang route mới
- [ ] Code cũ đã được xóa sạch
- [ ] No TypeScript errors
- [ ] No console errors
```

## 🎯 Expected Output

Khi user nói "tách Stats component", skill sẽ:

1. **Analyze**: Grep và phân tích Stats code trong files hiện tại
2. **Plan**: Show structure sẽ tạo
3. **Execute**: Tạo toàn bộ files theo step-by-step
4. **Cleanup**: Xóa code cũ
5. **Test**: Chạy testing checklist
6. **Commit**: Commit với message chuẩn

## ✅ Validation

- [ ] Skill name: `refactor-home-component` (lowercase, hyphen)
- [ ] Description \< 1024 chars, bao gồm triggers
- [ ] YAML frontmatter valid
- [ ] Instructions step-by-step, actionable
- [ ] Reference Hero pattern có sẵn
- [ ] Testing checklist đầy đủ
- [ ] Skill activates khi user nói "tách component", "refactor", "split"

---

**Kết quả cuối cùng**: Skill hoàn chỉnh giúp team refactor 30 components còn lại theo đúng pattern Hero đã validate.