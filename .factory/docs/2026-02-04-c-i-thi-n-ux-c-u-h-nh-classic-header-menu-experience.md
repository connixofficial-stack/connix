## Vấn đề hiện tại

Cột "Cấu hình chi tiết" (giữa) đang chứa quá nhiều options:
- Brand name, Hotline, Email, Topbar toggles
- Search placeholder, Search options  
- CTA text, Login text
- **Khi chọn Classic**: thêm Background, Separator, Sticky header

**Kết quả**: Cột quá dài, người dùng phải scroll và khó tìm options liên quan.

---

## Đề xuất: Tách thành 4 cột (grid 4 cols)

### Cột 1: Hiển thị (giữ nguyên)
- Topbar, Search, Cart, Wishlist, Login, CTA toggles

### Cột 2: Topbar & Search
- Dùng settings liên hệ toggle
- Hotline, Email inputs
- Theo dõi đơn, Hệ thống cửa hàng toggles
- Search placeholder, Search sản phẩm/bài viết

### Cột 3: CTA & Brand
- Brand name input
- CTA text, Login text inputs

### Cột 4: Giao diện Classic (chỉ hiện khi style = classic)
- Classic background (Solid/Dots/Stripes)
- Brand accent line toggle
- Header separator (None/Shadow/Border/Gradient)
- Sticky header toggle

### Cột Module: Di chuyển xuống row riêng (full width)
- Links đến modules liên quan (nhỏ gọn hơn)

---

## Lợi ích

1. **Nhóm logic**: Các options liên quan nằm cùng nhau
2. **Bớt scroll**: Mỗi cột ngắn hơn
3. **Classic riêng biệt**: Options Classic tách ra cột riêng, dễ nhận diện
4. **Module links gọn**: Row riêng, không chiếm chỗ config