## DARE Problem-Solving Framework

---

### D - DEFINE (Định nghĩa vấn đề)

**Vấn đề chính:** Giao diện trang `/cart` thực tế khác với CartPreview trong experience editor.

---

### A - ANALYZE (Phân tích chi tiết)

| # | Khác biệt | Preview (CartPreview.tsx) | Thực tế (cart/page.tsx) |
|---|-----------|---------------------------|-------------------------|
| 1 | **Link "Thanh toán"** | `<Link>` thiếu `display: block` | `<Link>` có class đúng nhưng thiếu style hiển thị |
| 2 | **Table layout - mobile cards** | Dùng `CartItemRow` component riêng | Render inline khác cấu trúc |
| 3 | **Table layout - Summary** | `CartSummary` component chung | Render inline với style khác |
| 4 | **Page layout - grid** | `grid-cols-3` cố định | `lg:grid-cols-3` responsive |
| 5 | **Nút "Thanh toán"** | Preview: `<button>` | Thực tế: `<Link>` (đúng rồi) |
| 6 | **Cart items container** | Preview: có `bg-white rounded-xl border` wrapper | Thực tế: không có wrapper (page layout) |
| 7 | **Order Summary position** | Preview: luôn ở bên phải (page) hoặc dưới (mobile) | Thực tế: giống Preview nhưng thiếu wrapper styles |

**ROOT CAUSE chính:**
1. **Link Thanh toán không hiển thị đúng** - `<Link>` thiếu `display: block` để hiển thị full width
2. **Page layout thiếu wrapper** cho cart items (không có `bg-white rounded-xl border`)
3. **Table layout CartSummary** khác cấu trúc với Preview

---

### R - RESOLVE (Giải pháp)

#### Fix 1: Link Thanh toán cần `block`
**File:** `app/(site)/cart/page.tsx`

```tsx
// Hiện tại (có thể bị ẩn hoặc không full width)
<Link href="/checkout?fromCart=true"
  className="w-full py-3 rounded-xl text-white font-semibold text-sm text-center"
  style={{ backgroundColor: brandColor }}
>

// Cần thêm `block` để hiển thị đúng
<Link href="/checkout?fromCart=true"
  className="block w-full py-3 rounded-xl text-white font-semibold text-sm text-center"
  style={{ backgroundColor: brandColor }}
>
```

#### Fix 2: Page layout - thêm wrapper cho cart items
```tsx
// Hiện tại (page layout) - items không có wrapper
{items.map(item => (
  <div key={item._id} className="bg-white rounded-2xl border...">

// Preview có wrapper div bên ngoài
<div className="bg-white rounded-xl border border-slate-200 p-4">
  {items.map(item => ...)}
</div>
```

#### Fix 3: Table layout - Summary card wrapper
Preview dùng `<CartSummary>` component với `bg-slate-50 rounded-xl`, thực tế dùng `bg-white rounded-2xl` → cần đồng bộ

---

### E - EXECUTE (Kế hoạch thực thi)

| Step | Thay đổi | File |
|------|----------|------|
| 1 | Thêm `block` vào Link Thanh toán (cả table + page layout) | `app/(site)/cart/page.tsx` |
| 2 | Page layout: wrap cart items trong container có border | `app/(site)/cart/page.tsx` |
| 3 | Đồng bộ style Summary card giữa preview và thực tế | `app/(site)/cart/page.tsx` |

**Ưu tiên:** Fix #1 trước (Link không hiển thị đúng) → #2 (wrapper) → #3 (Summary style)