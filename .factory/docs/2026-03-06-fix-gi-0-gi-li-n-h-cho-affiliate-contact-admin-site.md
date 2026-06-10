## Problem Graph
1. [Main] Đồng bộ hiển thị giá cho home-components khi `saleMode=affiliate/contact` <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] `CategoryProducts` đang format giá cứng (`0đ`) ở cả admin preview và site renderer, không đọc `saleMode`
   1.2 `ProductList/ProductGrid` admin create/edit đang map `price` theo truthy check (`price ? ... : undefined`) nên `price=0` bị rỗng, không ra `Giá liên hệ`
   1.3 Thiếu util chung cho admin home-components để tránh lệch logic giữa các component

## Execution (with reflection)
1. Solving 1.1.1 (đọc saleMode + format giá đúng cho CategoryProducts)...
   - Thought: Reuse cùng contract với site hiện tại để không lệch behavior.
   - Action:
     - Sửa `app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx`
       - Query `saleMode` từ `api.admin.modules.getModuleSetting`.
       - Thay `formatPrice` thành `getPublicPriceLabel({ saleMode, price, salePrice })`.
       - Các chỗ hiển thị giá/giá gạch bỏ dùng `label` + `comparePrice` (không tự tính rời rạc).
     - Sửa `components/site/ComponentRenderer.tsx` (section `CategoryProductsSection`)
       - Query `saleMode` tương tự.
       - Dùng `getPublicPriceLabel` cho toàn bộ style (`grid/carousel/cards/bento/magazine/showcase`).
   - Reflection: ✓ Đồng bộ admin + site cho đúng yêu cầu.

2. Solving 1.2 (các home-component khác có lỗi tương tự)...
   - Thought: Những nơi đang map string giá bằng truthy check sẽ sai với `0`.
   - Action:
     - Sửa `app/admin/home-components/product-list/[id]/edit/page.tsx`
     - Sửa `app/admin/home-components/create/product-list/_shared.tsx`
     - Sửa `app/admin/home-components/product-grid/[id]/edit/page.tsx`
     - Sửa `app/admin/home-components/create/product-grid/page.tsx`
     - Thay mapping `price` từ kiểu `price ? ... : undefined` sang formatter theo `saleMode`:
       - `saleMode=cart`: giữ định dạng VND.
       - `saleMode=affiliate/contact` và giá hiển thị cuối cùng `<=0`: `Giá liên hệ`.
       - Nếu có `salePrice` hợp lệ < `price`, hiển thị sale + compare tương ứng theo contract.
   - Reflection: ✓ Bao phủ toàn bộ điểm tương tự đã quét được trong home-components sản phẩm.

3. Solving 1.3 (tránh lặp code/đảm bảo DRY)...
   - Thought: Tạo util dùng chung cho admin preview để tránh copy logic nhiều nơi.
   - Action:
     - Tạo util nhỏ trong `app/admin/home-components/_shared/lib/productPrice.ts` (hoặc file cùng khu vực shared hiện có) để:
       - resolve saleMode từ setting value (`cart|contact|affiliate`)
       - trả về `label/comparePrice/isContactPrice` bằng cách gọi `getPublicPriceLabel`.
     - Các page/preview ở bước 1-2 gọi util này thay vì tự format.
   - Reflection: ✓ KISS + DRY, dễ bảo trì.

4. Verification + commit
   - Chạy `bunx tsc --noEmit` sau khi sửa code TS.
   - Kiểm tra nhanh các flow:
     - admin create/edit `category-products`, `product-list`, `product-grid`
     - site render `CategoryProductsSection`
     - case matrix: cart / affiliate / contact + price=0 / price>0 / salePrice.
   - Commit local (không push), và add kèm `.factory/docs` nếu có theo rule repo.

## Các home-component có lỗi tương tự đã phát hiện
- `CategoryProducts` admin preview + site renderer (đang ra `0đ`).
- `ProductList` create/edit (admin preview mapping giá truthy).
- `ProductGrid` create/edit (admin preview mapping giá truthy).

## Kết quả mong đợi sau fix
- Khi `saleMode` là `affiliate` hoặc `contact`, nếu giá hiển thị cuối cùng `<= 0` thì luôn hiện **"Giá liên hệ"**.
- Hành vi nhất quán giữa admin preview và ngoài site.
- Không ảnh hưởng mode `cart`.