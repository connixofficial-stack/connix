## Trả lời câu hỏi

**Toggle "Thông báo" có tác dụng gì?**
- Bật/tắt hiển thị dòng text "Thông báo khi giảm giá" (icon Bell + text) trên mỗi wishlist item
- Liên kết với feature `enableNotification` từ module Wishlist
- Khi tắt: ẩn phần thông báo price drop notification trên UI

---

## Spec: Thêm Layout Masonry Pinterest

### Mô tả
Thêm layout **Masonry** (style Pinterest) vào Wishlist Experience với:
- Grid không đều - items có chiều cao khác nhau tạo hiệu ứng Pinterest
- Visual Minimal Clean - trắng, focus sản phẩm
- Không animation đặc biệt - đơn giản

### Files cần thay đổi

**1. `app/system/experiences/wishlist/page.tsx`**
- Thêm `'masonry'` vào type `WishlistLayoutStyle`
- Thêm option layout mới vào `LAYOUT_STYLES`:
  ```ts
  { id: 'masonry', label: 'Masonry', description: 'Pinterest-style grid không đều' }
  ```
- Thêm default config cho `layouts.masonry`

**2. `components/experiences/previews/WishlistPreview.tsx`**
- Thêm prop type `layoutStyle: 'grid' | 'list' | 'masonry'`
- Implement Masonry layout bằng CSS Grid + `grid-auto-rows: 10px` pattern:
  ```tsx
  {layoutStyle === 'masonry' && (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
      {mockWishlistItems.map((item, idx) => (
        <div key={item.id} className={`break-inside-avoid mb-4 ${getRandomHeight(idx)}`}>
          {/* Card content */}
        </div>
      ))}
    </div>
  )}
  ```
- Cards có chiều cao ngẫu nhiên (small/medium/large) dựa trên index
- Style minimal: nền trắng, border nhẹ, shadow-sm

### Kỹ thuật Masonry CSS (không cần JS)
Sử dụng CSS `columns` property (multi-column layout):
- `columns-3` trên desktop
- `columns-2` trên tablet  
- `columns-1` trên mobile
- `break-inside-avoid` để card không bị cắt

### Preview sẽ như thế nào
- Items xếp kiểu Pinterest với chiều cao khác nhau
- Một số items có ảnh lớn hơn (ratio 1:1, 4:5, hoặc 16:9)
- Vẫn giữ đủ các element: note, notification, add to cart button
- Responsive: collapse về 1 column trên mobile

### Không thay đổi
- Backend/API logic
- Các layout grid và list hiện có
- Module dependencies