# Đồng bộ Modern & Minimal Preview với UI thực

## Phân tích sự khác biệt

### MODERN - Preview vs UI thực

| Yếu tố | Preview hiện tại | UI thực |
|--------|------------------|---------|
| **Layout** | Hero gradient đơn giản + thumbnails dưới | 2 cột: Gallery trái + Info phải |
| **Header** | Không có | Breadcrumb + Wishlist button góc phải |
| **Category** | Không có | Badge `bg-slate-100` |
| **Rating** | Star + number inline | `RatingInline` component |
| **Quantity** | Không có | Stepper tròn (rounded-full) |
| **Buttons** | Full-width stacked | Full-width stacked + Wishlist text button |
| **Highlights** | Không có | Grid 3 cols (Truck, Shield, ShoppingBag) |
| **heroStyle** | Không áp dụng | full/split/minimal ảnh hưởng container |

### MINIMAL - Preview vs UI thực

| Yếu tố | Preview hiện tại | UI thực |
|--------|------------------|---------|
| **Layout** | aspect-video đơn giản | 12-col grid: 7 gallery + 5 info |
| **Gallery** | 1 ảnh, không thumbnails | Thumbnails trái (vertical) + main image |
| **Title** | `text-lg` | `text-3xl md:text-5xl font-light` |
| **Buttons** | Flex-col đơn giản | Add to cart + Wishlist cùng row, Buy now dưới |
| **contentWidth** | Không áp dụng | narrow/medium/wide thay đổi max-width |
| **Info block** | Không có | SKU + Stock status dưới description |

---

## Kế hoạch sửa

### 1. Modern Preview
```
- Đổi layout thành grid 2 cột (gallery | info)
- Thêm header breadcrumb đơn giản
- Thêm category badge
- Thêm quantity stepper (rounded-full)
- Thêm highlights grid 3 cols (Truck, Shield, ShoppingBag)
- Áp dụng heroStyle cho container class
```

### 2. Minimal Preview
```
- Đổi layout thành grid 12 cols (7 | 5)
- Thumbnails dọc bên trái + main image
- Title lớn hơn (text-2xl font-light)
- Add to cart + Wishlist cùng hàng, Buy now riêng
- Áp dụng contentWidth cho max-width wrapper
- Thêm SKU/Stock info block
```

### 3. File cần sửa
- `components/experiences/previews/ProductDetailPreview.tsx`

---

## Ước lượng
- ~150 dòng code thay đổi cho cả 2 layout
- Không cần thay đổi file config page (các control đã có sẵn)