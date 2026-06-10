## Audit Summary

### Observation
Từ research web + docs chính thức, các pattern mạnh nhất của SaaS/open-source websites không nằm ở “nhồi config SEO”, mà ở 5 nguyên lý lặp lại rất rõ:

1. **Google Search Essentials**: page muốn rank phải có nội dung indexable, HTTP 200, không bị `noindex`, không bị chặn crawl, canonical đúng, sitemap hỗ trợ discovery.
2. **Next.js / Vercel best practice**: SEO-critical pages nên render server-first hoặc static/ISR; không để core content phụ thuộc client fetch/loading shell.
3. **Ghost-style SEO philosophy**: canonical, sitemap, metadata, structured data nên là mặc định hệ thống; user chỉ override rất ít.
4. **Prisma product philosophy**: DX tốt = ít config, convention mạnh, một source of truth, abstraction rõ ràng, default an toàn, scale được.
5. **Top SaaS growth sites** thường thắng nhờ **content architecture + landing page system + internal linking + speed**, không phải chỉ vì technical SEO đơn thuần.

### Evidence từ nguồn nghiên cứu
- **Google Search Essentials / Technical Requirements**: Google nhấn mạnh indexable content, status code hợp lệ, crawlable links, canonical/noindex/sitemap đúng chuẩn là điều kiện nền.
- **Next.js docs (`generateMetadata`)**: metadata nên được sinh động ở server theo route/entity, không hard-code thủ công rải rác.
- **Next.js production checklist / Vercel SEO playbook**: ưu tiên SSG/ISR cho public pages evergreen, SSR cho data cần tươi, tránh CSR cho nội dung SEO-critical, tối ưu Core Web Vitals và caching.
- **Ghost SEO**: canonical, structured data, sitemap, metadata được build-in và auto trước; không đẩy gánh nặng cho editor phải “biết SEO kỹ thuật”.
- **Prisma llms.txt**: triết lý xoay quanh simplicity, performance, DX, giảm complexity, schema/contract rõ ràng.

### Inference
Nếu mục tiêu là: “website SaaS / sale system chạy Convex + Vercel free + `.vercel.app`, vẫn phải nhanh, động, mạnh, dễ scale, và muốn rank top cho mọi public page”, thì chiến lược tốt nhất **không phải** là thêm nhiều SEO settings thủ công hơn.

Chiến lược đúng là:
- **ít config hơn nhưng đúng hơn**, 
- **SEO engine động theo content/entity/module**,
- **public pages render server-first**,
- **content architecture theo search intent**,
- **mỗi page public phải có lý do tồn tại và lý do được index**.

Lưu ý quan trọng: `.vercel.app` vẫn có thể index, nhưng để lên top 1 bền vững thì domain riêng gần như luôn tốt hơn về trust/brand/CTR/linkability. Dùng `.vercel.app` không phải blocker tuyệt đối, nhưng là **handicap thương hiệu**.

## Root Cause Confidence
**High** — Search research + docs chính thức đều chỉ cùng một hướng: thắng SEO cho SaaS không đến từ “SEO config panel mạnh”, mà đến từ một kiến trúc kết hợp giữa:
1. render/crawlability đúng,
2. metadata/canonical/schema tự động và nhất quán,
3. content system theo intent,
4. site speed + cache strategy,
5. authority building.

### Root causes nếu chỉ bám cách làm cũ
1. **SEO bị xem như layer config**, không phải core architecture.
2. **Hard-code metadata theo page** làm khó scale và dễ lệch khi dữ liệu/module đổi.
3. **Client-first rendering** trên public pages làm Google thấy HTML nghèo hơn mức tối ưu.
4. **Thiếu landing architecture theo intent**: nếu chỉ có homepage + list + detail thì không đủ bề mặt ranking cho SaaS.
5. **Quá tin vào technical SEO**: technical tốt chỉ giúp “được index + hiểu đúng”; để top 1 còn cần content moat + internal links + authority.
6. **.vercel.app + free stack** vẫn chạy tốt, nhưng phải cực kỷ luật về performance và URL strategy vì không có nhiều margin hạ tầng.

## Strategic Proposal

## 1) North Star: SEO architecture đúng cho SaaS/open-source style
Em đề xuất website phải có 4 tầng rõ ràng:

### Tầng A — Core SEO platform
Đây là phần “hệ thống tự lo”, không yêu cầu admin chỉnh tay nhiều:
- dynamic metadata engine
- canonical policy
- robots policy
- sitemap policy
- structured data policy
- indexability policy
- image/OG fallback policy
- breadcrumb policy

Triết lý: giống Ghost + Prisma
- mặc định đúng
- override tối thiểu
- một source of truth
- không cho user phá contract bằng textarea raw robots/hreflang linh tinh

### Tầng B — Entity SEO
SEO sinh từ dữ liệu thật:
- product
- post
- service
- promotion
- category
- author / brand / comparison / use-case nếu có

Mỗi entity có fallback chain rõ ràng:
- title
- description
- hero image
- canonical
- schema type
- indexability

### Tầng C — Programmatic landing pages
Đây mới là máy tăng trưởng SEO mạnh nhất cho SaaS:
- `/features/[slug]`
- `/use-cases/[slug]`
- `/solutions/[industry]`
- `/compare/[competitor]`
- `/integrations/[tool]`
- `/templates/[template]`
- `/learn/[topic]`
- `/guides/[topic]`

Nếu site chỉ có `/products`, `/posts`, `/services`, thì chưa đủ “surface area” để cạnh tranh SEO SaaS mạnh.

### Tầng D — Authority/content moat
- blog/tutorials/case studies
- comparison pages
- glossary/docs/help center
- changelog / release notes / roadmap public
- founder/expert content / E-E-A-T signals

Đây là phần quyết định top 1 khó hay dễ.

## 2) Strategy cho stack Convex + Vercel free

### 2.1. Rendering strategy tối ưu nhất
Theo Vercel/Next.js best practice, public pages nên chia như sau:

#### SSG / ISR ưu tiên cho:
- homepage nếu nội dung không đổi từng giây
- feature pages
- use case pages
- comparison pages
- docs / guides / blog posts evergreen
- category pages
- landing pages theo intent

Lý do:
- HTML có sẵn ngay cho crawler
- nhanh hơn, cache tốt hơn
- hợp Vercel free hơn SSR nặng

#### SSR chỉ dùng cho:
- detail pages có dữ liệu thay đổi liên tục nhưng vẫn public
- search pages nếu public
- pages cần freshness ngắn

#### CSR chỉ dùng cho:
- dashboard
- account
- cart/checkout/wishlist
- filters tương tác phụ, không phải core content SEO

### 2.2. Rule sống còn cho free tier
Vì dùng Convex + Vercel free:
- public SEO pages phải **đọc ít query nhất có thể**
- tránh waterfall queries trong `generateMetadata`
- tránh fetch nhiều nguồn cho một page public
- ưu tiên precompute fields quan trọng ngay trên entity
- dùng cache/revalidate rõ ràng
- listing pages nên pagination hữu hạn, canonical sạch, không tạo crawl trap

### 2.3. `.vercel.app` có lên top được không?
Có thể index và có thể rank, nhưng:
- trust thấp hơn domain riêng
- brand recall kém hơn
- backlink tự nhiên khó hơn
- CTR trên SERP thường yếu hơn

Kết luận chiến lược:
- **ngắn hạn**: vẫn tối ưu full trên `.vercel.app`
- **trung hạn**: chuyển sang domain riêng càng sớm càng tốt
- **đừng kỳ vọng** “top 1 mọi từ khóa” chỉ bằng hạ tầng free + subdomain free nếu không có content moat và authority mạnh

## 3) Best-practice SEO engine structure cho project này

## 3.1. Nên giữ những settings nào
Chỉ giữ các global settings thật sự cần:
- `site_name`
- `site_url`
- `site_tagline`
- `site_logo`
- `site_favicon`
- `seo_title` (homepage/global fallback)
- `seo_description` (homepage/global fallback)
- `seo_keywords` (optional, không phải trọng tâm)
- `seo_og_image`
- contact/profile business thật: email, phone, address

## 3.2. Nên bỏ khỏi admin runtime SEO
- raw `robots.txt`
- raw `hreflang` nếu chưa có multilingual thật
- business type rời rạc nếu có thể derive
- opening hours / geo / price range dạng text SEO-only rời rạc
- bất kỳ field nào chỉ tồn tại để “điền cho có SEO” nhưng không map từ business data thật

Triết lý:
- dữ liệu business thật > SEO text config giả

## 3.3. Metadata engine chuẩn nhất
Tạo 1 contract trung tâm:
- `buildSeoContext(site, businessProfile, routeType, moduleState)`
- `buildEntityMetadata(entity, type, context)`
- `resolveIndexability(route, entity, moduleState)`
- `buildCanonicalUrl(baseUrl, path)`
- `buildOpenGraphImage(entity, fallback)`
- `buildJsonLd(entityType, entity, context)`

Tất cả route public chỉ gọi engine này.

## 4) Content architecture để thật sự đánh SEO SaaS mạnh

### 4.1. Không nhắm “mọi public page” như nhau
Google không rank mọi page ngang nhau. Phải phân tầng:

#### Tier 1: Money pages
- homepage
- features
- use cases
- solutions
- integrations
- pricing / service landing
- product category / flagship products

Đây là các trang phải đầu tư mạnh nhất.

#### Tier 2: Authority pages
- blog articles
- tutorials
- docs
- glossary
- case studies
- comparison pages

Đây là máy kéo traffic và internal links.

#### Tier 3: Utility pages
- contact
- stores
- about
- legal

Index được nhưng không phải trang để kỳ vọng top 1 keyword money.

### 4.2. SaaS/open-source winners thường làm gì
Pattern chung từ Prisma / Supabase / Ghost / Cal.com style:
- landing pages cực rõ intent
- docs + blog + changelog + product pages liên kết chặt
- mỗi page trả lời 1 intent cụ thể, không generic
- internal links có chủ đích
- copy ngắn, rõ, technical nhưng đọc nhanh
- site speed rất cao
- page templates reuse mạnh nhưng content angle riêng

### 4.3. Cấu trúc URL tốt nhất đề xuất
Nếu muốn scale lâu dài:
- `/features/[feature]`
- `/use-cases/[useCase]`
- `/solutions/[industry]`
- `/compare/[competitor]`
- `/integrations/[integration]`
- `/templates/[template]`
- `/blog/[slug]`
- `/guides/[slug]`
- `/docs/[slug]`
- `/products/[slug]`
- `/services/[slug]`

Mỗi hub page phải link xuống chi tiết, và mỗi detail phải link ngược hub + related pages.

## 5) Technical SEO policy cụ thể nhất

### 5.1. Indexability policy
- index: homepage, feature, use-case, comparison, integration, docs, guides, blog, public categories, public details
- noindex: cart, checkout, account, wishlist, internal search params, duplicate filtered pages không có intent riêng, admin/system

### 5.2. Canonical policy
- mỗi intent chỉ có 1 canonical URL
- filter/sort/pagination phải có rule rõ ràng
- không để nhiều URL cùng render cùng content mà đều indexable

### 5.3. Sitemap policy
- chỉ include canonical + indexable URLs
- absolute URLs
- chia sitemap nếu sau này nhiều URL
- listing/detail/category/content hubs đều phải cover nếu indexable

### 5.4. Structured data policy
- Organization / LocalBusiness ở site level
- WebSite ở site level
- Breadcrumb cho almost all public detail + hub pages
- Product cho product detail
- Article cho blog/guides/posts
- Service cho service detail
- FAQ schema chỉ khi FAQ visible thật
- không khai schema mà UI không hiển thị

### 5.5. Performance policy
Theo Vercel/Next.js best practice:
- server-first HTML cho SEO pages
- image tối ưu, kích thước đúng
- không để heavy client JS trên hero/content chính
- font/image/script tối ưu để giữ Core Web Vitals tốt
- tránh render-blocking và excessive client hydration

## 6) SEO content strategy thực chiến để lên top

### 6.1. Home không phải page duy nhất để rank
Homepage nên target brand + category head term rộng.
Top 1 thường đến từ cluster pages, không chỉ homepage.

### 6.2. Công thức cluster mạnh nhất
Mỗi “pillar” có 1 hub + nhiều supporting pages:

Ví dụ:
- Hub: `/features/seo-automation`
- Support:
  - `/guides/seo-automation-for-small-business`
  - `/compare/our-tool-vs-semrush`
  - `/templates/seo-audit-template`
  - `/blog/how-to-improve-technical-seo`

Hub nhận authority từ support pages.

### 6.3. Người thắng SEO SaaS không viết “blog cho có”
Họ tập trung vào 4 loại content thắng tiền:
- use case pages
- comparison pages
- integration pages
- bottom/mid-funnel guides

### 6.4. E-E-A-T cho SaaS/open-source
Phải có:
- tác giả rõ ràng
- công ty rõ ràng
- changelog / release cadence
- docs đúng và cập nhật
- case study / examples thật
- screenshots / product proof
- external mentions / backlinks

## 7) Reality check: “top 1 Google với mọi public page”
Đây là mục tiêu quá tuyệt đối. Theo Google docs và thực tế SaaS SEO:
- technical SEO chỉ giúp đủ điều kiện cạnh tranh
- top 1 phụ thuộc keyword difficulty, authority, intent fit, CTR, backlinks, brand, freshness
- không có kiến trúc nào đảm bảo top 1 mọi page/mọi query

Mục tiêu thực tế nhưng mạnh:
1. mọi public page quan trọng được crawl + index đúng,
2. site cực nhanh,
3. metadata/schema/canonical không lỗi,
4. có landing architecture đủ rộng,
5. content clusters bám intent,
6. authority tăng dần.

## 8) Kiến trúc tốt nhất em recommend cho dự án của anh

### Option duy nhất em recommend
**Dynamic SEO Platform + Programmatic SaaS Landing Architecture**

#### Phần kỹ thuật
- 1 SEO engine trung tâm
- server-rendered public pages
- ISR/SSG wherever possible
- minimal settings, convention-first
- sitemap/robots/schema auto-generated
- entity-driven metadata
- internal linking engine theo related content/entity/category

#### Phần content
- homepage
- feature hubs
- use-case hubs
- compare pages
- integration pages
- guides/blog/docs
- category/detail pages

#### Phần growth
- Search Console + Bing Webmaster + analytics
- đo index coverage, CTR, non-brand impressions
- iterate theo query data thật

## 9) Implementation structure em sẽ đề xuất nếu anh muốn làm tiếp

### Phase 1 — Technical foundation
- dọn toàn bộ SEO config dư thừa
- tạo SEO engine trung tâm
- chuẩn hóa metadata/canonical/robots/sitemap/schema
- chuyển homepage/public critical pages sang server-first

### Phase 2 — Public information architecture
- thêm content types/hubs: features/use-cases/compare/integrations/guides
- chuẩn hóa route templates và internal linking

### Phase 3 — Programmatic SEO engine
- derive title/description from entity taxonomy + intent templates
- build related pages / cluster linking
- auto breadcrumbs / auto schema / auto canonicals

### Phase 4 — Authority layer
- authors
- changelog
- docs/help
- case studies
- trust pages

### Phase 5 — Measurement loop
- Search Console workflow
- track indexed vs excluded
- CTR by template type
- CWV by template type
- landing page expansion based on query data

## Verification Plan
- Verify theo nguồn chính thức:
  1. Google Search Essentials compliance
  2. Next.js metadata/file-based SEO assets compliance
  3. Vercel rendering/caching/CWV best practices
- Verify kiến trúc mục tiêu:
  1. Public pages server-first hoặc ISR/SSG
  2. Không còn raw SEO controls dễ phá contract
  3. Mỗi public page có 1 canonical + 1 intent chính
  4. Có roadmap landing pages theo search intent
  5. Content clusters + internal linking rõ ràng
- Verify thực chiến sau triển khai:
  1. index coverage
  2. impressions growth
  3. CTR growth
  4. CWV ổn định
  5. số landing pages ranking top 10/top 3

Nếu anh muốn, bước tiếp theo em sẽ chuyển research này thành **blueprint cực cụ thể cho chính repo của anh**: route map nào cần thêm, content types nào cần tạo trong Convex, template SEO engine nào nên dùng, và mô hình tốt nhất để scale trên Vercel free mà vẫn mạnh SEO.