# Spec: Refactor 18 Home Components - Hoàn thiện 100%

## 🎯 Mục tiêu
Refactor **18 components còn lại** từ `HomeComponentLegacyEditor.tsx` (2757 dòng) và `previews.tsx` thành module feature-based theo pattern Hero đã validate, đạt **100% codebase tuân thủ chuẩn**.

## 📊 Hiện trạng
- ✅ **11 components đã refactor**: hero, stats, blog, partners, gallery, product-list, product-grid, service-list, product-categories, category-products, case-study
- ⚠️ **18 components cần refactor**: about, benefits, career, clients, contact, countdown, cta, faq, features, footer, pricing, process, services, speed-dial, team, testimonials, video, voucher-promotions
- 📦 **Legacy code**: `HomeComponentLegacyEditor.tsx` (2757 dòng), `previews.tsx` chứa 18 preview exports

## 🗂️ Danh sách 18 Components cần Refactor

| # | Component | Preview Export | Styles | Priority | Complexity |
|---|-----------|----------------|--------|----------|------------|
| 1 | **faq** | `FaqPreview` | accordion, twoColumn, grid | HIGH | Low |
| 2 | **testimonials** | `TestimonialsPreview` | cards, carousel, grid, masonry | HIGH | Medium |
| 3 | **pricing** | `PricingPreview` | cards, toggle, comparison | HIGH | High |
| 4 | **footer** | `FooterPreview` | classic, minimal, modern | HIGH | High |
| 5 | **cta** | `CTAPreview` | banner, centered, gradient | HIGH | Low |
| 6 | **services** | `ServicesPreview` | elegantGrid, tabbed, timeline | MEDIUM | Medium |
| 7 | **about** | `AboutPreview` | bento, imageLeft, imageRight | MEDIUM | Medium |
| 8 | **benefits** | `BenefitsPreview` | cards, grid, iconList | MEDIUM | Low |
| 9 | **contact** | `ContactPreview` | modern, split, centered | MEDIUM | High |
| 10 | **features** | `FeaturesPreview` | iconGrid, bento, showcase | LOW | Low |
| 11 | **process** | `ProcessPreview` | horizontal, vertical, timeline | LOW | Low |
| 12 | **team** | `TeamPreview` | grid, carousel, bento | LOW | Medium |
| 13 | **career** | `CareerPreview` | cards, list, featured | LOW | Medium |
| 14 | **video** | `VideoPreview` | centered, background, modal | LOW | Low |
| 15 | **countdown** | `CountdownPreview` | banner, fullscreen, minimal | LOW | Low |
| 16 | **speed-dial** | `SpeedDialPreview` | fab, sidebar, toolbar | LOW | Low |
| 17 | **clients** | `ClientsPreview` | marquee, grid | LOW | Low |
| 18 | **voucher-promotions** | `VoucherPromotionsPreview` | cards, carousel, grid | LOW | Low |

## 📐 Pattern Refactor (Theo Hero)

Mỗi component sẽ được refactor theo cấu trúc:

```
app/admin/home-components/[component]/
├── [id]/edit/page.tsx          # Edit route mới với Convex integration
├── _types/index.ts              # Types: Style union, Content interface, Item interface
├── _lib/constants.ts            # Constants: default values, style configs
└── _components/
    ├── [Component]Preview.tsx   # Preview với multi-device support
    └── [Component]Form.tsx      # Form với conditional rendering
```

## 🔧 Chi tiết từng Component

### 1. FAQ Component
**Files cần tạo:**
- `faq/_types/index.ts` → `FaqStyle`, `FaqItem`, `FaqContent`
- `faq/_lib/constants.ts` → `DEFAULT_FAQ_ITEMS`, `FAQ_STYLES`
- `faq/_components/FaqPreview.tsx` → Render 3 styles (accordion, twoColumn, grid)
- `faq/_components/FaqForm.tsx` → Items array editor + style selector
- `faq/[id]/edit/page.tsx` → Convex CRUD + layout

**Data migration:**
- Extract từ `previews.tsx` (line 137+)
- Extract từ `HomeComponentLegacyEditor.tsx` state: `faqItems`, `faqStyle`, `faqConfig`

**Cleanup:**
- Xóa `FaqPreview` từ `previews.tsx`
- Xóa FAQ logic từ `HomeComponentLegacyEditor.tsx`

---

### 2. Testimonials Component
**Files cần tạo:**
- `testimonials/_types/index.ts` → `TestimonialsStyle`, `TestimonialItem`
- `testimonials/_lib/constants.ts` → `DEFAULT_TESTIMONIALS`
- `testimonials/_components/TestimonialsPreview.tsx` → 4 styles (cards, carousel, grid, masonry)
- `testimonials/_components/TestimonialsForm.tsx` → Drag-drop items + avatar upload
- `testimonials/[id]/edit/page.tsx`

**Data migration:**
- Extract từ `previews.tsx` (line 488+)
- State: `testimonialsItems`, `testimonialsStyle`, drag handlers

**Cleanup:**
- Xóa `TestimonialsPreview` + drag logic

---

### 3. Pricing Component
**Files cần tạo:**
- `pricing/_types/index.ts` → `PricingStyle`, `PricingPlan`, `PricingConfig`
- `pricing/_lib/constants.ts` → `DEFAULT_PRICING_PLAN`
- `pricing/_components/PricingPreview.tsx` → 3 styles + billing toggle
- `pricing/_components/PricingForm.tsx` → Plans array + features editor
- `pricing/[id]/edit/page.tsx`

**Data migration:**
- Extract từ `previews.tsx` (line 813+)
- State: `pricingPlans`, `pricingStyle`, `pricingConfig`, drag logic

**Complexity:** High (billing toggle, features array, drag-drop)

**Cleanup:**
- Xóa `PricingPreview` + complex state

---

### 4. Footer Component
**Files cần tạo:**
- `footer/_types/index.ts` → `FooterStyle`, `FooterConfig`, `FooterColumn`
- `footer/_lib/constants.ts` → `DEFAULT_FOOTER_CONFIG`
- `footer/_components/FooterPreview.tsx` → 3 styles + social links
- `footer/_components/FooterForm.tsx` → Columns editor + settings integration
- `footer/[id]/edit/page.tsx`

**Data migration:**
- Extract từ `previews.tsx` (line 1695+)
- State: `footerConfig`, `footerStyle`
- **Đặc biệt:** Integration với `settings` table (social links, logo)

**Complexity:** High (settings integration, columns array, social links)

**Cleanup:**
- Xóa `FooterPreview` + settings queries

---

### 5. CTA Component
**Files cần tạo:**
- `cta/_types/index.ts` → `CTAStyle`, `CTAContent`
- `cta/_lib/constants.ts` → `DEFAULT_CTA_CONFIG`
- `cta/_components/CTAPreview.tsx` → 3 styles (banner, centered, gradient)
- `cta/_components/CTAForm.tsx` → Text + buttons config
- `cta/[id]/edit/page.tsx`

**Data migration:**
- Extract từ `previews.tsx` (line 2228+)
- State: `ctaConfig`, `ctaStyle`

**Cleanup:**
- Xóa `CTAPreview`

---

### 6-18. Remaining Components (Similar Pattern)

Tương tự cho 13 components còn lại:
- **services** (line 1329+) → elegantGrid, tabbed, timeline
- **about** (line 2608+) → bento, imageLeft, imageRight + stats array
- **benefits** (line 3112+) → cards, grid, iconList
- **contact** (line 3973+) → modern, split, centered + form fields + map
- **features** (line 5302+) → iconGrid, bento, showcase
- **process** (line 5542+) → horizontal, vertical, timeline
- **team** (line 4565+) → grid, carousel, bento + social links
- **career** (line 3430+) → cards, list, featured
- **video** (line 6361+) → centered, background, modal
- **countdown** (line 6895+) → banner, fullscreen, minimal + date picker
- **speed-dial** (line 4349+) → fab, sidebar, toolbar + position
- **clients** (line 5968+) → marquee, grid
- **voucher-promotions** (line 7482+) → cards, carousel, grid + voucher limit

## 🔄 Workflow cho mỗi Component

### Bước 1: Tạo Module Structure
```bash
mkdir -p app/admin/home-components/[component]/{_types,_lib,_components,[id]/edit}
```

### Bước 2: Extract Types
Từ `previews.tsx` và `HomeComponentLegacyEditor.tsx`:
- Identify style union type
- Identify content/item interfaces
- Create `_types/index.ts`

### Bước 3: Extract Constants
- Default values
- Style configurations
- Create `_lib/constants.ts`

### Bước 4: Extract Preview
Copy preview code từ `previews.tsx` → `_components/[Component]Preview.tsx`:
- Import shared components: `PreviewWrapper`, `BrowserFrame`, `usePreviewDevice`
- Apply dual brand colors (primary + secondary)
- Preserve all styles rendering logic

### Bước 5: Create Form
Tạo `_components/[Component]Form.tsx`:
- Dùng shadcn/ui components
- Conditional rendering based on style
- Field validation

### Bước 6: Create Edit Route
Tạo `[id]/edit/page.tsx`:
- Convex `useQuery(api.homeComponents.getById)`
- Convex `useMutation(api.homeComponents.update)`
- Layout: Form trái | Preview phải (sticky)
- State management
- Submit handler

### Bước 7: Add Redirect
Trong `app/admin/home-components/[id]/edit/page.tsx`, thêm:
```tsx
if (component.type === '[ComponentType]') {
  router.replace(`/admin/home-components/[component]/${component._id}/edit`);
  return;
}
```

### Bước 8: Cleanup Code Cũ
**Ngay sau khi refactor xong mỗi component:**
- Xóa preview code từ `previews.tsx`
- Xóa state/logic từ `HomeComponentLegacyEditor.tsx`
- Xóa import không dùng
- Verify TypeScript errors = 0

### Bước 9: Verify
- Route mới `/admin/home-components/[component]/[id]/edit` hoạt động
- Form load data đúng từ Convex
- Save vào Convex thành công
- Preview hiển thị tất cả styles
- Device toggle hoạt động
- Redirect từ route cũ hoạt động

## 🎯 Thứ tự Thực thi (Priority-based)

### Phase 1: High Priority (5 components)
1. **faq** → Low complexity, high usage
2. **cta** → Low complexity, marketing critical
3. **testimonials** → Medium complexity, social proof
4. **footer** → High complexity, layout fundamental
5. **pricing** → High complexity, conversion critical

### Phase 2: Medium Priority (4 components)
6. **services** → Medium complexity
7. **about** → Medium complexity
8. **benefits** → Low complexity
9. **contact** → High complexity (form + map)

### Phase 3: Low Priority (9 components)
10. **features** → Low complexity
11. **process** → Low complexity
12. **team** → Medium complexity
13. **career** → Medium complexity
14. **video** → Low complexity
15. **countdown** → Low complexity
16. **speed-dial** → Low complexity
17. **clients** → Low complexity
18. **voucher-promotions** → Low complexity

## 🧪 Testing Checklist (Cung cấp cho User)

Cho mỗi component sau khi refactor:
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
- [ ] `bunx oxlint --type-aware --type-check --fix` pass

## ✅ Kết quả Mong đợi

Sau khi hoàn thành:
- ✅ **29/29 components** tuân thủ pattern Hero (100%)
- ✅ `HomeComponentLegacyEditor.tsx` → **XÓA HOÀN TOÀN** (hoặc chỉ còn <100 dòng redirect logic)
- ✅ `previews.tsx` → **XÓA HOÀN TOÀN** (hoặc chỉ còn shared utilities)
- ✅ Mỗi component là module độc lập, dễ maintain
- ✅ Codebase đồng nhất, tuân thủ KISS/DRY/CoC
- ✅ Dual brand colors 100% coverage
- ✅ TypeScript strict mode, 0 errors

## 📝 Commit Convention

Sau khi refactor xong mỗi component:
```bash
bunx oxlint --type-aware --type-check --fix
git add .
git commit -m "refactor(home-components): migrate [component] to feature-based module

- Extract [Component]Preview from previews.tsx
- Create [component]/_types, _lib, _components
- Add [component]/[id]/edit route
- Cleanup legacy code from HomeComponentLegacyEditor
- Apply dual brand colors
- Add redirect from legacy route"
```

## 🚀 Ước tính

- **Thời gian:** ~4-6 giờ (18 components × 15-20 phút/component)
- **Files tạo mới:** ~90 files (18 components × 5 files)
- **Files cleanup:** 2 files (HomeComponentLegacyEditor.tsx, previews.tsx)
- **Code giảm:** ~10,000+ dòng monolithic → modules có cấu trúc

## ⚠️ Lưu ý

1. **Không thay đổi behaviour:** Chỉ refactor structure, không thêm/bớt tính năng
2. **Cleanup ngay:** Xóa code cũ ngay sau mỗi component để tránh conflict
3. **Tuân thủ pattern Hero:** Reference `app/admin/home-components/hero` khi không chắc
4. **Dual brand colors:** Luôn dùng `useBrandColors()` hook
5. **TypeScript strict:** Không dùng `any`, phải có types đầy đủ
6. **Shared components:** Tái sử dụng `_shared/components/` và `_shared/hooks/`

## 📚 Reference

- **Pattern:** `app/admin/home-components/hero/`
- **Skill:** `.factory/skills/refactor-home-component/SKILL.md`
- **Docs gần nhất:** `.factory/docs/2026-02-15-nh-gi-to-n-b-home-components-theo-chu-n-refactor-home-component.md`