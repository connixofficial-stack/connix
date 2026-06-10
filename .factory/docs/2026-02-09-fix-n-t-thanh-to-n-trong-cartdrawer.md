## Vấn đề

Trong `CartDrawer.tsx`, nút "Thanh toán" chỉ là một `<button>` **không có onClick handler** nên không làm gì cả:

```tsx
// Line 131-137 - CartDrawer.tsx
<button
  type="button"
  className="py-2 rounded-lg text-white text-sm font-semibold"
  style={{ backgroundColor: brandColor }}
  disabled={items.length === 0}
>
  Thanh toán
</button>
```

Trong khi trang `/cart/page.tsx` dùng `<Link>` đúng cách:
```tsx
<Link href="/checkout?fromCart=true" ...>Thanh toán</Link>
```

## Giải pháp

Thay `<button>` bằng `<Link>` giống trang `/cart`:

```tsx
<Link
  href="/checkout?fromCart=true"
  onClick={closeDrawer}
  className={`py-2 rounded-lg text-white text-sm font-semibold text-center ${items.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}
  style={{ backgroundColor: brandColor }}
>
  Thanh toán
</Link>
```

**Thay đổi:**
1. Thay `<button>` → `<Link>`  
2. Thêm `href="/checkout?fromCart=true"`
3. Thêm `onClick={closeDrawer}` để đóng drawer khi navigate
4. Thêm `text-center` class
5. Thay `disabled` bằng conditional class `opacity-50 pointer-events-none`