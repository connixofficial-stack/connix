## Audit Summary

### TL;DR kiểu Feynman
- Hiện component đã tiến gần đúng hướng, nhưng có 4 lỗi UX còn khá rõ: hover desktop chưa ổn định, hero slider chưa vuốt mượt và còn gây cảm giác scroll ngang, auto-generate chưa tận dụng ảnh sản phẩm thật, và danh mục cha chưa có CTA đủ rõ.
- Vấn đề không chỉ là CSS; nó nằm ở interaction model của desktop flyout, touch behavior của slider, và contract dữ liệu auto-gen còn thiếu ảnh/CTA cho root category.
- Tôi sẽ sửa theo hướng product hóa hơn: desktop flyout ổn định hơn, slider vuốt mượt hơn, mỗi danh mục auto-gen có ảnh đại diện “sống” hơn, và panel/menu có CTA như “Xem tất cả”.
- Mục tiêu là: mở menu chắc tay hơn, duyệt banner dễ hơn, menu sinh ra nhìn giàu nội dung hơn, và root category không còn là item “chỉ để nhìn”.
- Tôi giữ scope nhỏ và rollback dễ: sửa trong đúng component + form/types/constants + query aggregate liên quan.

### Observation / Inference / Decision
- Observation:
  - `components/site/HomepageCategoryHeroSection.tsx` đang để `activeCategoryId` mặc định `null`, desktop mở bằng `onMouseEnter`, đóng bằng `onMouseLeave` ở wrapper ngoài. Điều này dễ gây cảm giác hover không ổn định ở item đầu khi con trỏ chuyển vùng nhanh hoặc lúc panel chồng vị trí nhạy.
  - Desktop flyout hiện render riêng từng item bằng `absolute left-6 top-6 ... w-[620px]`, nhưng chưa có “root CTA/header” nên danh mục cha nhìn như không click được.
  - `BannerSlider` đang dùng `overflow-x-auto snap-x snap-mandatory`; cách này cho scroll snap cơ bản nhưng dễ tạo cảm giác kéo ngang trang, nhất là khi ảnh nằm trong `Link` overlay full area.
  - Auto-generate hiện chỉ dùng score danh mục + ảnh category; chưa lấy ảnh sản phẩm thật từ category nên chất lượng thị giác còn kém.
  - Auto-generate hiện sinh nhóm/link con nhưng chưa sinh CTA root-level như “Xem tất cả {danh mục}”.
- Inference:
  - Để “hover vào danh mục đầu thì sổ ra chắc chắn”, cần đổi lifecycle desktop từ hover rời rạc sang state machine rõ hơn: open on enter/focus, giữ mở khi pointer ở sidebar hoặc panel, close có delay nhỏ hoặc leave đúng boundary.
  - Để slider vuốt đúng, nên bỏ kiểu scroll ngang thô và chuyển sang touch-friendly carousel logic điều khiển bằng translate/drag hoặc ít nhất khóa overflow ngang ngoài slider + tránh Link cản drag.
  - Để auto-gen mạnh hơn, cần enrich dữ liệu với ảnh sản phẩm representative theo category.
- Decision:
  - Tôi đề xuất một spec gồm 4 cụm: fix hover/flyout desktop, refactor slider touch behavior, enrich auto-gen với ảnh sản phẩm representative, và thêm CTA root category cho runtime/menu.

### Audit câu hỏi bắt buộc
1. Triệu chứng: expected là hover desktop mở chắc chắn, hero vuốt được, không dính scroll ngang, danh mục cha có CTA hợp lý; actual là hover đầu không ổn định, slider chưa vuốt ngon, và root category thiếu action rõ ràng.
2. Phạm vi: runtime site, preview admin, auto-generation logic, Convex query aggregate cho auto-gen.
3. Tái hiện: có; đọc trực tiếp `HomepageCategoryHeroSection.tsx` thấy hover/slider/CTA hiện chưa đủ chặt.
4. Mốc thay đổi gần nhất: sau khi thêm hover + auto-gen v1, các vấn đề interaction và content enrichment lộ ra rõ hơn.
5. Dữ liệu thiếu: hiện thiếu representative product image per category trong query auto-gen.
6. Giả thuyết thay thế: chỉ chỉnh className hoặc tăng z-index là đủ; bị loại trừ vì vấn đề nằm ở interaction flow + data output.
7. Rủi ro nếu fix sai nguyên nhân: hover có thể vẫn chập chờn, slider vẫn khó vuốt, auto-gen chỉ đẹp hơn chút chứ chưa “thực sự mạnh”.
8. Tiêu chí pass/fail: desktop hover ổn định, slider touch usable, không tạo cảm giác page scroll ngang, root category có CTA rõ, auto-gen sinh ảnh đại diện tốt hơn.

## Root Cause Confidence
**High** — Có evidence trực tiếp từ code runtime hiện tại và từ behavior user mô tả, khớp với implementation đang có.

### Root cause chính
1. Desktop hover đang phụ thuộc vào `onMouseEnter` từng item + `onMouseLeave` wrapper, nhưng chưa có cơ chế giữ panel/open intent đủ ổn định.
2. Slider đang dùng native horizontal scroll + snap, dễ gây xung đột giữa drag ảnh/link và scroll container, nhất là trên touch.
3. Auto-gen mới score category chứ chưa enrich representative imagery từ product thật.
4. Root category thiếu CTA/header action nên UX bị cụt: menu có structure nhưng không có đường vào “xem tất cả”.

### Counter-hypothesis đã kiểm
- Hypothesis: chỉ cần set default active item đầu tiên.
  - Loại trừ vì user muốn hover behavior đúng, không phải sticky-open mặc định.
- Hypothesis: chỉ cần thêm một button ở form là đủ.
  - Loại trừ vì vấn đề hiện nằm cả runtime lẫn dữ liệu sinh ra.

## Problem Graph
1. [Main] HomepageCategoryHero còn vướng 4 lỗi UX/data <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [Hover desktop chưa ổn định] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Lifecycle open/close của flyout chưa đủ chặt cho hover intent
   1.2 [Slider touch chưa tốt] <- depends on 1.2.1
      1.2.1 Native horizontal scroll + link overlay gây drag/scroll conflict
   1.3 [Auto-gen chưa giàu hình ảnh] <- depends on 1.3.1
      1.3.1 Chưa lấy representative product image cho category
   1.4 [Root category thiếu CTA] <- depends on 1.4.1
      1.4.1 Flyout/menu chưa expose action “xem tất cả / xem danh mục”

## Files Impacted

### Runtime / preview
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: render hover menu + slider + mobile accordion.
  - Thay đổi: refactor hover lifecycle desktop, làm slider touch-friendly hơn, khóa cảm giác scroll ngang, thêm CTA root category trong panel/mobile.
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx`
  - Vai trò hiện tại: preview runtime.
  - Thay đổi: đảm bảo preview phản ánh đúng hover/CTA/slider behavior sau khi sửa.

### Admin / config / logic
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/auto-generate.ts`
  - Vai trò hiện tại: sinh root/groups/items theo score.
  - Thay đổi: enrich root categories bằng representative product image và CTA metadata hợp lý.
- `Sửa: app/admin/home-components/homepage-category-hero/_types/index.ts`
  - Vai trò hiện tại: contract menu/config.
  - Thay đổi: thêm field tối thiểu cho `featuredImage`/`representativeImage` và root CTA metadata nếu cần.
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/constants.ts`
  - Vai trò hiện tại: default/normalize config.
  - Thay đổi: normalize thêm metadata mới để tương thích dữ liệu cũ.
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroForm.tsx`
  - Vai trò hiện tại: form manual + auto-generate controls.
  - Thay đổi: hiển thị rõ summary ảnh đại diện/CTA sau khi sinh nếu cần, nhưng không nở form quá mức.
- `Sửa: app/admin/home-components/create/homepage-category-hero/page.tsx`
  - Vai trò hiện tại: wiring create.
  - Thay đổi: nhận output auto-gen mới có image/CTA metadata.
- `Sửa: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: wiring edit.
  - Thay đổi: nhận output auto-gen mới có image/CTA metadata.

### Data / Convex
- `Sửa: convex/productCategories.ts`
  - Vai trò hiện tại: `listActiveWithStats` trả categories + stats tổng hợp.
  - Thay đổi: enrich thêm representative product image/url tối thiểu cho mỗi category có sản phẩm active, tránh N+1.

## Proposal

### Option A (Recommend) — Confidence 94%
**Fix toàn diện nhưng gọn: stable hover + touch slider + representative image + root CTA**
- Desktop hover:
  - mở menu bằng `onMouseEnter`/`onFocus`
  - giữ mở khi pointer đang ở sidebar hoặc panel
  - đóng bằng leave có kiểm soát, tránh flicker ở item đầu
- Slider:
  - refactor từ native horizontal scroll thô sang interaction an toàn hơn cho touch/drag
  - chặn page-level horizontal scroll leak
  - giữ dots + click navigation
- Auto-gen:
  - lấy thêm 1 ảnh sản phẩm đại diện ngẫu nhiên/ưu tiên tốt từ category
  - ưu tiên có hàng, có ảnh, có score tốt
- CTA:
  - root category có “Xem tất cả” / “Xem danh mục” rõ ràng trong desktop flyout và mobile accordion

**Vì sao recommend:** sửa trúng cả 4 pain point user nêu, vẫn trong phạm vi component/productization hiện tại.

### Option B — Confidence 80%
**An toàn hơn: chỉ fix runtime + CTA, chưa enrich auto-gen bằng ảnh sản phẩm**
- Phù hợp nếu muốn ship UX fix nhanh nhất.
- Tradeoff: auto-gen vẫn chưa đủ “giàu” như bạn mong muốn.

### Option C — Confidence 76%
**Đẩy mạnh visual merchandising hơn nữa**
- Ngoài Option A, thêm block preview visual nhỏ cho root category/image trong flyout.
- Phù hợp nếu muốn component premium hơn.
- Tradeoff: diff UI lớn hơn, cần canh density để không rối.

## Execution Preview
1. Audit lại hover path và refactor lifecycle desktop flyout để item đầu mở ổn định.
2. Sửa slider sang touch-friendly behavior, loại bỏ cảm giác scroll ngang toàn khối.
3. Thêm CTA root category ở panel desktop và mobile accordion.
4. Enrich query aggregate để lấy representative product image per category.
5. Cập nhật auto-generate dùng ảnh đại diện sản phẩm.
6. Đồng bộ types/constants/create/edit/form/preview.
7. Static review + typecheck.

## Acceptance Criteria
- Hover vào danh mục đầu trên desktop mở menu ổn định.
- Rời hover thì menu ẩn đúng, không sticky vô lý.
- Hero slider vuốt được mượt hơn và không gây cảm giác page scroll ngang.
- Mỗi danh mục root có CTA rõ kiểu “Xem tất cả” hoặc tương đương.
- Auto-generate có thể lấy ảnh sản phẩm đại diện từ danh mục để output nhìn ngon hơn.
- Dữ liệu cũ không bị vỡ nhờ normalize/default compatibility.

## Verification Plan
- Static review:
  - kiểm tra hover state machine desktop
  - kiểm tra slider không còn phụ thuộc hoàn toàn vào native horizontal scroll leak
  - kiểm tra CTA root category hiện ở desktop/mobile
  - kiểm tra representative image fallback khi category không có sản phẩm ảnh
  - kiểm tra create/edit/preview parity
- Typecheck: `bunx tsc --noEmit`
- Repro cho tester:
  1. Mở runtime/preview desktop
  2. Hover item đầu, hover item khác, rời chuột khỏi sidebar/panel
  3. Vuốt hero trên mobile/tablet preview
  4. Dùng `Sinh tự động`
  5. Kiểm tra danh mục được sinh có ảnh đại diện và CTA root hợp lý

## Risk / Rollback
- Risk: nếu logic representative image chọn ngẫu nhiên tuyệt đối, UI có thể không ổn định giữa các lần sinh.
- Rollback: chọn “representative nhưng deterministic” (ví dụ product đầu tiên theo score/order có ảnh) thay vì random tuyệt đối; vẫn có thể rollback về ảnh category.

## Out of Scope
- AI-generated copy/banner cho từng category.
- Personalization realtime theo user behavior.
- Refactor sang carousel library mới toàn cục cho cả repo.

## Kết luận
Tôi recommend **Option A**: sửa hover desktop cho chắc tay, làm slider touch-friendly hơn, thêm CTA root category, và nâng auto-gen bằng ảnh sản phẩm đại diện từ dữ liệu thật. Đây là gói fix/cải tiến tốt nhất trong phạm vi hợp lý và đúng với các pain point bạn vừa nêu.