## Audit Summary

### TL;DR kiểu Feynman
- Bạn đang muốn `HomepageCategoryHero` không chỉ “na ná Wolf”, mà phải bám gần như nguyên mẫu khối đầu trang của Wolf/Sapo.
- Sau khi bóc source Wolf, phần này thực chất là **3 mảnh ghép cùng lúc**: rail trái dạng mega-menu, slider banner phải, và mobile/off-canvas riêng.
- Bản hiện tại của repo mới chỉ có **rail phẳng + 1 banner tĩnh**, nên khác Wolf ở tầng cấu trúc chứ không chỉ ở spacing.
- Điểm thiếu lớn nhất là **submenu nhiều cấp + khối gợi ý/brand trong mega menu + slider thật bên phải**.
- Nếu chỉ tiếp tục chỉnh className hiện tại thì sẽ không bao giờ “giống hoàn toàn” được.
- Hướng đúng là refactor component này thành **Wolf-first structure**, không còn coi nó là rail đơn giản nữa.

### Observation / Inference / Decision
- Observation:
  - Source Wolf có cột trái dạng `wolf-menu-root > menu-container > menu-list > nav-root-mega-menu` với mỗi root item gồm icon + label + mũi tên mở submenu.
  - Trong submenu có 2 lớp nội dung rõ ràng: khối `🔥 Gợi ý cho bạn` và khối `dropdown-mega-menu` chứa các nhóm category con.
  - Cột phải là `swiper section_slider wolf-slider-nav` với nhiều slide và ảnh desktop/mobile khác nhau qua `picture/source`.
  - Mobile không chỉ là dialog đơn giản; Wolf có menu mobile/off-canvas riêng với header, close, và cơ chế mở menu.
  - `components/site/HomepageCategoryHeroSection.tsx` hiện chỉ có rail phẳng + 1 `activeHero = heroSlides[0]` + `Dialog` đơn giản.
- Inference:
  - Sai khác hiện tại là **structural mismatch**: data model và rendering chưa đủ giàu để dựng mega-menu kiểu Wolf.
- Decision:
  - Cần nâng cấp cả contract dữ liệu lẫn runtime/admin preview, không chỉ chỉnh CSS.

### Audit câu hỏi bắt buộc
1. Triệu chứng: expected là clone gần đúng khối đầu trang Wolf; actual là component hiện tại chỉ là rail đơn giản + banner đơn.
2. Phạm vi: ảnh hưởng runtime site, preview admin, form config, và dữ liệu config của `HomepageCategoryHero`.
3. Tái hiện: có; chỉ cần so `HomepageCategoryHeroSection.tsx` với source Wolf là thấy thiếu mega-menu + slider + mobile menu structure.
4. Mốc thay đổi gần nhất: component vừa bị canonical hóa về rail trái + banner phải, nhưng vẫn chỉ là phiên bản “lite”.
5. Dữ liệu còn thiếu: chưa có schema cho submenu/gợi ý/nhóm con, nên không thể clone Wolf thật.
6. Giả thuyết thay thế: chỉ cần style lại rail và banner; bị loại trừ vì Wolf có mega-menu nhiều lớp và slider thực.
7. Rủi ro nếu fix sai nguyên nhân: tiếp tục sửa giao diện bề mặt sẽ làm code rối nhưng vẫn không đạt đúng mẫu Wolf.
8. Pass/fail sau khi sửa: desktop có rail mega-menu trái + slider phải; mobile có off-canvas hợp lý; preview/admin mô phỏng được đúng structure; config đủ dữ liệu cho submenu/gợi ý.

## Root Cause Confidence
**High** — Source Wolf cho thấy khác biệt ở DOM structure và behavior, không còn là vấn đề spacing đơn thuần.

### Root cause chính
1. `HomepageCategoryHeroConfig` hiện chỉ lưu danh mục phẳng (`categoryId`, `customImage`, `imageMode`) nên không mô tả được mega-menu nhiều cấp.
2. Runtime chỉ render 1 cấp category list, không có submenu, group columns, suggested brands, hay active root state.
3. Hero bên phải không phải slider thật; hiện chỉ lấy slide đầu tiên.
4. Mobile hiện là drawer đơn giản, không phản ánh menu header/off-canvas structure kiểu Wolf.

### Counter-hypothesis đã kiểm
- Hypothesis: Chỉ cần thêm CSS để giống Wolf.
  - Bị loại trừ vì source Wolf dùng markup và state phức tạp hơn nhiều.
- Hypothesis: Có thể map từ data category hiện tại sang mega-menu mà không đổi schema.
  - Bị loại trừ vì config hiện không chứa groups/subcategories/suggested items per root category.

## Problem Graph
1. [Main] HomepageCategoryHero chưa clone được Wolf <- depends on 1.1, 1.2, 1.3
   1.1 [Data contract quá nghèo] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Config chỉ có category phẳng, không có submenu/brand suggestions/group columns
   1.2 [Runtime structure thiếu] <- depends on 1.2.1, 1.2.2
      1.2.1 Rail trái không phải mega-menu
      1.2.2 Banner phải không phải slider thật
   1.3 [Admin/preview không mô phỏng đủ] <- depends on 1.3.1
      1.3.1 Form chưa cho biên tập dữ liệu mega-menu

## Files Impacted

### Shared contract
- `Sửa: app/admin/home-components/homepage-category-hero/_types/index.ts`
  - Vai trò hiện tại: config chỉ mô tả category phẳng + slides.
  - Thay đổi: mở rộng schema để có root category, suggested items, groups, child links, và slider items rõ ràng hơn.
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/constants.ts`
  - Vai trò hiện tại: default config khá đơn giản.
  - Thay đổi: thêm default data shape cho mega-menu và slider; normalize fallback cho dữ liệu cũ.

### Admin editor / preview
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroForm.tsx`
  - Vai trò hiện tại: chỉ edit danh mục phẳng và banner đơn.
  - Thay đổi: thêm editor cho root items, brand suggestions, submenu groups, child links, thứ tự hiển thị.
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx`
  - Vai trò hiện tại: preview rail đơn giản + 1 banner.
  - Thay đổi: preview đúng mega-menu + slider structure kiểu Wolf.
- `Sửa: app/admin/home-components/create/homepage-category-hero/page.tsx`
  - Vai trò hiện tại: tạo config đơn giản.
  - Thay đổi: khởi tạo state theo schema mới.
- `Sửa: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: load/save config đơn giản.
  - Thay đổi: normalize dữ liệu cũ sang schema mới và giữ backward compatibility.

### Runtime
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: rail list + banner card + dialog.
  - Thay đổi: dựng layout Wolf-first với active root, mega-menu panel, suggested brands, grouped child links, slider phải, mobile off-canvas.

## Proposal
### Option A (Recommend) — Confidence 91%
**Clone Wolf visible structure thật sự**
- Thêm schema dữ liệu cho:
  - root category items
  - suggested brand/logo links
  - submenu groups và child links
  - slider phải nhiều ảnh/link
- Runtime desktop:
  - rail trái có active root item
  - panel submenu cùng khối gợi ý
  - slider phải nhiều slide
- Mobile:
  - off-canvas đơn giản hóa nhưng vẫn cùng structure logic
- Preview/admin bám sát runtime.

**Vì sao recommend:** đây là option đầu tiên thực sự giải quyết đúng yêu cầu “học hỏi hoàn toàn” từ Wolf.

### Option B — Confidence 58%
**Fake Wolf bằng dữ liệu suy diễn từ category tree hiện có**
- Không mở rộng schema nhiều, chỉ tự sinh submenu từ productCategories nếu backend có parent-child.
- Suggested block dùng dữ liệu category/image hiện có.
- Slider vẫn thêm được.

**Phù hợp khi:** muốn giảm công sửa form/config, nhưng rủi ro cao vì có thể không đủ dữ liệu để ra đúng Wolf.

## Execution Preview
1. Audit lại cấu trúc dữ liệu product categories hiện có xem có parent-child hay không.
2. Thiết kế schema config mới cho Wolf block, có normalize từ config cũ.
3. Refactor form admin để biên tập root items + gợi ý + submenu groups + slider.
4. Refactor preview để mô phỏng đúng mega-menu/slider.
5. Refactor runtime `HomepageCategoryHeroSection.tsx` theo structure Wolf.
6. Review static backward compatibility và null-safety.

## Acceptance Criteria
- Desktop hiển thị block đầu trang giống Wolf về cấu trúc: menu trái nhiều cấp + slider/banner phải.
- Root item có icon/label/arrow; submenu có nhóm link con và khối gợi ý.
- Banner phải là slider thật, không còn chỉ dùng slide đầu.
- Mobile có off-canvas hợp lý thay cho rail desktop.
- Preview admin nhìn và hành xử gần với runtime.
- Config cũ vẫn load được qua normalize fallback, không crash.

## Verification Plan
- Static review:
  - kiểm tra config mới có normalize cho dữ liệu cũ
  - kiểm tra runtime không phụ thuộc dữ liệu null
  - kiểm tra preview/runtime parity
  - kiểm tra form admin cover đủ trường cho Wolf structure
- Typecheck: nếu user duyệt triển khai code, chạy `bunx tsc --noEmit`.
- Repro cho tester:
  1. Mở create/edit `HomepageCategoryHero`
  2. Tạo 1 root category có submenu groups + suggestions
  3. Thêm 2–3 slides banner
  4. Xem preview desktop/mobile
  5. Lưu và đối chiếu runtime site

## Risk / Rollback
- Risk lớn nhất: schema nở ra đáng kể, form admin phức tạp hơn.
- Rollback: giữ normalize fallback để có thể quay về bản rail đơn giản nếu cần.

## Out of Scope
- Clone toàn bộ CSS/theme Wolf ở mọi section khác ngoài khối category hero đầu trang.
- Sao chép toàn bộ JS/Swiper plugin của Wolf nếu repo đã có pattern slider nội bộ khác.
- Mega-menu hover animation quá chi tiết từng pixel nếu chưa cần.

## Kết luận
Nếu mục tiêu là “băm source Wolf rồi học hỏi hoàn toàn”, thì bước tiếp theo không thể chỉ sửa giao diện bề mặt nữa. Cần coi `HomepageCategoryHero` như một **mega-menu + hero slider block** đúng nghĩa, rồi nâng cấp schema, admin form, preview và runtime cùng lúc.