## Problem Graph
1. [Service seed ảnh chưa “giống posts”] <- depends on 1.1
   1.1 [ROOT CAUSE] `ServiceSeeder` đang fallback khác logic `PostSeeder` nên cảm giác ảnh không đồng nhất.
2. [Favicon chưa đồng bộ logo mặc định đủ chặt] <- depends on 2.1
   2.1 [ROOT CAUSE] Seed hiện ưu tiên `businessInfo.faviconUrl` trước `selectedLogo`, nên khi user đổi logo không luôn đồng bộ theo kỳ vọng mặc định.
3. [SEO seed theo ngành còn generic] <- depends on 3.1, 3.2
   3.1 [ROOT CAUSE] Chưa seed `seo_keywords` theo industry template trong wizard.
   3.2 [ROOT CAUSE] Chưa có trạng thái “dùng logo làm OG image” mặc định bật cho CoC, nên `seo_og_image` chưa đồng bộ mặc định.

## Implementation Plan
1. Chuẩn hóa ảnh service fallback theo posts
   - File: `convex/seeders/services.seeder.ts`
   - Đổi hàm chọn thumbnail service để mirror pattern posts:
     - Ưu tiên `template.assets.gallery` đã qua `filterAvailableSeedMauPaths`.
     - Nếu thiếu thì lấy global pool `getSeedMauAssetPool('gallery')`.
     - Nếu không có path hợp lệ thì fallback `https://picsum.photos/seed/${slug}/600/400` (giống posts).
   - Mục tiêu: seed chain + format picsum dịch vụ đồng nhất với bài viết.

2. Đồng bộ favicon mặc định theo logo đã chọn (nhưng vẫn cho override tay)
   - File: `components/data/SeedWizardDialog.tsx`
   - Khi seed settings:
     - Tính `resolvedFavicon` theo ưu tiên mới: nếu có `selectedLogo` thì dùng logo; nếu không mới dùng `businessInfo.faviconUrl`.
   - Giữ nguyên UI BusinessInfoStep cho phép user nhập tay (override), nhưng mặc định đồng bộ theo logo như anh yêu cầu.

3. Bổ sung SEO keyword theo ngành + OG image mặc định theo logo
   - File: `components/data/seed-wizard/types.ts`
     - Mở rộng `BusinessInfo` thêm `useLogoAsOgImage: boolean` (default `true`).
   - File: `components/data/seed-wizard/steps/BusinessInfoStep.tsx`
     - Thêm checkbox: “Dùng logo đã chọn làm OG image” (mặc định tick).
     - Khi tick: seed dùng logo làm `seo_og_image`; khi bỏ tick: cho phép nhập/giữ URL OG riêng (thêm input `seoOgImageUrl` trong business info nếu cần).
   - File: `components/data/SeedWizardDialog.tsx`
     - Build `seo_keywords` từ `industryTemplate.tags` (+ siteName/industry name để đủ breadth).
     - Set settings SEO:
       - `seo_keywords`: chuỗi comma-separated theo ngành.
       - `seo_og_image`: nếu `useLogoAsOgImage=true` thì lấy `selectedLogo`; nếu false thì dùng giá trị OG thủ công.
     - Fallback an toàn: nếu thiếu industry/logo thì dùng logic cũ để không seed rỗng.

4. Kiểm tra tương thích trang Settings
   - File tham chiếu đọc-only để đảm bảo key đúng: `app/admin/settings/page.tsx`
   - Xác nhận key đang dùng đúng hệ thống hiện tại: `seo_keywords`, `seo_og_image`, `site_favicon`.

5. Verification + commit
   - Chạy: `bunx tsc --noEmit`.
   - Review `git status`, `git diff --cached`.
   - Commit theo style repo, bao gồm `.factory/docs` nếu có thay đổi.

## Kết quả mong đợi
- Service seed ảnh có cảm giác đồng bộ với posts (đặc biệt khi fallback picsum).
- Favicon mặc định luôn ăn theo logo đã chọn để đồng bộ branding, nhưng vẫn cho override thủ công.
- SEO seed trong `/admin/settings` có keywords phù hợp ngành và `seo_og_image` mặc định theo logo với tùy chọn bật sẵn.