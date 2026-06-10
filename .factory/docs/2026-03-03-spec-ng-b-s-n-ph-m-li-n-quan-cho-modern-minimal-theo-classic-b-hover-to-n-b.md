## Problem Graph
1. [Main] Đồng bộ khối “Sản phẩm liên quan” giữa 3 layout <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] Modern/Minimal đang render khối related riêng, lệch với Classic
   1.2 [ROOT CAUSE] Các product item đang có hover effect (scale/overlay) chưa đúng yêu cầu

## Execution (with reflection)
1. Refactor `app/(site)/products/[slug]/page.tsx` để Modern + Minimal dùng chung `RelatedProductsSection` như Classic.
   - Action:
     - Xóa block related custom trong `MinimalStyle` (section “Có thể bạn sẽ thích”).
     - Đảm bảo `ModernStyle` và `ClassicStyle` tiếp tục gọi `RelatedProductsSection` với cùng props.
     - Thêm `RelatedProductsSection` vào `MinimalStyle` ngay sau `commentsSection` (giống flow của Classic/Modern), truyền:
       - `products={relatedProducts}`
       - `categorySlug={product.categorySlug}`
       - `brandColor={brandColor}`
       - `tokens={tokens}`
       - `showPrice={showPrice}`
       - `showSalePrice={enabledFields.has('salePrice')}`
   - Reflection: 3 layout cùng 1 hệ UI/logic related, tránh lệch hành vi.

2. Bỏ toàn bộ hover effect trong item của `RelatedProductsSection` (áp dụng cho cả 3 layout do dùng chung component).
   - Action:
     - Trong `RelatedProductsSection`, loại bỏ class hover/transition trên card và ảnh:
       - bỏ `group`, `transition-all`, `group-hover:scale-110`, `transition-transform`, `duration-*` nếu chỉ phục vụ hover.
     - Ảnh giữ hiển thị tĩnh (`object-cover` hoặc style hiện tại) không scale khi hover.
     - Giữ nguyên nội dung badge/giá/tên/link, chỉ bỏ hiệu ứng động.
   - Reflection: card liên quan vẫn rõ ràng, không animation hover, đồng nhất đúng yêu cầu.

3. Verify + commit theo rule repo.
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Review `git diff --cached` và `git status`.
     - Commit local (không push), kèm `.factory/docs` nếu có thay đổi spec file.

## Checklist chốt theo yêu cầu bạn đã xác nhận
- [x] Modern + Minimal dùng chung `RelatedProductsSection` của Classic
- [x] Bỏ hover product item trong khối related cho **cả 3 layout**
- [x] Không đổi logic dữ liệu related, chỉ đồng bộ UI/behavior
- [x] Có typecheck trước commit