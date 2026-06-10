## Audit Summary

### Observation
- Trang cấu hình `app/system/experiences/menu/page.tsx` hiện chỉ có 1 toggle `Sticky header` và nó bind trực tiếp vào `config.headerSticky`.
- Preview `components/experiences/previews/HeaderMenuPreview.tsx` dùng duy nhất `config.headerSticky` để quyết định `classicPositionClass = config.headerSticky ? 'sticky top-0 z-40' : 'relative z-40'`.
- Site runtime `components/site/Header.tsx` cũng dùng đúng 1 cờ `config.headerSticky ?? true` để áp sticky cho toàn bộ header ở mọi viewport.
- Vì chỉ có một boolean chung, hiện không thể đáp ứng case desktop bật nhưng mobile tắt, hoặc ngược lại.

### Root cause Q&A
1. Triệu chứng: UI có toggle sticky nhưng hành vi đang global cho mọi breakpoint; expected là tách theo desktop/mobile.
2. Phạm vi ảnh hưởng: experience menu editor, preview header menu, site runtime header.
3. Tái hiện: ổn định; chỉ cần vào `/system/experiences/menu`, bật/tắt sticky rồi xem preview/site ở desktop và mobile.
4. Mốc thay đổi gần nhất: config hiện tại vẫn theo shape cũ với `headerSticky` boolean đơn.
5. Dữ liệu thiếu: không thiếu cho hướng fix nhỏ, backward-compatible.
6. Giả thuyết thay thế chưa bị loại trừ: có thể giải bằng enum mode (`off/mobile/desktop/both`), nhưng repo hiện đang theo pattern toggle boolean nên không tối ưu cho thay đổi nhỏ.
7. Rủi ro fix sai nguyên nhân: nếu chỉ sửa preview mà không sửa runtime/config persistence thì preview ≠ site.
8. Pass/fail: có 2 toggle riêng; save/load đúng; preview và site cùng phản ánh đúng từng breakpoint; dữ liệu cũ không vỡ.

## Root Cause Confidence
High — evidence rõ ở 3 điểm nối config/editor/preview/runtime đều đang phụ thuộc vào một field `headerSticky` duy nhất.

## Proposal

### Hướng recommend
Mở rộng config theo kiểu backward-compatible:
- Giữ `headerSticky?: boolean` để tương thích dữ liệu cũ.
- Thêm:
  - `headerStickyDesktop?: boolean`
  - `headerStickyMobile?: boolean`
- Rule normalize:
  - Nếu 2 field mới chưa có, fallback từ `headerSticky`.
  - Default đề xuất: desktop `true`, mobile `true` khi đọc dữ liệu cũ; sau khi user chỉnh mới sẽ lưu rõ 2 field mới.

### File dự kiến thay đổi
1. `components/experiences/previews/HeaderMenuPreview.tsx`
   - Mở rộng type `HeaderMenuConfig` với 2 field mới.
   - Tạo helper resolve sticky theo device:
     - desktop/tablet dùng `headerStickyDesktop`
     - mobile dùng `headerStickyMobile`
     - fallback về `headerSticky` nếu field mới chưa tồn tại.
   - Thay `classicPositionClass` global bằng class theo device đã resolve.
   - Áp dụng thống nhất cho classic/topbar/allbirds vì cả 3 đều reuse biến position class.

2. `app/system/experiences/menu/page.tsx`
   - `DEFAULT_CONFIG` thêm 2 field mới.
   - `serverConfig` normalize dữ liệu cũ sang 2 field mới theo fallback từ `raw?.headerSticky`.
   - Thay 1 toggle `Sticky header` thành 2 toggle rõ nghĩa, ví dụ:
     - `Sticky desktop`
     - `Sticky mobile`
   - Giữ thay đổi nhỏ, chỉ hiển thị trong block `Giao diện Classic` hiện tại nếu muốn bám scope hiện tại; hoặc nếu muốn đúng logic hơn thì đặt ở block `Hiển thị` vì topbar/allbirds cũng dùng sticky. Tôi recommend chuyển sang block dùng chung để tránh hiểu nhầm chỉ classic mới bị ảnh hưởng.
   - `handleSave` lưu kèm 2 field mới; có thể giữ `headerSticky` như derived field (`desktop || mobile` hoặc desktop) nhưng tốt nhất là không còn dùng cho logic mới, chỉ giữ để tương thích đọc cũ.

3. `components/site/Header.tsx`
   - Mở rộng `HeaderConfig` với 2 field mới.
   - Tạo helper detect viewport theo CSS-class strategy thay vì JS listener để giữ thay đổi nhỏ:
     - render wrapper class theo breakpoint, ví dụ dùng `lg:sticky lg:top-0` cho desktop và `sticky top-0 lg:static` cho mobile là không đủ khi cần kết hợp nhiều mode.
   - Recommend cách an toàn hơn: tính class string theo 4 case:
     - cả 2 bật → `sticky top-0 z-50`
     - chỉ desktop bật → `relative z-50 lg:sticky lg:top-0`
     - chỉ mobile bật → `sticky top-0 z-50 lg:relative`
     - cả 2 tắt → `relative z-50`
   - Dùng cùng helper normalize fallback từ `headerSticky` để không phá dữ liệu cũ.

### Chi tiết logic normalize đề xuất
- `resolveStickyConfig(config)` trả về:
  - `desktop = config.headerStickyDesktop ?? config.headerSticky ?? true`
  - `mobile = config.headerStickyMobile ?? config.headerSticky ?? true`
- Preview dùng `device` để chọn đúng boolean.
- Site runtime dùng helper tạo class responsive từ cặp boolean.

## Counter-hypothesis
- Có thể đổi sang 1 select mode: `none / desktop / mobile / both`.
- Không recommend vì trái pattern toggle hiện có, tăng migration UI, và ít trực quan hơn cho editor hiện tại.

## Post-Audit / Impact
- Scope nhỏ, rollback dễ.
- Không đụng data model Convex riêng vì config đang lưu blob trong setting `header_config`.
- Cần đảm bảo preview và runtime cùng dùng chung rule fallback để tránh lệch.

## Verification Plan
- Static review:
  - kiểm tra type `HeaderMenuConfig` và `HeaderConfig` không còn chỗ nào assume chỉ có `headerSticky`.
  - kiểm tra fallback dữ liệu cũ hoạt động khi thiếu 2 field mới.
- Repro thủ công sau implement:
  1. Mở `/system/experiences/menu`.
  2. Set desktop on, mobile off → preview desktop sticky, preview mobile không sticky.
  3. Save rồi reload → state vẫn giữ đúng.
  4. Kiểm tra site runtime cùng behavior.
  5. Set mobile on, desktop off → verify ngược lại.
- Theo repo guideline: nếu có thay đổi TS/code thì trước commit chạy `bunx tsc --noEmit`; không chạy lint/build/test.
- Khi hoàn tất sẽ commit local, không push.

Nếu bạn duyệt spec này, tôi sẽ triển khai theo hướng backward-compatible với 2 toggle riêng cho desktop/mobile và giữ fallback cho dữ liệu cũ.