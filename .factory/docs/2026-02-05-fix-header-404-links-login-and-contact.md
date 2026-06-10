## Báo cáo phân tích DFS: Routes 404

### Gốc rễ vấn đề

**DEFAULT_LINKS trong Header.tsx sai path:**
```ts
const DEFAULT_LINKS = {
  login: '/login',      // ❌ Sai - Route thực tế là /account/login
  cta: '/contact',      // ❌ Chưa tồn tại trang frontend
  trackOrder: '/orders/tracking',  // ❌ Chưa tồn tại
  storeSystem: '/stores',          // ❌ Chưa tồn tại
};
```

---

### Chi tiết từng route

| Link | Status | Nguyên nhân | Giải pháp |
|------|--------|-------------|-----------|
| `/login` | 404 | Route thực tế là `/account/login` | Fix path thành `/account/login` |
| `/contact` | 404 | Chưa có trang `app/(site)/contact/page.tsx` | Tạo trang mới hoặc fix path |
| `/orders/tracking` | 404 | Chưa có trang tracking | Tạo hoặc ẩn feature |
| `/stores` | 404 | Chưa có trang cửa hàng | Tạo hoặc ẩn feature |

---

### Các trang Experience liên quan

| Experience | Frontend route | Status |
|------------|----------------|--------|
| Menu | Header component | ✅ Có (nhưng links sai) |
| Contact | `/contact` | ❌ Chưa có frontend page |
| Cart | `/cart` | ✅ Có |
| Checkout | `/checkout` | ✅ Có |
| Wishlist | `/wishlist` | ✅ Có |
| Products List | `/products` | ✅ Có |
| Posts List | `/posts` | ✅ Có |

---

### Đề xuất fix

**Option A: Fix links + Tạo trang thiếu (đầy đủ)**
1. Fix `/login` → `/account/login` trong Header.tsx + Preview
2. Tạo `app/(site)/contact/page.tsx` (đọc config từ Contact Experience)
3. Tạo `app/(site)/orders/tracking/page.tsx` hoặc ẩn feature
4. Tạo `app/(site)/stores/page.tsx` hoặc ẩn feature

**Option B: Chỉ fix links hiện có (nhanh)**
1. Fix `/login` → `/account/login`
2. Fix `/contact` → `/` (tạm thời link về home)
3. Ẩn Track Order và Store System trong topbar config

---

### Files cần sửa

| File | Thay đổi |
|------|----------|
| `components/site/Header.tsx` | Fix DEFAULT_LINKS |
| `components/experiences/previews/HeaderMenuPreview.tsx` | Fix defaultLinks |
| `app/(site)/contact/page.tsx` | Tạo mới (nếu Option A) |