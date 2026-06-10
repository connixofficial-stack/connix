## Audit Summary
### Pre-Audit
- **Evidence đã có**
  - Stack trace báo `useCustomerAuth must be used within CustomerAuthProvider` tại `app/(site)/auth/context.tsx:137`, được gọi từ `ProductsContent` ở `app/(site)/products/page.tsx:170`.
  - `ProductsPage` là client component và gọi `useCustomerAuth()` trực tiếp trong `ProductsContent`.
  - `CustomerAuthProvider` hiện chỉ được bọc qua `components/site/SiteProviders.tsx`.
  - `SiteProviders` lại đang tự bọc thêm `ConvexClientProvider`, trong khi `app/layout.tsx` cũng đã bọc toàn app bằng `ConvexClientProvider`.
  - `app/(site)/layout.tsx` là async server layout, render `<SiteProviders><Header/><CartDrawer/><main>{children}</main>...</SiteProviders>`.
  - Nhiều page site khác cũng dùng `useCustomerAuth()` (`cart`, `checkout`, `wishlist`, `account`, `products/[slug]`), nên nếu boundary/provider chain không ổn thì blast radius là toàn khu `(site)`, không riêng products.
- **Gap / điều chưa chắc 100%**
  - Chưa có repro runtime trực tiếp trong browser ở spec mode, nên chưa chứng minh được chính xác lỗi xuất phát từ nested provider hay từ boundary server/client bị tối ưu lại bởi Next 16.
  - Tuy vậy, code smell lớn nhất và có evidence mạnh nhất là provider tree đang bị tách làm 2 lớp client shell (`app/layout.tsx` có provider Convex, `SiteProviders` lại dựng provider Convex lần nữa), khiến architecture khó đoán và dễ phát sinh hydration/boundary lỗi.

### Audit Questions
1. **Triệu chứng observed**: expected `ProductsPage` render bình thường dưới `CustomerAuthProvider`; actual recoverable error làm Next fallback sang client rendering và nổ vì không tìm thấy `CustomerAuthProvider`.
2. **Phạm vi ảnh hưởng**: toàn bộ các page/site component dùng `useCustomerAuth()` trong `(site)` route group.
3. **Tái hiện**: theo log là tái hiện ổn định ở `/products`; điều kiện tối thiểu là render `ProductsContent` khi provider chain không được nhận đúng.
4. **Mốc thay đổi gần nhất**: chưa đọc history feature auth/provider gần nhất, nhưng evidence code hiện tại đủ để chốt hướng fix kiến trúc.
5. **Dữ liệu thiếu**: chưa có browser repro sau fix ở spec mode.
6. **Giả thuyết thay thế**: có thể `ProductsPage` bị render ngoài `(site)` layout; đã loại trừ vì file nằm đúng `app/(site)/products/page.tsx` và grep xác nhận `(site)/layout.tsx` đang import `SiteProviders`.
7. **Rủi ro nếu fix sai nguyên nhân**: chỉ vá riêng products sẽ che lỗi nhưng các route khác vẫn có thể nổ lại; giữ nested provider tiếp tục tạo context boundary khó debug.
8. **Pass/fail**: `/products` không còn recoverable error; mọi route dùng `useCustomerAuth()` đều nhận context ổn định; không còn provider duplication mơ hồ.

### Root Cause
**Khả năng cao root cause là provider boundary của site đang không được chuẩn hóa**:
1. `CustomerAuthProvider` phụ thuộc vào một client shell riêng (`SiteProviders`).
2. `SiteProviders` đang dựng thêm `ConvexClientProvider` dù root app đã có `ConvexClientProvider` ở `app/layout.tsx`.
3. Với Next.js 16 + Turbopack, provider tree lồng và chồng chéo như vậy dễ tạo ra hydration/client boundary không ổn định, dẫn đến một subtree client render mà không nhận được `CustomerAuthProvider` như kỳ vọng.

### Counter-Hypothesis Check
- **Đối chứng A**: Hook `useCustomerAuth` bị import sai module instance khác.
  - **Loại trừ tạm thời**: grep cho thấy mọi nơi đều import cùng alias `@/app/(site)/auth/context`.
- **Đối chứng B**: chỉ riêng `products/page.tsx` có bug logic.
  - **Loại trừ**: `products/page.tsx` chỉ dùng hook theo pattern giống nhiều route khác; lỗi nằm ở việc context không tồn tại, không phải logic business của products.

### Post-Audit
- **Blast radius**: medium vì đụng provider boundary của toàn site, nhưng file sửa ít và logic đơn giản.
- **Regression risk**: thấp-trung bình nếu giữ nguyên thứ tự provider và không đổi API hook.
- **KISS/YAGNI/DRY**: nên có đúng 1 chỗ sở hữu `ConvexClientProvider`, 1 site client shell sở hữu `CustomerAuthProvider` + `CartProvider` + `Toaster`; tránh nesting thừa.

## Root Cause Confidence
**Medium-High** — evidence code mạnh ở kiến trúc provider chồng chéo và phạm vi lỗi khớp context boundary; chưa đạt High vì spec mode chưa cho phép browser repro trực tiếp sau fix.

## Problem Graph
1. [Main] Recoverable error ở products vì thiếu CustomerAuth context <- depends on 1.1, 1.2
   1.1 [Provider boundary site không đủ ổn định] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] `CustomerAuthProvider` chỉ tồn tại trong `SiteProviders`, trong khi provider tree client/server bị chồng chéo bởi nested `ConvexClientProvider`
   1.2 [Blast radius toàn site] <- depends on 1.2.1
      1.2.1 [Sub] nhiều route khác cũng dùng `useCustomerAuth`, nên cần chuẩn hóa toàn site thay vì hotfix riêng products

## Execution (with reflection)
1. **Chuẩn hóa ownership của Convex provider**
   - **File**: `components/site/SiteProviders.tsx`
   - **Thay đổi**:
     - Bỏ `ConvexClientProvider` khỏi `SiteProviders`.
     - Giữ `CustomerAuthProvider` bọc `CartProvider`, `Toaster`, và `children`.
   - **Logic**: root app đã có `ConvexClientProvider` trong `app/layout.tsx`, nên site shell không nên tạo thêm instance/provider boundary thứ 2.
   - **Reflection**: KISS, giảm nesting thừa và loại bỏ một nghi phạm lớn gây context/hydration drift.

2. **Tạo site client shell rõ ràng, tránh layout async server ôm trực tiếp quá nhiều client subtree**
   - **File mới đề xuất**: `components/site/SiteShell.tsx`
   - **Thay đổi**:
     - Tạo component `'use client'` nhận `children`, render:
       - `<SiteProviders>`
       - `<Header />`
       - `<CartDrawer />`
       - `<main>{children}</main>`
       - `<DynamicFooter />`
     - Nếu cần, truyền prop server-safe tối thiểu; ưu tiên không truyền object lớn để tránh hydration noise.
   - **Logic**: tách rõ server layout (SEO/schema/data fetch) khỏi client shell (context providers + interactive UI). Đây là pattern ổn định hơn cho Next 16.
   - **Reflection**: giảm khả năng subtree client bị ráp lại không đồng nhất khi Turbopack recover SSR.

3. **Đơn giản hóa `app/(site)/layout.tsx` thành server wrapper thuần**
   - **File**: `app/(site)/layout.tsx`
   - **Thay đổi**:
     - Giữ phần `generateMetadata`, query menu, JSON-LD như cũ.
     - Thay khối JSX hiện tại từ `<SiteProviders>...` thành `<SiteShell>{children}</SiteShell>`.
   - **Logic**: server layout chỉ lo data/SEO; toàn bộ provider và UI client nằm trong một client entry rõ ràng.
   - **Reflection**: DRY và dễ debug hơn so với layout server trực tiếp lồng nhiều client component/provider.

4. **Giữ nguyên API của auth hook, không vá kiểu “return fallback context”**
   - **File**: `app/(site)/auth/context.tsx`
   - **Thay đổi**: không đổi logic hook trừ khi phát hiện cần thêm guard debug rất nhỏ.
   - **Logic**: lỗi hiện tại là boundary, không nên che bằng silent fallback vì sẽ giấu bug kiến trúc.
   - **Reflection**: đúng yêu cầu user là chuẩn hóa boundary, không phải nuốt lỗi.

5. **Audit nhanh các route site dùng `useCustomerAuth` sau khi chuẩn hóa**
   - **Files kiểm tra**:
     - `app/(site)/products/page.tsx`
     - `app/(site)/products/[slug]/page.tsx`
     - `app/(site)/cart/page.tsx`
     - `app/(site)/checkout/page.tsx`
     - `app/(site)/wishlist/page.tsx`
     - `app/(site)/account/**/page.tsx`
     - `components/site/Header.tsx`
     - `components/site/CartDrawer.tsx`
     - `lib/cart/CartContext.tsx`
   - **Thay đổi**: chủ yếu verify, chỉ sửa nếu có import/provider assumption sai.
   - **Logic**: đảm bảo mọi consumer vẫn nằm dưới cùng một provider chain mới.
   - **Reflection**: tránh fix xong `/products` nhưng vỡ route khác.

## Verification Plan
- **Typecheck**: `bunx tsc --noEmit`
- **Repro chính**:
  1. Mở `/products` và reload hard refresh.
  2. Confirm không còn recoverable error `useCustomerAuth must be used within CustomerAuthProvider`.
  3. Kiểm tra `/products/[slug]`, `/cart`, `/checkout`, `/wishlist`, `/account/login`, `/account/profile`.
- **Behavior checks**:
  - Header vẫn render trạng thái tài khoản đúng.
  - Cart drawer vẫn mở được.
  - Login modal vẫn mở từ CTA yêu cầu đăng nhập.
- **Regression checks**:
  - Không có nested provider warning/hydration issue mới.
  - Query/mutation Convex trong site vẫn chạy bình thường qua root `ConvexClientProvider` duy nhất.

## Checklist chốt để implement 1 lần
- [ ] Bỏ `ConvexClientProvider` khỏi `components/site/SiteProviders.tsx`
- [ ] Tạo `components/site/SiteShell.tsx` làm client shell duy nhất cho site
- [ ] Cập nhật `app/(site)/layout.tsx` dùng `SiteShell`
- [ ] Audit nhanh toàn bộ consumer của `useCustomerAuth`
- [ ] Chạy `bunx tsc --noEmit`
- [ ] Repro `/products` + các route auth/cart liên quan
- [ ] Commit kèm `.factory/docs`

## Chốt ngắn gọn cho anh
Cách fix em đề xuất không vá tạm ở products mà chuẩn hóa lại boundary cho cả site: chỉ giữ **1 Convex provider ở root app**, rồi gom `CustomerAuthProvider + CartProvider + Toaster + Header/CartDrawer/Footer` vào **1 client shell duy nhất** dưới `(site)` layout. Cách này hợp KISS/YAGNI, giảm nguy cơ Turbopack/Next 16 làm lệch context tree, và xử lý luôn blast radius cho toàn bộ site chứ không chỉ riêng `/products`.