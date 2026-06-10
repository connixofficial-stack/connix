## DARE Problem-Solving Framework

---

### D - DEFINE (Định nghĩa vấn đề)

**3 vấn đề cần giải quyết:**

| # | Vấn đề | Vị trí | Tác động |
|---|--------|--------|----------|
| 1 | Checkout experience thiếu link xem mẫu | `/system/experiences/checkout` | Admin không thể preview checkout thật |
| 2 | Trang checkout chưa tạo được đơn hàng | `/checkout` | User click "Đặt hàng" không có gì xảy ra |
| 3 | Nút Thanh toán ở Cart không hoạt động | `/cart` | User không thể chuyển từ cart sang checkout |

---

### A - ANALYZE (Phân tích nguyên nhân)

**1. Checkout experience thiếu link mẫu**
- Product-detail experience đã có pattern: `useExampleProductSlug()` + `<ExampleLinks>`
- Checkout cần `productId` (không chỉ slug) để tạo URL checkout
- Hook `useExampleProductSlug` chỉ trả về `slug`, cần tạo hook mới hoặc query thêm

**2. Trang /checkout chưa tạo đơn**
- API `api.orders.create` đã có sẵn trong Convex
- Frontend thiếu:
  - Form thu thập thông tin (tên, SĐT, địa chỉ)
  - Gọi mutation `api.orders.create`
  - Xử lý success/error sau khi đặt đơn

**3. Nút Thanh toán ở /cart**
- Hiện tại: `<button>Thanh toán</button>` - không có onClick
- Cần: Navigate sang `/checkout` với thông tin cart
- 2 options:
  - **Option A:** `fromCart=true` → checkout đọc cart của user
  - **Option B:** Truyền items qua query params (phức tạp)

---

### R - RESOLVE (Giải pháp)

#### Task 1: Thêm link mẫu vào Checkout Experience
**File:** `lib/experiences/useExampleSlugs.ts`
```ts
export function useExampleProduct() {
  const products = useQuery(api.products.searchPublished, { limit: 1 });
  return products?.[0] ?? null; // Trả về cả object (có _id, slug)
}
```

**File:** `app/system/experiences/checkout/page.tsx`
- Import `useExampleProduct` (hook mới)
- Thêm Card "Link & ghi chú" giống product-detail
- Link: `/checkout?productId=${product._id}&quantity=1`

#### Task 2: Hoàn thiện trang /checkout để đặt đơn
**File:** `app/(site)/checkout/page.tsx`

**Thêm:**
- State form: `customerName`, `customerPhone`, `shippingAddress`, `paymentMethod`, `shippingMethod`
- Mutation: `useMutation(api.orders.create)`
- Logic submit:
```ts
const orderId = await createOrder({
  customerId: customer.id,
  items: [{
    productId, productName: product.name, 
    price: unitPrice, quantity, variantId, variantTitle
  }],
  shippingAddress,
  paymentMethod,
  shippingFee: shippingMethod === 'fast' ? 30000 : 15000,
});
// Success → redirect hoặc hiện thông báo
```

#### Task 3: Fix nút Thanh toán ở /cart
**File:** `app/(site)/cart/page.tsx`

**Thay:**
```tsx
<button>Thanh toán</button>
```

**Thành:**
```tsx
<Link href="/checkout?fromCart=true">Thanh toán</Link>
```

**File:** `app/(site)/checkout/page.tsx` - Thêm logic đọc cart
```ts
const fromCart = searchParams.get('fromCart') === 'true';
const cartData = useQuery(api.cart.getByCustomer, 
  fromCart && customer ? { customerId: customer.id } : 'skip'
);
const cartItems = useQuery(api.cart.listCartItems,
  fromCart && cartData?._id ? { cartId: cartData._id } : 'skip'
);
// Nếu fromCart=true → dùng cartItems thay vì single product
```

---

### E - EXECUTE (Kế hoạch thực thi)

| Step | File | Thay đổi | Độ phức tạp |
|------|------|----------|-------------|
| 1 | `lib/experiences/useExampleSlugs.ts` | Thêm `useExampleProduct()` | Thấp |
| 2 | `app/system/experiences/checkout/page.tsx` | Import hook + thêm ExampleLinks | Thấp |
| 3 | `app/(site)/cart/page.tsx` | Thay button → Link | Thấp |
| 4 | `app/(site)/checkout/page.tsx` | Thêm form + gọi API + logic fromCart | **Cao** |

**Thứ tự thực hiện:** 1 → 2 → 3 → 4

**Testing checklist:**
- [ ] Link mẫu checkout hiện đúng trong experience editor
- [ ] Click Thanh toán từ /cart → navigate sang /checkout?fromCart=true
- [ ] Flow Buy Now: product detail → checkout → đặt đơn thành công
- [ ] Flow Cart: cart → checkout → đặt đơn thành công (multi items)