## Audit Summary
- Observation: Form Hero hiện render block `Nội dung Hero` cho 3 layout `fullscreen | split | parallax` trong cả create và edit, nhưng chưa có cờ bật/tắt riêng cho fullscreen. Evidence: `app/admin/home-components/hero/_components/HeroForm.tsx`, `app/admin/home-components/create/hero/page.tsx`.
- Observation: Preview fullscreen luôn render overlay gradient + text/CTA nếu có `content`. Evidence: `app/admin/home-components/hero/_components/HeroPreview.tsx` đoạn `renderFullscreenStyle`.
- Observation: Site renderer fullscreen cũng luôn render lớp gradient và khối text overlay. Evidence: `components/site/ComponentRenderer.tsx` dòng quanh 450-490.
- Observation: Config Hero đang lưu `style`, `slides`, `content`; chưa có field kiểm soát hiển thị nội dung fullscreen. Evidence: `app/admin/home-components/hero/_types/index.ts`, create/edit submit payload.
- Inference: Muốn “bật thì như hiện tại, tắt thì không có chữ hay vệt mờ đè slide” thì cần thêm một boolean trong `content` hoặc config và dùng boolean đó để chặn cả overlay gradient lẫn text/CTA ở preview + site renderer, nhưng chỉ khi `style === 'fullscreen'`.
- Decision: Thêm cờ boolean trong `HeroContent` theo hướng backward-compatible, mặc định `true` để dữ liệu cũ giữ nguyên UI hiện tại.

## Root Cause Confidence
- High — vì đã thấy trực tiếp 3 điểm render liên quan: form không có toggle, preview fullscreen luôn render overlay, site renderer fullscreen luôn render overlay. Không thấy cơ chế nào khác đang điều khiển việc ẩn/hiện nội dung fullscreen.
- Counter-hypothesis đã loại trừ: đây không chỉ là vấn đề preview/admin; `ComponentRenderer` ngoài site cũng lặp lại cùng logic nên nếu chỉ sửa admin sẽ bị lệch preview ≠ site.

## Proposal
1. Cập nhật schema/types Hero
   - File: `app/admin/home-components/hero/_types/index.ts`
   - Thêm field `showFullscreenContent?: boolean` vào `HeroContent`.
   - Giữ optional để không làm hỏng dữ liệu cũ.

2. Cập nhật default content
   - File: `app/admin/home-components/hero/_lib/constants.ts`
   - Thêm `showFullscreenContent: true` vào `DEFAULT_HERO_CONTENT`.
   - Mục tiêu: create mới giữ hành vi hiện tại ngay cả khi chưa tương tác toggle.

3. Thêm toggle ở form dùng chung Hero
   - File: `app/admin/home-components/hero/_components/HeroForm.tsx`
   - Chỉ khi `heroStyle === 'fullscreen'` thì render một toggle “Hiển thị nội dung Hero” ở đầu hoặc gần tiêu đề block.
   - Khi toggle OFF:
     - Không xoá dữ liệu `badge/heading/description/buttons`; chỉ ẩn tác động hiển thị.
     - Có thể disable nhẹ các field nội dung fullscreen để tránh hiểu nhầm, hoặc giữ editable. Tôi đề xuất giữ editable để user có thể bật lại mà không mất nội dung.

4. Đồng bộ create page với form dùng chung
   - File: `app/admin/home-components/create/hero/page.tsx`
   - Hiện create đang duplicate form riêng thay vì tái dùng `HeroForm`.
   - Để thay đổi nhỏ nhất, có 2 hướng:
     - Recommend: thay create page sang dùng `HeroForm` như edit để tránh logic toggle bị lệch create/edit.
     - Nếu muốn minimal diff tuyệt đối: thêm toggle tương tự ngay trong form hiện tại của create page.
   - Tôi nghiêng về tái dùng `HeroForm` vì repo đã có component sẵn và user yêu cầu cả edit + create tương ứng.

5. Cập nhật preview fullscreen
   - File: `app/admin/home-components/hero/_components/HeroPreview.tsx`
   - Trong `renderFullscreenStyle`, tính `const showFullscreenContent = c.showFullscreenContent !== false`.
   - Chỉ render:
     - gradient overlay `bg-gradient-to-r...`
     - khối badge / heading / description / buttons
     khi `showFullscreenContent` là true.
   - Slide indicators vẫn giữ nguyên vì user chỉ yêu cầu bỏ chữ và vệt mờ đè slide.

6. Cập nhật site renderer thực tế
   - File: `components/site/ComponentRenderer.tsx`
   - Bổ sung cùng logic `showFullscreenContent !== false` trong fullscreen branch.
   - Chỉ bỏ gradient overlay và block content; giữ slideshow/nav hiện tại.

7. Tương thích dữ liệu cũ
   - Không cần migration vì field optional + default true.
   - Component cũ không có field này vẫn hiển thị như hiện tại.

## Verification Plan
- Static review:
  - Kiểm tra type `HeroContent` compile-consistent tại create/edit/preview/site renderer.
  - Soát nhánh `fullscreen` để bảo đảm khi OFF không còn render gradient/text/buttons, còn các style khác không bị ảnh hưởng.
  - Soát payload submit create/edit để field mới được lưu cùng `content` khi style cần content.
- Repro checklist cho tester:
  1. Vào `/admin/home-components/create/hero`, chọn style `fullscreen`.
  2. Toggle ON: preview giữ nguyên như hiện tại.
  3. Toggle OFF: preview không còn badge, heading, description, buttons và không còn lớp mờ phủ ảnh.
  4. Lưu component, mở trang site tương ứng: fullscreen hero cũng không còn chữ/vệt mờ.
  5. Bật lại toggle: nội dung cũ xuất hiện lại, không mất dữ liệu đã nhập.
  6. Chuyển sang `split` hoặc `parallax`: toggle không xuất hiện.
  7. Mở component Hero cũ chưa có field mới: vẫn hiển thị như hiện tại.
- Typecheck:
  - Theo guideline repo, chỉ chạy `bunx tsc --noEmit` sau khi implement vì có thay đổi TS/code.

## Phạm vi thay đổi dự kiến
- `app/admin/home-components/hero/_types/index.ts`
- `app/admin/home-components/hero/_lib/constants.ts`
- `app/admin/home-components/hero/_components/HeroForm.tsx`
- `app/admin/home-components/create/hero/page.tsx`
- `app/admin/home-components/hero/_components/HeroPreview.tsx`
- `components/site/ComponentRenderer.tsx`

Nếu bạn duyệt spec này, tôi sẽ triển khai đúng phạm vi trên và giữ thay đổi nhỏ nhất có thể.