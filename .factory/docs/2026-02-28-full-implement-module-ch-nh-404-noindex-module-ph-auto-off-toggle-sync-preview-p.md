## Problem Graph
1. [Chuẩn hóa phụ thuộc module cho toàn bộ experiences] <- depends on 1.1, 1.2, 1.3
   1.1 [Module chính: route public phải 404 + noindex]
   1.2 [Module phụ: toggle experience bắt buộc false khi module off]
   1.3 [Preview + runtime public luôn bám trạng thái module/toggle đã sync]

## Execution (with reflection)
1. Solving 1.1...
   - Thought: Các route chính chưa có server guard đồng bộ như `/posts`.
   - Action: Thêm guard `notFound()` + metadata `robots: { index:false, follow:false }` ở layout server của route chính.
   - Reflection: ✓ Đúng SEO + crawl budget + tránh route rỗng.

2. Solving 1.2...
   - Thought: Chỉ disable toggle là chưa đủ, vì settings có thể còn true từ trước.
   - Action: Khi bấm lưu experience, ép các toggle phụ thuộc module phụ về `false` nếu module đang off.
   - Reflection: ✓ Đảm bảo “buộc tắt” thật sự ở data layer.

3. Solving 1.3...
   - Thought: Runtime public phải tự tắt kể cả khi data cũ chưa migrate hết.
   - Action: Giữ guard runtime trong hooks/pages (AND với module state), đồng thời dùng config đã bị ép false sau save.
   - Reflection: ✓ An toàn kép: vừa runtime-safe vừa data-safe.

## Scope triển khai full (không chia phase)

### A) Module chính => 404 + noindex (server-first)
Áp dụng cho tất cả route public tương ứng experience có module chính:

1. `app/(site)/products/layout.tsx`
   - Query `api.admin.modules.getModuleByKey({ key: 'products' })` trong `generateMetadata`.
   - Nếu off: trả metadata noindex + title/description not-found.
   - Trong default layout: nếu off => `notFound()` trước mọi query/schema.

2. `app/(site)/products/[slug]/layout.tsx`
   - Query module `products` trong `generateMetadata` + layout.
   - Nếu off: metadata noindex + `notFound()`.
   - Không tạo JSON-LD product/breadcrumb khi module off.

3. `app/(site)/services/layout.tsx`
   - Guard module `services` tương tự products/posts.

4. `app/(site)/services/[slug]/layout.tsx`
   - Guard module `services` tương tự products/posts.

5. `app/(site)/promotions/layout.tsx`
   - Guard module `promotions` trong metadata + layout.
   - Nếu off: noindex + `notFound()` + không render JsonLd breadcrumb.

6. `app/(site)/wishlist/layout.tsx` (nếu chưa có guard)
   - Guard module `wishlist` theo pattern trên.

7. `app/(site)/cart/layout.tsx`
   - Guard module chính `cart` theo pattern trên.

8. `app/(site)/checkout/layout.tsx`
   - Guard module chính `orders` (và check `cart` là dependency hard).
   - Nếu `orders` off hoặc `cart` off => `notFound()` + noindex.

9. `app/(site)/account/layout.tsx` + pages con
   - `/account/profile`: guard `customers`.
   - `/account/orders`: guard `orders` + `customers`.
   - Nếu không phù hợp đặt ở layout chung, đặt guard tại từng page server wrapper tương ứng.

Ghi chú: giữ nguyên rule hiện có cho `posts` (đã done), không đổi behavior ngoài scope.

---

### B) Module phụ => ép toggle false khi SAVE experience
Nguyên tắc: **module phụ off thì setting toggle tương ứng phải lưu false**; khi module bật lại vẫn giữ false (user tự bật).

Tạo helper dùng chung trong `lib/experiences`:
1. File mới: `lib/experiences/module-toggle-guards.ts`
   - Hàm `enforceModuleDependentToggles(config, moduleStateMap)` cho từng experience type.
   - Trả về config đã normalize, chỉ ép các field phụ thuộc module.
   - Không đụng field không liên quan (KISS/YAGNI).

2. `lib/experiences/useExperienceSave.ts` (hoặc nơi handle save hiện tại)
   - Thêm optional `beforeSaveTransform`.
   - Ở từng experience page, truyền transform để ép false trước khi mutation save.

Áp dụng cụ thể:

3. `app/system/experiences/products-list/page.tsx`
   - Trước save, ép:
     - `showWishlistButton=false` nếu wishlist module off.
     - `showAddToCartButton=false` nếu cart/orders dependency off.
     - `enableQuickAddVariant=false` nếu cart/orders off hoặc variants disabled.
     - `showBuyNowButton=false` nếu orders off.
     - `showPromotionBadge=false` nếu promotions off.
   - Toggle UI giữ disabled như hiện tại.

4. `app/system/experiences/product-detail/page.tsx`
   - Trước save, ép trong layout config hiện tại:
     - `showComments=false` nếu comments off.
     - `showCommentLikes=false` nếu comments off hoặc feature likes off.
     - `showCommentReplies=false` nếu comments off hoặc feature replies off.
     - `showWishlist=false` nếu wishlist off.
     - `showAddToCart=false` nếu cart/orders off.
   - Config global:
     - `showBuyNow=false` nếu orders off.

5. `app/system/experiences/posts-detail/page.tsx`
   - Trước save, ép:
     - `showComments=false` nếu comments off.
     - `showCommentLikes=false` nếu likes feature off.
     - `showCommentReplies=false` nếu replies feature off.
     - `showTags=false` nếu posts tag feature off.

6. `app/system/experiences/wishlist/page.tsx`
   - Trước save, ép:
     - `showNote=false` nếu wishlist note feature off.
     - `showNotification=false` nếu wishlist notification feature off.
     - `showAddToCartButton=false` nếu cart/orders dependency off.

7. `app/system/experiences/cart/page.tsx`
   - Trước save, ép:
     - `showExpiry=false` nếu expiry feature off.
     - `showNote=false` nếu note feature off.

8. `app/system/experiences/checkout/page.tsx`
   - Nếu có toggle phụ thuộc promotions/payment/shipping module features thì ép false tương ứng.
   - Nếu hiện không có module feature map trực tiếp, giữ nguyên (không over-engineer).

9. `app/system/experiences/menu/page.tsx`
   - Các toggle/menu-item phụ thuộc module (cart/wishlist/products/posts/services/customers/orders) ép false khi module off.
   - Mục tiêu: preview menu và runtime menu không hiển thị item trái trạng thái module.

10. Các experience còn lại (`services-list`, `services-detail`, `promotions-list`, `account-profile`, `account-orders`, `contact`, `comments-rating`)
   - Kiểm tra toggle nào phụ thuộc module/feature; nếu có thì thêm ép false trước save cùng pattern.
   - Nếu không có toggle phụ thuộc module thì không thêm logic thừa.

---

### C) Runtime public + preview phải đồng bộ tắt UI
1. `lib/experiences/useSiteConfig.ts`
   - Rà toàn bộ config hooks đã có AND với module/feature state.
   - Bổ sung các điểm còn thiếu để bảo đảm UI public luôn tắt khi module phụ off (kể cả trước khi user save lại).

2. Các page public client đang đọc config:
   - `app/(site)/products/page.tsx`
   - `app/(site)/products/[slug]/page.tsx`
   - `app/(site)/services/page.tsx`, `app/(site)/services/[slug]/page.tsx`
   - `app/(site)/wishlist/page.tsx`, `app/(site)/cart/page.tsx`, `app/(site)/checkout/page.tsx`
   - `app/(site)/account/profile/page.tsx`, `app/(site)/account/orders/page.tsx`
   - `components/site/Header.tsx` (menu toàn site)
   - Đảm bảo các block UI phụ thuộc module chỉ render khi cả `toggle && moduleEnabled`.

3. Preview trong experiences
   - Các preview props phải truyền từ config đã normalize (sau ép false) và/hoặc AND module state như hiện có.
   - Không để preview hiển thị UI khi module phụ off.

---

### D) Validation + commit (theo rule repo)
1. Chạy `bunx tsc --noEmit`.
2. Rà `git diff --cached` + `git status` kiểm tra không có secret.
3. Commit 1 lần cho full scope với message dạng:
   - `fix(experiences): enforce module guards and dependent toggles`

## Checklist hoàn tất
- [ ] Tất cả route module chính đã có server guard 404 + noindex
- [ ] Không còn JSON-LD/canonical cho route module chính bị tắt
- [ ] Toggle module phụ bị ép false lúc save
- [ ] Preview đồng bộ trạng thái ép false
- [ ] Runtime public đồng bộ trạng thái module/toggle
- [ ] Typecheck pass
- [ ] Commit hoàn tất

Nếu bạn duyệt spec này, mình sẽ implement full trong một lượt đúng các file và rule trên.