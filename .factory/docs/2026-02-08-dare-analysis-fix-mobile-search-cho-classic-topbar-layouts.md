## DARE Framework Analysis

### Problem Graph
```
1. [Main] Mobile search không hoạt động ở Classic/Topbar
   ├── 1.1 [Sub] Search button có onClick nhưng input không hiện
   │   └── 1.1.1 [ROOT CAUSE #1] CSS `md:hidden` không hoạt động trong preview container
   │       - Preview container có fixed width (375px cho mobile)
   │       - Tailwind responsive classes dựa trên VIEWPORT width, không phải container width
   │       - Dù container 375px, viewport vẫn lớn hơn 768px -> `md:hidden` = hidden
   │
   └── 1.2 [Sub] Allbirds hoạt động đúng - tại sao?
       └── 1.2.1 [ROOT CAUSE #2] Allbirds dùng `device === 'mobile'` thay vì CSS responsive
           - Line 730: `{device === 'mobile' && config.search.show && searchOpen && ...}`
           - Điều kiện JS dựa trên prop `device`, không phải CSS breakpoint
```

### Root Cause Analysis

**Classic/Topbar (BUG):**
```tsx
{config.search.show && searchOpen && (
  <div className="md:hidden ...">  // <- CSS responsive, dựa trên VIEWPORT
    <input ... />
  </div>
)}
```

**Allbirds (ĐÚNG):**
```tsx
{device === 'mobile' && config.search.show && searchOpen && (
  <div className="px-6 pb-4">  // <- Không có md:hidden, dùng JS condition
    <input ... />
  </div>
)}
```

### Giải pháp

Thay vì dùng CSS responsive (`md:hidden`), cần dùng **JavaScript condition** dựa trên prop `device` giống như Allbirds - vì preview component được render trong container có fixed width, không phải viewport thực.

**Sửa cho Classic layout (line ~402):**
```tsx
// Từ
{config.search.show && searchOpen && (
  <div className="md:hidden px-6 pb-4 ...">

// Thành
{device === 'mobile' && config.search.show && searchOpen && (
  <div className="px-6 pb-4 ...">
```

**Sửa cho Topbar layout (line ~548):**
```tsx
// Từ
{config.search.show && searchOpen && (
  <div className="md:hidden px-4 pb-4 ...">

// Thành
{device === 'mobile' && config.search.show && searchOpen && (
  <div className="px-4 pb-4 ...">
```

### Files cần sửa
- `components/experiences/previews/HeaderMenuPreview.tsx` (2 chỗ)

### Kết luận
Vấn đề là sự khác biệt giữa **CSS responsive** (dựa trên viewport) và **JavaScript condition** (dựa trên prop). Trong preview component với fixed-width container, chỉ JS condition mới hoạt động đúng.