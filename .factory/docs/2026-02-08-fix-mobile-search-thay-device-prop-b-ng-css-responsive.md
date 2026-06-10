## Root Cause

Điều kiện `device === 'mobile'` chỉ hoạt động khi user chọn "Mobile" trong DeviceToggle của preview editor. Khi resize browser thật, prop `device` vẫn giữ nguyên giá trị cũ (desktop/tablet).

## Giải pháp

Thay vì dùng `device === 'mobile'` để show/hide search input, cần dùng **CSS responsive** (Tailwind classes `md:hidden`, `hidden md:block`) để tự động responsive theo viewport thực.

### Thay đổi cho Classic layout (~line 383-410):

1. Bọc search input trong div với class `md:hidden` để chỉ hiện khi < 768px
2. Giữ nguyên logic `searchOpen` state để toggle

```tsx
// Thêm điều kiện CSS responsive
{config.search.show && searchOpen && (
  <div className="md:hidden px-6 pb-4 border-b border-slate-100 dark:border-slate-800">
    <input ... />
  </div>
)}
```

### Thay đổi cho Topbar layout (~line 545-555):

Tương tự - thêm `md:hidden` class

### Files cần sửa
- `components/experiences/previews/HeaderMenuPreview.tsx`

### Lưu ý
- Giữ nguyên điều kiện `device === 'mobile'` cho preview chính xác trong editor
- Thêm **OR** với CSS class để cũng hoạt động khi resize browser thực