# I. Primer

## 1. TL;DR kiểu Feynman
* Hệ thống hiển thị hình ảnh đại diện (Open Graph Image - `og_image`) khi chia sẻ liên kết lên mạng xã hội đang bị lỗi hiển thị logo nhỏ của trang web thay vì ảnh Open Graph động tuyệt đẹp.
* Điều này xảy ra do hệ thống tự động fallback về `site.site_logo` khi không tìm thấy ảnh đại diện của bài viết/sản phẩm hay ảnh cấu hình SEO tổng thể.
* Chúng tôi sẽ loại bỏ fallback `site_logo` ở hai hàm cốt lõi (`resolveSeoImage` và `buildSeoContext`).
* Sau khi sửa, nếu bài viết/sản phẩm có ảnh đại diện (thumbnail/image) thì sẽ dùng ảnh đó; còn lại sẽ dùng ảnh cấu hình SEO chung của website (`seo_og_image`).
* Nếu cả hai đều trống, hệ thống Next.js sẽ tự động fallback về ảnh Open Graph động cực đẹp được vẽ bởi file `app/opengraph-image.tsx`.

## 2. Elaboration & Self-Explanation
Trong các phiên bản trước, khi xây dựng siêu dữ liệu SEO (SEO Metadata), các nhà phát triển đã đặt chính sách ưu tiên ảnh Open Graph như sau:
1. Ảnh đại diện chi tiết của thực thể (Sản phẩm, Bài viết, Dịch vụ...).
2. Ảnh Open Graph cấu hình trong cài đặt SEO của trang quản trị (`admin/setting/seo`).
3. Logo của trang web (`site_logo`).

Tuy nhiên, logo trang web (`site_logo`) thường có kích thước rất nhỏ, dạng hình vuông hoặc PNG trong suốt, không đạt chuẩn tỷ lệ vàng của Open Graph (1200x630 pixel). Khi chia sẻ link lên Facebook hay Zalo, ảnh sẽ bị vỡ, méo hoặc mất hình.
Bên cạnh đó, Next.js có cơ chế tự động: nếu metadata không chỉ định rõ `openGraph.images`, Next.js sẽ quét và sử dụng file ảnh đại diện mặc định là `app/opengraph-image.tsx` ở thư mục gốc. File này tạo ra một bức ảnh có hình nền màu chủ đạo của thương hiệu (Brand Color) kèm theo Tiêu đề và Mô tả trang được định dạng rất chuyên nghiệp.
Do hệ thống cũ tự động gán `site.site_logo` làm ảnh dự phòng nên Next.js đã bỏ qua file `app/opengraph-image.tsx`, làm giảm tính thẩm mỹ của trang web khi chia sẻ.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế:** Khi chia sẻ một bài viết chi tiết không có ảnh đại diện, hoặc chia sẻ trang chủ khi admin chưa cấu hình ảnh SEO, thay vì hiển thị một banner đẹp mắt có dòng chữ "Dohy - Giải pháp chăm sóc sức khỏe" trên nền xanh dương thương hiệu, nó lại hiển thị một cái logo nhỏ xíu bị kéo giãn méo mó.
* **Hình ảnh ẩn dụ:** Việc này giống như khi bạn gửi một tấm thiệp chúc mừng. Nếu bạn không chọn ảnh nền cho thiệp, dịch vụ gửi thiệp sẽ vẽ một hình nền thiệp rất đẹp cho bạn. Nhưng vì hệ thống thấy bạn có cái "ảnh thẻ" (logo trang) trong hồ sơ, nó tự động dán cái ảnh thẻ nhỏ xíu đó lên giữa tấm thiệp và gửi đi, trông rất buồn cười. Việc cần làm là không dán ảnh thẻ nữa, để hệ thống tự vẽ nền thiệp.

# II. Audit Summary (Tóm tắt kiểm tra)
* **Các route hiện tại:**
  * Route trang chủ: `/` (kế thừa từ `app/(site)/layout.tsx`)
  * Route tĩnh: `/contact`, `/about`...
  * Route danh sách: `/products`, `/posts`, `/services`, `/khoa-hoc`, `/projects`, `/resources`
  * Route chi tiết: `/[categorySlug]/[recordSlug]` (unified route), và các route cũ `/[module]/[slug]` (sản phẩm, bài viết...).
* **Hiện trạng cấu hình og_image:**
  * Tất cả các trang đều dùng `buildSeoMetadata` hoặc `buildMetadata` (legacy).
  * Các hàm này resolve ảnh qua `resolveSeoImage` (`lib/seo/resolver.ts`) và `buildSeoContext` (`lib/seo/metadata.ts`).
  * Cả hai nơi đều đang fallback về `site.site_logo` khiến Next.js không kích hoạt được `app/opengraph-image.tsx`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc (Root Cause):** Dòng code `return params.site.site_logo || '';` ở cuối hàm `resolveSeoImage` và `seo.seo_og_image || site.site_logo || ''` ở hàm `buildSeoContext` ép buộc trả về URL logo của trang web làm ảnh Open Graph chính thức. Điều này chặn Next.js kích hoạt file fallback ảnh động `app/opengraph-image.tsx`.
* **Giả thuyết đối chứng (Counter-Hypothesis):** Nếu loại bỏ `site.site_logo` khỏi các hàm giải quyết ảnh này, khi không có ảnh chi tiết của sản phẩm/bài viết và không cấu hình ảnh SEO chung, metadata sẽ trả về `images: undefined`. Next.js sẽ tự động gọi file `app/opengraph-image.tsx` động, tạo ra một ảnh Open Graph có Title/Description và background là Brand Color. Nếu có ảnh chi tiết hoặc ảnh SEO chung, chúng vẫn sẽ được hiển thị bình thường.

# IV. Proposal (Đề xuất)
* **Thay đổi 1:** Loại bỏ `params.site.site_logo` ở cuối hàm `resolveSeoImage` trong [resolver.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/seo/resolver.ts), trả về chuỗi rỗng `''`.
* **Thay đổi 2:** Loại bỏ `site.site_logo` ở hàm `buildSeoContext` trong [metadata.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/seo/metadata.ts), chỉ sử dụng `seo.seo_og_image || ''`.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [resolver.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/seo/resolver.ts)
  * Vai trò hiện tại: Cung cấp các hàm giải quyết dữ liệu SEO (Seo Resolver).
  * Thay đổi: Sửa hàm `resolveSeoImage` để bỏ fallback `site.site_logo` và trả về `''` khi không có ảnh.
* **Sửa:** [metadata.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/seo/metadata.ts)
  * Vai trò hiện tại: Định nghĩa và tạo các đối tượng Metadata cho Next.js.
  * Thay đổi: Sửa hàm `buildSeoContext` (dùng cho các route legacy gọi `buildMetadata`) để loại bỏ fallback `site.site_logo` cho `image`.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa [resolver.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/seo/resolver.ts).
2. Đọc và chỉnh sửa [metadata.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/seo/metadata.ts).
3. Thực hiện kiểm tra static typecheck thông qua `bunx tsc --noEmit`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Typecheck:** Chạy lệnh `bunx tsc --noEmit` để đảm bảo code không phát sinh lỗi compile TypeScript.
* **Kiểm tra logic:** Rà soát lại code để đảm bảo khi không có ảnh, hàm trả về chuỗi rỗng `''` và Next.js sẽ coi đó là `undefined`, kích hoạt cơ chế fallback về `app/opengraph-image.tsx`.

# VIII. Todo
- [ ] Sửa hàm `resolveSeoImage` trong `lib/seo/resolver.ts`.
- [ ] Sửa hàm `buildSeoContext` trong `lib/seo/metadata.ts`.
- [ ] Kiểm tra typecheck toàn dự án.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Hàm `resolveSeoImage` trả về ảnh đại diện của thực thể nếu có.
* Nếu thực thể không có ảnh, hoặc là trang tĩnh/trang danh sách, trả về `seo.seo_og_image`.
* Nếu `seo.seo_og_image` cũng trống, trả về chuỗi rỗng `''` thay vì `site.site_logo` để Next.js tự động dùng file ảnh động `app/opengraph-image.tsx`.
* Hàm `buildSeoContext` cũng hoạt động tương tự cho các trang legacy.
* Dự án biên dịch thành công mà không phát sinh lỗi TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Cực kỳ thấp vì đây chỉ là thay đổi logic fallback hiển thị ảnh của metadata, không ảnh hưởng đến bất kỳ luồng nghiệp vụ (Business Logic) hay cơ sở dữ liệu nào.
* **Hoàn tác (Rollback):** Sử dụng Git checkout hoặc phục hồi lại phiên bản cũ của hai file đã chỉnh sửa.

# XI. Out of Scope (Ngoài phạm vi)
* Không chỉnh sửa cấu trúc của file `app/opengraph-image.tsx`.
* Không thay đổi schema cơ sở dữ liệu Convex.
