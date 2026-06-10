## Problem Graph
1. [Nâng cấp sức mạnh SEO public pages lên mức production-ready] <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [Indexability + Renderability] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Public routes đang client-heavy (`'use client'`) nên HTML first-response thiếu nội dung cốt lõi cho crawl wave đầu
   1.2 [Canonical + URL parameter governance] <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Chưa có policy canonical nhất quán cho filter/sort/page (faceted URLs)
   1.3 [Sitemap scale + freshness] <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] Sitemap hiện hard-limit 1000 và thiếu chiến lược chia nhỏ + mốc cập nhật chuẩn
   1.4 [Metadata/Schema consistency theo intent] <- depends on 1.4.1
      1.4.1 [ROOT CAUSE] Một số route quan trọng (đặc biệt home) chưa tối ưu metadata + structured data theo intent vi-VN

## Cơ sở chuẩn áp dụng (từ research)
- Theo Google Search Central (JavaScript SEO + canonical docs): ưu tiên nội dung quan trọng xuất hiện trong HTML render đầu, canonical rõ ràng/nhất quán, tránh tạo tín hiệu trùng lặp từ URL params.
- Với faceted navigation eCommerce: giữ index cho URL có giá trị tìm kiếm thực; các biến thể sort/filter không có search intent nên canonical về URL chuẩn.

## Quyết định kiến trúc SEO cho dự án này (đã fit theo yêu cầu của bạn)
- **Thị trường index**: chỉ **vi-VN**.
- **Canonical policy (chọn cho project)**:
  - Trang list gốc (`/products`, `/posts`, `/services`): canonical self.
  - Query `page`: **giữ canonical theo page** (`?page=n`) để phân trang crawl được.
  - Query `sort`, `filter`, `search`, `cat*` (faceted): **không canonical theo query**, canonical về URL chuẩn của page tương ứng (giữ page nếu có).
  - Không canonical toàn bộ về page 1.

## Full Implementation Plan (step-by-step, không chia phase)

1. Chuẩn hóa locale tín hiệu toàn site
- File: `app/layout.tsx`
- Thay đổi:
  - Đổi `<html lang="en">` thành `lang="vi"`.
  - Giữ nguyên kiến trúc provider hiện tại, không đụng business logic.
- Kết quả: đồng bộ tín hiệu ngôn ngữ với nội dung tiếng Việt.

2. Server-first Home để bot thấy nội dung ngay lần crawl đầu
- File mới: `app/(site)/_components/HomePageClient.tsx`
- File sửa: `app/(site)/page.tsx`
- Thay đổi:
  - Di chuyển toàn bộ logic client hiện tại từ `page.tsx` sang `HomePageClient.tsx` (giữ UI y hệt).
  - `app/(site)/page.tsx` trở thành **Server Component**:
    - `generateMetadata()` riêng cho homepage (title/description/canonical/OG/Twitter vi-VN).
    - Render shell có H1 và nội dung mô tả ngắn crawlable trước khi mount client content.
    - Inject JSON-LD `WebSite` + `Organization` + `ItemList` (nếu có danh sách block chính).
- Kết quả: landing page có metadata + HTML crawlable đúng chuẩn.

3. Chuẩn hóa canonical generator dùng chung cho list routes
- File mới: `lib/seo/canonical.ts`
- Thêm hàm:
  - `buildListCanonical({ baseUrl, pathname, pageParam })`
  - Logic: chỉ giữ `page` nếu hợp lệ `>=2`; bỏ toàn bộ param faceted/sort/search/filter.
- Kết quả: policy canonical nhất quán, tránh duplicate signal.

4. Áp canonical policy vào metadata list pages
- File sửa:
  - `app/(site)/products/layout.tsx`
  - `app/(site)/posts/layout.tsx`
  - `app/(site)/services/layout.tsx`
- Thay đổi:
  - Chuyển từ canonical tĩnh sang canonical theo helper `buildListCanonical` (đọc `searchParams` ở layer phù hợp).
  - Giữ robots index/follow cho list pages.
  - Chuẩn hóa title/description intent tiếng Việt (không dùng 1 mô tả chung chung).
- Kết quả: giảm trùng lặp URL do filter/sort/search, vẫn crawl tốt pagination.

5. Giữ canonical self tuyệt đối cho detail pages
- File rà soát/chỉnh nhẹ:
  - `app/(site)/products/[slug]/layout.tsx`
  - `app/(site)/posts/[slug]/layout.tsx`
  - `app/(site)/services/[slug]/layout.tsx`
- Thay đổi:
  - Đảm bảo canonical luôn tuyệt đối theo slug chuẩn.
  - Chuẩn hóa fallback metadata khi không tìm thấy record để không tạo mâu thuẫn title/description.
- Kết quả: hợp nhất tín hiệu ranking đúng URL chuẩn.

6. Nâng cấp sitemap để scale lớn, bỏ hard-limit 1000
- File sửa: `app/sitemap.ts`
- File mới: `app/server/seo/sitemap-utils.ts` (hoặc `lib/seo/sitemap.ts`)
- Thay đổi:
  - Refactor query theo batch/chunk, không giới hạn cứng 1000.
  - Dùng timestamp thực tế (`publishedAt`, `updatedAt` nếu có) cho `lastModified`.
  - Với list static pages: dùng mốc cập nhật ổn định từ setting/content source thay vì `new Date()` mỗi request.
  - Nếu tổng URL vượt ngưỡng lớn: chuẩn bị output theo sitemap index strategy (nhiều sitemap file).
- Kết quả: coverage đầy đủ và tín hiệu freshness chính xác hơn.

7. Chuẩn hóa robots theo policy public/private
- File sửa: `app/robots.ts`
- Thay đổi:
  - Giữ disallow `/admin/`, `/system/`, `/api/`.
  - Đảm bảo không block assets cần crawl/render (không disallow nhầm static resource).
  - Giữ sitemap trỏ đúng domain canonical.
- Kết quả: crawl budget tập trung vào public pages có giá trị SEO.

8. Tăng độ đúng của structured data theo guideline rich results
- File sửa: `components/seo/JsonLd.tsx`
- File rà soát thêm nơi dùng schema:
  - `app/(site)/layout.tsx`
  - `app/(site)/products/layout.tsx`
  - `app/(site)/posts/layout.tsx`
  - `app/(site)/services/layout.tsx`
- Thay đổi:
  - Đảm bảo schema output chỉ chứa field có dữ liệu thật (không null/undefined noise).
  - Product schema: đồng bộ `price`, `availability`, `aggregateRating` với data thực tế.
  - Article/Service/Breadcrumb giữ đúng ngữ cảnh và URL tuyệt đối.
- Kết quả: tăng eligibility rich results, giảm lỗi parse schema.

9. Giảm rủi ro JS SEO ở list/detail mà không phá UX hiện tại
- File mục tiêu:
  - `app/(site)/products/page.tsx`
  - `app/(site)/posts/page.tsx`
  - `app/(site)/services/page.tsx`
- Thay đổi:
  - Giữ interactive UI hiện tại nhưng thêm server-rendered intro content (H1 + mô tả ngắn + internal links chính) ở shell server level.
  - Không rewrite toàn bộ logic filter/pagination hiện có để tránh regression lớn.
- Kết quả: bot có nội dung indexable sớm, UX không đổi.

10. Đồng bộ internal linking theo cụm topic
- File rà soát:
  - `components/site/Header.tsx`
  - section link trong `app/(site)/page.tsx` / các list/detail page
- Thay đổi:
  - Đảm bảo link HTML thuần (`<a href>` qua `next/link`) tới trang trụ cột: `/products`, `/services`, `/posts`, `/contact`.
  - Tăng liên kết chéo list ↔ detail ↔ category ở mức tối thiểu cần thiết.
- Kết quả: cải thiện crawl depth và phân phối authority nội bộ.

11. Chuẩn hóa metadataBase và absolute URL safety
- File sửa: `app/(site)/layout.tsx` và các layout SEO liên quan
- Thay đổi:
  - Bảo vệ trường hợp `site_url` rỗng để không phát sinh canonical/og URL lỗi.
  - Dùng helper resolve URL tuyệt đối thống nhất.
- Kết quả: tránh metadata invalid trên môi trường thiếu config.

12. Cập nhật rule noindex cho transactional pages (giữ nguyên intent)
- File rà soát: 
  - `app/(site)/cart/layout.tsx`
  - `app/(site)/checkout/layout.tsx`
  - `app/(site)/account/layout.tsx`
  - `app/(site)/wishlist/layout.tsx`
- Thay đổi:
  - Duy trì `noindex, nofollow` cho trang cá nhân/giao dịch.
  - Kiểm tra không lan sang money pages public.
- Kết quả: index sạch, tập trung traffic vào trang có giá trị SEO.

## Output mong đợi sau khi implement
- SEO strength mục tiêu: từ ~68/100 lên **80-86/100**.
- Root cause P0 được xử lý: bot nhận được HTML meaningful ở homepage + list entry.
- Canonical/param duplication giảm rõ rệt.
- Sitemap đủ coverage khi dữ liệu tăng lớn.

## Ràng buộc thực thi theo yêu cầu của bạn
- Đây là spec full implement, đi thẳng 1 lần, không chia phase.
- Không thêm tính năng ngoài phạm vi SEO public pages.
- Không yêu cầu test trong scope spec này (theo yêu cầu “khỏi test”).

Nếu bạn duyệt spec này, mình sẽ triển khai đúng thứ tự trên để giảm lỗi từ đầu và giữ an toàn cho codebase hiện tại.