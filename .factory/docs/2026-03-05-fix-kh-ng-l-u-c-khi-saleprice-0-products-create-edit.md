## Problem Graph
1. Không lưu được khi set Giá so sánh = 0 ở create/edit <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] FE đang serialize `salePrice` bằng điều kiện truthy (`salePrice ? parseInt(...) : undefined`) nên value "0" luôn bị convert thành `undefined`
   1.2 BE `update` dùng patch kiểu merge, với Convex `optional` field: gửi `undefined` không đảm bảo clear field theo ý người dùng hiện tại => dữ liệu salePrice cũ còn nguyên, F5 thấy không đổi

## Execution (with reflection)
1. Chuẩn hóa parse input giá ở FE để không dùng truthy check
   - File: `app/admin/products/create/page.tsx`
   - File: `app/admin/products/[id]/edit/page.tsx`
   - Thay logic tạo payload:
     - Parse rõ ràng `salePrice` từ string:
       - rỗng hoặc <= 0 => `undefined` (theo quyết định: 0 = bỏ khuyến mãi)
       - > 0 => number
     - Không dùng `salePrice ? ...` nữa để tránh bug với "0".
   - Reflection: loại bỏ bug nguồn từ FE serialization.

2. Bảo đảm update có thể clear `salePrice` cũ trên BE
   - File: `convex/products.ts` (mutation `update`)
   - Sửa handler update theo hướng explicit unset:
     - Nếu client gửi `salePrice` là `undefined` theo intent “bỏ khuyến mãi” thì patch chắc chắn xóa/ghi đè field salePrice về trạng thái không còn giá KM.
     - Tránh tình trạng patch giữ giá cũ khi field optional bị bỏ qua.
   - Reflection: đây là điểm gây “Lưu xong F5 vẫn y chang”.

3. Đồng bộ quy ước dữ liệu
   - Quy tắc sau fix:
     - `salePrice > 0` => có khuyến mãi
     - `salePrice = 0` hoặc để trống => coi như không khuyến mãi (lưu undefined/rỗng)
   - Không thay đổi quy tắc bắt buộc `price` theo saleMode hiện có (cart bắt buộc > 0, contact/affiliate cho 0).

4. Verify
   - Case cần test tay:
     - Edit product có salePrice cũ > 0, nhập 0 rồi lưu => reload phải mất giá so sánh
     - Edit product nhập rỗng => cũng mất giá so sánh
     - Nhập salePrice > 0 => lưu bình thường
     - Create với salePrice=0 => lưu không có giá so sánh
   - Chạy `bunx tsc --noEmit`.

5. Commit local
   - Commit fix theo convention dự án, add kèm `.factory/docs` nếu có.

## Checklist nghiệm thu
- [ ] Nhập 0 ở Giá so sánh khi edit không còn bị “lưu giả”
- [ ] F5 sau lưu không còn giữ giá so sánh cũ
- [ ] Create/edit đều cùng hành vi: 0 => bỏ khuyến mãi
- [ ] `bunx tsc --noEmit` pass
- [ ] Có commit local, không push