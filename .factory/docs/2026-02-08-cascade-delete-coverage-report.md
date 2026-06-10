## Kết quả quét các trang /admin

### Đã tích hợp DeleteConfirmDialog (8 trang):
1. `categories/page.tsx` - productCategories
2. `product-categories/page.tsx` - productCategories
3. `post-categories/page.tsx` - postCategories
4. `service-categories/page.tsx` - serviceCategories
5. `customers/page.tsx` - customers
6. `products/page.tsx` - products
7. `product-options/page.tsx` - productOptions
8. `promotions/page.tsx` - promotions

### Còn thiếu - vẫn dùng confirm() (17 trang):

**Quan trọng (có dữ liệu liên quan):**
- `posts/page.tsx` - posts (có comments, views)
- `services/page.tsx` - services (có bookings)
- `orders/page.tsx` - orders (có orderItems, promotionUsage)
- `users/page.tsx` - users (có roles, sessions)
- `roles/page.tsx` - roles (có userRoles)
- `reviews/page.tsx` - comments/reviews
- `comments/page.tsx` - comments

**Ít quan trọng (không cascade hoặc độc lập):**
- `notifications/page.tsx` - độc lập
- `wishlist/page.tsx` - độc lập
- `cart/page.tsx`, `cart/[id]/page.tsx` - cartItems
- `media/page.tsx`, `media/[id]/edit/page.tsx` - images
- `menus/page.tsx`, `menus/[id]/edit/page.tsx` - menuItems
- `home-components/page.tsx`, `homepage/page.tsx` - homeComponents
- `products/[id]/variants/page.tsx` - productVariants
- `product-options/[id]/values/page.tsx` - optionValues

### Đề xuất
Bạn muốn tôi tiếp tục implement cascade delete cho các trang còn thiếu không? Có thể ưu tiên nhóm "Quan trọng" trước.