# Spec: Fix CTA Preview Responsive - Force Mobile Styles

## Root Cause
Preview vỡ responsive vì:
- Preview render trong desktop viewport (1920px) → Tailwind `md:flex-row` active
- Container chỉ 375px/768px → layout desktop bị chật → text overflow
- Site rendering OK vì mobile viewport thật → base styles (flex-col) active

## Solution: Container Queries
Force preview container behavior giống mobile viewport bằng **CSS Container Queries**.

---

## Implementation

### 1. Enable Container Queries cho BrowserFrame
**File**: `app/admin/home-components/_shared/components/BrowserFrame.tsx`

Thêm `@container` vào wrapper:
```tsx
export const BrowserFrame = ({ children, url = 'yoursite.com' }: { children: React.ReactNode; url?: string }) => (
  <div className="@container/preview border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-lg">
    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex items-center gap-2 border-b">
      {/* Browser chrome - giữ nguyên */}
    </div>
    {children}
  </div>
);
```

**Changes**:
- Thêm `@container/preview` vào root div
- Container query sẽ theo dõi width của BrowserFrame thay vì viewport

---

### 2. Update CTASectionShared responsive classes
**File**: `app/admin/home-components/cta/_components/CTASectionShared.tsx`

**Chiến lược**: Thêm container query breakpoints cho preview context.

#### Banner Layout (line ~48-62):
```tsx
// FROM (viewport-based):
<div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-5 px-4 sm:gap-6 sm:px-6 md:flex-row md:gap-8">

// TO (container + viewport hybrid):
<div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-5 px-4 sm:gap-6 sm:px-6 md:flex-row md:gap-8 @md/preview:flex-row @md/preview:gap-8">
```

**Giải thích**: 
- `md:flex-row` - viewport ≥ 768px (site)
- `@md/preview:flex-row` - container ≥ 768px (preview)
- Mobile preview (375px): cả 2 đều không active → `flex-col` (OK)
- Tablet preview (768px): `@md/preview:flex-row` active → desktop layout (OK)

#### Floating Layout (line ~88-107):
```tsx
// Section padding
<section className="bg-slate-50 px-4 py-8 md:py-14 lg:py-16 @md/preview:py-14" ...>
  
// Inner container
<div className="mx-auto max-w-5xl px-4 sm:px-6 @md/preview:px-6">
  
// Card padding
<div className="rounded-xl border p-5 sm:p-6 md:p-8 @md/preview:p-8" ...>
  
// Flex direction
<div className="flex flex-col items-center justify-between gap-5 text-center sm:gap-6 md:flex-row md:text-left @md/preview:flex-row @md/preview:text-left">
```

#### Minimal Layout (default return, line ~122-143):
```tsx
// Section padding
<section className="border-y px-4 py-6 md:py-8 lg:py-10 @md/preview:py-8" ...>

// Container
<div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:gap-5 sm:px-6 md:flex-row md:gap-8 @md/preview:flex-row @md/preview:gap-8">

// Text alignment
<div className="flex items-center gap-3 text-center sm:gap-4 md:text-left @md/preview:text-left">
```

#### Text overflow protection
Thêm `break-words` cho tất cả headings và descriptions:
```tsx
// Headings
<HeadingTag className="... break-words" ...>

// Descriptions  
<p className="... break-words" ...>
```

---

### 3. Centered và Gradient Layouts (Bonus)
Nếu cần, áp dụng tương tự cho 2 layouts còn lại:

**Centered** (line ~64-77):
```tsx
<div className="mt-5 flex flex-col items-center justify-center gap-3 sm:mt-6 sm:flex-row md:mt-7 @md/preview:mt-7 @md/preview:flex-row">
```

**Gradient** (line ~109-120):
```tsx
<div className="mt-5 flex flex-col items-center justify-center gap-3 sm:mt-6 sm:flex-row md:mt-7 @md/preview:mt-7 @md/preview:flex-row">
```

---

## Changes Summary
**2 files** cần sửa:
1. `BrowserFrame.tsx` - thêm `@container/preview`
2. `CTASectionShared.tsx` - thêm container queries `@md/preview:*`

**3 layouts** ưu tiên fix:
- Banner
- Floating  
- Minimal

**Pattern**: Mọi responsive class `md:*` thêm duplicate `@md/preview:*`

---

## Testing Checklist
- [ ] Mobile preview (375px): layout flex-col, padding nhỏ
- [ ] Tablet preview (768px): layout flex-row, padding lớn hơn
- [ ] Desktop preview: giữ nguyên hiện tại
- [ ] Site rendering (mobile/tablet/desktop): không ảnh hưởng (vì không có @container)

---

## Fallback (nếu container queries không work)
Nếu Tailwind v4 chưa hỗ trợ đủ tốt, dùng CSS custom:

```css
/* globals.css */
@container preview (max-width: 640px) {
  .cta-section {
    @apply flex-col gap-4 px-3;
  }
}
```

Nhưng **ưu tiên dùng Tailwind classes** trước.