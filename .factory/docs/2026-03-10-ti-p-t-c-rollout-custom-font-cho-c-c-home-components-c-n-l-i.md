## Audit Summary
- Hiện đã hoàn tất nền tảng và các type: Hero, Stats, Partners, TrustBadges, ProductCategories, ProductList, ProductGrid, CategoryProducts, ServiceList.
- Còn lại: Blog, Benefits, Features, Services, Process, Testimonials, CaseStudy, Gallery, Clients, CTA, Pricing, VoucherPromotions, Countdown, FAQ, About, Team, Video, Contact, Career, Footer, SpeedDial.
- Yêu cầu: tiếp tục theo danh sách hiện tại, 1-type-1-commit, chạy `bunx tsc --noEmit` sau mỗi type.

## Root Cause Confidence
- Medium — đây là kế hoạch triển khai tiếp nối, không phải xử lỗi; giả định pattern hiện tại đủ áp dụng cho các type còn lại.

## Proposal (Implementation Plan)
1. **Blog**
   - Thêm `useTypeFontOverrideState`, `TypeFontOverrideCard`, `setTypeFontOverride` trong create/edit.
   - Truyền `fontStyle` + `fontClassName` vào preview; nếu preview bọc `PreviewWrapper`, mở rộng props như các type trước.
   - Commit: `feat: add custom font support for Blog`.
2. **Benefits** (lặp lại pattern tương tự): create/edit + preview + commit.
3. **Features**: create/edit + preview + commit.
4. **Services**: create/edit + preview + commit.
5. **Process**: create/edit + preview + commit.
6. **Testimonials**: create/edit + preview + commit.
7. **CaseStudy**: create/edit + preview + commit.
8. **Gallery**: create/edit + preview + commit.
9. **Clients**: create/edit + preview + commit.
10. **CTA**: create/edit + preview + commit.
11. **Pricing**: create/edit + preview + commit.
12. **VoucherPromotions**: create/edit + preview + commit.
13. **Countdown**: create/edit + preview + commit.
14. **FAQ**: create/edit + preview + commit.
15. **About**: create/edit + preview + commit.
16. **Team**: create/edit + preview + commit.
17. **Video**: create/edit + preview + commit.
18. **Contact**: create/edit + preview + commit.
19. **Career**: create/edit + preview + commit.
20. **Footer**: create/edit + preview + commit.
21. **SpeedDial**: create/edit + preview + commit.

### Mẫu thao tác cho mỗi type
- Create page:
  - `useTypeFontOverrideState` + `fontStyle`.
  - Pass `customFontState/showFontCustomBlock/setCustomFontState` vào `ComponentFormWrapper`.
  - Truyền `fontStyle` + `fontClassName` vào preview.
- Edit page:
  - `useTypeFontOverrideState`, `setTypeFontOverride`.
  - `customFontChanged` vào logic `hasChanges`.
  - Call mutation + `setInitialFontCustom`.
  - Add `TypeFontOverrideCard`.
  - `fontStyle` + `fontClassName` vào preview.
- Preview component:
  - Nhận `fontStyle`/`fontClassName` và forward vào `PreviewWrapper` hoặc child wrapper.

## Verification Plan
- Sau mỗi type: chạy `bunx tsc --noEmit`.
- Commit ngay sau khi tsc OK.

## Risks & Mitigations
- **Rủi ro:** preview không dùng `PreviewWrapper` → cần truyền font vào wrapper thực tế.
- **Giảm thiểu:** đọc preview component trước, follow pattern đã dùng ở ProductList/CategoryProducts/ServiceList.

Nếu bạn xác nhận, tôi sẽ tiếp tục rollout theo đúng thứ tự và chiến lược commit đã chọn.