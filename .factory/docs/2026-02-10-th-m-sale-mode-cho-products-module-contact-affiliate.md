## Problem Graph (DARE Framework)

```
1. [Main] Thêm Sale Mode cho Products Module
   ├── 1.1 [ROOT CAUSE] Backend: Thêm setting saleMode vào products.config.ts
   ├── 1.2 [Sub] Frontend: Cập nhật UI ở trang products list/detail
   │   ├── 1.2.1 [Sub] Logic hiển thị nút theo saleMode
   │   └── 1.2.2 [Sub] Link affiliate field cho admin
   └── 1.3 [Sub] Admin: Thêm trường affiliateLink vào form product
```

---

## Kế hoạch thực thi

### Phase 1: Backend - Module Config (ROOT CAUSE)

**File:** `lib/modules/configs/products.config.ts`

Thêm setting mới trong group `general`:

```ts
{
  key: 'saleMode',
  label: 'Chế độ bán hàng',
  type: 'select',
  default: 'cart',
  options: [
    { value: 'cart', label: 'Giỏ hàng (mặc định)' },
    { value: 'contact', label: 'Liên hệ đặt hàng' },
    { value: 'affiliate', label: 'Affiliate (link ngoài)' },
  ],
  group: 'general',
}
```

---

### Phase 2: Database Schema (nếu cần Affiliate)

**File:** `convex/schema.ts` - Thêm field vào `products` table:

```ts
affiliateLink: v.optional(v.string()),
```

**File:** `convex/products.ts` - Cập nhật create/update mutations để support field mới.

---

### Phase 3: Admin Form - Thêm trường Affiliate Link

**File:** `app/admin/products/[id]/edit/page.tsx` (hoặc component form tương ứng)

- Khi `saleMode === 'affiliate'`: Hiển thị input `Affiliate Link` (bắt buộc)
- Validation: URL hợp lệ

---

### Phase 4: Frontend Experience - Thay đổi nút bấm

**Files cần sửa:**
- `app/(site)/products/page.tsx` - Trang danh sách
- `app/(site)/products/[slug]/page.tsx` - Trang chi tiết

**Logic:**

| Sale Mode | Nút hiển thị | Hành động |
|-----------|-------------|-----------|
| `cart` | "Thêm giỏ hàng" + "Mua ngay" | Như hiện tại |
| `contact` | "Liên hệ đặt hàng" | Dẫn tới `/contact` |
| `affiliate` | "Mua ngay" | `window.open(affiliateLink, '_blank')` |

---

### Phase 5: Cập nhật Experience Config

**File:** `lib/experiences/useSiteConfig.ts` (hoặc hook tương ứng)

Thêm hook `useProductSaleMode()` để đọc setting từ `moduleSettings`.

---

## Tổng kết files cần thay đổi

| # | File | Thay đổi |
|---|------|----------|
| 1 | `lib/modules/configs/products.config.ts` | Thêm setting `saleMode` |
| 2 | `convex/schema.ts` | Thêm field `affiliateLink` |
| 3 | `convex/products.ts` | Cập nhật create/update mutations |
| 4 | Admin form (edit product) | Thêm input Affiliate Link |
| 5 | `app/(site)/products/page.tsx` | Logic nút theo saleMode |
| 6 | `app/(site)/products/[slug]/page.tsx` | Logic nút theo saleMode |
| 7 | Experience hooks | Hook đọc saleMode setting |

---

## Ước tính

- **Độ phức tạp:** Medium
- **Số files:** ~7-8 files
- **Thời gian:** ~30-45 phút

Bạn có muốn tôi bắt đầu thực hiện không?