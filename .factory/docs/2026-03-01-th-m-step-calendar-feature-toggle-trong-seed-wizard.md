## Problem Graph
1. [Main] Seed Wizard chưa có bước cấu hình chi tiết Calendar feature-toggle <- depends on 1.1, 1.2, 1.3
   1.1 [Flow] Chèn đúng vị trí step Calendar trong luồng wizard <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] `steps` trong `SeedWizardDialog.tsx` chưa có điều kiện thêm step riêng cho Calendar
   1.2 [State] Chưa có state cục bộ để giữ feature toggles Calendar trong wizard
   1.3 [Apply] `handleSeed` chưa apply toggle features Calendar theo lựa chọn wizard

## Execution (with reflection)
1. Solving 1.1.1 (Flow step)
   - Thought: User chọn “Sau Extras, trước Business” và “ẩn hoàn toàn nếu không bật Calendar”, nên step cần chỉ insert khi `selectedModules.includes('calendar')`.
   - Action:
     - File: `components/data/SeedWizardDialog.tsx`
     - Trong `steps` useMemo: sau `list.push('extras')`, thêm điều kiện:
       - nếu có calendar thì `list.push('calendarConfig')`
     - Trong render switch step: thêm block `stepKey === 'calendarConfig'` để render step mới.
   - Reflection: ✓ Đúng yêu cầu vị trí + visibility.

2. Solving 1.2 (State feature toggles)
   - Thought: User chỉ muốn toggle features, không cần settings.
   - Action:
     - File: `components/data/seed-wizard/types.ts`
     - Mở rộng `WizardState` thêm `calendarFeatures: { enableMonthView: boolean; enableListView: boolean; enableRecurring: boolean; enableAssignee: boolean; enableReminder: boolean; enablePriority: boolean }`.
     - File: `components/data/SeedWizardDialog.tsx`
       - Khai báo `DEFAULT_STATE.calendarFeatures` mặc định all `true` (khớp seed hiện tại).
       - Tạo handler `handleCalendarFeatureChange(featureKey, enabled)` cập nhật state.
   - Reflection: ✓ Giữ backward-compatible, không ảnh hưởng module khác.

3. Solving 1.2 UI (Step component mới)
   - Thought: Tái sử dụng style step hiện có, KISS, không thêm thư viện.
   - Action:
     - File mới: `components/data/seed-wizard/steps/CalendarFeatureStep.tsx`
     - UI gồm danh sách 6 feature với Checkbox + mô tả ngắn:
       - `enableMonthView`, `enableListView`, `enableRecurring`, `enableAssignee`, `enableReminder`, `enablePriority`
     - Thêm guard UX nhẹ (không ép cứng backend): nếu user tắt cả Month/List thì hiển thị cảnh báo ngắn trong step (để tránh UI calendar không có view hiển thị).
   - Reflection: ✓ Đúng phạm vi “chỉ feature toggle”, dễ dùng.

4. Solving 1.3 (Apply vào hệ thống khi seed)
   - Thought: Cần apply sau khi sync modules để chắc module calendar đã bật.
   - Action:
     - File: `components/data/SeedWizardDialog.tsx`
     - Trong `handleSeed`, sau `await syncModules(modulesForEnable);` thêm block:
       - nếu `selectedModules` có `calendar` thì loop qua keys trong `state.calendarFeatures` gọi:
         - `await toggleModuleFeature({ moduleKey: 'calendar', featureKey, enabled })`
     - Không set module settings calendar vì user không yêu cầu.
   - Reflection: ✓ Đúng logic seed wizard hiện tại, ít rủi ro.

5. Review summary cập nhật cho dễ kiểm tra
   - Thought: ReviewStep nên phản ánh cấu hình calendar vừa chọn.
   - Action:
     - File: `components/data/SeedWizardDialog.tsx`
       - Mở rộng `moduleConfigs` để thêm các dòng tóm tắt Calendar (chỉ khi có module calendar), ví dụ:
         - `Calendar - Month View: Bật/Tắt`
         - `Calendar - List View: Bật/Tắt`
         - ...
   - Reflection: ✓ User thấy rõ trước khi bấm seed.

6. Validation trước commit (theo rule project)
   - Thought: Rule repo yêu cầu chỉ chạy TypeScript check khi có đổi code TS.
   - Action:
     - Chạy `bunx tsc --noEmit`
     - Fix lỗi nếu có.
   - Reflection: ✓ Đảm bảo build type-safe.

7. Commit (không push)
   - Thought: Rule repo bắt buộc commit mọi thay đổi code và include `.factory/docs` nếu có.
   - Action:
     - `git status` kiểm tra file.
     - `git add` các file thay đổi (kèm `.factory/docs` nếu phát sinh).
     - `git diff --cached` rà soát không lộ secret.
     - `git commit -m "feat(seed-wizard): add calendar feature toggle step"`
   - Reflection: ✓ Hoàn tất theo convention hiện tại.

## Checklist triển khai
- [ ] Thêm `calendarConfig` step vào flow sau `extras`, chỉ hiện khi chọn Calendar
- [ ] Tạo state `calendarFeatures` trong `WizardState` + default
- [ ] Tạo `CalendarFeatureStep.tsx` (6 toggles)
- [ ] Wire step UI vào `SeedWizardDialog.tsx`
- [ ] Apply toggles qua `toggleModuleFeature` trong `handleSeed`
- [ ] Bổ sung summary review cho Calendar toggles
- [ ] Chạy `bunx tsc --noEmit`
- [ ] Commit local (không push)

Nếu bạn confirm spec này, mình sẽ implement đúng y như trên.