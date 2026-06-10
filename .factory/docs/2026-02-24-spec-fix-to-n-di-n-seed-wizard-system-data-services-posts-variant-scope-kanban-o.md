## Problem Graph
1. [Main] Chuẩn hoá Seed Wizard để seed đúng dữ liệu và đúng kỳ vọng business <- depends on 1.1, 1.2, 1.3, 1.4, 1.5
   1.1 [Sub] Tick services/posts nhưng seed = 0 <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] State extraFeatures bị mutate sai (auto-delete) + thiếu guard verify config trước submit
   1.2 [Sub] Variant preset không “vừa đủ và đúng” (màu + size) <- depends on 1.2.1, 1.2.2, 1.2.3
      1.2.1 [ROOT CAUSE] Set module setting `variantEnabled` sau seedBulk nên variants không seed đúng luồng
      1.2.2 [ROOT CAUSE] productOptions/productOptionValues không thuộc clear pipeline nên dữ liệu cũ tồn dư
      1.2.3 [ROOT CAUSE] preset seeding kiểu additive (ensure) không có strict mode để thu hẹp đúng tập option chọn
   1.3 [Sub] Thiếu optional Kanban trong wizard <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] Wizard options không expose `kanban` dù backend đã có module + seeder
   1.4 [Sub] Thiếu mention sâu dual-brand color <- depends on 1.4.1
      1.4.1 [ROOT CAUSE] Wizard set cứng `site_brand_mode=dual` nhưng không có step/summary/bridge sang settings/experiences/home-components
   1.5 [Sub] Thiếu cơ chế “deterministic validation” sau seed <- depends on 1.5.1
      1.5.1 [ROOT CAUSE] Chưa có assert checklist giữa input wizard và output thực tế ở /admin, /system

## Execution (with reflection)
1. Solving 1.1.1 — Ổn định state features + chống silent-drop module
   - File: `components/data/SeedWizardDialog.tsx`
   - Thay đổi:
     - Bỏ logic auto `next.delete('services')` khi `hasServices`.
     - Chuẩn hoá `hasPosts/hasProducts/hasServices` chỉ làm điều kiện hiển thị option, không mutate mất lựa chọn user.
     - Trước `seedBulk`, thêm bước build + log/validate `selectedModules` và `seedConfigs`; nếu user bật feature mà config quantity rơi về 0/không tồn tại thì báo lỗi rõ ràng và dừng.
   - Reflection: Ngăn triệt để lỗi user tick nhưng module không vào payload.

2. Solving 1.2.1 — Sửa thứ tự orchestration products variants
   - File: `components/data/SeedWizardDialog.tsx`
   - Thay đổi:
     - Set trước các setting products liên quan variant (`variantEnabled`, `variantPricing`, `variantStock`, `variantImages`, `enableDigitalProducts`, `defaultDigitalDeliveryType`) trước khi gọi `seedBulk` nếu có products.
     - Hoặc (khuyến nghị tốt hơn): bổ sung tham số `variantEnabled` vào config product seed và để `ProductSeeder` không phụ thuộc moduleSettings runtime.
   - Reflection: Đảm bảo `ProductSeeder.afterSeed()` đọc đúng trạng thái và seed variants đúng preset ngay lần đầu.

3. Solving 1.2.2 + 1.2.3 — Strict preset scope cho product options
   - Files:
     - `convex/seeders/registry.ts`
     - `convex/seedManager.ts`
     - `convex/seeders/variantPresets.seeder.ts`
     - (có thể thêm) `convex/seeders/productOptionsStrict.seeder.ts` hoặc mở rộng seeder hiện tại
   - Thay đổi:
     - Đưa `productOptions` (và `productOptionValues` nếu cần tách module) vào pipeline clear/seedable hoặc bổ sung clear hook chuyên biệt trong flow wizard clear.
     - Trong seeding theo wizard, thêm `strictVariantPresetScope=true`:
       - Chỉ giữ option nằm trong preset đã chọn (vd size + color).
       - Xóa/disable option preset cũ không thuộc preset hiện tại.
       - Dọn optionValues orphan.
     - Khi tạo variants cho products, gán `optionIds` chính xác bằng optionIds của preset strict.
   - Reflection: Đáp ứng đúng yêu cầu “/admin/product-options chỉ có 2 cái đó và sản phẩm cũng chỉ có 2 cái đó”.

4. Solving 1.3.1 — Thêm optional Kanban vào Wizard
   - Files:
     - `components/data/seed-wizard/wizard-presets.ts`
     - `components/data/seed-wizard/steps/ExtraFeaturesStep.tsx`
     - `components/data/SeedWizardDialog.tsx`
   - Thay đổi:
     - Thêm option `kanban` trong `EXTRA_FEATURE_OPTIONS` (label/description/modules=['kanban']).
     - Đảm bảo `buildModuleSelection` nhận và đưa `kanban` vào selectedModules.
     - ReviewStep hiển thị rõ nếu đã bật Kanban.
   - Reflection: Khớp backend có sẵn và cung cấp lựa chọn optional đúng UX.

5. Solving 1.4.1 — Bridge dual-brand đầy đủ
   - Files:
     - `components/data/seed-wizard/types.ts`
     - `components/data/seed-wizard/steps/BusinessInfoStep.tsx` (hoặc thêm `BrandModeStep.tsx`)
     - `components/data/seed-wizard/steps/ReviewStep.tsx`
     - `components/data/SeedWizardDialog.tsx`
   - Thay đổi:
     - Mở rộng `BusinessInfo`/wizard state: `brandMode: 'single' | 'dual'`, `brandPrimary`, `brandSecondary`.
     - UI step: cho user chọn single/dual + nhập secondary khi dual.
     - `setSettings` mapping chuẩn:
       - `site_brand_mode`
       - `site_brand_primary`
       - `site_brand_secondary`
       - fallback `site_brand_color`
     - ReviewStep thêm block “Ảnh hưởng màu thương hiệu” với liên kết định hướng:
       - `/admin/settings`
       - `/system/experiences`
       - `/admin/home-components`
   - Reflection: Không còn set cứng dual rỗng; user hiểu và kiểm soát rõ.

6. Solving 1.5.1 — Deterministic post-seed validation checklist (best-practice)
   - Files:
     - `components/data/SeedWizardDialog.tsx` (sau seed success)
     - (tuỳ chọn) helper `components/data/seed-wizard/validation.ts`
   - Thay đổi:
     - Sau seed, chạy query verify nhanh và show toast/report ngắn:
       - services/posts bật + quantity >0 thì count >0.
       - variant preset strict: productOptions đúng tập preset.
       - kanban bật thì bảng kanban có seed records.
       - brand mode/primary/secondary đã lưu đúng settings.
     - Nếu fail assert nào: hiển thị warning có action link điều hướng.
   - Reflection: Tạo “contract” rõ giữa input wizard và output hệ thống, giảm lỗi regressions.

## Thiết kế kỹ thuật chi tiết (KISS/YAGNI/DRY)
- Dùng 1 nguồn sự thật cho wizard payload: tạo `buildWizardSeedPlan(state)` trả về:
  - `selectedModules`
  - `seedConfigs`
  - `preSeedSettings`
  - `postSeedSettings`
  - `validations`
- Tránh rải logic ở nhiều chỗ để giảm drift.
- Mọi logic strict variant scope đặt ở backend seeder để idempotent và không phụ thuộc UI.

## Tương thích ngược & an toàn dữ liệu
- Chỉ áp strict scope khi gọi từ wizard (flag), không áp cho luồng seed thủ công cũ.
- `clearBeforeSeed=false` thì không tự xóa dữ liệu ngoài phạm vi, chỉ cảnh báo nếu không thể đảm bảo strict scope.
- Có transaction-like ordering (Convex mutation tuần tự) để tránh nửa vời state.

## Test/Validation Plan (đúng project rule)
- Unit-like checks (nếu có test infra cho seed helpers):
  - buildWizardSeedPlan mapping modules/config đúng.
  - strict preset giữ đúng options expected.
- Runtime validate bắt buộc sau sửa code TS:
  - `bunx tsc --noEmit`
- Manual QA flows:
  1) Tick services + posts, scale medium → count > 0 tại /admin/services, /admin/posts.
  2) Variant preset size_color + clearBeforeSeed=true → `/admin/product-options` chỉ size+color; product variants chỉ dùng 2 option này.
  3) Tick Kanban optional → có data ở /admin/kanban.
  4) Chọn dual brand (2 màu) → phản ánh đúng ở /admin/settings, preview /system/experiences, /admin/home-components.

## Commit plan
1. fix(seed-wizard): preserve selected extra features and validate seed plan
2. fix(seed-products): enforce variant preset strict scope + clear pipeline support
3. feat(seed-wizard): add optional kanban flow
4. feat(seed-wizard): add dual-brand mode step and cross-system bridge
5. chore(seed-wizard): add post-seed deterministic validation report

## Kết quả mong đợi
- Không còn tình trạng tick mà seed = 0 do silent state mutation.
- Variant preset tạo dữ liệu đúng phạm vi (exact set) theo lựa chọn user.
- Kanban có tùy chọn optional trong wizard.
- Dual-brand được khai báo rõ, lưu đúng, và được hướng dẫn xuyên suốt settings/experiences/home-components.