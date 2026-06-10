## Audit Summary
- Observation: Ở site thật (`http://localhost:3000`), nhánh fullscreen trong `components/site/ComponentRenderer.tsx` render overlay gradient với `z-20` nhưng khối nội dung chữ/CTA chỉ `z-10`.
- Observation: Khi chuyển slide (fade `duration-1000`), overlay của slide active nằm trên text nên tạo cảm giác “nền mờ đè chữ”.
- Observation: User xác nhận scope chỉ cần: **“Chỉ sửa layering fullscreen site (text luôn trên overlay)”**.
- Inference: Đây là lỗi thứ tự stack trong cùng fullscreen render path, không phải lỗi data/content hay logic chuyển slide tổng thể.
- Decision: Chỉ sửa nhánh `style === 'fullscreen'` trong site renderer, không đụng các style khác.

## Root Cause Confidence
- High — bằng chứng trực tiếp tại `components/site/ComponentRenderer.tsx`:
  - overlay: `absolute ... z-20`
  - content overlay: `absolute ... z-10`
- Counter-hypothesis đã loại trừ:
  1. Không phải do config `showFullscreenContent` vì cờ này chỉ bật/tắt render, không quyết định thứ tự lớp.
  2. Không phải do preview/admin vì bug user report nằm ở site renderer.
  3. Không phải do dot navigation hay autoplay; chúng chỉ đổi `currentSlide`, không đổi layering.
- Pass/Fail criteria:
  - Pass: Text/CTA fullscreen luôn nằm trên lớp gradient trong mọi trạng thái slide transition.
  - Pass: Vẫn giữ behavior hiện tại khi `showFullscreenContent === false` (không overlay + không text).
  - Pass: Các style `slider/fade/bento/split/parallax` không thay đổi.

## Proposal
1. Sửa `components/site/ComponentRenderer.tsx` tại branch fullscreen:
   - tăng z-index khối nội dung fullscreen (ví dụ `z-30`) để luôn cao hơn overlay.
2. Giữ nguyên toàn bộ transition hiện tại (`transition-opacity duration-1000`) và logic điều hướng slide.
3. Không sửa `HeroPreview`, `HeroForm`, types, constants vì ngoài scope user vừa chốt.
4. Tự review tĩnh sau sửa:
   - kiểm tra thứ tự lớp: image < overlay < text.
   - rà nhanh fullscreen branch để tránh ảnh hưởng links/CTA/button dots.

## Verification Plan
- Static review trực tiếp `components/site/ComponentRenderer.tsx` để xác nhận stacking order mới đúng.
- Repro checklist cho tester:
  1. Mở trang site có Hero fullscreen.
  2. Chuyển qua lại nhiều slide bằng dots/nav.
  3. Xác nhận text/CTA không còn bị dim bởi overlay khi transition.
- Theo guideline repo: không chạy lint/build/test; chỉ kiểm tra tĩnh typing và phạm vi ảnh hưởng.