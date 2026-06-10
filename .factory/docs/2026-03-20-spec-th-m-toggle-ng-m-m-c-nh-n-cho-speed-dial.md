## TL;DR kiểu Feynman
- Bộ showcase của anh không chỉ là 6 layout đẹp, mà còn có hành vi chung: speed dial mặc định đóng (`isOpen = false`) và bấm nút `+` mới mở action list.
- Code hiện tại của dự án đang render các action luôn mở, nên phần “hồn” của showcase chưa được mang qua đầy đủ.
- Em sẽ bổ sung toggle đóng/mở cho cả create, edit và site render; mặc định luôn đóng.
- Khi đang đóng, chỉ còn nút `+` và nút lên đầu trang nếu có, đúng như anh vừa chốt.
- Em đề xuất không thêm setting mới vào schema vì anh đã chốt behavior cố định: luôn có toggle và mặc định đóng.

## Audit Summary
### Observation
- Trong showcase `C:\Users\VTOS\Downloads\speed-dial-showcase\components\speed-dials\SpeedDial1.tsx` đến `SpeedDial4.tsx` (và các file còn lại cùng pattern), mỗi component đều có `const [isOpen, setIsOpen] = useState(false)`.
- Các action trong showcase chỉ render khi `isOpen === true` thông qua `AnimatePresence`.
- Renderer hiện tại của dự án ở `app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx` không có state toggle; các action đang hiển thị thường trực.
- `SpeedDialConfig` hiện chỉ có `actions`, `style`, `position`; chưa có field toggle/defaultOpen.
- `SpeedDialForm` hiện chưa có phần cấu hình toggle, nhưng vì anh đã chốt behavior cố định nên không bắt buộc thêm setting vào form.

### Root cause answers
1. Triệu chứng: speed dial hiện tại luôn mở; expected là mặc định đóng và chỉ mở khi bấm nút toggle `+`.
2. Phạm vi ảnh hưởng: create preview, edit preview và site render của Speed Dial.
3. Tái hiện ổn định: có; mở create/edit/site là thấy action list đang luôn hiển thị.
4. Mốc thay đổi gần nhất: lần triển khai trước mới port layout nhưng chưa port state toggle từ showcase.
5. Dữ liệu còn thiếu: không thiếu thêm vì user đã chốt behavior cố định.
6. Giả thuyết thay thế đã loại trừ: không phải do thiếu action data hay thiếu style mapping; vấn đề là renderer chưa có state `isOpen` và closed-state UI.
7. Rủi ro nếu fix sai nguyên nhân: preview/site có thể vẫn lệch showcase hoặc toggle không đồng nhất giữa 6 style.
8. Tiêu chí pass/fail: mọi style đều mặc định đóng, chỉ hiện nút `+` và nút lên đầu trang (nếu có); bấm `+` thì action list mở theo layout tương ứng.

## Root Cause Confidence
**High** — evidence trực tiếp từ showcase code (`useState(false)` + conditional render) và renderer hiện tại cho thấy thiếu toggle behavior là nguyên nhân chính.

## Files Impacted
### UI
- `Sửa: app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`
  - Vai trò hiện tại: renderer trung tâm cho create/edit/site.
  - Thay đổi: thêm state toggle chung, closed-state UI, và render action list có điều kiện theo `isOpen` cho cả 6 layout.
- `Có thể sửa nhẹ: app/admin/home-components/speed-dial/_components/SpeedDialPreview.tsx`
  - Vai trò hiện tại: wrapper preview admin.
  - Thay đổi: chỉ nếu cần reset state theo style/device hoặc truyền key để preview ổn định.
- `Không bắt buộc sửa: app/admin/home-components/create/speed-dial/page.tsx`
  - Vai trò hiện tại: assemble form + preview create.
  - Thay đổi: chỉ wiring nhỏ nếu cần reset preview theo config mới.
- `Không bắt buộc sửa: app/admin/home-components/speed-dial/[id]/edit/page.tsx`
  - Vai trò hiện tại: assemble form + preview edit.
  - Thay đổi: tương tự create nếu cần refresh state preview.

### Shared
- `Có thể sửa: app/admin/home-components/speed-dial/_types/index.ts`
  - Vai trò hiện tại: schema TS cho config.
  - Thay đổi: hiện tại em đề xuất không thêm field mới vì behavior đã fixed; file này nhiều khả năng không cần đổi.
- `Có thể sửa: app/admin/home-components/speed-dial/_lib/constants.ts`
  - Vai trò hiện tại: default config/style metadata.
  - Thay đổi: chỉ nếu cần note rõ default closed trong metadata nội bộ; không bắt buộc đổi schema.

## Execution Preview
1. Audit từng renderer layout trong `SpeedDialSectionShared` để xác định phần nào là trigger `+`, phần nào là action list, phần nào là closed-state.
2. Thêm state `isOpen` dùng chung trong renderer component-level, mặc định `false`.
3. Refactor 6 layout để:
   - closed: chỉ hiện nút `+` và nút lên đầu trang nếu có;
   - open: hiện action list đúng layout showcase.
4. Đảm bảo cả preview admin và site render có cùng behavior toggle.
5. Review static: accessibility cho button toggle (`aria-expanded`, `aria-label`), keyboard focus, fallback khi action list rỗng.
6. Sau khi implement: chạy `bunx tsc --noEmit`, rồi commit local kèm `.factory/docs`.

## Proposal
### Option A (Recommend) — Confidence 95%
Thêm toggle state nội bộ vào renderer, mặc định luôn đóng, không thêm field mới vào DB/config.
- Vì sao tốt nhất: đúng yêu cầu anh vừa chốt, scope gọn, không cần migrate data, không làm form phức tạp hơn.
- Tradeoff: sau này nếu muốn một vài speed dial mặc định mở thì sẽ phải mở rộng schema ở task khác.

### Option B — Confidence 61%
Thêm field cấu hình như `defaultOpen` vào `SpeedDialConfig`, nhưng set mặc định là `false`.
- Phù hợp khi anh dự đoán sau này cần linh hoạt behavior theo từng component.
- Tradeoff: scope rộng hơn, phải sửa form/schema/load-save/backward compatibility, trong khi hiện tại chưa cần.

## Acceptance Criteria
- Tất cả 6 style của Speed Dial ở create, edit và site đều mặc định đóng.
- Khi đóng, chỉ hiện nút `+` và nút lên đầu trang nếu layout/context có hỗ trợ.
- Khi bấm toggle, action list mở ra theo đúng layout tương ứng từ showcase.
- Không đổi icon list, không đổi màu action, không đổi brand color contract.
- Không cần migrate dữ liệu cũ; các component cũ tự dùng behavior mặc định đóng.

## Verification Plan
- Static review: toggle state, aria-expanded, keyboard focus, empty actions, left/right position.
- Typecheck: `bunx tsc --noEmit` sau khi sửa TS/TSX.
- Repro cho tester:
  1. Mở create page, xác nhận từng style mặc định đóng.
  2. Bấm `+`, xác nhận action list mở đúng layout.
  3. Lưu component rồi vào edit/site, xác nhận behavior giống preview.
  4. Thử left/right position và số action 1–6.

## Counter-Hypothesis
- Có thể cần thêm setting bật/tắt toggle trong form. Nhưng anh đã chốt “luôn có toggle và mặc định đóng”, nên thêm setting lúc này là thừa scope.
- Có thể admin preview nên luôn mở để dễ nhìn. Nhưng anh đã chốt closed-state vẫn chỉ hiện `+` và nút lên đầu trang, nên preview cũng phải phản ánh thật.

## Out of Scope
- Không thêm animation library mới.
- Không thêm field config mới nếu đi theo Option A.
- Không thay đổi URL/icon/color validation.
- Không chỉnh các home-component khác.

## Risk / Rollback
- Rủi ro chính: preview/site parity có thể lệch nếu mỗi layout xử lý toggle riêng không thống nhất.
- Giảm rủi ro: gom state toggle vào shared renderer, dùng một contract chung cho cả preview và site.
- Rollback: revert renderer state logic; không cần rollback data/schema.

Nếu anh duyệt, em sẽ triển khai theo Option A: luôn có toggle, mặc định đóng, closed-state chỉ hiện `+` và nút lên đầu trang nếu có.