## Audit Summary

### TL;DR kiểu Feynman
- Tôi đã đọc lại bản sample mới và đúng là bạn đã tối ưu responsive tốt hơn hẳn: đây mới là baseline nên bám.
- Điểm khác lớn nhất so với sample cũ là mobile giờ không còn chỉ “thu nhỏ desktop”, mà có cấu trúc riêng hợp lý hơn: banner lên trên, menu thành accordion, desktop mega-menu chỉ còn ở `lg`.
- Nghĩa là hướng refactor đúng bây giờ không chỉ là clone desktop, mà phải clone cả chiến lược responsive của sample này.
- Block hiện tại của repo vẫn chưa theo kiến trúc đó: mobile còn là dialog/off-canvas riêng, còn sample mới là inline accordion dưới banner.
- Nếu làm đàng hoàng theo code mẫu mới, tôi sẽ refactor `HomepageCategoryHero` thành 2 chế độ rõ ràng: desktop mega-menu, mobile/tablet accordion + banner stack.

### Observation / Inference / Decision
- Observation:
  - `components/hero-menu.tsx` mới dùng `flex-col lg:flex-row`, tức mobile-first thực sự, không phải desktop shrink-down.
  - Sample mới có `BannerSlider` riêng, mobile hiển thị slider trên đầu (`block lg:hidden`), desktop hiển thị slider ở content phải (`hidden lg:block`).
  - Sidebar sample mới trên mobile dùng `ChevronDown`, expand/collapse accordion inline ngay dưới item, không dùng drawer/dialog.
  - Mega menu desktop chỉ render ở `lg:block`; mobile accordion dùng cùng data nhưng khác presentation.
  - Container sample giữ tinh thần rất clean: border mềm, rounded-2xl, shadow nhẹ, row rhythm đẹp, active state chỉ nổi vừa đủ.
  - `HomepageCategoryHeroSection.tsx` hiện tại của repo vẫn dùng `Dialog` cho mobile, nên architecture responsive đang khác mẫu gốc.
- Inference:
  - Nếu tiếp tục giữ mobile dialog hiện tại thì dù desktop có giống hơn, tổng thể vẫn không “giống sample” như bạn muốn.
- Decision:
  - Cần cập nhật spec để clone **bản sample responsive mới nhất**, không phải bản sample cũ.

### Audit câu hỏi bắt buộc
1. Triệu chứng: expected là bám bản sample mới đã tối ưu responsive; actual là repo hiện tại vẫn khác ở cả desktop lẫn mobile architecture.
2. Phạm vi: runtime site, preview admin, và một phần admin contract nếu cần tinh gọn để phù hợp sample.
3. Tái hiện: có; đối chiếu trực tiếp `C:\Users\VTOS\Downloads\musical-instruments-store-ui\components\hero-menu.tsx` mới với `components/site/HomepageCategoryHeroSection.tsx` hiện tại.
4. Mốc thay đổi gần nhất: sample tham chiếu đã được user cập nhật responsive, nên baseline thiết kế đã đổi.
5. Dữ liệu thiếu: không thiếu; logic responsive và presentation layer mới là phần cần cập nhật.
6. Giả thuyết thay thế: chỉ chỉnh desktop theo sample mới là đủ; bị loại trừ vì sample mới khác mạnh ở mobile behavior.
7. Rủi ro nếu fix sai nguyên nhân: sẽ lại rơi vào tình trạng “desktop hơi giống, mobile vẫn sai chất”.
8. Tiêu chí pass/fail: desktop giống sample mới, mobile/tablet cũng theo đúng stack + accordion pattern của sample.

## Root Cause Confidence
**High** — Có code mẫu mới trực tiếp, và khác biệt responsive giữa sample với implementation hiện tại là rất rõ.

### Root cause chính
1. `HomepageCategoryHeroSection.tsx` hiện vẫn theo mobile dialog/drawer architecture, trong khi sample mới dùng inline accordion.
2. Runtime chưa tách presentation desktop/mobile rõ như sample (`lg:hidden` vs `hidden lg:block`).
3. Desktop content area chưa mirror chính xác sample mới về split layout, active state, và slider visibility rules.
4. Preview hiện sẽ không phản ánh đúng nếu runtime chưa đổi theo sample responsive mới.

### Counter-hypothesis đã kiểm
- Hypothesis: giữ mobile dialog vì hợp repo hơn.
  - Loại trừ vì user đã explicitly đưa code mẫu mới và muốn học theo bản này.
- Hypothesis: chỉ lấy một phần responsive idea, không cần bám sát.
  - Loại trừ vì user đang muốn “làm cho đàng hoàng” từ code mẫu, tức fidelity cao.

## Problem Graph
1. [Main] HomepageCategoryHero chưa bám sample responsive mới <- depends on 1.1, 1.2, 1.3
   1.1 [Responsive architecture lệch] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Mobile dùng dialog/drawer thay vì inline accordion như sample
   1.2 [Desktop composition chưa mirror sample mới] <- depends on 1.2.1
      1.2.1 Sidebar/content split và visibility rules chưa đúng
   1.3 [Preview/admin chưa đồng bộ baseline mới] <- depends on 1.3.1
      1.3.1 Preview và config chưa tối ưu để phục vụ responsive structure mới

## Files Impacted

### Runtime / preview
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: render desktop/mobile theo architecture cũ.
  - Thay đổi: clone sát structure sample mới: mobile banner top + accordion list, desktop sidebar + mega-menu + desktop slider area.
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx`
  - Vai trò hiện tại: preview runtime hiện tại.
  - Thay đổi: đảm bảo preview đúng behavior theo breakpoint mới, nhất là mobile/tablet.

### Admin / config
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroForm.tsx`
  - Vai trò hiện tại: form đã gọn hơn, nhưng có thể cần tinh chỉnh thêm để phục vụ sample responsive mới.
  - Thay đổi: giữ root category + group title + category con + banner; không thêm feature ngoài sample.
- `Sửa: app/admin/home-components/homepage-category-hero/_types/index.ts`
  - Vai trò hiện tại: contract tối giản cho menu.
  - Thay đổi: chỉ chỉnh nếu cần để align tốt hơn với responsive render mới; không mở rộng scope.
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/constants.ts`
  - Vai trò hiện tại: normalize/default config.
  - Thay đổi: đồng bộ default data shape với render strategy mới nếu cần.
- `Sửa: app/admin/home-components/create/homepage-category-hero/page.tsx`
  - Vai trò hiện tại: create page state wiring.
  - Thay đổi: sync nếu contract thay đổi nhẹ.
- `Sửa: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: edit page wiring.
  - Thay đổi: sync nếu contract thay đổi nhẹ.

## Proposal
### Option A (Recommend) — Confidence 97%
**Clone sát sample responsive mới nhất**
- Mobile/tablet:
  - banner slider nằm trên
  - menu list nằm dưới
  - item có submenu dùng accordion inline với `ChevronDown`
  - bỏ hẳn dialog/drawer architecture hiện tại
- Desktop:
  - sidebar trái giữ rhythm và active state gần sample
  - content phải: banner slider mặc định, mega-menu khi active item có groups
  - dùng visibility rules giống sample (`lg:hidden`, `hidden lg:block`)
- Admin:
  - tiếp tục giữ tối giản theo lựa chọn trước: root category + group title + category con + banner

**Vì sao recommend:** đây là spec bám đúng code mẫu mới nhất mà bạn vừa cập nhật, tránh học từ bản reference cũ.

## Execution Preview
1. Trích exact responsive structure từ sample mới (`BannerSlider`, sidebar, mobile accordion, desktop mega-menu).
2. Refactor `HomepageCategoryHeroSection.tsx` theo 2 presentation layers rõ ràng: mobile vs desktop.
3. Map dữ liệu động của repo vào structure sample thay cho static `MENU_ITEMS`/`BANNERS`.
4. Gỡ logic mobile dialog/drawer cũ nếu không còn dùng.
5. Cập nhật preview để phản ánh đúng behavior mới.
6. Giữ form/admin tối giản và chỉ chỉnh phần thật sự cần.
7. Static review + typecheck.

## Acceptance Criteria
- Mobile/tablet hiển thị banner trên, menu dưới, submenu mở inline như sample mới.
- Desktop hiển thị sidebar trái + content phải, mega-menu chỉ hiện ở desktop.
- Không còn mobile dialog/drawer cũ nếu sample mới không dùng.
- Slider hiển thị đúng vị trí theo breakpoint như sample.
- Admin vẫn gọn, không nở scope.
- Preview và runtime khớp nhau theo các breakpoint chính.

## Verification Plan
- Static review:
  - so sánh render tree giữa sample mới và runtime mới
  - kiểm tra breakpoint rules đúng (`lg:hidden`, `hidden lg:block`, stack layout)
  - kiểm tra accordion mobile không crash khi category/groups rỗng
  - kiểm tra preview parity
- Typecheck: `bunx tsc --noEmit`
- Repro cho tester:
  1. Mở create/edit Homepage Category Hero
  2. Tạo vài root category với group links
  3. Thêm 2–3 banner
  4. Xem preview mobile/tablet/desktop
  5. Đối chiếu với sample responsive mới

## Risk / Rollback
- Risk: đổi mạnh mobile architecture nên diff UI sẽ lớn.
- Rollback: vì contract vẫn nhỏ, rollback tương đối dễ; có thể quay lại bản trước nếu cần.

## Out of Scope
- Clone toàn bộ app sample ngoài `hero-menu`.
- Thêm settings/behavior mà sample không có.
- Đụng tới các homepage sections khác.

## Kết luận
Spec cũ cần cập nhật vì sample tham chiếu đã đổi. Nếu bạn duyệt, tôi sẽ bám **bản responsive mới nhất** của `musical-instruments-store-ui`, đặc biệt là phần mobile accordion + desktop mega-menu, để làm lại `HomepageCategoryHero` cho đúng tinh thần mẫu này.