# Plan: Tách toàn bộ Home Components theo Pattern Hero

## 🎯 Mục tiêu
Tách **19 home-components còn lại** từ file monolithic (`previews.tsx`, `edit/page.tsx`) thành module feature-based theo pattern Hero.

## 📊 Phân tích hiện trạng
- ✅ **Đã tách:** 9 components (hero, stats, blog, case-study, category-products, partners, product-categories, product-list, service-list)
- 🔴 **Còn lại:** 19 components trong `previews.tsx` (12,597 dòng)

## 🚀 Chiến lược thực thi

### Tùy chọn 1: Song song (19 luồng độc lập) - RECOMMENDED
**Ưu điểm:** Tốc độ cực nhanh, hoàn thành trong ~15-30 phút nếu chạy 5-10 luồng song song
**Nhược điểm:** Cần merge code thủ công sau khi xong

**Cách thực hiện:**
1. User mở 5-10 tab Factory Agent
2. Copy-paste từng prompt vào mỗi tab
3. Mỗi agent chạy độc lập, tạo spec riêng
4. User approve tất cả spec và chạy implement song song
5. Merge code sau khi xong

### Tùy chọn 2: Batch tuần tự (4 batch × ~5 components)
**Ưu điểm:** Dễ quản lý, ít conflict
**Nhược điểm:** Chậm hơn (~2-3 giờ)

**Batch phân chia:**
- **Batch 1 (Priority High):** faq, testimonials, pricing, footer, cta
- **Batch 2 (Content):** services, about, benefits, contact
- **Batch 3 (Media):** gallery, team, video, clients
- **Batch 4 (Advanced):** speed-dial, features, process, countdown, voucher-promotions

---

## 📝 19 Prompts sẵn sàng (Copy-paste cho từng agent)

### 1. FAQ Component
\`\`\`
Tạo spec tách home-component "faq" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component. 

Component info:
- Name: FAQ
- Preview export: FaqPreview (line 140 trong previews.tsx)
- Route: /admin/home-components/create/faq
- Type value: "FAQ"

Output: Spec chi tiết để tách FaqPreview + form + types + constants theo pattern Hero.
\`\`\`

### 2. Testimonials Component
\`\`\`
Tạo spec tách home-component "testimonials" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Testimonials
- Preview export: TestimonialsPreview (line 491 trong previews.tsx)
- Route: /admin/home-components/create/testimonials
- Type value: "Testimonials"

Output: Spec chi tiết để tách TestimonialsPreview + form + types + constants theo pattern Hero.
\`\`\`

### 3. Pricing Component
\`\`\`
Tạo spec tách home-component "pricing" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Pricing
- Preview export: PricingPreview (line 816 trong previews.tsx)
- Route: /admin/home-components/create/pricing
- Type value: "Pricing"

Output: Spec chi tiết để tách PricingPreview + form + types + constants theo pattern Hero.
\`\`\`

### 4. Gallery Component
\`\`\`
Tạo spec tách home-component "gallery" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Gallery (bao gồm Gallery + TrustBadges)
- Preview export: GalleryPreview (line 1409), TrustBadgesPreview (line 7125)
- Route: /admin/home-components/create/gallery
- Type value: "Gallery", "TrustBadges"

Output: Spec chi tiết để tách GalleryPreview + TrustBadgesPreview + form + types + constants theo pattern Hero.
\`\`\`

### 5. Services Component
\`\`\`
Tạo spec tách home-component "services" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Services
- Preview export: ServicesPreview (line 1862 trong previews.tsx)
- Route: /admin/home-components/create/services
- Type value: "Services"

Output: Spec chi tiết để tách ServicesPreview + form + types + constants theo pattern Hero.
\`\`\`

### 6. Footer Component
\`\`\`
Tạo spec tách home-component "footer" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Footer
- Preview export: FooterPreview (line 3925 trong previews.tsx)
- Route: /admin/home-components/create/footer
- Type value: "Footer"
- Singleton: true

Output: Spec chi tiết để tách FooterPreview + form + types + constants theo pattern Hero.
\`\`\`

### 7. CTA Component
\`\`\`
Tạo spec tách home-component "cta" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: CTA
- Preview export: CTAPreview (line 4458 trong previews.tsx)
- Route: /admin/home-components/create/cta
- Type value: "CTA"

Output: Spec chi tiết để tách CTAPreview + form + types + constants theo pattern Hero.
\`\`\`

### 8. About Component
\`\`\`
Tạo spec tách home-component "about" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: About
- Preview export: AboutPreview (line 4838 trong previews.tsx)
- Route: /admin/home-components/create/about
- Type value: "About"

Output: Spec chi tiết để tách AboutPreview + form + types + constants theo pattern Hero.
\`\`\`

### 9. Benefits Component
\`\`\`
Tạo spec tách home-component "benefits" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Benefits
- Preview export: BenefitsPreview (line 5342 trong previews.tsx)
- Route: /admin/home-components/create/benefits
- Type value: "Benefits"

Output: Spec chi tiết để tách BenefitsPreview + form + types + constants theo pattern Hero.
\`\`\`

### 10. Career Component
\`\`\`
Tạo spec tách home-component "career" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Career
- Preview export: CareerPreview (line 6178 trong previews.tsx)
- Route: /admin/home-components/create/career
- Type value: "Career"

Output: Spec chi tiết để tách CareerPreview + form + types + constants theo pattern Hero.
\`\`\`

### 11. Contact Component
\`\`\`
Tạo spec tách home-component "contact" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Contact
- Preview export: ContactPreview (line 6721 trong previews.tsx)
- Route: /admin/home-components/create/contact
- Type value: "Contact"

Output: Spec chi tiết để tách ContactPreview + form + types + constants theo pattern Hero.
\`\`\`

### 12. Speed Dial Component
\`\`\`
Tạo spec tách home-component "speed-dial" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Speed Dial
- Preview export: SpeedDialPreview (line 7656 trong previews.tsx)
- Route: /admin/home-components/create/speed-dial
- Type value: "SpeedDial"

Output: Spec chi tiết để tách SpeedDialPreview + form + types + constants theo pattern Hero.
\`\`\`

### 13. Team Component
\`\`\`
Tạo spec tách home-component "team" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Team
- Preview export: TeamPreview (line 9378 trong previews.tsx)
- Route: /admin/home-components/create/team
- Type value: "Team"

Output: Spec chi tiết để tách TeamPreview + form + types + constants theo pattern Hero.
\`\`\`

### 14. Features Component
\`\`\`
Tạo spec tách home-component "features" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Features
- Preview export: FeaturesPreview (line 10115 trong previews.tsx)
- Route: /admin/home-components/create/features
- Type value: "Features"

Output: Spec chi tiết để tách FeaturesPreview + form + types + constants theo pattern Hero.
\`\`\`

### 15. Process Component
\`\`\`
Tạo spec tách home-component "process" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Process
- Preview export: ProcessPreview (line 10355 trong previews.tsx)
- Route: /admin/home-components/create/process
- Type value: "Process"

Output: Spec chi tiết để tách ProcessPreview + form + types + constants theo pattern Hero.
\`\`\`

### 16. Clients Component
\`\`\`
Tạo spec tách home-component "clients" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Clients
- Preview export: ClientsPreview (line 10781 trong previews.tsx)
- Route: /admin/home-components/create/clients
- Type value: "Clients"

Output: Spec chi tiết để tách ClientsPreview + form + types + constants theo pattern Hero.
\`\`\`

### 17. Video Component
\`\`\`
Tạo spec tách home-component "video" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Video
- Preview export: VideoPreview (line 11174 trong previews.tsx)
- Route: /admin/home-components/create/video
- Type value: "Video"

Output: Spec chi tiết để tách VideoPreview + form + types + constants theo pattern Hero.
\`\`\`

### 18. Countdown Component
\`\`\`
Tạo spec tách home-component "countdown" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Countdown
- Preview export: CountdownPreview (line 11708 trong previews.tsx)
- Route: /admin/home-components/create/countdown
- Type value: "Countdown"

Output: Spec chi tiết để tách CountdownPreview + form + types + constants theo pattern Hero.
\`\`\`

### 19. Voucher Promotions Component
\`\`\`
Tạo spec tách home-component "voucher-promotions" theo skill E:\\NextJS\\study\\admin-ui-aistudio\\system-vietadmin-nextjs\\.factory\\skills\\refactor-home-component.

Component info:
- Name: Voucher Promotions
- Preview export: VoucherPromotionsPreview (line 12295 trong previews.tsx)
- Route: /admin/home-components/create/voucher-promotions
- Type value: "VoucherPromotions"

Output: Spec chi tiết để tách VoucherPromotionsPreview + form + types + constants theo pattern Hero.
\`\`\`

---

## 🎬 Hướng dẫn thực thi

### Cách 1: Chạy song song (RECOMMENDED)
1. Mở 5-10 tab Factory Agent
2. Copy từng prompt trên paste vào mỗi tab
3. Đợi tất cả spec xong
4. Approve tất cả
5. Chạy implement song song

### Cách 2: Chạy tuần tự từng batch
1. Chọn batch 1 (5 prompts đầu)
2. Chạy hết batch 1 → merge code
3. Chạy batch 2 → merge code
4. Lặp lại cho batch 3 và 4

---

## ✅ Kết quả mong đợi
- 19 module mới theo pattern Hero
- File `previews.tsx` giảm từ 12,597 dòng → ~100 dòng (chỉ còn wrapper utilities)
- File `[id]/edit/page.tsx` chỉ còn redirect logic
- Mỗi component có cấu trúc:
  ```
  app/admin/home-components/[component]/
  ├── [id]/edit/page.tsx
  ├── _types/index.ts
  ├── _lib/constants.ts
  └── _components/
      ├── [Component]Preview.tsx
      └── [Component]Form.tsx
  ```
