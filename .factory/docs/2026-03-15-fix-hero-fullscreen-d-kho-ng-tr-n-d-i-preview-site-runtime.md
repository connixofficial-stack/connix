## Audit Summary
- **Observation:** Ở Hero Preview fullscreen, ảnh đang render bằng `object-contain` trong khung cao cố định (`desktop: h-[400px]`), nên ảnh 16:9 thường xuất hiện khoảng trống trên/dưới (letterbox).
  - Evidence: `app/admin/home-components/hero/_components/HeroPreview.tsx` (hàm `renderSlideWithContain`, class `object-contain`; fullscreen container tại `h-[400px]`).
- **Observation:** Site runtime Hero fullscreen cũng dùng cùng pattern `object-contain` + khung cao cố định (`md:h-[550px] lg:h-[650px]`) nên gặp hiện tượng tương tự ở desktop.
  - Evidence: `components/site/ComponentRenderer.tsx` (hàm `renderHeroSlideContain`, class `object-contain`; fullscreen container heights).
- **Observation:** Slider không lộ khoảng dư vì container theo `aspect-[21/9]` + max-height thấp hơn nên cảm giác “full” hơn.
  - Evidence: `HeroPreview.tsx` style slider (`aspect-[21/9] max-h-[280px]`), `ComponentRenderer.tsx` slider (`md:aspect-[21/9]`).

## Root Cause Confidence
- **High** — Nguyên nhân chính là mismatch giữa **tỷ lệ ảnh phổ biến (16:9)** và **khung fullscreen cao cố định** khi render bằng `object-contain`, nên bắt buộc phát sinh letterbox trên/dưới.
- Counter-hypothesis đã loại trừ:
  - Không phải do `BrowserFrame`/`PreviewWrapper` vì khoảng dư nằm bên trong vùng slide fullscreen.
  - Không phải do overlay text; tắt nội dung (`showFullscreenContent=false`) vẫn còn letterbox.

## Proposal (scope đúng theo bạn chọn)
Áp dụng **chỉ Hero fullscreen**, và **đồng bộ cả admin preview + site runtime**, giữ nguyên tất cả style khác.

### 1) Admin Preview: chỉnh fullscreen image fit
- File: `app/admin/home-components/hero/_components/HeroPreview.tsx`
- Thay đổi:
  - Mở rộng helper `renderSlideWithContain` để nhận `fit?: 'contain' | 'cover'`.
  - Ở style `fullscreen`, gọi helper với `fit: 'cover'`.
  - Giữ các style khác (`slider/fade/bento/split/parallax`) dùng behavior hiện tại (contain/cover như cũ), không đổi.
- Kết quả mong đợi: fullscreen preview desktop không còn dải dư trên/dưới.

### 2) Site runtime: chỉnh fullscreen image fit tương ứng
- File: `components/site/ComponentRenderer.tsx`
- Thay đổi:
  - Mở rộng helper `renderHeroSlideContain` nhận `fit?: 'contain' | 'cover'`.
  - Trong nhánh `style === 'fullscreen'`, truyền `fit: 'cover'`.
  - Không sửa nhánh style khác.
- Kết quả mong đợi: Hero fullscreen ngoài trang chủ hiển thị đồng nhất với preview, không dư trên/dưới.

### 3) Guardrails
- Không thay đổi chiều cao container fullscreen hiện tại.
- Không đụng logic color/overlay/content CTA/dots.
- Không đụng create/edit form behavior.

## Verification Plan
- Static review (không chạy lint/test/build theo guideline repo):
  1. Check diff chỉ chạm 2 file trên, chỉ ở helper image-fit + callsite fullscreen.
  2. Đảm bảo style ngoài fullscreen không đổi class `object-*` hiện hữu.
  3. Đảm bảo type-safe cho params `fit` (union type).
- Manual repro pass/fail criteria:
  - **Pass:** fullscreen ở `/admin/home-components/create/hero` và `/admin/home-components/hero/[id]/edit` (desktop) không còn dải dư trên/dưới; site homepage render fullscreen cũng tương tự.
  - **Fail:** còn letterbox rõ rệt ở fullscreen hoặc vô tình thay đổi các style khác.

Nếu bạn duyệt spec này, mình sẽ triển khai patch ngay theo đúng phạm vi trên.