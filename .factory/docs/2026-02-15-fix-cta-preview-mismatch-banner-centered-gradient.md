# Spec: Đồng bộ CTAPreview với CTASection (Frontend)

## Context
Preview của CTA component trong admin editor (`CTAPreview`) hiện **không khớp** với frontend rendering (`CTASection`) ở 3 styles: **banner**, **centered**, và **gradient**. Điều này gây nhầm lẫn khi admin chọn style trong editor nhưng kết quả trên frontend khác hẳn.

## Root Cause
**CTAPreview** (file `app/admin/home-components/previews.tsx`) dùng color scheme khác hoàn toàn với **CTASection** (file `components/site/ComponentRenderer.tsx`):
- Banner preview: background slate-50, text slate-900 → Frontend: background `brandColor`, text trắng
- Centered preview: title `brandColor` → Frontend: title `secondary`
- Gradient preview: subtle gradient (15%/10% opacity) + slate text → Frontend: bold gradient (100%) + text trắng

## Mismatch Chi Tiết

### 1. Style "Banner"
**Preview (SAI):**
```tsx
<section className="w-full bg-slate-50 dark:bg-slate-900 ...">
  <h3 className="font-bold text-slate-900 dark:text-white">...</h3>
  <p className="text-slate-600 dark:text-slate-400">...</p>
  <button style={{ backgroundColor: brandColor }}>Primary</button>
  <button style={{ borderColor: `${secondary}30` }}>Secondary</button>
```

**Frontend (ĐÚNG):**
```tsx
<section className="py-12 md:py-16 px-4" style={{ backgroundColor: brandColor }}>
  <div className="text-white ...">
    <h2 className="...">...</h2>
    <p className="opacity-90">...</p>
  </div>
  <a className="bg-white ..." style={{ color: secondary }}>Primary</a>
  <a className="border-2 border-white/50 text-white ...">Secondary</a>
```

**Fix cần làm:**
- Section: `style={{ backgroundColor: brandColor }}`
- Text: `text-white`, `opacity-90`
- Primary button: `bg-white` + `color: secondary`
- Secondary button: `border-white/50 text-white`

---

### 2. Style "Centered"
**Preview (SAI):**
```tsx
<h3 style={{ color: brandColor }}>...</h3>
<button style={{ borderColor: `${secondary}30` }}>Secondary</button>
```

**Frontend (ĐÚNG):**
```tsx
<h2 style={{ color: secondary }}>...</h2>
<a style={{ borderColor: brandColor }}>Secondary</a>
```

**Fix:** Title dùng `secondary`, secondary button dùng `borderColor: brandColor`.

---

### 3. Style "Gradient"
**Preview (SAI):**
```tsx
<section style={{ background: `linear-gradient(135deg, ${brandColor}15 0%, ${secondary}10 50%, ${brandColor}15 100%)` }}>
  <h3 className="text-slate-900">...</h3>
  <p className="text-slate-600">...</p>
  <button style={{ backgroundColor: brandColor }}>Primary</button>
  <button style={{ borderColor: `${secondary}30`, color: secondary }}>Secondary</button>
```

**Frontend (ĐÚNG):**
```tsx
<section style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${secondary} 50%, ${brandColor} 100%)` }}>
  <h2 className="text-white">...</h2>
  <p className="text-white/90">...</p>
  <a className="bg-white ..." style={{ color: secondary }}>Primary</a>
  <a className="border-2 border-white text-white ...">Secondary</a>
  <div className="absolute ... bg-white/20" />
  <div className="absolute ... bg-white/10" />
```

**Fix:** Full gradient (100%), text trắng, primary button trắng, decorative circles dùng `bg-white/20` và `bg-white/10`.

---

## Plan Fix (Step-by-Step)

### File: `app/admin/home-components/previews.tsx`

#### Bước 1: Fix `renderBannerStyle()` (dòng ~5738)
1. **Section background:** Đổi từ `bg-slate-50 dark:bg-slate-900` → không dùng className, thêm `style={{ backgroundColor: brandColor }}`
2. **Text color:** 
   - Title: `text-slate-900 dark:text-white` → `text-white`
   - Description: `text-slate-600 dark:text-slate-400` → `text-white opacity-90`
3. **Primary button:**
   - Đổi từ `style={{ backgroundColor: brandColor, boxShadow: ... }}` 
   - → `className="bg-white ..."` + `style={{ color: secondary, boxShadow: ... }}`
4. **Secondary button:**
   - Đổi từ `style={{ borderColor: ${secondary}30, color: secondary }}`
   - → `className="border-2 border-white/50 text-white ..."`

#### Bước 2: Fix `renderCenteredStyle()` (dòng ~5781)
1. **Title color:** Đổi `style={{ color: brandColor }}` → `style={{ color: secondary }}`
2. **Secondary button borderColor:** Đổi từ `borderColor: ${secondary}30` → `borderColor: brandColor`

#### Bước 3: Fix `renderGradientStyle()` (dòng ~5960)
1. **Section background:** Đổi gradient từ `${brandColor}15 0%, ${secondary}10 50%, ${brandColor}15 100%` → `${brandColor} 0%, ${secondary} 50%, ${brandColor} 100%`
2. **Decorative circles:**
   - Đổi từ `style={{ backgroundColor: brandColor }}` + `opacity-10` → `className="bg-white/20"`
   - Đổi từ `style={{ backgroundColor: secondary }}` + `opacity-10` → `className="bg-white/10"`
3. **Text color:**
   - Title: `text-slate-900` → `text-white`
   - Description: `text-slate-600` → `text-white/90`
4. **Primary button:**
   - Đổi từ `style={{ backgroundColor: brandColor, boxShadow: ... }}`
   - → `className="bg-white ..."` + `style={{ color: secondary, boxShadow: ... }}`
5. **Secondary button:**
   - Đổi từ `style={{ borderColor: ${secondary}30, color: secondary }}`
   - → `className="border-2 border-white text-white ..."`

---

## Styles Không Đổi (đã khớp)
- **Split:** ✅ Đã khớp
- **Floating:** ✅ Đã khớp  
- **Minimal:** ✅ Đã khớp

---

## Kết Quả Mong Đợi
Sau khi fix:
- Admin chọn style "Banner" → preview hiện background `brandColor`, text trắng, button trắng → **khớp 100% frontend**
- Admin chọn style "Centered" → preview title màu `secondary`, secondary button border `brandColor` → **khớp frontend**
- Admin chọn style "Gradient" → preview hiện gradient đậm, text trắng, button trắng → **khớp frontend**

---

## Testing Checklist
1. Vào `/admin/home-components/[id]/edit` với type CTA
2. Chọn từng style: banner, centered, gradient
3. So sánh preview với frontend thực tế (mở tab preview URL)
4. Kiểm tra responsive: desktop, tablet, mobile
5. Kiểm tra dark mode (nếu có)

---

## Questions for User
Không có câu hỏi — tất cả thông tin đã rõ từ codebase. Sẵn sàng implement.