## Audit Summary
- Observation: Header site đang render logo trong `components/site/Header.tsx`, với `logoInnerStyle` luôn có `backgroundColor: tokens.brandBadgeBg` và `overflow: hidden` tại vùng quanh dòng 240.
- Observation: Ở markup header classic/topbar/allbirds, ảnh logo đều nằm trong `<div style={logoInnerStyle}>`, nên logo PNG có vùng trong suốt hoặc tỷ lệ không vuông sẽ nhìn thấy nền thương hiệu phía sau (`components/site/Header.tsx:609-614`, các block tương tự ở các style khác).
- Observation: Preview editor đang copy cùng pattern và cũng set `backgroundColor: tokens.brandBadgeBg` trong `components/experiences/previews/HeaderMenuPreview.tsx:149-162`.
- Inference: Đây là lỗi do container logo áp nền mặc định, không phải do file logo hay CSS ngoài header.
- Decision: Sửa logic nền của `logoInnerStyle` để khi hiển thị ảnh logo thật thì không có nền màu phía sau; chỉ giữ màu/fallback cho trường hợp không có logo.

## Root Cause Confidence
- High — có evidence trực tiếp ở cả runtime và preview: `logoInnerStyle` đang hard-code `backgroundColor: tokens.brandBadgeBg`, trong khi ảnh logo được render bên trong cùng container có `overflow: hidden`. Với logo không vuông/transparent, phần nền này chắc chắn lộ ra.
- Counter-hypothesis đã loại trừ: `logoWrapStyle` chỉ thêm nền khi `logoBackgroundStyle` là `soft/shadow/solid`; nhưng default config đang là `'none'`, nên màu anh/chị thấy nằm ở `logoInnerStyle`, không phải lớp ngoài.

## Proposal
1. `components/site/Header.tsx`
   - Tách style logo inner thành 2 nhánh rõ ràng:
     - khi `logo` tồn tại: container giữ `display/flex/overflow`, nhưng bỏ `backgroundColor` và `color` để nền phía sau là transparent;
     - khi không có `logo`: giữ fallback hiện tại để không làm mất badge placeholder.
   - Giữ nguyên kích thước, bo góc và layout để không ảnh hưởng spacing/header width.
   - Nếu cần an toàn hơn, thêm `object-contain`/`display:block` ổn định cho ảnh nhưng không đổi behavior khác.

2. `components/experiences/previews/HeaderMenuPreview.tsx`
   - Mirror đúng logic runtime để preview editor không lệch với giao diện thật.
   - Chỉ sửa phần style/logo placeholder, không động vào token màu hay config schema.

3. Phạm vi không đụng tới
   - Không đổi admin settings.
   - Không đổi footer hay component khác vì issue hiện được mô tả ở header.
   - Không đổi `logoBackgroundStyle` feature hiện có; fix này chỉ đảm bảo khi style là `none`, logo không bị dính nền thương hiệu bên dưới.

## Verification Plan
- Static review:
  - Soát lại mọi chỗ render logo trong `Header.tsx` để dùng cùng một nhánh style sau khi sửa.
  - Soát preview `HeaderMenuPreview.tsx` để parity với runtime.
  - Kiểm tra null-safety cho case `logo` rỗng/falsy vẫn còn placeholder như cũ.
- Repro/pass criteria:
  1. Với logo PNG không vuông/có nền trong suốt, không còn thấy mảng màu thương hiệu phía dưới logo ở header.
  2. Với logo vuông bình thường, kích thước/căn hàng không đổi.
  3. Khi không có logo, placeholder hiện như trước.
  4. Preview trong editor cho kết quả giống site runtime.
- Theo guideline repo: không chạy lint/unit test/build; chỉ tự review tĩnh trước khi triển khai.

Nếu anh/chị duyệt spec này, em sẽ triển khai đúng phạm vi: site runtime + preview trong editor.