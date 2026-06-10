# Giải pháp Dual-Color Design System cho VietAdmin

## 📊 Phân tích hiện tại (DARE - Decompose)

### Hiện trạng màu thương hiệu
- **Setting hiện tại**: `site_brand_color` (#3b82f6 - blue-500 default)
- **Cách dùng**: Tint/Shade generation (10 variations: 95→5 lightness)
- **Phạm vi ảnh hưởng**:
  - **16 experiences**: posts-list, products-list, services-list, product-detail, posts-detail, services-detail, cart, wishlist, checkout, account-orders, account-profile, contact, menu, comments-rating, search, promotions-list
  - **21 home-components**: hero, stats, about, services, benefits, FAQ, contact, team, testimonials, features, pricing, CTA, process, clients, gallery, product-list, product-categories, case-study, career, footer, video, countdown, voucher-promotions, speed-dial
  - **Module settings**: Form color picker với tint/shade preview

### Vấn đề hiện tại
1. **Thiếu màu phụ**: Chỉ có 1 màu → UI đơn điệu, thiếu nhấn mạng
2. **Conflict khi cần 2 tone**: Một số component cần phân biệt primary action vs secondary action
3. **Thiếu semantic colors**: Warning, success, info đang dùng hardcode

---

## 🎨 Best Practices từ Material Design 3 & Tailwind CSS (DARE - Analyze)

### Material Design 3 (2026)
- **Dual palette system**: Primary + Secondary (không phải Primary + Accent)
- **Dynamic color**: Từ 1 seed color → tự sinh palette hài hòa
- **Tonal roles**: Primary/OnPrimary/PrimaryContainer/OnPrimaryContainer
- **Accessibility-first**: Auto contrast ratio WCAG 2.0

### Tailwind CSS v4
- **Token-driven**: CSS variables với `@theme` blocks
- **OKLCH color space**: Perceptual uniformity (thay vì sRGB)
- **60/30/10 rule**: 60% base, 30% secondary, 10% accent

### Design Systems Best Practices
1. **Naming convention**: Primary, Secondary (không dùng Accent - dễ nhầm với Accent accessibility)
2. **Flexibility**: Cho phép 1 màu hoặc 2 màu
3. **Tint/Shade generation**: OKLCH-based, 10 levels (50→950)
4. **Semantic separation**: Brand colors ≠ Semantic colors (success/warning/error)

---

## ✅ Giải pháp đề xuất (DARE - Reflect + Execute)

### Option A: Dual-Color System (Primary + Secondary) - **RECOMMENDED**

#### Schema Settings
```typescript
{
  site_brand_primary: '#3b82f6',    // Màu chính (default blue-500)
  site_brand_secondary: '',         // Màu phụ (optional, nếu để trống thì auto-generate)
}
```

#### Logic tự động
```typescript
// hooks.ts
export function useBrandColors() {
  const primarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_primary' });
  const secondarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_secondary' });
  
  const primary = primarySetting?.value || '#3b82f6';
  const secondary = secondarySetting?.value || generateComplementary(primary); // Tự sinh nếu trống
  
  return {
    primary,
    secondary,
    primaryShades: generateTintsShades(primary),
    secondaryShades: generateTintsShades(secondary),
  };
}

// Auto-generate complementary color
function generateComplementary(hex: string): string {
  const hsl = hexToHSL(hex);
  return hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l); // Complementary trên color wheel
}
```

#### UI Settings Page
- **Màu chính (Primary)**: Color picker + 10 tints/shades preview
- **Màu phụ (Secondary)**: 
  - Checkbox "Tự động sinh từ màu chính" (default checked)
  - Khi unchecked → hiện color picker
  - Preview 10 tints/shades

#### Cách áp dụng vào UI
```typescript
// Primary: CTA chính, links chính, headers
style={{ backgroundColor: primary }}

// Secondary: CTA phụ, badges, highlights
style={{ backgroundColor: secondary }}

// Tints: Backgrounds, hover states
style={{ backgroundColor: getTint(primary, 0.1) }}

// 60/30/10 rule
- 60%: Neutral (slate-50, white)
- 30%: Primary shades
- 10%: Secondary shades
```

#### Migration từ hiện tại
1. **Rename field**: `site_brand_color` → `site_brand_primary`
2. **Add field**: `site_brand_secondary` (default empty)
3. **Update hook**: `useBrandColor()` → `useBrandColors()` (return object)
4. **Backward compat**: Export `const brandColor = primary` (alias)

#### Impact & Refactor
- **Settings seeder**: Thêm field mới
- **Settings page**: UI cho 2 color pickers
- **hooks.ts**: Logic dual-color + auto-generation
- **16 experiences**: Chuyển `brandColor` → `{ primary, secondary }`
- **21 home-components**: Tương tự
- **Breaking change**: ❌ Không (vì có backward compat alias)

---

### Option B: Single Color + Auto Accent (Simpler)

Giữ nguyên 1 field `site_brand_color`, nhưng auto-generate accent từ primary:

```typescript
export function useBrandColor() {
  const setting = useQuery(api.settings.getByKey, { key: 'site_brand_color' });
  const primary = setting?.value || '#3b82f6';
  
  return {
    primary,
    accent: generateAccent(primary), // Lighter shade hoặc complementary
    shades: generateTintsShades(primary),
  };
}
```

**Ưu điểm**: Không breaking change, đơn giản  
**Nhược điểm**: Ít linh hoạt hơn, không cho user tự chọn màu phụ

---

## 📋 Implementation Roadmap (Option A)

### Phase 1: Core Infrastructure
1. **Convex schema**: Thêm `site_brand_secondary` vào settings seeder
2. **Module fields**: Thêm field `site_brand_secondary` type color
3. **Utils**: `generateComplementary()`, `generateTintsShades()` OKLCH-based
4. **Hooks**: Refactor `useBrandColor()` → `useBrandColors()`

### Phase 2: Settings UI
1. **Admin settings page**: 
   - Primary color picker + preview
   - Secondary color picker + checkbox "Tự động"
   - Preview cả 2 màu side-by-side

### Phase 3: Component Migration
1. **Experiences** (16 files): Chuyển `brandColor` → `primary, secondary`
2. **Home-components** (21 types): Tương tự
3. **Test UI**: Đảm bảo backward compat với `brandColor` alias

### Phase 4: Documentation
1. **Docs cho admin**: Hướng dẫn chọn màu phụ
2. **Design guidelines**: 60/30/10 rule, khi nào dùng primary vs secondary

---

## 🎯 Khuyến nghị

**Chọn Option A** vì:
- ✅ Align với Material Design 3 trends 2026
- ✅ Linh hoạt: 1 màu hoặc 2 màu
- ✅ Auto-generation thông minh (complementary color)
- ✅ Không breaking change (có alias backward compat)
- ✅ Tương lai: Dễ mở rộng thành full design tokens system

**Từ chối Option B** vì:
- ❌ Thiếu linh hoạt cho user muốn tự chọn
- ❌ Không phải best practice của các design system lớn

---

## ⚠️ Lưu ý khi implement

1. **OKLCH vs HSL**: Material Design 3 dùng OKLCH (perceptually uniform), nhưng browser support vẫn hạn chế → Dùng HSL cho đơn giản, migrate sang OKLCH sau
2. **Accessibility**: Luôn check contrast ratio primary vs white, secondary vs white (WCAG 2.0 AA)
3. **Dark mode**: Nếu có plans dark mode, cần design token layer (primary-light, primary-dark)
4. **Performance**: Cache generated shades (useMemo) thay vì compute mỗi render
5. **Seed wizard**: Update để hỏi "Bạn có muốn chọn màu phụ không?" khi setup

---

**Tổng kết**: Dual-color system là xu hướng 2026, align với Material Design 3, Tailwind v4, và mọi design system lớn. Implementation không phức tạp, không breaking change, và mang lại flexibility cho user.