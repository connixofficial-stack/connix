## Spec: Thêm Table Layout cho Cart Experience

### Tổng quan
Thêm layout `table` vào Cart Experience, tương tự như đã làm với Wishlist - hiển thị giỏ hàng dạng bảng dữ liệu với search/sort.

### Files cần thay đổi

| File | Thay đổi |
|------|----------|
| `app/system/experiences/cart/page.tsx` | Thêm `'table'` vào CartLayoutStyle và LAYOUT_STYLES |
| `components/experiences/previews/CartPreview.tsx` | Thêm table preview (desktop table + mobile cards) |
| `lib/experiences/useSiteConfig.ts` | Cập nhật CartConfig type thêm `'table'` |
| `app/(site)/cart/page.tsx` | Implement table layout với search/sort |

### Chi tiết triển khai

**1. Experience Editor (`app/system/experiences/cart/page.tsx`)**
```ts
type CartLayoutStyle = 'drawer' | 'page' | 'table';

const LAYOUT_STYLES = [
  { id: 'drawer', label: 'Drawer', description: 'Giỏ hàng dạng drawer/sidebar' },
  { id: 'page', label: 'Page', description: 'Giỏ hàng trang riêng' },
  { id: 'table', label: 'Table', description: 'Giỏ hàng dạng bảng dữ liệu' },
];
```

**2. Preview (`CartPreview.tsx`)**
- Desktop: Table với columns: Sản phẩm | Đơn giá | Số lượng | Thành tiền | Xóa
- Mobile: Card view tương tự page layout
- Có search bar và sort options

**3. Site Config (`useSiteConfig.ts`)**
```ts
type CartConfig = {
  layoutStyle: 'drawer' | 'page' | 'table';
  // ...existing fields
};
```

**4. Cart Page (`app/(site)/cart/page.tsx`)**
- Thêm điều kiện `layoutStyle === 'table'`
- Table UI với:
  - Search sản phẩm trong giỏ
  - Sort theo: Tên A-Z, Giá tăng/giảm, Số lượng
  - Desktop: table layout
  - Mobile: card fallback
- Giữ nguyên page layout cho các layout khác

### Lưu ý
- Drawer layout không thay đổi (vẫn là sidebar)
- Table layout chỉ áp dụng cho full page view
- Mobile sẽ fallback về card view (giống page layout)