## Audit Summary

### TL;DR kiểu Feynman
- Tôi đã soi kỹ 5 ảnh bạn gửi và kết luận thẳng: bản hiện tại chưa giống Wolf rõ ràng, và đúng như bạn nói là UI còn xấu, thiếu CoC, cấu hình bị rờm rà.
- Vấn đề không chỉ ở CSS, mà ở cả 3 lớp cùng lúc: cấu trúc layout, chất lượng nội dung mega-menu, và mô hình cấu hình admin.
- Desktop hiện chưa đúng tỷ lệ menu trái / banner phải, nhịp spacing, trạng thái active, và cảm giác “liền khối” như Wolf.
- Mobile hiện cũng chưa đúng flow thật: Wolf là off-canvas menu-first, còn bản hiện tại giống dialog kỹ thuật hơn là menu thương mại điện tử.
- Admin form đang đi sai hướng: bắt user nhập quá nhiều field vi mô, trong khi Wolf-style block nên theo CoC, auto-suy diễn tối đa từ category.
- Hướng sửa đúng là: refactor lại block theo Wolf-first, đồng thời rút gọn config về tối thiểu để UI thật đẹp lên một cách tự nhiên.

### Observation / Inference / Decision
- Observation:
  - Ảnh desktop Wolf cho thấy cột trái là một khối cố định, trắng sạch, icon line mảnh, row cao đều, active row xám rất nhẹ, chevron nhỏ, và panel mega-menu mở ngang ăn cùng chiều cao thị giác với banner.
  - Ảnh desktop submenu cho thấy nội dung panel không phải “gợi ý cho có”, mà trọng tâm là các cột nhóm link rõ hierarchy; phần gợi ý nếu có chỉ là phụ trợ.
  - Ảnh mobile cho thấy menu mobile là một trải nghiệm riêng: top bar, close action, danh sách root category full-height, nhịp row đều, không phải dialog trung tính.
  - Code runtime hiện tại đang trộn nhiều trách nhiệm: custom image/icon/product-image, suggested items, group links, drawer, slider dots… nhưng output vẫn chưa ra đúng Wolf.
  - Form admin hiện expose quá nhiều knobs thấp tầng, khiến người nhập liệu phải “design bằng form”, trái với CoC.
- Inference:
  - Root problem là hệ thống đang cố “đẻ feature để bắt chước”, thay vì chốt một contract mạnh, hẹp, opinionated theo Wolf.
- Decision:
  - Cần refactor cả data contract, admin UX, preview và runtime theo hướng **ít cấu hình hơn nhưng kết quả đẹp hơn**.

### Audit câu hỏi bắt buộc
1. Triệu chứng: expected là giống Wolf rất sát về layout/spacing/hierarchy desktop + mobile; actual là chỉ mới có vài yếu tố giống bề mặt.
2. Phạm vi: ảnh hưởng `HomepageCategoryHero` runtime site, preview admin, form create/edit, và schema config.
3. Tái hiện: có; chỉ cần đối chiếu ảnh user gửi với runtime/code hiện tại là thấy mismatch rõ ràng.
4. Mốc thay đổi gần nhất: component đã được mở rộng mega-menu nhưng expansion đó làm config nở ra mà chất lượng UI chưa tương xứng.
5. Dữ liệu thiếu: hiện không thiếu dữ liệu để dựng giống hơn; thiếu chủ yếu là contract đúng và rule auto-fill đúng.
6. Giả thuyết thay thế: chỉ cần polish CSS hiện có; bị loại trừ vì form/config đang sai triết lý và runtime structure mobile/desktop chưa chuẩn Wolf.
7. Rủi ro nếu fix sai nguyên nhân: tiếp tục thêm field/gợi ý/override sẽ làm form càng rối mà UI vẫn không đẹp.
8. Tiêu chí pass/fail: nhìn nhanh 5 giây phải thấy khối trái-phải giống Wolf, submenu có hierarchy rõ, mobile giống menu thật, admin form ngắn gọn và khó nhập sai.

## Root Cause Confidence
**High** — Evidence từ ảnh user + code hiện tại cùng chỉ về một hướng: sai ở contract và composition, không chỉ là thiếu className.

### Root cause chính
1. `HomepageCategoryHero` đang có contract quá “low-level”, cho phép quá nhiều override vi mô (`label`, `url`, `image`, `categoryId`, `customImage`, `imageMode`, `suggestedItems`, `groups`...), làm mất CoC.
2. Runtime desktop chưa lock tỷ lệ và hierarchy đúng kiểu Wolf: menu rail, mega panel, và hero banner chưa tạo thành một composition chặt.
3. Mega-menu đang lấy “gợi ý” làm phần nổi, trong khi Wolf thật ưu tiên cột link/subcategory; phần gợi ý nếu có chỉ nên phụ.
4. Mobile đang là dialog triển khai kỹ thuật, chưa phải menu off-canvas mang feel ecommerce.
5. Admin form đang bắt user cấu hình chi tiết thứ đáng ra hệ thống phải tự suy ra từ category.

### Counter-hypothesis đã kiểm
- Hypothesis: giữ schema hiện tại, chỉ tinh chỉnh CSS.
  - Loại trừ vì schema hiện tại khuyến khích data loãng và UI admin rối.
- Hypothesis: giữ nhóm “gợi ý nổi bật” làm trung tâm của mega-menu.
  - Loại trừ vì ảnh Wolf desktop cho thấy hierarchy chính là columns of links, không phải promo cards.

## Problem Graph
1. [Main] HomepageCategoryHero chưa đạt Wolf + thiếu CoC <- depends on 1.1, 1.2, 1.3
   1.1 [Contract sai triết lý] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Config quá nhiều field thấp tầng, không auto-suy diễn đủ mạnh
   1.2 [Runtime composition lệch Wolf] <- depends on 1.2.1, 1.2.2
      1.2.1 Desktop rail/panel/banner chưa đúng tỷ lệ và hierarchy
      1.2.2 Mobile chưa là off-canvas commerce thật sự
   1.3 [Admin UX kém CoC] <- depends on 1.3.1
      1.3.1 Form buộc người dùng nhập quá nhiều override không cần thiết

## Files Impacted

### Shared / schema
- `Sửa: app/admin/home-components/homepage-category-hero/_types/index.ts`
  - Vai trò hiện tại: schema cho phép nhiều override chi tiết trên từng node.
  - Thay đổi: rút gọn contract về form tối giản: root category + nhóm con + banner; auto-suy diễn label/url/image từ category khi có thể.
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/constants.ts`
  - Vai trò hiện tại: normalize/default đang phục vụ schema nở rộng.
  - Thay đổi: viết lại normalize theo schema tối giản, có migration fallback từ dữ liệu cũ sang contract mới.

### Admin UI
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroForm.tsx`
  - Vai trò hiện tại: form dài, nhiều field vi mô, nhiều nested controls.
  - Thay đổi: rút còn 3 vùng chính: danh mục gốc, nhóm con cho từng mục, banner; ẩn/loại bỏ các field dư; auto-fill label/url.
- `Sửa: app/admin/home-components/create/homepage-category-hero/page.tsx`
  - Vai trò hiện tại: create page khởi tạo state theo config chi tiết.
  - Thay đổi: chuyển sang state tối giản theo contract mới.
- `Sửa: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: edit page load/save raw config hiện tại.
  - Thay đổi: normalize config cũ về schema mới và giữ backward compatibility.
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx`
  - Vai trò hiện tại: preview phản ánh component hiện tại nhưng chưa đủ sát Wolf.
  - Thay đổi: preview đúng composition desktop/mobile sau refactor.

### Runtime
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: runtime đang có nhiều nhánh nhưng composition chưa chặt.
  - Thay đổi: refactor lại desktop/mobile composition theo Wolf-first; menu trái fixed rhythm, mega panel columns-first, hero banner đúng tỷ lệ, mobile off-canvas đúng feel.

## Proposal
### Option A (Recommend) — Confidence 95%
**Refactor opinionated theo Wolf + CoC mạnh**
- Rút schema về tối thiểu:
  - root categories
  - submenu groups/links
  - hero slides
- Auto-suy diễn mặc định:
  - label từ category name
  - url từ category slug
  - thumbnail/icon từ category image nếu có
- Desktop:
  - menu rail trái width cố định, row height chuẩn, active state nhẹ
  - mega panel ưu tiên columns of links, bỏ cảm giác “promo giả”
  - hero banner phải khít chiều cao, spacing và border radius sát Wolf
- Mobile:
  - off-canvas menu riêng, full-height, header rõ, row rhythm đúng
- Admin:
  - bỏ hầu hết override vi mô
  - chỉ cho override ở những điểm thực sự cần

**Vì sao recommend:** đúng với yêu cầu của bạn nhất: “thực sự tốt và có tâm”, đẹp lên nhờ contract đúng chứ không phải thêm đồ chơi.

### Option B — Confidence 61%
**Giữ schema hiện tại nhưng ẩn bớt field và polish UI mạnh**
- Nhanh hơn, ít ảnh hưởng dữ liệu hơn.
- Nhưng nền tảng vẫn rối, dễ tái phát.

**Phù hợp khi:** muốn giảm khối lượng refactor, chấp nhận đẹp hơn nhưng chưa sạch gốc.

## Execution Preview
1. Audit schema hiện tại để xác định field nào bỏ khỏi UI và field nào còn giữ để migrate.
2. Thiết kế contract tối giản mới cho root categories + submenu groups + hero slides.
3. Viết normalize/migration từ config cũ sang config mới để không làm hỏng dữ liệu cũ.
4. Refactor form admin theo CoC: ít field, nhiều auto-fill, grouping rõ.
5. Refactor runtime desktop đúng tỷ lệ Wolf: rail, mega panel, banner.
6. Refactor runtime mobile thành off-canvas menu-first đúng cảm giác ảnh chụp.
7. Cập nhật preview để parity với runtime.
8. Static review + typecheck.

## Acceptance Criteria
- Desktop nhìn ngay phải ra đúng pattern Wolf: menu trái sạch, banner phải rộng, panel mở ngang đúng hierarchy.
- Mega-menu không còn cảm giác “gợi ý cho có”; link groups là trọng tâm.
- Mobile giống menu ecommerce thật, không còn cảm giác dialog kỹ thuật.
- Admin form ngắn, rõ, ít thao tác; người nhập liệu không cần tự điền quá nhiều label/url/image thủ công.
- Config cũ vẫn load được nhờ normalize fallback.
- Preview và runtime đồng nhất về cấu trúc chính.

## Verification Plan
- Static review:
  - kiểm tra contract mới có đủ mạnh để giảm form complexity
  - kiểm tra migration từ config cũ sang config mới
  - kiểm tra desktop/mobile hierarchy bám sát ảnh user gửi
  - kiểm tra preview/runtime parity
- Typecheck: `bunx tsc --noEmit`
- Repro cho tester:
  1. Mở create/edit Homepage Category Hero
  2. Chọn vài root category
  3. Gắn nhóm submenu cho từng root
  4. Thêm 2–3 banner
  5. Xem desktop/mobile preview
  6. Lưu và đối chiếu runtime với ảnh Wolf

## Risk / Rollback
- Risk: cần migrate nhẹ từ config cũ sang contract gọn hơn.
- Rollback: giữ normalize backward-compatible để dữ liệu cũ vẫn đọc được nếu phải lùi từng bước.

## Out of Scope
- Clone 100% animation/JS behavior nội bộ của site Wolf ngoài phần hero-category block.
- Sao chép toàn bộ copywriting/promotional content của Wolf.
- Mở rộng sang các section khác trên homepage.

## Kết luận
Tôi đồng ý với đánh giá của bạn: bản hiện tại chưa đạt. Nếu làm tử tế, bước tiếp theo không phải “vá thêm” mà là **giảm cấu hình, tăng CoC, và dựng lại composition desktop/mobile theo Wolf thật sát**. Đây là hướng tôi đề xuất để làm cho block này vừa đẹp hơn, vừa đúng tinh thần hệ thống hơn.