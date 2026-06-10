# Plan: Áp dụng Dual Brand Color System cho Hero Component

## 📋 Phân tích hiện trạng

Hiện tại Hero component có **6 styles** (slider, fade, bento, fullscreen, split, parallax) và đang sử dụng màu theo pattern:
- Màu **chính (brandColor)**: dùng cho dots indicator, buttons chính
- Màu **phụ (secondary)**: chưa được dùng đồng nhất, một số style dùng `30` (lỗi syntax), một số chưa dùng
- **Vấn đề**: Chưa tuân thủ 60-30-10 rule của dual brand color system

## 🎯 Mục tiêu

Áp dụng **60-30-10 Color Rule** theo skill dual-brand-color-system:
- **60%** Neutral (white, slate-50, slate-900) - background, surfaces
- **30%** Primary brand color - headings, primary sections, indicators
- **10%** Secondary brand color - CTAs, badges, accents

## 🔧 Plan chi tiết

### 1. **File: `app/admin/home-components/previews.tsx`** (Admin Preview - 6 styles)

Sửa **6 render functions** để áp dụng màu đúng:

#### Style 1: `renderSliderStyle()`
```tsx
// ❌ Hiện tại: brandColor cho dots, không có secondary
// ✅ Sửa thành:
- Navigation arrows: border + icon dùng brandColor (primary)
- Dots indicator active: brandColor
- Dots indicator inactive: neutral (bg-white/50)
```

#### Style 2: `renderFadeStyle()`
```tsx
// ❌ Hiện tại: brandColor cho thumbnail, không có secondary
// ✅ Sửa thành:
- Thumbnail border active: brandColor (primary)
- Thumbnail placeholder: brandColor nếu không có ảnh
```

#### Style 3: `renderBentoStyle()`
```tsx
// ❌ Hiện tại: brandColor cho ring của grid chính
// ✅ Sửa thành:
- Main grid item (slot 1): ring-color dùng brandColor
- Placeholders: brandColor với opacity gradient
```

#### Style 4: `renderFullscreenStyle()` ⭐ **Thay đổi lớn**
```tsx
// ❌ Hiện tại: secondary dùng sai (`30` lỗi syntax), brandColor cho pulse dot và primary button
// ✅ Sửa thành:
- Badge background: secondary + opacity 30% → `${secondary}30`
- Badge text: secondary
- Badge pulse dot: brandColor (primary)
- Primary button: brandColor (30% visual weight)
- Secondary button: border-white/30, hover:bg-white/10 (neutral)
- Dots indicator: brandColor
```

#### Style 5: `renderSplitStyle()` ⭐ **Thay đổi lớn**
```tsx
// ❌ Hiện tại: secondary dùng sai (`15` lỗi syntax), brandColor cho button và indicators
// ✅ Sửa thành:
- Badge background: secondary + opacity 15% → `${secondary}15`
- Badge text: secondary
- Heading: text-slate-900 (neutral dark)
- Primary button: brandColor (10% visual weight - accent)
- Navigation arrows icon: secondary (subtle accent)
- Slide indicators: brandColor cho active, neutral cho inactive
```

#### Style 6: `renderParallaxStyle()` ⭐ **Thay đổi lớn**
```tsx
// ❌ Hiện tại: brandColor cho pulse và button, secondary cho badge text
// ✅ Sửa thành:
- Badge pulse dot: brandColor (primary)
- Badge text: secondary
- Floating card heading: text-slate-900 (neutral)
- Primary button: brandColor (10% accent)
- Countdown text: text-slate-500 (neutral)
```

---

### 2. **File: `components/site/ComponentRenderer.tsx`** (Frontend Render - 6 styles)

Sửa **HeroSection component** để đồng bộ với preview:

#### Style 1: `slider`
```tsx
// Dots indicator active: brandColor ✅ (đã đúng)
// Arrows: neutral bg-white/80 ✅ (đã đúng)
```

#### Style 2: `fade`
```tsx
// Thumbnail border active: border-white ✅ (đã đúng)
// Thumbnail placeholder: brandColor ✅ (đã đúng)
```

#### Style 3: `bento`
```tsx
// Không có accent color → giữ nguyên neutral bg-slate-800
```

#### Style 4: `fullscreen` ⭐ **Sửa**
```tsx
// ❌ Line 354: style={{ backgroundColor: `30`, color: secondary }}
// ✅ Sửa:    style={{ backgroundColor: `${secondary}30`, color: secondary }}

// ✅ Giữ nguyên:
// - Primary button: brandColor
// - Secondary button: border-white/30
// - Dots: brandColor cho active
```

#### Style 5: `split` ⭐ **Sửa**
```tsx
// ❌ Line 426: style={{ backgroundColor: `15`, color: secondary }}
// ✅ Sửa:    style={{ backgroundColor: `${secondary}15`, color: secondary }}

// ❌ Line 462: style={{ color: secondary }} cho navigation arrows
// ✅ Giữ nguyên (navigation arrows dùng secondary là đúng)

// ✅ Giữ nguyên:
// - Primary button: brandColor
// - Slide indicators: brandColor
```

#### Style 6: `parallax`
```tsx
// ✅ Đã đúng:
// - Pulse dot: brandColor
// - Badge text: secondary
// - Primary button: brandColor
```

---

### 3. **Tổng kết thay đổi**

| Component | File | Thay đổi |
|-----------|------|----------|
| **Preview** | `previews.tsx` | Đồng bộ màu secondary cho badge trong 3 styles: fullscreen, split, parallax |
| **Frontend** | `ComponentRenderer.tsx` | Sửa 2 lỗi syntax: `${secondary}30` và `${secondary}15` trong fullscreen + split |

---

## ✅ Checklist 60-30-10 Rule

### Neutral (60%)
- ✅ Backgrounds: `bg-slate-900`, `bg-white`, `bg-slate-50`
- ✅ Text content: `text-slate-600`, `text-white`
- ✅ Overlays: `bg-black/20`, `bg-gradient-to-t from-black/80`

### Primary Brand Color (30%)
- ✅ Dots indicators (active state)
- ✅ Primary buttons (CTA)
- ✅ Navigation arrows border/icon
- ✅ Slide progress indicators
- ✅ Badge pulse dot

### Secondary Brand Color (10%)
- ✅ Badge background (với opacity 15-30%)
- ✅ Badge text
- ✅ Navigation arrows icon (trong split style)

---

## 📝 Lưu ý

1. **Không thay đổi layout/structure** - chỉ sửa phối màu
2. **Đồng bộ 100%** giữa preview (admin) và frontend render
3. **Syntax fix** quan trọng: `${secondary}30` thay vì `30`
4. **Testing**: Sau khi sửa, cần test visual trên 6 styles để đảm bảo màu hài hòa

---

## 🎨 Visual Weight Validation

Theo skill dual-brand-color-system, visual weight không chỉ tính theo diện tích mà còn theo **saturation × brightness**:

- **Neutral 60%**: Backgrounds, surfaces → chiếm diện tích lớn nhất
- **Primary 30%**: Buttons, dots, indicators → diện tích nhỏ nhưng high contrast
- **Secondary 10%**: Badges, accents → diện tích nhỏ nhất, subtle

✅ Hero component sau khi sửa sẽ đạt balance 60-30-10.