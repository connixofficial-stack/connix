## Problem Graph
1. [Main] Audit root cause toàn diện Seed Wizard tại `/system/data` <- depends on 1.1, 1.2, 1.3, 1.4, 1.5
   1.1 [Sub] Tick services/posts nhưng seed count = 0 <- depends on 1.1.1, 1.1.2
      1.1.1 [ROOT CAUSE] Mismatch key/state giữa Wizard UI → payload submit → backend seeder registry
      1.1.2 [ROOT CAUSE] Logic dependency/quantity fallback ghi đè hoặc short-circuit module seed
   1.2 [Sub] Seed product options theo variant preset chưa “vừa đủ và đúng” <- depends on 1.2.1, 1.2.2
      1.2.1 [ROOT CAUSE] Preset variant mapping sinh thừa option/value ngoài tập chọn
      1.2.2 [ROOT CAUSE] Product/variant seeder không ràng buộc theo options đã chọn
   1.3 [Sub] Thiếu optional step cho Kanban <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] Wizard steps + review payload chưa expose module `kanban` dù backend có config/seeder
   1.4 [Sub] Thiếu mention sâu dual brand color <- depends on 1.4.1, 1.4.2
      1.4.1 [ROOT CAUSE] Wizard chưa map sang settings màu hệ thống (single/dual) và semantic tokens
      1.4.2 [ROOT CAUSE] Không bridge tác động chéo tới `/admin/settings`, `/system/experiences`, `/admin/home-components`
   1.5 [Sub] Chẩn đoán độ phủ dữ liệu sau seed (cross-check) <- depends on 1.5.1
      1.5.1 [ROOT CAUSE] Thiếu deterministic validation checklist giữa config đầu vào và kết quả ở admin pages

## Execution (with reflection)
1. Solving 1.1.1 (flow mapping end-to-end)
   - Thought: Lỗi count=0 thường do key mismatch hoặc state không được serialize đúng.
   - Action: Đọc kỹ `app/system/data/page.tsx`, `components/data/SeedWizardDialog.tsx`, `components/data/seed-wizard/types.ts`, các step (`ExtraFeaturesStep`, `ReviewStep`, `DataScaleStep`) để lập bảng field-name: UI state ↔ review summary ↔ payload submit.
   - Reflection: Nếu phát hiện tên field khác nhau (vd `servicesEnabled` vs `enableServices`, `postsCount` vs `postsQuantity`) thì đây là root cause gốc.

2. Solving 1.1.2 (seed registry + quantity/dependency)
   - Thought: Có thể submit đúng nhưng backend bỏ qua do dependency gate hoặc quantity=0 mặc định.
   - Action: Đọc `convex/seedManager.ts`, `convex/seed.ts`, `convex/seeders/registry.ts`, `convex/seeders/services.seeder.ts`, `convex/seeders/posts.seeder.ts`, `convex/seeders/dependencies.ts` để truy vết: điều kiện run, default quantity, thứ tự chạy, short-circuit, guard module status.
   - Reflection: Nếu seeder chạy condition theo key khác key từ wizard, hoặc bị reset về 0 khi thiếu dependency, xác nhận root cause.

3. Solving 1.2.1 (preset màu + size)
   - Thought: User muốn “chỉ 2 option đó” xuất hiện ở `/admin/product-options` và data sản phẩm.
   - Action: Đọc `components/data/seed-wizard/steps/ProductVariantsStep.tsx`, `components/modules/VariantPresetPicker.tsx`, `lib/modules/variant-presets.ts`, `convex/seeders/variantPresets.seeder.ts`, `convex/seeders/productOptions.seeder.ts`, `convex/seeders/variants.seeder.ts`, `convex/seeders/products.seeder.ts`.
   - Reflection: Nếu preset loader luôn append bộ options mặc định (vd material/style) hoặc seeder merge union thay vì exact set, đây là root cause.

4. Solving 1.2.2 (ràng buộc options ↔ variants ↔ products)
   - Thought: Có thể product options đúng nhưng product variants vẫn sinh từ template cũ.
   - Action: Truy vết nơi tạo biến thể sản phẩm và mapping optionValues; so khớp điều kiện tạo variant với selected option IDs/names từ wizard.
   - Reflection: Nếu generator dùng source độc lập không tham chiếu selected options, kết luận nguyên nhân “không vừa đủ”.

5. Solving 1.3.1 (optional Kanban)
   - Thought: Repo có `kanban.config` + `kanban.seeder`, nhiều khả năng UI wizard chưa nối.
   - Action: Đọc `lib/modules/configs/kanban.config.ts`, `lib/modules/configs/index.ts`, step điều khiển feature (`ExtraFeaturesStep.tsx`), cùng phần review/submit để xác định tại sao không hỏi Kanban.
   - Reflection: Nếu module có trong registry nhưng không render checkbox/step hoặc không đưa vào payload, xác nhận root cause.

6. Solving 1.4.1 & 1.4.2 (dual brand mention sâu)
   - Thought: User yêu cầu wizard phải đề cập/định hướng sâu giống hệ `/admin/settings`, `/system/experiences`, `/admin/home-components`.
   - Action: Đọc `lib/home-components/color-system.ts`, `components/providers/BrandColorProvider.tsx`, `app/admin/settings/page.tsx`, `app/system/experiences/**`, `app/admin/home-components/**/_lib/colors.ts` representative files để xác định nguồn sự thật color mode và các điểm đồng bộ.
   - Reflection: Nếu wizard chỉ thu thập ngành/nghiệp vụ mà không map chế độ màu + không educate impact tới experiences/home-components, đây là root cause sản phẩm (UX + dữ liệu cấu hình).

7. Solving 1.5.1 (cross-check deterministic)
   - Thought: Cần root-cause report có bằng chứng kiểm chứng chéo sau seed.
   - Action: Định nghĩa checklist đối chiếu (không sửa code):
     - Chọn services/posts ON + quantity > 0 ⇒ kiểm tra bảng admin có bản ghi tương ứng.
     - Chọn preset màu+size ⇒ `/admin/product-options` đúng 2 option, products/variants chỉ dùng 2 option.
     - Optional Kanban ON/OFF ⇒ có/không có dữ liệu kanban tương ứng.
     - Dual-brand chọn chế độ ⇒ settings + experiences + home-components phản ánh nhất quán.
   - Reflection: Checklist này dùng để chứng minh root cause và ngăn “đoán mò”.

## Phạm vi deliverable sau khi được duyệt spec
- Báo cáo root cause chi tiết cho 4 vấn đề user nêu, theo format:
  1) Triệu chứng tái hiện
  2) Root cause kỹ thuật (file + logic cụ thể)
  3) Ảnh hưởng liên quan
  4) Hướng fix khuyến nghị (KISS/YAGNI/DRY, chưa implement nếu chưa yêu cầu)
- Không thay đổi code ở bước audit/spec này.