# 🎯 SPEC: Full Refactor Dual Brand Color System - 23 Components Còn Lại

## Executive Summary

**Mục tiêu**: Hoàn thiện 100% việc áp dụng **dual brand color system** theo **60-30-10 rule** cho 23 home components còn lại trong VietAdmin.

**Chiến lược**: Full refactor trong 1 commit lớn, replace tất cả inline components bằng shared helpers, validate chỉ TypeScript compile.

**Files ảnh hưởng**:
- `components/site/ComponentRenderer.tsx` (~9644 lines)
- `app/admin/home-components/previews.tsx` (~13991 lines)

**Estimate**: ~4-6 hours work (23 components × 6 layouts × ~2 mins/layout)

---

## 📊 60-30-10 Golden Rule Recap

| Tỷ lệ | Màu | Dùng cho | Example |
|-------|-----|----------|---------|
| **60%** | Neutral | Backgrounds, surfaces | `bg-white`, `bg-slate-50` |
| **30%** | **Primary** (`brandColor`) | Headings, CTAs, borders, icons, main sections | `brandColor`, `${brandColor}10/90` |
| **10%** | **Secondary** | Badges, accents, stats, highlights, decorative | `secondary`, `${secondary}10/15/20/30/90` |

**Nguyên tắc áp dụng**:
- Badge/Tag → **secondary** (10% accent)
- Icon container → **primary** (30% visual weight)
- Stats values → **secondary** (10% accent để nổi bật)
- Headings → neutral (slate-900) + border/underline dùng **secondary**
- Buttons/CTA → **primary** background hoặc **secondary** border
- Accent lines/dots → **secondary** (10% decorative)

---

## 🛠️ Implementation Plan - Step by Step

### BATCH 1: HIGH PRIORITY COMPONENTS (6 components, 36 layouts)

#### **Component 4: Services** (6 layouts)
**Line**: 1189-1544 trong ComponentRenderer.tsx  
**Preview**: Line ~6XXX trong previews.tsx

**Patterns cần fix**:
1. **elegantGrid**: Top accent line gradient → Replace `linear-gradient(to right, ${brandColor}, ${secondary})` với primary+secondary gradient
2. **modernList**: Number labels → Đang dùng `secondary` ✅ (correct)
3. **iconCards**: Icon background → Đang dùng `brandColor` ✅ (30% primary)
4. **carousel**: Badge "Dịch vụ nổi bật" → Extract thành `<BrandBadge variant="solid" secondary={secondary} />`
5. **minimal**: Check icons → Replace với `<CheckIcon secondary={secondary} variant="circle" />`
6. **splitFeature**: Empty state icon → Đúng `secondary` ✅

**Actions**:
- Import `{ BrandBadge, CheckIcon }` từ shared
- Replace inline badge trong carousel style
- Replace check icons trong minimal style
- Verify gradient syntax trong elegantGrid (ensure primary+secondary)

---

#### **Component 5: Benefits** (6 layouts)
**Line**: 1544-1845 trong ComponentRenderer.tsx

**Patterns cần fix**:
1. **cards**: Icon container → Đang `backgroundColor: brandColor` ✅, title dùng `secondary` ✅
2. **list**: Border accent → `backgroundColor: brandColor` (left border) ✅
3. **bento**: Inline badge → Extract `renderBenefitsHeader()` badge thành `<BrandBadge text={subHeading} variant="minimal" secondary={secondary} />`
4. **grid**: Icon containers → Verify dùng `brandColor` (30%)
5. **carousel**: Gradient background → Check gradient primary+secondary
6. **timeline**: Dots → Replace `<div style={{backgroundColor: brandColor}}/>` với `<PulseDot brandColor={brandColor} />`

**Actions**:
- Import `{ BrandBadge, PulseDot }` từ shared
- Replace inline badge trong renderBenefitsHeader()
- Replace dots trong timeline với PulseDot
- Verify all icon containers dùng brandColor (30%)

---

#### **Component 7: CTA** (6 layouts)
**Line**: 2136-2418 trong ComponentRenderer.tsx

**Patterns cần fix**:
1. **solid**: Button background → Đang `backgroundColor: brandColor` ✅
2. **outline**: Button border → `borderColor: brandColor, color: brandColor` ✅
3. **gradient**: Background gradient → Verify `linear-gradient(135deg, ${brandColor}, ${secondary})`
4. **minimal**: Accent line → Extract thành `<AccentLine secondary={secondary} thickness="thick" />`
5. **split**: Icon container → Verify `brandColor` (30%)
6. **floatingCard**: Badge "Hot" → Replace với `<BrandBadge text="🔥 Hot Deal" variant="solid" secondary={secondary} />`

**Actions**:
- Import `{ BrandBadge, AccentLine, IconContainer }` từ shared
- Replace inline accent line trong minimal
- Replace badge trong floatingCard
- Verify gradient syntax

---

#### **Component 9: Contact** (6 layouts)
**Line**: 2743-3318 trong ComponentRenderer.tsx

**Patterns cần fix**:
1. **form**: Submit button → Verify `brandColor` (30%)
2. **split**: Icon containers → Extract thành `<IconContainer icon={<Phone/>} brandColor={brandColor} variant="solid" />`
3. **minimal**: Border accent → `borderColor: secondary` (10% accent)
4. **cards**: Social icons → Verify `brandColor`
5. **inline**: Focus ring → `focus:ring-${brandColor}` → Inline style `focusRing: brandColor`
6. **fullWidth**: Background overlay → Verify gradient

**Actions**:
- Import `{ IconContainer }` từ shared
- Replace icon containers trong split/cards styles
- Verify focus states dùng brandColor
- Verify all submit buttons dùng brandColor

---

#### **Component 12: Pricing** (6 layouts)
**Line**: 4343-4705 trong ComponentRenderer.tsx

**Patterns cần fix**:
1. **cards**: Badge "Phổ biến nhất" → Replace với `<BrandBadge text="Phổ biến nhất" variant="solid" secondary={secondary} />`
2. **minimal**: Border highlight → `borderColor: brandColor` (30%)
3. **comparison**: Check icons → Replace với `<CheckIcon secondary={secondary} variant="circle" />`
4. **toggle**: Active toggle → `backgroundColor: brandColor` ✅
5. **slider**: Price highlight → `color: secondary` (10% accent)
6. **table**: Feature check → Replace với CheckIcon

**Actions**:
- Import `{ BrandBadge, CheckIcon }` từ shared
- Replace badge trong popular plans
- Replace all check icons với shared CheckIcon
- Verify price values dùng secondary (10% accent)

---

#### **Component 19: ProductCategories** (6 layouts)
**Line**: 5590-6117 trong ComponentRenderer.tsx

**Patterns cần fix**:
1. **grid**: Category badge → Replace với `<BrandBadge variant="outline" secondary={secondary} />`
2. **carousel**: Accent gradient → Verify primary+secondary
3. **minimal**: Border accent → `borderColor: secondary`
4. **bento**: Icon containers → Verify brandColor (30%)
5. **list**: Number labels → `color: secondary` ✅
6. **featured**: Badge "New" → Replace với BrandBadge

**Actions**:
- Import `{ BrandBadge, IconContainer }` từ shared
- Replace category badges
- Verify icon containers

---

### BATCH 2: MEDIUM PRIORITY COMPONENTS (9 components, 54 layouts)

#### **Component 6: FAQ** (6 layouts)
**Line**: 1845-2136

**Patterns**:
- Accordion icons → Verify brandColor
- Active border → `borderColor: secondary` (10% accent)
- Question numbers → `color: secondary`

**Actions**:
- Import `{ AccentLine }` if needed
- Verify accordion expand icons dùng brandColor
- Verify active states dùng secondary

---

#### **Component 8: Testimonials** (6 layouts)
**Line**: 2418-2743

**Patterns**:
- Star icons → `color: secondary` (10% accent vàng highlight)
- Quote icons → `color: brandColor` (30%)
- Avatar borders → Verify brandColor

**Actions**:
- Import `{ IconContainer }` for quote backgrounds
- Verify star ratings dùng secondary
- Verify avatar borders

---

#### **Component 11: TrustBadges** (6 layouts)
**Line**: 3318-3694

**Patterns**:
- Badge containers → `backgroundColor: ${secondary}10` (10% tint)
- Icon backgrounds → `brandColor` (30%)
- Border accents → `secondary`

**Actions**:
- Import `{ IconContainer, BrandBadge }` từ shared
- Replace badge containers
- Verify icons

---

#### **Component 13: ProductList** (6 layouts)
**Preview only**: ~Line 7XXX trong previews.tsx

**Patterns**:
- "Sale" badges → Replace với `<BrandBadge variant="solid" secondary={secondary} />`
- Price highlight → `color: secondary`
- Add to cart button → `backgroundColor: brandColor`

**Actions**:
- Import shared components vào previews.tsx
- Replace sale badges
- Verify button colors

---

#### **Component 14: ServiceList** (6 layouts)
**Preview only**

**Patterns**:
- Similar to ProductList
- Service icons → `brandColor` (30%)
- "Featured" badges → secondary

**Actions**:
- Same as ProductList
- Import và replace

---

#### **Component 22: Features** (6 layouts)
**Line**: 7514-7793

**Patterns**:
- Feature icons → `brandColor` (30%)
- Check marks → `secondary` (10% accent)
- Accent lines → `secondary`

**Actions**:
- Import `{ IconContainer, CheckIcon, AccentLine }`
- Replace all inline icons/checks
- Verify colors

---

#### **Component 27: VoucherPromotions** (6 layouts)
**Line**: 8997-9346

**Patterns**:
- Discount badges → Replace với `<BrandBadge variant="solid" secondary={secondary} />`
- Coupon code borders → `borderColor: brandColor` (30%)
- "Sắp hết hạn" labels → `color: secondary`

**Actions**:
- Import `{ BrandBadge }` từ shared
- Replace discount badges
- Verify urgency labels dùng secondary

---

#### **Component 28: Footer** (6 layouts)
**Line**: 9346-9633

**Patterns**:
- Social icons → `brandColor` hover (30%)
- Newsletter button → `backgroundColor: brandColor`
- Link hover → `color: secondary`

**Actions**:
- Verify hover states
- Verify newsletter CTA button

---

#### **Component 20: CategoryProducts** (6 layouts)
**Line**: 6117-6894

**Patterns**:
- Similar to ProductList
- Category tabs → Active tab `borderColor: brandColor`
- Product badges → secondary

**Actions**:
- Import shared components
- Replace badges
- Verify tab states

---

### BATCH 3: LOW PRIORITY COMPONENTS (8 components, 48 layouts)

#### **Component 10: Gallery** (6 layouts)
**Line**: 3694-4343

**Patterns**:
- Overlay gradient → Verify primary+secondary
- View icon → `brandColor`
- Caption badges → secondary

**Actions**:
- Verify gradients
- Import IconContainer if needed

---

#### **Component 15: Blog** (6 layouts)
**Preview only**

**Patterns**:
- Category tags → Replace với `<BrandBadge variant="outline" secondary={secondary} />`
- Read time icons → brandColor
- "Featured" badges → secondary

**Actions**:
- Import shared components vào previews
- Replace category tags

---

#### **Component 16: Career** (6 layouts)
**Line**: 4705-5072

**Patterns**:
- Job type badges → Replace với BrandBadge
- Apply button → `backgroundColor: brandColor`
- Department tags → secondary

**Actions**:
- Import `{ BrandBadge }` từ shared
- Replace badges

---

#### **Component 17: CaseStudy** (6 layouts)
**Line**: 5072-5474

**Patterns**:
- Industry tags → Replace với BrandBadge
- Stats values → `color: secondary` (10% accent)
- Result highlights → secondary

**Actions**:
- Import `{ BrandBadge, StatBox }` từ shared
- Replace tags và stats

---

#### **Component 18: SpeedDial** (6 layouts)
**Line**: 5474-5590

**Patterns**:
- FAB button → `backgroundColor: brandColor`
- Tooltip backgrounds → `secondary`
- Pulse ring → `borderColor: brandColor`

**Actions**:
- Import `{ PulseDot }` từ shared
- Replace pulse animation

---

#### **Component 21: Team** (6 layouts)
**Line**: 6894-7514

**Patterns**:
- Role badges → Replace với BrandBadge
- Social icons → hover `color: brandColor`
- Border accents → secondary

**Actions**:
- Import `{ BrandBadge }` từ shared
- Replace role badges

---

#### **Component 23: Process** (6 layouts)
**Line**: 7793-8057

**Patterns**:
- Step numbers → `backgroundColor: brandColor` (30%)
- Timeline connectors → `borderColor: secondary`
- Active step highlight → secondary

**Actions**:
- Verify step number containers
- Verify timeline connectors

---

#### **Component 24: Clients** (6 layouts)
**Line**: 8057-8346

**Patterns**:
- Logo hover borders → `borderColor: brandColor`
- "Trusted by" badge → Replace với BrandBadge
- Logo filters → Verify grayscale/color states

**Actions**:
- Import `{ BrandBadge }` từ shared
- Replace badge

---

#### **Component 25: Video** (6 layouts)
**Line**: 8346-8608

**Patterns**:
- Play button → `backgroundColor: brandColor` (30%)
- Play button ring → `borderColor: ${brandColor}30`
- Duration badge → `backgroundColor: ${secondary}90`

**Actions**:
- Verify play button colors
- Verify duration badge

---

#### **Component 26: Countdown** (6 layouts)
**Line**: 8608-8997

**Patterns**:
- Digit backgrounds → `backgroundColor: ${brandColor}10`
- Separator dots → `color: secondary`
- Label text → neutral

**Actions**:
- Verify digit containers
- Verify separator colors

---

## 🔄 Execution Steps (Chi tiết từng bước)

### Step 1: Import Shared Components vào ComponentRenderer.tsx
**File**: `components/site/ComponentRenderer.tsx`  
**Line**: ~10 (sau existing imports)

```tsx
import { BrandBadge, StatBox, IconContainer, CheckIcon, AccentLine, PulseDot } from './shared/BrandColorHelpers';
```

---

### Step 2: Import Shared Components vào previews.tsx
**File**: `app/admin/home-components/previews.tsx`  
**Line**: ~6 (sau existing imports)

```tsx
import { BrandBadge, StatBox, IconContainer, CheckIcon, AccentLine, PulseDot } from '@/components/site/shared/BrandColorHelpers';
```

---

### Step 3: Refactor Components theo Batch Order (High → Medium → Low)

**Cho mỗi component**:

1. **Read** component section trong ComponentRenderer.tsx
2. **Identify** patterns:
   - Inline badges → Replace với `<BrandBadge />`
   - Inline stat boxes → Replace với `<StatBox />`
   - Inline icon containers → Replace với `<IconContainer />`
   - Check icons → Replace với `<CheckIcon />`
   - Accent lines → Replace với `<AccentLine />`
   - Pulse dots → Replace với `<PulseDot />`
   - Hard-coded colors → Replace với `brandColor` hoặc `secondary` theo 60-30-10 rule
3. **ApplyPatch** để replace
4. **Repeat** cho previews.tsx nếu có preview code riêng
5. **Validate** bằng `bunx oxlint --type-check` sau mỗi component

---

### Step 4: Final Validation

**Sau khi refactor hết 23 components**:

1. **TypeScript compile check**:
   ```bash
   bunx oxlint --type-aware --type-check --fix
   ```
   Expected: `Found 0 warnings and 0 errors.`

2. **Manual grep check** (verify không còn hard-coded colors):
   ```bash
   # Check trong ComponentRenderer.tsx
   grep -n "backgroundColor: ['\"]#" components/site/ComponentRenderer.tsx
   grep -n "color: ['\"]#" components/site/ComponentRenderer.tsx
   
   # Expected: zero results
   ```

3. **Verify shared components usage**:
   ```bash
   grep -c "BrandBadge" components/site/ComponentRenderer.tsx
   grep -c "StatBox" components/site/ComponentRenderer.tsx
   grep -c "IconContainer" components/site/ComponentRenderer.tsx
   ```

---

### Step 5: Commit Changes

**Command**:
```bash
git add -A
git status
git commit -m "feat(home-components): apply dual brand color system to 23 components (138 layouts)

- Refactor Services, Benefits, FAQ, CTA, Testimonials, Contact, Gallery, Pricing, ProductList, ServiceList, Career, CaseStudy, SpeedDial, ProductCategories, CategoryProducts, Team, Features, Process, Clients, Video, Countdown, VoucherPromotions, Footer
- Replace all inline badge/stat/icon components with shared BrandColorHelpers
- Apply 60-30-10 color rule: primary (30% icons/CTA), secondary (10% accents/badges)
- Fix gradients to use primary+secondary combination
- Replace check icons, accent lines, pulse dots with shared components
- Zero TypeScript errors after full refactor
- Total: 23 components × 6 layouts = 138 layouts standardized"
```

---

## ✅ Success Criteria

1. **Zero TypeScript errors** - `bunx oxlint --type-check` passes
2. **No hard-coded hex colors** - Tất cả màu dùng `brandColor` hoặc `secondary` variables
3. **Shared components usage** - Tất cả badge/stat/icon dùng từ `BrandColorHelpers.tsx`
4. **60-30-10 rule compliance** - Primary (30%), Secondary (10%), Neutral (60%)
5. **Code DRY** - Không còn duplicate badge/stat/icon code
6. **Single commit** - Tất cả changes trong 1 commit lớn như user yêu cầu

---

## 📈 Estimate Breakdown

| Batch | Components | Layouts | Estimate Time |
|-------|-----------|---------|---------------|
| Batch 1 (High) | 6 | 36 | 1.5-2 hours |
| Batch 2 (Medium) | 9 | 54 | 2-2.5 hours |
| Batch 3 (Low) | 8 | 48 | 1.5-2 hours |
| **Total** | **23** | **138** | **5-6.5 hours** |

**Per layout**: ~2-3 minutes (read + identify + patch + verify)

---

## 🚨 Risk Mitigation

1. **Backup trước khi refactor**: Current commit `8f4818c` đã có Phase 1+2, có thể rollback nếu cần
2. **TypeScript compile mỗi component**: Catch errors sớm
3. **Pattern đã proven**: Phase 1+2 (About component) đã test OK và zero errors
4. **Shared components đã ready**: BrandColorHelpers.tsx đã tạo và test với About

---

## 📝 Notes

- **Không validate visual**: User chọn "chỉ TypeScript compile", không cần mở browser check
- **Full refactor strategy**: Làm hết 23 components trong 1 session, 1 commit
- **Replace all inline**: User chọn "replace tất cả bằng shared components"
- **Priority order**: High → Medium → Low như user chọn

Spec này đủ chi tiết để implement ngay mà không cần hỏi thêm. Sẵn sàng execute khi approve! 🚀