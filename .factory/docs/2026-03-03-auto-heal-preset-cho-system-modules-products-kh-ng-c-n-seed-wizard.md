## Problem Graph
1. [Main] /system/modules/products bị trắng preset khi thiếu `moduleFields/moduleFeatures/moduleSettings`
   1.1 [Sub] Thiếu cơ chế tự khởi tạo config khi user mở trang module
      1.1.1 [ROOT CAUSE] UI chỉ đọc dữ liệu hiện có, không fallback seed config
   1.2 [Sub] Cần giữ idempotent, tránh ghi đè config user đã chỉnh

## Execution (with reflection)
1. Solving 1.1.1 — thêm auto-heal ở hook dùng chung
   - File: `lib/modules/hooks/useModuleConfig.ts`
   - Thay đổi:
     - Import `useAction` từ `convex/react`.
     - Khởi tạo `const seedAllModulesConfig = useAction(api.seed.seedAllModulesConfig)`.
     - Thêm `useRef` guard `hasTriggeredAutoHealRef` để tránh loop.
     - Tạo `useEffect` auto-heal:
       - Điều kiện chạy: `moduleData` đã load, module đang `enabled !== false`, và **ít nhất một trong** `featuresData`, `fieldsData`, `settingsData` là mảng rỗng cho `moduleKey` hiện tại.
       - Chỉ chạy 1 lần mỗi mount bằng ref guard.
       - Gọi `await seedAllModulesConfig({})`.
       - Sau khi seed, reset guard mềm nếu lỗi để cho phép retry thủ công (reload), hiện toast thành công/thất bại ngắn gọn.
   - Reflection: ✓ Valid vì xử lý ngay tại nơi đọc config, không phụ thuộc Seed Wizard.

2. Chặn side-effect không mong muốn
   - File: `lib/modules/hooks/useModuleConfig.ts`
   - Thay đổi logic điều kiện để **không seed khi chỉ thiếu 1 setting optional**:
     - Chỉ auto-heal khi thiếu “khung config” (ví dụ `fieldsData.length === 0` hoặc `featuresData.length === 0`), không dựa đơn thuần vào key setting.
   - Reflection: ✓ Valid, tránh ghi thêm dữ liệu không cần thiết.

3. Giữ đúng KISS/YAGNI
   - Không tạo endpoint mới, không thêm nút UI, không thêm flow wizard.
   - Tận dụng action có sẵn: `api.seed.seedAllModulesConfig`.
   - Reflection: ✓ Ít thay đổi, đúng convention hiện tại.

4. Verification
   - Chạy `bunx tsc --noEmit`.
   - Kiểm tra tay:
     - Vào `/system/modules/products` khi DB thiếu config -> tự hiện lại preset field/feature.
     - Reload lần 2 -> không gọi seed lại nếu đã có dữ liệu.
   - Reflection: ✓ Đảm bảo fix đúng bug user báo.

5. Commit
   - Commit 1 message ngắn theo style repo, ví dụ:
     - `fix(modules): auto-heal module config khi thiếu preset`

## Checklist chốt cho bạn
- [ ] Không cần mở Seed Wizard nữa
- [ ] Mở thẳng `/system/modules/products` là tự bù preset nếu thiếu
- [ ] Không ghi đè các cấu hình đã tồn tại
- [ ] Pass `bunx tsc --noEmit`

## Best practice áp dụng
- Idempotent seeding (chỉ bù thiếu)
- Guard chống loop render/network
- Single source of truth tại `useModuleConfig` để mọi module page hưởng lợi cùng cơ chế