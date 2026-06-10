## Problem Graph
1. Đồng bộ nghiệp vụ giá sản phẩm theo saleMode trên admin + public <- phụ thuộc 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] UI create/edit đang hiển thị label giá bị đảo (price/salePrice), khiến hiểu sai bắt buộc
   1.2 Validation hiện tại chưa ràng buộc đúng theo saleMode (cart bắt buộc giá > 0, contact/affiliate cho phép trống)
   1.3 Public render đang format cứng số tiền, chưa fallback “Giá liên hệ” khi saleMode contact/affiliate và giá trống

## Execution (with reflection)
1. Chuẩn hóa block “Giá & Kho hàng” ở admin create/edit
   - File: `app/admin/products/create/page.tsx`
   - File: `app/admin/products/[id]/edit/page.tsx`
   - Thay đổi:
     - Đổi thứ tự input: **Giá bán (VNĐ)** lên trước, **Giá so sánh (trước giảm)** ra sau.
     - Map đúng dữ liệu:
       - `price` = Giá bán (field chính)
       - `salePrice` = Giá so sánh (optional)
     - Bỏ hiểu nhầm bắt buộc của giá so sánh: không gắn required cho `salePrice`.
     - Thêm helper text dưới cả 2 input theo yêu cầu:
       - dưới Giá bán: `VD: 100,000`
       - dưới Giá so sánh: `VD: 100,000`
   - Reflection: sửa đúng root cause UI, không đổi schema DB, ít rủi ro.

2. Áp rule validation theo saleMode ở frontend form submit
   - File: `app/admin/products/create/page.tsx`
   - File: `app/admin/products/[id]/edit/page.tsx`
   - Thay đổi:
     - Tạo cờ `isPriceRequired = saleMode === 'cart'`.
     - Validate submit:
       - Nếu `!hideBasePricing && isPriceRequired && (!price || Number(price) <= 0)` => báo lỗi bắt buộc nhập giá.
       - Nếu saleMode là `contact|affiliate` => cho phép `price` trống (UI có thể gửi 0).
     - Thuộc tính HTML `required` của input Giá bán đổi theo `isPriceRequired`.
   - Reflection: đảm bảo UX đúng ngay tại form.

3. Gia cố validation ở backend để không lọt dữ liệu sai nghiệp vụ
   - File: `convex/products.ts`
   - Thay đổi trong `create` và `update`:
     - Đọc module setting `saleMode` từ `moduleSettings`.
     - Rule backend:
       - `saleMode === 'cart'`: giá hiệu lực phải `> 0` (create dùng `args.price`, update dùng `args.price ?? product.price`). Nếu không, throw error rõ ràng.
       - `saleMode === 'contact' | 'affiliate'`: cho phép giá `0`.
   - Reflection: tránh bypass frontend, giữ data integrity.

4. Hiển thị “Giá liên hệ” trên **tất cả UI public có giá sản phẩm** (theo xác nhận của bạn)
   - Tạo helper dùng chung (DRY):
     - File mới đề xuất: `lib/products/public-price.ts`
     - Hàm ví dụ:
       - nhận `saleMode`, `price`, `salePrice`
       - trả về `{ label: string, isContactPrice: boolean, comparePrice?: number }`
       - Khi `saleMode !== 'cart'` và giá hiệu lực `<= 0` => `label = 'Giá liên hệ'`
       - Ngược lại trả label format VND như hiện tại
   - Áp dụng helper vào các file public chính đang render giá:
     - `app/(site)/products/page.tsx`
     - `app/(site)/products/[slug]/page.tsx`
     - `components/site/ProductListSection.tsx`
     - `app/(site)/wishlist/page.tsx`
     - `app/(site)/products/[slug]/layout.tsx` (metadata/twitter title có giá)
   - Quy tắc hiển thị:
     - Nếu là “Giá liên hệ” thì không render giá gạch ngang/discount phần trăm.
     - Nút hành động vẫn giữ logic saleMode hiện tại (contact/affiliate/cart), chỉ đổi phần text giá.
   - Reflection: xử lý tập trung, tránh lệch giữa list/detail/home/wishlist/SEO.

5. Kiểm tra nhanh trước commit
   - Chạy: `bunx tsc --noEmit` (đúng rule dự án)
   - Soát lại các case thủ công:
     - saleMode=cart, price trống => chặn submit
     - saleMode=contact/affiliate, price trống => submit được
     - public render tương ứng hiện “Giá liên hệ” tại các màn public

6. Commit (không push)
   - Commit toàn bộ thay đổi code liên quan
   - Nếu có `.factory/docs` thì add kèm theo rule repo

## Checklist nghiệm thu
- [ ] Admin create/edit: thứ tự input đúng (Giá bán trước, Giá so sánh sau)
- [ ] Giá so sánh không bắt buộc
- [ ] Có helper text “VD: 100,000” dưới cả 2 input
- [ ] saleMode=cart bắt buộc giá > 0 (frontend + backend)
- [ ] saleMode=contact/affiliate cho phép để trống giá
- [ ] Tất cả UI public hiển thị “Giá liên hệ” khi mode contact/affiliate và giá trống
- [ ] `bunx tsc --noEmit` pass
- [ ] Có commit local, không push