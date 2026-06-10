## TL;DR kiểu Feynman
- Hiện hệ thống đã có 6 style Speed Dial, nhưng giao diện 6 style này chưa giống bộ showcase anh làm.
- Em sẽ không chỉ sửa create nữa, mà sửa đồng bộ create, edit và render site để cùng một style nhìn giống nhau ở mọi nơi.
- Icon đang có, màu từng action, type color override và schema dữ liệu sẽ giữ nguyên; chỉ thay lớp thiết kế/render.
- Cách làm an toàn nhất là giữ nguyên 6 style id hiện có, rồi remap renderer của từng style sang 6 layout mới từ showcase.
- Như vậy dữ liệu cũ không phải migrate, rollback dễ, nhưng UI sẽ được nâng cấp đồng bộ.

## Audit Summary
### Observation
- Create page: `app/admin/home-components/create/speed-dial/page.tsx` đang dùng `SpeedDialForm` + `SpeedDialPreview`.
- Edit page: `app/admin/home-components/speed-dial/[id]/edit/page.tsx` cũng dùng cùng `SpeedDialForm` + `SpeedDialPreview`.
- Preview/site renderer thật nằm ở `app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`.
- 6 style hiện có được định nghĩa tại `app/admin/home-components/speed-dial/_lib/constants.ts` gồm: `fab`, `sidebar`, `pills`, `stack`, `dock`, `minimal`.
- Showcase anh cung cấp có 6 layout cụ thể tại `C:\Users\VTOS\Downloads\speed-dial-showcase\components\speed-dials\SpeedDial1..6.tsx`:
  - `SpeedDial1`: vertical stack tròn.
  - `SpeedDial2`: capsule/pill stack dọc.
  - `SpeedDial3`: reveal ngang.
  - `SpeedDial4`: edge attached, bám cạnh.
  - `SpeedDial5`: floating card.
  - `SpeedDial6`: glass capsule/glassmorphism.
- `SpeedDialForm` đang giữ toàn bộ behavior user muốn bảo toàn: icon options, label, URL, màu từng action, position trái/phải.

### Root cause answers
1. Triệu chứng: 6 style hiện tại không match 6 layout đẹp trong showcase; expected là create, edit và site cùng dùng 6 layout mới.
2. Phạm vi ảnh hưởng: admin create, admin edit, và site render của Speed Dial.
3. Tái hiện ổn định: có; chỉ cần mở create/edit hoặc render site của component Speed Dial và so với showcase.
4. Mốc thay đổi gần nhất: chưa cần truy commit; evidence đủ từ code renderer hiện tại và folder showcase.
5. Dữ liệu còn thiếu: không còn thiếu cho scope mới vì user đã chốt cần sửa đồng bộ create/edit/site.
6. Giả thuyết thay thế đã loại trừ: không phải thiếu style count hay thiếu form control; style count đủ 6, vấn đề nằm ở visual renderer của từng style.
7. Rủi ro nếu fix sai nguyên nhân: create/edit có thể đẹp nhưng site vẫn lệch, hoặc ngược lại; ngoài ra dữ liệu cũ có thể hiển thị không nhất quán nếu remap không chuẩn.
8. Tiêu chí pass/fail: chọn bất kỳ style nào ở create/edit thì preview và site render phải cùng một ngôn ngữ thiết kế theo showcase, không đổi schema và không mất color/icon behavior.

## Root Cause Confidence
**High** — evidence trực tiếp từ các file renderer hiện tại và 6 component showcase cho thấy vấn đề là implementation giao diện của 6 style, không phải data model hay validation.

## Files Impacted
### UI
- `Sửa: app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`
  - Vai trò hiện tại: renderer trung tâm cho preview admin và site render.
  - Thay đổi: remap toàn bộ 6 nhánh render hiện tại sang 6 layout mới theo showcase, nhưng vẫn dùng token màu, icon và dữ liệu action hiện có.
- `Sửa: app/admin/home-components/speed-dial/_components/SpeedDialPreview.tsx`
  - Vai trò hiện tại: wrapper preview cho create/edit.
  - Thay đổi: giữ wiring, chỉ chỉnh khi cần truyền props mới cho parity preview/site.
- `Sửa: app/admin/home-components/speed-dial/_lib/constants.ts`
  - Vai trò hiện tại: khai báo style ids và labels.
  - Thay đổi: cập nhật label hiển thị cho dễ hiểu hơn theo 6 layout showcase nếu cần, nhưng không đổi id lưu dữ liệu.
- `Có thể sửa nhẹ: app/admin/home-components/create/speed-dial/page.tsx`
  - Vai trò hiện tại: assemble form + preview cho create.
  - Thay đổi: chỉ wiring nhỏ nếu preview API đổi.
- `Có thể sửa nhẹ: app/admin/home-components/speed-dial/[id]/edit/page.tsx`
  - Vai trò hiện tại: assemble form + preview cho edit.
  - Thay đổi: chỉ wiring nhỏ nếu preview API đổi.

### Shared / styling logic
- `Có thể sửa: app/admin/home-components/speed-dial/_lib/colors.ts`
  - Vai trò hiện tại: cấp token màu/accessibility cho các style.
  - Thay đổi: bổ sung token phụ nếu layout mới cần nền capsule/card/glass/hover riêng mà vẫn giữ contract màu cũ.

## Execution Preview
1. Map 6 style ids hiện tại sang 6 layout showcase:
   - `fab` → Vertical Stack
   - `pills` → Pill Stack
   - `dock` → Horizontal Reveal
   - `sidebar` → Edge Attached
   - `stack` → Floating Card
   - `minimal` → Glassmorphism Capsule
2. Refactor `SpeedDialSectionShared` để mỗi style render lại đúng hình dáng showcase trên cả `context='preview'` và `context='site'`.
3. Giữ nguyên `SpeedDialForm`: icon, label, URL, bgColor action, position trái/phải.
4. Nếu cần, mở rộng token trong `colors.ts` cho border/backdrop/surface của card/glass nhưng vẫn tôn trọng brand colors hiện tại.
5. Rà parity create/edit/site, kiểm tra empty state, label overflow, action count 1–6, bottom-left/bottom-right.
6. Sau implement: chạy `bunx tsc --noEmit` rồi commit local, không push.

## Proposal
### Option A (Recommend) — Confidence 92%
Giữ nguyên 6 style ids hiện có, chỉ đổi renderer của 6 style để đồng bộ create + edit + site theo showcase.
- Vì sao tốt nhất: không phá schema, không migration dữ liệu cũ, ít rủi ro nhất nhưng vẫn đạt mục tiêu UI đồng bộ toàn hệ thống.
- Tradeoff: tên id nội bộ (`fab/sidebar/...`) không còn phản ánh chính xác 100% visual mới, nhưng UI label có thể xử lý để người dùng không bị bối rối.

### Option B — Confidence 68%
Ngoài việc đổi renderer, đổi luôn label style picker trong admin thành tên showcase như `Vertical Stack`, `Pill Stack`, `Horizontal`, `Edge Attached`, `Floating Card`, `Glass`.
- Phù hợp khi anh muốn trải nghiệm admin rõ nghĩa hơn.
- Tradeoff: scope lớn hơn nhẹ, phải kiểm kỹ chỗ hiển thị labels để không gây lệch wording cũ.

## Acceptance Criteria
- Trang create và edit của Speed Dial hiển thị cùng một bộ 6 layout mới, bám sát showcase anh cung cấp.
- Site render của Speed Dial dùng đúng cùng 6 layout đó, không còn lệch với preview admin.
- Icon options, icon render, label, URL, màu từng action, brand color và secondary color vẫn hoạt động như hiện tại.
- Dữ liệu submit/load vẫn dùng schema cũ: `actions`, `style`, `position`.
- Các component cũ đã lưu trong DB vẫn render được, không cần migrate.
- Bottom-right và bottom-left vẫn dùng được; riêng layout cạnh phải/trái sẽ được mirror hợp lý theo position.

## Verification Plan
- Static review: type safety, fallback colors, fallback icon, backward compatibility cho dữ liệu cũ.
- Typecheck: `bunx tsc --noEmit` vì có thay đổi TS/TSX.
- Repro cho tester:
  1. Tạo component mới, thử đủ 6 style.
  2. Edit component cũ, đổi qua lại giữa 6 style.
  3. Kiểm tra site render tương ứng với style đã chọn.
  4. Thử đổi màu action, brand color, vị trí trái/phải, số action từ 1 đến 6.

## Counter-Hypothesis
- Có thể chỉ cần sửa preview admin là đủ. User đã làm rõ là không, cần cả create, edit và render site tương ứng.
- Có thể cần đổi schema để lưu type style mới. Evidence hiện tại cho thấy không cần; 6 id hiện có đủ để ánh xạ 6 layout showcase.

## Out of Scope
- Không thêm icon mới.
- Không đổi validation URL/màu.
- Không thêm thư viện animation mới nếu có thể tận dụng CSS/Tailwind hiện có.
- Không mở rộng sang home-component khác.

## Risk / Rollback
- Rủi ro chính: remap visual khiến một số component cũ nhìn khác đáng kể sau deploy.
- Giảm rủi ro: giữ nguyên style ids, giữ nguyên data contract, chỉ thay renderer.
- Rollback: revert các file renderer/token là đủ, không cần rollback data.

Nếu anh duyệt, em sẽ triển khai theo Option A; nếu anh muốn label picker đổi theo tên showcase luôn thì em sẽ lấy Option B.