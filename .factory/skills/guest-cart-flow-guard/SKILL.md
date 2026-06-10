---
name: guest-cart-flow-guard
description: Bảo vệ luồng hoạt động giỏ hàng vãng lai (Guest Cart Flow) không bắt buộc đăng nhập và đảm bảo hiển thị đồng bộ variant label.
---

# Kỹ năng bảo vệ: Luồng hoạt động Giỏ hàng vãng lai (Guest Cart Flow Guard)

Kỹ năng này tự động kích hoạt khi bất kỳ tác nhân AI nào thực hiện sửa đổi các thành phần liên quan đến:
- Giỏ hàng (`components/site/CartDrawer.tsx`, `app/(site)/cart/page.tsx`, `lib/cart/`)
- Trang thanh toán đơn hàng (`app/(site)/checkout/page.tsx`)
- Thêm giỏ hàng / Mua ngay tại danh sách và chi tiết sản phẩm.

## 1. Nguyên tắc cốt lõi (Core Guidelines)

> [!IMPORTANT]
> **KHÔNG ĐƯỢC PHÉP bắt buộc đăng nhập để xem giỏ hàng hoặc checkout từ giỏ hàng.**
> Giỏ hàng và Checkout từ giỏ hàng là các tính năng mở cửa tự do cho cả khách vãng lai (guest) và thành viên (customer).

1. **Đọc dữ liệu từ `useCart()`**: Luôn luôn sử dụng dữ liệu từ hook `useCart()` làm nguồn dữ liệu chính cho giỏ hàng ở cả storefront drawer, cart page và checkout page. Hook này tự động điều hướng lấy dữ liệu guest session hoặc customer đăng nhập.
2. **Hiển thị Variant Label**: Bất kể layout nào (`drawer`, `page`, `table`), nếu item trong giỏ có `variantId`, hệ thống bắt buộc phải truy vấn tên tùy chọn phiên bản sản phẩm và hiển thị dạng `Tên tùy chọn: Giá trị` để đảm bảo trải nghiệm khách hàng cao nhất.
3. **Cơ chế gộp giỏ hàng (Merge Cart)**: Đảm bảo logic merge cart tự động chạy khi người dùng đăng nhập tài khoản.

## 2. Quy trình rà soát hồi quy (Regression Review Flow)

Khi chỉnh sửa bất kỳ tệp tin nào thuộc phân vùng giỏ hàng/thanh toán, hãy tự động rà soát checklist sau:
- [ ] Không có early return check `isAuthenticated` chặn hiển thị giỏ hàng.
- [ ] Không có chốt chặn đăng nhập khi truy cập `/checkout?fromCart=true`.
- [ ] Đơn hàng của khách vãng lai vẫn được tạo bình thường thông qua mutation `api.orders.placeOrder`.
- [ ] Khách vãng lai thanh toán thành công thì giỏ hàng ẩn danh phải được dọn sạch (`cartId` được gửi lên mutation để clear).

## 3. Các hành vi CẤM (Forbidden Actions)

> [!CAUTION]
> - CẤM khôi phục các hộp thoại yêu cầu đăng nhập (login prompt) ở `CartDrawer` và `/cart`.
> - CẤM tự ý thay đổi cấu trúc schema của bảng `cartItems` hoặc `carts` trong Convex mà không có sự đồng ý của kỹ sư trưởng.
> - CẤM bỏ qua việc hiển thị nhãn variant khi hiển thị sản phẩm trong giỏ hàng.
