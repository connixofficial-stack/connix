## Problem Graph
1. Cập nhật UX form variant create/edit <- depends on 1.1, 1.2
   1.1 Đổi label trường giá phụ <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Label hard-code `Giá khuyến mãi (VNĐ)` trong `VariantForm.tsx`
   1.2 Ẩn block `Thông tin phiên bản` khi không còn field hiển thị <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Card `Thông tin phiên bản` luôn render dù `skuEnabled=false` và `barcodeEnabled=false`

## Execution (with reflection)
1. Sửa label ở khu vực `Giá & Kho hàng` trong `app/admin/products/[id]/variants/components/VariantForm.tsx`:
   - Đổi text `Giá khuyến mãi (VNĐ)` -> `Giá trước giảm`.
   - Reflection: ✓ Chỉ đổi copy text, không ảnh hưởng payload `salePrice` hay API.

2. Tạo cờ hiển thị block thông tin phiên bản trong cùng file:
   - Thêm computed boolean: `const showVariantIdentity = settings.skuEnabled || settings.barcodeEnabled`.
   - Bọc toàn bộ `<Card>` có title `Thông tin phiên bản` bằng điều kiện `showVariantIdentity && (...)`.
   - Giữ nguyên validation hiện tại (`SKU` chỉ required khi `skuEnabled=true`).
   - Reflection: ✓ Đúng yêu cầu: nếu cả SKU và Barcode bị ẩn thì ẩn luôn cả UI section.

3. Verify logic không ảnh hưởng create/edit pages:
   - Vì cả create/edit đều dùng chung `VariantForm`, thay đổi áp dụng đồng thời cho:
     - `/admin/products/[id]/variants/create`
     - `/admin/products/[id]/variants/[vid]/edit`
   - Reflection: ✓ DRY, không cần sửa 2 page route.

4. Sau khi implement (khi bạn duyệt spec):
   - Chạy `bunx tsc --noEmit` theo rule project.
   - Commit với message gợi ý: `fix(products): update variant pricing label and hide empty variant identity section`.
   - Reflection: ✓ Đúng guideline hiện tại (không lint/test nặng, chỉ typecheck trước commit).

## Checklist chốt cho bạn
- [ ] Label hiển thị: `Giá trước giảm`
- [ ] Khi `skuEnabled=false` và `barcodeEnabled=false` => không render card `Thông tin phiên bản`
- [ ] Create + Edit cùng nhận thay đổi
- [ ] Không đổi schema/payload/backend behavior