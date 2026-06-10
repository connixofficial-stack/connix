## TL;DR kiểu Feynman
- Repo `system-ruou-vang` sau first commit có 4 cụm đáng lấy cho core hiện tại, nhưng không nên bê nguyên repo.
- 2 món lời nhất, ít rủi ro nhất là: `footer max-width + slogan từ settings` và `homepage-category-hero swipe mượt hơn`.
- `benefits` có nhiều nâng cấp UX đáng lấy, nhưng chạm nhiều file UI hơn.
- `seed wizard no-data scale + module defaults` hữu ích nhưng rủi ro cao nhất vì đụng flow tạo dữ liệu và default runtime.
- Script cào/import/backfill ảnh và asset/domain-specific nên loại khỏi scope.

## Audit Summary
### Observation
- Ở `E:\NextJS\enterteinment\system-ruou-vang`, các commit sau first commit tập trung vào 5 cụm: `benefits`, `footer`, `homepage hero swipe`, `product detail highlight`, `seed wizard + module defaults`.
- Đối chiếu với core hiện tại `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs`:
  - `Footer max-width + settings-driven slogan`: core đang thiếu.
  - `HomepageCategoryHeroSection` drag/swipe mượt hơn: core đang thiếu.
  - `Benefits` header align + responsive grid + icon picker search: core đang thiếu.
  - `Seed wizard` hỗ trợ `none/no-data` và module defaults giảm feature mặc định: core mới có một phần, thiếu nhánh skip seed và thiếu defaults tương ứng.
  - `Product detail highlight dedupe`: core đã có rồi, không cần lấy.

### Inference
- Repo rượu vang không chỉ thêm domain content, mà có một số cải tiến reusable đúng nghĩa cho UX/configuration.
- Giá trị lớn nhất nằm ở các cải tiến tập trung, ít phụ thuộc dữ liệu domain.
- Nếu lấy sai thứ tự, dễ tốn effort vào seed/default logic trước khi lấy được quick wins ở UI.

### Decision
Mình đề xuất **không lấy hết** mà chia 3 lớp ưu tiên:
1. Port ngay: `footer`, `hero swipe`
2. Port sau đó: `benefits UX refinements`
3. Để pha riêng, audit kỹ trước khi code: `seed wizard no-data scale + module defaults`

## Root Cause Confidence
**High** — vì đã có evidence trực tiếp ở cả 2 repo theo file path tương ứng, và các khác biệt đều nằm ở code cấu hình/UI cụ thể chứ không phải suy đoán từ README hay tên commit.

Lý do:
- So sánh được file tương ứng giữa hai repo.
- Có thể chỉ ra trạng thái `missing / partial / already present` theo từng cụm.
- Đã loại riêng nhóm script import/crawl/backfill và asset domain-specific.

## Files Impacted
### UI - Footer
- `app/admin/home-components/footer/_types/index.ts`
  - Vai trò hiện tại: định nghĩa shape config footer trong admin.
  - **Sửa:** thêm `maxWidth` type/options để footer support layout width cấu hình được.
- `app/admin/home-components/footer/_lib/constants.ts`
  - Vai trò hiện tại: chứa default config và helper/footer constants.
  - **Sửa:** thêm `maxWidth` options + helper map class width.
- `app/admin/home-components/footer/_components/FooterForm.tsx`
  - Vai trò hiện tại: form cấu hình footer trong admin.
  - **Sửa:** thêm control `maxWidth`, đổi flow nạp `description` từ `site_tagline` khi load settings.
- `components/site/DynamicFooter.tsx`
  - Vai trò hiện tại: render footer ngoài site với width gần như cố định.
  - **Sửa:** dùng `config.maxWidth` để render responsive container đúng option.
- `app/admin/home-components/create/footer/page.tsx`
  - Vai trò hiện tại: khởi tạo config mặc định khi tạo footer.
  - **Sửa:** đồng bộ default description/slogan và `maxWidth` default.

### UI - Homepage Category Hero
- `components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: render hero/category slider ở site.
  - **Sửa:** port drag offset, pointer capture/release, threshold động, overlay không chặn swipe.
- `app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx`
  - Vai trò hiện tại: preview component trong admin.
  - **Sửa:** chỉ cập nhật nếu cần parity hành vi preview với site.
- `app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: trang edit config component.
  - **Sửa:** chỉ chạm nếu cần sync preview props/wiring.

### UI - Benefits
- `app/admin/home-components/benefits/_types/index.ts`
  - Vai trò hiện tại: type config của benefits component.
  - **Sửa:** thêm `headerAlign`, `gridColumnsDesktop`, `gridColumnsMobile`.
- `app/admin/home-components/benefits/_lib/constants.ts`
  - Vai trò hiện tại: constants/default options cho benefits.
  - **Sửa:** thêm options cho align và grid columns.
- `app/admin/home-components/benefits/_components/BenefitsForm.tsx`
  - Vai trò hiện tại: form chỉnh benefits items/style.
  - **Sửa:** thay icon select đơn giản bằng icon picker searchable; thêm controls layout.
- `app/admin/home-components/benefits/_components/BenefitsSectionShared.tsx`
  - Vai trò hiện tại: phần shared render logic cho preview/site.
  - **Sửa:** render theo header align và số cột responsive; normalize icon key.
- `app/admin/home-components/benefits/[id]/edit/page.tsx`
  - Vai trò hiện tại: edit page benefits.
  - **Sửa:** sync initial config/default values nếu type mở rộng.

### Seed / Runtime Config
- `components/data/seed-wizard/types.ts`
  - Vai trò hiện tại: định nghĩa type cho wizard.
  - **Sửa:** thêm `DataScale = 'none'`.
- `components/data/seed-wizard/steps/DataScaleStep.tsx`
  - Vai trò hiện tại: step chọn quy mô dữ liệu seed.
  - **Sửa:** thêm option “không tạo dữ liệu”.
- `components/data/seed-wizard/wizard-presets.ts`
  - Vai trò hiện tại: sinh preset và số lượng seed theo scale.
  - **Sửa:** thêm nhánh `none => 0 records` và skip build seed configs.
- `components/data/SeedWizardDialog.tsx`
  - Vai trò hiện tại: điều phối flow wizard và submit.
  - **Sửa:** đảm bảo flow submit không cố tạo seed khi chọn `none`.
- `lib/modules/configs/posts.config.ts`
  - Vai trò hiện tại: defaults cho module posts.
  - **Sửa:** chỉ tắt bớt feature nếu thật sự muốn adopt “lean defaults”.
- `lib/modules/configs/services.config.ts`
  - Vai trò hiện tại: defaults cho module services.
  - **Sửa:** cân nhắc sync defaults tinh gọn.
- `lib/modules/configs/products.config.ts`
  - Vai trò hiện tại: defaults cho module products.
  - **Sửa:** cân nhắc sync defaults tinh gọn.

## Execution Preview
1. Đọc diff chi tiết cụm `footer` ở repo rượu vang và map sang file tương ứng ở core.
2. Port `footer max-width + slogan from settings` theo thay đổi nhỏ, tránh đụng asset/BCT/domain text.
3. Đọc diff chi tiết `HomepageCategoryHeroSection` và port riêng phần drag/swipe + overlay pointer-events.
4. Rà preview/admin wiring của hero để đảm bảo parity nếu cần.
5. Đọc diff cụm `benefits`, chỉ lấy phần reusable: align, responsive grid, icon picker search; bỏ thứ gì gắn chặt domain icon set nếu không cần.
6. Tách `seed wizard` thành pha riêng: audit static flow trước, rồi mới quyết định có đổi module defaults hay chỉ thêm `none/no-data`.
7. Review tĩnh toàn bộ thay đổi: typing, null-safety, backward compatibility dữ liệu config cũ.
8. Nếu user duyệt implementation hoàn tất, bước verify kỹ thuật tối thiểu là `bunx tsc --noEmit` trước commit theo rule của repo.

## Danh sách feature nên port
### P1 — Nên làm trước
1. **Footer: max-width option**
   - Lợi ích: cho phép footer co giãn theo layout site, reusable cao.
   - Evidence: core `DynamicFooter.tsx` còn `max-w-7xl` cứng; repo rượu vang đã tách ra thành config.
   - Risk: thấp.
2. **Footer: slogan load từ settings**
   - Lợi ích: tránh nhập lặp content, đồng bộ system settings -> home component.
   - Evidence: core form footer chưa kéo `site_tagline` vào `description`.
   - Risk: thấp.
3. **Homepage Category Hero: swipe/drag mượt hơn**
   - Lợi ích: UX tốt hơn cho cả desktop lẫn touch.
   - Evidence: core slider còn pointer tracking cơ bản, chưa có drag offset/pointer capture hoàn chỉnh.
   - Risk: trung bình.

### P2 — Nên làm sau P1
4. **Benefits: header align + responsive grid columns**
   - Lợi ích: kiểm soát layout tốt hơn, preview/site đồng nhất hơn.
   - Evidence: core benefits types/constants chưa có các field này.
   - Risk: trung bình.
5. **Benefits: icon picker searchable**
   - Lợi ích: UX editor tốt hơn nhiều so với select icon cứng.
   - Evidence: core đang dùng list icon cố định đơn giản.
   - Risk: trung bình.

### P3 — Chỉ nên làm ở pha riêng
6. **Seed Wizard: thêm `no-data/none` scale**
   - Lợi ích: cho phép khởi tạo system mà không bơm dữ liệu mẫu.
   - Evidence: core chỉ có `low|medium|high`.
   - Risk: trung bình.
7. **Module defaults tinh gọn hơn trong posts/services/products**
   - Lợi ích: system mới nhẹ hơn, ít feature noise hơn.
   - Evidence: repo rượu vang tắt nhiều flag mặc định; core đang bật khá nhiều.
   - Risk: cao hơn vì ảnh hưởng expectation của module hiện tại.

### Không nên port
- Script import/crawl/backfill ảnh trong `scripts/**`
- `public/uploads/**`
- Asset/BCT/legal/domain-specific branding
- Bất kỳ text/config nào gắn chặt business rượu vang

## Acceptance Criteria
- Có danh sách rõ ràng các feature reusable từ `system-ruou-vang` sang core, được xếp hạng theo giá trị/rủi ro.
- Mỗi feature được chỉ ra trạng thái ở core: `thiếu / có một phần / đã có`.
- Mỗi feature có mapping file cụ thể bên core để triển khai.
- Nhóm rác/domain-specific bị loại rõ ràng khỏi scope.
- Kế hoạch triển khai đủ chi tiết để bắt đầu code theo pha, không cần audit lại từ đầu.

## Verification Plan
- **Spec verification:** đối chiếu lại từng cụm với file path đã nêu ở cả hai repo để đảm bảo không có false positive.
- **Implementation verification sau khi user duyệt:**
  - review tĩnh: typing, null-safety, backward compatibility config cũ;
  - chạy `bunx tsc --noEmit` nếu có thay đổi code TypeScript;
  - không chạy lint/unit test/build vì guideline của repo cấm agent tự chạy các bước đó.
- **Pass/Fail:**
  - Pass nếu từng cụm port xong vẫn giữ tương thích config cũ và không phát sinh mismatch type.
  - Fail nếu phải sửa lan sang domain-specific assets/scripts hoặc làm đổi behavior ngoài phạm vi feature mục tiêu.

## Out of Scope
- Port toàn bộ commit của repo rượu vang.
- Port script import/cào dữ liệu/backfill.
- Port asset/business copy đặc thù rượu vang.
- Refactor tổng thể core repo ngoài các cụm feature đã liệt kê.

## Risk / Rollback
- `Footer` và `Hero swipe`: rollback dễ vì phạm vi hẹp, mostly UI.
- `Benefits`: rollback vừa phải vì đụng type + form + shared renderer.
- `Seed wizard + module defaults`: rollback khó hơn vì có thể ảnh hưởng flow khởi tạo và expectation của module config.
- Cách giảm rủi ro: làm theo pha, commit từng cụm độc lập, ưu tiên UI quick wins trước rồi mới đụng seed/default logic.

## Đề xuất chốt để vào implementation
Nếu bạn duyệt spec này, mình sẽ triển khai theo thứ tự:
1. Footer
2. Homepage hero swipe
3. Benefits
4. Seed wizard (pha riêng, có thể tách commit riêng)