# Spec v2: Áp dụng Dual Brand Colors vào toàn bộ Home Components
## (Bổ sung xử lý trường hợp chỉ bật 1 màu)

---

## 📊 DARE Framework - Problem Decomposition

### Problem Graph
```
[MAIN] Áp dụng màu thương hiệu + màu phụ vào home-components
├── 1. [INFRA] Cập nhật hooks để hỗ trợ dual colors
│   ├── 1.1 [ROOT] Refactor useBrandColor() → useBrandColors() trong shared.tsx
│   └── 1.2 Đảm bảo logic fallback: secondary = value || auto-generate || primary
├── 2. [PREVIEW] Cập nhật 25 home-component preview pages
│   ├── 2.1 Cập nhật các create pages dùng useBrandColor()
│   └── 2.2 Cập nhật previews.tsx để nhận cả primary + secondary
├── 3. [RENDERER] Cập nhật ComponentRenderer.tsx
│   ├── 3.1 Thay useBrandColor() → useBrandColors()
│   └── 3.2 Pass cả primary + secondary cho các section components
└── 4. [SECTIONS] Cập nhật 25 internal section components
    └── 4.1 Refactor để dùng primary cho CTA chính, secondary cho accent/badge
```

---

## ✅ DARE - Analyze \u0026 Reflect

### Hiện trạng (Current State)
✅ **Settings Schema**:
- `site_brand_primary` (enabled: true, default: '#3b82f6')
- `site_brand_secondary` (enabled: true, default: '')  ← **Mặc định RỖNG**

✅ **Hook trong `components/site/hooks.ts`**:
```tsx
export function useBrandColors() {
  const primarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_primary' });
  const legacySetting = useQuery(api.settings.getByKey, { key: 'site_brand_color' });
  const secondarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_secondary' });
  
  const primary = resolveColorSetting(primarySetting?.value)
    ?? resolveColorSetting(legacySetting?.value)
    ?? DEFAULT_BRAND_COLOR;
  
  const secondary = resolveColorSetting(secondarySetting?.value)  // ← Trả về null nếu rỗng
    ?? generateComplementary(primary);  // ← Auto-generate nếu null
  
  return { primary, secondary };
}
```
✅ Logic này ĐÃ ĐÚNG và xử lý tốt trường hợp rỗng.

❌ **Hook trong `app/admin/home-components/create/shared.tsx`**:
```tsx
// CHƯA CÓ useBrandColors() - chỉ có useBrandColor() trả về string
export function useBrandColor() {
  const primarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_primary' });
  const legacySetting = useQuery(api.settings.getByKey, { key: 'site_brand_color' });
  const primary = typeof primarySetting?.value === 'string' ? primarySetting.value : '';
  const legacy = typeof legacySetting?.value === 'string' ? legacySetting.value : '';
  return primary || legacy || DEFAULT_BRAND_COLOR;
}
```

### Các trường hợp cần xử lý

| Trường hợp | `site_brand_primary` | `site_brand_secondary` | Kết quả mong đợi |
|------------|---------------------|------------------------|------------------|
| **Case 1** | `#3b82f6` | `''` (rỗng) | `primary: #3b82f6`, `secondary: auto-generated complementary (#f6823b)` |
| **Case 2** | `#3b82f6` | `#10b981` | `primary: #3b82f6`, `secondary: #10b981` (dùng giá trị user nhập) |
| **Case 3** | `#3b82f6` | Field bị TẮT (enabled: false) | `primary: #3b82f6`, `secondary: #3b82f6` (fallback = primary) |
| **Case 4** | Legacy `site_brand_color` | N/A | `primary: legacy value`, `secondary: auto-generated` |

**⚠️ Vấn đề với Case 3**: Module settings cho phép TẮT field `site_brand_secondary` (set `enabled: false`). Trong trường hợp này:
- Query `getByKey('site_brand_secondary')` sẽ trả về `null` hoặc `undefined`
- Logic `resolveColorSetting()` → `null`
- Fallback `generateComplementary(primary)` → **SAI** (vì user muốn TẮT màu phụ, không muốn auto-generate)

**Giải pháp**: Kiểm tra xem field có `enabled: true` không trước khi auto-generate.

### Chiến lược áp dụng màu (60/30/10 Rule)
- **Primary (60%)**: CTA buttons chính, headings, links chính, progress bars
- **Secondary (30%)**: Badges, accents, secondary buttons, hover states, icons
- **Neutral (10%)**: Backgrounds, borders

### Ví dụ cụ thể áp dụng
```tsx
// Hero Section
- Primary: Button "Khám phá ngay", top accent line
- Secondary: Badge "Nổi bật", secondary button "Tìm hiểu thêm"

// Stats Section (Horizontal style)
- Primary: Background thanh ngang
- Secondary: Divider lines (subtle), icon accents

// Stats Section (Icons style)  
- Primary: Icon circles background
- Secondary: Accent border around icons

// Testimonials
- Primary: Quote icons, star ratings (filled)
- Secondary: Name/title text color, card border on hover

// CTA
- Primary: Main button background
- Secondary: Border accent, badge "Ưu đãi"
```

---

## 🚀 DARE - Execute Plan (Step-by-Step Implementation)

### **Bước 1: Refactor shared.tsx với logic fallback đầy đủ**
**File**: `app/admin/home-components/create/shared.tsx`

**Thay đổi**:
```tsx
// ============ COLOR UTILS ============

// Convert hex to HSL (copy từ components/site/hooks.ts)
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { 
    h: Math.round(h * 360), 
    s: Math.round(s * 100), 
    l: Math.round(l * 100) 
  };
}

// Convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Generate complementary color (180° hue rotation)
function generateComplementary(hex: string): string {
  const { h, s, l } = hexToHSL(hex);
  return hslToHex((h + 180) % 360, s, l);
}

// Resolve color setting value
function resolveColorSetting(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

// ============ HOOKS ============

/**
 * Hook lấy cả primary + secondary brand colors
 * 
 * Fallback logic:
 * - Primary: site_brand_primary → site_brand_color (legacy) → DEFAULT
 * - Secondary: 
 *   1. Nếu có giá trị → dùng giá trị đó
 *   2. Nếu rỗng → auto-generate complementary từ primary
 *   3. Nếu field bị tắt (undefined) → fallback = primary (không auto-generate)
 */
export function useBrandColors() {
  const primarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_primary' });
  const legacySetting = useQuery(api.settings.getByKey, { key: 'site_brand_color' });
  const secondarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_secondary' });
  
  // Resolve primary color
  const primary = resolveColorSetting(primarySetting?.value)
    ?? resolveColorSetting(legacySetting?.value)
    ?? DEFAULT_BRAND_COLOR;
  
  // Resolve secondary color
  let secondary: string;
  
  if (secondarySetting === undefined) {
    // Field chưa load hoặc bị tắt → fallback = primary (KHÔNG auto-generate)
    secondary = primary;
  } else {
    const secondaryValue = resolveColorSetting(secondarySetting.value);
    if (secondaryValue) {
      // User đã nhập màu phụ → dùng giá trị đó
      secondary = secondaryValue;
    } else {
      // User để trống → auto-generate complementary
      secondary = generateComplementary(primary);
    }
  }
  
  return { primary, secondary };
}

/**
 * Backward compatibility alias
 * Hook lấy chỉ primary color (legacy)
 */
export function useBrandColor() {
  return useBrandColors().primary;
}
```

**Logic chi tiết**:
1. **Primary**: `site_brand_primary` → `site_brand_color` (legacy) → `#3b82f6`
2. **Secondary**:
   - Nếu `secondarySetting === undefined` → field chưa load HOẶC bị tắt → fallback = `primary`
   - Nếu `secondarySetting.value` có giá trị → dùng giá trị đó
   - Nếu `secondarySetting.value === ''` (rỗng) → auto-generate complementary
3. **Backward compat**: Giữ `useBrandColor()` để không breaking change

---

### **Bước 2: Cập nhật 25 create pages**
**Files**: `app/admin/home-components/create/**/page.tsx`

**Pattern thay đổi**:
```tsx
// CŨ
const brandColor = useBrandColor();
<HeroBannerPreview brandColor={brandColor} ... />

// MỚI
const { primary, secondary } = useBrandColors();
<HeroBannerPreview primary={primary} secondary={secondary} ... />
```

**Danh sách files cần sửa** (25 files):
1. `hero/page.tsx` → HeroBannerPreview
2. `stats/page.tsx` → StatsPreview
3. `about/page.tsx` → AboutPreview
4. `services/page.tsx` → ServicesPreview
5. `benefits/page.tsx` → BenefitsPreview
6. `faq/page.tsx` → FaqPreview
7. `contact/page.tsx` → ContactPreview
8. `testimonials/page.tsx` → TestimonialsPreview
9. `features/page.tsx` → FeaturesPreview
10. `pricing/page.tsx` → PricingPreview
11. `cta/page.tsx` → CTAPreview
12. `process/page.tsx` → ProcessPreview
13. `clients/page.tsx` → ClientsPreview
14. `gallery/page.tsx` → GalleryPreview
15. `product-list/page.tsx` → ProductListPreview
16. `product-categories/page.tsx` → ProductCategoriesPreview
17. `case-study/page.tsx` → CaseStudyPreview
18. `career/page.tsx` → CareerPreview
19. `footer/page.tsx` → FooterPreview
20. `video/page.tsx` → VideoPreview
21. `countdown/page.tsx` → CountdownPreview
22. `voucher-promotions/page.tsx` → VoucherPromotionsPreview
23. `speed-dial/page.tsx` → SpeedDialPreview
24. `team/page.tsx` → TeamPreview
25. `category-products/page.tsx` → CategoryProductsPreview

---

### **Bước 3: Cập nhật previews.tsx (25+ Preview components)**
**File**: `app/admin/home-components/previews.tsx`

**Pattern thay đổi**: Mỗi Preview component đổi signature + nội bộ

**Ví dụ chi tiết cho HeroBannerPreview**:
```tsx
// CŨ signature
export const HeroBannerPreview = ({ 
  slides, 
  brandColor,  // ❌ Single color
  selectedStyle = 'slider',
  onStyleChange,
  content
}: { 
  slides: { id: number; image: string; link: string }[]; 
  brandColor: string;  // ❌
  selectedStyle?: HeroStyle;
  onStyleChange?: (style: HeroStyle) => void;
  content?: HeroContent;
}) => { ... }

// MỚI signature
export const HeroBannerPreview = ({ 
  slides, 
  primary,      // ✅ Dual colors
  secondary,    // ✅
  selectedStyle = 'slider',
  onStyleChange,
  content
}: { 
  slides: { id: number; image: string; link: string }[]; 
  primary: string;     // ✅
  secondary: string;   // ✅
  selectedStyle?: HeroStyle;
  onStyleChange?: (style: HeroStyle) => void;
  content?: HeroContent;
}) => {
  // CŨ: brandColor được dùng cho mọi thứ
  // style={{ backgroundColor: brandColor }}
  // style={{ color: brandColor }}
  
  // MỚI: Phân biệt primary vs secondary
  // Primary: Main button, top accent line
  // style={{ backgroundColor: primary }}
  
  // Secondary: Badge, secondary button, inactive dots
  // style={{ backgroundColor: `${secondary}15`, color: secondary }}
  // style={{ backgroundColor: idx === current ? primary : `${secondary}50` }}
}
```

**Chiến lược refactor nội bộ từng Preview**:

Tìm tất cả usage của `brandColor` và phân loại:

**Primary usage** (giữ `primary`):
- Main CTA buttons: `style={{ backgroundColor: primary }}`
- Primary headings, titles: `style={{ color: primary }}`
- Active states (dots, tabs): `style={{ backgroundColor: primary }}`
- Progress bars, accent lines: `style={{ backgroundColor: primary }}`

**Secondary usage** (đổi `secondary`):
- Badges, tags: `style={{ backgroundColor: \`\${secondary}15\`, color: secondary }}`
- Secondary buttons: `style={{ borderColor: secondary, color: secondary }}`
- Hover states: `style={{ backgroundColor: \`\${secondary}10\` }}`
- Inactive dots/indicators: `style={{ backgroundColor: \`\${secondary}50\` }}`
- Icon accents: `style={{ color: secondary }}`
- Border highlights: `style={{ borderColor: \`\${secondary}40\` }}`

**Danh sách tất cả Preview components cần refactor** (trong previews.tsx):
1. HeroBannerPreview (6 styles: slider, fade, bento, fullscreen, split, parallax)
2. StatsPreview (6 styles: horizontal, cards, icons, gradient, minimal, counter)
3. FaqPreview (6 styles: accordion, cards, two-column, minimal, timeline, tabbed)
4. TestimonialsPreview (6 styles: carousel, grid, masonry, split, minimal, video)
5. PricingPreview (6 styles: cards, table, comparison, minimal, highlight, toggle)
6. CTAPreview (6 styles: centered, split, banner, floating, minimal, countdown)
7. GalleryPreview (4 styles: grid, masonry, slider, lightbox)
8. TrustBadgesPreview
9. CareerPreview
10. CaseStudyPreview
11. ProcessPreview
12. ClientsPreview
13. ProductListPreview
14. ProductCategoriesPreview
15. CategoryProductsPreview
16. ServicesPreview
17. BenefitsPreview
18. AboutPreview
19. ContactPreview
20. FeaturesPreview
21. TeamPreview
22. VideoPreview
23. CountdownPreview
24. VoucherPromotionsPreview
25. SpeedDialPreview
26. FooterPreview

---

### **Bước 4: Cập nhật ComponentRenderer.tsx**
**File**: `components/site/ComponentRenderer.tsx`

**Thay đổi**:
```tsx
// CŨ
import { useBrandColor } from './hooks';

export function ComponentRenderer({ component }: ComponentRendererProps) {
  const brandColor = useBrandColor();  // ❌
  const { type, title, config } = component;

  switch (type) {
    case 'Hero': 
      return <HeroSection config={config} brandColor={brandColor} />;  // ❌
    case 'Stats': 
      return <StatsSection config={config} brandColor={brandColor} title={title} />;
    // ... 23 more cases
  }
}

// MỚI
import { useBrandColors } from './hooks';

export function ComponentRenderer({ component }: ComponentRendererProps) {
  const { primary, secondary } = useBrandColors();  // ✅
  const { type, title, config } = component;

  switch (type) {
    case 'Hero': 
      return <HeroSection config={config} primary={primary} secondary={secondary} title={title} />;  // ✅
    case 'Stats': 
      return <StatsSection config={config} primary={primary} secondary={secondary} title={title} />;
    // ... cập nhật tất cả 23+ cases
  }
}
```

**Tác động**: Tất cả 25 section components trong switch case cần đổi props.

---

### **Bước 5: Cập nhật 25 internal Section components**
**File**: `components/site/ComponentRenderer.tsx` (same file, sections nằm dưới)

**Pattern thay đổi**: Mỗi Section component đổi signature + nội bộ

```tsx
// CŨ signature
function HeroSection({ 
  config, 
  brandColor 
}: { 
  config: Record<string, unknown>; 
  brandColor: string;
}) {
  const style = config.style as HeroStyle | undefined;
  const slides = config.slides as { image: string; link: string }[] | undefined;
  const content = config.content as HeroContent | undefined;
  
  // Render logic với brandColor
  // style={{ backgroundColor: brandColor }}
}

// MỚI signature
function HeroSection({ 
  config, 
  primary, 
  secondary,
  title 
}: { 
  config: Record<string, unknown>; 
  primary: string;
  secondary: string;
  title: string;
}) {
  const style = config.style as HeroStyle | undefined;
  const slides = config.slides as { image: string; link: string }[] | undefined;
  const content = config.content as HeroContent | undefined;
  
  // Render logic với primary + secondary
  // Primary: main button
  // style={{ backgroundColor: primary }}
  
  // Secondary: badge, secondary button
  // style={{ backgroundColor: `${secondary}20`, color: secondary }}
}
```

**Danh sách Section components cần refactor** (25 components):
1. HeroSection
2. StatsSection
3. AboutSection
4. ServicesSection
5. BenefitsSection
6. FAQSection
7. CTASection
8. TestimonialsSection
9. ContactSection
10. GallerySection
11. TrustBadgesSection
12. PricingSection
13. CareerSection
14. CaseStudySection
15. ProcessSection
16. ClientsSection
17. ProductCategoriesSection
18. CategoryProductsSection
19. TeamSection
20. FeaturesSection
21. VideoSection
22. CountdownSection
23. VoucherPromotionsSection
24. FooterSection
25. SpeedDialSection

**Chiến lược refactor nội bộ**: Giống như Preview components (tìm usage của `brandColor` → phân loại primary vs secondary).

---

## 📋 Checklist tổng hợp

### Infrastructure
- [ ] Thêm helper functions: `hexToHSL()`, `hslToHex()`, `generateComplementary()`, `resolveColorSetting()`
- [ ] Refactor `useBrandColor()` → `useBrandColors()` với logic fallback đầy đủ
- [ ] Xử lý 3 trường hợp: (1) có giá trị, (2) rỗng → auto-generate, (3) field tắt → fallback primary
- [ ] Giữ backward compat alias `useBrandColor()` → `.primary`

### Admin Preview Pages (25 files)
- [ ] `hero/page.tsx`
- [ ] `stats/page.tsx`
- [ ] `about/page.tsx`
- [ ] `services/page.tsx`
- [ ] `benefits/page.tsx`
- [ ] `faq/page.tsx`
- [ ] `contact/page.tsx`
- [ ] `testimonials/page.tsx`
- [ ] `features/page.tsx`
- [ ] `pricing/page.tsx`
- [ ] `cta/page.tsx`
- [ ] `process/page.tsx`
- [ ] `clients/page.tsx`
- [ ] `gallery/page.tsx`
- [ ] `product-list/page.tsx`
- [ ] `product-categories/page.tsx`
- [ ] `case-study/page.tsx`
- [ ] `career/page.tsx`
- [ ] `footer/page.tsx`
- [ ] `video/page.tsx`
- [ ] `countdown/page.tsx`
- [ ] `voucher-promotions/page.tsx`
- [ ] `speed-dial/page.tsx`
- [ ] `team/page.tsx`
- [ ] `category-products/page.tsx`

### Preview Components in previews.tsx (25+ components)
- [ ] HeroBannerPreview (6 styles)
- [ ] StatsPreview (6 styles)
- [ ] FaqPreview (6 styles)
- [ ] TestimonialsPreview (6 styles)
- [ ] PricingPreview (6 styles)
- [ ] CTAPreview (6 styles)
- [ ] GalleryPreview (4 styles)
- [ ] TrustBadgesPreview
- [ ] CareerPreview
- [ ] CaseStudyPreview
- [ ] ProcessPreview
- [ ] ClientsPreview
- [ ] ProductListPreview
- [ ] ProductCategoriesPreview
- [ ] CategoryProductsPreview
- [ ] ServicesPreview
- [ ] BenefitsPreview
- [ ] AboutPreview
- [ ] ContactPreview
- [ ] FeaturesPreview
- [ ] TeamPreview
- [ ] VideoPreview
- [ ] CountdownPreview
- [ ] VoucherPromotionsPreview
- [ ] SpeedDialPreview
- [ ] FooterPreview

### ComponentRenderer.tsx
- [ ] Import `useBrandColors()` thay vì `useBrandColor()`
- [ ] Destructure `{ primary, secondary }`
- [ ] Cập nhật tất cả 25 switch cases

### Section Components (trong ComponentRenderer.tsx)
- [ ] HeroSection
- [ ] StatsSection  
- [ ] AboutSection
- [ ] ServicesSection
- [ ] BenefitsSection
- [ ] FAQSection
- [ ] CTASection
- [ ] TestimonialsSection
- [ ] ContactSection
- [ ] GallerySection
- [ ] TrustBadgesSection
- [ ] PricingSection
- [ ] CareerSection
- [ ] CaseStudySection
- [ ] ProcessSection
- [ ] ClientsSection
- [ ] ProductCategoriesSection
- [ ] CategoryProductsSection
- [ ] TeamSection
- [ ] FeaturesSection
- [ ] VideoSection
- [ ] CountdownSection
- [ ] VoucherPromotionsSection
- [ ] FooterSection
- [ ] SpeedDialSection

---

## ⚠️ Lưu ý quan trọng

### 1. Fallback Logic đầy đủ
```tsx
// ĐÚNG - xử lý đầy đủ 3 cases
if (secondarySetting === undefined) {
  secondary = primary;  // Field tắt → không auto-generate
} else {
  const value = resolveColorSetting(secondarySetting.value);
  secondary = value ?? generateComplementary(primary);  // Rỗng → auto-generate
}

// SAI - luôn auto-generate (không respect field tắt)
secondary = resolveColorSetting(secondarySetting?.value) ?? generateComplementary(primary);
```

### 2. Testing scenarios
Cần test 4 cases:
- [ ] **Case 1**: Primary `#3b82f6`, Secondary `''` → secondary = complementary `#f6823b`
- [ ] **Case 2**: Primary `#3b82f6`, Secondary `#10b981` → secondary = `#10b981`
- [ ] **Case 3**: Primary `#3b82f6`, Field secondary TẮT → secondary = `#3b82f6` (fallback primary)
- [ ] **Case 4**: Legacy `site_brand_color` → primary = legacy, secondary = auto-generated

### 3. Backward Compatibility
- Giữ `useBrandColor()` alias → `.primary` để không breaking change
- Các component ngoài home-components vẫn dùng `useBrandColor()` bình thường

### 4. Consistent Naming
- Luôn dùng `primary` và `secondary`
- KHÔNG dùng `brandColor`, `accentColor`, `mainColor`, `complementaryColor`

### 5. 60/30/10 Rule
- **60% Primary**: Main CTAs, headings, links, progress
- **30% Secondary**: Badges, accents, secondary buttons, hover
- **10% Neutral**: Backgrounds, borders

### 6. Contrast Check
- Đảm bảo `secondary` color có contrast ratio đủ với white background (WCAG AA: 4.5:1 cho text)
- Nếu auto-generate complementary không đủ contrast → xem xét sinh lighter/darker shade

---

## 🎯 Kết quả mong đợi

Sau khi hoàn thành:
- ✅ Tất cả 25 home-component previews hiển thị đúng màu primary + secondary
- ✅ Trang thực tế (homepage) render đúng màu primary + secondary theo config
- ✅ UI đa dạng hơn, không đơn điệu 1 màu
- ✅ Backward compatible với code cũ dùng `useBrandColor()`
- ✅ Xử lý đúng 3 cases: (1) có giá trị, (2) rỗng → auto-generate, (3) field tắt → fallback primary
- ✅ Auto-generate complementary color thông minh khi user để trống

---

**Tổng số files cần sửa**: 
- 1 file `shared.tsx` (hooks + utils + helpers)
- 25 files create pages
- 1 file `previews.tsx` (25+ Preview components)
- 1 file `ComponentRenderer.tsx` (entry + 25 Section components)

**Ước tính**: ~52 files/components cần refactor

**Breaking changes**: ❌ KHÔNG (có backward compat)