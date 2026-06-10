## Audit Summary

### TL;DR kiểu Feynman
- Hiện runtime desktop đang sai behavior vì menu mở theo click và panel chiếm toàn bộ vùng ảnh, nên cảm giác không giống mega-menu thật.
- Root cause thấy rõ trong `components/site/HomepageCategoryHeroSection.tsx`: item sidebar đang `onClick`, còn panel desktop render `absolute inset-0 bg-white`, tức phủ kín content area.
- Admin hiện mới là editor tay; chưa có cơ chế “sinh ngon” từ dữ liệu thật nên chưa mạnh.
- Dự án hiện có dữ liệu nền đủ tốt để làm auto-gen v1: `productCategories.listActive`, `listNonEmptyCategoryIds`, ảnh category, cây danh mục hiện có.
- Nếu muốn component này “thực sự mạnh”, nên làm theo 3 pha: sửa runtime UX trước, thêm auto-generator mạnh, rồi mới productize với nhiều strategy SaaS-inspired.

### Observation / Inference / Decision
- Observation:
  - `HomepageCategoryHeroSection.tsx` desktop đang dùng `onClick={() => setActiveCategoryId(...)}` cho sidebar item.
  - Desktop mega panel đang render `absolute inset-0 bg-white p-10`, nghĩa là panel phủ toàn bộ content area thay vì xuất hiện/biến mất kiểu hover overlay hợp lý.
  - Form hiện chỉ hỗ trợ chỉnh tay category/groups/links; chưa có nút generate từ dữ liệu thực.
  - Create/Edit page vẫn giữ nhiều state cũ (`heading`, `cta`, `tabletBehavior`...) dù runtime mới không còn dùng đúng mức tương xứng.
  - Repo hiện đã có query danh mục active và non-empty; đây là nền tảng đủ để sinh menu theo tree/distribution.
- Inference:
  - Nếu không đổi interaction model sang hover/focus-on-desktop + close on leave, UX sẽ tiếp tục “dính panel”.
  - Nếu không có auto-gen, component này sẽ luôn yếu vì chi phí cấu hình tay quá lớn.
- Decision:
  - Đề xuất spec tổng thể gồm: fix behavior runtime + thêm auto-generator + nghiên cứu/đóng gói 2 mode sinh menu để component mạnh thật.

### Audit câu hỏi bắt buộc
1. Triệu chứng: expected là desktop hover show / rời chuột hide, không phủ ảnh kiểu cứng; actual là click toggle và panel phủ kín vùng content.
2. Phạm vi: runtime site, preview admin, create/edit form, schema config cho auto-generation.
3. Tái hiện: có; vào runtime/preview là thấy, vì code hiện desktop dùng click state và panel `absolute inset-0`.
4. Mốc thay đổi gần nhất: refactor clone sample responsive đã chuyển structure, nhưng behavior desktop chưa được chỉnh về hover-driven theo mong muốn mới.
5. Dữ liệu thiếu: chưa thấy query thống kê sản phẩm theo category/facet chuyên dụng cho auto-gen “siêu mạnh”; cần bổ sung hoặc suy ra từ nguồn hiện có.
6. Giả thuyết thay thế: chỉ chỉnh CSS là đủ; bị loại trừ vì vấn đề nằm ở interaction model + product workflow chứ không chỉ visual.
7. Rủi ro nếu fix sai nguyên nhân: UI vẫn khó dùng, còn auto-gen nếu làm hời hợt sẽ sinh menu rác/khó tin dùng.
8. Tiêu chí pass/fail: desktop hover đúng, panel không đè ảnh sai kiểu; admin có nút generate usable; có ít nhất 2 strategy sinh menu rõ ràng, dễ hiểu.

## Root Cause Confidence
**High** — Có evidence trực tiếp từ runtime code hiện tại và admin form/create/edit.

### Root cause chính
1. Desktop interaction đang dùng click-toggle state thay vì hover/focus/leave lifecycle.
2. Mega panel desktop đang được render như full replacement layer (`absolute inset-0 bg-white`) nên tạo cảm giác “úp lên ảnh”.
3. Form chưa có abstraction cho generation strategy, nên toàn bộ menu phải build thủ công.
4. Config hiện chưa có metadata để lưu mode sinh, nguồn sinh, threshold, hoặc snapshot sinh gần nhất.

### Counter-hypothesis đã kiểm
- Hypothesis: chỉ cần đổi `onClick` thành `onMouseEnter` là xong.
  - Loại trừ vì còn thiếu close-on-leave, keyboard focus, mobile separation, panel positioning và admin workflow.
- Hypothesis: cứ để manual editor, user tự làm được.
  - Loại trừ vì chính user muốn component mạnh, hoàn thiện, dựa dữ liệu thật, không muốn cấu hình tay quá nhiều.

## Problem Graph
1. [Main] HomepageCategoryHero chưa “mạnh và hoàn thiện” <- depends on 1.1, 1.2, 1.3
   1.1 [Desktop UX sai mental model] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Click-toggle + full overlay panel thay vì hover/flyout behavior
   1.2 [Admin workflow yếu] <- depends on 1.2.1
      1.2.1 Chưa có auto-generator từ dữ liệu thực
   1.3 [Productization chưa rõ] <- depends on 1.3.1
      1.3.1 Chưa có strategy tree/distribution/facet để user chọn theo business intent

## Files Impacted

### Runtime / preview
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: render menu responsive theo sample clone.
  - Thay đổi: chuyển desktop sang hover/focus/open + mouse-leave/blur-close; panel không còn là “white full replacement” cứng, mà là flyout/anchored panel không phá hero image feel.
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx`
  - Vai trò hiện tại: preview runtime.
  - Thay đổi: đồng bộ preview với behavior hover desktop và accordion mobile.

### Admin / config
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroForm.tsx`
  - Vai trò hiện tại: editor tay category/groups/banner.
  - Thay đổi: thêm cụm “Sinh tự động” mạnh với lựa chọn strategy, preview summary, regenerate/apply/reset.
- `Sửa: app/admin/home-components/create/homepage-category-hero/page.tsx`
  - Vai trò hiện tại: create state cho config hero.
  - Thay đổi: quản lý auto-generation state và apply output vào form.
- `Sửa: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: edit state + save.
  - Thay đổi: hỗ trợ generate lại từ dữ liệu thật, preserve manual edits hợp lý.
- `Sửa: app/admin/home-components/homepage-category-hero/_types/index.ts`
  - Vai trò hiện tại: schema menu thủ công tối giản.
  - Thay đổi: thêm `generationMode`, `generationStrategy`, `autoGeneratedMeta` tối thiểu để lưu provenance và tái sinh có kiểm soát.
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/constants.ts`
  - Vai trò hiện tại: normalize/default config.
  - Thay đổi: bổ sung defaults/normalize cho metadata auto-gen.

### Data / shared logic
- `Thêm: app/admin/home-components/homepage-category-hero/_lib/auto-generate.ts`
  - Vai trò mới: gom thuật toán sinh menu từ category tree / distribution.
  - Thay đổi: tách rule scoring, dedupe, fill groups, sort, empty handling.
- `Có thể thêm: convex/productCategories/* hoặc shared query helper phù hợp`
  - Vai trò hiện tại: hiện mới thấy query active/non-empty cơ bản.
  - Thay đổi: nếu cần, bổ sung query aggregate tối thiểu cho product count / child distribution / featured candidates; giữ scope nhỏ, không overbuild.

## Proposal

### Option A (Recommend) — Confidence 92%
**Cân bằng triển khai: hover UX + auto-gen 2 mode + metadata vừa đủ**
- Runtime desktop:
  - hover/focus vào category => show flyout panel
  - rời sidebar/panel => hide
  - panel neo từ cạnh sidebar sang content, không “replace trắng toàn bộ ảnh”
  - mobile/tablet giữ accordion inline
- Auto-gen:
  - `Tree mode`: lấy cha -> nhóm theo con/cháu từ cây danh mục thật
  - `Distribution mode`: lấy category top-level rồi phân phối link con theo độ phong phú/đếm sản phẩm/non-empty/image presence
- Admin UX:
  - nút `Sinh tự động`
  - chọn mode sinh
  - chọn scope: top N danh mục, số group mỗi menu, số link mỗi group
  - preview summary trước khi apply
  - nút `Sinh lại`, `Áp dụng`, `Khôi phục thủ công`
- SaaS-inspired productization:
  - “Balanced” preset
  - “Tree-first” preset
  - “Discovery-first” preset

**Vì sao recommend:** đủ mạnh để dùng thật, nhưng vẫn giữ scope kiểm soát được và rollback dễ.

### Option B — Confidence 78%
**Tree-first an toàn**
- Chỉ làm hover UX + auto-gen theo cây cha/con.
- Không làm distribution/facet scoring ở pha đầu.
- Phù hợp khi dữ liệu category tree của dự án rất sạch và muốn ít rủi ro nhất.
- Tradeoff: mạnh ít hơn, kém “merchandising intelligence”.

### Option C — Confidence 74%
**Smart merchandising mạnh**
- Ngoài tree mode, thêm scoring theo non-empty/product count/image quality/facet diversity.
- Có ranking và chia nhóm thông minh hơn kiểu SaaS merchandising.
- Phù hợp nếu bạn muốn component như một “navigation engine mini”.
- Tradeoff: cần thêm query aggregate và review kỹ chất lượng dữ liệu.

## SaaS / Market Research Synthesis
Từ các pattern tham khảo 2025–2026 (ecommerce mega menu best practices, category merchandising, personalization tooling), các ý đáng học nhất cho component này là:
1. **Hover desktop, accordion mobile** — desktop phải hỗ trợ scan nhanh; mobile phải inline, không ép qua drawer nếu không cần.
2. **Merchandising by confidence** — không phải category nào cũng nên lên top; nên ưu tiên có hàng, có ảnh, có chiều sâu.
3. **Preset thay vì cấu hình trần trụi** — user nên chọn “Tree / Balanced / Discovery”, không nên phải nghĩ quá nhiều field low-level.
4. **Generate then curate** — SaaS tốt không khóa tay; nó sinh ra bản đủ ngon rồi cho sửa tiếp.
5. **Explainability** — nên có dòng tóm tắt kiểu “Đã chọn 8 danh mục cha, 3 nhóm/menu, ưu tiên danh mục có sản phẩm và ảnh”.

## Execution Preview
1. Audit runtime hiện tại và đổi desktop interaction từ click sang hover/focus/leave.
2. Refactor panel desktop để không còn cảm giác “úp trắng đè ảnh”.
3. Thiết kế schema metadata nhỏ cho auto-gen.
4. Viết engine `auto-generate.ts` với 2 strategy: tree + distribution.
5. Gắn nút `Sinh tự động` vào form create/edit, có preview summary và apply.
6. Nếu thiếu dữ liệu aggregate, thêm query tối thiểu phục vụ scoring.
7. Đồng bộ preview và review tĩnh.

## Acceptance Criteria
- Desktop: hover vào danh mục thì menu hiện, bỏ hover thì ẩn; không còn click-toggle sticky.
- Desktop: flyout panel không còn cảm giác phủ kín hero image sai ý.
- Mobile/tablet: vẫn dùng accordion ổn định.
- Create/Edit: có nút `Sinh tự động` usable ở cả hai nơi.
- Auto-gen hỗ trợ ít nhất 2 mode: tree và distribution.
- Output sinh ra đủ dùng ngay với dữ liệu thật, không ra menu rỗng/trùng quá nhiều.
- User vẫn có thể chỉnh tay sau khi generate.

## Verification Plan
- Static review:
  - kiểm tra hover/focus/leave lifecycle desktop
  - kiểm tra mobile không bị ảnh hưởng
  - kiểm tra output auto-gen không duplicate category cha vô lý
  - kiểm tra empty categories / missing image / missing children handling
  - kiểm tra create/edit parity
- Typecheck: `bunx tsc --noEmit`
- Repro cho tester:
  1. Mở create/edit homepage-category-hero
  2. Chọn `Sinh tự động`
  3. Thử Tree mode và Distribution mode
  4. Apply output rồi xem preview desktop/mobile
  5. Hover desktop để xác nhận hiện/ẩn đúng

## Risk / Rollback
- Risk: nếu scoring auto-gen quá tham, output có thể “thông minh quá mức” nhưng không hợp ngành cụ thể.
- Rollback: giữ manual editing là nguồn chân lý cuối; auto-gen chỉ là khởi tạo/tái sinh, không khóa cấu hình tay.

## Out of Scope
- Cá nhân hóa theo user behavior realtime.
- AI viết copy/banner tự động.
- Thay đổi toàn bộ hệ category hoặc product listing của dự án.

## Kết luận
Tôi đề xuất làm theo **Option A**: sửa hover UX desktop cho đúng mega-menu thật, rồi thêm `Sinh tự động` đủ mạnh với 2 mode `Tree` và `Distribution`, lấy dữ liệu thật để sinh menu usable ngay. Nếu bạn duyệt option nào, tôi sẽ triển khai đúng option đó.