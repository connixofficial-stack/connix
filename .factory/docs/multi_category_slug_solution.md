# Spec: Giải pháp thiết kế cho Sản phẩm thuộc nhiều Danh mục (Multi-category Products) và Cấu trúc Slug URL

## Audit Summary (Tóm tắt kiểm tra)
- **Database Schema**: Bảng `products` trong `convex/schema.ts` hiện tại có trường `categoryId: v.id("productCategories")` (quan hệ 1-N).
- **Routing**: Next.js App Router sử dụng cấu trúc route group `app/(site)/[categorySlug]/[recordSlug]/page.tsx` và gọi hàm query Convex `api.ia.resolveUnifiedDetail` để xác thực liên kết giữa sản phẩm (hoặc bài viết, dịch vụ) và danh mục. Nếu `product.categoryId` không trùng khớp với danh mục được phân giải từ `categorySlug`, hệ thống sẽ trả về lỗi `404 Not Found`.

## Root Cause Confidence (Độ tin cậy nguyên nhân gốc)
- **Độ tin cậy**: **High (Cao)**.
- **Lý do**: Hệ thống ban đầu được thiết kế theo mô hình quan hệ 1-N (một sản phẩm chỉ thuộc một danh mục). Việc nâng cấp lên mô hình N-N (sản phẩm thuộc nhiều danh mục) gây xung đột trực tiếp với cấu trúc URL phân cấp dạng `/{categorySlug}/{productSlug}` vì lúc này một sản phẩm sẽ tương ứng với nhiều đường dẫn URL hợp lệ khác nhau. Điều này dẫn đến các vấn đề nghiêm trọng về SEO (nội dung trùng lặp - duplicate content) và logic tạo Breadcrumb / Static Paths.

---

# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề**: Hiện tại một đôi giày Nike chỉ được để trong một hộp (danh mục) duy nhất, ví dụ "Giày nam". Nếu muốn đôi giày đó vừa ở hộp "Giày nam" vừa ở hộp "Giày thể thao", chúng ta phải sửa cách lưu trữ trong kho (Database). Tuy nhiên, khi khách hàng đi mua sắm bằng đường link (URL) kiểu `/{hộp}/{đôi-giày}`, họ có thể thấy cùng một đôi giày ở 2 đường link khác nhau. Google sẽ ghét điều này vì cho rằng trang web đang sao chép nội dung.
- **Cách giải quyết**:
  - **Cách 1 (Khuyên dùng)**: Đổi link của đôi giày thành một đường link phẳng, duy nhất không chứa tên hộp, ví dụ `/products/giay-nike`. Dù ở trong hộp nào, đôi giày vẫn chỉ có một link duy nhất.
  - **Cách 2**: Vẫn giữ các link phân cấp, nhưng dán thêm một nhãn "Hộp chính" (Primary Category) trên giày. Nếu ai đó truy cập bằng link phụ, ta bảo Google rằng link chính là link của hộp chính (dùng Canonical Tag) để không bị phạt SEO.
  - **Cách 3**: Bắt buộc mọi người chỉ được xem đôi giày qua link của hộp chính. Nếu họ bấm vào link của hộp phụ, ta sẽ tự động chuyển hướng (Redirect 301) họ về link hộp chính.

## 2. Elaboration & Self-Explanation
Trong các hệ thống thương mại điện tử, việc một sản phẩm thuộc nhiều danh mục là nhu cầu thực tế rất phổ biến. Ví dụ: Một sản phẩm "Giày Nike Air Max" có thể vừa thuộc danh mục "Giày nam" (Category A), vừa thuộc danh mục "Giày chạy bộ" (Category B), vừa thuộc danh mục "Sản phẩm khuyến mãi" (Category C).

Nếu cấu trúc URL của sản phẩm là phẳng (Flat URL), ví dụ `/products/giay-nike-air-max`, việc sản phẩm thuộc 1 hay nhiều danh mục không ảnh hưởng đến URL của nó.
Tuy nhiên, hệ thống hiện tại đang sử dụng cấu trúc URL phân cấp (Hierarchical URL): `/{categorySlug}/{productSlug}`. Khi một sản phẩm có nhiều danh mục, hệ thống sẽ phát sinh nhiều URL hợp lệ cho cùng một sản phẩm:
- `/giay-nam/giay-nike-air-max`
- `/giay-chay-bo/giay-nike-air-max`
- `/khuyen-mai/giay-nike-air-max`

Điều này dẫn đến 3 vấn đề kỹ thuật lớn:
1. **SEO Duplicate Content**: Công cụ tìm kiếm (Google, Bing) sẽ quét và đánh chỉ mục cả 3 URL này dưới dạng 3 trang riêng biệt nhưng có nội dung giống hệt nhau, dẫn đến việc chia nhỏ sức mạnh SEO (PageRank) và có thể bị thuật toán Google phạt vì spam nội dung trùng lặp.
2. **Breadcrumb UX**: Khi user đang xem sản phẩm, thanh điều hướng Breadcrumb sẽ hiển thị như thế nào? Nếu họ vào từ Google trực tiếp, hệ thống cần biết danh mục nào là danh mục "chính" để vẽ Breadcrumb: `Trang chủ > Giày nam > Giày Nike Air Max` hay `Trang chủ > Giày chạy bộ > Giày Nike Air Max`.
3. **Next.js Dynamic Routing & SSG Build Time**: Nếu dự án cấu hình Static Site Generation (SSG) để tối ưu tốc độ tải trang, Next.js sẽ phải generate ra hàng loạt trang HTML tĩnh cho từng URL. Nếu 1 sản phẩm nằm trong 5 danh mục, số lượng file HTML được sinh ra cho sản phẩm đó sẽ nhân lên gấp 5 lần, làm tăng đáng kể thời gian build.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**:
  - Sản phẩm: `Giày Nike Air Max` có slug là `giay-nike-air-max`.
  - Danh mục liên kết:
    - Danh mục 1: `Giày Nam` (slug: `giay-nam`)
    - Danh mục 2: `Giày Thể Thao` (slug: `giay-the-thao`)
  - Nếu đi theo cấu trúc URL hiện tại, ta có:
    - URL A: `/giay-nam/giay-nike-air-max`
    - URL B: `/giay-the-thao/giay-nike-air-max`
- **Hình ảnh đời thường**:
  - Hãy tưởng tượng bạn quản lý một siêu thị vật lý. Bạn có một lô hàng "Nước xả vải Comfort".
  - Lô nước xả này vừa có thể xếp ở quầy "Hóa mỹ phẩm", vừa có thể xếp ở đầu kệ "Khu vực khuyến mãi".
  - Khách hàng đi đường nào cũng có thể nhặt được chai Comfort này. Nhưng trên hóa đơn hoặc nhãn giá (định danh sản phẩm), thông tin sản phẩm vẫn trỏ về duy nhất một mã vạch (SKU) và một tên gọi duy nhất.
  - Nếu bạn bắt buộc mỗi quầy phải có một cách thanh toán khác nhau cho cùng một chai Comfort (như việc bắt buộc URL phải chứa slug của quầy đó), bạn sẽ làm phức tạp hóa hệ thống kế toán của mình một cách vô ích.

---

# II. Audit Summary (Tóm tắt kiểm tra)
*(Đã trình bày chi tiết ở phần trên)*

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*(Đã trình bày chi tiết ở phần trên)*

---

# IV. Proposal (Đề xuất các Option chi tiết)

Dưới đây là 3 phương án giải quyết (Options) kèm theo phân tích chi tiết về Trade-off (Đánh đổi) và mức độ khả thi của từng phương án đối với hệ thống Next.js + Convex hiện tại.

### Option A (Khuyên dùng - Best Practice chuẩn TMĐT): Đổi sang URL phẳng `/products/{productSlug}` cho sản phẩm
Trong phương án này, cấu trúc URL của sản phẩm sẽ được tách biệt hoàn toàn khỏi danh mục.
- **URL chi tiết sản phẩm**: `/products/giay-nike-air-max` (hoặc `/p/giay-nike-air-max` để ngắn hơn).
- **URL danh mục**: `/giay-nam` (vẫn giữ nguyên là trang danh sách sản phẩm của danh mục đó).

#### 1. Thay đổi Database Schema (Convex)
- Thay đổi `products.categoryId` thành `categoryIds: v.array(v.id("productCategories"))` (hoặc dùng bảng trung gian `productCategoryLinks` nếu muốn tối ưu hóa quan hệ N-N lâu dài và dễ đánh index).
- Thêm trường `primaryCategoryId: v.id("productCategories")` trên bảng `products` để xác định danh mục chính phục vụ hiển thị Breadcrumb mặc định.

#### 2. Xử lý Routing & Logic
- Tạo folder route mới trong Next.js: `app/(site)/products/[productSlug]/page.tsx` để render chi tiết sản phẩm.
- Sửa logic resolver trong `convex/ia.ts` (hàm `resolveUnifiedDetail`): Khi nhận diện `recordSlug` là sản phẩm, không cần check `categorySlug` nữa, chỉ query trực tiếp sản phẩm theo `slug = recordSlug`.
- Đối với các module khác như `posts` và `services`, nếu vẫn muốn giữ URL dạng `/{categorySlug}/{slug}`, router `[categorySlug]/[recordSlug]/page.tsx` vẫn hoạt động bình thường cho chúng mà không bị ảnh hưởng.

#### 3. Phân tích Trade-off
- **Ưu điểm**:
  - **SEO tối ưu nhất**: Tập trung toàn bộ PageRank vào một URL duy nhất. Không lo duplicate content, không cần xử lý tag canonical phức tạp.
  - **Build SSG nhanh và sạch**: Mỗi sản phẩm chỉ build đúng 1 trang HTML tĩnh duy nhất.
  - **Chuẩn công nghiệp**: Giống cách thiết kế của các nền tảng thương mại điện tử lớn như Amazon, Shopify, Shopee, Tiki.
  - **Đơn giản hóa code**: Logic routing và query DB cực kỳ rõ ràng, giảm thiểu lỗi runtime.
- **Nhược điểm**:
  - Thay đổi cấu trúc URL hiện tại của sản phẩm (nếu web đã chạy lâu và có nhiều link được Google index, cần cấu hình redirect 301 từ URL cũ sang URL phẳng mới để giữ điểm SEO).

---

### Option B: Giữ nguyên URL phân cấp `/{categorySlug}/{productSlug}` kết hợp Canonical Tag
Hệ thống chấp nhận việc truy cập sản phẩm qua nhiều URL khác nhau, nhưng dán thẻ Canonical để báo cho Google biết đâu là URL chính chủ.

#### 1. Thay đổi Database Schema (Convex)
- Thêm `categoryIds: v.array(v.id("productCategories"))` trên bảng `products` để lưu các danh mục phụ.
- Thêm `primaryCategoryId: v.id("productCategories")` (bắt buộc) để xác định URL chính chủ cho SEO.

#### 2. Xử lý Routing & Logic
- Khi user truy cập `/giay-the-thao/giay-nike-air-max`, Next.js route `[categorySlug]/[recordSlug]` sẽ gọi `resolveUnifiedDetail`.
- Hàm `resolveUnifiedDetail` sẽ query sản phẩm theo `recordSlug`, sau đó kiểm tra xem `categorySlug` truyền vào có nằm trong danh sách `categoryIds` của sản phẩm đó hay không (thay vì so sánh bằng trực tiếp như trước).
- Trong trang chi tiết sản phẩm, chèn thẻ `<link rel="canonical" href="https://domain.com/{primaryCategorySlug}/{productSlug}" />` vào phần `<head>`.
- Breadcrumb hiển thị động theo `categorySlug` từ URL để tạo cảm giác nhất quán cho người dùng.

#### 3. Phân tích Trade-off
- **Ưu điểm**:
  - Giữ nguyên cấu trúc URL phân cấp đẹp mắt và linh hoạt.
  - Breadcrumb hiển thị cực kỳ khớp với luồng đi của người dùng.
- **Nhược điểm**:
  - **Hiệu năng & Build time**: Nếu build static (SSG), Next.js sẽ phải build trùng lặp nhiều trang cho cùng một sản phẩm, làm tăng dung lượng build và thời gian deploy.
  - **Rủi ro SEO**: Canonical tag là một "gợi ý" gửi tới Google, đôi khi Google vẫn tự quyết định index URL phụ nếu thuật toán của họ thấy URL phụ được liên kết nhiều hơn.
  - Logic DB query phức tạp hơn vì Convex không tối ưu hóa index trên mảng (array of IDs) tốt bằng quan hệ phẳng hoặc bảng liên kết.

---

### Option C: Giữ URL phân cấp đẹp nhưng Redirect 301 về URL Danh mục chính
Sản phẩm thuộc nhiều danh mục trong DB, nhưng chỉ có duy nhất một URL hợp lệ dựa trên Danh mục chính (Primary Category). Nếu truy cập qua danh mục phụ, hệ thống sẽ chuyển hướng ngay lập tức.

#### 1. Thay đổi Database Schema (Convex)
- Tương tự Option B: Cần `categoryIds: v.array(v.id("productCategories"))` và `primaryCategoryId: v.id("productCategories")`.

#### 2. Xử lý Routing & Logic
- URL chuẩn duy nhất: `/{primaryCategorySlug}/{productSlug}`.
- Khi người dùng truy cập một URL không chính thức (ví dụ từ danh mục phụ): `/giay-the-thao/giay-nike-air-max`.
- Hệ thống sẽ phát hiện ra `giay-the-thao` không phải là `primaryCategorySlug` của sản phẩm này.
- Next.js Server Component sẽ thực hiện lệnh `redirect('/giay-nam/giay-nike-air-max', RedirectType.replace)` với mã trạng thái HTTP 301.

#### 3. Phân tích Trade-off
- **Ưu điểm**:
  - Vẫn giữ được URL phân cấp đẹp.
  - Giải quyết triệt để duplicate content bằng redirect cứng (Google bắt buộc phải theo URL chính).
  - Không làm tăng số lượng static page khi build SSG (chỉ build 1 trang cho primary URL).
- **Nhược điểm**:
  - Khi user đang ở trang danh mục "Giày thể thao", click vào sản phẩm, URL trên thanh địa chỉ lập tức đổi sang "/giay-nam/...". Điều này có thể gây chút đứt gãy về mặt trải nghiệm điều hướng của người dùng (nhưng không quá lớn).
  - Phải xử lý thêm một bước redirect ở server-side, tăng nhẹ độ trễ phản hồi ban đầu đối với các URL phụ.

---

# V. Tệp bị ảnh hưởng (Files Impacted)
Nếu tiến hành thay đổi theo một trong các option trên, các file sau đây sẽ cần sửa đổi:

1. **Sửa**: [schema.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/schema.ts)
   - Thay đổi định nghĩa bảng `products` để chuyển từ `categoryId` đơn lẻ sang danh sách `categoryIds` và bổ sung `primaryCategoryId`.
2. **Sửa**: [ia.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/ia.ts)
   - Cập nhật hàm `resolveUnifiedDetail` để thay đổi logic xác thực danh mục sản phẩm (check mảng hoặc query bảng liên kết tùy theo option).
3. **Sửa**: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/%28site%29/%5BcategorySlug%5D/%5BrecordSlug%5D/page.tsx)
   - Tùy theo Option được chọn, có thể cần chuyển hướng route (Option C), cấu hình canonical tag (Option B) hoặc đổi đường dẫn đến route mới (Option A).
4. **Sửa**: `convex/products.ts`
   - Cập nhật các hàm mutations (create, update sản phẩm) để xử lý việc ghi nhiều danh mục từ màn hình Admin.
5. **Sửa**: Toàn bộ hệ thống Admin UI quản lý sản phẩm
   - Thay thế dropdown chọn 1 danh mục bằng component chọn nhiều danh mục (ví dụ Multi-select hoặc Checkbox Tree) và thêm tùy chọn "Đặt làm Danh mục chính".

---

# VI. Execution Preview (Xem trước thực thi)
*(Sẽ cập nhật chi tiết sau khi người dùng phê duyệt phương án)*

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
1. **Kiểm tra Routing**: Truy cập các URL sản phẩm cũ/mới và xác nhận mã trạng thái HTTP (200 OK, 301 Redirect hoặc 404 Not Found) đúng như thiết kế.
2. **Kiểm tra SEO**: Xem mã nguồn trang (View Source HTML) trên trình duyệt để đảm bảo thẻ `<link rel="canonical" href="..." />` hiển thị chính xác URL chuẩn của sản phẩm.
3. **Kiểm tra Admin UI**: Thêm mới và chỉnh sửa sản phẩm trong admin, gán nhiều danh mục, lưu lại và kiểm tra trong database Convex xem dữ liệu được lưu đúng cấu trúc mảng danh mục hay chưa.

---

# VIII. Todo
- [ ] 1. Thảo luận với người dùng để thống nhất chọn một trong ba phương án (Option A, B, C).
- [ ] 2. Cập nhật thiết kế chi tiết (Spec) dựa trên phương án được chọn.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Một sản phẩm có thể được gán vào nhiều danh mục khác nhau trong trang quản trị.
- Sản phẩm hiển thị đầy đủ trong danh sách sản phẩm của tất cả các danh mục được gán.
- URL chi tiết sản phẩm hoạt động chính xác theo phương án được chọn mà không gây lỗi 404.
- Đảm bảo tính nhất quán của SEO (không bị lỗi nội dung trùng lặp).
- Các module khác (bài viết `posts`, dịch vụ `services`) vẫn hoạt động bình thường, không bị ảnh hưởng bởi thay đổi này.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Thay đổi cấu trúc URL (nhất là Option A) có thể làm các link cũ đã được Google index hoặc được chia sẻ trước đó bị lỗi 404 nếu không cấu hình Redirect 301 cẩn thận.
- **Biện pháp giảm thiểu**: Thiết lập middleware hoặc rule redirect tự động ở Next.js để bắt các URL dạng cũ `/{oldCategorySlug}/{productSlug}` và chuyển hướng 301 về URL mới.

---

# XI. Out of Scope (Ngoài phạm vi)
- Không thay đổi cấu trúc danh mục của bài viết `posts` và dịch vụ `services` trừ khi có yêu cầu thêm từ phía khách hàng.
- Không cấu hình lại bộ lọc nâng cao (faceted search) trên trang danh sách sản phẩm trong phạm vi task này.
