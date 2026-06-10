## Problem Graph
1. [Main] Marquee ở `/admin/home-components/partners/[id]/edit` chưa hợp lý, bị cảm giác dup và lệch với UI trang chủ <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Logic marquee hiện tại ở preview dùng `AutoScrollSlider` theo cách khác render thực tế (site section), dẫn tới khác spacing/tốc độ/nhân bản item
   1.2 [Sub] Thiếu “single source of truth” cho layout marquee (cùng markup + class + animation config)
   1.3 [Sub] Thiếu rule accessibility/perf cho marquee (reduced-motion, pause on hover/focus, key ổn định)

## Execution (with reflection)
1. Chuẩn hoá kiến trúc để preview và render dùng chung 1 khối marquee
   - Tạo shared marquee renderer cho Partners (ví dụ: `components/site/partners/PartnersMarqueeShared.tsx` hoặc `_shared` trong module partners) nhận props: `items`, `mode` (`preview|site`), `brandColor`, `isMono`, `className`.
   - Reflection: ✓ Cắt duplication tận gốc, đảm bảo đồng nhất UI.

2. Refactor `PartnersPreview.tsx` style `marquee` + `mono`
   - Bỏ markup marquee inline hiện tại, thay bằng shared marquee component ở bước 1.
   - Giữ phần khung PreviewWrapper/BrowserFrame như cũ, chỉ thay phần body style `marquee`/`mono`.
   - Reflection: ✓ Preview sẽ luôn bám sát render thật theo cùng source.

3. Refactor component render ở trang chủ cho Partners marquee
   - Tìm component render thật của Partners section (nhiều khả năng trong `components/site/*Partners*` hoặc renderer map) và thay phần marquee để dùng cùng shared marquee component.
   - Đồng bộ các thông số: item gap, height logo, fade edge, speed, pause behavior.
   - Reflection: ✓ Fix mismatch preview-vs-site đúng yêu cầu.

4. Áp dụng best-practice marquee (WebSearch)
   - Quy tắc triển khai:
     - Chỉ clone tối thiểu cho seamless loop (tránh dup dư thừa).
     - Tôn trọng `prefers-reduced-motion` (fallback thành static row hoặc tắt animation).
     - Pause khi hover/focus để tăng usability.
     - Dùng key ổn định theo id gốc + batch index (không random).
   - Reflection: ✓ Giảm bug visual + tốt cho a11y/performance.

5. Guard dữ liệu để tránh dup do input
   - Tại chỗ chuẩn bị `items` cho marquee: lọc item rỗng URL, chuẩn hoá link, và dedupe theo `url` + `link` (optional flag) trước khi đưa vào animation.
   - Không thay đổi dữ liệu lưu DB, chỉ normalize ở render layer để không phá dữ liệu cũ.
   - Reflection: ✓ Tránh hiện tượng logo bị lặp vì data bẩn.

6. Validation bắt buộc theo rule repo
   - Chạy `bunx tsc --noEmit` sau khi sửa code TS/TSX.
   - Nếu có lỗi, sửa hết trước khi kết thúc.
   - Reflection: ✓ Đúng AGENTS.md và tránh hồi quy kiểu mismatch type.

7. Commit sau khi pass validation (không push)
   - Commit message đề xuất: `fix(partners): unify marquee preview and site render, remove duplication`
   - Reflection: ✓ Đáp ứng rule “xong thay đổi code phải commit”.

## Files dự kiến tác động
- `app/admin/home-components/partners/_components/PartnersPreview.tsx` (refactor dùng shared marquee)
- file render thật của Partners ở site (sẽ xác định chính xác khi implement)
- thêm 1 shared component marquee mới cho Partners (để tái sử dụng giữa preview/render)

Nếu bạn duyệt spec này, mình sẽ implement ngay theo đúng các bước trên, chạy `bunx tsc --noEmit`, rồi commit (không push).