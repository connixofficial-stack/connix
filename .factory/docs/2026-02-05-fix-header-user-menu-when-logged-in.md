## Fix: Header User Menu cho đã đăng nhập

### Vấn đề hiện tại
1. Header chỉ có link tĩnh `/account/login` - không check `isAuthenticated`
2. Login page redirect về `/wishlist` khi đã login → confusing UX
3. Không có trang profile/orders cho customer

---

### Giải pháp

**1. Cập nhật Header.tsx**
- Import `useCustomerAuth` hook
- Thêm state `userMenuOpen` để toggle dropdown
- Khi `isAuthenticated`:
  - Hiển thị avatar/icon User có dropdown
  - Dropdown gồm: Tài khoản, Đơn hàng, Wishlist, Đăng xuất
- Khi chưa login: giữ nguyên link `/account/login`

**2. Tạo trang `/account/profile/page.tsx`**
- Hiển thị thông tin customer (name, email, phone)
- Form edit profile (optional phase 2)

**3. Tạo trang `/account/orders/page.tsx`**
- Lấy orders theo `customerId` từ `orders.listByCustomer`
- Hiển thị danh sách đơn hàng (mã, ngày, trạng thái, tổng tiền)

**4. Cập nhật trang login**
- Redirect về `/account/profile` thay vì `/wishlist` (hoặc giữ `/wishlist` nếu bạn muốn)

---

### Files thay đổi

| File | Thay đổi |
|------|----------|
| `components/site/Header.tsx` | Thêm useCustomerAuth, user dropdown menu |
| `app/(site)/account/profile/page.tsx` | Tạo mới - trang thông tin tài khoản |
| `app/(site)/account/orders/page.tsx` | Tạo mới - trang lịch sử đơn hàng |
| `app/(site)/account/login/page.tsx` | Đổi redirect về /account/profile |
| `components/experiences/previews/HeaderMenuPreview.tsx` | Cập nhật preview tương ứng |

---

### User Menu Items
```
┌─────────────────────┐
│ 👤 Xin chào, {name} │
├─────────────────────┤
│ Thông tin tài khoản │  → /account/profile
│ Đơn hàng của tôi    │  → /account/orders
│ Danh sách yêu thích │  → /wishlist
├─────────────────────┤
│ Đăng xuất           │  → logout()
└─────────────────────┘
```