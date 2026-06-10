## Problem Graph
1. [Main] Fix CTA Gradient accessibility + responsive preview
   1.1 [Accessibility warning] minLc fail cho description
      1.1.1 [ROOT CAUSE] Sai background khi tính APCA cho description trong gradient
   1.2 [Responsive preview] Gradient layout vỡ khi switch device
      1.2.1 [ROOT CAUSE] Thiếu responsive padding/typography trong CTASectionShared

## Execution (with reflection)
1. Fix APCA description logic (colors.ts)
   - Thought: Với gradient, cần kiểm tra APCA trên 2 màu tint của gradient, chọn màu description pass worst-case.
   - Action: Trong `getCTAColors` nhánh `gradient`, tính `fromTint`/`toTint`, chọn `descriptionColor` dựa trên `getAPCATextColor` cho cả 2 màu; dùng `textOnGradient` làm fallback.
   - Reflection: ✓ đảm bảo minLc không fail do background sai.

2. Fix background check cho accessibility pairs (colors.ts)
   - Thought: `sectionBgForCheck` đang lấy primary khi gradient; cần worst-case tint tương ứng gradient.
   - Action: Thêm helper lấy background dùng `fromTint` (worst-case) cho gradient, thay `sectionBgForCheck` bằng helper.
   - Reflection: ✓ tránh false fail cho description/badge/secondary.

3. Fix responsive layout cho gradient preview (CTASectionShared.tsx)
   - Thought: Preview vỡ do thiếu padding/typography responsive.
   - Action: Bổ sung classes `px-4 sm:px-6`, `text-xl sm:text-2xl md:text-3xl lg:text-4xl`, spacing responsive trong block `gradient`.
   - Reflection: ✓ layout ổn trên mobile/tablet/desktop.

4. Run validators
   - Action: chạy `bunx tsc --noEmit`.
   - Reflection: ✓ pass thì mới kết thúc.

## Files to change
- `app/admin/home-components/cta/_lib/colors.ts`
- `app/admin/home-components/cta/_components/CTASectionShared.tsx`

## Notes
- Không thay đổi behavior ngoài gradient layout.
- Không thêm lib mới.