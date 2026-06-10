## Problem Graph
1. [Main] Runtime error `ReturnsValidationError` ở `products:listAdminWithOffset`
   1.1 [ROOT CAUSE] `variantMinPrice` đang trả `null` nhưng validator `productAdminDoc.variantMinPrice` chỉ chấp nhận `number`

## Execution (with reflection)
1. Sửa validator tại `convex/products.ts`
   - Đổi:
     - `variantMinPrice: v.optional(v.number())`
   - Thành:
     - `variantMinPrice: v.optional(v.union(v.number(), v.null()))`
   - Reflection: ✓ Khớp đúng payload hiện tại (`aggregate?.minPrice ?? null`) và fix trực tiếp lỗi runtime.

2. Giữ nguyên logic handler và UI hiện có
   - Không đổi phần return `null` khi chưa có giá variant.
   - Giữ behavior frontend `/admin/products`: hiển thị **"Chưa có giá"**.
   - Reflection: ✓ Đúng lựa chọn của anh, không phát sinh thay đổi nghiệp vụ.

3. Verify
   - Chạy `bunx tsc --noEmit`.
   - Chạy lại flow trang `/admin/products` để xác nhận hết `ReturnsValidationError`.

4. Commit
   - Commit local theo style repo, ví dụ:
     - `fix(products): allow null variantMinPrice in admin query validator`
   - Kèm `.factory/docs` theo rule repo.

## Checklist
- [x] Validator chấp nhận `null` cho `variantMinPrice`
- [x] Giữ UI “Chưa có giá”
- [x] Không đổi business logic khác
- [x] Verify typecheck + runtime