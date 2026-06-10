## ROOT CAUSE (DARE Analysis)

### Vấn đề chính
Query `listPublicPromotions` có filter:
```typescript
if (!promo.displayOnPage) {return false;}
```

Điều kiện này loại promotion khi `displayOnPage` là `false` **HOẶC** `undefined`.

### Nguyên nhân có thể

**1. Feature "enableDisplay" đang TẮT** ở `/system/modules/promotions`
   - Khi tắt → Frontend gửi `displayOnPage: undefined`
   - Backend fallback: `displayOnPage = (promotionType === "coupon")` 
   - Nếu không phải coupon → `displayOnPage = false` → BỊ LOẠI

**2. Promotion cũ không có `displayOnPage`**
   - Promotions được tạo trước khi thêm field này → `displayOnPage = undefined` → BỊ LOẠI

### Giải pháp đề xuất

**Option A: Sửa filter logic (recommended)**
```typescript
// Thay đổi từ:
if (!promo.displayOnPage) {return false;}

// Thành (default true nếu undefined):
if (promo.displayOnPage === false) {return false;}
```

**Option B: Migration data cũ**
- Chạy migration update tất cả promotions có `displayOnPage === undefined` → `displayOnPage = true`

**Option C: Cả A + B** (đảm bảo nhất)

---

Bạn muốn tôi thực hiện option nào?