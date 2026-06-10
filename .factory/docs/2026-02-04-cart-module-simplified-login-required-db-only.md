## Triển khai Cart Module - Cập nhật (Đơn giản hóa)

### Thay đổi so với plan trước:
- **BỎ Guest Cart** - Không cần session management
- **Bắt buộc đăng nhập** - Ấn nút "Thêm vào giỏ" khi chưa login → `openLoginModal()`
- **Cart chỉ lưu DB** với `customerId` (giống pattern Wishlist)

---

### Phase 1: Cart Config & Context (3 files)

**1. `lib/experiences/useSiteConfig.ts`** - Thêm `useCartConfig()`
```ts
type CartConfig = {
  layoutStyle: 'drawer' | 'page';
  showExpiry: boolean;
  showNote: boolean;
};
```

**2. `lib/cart/CartContext.tsx`** - Cart Provider
- Sử dụng `useCustomerAuth()` để lấy customer
- Nếu chưa login → return empty cart, `openLoginModal` khi add
- Query cart từ DB bằng `customerId`
- Expose: `cart`, `items`, `itemsCount`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`

**3. `lib/cart/index.ts`** - Export

---

### Phase 2: Frontend Pages (3 files)

**4. `app/(site)/cart/page.tsx`** - Trang Cart
- Require login (redirect/show login prompt nếu chưa)
- Layout theo `cartConfig.layoutStyle` (page/drawer)
- Hiện items, quantity controls, subtotal, checkout button

**5. `components/site/CartDrawer.tsx`** - Drawer component (optional)
- Slide-in từ phải
- Dùng khi `layoutStyle === 'drawer'`

**6. `components/site/CartIcon.tsx`** - Header cart icon
- Real-time count từ CartContext
- Click → navigate to /cart hoặc open drawer

---

### Phase 3: Tích hợp Add to Cart (3 files update)

**7. `app/(site)/products/page.tsx`** - Products List
- Import `useCart()`
- onClick: `if (!isAuthenticated) openLoginModal(); else addItem(productId, 1);`

**8. `app/(site)/products/[slug]/page.tsx`** - Product Detail
- Tương tự, với quantity selector

**9. `app/(site)/wishlist/page.tsx`** - Wishlist
- Tương tự

---

### Phase 4: Header & Experience Admin (2 files update)

**10. `components/site/Header.tsx`**
- Thay cart count hardcoded "0" bằng `cartContext.itemsCount`
- Import CartIcon component

**11. `app/system/experiences/cart/page.tsx`**
- Thêm module links: Orders, Products, Checkout
- Disable Guest Cart toggle (vì không dùng)

---

### Phase 5: Cleanup & Polish

**12. Update `cart.config.ts`**
- Bỏ hoặc disable `enableGuestCart` feature

**13. Verify & Test**
- `bunx oxlint --type-aware --type-check --fix`
- Test flow: Login → Add to cart → View cart → Update quantity → Remove

---

### Files tạo mới (4):
- `lib/cart/CartContext.tsx`
- `lib/cart/index.ts`
- `app/(site)/cart/page.tsx`
- `components/site/CartIcon.tsx`

### Files update (7):
- `lib/experiences/useSiteConfig.ts`
- `app/(site)/products/page.tsx`
- `app/(site)/products/[slug]/page.tsx`
- `app/(site)/wishlist/page.tsx`
- `components/site/Header.tsx`
- `app/system/experiences/cart/page.tsx`
- `lib/modules/configs/cart.config.ts`

---

### Logic chính:
```
Chưa login + Click "Thêm vào giỏ" → openLoginModal()
Đã login + Click "Thêm vào giỏ" → addItem(productId, quantity)
                                 → Convex mutation api.cart.addItem
                                 → Cart tự động tạo nếu chưa có
                                 → Real-time update UI
```

Tổng: **11 files**, không cần Guest Cart, pattern giống Wishlist.