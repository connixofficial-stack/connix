## Audit Summary
- Observation: preview Hero `fullscreen` đang render lớp gradient mờ với `z-20` trong `app/admin/home-components/hero/_components/HeroPreview.tsx:352`, trong khi block nội dung chữ chỉ có `z-10` tại `HeroPreview.tsx:360`.
- Observation: vì `create` và `edit` đều dùng chung `HeroPreview`, lỗi xuất hiện ở cả 2 màn:
  - `app/admin/home-components/create/hero/page.tsx:57`
  - `app/admin/home-components/hero/[id]/edit/page.tsx:307`
- Observation: scope hiện tại chỉ thuộc layout `fullscreen`; các layout khác (`slider`, `fade`, `bento`, `split`, `parallax`) có render path riêng.
- Inference: lớp overlay đang nằm trên text trong cùng stacking context, nên gây cảm giác nền mờ đè trực tiếp lên chữ/nút thay vì chỉ phủ lên ảnh nền.
- Decision: fix đúng 1 chỗ trong `HeroPreview.tsx`, chỉ cho nhánh `renderFullscreenStyle`, không động vào API dữ liệu hay layout khác.

## Root Cause Confidence
- High — evidence trực tiếp trong code cho thấy sai thứ tự lớp hiển thị:
  - overlay fullscreen: `absolute ... z-20`
  - content fullscreen: `absolute ... z-10`
- Counter-hypothesis đã xét:
  1. Không phải do form `HeroForm`, vì form chỉ bật/tắt `showFullscreenContent` chứ không quyết định z-index.
  2. Không phải do dữ liệu create/edit khác nhau, vì cả hai route đều reuse cùng `HeroPreview`.
  3. Không phải lỗi toàn bộ Hero, vì chỉ nhánh `fullscreen` có overlay ngang phủ trái-phải kèm text overlay.
- Pass/fail mong muốn:
  - Pass: ở `fullscreen`, lớp mờ chỉ nằm trên ảnh; text, badge, CTA hiển thị rõ và không bị dim.
  - Pass: toggle “Hiển thị nội dung Hero” vẫn giữ hành vi hiện tại: tắt thì ẩn cả chữ lẫn lớp mờ.
  - Pass: các layout khác không đổi giao diện.

## Proposal
1. Sửa `app/admin/home-components/hero/_components/HeroPreview.tsx` trong `renderFullscreenStyle`:
   - hạ overlay xuống dưới content hoặc nâng content lên trên overlay theo pattern an toàn nhất.
   - ưu tiên đổi layering rõ ràng thành 3 lớp: ảnh nền < overlay < nội dung.
2. Giữ nguyên contract hiện tại của `showFullscreenContent`:
   - `true`: có overlay + có nội dung.
   - `false`: không overlay + không nội dung.
3. Không sửa `HeroForm`, `_types`, `DEFAULT_HERO_CONTENT`, vì không phải root cause.
4. Tự review tĩnh sau sửa:
   - fullscreen text/CTA không còn bị lớp mờ phủ.
   - create/edit đều hưởng fix vì dùng chung component.
   - không phát sinh ảnh hưởng đến `parallax` hoặc `split`.

## Verification Plan
- Static review tại `HeroPreview.tsx` để xác nhận stacking order mới là: image < overlay < content.
- Đối chiếu call sites ở `create/hero/page.tsx` và `hero/[id]/edit/page.tsx` để chắc chắn cả 2 route đều reuse component đã sửa.
- Theo guideline repo, không chạy lint/test/build; chỉ verify tĩnh typing, null-safety và scope ảnh hưởng.

Nếu bạn duyệt spec này, tôi sẽ implement fix gọn đúng layout `fullscreen` rồi commit local theo rule của repo.