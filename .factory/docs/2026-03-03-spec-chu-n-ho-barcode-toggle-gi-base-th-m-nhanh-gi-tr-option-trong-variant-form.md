## Problem Graph
1. [UI admin products/variants chưa theo module config + thiếu thao tác nhanh] <- depends on 1.1, 1.2, 1.3, 1.4, 1.5
   1.1 [Chưa có toggle Barcode trong /system/modules/products]
   1.2 [Variant create/edit luôn hiện Barcode dù chưa bật feature]
   1.3 [Products create/edit còn bắt giá base khi variantPricing=variant]
   1.4 [Seed/auto-heal chưa có feature+field barcode mặc định tắt]
   1.5 [Variant create/edit thiếu nút thêm nhanh giá trị option ngay tại chỗ]

## Execution (with reflection)
1. Thêm feature Barcode vào cấu hình module products
   - File: `lib/modules/configs/products.config.ts`
   - Action:
     - Bổ sung feature:
       - `key: 'enableBarcode'`
       - `label: 'Mã vạch phiên bản'`
       - `linkedField: 'barcode'`
     - Mặc định OFF qua seed feature.
   - Reflection: ✓ Có toggle chính thức trong `/system/modules/products`.

2. Seed + auto-heal feature/field Barcode cho products
   - File: `convex/seed.ts`
   - Action:
     - Thêm `moduleFeature` cho products:
       - `featureKey: 'enableBarcode'`, `linkedFieldKey: 'barcode'`, `enabled: false`.
     - Thêm `moduleField` cho products:
       - `fieldKey: 'barcode'`, `linkedFeature: 'enableBarcode'`, `enabled: false`, `required: false`, `type: 'text'`.
     - Ở nhánh existing fields, auto-insert `barcode` nếu thiếu để instance cũ không bị miss.
   - Reflection: ✓ Dữ liệu cấu hình nhất quán cho cả project mới/cũ.

3. Ẩn/hiện Barcode trong Variant create/edit theo moduleFields
   - Files:
     - `app/admin/products/[id]/variants/create/page.tsx`
     - `app/admin/products/[id]/variants/[vid]/edit/page.tsx`
     - `app/admin/products/[id]/variants/components/VariantForm.tsx`
   - Action:
     - Truyền thêm `barcodeEnabled: enabledFields.has('barcode')` vào `VariantForm` settings.
     - Trong `VariantForm`:
       - Chỉ render input Barcode khi `barcodeEnabled=true`.
       - Submit payload: `barcode` chỉ gửi khi bật; tắt thì `undefined`.
   - Reflection: ✓ Không còn hiện barcode “bừa”.

4. Bỏ bắt buộc giá base ở products create/edit theo rule bạn chốt
   - Files:
     - `app/admin/products/create/page.tsx`
     - `app/admin/products/[id]/edit/page.tsx`
   - Action:
     - Đổi rule:
       - `hideBasePricing = variantEnabled && variantPricing === 'variant'`.
     - Không validate bắt buộc `price` khi `hideBasePricing=true`.
     - Ẩn input giá base + note “Giá lấy theo phiên bản”.
     - Payload giữ fallback an toàn schema (`price: 0`, `salePrice: undefined`).
   - Reflection: ✓ Đúng yêu cầu: chỉ cần bật variant + giá theo variant là không bắt nhập giá sản phẩm.

5. Bổ sung “thêm nhanh giá trị option” ngay trong Variant form
   - File chính: `app/admin/products/[id]/variants/components/VariantForm.tsx`
   - Phụ trợ: có thể thêm mutation call tại page hoặc trực tiếp trong form qua `useMutation(api.productOptionValues.create)`.
   - Action chi tiết:
     - Ở mỗi block option trong “Tùy chọn phiên bản”, thêm nút nhỏ `+ Thêm nhanh`.
     - Khi bấm mở inline mini-form (không rời trang):
       - Nhập `label/value` (và color code nếu option là color picker).
       - Submit tạo `productOptionValues` cho đúng `optionId`.
     - Sau khi tạo thành công:
       - Refresh danh sách values hiện có của option.
       - Auto-select value vừa tạo cho option đó.
       - Toast success/error rõ ràng.
     - Guard đơn giản:
       - Chặn submit rỗng.
       - Tránh tạo trùng `value` trong cùng option (frontend check + rely backend error).
   - Reflection: ✓ UX đúng ý “khỏi mở mắc công”, thao tác liền mạch tại create/edit variant.

6. Kiểm thử
   - Command: `bunx tsc --noEmit`
   - Manual checklist:
     - `/system/modules/products` có toggle Barcode, default OFF.
     - Barcode OFF => variant create/edit ẩn field barcode.
     - Barcode ON => hiện lại barcode.
     - variantEnabled + variantPricing=variant => products create/edit không bắt giá base.
     - Variant create/edit có `+ Thêm nhanh` giá trị option; tạo xong thấy ngay và chọn được ngay.

7. Commit theo rule repo
   - Stage code + `.factory/docs`.
   - Soát `git diff --cached` và `git status` trước commit.
   - Commit message đề xuất:
     - `feat(products): add barcode toggle and quick-add option values in variant form`

## Best-practice chốt nhanh
- `moduleFeatures/moduleFields` là source of truth cho render form.
- Tính nhất quán create/edit/variant là bắt buộc để tránh lệch UX.
- Inline quick-add trong variant form giảm context switch, giữ tốc độ nhập liệu cho admin.

Nếu bạn duyệt spec này, mình sẽ triển khai ngay.