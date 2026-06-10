## Vấn đề

Trang `/wishlist` thực tế (`app/(site)/wishlist/page.tsx`) chỉ có 2 layout:
- `grid` - check bằng `isGrid = config.layoutStyle === 'grid'`
- `list` - fallback khi không phải grid

**Thiếu layout `masonry`** - khi user chọn Masonry trong experience editor, trang thực tế vẫn hiển thị như grid.

---

## Giải pháp

Cập nhật `app/(site)/wishlist/page.tsx`:

### 1. Thêm logic check layoutStyle
```tsx
const layoutStyle = config.layoutStyle; // 'grid' | 'list' | 'masonry'
```

### 2. Thêm CSS classes cho masonry
```tsx
const masonryClasses = 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 [column-gap:1rem]';
```

### 3. Render 3 layouts riêng biệt
- `layoutStyle === 'grid'` → Grid đều
- `layoutStyle === 'list'` → Danh sách dọc  
- `layoutStyle === 'masonry'` → Pinterest-style với CSS columns + `break-inside-avoid`

### 4. Card masonry có aspect ratio khác nhau
Dựa vào index để tạo chiều cao khác nhau:
```tsx
const aspectRatios = ['aspect-square', 'aspect-[4/5]', 'aspect-[3/4]', 'aspect-[5/4]'];
```

---

## Files thay đổi
- `app/(site)/wishlist/page.tsx` - Thêm layout masonry vào trang thực tế