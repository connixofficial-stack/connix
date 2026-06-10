# Spec: Áp dụng dual brand colors vào Hero Component

## 🎯 Mục tiêu
Đồng bộ hóa việc sử dụng 2 màu thương hiệu (primary + secondary) giữa:
- **6 preview styles** trong admin (`/admin/home-components/create/hero`)
- **Renderer trên trang chủ** (`components/site/ComponentRenderer.tsx`)

## 📊 Phân tích hiện trạng

### ✅ Đã có sẵn
1. Settings: `site_brand_primary` + `site_brand_secondary`
2. Hook `useBrandColors()` trả về `{ primary, secondary }`
3. Admin page đã truyền `primary` + `secondary` xuống `HeroBannerPreview`
4. ComponentRenderer đã áp dụng màu phụ **ĐẦY ĐỦ** cho 6 styles

### ❌ Vấn đề
**HeroBannerPreview** (admin preview) **CHỈ dùng `brandColor` (primary)**, chưa dùng `secondary` → Preview không giống trang chủ thật!

## 🎨 Pattern áp dụng màu (theo ComponentRenderer)

### Style 1: Slider
- **Primary**: navigation buttons border/icon  
- **Secondary**: dots indicator (active state)

### Style 2: Fade  
- **Primary**: border thumbnail active
- **Secondary**: placeholder thumbnail background (khi chưa có ảnh)

### Style 3: Bento
- **Primary**: ring border ảnh chính, placeholder icon
- **Secondary**: (không dùng - giữ nguyên)

### Style 4: Fullscreen
- **Primary**: (không dùng trong renderer)
- **Secondary**: badge background, animated dot, primary button, navigation dots

### Style 5: Split
- **Primary**: (không dùng trong renderer)  
- **Secondary**: badge color, primary button background, slide indicators, navigation icons

### Style 6: Parallax
- **Primary**: (không dùng trong renderer)
- **Secondary**: animated dot, badge text color, primary button background

## 📝 Implementation Plan

### Bước 1: Update HeroBannerPreview - Style 1 (Slider)
**File**: `app/admin/home-components/previews.tsx` (dòng ~215-245)

**Thay đổi**:
```tsx
// BEFORE: dots dùng brandColor
style={idx === currentSlide ? { backgroundColor: brandColor } : {}}

// AFTER: dots dùng secondary
style={idx === currentSlide ? { backgroundColor: secondary } : {}}
```

### Bước 2: Update Style 2 (Fade)  
**Dòng**: ~250-280

**Thay đổi**:
```tsx
// Placeholder thumbnail - BEFORE dùng brandColor
<div className="w-full h-full" style={{ backgroundColor: brandColor }}></div>

// AFTER dùng secondary
<div className="w-full h-full" style={{ backgroundColor: secondary }}></div>
```

### Bước 3: Update Style 3 (Bento)
**Dòng**: ~285-350

**Giữ nguyên** - không cần thay đổi (chỉ dùng primary cho ring border)

### Bước 4: Update Style 4 (Fullscreen)
**Dòng**: ~355-425

**Thay đổi** (4 chỗ):
```tsx
// 1. Badge background - line ~368
// BEFORE
style={{ backgroundColor: `${brandColor}30`, color: brandColor }}
// AFTER  
style={{ backgroundColor: `${secondary}30`, color: secondary }}

// 2. Animated dot - line ~369
// BEFORE
style={{ backgroundColor: brandColor }}
// AFTER
style={{ backgroundColor: secondary }}

// 3. Primary button - line ~383
// BEFORE
style={{ backgroundColor: brandColor }}
// AFTER
style={{ backgroundColor: secondary }}

// 4. Navigation dots - line ~402
// BEFORE
style={idx === currentSlide ? { backgroundColor: brandColor } : {}}
// AFTER
style={idx === currentSlide ? { backgroundColor: secondary } : {}}
```

### Bước 5: Update Style 5 (Split)
**Dòng**: ~430-500

**Thay đổi** (4 chỗ):
```tsx
// 1. Badge color - line ~443
// BEFORE
style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
// AFTER
style={{ backgroundColor: `${secondary}15`, color: secondary }}

// 2. Primary button - line ~456
// BEFORE
style={{ backgroundColor: brandColor }}
// AFTER
style={{ backgroundColor: secondary }}

// 3. Slide indicators - line ~465
// BEFORE
style={idx === currentSlide ? { backgroundColor: brandColor } : {}}
// AFTER
style={idx === currentSlide ? { backgroundColor: secondary } : {}}

// 4. Navigation icons - line ~480, 485
// BEFORE
style={{ color: brandColor }}
// AFTER
style={{ color: secondary }}
```

### Bước 6: Update Style 6 (Parallax)
**Dòng**: ~505-570

**Thay đổi** (3 chỗ):
```tsx
// 1. Animated dot - line ~524
// BEFORE
style={{ backgroundColor: brandColor }}
// AFTER
style={{ backgroundColor: secondary }}

// 2. Badge text - line ~525
// BEFORE
style={{ color: brandColor }}
// AFTER
style={{ color: secondary }}

// 3. Primary button - line ~537
// BEFORE
style={{ backgroundColor: brandColor }}
// AFTER
style={{ backgroundColor: secondary }}
```

## ✅ Validation

Sau khi implement, kiểm tra:

1. **Admin Preview** (`/admin/home-components/create/hero`):
   - Chọn từng style (slider, fade, bento, fullscreen, split, parallax)
   - Verify màu `secondary` xuất hiện đúng chỗ (buttons, badges, dots, thumbnails)
   - Test responsive: desktop, tablet, mobile

2. **Trang chủ thật** (`/`):
   - So sánh preview admin vs trang chủ → phải **GIỐNG NHAU 100%**
   - Test với nhiều giá trị `site_brand_secondary` khác nhau

3. **Edge cases**:
   - `site_brand_secondary` rỗng → auto-generate complementary từ primary
   - Thay đổi màu trong settings → preview update realtime

## 🚀 Kết quả mong đợi

✅ 6 preview styles trong admin **GIỐNG HỆT** renderer trên trang chủ  
✅ Màu phụ (secondary) được dùng đúng chỗ, tạo visual hierarchy tốt hơn  
✅ Preview responsive chính xác trên 3 devices  
✅ Hỗ trợ auto-generate màu phụ khi user chưa set