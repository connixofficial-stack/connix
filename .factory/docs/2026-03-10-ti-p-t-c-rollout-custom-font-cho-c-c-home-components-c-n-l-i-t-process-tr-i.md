## Audit Summary
- Đã hoàn tất các type: Blog, Benefits, Features, Services.
- Còn lại: Process, Testimonials, CaseStudy, Gallery, Clients, CTA, Pricing, VoucherPromotions, Countdown, FAQ, About, Team, Video, Contact, Career, Footer, SpeedDial.
- Yêu cầu: giữ 1-type-1-commit, chạy `bunx tsc --noEmit` sau mỗi type, thứ tự theo danh sách hiện tại.

## Root Cause Confidence
- Medium — đây là kế hoạch triển khai tiếp nối theo pattern đã ổn định.

## Proposal (Implementation Plan)
1. **Process**
   - Thêm `useTypeFontOverrideState`, `TypeFontOverrideCard`, `setTypeFontOverride` trong create/edit.
   - Truyền `fontStyle` + `fontClassName` vào preview, mở rộng preview props nếu cần.
   - Commit: `feat: add custom font support for Process`.
2. **Testimonials** — create/edit + preview + commit.
3. **CaseStudy** — create/edit + preview + commit.
4. **Gallery** — create/edit + preview + commit.
5. **Clients** — create/edit + preview + commit.
6. **CTA** — create/edit + preview + commit.
7. **Pricing** — create/edit + preview + commit.
8. **VoucherPromotions** — create/edit + preview + commit.
9. **Countdown** — create/edit + preview + commit.
10. **FAQ** — create/edit + preview + commit.
11. **About** — create/edit + preview + commit.
12. **Team** — create/edit + preview + commit.
13. **Video** — create/edit + preview + commit.
14. **Contact** — create/edit + preview + commit.
15. **Career** — create/edit + preview + commit.
16. **Footer** — create/edit + preview + commit.
17. **SpeedDial** — create/edit + preview + commit.

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
  - Nhận `fontStyle`/`fontClassName` và forward vào `PreviewWrapper` hoặc wrapper thực tế.

## Verification Plan
- Sau mỗi type: chạy `bunx tsc --noEmit`.
- Commit ngay sau khi tsc OK.

## Risks & Mitigations
- **Rủi ro:** preview không dùng `PreviewWrapper` → cần truyền font vào wrapper thực tế.
- **Giảm thiểu:** đọc preview component trước, follow pattern đã dùng ở Features/Services/Benefits.

Xác nhận kế hoạch để tôi tiếp tục triển khai.