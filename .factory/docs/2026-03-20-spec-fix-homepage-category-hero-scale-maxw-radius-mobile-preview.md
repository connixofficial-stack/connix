## Audit Summary
- Observation: `HomepageCategoryHeroSection` đang hard-code container chính ở `max-w-6xl`/`max-w-7xl`, trong khi user muốn riêng component này rộng hơn. Evidence: `components/site/HomepageCategoryHeroSection.tsx` dùng `max-w-6xl` cho `containerClass` và `max-w-7xl` cho wrapper section.
- Observation: Các variant sidebar/classic/flush/minimal/soft đang dùng bo góc khá lớn (`rounded-2xl`, `rounded-[2rem]`, `rounded-[1.5rem]`). Evidence: cùng file, ở `containerClass`, `sidebarClass`, `mobilePanelClass`, `megaPanelBase`.
- Observation: Preview admin chỉ bọc `HomepageCategoryHeroSection` trong `BrowserFrame`, nên parity logic runtime đã khá tốt; vấn đề lệch chủ yếu nằm ở scale tổng thể desktop/mobile và framing preview chưa làm nổi layout mobile. Evidence: `app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx` render trực tiếp section runtime.
- Observation: Create và edit cùng dùng chung `HomepageCategoryHeroPreview`, nên fix ở preview/runtime sẽ tự áp cho cả 2 route user nêu.

## Root Cause Confidence
**High** — Vấn đề không nằm ở data/config pipeline mà ở lớp trình bày runtime dùng kích thước khung quá hẹp, bo góc lớn và layout mobile trong preview chưa được scale/framed đủ trực quan. Evidence trực tiếp nằm trong các class Tailwind của `HomepageCategoryHeroSection.tsx` và wrapper preview hiện tại.

## TL;DR kiểu Feynman
- Khối hero hiện đang bị “đóng khung” hơi chật nên nhìn tổng thể nhỏ.
- Mình sẽ nới khung component này lên chuẩn gần `8xl` như anh yêu cầu.
- Đồng thời giảm bo góc còn khoảng một nửa để giao diện bớt “bầu”.
- Preview mobile không cần viết lại logic mới; chỉ cần đồng bộ scale/frame theo layout site thật để nhìn sát hơn.
- Vì create và edit dùng chung preview, sửa một chỗ sẽ ăn cả hai màn.

## Files Impacted
### UI runtime / preview
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: render site thật và cũng là lõi cho preview admin.
  - Thay đổi: tăng scale tổng thể khoảng 20% bằng cách nới các width/height/padding/gap chính, đổi outer wrapper sang `max-w-8xl` cho component này, giảm các radius chủ đạo xuống khoảng một nửa, và tinh chỉnh mobile layout để trực quan hơn nhưng vẫn giữ structure site hiện tại.
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx`
  - Vai trò hiện tại: bọc runtime section vào khung preview device.
  - Thay đổi: tinh chỉnh framing preview mobile/tablet nếu cần để phần hero chiếm diện tích hợp lý hơn trong BrowserFrame, bảo đảm cảm giác gần site thật hơn mà không tách riêng logic render.

### Shared contract (chỉ nếu cần tối thiểu)
- `Có thể giữ nguyên: app/admin/home-components/create/homepage-category-hero/page.tsx`
  - Vai trò hiện tại: state create + truyền config sang preview.
  - Thay đổi: dự kiến không cần đổi vì preview đã dùng chung runtime component.
- `Có thể giữ nguyên: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: hydrate/edit state + truyền config sang preview.
  - Thay đổi: dự kiến không cần đổi vì preview đã dùng chung runtime component.

## Root Cause / Counter-Hypothesis
1. Triệu chứng: tổng thể component nhìn nhỏ hơn mong muốn; preview mobile chưa đủ trực quan so với site thật.
2. Phạm vi: create/edit preview và runtime site của riêng `homepage-category-hero`.
3. Tái hiện: ổn định vì class đang hard-code trong component runtime.
4. Mốc thay đổi gần nhất: component vừa được mở rộng nhiều layout/style, nên scale/radius hiện là dư âm của preset cũ thiên “compact”.
5. Dữ liệu thiếu: chưa có screenshot pixel-perfect từ user, nhưng yêu cầu định tính đã đủ rõ để chỉnh theo scope nhỏ.
6. Giả thuyết thay thế đã cân nhắc: không phải do preview tách riêng logic khỏi site; preview đang gọi thẳng runtime section.
7. Rủi ro fix sai nguyên nhân: nếu chỉ sửa BrowserFrame mà không sửa runtime class, site thật vẫn nhỏ.
8. Pass/fail: runtime và preview cùng rộng hơn rõ rệt, container đạt 8xl, bo góc giảm thấy rõ, mobile preview sát site hơn.

## Proposal
1. Chuẩn hóa wrapper ngoài của `HomepageCategoryHeroSection` lên `max-w-8xl` riêng cho component này.
2. Tăng scale tổng thể khoảng 20% theo hướng bảo thủ:
   - tăng chiều cao hero desktop/mobile,
   - tăng width sidebar/top-nav chip/panel hợp lý,
   - tăng padding/gap/font-size ở các vùng chính nếu đang quá compact,
   - không đụng data logic/generator.
3. Giảm radius các container/panel/chip chính còn khoảng 1/2 so với hiện tại:
   - `rounded-2xl` -> khoảng `rounded-xl`,
   - `rounded-[2rem]` -> khoảng `rounded-2xl`,
   - `rounded-[1.5rem]` -> khoảng `rounded-xl`.
4. Giữ preview dùng chung `HomepageCategoryHeroSection`, chỉ chỉnh wrapper preview nếu cần để mobile frame hiển thị đúng tỷ lệ trực quan hơn.
5. Review tĩnh lại các variant `sidebar/classic/flush/minimal/soft/top-nav` để tránh variant nào bị scale lệch quá mạnh.

## Execution Preview
1. Đọc/chỉnh `HomepageCategoryHeroSection.tsx` để gom các token class cần scale/radius.
2. Cập nhật max-width lên 8xl và nới các size chính ~20%.
3. Giảm radius toàn bộ các khối chính theo cùng một nhịp.
4. Soát mobile-specific layout/panel để preview nhìn giống site thật hơn.
5. Chỉ nếu cần mới chạm `HomepageCategoryHeroPreview.tsx` để chỉnh framing.
6. Review tĩnh TypeScript/Tailwind classes và chuẩn bị commit.

## Acceptance Criteria
- Ở create/edit, preview của `homepage-category-hero` nhìn lớn hơn rõ rệt, không còn cảm giác “nhỏ toàn bộ”.
- Runtime component dùng `max-w-8xl` cho khung ngoài.
- Các góc bo chính giảm còn khoảng một nửa, nhìn gọn hơn.
- Preview mobile bám structure site thật, không còn cảm giác khác biệt rõ về tỷ lệ/độ trực quan.
- Không thay đổi contract config, không ảnh hưởng generator/data hiện có.

## Verification Plan
- Static review: rà lại tất cả variant trong `HomepageCategoryHeroSection.tsx` để chắc không có class mâu thuẫn giữa desktop/mobile.
- Typecheck: sau khi user duyệt spec và mình implement, sẽ chạy `bunx tsc --noEmit` theo guideline repo.
- Repro thủ công cho tester:
  1. mở create route user đưa,
  2. mở edit route user đưa,
  3. so desktop/mobile preview giữa trước và sau,
  4. đối chiếu với render site thật của component.

## Out of Scope
- Không đổi generator, dữ liệu category, business logic hover/menu.
- Không thêm layout/style mới.
- Không chỉnh các home-component khác.

## Risk / Rollback
- Risk: tăng scale có thể làm một số variant chạm ngưỡng cao/thấp hơn dự kiến ở desktop nhỏ.
- Rollback: revert tập trung chủ yếu ở `HomepageCategoryHeroSection.tsx` và có thể `HomepageCategoryHeroPreview.tsx`, khá an toàn.

Nếu anh duyệt spec này, em sẽ triển khai đúng scope nhỏ: tăng scale ~20%, chuyển max-width lên 8xl, giảm bo góc, rồi chỉnh preview mobile bám site thật hơn.