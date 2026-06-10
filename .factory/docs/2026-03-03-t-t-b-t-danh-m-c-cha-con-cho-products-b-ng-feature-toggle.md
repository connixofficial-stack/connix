## Problem Graph
1. [Main] `/admin/categories/create` đang luôn hiện “Danh mục cha”, user muốn điều khiển từ `/system/modules/products`
   1.1 [Sub] UI create/edit categories chưa đọc feature toggle cho parent category
      1.1.1 [ROOT CAUSE] Form luôn render `parentId`, không phụ thuộc `moduleFeatures`
   1.2 [Sub] Cần có toggle trong Products Module, mặc định tắt
      1.2.1 [ROOT CAUSE] `products.config.ts` chưa khai báo feature cho danh mục cha-con
   1.3 [Sub] Dữ liệu cũ/mới phải “tuân theo” toggle
      1.3.1 [ROOT CAUSE] Backend `productCategories.create/update` vẫn nhận `parentId` dù feature tắt

## Execution (with reflection)
1. Thêm feature toggle ở System Modules > Products
   - File: `lib/modules/configs/products.config.ts`
   - Thay đổi:
     - Thêm feature mới trong `productsModule.features`:
       - `key: 'enableCategoryHierarchy'`
       - `label: 'Danh mục cha - con'`
       - `description` ngắn
       - `linkedField: 'parentId'`
     - Chọn icon phù hợp (ví dụ `FolderTree`).
   - Reflection: ✓ Toggle xuất hiện đúng “chỗ tính năng” như bạn yêu cầu.

2. Đảm bảo mặc định OFF khi chưa có dữ liệu feature
   - File: `lib/modules/hooks/useModuleConfig.ts`
   - Thay đổi:
     - Trong effect sync `featuresData -> localFeatures`, nếu `moduleKey === 'products'` và thiếu `enableCategoryHierarchy` thì set mặc định `false` ở local state (không bật ngầm).
   - Reflection: ✓ Đúng yêu cầu “mặc định sẽ tắt”.

3. Ẩn/hiện trường “Danh mục cha” ở admin create/edit theo toggle
   - Files:
     - `app/admin/categories/create/page.tsx`
     - `app/admin/categories/[id]/edit/page.tsx`
   - Thay đổi:
     - Query `api.admin.modules.getModuleFeature` với `{ moduleKey: 'products', featureKey: 'enableCategoryHierarchy' }`.
     - Chỉ render block `<Label>Danh mục cha</Label> + <select ...>` khi feature `enabled === true`.
     - Khi feature tắt: submit luôn gửi `parentId: undefined`.
   - Reflection: ✓ UI không “mention” cha-con khi tắt.

4. Cưỡng chế backend theo toggle (old/new đều tuân theo)
   - File: `convex/productCategories.ts`
   - Thay đổi:
     - Trong `create` và `update`, đọc feature `enableCategoryHierarchy` từ `moduleFeatures` (module `products`).
     - Nếu feature không tồn tại hoặc `enabled !== true`:
       - Bỏ qua `parentId` (force undefined) trước khi insert/patch.
     - Nếu feature bật thì giữ hành vi cũ.
   - Reflection: ✓ Dữ liệu mới chắc chắn tuân theo toggle.

5. Khi user tắt toggle, dọn dữ liệu cũ parentId để “mọi thứ cũ hay mới tuân theo”
   - File: `convex/admin/modules.ts` (mutation `toggleModuleFeature`)
   - Thay đổi:
     - Sau khi toggle `products.enableCategoryHierarchy` sang `false`, chạy clear `parentId` cho toàn bộ `productCategories` (patch theo batch).
   - Reflection: ✓ Dữ liệu cũ cũng tuân theo ngay sau khi tắt.

6. Seed/config compatibility
   - File: `convex/seed.ts` (đoạn seed products module features)
   - Thay đổi:
     - Bổ sung feature `enableCategoryHierarchy` với `enabled: false` nếu chưa có.
   - Reflection: ✓ Hệ thống mới seed ra đúng default OFF.

7. Verification
   - Chạy: `bunx tsc --noEmit`.
   - Test tay:
     - Vào `/system/modules/products` thấy toggle “Danh mục cha - con” (OFF).
     - OFF: `/admin/categories/create` & `/edit` không hiện mục cha; save không lưu `parentId`.
     - Bật ON: trường cha-con hiện lại, lưu được `parentId`.
     - Tắt lại OFF: `parentId` cũ bị clear.

8. Commit
   - Commit message đề xuất: `feat(products): add category hierarchy toggle with enforced parentId policy`
   - Include `.factory/docs` theo rule repo.

## Checklist chốt
- [ ] Có toggle trong `/system/modules/products`
- [ ] Mặc định OFF
- [ ] UI create/edit ẩn parent category khi OFF
- [ ] Backend chặn lưu `parentId` khi OFF
- [ ] Tắt toggle sẽ clear `parentId` cũ
- [ ] Pass `bunx tsc --noEmit`