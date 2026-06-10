## Vấn đề

Dropdown autocomplete của Allbirds bị ẩn do parent container có `overflow-hidden`:

```tsx
<div className={cn('overflow-hidden transition-all duration-200', searchOpen ? 'w-48' : 'w-0')}>
  <HeaderSearchAutocomplete ... />
</div>
```

Dropdown nằm `absolute` bên trong container có `overflow-hidden` nên bị cắt mất.

## Giải pháp

**File:** `components/site/Header.tsx`

**Thay đổi:**
1. Bỏ `overflow-hidden` khỏi wrapper div
2. Dùng `opacity` và `pointer-events` thay vì `overflow-hidden` để ẩn/hiện input

```tsx
// Trước
<div className={cn('overflow-hidden transition-all duration-200', searchOpen ? 'w-48' : 'w-0')}>

// Sau  
<div className={cn('transition-all duration-200', searchOpen ? 'w-48 opacity-100' : 'w-0 opacity-0 pointer-events-none')}>
```