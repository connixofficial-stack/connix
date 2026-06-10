## Audit Summary

### Observation
- User đã chọn **Option A** và bổ sung yêu cầu rất rõ:
  1. `/system/seo` phải cực tiện.
  2. Mọi check nên kiểm được **trạng thái hệ thống thật**.
  3. Phải có **link mở nhanh** để sửa nhanh.
  4. Với bước ngoài hệ thống phải có **hướng dẫn rõ + link mở sẵn + best practice**.
  5. UX phải “đến con bò cũng hiểu”, tránh jargon.
- Hiện tại `/system/seo` mới chỉ là overview kỹ thuật mỏng (`app/system/seo/page.tsx`) và `SeoHealthPanel` chỉ check field presence cơ bản (`components/seo/SeoHealthPanel.tsx`).
- Core đã có sẵn nền SEO đủ mạnh để build checklist thực dụng:
  - metadata: `lib/seo/metadata.ts`
  - schema: `lib/seo/schema-policy.ts`
  - sitemap: `app/sitemap.ts`
  - robots: `app/robots.ts`
  - llms.txt foundation: `lib/seo/llms.ts`, `app/llms.txt/route.ts`
  - content modules / settings / contacts / socials đều có data source sẵn.
- Web research 2026 xác nhận checklist thực dụng nên bám vào:
  - Google Search Central: sitemap, canonical, crawling/indexing, robots meta, structured data guidelines.
  - Bing Webmaster + IndexNow: đẩy URL mới/cập nhật nhanh hơn, đặc biệt hữu ích cho content freshness.
  - Các checklist kỹ thuật 2026 ngoài ngành đều hội tụ vào crawlability, indexability, schema, structured internal links, JS rendering, CWV.

### Inference
- Checklist hiệu quả không phải là list “check cho có”, mà phải trả lời 4 câu hỏi cho mỗi site:
  1. Bot có crawl được không?
  2. Bot có hiểu URL nào nên index không?
  3. Bot có đủ tín hiệu để tin và hiểu thực thể site/business/content không?
  4. Người vận hành có biết bước tiếp theo trong 10 giây không?
- Vì user muốn ít phụ thuộc ngoài, checklist nên chia 2 tầng rõ ràng:
  - **Core-controlled**: những gì SaaS tự kiểm và tự sửa được.
  - **External boost**: những gì cần Google/Bing, nhưng phải có nút mở nhanh + hướng dẫn 1-2-3.
- `/system/seo` nên đóng vai trò như một **trung tâm điều phối SEO vận hành**, không chỉ là trang settings.

## Root Cause Confidence

**High** — vì hiện trạng thiếu chính lớp “operating UX” để biến hạ tầng SEO sẵn có thành hành động cụ thể, nhanh, dễ hiểu.

### Root cause chính
1. Thiếu checklist gắn với **trạng thái thực của website**, content và settings.
2. Thiếu action links/quick fix paths ngay trong UI.
3. Thiếu phân biệt giữa lỗi trong core và bước ngoài hệ thống.
4. Thiếu UX copy thực dụng: vì sao lỗi này làm chậm index, sửa ở đâu, sửa thế nào.

### Counter-hypothesis
- “Chỉ cần thêm nhiều check hơn là xong”: **Low confidence**. Nếu chỉ tăng số lượng check mà không có ưu tiên, giải thích và quick action thì lại thành “check cho vui”.

## Proposal

### Option A (Recommend, đã chọn) — `/system/seo` thành SEO Checklist Center thực dụng, action-first
**Confidence 95%** vì khớp đúng yêu cầu của user và tận dụng tối đa core hiện có.

---

## Thiết kế sản phẩm đề xuất

### 1) `/system/seo` thành 5 khu vực rõ ràng
File chính: `app/system/seo/page.tsx`

#### Khu vực A. SEO Command Bar
Thanh hành động đầu trang, luôn nhìn thấy.

Gồm các nút nhanh:
- Mở homepage public
- Mở `robots.txt`
- Mở `sitemap.xml`
- Mở `llms.txt`
- Mở Settings site/contact/social/seo liên quan
- Mở danh sách Posts / Products / Services / Landing Pages
- Copy domain / copy sitemap URL

Mục tiêu: giảm thao tác tìm đường.

#### Khu vực B. Critical First
Card top-level chỉ hiển thị 3-7 việc quan trọng nhất cần làm ngay.

Ví dụ:
- Thiếu Site URL → Fix ngay
- Sitemap đang chứa 12 hub rỗng → dọn ngay
- Thiếu contact info nên chưa phát LocalBusiness mạnh
- Không có enough published content cho module Products

Mỗi card có đúng 3 dòng:
1. Vấn đề gì
2. Vì sao ảnh hưởng index
3. Nút sửa ngay

#### Khu vực C. Checklist Tabs
5 tab:
1. Crawl & Index
2. Trust & Entity
3. Content & Links
4. Speed & Rendering
5. External Boost

#### Khu vực D. Quick Wins Today
Section riêng gợi ý 3-5 việc có impact cao / effort thấp.
Ví dụ:
- Điền `site_url`
- Điền `seo_description`
- Publish 3 sản phẩm đầu tiên
- Bật internal links từ homepage đến products
- Submit sitemap sang Bing/IndexNow

#### Khu vực E. Guided Actions
Với mỗi bước ngoài hệ thống, có mini tutorial kiểu:
- Bước 1: mở link này
- Bước 2: chọn mục này
- Bước 3: dán URL này
- Bước 4: bấm nút này

Viết cực ngắn, cực dễ làm.

---

## 2) Checklist engine: không check cho vui, chỉ check thứ có thể hành động
Tạo engine mới, ví dụ:
- `lib/seo/checklist.ts`
- hoặc `lib/seo/health-checks.ts`

### Data model mỗi checklist item
- `id`
- `category`
- `severity`: `critical | high | medium | low`
- `status`: `pass | warning | fail | info`
- `title`
- `whyItMatters`
- `howToFix`
- `quickActions[]`
- `learnMoreUrl?`
- `sourceEvidence[]`
- `isExternal`
- `autoCheck`

### Quy tắc chỉ giữ item nếu:
- có thể auto-check bằng data thật, hoặc
- có hướng dẫn thao tác cụ thể.

Không đưa các item mơ hồ kiểu “tăng authority” nếu chưa biết user phải làm gì tiếp.

---

## 3) Checklist chi tiết theo tab

### Tab 1 — Crawl & Index
Mục tiêu: bot crawl đúng, index đúng, không loãng.

#### Nhóm check cốt lõi
1. Site URL hợp lệ
2. `robots.txt` hoạt động
3. `sitemap.xml` hoạt động
4. Canonical đúng domain
5. Metadata base đúng domain
6. Public routes không bị noindex/disallow nhầm
7. Admin/system/private routes bị chặn đúng
8. Sitemap chỉ chứa URL indexable
9. Sitemap không chứa hub rỗng hoặc URL 404
10. Homepage có thể render text meaningful từ server

#### Quick actions
- Mở `robots.txt`
- Mở `sitemap.xml`
- Mở route public mẫu
- Mở settings site/seo

#### Best-practice note (theo Google docs)
- Chỉ đưa vào sitemap những URL bot fetch được và muốn index.
- Canonical phải nhất quán, không tự đá nhau.
- Robots không dùng để “giấu” URL mà vẫn muốn index.

---

### Tab 2 — Trust & Entity
Mục tiêu: search engine hiểu site là gì, của ai, đáng tin đến đâu.

#### Check
1. Site name có chưa
2. Tagline/description có chưa
3. Logo/OG image có chưa
4. Phone/email/address có chưa
5. Tax ID nếu có
6. Social links hợp lệ
7. Schema đang phát là Organization hay LocalBusiness
8. SameAs coverage có đủ chưa
9. Nếu seed hỗ trợ: opening hours, geo, price range, business type

#### Quick actions
- Mở settings contact
- Mở settings social
- Mở settings SEO

#### UX copy mẫu
- “Thiếu địa chỉ nên máy tìm kiếm khó hiểu đây là doanh nghiệp địa phương thật.”
- “Có Facebook và YouTube nhưng chưa nối vào schema, làm yếu tín hiệu thực thể thương hiệu.”

---

### Tab 3 — Content & Links
Mục tiêu: tránh site đẹp mà rỗng.

#### Check
1. Có đủ content published tối thiểu theo archetype không
2. Homepage có link tới money pages không
3. List pages có link xuống detail pages không
4. Detail pages có related/internal links không
5. Post/Product/Service có title + description usable không
6. Slug sạch không
7. Có cụm content orphan không
8. Landing pages có content thực hay chỉ shell
9. Hub pages trong sitemap có support content bên dưới không

#### Tùy archetype
- Ecommerce: products count, product image/price/schema
- Service business: services count, FAQs, provider info
- Content/publisher: posts count, published dates, related posts
- Local business: contact/about/location pages có đủ chưa

#### Quick actions
- Mở /admin/posts
- Mở /admin/products
- Mở /admin/services
- Mở /system/seo/landing-pages

---

### Tab 4 — Speed & Rendering
Mục tiêu: bot đọc được, user không bỏ đi quá sớm.

Phần này không biến thành lab tool quá nặng, chỉ check thực dụng:
1. Có SSR text cho homepage không
2. Có quá phụ thuộc client-only không
3. Ảnh lớn không có fallback/title/alt cơ bản
4. Có quá nhiều section rỗng ở homepage không
5. Có route detail render data thật không

Nếu có thể trong scope sau:
- thêm Web Vitals hooks hoặc diagnostic cơ bản
- nhưng phase đầu chỉ nên ưu tiên render/index before perf micro-optimizations

---

### Tab 5 — External Boost
Mục tiêu: ngoài hệ thống nhưng cực dễ làm.

#### Nhóm Google
- Open Google Search Console
- Mở đúng link “add property” / “URL inspection” / “sitemap submit”
- Tự điền sẵn domain/sitemap URL nếu có thể copy nhanh
- Hướng dẫn 3 bước ngắn

#### Nhóm Bing/Edge
- Open Bing Webmaster Tools
- Open IndexNow docs / setup guide
- Hiển thị tình trạng IndexNow trong core (nếu chưa có thì show “chưa tích hợp” + vì sao nên làm)
- Hướng dẫn submit nhanh

#### Principle
- Không bắt user đọc tài liệu dài.
- Mỗi action ngoài hệ thống phải có:
  - nút mở link
  - copy value
  - 3 bước
  - “khi nào nên làm”

---

## 4) Web research distilled into actionable product rules
Từ Google/Bing docs và best practices 2026, checklist của core sẽ ưu tiên các rule này:

### Google-backed rules
1. Sitemap chỉ chứa URL thực sự muốn index.
2. Canonical phải rõ và nhất quán.
3. Structured data phải phản ánh nội dung thật.
4. Robots/meta robots không mâu thuẫn với mục tiêu index.
5. Content phải crawlable, không phụ thuộc JS vô lý.

### Bing/Edge-backed rules
1. IndexNow giúp báo URL mới/cập nhật nhanh hơn.
2. Bing Webmaster vẫn nên có sitemap + verification.
3. Site không index thường do quality/crawl/access/duplication, không chỉ do thiếu submit.

### Product rule hóa thành checklist
- Không đưa vanity checks.
- Chỉ đưa checks làm tăng xác suất crawl/index/understanding.
- Mọi item đều phải có action.

---

## 5) Quick Links & Fast Fix UX
Đây là phần user nhấn mạnh, nên là bắt buộc.

### Với item trong hệ thống
Mỗi item có nút:
- Sửa Site Settings
- Sửa Contact
- Sửa Social
- Mở Products
- Mở Posts
- Mở Services
- Mở Landing Pages
- Mở Public Page
- Mở Sitemap / Robots / llms.txt

### Với item ngoài hệ thống
Mỗi item có:
- `Mở Google Search Console`
- `Mở Bing Webmaster`
- `Mở IndexNow guide`
- `Copy sitemap URL`
- `Copy homepage URL`

### Microcopy mẫu
- “Mở đúng chỗ cần sửa”
- “Copy URL rồi dán vào đây”
- “Làm xong quay lại trang này để check lại”

---

## 6) Rule chống gây khó hiểu
Nguyên tắc copywriting cho toàn bộ `/system/seo`:
- Một item = một ý.
- Tránh từ như canonicalization mismatch nếu không cần.
- Viết theo cấu trúc:
  - Tên vấn đề
  - Ảnh hưởng thực tế
  - Sửa ở đâu
- Mỗi item tối đa 2-3 câu.

Ví dụ:
- Không viết: “Schema entity graph lacks sufficient business completeness.”
- Viết: “Thiếu số điện thoại và địa chỉ. Search engine sẽ khó hiểu đây là doanh nghiệp thật.”

---

## 7) File-level implementation plan

### Files sẽ sửa/chạm
1. `app/system/seo/page.tsx`
   - nâng layout tổng, tabs, command bar, quick wins, guided actions.
2. `components/seo/SeoHealthPanel.tsx`
   - refactor từ panel đơn giản sang renderer cho checklist engine.
3. `app/system/seo/_components/*`
   - thêm các component như:
   - `SeoCommandBar.tsx`
   - `SeoChecklistTabs.tsx`
   - `SeoCriticalActions.tsx`
   - `SeoQuickWins.tsx`
   - `SeoGuidedActions.tsx`
   - `SeoChecklistItem.tsx`
4. `lib/seo/checklist.ts` hoặc `lib/seo/health-checks.ts`
   - engine chính sinh checklist items.
5. `app/sitemap.ts`
   - thêm rule tránh sitemap loãng cho hub rỗng.
6. `lib/seo/route-policy.ts`
   - nếu cần, refine includeInSitemap logic theo content thật.
7. có thể đọc thêm từ:
   - `lib/get-settings.ts`
   - `lib/seo/schema-policy.ts`
   - `lib/seo/metadata.ts`
   - `app/robots.ts`
   - `app/llms.txt/route.ts`

---

## 8) Phasing để giữ practical, không overbuild

### Phase 1 — Must-have practical
- Checklist engine
- 5 tabs
- quick links
- critical actions
- guided external actions
- sitemap hygiene warnings

### Phase 2 — Nice-to-have practical
- IndexNow readiness card
- richer archetype detection
- orphan content detection
- better llms.txt surfacing

### Phase 3 — sau này nếu cần
- page-level SEO inspector
- route-level issue drilldown
- snapshot/export checklist report

---

## Verification Plan

### Type of verification
- Static verification, không chạy tool ghi state trong spec mode.
- Sau khi implement mới verify UI/render/checklist output.

### Pass/fail criteria
1. Dev mở `/system/seo` và biết ngay 3 việc cần làm nhất.
2. Mỗi lỗi/warning đều có nút đi tới nơi sửa hoặc link mở ngoài hệ thống.
3. Không còn cảm giác “checklist cho vui”: mỗi item phải có impact + action.
4. Sitemap hygiene check phát hiện được hub rỗng / index-loãng.
5. Google/Bing actions có hướng dẫn ngắn, link mở sẵn, copy-ready values.
6. UX copy đơn giản, không jargon nặng.

### Success criteria sau rollout
- Core dùng lại được cho nhiều dự án downstream.
- Dự án mới bật lên có thể tự soi SEO readiness trong 5-10 phút.
- Người vận hành biết ưu tiên gì trước để tăng khả năng được crawl/index nhanh hơn.

Nếu bạn duyệt spec này, bước tiếp theo mình sẽ đi vào implementation plan chi tiết hơn theo từng component và logic checklist để dev có thể code rất thẳng, ít mơ hồ.