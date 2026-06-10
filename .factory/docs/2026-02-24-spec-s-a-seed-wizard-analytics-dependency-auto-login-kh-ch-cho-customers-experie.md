## Problem Graph
1. [Main] Fix lỗi seed analytics và chuẩn hoá dependency login khách trong Seed Wizard <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [Sub] Thiếu cấu hình seed cho analytics <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Module `analytics` chưa có mapping seed config hợp lệ trong wizard/seedManager
   1.2 [Sub] Customers + Experiences Menu cần login khách <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Chưa có dependency resolver tự bật `enable_login_customer` khi chọn các module phụ thuộc
   1.3 [Sub] Bạn yêu cầu analytics phụ thuộc dashboard/reports <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] Chưa encode rule dependency theo business trong bước build selectedModules
   1.4 [Sub] UX review cần minh bạch + cho phép bỏ chọn thủ công <- depends on 1.4.1
      1.4.1 [ROOT CAUSE] ReviewStep chưa hiển thị dependency badge và override control

## Execution (with reflection)
1. Solving 1.1.1 — Bổ sung seed config analytics theo dependency dashboard/reports
- Files dự kiến:
  - `components/data/SeedWizardDialog.tsx`
  - `convex/seedManager.ts` (hoặc nơi validate seedable modules)
  - `components/data/seed-wizard/wizard-presets.ts`
- Thay đổi cụ thể:
  - Thêm entry config cho `analytics` trong pipeline build seedConfigs.
  - Rule mới: `analytics` chỉ được inject khi có `dashboard` hoặc `reports` trong selectedModules.
  - Nếu analytics bị bật lẻ từ preset cũ, normalize lại và log warning nhẹ trong summary (không throw lỗi).
- Reflection: loại bỏ triệt để lỗi “Thiếu cấu hình seed cho: analytics”, đồng thời khớp quyết định của bạn: analytics phụ thuộc dashboard/reports.

2. Solving 1.2.1 + 1.3.1 — Dependency resolver tự bật login khách
- Files dự kiến:
  - `components/data/SeedWizardDialog.tsx`
  - `components/data/seed-wizard/types.ts`
  - `components/data/seed-wizard/steps/BusinessInfoStep.tsx` (nếu đang chứa login toggle)
- Thay đổi cụ thể:
  - Tạo resolver `resolveAuthDependencies(state)` chạy trước submit:
    - Nếu bật `customers` => force `enable_login_customer=true`.
    - Nếu bật `experiences menu` (toàn bộ scope) => force `enable_login_customer=true`.
  - Ghi `dependencySource` để UI biết đây là auto-on do dependency.
  - Vẫn cho user bỏ chọn thủ công ở ReviewStep; nếu bỏ chọn mà dependency còn active thì chặn submit + message rõ ràng (để đảm bảo data contract), hoặc tự bật lại ngay khi submit (ưu tiên tự bật lại + thông báo).
- Reflection: đáp ứng đúng yêu cầu “tự động bật login khách” nhưng vẫn cho thao tác thủ công theo UX bạn chọn.

3. Solving 1.4.1 — Nâng cấp ReviewStep: ghi chú + badge dependency + manual override
- Files dự kiến:
  - `components/data/seed-wizard/steps/ReviewStep.tsx`
  - `components/data/seed-wizard/_lib` (nếu có helper format)
- Thay đổi cụ thể:
  - Hiển thị mục “Đăng nhập khách” với trạng thái:
    - `Bật tự động` + badge `Dependency` (khi đến từ customers/experiences menu).
  - Thêm checkbox cho phép bỏ chọn thủ công.
  - Khi user bỏ chọn, hiển thị cảnh báo inline: “Sẽ được bật lại khi submit nếu Customers/Experiences Menu còn bật”.
- Reflection: UX minh bạch, tránh cảm giác hệ thống tự sửa ngầm.

4. Hardening validation để không tái lỗi
- Files dự kiến:
  - `components/data/SeedWizardDialog.tsx`
- Thay đổi cụ thể:
  - Trước khi gọi mutation seed:
    - Validate selectedModules sau normalize dependency.
    - Validate mọi module trong selectedModules đều có seed config hợp lệ.
  - Nếu thiếu mapping: throw lỗi có tên module cụ thể (giống analytics) + fail-fast.
- Reflection: bắt lỗi deterministic tại client-side orchestration trước khi vào backend.

## Chi tiết logic nghiệp vụ chốt theo câu trả lời của bạn
- Analytics: **phụ thuộc `dashboard/reports`** (không chạy độc lập).
- Login khách: **tự động bật** khi có `customers` hoặc **toàn bộ experiences menu**.
- Review UX: **ghi chú + badge dependency + cho phép bỏ chọn thủ công**; nhưng submit sẽ vẫn enforce dependency để không tạo trạng thái sai.

## Test/Validation Plan
1. Case analytics:
- Chỉ bật analytics (hoặc preset cũ còn analytics) => sau normalize không còn lỗi missing config.
- Bật dashboard/reports => analytics config được inject và seed chạy bình thường.
2. Case login dependency:
- Bật customers => review hiển thị login khách auto-on + badge.
- Bật experiences menu bất kỳ => login khách auto-on + badge.
- Bỏ chọn thủ công login ở review => cảnh báo xuất hiện; submit vẫn enforce auto-on.
3. Gate bắt buộc sau code change TS:
- `bunx tsc --noEmit`

## Commit Plan
1. `fix(seed-wizard): map analytics seed config with dashboard/reports dependency`
2. `feat(seed-wizard): auto-enable customer login for customers and experiences menu`
3. `feat(seed-wizard): add dependency badge and manual override notice in review`
4. `chore(seed-wizard): harden pre-submit module/config validation`

## Phạm vi cam kết
- Chỉ sửa đúng Seed Wizard + seed orchestration liên quan.
- Không mở rộng sang tính năng ngoài yêu cầu.
- Sau implement sẽ chạy typecheck và commit (không push) theo rule repo.