## Problem Graph
1. Chuẩn hoá UX trang `/admin/products/[id]/edit` và semantics giá sản phẩm toàn hệ thống  
   <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Trang edit product đã có `hasChanges` cơ bản nhưng action bar chưa phản ánh đúng state saved/dirty theo UX anh muốn.
   1.2 [ROOT CAUSE] Helper giá public `lib/products/public-price.ts` đang dùng semantics ngược: `salePrice` được coi là giá đang bán, `price` là giá gốc, trái với label admin hiện tại.
   1.3 [ROOT CAUSE] Nhiều bề mặt render giá (site list/detail, quick add, home component product list, previews experiences) đang phụ thuộc helper/logic cũ nên có nguy cơ lệch nhau.

## Execution (with reflection)
1. Solving 1.1 — chuẩn hoá dirty state cho Product Edit
   - Thought: File `app/admin/products/[id]/edit/page.tsx` đã có `hasChanges`, snapshot và label gần đúng; cần audit kỹ để chốt đúng hành vi sau save và trạng thái disabled.
   - Action:
     - Giữ pattern snapshot hiện tại (`initialSnapshotRef` + `currentSnapshot` + `hasChanges`).
     - Chỉ chỉnh action bar cuối trang để đúng yêu cầu:
       - khi `hasChanges === true`: nút accent xanh, label `Lưu thay đổi`, enabled.
       - khi `hasChanges === false`: label `Đã lưu`, disabled, style xám rõ ràng.
       - khi `isSubmitting === true`: `Đang lưu...` + spinner.
     - Nếu cần, bổ sung class/style cho trạng thái disabled để không còn nhìn giống nút save active.
   - Reflection: Phần lõi dirty-state thực ra đã có; sửa đúng điểm UX, tránh over-engineer.

2. Solving 1.2 — đổi semantics giá toàn hệ thống cho đúng với admin
   - Thought: Anh đã chốt hướng đúng là: `price = giá bán hiện tại`, `salePrice = giá so sánh/trước giảm`.
   - Action:
     - Sửa `lib/products/public-price.ts`:
       - `label` phải ưu tiên `price` là giá đang bán.
       - `comparePrice` chỉ lấy từ `salePrice` khi `salePrice > price`.
       - logic `Giá liên hệ` chỉ áp khi sale mode khác `cart` và không có `price` hợp lệ.
     - Đặt lại meaning rõ ràng trong code để mọi nơi dùng helper đều ra đúng:
       - `effectivePrice = price`
       - `comparePrice = salePrice` nếu hợp lệ
     - Không đổi schema DB, không migrate field; chỉ sửa interpretation/render logic để khớp dữ liệu admin hiện có.
   - Reflection: Đây là fix gốc; làm ở helper sẽ DRY hơn vá từng page riêng lẻ.

3. Solving 1.3 — cập nhật site render dùng chung semantics mới
   - Thought: Sau khi helper đổi semantics, các nơi render/discount badge cần audit vì một số chỗ đang tính phần trăm trực tiếp bằng `product.salePrice / product.price` theo nghĩa cũ.
   - Action:
     - Audit và sửa các file public products chính:
       - `app/(site)/products/page.tsx`
       - `app/(site)/products/[slug]/page.tsx`
       - `components/products/QuickAddVariantModal.tsx`
       - `components/site/ProductListSection.tsx`
     - Ở mỗi nơi:
       - giá chính hiển thị = `priceDisplay.label` (giá bán)
       - giá gạch ngang = `priceDisplay.comparePrice`
       - badge giảm % phải tính theo công thức mới: `(comparePrice - price) / comparePrice`
       - điều kiện show badge/compare phải là `salePrice > price`, không phải `<` nữa
     - Audit thêm các chỗ liên quan từ grep:
       - `app/(site)/wishlist/page.tsx`
       - `app/(site)/products/[slug]/layout.tsx`
       - `components/site/ComponentRenderer.tsx`
       - `app/admin/home-components/_shared/lib/productPrice.ts` và các product home-component render liên quan nếu đang dùng compare/badge theo nghĩa cũ.
   - Reflection: Nếu chỉ sửa helper mà bỏ sót các phép tính % hardcode thì UI vẫn sai; cần audit hết các chỗ tính tay.

4. Solving 1.4 — audit full experiences: config page + preview + site parity
   - Thought: User yêu cầu audit full cho `/system/experiences/products-list` và `/system/experiences/product-detail`, đồng thời preview/site phải cùng logic.
   - Action:
     - Audit config pages:
       - `app/system/experiences/products-list/page.tsx`
       - `app/system/experiences/product-detail/page.tsx`
       - đảm bảo các toggle `showPrice/showSalePrice/showPromotionBadge/showBuyNow...` vẫn mô tả đúng sau khi semantics đổi.
     - Audit previews:
       - `components/experiences/previews/ListPreview.tsx`
       - `components/experiences/previews/ProductDetailPreview.tsx`
       - preview mock data hiện đang dùng `price` + `originalPrice`; sẽ giữ semantics preview đồng bộ: giá hiện tại là giá lớn nổi bật, giá gạch ngang là giá cũ/originalPrice.
       - nếu cần, đổi tên biến nội bộ preview từ `originalPrice` sang meaning rõ hơn hoặc ít nhất align công thức badge để tránh nhầm.
     - Đối chiếu parity giữa:
       - preview products-list ↔ site `/products`
       - preview product-detail ↔ site `/products/[slug]`
     - Không thêm tính năng mới ở experience pages; chỉ sửa semantics, label phụ và logic badge/compare nếu lệch.
   - Reflection: Preview đang là mock data nên không bắt buộc dùng helper thật, nhưng phải cho ra cùng meaning thị giác với site thật.

5. Files dự kiến chạm tới
   - `app/admin/products/[id]/edit/page.tsx`
   - `lib/products/public-price.ts`
   - `app/(site)/products/page.tsx`
   - `app/(site)/products/[slug]/page.tsx`
   - `components/products/QuickAddVariantModal.tsx`
   - `components/site/ProductListSection.tsx`
   - `app/(site)/wishlist/page.tsx` (nếu compare hiện dùng semantics cũ)
   - `components/site/ComponentRenderer.tsx` (các product card/home component có badge giảm giá)
   - `components/experiences/previews/ListPreview.tsx`
   - `components/experiences/previews/ProductDetailPreview.tsx`
   - có thể thêm vài file phụ nếu grep phát hiện công thức badge hardcode khác

6. Verification
   - Chạy đúng rule repo: `bunx tsc --noEmit`
   - Manual smoke checklist:
     - `/admin/products/[id]/edit`
       - mới mở trang: nút `Đã lưu` xám, disabled
       - đổi 1 field: nút thành `Lưu thay đổi`, enabled
       - save thành công: quay lại `Đã lưu`
     - `/products`
       - card hiển thị giá bán chính là `price`
       - nếu có `salePrice > price`: hiện thêm giá so sánh gạch ngang
       - badge % giảm tính đúng
     - `/products/[slug]`
       - main price đúng semantics mới
       - variant price/compare đúng nếu có variant
     - `/system/experiences/products-list` preview khớp nghĩa giá với site list
     - `/system/experiences/product-detail` preview khớp nghĩa giá với site detail

7. Commit plan
   - Sau khi implement + verify, stage toàn bộ file thay đổi và kèm `.factory/docs` nếu có.
   - Commit local, không push.
   - Commit message đề xuất: `fix(products): align saved state UX and public price semantics`

## Checklist chốt cho anh
- [ ] Nút save ở product edit phản ánh đúng dirty/saved state
- [ ] `price` được hiểu là giá bán hiện tại trên toàn hệ thống
- [ ] `salePrice` được hiểu là giá so sánh/trước giảm và hiển thị gạch ngang
- [ ] Badge giảm giá tính theo semantics mới
- [ ] Experiences preview/site không lệch nhau
- [ ] `bunx tsc --noEmit` pass
- [ ] Có commit local, không push

## Best practice áp dụng
- KISS: fix tại helper trung tâm trước, chỉ vá nơi nào đang hardcode phép tính cũ
- DRY: gom logic giá vào `getPublicPriceLabel`, tránh mỗi page tự hiểu một kiểu
- YAGNI: không đổi schema/migrate DB khi chưa cần; chỉ sửa interpretation/render để khớp business meaning anh đã chốt