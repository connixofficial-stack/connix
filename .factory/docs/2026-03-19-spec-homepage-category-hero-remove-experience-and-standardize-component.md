## TL;DR kiểu Feynman
- `HomepageCategoryHero` hiện đang bị chia 2 nơi: một phần ở `/system/experiences`, một phần ở `/admin/home-components`; điều này làm feature bị lệ thuộc vào toggle system dù bản chất component đã tự đủ dữ liệu.
- Mục tiêu là bỏ hẳn experience riêng của nó, để component này hoạt động như các home-component chuẩn khác: create/edit/preview/site render chỉ đi theo `homeComponents` + type override.
- Em sẽ lấy pattern từ 3 mẫu mạnh nhất: `Hero` (preview/edit chuẩn), `Product Categories` (category mapping + image mode), `Product List` (parity preview/runtime + token hoá màu).
- Không ưu tiên giữ ràng buộc cũ nếu nó làm hệ thống “dơ”; ưu tiên contract sạch, nhỏ gọn, rollback được.
- Preview sẽ tiếp tục bám runtime thật qua `HomepageCategoryHeroSection`, nhưng wiring cũ qua experience sẽ bị cắt bỏ hoàn toàn.

## Audit Summary
### Observation
- `HomepageCategoryHero` đang có route system riêng: `app/system/experiences/homepage-category-hero/page.tsx` và có menu entry trong `app/system/experiences/_constants.ts`.
- Runtime site đang gate component bằng `homepageCategoryHeroExperience?.enabled` trong `components/site/ComponentRenderer.tsx`; nếu setting system tắt thì component không render dù home-component đã tồn tại.
- Create/edit của component đang hiển thị cảnh báo “Feature đang tắt ở System” và link cứng sang `/system/experiences/homepage-category-hero` tại:
  - `app/admin/home-components/create/homepage-category-hero/page.tsx`
  - `app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
- `HomepageCategoryHeroPreview` ở nhánh experiences chỉ là wrapper gọi lại runtime section `HomepageCategoryHeroSection`, nên experience hiện chủ yếu là lớp gating/config ngoài chứ không phải nguồn UI riêng.
- `HomepageCategoryHeroSection` đã có logic runtime khá độc lập: merge default config, chọn category auto/manual, resolve image mode, tablet/mobile behavior, drawer/compact rail.

### Inference
- Root vấn đề không phải UI render thiếu, mà là kiến trúc bị split sai tầng: một home-component nhưng lại phụ thuộc thêm 1 experience toggle hệ thống.
- Vì preview admin đã dùng chính runtime section, việc giữ experience riêng không còn tạo thêm giá trị tương xứng với độ phức tạp.
- Để đạt chuẩn như các home-component khác, cần dọn wiring experience và đồng thời nâng chất lượng form/preview/runtime parity theo pattern của `Hero`, `Product Categories`, `Product List`.

### Decision
- Xóa hẳn route + menu + wiring settings của `homepage-category-hero`.
- Chuẩn hoá `HomepageCategoryHero` thành home-component độc lập, lấy chuẩn từ 3 component mẫu.
- Ưu tiên contract sạch hơn tương thích tuyệt đối nếu contract cũ làm tăng coupling/rác hệ thống.

## Root Cause Confidence
**High** — Evidence trực tiếp cho thấy render site hiện bị chặn bởi experience flag trong `components/site/ComponentRenderer.tsx`, trong khi toàn bộ nội dung thực tế đã nằm ở `app/admin/home-components/homepage-category-hero/*` và `components/site/HomepageCategoryHeroSection.tsx`. Experience page chỉ còn vai trò toggle/wrapper, không còn là nguồn business config cốt lõi.

### Counter-hypothesis đã cân nhắc
- Có thể experience vẫn cần vì chứa responsive behavior (`attachToHeader`, `tabletBehavior`).
- Nhưng evidence cho thấy đây là vài setting presentation nhỏ; chúng phù hợp hơn khi được nhập vào config của chính home-component hoặc default nội bộ, thay vì giữ cả một system experience riêng chỉ để chứa vài cờ này.

## Files Impacted
### UI / admin
- `Sửa: app/admin/home-components/create/homepage-category-hero/page.tsx`
  - Vai trò hiện tại: create page cho component, đang phụ thuộc `EXPERIENCE_KEY` để cảnh báo feature tắt.
  - Thay đổi: bỏ query settings/cảnh báo system, giữ flow create thuần theo chuẩn `ComponentFormWrapper`, đồng thời rà lại parity props với form/preview mới.
- `Sửa: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: edit page, đang đọc `EXPERIENCE_KEY`, chặn UX bằng warning card.
  - Thay đổi: bỏ dependence vào system settings, giữ logic dirty-check + override màu/font; chuẩn hoá snapshot/submit theo style của component chuẩn.
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroForm.tsx`
  - Vai trò hiện tại: form cấu hình hero/category mapping.
  - Thay đổi: audit và bổ sung parity features còn thiếu theo mẫu `Hero` + `Product Categories`: validation rõ hơn, UX chọn category/image mode, guard duplicate/empty state nếu đang thiếu.
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx`
  - Vai trò hiện tại: preview wrapper cho runtime section.
  - Thay đổi: giữ hướng preview-runtime parity, nhưng đổi contract props nếu responsive behavior được chuyển vào config component thay vì experience prop.
- `Sửa: app/admin/home-components/homepage-category-hero/_types`
  - Vai trò hiện tại: định nghĩa config type.
  - Thay đổi: hấp thụ các setting presentation cần giữ lại từ experience (nếu còn cần), để contract sống cùng component thay vì system experience.
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/constants`
  - Vai trò hiện tại: default config.
  - Thay đổi: cập nhật default config sạch và đầy đủ hơn cho responsive/category hero behavior mới.

### Site / shared runtime
- `Sửa: components/site/ComponentRenderer.tsx`
  - Vai trò hiện tại: render component theo type, đang gate `HomepageCategoryHero` bằng `homepageCategoryHeroExperience?.enabled`.
  - Thay đổi: bỏ gate experience, render trực tiếp như các home-component chuẩn khác; cập nhật props truyền vào section cho contract mới.
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: runtime section thật, đang nhận `experienceConfig` ngoài component config.
  - Thay đổi: gom logic presentation/responsive vào config nội bộ hoặc default nội bộ; tăng parity/normalization; giữ đây là nguồn render chuẩn cho site và preview.
- `Sửa: components/experiences/previews/HomepageCategoryHeroPreview.tsx`
  - Vai trò hiện tại: preview wrapper dùng cho system experience page.
  - Thay đổi: xoá file hoặc xoá export/usage nếu không còn consumer sau khi bỏ experience.

### System / experience wiring
- `Sửa: app/system/experiences/_constants.ts`
  - Vai trò hiện tại: menu danh sách experiences.
  - Thay đổi: bỏ item `Homepage Category Hero` khỏi menu system.
- `Xóa: app/system/experiences/homepage-category-hero/page.tsx`
  - Vai trò hiện tại: page cấu hình/toggle feature ở system.
  - Thay đổi: xoá hoàn toàn route vì user đã chốt xóa hẳn route + menu + wiring settings.
- `Sửa: lib/experiences/index.ts`
  - Vai trò hiện tại: export config/types cho các experiences.
  - Thay đổi: bỏ export `homepage-category-hero/config`.
- `Sửa/Xóa: lib/experiences/homepage-category-hero/config`
  - Vai trò hiện tại: chứa key, default config, parser cho experience.
  - Thay đổi: xoá nếu không còn consumer.
- `Sửa: app/(site)/_components/HomePageClient.tsx` hoặc nơi đang truyền `homepageCategoryHeroExperience`
  - Vai trò hiện tại: cấp experience config xuống renderer homepage.
  - Thay đổi: bỏ wiring prop nếu không còn dùng.

## Execution Preview
1. Đọc lại toàn bộ module `homepage-category-hero` và các consumer runtime để chốt contract mới.
2. Gỡ experience wiring: menu system, route page, export config, homepage prop plumbing.
3. Chuyển các setting presentation còn giá trị (nếu có) từ experience sang config/default của home-component.
4. Chuẩn hoá create/edit/form/preview theo pattern từ `Hero`, `Product Categories`, `Product List`.
5. Rà static review: typing, null-safety, config cũ, consumer imports chết.
6. Chạy `bunx tsc --noEmit` trước commit vì có thay đổi TS/code, rồi commit local theo rule repo.

## Proposal chi tiết
### 1) Bỏ experience hoàn toàn
- Xoá route `/system/experiences/homepage-category-hero`.
- Xoá menu entry ở system experiences.
- Xoá key/config/parser/export liên quan trong `lib/experiences`.
- Xoá warning card ở admin create/edit vì không còn khái niệm “feature tắt ở system”.
- Bỏ gate `homepageCategoryHeroEnabled` trong `ComponentRenderer` để component render theo `active` như bình thường.

### 2) Dọn contract của chính component
- Di chuyển hoặc nội bộ hoá các flag presentation đang nằm ở experience:
  - `attachToHeader`
  - `tabletBehavior`
- Hướng recommend: đưa vào `HomepageCategoryHeroConfig` với default rõ ràng trong constants, vì đây là hành vi UI của chính component.
- `HomepageCategoryHeroSection` sẽ chỉ cần `config + brandColor + previewDevice`, không cần `experienceConfig` nữa.

### 3) Nâng chuẩn component theo 3 mẫu tham chiếu
- Theo `Hero`:
  - giữ pattern create/edit với color/font override chuẩn, dirty-check rõ, preview-runtime bám sát.
- Theo `Product Categories`:
  - rà UX chọn category/image mode, xử lý duplicate, fallback image/icon, giới hạn hiển thị theo device.
- Theo `Product List`:
  - chuẩn hoá màu/secondary usage tốt hơn; nếu hợp lý, bổ sung normalize helper để section không phải tự gánh quá nhiều logic raw config.

### 4) Giữ thay đổi nhỏ, không mở rộng quá đà
- Không tự thêm nhiều style variant mới nếu chưa cần.
- Không đụng menu/header system khác ngoài phần wiring của `homepage-category-hero`.
- Chỉ bổ sung các thiếu sót rõ ràng để component đạt “đủ chuẩn” so với hệ thống hiện tại.

## Acceptance Criteria
- Không còn route `/system/experiences/homepage-category-hero` trong codebase.
- Không còn menu entry `Homepage Category Hero` trong `/system/experiences`.
- Không còn import/export/config key liên quan đến `homepage-category-hero` trong `lib/experiences` và plumbing homepage.
- `HomepageCategoryHero` vẫn create/edit/preview/render site bình thường chỉ bằng dữ liệu `homeComponents`.
- Admin create/edit không còn cảnh báo “Feature đang tắt ở System”.
- Preview admin và runtime site tiếp tục dùng cùng contract render, không sinh drift rõ rệt.
- `bunx tsc --noEmit` pass trước commit.
- Có commit local chứa toàn bộ thay đổi.

## Verification Plan
- Static review bắt buộc:
  - kiểm tra imports chết sau khi xóa experience.
  - kiểm tra config cũ của component vẫn merge được với default mới.
  - kiểm tra `selectionMode`, `hideEmptyCategories`, `imageMode`, responsive limits không bị null/undefined break.
- Typecheck:
  - chạy `bunx tsc --noEmit`.
- Repro thủ công để tester xác nhận:
  1. vào create homepage-category-hero, tạo component mới.
  2. vào edit component hiện có, lưu lại không lỗi.
  3. kiểm tra homepage render khi component active mà không cần bất kỳ toggle system nào.
  4. kiểm tra desktop/tablet/mobile preview vẫn đúng layout category hero.

## Out of Scope
- Tạo thêm layout/style mới cho `HomepageCategoryHero` ngoài contract hiện tại.
- Thay đổi business logic của menu/header toàn hệ thống.
- Dọn dữ liệu settings cũ trong database bằng migration chủ động; trước mắt chỉ bỏ consumer trong app code.

## Risk / Rollback
- Rủi ro chính: còn sót consumer import `HomepageCategoryHeroExperienceConfig` hoặc settings key cũ, gây lỗi type/runtime.
- Rủi ro phụ: config cũ thiếu field presentation mới nếu em chuyển chúng vào component config.
- Rollback đơn giản: revert commit vì thay đổi chủ yếu là gỡ wiring + chuẩn hoá trong phạm vi module này.

## Post-Audit
- Confidence tổng thể: **High**.
- Lý do: user đã chốt xóa hẳn route/menu/settings wiring; evidence code xác nhận experience hiện không còn mang giá trị kiến trúc tương xứng.
- Cách làm này phù hợp nguyên tắc repo: thay đổi nhỏ, bám pattern sẵn có, giảm coupling, dễ rollback.