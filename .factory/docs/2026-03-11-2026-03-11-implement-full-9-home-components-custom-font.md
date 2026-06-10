## Audit Summary
- Bạn đã xác nhận triển khai full 9 home-component còn lại.
- Phạm vi triển khai: **VoucherPromotions, Countdown, FAQ, About, Team, Video, Contact, Career, Footer**.
- Pattern áp dụng giữ nguyên như 20 component trước: hook `useTypeFontOverrideState` + `TypeFontOverrideCard` + update create/edit/preview + lưu `setTypeFontOverride` + truyền `fontStyle/fontClassName` cho preview.

## Root Cause Confidence
- **High** — Scope rõ ràng, pattern đã ổn định qua 20 commit trước, chỉ còn rollout nhất quán cho 9 type còn lại.

## Proposal (Execution Plan)
1. Triển khai theo thứ tự: VoucherPromotions → Countdown → FAQ → About → Team → Video → Contact → Career → Footer.
2. Mỗi type thực hiện đủ 3 bề mặt:
   - Create page: nối `customFontState/showFontCustomBlock/setCustomFontState`, pass `fontStyle/fontClassName` vào preview.
   - Edit page: thêm `useTypeFontOverrideState`, merge `customFontChanged` vào `hasChanges`, gọi mutation `setTypeFontOverride` khi save, render `TypeFontOverrideCard`.
   - Preview component: nhận và forward `fontStyle/fontClassName` vào wrapper phù hợp (`PreviewWrapper` hoặc root container thực tế).
3. Sau mỗi type: tự review tĩnh (typing/null-safety/edge cases), chạy **`bunx tsc --noEmit`**.
4. Nếu pass typecheck: commit ngay **1 type / 1 commit** với message chuẩn `feat: add custom font support for <Type>`.
5. Lặp đến hết 9 type, sau đó gửi báo cáo tổng hợp commit + file đã đổi.

## Verification Plan
- Không chạy lint/unit test/build theo guideline repo.
- Verify bắt buộc cho từng type:
  - Toggle System/Custom hiển thị đúng card trong create/edit.
  - Enable custom font: preview đổi font đúng.
  - Disable custom font: fallback đúng theo hệ thống.
  - `hasChanges` hoạt động đúng, không save dư.
  - `bunx tsc --noEmit` pass trước khi commit.