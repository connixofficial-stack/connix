## Problem Graph
1. [Main] Seed Wizard step “Ngoài ra muốn bật thêm gì?” click Dịch vụ/Bài viết bị ẩn + Services tự bật dù không tick
   1.1 [UI state sai] `ExtraFeaturesStep` đang dùng điều kiện hiển thị dựa trên `has*` đã trộn `baseModules` và `extraFeatures` -> click có thể làm item biến mất
      1.1.1 [ROOT CAUSE #1] Props `hasPosts/hasServices` truyền vào step không tách bạch “module nền theo website type” và “feature đang tick”
   1.2 [Module selection sai] `buildModuleSelection(state)`/presets có thể luôn include `services` theo websiteType/industry, nên dù không tick vẫn enable
      1.2.1 [ROOT CAUSE #2] Logic chọn module chưa coi extras là tùy chọn thực sự cho services/posts ở step extras

## Execution (with reflection)
1. Solving 1.1.1 (UI ẩn item)
   - Action: Trong `SeedWizardDialog.tsx`, đổi props truyền cho `ExtraFeaturesStep` thành cờ nền cố định từ `baseModules.includes(...)` (không OR với `extraFeatures`).
   - Action: Sửa `ExtraFeaturesStep` để render danh sách option ổn định (không phụ thuộc trạng thái tick để ẩn/hiện chính nó), chỉ thay đổi `checked`.
   - Reflection: ✓ Khi click Dịch vụ/Bài viết item vẫn hiện, chỉ đổi trạng thái tick.

2. Solving 1.2.1 (services tự bật)
   - Action: Audit `components/data/seed-wizard/wizard-presets.ts` (đặc biệt `buildModuleSelection`, mapping websiteType -> base modules, và merge extras).
   - Action: Đảm bảo `services` chỉ có trong `selectedModules` khi:
     - websiteType mặc định cần services (nếu business rule bắt buộc), hoặc
     - user tick rõ trong extras.
   - Action: Nếu websiteType không bắt buộc services, remove `services` khỏi base preset tương ứng để tránh auto-enable.
   - Action: Giữ logic clear data services hiện có (`clearModule('services')`, `clearModule('serviceCategories')`) để đảm bảo state sạch khi không chọn.
   - Reflection: ✓ Không tick Dịch vụ thì `selectedModules` không chứa `services`, `syncModules` sẽ không bật module này.

3. Guard consistency
   - Action: Kiểm tra các useEffect đang xóa `extraFeatures` theo điều kiện (`!hasProducts`, `!hasPosts`) để chắc không ảnh hưởng hiển thị options.
   - Action: Chuẩn hóa tên/ý nghĩa props trong `ExtraFeaturesStep` (ví dụ `showPostsOption`, `showServicesOption`) để tránh nhầm lẫn semantics.
   - Reflection: ✓ Trạng thái UI rõ nghĩa, không còn side-effect ẩn item.

4. Validation plan
   - Chạy `bunx tsc --noEmit` theo rule repo sau khi sửa.
   - Test tay luồng `/system/data`:
     - Step extras: click Dịch vụ/Bài viết chỉ tick/untick, không biến mất.
     - Không tick Dịch vụ -> review step + seed xong xác nhận module services không enabled.
     - Tick Dịch vụ -> services enabled bình thường.

5. Commit plan
   - Commit 1 lần sau khi pass `bunx tsc --noEmit` với message: `fix(seed-wizard): keep extras visible and prevent unintended services enable`