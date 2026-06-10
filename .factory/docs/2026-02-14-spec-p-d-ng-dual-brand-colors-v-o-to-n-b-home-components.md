# Spec: Áp dụng Dual Brand Colors vào toàn bộ Home Components

## 📊 DARE Framework - Problem Decomposition

### Problem Graph
```
[MAIN] Áp dụng màu thương hiệu + màu phụ vào home-components
├── 1. [INFRA] Cập nhật hooks để hỗ trợ dual colors
│   └── 1.1 [ROOT] Refactor useBrandColor() → useBrandColors() trong hooks.ts
├── 2. [PREVIEW] Cập nhật 21 home-component preview pages
│   ├── 2.1 Cập nhật các create pages dùng useBrandColor()
│   └── 2.2 Cập nhật previews.tsx để nhận cả primary + secondary
├── 3. [RENDERER] Cập nhật ComponentRenderer.tsx
│   ├── 3.1 Thay useBrandColor() → useBrandColors()
│   └── 3.2 Pass cả primary + secondary cho các section components
└── 4. [SECTIONS] Cập nhật 21 internal section components
    └── 4.1 Refactor để dùng primary cho CTA chính, secondary cho accent/badge
```

---

## ✅ DARE - Analyze \u0026 Reflect

### Hiện trạng (Current State)
- ✅ Settings đã có `site_brand_primary` và `site_brand_secondary` 
- ✅ Hook `useBrandColors()` đã tồn tại trong `components/site/hooks.ts`
- ❌ Hook `useBrandColor()` trong `app/admin/home-components/create/shared.tsx` chỉ trả về primary
- ❌ Các preview pages (21 files) chỉ dùng `brandColor` (single color)
- ❌ `ComponentRenderer.tsx` chỉ truyền `brandColor` prop cho sections
- ❌ Các section components (HeroSection, StatsSection, etc.) chỉ nhận `brandColor` prop

### Chiến lược áp dụng màu (60/30/10 Rule)
- **Primary (60%)**: CTA buttons chính, headings, links chính
- **Secondary (30%)**: Badges, accents, secondary buttons, hover states
- **Neutral (10%)**: Backgrounds, borders

### Ví dụ cụ thể áp dụng
```tsx
// Hero Section
- Primary: Button "Khám phá ngay" 
- Secondary: Badge "Nổi bật", secondary button "Tìm hiểu thêm"

// Stats Section  
- Primary: Background thanh ngang (horizontal style), số liệu lớn
- Secondary: Icon circles (icons style), accent borders

// Testimonials
- Primary: Quote icons, tên khách hàng
- Secondary: Star ratings, background cards

// CTA
- Primary: Main button
- Secondary: Border accent, badge "Khuyến mãi"
```

---

## 🚀 DARE - Execute Plan (Step-by-Step)

### **Bước 1: Refactor shared.tsx hook** 
**File**: `app/admin/home-components/create/shared.tsx`

**Thay đổi**:
```tsx
// CŨ (chỉ primary)
export function useBrandColor() {
  const primarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_primary' });
  const legacySetting = useQuery(api.settings.getByKey, { key: 'site_brand_color' });
  const primary = typeof primarySetting?.value === 'string' ? primarySetting.value : '';
  const legacy = typeof legacySetting?.value === 'string' ? legacySetting.value : '';
  return primary || legacy || DEFAULT_BRAND_COLOR;
}

// MỚI (trả về object)
export function useBrandColors() {
  const primarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_primary' });
  const legacySetting = useQuery(api.settings.getByKey, { key: 'site_brand_color' });
  const secondarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_secondary' });
  
  const primary = typeof primarySetting?.value === 'string' ? primarySetting.value : ''
    || typeof legacySetting?.value === 'string' ? legacySetting.value : ''
    || DEFAULT_BRAND_COLOR;
  
  const secondary = typeof secondarySetting?.value === 'string' ? secondarySetting.value : ''
    || generateComplementary(primary);
  
  return { primary, secondary };
}

// Helper: generate complementary color
function generateComplementary(hex: string): string {
  // Convert hex → HSL → rotate hue 180° → hex
  const hsl = hexToHSL(hex);
  return hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
}

// Backward compat alias
export function useBrandColor() {
  return useBrandColors().primary;
}
```

**Logic**: 
- `useBrandColors()` trả về `{ primary, secondary }`
- Nếu secondary trống → auto-generate complementary color
- Giữ `useBrandColor()` cho backward compatibility

---

### **Bước 2: Cập nhật 21 create pages**
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

**Danh sách files cần sửa** (21 files):
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

### **Bước 3: Cập nhật previews.tsx**
**File**: `app/admin/home-components/previews.tsx`

**Pattern thay đổi**: Mỗi Preview component đổi prop `brandColor` → `primary, secondary`

**Ví dụ HeroBannerPreview**:
```tsx
// CŨ
export const HeroBannerPreview = ({ 
  slides, 
  brandColor,  // ❌
  selectedStyle = 'slider',
  ...
}: { 
  slides: ...; 
  brandColor: string;  // ❌
  ...
}) => {
  // style={{ backgroundColor: brandColor }}
  
// MỚI
export const HeroBannerPreview = ({ 
  slides, 
  primary,      // ✅
  secondary,    // ✅
  selectedStyle = 'slider',
  ...
}: { 
  slides: ...; 
  primary: string;     // ✅
  secondary: string;   // ✅
  ...
}) => {
  // Primary: Main button, accent line
  // style={{ backgroundColor: primary }}
  
  // Secondary: Badge, secondary button, dots inactive color
  // style={{ backgroundColor: secondary, opacity: 0.5 }}
```

**Áp dụng cho tất cả 25+ Preview components** trong `previews.tsx`:
- HeroBannerPreview
- StatsPreview  
- FaqPreview
- TestimonialsPreview
- PricingPreview
- CTAPreview
- GalleryPreview
- TrustBadgesPreview
- CareerPreview
- CaseStudyPreview
- ProcessPreview
- ClientsPreview
- ProductListPreview
- ProductCategoriesPreview
- CategoryProductsPreview
- ServicesPreview
- BenefitsPreview
- AboutPreview
- ContactPreview
- FeaturesPreview
- TeamPreview
- VideoPreview
- CountdownPreview
- VoucherPromotionsPreview
- SpeedDialPreview
- FooterPreview

**Chiến lược refactor nội bộ mỗi Preview**:
- Tìm tất cả `brandColor` → phân loại:
  - **Primary usage**: Main buttons, headings, links → giữ `primary`
  - **Secondary usage**: Badges, accents, borders → đổi `secondary`
- Ví dụ cụ thể:
  ```tsx
  // Badge "Nổi bật"
  style={{ backgroundColor: `${secondary}15`, color: secondary }}
  
  // Button chính
  style={{ backgroundColor: primary }}
  
  // Dots slider
  style={{ backgroundColor: idx === current ? primary : `${secondary}50` }}
  ```

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
    case 'Hero': {
      return <HeroSection config={config} brandColor={brandColor} />;  // ❌
    }
    // ... 20+ cases
  }
}

// MỚI
import { useBrandColors } from './hooks';

export function ComponentRenderer({ component }: ComponentRendererProps) {
  const { primary, secondary } = useBrandColors();  // ✅
  const { type, title, config } = component;

  switch (type) {
    case 'Hero': {
      return <HeroSection config={config} primary={primary} secondary={secondary} title={title} />;  // ✅
    }
    case 'Stats': {
      return <StatsSection config={config} primary={primary} secondary={secondary} title={title} />;
    }
    // ... cập nhật tất cả 20+ cases
  }
}
```

**Tác động**: Tất cả 21 section components trong switch case cần đổi prop

---

### **Bước 5: Cập nhật 21+ internal Section components**
**File**: `components/site/ComponentRenderer.tsx` (same file, sections nằm dưới)

**Pattern thay đổi**: Mỗi Section component:
```tsx
// CŨ
function HeroSection({ config, brandColor }: { config: Record<string, unknown>; brandColor: string }) {
  // style={{ backgroundColor: brandColor }}
}

// MỚI
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
  // Primary: main button
  // style={{ backgroundColor: primary }}
  
  // Secondary: badge, accent
  // style={{ backgroundColor: `${secondary}20`, color: secondary }}
}
```

**Danh sách Section components cần refactor** (trong ComponentRenderer.tsx):
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

**Chiến lược refactor nội bộ**:
- Giống như Preview components
- Tìm tất cả usage của `brandColor` → phân loại primary vs secondary
- Apply 60/30/10 rule

---

### **Bước 6: Helper utilities (nếu cần)**
**File**: `app/admin/home-components/create/shared.tsx`

Thêm helper functions cho color manipulation:
```tsx
// Convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Implementation tương tự trong components/site/hooks.ts
}

// Convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  // Implementation tương tự trong components/site/hooks.ts
}

// Generate complementary color (180° rotation)
function generateComplementary(hex: string): string {
  const { h, s, l } = hexToHSL(hex);
  return hslToHex((h + 180) % 360, s, l);
}
```

---

## 📋 Checklist tổng hợp

### Infrastructure
- [ ] Refactor `useBrandColor()` trong `shared.tsx` để trả về `{ primary, secondary }`
- [ ] Thêm helper `generateComplementary()` 
- [ ] Giữ backward compat alias `useBrandColor()` → `.primary`

### Admin Preview Pages (21 files)
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
- [ ] HeroBannerPreview
- [ ] StatsPreview
- [ ] FaqPreview
- [ ] TestimonialsPreview
- [ ] PricingPreview
- [ ] CTAPreview
- [ ] (+ 19 components khác)

### ComponentRenderer.tsx
- [ ] Import `useBrandColors()` thay vì `useBrandColor()`
- [ ] Destructure `{ primary, secondary }`
- [ ] Cập nhật tất cả 21+ switch cases

### Section Components (trong ComponentRenderer.tsx)
- [ ] HeroSection
- [ ] StatsSection  
- [ ] AboutSection
- [ ] ServicesSection
- [ ] (+ 21 sections khác)

---

## ⚠️ Lưu ý quan trọng

1. **Backward Compatibility**: Giữ `useBrandColor()` alias để không breaking các component khác ngoài home-components
2. **Auto-generation**: Nếu user chưa set `site_brand_secondary` → auto-generate complementary color
3. **Consistent naming**: Luôn dùng `primary` và `secondary`, không dùng `brandColor`, `accentColor`, `mainColor`
4. **60/30/10 Rule**: Primary cho main CTAs, Secondary cho accents/badges
5. **Contrast check**: Đảm bảo `secondary` color có contrast ratio đủ với white background (WCAG AA)

---

## 🎯 Kết quả mong đợi

Sau khi hoàn thành:
- ✅ Tất cả 21 home-component previews hiển thị đúng màu primary + secondary
- ✅ Trang thực tế (homepage) render đúng màu primary + secondary theo config
- ✅ UI đa dạng hơn, không đơn điệu 1 màu
- ✅ Backward compatible với code cũ dùng `useBrandColor()`
- ✅ Tự động generate complementary color nếu user chưa set secondary

---

**Tổng số files cần sửa**: 
- 1 file shared.tsx (hooks + utils)
- 21 files create pages
- 1 file previews.tsx (25+ components)
- 1 file ComponentRenderer.tsx (entry + 21+ sections)

**Ước tính**: ~50 files/components cần refactor