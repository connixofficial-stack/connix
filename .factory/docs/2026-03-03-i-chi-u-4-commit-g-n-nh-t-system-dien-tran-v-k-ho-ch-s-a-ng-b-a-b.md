## Problem Graph
1. [Main] Dự án hiện tại có cùng lỗi với 4 commit gần nhất của `system-dien-tran` <- depends on 1.1, 1.2
   1.1 [Seed Wizard không an toàn khi toggle module feature] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] `components/data/SeedWizardDialog.tsx` đang toggle cứng (`enableLogin`, `enableContact`, `enableSEO`, `enableSocial`, `enableMail`) và `convex/admin/modules.ts` ném `Feature not found` khi record thiếu
   1.2 [Contact schema/UI chưa chuẩn hoá] <- depends on 1.2.1, 1.2.2
      1.2.1 [ROOT CAUSE] Contact page + settings + seed còn dùng `contact_hotline` và `social_zalo` song song với `contact_zalo` gây trùng/không nhất quán
      1.2.2 [ROOT CAUSE] `OpenStreetMapDisplay` chưa tạo stacking context thấp (`z-0`) nên có nguy cơ lớp map/pane lấn header sticky

## Execution (with reflection)
1. Solving 1.1.1 — harden Seed Wizard feature toggle
   - Thought: lỗi chính là gọi `toggleModuleFeature` khi feature có thể chưa tồn tại; commit tham chiếu đã xử lý bằng ensure+create trước toggle.
   - Action (file): `components/data/SeedWizardDialog.tsx`
     - Thêm `createModuleFeature` mutation.
     - Thêm cấu hình default payload cho:
       - settings: `enableContact`, `enableSEO`, `enableSocial`
       - customers: `enableLogin`
     - Thêm helper `ensureModuleFeature(moduleKey, featureKey, payload)`:
       - query `api.admin.modules.getModuleFeature`
       - nếu chưa có thì `createModuleFeature`
       - lỗi thì `toast.error` + trả false để skip toggle thay vì crash flow.
     - Ở luồng sau `seedBulk`, thay các toggle cứng bằng:
       - ensure rồi mới toggle cho `customers.enableLogin`
       - loop ensure+toggle cho 3 settings features.
     - Bỏ dòng toggle `enableMail` (đồng bộ commit `fix: skip enableMail toggle`).
   - Reflection: giữ KISS, không sửa backend mutation; chỉ gia cố ở orchestrator đúng phạm vi bug.

2. Solving 1.2.1 — chuẩn hoá Contact/Zalo end-to-end
   - Thought: hiện codebase còn đúng các key lỗi giống repo tham chiếu (`contact_hotline`, `social_zalo`).
   - Action (files):
     - `components/site/useContactPageData.ts`
       - Bỏ `hotline` khỏi `ContactData`.
       - Thêm `normalizeZaloLink(raw)`:
         - URL đầy đủ giữ nguyên
         - `zalo.me/...` thêm `https://`
         - chuỗi số -> `https://zalo.me/<digits>`
         - invalid/rỗng -> ''.
       - Social links: Zalo lấy từ `contact_zalo` (đã normalize), không dùng `social_zalo`.
     - `app/(site)/contact/page.tsx`
       - Bỏ prop/hiển thị Hotline tại `ContactInfoCard` và `CorporateSidebar`.
       - Chỉ giữ `Điện thoại` để hết trùng dữ liệu.
     - `app/admin/settings/page.tsx`
       - Thêm `REMOVED_CONTACT_KEYS = ['contact_hotline','social_zalo']`.
       - Loại 2 key này khỏi render field và khỏi save payload.
       - Thêm cleanup 1 lần `removeMultiple` tương tự pattern cleanup SEO.
     - `lib/get-settings.ts`
       - `ContactSettings`: `contact_hotline` -> `contact_zalo`.
       - `SETTINGS_KEYS.contact` cập nhật theo key mới.
       - mapper trả `contact_zalo`.
     - `convex/seeders/settings.seeder.ts` + `convex/seed.ts`
       - Xóa default setting + moduleField cho `contact_hotline`, `social_zalo`.
       - Giữ `contact_zalo` và social còn lại.
   - Reflection: đồng bộ schema/UI/seed để data mới không tái sinh key cũ.

3. Solving 1.2.2 — fix map layering
   - Thought: fix tối thiểu đủ an toàn là tạo stacking context thấp tại map wrapper.
   - Action (file): `components/maps/OpenStreetMapDisplay.tsx`
     - đổi class wrapper từ `relative ...` sang `relative z-0 ...`.
   - Reflection: minimal, đúng lỗi, không tác động logic map.

4. Verify + commit
   - Chạy duy nhất: `bunx tsc --noEmit`.
   - Review thay đổi + commit local (không push) theo style repo.
   - Commit sẽ include `.factory/docs` nếu có thay đổi theo rule repo.

## Checklist đầu ra sau khi implement
- Seed Wizard không fail `Feature not found` khi dữ liệu moduleFeatures thiếu record.
- Không còn toggle `enableMail` trong flow seed.
- Contact page không còn hiển thị Hotline trùng.
- Zalo ở contact nhận cả số điện thoại và URL, render link đúng.
- Settings admin không còn field legacy `contact_hotline`/`social_zalo` và có cleanup legacy keys.
- Seed data không tái tạo 2 key legacy.
- Map ở contact không còn nguy cơ lớp đè header sticky.
- `bunx tsc --noEmit` pass.