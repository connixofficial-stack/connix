## Audit Summary

### Observation
- Các route public quan trọng đang bị `noindex` dù là trang cần rank:
  - `app/(site)/products/layout.tsx:20`
  - `app/(site)/products/[slug]/layout.tsx:23`
  - `app/(site)/posts/layout.tsx:20`
  - `app/(site)/posts/[slug]/layout.tsx:22`
  - `app/(site)/services/layout.tsx:20`
  - `app/(site)/services/[slug]/layout.tsx:22`
  - `app/(site)/promotions/layout.tsx:20`
- Metadata public đang bị hard-code rải rác theo từng layout (`title = 'Sản phẩm'`, `description = ...`) thay vì đi theo 1 contract SEO động thống nhất.
- Homepage render nội dung chính bằng client query: `app/(site)/_components/HomePageClient.tsx` dùng `useQuery(api.homeComponents.listActive)`, làm HTML ban đầu có nguy cơ nghèo nội dung hơn mức lý tưởng cho crawl/discovery.
- Settings/admin đang có dấu hiệu “nửa bỏ nửa giữ” với SEO fields:
  - `app/admin/settings/page.tsx` có `REMOVED_SEO_KEYS` để tự xóa `seo_robots`, `seo_business_type`, `seo_opening_hours`, `seo_price_range`, `seo_geo_lat`, `seo_geo_lng`, `seo_hreflang`.
  - nhưng `lib/get-settings.ts`, `app/robots.ts`, `app/(site)/layout.tsx`, `SeedWizardDialog`, `system/seo/page.tsx` vẫn còn phụ thuộc các key này.
- `app/system/seo/page.tsx` cho phép sửa raw `robots.txt` thủ công. Đây là quyền quá mạnh và dễ tạo misconfiguration SEO ở môi trường sale site.
- Seed/default settings vẫn hard-code brand demo kiểu `VietAdmin` trong `convex/seed.ts`, `convex/seeders/settings.seeder.ts`, và fallback ở `lib/get-settings.ts`.
- Structured data có nền nhưng chưa đúng tinh thần “sale SEO mạnh”:
  - `generateProductSchema` chưa ưu tiên `salePrice`.
  - `generateArticleSchema` chưa tận dụng `authorName` hiện có.
  - `generateWebsiteSchema` khai báo `SearchAction` tới `/search`, nhưng audit hiện tại chưa thấy route public tương ứng.

### Inference
Vấn đề không chỉ là vài meta tags sai, mà là kiến trúc SEO hiện tại đang:
1. tự chặn index ở money pages,
2. phụ thuộc nhiều vào cấu hình tay/hard-code theo route,
3. lẫn lộn giữa SEO runtime cho site bán hàng và công cụ cấu hình cho dev/admin,
4. chưa dùng dữ liệu module/content như nguồn sự thật duy nhất cho metadata/schema/indexability.

Nếu mục tiêu là “sale system thực sự mạnh, SEO càng mạnh càng tốt, dữ liệu động thay vì thêm tay”, thì cần refactor từ kiểu SEO rời rạc sang **SEO engine động theo entity/module**, không chỉ vá từng file.

## Root Cause Confidence
**High** — Có evidence trực tiếp trong code cho cả 3 lớp nguyên nhân:
1. blocker index rõ ràng (`noindex` trên public pages),
2. hard-code metadata phân tán,
3. admin/system vẫn giữ các entry SEO thủ công có thể phá contract động.

### 5/8 câu root-cause bắt buộc
1. **Triệu chứng**: site đã “setup SEO” nhưng khó lên top; expected là public pages được crawl/index/rank, actual là nhiều trang public đang noindex và metadata thiếu tính động.
2. **Phạm vi ảnh hưởng**: homepage, listings, detail pages, settings/admin/system SEO flows.
3. **Tái hiện ổn định**: có, chỉ cần đọc metadata code ở các route public là thấy `index:false`.
4. **Mốc thay đổi gần nhất**: chưa xác định commit gây lỗi đầu tiên, nhưng evidence hiện tại đủ mạnh để kết luận blocker hiện hữu.
5. **Thiếu dữ liệu**: chưa biết production data thực tế có đủ content chất lượng hay chưa.
6. **Giả thuyết thay thế chưa loại trừ**: content mỏng/chưa có backlink cũng có thể làm rank kém, nhưng không phủ định blocker kỹ thuật hiện tại.
7. **Rủi ro nếu fix sai nguyên nhân**: chỉ tối ưu title/description mà giữ kiến trúc cũ thì site vẫn khó index ổn định.
8. **Pass/fail**: mọi public URL indexable phải sinh metadata động đúng, admin/dev SEO dư thừa bị loại bỏ, sitemap/schema/canonical đồng bộ theo dữ liệu thật.

## Proposal

### Mục tiêu kiến trúc
Chuyển từ SEO “khai báo tay theo trang + admin cấu hình rời rạc” sang **SEO động theo domain data**:
- SEO lấy từ `site settings + entity data + module state + route type`.
- Không cho admin/dev chỉnh những thứ dễ làm sai hệ thống như raw robots rules ở mức text free-form.
- Không hard-code title/description cho sale pages nếu có thể sinh từ module/entity.
- Một nguồn sự thật duy nhất cho indexability/canonical/schema.

## Kiến trúc triển khai đề xuất

### Phase 1 — Dọn blocker và định nghĩa SEO contract trung tâm
Tạo 1 lớp helper SEO trung tâm, ví dụ trong `lib/seo/`:
- `resolveBaseSeoContext()`
- `buildPageMetadata()`
- `buildEntityMetadata()`
- `resolveIndexability()`
- `buildCanonicalUrl()`
- `buildSeoImage()`
- `buildAlternates()`

Contract đầu vào:
- site settings (`site_name`, `site_url`, logo, ngôn ngữ)
- global SEO settings tối thiểu còn giữ lại
- module state (enabled/disabled)
- route type (`home`, `listing`, `detail`, `utility`, `private`)
- entity data (`product`, `post`, `service`, `promotion`)

Contract đầu ra:
- `title`
- `description`
- `canonical`
- `robots`
- `openGraph`
- `twitter`
- `keywords` nếu thật sự có dữ liệu meaningful
- flags để gắn schema phù hợp

Mục đích:
- xóa logic SEO trùng lặp ở các `generateMetadata()` đang bị copy-paste.
- đảm bảo mọi public page follow cùng rule.

### Phase 2 — Loại bỏ SEO hard-code dư thừa ở admin/system
#### 2.1. Gỡ SEO cấu hình kiểu dev/admin dễ gây hại
Loại bỏ hoặc vô hiệu hóa dứt điểm các cấu hình không nên cho user/dev chỉnh tay ở sale system:
- `seo_robots` raw text editor: `app/system/seo/page.tsx`, `app/robots.ts`
- các key SEO đã bị xem là removed nhưng còn phụ thuộc chéo:
  - `seo_robots`
  - `seo_hreflang` nếu chưa có i18n thật
  - `seo_business_type`, `seo_opening_hours`, `seo_price_range`, `seo_geo_lat`, `seo_geo_lng` theo cách nhập tay rời rạc

#### 2.2. Chuyển sang dữ liệu động / dữ liệu business thật
- `business_type` nên lấy từ loại site/module/site profile nếu có; nếu chưa có thì default an toàn ở code, không expose field rời rạc.
- `geo/address/openingHours/phone` lấy từ contact/site profile thay vì SEO settings riêng.
- `hreflang` chỉ bật khi hệ thống có multi-locale thật; nếu chưa có thì bỏ khỏi contract để tránh khai báo giả.
- `robots.txt` nên là generated policy, không phải textarea cho admin.

### Phase 3 — Chuẩn hóa theo mô hình “entity-driven SEO”
#### 3.1. Product
Nguồn dữ liệu SEO ưu tiên:
1. `product.metaTitle`
2. `product.name`
3. fallback pattern từ category/site

Description ưu tiên:
1. `product.metaDescription`
2. stripped short description từ product
3. fallback từ category/site

Image ưu tiên:
1. product cover/main image
2. image đầu tiên trong gallery
3. global og image

Schema:
- Product schema dùng giá bán thực tế, ưu tiên `salePrice` khi có.
- stock/availability theo data thật.
- thêm brand/siteName nhất quán.

#### 3.2. Post
- title/description lấy từ `metaTitle/metaDescription/excerpt/title` theo fallback chain.
- article schema nên có `authorName`, `datePublished`, `image`, breadcrumb.
- listing pages không dùng mô tả generic nghèo nàn nếu có thể sinh từ category/top content/site tone.

#### 3.3. Service
- giống product nhưng schema là `Service`.
- provider info kéo từ site/contact profile, không nhập SEO tay riêng.

#### 3.4. Promotion
- hiện còn hard-code copy kiểu “Săn deal hot, giảm giá sốc”.
- nên sinh description từ active promotions count, brand name, hoặc summary data nếu có.
- nếu module promotions không có detail pages thì listing metadata vẫn phải data-driven ở mức module/site context.

### Phase 4 — Refactor public route metadata để dùng engine chung
Refactor các file:
- `app/(site)/layout.tsx`
- `app/(site)/page.tsx`
- `app/(site)/products/layout.tsx`
- `app/(site)/products/[slug]/layout.tsx`
- `app/(site)/posts/layout.tsx`
- `app/(site)/posts/[slug]/layout.tsx`
- `app/(site)/services/layout.tsx`
- `app/(site)/services/[slug]/layout.tsx`
- `app/(site)/promotions/layout.tsx`
- `app/(site)/contact/layout.tsx`
- `app/(site)/stores/layout.tsx`
- giữ noindex cho `cart`, `checkout`, `account`, `wishlist`

Nguyên tắc:
- route public hợp lệ: `index:true, follow:true`
- route private/transactional: `index:false, follow:false`
- module disabled hoặc entity missing: noindex + title/description fallback đúng ngữ cảnh
- bỏ hard-code text lặp khi có thể derive từ data/module

### Phase 5 — Homepage phải crawl-friendly hơn
Hiện trạng: `HomePageClient` fetch client-side.

Kế hoạch:
- chuyển fetch home components active sang server side nếu query path hiện có cho phép dùng trong server component.
- nếu chưa có helper server-friendly, tạo query/helper phù hợp để homepage render HTML có nội dung thực ngay từ đầu.
- giữ client behavior chỉ cho phần tương tác cần thiết.

Mục tiêu SEO:
- homepage source có nội dung meaningful cho crawler.
- giảm phụ thuộc vào loading shell cho route quan trọng nhất.

### Phase 6 — Structured data mạnh nhưng đúng dữ liệu thật
Refactor `components/seo/JsonLd.tsx` và callers:
- bỏ `SearchAction` nếu chưa có `/search` thật.
- article schema có author/publisher/image/datePublished đầy đủ hơn.
- product schema dùng effective price.
- local business schema lấy từ contact/site profile thật, không từ SEO textbox riêng.
- breadcrumb/item list giữ nhưng bảo đảm chỉ dùng absolute URLs.

Nếu có thể trong scope nhỏ, gom schema builders vào 1 contract thống nhất theo entity type để tránh route nào cũng tự lắp JSON-LD thủ công.

### Phase 7 — Sitemap và robots phải sinh tự động theo index contract
#### robots
- bỏ editor raw `robots.txt` ở `system/seo`.
- `app/robots.ts` sinh từ policy cố định an toàn:
  - allow public pages
  - disallow admin/system/api/private flows cần chặn
- không để con người nhập tay rule có thể phá index toàn site.

#### sitemap
- `app/sitemap.ts` cần phản ánh đúng những URL:
  - public
  - canonical
  - indexable
  - tồn tại thật
- review coverage cho các listing/detail pages hiện có.
- không include route private/noindex.

### Phase 8 — Làm sạch “SEO demo / VietAdmin defaults” để không rò sang sale site
Cần rà soát và giảm hard-coded demo fallback ở:
- `convex/seed.ts`
- `convex/seeders/settings.seeder.ts`
- `lib/get-settings.ts`
- chỗ nào fallback ra `VietAdmin`

Mục tiêu:
- fallback nên trung tính/an toàn, không tạo metadata demo cho site bán hàng thật.
- seed vẫn có thể tồn tại cho dev, nhưng runtime SEO không nên phụ thuộc brand demo.

## File-level Implementation Plan

### A. Tạo SEO engine chung
Dự kiến thêm/refactor trong:
- `lib/seo.ts` hoặc tách mới dưới `lib/seo/*`
- helper build metadata/indexability/entity fallbacks

### B. Dọn settings contract
Dự kiến sửa:
- `lib/get-settings.ts`
- `lib/modules/configs/settings.config.ts`
- `app/admin/settings/page.tsx`
- `app/system/seo/page.tsx`
- `app/robots.ts`
- `components/modules/ModuleConfigPage.tsx`
- `components/data/SeedWizardDialog.tsx`

Mục tiêu:
- bỏ SEO keys dư thừa/hard-code không còn dùng.
- thống nhất settings còn giữ lại chỉ là những trường cần thiết, ít nhưng mạnh.

### C. Refactor route metadata
Dự kiến sửa toàn bộ route public metadata như list ở Phase 4 để dùng helper chung.

### D. Refactor homepage SEO render
Dự kiến sửa:
- `app/(site)/page.tsx`
- `app/(site)/_components/HomePageClient.tsx`
- helper/query liên quan nếu cần

### E. Refactor schema/sitemap
Dự kiến sửa:
- `components/seo/JsonLd.tsx`
- `app/sitemap.ts`

## Counter-hypothesis
- **Chỉ cần sửa noindex là đủ** — Confidence Low. Sửa noindex là bắt buộc nhưng chưa đủ cho mục tiêu “SEO càng mạnh càng tốt, dữ liệu động thay vì cứng nhắc”.
- **Giữ admin SEO editor để linh hoạt hơn** — Confidence Low. Với sale system, raw SEO controls kiểu robots/free-form dễ gây lỗi hơn lợi ích nếu chưa có governance mạnh.
- **Giữ hard-code route-level copy để nhanh** — Confidence Low. Nhanh trước mắt nhưng làm hệ thống SEO khó scale, khó đồng bộ, khó maintain khi module/dữ liệu đổi.

## Verification Plan
- Typecheck: `bunx tsc --noEmit`
- Static verification theo checklist:
  1. Không còn public route quan trọng nào `noindex` sai.
  2. Route private/transactional vẫn noindex đúng.
  3. Không còn raw robots editor trong flow runtime SEO chính.
  4. SEO settings/admin chỉ còn các field thật sự cần cho sale site.
  5. Metadata của products/posts/services/promotions lấy từ contract động thay vì hard-code phân tán.
  6. Homepage có HTML đầu ra crawl-friendly hơn.
  7. JSON-LD không còn mismatch rõ ràng với route/data thật.
  8. Sitemap chỉ chứa URL public canonical indexable.
- Repro manual để tester xác nhận trên các URL:
  - `/`
  - `/products`, `/products/[slug]`
  - `/posts`, `/posts/[slug]`
  - `/services`, `/services/[slug]`
  - `/promotions`
  - kiểm tra source metadata, canonical, robots, schema

## Recommendation
Em recommend triển khai theo đúng plan kiến trúc ở trên, không vá lẻ. Vì evidence cho thấy vấn đề là **structural SEO debt** chứ không chỉ vài bug. Nếu anh duyệt, em sẽ thực thi theo hướng:
1. gỡ blocker index,
2. dọn contract SEO settings,
3. xây SEO engine động,
4. refactor route metadata + schema + sitemap,
5. commit local hoàn chỉnh.