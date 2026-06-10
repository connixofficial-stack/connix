## Audit Summary (chỉ ra chỗ có thật trong codebase)
Mình đã rà các callsite `next/image` còn lại ở public và phân loại mức ưu tiên cắt optimize như sau.

### HIGH (nên làm ngay)
1. `app/(site)/wishlist/page.tsx`
   - Evidence: nhiều thumbnail nhỏ `sizes="48px"`, `80px`, `96px`, grid `50vw/25vw`.
   - Lý do High: đây là ảnh card/list nhỏ lặp nhiều, không cần optimizer để giữ UX.
   - Đề xuất: chuyển toàn bộ sang policy `thumb` (unoptimized).

2. `components/site/CartDrawer.tsx`
   - Evidence: ảnh 64x64 trong mini cart drawer (`width={64} height={64}`).
   - Lý do High: UI phụ, ảnh nhỏ, tần suất mở cao.
   - Đề xuất: `thumb` (unoptimized).

3. `components/site/posts/layouts/SidebarLayout.tsx`
   - Evidence: thumbnail list bên sidebar, `sizes="96px"`.
   - Lý do High: list ảnh nhỏ lặp cao.
   - Đề xuất: `thumb` (unoptimized).

4. `components/site/services/layouts/SidebarLayout.tsx`
   - Evidence: thumbnail service list `sizes="96px"`.
   - Lý do High: cùng pattern với posts sidebar.
   - Đề xuất: `thumb` (unoptimized).

5. `app/(site)/cart/page.tsx`
   - Evidence: nhiều thumbnail nhỏ trong table/list/cart item (`48px`, `80px`, `96px`, grid nhỏ).
   - Lý do High: route giao dịch truy cập nhiều, ảnh nhỏ lặp liên tục.
   - Đề xuất: `thumb` (unoptimized) cho toàn bộ ảnh item/cart line.

### MEDIUM (làm sau nhóm High)
1. `app/(site)/checkout/page.tsx`
   - Evidence: có import `next/image`, chủ yếu ảnh item review/summary trong luồng checkout.
   - Lý do Medium: thường ít ảnh hơn cart/wishlist nhưng vẫn là thumbnail.
   - Đề xuất: ảnh summary/item => `thumb` (unoptimized), giữ optimize nếu có hero/payment visual lớn.

2. `app/(site)/account/orders/page.tsx`
   - Evidence: list đơn hàng + item thumbnail.
   - Lý do Medium: traffic thấp hơn PLP/cart nhưng vẫn nhiều ảnh nhỏ lặp.
   - Đề xuất: `thumb` (unoptimized).

3. `components/site/Footer.tsx` + `components/site/DynamicFooter.tsx`
   - Evidence: logo/footer badge (BCT) dùng `next/image` ở nhiều style footer.
   - Lý do Medium: tài nguyên tĩnh, không cần optimizer ở đa số case.
   - Đề xuất: `logo`/`decorative` (unoptimized).

4. `components/site/posts/layouts/MagazineLayout.tsx`, `FullWidthLayout.tsx`
   - Evidence: card/list ảnh bài viết không phải hero chính.
   - Lý do Medium: có thể có vài ảnh lớn, cần phân biệt featured vs list.
   - Đề xuất: featured giữ optimize (`primary`), card nhỏ chuyển `thumb`.

5. `components/site/services/layouts/MagazineLayout.tsx`, `FullWidthLayout.tsx`, `detail/ServiceDetailStyles.tsx`
   - Evidence: nhiều ảnh service trong list/detail layout.
   - Lý do Medium: mixed content, cần tách ảnh chính/ảnh phụ.
   - Đề xuất: ảnh chính detail giữ optimize, ảnh list/related/thumb => unoptimized.

### LOW (chỉ đụng khi đã xong High/Medium)
1. `components/site/ComponentRenderer.tsx`
   - Lý do Low: phụ thuộc runtime component type, cần map policy kỹ để tránh side effect rộng.
2. `components/site/products/detail/_components/ProductImageLightbox.tsx`
   - Lý do Low: ảnh lightbox là vùng người dùng nhìn kỹ, không nên cắt optimize sớm.

## Root Cause Confidence
**High** — các file High đều là thumbnail/list ảnh nhỏ, lặp nhiều, và hiện vẫn đi qua optimizer.

## Decision
- Ưu tiên xử lý theo thứ tự: **High → Medium → Low**.
- Chỉ cắt optimize ở nơi “user khó nhận ra khác biệt” (thumbnail/asset tĩnh).

## Execution Preview
1. Thay `next/image` ở nhóm High sang `PublicImage mode="thumb"`.
2. Nhóm Medium: tách featured/hero vs list/thumb rồi gán mode phù hợp.
3. Nhóm Low: chỉ xử lý khi quota vẫn căng sau 1-2 tuần theo dõi.

## Verification Plan
- Theo dõi Vercel dashboard theo route cluster:
  - cart/wishlist/sidebar trước
  - rồi checkout/account/footer
- So sánh Transformations/Cache Writes trước-sau theo ngày.

## Acceptance Criteria
- Nhóm High không còn đi optimizer cho thumbnail nhỏ.
- Không vỡ UI/không giảm cảm nhận chất lượng ở khu vực quan trọng.
- Quota giảm thấy rõ sau khi rollout nhóm High.

Nếu anh duyệt, mình sẽ implement **chỉ nhóm High trước** để giảm nhanh và an toàn.