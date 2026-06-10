## Audit Summary
- Observation: Sau lần fix trước, block nội dung fullscreen đã tăng lên `z-30` để nằm trên overlay.
- Observation: Ở cả 2 nơi, dots fullscreen vẫn đang `z-20`, nên bị block nội dung che và không nhận click:
  - Site: `components/site/ComponentRenderer.tsx` (content `z-30`, dots `z-20`)
  - Preview admin: `app/admin/home-components/hero/_components/HeroPreview.tsx` (content `z-30`, dots `z-20`)
- Observation: Lỗi chỉ xuất hiện ở layout `fullscreen` vì các layout khác không có cùng stacking pattern này.
- Inference: Root cause là thứ tự lớp (stacking order), không phải lỗi state `currentSlide` hay handler `onClick`.
- Decision: Fix tối thiểu bằng cách nâng layer dots lên cao hơn content trong fullscreen ở cả site + preview để đồng bộ.

## Root Cause Confidence
- High — bằng chứng trực tiếp từ code hiện tại:
  - fullscreen content: `z-30`
  - fullscreen dots wrapper: `z-20`
- Counter-hypothesis đã loại trừ:
  1. Không phải lỗi event handler vì `onClick={() => setCurrentSlide(idx)}` đang đúng pattern.
  2. Không phải do data slide vì dots vẫn render đủ số lượng.
  3. Không phải do overlay gradient vì overlay đã thấp hơn content; phần che click hiện tại đến từ content layer.
- Pass/Fail criteria:
  - Pass: Dots fullscreen click được ở site renderer và preview admin.
  - Pass: Text/CTA vẫn nằm trên overlay, không quay lại lỗi “nền mờ đè chữ”.
  - Pass: Không ảnh hưởng style khác ngoài fullscreen.

## Proposal
1. Sửa `components/site/ComponentRenderer.tsx` (nhánh fullscreen):
   - tăng `z-index` của wrapper dots (ví dụ `z-40`) để nằm trên content `z-30`.
2. Sửa `app/admin/home-components/hero/_components/HeroPreview.tsx` (nhánh fullscreen):
   - áp dụng cùng quy tắc layering cho dots (`z-40`) để parity với site renderer.
3. Giữ nguyên logic chuyển slide, autoplay, animation duration; không thay đổi cấu trúc data.
4. Tự review tĩnh:
   - verify lớp theo thứ tự: image < overlay < content < dots.
   - verify dots vẫn hiển thị đúng màu active/inactive.

## Verification Plan
- Static review tại 2 file trên để xác nhận wrapper dots đã cao hơn content.
- Repro checklist cho tester:
  1. Ở admin preview fullscreen: click từng dot, slide đổi đúng.
  2. Ở site thật fullscreen: click từng dot, slide đổi đúng.
  3. Quan sát text/CTA vẫn rõ, không bị overlay đè.
- Theo guideline repo: chỉ chạy `bunx tsc --noEmit` nếu có thay đổi TS/code trước commit; không chạy lint/build/test.