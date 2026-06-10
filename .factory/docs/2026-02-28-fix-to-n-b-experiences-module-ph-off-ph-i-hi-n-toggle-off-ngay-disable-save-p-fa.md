## Problem Graph
1. [Toggle module phụ chưa phản ánh OFF ngay trên UI] <- depends on 1.1, 1.2, 1.3
   1.1 [posts-detail đang bind checked trực tiếp từ config cũ]
   1.2 [một số experience chỉ disable, chưa ép checked về OFF ngay]
   1.3 [cần chuẩn hóa rule chung cho toàn bộ experiences]

## Execution (with reflection)
1. Solving 1.1...
   - Thought: Ở `posts-detail`, toggle comments/likes/replies/tags đang dùng `checked={currentLayoutConfig.*}` nên nếu DB đang true thì UI vẫn sáng dù module OFF.
   - Action: Đổi `checked` sang `checked={toggle && moduleOrFeatureEnabled}` và thêm `disabled={!moduleOrFeatureEnabled}`.
   - Reflection: ✓ UI sẽ phản ánh OFF ngay đúng kỳ vọng.

2. Solving 1.2...
   - Thought: Cần rà các experience còn lại có module phụ để áp cùng pattern (checked AND + disabled).
   - Action: Chuẩn hóa trên các file có phụ thuộc module/feature:
     - `app/system/experiences/posts-detail/page.tsx`
     - `app/system/experiences/comments-rating/page.tsx`
     - `app/system/experiences/product-detail/page.tsx` (likes/replies dùng feature flags riêng)
     - `app/system/experiences/wishlist/page.tsx`
     - `app/system/experiences/cart/page.tsx`
     - `app/system/experiences/products-list/page.tsx` (quick add/add to cart/buy now/wishlist/promotion)
     - `app/system/experiences/menu/page.tsx` (searchProducts/searchPosts/searchServices, cart, wishlist, login, track order)
   - Reflection: ✓ đảm bảo nhất quán cross-experience.

3. Solving 1.3...
   - Thought: Ngoài UI, khi bấm Lưu vẫn phải ép false (đã có một phần), cần đảm bảo phủ hết.
   - Action: Giữ/hoàn thiện beforeSave normalization cho tất cả các toggle phụ thuộc module phụ để persist false khi Save; khi module bật lại vẫn giữ false.
   - Reflection: ✓ đúng rule bạn chốt trước đó.

## Full implement plan (không chia phase)

### A) Chuẩn hóa behavior UI trong Experience Editor
Rule bắt buộc cho mọi toggle phụ thuộc module phụ:
- `checked = configValue && dependencyEnabled`
- `disabled = !dependencyEnabled`

Áp cụ thể:
1. `posts-detail/page.tsx`
   - `showComments` -> theo `commentsModule.enabled`
   - `showCommentLikes` -> theo `commentsModule.enabled && commentsLikesFeature.enabled`
   - `showCommentReplies` -> theo `commentsModule.enabled && commentsRepliesFeature.enabled`
   - `showTags` -> theo `tagsFeature.enabled`

2. `comments-rating/page.tsx`
   - `showLikes/showReplies/showModeration` checked phải AND theo feature tương ứng + module comments.
   - disabled theo feature/module tương ứng (không chỉ module comments).

3. `product-detail/page.tsx`
   - hiện đã có một phần; sửa các chỗ còn thiếu:
   - `showCommentLikes/showCommentReplies` checked + disabled theo feature cụ thể,
   - `showAddToCart` theo `cart && orders`, `showBuyNow` theo `orders`, `showWishlist` theo `wishlist`.

4. `wishlist/page.tsx`
   - `showNote/showNotification/showAddToCartButton/showWishlistButton` checked/disabled theo dependency thực tế.

5. `cart/page.tsx`
   - `showExpiry/showNote` checked/disabled theo feature flags cart.

6. `products-list/page.tsx`
   - các toggle phụ checked/disabled đồng bộ với dependency modules/features (wishlist/cart/orders/promotions/variants).

7. `menu/page.tsx`
   - các toggle liên quan search per-module, cart, wishlist, login, track-order phản ánh OFF ngay nếu module off.

### B) Chuẩn hóa dữ liệu khi Save (persist)
- Dùng các transform trước save (đã có nền tảng): ép false toàn bộ toggle có dependency đang OFF.
- Đảm bảo phủ hết các experience nêu trên (đặc biệt `posts-detail` và `menu`).

### C) Đồng bộ preview + runtime public
- Preview trong từng experience phải nhận props đã normalize (AND dependency).
- Runtime public giữ rule `toggle && dependencyEnabled` để không render sai nếu config legacy còn true.

### D) Verification
1. Test nhanh 4 case chính:
   - tắt comments module -> vào `/system/experiences/posts-detail`: comments/likes/replies phải OFF + disabled ngay.
   - tắt likes/replies feature (comments vẫn ON) -> chỉ toggle tương ứng OFF + disabled.
   - tắt wishlist/cart/orders/promotions -> products-list và product-detail toggle liên quan OFF + disabled.
   - tắt products/posts/services cho menu search -> toggle và preview phản ánh OFF.
2. Chạy `bunx tsc --noEmit`.
3. Commit 1 lần.

## Kết quả mong đợi
- Không còn tình trạng “module phụ tắt nhưng toggle vẫn bật” trong bất kỳ experience nào.
- UI experience phản ánh trạng thái thật ngay lập tức.
- Save vẫn ép false xuống DB đúng chuẩn đã thống nhất.