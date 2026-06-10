## Problem Graph
1. [Main] Cập nhật product-detail (site + preview) để không hiện fallback “Chưa có đánh giá” và dùng sao vàng cố định <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] `RatingInline` và header trong `ProductCommentsSection` đang render fallback text khi `ratingSummary.count = 0`
   1.2 [ROOT CAUSE] Màu sao đang lấy từ token thương hiệu (`tokens.ratingStarActive`) nên đổi theo brand color
   1.3 [Sub] Preview `/system/experiences/product-detail` đang hardcode rating/reviews mock và cũng dùng token màu sao

## Execution (with reflection)
1. Solving 1.1.1 — Ẩn hoàn toàn rating summary khi không có đánh giá ở cả 3 layout site
   - File: `app/(site)/products/[slug]/page.tsx`
   - Thay đổi:
     - Sửa `RatingInline`:
       - Guard đầu hàm: nếu `!summary.average || summary.count <= 0` thì `return null`.
       - Bỏ nhánh render `<span>Chưa có đánh giá</span>`.
     - Không đổi logic toggle `showRating`; chỉ khi có dữ liệu thật mới render rating block.
   - Reflection: đúng yêu cầu “ẩn UI luôn”, không ảnh hưởng layout khác vì `null` trong flex row đã an toàn.

2. Solving 1.1.2 — Ẩn fallback text trong section bình luận/rating header
   - File: `app/(site)/products/[slug]/page.tsx`
   - Thay đổi trong `ProductCommentsSection`:
     - Ở header `Đánh giá & Bình luận`, đổi đoạn:
       - trước: có `if average` thì render sao+text, else render `Chưa có đánh giá`
       - sau: chỉ render block sao+text khi `ratingSummary.average && ratingSummary.count > 0`, ngược lại không render gì.
     - Giữ nguyên empty state riêng cho danh sách comment (`Chưa có đánh giá nào cho sản phẩm này.`) vì đó là trạng thái list comments, không phải rating fallback cạnh tiêu đề.
   - Reflection: khớp yêu cầu user đã chốt “Ẩn hoàn toàn fallback text”, nhưng vẫn giữ UX form bình luận để người dùng tạo đánh giá đầu tiên.

3. Solving 1.2 — Cố định màu sao vàng ở site product detail
   - File: `app/(site)/products/[slug]/page.tsx`
   - Thay đổi:
     - Thêm hằng số nội bộ gần các helper: `const RATING_STAR_ACTIVE_COLOR = '#f59e0b';`
     - Cập nhật `RatingInline` và `RatingStars`:
       - Star active dùng `{ color: RATING_STAR_ACTIVE_COLOR, fill: RATING_STAR_ACTIVE_COLOR }`.
       - Star inactive vẫn giữ `tokens.ratingStarInactive` để hợp theme nền.
   - Reflection: KISS, chỉ đổi nơi render sao; không đụng hệ token toàn cục để tránh side effect ngoài product-detail.

4. Solving 1.3 — Cố định màu sao vàng + ẩn fallback ở preview experience cả 3 layout
   - File: `components/experiences/previews/ProductDetailPreview.tsx`
   - Thay đổi:
     - Thêm hằng `const RATING_STAR_ACTIVE_COLOR = '#f59e0b';`
     - Ở cả 3 khối `showRating` (classic, modern, minimal): active star dùng hằng vàng thay vì `tokens.ratingStarActive`.
     - Với yêu cầu ẩn fallback khi dữ liệu trống: preview hiện dùng mock `rating=4.8`, `reviews=234` (luôn >0), nên không có fallback; giữ nguyên logic hiển thị nhưng chuẩn hóa sẵn điều kiện bằng biến `const hasRatingData = reviews > 0 && rating > 0;` và dùng `showRating && hasRatingData` để parity với site.
   - Reflection: đảm bảo parity site/preview đúng lựa chọn user.

5. Verification
   - Chạy typecheck theo rule repo: `bunx tsc --noEmit`.
   - Kiểm tra nhanh bằng đọc diff:
     - Không còn text fallback “Chưa có đánh giá” trong rating summary tại product-detail site.
     - Sao active ở site + preview dùng mã vàng cố định.

6. Commit plan (sau khi implement)
   - Commit message đề xuất: `fix(product-detail): hide empty rating summary and lock stars to yellow`
   - Add đầy đủ file thay đổi + thư mục `.factory/docs` nếu có phát sinh theo rule dự án.

### Checklist chốt
- [x] 3 layout site (classic/modern/minimal): không hiện rating summary khi count=0
- [x] Header Đánh giá & Bình luận: bỏ fallback “Chưa có đánh giá”
- [x] Sao active màu vàng cố định ở site
- [x] Sao active màu vàng cố định ở preview experience
- [x] Typecheck `bunx tsc --noEmit` pass