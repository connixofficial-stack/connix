## Root Cause

**File**: `app/(site)/layout.tsx` line 116

```tsx
<div className="min-h-screen flex flex-col overflow-x-hidden">
```

CSS `overflow-x-hidden` trên parent container **phá vỡ `position: sticky`**!

Đây là behavior của CSS: khi bất kỳ ancestor nào có `overflow: hidden/auto/scroll`, `sticky` sẽ bị vô hiệu hóa vì nó cần scroll context từ viewport/nearest scrolling ancestor.

---

## Giải pháp

### Option A: Bỏ `overflow-x-hidden` khỏi wrapper (Recommended)

```tsx
// Trước
<div className="min-h-screen flex flex-col overflow-x-hidden">

// Sau  
<div className="min-h-screen flex flex-col">
```

**Ưu điểm**: Simple, sticky hoạt động ngay
**Nhược điểm**: Có thể xuất hiện horizontal scroll nếu có content overflow

### Option B: Chuyển `overflow-x-hidden` sang `<main>`

```tsx
<div className="min-h-screen flex flex-col">
  <Header />
  <main className="flex-1 overflow-x-hidden">
    {children}
  </main>
</div>
```

**Ưu điểm**: Header sticky hoạt động, main content vẫn có overflow protection
**Nhược điểm**: Không có - đây là cách tốt nhất

### Option C: Dùng `clip` thay vì `hidden`

```tsx
<div className="min-h-screen flex flex-col overflow-x-clip">
```

**Ưu điểm**: `overflow-clip` không tạo scroll context nên không phá sticky
**Nhược điểm**: Cần check browser support (modern browsers OK)

---

## Recommendation

**Chọn Option B** - đã có sẵn `overflow-x-hidden` trong `<main>`, chỉ cần xóa khỏi parent wrapper.