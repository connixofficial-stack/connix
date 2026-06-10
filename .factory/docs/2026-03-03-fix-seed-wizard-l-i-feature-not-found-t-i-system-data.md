## Problem Graph
1. [Main] Seed Wizard fail với `Feature not found` <- depends on 1.1, 1.2
   1.1 [Sub] SeedWizard gọi `toggleModuleFeature` cứng cho `settings` features
   1.2 [ROOT CAUSE] DB hiện tại thiếu record `moduleFeatures` cho `settings` (`enableContact|enableSEO|enableSocial`), mutation `toggleModuleFeature` ném lỗi khi `.unique()` trả null

## Execution (with reflection)
1. Solving 1.2 (tự hồi phục dữ liệu cũ theo lựa chọn của bạn)
   - File: `components/data/SeedWizardDialog.tsx`
   - Thêm helper `ensureSettingsFeature(featureKey)` dùng query `api.admin.modules.getModuleFeature` qua `convex.query` để kiểm tra tồn tại.
   - Nếu thiếu thì gọi `createModuleFeature` với default payload tối thiểu theo đúng config hiện có (`name/description/moduleKey/featureKey/enabled`).
   - Reflection: Giữ đúng hướng bạn chọn “guard ở Seed Wizard” và có backfill tự hồi phục ngay trong lần chạy seed kế tiếp.

2. Solving 1.1 (guard trước khi toggle)
   - File: `components/data/SeedWizardDialog.tsx`
   - Thay 3 lệnh toggle cứng `enableContact/enableSEO/enableSocial` bằng vòng lặp:
     - `await ensureSettingsFeature(key)`
     - chỉ `toggleModuleFeature(...)` khi feature đã tồn tại hoặc vừa được tạo thành công.
   - Bọc lỗi theo từng feature để không làm fail toàn bộ seed batch; log + toast cảnh báo ngắn nếu một feature không recover được.
   - Reflection: KISS + low-risk, không đụng mutation backend hiện tại, tránh side effects toàn hệ thống.

3. Safety cho `customers.enableLogin` (đồng nhất pattern)
   - File: `components/data/SeedWizardDialog.tsx`
   - Trước khi toggle `customers.enableLogin`, check existence tương tự; nếu thiếu thì bỏ qua toggle (không crash flow), đồng thời cảnh báo nhẹ.
   - Reflection: ngăn lỗi tương tự ở dữ liệu môi trường lệch seed.

4. Verify + commit
   - Chạy: `bunx tsc --noEmit`
   - Commit message: `fix(seed-wizard): handle missing module features safely`
   - Commit gồm cả `.factory/docs` nếu có thay đổi liên quan.

## Checklist xác nhận đầu ra
- Seed wizard tại `/system/data` không còn văng `Feature not found` khi toggle settings features.
- Dữ liệu cũ thiếu feature được tự hồi phục trong lần seed chạy tới.
- Không thay đổi behavior mutation backend ngoài phạm vi yêu cầu.
- Type-check pass với `bunx tsc --noEmit` và tạo commit local (không push).