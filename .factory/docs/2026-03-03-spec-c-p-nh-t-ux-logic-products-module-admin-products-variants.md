## Problem Graph
1. [Đồng bộ logic hiển thị field Products/Admin] <- depends on 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
   1.1 [Ẩn giá ở Product create/edit khi bật variant + chọn giá theo phiên bản]
   1.2 [Ẩn SKU ở Variant create/edit khi feature SKU tắt]
   1.3 [Realtime helper text format số cho giá ở Variant form]
   1.4 [Thêm setting enum Loại sản phẩm (physical/digital/both) thay toggle digital]
   1.5 [Cập nhật placeholder SEO + label giá khuyến mãi]
   1.6 [Thêm nút mở /admin/product-options (tab mới) trong block Phiên bản sản phẩm]

## Execution (with reflection)
1. Cập nhật cấu hình module products tại `lib/modules/configs/products.config.ts`
   - Thought: Nguồn sự thật của /system/modules/products nằm ở config module.
   - Action:
     - Thêm setting mới `productTypeMode` (select): `physical | digital | both`, default `both`, group `digital`.
     - Xóa/replace setting `enableDigitalProducts` cũ theo quyết định của bạn (thay hoàn toàn bằng enum).
     - Giữ `defaultDigitalDeliveryType` nhưng chuyển `dependsOn` sang `productTypeMode` (hiển thị khi mode có digital: `digital` hoặc `both`) — nếu engine hiện tại chỉ hỗ trợ dependsOn boolean thì sẽ bổ sung guard ở UI admin create/edit để đảm bảo behavior đúng.
   - Reflection: ✓ Đúng CoC, không để 2 setting chồng chéo nghĩa.

2. Đồng bộ logic Product create tại `app/admin/products/create/page.tsx`
   - Thought: Trang create đang luôn require price và luôn hiện radio vật lý/digital khi digitalEnabled=true.
   - Action:
     - Đọc setting `productTypeMode` thay cho `enableDigitalProducts`.
     - Render loại sản phẩm theo mode:
       - `physical`: ẩn radio, fix `productType='physical'`.
       - `digital`: ẩn radio, fix `productType='digital'`.
       - `both`: hiện radio như hiện tại.
     - Logic giá sản phẩm:
       - Tính `hideBasePricing = variantEnabled && hasVariants && variantPricing==='variant'`.
       - Khi `hideBasePricing=true`: ẩn input `price` + `salePrice` ở Product form.
       - Submit: cho phép bỏ required price UI, nhưng vẫn gửi fallback `price: 0` để không vỡ schema hiện tại.
     - Đổi text:
       - Label sale price từ `Giá khuyến mãi (VNĐ)` -> `Giá chưa giảm`.
       - Placeholder Meta Title -> `Lấy theo tên sản phẩm nếu để trống`.
       - Placeholder Meta Description -> `Lấy theo mô tả sản phẩm nếu bạn để trống`.
     - Ở Card “Phiên bản sản phẩm” thêm nút nhỏ `Mở quản lý tùy chọn` (icon ExternalLink), `target="_blank"`, href `/admin/product-options`.
   - Reflection: ✓ Đúng UX yêu cầu, giữ tương thích backend hiện có.

3. Đồng bộ logic Product edit tại `app/admin/products/[id]/edit/page.tsx`
   - Thought: Edit cần behavior giống create để tránh lệch.
   - Action:
     - Áp dụng cùng logic `productTypeMode` như create.
     - Áp dụng cùng `hideBasePricing` để ẩn giá khi variant pricing là `variant` và sản phẩm bật variants.
     - Cập nhật text giống create (sale label + placeholder meta).
     - Thêm nút mở `/admin/product-options` ở card “Phiên bản sản phẩm” (tab mới).
     - Submit fallback price giữ an toàn schema như create khi field bị ẩn.
   - Reflection: ✓ Create/Edit parity.

4. Cập nhật Variant form tại `app/admin/products/[id]/variants/components/VariantForm.tsx`
   - Thought: SKU cần ẩn theo feature toggle SKU và giá cần helper realtime format.
   - Action:
     - Mở rộng `VariantSettings` nhận thêm `skuEnabled: boolean` (được truyền từ page create/edit variant).
     - Nếu `skuEnabled=false`:
       - Ẩn input SKU hoàn toàn.
       - Tự sinh SKU ngầm khi submit (theo quyết định bạn chọn): ví dụ `VAR-${Date.now()}` hoặc `VAR-${product._id.slice(-6)}-${Date.now()}` để giảm đụng.
     - Nếu `skuEnabled=true`: giữ behavior hiện tại.
     - Realtime helper text cho input giá variant (`price`, `salePrice`):
       - Thêm formatter `new Intl.NumberFormat('en-US').format(number)` để đúng ví dụ `100,000`.
       - Hiển thị helper text ngay dưới input khi có giá trị hợp lệ.
   - Reflection: ✓ Đủ UX realtime, không phá validate hiện có.

5. Truyền setting SKU xuống variant pages
   - Files:
     - `app/admin/products/[id]/variants/create/page.tsx`
     - `app/admin/products/[id]/variants/[vid]/edit/page.tsx`
   - Action:
     - Query thêm `fieldsData = api.admin.modules.listEnabledModuleFields` với module `products`.
     - Tính `skuEnabled = enabledFields.has('sku')`.
     - Truyền `settings={{ ...variantSettings, skuEnabled }}` vào `VariantForm`.
   - Reflection: ✓ Tách rõ nguồn điều khiển UI từ module fields.

6. (Nhẹ) Guard backend cho product type mode
   - Files: `convex/products.ts` (mutation create/update)
   - Action:
     - Trên create/update, đọc module setting `productTypeMode`.
     - Ép `productType` hợp lệ theo mode:
       - `physical`: luôn physical, xóa digital fields.
       - `digital`: luôn digital.
       - `both`: giữ input từ UI.
     - Tránh mismatch nếu client cũ gửi payload không hợp lệ.
   - Reflection: ✓ CoC + data integrity.

7. Kiểm thử & xác nhận
   - Chạy typecheck duy nhất theo rule repo: `bunx tsc --noEmit`.
   - Test tay các route:
     - `/system/modules/products` (setting enum mới)
     - `/admin/products/create`, `/admin/products/[id]/edit`
     - `/admin/products/[id]/variants/create`, `/edit`
   - Checklist:
     - Bật variant + `variantPricing=variant` => Product create/edit ẩn giá.
     - Tắt SKU feature => Variant create/edit ẩn SKU + submit vẫn tạo/sửa được.
     - Giá variant hiện helper realtime format `100000 -> 100,000`.
     - productTypeMode=physical/digital => create/edit không hiện 2 lựa chọn, auto theo mode.
     - Meta placeholders và label mới đúng yêu cầu.
     - Có nút mở `/admin/product-options` tab mới trong section phiên bản.

8. Commit sau khi xong code (theo rule repo)
   - `git status`, `git diff --cached`, rà secrets.
   - Commit message đề xuất: `feat(products): align pricing/sku visibility with module settings and add product type mode`
   - Include cả `.factory/docs` nếu có thay đổi trong đó.

## Best-practice chốt nhanh
- Giữ single source of truth từ module settings/fields để tránh if-else hardcode rải rác.
- Ẩn field ở UI nhưng vẫn có fallback payload/guard backend để chống client mismatch.
- Create/Edit + Variant Create/Edit phải parity để tránh hành vi khó đoán cho admin.

Nếu bạn duyệt spec này, mình sẽ implement đúng từng bước ở trên.