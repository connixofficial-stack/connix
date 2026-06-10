# 📋 SPEC: Áp dụng Dual Brand Color System cho toàn bộ Home Components

## 🔍 Executive Summary

Áp dụng **dual brand color system** (primary + secondary colors) theo **60-30-10 rule** từ skill `dual-brand-color-system` vào **toàn bộ 26 home components** của VietAdmin. 

**Phạm vi**: Sửa **2 files chính**:
1. `app/admin/home-components/previews.tsx` (Admin Preview - tất cả 6 layouts/component)
2. `components/site/ComponentRenderer.tsx` (Frontend Render - tất cả 6 layouts/component)

**Trạng thái hiện tại**:
- ✅ **Đã áp dụng** (2/26): Hero (6 layouts), Stats (6 layouts)
- ❌ **Chưa áp dụng** (24/26): About, Services, Benefits, FAQ, CTA, Testimonials, Contact, Gallery, Partners, TrustBadges, Pricing, ProductList, ServiceList, Blog, Career, CaseStudy, SpeedDial, ProductCategories, CategoryProducts, Team, Features, Process, Clients, Video, Countdown, VoucherPromotions, Footer

---

## 🎨 60-30-10 Color Rule (Nguyên tắc vàng)

Theo skill dual-brand-color-system:

| Tỷ lệ | Màu | Dùng cho | Variable |
|-------|-----|----------|----------|
| **60%** | Neutral | Backgrounds, surfaces, white space | `bg-white`, `bg-slate-50/900`, `text-slate-600` |
| **30%** | **Primary** | Headings, primary sections, borders, indicators | `brandColor` (primary) |
| **10%** | **Secondary** | CTAs, badges, accents, highlights | `secondary` |

**Quan trọng**: Visual weight ≠ diện tích vật lý. Accent 10% nhưng nếu high-contrast có thể "cảm giác" ~30%.

---

## 📊 Danh sách 26 Home Components

### ✅ Đã hoàn thành (2 components)

#### 1. **Hero** - 6 layouts ✅
- Trạng thái: Đã áp dụng hoàn chỉnh (theo docs `2026-02-14-p-d-ng-dual-brand-color-system-cho-hero-component-6-layouts.md`)
- Layouts: slider, fade, bento, fullscreen, split, parallax
- Không cần sửa

#### 2. **Stats** - 6 layouts ✅
- Trạng thái: Đã áp dụng hoàn chỉnh (theo docs `2026-02-14-spec-p-d-ng-dual-brand-color-system-cho-stats-component-6-layouts.md`)
- Layouts: horizontal, cards, icons, gradient, minimal, counter
- Không cần sửa

---

### ❌ Chưa áp dụng (24 components)

## 🔧 PLAN CHI TIẾT TỪNG COMPONENT

---

### **CHƯƠNG 1: About Component - 6 layouts**

#### 1.1 Phân tích hiện trạng

File `previews.tsx` dòng ~6217 và `ComponentRenderer.tsx` AboutSection:
- **Layouts**: classic, bento, minimal, split, timeline, showcase
- **Vấn đề**: 
  - Hiện tại dùng `brandColor` và `secondary` nhưng không đồng nhất
  - Badge component có hardcode `40`, `15`, `10` (thiếu `${}`)
  - AboutStatBox chưa tách rõ primary vs secondary
  - Một số layout dùng `secondary` cho stats value, một số dùng `brandColor`

#### 1.2 60-30-10 Mapping

| Element | Current | Should be | Visual Weight |
|---------|---------|-----------|---------------|
| Background | `bg-white`, `bg-slate-50` | ✅ Keep (60% neutral) | 60% |
| Badge background | `${brandColor}10/15` ❌ | `${secondary}10/15` | 5% |
| Badge text | `${secondary}` | ✅ Keep | 2% |
| Heading | `text-slate-900` | ✅ Keep (neutral) | 25% |
| Stats value | Mixed ❌ | `${secondary}` (accent) | 8% |
| Button primary | `${brandColor}` | ✅ Keep (30% primary) | 10% |
| Button outline | `${brandColor}` border | ✅ Keep | 5% |
| Accent line/bar | Mixed ❌ | `${secondary}` | 3% |
| Pulse dot | `${brandColor}` | ✅ Keep | 1% |

**Total**: Neutral ~60%, Primary ~30%, Secondary ~10% ✅

#### 1.3 Code Changes

**1.3.1 Fix AboutBadge Component** (`previews.tsx` ~line 1095)

```tsx
// ❌ Current (lỗi syntax thiếu ${})
\u003cdiv style={{ backgroundColor: `10`, borderColor: `20`, color: secondary }}

// ✅ Fix thành
const AboutBadge = ({ text, variant = 'default', brandColor, secondary }) =\u003e {
  if (variant === 'outline') {
    return (
      \u003cdiv 
        style={{ borderColor: `${secondary}40`, color: secondary }}
      \u003e{text}\u003c/div\u003e
    );
  }
  if (variant === 'minimal') {
    return (
      \u003cdiv style={{ backgroundColor: `${secondary}15`, color: secondary }}
      \u003e{text}\u003c/div\u003e
    );
  }
  return (
    \u003cdiv style={{ backgroundColor: `${secondary}10`, borderColor: `${secondary}20`, color: secondary }}
    \u003e{text}\u003c/div\u003e
  );
};
```

**1.3.2 Fix AboutStatBox Component** (`previews.tsx` ~line 1115)

```tsx
// ❌ Current: mixed brandColor và secondary
\u003cspan style={{ color: secondary }}\u003e{stat.value}\u003c/span\u003e // ✅ bento
\u003cspan style={{ color: brandColor }}\u003e{stat.value}\u003c/span\u003e // ❌ minimal

// ✅ Fix: Đồng nhất tất cả dùng secondary (10% accent)
const AboutStatBox = ({ stat, variant, brandColor, secondary }) =\u003e {
  if (variant === 'bento') {
    return (
      \u003cspan style={{ color: secondary }}\u003e{stat.value}\u003c/span\u003e // ✅
    );
  }
  if (variant === 'minimal') {
    return (
      \u003cdiv style={{ borderColor: `${secondary}30` }}\u003e
        \u003cspan style={{ color: secondary }}\u003e{stat.value}\u003c/span\u003e // ✅ thay brandColor
      \u003c/div\u003e
    );
  }
  return (
    \u003cspan style={{ color: secondary }}\u003e{stat.value}\u003c/span\u003e // ✅ thay brandColor
  );
};
```

**1.3.3 Fix 6 Layouts** (`previews.tsx` AboutPreview)

**Layout 1: Classic**
```tsx
// Line ~6250
// ❌ Current
\u003ca style={{ color: secondary }} // ✅ button link text
  onMouseEnter={(e) =\u003e { e.currentTarget.style.backgroundColor = brandColor }}

// ✅ Keep (primary 30% cho button)
```

**Layout 2: Bento**
```tsx
// Line ~6280
// ❌ Current
\u003cdiv style={{ backgroundColor: brandColor }} // pulse dot
\u003cspan style={{ color: secondary }}\u003e{subHeading}\u003c/span\u003e

// ✅ Keep (đã đúng)
```

**Layout 3: Minimal**
```tsx
// Line ~6320
// ❌ Current trong stats
\u003cspan className=\"text-3xl\" style={{ color: brandColor }}\u003e // ❌

// ✅ Fix
\u003cspan className=\"text-3xl\" style={{ color: secondary }}\u003e{stat.value}\u003c/span\u003e
```

**Layout 4: Split**
```tsx
// Line ~6350
// ❌ Current
\u003cspan style={{ color: secondary }}\u003e{stat.value}\u003c/span\u003e // ✅ đã đúng
\u003ca style={{ backgroundColor: brandColor }}\u003e{buttonText}\u003c/a\u003e // ✅ primary

// ✅ Keep
```

**Layout 5: Timeline**
```tsx
// Line ~6380
// ❌ Current
\u003cdiv style={{ borderColor: brandColor, color: secondary }} // dot số
\u003cspan style={{ color: secondary }}\u003e{stat.value}\u003c/span\u003e // ✅
\u003cdiv style={{ borderColor: `15` }} // ❌ thiếu ${}

// ✅ Fix
\u003cdiv style={{ borderColor: brandColor }} // dot border primary
\u003cdiv style={{ borderColor: `${secondary}15` }} // card border
```

**Layout 6: Showcase (default)**
```tsx
// Line ~6420
// ❌ Current
\u003cspan style={{ backgroundColor: `15`, color: secondary }} // badge ❌ thiếu ${}
\u003cspan style={{ color: secondary }}\u003e{stat.value}\u003c/span\u003e // ✅
\u003ca style={{ backgroundColor: brandColor }} // button ✅

// ✅ Fix badge
\u003cspan style={{ backgroundColor: `${secondary}15`, color: secondary }}
```

**1.3.4 Đồng bộ ComponentRenderer.tsx** (Frontend)

File `components/site/ComponentRenderer.tsx` AboutSection (~line 950):
- Copy tương tự logic từ previews.tsx
- Đảm bảo AboutBadge, AboutStatBox dùng `${secondary}` với cú pháp đúng
- Tất cả 6 layouts đồng bộ

---

### **CHƯƠNG 2: Services Component - 6 layouts**

#### 2.1 Phân tích hiện trạng

File `previews.tsx` dòng ~3138 ServicesPreview:
- **Layouts**: elegant, modern, numbered, cards, carousel, timeline
- **Vấn đề**:
  - Icon container background: một số dùng `brandColor`, một số dùng gradient
  - Hover effects: không đồng nhất
  - Number badges: chưa rõ primary vs secondary

#### 2.2 60-30-10 Mapping

| Element | Should be | Visual Weight |
|---------|-----------|---------------|
| Background | Neutral (60%) | 60% |
| Service number badge | `${secondary}` background | 5% |
| Icon container | `${brandColor}` background (primary) | 15% |
| Title/Heading | `text-slate-900` neutral | 20% |
| CTA button | `${brandColor}` (primary) | 10% |
| Accent line | `${secondary}` | 3% |
| Hover border | `${secondary}20` | 2% |

#### 2.3 Code Changes

**2.3.1 Layout 1: Elegant Grid**
```tsx
// Icon container
\u003cdiv style={{ backgroundColor: brandColor }} // ✅ primary 30%

// Number badge (nếu có)
\u003cspan style={{ backgroundColor: `${secondary}90`, color: 'white' }} // secondary accent
```

**2.3.2 Layout 2: Modern List**
```tsx
// Number
\u003cspan style={{ color: secondary }} // accent

// Icon bg
\u003cdiv style={{ backgroundColor: `${brandColor}10` }} // subtle primary
  \u003cIcon style={{ color: brandColor }} // primary
```

**2.3.3 Layout 3: Big Number**
```tsx
// Big number watermark
\u003cspan style={{ color: `${secondary}08` }} // subtle secondary

// Icon
\u003cdiv style={{ backgroundColor: brandColor }} // primary
```

**2.3.4 Layout 4-6**: Tương tự pattern trên

**2.3.5 Đồng bộ ComponentRenderer.tsx**

---

### **CHƯƠNG 3: Benefits Component - 6 layouts**

#### 3.1 Phân tích hiện trạng

File `previews.tsx` ~line 6721 BenefitsPreview:
- **Layouts**: (cần check code để xác định tên)
- **Pattern tương tự Services**: icon container, badges, CTAs

#### 3.2 60-30-10 Mapping

| Element | Should be | Visual Weight |
|---------|-----------|---------------|
| Check icon circle | `${brandColor}` bg (primary) | 10% |
| Badge/Tag | `${secondary}` bg+text | 5% |
| Title | neutral | 25% |
| Description | neutral | 30% |

#### 3.3 Code Changes

Áp dụng pattern tương tự Services:
- Icon containers: `brandColor` (primary 30%)
- Badges: `secondary` (accent 10%)
- Backgrounds: neutral (60%)

---

### **CHƯƠNG 4: FAQ Component - 6 layouts**

#### 4.1 Phân tích hiện trạng

File `previews.tsx` ~line 982 FaqPreview:
- **Layouts**: accordion, cards, minimal, numbered, tabs, split
- **Vấn đề**: ChevronDown icon color, active states

#### 4.2 60-30-10 Mapping

| Element | Should be | Visual Weight |
|---------|-----------|---------------|
| Active accordion | `${brandColor}` border/bg-tint | 15% |
| Question number | `${secondary}` | 5% |
| Chevron icon | `${brandColor}` when active | 5% |
| Tab active | `${brandColor}` indicator | 10% |

#### 4.3 Code Changes

**4.3.1 Accordion Layout**
```tsx
// Active state
\u003cdiv style={{ borderColor: brandColor, backgroundColor: `${brandColor}05` }}

// Chevron
\u003cChevronDown style={{ color: isOpen ? brandColor : 'inherit' }}

// Number badge
\u003cspan style={{ backgroundColor: `${secondary}15`, color: secondary }}
```

**4.3.2 Tabs Layout**
```tsx
// Active tab
\u003cbutton 
  className={isActive ? 'border-b-2' : ''}
  style={isActive ? { borderColor: brandColor, color: brandColor } : {}}
```

---

### **CHƯƠNG 5: CTA Component - 6 layouts**

#### 5.1 Phân tích

File `previews.tsx` ~line 5725 CTAPreview:
- **Đây là component quan trọng**: CTA = Call-to-Action = accent 10%
- **Nguyên tắc**: Primary button dùng `brandColor`, secondary button dùng outline/ghost

#### 5.2 60-30-10 Mapping

| Element | Should be | Visual Weight |
|---------|-----------|---------------|
| Primary CTA button | `${brandColor}` bg (PRIMARY) | 30% ⚠️ |
| Badge | `${secondary}` bg+text | 5% |
| Background gradient | Neutral hoặc subtle primary | 60% |
| Decorative elements | `${secondary}20` | 5% |

**Lưu ý**: CTA component là ngoại lệ - primary button chiếm 30% visual weight vì đây là mục đích chính.

#### 5.3 Code Changes

```tsx
// Primary button
\u003cbutton style={{ backgroundColor: brandColor, color: 'white' }}

// Badge
\u003cspan style={{ backgroundColor: `${secondary}15`, color: secondary }}

// Decorative circle
\u003cdiv style={{ backgroundColor: `${secondary}10` }} className=\"blur-xl\"
```

---

### **CHƯƠNG 6: Testimonials Component - 6 layouts**

#### 6.1 Phân tích

File `previews.tsx` ~line 1333 TestimonialsPreview:
- **Layouts**: cards, carousel, masonry, minimal, grid, featured
- **Elements**: star ratings, quote marks, author avatars

#### 6.2 60-30-10 Mapping

| Element | Should be | Visual Weight |
|---------|-----------|---------------|
| Star icons | `${brandColor}` (primary - trust indicator) | 15% |
| Quote marks | `${secondary}20` (subtle accent) | 5% |
| Active carousel dot | `${brandColor}` | 5% |
| Card border hover | `${secondary}20` | 5% |

#### 6.3 Code Changes

```tsx
// Stars
\u003cStar fill={brandColor} stroke={brandColor} /\u003e

// Quote
\u003cdiv style={{ color: `${secondary}20` }}\u003e"\u003c/div\u003e

// Carousel dots
\u003cbutton 
  style={isActive ? { backgroundColor: brandColor } : { backgroundColor: 'gray' }}
```

---

### **CHƯƠNG 7: Contact Component - 6 layouts**

#### 7.1 Phân tích

File `previews.tsx` ~line 8100 ContactPreview:
- **Layouts**: form-only, split, card, minimal, sidebar, floating

#### 7.2 60-30-10 Mapping

| Element | Should be | Visual Weight |
|---------|-----------|---------------|
| Submit button | `${brandColor}` (primary CTA) | 15% |
| Icon circles | `${secondary}` bg | 10% |
| Input focus border | `${brandColor}` | 10% |
| Info card bg | `${secondary}05` | 5% |

#### 7.3 Code Changes

```tsx
// Submit button
\u003cbutton style={{ backgroundColor: brandColor }}

// Icon container
\u003cdiv style={{ backgroundColor: `${secondary}15` }}
  \u003cMail style={{ color: secondary }} /\u003e

// Input focus
className=\"focus:border-[brandColor]\" // via CSS variable
```

---

### **CHƯƠNG 8: Gallery & Partners - 6 layouts**

#### 8.1 Phân tích

File `previews.tsx` ~line 2307 GalleryPreview:
- **Shared component**: Gallery + Partners dùng chung logic
- **Layouts**: grid, masonry, carousel, lightbox, slider, featured

#### 8.2 60-30-10 Mapping

| Element | Should be | Visual Weight |
|---------|-----------|---------------|
| Overlay on hover | `${brandColor}90` (primary) | 20% |
| ZoomIn icon | white on primary | 5% |
| Lightbox nav | `${secondary}` | 5% |
| Caption bg | `${brandColor}` gradient | 10% |

#### 8.3 Code Changes

```tsx
// Hover overlay
\u003cdiv className=\"group-hover:opacity-100 transition-opacity\"
  style={{ backgroundColor: `${brandColor}90` }}
\u003e
  \u003cZoomIn style={{ color: 'white' }} /\u003e

// Lightbox arrows
\u003cbutton style={{ backgroundColor: secondary, color: 'white' }}
```

---

### **CHƯƠNG 9: TrustBadges Component - 6 layouts**

#### 9.1 Phân tích

File `previews.tsx` ~line 8516 TrustBadgesPreview:
- **Badges**: security, payment, shipping icons

#### 9.2 60-30-10 Mapping

| Element | Should be | Visual Weight |
|---------|-----------|---------------|
| Badge icon | `${brandColor}` (trust = primary) | 20% |
| Badge border | `${secondary}20` | 10% |
| Checkmark | `${secondary}` | 5% |

#### 9.3 Code Changes

```tsx
\u003cShield style={{ color: brandColor }} /\u003e
\u003cdiv style={{ borderColor: `${secondary}20` }}
```

---

### **CHƯƠNG 10: Pricing Component - 6 layouts**

#### 10.1 Phân tích

File `previews.tsx` ~line 1658 PricingPreview:
- **Layouts**: cards, table, toggle, comparison, minimal, featured
- **Popular badge**: accent indicator

#### 10.2 60-30-10 Mapping

| Element | Should be | Visual Weight |
|---------|-----------|---------------|
| Popular badge | `${secondary}` bg+text (accent!) | 10% |
| Price highlight | `${brandColor}` (primary) | 20% |
| CTA button | `${brandColor}` (primary) | 15% |
| Check icon | `${secondary}` | 5% |
| Featured plan border | `${brandColor}` | 10% |

#### 10.3 Code Changes

```tsx
// Popular badge (accent)
\u003cspan style={{ backgroundColor: secondary, color: 'white' }}

// Price
\u003cspan style={{ color: brandColor }}

// Featured card
\u003cdiv style={{ borderColor: brandColor, borderWidth: 2 }}

// Check icon
\u003cCheck style={{ color: secondary }} /\u003e
```

---

### **CHƯƠNG 11-24: Remaining Components**

Áp dụng **pattern tương tự** cho 13 components còn lại:

#### 11. **ProductList** (~line 3505)
- Product card border hover: `${secondary}20`
- Add to cart button: `${brandColor}`
- Sale badge: `${secondary}`

#### 12. **ServiceList** (~line 4182)
- Icon: `${brandColor}`
- Accent: `${secondary}`

#### 13. **Blog** (~line 4752)
- Category tag: `${secondary}`
- Read more link: `${brandColor}`

#### 14. **Career** (~line 7557)
- Apply button: `${brandColor}`
- Job type badge: `${secondary}`

#### 15. **CaseStudy** (~line 7037)
- Overlay: `${brandColor}80`
- Tag: `${secondary}`

#### 16. **SpeedDial** (~line 9049)
- Main FAB: `${brandColor}`
- Sub buttons: `${secondary}`

#### 17. **ProductCategories** (~line 9269)
- Icon circle: `${brandColor}`
- Count badge: `${secondary}`

#### 18. **CategoryProducts** (~line 10063)
- Similar to ProductList

#### 19. **Team** (~line 10858)
- Social icons: `${brandColor}`
- Role badge: `${secondary}`

#### 20. **Features** (~line 11595)
- Icon: `${brandColor}`
- Number: `${secondary}`

#### 21. **Process** (~line 11835)
- Step number: `${brandColor}`
- Connector line: `${secondary}30`

#### 22. **Clients** (~line 12260)
- Logo hover border: `${secondary}20`

#### 23. **Video** (~line 12652)
- Play button: `${brandColor}`
- Overlay: gradient with `${secondary}`

#### 24. **Countdown** (~line 13185)
- Timer boxes: `${brandColor}` border
- Label: `${secondary}`

#### 25. **VoucherPromotions** (~line 13771)
- Badge: `${secondary}`
- CTA: `${brandColor}`

#### 26. **Footer** (~line 5192)
- Link hover: `${brandColor}`
- Social icons: `${secondary}`

---

## ✅ CHECKLIST IMPLEMENTATION (Tổng hợp)

### Phase 1: Fix Syntax Errors (Ưu tiên cao)

- [ ] **AboutBadge**: Sửa `backgroundColor: \`10\`` → `\`${secondary}10\``
- [ ] **AboutStatBox**: Sửa `borderColor: \`30\`` → `\`${secondary}30\``
- [ ] **Timeline layout**: Sửa `borderColor: \`15\`` → `\`${secondary}15\``
- [ ] **Showcase badge**: Sửa `backgroundColor: \`15\`` → `\`${secondary}15\``
- [ ] Grep toàn bộ file tìm pattern `\`\d+\`` (thiếu `${}`) và fix

### Phase 2: Standardize Secondary Usage (24 components)

Cho mỗi component (About → Footer):

- [ ] Badges/Tags: `${secondary}` background + text
- [ ] Accent elements: `${secondary}` (borders, dots, small highlights)
- [ ] Stats/Numbers: `${secondary}` text color
- [ ] Decorative elements: `${secondary}10-30` với opacity

### Phase 3: Standardize Primary Usage

- [ ] Icon containers: `${brandColor}` background (primary 30%)
- [ ] CTA buttons: `${brandColor}` (primary action)
- [ ] Active states: `${brandColor}` (selected, focus)
- [ ] Brand indicators: `${brandColor}` (stars, trust badges, prices)

### Phase 4: Sync Frontend (ComponentRenderer.tsx)

- [ ] Copy tất cả logic màu từ previews.tsx sang ComponentRenderer.tsx
- [ ] Đảm bảo 26 components đồng bộ giữa admin preview và frontend render
- [ ] Test visual consistency

### Phase 5: QA & Validation

- [ ] Check 60-30-10 ratio trên 3 devices (desktop/tablet/mobile)
- [ ] Validate WCAG contrast ratios:
  - Primary vs white ≥ 4.5:1
  - Secondary vs white ≥ 4.5:1
  - Text vs backgrounds ≥ 4.5:1
- [ ] Test color blindness simulation
- [ ] Screenshot all 6 layouts × 26 components = 156 layouts

---

## 📝 Testing Plan

### Checklist Per Component

```markdown
Component: [Name]
- [ ] Admin preview renders correctly (6 layouts)
- [ ] Frontend renders match preview (6 layouts)
- [ ] Primary color usage: ~30% visual weight
- [ ] Secondary color usage: ~10% visual weight
- [ ] Neutral backgrounds: ~60%
- [ ] No hardcoded hex colors
- [ ] No syntax errors (\`10\` without \`${}\`)
- [ ] WCAG AA compliance
- [ ] Mobile responsive
```

### Test Script

```bash
# 1. Start dev server
npm run dev

# 2. Test admin preview
# Navigate to /admin/home-components/create/[component-name]
# Test all 6 layouts on desktop/tablet/mobile

# 3. Test frontend
# Seed component data
# Navigate to homepage
# Verify colors match preview

# 4. Contrast check
# Use Chrome DevTools \u003e Lighthouse \u003e Accessibility
```

---

## 🎯 Expected Outcome

### Before (Hiện tại)
- ❌ Inconsistent color usage across components
- ❌ Syntax errors (`\`10\`` thiếu `${}`)
- ❌ Không tuân thủ 60-30-10 rule
- ❌ Mixed primary/secondary trong cùng element type

### After (Sau khi hoàn thành)
- ✅ Đồng nhất 26 components theo dual brand system
- ✅ Primary (30%): Icons, CTAs, active states, brand elements
- ✅ Secondary (10%): Badges, accents, stats, highlights
- ✅ Neutral (60%): Backgrounds, text, surfaces
- ✅ Admin preview = Frontend render (100% consistency)
- ✅ WCAG AA compliant
- ✅ Production-ready, scalable color system

---

## 📚 References

- Skill: `.factory/skills/dual-brand-color-system/SKILL.md`
- Docs: `2026-02-14-p-d-ng-dual-brand-color-system-cho-hero-component-6-layouts.md`
- Docs: `2026-02-14-spec-p-d-ng-dual-brand-color-system-cho-stats-component-6-layouts.md`
- Material Design 3: https://m3.material.io/styles/color
- WCAG 2.2: https://www.w3.org/WAI/WCAG22/quickref/

---

## 💡 Notes

1. **Không sửa Hero và Stats** (đã hoàn thành)
2. **Ưu tiên fix syntax errors trước** (Phase 1)
3. **Pattern lặp lại**: Học từ Hero/Stats → áp dụng cho 24 components còn lại
4. **Visual weight** ≠ physical area (accent 10% có thể "nổi" hơn 30% nếu high-contrast)
5. **CTA components** (CTA, Pricing, Contact forms): Primary button có thể chiếm 30% visual weight vì là mục đích chính
6. **Accessibility first**: Luôn validate contrast trước khi ship