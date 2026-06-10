## Audit Summary

### TL;DR kiểu Feynman
- UI user muốn không phải “6 layout sáng tạo”, mà là 1 layout ecommerce rất rõ: cột danh mục trái + banner lớn phải kiểu Wolf/Sapo.
- Mẫu Wolf cho thấy danh mục phải là một **rail menu mảnh, đều, sát banner**, không phải card/grid marketing.
- Implementation hiện tại đã có `sidebar`, nhưng bị lệch vì rail đang render như card list, spacing quá to, và các variant khác làm lệch trọng tâm.
- Bean Đông Trùng không phải pattern chính cho component này; nó thiên về hero + block promo/grid hơn là rail category hero.
- Hướng đúng là thu gọn `HomepageCategoryHero` về **layout chuẩn chính duy nhất theo Wolf**, các layout còn lại nên hạ vai trò hoặc bỏ khỏi editor.
- Nếu tiếp tục giữ 6 layout, component sẽ tiếp tục sai mental model và khó giống mẫu user muốn.

### Observation / Inference / Decision
- Observation:
  - Ảnh user gửi và site `wolf-fix.mysapo.net` đều thể hiện pattern: trái là menu danh mục dọc, item mảnh, icon nhỏ, phải là banner hero lớn.
  - `components/site/HomepageCategoryHeroSection.tsx` hiện có `sidebar` nhưng item rail đang là `rounded-xl border shadow-sm px-3 py-3` kiểu card.
  - Cùng file này đang có thêm `stacked/split/centered/drawer/minimal`, làm component bị trôi khỏi use case chính.
  - `bean-dong-trung.mysapo.net` thiên về slider + banner phụ + category grid/promo blocks, không match trực tiếp ảnh user bằng Wolf.
- Inference:
  - Root problem không phải thiếu số lượng layout nữa, mà là **chọn sai abstraction**: biến một component chuyên biệt thành component đa-layout quá generic.
- Decision:
  - Refactor về một layout chuẩn Wolf-first, dùng `sidebar` làm canonical layout; preview/editor bám layout này.

### Audit câu hỏi bắt buộc
1. Triệu chứng: expected là UI giống Wolf/ảnh user gửi; actual là các layout hiện tại “tệ”, không đúng intent và thiếu cảm giác category-rail hero.
2. Phạm vi: ảnh hưởng runtime site, preview admin, trải nghiệm chọn layout trong create/edit của `HomepageCategoryHero`.
3. Tái hiện: có; vào create/edit hoặc xem runtime component hiện tại đều thấy layout bị card hóa / marketing hóa.
4. Mốc thay đổi gần nhất: component vừa được mở rộng thành 6 layout, nhưng expansion này không dựa trên mẫu UI user vừa xác nhận.
5. Dữ liệu còn thiếu: không cần thêm để chốt hướng, vì user đã chọn Wolf-first.
6. Giả thuyết thay thế: chỉ cần tweak spacing nhẹ là đủ; chưa đủ, vì vấn đề còn ở conceptual scope (giữ 6 layout không phù hợp).
7. Rủi ro nếu fix sai nguyên nhân: tiếp tục vá từng variant sẽ làm code phình to nhưng vẫn không ra đúng UI mẫu.
8. Pass/fail sau khi sửa: rail trái nhìn như menu danh mục Wolf, banner phải lớn/sạch, preview ≈ runtime, editor không còn gây nhiễu bởi các layout không cần thiết.

## Root Cause Confidence
**High** — User đã xác nhận Wolf là pattern chính, và evidence từ code hiện tại cho thấy component đang bị over-generalized.

### Root cause chính
1. `HomepageCategoryHero` đã bị mở rộng thành 6 style không bám mẫu chuẩn user cần.
2. Rail danh mục đang được render theo ngôn ngữ UI “card/grid section” thay vì “navigation rail”.
3. Preview/editor vẫn giữ tư duy chọn nhiều layout, trong khi nhu cầu thật là một layout canonical.

### Counter-hypothesis đã kiểm
- Hypothesis: Chỉ cần đổi màu/ảnh là đủ.
  - Bị loại trừ vì khác biệt nằm ở cấu trúc và visual hierarchy, không chỉ theme.
- Hypothesis: Bean + Wolf nên trộn đều thành nhiều variant.
  - Bị loại trừ vì user đã chọn rõ Option A: ưu tiên Wolf làm layout chuẩn chính.

## Files Impacted

### UI / runtime
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: render 6 style runtime.
  - Thay đổi: thu gọn thành Wolf-first canonical layout; rail trái đổi từ card list sang menu rail mảnh, đều, ít shadow, sát banner; giữ drawer hợp lý cho mobile/tablet.

### Admin preview / editor
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx`
  - Vai trò hiện tại: preview với selector nhiều style.
  - Thay đổi: preview tập trung vào canonical Wolf layout; nếu còn selector thì hạ còn tối đa 1–2 mode phụ trợ, hoặc bỏ hẳn selector.
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/constants.ts`
  - Vai trò hiện tại: chứa 6 styles + default config.
  - Thay đổi: đổi contract style theo hướng canonical (`sidebar` là chuẩn), cân nhắc loại bỏ/ẩn 5 style còn lại khỏi editor.
- `Sửa: app/admin/home-components/homepage-category-hero/_types/index.ts`
  - Vai trò hiện tại: chứa union 6 styles.
  - Thay đổi: thu hẹp union style nếu quyết định bỏ layout thừa; hoặc giữ backward-compatible nhưng chỉ expose `sidebar` cho editor.
- `Sửa: app/admin/home-components/create/homepage-category-hero/page.tsx`
  - Vai trò hiện tại: create giữ state style.
  - Thay đổi: bỏ/ẩn chọn layout nếu chỉ còn canonical layout.
- `Sửa: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: edit giữ state style.
  - Thay đổi: normalize dữ liệu cũ về canonical layout hoặc chỉ cho chỉnh Wolf layout.

## Hướng refactor đề xuất

### Option A (Recommend) — Confidence 92%
**Wolf-first canonical layout**
- Chỉ giữ `sidebar` là layout chuẩn chính cho `HomepageCategoryHero`.
- Refactor rail trái thành menu navigation thực thụ:
  - item thấp hơn, ít padding hơn
  - border nhẹ, gần như không shadow
  - icon/thumb nhỏ, text một hàng rõ ràng
  - chiều cao rail tiệm cận banner, overflow nội bộ nếu category dài
  - khoảng cách giữa rail và banner chặt hơn
- Banner phải lớn, sạch, ít “marketing chrome” hơn.
- Mobile/tablet: fallback drawer/accordion hợp lý nhưng vẫn cùng mental model.

**Vì sao recommend:** đúng intent user nhất, ít ambiguity, đúng pattern Wolf/Sapo nhất, giảm technical debt từ 6 UI sai hướng.

### Option B — Confidence 63%
**Giữ 2 mode: Wolf canonical + compact fallback**
- Một mode chuẩn `sidebar`
- Một mode phụ `drawer` hoặc `compact`
- Editor chỉ expose 2 lựa chọn

**Phù hợp khi:** cần linh hoạt thêm cho site khác device/context, nhưng vẫn không muốn generic hóa quá mức.

## Execution Preview
1. Đọc lại `HomepageCategoryHeroSection.tsx` và xác định phần render `sidebar` hiện tại.
2. Refactor rail item từ card sang menu item, chỉnh spacing/height/overflow theo Wolf.
3. Giảm nhiễu ở hero banner: overlay/text/button bám mẫu hơn.
4. Thu hẹp preview/editor để canonical hóa layout Wolf-first.
5. Giữ backward compatibility dữ liệu cũ bằng normalize style → `sidebar`.
6. Review tĩnh type + preview/runtime parity.

## Acceptance Criteria
- Runtime desktop hiển thị cột danh mục trái và banner lớn phải gần giống mental model của Wolf.
- Rail danh mục không còn cảm giác card/grid marketing; nhìn như menu rail thương mại điện tử.
- Preview admin phản ánh đúng runtime, không còn 6 UI gây nhiễu.
- Dữ liệu cũ không bị vỡ; component cũ vẫn render an toàn sau normalize.
- Mobile/tablet vẫn usable qua drawer/compact behavior mà không phá layout desktop.

## Verification Plan
- Static review:
  - kiểm tra rail item className đã giảm shadow/padding/rounded đúng hướng
  - kiểm tra layout desktop vẫn là 2 cột trái/phải ổn định
  - kiểm tra preview/editor không còn expose các layout sai intent
  - kiểm tra normalize style cho dữ liệu cũ
- Typecheck: nếu user duyệt triển khai code, chạy `bunx tsc --noEmit` theo rule repo.
- Repro cho tester:
  1. Mở create/edit của `HomepageCategoryHero`
  2. Xem preview desktop có rail trái + banner phải đúng pattern Wolf
  3. Lưu và mở runtime site
  4. Đối chiếu preview/runtime
  5. Kiểm tra mobile/tablet fallback

## Risk / Rollback
- Risk: nếu xóa style quá mạnh tay sẽ ảnh hưởng dữ liệu cũ đang lưu variant khác.
- Rollback an toàn: giữ normalize map tất cả style cũ về `sidebar` thay vì xóa cứng ngay từ đầu.

## Out of Scope
- Làm slider tự động nhiều banner như theme Sapo hoàn chỉnh.
- Dựng mega-menu đa tầng/hovers phức tạp giống storefront production.
- Chuẩn hóa các block khác trên homepage theo Wolf/Bean.

## Kết luận
Đúng vấn đề ở đây không phải “6 UI chưa đủ đẹp”, mà là **component bị định nghĩa sai mục tiêu**. Với input mới của bạn, `HomepageCategoryHero` nên được refactor về **1 layout chuẩn Wolf-first**: rail danh mục trái + banner phải, và toàn bộ preview/editor phải phục vụ đúng layout chuẩn đó, thay vì tiếp tục duy trì 6 variant lệch ý.