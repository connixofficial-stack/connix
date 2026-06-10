# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng truy cập đường dẫn dạng `/products/giong-nho`, máy tính hiểu lầm đây là yêu cầu xem thông tin chi tiết của một chai rượu vang cụ thể tên là "giong-nho" (vì cấu trúc này trùng khớp với cấu hình xem sản phẩm cũ `/products/[slug]`). Do không tìm thấy chai rượu nào tên là "giong-nho", hệ thống báo lỗi 404 (Không tìm thấy sản phẩm). 
Thực tế, "giong-nho" là một **nhóm thuộc tính** (attribute group) để lọc các chai rượu vang (như Merlot, Cabernet...).
Giải pháp là chúng ta sẽ dạy cho hệ thống biết cách phân biệt: Nếu `slug` đó là tên của một nhóm thuộc tính rượu vang, thay vì báo lỗi không thấy chai rượu, hãy mở trang danh sách và lọc toàn bộ chai rượu theo nhóm thuộc tính đó.

## 2. Elaboration & Self-Explanation
Hệ thống Next.js App Router định tuyến các trang bằng cấu trúc thư mục.
Chúng ta có hai route xử lý:
1. Catch-all Route `[...slugs]/page.tsx`: Xử lý các đường dẫn phức tạp hoặc phân giải SEO linh hoạt.
2. Legacy Route `products/[slug]/page.tsx` và `products/[slug]/layout.tsx`: Xử lý đường dẫn dạng 2 segments cũ `/products/slug-san-pham`.

Khi người dùng truy cập `/products/giong-nho` (2 segments):
Next.js sẽ ưu tiên route tĩnh/cố định hơn là catch-all từ root. Do `/products/[slug]` khớp hoàn hảo với `/products/giong-nho` (với `slug` = `giong-nho`), Next.js đã định tuyến người dùng vào `products/[slug]`.
Tại đây, hệ thống cố gắng tìm sản phẩm có slug là `giong-nho`. Rõ ràng không có sản phẩm nào tên như vậy, dẫn đến hiển thị trang chi tiết trống kèm thông báo lỗi "Không tìm thấy sản phẩm".

Để khắc phục:
Chúng ta cần biến `app/(site)/products/[slug]/page.tsx` từ Client Component thành Server Component. Tại đây, ta sẽ dùng Convex Client để query hàm `api.ia.resolveProductLandingContext`.
- Nếu kết quả trả về cho thấy đây là một Landing Context của Nhóm thuộc tính (`productTypeAttribute`): chúng ta lập tức render Component `ProductsPage` với các filter tương ứng, biến nó thành trang bộ lọc chuẩn SEO.
- Nếu không phải (hoặc là sản phẩm thực tế): render Component `ProductDetailPageShared` như cũ.
Đồng thời, ta cần cập nhật `generateMetadata` trong `app/(site)/products/[slug]/layout.tsx` để tự động trả về SEO Metadata đúng chuẩn cho Nhóm thuộc tính thay vì trả về metadata lỗi "Không tìm thấy sản phẩm".

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn có một thư viện sách.
Bạn có một thủ thư chuyên phục vụ yêu cầu tìm sách theo mã vạch đặt tại quầy "Sách bán chạy": `/products/[mã-sách]`.
Khi một độc giả đến quầy đó và hét lên: "Hãy cho tôi xem khu vực sách trinh thám!" (`/products/trinh-tham`), người thủ thư máy móc tìm kiếm một cuốn sách có tựa đề là "trinh thám". Vì không có cuốn sách nào tên là "trinh thám", thủ thư lắc đầu bảo "Không tìm thấy sách".
Đáng lẽ, người thủ thư phải thông minh nhận ra "trinh thám" là một **thể loại sách**, và dẫn độc giả tới kệ sách trinh thám.
Chúng ta sẽ nâng cấp người thủ thư đó: trước khi trả lời "Không tìm thấy", hãy tra cứu xem từ khóa đó có phải là một thể loại (Attribute Group) hay không. Nếu đúng, hãy mở ngay kệ sách tương ứng.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- **Tình trạng định tuyến:** `app/(site)/products/[slug]/page.tsx` đang bắt tất cả các request có định dạng `/products/*` với chính xác 2 segments.
- **Tác động:** Đường dẫn `/products/giong-nho` bị cướp quyền định tuyến từ Catch-all `[...slugs]`, dẫn đến hiển thị trang chi tiết sản phẩm lỗi 404 thay vì trang Landing lọc sản phẩm.
- **Khả năng biên dịch:** TypeScript compile sạch sẽ, Convex functions hoạt động tốt và đã hỗ trợ context `productTypeAttribute` khi truyền slugs `["products", "giong-nho"]`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:** Next.js ưu tiên route cố định `/products/[slug]` hơn Catch-all route root `/[...slugs]`. Vì vậy, khi truy cập `/products/giong-nho`, Next.js nhảy vào `/products/[slug]/page.tsx` và cố tìm sản phẩm `giong-nho` thay vì nhận diện đó là nhóm thuộc tính.
- **Giả thuyết đối chứng:** Nếu chuyển `/products/[slug]/page.tsx` thành Server Component và thực hiện phân giải Landing Context thông qua Convex trước khi quyết định render, chúng ta có thể kết xuất trực tiếp trang bộ lọc sản phẩm `ProductsPage` mà không phá vỡ tính năng xem sản phẩm chi tiết của legacy route.

---

# IV. Proposal (Đề xuất)
1. **Chuyển đổi `app/(site)/products/[slug]/page.tsx` thành Server Component:**
   - Loại bỏ chỉ thị `'use client';`.
   - Fetch landing context thông qua `client.query(api.ia.resolveProductLandingContext, { slugs: ['products', decodeURIComponent(slug)] })`.
   - Nếu `resolvedContext.type === 'productTypeAttribute'`, render `<ProductsPage />` với filter phù hợp.
   - Nếu không, tiếp tục render client component `<ProductDetailPageShared params={params} />` để hiển thị chi tiết sản phẩm.
2. **Cập nhật `app/(site)/products/[slug]/layout.tsx`:**
   - Trong `generateMetadata`, nếu không tìm thấy `product`, tiếp tục query `resolveProductLandingContext`.
   - Nếu tìm thấy context nhóm thuộc tính, trả về SEO Metadata đầy đủ chuẩn SEO (giống như logic trong catch-all).
   - Nếu không, trả về fallback 404 như cũ.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

- **Sửa:** [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/products/[slug]/page.tsx)
  - Vai trò hiện tại: Client component render trực tiếp chi tiết sản phẩm.
  - Thay đổi: Chuyển thành Server Component, phân giải landing context và render `ProductsPage` hoặc `ProductDetailPageShared` tùy theo kết quả phân giải.
- **Sửa:** [layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/products/[slug]/layout.tsx)
  - Vai trò hiện tại: Quản lý layout và SEO Metadata cho trang chi tiết sản phẩm legacy.
  - Thay đổi: Bổ sung logic kiểm tra landing context nhóm thuộc tính trong `generateMetadata` để cung cấp tiêu đề và thẻ SEO chính xác khi hiển thị trang bộ lọc nhóm thuộc tính.

---

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật `layout.tsx` để tối ưu SEO Metadata cho Nhóm thuộc tính.
2. Tái cấu trúc `page.tsx` thành Server Component và tích hợp phân giải thông minh.
3. Chạy `bunx tsc --noEmit` để đảm bảo không phát sinh lỗi Typecheck.
4. Xác nhận kết quả.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Tests
- Chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo TypeScript biên dịch thành công sạch sẽ.

### Manual Verification
- Người dùng truy cập trực tiếp `/products/giong-nho` trên trình duyệt: trang web phải hiển thị danh sách toàn bộ sản phẩm và kích hoạt bộ lọc của nhóm thuộc tính "Giống nho" thành công, không hiển thị lỗi 404 "Không tìm thấy sản phẩm".

---

# VIII. Todo
- [ ] Cập nhật `app/(site)/products/[slug]/layout.tsx` bổ sung xử lý SEO Metadata khi slug là nhóm thuộc tính.
- [ ] Chuyển đổi `app/(site)/products/[slug]/page.tsx` thành Server Component và phân loại kết xuất linh hoạt.
- [ ] Thực hiện Typecheck dự án.
- [ ] Thực hiện lệnh phát âm thanh báo hoàn tất task.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Trang `/products/giong-nho` hoạt động, hiển thị bộ lọc danh sách sản phẩm thành công.
- Không có lỗi biên dịch TypeScript.
- Giữ nguyên toàn bộ logic cũ cho các trang chi tiết sản phẩm thực tế.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Một sản phẩm có slug trùng khớp chính xác với slug nhóm thuộc tính (hy hữu). Trong trường hợp này, Landing Context sẽ ưu tiên hiển thị nhóm thuộc tính. Đây là hành vi chấp nhận được vì slug nhóm thuộc tính mang tính phân loại cao hơn.
- **Hoàn tác:** Khôi phục file `page.tsx` và `layout.tsx` về phiên bản git commit gần nhất.

---

# XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp hay thay đổi cấu trúc URL của các module khác như posts, services.
- Không cấu hình thêm schema hoặc tables mới trong Convex database.
