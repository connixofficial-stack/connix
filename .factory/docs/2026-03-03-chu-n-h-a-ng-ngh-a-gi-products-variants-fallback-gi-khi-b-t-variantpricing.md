## Problem Graph
1. [Main] Chuẩn hóa toàn bộ ngữ nghĩa giá trong admin products/variants để tránh hiển thị ngược và tránh giá 0 sai ngữ cảnh
   1.1 [ROOT CAUSE] Label/input đang map ngược với data model hiện tại (`price = giá gốc`, `salePrice = giá bán thực tế`)
   1.2 [Sub] UI list variants đang đúng theo data model nhưng mâu thuẫn với label ở form nhập
   1.3 [Sub] Admin products list khi `variantPricing=variant` có trường hợp fallback về `0` (do base price bị set 0 khi dùng giá theo phiên bản)

## Execution (with reflection)
1. Quét và khóa phạm vi các điểm có nhãn/logic giá
   - File chính cần sửa:
     - `app/admin/products/[id]/variants/components/VariantForm.tsx`
     - `app/admin/products/[id]/variants/page.tsx`
     - `app/admin/products/create/page.tsx`
     - `app/admin/products/[id]/edit/page.tsx`
     - `app/admin/products/page.tsx`
     - `convex/products.ts`
   - Reflection: ✓ Đúng trọng tâm user yêu cầu (create/edit/variants/list + products list).

2. Chuẩn hóa ngữ nghĩa theo quyết định đã chốt
   - Giữ data model hiện tại: `price = giá gốc (so sánh)`, `salePrice = giá bán thực tế`.
   - Đổi copy UI:
     - Input bán thực tế: **“Giá bán (VNĐ)”** → bind `salePrice`
     - Input so sánh: **“Giá so sánh (trước giảm)”** → bind `price`
   - Áp dụng đồng nhất ở:
     - Variant create/edit form (`VariantForm.tsx`)
     - Variant quick-create matrix (`variants/page.tsx`)
     - Product create/edit form (`products/create`, `products/[id]/edit`), đổi từ “Giá chưa giảm” sang “Giá so sánh (trước giảm)”.
   - Reflection: ✓ Loại bỏ mâu thuẫn nhận thức khiến user thấy “gạch nhầm giá”.

3. Sửa validate để đúng business rule
   - Rule chuẩn: `giá_so_sánh >= giá_bán` (khi cả hai cùng có giá trị).
   - Cập nhật thông báo lỗi tương ứng (ví dụ: “Giá so sánh phải lớn hơn hoặc bằng giá bán”).
   - Điểm sửa: logic `hasInvalidPrices` + toast/error text trong `variants/page.tsx`, và submit-check trong `VariantForm.tsx` (nếu có check).
   - Reflection: ✓ Đồng bộ semantic + validation, tránh nhập liệu ngược.

4. Chuẩn hóa render hiển thị giá ở variants list
   - Giữ pattern hiển thị chuẩn ecommerce:
     - Hiển thị `salePrice` nổi bật (giá bán thực tế)
     - `price` gạch ngang (giá so sánh)
   - Chỉ rà lại binding để chắc chắn sau bước remap input không bị đảo lần nữa.
   - Reflection: ✓ Tránh regression UI ở trang `/admin/products/[id]/variants`.

5. Fix case `0` ở `/admin/products` khi bật `variantPricing=variant`
   - Backend (`convex/products.ts`): mở rộng dữ liệu trả về cho admin list bằng metadata giá theo phiên bản:
     - `variantMinPrice: number | null`
     - `hasPricedActiveVariant: boolean`
   - Frontend (`app/admin/products/page.tsx`):
     - Nếu `variantPricing=variant` + `hasVariants=true` + `hasPricedActiveVariant=false` => hiển thị **“Chưa có giá”** (theo lựa chọn của anh), không hiển thị `0`.
     - Nếu có giá variant thì hiển thị theo min effective variant price.
   - Reflection: ✓ Giải quyết đúng root issue, tránh heuristic dựa vào `price===0`.

6. Rà soát toàn bộ nơi có 2 label yêu cầu để bảo đảm nhất quán
   - Các điểm chứa chuỗi đã quét:
     - `app/admin/products/create/page.tsx`
     - `app/admin/products/[id]/edit/page.tsx`
     - `app/admin/products/[id]/variants/components/VariantForm.tsx`
     - `app/admin/products/[id]/variants/page.tsx`
   - Không sửa `.factory/docs` (chỉ ghi nhận tham chiếu nội bộ).
   - Reflection: ✓ Đúng yêu cầu “quét toàn bộ nơi chứa 2 cụm giá”.

7. Verify kỹ thuật trước khi commit
   - Chạy: `bunx tsc --noEmit`
   - Nếu pass: commit 1 commit gọn theo scope giá/variants/products list.
   - Khi commit sẽ add cả `.factory/docs` nếu có thay đổi phát sinh theo rule repo.
   - Reflection: ✓ Tuân thủ rule dự án và tránh lỗi TS/regression.

## Checklist chốt cho anh
- [x] Giữ nguyên data model hiện tại (không migrate)
- [x] Đồng bộ label theo ngữ nghĩa chuẩn: Giá bán = salePrice, Giá so sánh = price
- [x] Sửa validate theo rule `giá so sánh >= giá bán`
- [x] Tránh hiển thị `0` sai ngữ cảnh ở admin products khi dùng giá theo phiên bản
- [x] Quét và chỉnh đồng nhất các điểm create/edit/variants/list liên quan

## Best-practice áp dụng
- Single source of truth cho semantic giá (`effectivePrice = salePrice ?? price`).
- UI copy phản ánh đúng data model để giảm lỗi vận hành.
- Trạng thái “Chưa có giá” rõ ràng tốt hơn fallback số `0` gây hiểu nhầm.
- Không thêm logic mơ hồ ở frontend; trả metadata rõ ràng từ backend để render chính xác.