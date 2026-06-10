## Problem Graph
1. [Main] Cột “Giá bán” ở `/admin/products` đang hiển thị `0 đ` trong khi mode bán là `contact/affiliate` <- depends on 1.1, 1.2
   1.1 [Sub] Chưa đọc `saleMode` ở trang list để quyết định label hiển thị <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Logic render giá chỉ format số tiền, không có nhánh “Giá liên hệ”
   1.2 [Sub] Có 2 luồng hiển thị giá (product thường và variant) cần thống nhất rule

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: Bổ sung `saleMode` từ `settingsData` tương tự pattern `variantEnabled/variantPricing` đang có sẵn.
   - Action: Thêm `useMemo` lấy `saleMode` (`contact|affiliate|cart`) và boolean `isContactLikeMode`.
   - Reflection: ✓ Valid, đúng convention file hiện tại, không đụng backend.

2. Áp rule cho cả 2 luồng giá (theo scope bạn đã chốt)
   - Thought: Cần áp cùng 1 rule cho:
     - Sản phẩm có variant (nhánh `variantEnabled && variantPricing === 'variant' && product.hasVariants`)
     - Sản phẩm thường (nhánh còn lại, gồm cả salePrice display)
   - Action:
     - Tạo helper local `renderContactPriceLabel(resolvedPrice: number)` hoặc inline condition rõ ràng.
     - Rule hiển thị:
       - Nếu `isContactLikeMode && resolvedPrice <= 0` => hiển thị `Giá liên hệ` (style muted giống text trạng thái)
       - Ngược lại giữ nguyên format giá hiện tại (`formatPrice(...)` / salePrice + line-through).
     - Với nhánh variant:
       - vẫn giữ `Chưa có giá` khi `!meta.hasPricedActiveVariant` (không đổi behavior cũ)
       - chỉ khi có giá resolved và bằng 0 mới đổi sang `Giá liên hệ`.
     - Với nhánh thường:
       - Nếu có `salePrice` và `salePrice > 0`: giữ UI đỏ + gạch giá gốc.
       - Nếu `salePrice` là `0` hoặc không có, dùng `resolvedBasePrice = product.price`; nếu bằng 0 và mode contact/affiliate thì hiện `Giá liên hệ`.
   - Reflection: ✓ Valid, đáp ứng đúng yêu cầu “cả sản phẩm thường + variant nếu giá hiển thị ra 0”.

3. Giữ KISS/YAGNI, tránh đổi ngoài phạm vi
   - Thought: Không đổi text header cột, không đổi schema/query, không đổi create/edit.
   - Action: Chỉ sửa render cell cột giá tại `app/admin/products/page.tsx`.
   - Reflection: ✓ Valid, minimal diff.

4. Verify
   - Thought: Theo rule repo, chỉ chạy typecheck khi đổi TS/TSX.
   - Action: Chạy `bunx tsc --noEmit`.
   - Reflection: ✓ Nếu pass thì an toàn type-level.

5. Commit theo guideline project
   - Action:
     - `git add` file code đã sửa + `.factory/docs/...` (nếu có)
     - review `git diff --cached`, `git status`
     - commit message đề xuất: `fix(products): show contact label for zero price in contact/affiliate mode`
   - Reflection: ✓ Tuân thủ rule “có thay đổi code thì phải commit, không push”.

## Checklist triển khai
- [ ] Thêm derive `saleMode`/`isContactLikeMode` trong `app/admin/products/page.tsx`
- [ ] Cập nhật nhánh render giá cho product thường
- [ ] Cập nhật nhánh render giá cho variant
- [ ] Không đổi behavior `Chưa có giá` khi variant chưa có giá active
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit local (không push)

Nếu bạn ok spec này, mình sẽ implement ngay đúng phạm vi trên.