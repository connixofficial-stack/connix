# 🎯 SPEC: Nâng cấp Skill Dual Brand Color System v4.0

## Executive Summary

**Mục tiêu**: Nâng cấp skill từ v3.0 (best practices) sang v4.0 (executable playbook) với focus vào **practical implementation workflow** dựa trên 10 commits thành công gần đây.

**Chiến lược**: Thêm 6 sections mới để transform từ "theoretical guide" → "step-by-step executable playbook" như các spec đã làm rất tốt.

**Inspiration**: 
- Commit `2a34bf6`: 52 lines changed, 26 insertions, 26 deletions - rebalance colors hoàn hảo
- Spec `2026-02-15-fix-dual-brand-colors-cho-6-productlist-layouts.md`: Chi tiết từng layout với Before/After table
- Spec `2026-02-14-full-refactor-dual-brand-color-system-23-components-138-layouts.md`: Batch strategy, line numbers, validation checklist

**Impact**: Skill sẽ có thể guide AI agent tạo spec chi tiết như các spec samples, thay vì chỉ giải thích concepts.

---

## 📊 Gap Analysis - So sánh Skill hiện tại vs Specs thực chiến

| Feature | Skill v3.0 | Specs thực chiến | v4.0 sẽ thêm |
|---------|-----------|------------------|--------------|
| **Spec Template** | ❌ Không có | ✅ Executive Summary + Before/After Table + Steps | ✅ Section mới |
| **Commit Message** | ❌ Không có | ✅ Convention: `fix(component): description` + multi-line body | ✅ Section mới |
| **Code Diff Examples** | ⚠️ Có nhưng generic | ✅ Before/After với line numbers cụ thể | ✅ Refactor |
| **Batch Strategy** | ❌ Không có | ✅ High/Medium/Low priority + estimate time | ✅ Section mới |
| **Validation Commands** | ⚠️ Có tools nhưng không có commands | ✅ `bunx oxlint --type-check`, `grep -n` patterns | ✅ Section mới |
| **Troubleshooting** | ⚠️ Common mistakes table | ✅ Root cause analysis, rollback procedures | ✅ Expand |
| **Line-by-line guidance** | ❌ Không có | ✅ "Line 3600-3680: renderMinimalStyle()" | ✅ Section mới |

**Kết luận**: Skill v3.0 giỏi về **concepts** nhưng thiếu **execution templates** mà specs đã proven work.

---

## 🛠️ Implementation Plan - 6 Sections mới

### **Section 1: Spec Writing Template** ⭐ (Thêm sau "When to Use")

**Mục đích**: Provide ready-to-use template để AI agent tạo spec chi tiết như `2026-02-15-fix-dual-brand-colors-cho-6-productlist-layouts.md`

**Nội dung**:

```markdown
## Spec Writing Template

### Template Structure (copy-paste ready)

\`\`\`markdown
# Spec: [Action] Dual-Brand Colors cho [Component/Feature]

## 📋 Tổng quan
[Mô tả ngắn gọn: refactor gì, bao nhiêu layouts, tuân thủ 60-30-10 rule]

**Files ảnh hưởng**:
- [file path] (line X-Y)
- [file path] (line A-B)

**Estimate**: ~X hours (Y layouts × Z mins/layout)

---

## 🎯 Mục tiêu
1. Tăng Primary visual weight từ ~X% lên **30%**
2. Giảm Secondary từ ~Y% xuống **10%**
3. [Mục tiêu cụ thể khác]

---

## 📊 Summary Table: Before vs After

| Element | Before | After | Rationale |
|---------|--------|-------|-----------|
| **Price** | Secondary ❌ | **Primary** ✅ | Commerce context - quan trọng nhất |
| **CTA Buttons** | Secondary ❌ | **Primary** ✅ | Action quan trọng |
| **Hover Border** | Secondary ✅ | Secondary ✅ | Subtle accent - giữ nguyên |

---

## 🛠️ Chi tiết thay đổi từng Layout

### **Layout 1: [Name]** (\`render[Name]Style\`)

#### **File**: \`[path]\`
#### **Lines**: [start-end]

#### **Changes**:

**1. [Element name]**:
\`\`\`typescript
// BEFORE:
<button style={{ color: secondary }}>CTA</button>

// AFTER (PRIMARY for CTA):
<button style={{ color: brandColor }}>CTA</button>
\`\`\`

**2. [Next element]**: ...

---

## ✅ Validation Checklist

Sau khi implement, verify:

- [ ] [Layout 1]: Price + CTA = primary, hover = secondary
- [ ] [Layout 2]: ...
- [ ] **Visual weight**: Primary ~30%, Secondary ~10%, Neutral 60%
- [ ] **TypeScript compile**: \`bunx oxlint --type-check\` passes

---

## 🔧 Implementation Steps

1. **Tìm và thay thế**: [pattern cụ thể]
   - Search: \`[regex]\`
   - Replace: \`[code]\`

2. **Fix [element]**: [hướng dẫn cụ thể]

3. **Verify visually**: Mở preview, check tất cả layouts
\`\`\`

### When to use this template?

- Khi cần refactor colors cho 1 component có nhiều layouts (3-10 layouts)
- Khi cần document changes chi tiết để review sau
- Khi có nhiều patterns lặp lại (badges, prices, CTAs)

### Example từ codebase:

Xem: \`.factory/docs/2026-02-15-fix-dual-brand-colors-cho-6-productlist-layouts.md\`
```

---

### **Section 2: Commit Message Standards** ⭐ (Sau Spec Template)

**Mục đích**: Standardize commit messages như `2a34bf6` và các commits khác

**Nội dung**:

```markdown
## Commit Message Standards

### Format: Conventional Commits

\`\`\`
<type>(<scope>): <subject>

[optional body - multi-line]

[optional stats]
\`\`\`

### Types

| Type | Khi nào dùng | Example |
|------|-------------|---------|
| **fix** | Sửa bugs, rebalance colors | \`fix(product-list): rebalance primary and secondary colors\` |
| **feat** | Thêm features mới | \`feat(home-components): add shared BrandColorHelpers\` |
| **refactor** | Refactor code không đổi behavior | \`refactor(stats): extract inline components to shared helpers\` |
| **docs** | Chỉ update docs/specs | \`docs(skills): upgrade dual brand color system v4.0\` |

### Scopes (cho dual-brand color work)

- Component name: \`product-list\`, \`stats\`, \`hero\`, \`product-categories\`
- Feature area: \`home-components\`, \`skills\`, \`admin\`

### Subject Guidelines

- ✅ Imperative mood: "rebalance colors" (không phải "rebalanced")
- ✅ Lowercase, không dấu chấm cuối
- ✅ Max 50 chars
- ✅ Mô tả "what changed", không "why" (why để body)

### Multi-line Body (optional)

Dùng khi:
- Refactor nhiều layouts (≥6)
- Cần list components đã fix
- Có stats (lines changed, layouts count)

Format:
\`\`\`
fix(product-list): rebalance primary and secondary colors

- Price: secondary → primary (commerce context)
- CTA buttons: secondary → primary (action importance)
- NEW badge: primary → secondary (alternate for variety)
- Navigation controls: secondary → primary (carousel)
- Apply 60-30-10 rule: Primary ~30%, Secondary ~10%

Changed: 6 layouts × ~8-10 changes/layout = 52 lines
\`\`\`

### Real Examples từ codebase

\`\`\`bash
# Example 1: Simple fix (1 component, focused change)
git commit -m "fix(product-list): rebalance primary and secondary colors"

# Example 2: Large refactor (multi-component)
git commit -m "feat(home-components): apply dual brand color system to 23 components (138 layouts)

- Refactor Services, Benefits, FAQ, CTA, Testimonials, Contact, Gallery, Pricing, ProductList, ServiceList, Career, CaseStudy, SpeedDial, ProductCategories, CategoryProducts, Team, Features, Process, Clients, Video, Countdown, VoucherPromotions, Footer
- Replace all inline badge/stat/icon components with shared BrandColorHelpers
- Apply 60-30-10 color rule: primary (30% icons/CTA), secondary (10% accents/badges)
- Fix gradients to use primary+secondary combination
- Total: 23 components × 6 layouts = 138 layouts standardized"
\`\`\`

### Checklist trước khi commit

- [ ] Subject ≤ 50 chars
- [ ] Type + scope đúng
- [ ] Imperative mood
- [ ] Body giải thích "what" nếu > 1 file changed
- [ ] Không có secrets/API keys trong diff (run \`git diff --cached\`)
```

---

### **Section 3: Code Refactoring Patterns** ⭐ (Sau Implementation Workflow)

**Mục đích**: Provide search/replace patterns cụ thể như trong specs

**Nội dung**:

```markdown
## Code Refactoring Patterns

### Pattern 1: Price color (Secondary → Primary)

**Context**: E-commerce components (ProductList, Services, Pricing)  
**Rationale**: Price là primary action trong commerce → dùng primary color (30% visual weight)

**Search (regex)**:
\`\`\`bash
# Tìm tất cả price elements dùng secondary
grep -n "price.*secondary" app/admin/home-components/previews.tsx
grep -n "style={{ color: secondary }}.*price" components/site/ComponentRenderer.tsx
\`\`\`

**Before**:
\`\`\`typescript
<span className="font-bold" style={{ color: secondary }}>{item.price}</span>
\`\`\`

**After**:
\`\`\`typescript
<span className="font-bold" style={{ color: brandColor }}>{item.price}</span>
\`\`\`

**Files thường gặp**:
- \`app/admin/home-components/previews.tsx\` (ProductList, ServiceList)
- \`components/site/ComponentRenderer.tsx\` (Pricing, ProductCategories)

---

### Pattern 2: CTA Buttons (Secondary → Primary)

**Context**: All components với action buttons  
**Rationale**: CTA = primary action → primary color (30%)

**Search**:
\`\`\`bash
grep -n "Xem chi tiết.*secondary" **/*.tsx
grep -n "button.*backgroundColor: secondary" **/*.tsx
\`\`\`

**Before**:
\`\`\`typescript
<button 
  style={{ borderColor: \`\${secondary}20\`, color: secondary }}
  onMouseEnter={(e) => { 
    e.currentTarget.style.borderColor = secondary; 
    e.currentTarget.style.backgroundColor = \`\${secondary}08\`; 
  }}
>
  Xem chi tiết
</button>
\`\`\`

**After**:
\`\`\`typescript
<button 
  style={{ borderColor: \`\${brandColor}20\`, color: brandColor }}
  onMouseEnter={(e) => { 
    e.currentTarget.style.borderColor = brandColor; 
    e.currentTarget.style.backgroundColor = \`\${brandColor}08\`; 
  }}
  onMouseLeave={(e) => { 
    e.currentTarget.style.borderColor = \`\${brandColor}20\`; 
    e.currentTarget.style.backgroundColor = 'transparent'; 
  }}
>
  Xem chi tiết
</button>
\`\`\`

**Note**: Phải update CẢ onMouseEnter VÀ onMouseLeave handlers!

---

### Pattern 3: Badges Alternating (Primary/Secondary mix)

**Context**: Components có nhiều badge types (NEW, HOT, SALE, discount)  
**Rationale**: Variety + 10% secondary rule

**Search**:
\`\`\`bash
grep -n "BrandBadge.*tag.*new" **/*.tsx
grep -n "BrandBadge.*tag.*hot" **/*.tsx
\`\`\`

**Before** (tất cả dùng primary):
\`\`\`typescript
{discount && <BrandBadge text={discount} variant="solid" brandColor={brandColor} />}
{item.tag === 'new' && <BrandBadge text="NEW" variant="outline" brandColor={brandColor} />}
{item.tag === 'hot' && <BrandBadge text="HOT" variant="solid" brandColor={brandColor} />}
\`\`\`

**After** (alternate colors):
\`\`\`typescript
{discount && <BrandBadge text={discount} variant="solid" brandColor={brandColor} secondary={secondary} />}
{item.tag === 'new' && <BrandBadge text="NEW" variant="outline" brandColor={secondary} secondary={secondary} />}
{item.tag === 'hot' && <BrandBadge text="HOT" variant="solid" brandColor={brandColor} secondary={secondary} />}
\`\`\`

**Rule**:
- **Discount/SALE/HOT**: Primary (urgent, important)
- **NEW**: Secondary (subtle, informational)

---

### Pattern 4: Navigation Controls (Secondary → Primary)

**Context**: Carousel, pagination controls  
**Rationale**: Navigation = important UI controls → primary (30%)

**Search**:
\`\`\`bash
grep -n "ChevronLeft.*secondary" **/*.tsx
grep -n "ChevronRight.*secondary" **/*.tsx
\`\`\`

**Before**:
\`\`\`typescript
<ChevronLeft size={16} style={{ color: secondary }} />
<button style={{ backgroundColor: secondary }}>
  <ChevronRight size={18} />
</button>

// Dots
<button style={i === 0 ? { backgroundColor: secondary } : {}} />
\`\`\`

**After**:
\`\`\`typescript
<ChevronLeft size={16} style={{ color: brandColor }} />
<button style={{ backgroundColor: brandColor }}>
  <ChevronRight size={18} />
</button>

// Dots
<button style={i === 0 ? { backgroundColor: brandColor } : {}} />
\`\`\`

---

### Pattern 5: Hover States (giữ Secondary - subtle accent)

**Context**: Border hover, background hover  
**Rationale**: Hover = subtle feedback → secondary (10% accent)

**KHÔNG ĐỔI** - These are correct:
\`\`\`typescript
// ✅ Border hover - giữ secondary
onMouseEnter={(e) => { e.currentTarget.style.borderColor = \`\${secondary}20\`; }}

// ✅ Background tint - giữ secondary
style={{ backgroundColor: \`\${secondary}08\` }}

// ✅ Hover shadow - giữ secondary
style={{ '--hover-border': \`\${secondary}20\` }}
\`\`\`

**Rationale**: Hover effects là decorative (10%), không phải primary actions (30%).

---

### Pattern 6: Hero Card CTAs (context-aware)

**Context**: Bento/Showcase layouts với featured cards  
**Rationale**: Hero CTA = primary action → primary color

**Before**:
\`\`\`typescript
// Featured card CTA
<button style={{ backgroundColor: secondary }}>
  Xem chi tiết
</button>
\`\`\`

**After**:
\`\`\`typescript
// Hero featured CTA = PRIMARY
<button style={{ backgroundColor: brandColor }}>
  Xem chi tiết
</button>

// Small cards hover = SECONDARY (subtle)
<div style={{ backgroundColor: \`\${secondary}08\` }}>
  // hover state
</div>
\`\`\`

---

### Quick Reference: What uses Primary vs Secondary?

| Element | Color | Visual Weight | Rationale |
|---------|-------|---------------|-----------|
| Prices | **Primary** | 30% | Commerce - most important |
| CTA Buttons | **Primary** | 30% | Primary actions |
| Headings | **Primary** | 30% | Structure |
| Navigation | **Primary** | 30% | Controls |
| Discount/HOT badges | **Primary** | 30% | Urgent |
| NEW badges | **Secondary** | 10% | Informational |
| Hover borders | **Secondary** | 10% | Subtle feedback |
| Hover backgrounds | **Secondary** | 10% | Decorative |
| Small accents | **Secondary** | 10% | Visual variety |

---

### Validation Commands

**After refactoring, run**:

\`\`\`bash
# 1. TypeScript compile check
bunx oxlint --type-aware --type-check --fix

# 2. Find remaining hard-coded colors (should be zero)
grep -n "color: ['\"]#" app/admin/home-components/previews.tsx
grep -n "backgroundColor: ['\"]#" components/site/ComponentRenderer.tsx

# 3. Count usage of shared components
grep -c "BrandBadge" app/admin/home-components/previews.tsx
grep -c "brandColor" app/admin/home-components/previews.tsx
grep -c "secondary" app/admin/home-components/previews.tsx

# 4. Verify no stray secondary on prices/CTAs
grep -n "price.*secondary" **/*.tsx  # Should be zero
grep -n "Xem chi tiết.*secondary" **/*.tsx  # Should be zero (except hover states)
\`\`\`
```

---

### **Section 4: Batch Prioritization Strategy** ⭐ (Sau Refactoring Patterns)

**Mục đích**: Guide cách chia components thành batches như spec `full-refactor-23-components`

**Nội dung**:

```markdown
## Batch Prioritization Strategy

### When to use batching?

- Refactor ≥ 10 components cùng lúc
- Time estimate > 3 hours
- Need to track progress systematically

### Classification Matrix

| Priority | Criteria | Examples | Estimate/component |
|----------|----------|----------|-------------------|
| **High** | User-facing, commerce-critical, high traffic | ProductList, Pricing, Hero, CTA | 15-20 mins |
| **Medium** | User-facing, moderate traffic | Services, Benefits, FAQ, Testimonials, Contact | 10-15 mins |
| **Low** | Admin-only, utility, low traffic | Gallery, Video, Countdown, Footer | 5-10 mins |

### Decision Tree

\`\`\`
Start → Component có e-commerce elements (price, cart, checkout)?
  ├─ YES → HIGH priority
  └─ NO → Component user-facing trên homepage?
      ├─ YES → MEDIUM priority
      └─ NO → LOW priority
\`\`\`

### Batch Template

\`\`\`markdown
### BATCH 1: HIGH PRIORITY (X components, Y layouts)

#### **Component 1: [Name]** (Z layouts)
**Line**: [start-end] trong [file]  
**Preview**: Line [start-end] trong previews.tsx

**Patterns cần fix**:
1. **[Layout 1]**: [Issue] → [Solution]
2. **[Layout 2]**: [Issue] → [Solution]

**Actions**:
- Import \`{ ... }\` từ shared
- Replace [pattern X]
- Verify [specific checks]

---

#### **Component 2: [Name]** ...
\`\`\`

### Example từ codebase

Xem: \`.factory/docs/2026-02-14-full-refactor-dual-brand-color-system-23-components-138-layouts.md\`

**Batch breakdown**:
- Batch 1 (High): 6 components, 36 layouts, 1.5-2 hours
- Batch 2 (Medium): 9 components, 54 layouts, 2-2.5 hours
- Batch 3 (Low): 8 components, 48 layouts, 1.5-2 hours

**Estimation formula**:
\`\`\`
Time (hours) = (Layouts × 2 mins) / 60
Components in batch = Time budget / Avg time per component
\`\`\`

### Progress Tracking

Create checklist:
\`\`\`markdown
## Progress

### Batch 1: High Priority
- [x] Component 4: Services (6 layouts) - 18 mins
- [x] Component 5: Benefits (6 layouts) - 15 mins
- [ ] Component 7: CTA (6 layouts)
- [ ] Component 9: Contact (6 layouts)
- [ ] Component 12: Pricing (6 layouts)
- [ ] Component 19: ProductCategories (6 layouts)

**Status**: 2/6 done (33%)
\`\`\`
```

---

### **Section 5: Validation & QA Workflow** ⭐ (Sau Batch Strategy)

**Mục đích**: Systematic validation như trong specs

**Nội dung**:

```markdown
## Validation & QA Workflow

### Pre-commit Validation (MUST RUN)

#### **Step 1: TypeScript Compile**

\`\`\`bash
bunx oxlint --type-aware --type-check --fix
\`\`\`

**Expected output**:
\`\`\`
✔ Linting completed in XXXms.
Found 0 warnings and 0 errors.
\`\`\`

**If errors**: Fix before proceeding. Common issues:
- Missing imports
- Type mismatches (\`brandColor\` vs \`secondary\` props)
- Undefined variables

---

#### **Step 2: Hard-coded Color Audit**

\`\`\`bash
# Check for stray hex colors (should be ZERO)
grep -n "backgroundColor: ['\"]#" app/admin/home-components/previews.tsx
grep -n "color: ['\"]#" components/site/ComponentRenderer.tsx

# Check for hard-coded Tailwind colors (should minimize)
grep -n "bg-blue-" **/*.tsx | grep -v "bg-slate" | grep -v "bg-white"
\`\`\`

**Expected**: Zero results. If found, replace with \`brandColor\` or \`secondary\`.

---

#### **Step 3: Pattern Compliance Check**

\`\`\`bash
# Prices should use PRIMARY (brandColor)
grep -n "price.*secondary" **/*.tsx
# Expected: ZERO (except old code not yet refactored)

# CTAs should use PRIMARY
grep -n "Xem chi tiết.*style={{ color: secondary" **/*.tsx
# Expected: ZERO (except hover states with onMouseEnter)

# NEW badges should use SECONDARY
grep -n "tag === 'new'.*brandColor={brandColor}" **/*.tsx
# Expected: ZERO (should be brandColor={secondary})
\`\`\`

---

#### **Step 4: Visual Weight Estimation**

Manual check (sample 3-5 layouts):

**Checklist**:
- [ ] Neutral backgrounds (white/slate) ≈ 60% screen area
- [ ] Primary elements (headings/prices/CTAs) ≈ 30% visual weight
- [ ] Secondary accents (badges/hover/borders) ≈ 10% visual weight

**Tool**: Screenshot + color picker in DevTools  
**Method**: Count pixels or visual estimation

---

### Post-commit Validation (OPTIONAL)

#### **Visual Regression Testing**

**Manual**:
1. Open preview: \`http://localhost:3000/admin/home-components/[id]/edit\`
2. Switch between styles (minimal, commerce, bento, etc.)
3. Verify:
   - [ ] Prices are primary color (not secondary)
   - [ ] CTAs are primary color
   - [ ] Hover states are subtle (secondary)
   - [ ] NEW badges are secondary
   - [ ] No jarring color clashes

**Automated** (if available):
\`\`\`bash
npm run test:visual  # Playwright/Chromatic screenshots
\`\`\`

---

#### **Contrast Validation**

**Tools**:
- Chrome DevTools > Lighthouse > Accessibility audit
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

**Checklist**:
- [ ] Primary color vs white ≥ 4.5:1 (WCAG AA)
- [ ] Secondary color vs white ≥ 4.5:1
- [ ] Button text vs button bg ≥ 4.5:1

---

### Rollback Procedure (if validation fails)

\`\`\`bash
# 1. Check current changes
git status
git diff

# 2. If TypeScript errors unfixable, rollback
git restore [file]

# 3. If partial commit needed, stage selectively
git add -p [file]  # Interactive staging

# 4. Commit working changes only
git commit -m "partial: [scope]: [what works]"
\`\`\`

---

### Success Criteria Checklist

Before marking task "DONE":

- [ ] **Zero TypeScript errors** - \`bunx oxlint --type-check\` passes
- [ ] **Zero hard-coded hex colors** - grep returns empty
- [ ] **Pattern compliance** - prices/CTAs use primary, NEW badges use secondary
- [ ] **60-30-10 visual weight** - manual check on 3 layouts
- [ ] **Contrast WCAG AA** - primary/secondary ≥ 4.5:1 vs white
- [ ] **Commit message** - follows conventional commits format
- [ ] **Spec documented** - nếu refactor ≥3 layouts, có spec file

---

### Common Validation Errors \u0026 Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| \`Property 'secondary' does not exist\` | Missing prop in component | Add \`secondary?: string\` to type |
| \`grep finds "price.*secondary"\` | Chưa refactor hết | Replace với \`brandColor\` |
| Visual: Price không nổi bật | Dùng secondary thay vì primary | Check rationale: commerce → primary |
| Contrast fail (<4.5:1) | Màu quá nhạt | Darken primary/secondary hoặc dùng tint |
```

---

### **Section 6: Troubleshooting Guide** ⭐ (Cuối skill, trước Advanced Topics)

**Mục đích**: Root cause analysis như DARE framework

**Nội dung**:

```markdown
## Troubleshooting Guide

### Problem 1: TypeScript error "Property 'secondary' does not exist"

**Symptom**:
\`\`\`
Type '{ brandColor: string; }' is missing property 'secondary'
\`\`\`

**Root Cause**: Component expects both \`brandColor\` AND \`secondary\` props nhưng chỉ pass 1.

**Solutions**:

**Option A: Update component call**
\`\`\`typescript
// BEFORE
<BrandBadge text="NEW" brandColor={secondary} />

// AFTER
<BrandBadge text="NEW" brandColor={secondary} secondary={secondary} />
\`\`\`

**Option B: Make secondary optional in type**
\`\`\`typescript
type Props = {
  brandColor: string;
  secondary?: string;  // Optional
};
\`\`\`

---

### Problem 2: Colors không thay đổi sau refactor

**Symptom**: Đã đổi code từ \`secondary\` → \`brandColor\` nhưng UI vẫn hiển thị màu cũ.

**Root Causes**:

1. **Cache không clear**: Next.js dev server cache  
   **Fix**: Restart dev server \`npm run dev\`

2. **Inline styles override**: CSS specificity  
   **Fix**: Check DevTools > Computed styles, tìm override

3. **Đổi nhầm file**: Preview vs Frontend  
   **Fix**: Verify file path, có thể cần đổi CẢ 2 files:
   - \`app/admin/home-components/previews.tsx\` (admin preview)
   - \`components/site/ComponentRenderer.tsx\` (frontend render)

4. **Variable shadowing**: Local \`secondary\` variable override prop  
   **Fix**: Rename local variable

---

### Problem 3: Visual weight vẫn không đúng 60-30-10

**Symptom**: Primary color vẫn chiếm quá ít hoặc quá nhiều.

**Diagnostic Steps**:

1. **Count elements**:
   \`\`\`bash
   grep -c "brandColor" [file]  # Should be ~30% of total color usage
   grep -c "secondary" [file]   # Should be ~10%
   \`\`\`

2. **Check saturation**: Primary quá nhạt → tăng visual weight bằng darker shade  
   \`\`\`typescript
   // Nếu primary-500 quá nhạt
   // BEFORE: bg-primary-500
   // AFTER: bg-primary-600 (darker = more weight)
   \`\`\`

3. **Check area coverage**: CTA button nhỏ → tăng size hoặc số lượng  
   \`\`\`typescript
   // Tăng size button
   className="px-8 py-4"  // Instead of px-4 py-2
   \`\`\`

**Root Cause Decision Tree**:
\`\`\`
Visual weight sai?
├─ Primary quá ít?
│  ├─ Elements đủ nhưng màu nhạt? → Darken shade
│  └─ Elements quá ít? → Add more primary elements (icons, borders)
└─ Primary quá nhiều?
   ├─ Background dùng primary? → Replace với neutral
   └─ Quá nhiều CTAs? → Merge hoặc prioritize
\`\`\`

---

### Problem 4: Hover states không work

**Symptom**: \`onMouseEnter\` set color nhưng hover không đổi màu.

**Root Cause**: Missing \`onMouseLeave\` handler → state stuck.

**Fix**:
\`\`\`typescript
// BEFORE (incomplete)
<button
  onMouseEnter={(e) => { e.currentTarget.style.borderColor = brandColor; }}
>

// AFTER (complete)
<button
  onMouseEnter={(e) => { 
    e.currentTarget.style.borderColor = brandColor;
    e.currentTarget.style.backgroundColor = \`\${brandColor}08\`;
  }}
  onMouseLeave={(e) => { 
    e.currentTarget.style.borderColor = \`\${brandColor}20\`;
    e.currentTarget.style.backgroundColor = 'transparent';
  }}
>
\`\`\`

**Pro tip**: Use CSS \`:hover\` thay vì inline handlers nếu có thể:
\`\`\`typescript
<button 
  className="border-2 hover:border-primary-600 transition-colors"
  style={{ borderColor: \`\${brandColor}20\` }}
>
\`\`\`

---

### Problem 5: Badges tất cả cùng màu → nhàm chán

**Symptom**: 10 badges cùng primary color → monotonous.

**Solution**: Alternate primary/secondary theo badge type.

**Pattern**:
\`\`\`typescript
// Urgent/action badges → PRIMARY
{discount && <BrandBadge brandColor={brandColor} />}
{item.tag === 'hot' && <BrandBadge brandColor={brandColor} />}
{item.tag === 'sale' && <BrandBadge brandColor={brandColor} />}

// Informational badges → SECONDARY
{item.tag === 'new' && <BrandBadge brandColor={secondary} />}
{item.featured && <BrandBadge text="Featured" brandColor={secondary} />}
\`\`\`

**Rationale**: Mix creates visual variety while respecting 60-30-10 (primary dominant, secondary accent).

---

### Problem 6: Contrast fail WCAG

**Symptom**: Lighthouse report "Background and foreground colors do not have sufficient contrast ratio"

**Diagnostic**:
\`\`\`bash
# Test contrast with WebAIM
# Primary: #[hex] on white #ffffff
# Expected: ≥ 4.5:1 for AA
\`\`\`

**Solutions**:

**Option A: Darken color**
\`\`\`typescript
// BEFORE: primary-400 (#60a5fa) - contrast 3.2:1 ❌
// AFTER: primary-600 (#2563eb) - contrast 4.8:1 ✅
\`\`\`

**Option B: Change background**
\`\`\`typescript
// BEFORE: text-primary-500 on bg-white
// AFTER: text-white on bg-primary-600 (inverse)
\`\`\`

**Option C: Add border/shadow**
\`\`\`typescript
<button className="border-2 border-slate-200">
  {/* Border tăng contrast perceived */}
</button>
\`\`\`

---

### Problem 7: "Màu đẹp trong Figma nhưng xấu khi code"

**Root Cause**: Figma dùng color profile khác browser, hoặc không test dark mode.

**Solutions**:

1. **Export hex chính xác**: Figma > Copy CSS > Verify hex matches  
2. **Test trong browser**: Không tin Figma 100%, luôn verify localhost  
3. **Test dark mode**: \`prefers-color-scheme: dark\`  
4. **Test màn hình khác nhau**: Laptop vs external monitor (color accuracy varies)

---

### Emergency Rollback Checklist

Nếu sau khi refactor, UI break hoàn toàn:

1. **Check git diff**:
   \`\`\`bash
   git diff HEAD
   \`\`\`

2. **Identify breaking change** (usually missing prop hoặc wrong variable)

3. **Partial rollback**:
   \`\`\`bash
   git restore --patch [file]  # Chọn hunks để restore
   \`\`\`

4. **Or full rollback**:
   \`\`\`bash
   git restore [file]
   git clean -fd  # Remove untracked files
   \`\`\`

5. **Restart dev server**: \`npm run dev\`

---

### Debugging Commands Reference

\`\`\`bash
# Find all color usages
grep -rn "brandColor\|secondary" app/ components/

# Find hard-coded colors
grep -rn "color: ['\"]#" app/ components/

# Find hover handlers
grep -rn "onMouseEnter\|onMouseLeave" app/

# Count pattern usage
grep -c "BrandBadge" [file]

# Find missing types
bunx oxlint --type-check 2>&1 | grep "Property.*does not exist"
\`\`\`
```

---

## 📝 Summary of Changes

| Section | Type | Lines Added | Purpose |
|---------|------|-------------|---------|
| **Spec Writing Template** | NEW | ~80 | Provide copy-paste template cho specs chi tiết |
| **Commit Message Standards** | NEW | ~60 | Standardize conventional commits |
| **Code Refactoring Patterns** | NEW | ~180 | 6 patterns với before/after + validation commands |
| **Batch Prioritization** | NEW | ~70 | Classification matrix + estimation formula |
| **Validation & QA** | NEW | ~120 | Pre/post-commit checklist + success criteria |
| **Troubleshooting Guide** | NEW | ~150 | 7 common problems với root cause + fixes |
| **Total** | **6 sections** | **~660 lines** | Transform skill từ theory → executable playbook |

---

## ✅ Success Criteria

Sau khi upgrade skill v4.0:

- [ ] AI agent có thể tạo spec chi tiết như \`2026-02-15-fix-dual-brand-colors-cho-6-productlist-layouts.md\`
- [ ] AI agent biết commit message format chuẩn như \`2a34bf6\`
- [ ] AI agent có 6 refactoring patterns ready-to-use với grep commands
- [ ] AI agent biết chia batches theo priority matrix
- [ ] AI agent có validation checklist rõ ràng (pre-commit + post-commit)
- [ ] AI agent có troubleshooting guide cho 7+ common issues
- [ ] Skill tăng từ ~700 lines (v3.0) → ~1360 lines (v4.0)
- [ ] Skill focus vào **execution** (how to do) thay vì chỉ **concepts** (what/why)

---

## 🎯 Implementation Steps

1. **Backup skill hiện tại**: Copy \`SKILL.md\` → \`SKILL.v3.backup.md\`
2. **Add Section 1**: Spec Writing Template (sau "When to Use")
3. **Add Section 2**: Commit Message Standards (sau Section 1)
4. **Add Section 3**: Code Refactoring Patterns (sau "Implementation Workflow")
5. **Add Section 4**: Batch Prioritization (sau Section 3)
6. **Add Section 5**: Validation & QA (sau Section 4)
7. **Add Section 6**: Troubleshooting (trước "Advanced Topics")
8. **Update frontmatter**: \`version: 4.0.0\`, update description
9. **Update Table of Contents**: Nếu có TOC, thêm 6 sections mới
10. **Test skill**: Create test query, verify AI agent có thể generate spec chuẩn

---

## 📦 Deliverables

- \`.factory/skills/dual-brand-color-system/SKILL.md\` (v4.0, ~1360 lines)
- Commit message: \`feat(skills): upgrade dual brand color system v4.0 - executable playbook\`

---

## ⏱️ Estimate

- Writing 6 sections: ~2-3 hours
- Testing + refinement: ~30 mins
- **Total**: ~2.5-3.5 hours

---

**Ready to execute!** 🚀