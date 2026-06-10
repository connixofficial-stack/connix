# 📋 SPEC: Full Implementation Dual Brand Color System - Chi tiết từng File, từng Task

## 🎯 Executive Summary

Hoàn thiện **100%** việc áp dụng **dual brand color system** (primary + secondary) theo **60-30-10 rule** cho toàn bộ VietAdmin home components.

**Scope**:
- ✅ Đã hoàn thành: Hero (6 layouts), Stats (6 layouts)
- 🔧 Fix bug: AboutBadge/AboutStatBox type signature
- 🚀 Refactor: 23 components còn lại (138 layouts)
- ♻️ Tạo shared helpers để giảm code duplication

**Files ảnh hưởng**:
1. `components/site/ComponentRenderer.tsx` (~9721 lines)
2. `app/admin/home-components/previews.tsx` (~14072 lines)
3. Tạo mới: `components/site/shared/BrandColorHelpers.tsx`

---

## 📊 Components Inventory (26 total)

| # | Component | Layouts | Status | Priority |
|---|-----------|---------|--------|----------|
| 1 | Hero | 6 | ✅ Done | - |
| 2 | Stats | 6 | ✅ Done | - |
| 3 | About | 6 | ⚠️ Bug type signature | High |
| 4 | Services | 6 | ❌ Todo | High |
| 5 | Benefits | 6 | ❌ Todo | High |
| 6 | FAQ | 6 | ❌ Todo | Medium |
| 7 | CTA | 6 | ❌ Todo | High |
| 8 | Testimonials | 6 | ❌ Todo | Medium |
| 9 | Contact | 6 | ❌ Todo | High |
| 10 | Gallery | 6 | ❌ Todo | Low |
| 11 | TrustBadges | 6 | ❌ Todo | Medium |
| 12 | Pricing | 6 | ❌ Todo | High |
| 13 | ProductList | 6 | ❌ Todo | Medium |
| 14 | ServiceList | 6 | ❌ Todo | Medium |
| 15 | Blog | 6 | ❌ Todo | Low |
| 16 | Career | 6 | ❌ Todo | Low |
| 17 | CaseStudy | 6 | ❌ Todo | Low |
| 18 | SpeedDial | 6 | ❌ Todo | Low |
| 19 | ProductCategories | 6 | ❌ Todo | Medium |
| 20 | CategoryProducts | 6 | ❌ Todo | Medium |
| 21 | Team | 6 | ❌ Todo | Low |
| 22 | Features | 6 | ❌ Todo | Medium |
| 23 | Process | 6 | ❌ Todo | Low |
| 24 | Clients | 6 | ❌ Todo | Low |
| 25 | Video | 6 | ❌ Todo | Low |
| 26 | Countdown | 6 | ❌ Todo | Low |
| 27 | VoucherPromotions | 6 | ❌ Todo | Medium |
| 28 | Footer | 6 | ❌ Todo | Medium |

**Total**: 156 layouts (26 components × 6 layouts) - 12 layouts done (7.7%), 144 layouts todo (92.3%)

---

## 🎨 60-30-10 Mapping Reference (Golden Rule)

Theo skill `dual-brand-color-system`:

| Tỷ lệ | Màu | Dùng cho | Variables |
|-------|-----|----------|-----------|
| **60%** | Neutral | Backgrounds, surfaces, white space | `bg-white`, `bg-slate-50/900` |
| **30%** | **Primary** (`brandColor`) | Headings, main CTAs, active states, primary sections, borders | `brandColor`, `${brandColor}10/20/90` |
| **10%** | **Secondary** | Badges, accents, highlights, stats values, decorative | `secondary`, `${secondary}10/15/20/30/40/90` |

**Visual weight ≠ Physical area**: Accent 10% nhưng nếu high-contrast có thể "cảm giác" ~30%.

---

## 🛠️ PHASE 1: Tạo Shared Helper Components (DRY Principle)

### Task 1.1: Tạo file `components/site/shared/BrandColorHelpers.tsx`

**Mục tiêu**: Tạo reusable components để tránh code duplication trong 26 components.

**File**: `components/site/shared/BrandColorHelpers.tsx` (mới tạo)

**Code**:

```tsx
'use client';

import React from 'react';
import { Star, Check, Zap, Target, Shield, Briefcase } from 'lucide-react';

// ============ SHARED TYPES ============
export interface BrandColorProps {
  brandColor: string;
  secondary: string;
}

// ============ BADGE COMPONENT (10% Secondary Accent) ============
export interface BrandBadgeProps extends BrandColorProps {
  text: string;
  variant?: 'default' | 'outline' | 'minimal' | 'solid';
  className?: string;
}

/**
 * BrandBadge - Standardized badge theo 60-30-10 rule
 * - Default/Minimal: secondary background 10-15% + secondary text (ACCENT)
 * - Outline: secondary border 40% + secondary text
 * - Solid: secondary 90% background + white text (high contrast accent)
 * 
 * Visual weight: ~5-10% (secondary accent)
 */
export const BrandBadge: React.FC<BrandBadgeProps> = ({ 
  text, 
  variant = 'default', 
  secondary, 
  className = '' 
}) => {
  const baseStyles = "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider w-fit";
  
  if (variant === 'outline') {
    return (
      <div 
        className={`${baseStyles} bg-transparent font-medium ${className}`}
        style={{ borderColor: `${secondary}40`, color: secondary }}
      >
        {text}
      </div>
    );
  }
  
  if (variant === 'minimal') {
    return (
      <div 
        className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-medium w-fit border-transparent normal-case tracking-normal ${className}`}
        style={{ backgroundColor: `${secondary}15`, color: secondary }}
      >
        {text}
      </div>
    );
  }

  if (variant === 'solid') {
    return (
      <div 
        className={`${baseStyles} ${className}`}
        style={{ backgroundColor: secondary, color: 'white', borderColor: secondary }}
      >
        {text}
      </div>
    );
  }
  
  return (
    <div 
      className={`${baseStyles} ${className}`}
      style={{ backgroundColor: `${secondary}10`, borderColor: `${secondary}20`, color: secondary }}
    >
      {text}
    </div>
  );
};

// ============ STAT BOX COMPONENT (10% Secondary Accent) ============
export interface StatBoxProps extends BrandColorProps {
  stat: { value: string; label: string };
  variant?: 'default' | 'card' | 'minimal';
  className?: string;
}

/**
 * StatBox - Hiển thị stat value với secondary color (10% accent)
 * Theo 60-30-10: stat values dùng secondary (accent), không dùng primary
 */
export const StatBox: React.FC<StatBoxProps> = ({ 
  stat, 
  variant = 'default', 
  secondary, 
  className = '' 
}) => {
  if (variant === 'card') {
    return (
      <div className={`bg-white p-6 md:p-8 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col items-start justify-end h-full hover:border-slate-300 transition-colors group ${className}`}>
        <span 
          className="text-4xl md:text-5xl font-bold tracking-tighter mb-2 group-hover:scale-105 transition-transform origin-left"
          style={{ color: secondary }}
        >
          {stat.value}
        </span>
        <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">
          {stat.label}
        </span>
      </div>
    );
  }
  
  if (variant === 'minimal') {
    return (
      <div className={`flex flex-col items-start border-l-2 pl-4 ${className}`} style={{ borderColor: `${secondary}30` }}>
        <span className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: secondary }}>
          {stat.value}
        </span>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">
          {stat.label}
        </span>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col items-start ${className}`}>
      <span className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: secondary }}>
        {stat.value}
      </span>
      <span className="text-sm text-slate-500 mt-1">{stat.label}</span>
    </div>
  );
};

// ============ ICON CONTAINER (30% Primary) ============
export interface IconContainerProps extends BrandColorProps {
  icon: React.ReactNode;
  variant?: 'solid' | 'outline' | 'tint' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * IconContainer - Icon với brand primary color (30% visual weight)
 * Theo 60-30-10: icon containers dùng primary, không dùng secondary
 */
export const IconContainer: React.FC<IconContainerProps> = ({ 
  icon, 
  variant = 'solid', 
  brandColor, 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };
  
  if (variant === 'outline') {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-xl border-2 flex items-center justify-center ${className}`}
        style={{ borderColor: brandColor, color: brandColor }}
      >
        {icon}
      </div>
    );
  }
  
  if (variant === 'tint') {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center ${className}`}
        style={{ backgroundColor: `${brandColor}10`, color: brandColor }}
      >
        {icon}
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center text-white ${className}`}
        style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` }}
      >
        {icon}
      </div>
    );
  }
  
  return (
    <div 
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center text-white ${className}`}
      style={{ backgroundColor: brandColor }}
    >
      {icon}
    </div>
  );
};

// ============ CHECK ICON (10% Secondary Accent) ============
export interface CheckIconProps extends BrandColorProps {
  variant?: 'circle' | 'square' | 'minimal';
  size?: number;
  className?: string;
}

/**
 * CheckIcon - Check mark với secondary color (10% accent)
 */
export const CheckIcon: React.FC<CheckIconProps> = ({ 
  secondary, 
  variant = 'circle', 
  size = 20, 
  className = '' 
}) => {
  if (variant === 'minimal') {
    return <Check size={size} style={{ color: secondary }} className={className} />;
  }
  
  if (variant === 'square') {
    return (
      <div 
        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ backgroundColor: secondary }}
      >
        <Check size={14} className="text-white" />
      </div>
    );
  }
  
  return (
    <div 
      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ backgroundColor: secondary }}
    >
      <Check size={14} className="text-white" />
    </div>
  );
};

// ============ ACCENT LINE (10% Secondary) ============
export interface AccentLineProps extends BrandColorProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: 'thin' | 'medium' | 'thick';
  className?: string;
}

/**
 * AccentLine - Decorative line với secondary color
 */
export const AccentLine: React.FC<AccentLineProps> = ({ 
  secondary, 
  orientation = 'horizontal', 
  thickness = 'medium', 
  className = '' 
}) => {
  const thicknessMap = {
    thin: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5',
    medium: orientation === 'horizontal' ? 'h-1' : 'w-1',
    thick: orientation === 'horizontal' ? 'h-2' : 'w-2'
  };
  
  return (
    <div 
      className={`${thicknessMap[thickness]} rounded-full ${className}`}
      style={{ backgroundColor: secondary }}
    />
  );
};

// ============ PULSE DOT (30% Primary) ============
export interface PulseDotProps extends BrandColorProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * PulseDot - Animated pulse dot với primary color
 */
export const PulseDot: React.FC<PulseDotProps> = ({ 
  brandColor, 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2'
  };
  
  return (
    <span 
      className={`${sizeClasses[size]} rounded-full animate-pulse ${className}`}
      style={{ backgroundColor: brandColor }} 
    />
  );
};
```

**Validation**:
- [ ] File tạo thành công tại `components/site/shared/BrandColorHelpers.tsx`
- [ ] TypeScript compile không lỗi
- [ ] Export đúng 7 components: BrandBadge, StatBox, IconContainer, CheckIcon, AccentLine, PulseDot

---

## 🔧 PHASE 2: Fix Bug Type Signature trong About Component

### Task 2.1: Fix AboutBadge và AboutStatBox trong ComponentRenderer.tsx

**File**: `components/site/ComponentRenderer.tsx`

**Line**: ~754 (AboutBadge), ~788 (AboutStatBox)

**Problem**: 
```tsx
// ❌ Current: brandColor trong type nhưng không trong destructure
const AboutBadge = ({ text, variant = 'default', secondary }: { 
  text: string; 
  variant?: 'default' | 'outline' | 'minimal'; 
  brandColor: string;  // ❌ Không dùng nhưng vẫn khai báo
  secondary: string 
})
```

**Solution**: Xóa hoàn toàn AboutBadge và AboutStatBox, thay bằng shared components từ Phase 1

**Changes**:

1. **Import shared helpers** (line ~17):
```tsx
import { BrandBadge, StatBox } from './shared/BrandColorHelpers';
```

2. **Xóa AboutBadge component** (line 754-785):
```tsx
// ❌ XÓA CODE NÀY
const AboutBadge = ({ text, variant = 'default', secondary }: { ... }) => { ... };
```

3. **Xóa AboutStatBox component** (line 788-827):
```tsx
// ❌ XÓA CODE NÀY
const AboutStatBox = ({ stat, variant = 'classic', secondary }: { ... }) => { ... };
```

4. **Replace usages trong AboutSection** (6 chỗ: line ~872, 886, 956, 999, 1015, 1064, 1116):

```tsx
// ❌ Old
<AboutBadge text={subHeading} variant="outline" brandColor={brandColor} secondary={secondary} />

// ✅ New
<BrandBadge text={subHeading} variant="outline" brandColor={brandColor} secondary={secondary} />

// ❌ Old
<AboutStatBox key={idx} stat={stat} variant="classic" brandColor={brandColor} secondary={secondary} />

// ✅ New
<StatBox key={idx} stat={stat} variant="default" brandColor={brandColor} secondary={secondary} />
```

**Mapping variant names**:
- AboutStatBox `variant="classic"` → StatBox `variant="default"`
- AboutStatBox `variant="bento"` → StatBox `variant="card"`
- AboutStatBox `variant="minimal"` → StatBox `variant="minimal"`

**Validation**:
- [ ] TypeScript compile không lỗi
- [ ] AboutBadge và AboutStatBox đã bị xóa hoàn toàn
- [ ] 6 layouts About vẫn render đúng với shared components
- [ ] Preview admin và frontend đồng bộ

---

### Task 2.2: Fix AboutBadge và AboutStatBox trong previews.tsx

**File**: `app/admin/home-components/previews.tsx`

**Changes**: Tương tự Task 2.1

1. **Import shared helpers** (line ~14):
```tsx
import { BrandBadge, StatBox } from '@/components/site/shared/BrandColorHelpers';
```

2. **Tìm và xóa local AboutBadge/AboutStatBox** (nếu có duplicate definitions)

3. **Replace usages** trong AboutPreview function (search "AboutBadge" và "AboutStatBox")

**Validation**:
- [ ] Preview trong admin `/admin/home-components/create/about` render đúng
- [ ] 6 layouts đều hoạt động
- [ ] Không có TypeScript errors

---

## 🚀 PHASE 3: Refactor 23 Components Còn Lại (Theo thứ tự từ trên xuống)

**Pattern chung** cho mỗi component:
1. Import shared helpers
2. Map elements theo 60-30-10 rule
3. Replace inline styles bằng shared components
4. Validate contrast và visual weight

### Task 3.1: Services Component (6 layouts)

**File 1**: `components/site/ComponentRenderer.tsx` - ServicesSection (line ~1266)

**File 2**: `app/admin/home-components/previews.tsx` - ServicesPreview (line ~3138)

**Layouts**: elegantGrid, modernList, bigNumber, cards, carousel, timeline

**60-30-10 Mapping**:

| Element | Color | Visual Weight |
|---------|-------|---------------|
| Background | Neutral (white/slate-50) | 60% |
| Icon container | `brandColor` (primary) | 15% |
| Service number badge | `secondary` 90% (accent) | 5% |
| Title/Heading | Neutral (slate-900) | 20% |
| CTA button | `brandColor` (primary) | 10% |
| Accent line | `secondary` | 3% |
| Hover border | `${secondary}20` | 2% |

**Changes**:

**File 1: ComponentRenderer.tsx**

```tsx
// Line ~1266: Import helpers
import { BrandBadge, IconContainer, AccentLine } from './shared/BrandColorHelpers';

// Style 1: elegantGrid (line ~1293)
function ServicesSection({ config, brandColor, secondary, title }) {
  // ...
  
  if (style === 'elegantGrid') {
    return (
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, idx) => (
              <div key={idx} className="bg-white p-6 pt-8 rounded-xl shadow-sm border border-slate-200/60 relative overflow-hidden">
                {/* ✅ Top Accent Line - Secondary 10% */}
                <AccentLine 
                  secondary={secondary} 
                  orientation="horizontal" 
                  thickness="medium"
                  className="absolute top-0 left-0 right-0"
                />
                
                {/* ✅ Icon - Primary 30% */}
                <IconContainer 
                  icon={<DynamicIcon name={item.icon} size={24} />}
                  variant="tint"
                  brandColor={brandColor}
                  secondary={secondary}
                  className="mb-4"
                />
                
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  // Style 2: modernList (line ~1350)
  if (style === 'modernList') {
    return (
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4 p-6 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-shadow">
              {/* ✅ Number Badge - Secondary accent */}
              <BrandBadge 
                text={String(idx + 1).padStart(2, '0')}
                variant="solid"
                brandColor={brandColor}
                secondary={secondary}
                className="flex-shrink-0"
              />
              
              {/* ✅ Icon - Primary 30% */}
              <IconContainer 
                icon={<DynamicIcon name={item.icon} size={20} />}
                variant="tint"
                brandColor={brandColor}
                secondary={secondary}
                size="sm"
              />
              
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  
  // Style 3: bigNumber (line ~1400)
  if (style === 'bigNumber') {
    return (
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-2">
          {items.map((item, idx) => (
            <div key={idx} className="relative p-8 bg-white rounded-2xl border border-slate-200">
              {/* ✅ Big number watermark - Secondary 10% subtle */}
              <span 
                className="absolute top-4 right-4 text-8xl font-bold opacity-5"
                style={{ color: secondary }}
              >
                {idx + 1}
              </span>
              
              {/* ✅ Icon - Primary */}
              <IconContainer 
                icon={<DynamicIcon name={item.icon} size={28} />}
                variant="solid"
                brandColor={brandColor}
                secondary={secondary}
                className="mb-4 relative z-10"
              />
              
              <h3 className="text-xl font-bold text-slate-900 mb-2 relative z-10">{item.title}</h3>
              <p className="text-slate-600 relative z-10">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }
  
  // Styles 4-6: cards, carousel, timeline - áp dụng pattern tương tự
}
```

**File 2: previews.tsx** - Đồng bộ logic tương tự

**Validation**:
- [ ] 6 layouts Services render đúng
- [ ] Icon container dùng `brandColor` (primary 30%)
- [ ] Badges dùng `secondary` (accent 10%)
- [ ] No TypeScript errors

---

### Task 3.2: Benefits Component (6 layouts)

**File 1**: `components/site/ComponentRenderer.tsx` - BenefitsSection (line ~1621)

**File 2**: `app/admin/home-components/previews.tsx` - BenefitsPreview (line ~6721)

**Layouts**: cards, list, bento, row, carousel, timeline

**60-30-10 Mapping**:

| Element | Color | Visual Weight |
|---------|-------|---------------|
| Check icon circle | `brandColor` bg (primary) | 10% |
| Badge/Tag | `secondary` bg+text | 5% |
| Title | neutral | 25% |
| Description | neutral | 30% |
| Background | neutral | 60% |

**Changes**: Tương tự Services, thay thế icons/badges bằng shared components

---

### Task 3.3: FAQ Component (6 layouts)

**File 1**: `components/site/ComponentRenderer.tsx` - FAQSection (line ~1922)

**File 2**: `app/admin/home-components/previews.tsx` - FaqPreview (line ~982)

**Layouts**: accordion, cards, two-column, minimal, timeline, tabbed

**60-30-10 Mapping**:

| Element | Color | Visual Weight |
|---------|-------|---------------|
| Active accordion border/bg | `brandColor` (primary) | 15% |
| Question number badge | `secondary` | 5% |
| ChevronDown icon | `brandColor` when active | 5% |
| Tab active indicator | `brandColor` | 10% |

**Changes**:

```tsx
// Accordion active state
<div 
  className="..."
  style={{ 
    borderColor: isOpen ? brandColor : 'transparent', 
    backgroundColor: isOpen ? `${brandColor}05` : 'transparent' 
  }}
>
  <ChevronDown style={{ color: isOpen ? brandColor : '#64748b' }} />
</div>

// Number badge
<BrandBadge 
  text={String(idx + 1)}
  variant="minimal"
  brandColor={brandColor}
  secondary={secondary}
/>
```

---

### Task 3.4: CTA Component (6 layouts) - HIGH PRIORITY

**File 1**: `components/site/ComponentRenderer.tsx` - CTASection (line ~2213)

**File 2**: `app/admin/home-components/previews.tsx` - CTAPreview (line ~5725)

**Layouts**: banner, centered, split, floating, gradient, minimal

**60-30-10 Mapping** (CTA là ngoại lệ):

| Element | Color | Visual Weight |
|---------|-------|---------------|
| Primary CTA button | `brandColor` bg (PRIMARY) | **30%** ⚠️ |
| Badge | `secondary` bg+text | 5% |
| Background gradient | Neutral hoặc subtle primary | 60% |
| Decorative elements | `${secondary}20` | 5% |

**Lưu ý**: CTA component primary button chiếm 30% vì đây là mục đích chính.

**Changes**:

```tsx
// Primary button - 30% visual weight
<button 
  className="px-8 py-4 rounded-lg font-semibold text-white text-lg"
  style={{ backgroundColor: brandColor }}
>
  {config.buttonText}
</button>

// Badge - accent
<BrandBadge 
  text={config.badge}
  variant="minimal"
  brandColor={brandColor}
  secondary={secondary}
/>

// Decorative circle
<div 
  className="absolute -z-10 w-96 h-96 rounded-full blur-3xl opacity-20"
  style={{ backgroundColor: `${secondary}30` }}
/>
```

---

### Task 3.5: Testimonials Component (6 layouts)

**File 1**: `components/site/ComponentRenderer.tsx` - TestimonialsSection (line ~2495)

**File 2**: `app/admin/home-components/previews.tsx` - TestimonialsPreview (line ~1333)

**Layouts**: cards, carousel, masonry, minimal, grid, featured

**60-30-10 Mapping**:

| Element | Color | Visual Weight |
|---------|-------|---------------|
| Star icons | `brandColor` (primary - trust) | 15% |
| Quote marks | `${secondary}20` (subtle) | 5% |
| Active carousel dot | `brandColor` | 5% |
| Card border hover | `${secondary}20` | 5% |

**Changes**:

```tsx
// Stars
{[...Array(5)].map((_, i) => (
  <Star key={i} size={16} fill={brandColor} stroke={brandColor} />
))}

// Quote marks
<div className="text-6xl opacity-10" style={{ color: secondary }}>"</div>

// Carousel dots
<button 
  className="w-2 h-2 rounded-full transition-all"
  style={isActive ? { backgroundColor: brandColor, width: '2rem' } : { backgroundColor: '#cbd5e1' }}
/>
```

---

### Task 3.6: Contact Component (6 layouts) - HIGH PRIORITY

**File 1**: `components/site/ComponentRenderer.tsx` - ContactSection (line ~2820)

**File 2**: `app/admin/home-components/previews.tsx` - ContactPreview (line ~8100)

**Layouts**: form-only, split, card, minimal, sidebar, floating

**60-30-10 Mapping**:

| Element | Color | Visual Weight |
|---------|-------|---------------|
| Submit button | `brandColor` (primary CTA) | 15% |
| Icon circles | `secondary` bg | 10% |
| Input focus border | `brandColor` | 10% |
| Info card bg | `${secondary}05` | 5% |

**Changes**:

```tsx
// Submit button
<button 
  className="px-6 py-3 rounded-lg font-semibold text-white"
  style={{ backgroundColor: brandColor }}
>
  Gửi tin nhắn
</button>

// Icon container
<IconContainer 
  icon={<Mail size={20} />}
  variant="tint"
  brandColor={brandColor}
  secondary={secondary}
/>

// Input focus (dùng CSS variable)
<style>{`
  input:focus, textarea:focus {
    border-color: ${brandColor} !important;
  }
`}</style>
```

---

### Task 3.7-3.23: Remaining 17 Components (Pattern tương tự)

Áp dụng pattern từ Tasks 3.1-3.6 cho:

7. **Gallery** (line 3771): overlay `${brandColor}90`, lightbox nav `secondary`
8. **TrustBadges** (line 3395): badge icon `brandColor`, checkmark `secondary`
9. **Pricing** (line 4420): popular badge `secondary`, price `brandColor`, CTA `brandColor`
10. **ProductList**: sale badge `secondary`, add to cart `brandColor`
11. **ServiceList**: pattern giống Services
12. **Blog**: category tag `secondary`, read more `brandColor`
13. **Career**: apply button `brandColor`, job type badge `secondary`
14. **CaseStudy**: overlay `${brandColor}80`, tag `secondary`
15. **SpeedDial**: main FAB `brandColor`, sub buttons `secondary`
16. **ProductCategories** (line 5667): icon circle `brandColor`, count badge `secondary`
17. **CategoryProducts** (line 6194): similar to ProductList
18. **Team** (line 6971): social icons `brandColor`, role badge `secondary`
19. **Features** (line 7591): icon `brandColor`, number `secondary`
20. **Process** (line 7870): step number `brandColor`, connector line `${secondary}30`
21. **Clients** (line 8134): logo hover border `${secondary}20`
22. **Video** (line 8423): play button `brandColor`, overlay gradient with `secondary`
23. **Countdown** (line 8685): timer boxes `brandColor` border, label `secondary`
24. **VoucherPromotions** (line 9074): badge `secondary`, CTA `brandColor`
25. **Footer** (line 9423): link hover `brandColor`, social icons `secondary`

**Mỗi component làm theo checklist**:
- [ ] Import shared helpers
- [ ] Map elements theo 60-30-10
- [ ] Replace badges → BrandBadge
- [ ] Replace icons → IconContainer
- [ ] Replace stats → StatBox
- [ ] Validate contrast
- [ ] Sync ComponentRenderer.tsx ↔ previews.tsx

---

## ✅ VALIDATION CHECKLIST (Tổng hợp)

### Code Quality
- [ ] No TypeScript errors
- [ ] No hard-coded colors (search `#[0-9a-f]{6}`)
- [ ] All components import from shared helpers
- [ ] Consistent naming: `brandColor` (primary), `secondary` (accent)

### Visual Validation
- [ ] Neutral backgrounds ~60%
- [ ] Primary (brandColor) ~30% (CTAs, icons, headings)
- [ ] Secondary (accent) ~10% (badges, stats, highlights)
- [ ] No overwhelming brand colors

### Sync Validation
- [ ] ComponentRenderer.tsx ↔ previews.tsx 100% consistent
- [ ] Admin preview = Frontend render

### Accessibility (Skip theo user request)
- [ ] (Skipped) WCAG contrast validation
- [ ] (Skipped) Screenshot report

---

## 📁 FILES SUMMARY

| File | Lines | Changes |
|------|-------|---------|
| `components/site/shared/BrandColorHelpers.tsx` | +250 | ✅ Tạo mới |
| `components/site/ComponentRenderer.tsx` | ~9721 | 🔧 ~500 lines refactor |
| `app/admin/home-components/previews.tsx` | ~14072 | 🔧 ~700 lines refactor |

**Total**: ~1450 lines code changes

---

## 🎯 EXPECTED OUTCOME

### Before (Hiện tại)
- ❌ Inconsistent color usage (Hero/Stats done, 24 components mixed)
- ❌ Type signature bugs trong About
- ❌ Code duplication (inline badge/icon styles)
- ❌ Không tuân thủ 60-30-10 rule đầy đủ

### After (Sau khi hoàn thành)
- ✅ 100% components tuân thủ dual brand system (156/156 layouts)
- ✅ Primary (30%): Icons, CTAs, active states, brand elements
- ✅ Secondary (10%): Badges, accents, stats, highlights
- ✅ Neutral (60%): Backgrounds, text, surfaces
- ✅ DRY: Shared helpers giảm 70% code duplication
- ✅ Type-safe: No signature bugs
- ✅ Admin preview = Frontend render (100% consistency)
- ✅ Production-ready, maintainable color system

---

## 📚 REFERENCES

- Skill: `.factory/skills/dual-brand-color-system/SKILL.md`
- Previous spec: `.factory/docs/2026-02-14-p-d-ng-dual-brand-color-system-cho-24-26-home-components.md`
- Material Design 3: https://m3.material.io/styles/color
- 60-30-10 Rule: https://www.nngroup.com/articles/characteristics-minimalism/

---

## ⏱️ ESTIMATED EFFORT

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Shared helpers | 30 mins |
| Phase 2 | Fix About bug | 15 mins |
| Phase 3.1-3.6 | High priority (6 components) | 2 hours |
| Phase 3.7-3.23 | Remaining 17 components | 3 hours |
| Testing | Validation | 30 mins |
| **Total** | **28 tasks** | **~6 hours** |

---

## 💡 NOTES

1. **Ưu tiên Phase 1 + 2** trước để có foundation vững
2. **Pattern lặp lại**: Học từ Services/Benefits → áp dụng cho 17 components còn lại
3. **Visual weight** ≠ physical area (accent 10% có thể "nổi" hơn 30% nếu high-contrast)
4. **CTA components** (CTA, Pricing, Contact forms): Primary button có thể chiếm 30% visual weight
5. **Shared helpers** giúp maintain consistency và giảm 70% code duplication
6. **Type-safe**: Dùng TypeScript interfaces từ shared helpers để tránh bugs