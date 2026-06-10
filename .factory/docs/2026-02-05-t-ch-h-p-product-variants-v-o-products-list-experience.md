## Tổng quan hiện tại

**Đã có:**
- Product Variants đầy đủ trong Convex backend (`productVariants`, `productOptions`, `productOptionValues`)
- `VariantSelector` component hoạt động tốt trên trang chi tiết sản phẩm
- Cart/Wishlist đã hỗ trợ `variantId`
- Admin pages quản lý variants hoàn chỉnh

**Cần làm:** Tích hợp variants vào trang `/products` (products-list) và Experience Editor `/system/experiences/products-list`

---

## Đề xuất 3 giải pháp

### Option A: Quick Add Modal (Đề xuất)
**Mức độ phức tạp:** Trung bình | **UX:** Tốt nhất

Khi click "Thêm vào giỏ" trên product card có variants:
1. Mở modal nhỏ hiển thị `VariantSelector`
2. User chọn variant → click "Thêm vào giỏ" trong modal
3. Modal đóng, sản phẩm được thêm với variant đã chọn

**Ưu điểm:**
- UX mượt, không redirect khỏi trang list
- User không cần vào trang chi tiết chỉ để chọn variant
- Phổ biến ở các e-commerce lớn (Shopee, Tiki, Amazon)

**Công việc:**
- Tạo `QuickAddModal` component
- Sửa `handleAddToCart()` kiểm tra `product.hasVariants`
- Thêm toggle "Quick Add Modal" trong Experience Editor

---

### Option B: Inline Variant Preview
**Mức độ phức tạp:** Cao | **UX:** Trung bình

Hiển thị variants trực tiếp trên product card:
- Color swatches nhỏ dưới tên sản phẩm
- Hover/click swatch → đổi ảnh + giá

**Ưu điểm:**
- User thấy variants ngay trên list
- Trực quan cho products có ít variants (2-4 màu)

**Nhược điểm:**
- Chiếm diện tích card
- Phức tạp với products có nhiều option types (Size + Color)
- Vẫn cần modal/redirect khi thêm giỏ

---

### Option C: Redirect to Detail (Đơn giản nhất)
**Mức độ phức tạp:** Thấp | **UX:** Cơ bản

Khi click "Thêm giỏ" trên product có variants → redirect đến trang chi tiết

**Ưu điểm:**
- Ít code thay đổi nhất
- Tận dụng `VariantSelector` đã có

**Nhược điểm:**
- UX kém - user bị redirect nhiều lần
- Không phù hợp e-commerce hiện đại

---

## Experience Editor Config (cho Option A/B)

Thêm vào `/system/experiences/products-list`:

```typescript
// Trong ControlCard "Tính năng sản phẩm"
<ToggleRow
  label="Quick Add cho Variants"
  description="Mở modal chọn variant khi thêm giỏ"
  checked={config.enableQuickAddVariant}
  onChange={(v) => setConfig(prev => ({ ...prev, enableQuickAddVariant: v }))}
/>
```

---

## Files cần thay đổi (Option A)

| File | Thay đổi |
|------|----------|
| `components/products/QuickAddModal.tsx` | **Tạo mới** - Modal chọn variant |
| `app/(site)/products/page.tsx` | Thêm logic kiểm tra variants, mở modal |
| `app/system/experiences/products-list/page.tsx` | Thêm toggle config |
| `lib/experiences/products.ts` | Mở rộng config type |

**Ước tính:** ~200-300 dòng code mới