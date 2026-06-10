# Spec: Fix Màu Phụ (Secondary) Chiếm Đúng 10% Theo Chuẩn UI Design

## 🎯 Vấn đề

Code hiện tại **ĐẢO NGƯỢC** vai trò màu:
- **Secondary**: chiếm ~60% (buttons chính, CTAs, dots) → **SAI**
- **Primary**: chỉ ~5% (gần như không dùng) → **SAI**

## 🎓 Chuẩn UI Design (60/30/10 Rule)

Theo research từ Inkbot, Mangcoding, NN/g, UX Planet:
- **60% Neutral**: Backgrounds, white space (Tailwind defaults)
- **30% Primary**: Main CTAs, active states, headings, progress bars
- **10% Secondary**: Badges nhỏ, icon accents, subtle highlights

## 🔎 Root Cause

1. **Naming gây nhầm**: `site_brand_primary/secondary` không map đúng vai trò
2. **Code sai**: Tất cả main buttons/CTAs đang dùng `secondary` thay vì `primary`
3. **Spec trước hiểu sai**: Áp dụng secondary cho 50%+ elements

**Evidence**:
```tsx
// SAI - Primary button dùng secondary (60% screen)
<button style={{ backgroundColor: secondary }}>Main CTA</button>

// ĐÚNG - Primary button dùng primary (30% screen)
<button style={{ backgroundColor: primary }}>Main CTA</button>

// ĐÚNG - Badge dùng secondary (10% screen)
<span style={{ color: secondary }}>Featured</span>
```

## 📝 Implementation Plan

### **Bước 1: Refactor ComponentRenderer.tsx**
- Đổi signature 25 Section functions: `brandColor` → `primary`
- Pass `primary` + `secondary` rõ ràng

### **Bước 2: Phân loại lại elements theo 60/30/10**

#### **30% PRIMARY**
- Main CTA buttons: "Khám phá", "Đăng ký", "Liên hệ"
- Active states: Selected dots, active tabs
- Progress bars, loading indicators
- Primary headings với brand identity

**Code**: `backgroundColor: primary`

#### **10% SECONDARY**
- Badges nhỏ: "New", "Hot", "Featured" (KHÔNG phải CTAs)
- Icon accents (decorative, không phải main action)
- Subtle borders/highlights
- Animated pulse dots
- Text highlights trong content

**Code**: `backgroundColor: ${secondary}15, color: secondary`

#### **60% NEUTRAL**
- Backgrounds: `bg-white`, `bg-slate-50`
- Cards, borders: Tailwind defaults
- Không đổi code

### **Bước 3: Refactor 6 Hero Styles**

**Mapping cụ thể**:

**Style 1 Slider**:
- Primary: Active dots, navigation buttons
- Secondary: Badge "Featured", animated pulse

**Style 2 Fade**:
- Primary: Active thumbnail border, main button
- Secondary: Placeholder background (subtle)

**Style 4 Fullscreen**:
- Primary: Main button, active dots
- Secondary: Badge background `${secondary}30`, animated dot

**Style 5 Split**:
- Primary: Main button, active slide indicators
- Secondary: Badge, navigation icons (subtle `${secondary}60`)

**Style 6 Parallax**:
- Primary: Main button
- Secondary: Badge text, animated dot

**Pattern chung**:
```tsx
// CŨ (SAI)
<button style={{ backgroundColor: secondary }}>Primary Action</button>
<span style={{ backgroundColor: secondary }}>Badge</span>

// MỚI (ĐÚNG)
<button style={{ backgroundColor: primary }}>Primary Action</button>  // 30%
<span style={{ backgroundColor: `${secondary}15`, color: secondary }}>Badge</span>  // 10%
```

### **Bước 4: Áp dụng pattern cho 24 components còn lại**
- StatsSection (6 styles)
- FAQSection (6 styles)
- TestimonialsSection (6 styles)
- PricingSection (6 styles)
- CTASection (6 styles)
- AboutSection, ServicesSection, BenefitsSection... (19 components)

**Pattern**:
1. Main CTAs: `backgroundColor: primary`
2. Active states: `backgroundColor: primary`
3. Badges nhỏ: `color: secondary, backgroundColor: ${secondary}15`
4. Icon accents: `color: ${secondary}60`

### **Bước 5: Fix previews.tsx**
- Đổi signature 25+ Preview components: `brandColor` → `primary`
- Refactor nội bộ theo pattern Step 3-4

### **Bước 6: Fix 25 admin create pages**
```tsx
// CŨ
const brandColor = useBrandColor();
<Preview brandColor={brandColor} secondary={secondary} />

// MỚI
const { primary, secondary } = useBrandColors();
<Preview primary={primary} secondary={secondary} />
```

## ✅ Validation

### Visual Test:
- Main CTAs → màu `primary` (~30% screen)
- Badges → màu `secondary` (~10% screen)
- Backgrounds → neutral Tailwind (~60% screen)
- Preview admin = trang chủ thật 100%

### Code Test:
- Search `backgroundColor: secondary` → chỉ badges/accents (ít)
- Search `backgroundColor: primary` → CTAs/actives (nhiều hơn)
- Không còn `brandColor` variable

## 📊 Kết quả

- ✅ Secondary chỉ 10% → đúng design rules
- ✅ Primary chiếm 30% → brand identity rõ ràng
- ✅ UI professional, không "lố" màu
- ✅ Theo chuẩn senior dev (60/30/10 rule)

**Files cần sửa**: ~52 components (ComponentRenderer 25 sections + previews.tsx 25+ components + 25 create pages)