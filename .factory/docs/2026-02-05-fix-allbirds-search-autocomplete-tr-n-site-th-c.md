## Vấn đề

Trang site thực (`Header.tsx`), style **Allbirds** không có autocomplete gợi ý khi gõ search, trong khi Classic và Topbar hoạt động bình thường.

## Nguyên nhân

Trong Allbirds style, `HeaderSearchAutocomplete` có prop `disabled={!searchOpen}`. Khi click icon search:
1. `searchOpen` chuyển thành `true`
2. Input mới hiện ra với animation (`w-0` → `w-48`)
3. Nhưng input chưa được auto-focus, user phải click lại vào input
4. Hoặc do timing animation, autocomplete chưa kịp enable

## Giải pháp

**File:** `components/site/Header.tsx`

**Thay đổi trong Allbirds style (desktop search):**
1. Bỏ prop `disabled={!searchOpen}` - để autocomplete luôn sẵn sàng
2. Thêm auto-focus vào input khi `searchOpen=true` (dùng `useEffect` hoặc `autoFocus` trong component)

**Code thay đổi:**
```tsx
// Trước
<HeaderSearchAutocomplete
  ...
  disabled={!searchOpen}
/>

// Sau
<HeaderSearchAutocomplete
  ...
  // Bỏ disabled prop
/>
```

Và có thể cần thêm logic auto-focus trong `HeaderSearchAutocomplete` khi được enable.